"use client";

import { Building2, CircleParking, Gauge, MapPin } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Estacionamiento } from "@/lib/data/estacionamientos";

interface EstacionamientoStatsProps {
  estacionamientos: Estacionamiento[];
}

interface StatItem {
  label: string;
  value: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function EstacionamientoStats({ estacionamientos }: EstacionamientoStatsProps) {
  const totalLugares = estacionamientos.reduce((sum, item) => sum + item.lugares, 0);
  const totalDisponibles = estacionamientos.reduce((sum, item) => sum + item.disponibles, 0);
  const totalGarages = estacionamientos.reduce((sum, item) => sum + item.garages, 0);
  const ocupacionPromedio =
    totalLugares > 0 ? Math.round(((totalLugares - totalDisponibles) / totalLugares) * 100) : 0;

  const stats: StatItem[] = [
    {
      label: "Lugares totales",
      value: totalLugares.toLocaleString("es-AR"),
      description: "Capacidad registrada",
      icon: MapPin,
    },
    {
      label: "Disponibles hoy",
      value: totalDisponibles.toLocaleString("es-AR"),
      description: "Lugares libres ahora",
      icon: CircleParking,
    },
    {
      label: "Garages",
      value: totalGarages.toLocaleString("es-AR"),
      description: "Garages en la zona",
      icon: Building2,
    },
    {
      label: "Ocupación promedio",
      value: `${ocupacionPromedio}%`,
      description: "Sobre la capacidad total",
      icon: Gauge,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.label}
            </CardTitle>
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
              <stat.icon className="size-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="pt-1">
            <div className="text-3xl font-semibold tracking-tight tabular-nums">
              {stat.value}
            </div>
            <CardDescription className="mt-1">{stat.description}</CardDescription>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
