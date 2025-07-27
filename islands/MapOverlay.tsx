/// <reference types="@types/google.maps" />
import { useEffect, useMemo } from "preact/hooks";
import { useSignal, useSignalEffect } from "@preact/signals";
import { cellToBoundary, cellToLatLng } from "h3-js";
import { IS_BROWSER } from "$fresh/runtime.ts";
import { MapTile } from "../routes/map/cells/index.tsx";
import {
  useGoogleMap,
  useMapCenter,
  useMapLibrary,
  useMapSearchKeywordSignal,
  useZoomLevel,
} from "../routes/map/signals.ts";

export default function MapOverlay() {
  const mapLibrary = useMapLibrary();
  const map = useGoogleMap();

  const cleanupItems = useSignal<(google.maps.Polygon | google.maps.OverlayView)[]>([]);

  const currentZoomLevel = useZoomLevel();
  const currentCenter = useMapCenter();
  const keyword = useMapSearchKeywordSignal();

  const debounceTimeout = useSignal<number | null>(null);
  const currentWindow = useSignal<google.maps.InfoWindow | null>(null);

  const MapTextOverlay = useMapTextOverlay();

  const clearHexagons = () => {
    const hexagonsBefore = [...cleanupItems.value];
    cleanupItems.value = [];
    return () => {
      hexagonsBefore.forEach((polygon) => {
        polygon.setMap(null);
      });
    };
  };

  const drawTiles = (tiles: MapTile[]) => {
    if (!mapLibrary || !map || !IS_BROWSER || !MapTextOverlay) {
      return;
    }
    const newHexagons: (google.maps.Polygon | google.maps.OverlayView)[] = [];
    tiles.forEach((tile) => {
      try {
        const center = cellToLatLng(tile.h3Index);
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
          currentWindow.value = new mapLibrary.InfoWindow({
            content: `<div id="content" class="bg-white p-2 rounded shadow-lg">
                            <strong>H3 Index:</strong> ${tile.h3Index}<br>
                            <strong>Data:</strong> ${tile.data}
                        </div>`,
            position: { lat: center[0], lng: center[1] },
          });
          currentWindow.value.open(map);
        });

        if(tile.fillOpacity > 0.4) {
          const textOverlay = new MapTextOverlay(
              `${tile.number}`,
              {lat: center[0], lng: center[1]},
              map,
          );
          newHexagons.push(textOverlay);
        }

        polygon.addListener("mouseover", () => {
          polygon.setOptions({
            strokeColor: "#825ced", // Highlight color on hover
            strokeWeight: 2,
          });
        });

        polygon.addListener("mouseout", () => {
          polygon.setOptions({
            strokeColor: tile.fillColour, // Reset to original color
            strokeWeight: 0,
          });
        });

        newHexagons.push(polygon);
      } catch (error) {
        console.warn("Error creating hexagon for tile:", tile, error);
      }
    });
    cleanupItems.value = newHexagons;
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
      keywords: keyword,
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
    if (
      !map || typeof window === "undefined" || !currentZoomLevel ||
      !currentCenter
    ) return;

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
    if (map) {
      map?.addListener("click", () => {
        if (currentWindow.value) {
          currentWindow.value.close();
        }
      });
    }

    return () => {
      if (debounceTimeout.value) {
        clearTimeout(debounceTimeout.value);
      }
      clearHexagons()();
    };
  }, [map]);

  return null; // This component doesn't render any JSX, it only manages map overlays
}

const useMapTextOverlay = () => {
  const mapLibrary = useMapLibrary();

  return useMemo(() => {
    if(!mapLibrary) return null;

    class MapTextOverlay extends mapLibrary.OverlayView {
      private text: string;
      private position: google.maps.LatLngLiteral;
      private map: google.maps.Map;
      private div: HTMLDivElement | null = null;

      constructor(
          text: string,
          position: google.maps.LatLngLiteral,
          map: google.maps.Map,
      ) {
        super();
        this.text = text;
        this.position = position;
        this.map = map;
        this.setMap(map);
      }

      override onAdd() {
        const div = document.createElement("div");
        div.className = `absolute -translate-x-1/2 font-bold 
      shadow-lg text-xl bg-white rounded-lg p-1 opacity-60 text-purple-700`;
        div.textContent = this.text;

        const overlayLayer = this.getPanes()?.overlayLayer;
        if (overlayLayer) {
          overlayLayer.appendChild(div);
          this.div = div;
        }
      }

      override draw() {
        if (!this.div) return;

        const projection = this.getProjection();
        if (!projection) return;

        const point = projection.fromLatLngToDivPixel(
            new google.maps.LatLng(this.position.lat, this.position.lng),
        );

        if (!point) return;

        this.div.style.left = `${point.x}px`;
        this.div.style.top = `${point.y}px`;
      }

      override onRemove() {
        if (this.div && this.div.parentNode) {
          this.div.parentNode.removeChild(this.div);
          this.div = null;
        }
      }
    }
    return MapTextOverlay;
  }, [mapLibrary])



};
