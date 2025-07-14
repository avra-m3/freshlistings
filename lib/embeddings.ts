import { OllamaEmbeddings } from "npm:@langchain/ollama@0.2.3";

/**
 * This file is no longer in use but is kept for educational purposes.
 */

const embeddings = new OllamaEmbeddings({
  model: "mxbai-embed-large",
  baseUrl: Deno.env.get("OLLAMA_URL") || "http://localhost:11434",
});

export const getEmbedding = async (text: string): Promise<number[]> => {
  return await embeddings.embedQuery(text);
};
export const mapEmbeddings = async <K extends string>(
  texts: Record<K, string>,
): Promise<Record<string, number[]>> => {
  const keys = Object.keys(texts);
  const values: string[] = keys.map((k) => texts[k as K]);
  return (await embeddings.embedDocuments(values)).reduce(
    (acc, embedding, i) => {
      acc[`${keys[i]}_embedding`] = embedding;
      return acc;
    },
    {} as Record<string, number[]>,
  );
};
