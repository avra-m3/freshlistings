/// <reference types="@types/google.maps" />
import { signal, useSignalEffect, useSignal } from "@preact/signals";
import {InferredFilters} from "../../lib/types.ts";

export type GoogleLibraries = {
    maps: google.maps.MapsLibrary | null;
    marker: google.maps.MarkerLibrary | null;
}

export const googleMapSignal = signal<google.maps.Map | null>(null);
export const googleLibrarySignal = signal<GoogleLibraries>({
    maps: null,
    marker: null,
});

const mapZoomLevelSignal = signal<number>(10);
const mapCenterSignal = signal<google.maps.LatLngLiteral | null>(null);
export const mapSearchQuerySignal = signal<InferredFilters | null>(null);


export const useMapLibrary = () => {
    return googleLibrarySignal.value.maps;
}

export const useMarkerLibrary = () => {
    return googleLibrarySignal.value.marker;
}

export const setGoogleMap = (map: google.maps.Map | null) => {
    googleMapSignal.value = map;
};

export const useGoogleMap = () => {
    useSignalEffect(() => {
        if (googleMapSignal.value) {
            googleMapSignal.value.addListener("zoom_changed", () => {
                mapZoomLevelSignal.value = googleMapSignal.value?.getZoom() || 10;
            });
            googleMapSignal.value.addListener("bounds_changed", () => {
                const center = googleMapSignal.value?.getCenter();
                if (center) {
                    mapCenterSignal.value = {
                        lat: center.lat(),
                        lng: center.lng(),
                    };
                }
            });
        } else {
            console.log("Google Map not set");
        }

    });
    return googleMapSignal.value;
};


export const useZoomLevel = () => {
    return mapZoomLevelSignal.value;
}

export const useMapCenter = () => {
    return mapCenterSignal.value;
}

export const useMapIntentionSignal = () => {
    return mapSearchQuerySignal.value;
}

export const useMapSearchKeywordSignal = () => {
    return mapSearchQuerySignal.value?.keywords.join(", ") || "";
}