export type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; message?: string };

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return (
    window.localStorage.getItem("token") ||
    window.localStorage.getItem("authToken") ||
    window.localStorage.getItem("accessToken")
  );
}

export const API_BASE =
  import.meta.env.VITE_API_BASE ||
  import.meta.env.VITE_API_URL ||
  "https://api.brozz.in";

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const headers = new Headers(init?.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const body = init?.body;
  const isBinaryBody =
    typeof Blob !== "undefined" &&
    body !== undefined &&
    body !== null &&
    body instanceof Blob;
  if (!(body instanceof FormData) && !isBinaryBody)
    headers.set("Content-Type", "application/json");

  const url = path.startsWith("/api/") ? path : `${API_BASE}${path}`;
  const res = await fetch(url, { ...init, headers });
  const json = (await res.json().catch(() => null)) as unknown;

  if (!res.ok) {
    const errorPayload =
      typeof json === "object" && json !== null
        ? (json as { message?: string; error?: string })
        : null;
    const msg =
      errorPayload?.message ||
      errorPayload?.error ||
      `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return json as T;
}
