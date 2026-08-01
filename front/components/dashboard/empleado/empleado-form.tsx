"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Estacionamiento } from "@/lib/data/estacionamientos";
import { TURNO_LABELS, TURNOS } from "@/lib/data/empleados";

const empleadoSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  apellido: z.string().min(2, "El apellido debe tener al menos 2 caracteres"),
  dni: z.string().regex(/^\d{7,8}$/, "El DNI debe tener entre 7 y 8 dígitos"),
  telefono: z.string().regex(/^\d{8,15}$/, "El teléfono debe tener al menos 8 dígitos"),
  email: z
    .union([z.literal(""), z.email("Ingresa un correo electrónico válido")])
    .optional(),
  turno: z.enum(TURNOS, { error: "Selecciona un turno" }).default("MAÑANA"),
  estacionamientoIds: z.array(z.number()).default([]),
});

export type EmpleadoFormValues = z.output<typeof empleadoSchema>;
export type EmpleadoFormInput = z.input<typeof empleadoSchema>;

interface EmpleadoFormProps {
  estacionamientos: Estacionamiento[];
  onSubmit: (values: EmpleadoFormValues) => void | Promise<void>;
  onCancel: () => void;
}

export function EmpleadoForm({ estacionamientos, onSubmit, onCancel }: EmpleadoFormProps) {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EmpleadoFormInput, unknown, EmpleadoFormValues>({
    resolver: zodResolver(empleadoSchema),
    defaultValues: {
      nombre: "",
      apellido: "",
      dni: "",
      telefono: "",
      email: "",
      turno: "MAÑANA",
      estacionamientoIds: [],
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field data-invalid={!!errors.nombre}>
          <FieldLabel htmlFor="empleado-nombre">Nombre</FieldLabel>
          <FieldContent>
            <Input
              id="empleado-nombre"
              placeholder="Ej: Lucía"
              autoComplete="off"
              {...register("nombre")}
            />
            <FieldError errors={[errors.nombre]} />
          </FieldContent>
        </Field>

        <Field data-invalid={!!errors.apellido}>
          <FieldLabel htmlFor="empleado-apellido">Apellido</FieldLabel>
          <FieldContent>
            <Input
              id="empleado-apellido"
              placeholder="Ej: Fernández"
              autoComplete="off"
              {...register("apellido")}
            />
            <FieldError errors={[errors.apellido]} />
          </FieldContent>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field data-invalid={!!errors.dni}>
          <FieldLabel htmlFor="empleado-dni">DNI</FieldLabel>
          <FieldContent>
            <Input
              id="empleado-dni"
              placeholder="Ej: 30123456"
              inputMode="numeric"
              autoComplete="off"
              {...register("dni")}
            />
            <FieldError errors={[errors.dni]} />
          </FieldContent>
        </Field>

        <Field data-invalid={!!errors.telefono}>
          <FieldLabel htmlFor="empleado-telefono">Teléfono</FieldLabel>
          <FieldContent>
            <Input
              id="empleado-telefono"
              placeholder="Ej: 1155667788"
              inputMode="tel"
              autoComplete="off"
              {...register("telefono")}
            />
            <FieldError errors={[errors.telefono]} />
          </FieldContent>
        </Field>
      </div>

      <Field data-invalid={!!errors.email}>
        <FieldLabel htmlFor="empleado-email">Correo electrónico</FieldLabel>
        <FieldContent>
          <Input
            id="empleado-email"
            type="email"
            placeholder="Ej: lucia@example.com"
            autoComplete="off"
            {...register("email")}
          />
          <FieldDescription>Opcional.</FieldDescription>
          <FieldError errors={[errors.email]} />
        </FieldContent>
      </Field>

      <Field data-invalid={!!errors.turno}>
        <FieldLabel>Turno</FieldLabel>
        <FieldContent>
          <Controller
            control={control}
            name="turno"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(value) => field.onChange(value)}
                items={TURNO_LABELS}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un turno" />
                </SelectTrigger>
                <SelectContent>
                  {TURNOS.map((turno) => (
                    <SelectItem key={turno} value={turno}>
                      {TURNO_LABELS[turno]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FieldError errors={[errors.turno]} />
        </FieldContent>
      </Field>

      <Field>
        <FieldLabel>Estacionamientos asignados</FieldLabel>
        <FieldContent>
          <FieldDescription>
            Opcional: selecciona los estacionamientos que va a cubrir.
          </FieldDescription>
          <Controller
            control={control}
            name="estacionamientoIds"
            render={({ field }) => (
              <div className="mt-1 flex max-h-52 flex-col gap-2 overflow-y-auto pr-1">
                {estacionamientos.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No hay estacionamientos disponibles.
                  </p>
                ) : (
                  estacionamientos.map((estacionamiento) => {
                    const checkboxId = `empleado-est-${estacionamiento.id}`;
                    const selected = field.value ?? [];
                    const checked = selected.includes(estacionamiento.id);
                    return (
                      <div key={estacionamiento.id} className="flex items-center gap-2">
                        <Checkbox
                          id={checkboxId}
                          checked={checked}
                          onCheckedChange={(checkedState) => {
                            const next = checkedState
                              ? [...selected, estacionamiento.id]
                              : selected.filter((id) => id !== estacionamiento.id);
                            field.onChange(next);
                          }}
                        />
                        <Label
                          htmlFor={checkboxId}
                          className="cursor-pointer text-sm font-normal"
                        >
                          {estacionamiento.calle} {estacionamiento.altura}
                        </Label>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          />
        </FieldContent>
      </Field>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto">
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
          {isSubmitting ? "Guardando..." : "Crear empleado"}
        </Button>
      </div>
    </form>
  );
}
