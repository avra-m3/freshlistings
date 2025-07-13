import { Client } from "npm:@opensearch-project/opensearch";
import type { InferredFilters, Listing } from "./types.ts";
import { getEmbedding } from "./embeddings.ts";

export const client = new Client({
  node: Deno.env.get("OPENSEARCH_URL") || "http://localhost:9200",
});

export const getListingById = async (
  id: string,
) => {
  const response = await client.get<{ _source: Listing }>({
    index: "listings",
    id,
  });
  return response.body._source;
};

type ListingHit = {
  _id: string;
  _source: Omit<Listing, "id">;
};

export const searchListings = async (
  understoodQuery: InferredFilters,
  page = 0,
) => {
  const embeddingQuery = (understoodQuery.keywords || []).join(" ");
  const embedding = await getEmbedding(embeddingQuery);

  const filters = [];
  if (understoodQuery.numBeds) {
    filters.push({
      range: {
        bedrooms: { gte: understoodQuery.numBeds },
      },
    });
  }
  if (understoodQuery.numBath) {
    filters.push({
      range: {
        bathrooms: { gte: understoodQuery.numBath },
      },
    });
  }

  const searchBody = {
    query: {
      bool: {
        must: [
          {
            knn: {
              embedding: {
                vector: embedding,
                k: 10,
              },
            },
          },
        ],
        filter: {},
      },
    },
  };

  if (filters.length > 0) {
    searchBody.query.bool.filter = filters;
  }

  console.log(searchBody);

  const response = await client.search({
    index: "listings",
    size: 10,
    from: 10 * page,
    body: searchBody,
  });

  const listings: Listing[] = response.body.hits.hits.map((
    hit: ListingHit,
  ) => ({
    id: hit._id,
    ...(hit._source),
  }));

  return {
    data: listings,
    queryTime: response.body.took,
    count: response.body.hits.total.value,
  };
};