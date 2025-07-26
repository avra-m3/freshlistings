import { z } from "npm:zod@4.0.5";
import { MinMaxField, QueryOutput } from "./schemas.ts";

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

export interface GeoIndexLocation {
  location: {
    lat: number;
    lon: number;
  };
  index: string;
  keyword: string;
  type: "neighborhood" | "amenity" | "property";
  at: string;
}

export type MinMaxValue = z.infer<typeof MinMaxField>;
export type InferredFilters = z.infer<typeof QueryOutput>;
