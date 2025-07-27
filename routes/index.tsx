import {Handlers, PageProps} from "$fresh/server.ts";
import ListingSearch from "../components/ListingSearch.tsx";
import {searchListings} from "../lib/opensearch/listings.ts";
import {Listing, ListingHighlight} from "../lib/types.ts";
import {z} from "npm:zod@4.0.5";
import {AllowedModelSchema} from "../lib/models.ts";
import {search, SearchInput} from "../lib/search.ts";

type Data = {
  listings: (Listing & ListingHighlight)[];
  queryTime: number;
  query?: string;
  page?: number;
  model?: string;
  count?: number;
  understoodQuery?: SearchInput;
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
      const understoodQuery = await search(q, m);
      if(!understoodQuery) {
        return ctx.render({
          listings: [],
          queryTime: 0,
          query: q,
        });
      }
      const { data, queryTime, count } = await searchListings(
        understoodQuery,
        understoodQuery.point,
        p,
      );
      return ctx.render({
        listings: data,
        queryTime,
        query: q,
        page: p,
        count,
        understoodQuery,
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
            model={data.model}
          />
        </div>
      </div>
      <div className="mt-4 max-w-screen-lg mx-auto flex flex-col items-center justify-center">
          <span aria-label="disclaimer" className="text-xs text-gray-500">
            Data sourced from{" "}
            <a
                href="https://insideairbnb.com/get-the-data/#:~:text=match%20at%20L2231%20Sydney%2C%20New,South%20Wales%2C%20Australia"
            >
              inside Airbnb
            </a>.
            <br/>
            This site is for demonstration purposes only. The data is not real-time
            and will not reflect current listings or prices. This site is a tech
            demo for the future of search and should not be used for actual
            property searches or transactions.
          </span>
      </div>
    </div>
  );
}
