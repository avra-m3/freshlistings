import { JSX } from "preact/jsx-runtime";
import { InferredFilters, MinMaxValue } from "../lib/types.ts";
import IconBed from "https://deno.land/x/tabler_icons_tsx@0.0.7/tsx/bed.tsx";
import IconBathFilled from "https://deno.land/x/tabler_icons_tsx@0.0.7/tsx/bath-filled.tsx";
import IconMapPinFilled from "https://deno.land/x/tabler_icons_tsx@0.0.7/tsx/map-pin-filled.tsx";
import IconBrandCitymapper from "https://deno.land/x/tabler_icons_tsx@0.0.7/tsx/brand-citymapper.tsx";
import IconSparkles from "https://deno.land/x/tabler_icons_tsx@0.0.7/tsx/sparkles.tsx";
import IconTarget from "https://deno.land/x/tabler_icons_tsx@0.0.7/tsx/target.tsx";
import IconCurrencyDollar from "https://deno.land/x/tabler_icons_tsx@0.0.7/tsx/currency-dollar.tsx"

interface FilterPanelProps {
  filters: InferredFilters;
}

export const FilterPanel = ({ filters }: FilterPanelProps) => {
  return (
    <div className="flex flex-wrap gap-2">
      <div className="mt-4 flex flex-wrap gap-2">
        {Object.entries(filters).map(([key, value]) => (
          <Filter
            key={key}
            label={key as keyof InferredFilters}
            value={value}
          />
        ))}
      </div>
    </div>
  );
};

const IconMap: Partial<Record<keyof InferredFilters, JSX.Element>> = {
  intention: <IconTarget class="w-6 h-5 inline" />,
  numBeds: <IconBed class="w-6 h-5 inline" />,
  numBathrooms: <IconBathFilled class="w-6 h-5 inline" />,
  location: <IconMapPinFilled class="w-6 h-5 inline" />,
  keywords: <IconSparkles class="w-6 h-5 inline" />,
  price: <IconCurrencyDollar class="w-6 h-5 inline" />,
};

const minMaxToString = (value: MinMaxValue): string => {
  if (
    value.min !== undefined && value.max !== undefined &&
    value.min !== value.max
  ) {
    return `${value.min} - ${value.max}`;
  } else if (
    value.min !== undefined && value.max !== undefined &&
    value.min === value.max
  ) {
    return `Exactly ${value.min}`;
  } else if (value.min !== undefined) {
    return `${value.min}+`;
  } else if (value.max !== undefined) {
    return `< ${value.max}`;
  }
  return "";
};

const Filter = (
  { label, value }: {
    label: keyof InferredFilters;
    value: InferredFilters[keyof InferredFilters] | string;
  },
) => {
    if (!value || (typeof value === "object" && Object.keys(value).length === 0)) {
        return null;
    }
  if (Array.isArray(value)) {
    return (
      <>
        {value.map((item) => <Filter key={item} label={label} value={item} />)}
      </>
    );
  }
  if (typeof value === "object") {
    if ("min" in value || "max" in value) {
      return (
        <span className="bg-white rounded-xl shadow-xl px-2 py-1 text-lg">
          {IconMap[label]} {minMaxToString(value)}
        </span>
      );
    } else if ("place" in value) {
      if (value.distance?.value) {
        return (
          <span className="bg-white rounded-xl shadow-xl px-2 py-1 text-lg">
            {IconMap[label]}
            {value.distance.value} {value.distance.unit}{" "}
            <IconBrandCitymapper class="w-6 h-5 inline mx-1" />
            {value.place}
          </span>
        );
      } else {
        return (
          <span className="bg-white rounded-xl shadow-xl px-2 py-1 text-lg">
            {IconMap[label]} {value.place}
          </span>
        );
      }
    }
  }
  return (
    <span className="bg-white rounded-xl shadow-xl px-2 py-1 text-lg">
      {IconMap[label]} {value}
    </span>
  );
};
