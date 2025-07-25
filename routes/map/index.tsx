import {Handlers, PageProps} from "$fresh/server.ts";
import MapPanel from "../../islands/MapPanel.tsx";
const GOOGLE_MAPS_API_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY");

export const handler: Handlers<{}> = {
    async GET(_, ctx) {
        return ctx.render({})
    },
};

export default function ListingPage({ data }: PageProps<{}>) {
    return (
        <MapPanel apiKey={GOOGLE_MAPS_API_KEY}/>
    );
}
