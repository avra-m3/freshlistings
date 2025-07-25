import {InferredFilters, Listing, ListingHighlight} from "../lib/types.ts";
import ListingSearchResults from "../islands/ListingSearchResults.tsx";
import SearchPanel from "../islands/SearchPanel.tsx";

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
  return (
    <div class="w-full">
      <div class="bg-white rounded-t-xl">
        <SearchPanel {...props} />
        <div class="px-4 pb-4">
          <ListingSearchResults listings={props.listings} />
        </div>
      </div>

      <div class="bg-white rounded-b-xl shadow-lg">
        {props.page !== undefined && (
          <div class="flex justify-between">
            <ChangePageLink
              destination={props.page - 1}
              enabled={props.page > 0}
              query={props.query || ""}
              class="rounded-bl-xl"
            >
              Previous
            </ChangePageLink>
            <span class="p-4 text-xl">Page {props.page + 1}</span>
            <ChangePageLink
              destination={props.page + 1}
              enabled={(props.page + 1) * 10 < (props.count || 0)}
              query={props.query || ""}
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
