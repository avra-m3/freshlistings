import { Listing } from "../lib/types.ts";

import IconBed from "https://deno.land/x/tabler_icons_tsx@0.0.7/tsx/bed.tsx"
import IconBathFilled from "https://deno.land/x/tabler_icons_tsx@0.0.7/tsx/bath-filled.tsx"

const priceFormatter = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
});

export default function ListingCard({ listing }: { listing: Listing }) {
  return (
    <div key={listing.id} class="rounded-xl shadow-lg p-4 bg-white">
      <a href={`/listings/${listing.id}`}>
        <img
          src={listing.picture_url}
          alt={listing.name}
          class="w-full h-48 object-cover mb-2"
        />
        <h2 class="text-lg font-bold">{listing.name}</h2>
        {listing.price ? (
          <p class="text-gray-600">{priceFormatter.format(listing.price)}</p>
        ) : "No price"}
        <div class="flex items-center gap-2 mt-2 mb-2">
          {listing.bedrooms ? (
            <span class="flex items-center">
              <IconBed class="w-5 h-5 inline mr-1" />
              {listing.bedrooms} Beds
            </span>
          ) : null}
          {listing.bathrooms ? (
            <span class="flex items-center">
                <IconBathFilled class="w-5 h-5 inline mr-1" />
                {listing.bathrooms} Baths
            </span>
            ) : null}
        </div>
        {listing.excerpt
          ? (
            <p
              class="text-sm"
              dangerouslySetInnerHTML={{ __html: listing.excerpt }}
            />
          )
          : <p class="text-sm truncate">{listing.description}</p>}
      </a>
    </div>
  );
}
