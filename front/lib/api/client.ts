// Shared HTTP client for the app.
// The backend exposes the REST API under /api/v1 (see back/README.md).
// Endpoints that require authentication read the JWT from the session
// (lib/api/auth.ts) and send it as a Bearer token.

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

export function getAuthToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem("lugarcito_token");
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${init?.method ?? "GET"} ${path}`);
  }
  return (await res.json()) as T;
}

export async function httpGet<T>(path: string): Promise<T> {
  return request<T>(path, { method: "GET" });
}

export async function httpPost<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, { method: "POST", body: JSON.stringify(body) });
}
