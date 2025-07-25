/// <reference types="@types/google.maps" />
import {useEffect} from "preact/hooks";
import {useSignal} from "@preact/signals";
import {cellToBoundary, edgeLength, getHexagonEdgeLengthAvg, latLngToCell, polygonToCells, UNITS} from "h3-js";
import { IS_BROWSER } from "$fresh/runtime.ts";

interface MapOverlayProps {
  mapsLibrary: google.maps.MapsLibrary | null;
  map: google.maps.Map | null;
}

const getH3Resolution = (zoomLevel: number) => {
  // Map Google Maps zoom levels to H3 resolutions
  // H3 resolution ranges from 0 (largest hexagons) to 15 (smallest)
  if (zoomLevel <= 3) return 1;
  if (zoomLevel <= 5) return 2;
  if (zoomLevel <= 7) return 3;
  if (zoomLevel <= 9) return 4;
  if (zoomLevel <= 11) return 6;
  if (zoomLevel <= 13) return 8;
  if (zoomLevel <= 15) return 9;
  if (zoomLevel <= 17) return 10;
  return 8;
};

export default function MapOverlay({map, mapsLibrary}: MapOverlayProps) {
  const hexagons = useSignal<google.maps.Polygon[]>([]);
  const currentZoomLevel = useSignal<number>(10);
  const debounceTimeout = useSignal<number | null>(null);

  // Clear existing hexagons from the map
  const clearHexagons = () => {
    hexagons.value.forEach((polygon) => {
      polygon.setMap(null);
    });
    hexagons.value = [];
  };

  // Generate and render H3 hexagons for the current map viewport
  const renderHexagons = () => {
    if (!map || !mapsLibrary || !IS_BROWSER) {
      return;
    }

    clearHexagons();

    const bounds = map.getBounds();
    const zoom = map.getZoom();

    if (!bounds || !zoom) return;

    currentZoomLevel.value = zoom;
    const h3Resolution = getH3Resolution(zoom);

    const sizeAsRads = getHexagonEdgeLengthAvg(h3Resolution, UNITS.km)/6371
    const sizeAsDeg = sizeAsRads * (180 / Math.PI);
    const margin = sizeAsDeg*2

    const topLeft = bounds.getNorthEast();
    const bottomRight = bounds.getSouthWest();


    const boundingPolygon = [
        [topLeft.lat() + margin, topLeft.lng() + margin],
        [topLeft.lat() + margin, bottomRight.lng() - margin],
        [bottomRight.lat() - margin, bottomRight.lng() - margin],
        [bottomRight.lat() - margin, topLeft.lng() + margin],
    ]




    const hexagonIndices = polygonToCells(boundingPolygon, h3Resolution);
    const newHexagons: google.maps.Polygon[] = [];

    hexagonIndices.forEach((h3Index) => {
      try {

        const boundary = cellToBoundary(h3Index, true);

        const paths = boundary.map(([lng, lat]) => ({ lat, lng }));

        // Create Google Maps polygon
        const polygon = new google.maps.Polygon({
          paths,
          strokeColor: "#4285F4",
          strokeOpacity: 0.8,
          strokeWeight: 1,
          fillColor: "#4285F4",
          fillOpacity: 0.15,
          map: map,
          clickable: true,
        });

        // Add click handler to show H3 index
        polygon.addListener("click", () => {
          const infoWindow = new google.maps.InfoWindow({
            content: `<div>
                            <strong>H3 Index:</strong> ${h3Index}<br>
                            <strong>Resolution:</strong> ${h3Resolution}
                        </div>`,
            position: { lat: boundary[0][1], lng: boundary[0][0] },
          });
          infoWindow.open(map);
        });

        newHexagons.push(polygon);
      } catch (error) {
        console.warn("Error creating hexagon for H3 index:", h3Index, error);
      }
    });

    hexagons.value = newHexagons;
  };

  // Set up map event listeners
  useEffect(() => {
    if (!map || typeof window === "undefined") return;
    console.log("MapOverlay: Initializing hexagon rendering");

    // Initial render
    renderHexagons();

    // Re-render hexagons when map view changes
    const zoomListener = (map.addListener as (typeof map)["addListener"])("zoom_changed", renderHexagons);
    const boundsListener = (map.addListener as (typeof map)["addListener"])("bounds_changed", () => {
      // Clear existing timeout to debounce bounds_changed events
      if (debounceTimeout.value) {
        clearTimeout(debounceTimeout.value);
      }
      // Set new timeout for debounced rendering
      debounceTimeout.value = setTimeout(() => {
        renderHexagons();
        debounceTimeout.value = null;
      }, 300);
    });

    // Cleanup function
    return () => {
      if (debounceTimeout.value) {
        clearTimeout(debounceTimeout.value);
        debounceTimeout.value = null;
      }
      google.maps.event.removeListener(zoomListener);
      google.maps.event.removeListener(boundsListener);
      clearHexagons();
    };
  }, [map]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeout.value) {
        clearTimeout(debounceTimeout.value);
      }
      clearHexagons();
    };
  }, []);

  return null; // This component doesn't render any JSX, it only manages map overlays
}
