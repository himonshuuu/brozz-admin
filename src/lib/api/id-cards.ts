const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

function getToken(): string | null {
	if (typeof window === "undefined") return null;
	return (
		window.localStorage.getItem("token") ||
		window.localStorage.getItem("authToken") ||
		window.localStorage.getItem("accessToken")
	);
}

export type IdCardFieldPlacement = {
	id: string;
	fieldId: string;
	x: number;
	y: number;
	fontSize: number;
	fontWeight: "normal" | "bold";
	color: string;
	showLabel: boolean;
	customLabel: string;
	width?: number;
	height?: number;
};

/** Generate ID cards on the backend and return the ZIP blob for download. */
export async function generateIdCardsZip(
	templateImageBase64: string,
	fields: IdCardFieldPlacement[],
	studentIds: string[],
): Promise<Blob> {
	const token = getToken();
	const res = await fetch(`${API_BASE}/id-cards/generate`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			...(token ? { Authorization: `Bearer ${token}` } : {}),
		},
		body: JSON.stringify({
			templateImage: templateImageBase64,
			fields,
			studentIds,
		}),
	});

	if (!res.ok) {
		const json = (await res.json().catch(() => null)) as { message?: string } | null;
		throw new Error(json?.message ?? `Request failed (${res.status})`);
	}

	return res.blob();
}
