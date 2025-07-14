import { useSignal } from "@preact/signals";
import { InferredFilters, Listing, ListingHighlight } from "../lib/types.ts";
import ListingCard from "../components/ListingCard.tsx";
import { FilterPanel } from "../components/FilterPanel.tsx";
import IconSparkles from "https://deno.land/x/tabler_icons_tsx@0.0.7/tsx/sparkles.tsx";
import IconRadar from "https://deno.land/x/tabler_icons_tsx@0.0.7/tsx/radar.tsx";

interface ListingSearchProps {
  listings: (Listing & ListingHighlight)[];
  queryTime: number;
  query?: string;
  page?: number;
  model?: string;
  count?: number;
  understoodQuery?: InferredFilters;
  realLocation?: string;
}

export default function ListingSearch(props: ListingSearchProps) {
  const listings = useSignal<Listing[]>(props.listings);
  const query = useSignal(props.query || "");
  return (
    <div class="w-full">
      <form class="flex gap-0 border-b border-gray-300">
        <input
          type="text"
          name="q"
          class="flex-grow p-4 text-lg rounded-tl-xl outline-none"
          placeholder="Search for listings..."
          value={query.value}
          onInput={(e) => query.value = (e.target as HTMLInputElement).value}
        />
        {props.model && props.model !== "gemini-2.5-flash" && <input type="hidden" name="m" value={props.model} />}
        <button
          type="submit"
          class="px-4 py-2 bg-yellow-300 text-black rounded-tr-xl"
        >
          <IconSparkles class="mr-1 inline" />
          Search
        </button>
      </form>
      <div class="bg-white px-4 pb-4">
        {/* The inferred filters in pill buttons */}
        {props.understoodQuery &&
          Object.entries(props.understoodQuery).length > 0 && (
          <FilterPanel filters={props.understoodQuery} />
        )}
        <div class="flex items-center justify-between mt-4">
          {!!props.queryTime && (
            <div class="mt-2 text-gray-600 inline">
              {props.count} results in {`${props.queryTime}ms`}
              {" "}
            </div>
          )}
          {props.realLocation
            ? (
              <div class="ml-auto mt-2 text-gray-600 inline">
                <IconRadar class="inline mr-1" /> Around "{props.realLocation}"
              </div>
            )
            : ""}
        </div>

        <div class="mt-4 grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          {listings.value.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </div>

      <div class="bg-white rounded-b-xl shadow-lg">
        {props.page !== undefined && (
          <div class="flex justify-between">
            <ChangePageLink
              destination={props.page - 1}
              enabled={props.page > 0}
              query={query.value}
              class="rounded-bl-xl"
            >
              Previous
            </ChangePageLink>
            <span class="p-4 text-xl">Page {props.page + 1}</span>
            <ChangePageLink
              destination={props.page + 1}
              enabled={(props.page + 1) * 10 < (props.count || 0)}
              query={query.value}
              class="rounded-br-xl"
            >
              Next
            </ChangePageLink>
          </div>
        )}
      </div>
    </div>
  );
}

const ChangePageLink = (
  props: {
    destination: number;
    query: string;
    enabled: boolean;
    children: string;
    class: string;
  },
) => {
  const href = props.enabled
    ? `?q=${encodeURIComponent(props.query)}&p=${props.destination}`
    : undefined;

  const baseClass = "p-4 min-w-32 text-center text-lg font-bold ";
  const unclickableClass = "text-gray-700 bg-yellow-200 cursor-default";
  const clickableClass =
    "hover:underline hover:bg-yellow-400 text-black-100 bg-yellow-300";
  return (
    <a
      href={href}
      className={[
        baseClass,
        props.enabled ? clickableClass : unclickableClass,
        props.class,
      ].filter((v) => !!v).join(" ")}
      aria-disabled={props.enabled}
    >
      {props.children}
    </a>
  );
};
