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

export async function uploadImport(excel: File, imagesZip?: File) {
  const form = new FormData();
  form.append("excel", excel);
  if (imagesZip) form.append("imagesZip", imagesZip);
  return apiFetch<{ success: true; data: { id: string; status: string } }>(`/import/upload`, {
    method: "POST",
    body: form,
  });
}

export async function listImportJobs(params?: { schoolId?: string }) {
  const qs = params?.schoolId ? `?schoolId=${encodeURIComponent(params.schoolId)}` : "";
  return apiFetch<{ success: true; data: ImportJobDto[] }>(`/import/jobs${qs}`);
}

export async function getImportJob(id: string) {
  return apiFetch<{ success: true; data: ImportJobDto }>(`/import/jobs/${id}`);
}

