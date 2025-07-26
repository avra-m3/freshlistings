import { useSignal } from "@preact/signals";
import { useEffect, useMemo } from "preact/hooks";
import { InferredFilters } from "../lib/types.ts";
import { FilterPanel } from "../components/FilterPanel.tsx";
import IconSparkles from "https://deno.land/x/tabler_icons_tsx@0.0.7/tsx/sparkles.tsx";
import IconRadar from "https://deno.land/x/tabler_icons_tsx@0.0.7/tsx/radar.tsx";
import {
  mapSearchQuerySignal,
  useMapCenter,
  useMapIntentionSignal,
  useMapSearchKeywordSignal,
  useZoomLevel,
} from "../routes/map/signals.ts";

interface ListingSearchProps {
  query?: string;
  page?: number;
  understoodQuery?: InferredFilters;
  realLocation?: string;
}

export default function MapSearchPanel(props: ListingSearchProps) {
  const query = useSignal(props.query || "");
  const mapZoom = useZoomLevel();
  const mapCenter = useMapCenter();
  const predictedFilters = useMapIntentionSignal();
  const isLoading = useSignal(false);
  const predictionCache = useMemo(() => {
    const cache: Record<string, InferredFilters> = {};
    if (props.understoodQuery) {
      cache[props.query?.trim() || ""] = props.understoodQuery;
    }
    return cache;
  }, []);

  useEffect(() => {
    console.log("SearchPanel: query changed", query.value);
    if (!query.value.trim()) {
      mapSearchQuerySignal.value = null;
      return;
    }

    if (predictionCache[query.value.trim()]) {
      mapSearchQuerySignal.value = predictionCache[query.value.trim()];
      return;
    }
    isLoading.value = true;

    const timeoutId = setTimeout(async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        console.log("params", params);
        params.append("query", query.value);

        const response = await fetch(`/api/predict?${params}`);
        if (response.ok) {
          const data = await response.json();
          if (data.understoodQuery) {
            delete data.understoodQuery.intention;
            predictionCache[query.value.trim()] = data.understoodQuery;
            mapSearchQuerySignal.value = data.understoodQuery;
          }
        }
      } catch (error) {
        console.error("Failed to call predict API:", error);
      } finally {
        isLoading.value = false;
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [query.value]);

  return (
    <div class="absolute top-5 left-2 z-10 rounded-xl shadow-lg bg-none">
      <form class="flex gap-0">
        {mapCenter && (
          <>
            <input
              type="hidden"
              name="lat"
              value={mapCenter.lat}
            />
            <input
              type="hidden"
              name="lng"
              value={mapCenter.lng}
            />
          </>
        )}
        {mapZoom && (
          <input
            type="hidden"
            name="zoom"
            value={mapZoom.toString()}
          />
        )}
        <input
          type="text"
          name="q"
          class="flex-grow p-4 text-lg rounded-tl-xl outline-none"
          placeholder="Search for listings..."
          value={query.value}
        />
        <button
          type="submit"
          class="px-4 py-2 bg-yellow-300 text-black rounded-tr-xl"
        >
          <IconSparkles class="mr-1 inline" />
          Search
        </button>
      </form>
      <div class="px-4 pb-4">
        {predictedFilters &&
          Object.entries(predictedFilters).length > 0 && (
          <div
            class={(isLoading.value && query.value.trim())
              ? "flex items-center gap-2 mt-2 animate-pulse"
              : "mt-2"}
          >
            <FilterPanel
              filters={predictedFilters}
              realLocation={props.realLocation}
            />
          </div>
        )}
      </div>
    </div>
  );
}
