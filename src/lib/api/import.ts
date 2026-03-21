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
	opts?: { deferProcessing?: boolean; schoolId?: string },
) {
	const form = new FormData();
	form.append("excel", excel);
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

type MultipartInitResponse = {
	jobId: string;
	key: string;
	uploadId: string;
	partSize: number;
};

type MultipartPart = { ETag: string; PartNumber: number };

export async function initImportImagesMultipartUpload(params: {
	jobId: string;
	fileName: string;
	contentType: string;
}) {
	return apiFetch<{ success: true; data: MultipartInitResponse }>(
		`/import/upload/images/multipart/init`,
		{
			method: "POST",
			body: JSON.stringify(params),
		},
	);
}

export async function getImportImagesMultipartPartUrl(params: {
	jobId: string;
	key: string;
	uploadId: string;
	partNumber: number;
}) {
	return apiFetch<{ success: true; data: { url: string } }>(
		`/import/upload/images/multipart/part-url`,
		{
			method: "POST",
			body: JSON.stringify(params),
		},
	);
}

export async function completeImportImagesMultipartUpload(params: {
	jobId: string;
	key: string;
	uploadId: string;
	parts: MultipartPart[];
}) {
	return apiFetch<{ success: true; data: { jobId: string } }>(
		`/import/upload/images/multipart/complete`,
		{
			method: "POST",
			body: JSON.stringify(params),
		},
	);
}

export async function abortImportImagesMultipartUpload(params: {
	jobId: string;
	key: string;
	uploadId: string;
}) {
	return apiFetch<{ success: true; data: { jobId: string } }>(
		`/import/upload/images/multipart/abort`,
		{
			method: "POST",
			body: JSON.stringify(params),
		},
	);
}

async function uploadPartWithRetries(params: {
	url: string;
	body: Blob;
	contentType: string;
	maxRetries: number;
}): Promise<string> {
	let attempt = 0;
	let lastError: unknown;

	while (attempt < params.maxRetries) {
		attempt += 1;
		try {
			const response = await fetch(params.url, {
				method: "PUT",
				headers: {
					"Content-Type": params.contentType,
				},
				body: params.body,
			});
			if (!response.ok) {
				throw new Error(`Upload part failed (${response.status})`);
			}
			const etag = response.headers.get("etag") || response.headers.get("ETag");
			if (!etag) {
				throw new Error("Missing ETag from S3 upload part response");
			}
			return etag;
		} catch (err) {
			lastError = err;
			if (attempt >= params.maxRetries) break;
			await new Promise((resolve) =>
				setTimeout(resolve, 500 * 2 ** (attempt - 1)),
			);
		}
	}

	throw lastError instanceof Error
		? lastError
		: new Error("Part upload failed");
}

export async function uploadImagesZipMultipartWithProgress(
	jobId: string,
	imagesZip: File,
	opts?: { onProgress?: (loaded: number, total: number) => void },
) {
	const init = await initImportImagesMultipartUpload({
		jobId,
		fileName: imagesZip.name,
		contentType: imagesZip.type || "application/zip",
	});

	const { key, uploadId, partSize } = init.data;
	const total = imagesZip.size;
	const partCount = Math.ceil(total / partSize);
	const maxParallel = 3;
	const uploadedByPart = new Map<number, number>();

	const reportProgress = () => {
		if (!opts?.onProgress) return;
		let loaded = 0;
		for (const value of uploadedByPart.values()) loaded += value;
		opts.onProgress(Math.min(loaded, total), total);
	};

	const queue = Array.from({ length: partCount }, (_, i) => i + 1);
	const parts: MultipartPart[] = [];

	const worker = async () => {
		while (queue.length > 0) {
			const partNumber = queue.shift();
			if (!partNumber) return;
			const start = (partNumber - 1) * partSize;
			const end = Math.min(start + partSize, total);
			const blob = imagesZip.slice(start, end);

			const partUrlRes = await getImportImagesMultipartPartUrl({
				jobId,
				key,
				uploadId,
				partNumber,
			});
			const etag = await uploadPartWithRetries({
				url: partUrlRes.data.url,
				body: blob,
				contentType: imagesZip.type || "application/zip",
				maxRetries: 3,
			});
			uploadedByPart.set(partNumber, blob.size);
			reportProgress();
			parts.push({ ETag: etag, PartNumber: partNumber });
		}
	};

	try {
		await Promise.all(
			Array.from({ length: Math.min(maxParallel, partCount) }, () => worker()),
		);
		parts.sort((a, b) => a.PartNumber - b.PartNumber);
		await completeImportImagesMultipartUpload({
			jobId,
			key,
			uploadId,
			parts,
		});
	} catch (err) {
		await abortImportImagesMultipartUpload({ jobId, key, uploadId }).catch(
			() => {
				// ignore abort failure
			},
		);
		throw err;
	}
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
