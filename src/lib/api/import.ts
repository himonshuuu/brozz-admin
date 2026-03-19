import { apiFetch } from "./client";

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

export async function uploadImport(excel: File, imagesZip?: File) {
	const form = new FormData();
	form.append("excel", excel);
	if (imagesZip) form.append("imagesZip", imagesZip);
	return apiFetch<{ success: true; data: { id: string; status: string } }>(
		`/import/upload`,
		{
			method: "POST",
			body: form,
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
