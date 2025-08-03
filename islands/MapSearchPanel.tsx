import {useSignal} from "@preact/signals";
import {useEffect, useMemo} from "preact/hooks";
import {InferredFilters} from "../lib/types.ts";
import {FilterPanel} from "../components/FilterPanel.tsx";
import IconSparkles from "https://deno.land/x/tabler_icons_tsx@0.0.7/tsx/sparkles.tsx";
import {mapSearchQuerySignal, useMapCenter, useZoomLevel,} from "../routes/map/signals.ts";
import {SearchInput} from "../lib/search.ts";

interface ListingSearchProps {
  query?: string;
  understoodQuery?: SearchInput;
}

export default function MapSearchPanel(props: ListingSearchProps) {
  const query = useSignal(props.query || "");
  const mapZoom = useZoomLevel();
  const mapCenter = useMapCenter();
  const predictedFilters = useSignal<SearchInput | undefined>(props.understoodQuery)
  const isLoading = useSignal(false);

  const predictionCache = useMemo(() => {
    const cache: Record<string, InferredFilters> = {};
    if (props.understoodQuery) {
      cache[props.query?.trim() || ""] = props.understoodQuery;
    }
    return cache;
  }, []);

  useEffect(() => {
    if (!query.value.trim()) {
      mapSearchQuerySignal.value = null;
      return;
    }

    if (predictionCache[query.value.trim()]) {
      predictedFilters.value = predictionCache[query.value.trim()];
      mapSearchQuerySignal.value = predictionCache[query.value.trim()];
      return;
    }
    isLoading.value = true;

    const timeoutId = setTimeout(async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        params.append("q", query.value);

        const response = await fetch(`/api/predict?${params}`);
        if (response.ok) {
          const data = await response.json();
          if (data.understoodQuery) {
            predictionCache[query.value.trim()] = data.understoodQuery;
            predictedFilters.value = data.understoodQuery;
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

  const handleInput = (e: Event) => {
    const textarea = e.target as HTMLTextAreaElement;
    textarea.style.height = "auto";
    textarea.style.height = `calc(${textarea.scrollHeight}px - 2rem)`;
    query.value = textarea.value;
  };

  return (
    <div class="absolute top-5 left-2 z-10 rounded-xl shadow-lg bg-none bg-white opacity-80 backdrop-blur-md rounded-b-xl w-full max-w-2xl">
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
        <textarea
          name="q"
          class="flex-grow p-4 text-lg rounded-tl-xl outline-none resize-none overflow-hidden"
          placeholder="Search for listings..."
          value={query.value}
          onInput={handleInput}
          rows={1}
        />
        <button
          type="submit"
          class="px-4 py-2 bg-yellow-300 text-black rounded-tr-xl"
        >
          <IconSparkles class="mr-1 inline" />
          Search
        </button>
      </form>
      <div class="px-4 pb-4 -mt-2">
        {predictedFilters.value &&
          Object.entries(predictedFilters.value).length > 0 && (
          <div
            class={(isLoading.value && query.value.trim())
              ? "flex items-center gap-2 mt-2 animate-pulse"
              : "mt-2"}
          >
            <FilterPanel
              filters={{...predictedFilters.value, intention: undefined}}
            />
          </div>
        )}
      </div>
    </div>
  );
}
