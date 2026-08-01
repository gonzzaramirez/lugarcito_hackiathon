"use client";

import { useEffect } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  ZoomControl,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { Loader2, Navigation } from "lucide-react";
import "leaflet/dist/leaflet.css";

import { Button } from "@/components/ui/button";
import { statusMeta } from "./availability";
import { createUserIcon } from "./leaflet-icons";
import type { ParkingSegment } from "@/lib/data/parking-status";

interface ParkingMapProps {
  center: [number, number];
  userLocation: [number, number] | null;
  segments: ParkingSegment[];
  /** Segment highlighted as the best recommendation (halo). */
  bestId: number | null;
  /** Segment selected by the user (thicker stroke). */
  selectedId: number | null;
  locating: boolean;
  onMapClick: (lat: number, lon: number) => void;
  onSegmentClick: (segment: ParkingSegment) => void;
  onLocate: () => void;
}

function MapController({ center }: { center: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);

  return null;
}

function MapClickHandler({ onClick }: { onClick: (lat: number, lon: number) => void }) {
  useMapEvents({
    click: (event) => onClick(event.latlng.lat, event.latlng.lng),
  });

  return null;
}

export function ParkingMap({
  center,
  userLocation,
  segments,
  bestId,
  selectedId,
  locating,
  onMapClick,
  onSegmentClick,
  onLocate,
}: ParkingMapProps) {
  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={center}
        zoom={16}
        zoomControl={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; CARTO'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        <ZoomControl position="topleft" />
        <MapController center={center} />
        <MapClickHandler onClick={onMapClick} />

        {segments.map((segment) => {
          const { color } = statusMeta(segment.status);
          const isBest = segment.id === bestId;
          const isSelected = segment.id === selectedId;
          const weight = isSelected ? 8 : 5;

          return (
            <div key={segment.id}>
              {isBest && (
                <Polyline
                  positions={segment.coordinates}
                  pathOptions={{
                    color,
                    weight: 10,
                    opacity: 0.25,
                    lineCap: "round",
                    lineJoin: "round",
                  }}
                />
              )}
              <Polyline
                positions={segment.coordinates}
                pathOptions={{
                  color,
                  weight,
                  opacity: 0.95,
                  lineCap: "round",
                  lineJoin: "round",
                }}
                eventHandlers={{
                  click: (event) => {
                    event.originalEvent.stopPropagation();
                    onSegmentClick(segment);
                  },
                }}
              />
            </div>
          );
        })}

        {userLocation && (
          <Marker position={userLocation} icon={createUserIcon()} />
        )}
      </MapContainer>

      <Button
        type="button"
        size="icon"
        variant="secondary"
        onClick={onLocate}
        disabled={locating}
        title="Usar mi ubicación"
        className="absolute right-4 bottom-40 z-[1000] size-11 rounded-full shadow-lg"
      >
        {locating ? (
          <Loader2 className="size-5 animate-spin" />
        ) : (
          <Navigation className="size-5" />
        )}
      </Button>
    </div>
  );
}
