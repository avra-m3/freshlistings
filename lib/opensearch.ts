import { Client } from "npm:@opensearch-project/opensearch";
import { InferredFilters, Listing, ListingHighlight } from "./types.ts";

const EMBEDDING_MODEL_ID = Deno.env.get("OPENSEARCH_MODEL_ID");
// const HIGHLIGHT_MODEL_ID = Deno.env.get("OPENSEARCH_HL_MODEL_ID");

export const client = new Client({
  node: Deno.env.get("OPENSEARCH_URL") || "http://localhost:9200",
});

export const getListingById = async (id: string) => {
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

const generateNeuralQuery = (
  field: string,
  queryText: string,
  _weight = 1,
) => ({
  // function_score: {
  //   weight,
  //   query: {
  neural: {
    [`${field}_embedding`]: {
      query_text: queryText,
      model_id: EMBEDDING_MODEL_ID,
      k: 10,
    },
  },
  //   },
  // },
});

export const searchListings = async (
  understoodQuery: InferredFilters,
  coords?: { lat: number; lng: number },
  page = 0,
) => {
  const filters = [];
  if (understoodQuery.numBeds?.max || understoodQuery.numBeds?.min) {
    filters.push({
      range: {
        bedrooms: {
          gte: understoodQuery.numBeds.min,
          lte: understoodQuery.numBeds.max,
        },
      },
    });
  }
  if (understoodQuery.numBathrooms?.max || understoodQuery.numBathrooms?.min) {
    filters.push({
      range: {
        bathrooms: {
          gte: understoodQuery.numBathrooms?.min,
          lte: understoodQuery.numBathrooms?.max,
        },
      },
    });
  }

  if (coords) {
    const distance = {
      value: 10,
      unit: "km",
    };
    if (understoodQuery.location?.distance) {
      if (understoodQuery.location.distance.unit === "minutes") {
        distance.value = 1.67 * understoodQuery.location.distance.value;
        distance.unit = "km";
      } else if (understoodQuery.location.distance.unit === "hours") {
        distance.value = 1.67 * 60 * understoodQuery.location.distance.value;
        distance.unit = "km";
      } else {
        distance.value = understoodQuery.location.distance.value;
        distance.unit = understoodQuery.location.distance.unit;
      }
    }
    console.log({
      geo_distance: {
        distance: `${distance.value}${distance.unit}`,
        location: {
          lat: coords.lat,
          lon: coords.lng,
        },
      },
    });
    // const projection = proj4(,'WGS84');
    filters.push({
      geo_distance: {
        distance: `${distance.value}${distance.unit}`,
        location: {
          lat: coords.lat,
          lon: coords.lng,
        },
      },
    });
  }

  // console.log(filters);

  const sematicPriorities = [];

  if (understoodQuery.keywords.length) {
    sematicPriorities.push(
      generateNeuralQuery("name", understoodQuery.keywords.join(" "), 4),
    );
    sematicPriorities.push(
      generateNeuralQuery("description", understoodQuery.keywords.join(" "), 2),
    );
  }

  const searchBody = {
    query: {
      bool: {
        ...(sematicPriorities.length
          ? {
            should: sematicPriorities,
            minimum_should_match: 1,
          }
          : {}),
        ...(filters.length ? { filter: filters } : {}),
      },
    },
    // highlight: {
    //   fields: {
    //     // name: { type: "unified" },
    //     // description: { type: "unified" },
    //     // overview: { type: "semantic" },
    //     // amenities_text: { type: "semantic" },
    //   },
    //   options: {
    //     model_id: HIGHLIGHT_MODEL_ID,
    //   },
    // },
  };

  // console.log(searchBody);

  const response = await client.search({
    index: "listings",
    size: 10,
    from: 10 * page,
    body: searchBody,
  });

  // console.log("Search response:", response.body);

  const listings: (Listing & ListingHighlight)[] = response.body.hits.hits.map(
    (hit: ListingHit) => ({
      id: hit._id,
      ...hit._source,
      // highlight: hit.highlight as ListingHighlight["highlight"],
    }),
  );

  return {
    data: listings,
    queryTime: response.body.took,
    count: response.body.hits.total.value,
  };
};
