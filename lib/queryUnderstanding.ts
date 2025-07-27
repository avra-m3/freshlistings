import {InferredFilters} from "./types.ts";
import {QueryOutput} from "./schemas.ts";
import {AllowedModel, getStructuredModel} from "./models.ts";

export const breakdownQuery = async (
  query: string,
  model: AllowedModel = "gemini-2.5-flash",
): Promise<InferredFilters | null> => {
  const structuredLLM = getStructuredModel(model, QueryOutput);
  const r = await structuredLLM.invoke([
    {
      role: "human",
      content: query,
    },
  ], {});
  console.log(r.raw);
  if (!r.parsed) {
    console.log("json", QueryOutput.safeParse(JSON.parse(r.raw.content as string)));
  }
  return r.parsed;
};
