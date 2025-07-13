import {parse} from "jsr:@std/csv";
import { Client } from "npm:@opensearch-project/opensearch@2.5.0";
import { Listing } from "../../lib/types.ts";

const client = new Client({
  node: Deno.env.get("OPENSEARCH_URL") || "http://tehya:9200",
});

const index = "listings";

const indexMapping = {
    "settings": {
        "index.knn": true
    },
    "mappings": {
        "properties": {
            "description": {
                "type": "text",
            },
            "description_embedding": {
                "type": "knn_vector",
                "dimension": 384,
                "method": {
                    "name": "hnsw",
                    "space_type": "cosinesimil",
                    "engine": "faiss"
                }
            },
            "name": {
                "type": "text",
            },
            "name_embedding": {
                "type": "knn_vector",
                "dimension": 384,
                "method": {
                    "name": "hnsw",
                    "space_type": "cosinesimil",
                    "engine": "faiss"
                }
            },
            "neighborhood_overview": {
                "type": "text",
            },
            "neighborhood_overview_embedding": {
                "type": "knn_vector",
                "dimension": 384,
                "method": {
                    "name": "hnsw",
                    "space_type": "cosinesimil",
                    "engine": "faiss"
                }
            },
            "amenities_text": {
                "type": "text",
            },
            "amenities_text_embedding": {
                "type": "knn_vector",
                "dimension": 384,
                "method": {
                    "name": "hnsw",
                    "space_type": "cosinesimil",
                    "engine": "faiss"
                }
            }
        }
    }
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
    body: indexMapping
});



console.log(`Index "${index}" created.`);


const file = await Deno.readTextFile("data/Airbnb Listings - melbourne.csv");
const csvData = parse(file, { skipFirstRow: true }) as Record<string, string>[];
const batchSize = 1000;

for (let i = 0; i < csvData.length; i += batchSize) {
    const batch = csvData.slice(i, i + batchSize);
    console.log(`Processing and indexing batch ${i / batchSize + 1}...`);

    const docs = await Promise.all(batch.map(async (row) => {

        const amenities = row.amenities ? JSON.parse(row.amenities.replace(/""/g, '"')) : [];

        const doc: Partial<Listing> = {
            id: row.id,
            listing_url: row.listing_url,
            name: row.name,
            ...(row.description ? {description: row.description} : {}),
            ...(row.neighborhood_overview ? {neighborhood_overview: row.neighborhood_overview} : {}),
            ...(row.amenities ? {amenities_text: row.amenities} : {}),
            picture_url: row.picture_url,
            latitude: row.latitude,
            longitude: row.longitude,
            property_type: row.property_type,
            room_type: row.room_type,
            accommodates: row.accommodates ? parseInt(row.accommodates, 10) : 0,
            bathrooms: row.bathrooms ? parseInt(row.bathrooms, 10) : 0,
            bedrooms: row.bedrooms ? parseInt(row.bedrooms, 10) : 0,
            beds: row.beds ? parseInt(row.beds, 10) : 0,
            amenities: amenities,
            price: row.price ? parseFloat(row.price.replace(/[$,]/g, '')) : 0,
        };

        return doc;
    }));

    const body = docs.flatMap((doc) => [{ index: { _index: "listings", _id: doc.id } }, doc]);

    const response = await client.bulk({
        index,
        pipeline: "text-embedding-pipeline",
        body
    });

    if (response.body.errors) {
        console.error("Error indexing batch:", response.body.items.filter((item: any) => item.index.error));
    } else {
        console.log(`Batch of ${docs.length} documents indexed successfully.`);
    }
}

console.log("Data upload complete.");
