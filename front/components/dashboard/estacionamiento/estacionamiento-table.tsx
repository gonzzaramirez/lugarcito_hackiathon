"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Estacionamiento } from "@/lib/data/estacionamientos";
import { cn } from "@/lib/utils";

import { ESTADO_STYLES, EstadoBadge, getEstado } from "./estado-badge";

interface EstacionamientoTableProps {
  estacionamientos: Estacionamiento[];
  /** Ids of lots whose availability changed recently (highlighted rows). */
  updatedIds?: Set<number>;
}

export function EstacionamientoTable({
  estacionamientos,
  updatedIds,
}: EstacionamientoTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Calle</TableHead>
          <TableHead>Altura</TableHead>
          <TableHead className="text-right">Disponibles</TableHead>
          <TableHead className="text-right">Garages</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="w-48">Ocupación</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {estacionamientos.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
              Sin resultados para el filtro aplicado.
            </TableCell>
          </TableRow>
        ) : (
          estacionamientos.map((estacionamiento) => {
            const estado = getEstado(
              estacionamiento.disponibles,
              estacionamiento.lugares
            );
            const wasUpdated = updatedIds?.has(estacionamiento.id) ?? false;
            return (
              <TableRow
                key={estacionamiento.id}
                className={cn(wasUpdated && "animate-row-flash")}
              >
                <TableCell className="font-medium">{estacionamiento.calle}</TableCell>
                <TableCell className="tabular-nums">{estacionamiento.altura}</TableCell>
                <TableCell className="text-right">
                  <span className="text-base font-semibold tabular-nums">
                    {estacionamiento.disponibles}
                  </span>
                  <span className="ml-1 text-xs text-muted-foreground">
                    de {estacionamiento.lugares}
                  </span>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {estacionamiento.garages}
                </TableCell>
                <TableCell>
                  <EstadoBadge
                    disponibles={estacionamiento.disponibles}
                    lugares={estacionamiento.lugares}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn("h-full rounded-full", ESTADO_STYLES[estado].bar)}
                        style={{ width: `${estacionamiento.saturacion}%` }}
                      />
                    </div>
                    <span className="text-sm tabular-nums text-muted-foreground">
                      {estacionamiento.saturacion}%
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}
