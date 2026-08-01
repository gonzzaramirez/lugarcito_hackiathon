import type { ParkingStatus } from "@/lib/data/parking-status";

export interface StatusMeta {
  label: string;
  color: string;
}

const STATUS_META: Record<ParkingStatus, StatusMeta> = {
  AVAILABLE: { label: "Disponible", color: "#22C55E" },
  LOW:      { label: "Casi lleno", color: "#EAB308" },
  ORANGE:   { label: "Crítico",   color: "#F97316" },
  FULL:     { label: "Completo",  color: "#EF4444" },
  UNKNOWN:  { label: "Sin info",  color: "#71717A" },
};

export const STATUS_ORDER: ParkingStatus[] = [
  "AVAILABLE",
  "LOW",
  "ORANGE",
  "FULL",
  "UNKNOWN",
];

export function statusMeta(status: ParkingStatus): StatusMeta {
  return STATUS_META[status];
}

/** Deriva el status a partir de los lugares libres. Thresholds: 0=rojo, 1-3=naranja, 4-5=amarillo, 6+=verde. */
export function deriveStatus(available: number | null): ParkingStatus {
  if (available === null) return "UNKNOWN";
  if (available <= 0) return "FULL";
  if (available <= 3) return "ORANGE";
  if (available <= 5) return "LOW";
  return "AVAILABLE";
}
