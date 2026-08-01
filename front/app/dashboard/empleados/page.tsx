"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Users } from "lucide-react";
import { toast } from "sonner";

import { EmpleadoAsignarDialog } from "@/components/dashboard/empleado/empleado-asignar-dialog";
import { EmpleadoForm, type EmpleadoFormValues } from "@/components/dashboard/empleado/empleado-form";
import { EmpleadoTable } from "@/components/dashboard/empleado/empleado-table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { asignarEmpleado } from "@/lib/api/asignacion";
import { createEmpleado, getEmpleados } from "@/lib/api/empleado";
import { getEstacionamientos } from "@/lib/api/estacionamiento";
import type { Empleado } from "@/lib/data/empleados";
import type { Estacionamiento } from "@/lib/data/estacionamientos";

export default function EmpleadosPage() {
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [estacionamientos, setEstacionamientos] = useState<Estacionamiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [empleadoAsignar, setEmpleadoAsignar] = useState<Empleado | null>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([getEmpleados(), getEstacionamientos()]).then(
      ([empleadosData, estacionamientosData]) => {
        if (cancelled) return;
        setEmpleados(empleadosData);
        setEstacionamientos(estacionamientosData);
        setLoading(false);
      }
    );

    return () => {
      cancelled = true;
    };
  }, []);

  const handleCreate = useCallback(async (values: EmpleadoFormValues) => {
    try {
      const nuevo = await createEmpleado({
        nombre: values.nombre,
        apellido: values.apellido,
        dni: values.dni,
        telefono: values.telefono,
        email: values.email || undefined,
        turno: values.turno,
        estacionamientoIds: values.estacionamientoIds,
      });
      setEmpleados((prev) => [...prev, nuevo]);
      setCreateOpen(false);
      toast.success("Empleado creado correctamente");
    } catch {
      toast.error("No se pudo crear el empleado");
    }
  }, []);

  const handleAsignar = useCallback(
    async (empleadoId: number, estacionamientoIds: number[]) => {
      try {
        const actualizado = await asignarEmpleado(empleadoId, estacionamientoIds);
        setEmpleados((prev) =>
          prev.map((empleado) => (empleado.id === empleadoId ? actualizado : empleado))
        );
        setEmpleadoAsignar(null);
        toast.success("Asignación actualizada correctamente");
      } catch {
        toast.error("No se pudo actualizar la asignación");
      }
    },
    []
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Empleados</h1>
          <p className="text-sm text-muted-foreground">
            Administrá el personal y sus estacionamientos asignados.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          Nuevo empleado
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      ) : empleados.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <Users className="size-6 text-muted-foreground" />
          </div>
          <div className="flex flex-col gap-1">
            <p className="font-medium">No hay empleados todavía</p>
            <p className="text-sm text-muted-foreground">
              Crea el primer empleado para comenzar a asignar estacionamientos.
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            Nuevo empleado
          </Button>
        </div>
      ) : (
        <EmpleadoTable
          empleados={empleados}
          estacionamientos={estacionamientos}
          onAsignar={setEmpleadoAsignar}
        />
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg md:max-w-xl max-h-[calc(100vh-4rem)] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo empleado</DialogTitle>
            <DialogDescription>
              Completa los datos para dar de alta al empleado.
            </DialogDescription>
          </DialogHeader>
          <EmpleadoForm
            key={createOpen ? "open" : "closed"}
            estacionamientos={estacionamientos}
            onSubmit={handleCreate}
            onCancel={() => setCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {empleadoAsignar && (
        <EmpleadoAsignarDialog
          key={empleadoAsignar.id}
          empleado={empleadoAsignar}
          estacionamientos={estacionamientos}
          onConfirm={handleAsignar}
          onOpenChange={(open) => {
            if (!open) setEmpleadoAsignar(null);
          }}
        />
      )}
    </div>
  );
}
