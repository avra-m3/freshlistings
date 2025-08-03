import {redis_raw} from "./cache.ts";
import {ChatGoogleGenerativeAI} from "npm:@langchain/google-genai@0.2.14";
import {ChatOllama} from "npm:@langchain/ollama@0.2.3";
import {z, ZodObject} from "npm:zod@4.0.5";
import {RedisCache} from "@langchain/community/caches/ioredis";

const cache = new RedisCache(redis_raw);

export const metaPrompt =
  `You are a helpful assistant that breaks down user queries into structured filters for a real estate search engine, you 
  do not assume anything the user does not explicitly include in the given input.
You must always return valid JSON fenced by a markdown code block. Do not return any additional text.
`;

const models = {
  "gemini-2.5-flash": new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    temperature: 0,
    cache,
  }),
  "gemini-2.5-flash-lite": new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash-lite",
    temperature: 0,
    cache,
  }),
  "ollama-minstral-8b": new ChatOllama({
    model: "nchapman/ministral-8b-instruct-2410:8b",
    baseUrl: Deno.env.get("OLLAMA_URL") || "http://localhost:11434",
    temperature: 0,
    maxRetries: 2,
  }),
  "qwen2.5-coder": new ChatOllama({
    model: "qwen3:8b",
    baseUrl: Deno.env.get("OLLAMA_URL") || "http://localhost:11434",
    temperature: 0,
    maxRetries: 2,
  }),
} as const;

export const getStructuredModel = <S extends ZodObject>(
  model: AllowedModel,
  expectedOutput: S,
) => {
  if (!models[model]) {
    throw new Error(`Model ${model} is not supported`);
  }
  return models[model].withStructuredOutput<z.infer<S>>(expectedOutput, {
    includeRaw: true,
  });
};

export const AllowedModelSchema = z.enum(
  Object.keys(models) as (keyof typeof models)[],
);
export type AllowedModel = z.infer<typeof AllowedModelSchema>;
