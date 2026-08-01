"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Empleado } from "@/lib/data/empleados";
import { TURNO_LABELS } from "@/lib/data/empleados";
import type { Estacionamiento } from "@/lib/data/estacionamientos";
import { cn } from "@/lib/utils";

interface EmpleadoTableProps {
  empleados: Empleado[];
  estacionamientos: Estacionamiento[];
  onAsignar: (empleado: Empleado) => void;
}

function getInitials(empleado: Empleado): string {
  return `${empleado.nombre.charAt(0)}${empleado.apellido.charAt(0)}`.toUpperCase();
}

export function EmpleadoTable({ empleados, estacionamientos, onAsignar }: EmpleadoTableProps) {
  const estacionamientoPorId = new Map(estacionamientos.map((item) => [item.id, item]));

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>DNI</TableHead>
          <TableHead>Teléfono</TableHead>
          <TableHead>Turno</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Estacionamientos</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {empleados.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
              Sin empleados cargados.
            </TableCell>
          </TableRow>
        ) : (
          empleados.map((empleado) => {
            const asignados = empleado.estacionamientoIds
              .map((id) => estacionamientoPorId.get(id))
              .filter((item): item is Estacionamiento => item !== undefined);

            return (
              <TableRow key={empleado.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div
                      className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground"
                      aria-hidden
                    >
                      {getInitials(empleado)}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {empleado.nombre} {empleado.apellido}
                      </span>
                      {empleado.email && (
                        <span className="text-xs text-muted-foreground">
                          {empleado.email}
                        </span>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="tabular-nums">{empleado.dni}</TableCell>
                <TableCell className="tabular-nums">{empleado.telefono}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className="border-transparent bg-muted font-normal text-muted-foreground"
                  >
                    {TURNO_LABELS[empleado.turno]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn(
                      empleado.activo
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                        : "border-muted-foreground/30 bg-muted text-muted-foreground"
                    )}
                  >
                    <span
                      className={cn(
                        "size-1.5 rounded-full",
                        empleado.activo ? "bg-emerald-500" : "bg-muted-foreground"
                      )}
                    />
                    {empleado.activo ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {asignados.length === 0 ? (
                    <span className="text-sm text-muted-foreground">Sin asignar</span>
                  ) : (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium tabular-nums">
                        {asignados.length}{" "}
                        {asignados.length === 1 ? "estacionamiento" : "estacionamientos"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {asignados
                          .slice(0, 2)
                          .map((item) => `${item.calle} ${item.altura}`)
                          .join(", ")}
                        {asignados.length > 2 ? "…" : ""}
                      </span>
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" onClick={() => onAsignar(empleado)}>
                    Asignar
                  </Button>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}
