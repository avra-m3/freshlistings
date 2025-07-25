import {useSignal} from "@preact/signals";
import {Listing, ListingHighlight} from "../lib/types.ts";
import ListingCard from "../components/ListingCard.tsx";

interface ListingSearchProps {
  listings: (Listing & ListingHighlight)[];
}

export default function ListingSearchResults(props: ListingSearchProps) {
  const listings = useSignal<Listing[]>(props.listings);
  return (
        <div class="mt-4 grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          {listings.value.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
  );
}
