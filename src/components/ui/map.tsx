import { useEffect, useRef, ReactNode, createContext, useContext, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { createRoot, Root } from "react-dom/client";
import { cn } from "@/lib/utils";

// Map context to share map instance with children
const MapContext = createContext<maplibregl.Map | null>(null);

export function useMapInstance() {
  const map = useContext(MapContext);
  return map;
}

interface MapProps {
  center: [number, number];
  zoom?: number;
  className?: string;
  children?: ReactNode;
}

export function Map({ center, zoom = 13, className, children }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!mapContainer.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          "osm-tiles": {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors',
          },
        },
        layers: [
          {
            id: "osm-tiles",
            type: "raster",
            source: "osm-tiles",
          },
        ],
      },
      center: center,
      zoom: zoom,
    });

    map.current.on("load", () => {
      setMapReady(true);
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (map.current) {
      map.current.setCenter(center);
      map.current.setZoom(zoom);
    }
  }, [center, zoom]);

  return (
    <MapContext.Provider value={map.current}>
      <div ref={mapContainer} className={cn("w-full h-full rounded-lg overflow-hidden", className)}>
        {mapReady && children}
      </div>
    </MapContext.Provider>
  );
}

interface MapMarkerProps {
  longitude: number;
  latitude: number;
  children?: ReactNode;
}

export function MapMarker({ longitude, latitude, children }: MapMarkerProps) {
  const map = useMapInstance();
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const popupRootRef = useRef<Root | null>(null);

  useEffect(() => {
    if (!map) return;

    // Create marker element
    const el = document.createElement("div");
    el.className = "cursor-pointer";
    
    const markerDot = document.createElement("div");
    markerDot.className = "w-5 h-5 rounded-full bg-primary border-2 border-white shadow-lg hover:scale-110 transition-transform";
    el.appendChild(markerDot);

    // Create popup if children provided
    let popup: maplibregl.Popup | null = null;
    if (children) {
      const popupContainer = document.createElement("div");
      popupContainer.className = "map-popup-content";
      
      // Render React children into popup
      const root = createRoot(popupContainer);
      popupRootRef.current = root;
      root.render(children as React.ReactElement);
      
      popup = new maplibregl.Popup({ 
        offset: 25,
        closeButton: true,
        closeOnClick: false,
      }).setDOMContent(popupContainer);
    }

    markerRef.current = new maplibregl.Marker(el)
      .setLngLat([longitude, latitude])
      .setPopup(popup || undefined)
      .addTo(map);

    popupRef.current = popup;

    return () => {
      markerRef.current?.remove();
      popupRootRef.current?.unmount();
    };
  }, [map, longitude, latitude, children]);

  return null;
}

export function MarkerContent({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("", className)}>{children}</div>;
}

export function MarkerLabel({ children, position = "bottom" }: { children: ReactNode; position?: "top" | "bottom" }) {
  return <div className={cn("marker-label", `marker-label-${position}`)}>{children}</div>;
}

export function MarkerPopup({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("marker-popup", className)}>{children}</div>;
}
