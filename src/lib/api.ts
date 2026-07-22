import { IS_DEV_MODE } from "@/lib/mode";
import { resolveMockRequest } from "@/lib/devMock";

const cfg = () => window.TAPNE_RUNTIME_CONFIG;

function csrfHeaders(): Record<string, string> {
  if (IS_DEV_MODE) return { "Content-Type": "application/json" };
  const c = cfg();
  const cookieName = c.csrf.cookie_name;
  let token = c.csrf.token;
  const raw = document.cookie
    .split("; ")
    .find((row) => row.startsWith(cookieName + "="));
  if (raw) token = decodeURIComponent(raw.split("=")[1] || "") || token;
  return {
    "Content-Type": "application/json",
    [c.csrf.header_name]: token,
  };
}

function unwrapMock<T>(v: unknown): T {
  if (v && typeof v === "object" && (v as any).__mock_error) {
    const e: any = new Error((v as any).error?.error || "Request failed");
    Object.assign(e, (v as any).error);
    throw e;
  }
  return v as T;
}

async function unwrapReal(res: Response) {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const e: any = new Error(body?.error || res.statusText);
    Object.assign(e, body, { status: res.status });
    throw e;
  }
  return body;
}

export async function apiGet<T>(url: string): Promise<T> {
  if (IS_DEV_MODE) return unwrapMock<T>(resolveMockRequest("GET", url));
  const res = await fetch(url, { credentials: "include" });
  return unwrapReal(res);
}

export async function apiPost<T>(url: string, body?: unknown): Promise<T> {
  if (IS_DEV_MODE) return unwrapMock<T>(resolveMockRequest("POST", url, body));
  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: csrfHeaders(),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return unwrapReal(res);
}

export async function apiPatch<T>(url: string, body: unknown): Promise<T> {
  if (IS_DEV_MODE) return unwrapMock<T>(resolveMockRequest("PATCH", url, body));
  const res = await fetch(url, {
    method: "PATCH",
    credentials: "include",
    headers: csrfHeaders(),
    body: JSON.stringify(body),
  });
  return unwrapReal(res);
}

export async function apiDelete(url: string): Promise<void> {
  if (IS_DEV_MODE) { unwrapMock(resolveMockRequest("DELETE", url)); return; }
  const res = await fetch(url, {
    method: "DELETE",
    credentials: "include",
    headers: csrfHeaders(),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const e: any = new Error(body?.error || res.statusText);
    Object.assign(e, body, { status: res.status });
    throw e;
  }
}

// Multipart file upload (POST). Never JSON-encodes the body — the FormData
// serializes as `multipart/form-data` and browser sets the boundary header.
export async function apiUpload<T>(url: string, formData: FormData): Promise<T> {
  if (IS_DEV_MODE) return unwrapMock<T>(resolveMockRequest("POST", url, formData));
  const c = cfg();
  const cookieName = c.csrf.cookie_name;
  let token = c.csrf.token;
  const raw = document.cookie
    .split("; ")
    .find((row) => row.startsWith(cookieName + "="));
  if (raw) token = decodeURIComponent(raw.split("=")[1] || "") || token;
  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: { [c.csrf.header_name]: token },
    body: formData,
  });
  return unwrapReal(res);
}
