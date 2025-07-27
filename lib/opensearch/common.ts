import { Client } from "npm:@opensearch-project/opensearch";

export const EMBEDDING_MODEL_ID = Deno.env.get("OPENSEARCH_MODEL_ID");
export const HIGHLIGHT_MODEL_ID = Deno.env.get("OPENSEARCH_HL_MODEL_ID");

let client: Client | null = null;

export const getOpenSearchClient = () => {
    const OPENSEARCH_URL = Deno.env.get("OPENSEARCH_URL");
    if(!client){
        if (!OPENSEARCH_URL) {
            throw new Error("OPENSEARCH_URL environment variable is not set.");
        }
        client = new Client({
            node: OPENSEARCH_URL
        });
    }
    return client;
}