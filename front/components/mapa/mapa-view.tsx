"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, LocateFixed, Menu, Search, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getParkingStatus,
  getRecommendations,
  haversineDistance,
  segmentCentroid,
} from "@/lib/api/parking-status";
import {
  CORRIENTES_CENTER,
  type ParkingSegment,
  type ParkingStatusResponse,
} from "@/lib/data/parking-status";
import { AvailabilitySummary, countAvailability } from "./availability-summary";
import { BottomNav } from "./bottom-nav";
import { BottomSheet, type NearbyItem } from "./bottom-sheet";

const ParkingMap = dynamic(() => import("./parking-map").then((m) => m.ParkingMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <p className="text-sm text-[#A1A1AA]">Cargando mapa...</p>
    </div>
  ),
});

// Pesos por defecto de la función de utilidad (porcentajes).
// TODO(frontend): exponerlos en la UI cuando existan los filtros.
const WEIGHT_DISTANCE = 50;
const WEIGHT_LUGARES = 30;
const WEIGHT_GARAGE = 20;
const MAX_RADIUS = 1000;
const NEARBY_LIMIT = 5;

export function MapaView() {
  const [segments, setSegments] = useState<ParkingSegment[]>([]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(CORRIENTES_CENTER);
  const [results, setResults] = useState<Awaited<ReturnType<typeof getRecommendations>>["results"]>([]);
  const [selectedSegment, setSelectedSegment] = useState<ParkingSegment | null>(null);
  const [locating, setLocating] = useState(false);

  const fetchRecommendations = useCallback(async (lat: number, lon: number) => {
    try {
      const data = await getRecommendations({
        lat,
        lon,
        weight_distance: WEIGHT_DISTANCE,
        weight_lugares: WEIGHT_LUGARES,
        weight_garage: WEIGHT_GARAGE,
        max_radius: MAX_RADIUS,
      });
      setResults(data.results);
    } catch (err) {
      console.warn("Error al obtener recomendaciones:", err);
      setResults([]);
    }
  }, []);

  const handleMapClick = useCallback(
    (lat: number, lon: number) => {
      setSelectedSegment(null);
      setUserLocation([lat, lon]);
      setMapCenter([lat, lon]);
      void fetchRecommendations(lat, lon);
    },
    [fetchRecommendations]
  );

  const handleSegmentClick = useCallback((segment: ParkingSegment) => {
    setSelectedSegment(segment);
  }, []);

  const handleLocate = useCallback(() => {
    setLocating(true);

    if (!navigator.geolocation) {
      setLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location: [number, number] = [
          position.coords.latitude,
          position.coords.longitude,
        ];
        setSelectedSegment(null);
        setUserLocation(location);
        setMapCenter(location);
        setLocating(false);
        void fetchRecommendations(location[0], location[1]);
      },
      (err) => {
        console.warn("Geolocalización falló, usando centro de Corrientes:", err.message);
        setSelectedSegment(null);
        setUserLocation(CORRIENTES_CENTER);
        setMapCenter(CORRIENTES_CENTER);
        setLocating(false);
        void fetchRecommendations(CORRIENTES_CENTER[0], CORRIENTES_CENTER[1]);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [fetchRecommendations]);

  const handleRoute = useCallback((lat: number, lon: number) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadParkingStatus() {
      try {
        const data: ParkingStatusResponse = await getParkingStatus();
        if (!cancelled) {
          setSegments(data.segments);
        }
      } catch (err) {
        console.warn("Error al cargar el estado de estacionamiento:", err);
      }
    }

    void loadParkingStatus();
    return () => {
      cancelled = true;
    };
  }, []);

  const counts = useMemo(() => countAvailability(segments), [segments]);

  const nearby = useMemo<NearbyItem[]>(() => {
    if (!userLocation) return [];
    return segments
      .map((segment) => {
        const [lat, lon] = segmentCentroid(segment);
        return {
          id: segment.id,
          street: segment.street,
          block: segment.block,
          status: segment.status,
          lat,
          lon,
          distance_m: haversineDistance(userLocation[0], userLocation[1], lat, lon),
        };
      })
      .filter((item) => item.distance_m <= MAX_RADIUS)
      .sort((a, b) => a.distance_m - b.distance_m)
      .slice(0, NEARBY_LIMIT);
  }, [segments, userLocation]);

  const best = results[0] ?? null;

  return (
    <div className="h-dvh bg-[#09090B] text-[#FAFAFA]">
      <div className="relative mx-auto flex h-full w-full max-w-[430px] flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-[#27272A] px-2">
          <Button type="button" variant="ghost" size="icon" aria-label="Menú">
            <Menu className="size-5" />
          </Button>
          <h1 className="text-base font-semibold">Estacionamiento</h1>
          <Button type="button" variant="ghost" size="icon" aria-label="Filtros">
            <SlidersHorizontal className="size-5" />
          </Button>
        </header>

        <div className="shrink-0 p-4 pb-3">
          <div className="relative">
            <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[#A1A1AA]" />
            <Input
              type="search"
              placeholder="¿A dónde vas?"
              className="h-11 rounded-xl border-[#27272A] bg-[#18181B] pr-12 pl-10 text-[#FAFAFA] placeholder:text-[#A1A1AA] [&::-webkit-search-cancel-button]:hidden"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={handleLocate}
              disabled={locating}
              aria-label="Usar mi ubicación"
              className="absolute top-1/2 right-1.5 -translate-y-1/2 text-[#3B82F6] hover:bg-[#27272A] hover:text-[#3B82F6]"
            >
              {locating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <LocateFixed className="size-4" />
              )}
            </Button>
          </div>
        </div>

        <AvailabilitySummary counts={counts} />

        <div className="relative flex-1">
          <ParkingMap
            center={mapCenter}
            userLocation={userLocation}
            segments={segments}
            bestId={best?.id ?? null}
            selectedId={selectedSegment?.id ?? null}
            maxRadius={MAX_RADIUS}
            locating={locating}
            onMapClick={handleMapClick}
            onSegmentClick={handleSegmentClick}
            onLocate={handleLocate}
          />
          <BottomSheet
            best={best}
            selected={selectedSegment}
            nearby={nearby}
            counts={counts}
            onRoute={handleRoute}
          />
        </div>

        <div className="relative z-[1100] shrink-0">
          <BottomNav />
        </div>
      </div>
    </div>
  );
}
