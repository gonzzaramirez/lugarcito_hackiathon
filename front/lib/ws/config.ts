// WebSocket endpoint configuration.
//
// The Go backend does not exist yet. Set NEXT_PUBLIC_WS_URL at build time to
// point at the real WS gateway and the app connects to it. Without the env
// var, USE_MOCK_WS stays true and a local simulator (lib/ws/mock.ts) feeds the
// UI instead — switching mock -> real is a single env var, zero code changes.

export const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8080/ws";

export const USE_MOCK_WS = !process.env.NEXT_PUBLIC_WS_URL;

/** Base delay for the first reconnect attempt. */
export const RECONNECT_BASE_DELAY_MS = 500;

/** Cap for the exponential backoff delay. */
export const RECONNECT_MAX_DELAY_MS = 10_000;
