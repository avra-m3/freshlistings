# OpenSearch Index

This configuration creates an OpenSearch index.

## Prerequisites

- [Terraform](https://learn.hashicorp.com/tutorials/terraform/install-cli)
  installed
- [Docker](https://docs.docker.com/get-docker/) and
  [Docker Compose](https://docs.docker.com/compose/install/) installed

## Development Environment

1. **Start the OpenSearch cluster:** Navigate to the `infra` directory and run
   the following command to start the OpenSearch cluster in the background:
   ```sh
   docker-compose up -d
   ```

2. **Verify the cluster is running:** You can verify that the cluster is running
   by sending a request to `http://localhost:9200`:
   ```sh
   curl -X GET "http://localhost:9200"
   ```
   You should see a response with the cluster information.

### Machine Learning Model Setup

To enable semantic search capabilities, you need to register and deploy a
machine learning model and create an ingest pipeline.

1. **Register the sentence Model:**
   ```sh
   curl -X POST "http://localhost:9200/_plugins/_ml/models/_register" -H 'Content-Type: application/json' -d'
   {
     "name": "huggingface/sentence-transformers/all-MiniLM-L6-v2",
     "version": "1.0.2",
     "model_format": "TORCH_SCRIPT"
     }
   '
   ```

2. **Get the model_id:** Use the task_id from the previous step to check the
   status of the registration. Once the state is COMPLETED, the response will
   contain the model_id.
   ```sh
   # Replace <task_id> with the ID from the previous step
   curl -X GET "http://localhost:9200/_plugins/_ml/tasks/<task_id>"
   ```

3. **Deploy the Model:**
   ```sh
   curl -X POST "http://localhost:9200/_plugins/_ml/models/<model_id>/_deploy"
   ```

4. **Create the Ingest Pipeline:**
   ```sh
   curl -X PUT "http://localhost:9200/_ingest/pipeline/text-embedding-pipeline" -H 'Content-Type: application/json' -d'
   {
     "description": "A pipeline to generate embeddings for listings.",
     "processors": [
       {
         "text_embedding": {
         "model_id": "<model_id>",
         "field_map": {
             "name": "name_embedding",
             "description": "description_embedding"
           }
         }
       }
     ]
   }
   '
   ```

#### Setup sematic highlighting

1. **Register the highlight Model:**
   ```sh
   curl -X POST "http://localhost:9200/_plugins/_ml/models/_register" -H 'Content-Type: application/json' -d'
   {
     "name": "amazon/sentence-highlighting/opensearch-semantic-highlighter-v1",
     "version": "1.0.0",
     "model_format": "TORCH_SCRIPT",
     "function_name": "QUESTION_ANSWERING"
   }
   '
   ```

### Uploading Sample Data

Once the cluster is running, you can upload the sample Airbnb listings data
using the provided script.

```sh
# From the root of the project
deno run --allow-read=data --allow-env --allow-sys --allow-net infra/scripts/upload_data.ts
```

This will populate the `listings` index with the data from
`data/Airbnb Listings.csv`.
