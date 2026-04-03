import { IS_DEV_MODE } from "@/lib/mode";
import { resolveMockRequest } from "@/lib/devMock";

const cfg = () => window.TAPNE_RUNTIME_CONFIG;

function csrfHeaders(): Record<string, string> {
  if (IS_DEV_MODE) return { "Content-Type": "application/json" };
  const c = cfg();
  return {
    "Content-Type": "application/json",
    [c.csrf.header_name]: c.csrf.token,
  };
}

export async function apiGet<T>(url: string): Promise<T> {
  if (IS_DEV_MODE) return resolveMockRequest("GET", url) as T;
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw await res.json().catch(() => ({ error: res.statusText }));
  return res.json();
}

export async function apiPost<T>(url: string, body?: unknown): Promise<T> {
  if (IS_DEV_MODE) return resolveMockRequest("POST", url, body) as T;
  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: csrfHeaders(),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw await res.json().catch(() => ({ error: res.statusText }));
  return res.json();
}

export async function apiPatch<T>(url: string, body: unknown): Promise<T> {
  if (IS_DEV_MODE) return resolveMockRequest("PATCH", url, body) as T;
  const res = await fetch(url, {
    method: "PATCH",
    credentials: "include",
    headers: csrfHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw await res.json().catch(() => ({ error: res.statusText }));
  return res.json();
}

export async function apiDelete(url: string): Promise<void> {
  if (IS_DEV_MODE) { resolveMockRequest("DELETE", url); return; }
  const res = await fetch(url, {
    method: "DELETE",
    credentials: "include",
    headers: csrfHeaders(),
  });
  if (!res.ok) throw await res.json().catch(() => ({ error: res.statusText }));
}
