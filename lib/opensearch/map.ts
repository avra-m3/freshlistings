import {getOpenSearchClient} from "./common.ts";


export type MapTileData = {
  index: string;
  count: number;
};

type MapTileInput = {
  keyword: string;
  zoom: number;
  topLeft: [number, number];
    bottomRight: [number, number];
};

export const getMapTileData = async (
  { keyword, zoom, topLeft, bottomRight }: MapTileInput,
): Promise<MapTileData[]> => {
  const client = getOpenSearchClient();
  // convert to cells at zoom 9
  // find cells in opensearch within bounds and semantically matching keyword and aggregate using geohex_grid
  const response = await client.search<{
    aggregations: {
      grouped: {
        buckets: {
          key: string;
          doc_count: number;
          centroid: {
            value: string;
          };
        }[];
      };
    };
  }>({
    index: "listings-agg",
    body: {
      size: 0,
      query: {
        bool: {
          must: [
            {
              match: {
                keyword: keyword,
              },
            },
          ],
          filter: [
          ],
        },
      },
      aggregations: {
        grouped: {
          geohex_grid: {
            field: "location",
            precision: zoom,
            bounds: {
                top_left: {
                    lat: topLeft[1],
                    lon: topLeft[0],
                },
                bottom_right: {
                    lat: bottomRight[1],
                    lon: bottomRight[0],
                },
            }
          },
        },
      },
    },
  });

  return response.body.aggregations.grouped.buckets.map((bucket) => {
    const cell = bucket.key;
    return {
      index: cell,
      count: bucket.doc_count,
    };
  });
};
