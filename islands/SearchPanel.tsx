import {useSignal} from "@preact/signals";
import {useEffect, useMemo} from "preact/hooks";
import {InferredFilters} from "../lib/types.ts";
import {FilterPanel} from "../components/FilterPanel.tsx";
import IconSparkles from "https://deno.land/x/tabler_icons_tsx@0.0.7/tsx/sparkles.tsx";
import IconRadar from "https://deno.land/x/tabler_icons_tsx@0.0.7/tsx/radar.tsx";
import {SearchInput} from "../lib/search.ts";

interface ListingSearchProps {
  queryTime: number;
  query?: string;
  page?: number;
  model?: string;
  count?: number;
  understoodQuery?: SearchInput;
}



export default function SearchPanel(props: ListingSearchProps) {
  const query = useSignal(props.query || "");
  const predictedFilters = useSignal<InferredFilters | undefined>(props.understoodQuery);
  const isLoading = useSignal(false);
  const predictionCache = useMemo(() => {
    const cache: Record<string, InferredFilters> = {};
    if (props.understoodQuery) {
      cache[props.query?.trim() || ""] = props.understoodQuery;
    }
    return cache;
  }, [])

  useEffect(() => {
    console.log("SearchPanel: query changed", query.value);
    if (!query.value.trim()) {
      predictedFilters.value = undefined;
      return;
    }

    if( predictionCache[query.value.trim()]) {
        predictedFilters.value = predictionCache[query.value.trim()];
        return;
    }
    isLoading.value = true;

    const timeoutId = setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          q: query.value,
        });
        if (props.model && props.model !== "gemini-2.5-flash") {
          params.append("m", props.model);
        }

        const response = await fetch(`/api/predict?${params}`);
        if (response.ok) {
          const data = await response.json();
          if (data.understoodQuery) {
            predictionCache[query.value.trim()] = data.understoodQuery;
            predictedFilters.value = data.understoodQuery;
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
    <div>
      <form class="flex gap-0 border-b border-gray-300">
        <input
          type="text"
          name="q"
          class="flex-grow p-4 text-lg rounded-tl-xl outline-none"
          placeholder="Search for listings..."
          value={query.value}
          onChange={(e) => query.value = (e.currentTarget as HTMLInputElement).value}
        />
        {props.model && props.model !== "gemini-2.5-flash" && (
          <input type="hidden" name="m" value={props.model} />
        )}
        <button
          type="submit"
          class="px-4 py-2 bg-yellow-300 text-black rounded-tr-xl"
        >
          <IconSparkles class="mr-1 inline" />
          Search
        </button>
      </form>
      <div class="bg-white px-4 pb-4">
        {predictedFilters.value && Object.entries(predictedFilters.value).length > 0 && (
          <div class={(isLoading.value && query.value.trim()) ? "flex items-center gap-2 mt-2 animate-pulse" : "mt-2"}>
            <FilterPanel filters={predictedFilters.value} />
          </div>
        )}

        <div class="flex items-center justify-between mt-4">
          {!!props.queryTime && (
            <div class="mt-2 text-gray-600 inline">
              {props.count} results in {`${props.queryTime}ms`}
              {" "}
            </div>
          )}
          {props.understoodQuery?.fullAddress
            ? (
              <div class="ml-auto mt-2 text-gray-600 inline">
                <IconRadar class="inline mr-1" /> Around "{props.understoodQuery?.fullAddress}"
              </div>
            )
            : ""}
        </div>
      </div>
    </div>
  );
}
