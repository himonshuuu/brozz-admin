import { useCallback, useState } from "react";
import { apiFetch } from "@/lib/api/client";

interface InitResponse {
  data: { uploadId: string; chunkSize: number };
}

interface ChunkResponse {
  data: {
    uploadId: string;
    chunkIndex: number;
    progress: number;
    isComplete: boolean;
  };
}

interface CompleteResponse {
  data: { id: string };
}

interface UploadStatusResponse {
  data: {
    uploadId: string;
    fileName: string;
    totalChunks: number;
    receivedChunks: number;
    progress: number;
    isComplete: boolean;
  };
}

interface UploadResumeState {
  uploadId: string;
  fileName: string;
  fileSize: number;
  totalChunks: number;
  filetype: "excel" | "imagesZip";
  jobId?: string;
  schoolId?: string;
}

const CHUNK_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_RETRIES = 3;
const RESUME_KEY_PREFIX = "chunked-upload:";

function getResumeKey(
  file: File,
  opts: { filetype: "excel" | "imagesZip"; schoolId?: string; jobId?: string },
): string {
  return [
    RESUME_KEY_PREFIX,
    opts.filetype,
    file.name,
    String(file.size),
    String(file.lastModified),
    opts.schoolId || "",
    opts.jobId || "",
  ].join(":");
}

export interface ChunkedUploadProgress {
  uploadId: string;
  fileName: string;
  totalChunks: number;
  uploadedChunks: number;
  progress: number;
  status: "initializing" | "uploading" | "completing" | "completed" | "failed";
  error?: string;
}

export function useChunkedUpload() {
  const [progress, setProgress] = useState<ChunkedUploadProgress | null>(null);

  const uploadChunkedFile = useCallback(
    async (
      file: File,
      opts: {
        filetype: "excel" | "imagesZip";
        jobId?: string;
        deferProcessing?: boolean;
        schoolId?: string;
        onProgress?: (p: ChunkedUploadProgress) => void;
      },
    ): Promise<{ jobId: string }> => {
      const { filetype, jobId, deferProcessing, schoolId, onProgress } = opts;
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
      let uploadId = "";
      let startChunkIndex = 0;
      const resumeKey = getResumeKey(file, { filetype, schoolId, jobId });

      try {
        // Step 1: Restore or initialize upload session
        setProgress({
          uploadId: "",
          fileName: file.name,
          totalChunks,
          uploadedChunks: 0,
          progress: 0,
          status: "initializing",
        });

        if (typeof window !== "undefined") {
          const savedRaw = window.localStorage.getItem(resumeKey);
          if (savedRaw) {
            try {
              const saved = JSON.parse(savedRaw) as UploadResumeState;
              if (
                saved.fileName === file.name &&
                saved.fileSize === file.size &&
                saved.totalChunks === totalChunks &&
                saved.filetype === filetype
              ) {
                const { data: status } = await apiFetch<UploadStatusResponse>(
                  `/import/upload/status/${encodeURIComponent(saved.uploadId)}`,
                  { method: "GET" },
                );

                uploadId = status.uploadId;
                startChunkIndex = Math.min(status.receivedChunks, totalChunks);
              }
            } catch {
              window.localStorage.removeItem(resumeKey);
            }
          }
        }

        if (!uploadId) {
          const { data } = await apiFetch<InitResponse>("/import/upload/init", {
            method: "POST",
            body: JSON.stringify({
              fileName: file.name,
              fileSize: file.size,
              schoolId,
            }),
          });
          uploadId = data.uploadId;

          if (typeof window !== "undefined") {
            const state: UploadResumeState = {
              uploadId,
              fileName: file.name,
              fileSize: file.size,
              totalChunks,
              filetype,
              jobId,
              schoolId,
            };
            window.localStorage.setItem(resumeKey, JSON.stringify(state));
          }
        }

        // Step 2: Upload chunks
        setProgress((p) => ({
          ...(p || {
            uploadId,
            fileName: file.name,
            totalChunks,
            uploadedChunks: startChunkIndex,
            progress: Math.round((startChunkIndex / totalChunks) * 100),
          }),
          uploadId,
          status: "uploading",
          uploadedChunks: startChunkIndex,
          progress: Math.round((startChunkIndex / totalChunks) * 100),
        }));

        for (
          let chunkIndex = startChunkIndex;
          chunkIndex < totalChunks;
          chunkIndex++
        ) {
          const start = chunkIndex * CHUNK_SIZE;
          const end = Math.min(start + CHUNK_SIZE, file.size);
          const chunkBlob = file.slice(start, end);

          let retries = 0;
          let uploaded = false;

          while (retries < MAX_RETRIES && !uploaded) {
            try {
              const formData = new FormData();
              formData.append("chunk", chunkBlob);
              formData.append("uploadId", uploadId);
              formData.append("chunkIndex", String(chunkIndex));
              formData.append("totalChunks", String(totalChunks));

              await apiFetch<ChunkResponse>("/import/upload/chunk", {
                method: "POST",
                body: formData,
              });

              uploaded = true;
              const uploadedCount = chunkIndex + 1;
              const newProgress = Math.round(
                (uploadedCount / totalChunks) * 100,
              );

              setProgress((p) => ({
                ...(p || {
                  uploadId,
                  fileName: file.name,
                  totalChunks,
                  uploadedChunks: uploadedCount,
                  progress: newProgress,
                  status: "uploading" as const,
                }),
                uploadedChunks: uploadedCount,
                progress: newProgress,
              }));

              onProgress?.({
                uploadId,
                fileName: file.name,
                totalChunks,
                uploadedChunks: uploadedCount,
                progress: newProgress,
                status: "uploading" as const,
              });
            } catch (err) {
              retries++;
              if (retries >= MAX_RETRIES) {
                throw new Error(
                  `Failed to upload chunk ${chunkIndex} after ${MAX_RETRIES} retries: ${
                    err instanceof Error ? err.message : "Unknown error"
                  }`,
                );
              }
              // Exponential backoff: 1s, 2s, 4s
              await new Promise((r) =>
                setTimeout(r, 2 ** (retries - 1) * 1000),
              );
            }
          }
        }

        // Step 3: Complete upload
        setProgress((p) => ({
          ...(p || {
            uploadId,
            fileName: file.name,
            totalChunks,
            uploadedChunks: totalChunks,
            progress: 100,
          }),
          status: "completing" as const,
        }));

        const { data: jobData } = await apiFetch<CompleteResponse>(
          "/import/upload/complete",
          {
            method: "POST",
            body: JSON.stringify({
              uploadId,
              filetype,
              jobId,
              deferProcessing,
              schoolId,
            }),
          },
        );

        setProgress((p) => ({
          ...(p || {
            uploadId,
            fileName: file.name,
            totalChunks,
            uploadedChunks: totalChunks,
            progress: 100,
          }),
          status: "completed" as const,
        }));

        onProgress?.({
          uploadId,
          fileName: file.name,
          totalChunks,
          uploadedChunks: totalChunks,
          progress: 100,
          status: "completed" as const,
        });

        if (typeof window !== "undefined") {
          window.localStorage.removeItem(resumeKey);
        }

        return { jobId: jobData.id };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Upload failed";
        setProgress((p) => ({
          ...(p || {
            uploadId,
            fileName: file.name,
            totalChunks,
            uploadedChunks: 0,
            progress: 0,
          }),
          status: "failed" as const,
          error: errorMsg,
        }));

        throw err;
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setProgress(null);
  }, []);

  return {
    uploadChunkedFile,
    progress,
    reset,
  };
}
