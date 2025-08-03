/// <reference types="@types/google.maps" />
import {Head, IS_BROWSER} from "$fresh/runtime.ts";
import {useEffect, useLayoutEffect} from "preact/hooks";
import {createRef} from "preact";
import {googleLibrarySignal, setGoogleMap, useGoogleMap, useMapLibrary,} from "../routes/map/signals.ts";
import {Easing, Tween} from "npm:@tweenjs/tween.js@25.0.0";

interface MapPanelProps {
  apiKey?: string;
  position?: {
    lat: number;
    lng: number;
  };
  searchResultPosition?: {
    lat: number;
    lng: number;
  };
  zoom?: number;
}

const mapStyles = [
  {
    "featureType": "poi",
    "stylers": [
      { "visibility": "off" },
    ],
  },
  {
    "featureType": "transit",
    "stylers": [
      { "visibility": "off" },
    ],
  },
  {
    "featureType": "water",
    "stylers": [
      { "color": "#91a4c8" },
    ],
  },
  {
    "featureType": "landscape",
    "stylers": [
      { "color": "#ffffff" },
    ],
  },
];

export default function MapPanel(props: MapPanelProps) {
  const mapRef = createRef<HTMLDivElement>();

  const mapLibrary = useMapLibrary();
  const map = useGoogleMap();

  useEffect(() => {
    if (!IS_BROWSER) {
      return;
    }
    Promise.all([
      google.maps.importLibrary("maps"),
      google.maps.importLibrary("marker"),
    ]).then(
      ([mapLibrary, markerLibrary]) => {
        console.log("Google Maps libraries loaded:", mapLibrary, markerLibrary);
        googleLibrarySignal.value = {
          maps: mapLibrary as google.maps.MapsLibrary,
          marker: markerLibrary as google.maps.MarkerLibrary,
        };
      },
    );
  }, []);

  useLayoutEffect(() => {
    if (!mapLibrary || !mapRef.current) {
      return;
    }
    const map = new mapLibrary.Map(mapRef.current, {
      center: props.position, // Default to San Francisco
      zoom: props.zoom,
      mapTypeId: "roadmap",
      mapTypeControl: false,
      fullscreenControl: false,
      styles: mapStyles,
    });
    setGoogleMap(map);

    const updateUrl = () => {
      const center = map.getCenter();
      if (center) {
        const lat = center.lat();
        const lng = center.lng();
        const zoom = map.getZoom();
        const url = new URL(window.location.href);
        url.searchParams.set("lat", lat.toString());
        url.searchParams.set("lng", lng.toString());
        if (zoom) {
          url.searchParams.set("zoom", zoom.toString());
        }
        window.history.pushState({}, "", url.toString());
      }
    };

    map.addListener("dragend", updateUrl);
    map.addListener("zoom_changed", updateUrl);
  }, [mapLibrary]);

  useLayoutEffect(() => {
    if (map) {
      setTimeout(() => {
        if (props.searchResultPosition) {
          console.log("setup animation for camera movement");
          let cameraOptions: google.maps.CameraOptions = {
            tilt: 0,
            heading: 0,
            zoom: props.zoom || 10,
            center: props.position || { lat: 37.7749, lng: -122.4194 },
          };
          const tween = new Tween(cameraOptions)
            .to(
              {
                tilt: 65,
                heading: 90,
                zoom: 16,
                center: props.searchResultPosition,
              },
              5000,
            )
            .easing(Easing.Quadratic.Out)
            .onUpdate((newCamera) => {
              console.log("Easing");
              map.moveCamera(newCamera);
            }).start()
            .onComplete(() => {
            });

          const animate: FrameRequestCallback = (time) => {
            tween.update(time);
            if(tween.isPlaying()){
              requestAnimationFrame(animate);
            }
          };
          requestAnimationFrame(animate);
        }
      }, 1000);
    }
  }, [map]);

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
      <div id="map" class="w-full h-full" ref={mapRef} />
    </div>
  );
}
