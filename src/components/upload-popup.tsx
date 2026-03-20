"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api/client";
import { formatFileSize, uploadImport } from "@/lib/api/import";

const uploadPopupSchema = z.object({
  excel: z
    .instanceof(File)
    .optional()
    .refine((file) => file instanceof File, {
      message: "Excel file is required",
    })
    .refine(
      (file) =>
        !file ||
        [
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ].includes(file.type),
      { message: "Upload a valid .xls or .xlsx Excel file" },
    ),
  imagesZip: z
    .instanceof(File)
    .optional()
    .refine(
      (file) =>
        !file ||
        file.type === "application/zip" ||
        file.type === "application/x-zip-compressed",
      { message: "Upload a valid .zip file" },
    ),
});

type UploadPopupProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export const UploadPopup = ({
  open: controlledOpen,
  onOpenChange,
}: UploadPopupProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const [loading, setLoading] = useState(false);
  const [excelSize, setExcelSize] = useState<string>("");
  const [imagesZipSize, setImagesZipSize] = useState<string>("");
  const sseRef = useRef<EventSource | null>(null);
  const toastIdRef = useRef<string | number | null>(null);

  useEffect(() => {
    return () => {
      sseRef.current?.close();
      sseRef.current = null;
    };
  }, []);

  const form = useForm<z.infer<typeof uploadPopupSchema>>({
    resolver: zodResolver(uploadPopupSchema),
    defaultValues: {
      excel: undefined,
      imagesZip: undefined,
    },
  });

  const {
    handleSubmit,
    formState: { errors },
    setValue,
  } = form;

  const closeSse = () => {
    sseRef.current?.close();
    sseRef.current = null;
  };

  const startJobStream = (jobId: string) => {
    closeSse();
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Not authenticated");
    }

    const id = toast.loading("Import started", {
      description: "Preparing…",
      duration: Number.POSITIVE_INFINITY,
    });
    toastIdRef.current = id;

    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "";
    const url = `${baseUrl}/import/jobs/${encodeURIComponent(jobId)}/stream?token=${encodeURIComponent(
      token,
    )}`;

    const es = new EventSource(url);
    sseRef.current = es;

    const update = (title: string, description: string) => {
      if (toastIdRef.current == null) return;
      toast.message(title, {
        id: toastIdRef.current,
        description,
        duration: Number.POSITIVE_INFINITY,
      });
    };

    es.addEventListener("job", (evt) => {
      const data = JSON.parse((evt as MessageEvent).data) as {
        status: "pending" | "processing" | "completed" | "failed";
        totalRows: number;
        processedRows: number;
        errorMessage?: string | null;
      };
      const total = data.totalRows ?? 0;
      const processed = data.processedRows ?? 0;
      const pct = total > 0 ? Math.round((processed / total) * 100) : 0;
      update(
        `Import ${data.status}`,
        total > 0
          ? `${processed}/${total} (${pct}%)`
          : `${processed} processed`,
      );
    });

    es.addEventListener("done", (evt) => {
      const data = JSON.parse((evt as MessageEvent).data) as {
        status: "completed" | "failed";
        totalRows: number;
        processedRows: number;
        errorMessage?: string | null;
      };
      closeSse();
      if (toastIdRef.current != null) {
        if (data.status === "completed") {
          toast.success("Import completed", {
            id: toastIdRef.current,
            description: `${data.processedRows}/${data.totalRows}`,
            duration: Number.POSITIVE_INFINITY,
          });
        } else {
          toast.error("Import failed", {
            id: toastIdRef.current,
            description: data.errorMessage || "Unknown error",
            duration: Number.POSITIVE_INFINITY,
          });
        }
      }
    });

    es.addEventListener("error", () => {
      closeSse();
      if (toastIdRef.current != null) {
        toast.error("Import stream disconnected", {
          id: toastIdRef.current,
          description: "Refresh import jobs to see latest status.",
          duration: Number.POSITIVE_INFINITY,
        });
      }
    });
  };

  const onSubmit = async (data: z.infer<typeof uploadPopupSchema>) => {
    setLoading(true);
    try {
      if (!data.excel) {
        throw new Error("Excel file is required");
      }

      const hasImagesZip = Boolean(data.imagesZip);

      const excelUpload = await uploadImport(data.excel, undefined, {
        deferProcessing: hasImagesZip,
      });
      const excelResult = { jobId: excelUpload.data.id };

      if (data.imagesZip) {
        await apiFetch<{ success: true; data: { jobId: string } }>(
          `/import/upload/images/stream?jobId=${encodeURIComponent(excelResult.jobId)}`,
          {
            method: "POST",
            body: data.imagesZip,
            headers: {
              "Content-Type": data.imagesZip.type || "application/zip",
            },
          },
        );
      }

      startJobStream(excelResult.jobId);
      form.reset();
      setExcelSize("");
      setImagesZipSize("");
      setOpen(false);
    } catch (e: unknown) {
      toast.error("Upload failed", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  // File inputs: ensure only one file per input by direct DOM event
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Excel & Images ZIP</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <DialogDescription>
            Upload an Excel file (<b>.xls</b> or <b>.xlsx</b>) to import
            students. You can also upload an optional ZIP file containing
            student images.
          </DialogDescription>

          <div className="flex flex-col gap-2">
            <Label htmlFor="excel">Excel File</Label>
            <Input
              id="excel"
              type="file"
              accept=".xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              disabled={loading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setExcelSize(formatFileSize(file.size));
                } else {
                  setExcelSize("");
                }
                setValue("excel", file as File, { shouldValidate: true });
              }}
            />
            {excelSize && (
              <span className="text-sm text-muted-foreground">
                File size: {excelSize}
              </span>
            )}
            {errors.excel && (
              <span className="text-destructive text-sm">
                {errors.excel.message as string}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="imagesZip">Images ZIP (optional)</Label>
            <Input
              id="imagesZip"
              type="file"
              accept=".zip,application/zip,application/x-zip-compressed"
              disabled={loading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setImagesZipSize(formatFileSize(file.size));
                } else {
                  setImagesZipSize("");
                }
                setValue("imagesZip", file as File, { shouldValidate: true });
              }}
            />
            {imagesZipSize && (
              <span className="text-sm text-muted-foreground">
                File size: {imagesZipSize}
              </span>
            )}
            {errors.imagesZip && (
              <span className="text-destructive text-sm">
                {errors.imagesZip.message as string}
              </span>
            )}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Uploading..." : "Upload"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
