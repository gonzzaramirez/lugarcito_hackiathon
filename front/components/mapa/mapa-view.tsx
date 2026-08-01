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
  type ParkingStatus,
  type ParkingStatusResponse,
} from "@/lib/data/parking-status";
import { getLiveClient, type WsStatus } from "@/lib/ws/client";
import { AvailabilitySummary, countAvailability } from "./availability-summary";
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
  const [wsStatus, setWsStatus] = useState<WsStatus>("connecting");

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
      // El click en el mapa NO cambia la ubicación: la ubi es siempre la real
      setSelectedSegment(null);
    },
    []
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

  // Auto-localizar al cargar la página: usa la ubicación real del dispositivo.
  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location: [number, number] = [
          position.coords.latitude,
          position.coords.longitude,
        ];
        setUserLocation(location);
        setMapCenter(location);
        void fetchRecommendations(location[0], location[1]);
      },
      () => {
        // Fallback silencioso: se queda en el centro por defecto
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [fetchRecommendations]);

  // Suscripción WebSocket: actualiza disponibilidad y colores en tiempo real
  // sobre el mapa, sin necesidad de refrescar la página.
  useEffect(() => {
    const client = getLiveClient();

    const unsubscribe = client.subscribe((message) => {
      if (message.type !== "estacionamiento.update") return;

      setSegments((prev) =>
        prev.map((segment) => {
          if (segment.id !== message.payload.estacionamientoId) return segment;

          const capacity = segment.capacity ?? 0;
          const available = Math.min(
            Math.max(message.payload.disponibles, 0),
            capacity
          );
          const occupied = capacity - available;

          let status: ParkingStatus;
          if (available <= 0) status = "FULL";
          else if (available <= 3) status = "ORANGE";
          else if (available <= 5) status = "LOW";
          else status = "AVAILABLE";

          return { ...segment, available, occupied, status };
        })
      );
    });

    const unsubStatus = client.subscribeStatus(setWsStatus);

    client.connect();

    return () => {
      unsubscribe();
      unsubStatus();
      client.disconnect();
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
        <header className="flex h-10 shrink-0 items-center justify-center gap-2 border-b border-[#27272A]">
          <span
            className={`size-2 rounded-full ${
              wsStatus === "connected" ? "bg-emerald-400" :
              wsStatus === "offline" ? "bg-red-400" : "bg-amber-400 animate-pulse"
            }`}
            title={wsStatus === "connected" ? "Datos en tiempo real" : "Sin conexión al backend"}
          />
          <h1 className="text-sm font-medium text-[#A1A1AA]">
            {wsStatus === "connected" ? "Estacionamiento" : "Modo offline — iniciá el backend"}
          </h1>
        </header>

        <div className="shrink-0 p-4 pb-3"></div>

        <AvailabilitySummary counts={counts} />

        <div className="relative flex-1">
          <ParkingMap
            center={mapCenter}
            userLocation={userLocation}
            segments={segments}
            bestId={best?.id ?? null}
            selectedId={selectedSegment?.id ?? null}
            locating={locating}
            onMapClick={handleMapClick}
            onSegmentClick={handleSegmentClick}
            onLocate={handleLocate}
          />
          {/* <BottomSheet
            best={best}
            selected={selectedSegment}
            nearby={nearby}
            counts={counts}
            onRoute={handleRoute}
          /> */}
        </div>

        <div className="relative z-[1100] shrink-0" />
      </div>
    </div>
  );
}
