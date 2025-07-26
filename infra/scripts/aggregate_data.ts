import {parse} from "jsr:@std/csv";
import {Client} from "npm:@opensearch-project/opensearch@2.5.0";
import {GeoIndexLocation} from "../../lib/types.ts";
import {latLngToCell} from "h3-js";

const client = new Client({
  node: Deno.env.get("OPENSEARCH_URL"),
});

const index = "listings-agg";

const indexMapping = {
  settings: {
    "index.knn": true,
  },
  mappings: {
    properties: {
      location: {
        type: "geo_point",
      },
      index: {
        type: "text",
      },
      keyword_embedding: {
        type: "knn_vector",
        dimension: 384,
        method: {
          name: "hnsw",
          space_type: "cosinesimil",
          engine: "faiss",
        },
      },
      keyword: {
        type: "text",
      },
    },
  },
};

console.log(`Checking if index "${index}" exists...`);
const exists = await client.indices.exists({ index });

if (exists.body) {
  console.log(`Deleting index "${index}"...`);
  await client.indices.delete({ index });
  console.log(`Index "${index}" deleted.`);
}

console.log(`Creating index "${index}"...`);
await client.indices.create({
  index,
  body: indexMapping,
});

console.log(`Index "${index}" created.`);

const file = await Deno.readTextFile("data/Airbnb Listings - melbourne.csv");
const csvData = parse(file, { skipFirstRow: true }) as Record<string, string>[];
const batchSize = 1000;

for (let i = 0; i < csvData.length; i += batchSize) {
  const batch = csvData.slice(i, i + batchSize);
  console.log(`Processing and indexing batch ${i / batchSize + 1}...`);

  const docs = batch.map((row): GeoIndexLocation[] => {
    const amenities = row.amenities
      ? JSON.parse(row.amenities.replace(/""/g, '"'))
      : [];

    return amenities.map((key: string) => {
      const doc: GeoIndexLocation = {
        type: "amenity",
        location: {
          lat: parseFloat(row.latitude),
          lon: parseFloat(row.longitude),
        },
        index: latLngToCell(
          parseFloat(row.latitude),
          parseFloat(row.longitude),
          7,
        ),
        keyword: key,
        at: row.last_scraped,
      };
      return doc;
    });
  });

  const body = docs.flat().flatMap((doc) => [
    { index: { _index:  index } },
    doc,
  ]);

  const response = await client.bulk({
    index,
    pipeline: "text-embedding-pipeline",
    body,
  });

  if (response.body.errors) {
    console.error(
      "Error indexing batch:",
      response.body.items.filter((item: { index: { error: Error } }) =>
        item.index.error
      ),
    );
  } else {
    console.log(`Batch of ${docs.length} documents indexed successfully.`);
  }
}

console.log("Data upload complete.");
