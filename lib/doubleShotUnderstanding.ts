import {InferredFilters} from "./types.ts";
import {classifyPrompt, LocationField, MinMaxField,} from "./schemas.ts";
import {AllowedModel, getStructuredModel, metaPrompt} from "./models.ts";


export const alternateBreakdownQuery = async (
  query: string,
  model: AllowedModel = "gemini-2.5-flash",
): Promise<InferredFilters> => {
  const classify =getStructuredModel(model, classifyPrompt);
  const minMaxField = getStructuredModel(model, MinMaxField);
  const distanceField =getStructuredModel(model, LocationField);
  let {parsed, raw} = await classify.invoke([
    {
      role: "system",
      content: metaPrompt,
    },
    {
      role: "human",
      content: query,
    },
  ]);

  console.log("raw", raw.content)
  console.log("classifications", parsed.keyTerms);
  const distanceTerm = parsed.keyTerms.find((v) => v.type === "location");

  const results: InferredFilters = {
    intention: "buy",
    keywords: parsed.keyTerms.filter((v) => v.type === "other").map((v) => v.term),
    location: distanceTerm
        &&  (await distanceField.invoke([distanceTerm.descriptor, distanceTerm.term].filter(v => !!v).join(" "))).parsed
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
        const terms = parsed.keyTerms.filter((v) => v.type === type);
        const prompt: string | undefined = terms.length ?
          terms.flatMap(term =>[term.descriptor, term.term])
              .filter(v => !!v).join(" ") : undefined;
        console.log(type, prompt)
        if (key && prompt) {
          results[key as 'numBeds' | 'numBathrooms' | 'price'] = (await minMaxField.invoke(`${type} range request: ${prompt}`)).parsed;
        }
      },
    ),
  );

  console.log("results", results)

  return results;
};
