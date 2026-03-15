export type ApiResult<T> =
	| { success: true; data: T }
	| { success: false; message?: string };

function getToken(): string | null {
	// Support a few common keys until auth UI is wired.
	if (typeof window === "undefined") return null;
	return (
		window.localStorage.getItem("token") ||
		window.localStorage.getItem("authToken") ||
		window.localStorage.getItem("accessToken")
	);
}

const API_BASE =
	process.env.NEXT_PUBLIC_API_BASE || "https://api.printloom.netpiedev.in";
export async function apiFetch<T>(
	path: string,
	init?: RequestInit,
): Promise<T> {
	const token = getToken();
	const headers = new Headers(init?.headers);
	if (token) headers.set("Authorization", `Bearer ${token}`);
	// Let browser set boundary for FormData
	if (!(init?.body instanceof FormData))
		headers.set("Content-Type", "application/json");

	const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
	const json = (await res.json().catch(() => null)) as unknown;

	if (!res.ok) {
		const msg =
			(json as any)?.message ||
			(json as any)?.error ||
			`Request failed (${res.status})`;
		throw new Error(msg);
	}
	return json as T;
}
