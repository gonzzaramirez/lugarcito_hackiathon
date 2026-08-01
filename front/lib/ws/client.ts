import {
  RECONNECT_BASE_DELAY_MS,
  RECONNECT_MAX_DELAY_MS,
  USE_MOCK_WS,
  WS_URL,
} from "./config";
import { MockWebSocketClient } from "./mock";
import { parseWsMessage, type WsMessage } from "./types";

export type WsStatus = "connecting" | "connected" | "reconnecting" | "offline";

/** Common contract implemented by the real socket client and the mock. */
export interface LiveWsClient {
  connect(): void;
  disconnect(): void;
  subscribe(handler: (message: WsMessage) => void): () => void;
  subscribeStatus(handler: (status: WsStatus) => void): () => void;
  getStatus(): WsStatus;
}

/**
 * Browser WebSocket client with auto-reconnect and exponential backoff.
 * Connection is ref-counted: the socket stays open while at least one
 * subscriber is connected and closes when the last one disconnects.
 */
class WebSocketClient implements LiveWsClient {
  private socket: WebSocket | null = null;
  private status: WsStatus = "offline";
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private shouldReconnect = false;
  private subscriberCount = 0;
  private listeners = new Set<(message: WsMessage) => void>();
  private statusListeners = new Set<(status: WsStatus) => void>();

  constructor(private readonly url: string) {}

  connect(): void {
    this.subscriberCount += 1;
    if (this.subscriberCount === 1) {
      this.open();
    }
  }

  disconnect(): void {
    this.subscriberCount = Math.max(0, this.subscriberCount - 1);
    if (this.subscriberCount > 0) {
      return;
    }
    this.shouldReconnect = false;
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.socket?.close();
    this.socket = null;
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

  private open(): void {
    this.shouldReconnect = true;
    this.setStatus("connecting");

    const socket = new WebSocket(this.url);
    this.socket = socket;

    socket.onopen = () => {
      this.reconnectAttempt = 0;
      this.setStatus("connected");
    };

    socket.onmessage = (event) => {
      const message = parseWsMessage(event.data);
      if (!message) {
        return;
      }
      this.listeners.forEach((handler) => handler(message));
    };

    socket.onclose = () => {
      this.socket = null;
      this.scheduleReconnect();
    };

    socket.onerror = () => {
      // onclose fires right after; it owns the retry logic.
      socket.close();
    };
  }

  private scheduleReconnect(): void {
    if (!this.shouldReconnect) {
      return;
    }
    this.setStatus("reconnecting");

    const delay = Math.min(
      RECONNECT_BASE_DELAY_MS * 2 ** this.reconnectAttempt,
      RECONNECT_MAX_DELAY_MS
    );
    this.reconnectAttempt += 1;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.open();
    }, delay);
  }

  private setStatus(status: WsStatus): void {
    if (this.status === status) {
      return;
    }
    this.status = status;
    this.statusListeners.forEach((handler) => handler(status));
  }
}

const realClient = new WebSocketClient(WS_URL);
const mockClient = new MockWebSocketClient();

/**
 * App-wide singleton. Returns the mock simulator until NEXT_PUBLIC_WS_URL is
 * set at build time; afterwards it returns the real socket client.
 */
export function getLiveClient(): LiveWsClient {
  return USE_MOCK_WS ? mockClient : realClient;
}
