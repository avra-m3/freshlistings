import { Handlers, PageProps } from "$fresh/server.ts";
import ListingSearch from "../islands/ListingSearch.tsx";
import { searchListings } from "../lib/opensearch.ts";
import { InferredFilters, Listing, ListingHighlight } from "../lib/types.ts";
import { breakdownQuery } from "../lib/queryUnderstanding.ts";
import { locationToCoordinates } from "../lib/geocode.ts";

type Data = {
  listings: (Listing & ListingHighlight)[];
  queryTime: number;
  query?: string;
  page?: number;
  count?: number;
  understoodQuery?: InferredFilters;
  realLocation?: string;
};

export const handler: Handlers<Data> = {
  async GET(req, ctx) {
    const url = new URL(req.url);
    const q = url.searchParams.get("q");
    const p = parseInt(url.searchParams.get("p") || "0");
    if (q) {
      const understoodQuery = await breakdownQuery(q);
      console.log(understoodQuery);
      let realCoords: { lat: number; lng: number; name: string } | undefined;
      if (understoodQuery.location?.freeText) {
        realCoords = await locationToCoordinates(
          understoodQuery.location.freeText,
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
      });
    }
    return ctx.render({ listings: [], queryTime: 0, query: "" });
  },
};

export default function Home({ data }: PageProps<Data>) {
  // console.log(data.listings);
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
          />
        </div>
      </div>
    </div>
  );
}
