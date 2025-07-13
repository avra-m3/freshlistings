import { useSignal } from "@preact/signals";
import {InferredFilters, Listing} from "../lib/types.ts";
import ListingCard from "../components/ListingCard.tsx";
import {FilterPanel} from "../components/FilterPanel.tsx";

interface ListingSearchProps {
  listings: Listing[];
  queryTime: number;
  query?: string;
  page?: number;
  count?: number;
  understoodQuery?: InferredFilters
}

export default function ListingSearch(props: ListingSearchProps) {
  const listings = useSignal<Listing[]>(props.listings);
  const query = useSignal(props.query || "");

  return (
    <div class="w-full">
      <form class="flex gap-2">
        <input
          type="text"
          name="q"
          class="flex-grow p-2 border rounded"
          placeholder="Search for listings..."
          value={query.value}
          onInput={(e) => query.value = (e.target as HTMLInputElement).value}
        />
        <button type="submit" class="px-4 py-2 bg-blue-500 text-white rounded">
          Search
        </button>
      </form>
      {/* The inferred filters in pill buttons */}
        {props.understoodQuery && Object.entries(props.understoodQuery).length > 0 && (
            <FilterPanel filters={props.understoodQuery}/>
        )}
      {!!props.queryTime && (
        <div class="mt-2 text-gray-600">
            {props.count} results in {`${props.queryTime}ms`}
        </div>
      )}
      <div class="mt-4 grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        {listings.value.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
      </div>
        <div class="mt-4">
            {props.page !== undefined && (
                <div class="flex justify-between">
                    <a href={props.page <= 0 ? undefined : `?q=${encodeURIComponent(query.value)}&p=${props.page - 1}`} class="text-blue-500 hover:underline" aria-disabled={props.page <= 0}>
                        Previous
                    </a>
                    <span>Page {props.page + 1}</span>
                    <a href={`?q=${encodeURIComponent(query.value)}&p=${props.page + 1}`} class="text-blue-500 hover:underline">
                        Next
                    </a>
                </div>
            )}
        </div>
    </div>
  );
}
