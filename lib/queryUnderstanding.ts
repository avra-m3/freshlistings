import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { InferredFilters, QueryOutput } from "./types.ts";
import { RedisCache } from "@langchain/community/caches/ioredis";
import { redis_raw } from "./cache.ts";

const cache = new RedisCache(redis_raw);

const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash-lite-preview-06-17",
  temperature: 0,
  cache,
});

const structuredLLM = model.withStructuredOutput(QueryOutput, {
  includeRaw: true,
});

export const breakdownQuery = async (
  query: string,
): Promise<InferredFilters> => {
  const r = await structuredLLM.invoke([
    {
      role: "system",
      content: "I'm looking for",
    },
    {
      role: "human",
      content: query,
    },
  ], {});
  console.log(r.raw);
  return r.parsed;
};
