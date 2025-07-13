import { Handlers, PageProps } from "$fresh/server.ts";
import { getListingById } from "../../lib/opensearch.ts";
import { Listing } from "../../lib/types.ts";
import ListingCard from "../../components/ListingCard.tsx";

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

export default function ListingPage({ data }: PageProps<Listing>) {
  return (
    <div class="p-4">
      <ListingCard listing={data} />
    </div>
  );
}
