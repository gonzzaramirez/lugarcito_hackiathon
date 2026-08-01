"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { TURNO_LABELS, type Empleado } from "@/lib/data/empleados";
import type { Estacionamiento } from "@/lib/data/estacionamientos";

interface EmpleadoAsignarDialogProps {
  empleado: Empleado;
  estacionamientos: Estacionamiento[];
  /** Called with the employee id and the new assignment ids. */
  onConfirm: (empleadoId: number, estacionamientoIds: number[]) => void | Promise<void>;
  onOpenChange: (open: boolean) => void;
}

export function EmpleadoAsignarDialog({
  empleado,
  estacionamientos,
  onConfirm,
  onOpenChange,
}: EmpleadoAsignarDialogProps) {
  const [selected, setSelected] = useState<number[]>(empleado.estacionamientoIds);
  const [saving, setSaving] = useState(false);

  const toggle = (id: number) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleConfirm = async () => {
    setSaving(true);
    try {
      await onConfirm(empleado.id, selected);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-4rem)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Asignar estacionamientos</DialogTitle>
          <DialogDescription>
            {empleado.nombre} {empleado.apellido} — Turno {TURNO_LABELS[empleado.turno]}.
            Marca los estacionamientos que va a cubrir.
          </DialogDescription>
        </DialogHeader>

        <div className="flex max-h-64 flex-col gap-2 overflow-y-auto pr-1">
          {estacionamientos.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay estacionamientos disponibles.</p>
          ) : (
            estacionamientos.map((estacionamiento) => {
              const checkboxId = `asignar-est-${estacionamiento.id}`;
              return (
                <div key={estacionamiento.id} className="flex items-center gap-2">
                  <Checkbox
                    id={checkboxId}
                    checked={selected.includes(estacionamiento.id)}
                    onCheckedChange={() => toggle(estacionamiento.id)}
                  />
                  <Label
                    htmlFor={checkboxId}
                    className="flex flex-1 cursor-pointer items-center justify-between gap-2 text-sm font-normal"
                  >
                    <span>
                      {estacionamiento.calle} {estacionamiento.altura}
                    </span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {estacionamiento.disponibles} de {estacionamiento.lugares} disponibles
                    </span>
                  </Label>
                </div>
              );
            })
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={saving}>
            {saving ? "Guardando..." : "Guardar asignación"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
