import {InferredFilters} from "./types.ts";
import {breakdownQuery} from "./queryUnderstanding.ts";
import {locationToCoordinates} from "./geocode.ts";
import {AllowedModel} from "./models.ts";

export type SearchInput = InferredFilters & {
    point?: {lat: number, lng: number};
    fullAddress?: string;
}

export const search = async (query: string, model?: AllowedModel): Promise<SearchInput | null> => {
    const understoodQuery = await breakdownQuery(query, model);
    if(!understoodQuery) {
        return null;
    }
    let geom: { lat: number; lng: number; name: string } | undefined;

    if (understoodQuery.location?.place) {
        geom = await locationToCoordinates(
            understoodQuery.location.place,
        );
    }

    return {
        ...understoodQuery,
        point: geom,
        fullAddress: geom?.name,
    };
}