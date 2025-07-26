import { Handlers, PageProps } from "$fresh/server.ts";
import MapPanel from "../../islands/MapPanel.tsx";
import MapSearchPanel from "../../islands/MapSearchPanel.tsx";
const GOOGLE_MAPS_API_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY");

export const handler: Handlers = {
  async GET(req, ctx) {
    const url = new URL(req.url);
    const lat = url.searchParams.get("lat");
    const lng = url.searchParams.get("lng");
    const zoom = url.searchParams.get("zoom");

    return ctx.render({
      lat: lat ? parseFloat(lat) : -37.8136,
      lng: lng ? parseFloat(lng) : 144.9631,
      zoom: zoom ? parseInt(zoom) : 15,
      query: url.searchParams.get("q") || "",
    });
  },
};

export default function ListingPage(
  { data }: PageProps<{ lat: number; lng: number; zoom: number, query: string }>,
) {
  return (
    <div class="relative h-full w-full">
      <MapPanel
        apiKey={GOOGLE_MAPS_API_KEY}
        position={{ lat: data.lat, lng: data.lng }}
        zoom={data.zoom}
      />
      <MapSearchPanel query={data.query}/>
    </div>
  );
}
