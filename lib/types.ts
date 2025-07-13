import {z} from "npm:zod@4.0.5";

export interface Listing {
  id: string;
  listing_url: string;
  name: string;
  description: string;
  picture_url: string;
  neighborhood_overview: string;
  latitude: string;
  longitude: string;
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

export const QueryOutput = z.object({
  intention: z.enum(['buy', 'rent', 'invest', 'first home', 'vacation', 'other']).describe('The intention of the user when searching for listings, such as buying, renting, investing, etc.'),
  numBeds: z.number().optional().describe('The minimum number of beds the user is looking for in a listing.'),
  numBath: z.number().optional().describe('The minimum number of bathrooms the user is looking for in a listing.'),
  // priceMin: z.number().optional().describe('The minimum price the user is willing to pay for a listing, leave empty if user does not provide a price value.'),
  // priceMax: z.number().optional().describe('The maximum price the user is willing to pay for a listing, leave empty if user does not provide a price value.'),
  keywords: z.string().array().describe(
      'Any features a user is looking for in the property that are not captured by the other fields, such as "pool", "wifi", "mountain views", "city living" etc.'
  ),
  location: z.string().optional().describe('The location the user is looking for listings in, such as a city or neighborhood.'),
  distanceToLocation: z.string().optional().describe('If the user specified a distance to thr location field, (1 minute, 10kms) return it in this field.'),
})


export type InferredFilters = z.infer<typeof QueryOutput>;