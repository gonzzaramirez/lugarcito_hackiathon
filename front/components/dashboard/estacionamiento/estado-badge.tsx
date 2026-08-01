"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type EstadoEstacionamiento = "libre" | "ocupado" | "saturado";

/**
 * - Libre: more than 50% of the spots are available.
 * - Saturado: fewer than 25% of the spots are available.
 * - Ocupado: everything in between.
 */
export function getEstado(disponibles: number, lugares: number): EstadoEstacionamiento {
  const proporcion = lugares > 0 ? disponibles / lugares : 0;
  if (proporcion > 0.5) return "libre";
  if (proporcion < 0.25) return "saturado";
  return "ocupado";
}

export const ESTADO_LABELS: Record<EstadoEstacionamiento, string> = {
  libre: "Libre",
  ocupado: "Ocupado",
  saturado: "Saturado",
};

export const ESTADO_STYLES: Record<
  EstadoEstacionamiento,
  { badge: string; dot: string; bar: string }
> = {
  libre: {
    badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    dot: "bg-emerald-500",
    bar: "bg-emerald-500",
  },
  ocupado: {
    badge: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    dot: "bg-amber-500",
    bar: "bg-amber-500",
  },
  saturado: {
    badge: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400",
    dot: "bg-red-500",
    bar: "bg-red-500",
  },
};

interface EstadoBadgeProps {
  disponibles: number;
  lugares: number;
  className?: string;
}

export function EstadoBadge({ disponibles, lugares, className }: EstadoBadgeProps) {
  const estado = getEstado(disponibles, lugares);
  return (
    <Badge variant="outline" className={cn(ESTADO_STYLES[estado].badge, className)}>
      <span className={cn("size-1.5 rounded-full", ESTADO_STYLES[estado].dot)} />
      {ESTADO_LABELS[estado]}
    </Badge>
  );
}
