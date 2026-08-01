"use client";

import { statusMeta } from "./availability";
import type { ParkingSegment, ParkingStatus } from "@/lib/data/parking-status";

export interface AvailabilityCounts {
  available: number;
  low: number;
  orange: number;
  full: number;
  unknown: number;
}

export function countAvailability(segments: ParkingSegment[]): AvailabilityCounts {
  const counts: AvailabilityCounts = { available: 0, low: 0, orange: 0, full: 0, unknown: 0 };
  for (const segment of segments) {
    if (segment.status === "AVAILABLE") counts.available += 1;
    else if (segment.status === "LOW") counts.low += 1;
    else if (segment.status === "ORANGE") counts.orange += 1;
    else if (segment.status === "FULL") counts.full += 1;
    else counts.unknown += 1;
  }
  return counts;
}

const ITEMS: { key: keyof AvailabilityCounts; label: string; status: ParkingStatus }[] = [
  { key: "available", label: "Libre",   status: "AVAILABLE" },
  { key: "low",      label: "Casi",    status: "LOW" },
  { key: "orange",   label: "Crítico", status: "ORANGE" },
  { key: "full",     label: "Lleno",   status: "FULL" },
  { key: "unknown",  label: "S/D",     status: "UNKNOWN" },
];

export function AvailabilitySummary({ counts }: { counts: AvailabilityCounts }) {
  return (
    <div className="mx-4 mb-3 shrink-0 rounded-xl border border-[#27272A] bg-[#18181B] p-3">
      <p className="mb-2.5 text-xs font-medium tracking-wide text-[#A1A1AA] uppercase">
        Disponibilidad
      </p>
      <div className="grid grid-cols-5 gap-1">
        {ITEMS.map((item) => (
          <div key={item.key} className="flex flex-col items-center gap-1">
            <span
              className="size-2.5 rounded-full"
              style={{ background: statusMeta(item.status).color }}
            />
            <span className="text-lg leading-none font-bold tabular-nums text-[#FAFAFA]">
              {counts[item.key]}
            </span>
            <span className="text-[11px] text-center leading-tight text-[#A1A1AA]">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
