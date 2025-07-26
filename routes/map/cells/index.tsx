import { Handlers, RouteConfig } from "$fresh/server.ts";
import { z } from "npm:zod@4.0.5";
import { getHexagonEdgeLengthAvg, UNITS } from "h3-js";
import { getMapTileData } from "../../../lib/opensearch/map.ts";

const LocationSchema = z.string().transform(
  (v) => v.split(","),
).transform((v, ctx) => {
  const parsed = z.tuple([z.coerce.number(), z.coerce.number()]).safeParse(v);
  if (!parsed.success) {
    parsed.error.issues.forEach((issue) => {
      ctx.addIssue({
        ...issue,
        path: ["location", ...issue.path],
      });
    });
    return z.NEVER;
  }
  return parsed.data;
}).transform((v) => ({
  lat: v[0],
  lng: v[1],
}));

const params = z.object({
  topLeft: LocationSchema,
  bottomRight: LocationSchema,
  zoom: z.coerce.number().default(7),
  keywords: z.string(),
});

export const config: RouteConfig = {
  skipAppWrapper: true,
  skipInheritedLayouts: true,
};

const getH3Resolution = (zoomLevel: number) => {
  // Map Google Maps zoom levels to H3 resolutions
  // H3 resolution ranges from 0 (largest hexagons) to 15 (smallest)
  if (zoomLevel <= 3) return 1;
  if (zoomLevel <= 5) return 2;
  if (zoomLevel <= 7) return 3;
  if (zoomLevel <= 9) return 4;
  if (zoomLevel <= 11) return 6;
  if (zoomLevel <= 13) return 8;
  if (zoomLevel <= 15) return 9;
  if (zoomLevel <= 17) return 10;
  if (zoomLevel <= 18) return 11;
  return 12;
};

export const handler: Handlers = {
  async GET(req) {
    const url = new URL(req.url);
    const rawParams = Object.fromEntries(url.searchParams.entries());
    const parsedParams = params.safeParse(rawParams);
    if (!parsedParams.success) {
      console.log(parsedParams.error);
      return new Response(
        JSON.stringify({
          feedback: "Invalid query parameters",
        }),
        {
          headers: { "Content-Type": "application/json" },
        },
      );
    }
    const { topLeft, bottomRight, zoom, keywords } = parsedParams.data;
    const h3Resolution = getH3Resolution(zoom);

    const sizeAsRads = getHexagonEdgeLengthAvg(h3Resolution, UNITS.km) / 6371;
    const sizeAsDeg = sizeAsRads * (180 / Math.PI);
    const margin = sizeAsDeg * 2;
    console.log(keywords)

    const pointsWithData = await getMapTileData({
      keyword: keywords,
      topLeft: [
        Math.min(topLeft.lng, bottomRight.lng),
        Math.max(topLeft.lat, bottomRight.lat),
      ],
      bottomRight: [
        Math.max(topLeft.lng, bottomRight.lng),
        Math.min(topLeft.lat, bottomRight.lat),
      ],
      zoom: h3Resolution,
    });

    const maxCount = Math.max(
      ...pointsWithData.map((point) => point.count),
    );

    return new Response(
      JSON.stringify({
        tiles: pointsWithData.map(({ index, count }) => ({
          h3Index: index,
          fillColour: "#4285F4",
          fillOpacity: (count / maxCount) * 0.5 + 0.2, // Scale opacity between 0.2 and 0.7
          strokeColor: "#4285F4",
          data: `${count} total listings`,
        })),
      }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  },
};

export type MapTile = {
  h3Index: string;
  path: { lat: number; lng: number }[];
  fillColour: string;
  fillOpacity: number;
  strokeColor: string;
  data: string; // Placeholder for backend-driven data
};
