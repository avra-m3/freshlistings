/// <reference types="@types/google.maps" />
import { Head } from "$fresh/runtime.ts";
import { useEffect, useLayoutEffect } from "preact/hooks";
import { useSignal } from "@preact/signals";
import { createRef } from "preact";
import { IS_BROWSER } from "$fresh/runtime.ts";
import MapOverlay from "./MapOverlay.tsx";

interface MapPanelProps {
  apiKey?: string;
}
export default function MapPanel(props: MapPanelProps) {
  const mapRef = createRef<HTMLDivElement>();
  const mapSignal = useSignal<google.maps.Map | null>(null);
  const mapLibrarySignal = useSignal<google.maps.MapsLibrary | null>(null);
  const markerLibrarySignal = useSignal<google.maps.MarkerLibrary | null>(null);
  useEffect(() => {
    if (!IS_BROWSER) {
      return;
    }
    console.log("MapPanel load event", google.maps.importLibrary);
    Promise.all([google.maps.importLibrary("maps"), google.maps.importLibrary("marker")]).then(
        ([mapLibrary, markerLibrary]) => {
            console.log("Google Maps libraries loaded:", mapLibrary, markerLibrary);
            mapLibrarySignal.value = mapLibrary as google.maps.MapsLibrary;
            markerLibrarySignal.value = markerLibrary as google.maps.MarkerLibrary;
        }
    )
  }, []);

  useLayoutEffect(() => {
    if (!mapLibrarySignal.value || !mapRef.current) {
      return;
    }
    const map = new mapLibrarySignal.value.Map(mapRef.current, {
      center: { lat: 37.7749, lng: -122.4194 }, // Default to San Francisco
      zoom: 12,
      mapTypeId: "roadmap",
    });
    mapSignal.value = map;
  }, [mapLibrarySignal.value]);

  return (
    <div class="w-screen h-screen relative">
      <Head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
            (g=>{var h,a,k,p="The Google Maps JavaScript API",c="google",l="importLibrary",q="__ib__",m=document,b=window;b=b[c]||(b[c]={});var d=b.maps||(b.maps={}),r=new Set,e=new URLSearchParams,u=()=>h||(h=new Promise(async(f,n)=>{await (a=m.createElement("script"));e.set("libraries",[...r]+"");for(k in g)e.set(k.replace(/[A-Z]/g,t=>"_"+t[0].toLowerCase()),g[k]);e.set("callback",c+".maps."+q);a.src=\`https://maps.\${c}apis.com/maps/api/js?\`+e;d[q]=f;a.onerror=()=>h=n(Error(p+" could not load."));a.nonce=m.querySelector("script[nonce]")?.nonce||"";m.head.append(a)}));d[l]?console.warn(p+" only loads once. Ignoring:",g):d[l]=(f,...n)=>r.add(f)&&u().then(()=>d[l](f,...n))})({
                key: "${props.apiKey}",
                v: "weekly",
            })
            `,
          }}
        />
      </Head>
      <MapOverlay
        map={mapSignal.value}
        mapsLibrary={mapLibrarySignal.value}
      />
      <div id="map" class="w-full h-full" ref={mapRef} />
    </div>
  );
}
