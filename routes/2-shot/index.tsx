import { Handlers, PageProps } from "$fresh/server.ts";
import ListingSearch from "../../components/ListingSearch.tsx";
import { searchListings } from "../../lib/opensearch/listings.ts";
import { InferredFilters, Listing, ListingHighlight } from "../../lib/types.ts";
import { locationToCoordinates } from "../../lib/geocode.ts";
import { z } from "npm:zod@4.0.5";
import {alternateBreakdownQuery} from "../../lib/doubleShotUnderstanding.ts";
import {AllowedModelSchema} from "../../lib/models.ts";

type Data = {
  listings: (Listing & ListingHighlight)[];
  queryTime: number;
  query?: string;
  page?: number;
  model?: string;
  count?: number;
  understoodQuery?: InferredFilters;
  realLocation?: string;

};

const params = z.object({
  p: z.coerce.number().default(0),
  q: z.string().max(1000).optional(),
  m: AllowedModelSchema.default("gemini-2.5-flash"),
});

export const handler: Handlers<Data> = {
  async GET(req, ctx) {
    const url = new URL(req.url);
    const rawParams = Object.fromEntries(url.searchParams.entries());
    const parsedParams = params.safeParse(rawParams);
    if (!parsedParams.success) {
      return ctx.render({
        listings: [],
        queryTime: 0,
        query: "Invalid query parameters",
      });
    }
    const q = parsedParams.data.q;
    const p = parsedParams.data.p;
    const m = parsedParams.data.m;
    if (q) {
      const understoodQuery = await alternateBreakdownQuery(q, m);
      console.log("v2" ,understoodQuery);
      let realCoords: { lat: number; lng: number; name: string } | undefined;
      if (understoodQuery.location?.place) {
        realCoords = await locationToCoordinates(
          understoodQuery.location.place,
        );
      }
      console.log("realcrs", realCoords);

      const { data, queryTime, count } = await searchListings(
        understoodQuery,
        realCoords,
        p,
      );
      return ctx.render({
        listings: data,
        queryTime,
        query: q,
        page: p,
        count,
        understoodQuery,
        realLocation: realCoords?.name,
        model: m,
      });
    }
    return ctx.render({ listings: [], queryTime: 0, query: "" });
  },
};

export default function Home({ data }: PageProps<Data>) {
  return (
    <div className="mx-auto">
      <div className="bg-[#a104c3] w-full flex flex-col items-center justify-center p-6 pb-60 -mb-60">
        <img
          className="my-6 inline"
          src="/logo.svg"
          width="128"
          height="128"
          alt="the logo: A bar chart with red elements"
        />
        <h1 className="inline align-text-top">
          <span className="text-4xl font-bold text-white">Fresh</span>
          <span className="text-4xl font-bold text-yellow-300">Listings</span>
        </h1>
      </div>
      <div class="mx-4 mt-6">
        <div className="max-w-screen-lg mx-auto flex flex-col items-center justify-center">
          <ListingSearch
            listings={data.listings}
            queryTime={data.queryTime}
            count={data.count}
            query={data.query}
            page={data.page}
            understoodQuery={data.understoodQuery}
            realLocation={data.realLocation}
            model={data.model}
          />
        </div>
      </div>
    </div>
  );
}
