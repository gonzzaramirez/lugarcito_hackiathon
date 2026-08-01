// Shared HTTP client for the dashboard.
// TODO(frontend): connect to the real backend API. Until then, these helpers
// simulate network latency and the feature modules fall back to seed data.

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";

function simulateNetworkLatency(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 150 + Math.random() * 200));
}

export async function httpGet<T>(path: string): Promise<T> {
  await simulateNetworkLatency();

  // TODO(frontend): replace with a real request once the backend exists:
  // const res = await fetch(`${API_BASE_URL}${path}`, { cache: "no-store" });
  // if (!res.ok) throw new Error(`GET ${path} failed (${res.status})`);
  // return (await res.json()) as T;

  throw new Error(`Backend API not connected yet (${API_BASE_URL}): GET ${path}`);
}

export async function httpPost<T>(path: string, body: unknown): Promise<T> {
  await simulateNetworkLatency();

  // TODO(frontend): replace with a real request once the backend exists:
  // const res = await fetch(`${API_BASE_URL}${path}`, {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify(body),
  // });
  // if (!res.ok) throw new Error(`POST ${path} failed (${res.status})`);
  // return (await res.json()) as T;

  void body // used by the real fetch once the backend is connected
  throw new Error(`Backend API not connected yet (${API_BASE_URL}): POST ${path}`);
}
