"use client";

import { useMemo, useRef, useState } from "react";
import { Navigation } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { statusMeta } from "./availability";
import type { AvailabilityCounts } from "./availability-summary";
import type { RecommendedSegment } from "@/lib/api/parking-status";
import type { ParkingSegment } from "@/lib/data/parking-status";

export interface NearbyItem {
  id: number;
  street: string | null;
  block: string | null;
  status: ParkingSegment["status"];
  lat: number;
  lon: number;
  distance_m: number;
}

interface BottomSheetProps {
  best: RecommendedSegment | null;
  /** Segment tapped on the map; overrides the recommendation card. */
  selected: ParkingSegment | null;
  nearby: NearbyItem[];
  counts: AvailabilityCounts;
  onRoute: (lat: number, lon: number) => void;
}

const MIN_HEIGHT = 120;
const SNAP_FACTORS = [0, 0.45, 0.8] as const;

function walkTimeMinutes(distanceM: number): number {
  return Math.max(1, Math.round(distanceM / 83));
}

function routeUrl(lat: number, lon: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
}

function routePoint(primary: ParkingSegment | RecommendedSegment): [number, number] {
  if ("coordinates" in primary) {
    const lats = primary.coordinates.map(([lat]) => lat);
    const lons = primary.coordinates.map(([, lon]) => lon);
    return [
      lats.reduce((sum, value) => sum + value, 0) / lats.length,
      lons.reduce((sum, value) => sum + value, 0) / lons.length,
    ];
  }
  return [primary.lat, primary.lon];
}

export function BottomSheet({ best, selected, nearby, counts, onRoute }: BottomSheetProps) {
  const snapHeights = useMemo(() => {
    const vh = typeof window === "undefined" ? 800 : window.innerHeight;
    return SNAP_FACTORS.map((factor) =>
      factor === 0 ? 140 : Math.round(vh * factor)
    );
  }, []);

  const [height, setHeight] = useState(snapHeights[0]);
  const [expanded, setExpanded] = useState(false);
  const dragStartY = useRef<number | null>(null);
  const dragBaseHeight = useRef(height);

  const snapTo = (target: number) => {
    const nearest = snapHeights.reduce((acc, value, index) => {
      const diff = Math.abs(value - target);
      return diff < Math.abs(acc.value - target) ? { value, index } : acc;
    }, { value: snapHeights[0], index: 0 });
    setHeight(nearest.value);
    setExpanded(nearest.index > 0);
  };

  const handlePointerDown = (event: React.PointerEvent) => {
    dragStartY.current = event.clientY;
    dragBaseHeight.current = height;
  };

  const handlePointerMove = (event: React.PointerEvent) => {
    if (dragStartY.current === null) return;
    const delta = dragStartY.current - event.clientY;
    const max = Math.round(window.innerHeight * 0.92);
    setHeight(Math.min(max, Math.max(MIN_HEIGHT, dragBaseHeight.current + delta)));
  };

  const handlePointerUp = () => {
    if (dragStartY.current === null) return;
    snapTo(height);
    dragStartY.current = null;
  };

  const primary = selected ?? best;
  const [routeLat, routeLon] = primary ? routePoint(primary) : [0, 0];

  return (
    <div
      className="absolute inset-x-0 bottom-0 z-[1000] flex flex-col rounded-t-2xl border-t border-[#27272A] bg-[#18181B] shadow-[0_-8px_30px_rgba(0,0,0,0.5)]"
      style={{ height }}
    >
      <div
        className="shrink-0 touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div className="flex justify-center pt-2.5 pb-2">
          <div className="h-1 w-10 rounded-full bg-[#3F3F46]" />
        </div>

        {primary ? (
          <div className="flex items-center gap-3 px-4 pb-3.5">
            <div className="min-w-0 flex-1">
              {selected && best && selected.id !== best.id && (
                <span className="text-[11px] text-[#A1A1AA]">
                  Cuadra seleccionada
                </span>
              )}
              {!selected && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#22C55E]/15 px-2 py-0.5 text-[11px] font-medium text-[#22C55E]">
                  Mejor opción
                </span>
              )}
              <p className="mt-1 truncate text-sm font-semibold text-[#FAFAFA]">
                {primary.street ?? `Cuadra #${primary.id}`}
                {primary.block ? ` · ${primary.block}` : ""}
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-[#A1A1AA]">
                <span
                  className="inline-block size-2 rounded-full"
                  style={{ background: statusMeta(primary.status).color }}
                />
                {statusMeta(primary.status).label}
                {primary.available !== null &&
                  ` · ${primary.available} lugares${primary.capacity !== null ? ` de ${primary.capacity}` : ""}`}
                {"distance_m" in primary &&
                  ` · ${Math.round(primary.distance_m)} m · ${walkTimeMinutes(primary.distance_m)} min a pie`}
              </p>
            </div>
            <a
              href={routeUrl(routeLat, routeLon)}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ variant: "default", size: "default" }),
                "shrink-0 bg-[#22C55E] text-[#09090B] hover:bg-[#22C55E]/80"
              )}
              onClick={(event) => {
                event.preventDefault();
                onRoute(routeLat, routeLon);
              }}
            >
              <Navigation />
              {selected ? "Ir hasta aquí" : "Ver ruta"}
            </a>
          </div>
        ) : (
          <p className="px-4 pb-4 text-sm text-[#A1A1AA]">
            Toca el mapa o usá tu ubicación para ver la mejor opción.
          </p>
        )}
      </div>

      {expanded && (
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <section className="mb-5">
            <p className="mb-2.5 text-xs font-medium tracking-wide text-[#A1A1AA] uppercase">
              Disponibilidad
            </p>
            <div className="grid grid-cols-4 gap-2">
              {(
                [
                  { status: "AVAILABLE", title: "Disponible", value: counts.available },
                  { status: "LOW", title: "Pocos lugares", value: counts.low },
                  { status: "FULL", title: "Completo", value: counts.full },
                  { status: "UNKNOWN", title: "Sin información", value: counts.unknown },
                ] as const
              ).map((item) => (
                <div
                  key={item.status}
                  className="flex flex-col gap-1 rounded-lg border border-[#27272A] bg-[#09090B] p-2.5"
                >
                  <span
                    className="size-2.5 rounded-full"
                    style={{ background: statusMeta(item.status).color }}
                  />
                  <span className="text-lg leading-none font-bold tabular-nums text-[#FAFAFA]">
                    {item.value}
                  </span>
                  <span className="text-[11px] leading-tight text-[#A1A1AA]">{item.title}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <p className="mb-2.5 text-xs font-medium tracking-wide text-[#A1A1AA] uppercase">
              Estacionamientos cercanos
            </p>
            {nearby.length === 0 ? (
              <p className="text-sm text-[#A1A1AA]">Sin datos cerca de tu ubicación.</p>
            ) : (
              <ul className="flex flex-col">
                {nearby.map((item) => {
                  const meta = statusMeta(item.status);
                  return (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-3 border-b border-[#27272A]/60 py-2.5 last:border-b-0"
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span
                          className="size-2.5 shrink-0 rounded-full"
                          style={{ background: meta.color }}
                        />
                        <span className="truncate text-sm text-[#FAFAFA]">
                          {item.street ?? `Cuadra #${item.id}`}
                        </span>
                      </div>
                      <span className="shrink-0 text-xs text-[#A1A1AA] tabular-nums">
                        {Math.round(item.distance_m)} m
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
