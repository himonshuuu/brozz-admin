import { useCallback, useState } from "react";

interface ErrorResponse {
  message?: string;
}

interface InitResponse {
  data: { uploadId: string; chunkSize: number };
}

interface CompleteResponse {
  data: { id: string };
}

const CHUNK_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_RETRIES = 3;

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

      try {
        // Step 1: Initialize upload session
        setProgress({
          uploadId: "",
          fileName: file.name,
          totalChunks,
          uploadedChunks: 0,
          progress: 0,
          status: "initializing",
        });

        const initRes = await fetch("/import/upload/init", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            fileSize: file.size,
            schoolId,
          }),
        });

        if (!initRes.ok) {
          const error =
            ((await initRes.json()) as ErrorResponse)?.message || "Init failed";
          throw new Error(error);
        }

        const { data } = (await initRes.json()) as InitResponse;
        uploadId = data.uploadId;

        // Step 2: Upload chunks
        setProgress((p) => ({
          ...(p || {
            uploadId,
            fileName: file.name,
            totalChunks,
            uploadedChunks: 0,
            progress: 0,
          }),
          uploadId,
          status: "uploading",
          progress: 0,
        }));

        for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
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

              const chunkRes = await fetch("/import/upload/chunk", {
                method: "POST",
                body: formData,
              });

              if (!chunkRes.ok) {
                const error =
                  ((await chunkRes.json()) as ErrorResponse)?.message ||
                  "Chunk upload failed";
                throw new Error(error);
              }

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

        const completeRes = await fetch("/import/upload/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uploadId,
            filetype,
            jobId,
            deferProcessing,
            schoolId,
          }),
        });

        if (!completeRes.ok) {
          const error =
            ((await completeRes.json()) as ErrorResponse)?.message ||
            "Complete failed";
          throw new Error(error);
        }

        const { data: jobData } =
          (await completeRes.json()) as CompleteResponse;

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
