"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { useEstacionamientoLive } from "@/hooks/use-estacionamiento-live";
import type { Estacionamiento } from "@/lib/data/estacionamientos";

import { ConnectionStatus } from "./connection-status";
import { EstacionamientoStats } from "./estacionamiento-stats";
import { EstacionamientoTable } from "./estacionamiento-table";

interface EstacionamientoLiveViewProps {
  /** Initial rows fetched on the server; live updates merge on top. */
  initialEstacionamientos: Estacionamiento[];
}

/**
 * Client wrapper for the read-only estacionamientos view: subscribes to the
 * real-time feed, renders the connection status, the stat cards and the table
 * with a local filter by street/street-number.
 */
export function EstacionamientoLiveView({
  initialEstacionamientos,
}: EstacionamientoLiveViewProps) {
  const { estacionamientos, status, updatedIds } =
    useEstacionamientoLive(initialEstacionamientos);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return estacionamientos;
    }
    return estacionamientos.filter((item) =>
      `${item.calle} ${item.altura}`.toLowerCase().includes(normalized)
    );
  }, [estacionamientos, query]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Estacionamientos</h1>
          <p className="text-sm text-muted-foreground">
            Estado en tiempo real de los estacionamientos medidos.
          </p>
        </div>
        <ConnectionStatus status={status} />
      </div>

      <EstacionamientoStats estacionamientos={estacionamientos} />

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full max-w-sm">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por calle o altura..."
              className="pl-9"
            />
          </div>
          <p className="text-sm text-muted-foreground tabular-nums">
            {filtered.length} de {estacionamientos.length} estacionamientos
          </p>
        </div>

        <EstacionamientoTable estacionamientos={filtered} updatedIds={updatedIds} />
      </div>
    </div>
  );
}
