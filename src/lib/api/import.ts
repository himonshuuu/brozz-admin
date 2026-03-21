import { API_BASE, apiFetch } from "./client";

export type ImportJobDto = {
	id: string;
	schoolId: string;
	status: "pending" | "processing" | "completed" | "failed";
	filePath: string | null;
	imagesZipPath?: string | null;
	totalRows: number;
	processedRows: number;
	errorMessage: string | null;
	createdAt: string;
	updatedAt: string;
	completedAt: string | null;
};

const MAX_FILE_SIZE = 1 * 1024 * 1024 * 1024; // 1GB

export function formatFileSize(bytes: number): string {
	const units = ["B", "KB", "MB", "GB"];
	let size = bytes;
	let unitIndex = 0;
	while (size >= 1024 && unitIndex < units.length - 1) {
		size /= 1024;
		unitIndex++;
	}
	return `${size.toFixed(2)} ${units[unitIndex]}`;
}

export function validateFileSize(file: File): {
	valid: boolean;
	message?: string;
} {
	if (file.size > MAX_FILE_SIZE) {
		return {
			valid: false,
			message: `File too large (${formatFileSize(file.size)}, max ${formatFileSize(MAX_FILE_SIZE)})`,
		};
	}
	return { valid: true };
}

export async function uploadImport(
	excel: File,
	imagesZip?: File,
	opts?: { deferProcessing?: boolean; schoolId?: string },
) {
	const form = new FormData();
	form.append("excel", excel);
	if (imagesZip) form.append("imagesZip", imagesZip);
	if (opts?.deferProcessing !== undefined) {
		form.append("deferProcessing", String(opts.deferProcessing));
	}
	if (opts?.schoolId) {
		form.append("schoolId", opts.schoolId);
	}
	return apiFetch<{ success: true; data: { id: string; status: string } }>(
		`/import/upload`,
		{
			method: "POST",
			body: form,
		},
	);
}

function uploadWithXhr<T>(
	url: string,
	body: FormData | Blob,
	token: string,
	options?: {
		onProgress?: (loaded: number, total: number) => void;
		contentType?: string;
	},
): Promise<T> {
	return new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		xhr.open("POST", url, true);
		xhr.setRequestHeader("Authorization", `Bearer ${token}`);
		if (options?.contentType) {
			xhr.setRequestHeader("Content-Type", options.contentType);
		}

		xhr.upload.onprogress = (evt) => {
			if (!options?.onProgress || !evt.lengthComputable) return;
			options.onProgress(evt.loaded, evt.total);
		};

		xhr.onerror = () => {
			reject(new Error("Network error while uploading"));
		};

		xhr.onload = () => {
			let parsed: unknown = null;
			if (xhr.responseText) {
				try {
					parsed = JSON.parse(xhr.responseText) as unknown;
				} catch {
					parsed = null;
				}
			}

			if (xhr.status >= 200 && xhr.status < 300 && parsed) {
				resolve(parsed as T);
				return;
			}

			const message =
				typeof parsed === "object" &&
				parsed != null &&
				"message" in parsed &&
				typeof (parsed as { message?: unknown }).message === "string"
					? ((parsed as { message: string }).message ?? "Upload failed")
					: "Upload failed";
			reject(new Error(message));
		};

		xhr.send(body);
	});
}

export async function uploadImportWithProgress(
	excel: File,
	opts: {
		deferProcessing?: boolean;
		schoolId?: string;
		onProgress?: (loaded: number, total: number) => void;
	},
) {
	const token = window.localStorage.getItem("token");
	if (!token) throw new Error("Not authenticated");

	const form = new FormData();
	form.append("excel", excel);
	if (opts.deferProcessing !== undefined) {
		form.append("deferProcessing", String(opts.deferProcessing));
	}
	if (opts.schoolId) {
		form.append("schoolId", opts.schoolId);
	}

	return uploadWithXhr<{ success: true; data: { id: string; status: string } }>(
		`${API_BASE}/import/upload`,
		form,
		token,
		{ onProgress: opts.onProgress },
	);
}

export async function uploadImagesZipStreamWithProgress(
	jobId: string,
	imagesZip: File,
	opts?: { onProgress?: (loaded: number, total: number) => void },
) {
	const token = window.localStorage.getItem("token");
	if (!token) throw new Error("Not authenticated");

	return uploadWithXhr<{ success: true; data: { jobId: string } }>(
		`${API_BASE}/import/upload/images/stream?jobId=${encodeURIComponent(jobId)}`,
		imagesZip,
		token,
		{
			onProgress: opts?.onProgress,
			contentType: imagesZip.type || "application/zip",
		},
	);
}

export async function listImportJobs(params?: { schoolId?: string }) {
	const qs = params?.schoolId
		? `?schoolId=${encodeURIComponent(params.schoolId)}`
		: "";
	return apiFetch<{ success: true; data: ImportJobDto[] }>(`/import/jobs${qs}`);
}

export async function getImportJob(id: string) {
	return apiFetch<{ success: true; data: ImportJobDto }>(`/import/jobs/${id}`);
}
