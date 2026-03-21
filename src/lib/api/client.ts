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

export const API_BASE =
	process.env.NEXT_PUBLIC_API_BASE ||
	process.env.NEXT_PUBLIC_API_URL ||
	"https://api.printloom.netpiedev.in";
export async function apiFetch<T>(
	path: string,
	init?: RequestInit,
): Promise<T> {
	const token = getToken();
	const headers = new Headers(init?.headers);
	if (token) headers.set("Authorization", `Bearer ${token}`);
	// Let browser set content-type for FormData/Blob/File/raw bodies
	const body = init?.body;
	const isBinaryBody =
		typeof Blob !== "undefined" &&
		body !== undefined &&
		body !== null &&
		body instanceof Blob;
	if (!(body instanceof FormData) && !isBinaryBody)
		headers.set("Content-Type", "application/json");

	const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
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
