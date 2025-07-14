import { z } from "npm:zod@4.0.5";

export interface ListingHighlight {
  highlight?: {
    name: string[];
    description: string[];
  };
}

export interface Listing {
  id: string;
  listing_url: string;
  name: string;
  description: string;
  picture_url: string;
  neighborhood_overview: string;
  location: {
    lat: number;
    lon: number;
  };
  property_type: string;
  room_type: string;
  accommodates: number;
  bathrooms: number;
  bedrooms: number;
  beds: number;
  amenities: string[];
  amenities_text: string;
  price: number;
}

const MinMaxField = z.object({
  min: z
    .number()
    .optional()
    .describe("The minimum value for the field, if applicable."),
  max: z
    .number()
    .optional()
    .describe("The maximum value for the field, if applicable."),
});

export const QueryOutput = z.object({
  intention: z
    .enum(["buy", "rent", "invest", "first home", "vacation", "other"])
    .describe(
      "The intention of the user when searching for listings, such as buying, renting, investing, etc.",
    ),
  numBeds: MinMaxField.optional().describe(
    "The number of beds or bedrooms the user is looking for in a listing.",
  ),
  numBathrooms: MinMaxField.optional().describe(
    "The number of bathrooms, toilets or showers the user is looking for in a listing, assume a minimum of 1 if no exact count.",
  ),
  price: MinMaxField.optional().describe('The price ($) range the user is looking for in a listing.'),
  location: z
    .object({
      freeText: z
        .string()
        .optional()
        .describe(
          "The free text place the user is looking for listings in or around, such as a city, neighborhood, nearby amenity or place ie: 'MCG', 'Richmond', 'the beach'.",
        ),
      distance: z
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
        })
        .optional()
        .describe(
          "The distance from the freeText location the user is interested in.",
        ),
    }).describe('A place or area defined by the user.')
    .optional(),
  keywords: z
    .string()
    .array()
    .describe(
      'Features a user is looking for in the property that are **NOT** captured by the other fields, such as "pool", "wifi", "mountain views" etc.',
    ),
});

export type MinMaxValue = z.infer<typeof MinMaxField>;
export type InferredFilters = z.infer<typeof QueryOutput>;
