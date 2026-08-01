import type { ParkingStatus } from "@/lib/data/parking-status";

export interface StatusMeta {
  label: string;
  color: string;
}

const STATUS_META: Record<ParkingStatus, StatusMeta> = {
  AVAILABLE: { label: "Disponible", color: "#22C55E" },
  LOW: { label: "Pocos lugares", color: "#EAB308" },
  FULL: { label: "Completo", color: "#EF4444" },
  UNKNOWN: { label: "Sin información", color: "#71717A" },
};

export const STATUS_ORDER: ParkingStatus[] = [
  "AVAILABLE",
  "LOW",
  "FULL",
  "UNKNOWN",
];

export function statusMeta(status: ParkingStatus): StatusMeta {
  return STATUS_META[status];
}

/** Deriva el status a partir de los lugares libres (espejo del backend). */
export function deriveStatus(available: number | null): ParkingStatus {
  if (available === null) return "UNKNOWN";
  if (available <= 0) return "FULL";
  if (available <= 4) return "LOW";
  return "AVAILABLE";
}
