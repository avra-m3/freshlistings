import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { InferredFilters, QueryOutput } from "./types.ts";
import { RedisCache } from "@langchain/community/caches/ioredis";
import { redis_raw } from "./cache.ts";
import { ChatOllama } from "npm:@langchain/ollama@0.2.3";

const cache = new RedisCache(redis_raw);

const models = {
  "gemini-2.5-flash": new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash-lite-preview-06-17",
    temperature: 0,
    cache,
  }),
  "gemini-2.5-flash-temp-1": new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash-lite-preview-06-17",
    temperature: 1,
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

export const breakdownQuery = async (
  query: string,
  model: keyof typeof models = 'gemini-2.5-flash',
): Promise<InferredFilters> => {
  const structuredLLM = models[model].withStructuredOutput(QueryOutput, {
    includeRaw: true,
  });
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
