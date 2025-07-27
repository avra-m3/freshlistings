import { z } from "npm:zod@4.0.5";

export const classifyPrompt = z.object({
  keyTerms: z.array(z.object({
        term: z.string(),
        descriptor: z.string().optional().describe("include 'under', 'over', 'around'"),
    type: z.enum([
      "bedroom",
      "bathroom",
      "location",
      "price",
      "other",
    ]),
  })).describe(
    "List of key terms describing what the user asked for",
  ),
});

export const MinMaxField = z.object({
  min: z
    .number()
    .int()
    .min(0)
    .optional(),
  max: z
    .number()
    .int()
    .optional(),
});

export const PriceField = MinMaxField.optional().describe(
    "The numeric price range specified by the user, if they specified one.",
)

export const DistanceUnitField = z
  .object({
    value: z
      .number()
      .describe(
        "The distance value specified by the user, such as 1km, 10 miles, etc.",
      ),
    unit: z
      .enum(["km", "m", "miles", "nauticalmiles", "minutes", "hours"])
      .describe(
        "The unit of measurement for the distance, such as kilometers, miles, or minutes.",
      ),
  });

export const LocationField = z.object({
  place: z
    .string()
    .optional()
    .describe(
      "The free text place the user is looking for listings in or around, such as a city, neighborhood, nearby amenity or place ie: 'MCG', 'Richmond', 'the beach'.",
    ),
  distance: DistanceUnitField
    .optional()
    .describe(
      "The distance from the place the user is interested in.",
    ),
});

export const QueryOutput = z.object({
  intention: z
    .enum(["buy", "rent", "invest", "first home", "vacation", "other"])
    .describe(
      "The intention of the user when searching for listings, such as buying, renting, investing, etc.",
    ).optional(),
  numBeds: MinMaxField.optional().describe(
    "The number of beds or bedrooms.",
  ),
  numBathrooms: MinMaxField.optional().describe(
    "The number of bathrooms, toilets or showers, assume a minimum of 1 if no exact count.",
  ),
  price: PriceField,
  location: LocationField
    .optional()
    .describe("A place or area defined by the user."),
  keywords: z
    .string()
    .array()
    .describe(
      'Features a user is looking for in the property that are **NOT** captured by the other fields, such as "pool", "wifi", "mountain views" etc.',
    ),
});
