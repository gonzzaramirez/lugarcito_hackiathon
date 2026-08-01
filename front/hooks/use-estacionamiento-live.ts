"use client";

import { useEffect, useMemo, useState } from "react";

import type { Estacionamiento } from "@/lib/data/estacionamientos";
import { getLiveClient, type WsStatus } from "@/lib/ws/client";

/** How long updated rows keep their highlight before settling. */
const FLASH_DURATION_MS = 2400;

export interface EstacionamientoLiveState {
  estacionamientos: Estacionamiento[];
  status: WsStatus;
  /** Ids of lots updated recently; used to flash the affected rows. */
  updatedIds: Set<number>;
}

/**
 * Subscribes to the real-time availability feed and merges incoming
 * `estacionamiento.update` messages into the list (clamps `disponibles`,
 * recomputes `saturacion`, and marks the changed ids for a visual flash).
 * Falls back to the mock simulator until the backend WS gateway exists.
 */
export function useEstacionamientoLive(
  initialEstacionamientos: Estacionamiento[]
): EstacionamientoLiveState {
  const [estacionamientos, setEstacionamientos] = useState(initialEstacionamientos);
  const [status, setStatus] = useState<WsStatus>("connecting");
  const [updatedIds, setUpdatedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    const client = getLiveClient();

    const unsubscribeMessage = client.subscribe((message) => {
      if (message.type !== "estacionamiento.update") {
        return;
      }
      const { estacionamientoId, disponibles } = message.payload;

      setEstacionamientos((prev) =>
        prev.map((item) => {
          if (item.id !== estacionamientoId) {
            return item;
          }
          const clamped = Math.min(Math.max(disponibles, 0), item.lugares);
          const saturacion =
            item.lugares > 0
              ? Math.round(((item.lugares - clamped) / item.lugares) * 100)
              : 0;
          return { ...item, disponibles: clamped, saturacion };
        })
      );

      setUpdatedIds((prev) => {
        const next = new Set(prev);
        next.add(estacionamientoId);
        return next;
      });
    });

    const unsubscribeStatus = client.subscribeStatus(setStatus);
    client.connect();

    return () => {
      unsubscribeMessage();
      unsubscribeStatus();
      client.disconnect();
    };
  }, []);

  // Clear the flash markers after a settle window so rows can flash again later.
  useEffect(() => {
    if (updatedIds.size === 0) {
      return;
    }
    const timer = setTimeout(() => setUpdatedIds(new Set()), FLASH_DURATION_MS);
    return () => clearTimeout(timer);
  }, [updatedIds]);

  return useMemo(
    () => ({ estacionamientos, status, updatedIds }),
    [estacionamientos, status, updatedIds]
  );
}
