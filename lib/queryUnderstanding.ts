import {ChatGoogleGenerativeAI} from "@langchain/google-genai";
import {InferredFilters, QueryOutput} from "./types.ts";
import {RedisCache} from "@langchain/community/caches/ioredis";
import {redis_raw} from "./cache.ts";

const cache = new RedisCache(redis_raw)


const model = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash-lite-preview-06-17",
    temperature: 0,
    cache
});


// const metaPrompt = `
// You are an expert buyers agent, tasked with understanding user queries for real estate listings. Your task is to break down the user's query
// into structured components that can be used to filter listings.
// `


const structuredLLM = model.withStructuredOutput(QueryOutput, {
});

export const breakdownQuery = async (query: string): Promise<InferredFilters> => {
    return await structuredLLM.invoke([
        {
            role: "human",
            content: `I'm looking for: ${query}`,
        },
    ], {});
}