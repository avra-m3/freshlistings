import {Handlers, PageProps} from "$fresh/server.ts";
import {getListingById} from "../../lib/opensearch.ts";
import {Listing} from "../../lib/types.ts";
import IconBathFilled from "https://deno.land/x/tabler_icons_tsx@0.0.7/tsx/bath-filled.tsx";
import IconBed from "https://deno.land/x/tabler_icons_tsx@0.0.7/tsx/bed.tsx";

export const handler: Handlers<Listing> = {
  async GET(_, ctx) {
    const { id } = ctx.params;
    try {
      const response = await getListingById(id);
      return ctx.render(response);
    } catch (error) {
      console.error(error);
      return new Response("Error fetching listing", { status: 500 });
    }
  },
};

const priceFormatter = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
});

export default function ListingPage({ data }: PageProps<Listing>) {
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
      <div className="mx-4 mt-6">
        <div className="max-w-screen-lg mx-auto flex flex-col items-center justify-center">
          <div className="w-full">
            <div key={data.id} className="rounded-xl shadow-lg bg-white">
              <img
                src={data.picture_url}
                alt={data.name}
                className="w-full h-48 object-cover mb-1 rounded-t-xl"
              />
              <div className="p-2">
                <h2 className="text-lg font-bold">{data.name}</h2>
                {data.price
                  ? (
                    <p className="text-gray-600">
                      {priceFormatter.format(data.price)}
                    </p>
                  )
                  : "No price"}
                <div className="flex items-center gap-2 mt-2 mb-2">
                  {data.bedrooms
                    ? (
                      <span className="flex items-center">
                        <IconBed class="w-5 h-5 inline mr-1" />
                        {data.bedrooms} Beds
                      </span>
                    )
                    : null}
                  {data.bathrooms
                    ? (
                      <span className="flex items-center">
                        <IconBathFilled class="w-5 h-5 inline mr-1" />
                        {data.bathrooms} Baths
                      </span>
                    )
                    : null}
                </div>
                <p className="text-md">{data.description.split("\n").map(
                    v => <span key={v}>{v}<br /></span>,
                )}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
