/// <reference types="@types/google.maps" />
import { useEffect } from "preact/hooks";
import { useSignal, useSignalEffect } from "@preact/signals";
import { cellToBoundary, cellToLatLng } from "h3-js";
import { IS_BROWSER } from "$fresh/runtime.ts";
import { MapTile } from "../routes/map/cells/index.tsx";
import {
  useGoogleMap,
  useMapCenter,
  useMapLibrary,
  useMapSearchKeywordSignal,
  useZoomLevel
} from "../routes/map/signals.ts";

export default function MapOverlay() {
  const mapLibrary = useMapLibrary();
  const map = useGoogleMap();

  const hexagons = useSignal<google.maps.Polygon[]>([]);

  const currentZoomLevel = useZoomLevel();
  const currentCenter = useMapCenter();
  const keyword = useMapSearchKeywordSignal();

  const debounceTimeout = useSignal<number | null>(null);
  const currentWindow = useSignal<google.maps.InfoWindow | null>(null);

  const clearHexagons = () => {
    const hexagonsBefore = [...hexagons.value];
    hexagons.value = [];
    return () => {
      hexagonsBefore.forEach((polygon) => {
        polygon.setMap(null);
      });
    };
  };

  const drawTiles = (tiles: MapTile[]) => {
    if (!mapLibrary || !IS_BROWSER) {
      return;
    }
    const newHexagons: google.maps.Polygon[] = [];
    tiles.forEach((tile) => {
      try {
        const boundary = cellToBoundary(tile.h3Index, true);
        const paths = boundary.map(([lng, lat]) => ({ lat, lng }));

        // Create Google Maps polygon
        const polygon = new mapLibrary.Polygon({
          paths,
          // strokeColor: tile.strokeColor,
          // strokeOpacity: 0.8,
          strokeWeight: 0,
          fillColor: tile.fillColour,
          fillOpacity: tile.fillOpacity,
          map: map,
          clickable: true,
        });

        // Add click handler to show H3 index
        polygon.addListener("click", () => {
          if (currentWindow.value) {
            currentWindow.value.close();
          }
          const center = cellToLatLng(tile.h3Index);
          currentWindow.value = new mapLibrary.InfoWindow({
            content: `<div>
                            <strong>H3 Index:</strong> ${tile.h3Index}<br>
                            <strong>Data:</strong> ${tile.data}
                        </div>`,
            position: { lat: center[0], lng: center[1] },
          });
          currentWindow.value.open(map);
        });

        newHexagons.push(polygon);
      } catch (error) {
        console.warn("Error creating hexagon for tile:", tile, error);
      }
    });
    hexagons.value = newHexagons;
  };

  // Generate and render H3 hexagons for the current map viewport
  const renderHexagons = () => {
    if (!map || !mapLibrary || !IS_BROWSER) {
      return;
    }

    const afterRender = clearHexagons();

    const bounds = map.getBounds();
    const zoom = map.getZoom();

    if (!bounds || !zoom) return;

    // Get the cells from /map/cells endpoint
    const topLeft = bounds.getNorthEast();
    const bottomRight = bounds.getSouthWest();

    const params = new URLSearchParams({
      topLeft: `${topLeft.lat()},${topLeft.lng()}`,
      bottomRight: `${bottomRight.lat()},${bottomRight.lng()}`,
      zoom: zoom.toString(),
      keywords: keyword
    });

    const url = `/map/cells?${params.toString()}`;
    console.log("Fetching hexagons from:", url);

    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        if (!data || !data.tiles || data.tiles.length === 0) {
          console.warn("No hexagons found in response");
          return;
        }
        console.log("Hexagons fetched:", data.tiles);
        drawTiles(data.tiles);
      })
      .catch((error) => {
        console.error("Error fetching hexagons:", error);
      }).finally(() => {
        afterRender();
      });
  };

  // Set up map event listeners
  useEffect(() => {
    if (!map || typeof window === "undefined" || !currentZoomLevel || !currentCenter) return;

    const debouncedRenderHexagons = () => {
      if (debounceTimeout.value) {
        clearTimeout(debounceTimeout.value);
      }
      debounceTimeout.value = setTimeout(() => {
        renderHexagons();
      }, 500);
    };

    debouncedRenderHexagons();

    // Cleanup function
    return () => {
      if (debounceTimeout.value) {
        clearTimeout(debounceTimeout.value);
        debounceTimeout.value = null;
      }
    };
  }, [map, currentZoomLevel, currentCenter]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeout.value) {
        clearTimeout(debounceTimeout.value);
      }
      clearHexagons()();
    };
  }, []);

  return null; // This component doesn't render any JSX, it only manages map overlays
}
