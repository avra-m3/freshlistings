import { Handlers, PageProps } from "$fresh/server.ts";
import MapPanel from "../../islands/MapPanel.tsx";
import MapSearchPanel from "../../islands/MapSearchPanel.tsx";
import { z } from "npm:zod@4.0.5";
import { search, SearchInput } from "../../lib/search.ts";
const GOOGLE_MAPS_API_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY");

interface HandlerData {
  lat: number;
  lng: number;
  zoom: number;
  query?: string;
  understoodQuery?: SearchInput; // Adjust type as needed
}

const params = z.object({
  lat: z.coerce.number().default(-37.8136),
  lng: z.coerce.number().default(144.9631),
  zoom: z.coerce.number().default(15),
  q: z.string().optional().describe("Search query for the map"),
});

export const handler: Handlers<HandlerData> = {
  async GET(req, ctx) {
    const url = new URL(req.url);
    const rawParams = Object.fromEntries(url.searchParams.entries());
    const parsedParams = params.safeParse(rawParams);

    if (!parsedParams.success) {
      return ctx.render({
        lat: -37.8136,
        lng: 144.9631,
        zoom: 15,
        query: "",
      });
    }

    const { lat, lng, zoom, q: query } = parsedParams.data;

    if (!query) {
      return ctx.render({
        lat: lat,
        lng: lng,
        zoom: zoom,
        query: "",
      });
    }

    const searchOutput = await search(query);

    return ctx.render({
      lat: lat ?? -37.8136,
      lng: lng ?? 144.9631,
      zoom: zoom ? zoom : 18,
      query,
      understoodQuery: searchOutput ? searchOutput : undefined,
    });
  },
};

export default function ListingPage(
  { data }: PageProps<HandlerData>,
) {
  return (
    <div class="relative h-full w-full">
      <MapPanel
        apiKey={GOOGLE_MAPS_API_KEY}
        position={{ lat: data.lat, lng: data.lng }}
        searchResultPosition={data.understoodQuery?.point}
        zoom={data.zoom}
      />
      <MapSearchPanel
        query={data.query}
        understoodQuery={data.understoodQuery}
      />
    </div>
  );
}
