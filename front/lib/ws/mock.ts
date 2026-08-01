import { ESTACIONAMIENTOS } from "../data/estacionamientos";
import type { LiveWsClient, WsStatus } from "./client";
import type { EstacionamientoUpdate, WsMessage } from "./types";

// Local simulator that stands in for the missing backend WS gateway.
// TODO(frontend): delete this file once the real backend emits updates.

const TICK_MIN_MS = 3000;
const TICK_MAX_MS = 5000;
const MAX_CHANGE = 3;

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Emits realistic availability updates on a random interval (every 3-5s). */
export class MockWebSocketClient implements LiveWsClient {
  private status: WsStatus = "offline";
  private subscriberCount = 0;
  private startTimer: ReturnType<typeof setTimeout> | null = null;
  private tickTimer: ReturnType<typeof setInterval> | null = null;
  private listeners = new Set<(message: WsMessage) => void>();
  private statusListeners = new Set<(status: WsStatus) => void>();

  /** Current simulated availability, kept in sync as updates are emitted. */
  private availability = new Map(
    ESTACIONAMIENTOS.map((item) => [item.id, item.disponibles])
  );

  connect(): void {
    this.subscriberCount += 1;
    if (this.subscriberCount > 1 || this.tickTimer !== null) {
      return;
    }

    this.setStatus("connecting");
    this.startTimer = setTimeout(() => {
      this.startTimer = null;
      this.setStatus("connected");
      this.tick();
      this.tickTimer = setInterval(
        () => this.tick(),
        randomBetween(TICK_MIN_MS, TICK_MAX_MS)
      );
    }, 400);
  }

  disconnect(): void {
    this.subscriberCount = Math.max(0, this.subscriberCount - 1);
    if (this.subscriberCount > 0) {
      return;
    }
    if (this.startTimer !== null) {
      clearTimeout(this.startTimer);
      this.startTimer = null;
    }
    if (this.tickTimer !== null) {
      clearInterval(this.tickTimer);
      this.tickTimer = null;
    }
    this.setStatus("offline");
  }

  subscribe(handler: (message: WsMessage) => void): () => void {
    this.listeners.add(handler);
    return () => this.listeners.delete(handler);
  }

  subscribeStatus(handler: (status: WsStatus) => void): () => void {
    this.statusListeners.add(handler);
    handler(this.status);
    return () => this.statusListeners.delete(handler);
  }

  getStatus(): WsStatus {
    return this.status;
  }

  private tick(): void {
    // Pick 1-2 random lots and apply a small ±1..3 change, clamped to [0, lugares].
    const updateCount = Math.random() < 0.5 ? 1 : 2;
    const pool = [...ESTACIONAMIENTOS];

    for (let index = 0; index < updateCount && pool.length > 0; index++) {
      const lotIndex = Math.floor(Math.random() * pool.length);
      const [lot] = pool.splice(lotIndex, 1);

      const current = this.availability.get(lot.id) ?? lot.disponibles;
      const delta = (Math.random() < 0.5 ? -1 : 1) * randomBetween(1, MAX_CHANGE);
      const next = Math.min(Math.max(current + delta, 0), lot.lugares);
      this.availability.set(lot.id, next);

      const update: EstacionamientoUpdate = {
        estacionamientoId: lot.id,
        disponibles: next,
        timestamp: Date.now(),
      };
      this.listeners.forEach((handler) =>
        handler({ type: "estacionamiento.update", payload: update })
      );
    }
  }

  private setStatus(status: WsStatus): void {
    if (this.status === status) {
      return;
    }
    this.status = status;
    this.statusListeners.forEach((handler) => handler(status));
  }
}
