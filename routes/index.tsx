import { Handlers, PageProps } from "$fresh/server.ts";
import ListingSearch from "../islands/ListingSearch.tsx";
import {searchListings, searchListingsV2} from "../lib/opensearch.ts";
import { InferredFilters, Listing } from "../lib/types.ts";
import { breakdownQuery } from "../lib/queryUnderstanding.ts";

type Data = {
  listings: Listing[];
  queryTime: number;
  query?: string;
  page?: number;
  count?: number;
  understoodQuery?: InferredFilters;
};

export const handler: Handlers<Data> = {
  async GET(req, ctx) {
    const url = new URL(req.url);
    const q = url.searchParams.get("q");
    const p = parseInt(url.searchParams.get("p") || "0");
    if (q) {
      const understoodQuery = await breakdownQuery(q);
      const { data, queryTime, count } = await searchListingsV2(
        understoodQuery,
        p,
      );
      return ctx.render({
        listings: data,
        queryTime,
        query: q,
        page: p,
        count,
        understoodQuery,
      });
    }
    return ctx.render({ listings: [], queryTime: 0, query: "" });
  },
};

export default function Home({ data }: PageProps<Data>) {
  console.log(data.understoodQuery);
  return (
    <div class="px-4 py-8 mx-auto bg-[#86efac]">
      <div class="max-w-screen-md mx-auto flex flex-col items-center justify-center">
        <img
          class="my-6"
          src="/logo.svg"
          width="128"
          height="128"
          alt="the logo: A bar chart with red elements"
        />
        <ListingSearch
          listings={data.listings}
          queryTime={data.queryTime}
          count={data.count}
          query={data.query}
          page={data.page}
          understoodQuery={data.understoodQuery}
        />
      </div>
    </div>
  );
}
