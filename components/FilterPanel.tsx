import { JSX } from "preact/jsx-runtime";
import {InferredFilters} from "../lib/types.ts";
import IconBed from "https://deno.land/x/tabler_icons_tsx@0.0.7/tsx/bed.tsx"
import IconBathFilled from "https://deno.land/x/tabler_icons_tsx@0.0.7/tsx/bath-filled.tsx"
import IconMapPinFilled from "https://deno.land/x/tabler_icons_tsx@0.0.7/tsx/map-pin-filled.tsx"
import IconBrandCitymapper from "https://deno.land/x/tabler_icons_tsx@0.0.7/tsx/brand-citymapper.tsx"
import IconSparkles from "https://deno.land/x/tabler_icons_tsx@0.0.7/tsx/sparkles.tsx"
import IconTarget from "https://deno.land/x/tabler_icons_tsx@0.0.7/tsx/target.tsx"
interface FilterPanelProps {
    filters: InferredFilters
}

export const FilterPanel = ({ filters }: FilterPanelProps) => {
    return (
        <div className="flex flex-wrap gap-2">
            <div className="mt-4 flex flex-wrap gap-2">
                {Object.entries(filters).map(([key, value]) => (
                    <Filter key={key} label={key as keyof InferredFilters} value={value} />
                ))}
            </div>
        </div>
    );
}

const IconMap: Partial<Record<keyof InferredFilters, JSX.Element>> = {
    intention: <IconTarget class="w-6 h-5 inline" />,
    numBeds: <IconBed class="w-6 h-5 inline" />,
    numBath: <IconBathFilled class="w-6 h-5 inline" />,
    location: <IconMapPinFilled class="w-6 h-5 inline" />,
    distanceToLocation: <IconBrandCitymapper class="w-6 h-5 inline" />,
    keywords: <IconSparkles class="w-6 h-5 inline" />,

}

const Filter = ({ label, value }: { label: keyof InferredFilters; value: string | string[] | number }) => {
    if( Array.isArray(value)) {
        return <>
            {value.map((item) => <Filter key={item} label={label} value={item}/>)}
            </>;
    }
    return (
        <span className="bg-gray-200 px-2 py-1 rounded">
            {IconMap[label]} {value}
        </span>
    );
}