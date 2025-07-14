import {ChatGoogleGenerativeAI} from "@langchain/google-genai";
import {InferredFilters} from "./types.ts";
import {RedisCache} from "@langchain/community/caches/ioredis";
import {redis_raw} from "./cache.ts";
import {ChatOllama} from "npm:@langchain/ollama@0.2.3";
import {classifyPrompt, LocationField, MinMaxField,} from "./schemas.ts";

const cache = new RedisCache(redis_raw);

const models = {
  "gemini-2.5-flash": new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash-lite-preview-06-17",
    temperature: 0,
    cache,
  }),
  "ollama-minstral-8b": new ChatOllama({
    model: "nchapman/ministral-8b-instruct-2410:8b",
    baseUrl: Deno.env.get("OLLAMA_URL") || "http://localhost:11434",
    temperature: 0,
    maxRetries: 2,
    cache,
  }),
};

export const alternateBreakdownQuery = async (
  query: string,
  model: keyof typeof models = "gemini-2.5-flash",
): Promise<InferredFilters> => {
  const classify = models[model].withStructuredOutput(classifyPrompt);
  const minMaxField = models[model].withStructuredOutput(MinMaxField);
  const distanceField = models[model].withStructuredOutput(LocationField);

  const r = await classify.invoke([
    {
      role: "system",
      content: "Break down this query into structured filters",
    },
    {
      role: "human",
      content: query,
    },
  ]);

  console.log("classifications", r.keyTerms);
  const distanceTerm = r.keyTerms.find((v) => v.type === "location");

  const results: InferredFilters = {
    intention: "buy",
    keywords: r.keyTerms.filter((v) => v.type === "other").map((v) => v.term),
    location: distanceTerm
        && await distanceField.invoke([distanceTerm.descriptor, distanceTerm.term].filter(v => !!v).join(" "))
  };

  const mapTermToInferred: Record<
    "bedroom" | "bathroom" | "price",
    keyof InferredFilters
  > = {
    price: "price",
    bedroom: "numBeds",
    bathroom: "numBathrooms",
  };

  await Promise.all(
    (["bedroom", "bathroom", "price"] as const).map(
      async (type) => {
        const key = mapTermToInferred[type];
        const terms = r.keyTerms.filter((v) => v.type === type);
        const prompt: string | undefined = terms.length ?
          terms.flatMap(term =>[term.descriptor, term.term])
              .filter(v => !!v).join(" ") : undefined;
        console.log(type, prompt)
        if (key && prompt) {
          // @ts-ignore
          results[key] = await minMaxField.invoke(`${type} range request: ${prompt}`);
        }
      },
    ),
  );

  console.log("results", results)

  return results;
};
