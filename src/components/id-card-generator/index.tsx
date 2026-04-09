"use client";

import { saveAs } from "file-saver";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMemoizedCallback } from "@/hooks/use-memoized-callback";
import { API_BASE, apiFetch } from "@/lib/api/client";
import * as dynamicApi from "@/lib/api/dynamic";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";

type ElementType = dynamicApi.DynamicCanvasElement;

const DEFAULT_WIDTH = 600;
const DEFAULT_HEIGHT = 380;
const IMAGE_FIELD_KEYS = new Set([
  "photo",
  "photo_url",
  "photo_path",
  "photo_key",
  "image",
  "image_url",
  "image_path",
  "image_key",
  "avatar",
  "avatar_url",
  "avatar_path",
  "barcode",
  "barcode_url",
  "barcode_path",
  "qr",
  "qr_code",
  "qr_code_url",
  "qr_code_path",
  "logo",
  "logo_url",
  "logo_path",
]);

function normalizeFieldKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

function isImageField(header: string) {
  return IMAGE_FIELD_KEYS.has(normalizeFieldKey(header));
}

function formatFieldLabel(header: string) {
  return header.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim() || header;
}

function isRenderableImageValue(value: string) {
  return (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:image/")
  );
}

function isImageFilePath(value: string) {
  return /\.(png|jpe?g|gif|webp|svg|bmp|avif)$/i.test(value);
}

function getCompactFileName(value: string) {
  const cleanValue = value.split("?")[0]?.split("#")[0] ?? value;
  const parts = cleanValue.split("/").filter(Boolean);
  return parts.at(-1) || value;
}

const NEW_TEMPLATE_VALUE = "__new__";

const DESIGN_STEPS = [
  {
    key: "data",
    title: "Choose data",
    description: "Pick the organization, dataset, and sample row to preview.",
  },
  {
    key: "template",
    title: "Build template",
    description: "Upload the card background, then add text or image fields.",
  },
  {
    key: "preview",
    title: "Adjust layout",
    description:
      "Drag items on the card and fine-tune them from the right panel.",
  },
  {
    key: "print",
    title: "Print selected",
    description: "Tick the rows you want to export, then generate the ZIP.",
  },
] as const;

export function IdCardEditor() {
  const [datasets, setDatasets] = useState<dynamicApi.DatasetDto[]>([]);
  const [datasetId, setDatasetId] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [records, setRecords] = useState<dynamicApi.DynamicRecordDto[]>([]);
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);
  const [previewRecordId, setPreviewRecordId] = useState<string>("");
  const [templates, setTemplates] = useState<dynamicApi.DynamicTemplateDto[]>(
    [],
  );
  const [fonts, setFonts] = useState<dynamicApi.TemplateFontDto[]>([]);
  const [templateId, setTemplateId] = useState("");
  const [templateName, setTemplateName] = useState("Default Template");
  const [backgroundImage, setBackgroundImage] = useState<string>("");
  const [canvasSize, setCanvasSize] = useState({
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
  });
  const [elements, setElements] = useState<ElementType[]>([]);
  const [activeElementId, setActiveElementId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [printing, setPrinting] = useState(false);
  const canvasViewportRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [resizingId, setResizingId] = useState<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const resizeOrigin = useRef({ left: 0, top: 0 });
  const [canvasViewportWidth, setCanvasViewportWidth] = useState(DEFAULT_WIDTH);
  const activePointerId = useRef<number | null>(null);

  const activeElement = useMemo(
    () => elements.find((e) => e.id === activeElementId) ?? null,
    [elements, activeElementId],
  );
  const previewRecord = useMemo(
    () =>
      records.find((record) => record.id === previewRecordId) ??
      records[0] ??
      null,
    [previewRecordId, records],
  );
  const fontFaceCss = useMemo(
    () =>
      fonts
        .map(
          (font) =>
            `@font-face{font-family:'${font.name.replace(/'/g, "\\'")}';src:url('${API_BASE}${font.url}');}`,
        )
        .join("\n"),
    [fonts],
  );

  const user = useAuthStore((s) => s.user);
  const [orgs, setOrgs] = useState<
    { id: string; name: string; email: string }[]
  >([]);
  const [orgId, setOrgId] = useState<string>("");
  const [orgsLoading, setOrgsLoading] = useState(false);
  const currentDataset =
    datasets.find((dataset) => dataset.id === datasetId) ?? null;
  const hasSelectedOrg = user?.role === "admin" ? Boolean(orgId) : true;
  const effectiveOrgId =
    user?.role === "admin"
      ? orgId || currentDataset?.orgId || ""
      : (user?.id ?? "");

  useEffect(() => {
    if (user?.role === "admin") {
      setOrgsLoading(true);
      apiFetch<{
        success: true;
        data: { id: string; name: string; email: string }[];
      }>("/auth/organizations")
        .then((res) => {
          if (res.success) setOrgs(res.data);
        })
        .catch(console.error)
        .finally(() => setOrgsLoading(false));
    }
  }, [user?.role]);

  useEffect(() => {
    dynamicApi
      .listTemplateFonts()
      .then((res) => setFonts(res.data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    const node = canvasViewportRef.current;
    if (!node || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setCanvasViewportWidth(entry.contentRect.width);
    });

    observer.observe(node);
    setCanvasViewportWidth(node.getBoundingClientRect().width || DEFAULT_WIDTH);

    return () => observer.disconnect();
  }, []);

  const loadDatasets = useMemoizedCallback(async () => {
    if (user?.role === "admin" && !orgId) {
      setDatasets([]);
      setDatasetId("");
      setTemplateId("");
      setTemplates([]);
      setElements([]);
      setBackgroundImage("");
      setHeaders([]);
      setRecords([]);
      setSelectedRecordIds([]);
      setPreviewRecordId("");
      return;
    }

    const payload: { page: number; pageSize: number; orgId?: string } = {
      page: 1,
      pageSize: 100,
    };
    if (user?.role !== "admin") {
      payload.orgId = user?.id;
    } else if (orgId) {
      payload.orgId = orgId;
    }
    const res = await dynamicApi.listDatasets(payload);
    setDatasets(res.data.items);

    if (datasetId && !res.data.items.find((d) => d.id === datasetId)) {
      setDatasetId("");
      setTemplateId("");
      setTemplates([]);
      setElements([]);
      setBackgroundImage("");
      setHeaders([]);
      setRecords([]);
      setSelectedRecordIds([]);
    } else if (!datasetId && res.data.items[0]) {
      setDatasetId(res.data.items[0].id);
    }
  }, [datasetId, orgId, user?.id, user?.role]);

  const loadRecordsAndVariables = useMemoizedCallback(
    async (targetDatasetId: string) => {
      if (!targetDatasetId) return;
      const targetDataset =
        datasets.find((dataset) => dataset.id === targetDatasetId) ?? null;
      const scopedOrgId =
        user?.role === "admin"
          ? orgId || targetDataset?.orgId || ""
          : (user?.id ?? "");
      setLoading(true);
      try {
        const [recordsRes, variablesRes, templatesRes] = await Promise.all([
          dynamicApi.listRecords(targetDatasetId, {
            page: 1,
            pageSize: 200,
            orgId: scopedOrgId || undefined,
          }),
          dynamicApi.getTemplateVariables(targetDatasetId, {
            orgId: scopedOrgId || undefined,
          }),
          dynamicApi.listTemplates({
            datasetId: targetDatasetId,
            orgId: scopedOrgId || undefined,
          }),
        ]);
        setRecords(recordsRes.data.items);
        const nextPreviewRecordId =
          recordsRes.data.items.find((record) => record.id === previewRecordId)
            ?.id ??
          recordsRes.data.items[0]?.id ??
          "";
        setPreviewRecordId(nextPreviewRecordId);
        setHeaders(variablesRes.data.headers);
        setTemplates(templatesRes.data);
        const nextTemplate =
          templatesRes.data.find((template) => template.id === templateId) ??
          templatesRes.data[0] ??
          null;
        applyTemplate(nextTemplate);
      } finally {
        setLoading(false);
      }
    },
    [datasets, orgId, templateId, user?.id, user?.role],
  );

  useEffect(() => {
    void loadDatasets();
  }, [loadDatasets]);

  useEffect(() => {
    if (!datasetId) return;
    setSelectedRecordIds([]);
    setPreviewRecordId("");
    void loadRecordsAndVariables(datasetId);
  }, [datasetId, loadRecordsAndVariables]);

  function resolvePreviewValue(template: string) {
    if (!previewRecord) return template;

    return template.replace(/{{\s*([^}]+)\s*}}/g, (_match, token) => {
      const key = String(token).trim();
      const normalizedKey = normalizeFieldKey(key);

      if (Object.hasOwn(previewRecord.data, key)) {
        return String(previewRecord.data[key] ?? "");
      }

      const dataEntry = Object.entries(previewRecord.data).find(
        ([field]) => normalizeFieldKey(field) === normalizedKey,
      );
      if (dataEntry) return String(dataEntry[1] ?? "");

      if (Object.hasOwn(previewRecord.normalizedData, key)) {
        return String(previewRecord.normalizedData[key] ?? "");
      }

      if (Object.hasOwn(previewRecord.normalizedData, normalizedKey)) {
        return String(previewRecord.normalizedData[normalizedKey] ?? "");
      }

      return "";
    });
  }

  function resolvePreviewImageSrc(template: string) {
    const resolved = resolvePreviewValue(template).trim();
    if (!resolved || !previewRecord) return null;

    if (
      resolved.startsWith("http://") ||
      resolved.startsWith("https://") ||
      resolved.startsWith("data:image/")
    ) {
      return resolved;
    }

    if (previewRecord.photoKey && previewRecord.photoKey === resolved) {
      return previewRecord.photoUrl;
    }

    return null;
  }

  function resolveRecordImageSrc(
    record: dynamicApi.DynamicRecordDto,
    header: string,
  ) {
    const fieldValue = String(record.data[header] ?? "").trim();
    if (!fieldValue) return null;

    if (record.photoKey && record.photoKey === fieldValue) {
      return record.photoUrl;
    }

    if (isRenderableImageValue(fieldValue)) {
      return fieldValue;
    }

    if (isImageFilePath(fieldValue)) {
      return fieldValue.startsWith("/")
        ? `${API_BASE}${fieldValue}`
        : `${API_BASE}/${fieldValue}`;
    }

    return null;
  }

  function applyTemplate(template: dynamicApi.DynamicTemplateDto | null) {
    if (!template) {
      setTemplateId("");
      setTemplateName("Default Template");
      setBackgroundImage("");
      setCanvasSize({
        width: DEFAULT_WIDTH,
        height: DEFAULT_HEIGHT,
      });
      setElements([]);
      setActiveElementId(null);
      return;
    }

    setTemplateId(template.id);
    setTemplateName(template.name);
    setBackgroundImage(template.canvas.backgroundImage);
    setCanvasSize({
      width: template.canvas.width || DEFAULT_WIDTH,
      height: template.canvas.height || DEFAULT_HEIGHT,
    });
    setElements(template.canvas.elements);
    setActiveElementId(null);
  }

  function addVariableElement(header: string) {
    const item: ElementType = {
      id: crypto.randomUUID(),
      type: "text",
      value: `{{${header}}}`,
      x: 50,
      y: 50,
      fontSize: 2.2,
      fontWeight: "normal",
      color: "#000000",
      showLabel: false,
      label: "",
    };
    setElements((prev) => [...prev, item]);
    setActiveElementId(item.id);
  }

  function addPhotoElement(field: string) {
    const item: ElementType = {
      id: crypto.randomUUID(),
      type: "image",
      value: `{{${field}}}`,
      x: 25,
      y: 50,
      width: 24,
      height: 40,
      borderRadius: 0,
    };
    setElements((prev) => [...prev, item]);
    setActiveElementId(item.id);
  }

  function onTemplateUpload(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      const img = new Image();
      img.onload = () => {
        setBackgroundImage(result);
        setCanvasSize({
          width: img.naturalWidth || DEFAULT_WIDTH,
          height: img.naturalHeight || DEFAULT_HEIGHT,
        });
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  }

  function updateActive(patch: Partial<ElementType>) {
    if (!activeElementId) return;
    setElements((prev) =>
      prev.map((e) => (e.id === activeElementId ? { ...e, ...patch } : e)),
    );
  }

  function clampElement(el: ElementType, nextX: number, nextY: number) {
    if (el.type !== "image") {
      return {
        x: Math.max(0, Math.min(100, nextX)),
        y: Math.max(0, Math.min(100, nextY)),
      };
    }

    const halfWidth = (el.width ?? 24) / 2;
    const halfHeight = (el.height ?? 40) / 2;
    return {
      x: Math.max(halfWidth, Math.min(100 - halfWidth, nextX)),
      y: Math.max(halfHeight, Math.min(100 - halfHeight, nextY)),
    };
  }

  const updateInteractionPosition = useMemoizedCallback(
    (clientX: number, clientY: number) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();

      if (resizingId) {
        const rawWidth = clientX - rect.left - resizeOrigin.current.left;
        const rawHeight = clientY - rect.top - resizeOrigin.current.top;
        const widthPx = Math.max(
          24,
          Math.min(rect.width - resizeOrigin.current.left, rawWidth),
        );
        const heightPx = Math.max(
          24,
          Math.min(rect.height - resizeOrigin.current.top, rawHeight),
        );

        setElements((prev) =>
          prev.map((el) => {
            if (el.id !== resizingId || el.type !== "image") return el;
            const width = Math.max(1, (widthPx / rect.width) * 100);
            const height = Math.max(1, (heightPx / rect.height) * 100);
            return {
              ...el,
              width,
              height,
              x: ((resizeOrigin.current.left + widthPx / 2) / rect.width) * 100,
              y:
                ((resizeOrigin.current.top + heightPx / 2) / rect.height) * 100,
            };
          }),
        );
        return;
      }

      if (!draggingId) return;
      const centerX = clientX - rect.left - dragOffset.current.x;
      const centerY = clientY - rect.top - dragOffset.current.y;
      const x = Math.max(0, Math.min(100, (centerX / rect.width) * 100));
      const y = Math.max(0, Math.min(100, (centerY / rect.height) * 100));
      setElements((prev) =>
        prev.map((el) =>
          el.id === draggingId ? { ...el, ...clampElement(el, x, y) } : el,
        ),
      );
    },
    [draggingId, resizingId],
  );

  const stopInteraction = useMemoizedCallback(() => {
    activePointerId.current = null;
    setDraggingId(null);
    setResizingId(null);
  }, []);

  function onFieldPointerDown(e: React.PointerEvent, id: string) {
    if (!canvasRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    const rect = canvasRef.current.getBoundingClientRect();
    const target = elements.find((x) => x.id === id);
    if (!target) return;
    const centerX = (target.x / 100) * rect.width;
    const centerY = (target.y / 100) * rect.height;
    dragOffset.current = {
      x: e.clientX - rect.left - centerX,
      y: e.clientY - rect.top - centerY,
    };
    activePointerId.current = e.pointerId;
    setDraggingId(id);
    setActiveElementId(id);
  }

  function onResizeHandlePointerDown(e: React.PointerEvent, id: string) {
    if (!canvasRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    const rect = canvasRef.current.getBoundingClientRect();
    const target = elements.find((x) => x.id === id);
    if (!target || target.type !== "image") return;

    const widthPx = ((target.width ?? 24) / 100) * rect.width;
    const heightPx = ((target.height ?? 40) / 100) * rect.height;
    const centerX = (target.x / 100) * rect.width;
    const centerY = (target.y / 100) * rect.height;
    resizeOrigin.current = {
      left: centerX - widthPx / 2,
      top: centerY - heightPx / 2,
    };
    activePointerId.current = e.pointerId;
    setResizingId(id);
    setActiveElementId(id);
  }

  function onCanvasPointerMove(e: React.PointerEvent) {
    if (
      activePointerId.current !== null &&
      e.pointerId !== activePointerId.current
    ) {
      return;
    }
    e.preventDefault();
    updateInteractionPosition(e.clientX, e.clientY);
  }

  function onCanvasPointerUp(e: React.PointerEvent) {
    if (
      activePointerId.current !== null &&
      e.pointerId !== activePointerId.current
    ) {
      return;
    }
    if (!draggingId && !resizingId) return;
    stopInteraction();
  }

  useEffect(() => {
    if (!draggingId && !resizingId) return;

    const handlePointerMove = (event: PointerEvent) => {
      if (
        activePointerId.current !== null &&
        event.pointerId !== activePointerId.current
      ) {
        return;
      }
      updateInteractionPosition(event.clientX, event.clientY);
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (
        activePointerId.current !== null &&
        event.pointerId !== activePointerId.current
      ) {
        return;
      }
      stopInteraction();
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [draggingId, resizingId, stopInteraction, updateInteractionPosition]);

  async function saveTemplate() {
    if (!datasetId) return;
    if (!backgroundImage) {
      toast.error("Upload a template background image first");
      return;
    }

    const canvas: dynamicApi.DynamicCanvas = {
      width: canvasSize.width,
      height: canvasSize.height,
      backgroundImage,
      elements,
    };

    try {
      if (templateId) {
        const updated = await dynamicApi.updateTemplate(templateId, {
          orgId: effectiveOrgId || undefined,
          name: templateName,
          canvas,
          isDefault: true,
        });
        applyTemplate(updated.data);
        toast.success("Template updated");
      } else {
        const created = await dynamicApi.createTemplate({
          datasetId,
          orgId: effectiveOrgId || undefined,
          name: templateName || "Default Template",
          canvas,
          isDefault: true,
        });
        applyTemplate(created.data);
        toast.success("Template saved");
      }
      const refreshed = await dynamicApi.listTemplates({
        datasetId,
        orgId: effectiveOrgId || undefined,
      });
      setTemplates(refreshed.data);
    } catch (error) {
      toast.error("Failed to save template", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async function handlePrint() {
    if (!datasetId || !templateId) {
      toast.error("Select dataset and save template first");
      return;
    }
    if (selectedRecordIds.length === 0) {
      toast.error("Select at least one record to print");
      return;
    }
    setPrinting(true);
    try {
      const blob = await dynamicApi.printDataset(datasetId, {
        templateId,
        orgId: effectiveOrgId || undefined,
        recordIds: selectedRecordIds,
      });
      saveAs(blob, "dynamic-id-cards.zip");
    } catch (error) {
      toast.error("Print failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setPrinting(false);
    }
  }

  const selectedAll =
    records.length > 0 && selectedRecordIds.length === records.length;
  const canvasScale = Math.min(
    1,
    Math.max(0.1, canvasViewportWidth / canvasSize.width),
  );
  const hasDataset = Boolean(datasetId);
  const hasPreviewData = Boolean(previewRecord);
  const canStartDesign = hasSelectedOrg && hasDataset && hasPreviewData;
  const hasBackground = Boolean(backgroundImage);
  const hasElements = elements.length > 0;
  const hasSelectedRecords = selectedRecordIds.length > 0;
  const completedStepCount = [
    hasDataset,
    hasBackground,
    hasElements,
    hasSelectedRecords,
  ].filter(Boolean).length;
  const previewLabel = previewRecord
    ? `Row ${previewRecord.rowIndex + 1}`
    : "No preview selected";

  return (
    <div className="flex flex-col gap-4 h-full p-4 overflow-auto">
      {fontFaceCss ? <style>{fontFaceCss}</style> : null}
      <Card className="border border-border/70 bg-muted/20 py-0">
        <CardHeader className="gap-3 border-b py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>How this page works</CardTitle>
              <CardDescription>
                Complete the setup from left to right. You are designing one
                card layout, previewing it with one row, then exporting the
                checked rows.
              </CardDescription>
            </div>
            <Badge variant="outline">
              {completedStepCount}/{DESIGN_STEPS.length} steps ready
            </Badge>
          </div>
          <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-4">
            {DESIGN_STEPS.map((step, index) => {
              const complete =
                (step.key === "data" && hasDataset) ||
                (step.key === "template" && hasBackground) ||
                (step.key === "preview" && hasElements) ||
                (step.key === "print" && hasSelectedRecords);

              return (
                <div
                  key={step.key}
                  className={cn(
                    "rounded-lg border px-3 py-3 text-sm",
                    complete
                      ? "border-primary/40 bg-primary/5"
                      : "border-dashed border-border bg-background/70",
                  )}
                >
                  <div className="mb-1 flex items-center gap-2">
                    <Badge variant={complete ? "default" : "outline"}>
                      {index + 1}
                    </Badge>
                    <div className="font-medium">{step.title}</div>
                  </div>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              );
            })}
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 py-4 lg:grid-cols-[1.2fr_1fr_auto]">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="space-y-2">
              <Label>Organization</Label>
              {user?.role === "admin" ? (
                <Select
                  value={orgId}
                  onValueChange={setOrgId}
                  disabled={orgsLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select organization" />
                  </SelectTrigger>
                  <SelectContent>
                    {orgs.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input value={user?.name ?? "Current Organization"} disabled />
              )}
              <p className="text-xs text-muted-foreground">
                Filter datasets by organization first.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Dataset</Label>
              <Select
                value={datasetId || ""}
                onValueChange={setDatasetId}
                disabled={!hasSelectedOrg}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select dataset" />
                </SelectTrigger>
                <SelectContent>
                  {datasets.map((dataset) => (
                    <SelectItem key={dataset.id} value={dataset.id}>
                      {dataset.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {!hasSelectedOrg
                  ? "Choose an organization first."
                  : "Choose the records that will supply the card fields."}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Preview row</Label>
              <Select
                value={previewRecord?.id ?? "__none__"}
                onValueChange={(value) =>
                  setPreviewRecordId(value === "__none__" ? "" : value)
                }
                disabled={!hasSelectedOrg || records.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Preview row" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No preview data</SelectItem>
                  {records.map((record) => (
                    <SelectItem key={record.id} value={record.id}>
                      Row {record.rowIndex + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Choose a preview row first. Without these details, you cannot
                design the ID card.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="space-y-2">
              <Label>Saved template</Label>
              <Select
                value={templateId || NEW_TEMPLATE_VALUE}
                onValueChange={(id) => {
                  if (id === NEW_TEMPLATE_VALUE) {
                    applyTemplate(null);
                    return;
                  }
                  const selected = templates.find((t) => t.id === id) ?? null;
                  applyTemplate(selected);
                }}
                disabled={!canStartDesign}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select saved template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NEW_TEMPLATE_VALUE}>
                    New Template
                  </SelectItem>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Load an existing design or start a new one after choosing the
                dataset and preview row.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Template name</Label>
              <Input
                placeholder="Template name"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                disabled={!canStartDesign}
              />
              <p className="text-xs text-muted-foreground">
                Save multiple layouts for the same dataset.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Card background image</Label>
              <Input
                type="file"
                accept="image/*"
                disabled={!canStartDesign}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onTemplateUpload(file);
                  e.currentTarget.value = "";
                }}
              />
              <p className="text-xs text-muted-foreground">
                Choose the details first, then upload the base card design
                before placing fields on it.
              </p>
            </div>
          </div>

          <div className="flex items-end gap-2 justify-self-start lg:justify-self-end">
            <Button
              variant="outline"
              onClick={() => void saveTemplate()}
              disabled={!canStartDesign}
            >
              Save Template
            </Button>
            <Button
              onClick={() => void handlePrint()}
              disabled={printing || loading || !canStartDesign}
            >
              {printing ? "Generating..." : "Print Selected"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[280px_minmax(0,1fr)_320px] min-h-[620px]">
        <Card className="border border-border/70">
          <CardHeader className="border-b">
            <CardTitle>Available Fields</CardTitle>
            <CardDescription>
              Add a text field for any column. Use image fields for photos, QR
              codes, or logos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!hasSelectedOrg ? (
              <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                Select an organization first to load available fields.
              </div>
            ) : !hasDataset ? (
              <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                Select a dataset first to load available columns.
              </div>
            ) : !hasPreviewData ? (
              <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                Select a preview row first. Without choosing the details, you
                cannot design the ID card.
              </div>
            ) : headers.length === 0 ? (
              <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                No fields were found in this dataset.
              </div>
            ) : null}
            {hasSelectedOrg ? (
              <div className="space-y-2 max-h-[520px] overflow-auto pr-1">
                {headers.map((header) => {
                  const imageField = isImageField(header);

                  return (
                    <button
                      type="button"
                      key={header}
                      onClick={() =>
                        imageField
                          ? addPhotoElement(header)
                          : addVariableElement(header)
                      }
                      disabled={!canStartDesign}
                      className="w-full rounded-lg border bg-background/70 p-2 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
                    >
                      <div className="flex items-center gap-2 rounded-md border border-dashed border-border/80 px-2 py-1.5">
                        <span className="min-w-0 flex-1 truncate text-sm font-medium capitalize">
                          {formatFieldLabel(header)}
                        </span>
                        <Badge variant="outline" className="shrink-0 uppercase">
                          {imageField ? "image" : "text"}
                        </Badge>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border border-border/70 overflow-hidden">
          <CardHeader className="border-b">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>Card Preview</CardTitle>
                <CardDescription>
                  Drag text or image blocks on the card. Click an item to edit
                  it from the right panel.
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{previewLabel}</Badge>
                <Badge variant="outline">
                  {canvasSize.width} x {canvasSize.height}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="overflow-auto py-4">
            {!hasBackground ? (
              <div className="flex min-h-[520px] items-center justify-center rounded-lg border border-dashed bg-muted/20 p-6 text-center">
                <div className="max-w-sm space-y-2">
                  <div className="font-medium">
                    {!canStartDesign
                      ? "Choose details to start designing"
                      : "Upload a card background to start"}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {!canStartDesign
                      ? "Select the dataset and preview row first. Without choosing these details, the ID card designer stays locked."
                      : "Once the base card image is uploaded, add fields from the left panel and drag them into position here."}
                  </p>
                </div>
              </div>
            ) : (
              <div ref={canvasViewportRef} className="mx-auto w-fit max-w-fit">
                <div
                  className="mx-auto"
                  style={{
                    width: canvasSize.width * canvasScale,
                    height: canvasSize.height * canvasScale,
                  }}
                >
                  <div
                    ref={canvasRef}
                    className="relative origin-top-left overflow-hidden border bg-white"
                    style={{
                      width: canvasSize.width,
                      height: canvasSize.height,
                      transform: `scale(${canvasScale})`,
                    }}
                    onPointerMove={onCanvasPointerMove}
                    onPointerUp={onCanvasPointerUp}
                  >
                    <img
                      src={backgroundImage}
                      alt="template"
                      className="pointer-events-none absolute inset-0 h-full w-full object-fill"
                    />
                    {elements.map((el) =>
                      (() => {
                        const previewText =
                          resolvePreviewValue(el.value) || el.value;
                        const previewImageSrc =
                          el.type === "image"
                            ? resolvePreviewImageSrc(el.value)
                            : null;

                        return (
                          <div
                            key={el.id}
                            onPointerDown={(e) => onFieldPointerDown(e, el.id)}
                            onClick={() => setActiveElementId(el.id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                setActiveElementId(el.id);
                              }
                            }}
                            role="button"
                            tabIndex={0}
                            className={`absolute select-none ${el.type === "image" ? "cursor-grab" : "cursor-move"} ${activeElementId === el.id ? "ring-2 ring-primary" : "ring-1 ring-border"}`}
                            style={{
                              left: `${el.x}%`,
                              top: `${el.y}%`,
                              transform: "translate(-50%, -50%)",
                              padding:
                                el.type === "text" ? "2px 6px" : undefined,
                              width:
                                el.type === "image"
                                  ? `${el.width ?? 24}%`
                                  : undefined,
                              height:
                                el.type === "image"
                                  ? `${el.height ?? 40}%`
                                  : undefined,
                              background:
                                el.type === "image"
                                  ? "rgba(0,0,0,0.08)"
                                  : "rgba(255,255,255,0.8)",
                              fontSize:
                                el.type === "text"
                                  ? `${Math.max(8, Math.round((canvasSize.width * (el.fontSize ?? 2.4)) / 100))}px`
                                  : undefined,
                              fontFamily:
                                el.type === "text"
                                  ? (el.fontFamily ?? "inherit")
                                  : undefined,
                              fontWeight: el.fontWeight,
                              color: el.color,
                              lineHeight: el.type === "text" ? 1 : undefined,
                              whiteSpace:
                                el.type === "text" ? "pre" : undefined,
                              overflow:
                                el.type === "image" ? "hidden" : undefined,
                              borderRadius:
                                el.type === "image"
                                  ? `${Math.max(0, Math.min(50, el.borderRadius ?? 0))}%`
                                  : undefined,
                            }}
                          >
                            {el.type === "text" ? (
                              previewText
                            ) : previewImageSrc ? (
                              <img
                                src={previewImageSrc}
                                alt={el.value}
                                className="h-full w-full object-cover"
                                draggable={false}
                              />
                            ) : (
                              `IMG ${previewText}`
                            )}
                            {el.type === "image" ? (
                              <button
                                type="button"
                                aria-label="Resize image"
                                onPointerDown={(e) =>
                                  onResizeHandlePointerDown(e, el.id)
                                }
                                className="absolute -bottom-2 -right-2 h-4 w-4 cursor-se-resize rounded-full border border-primary bg-background shadow-sm"
                              />
                            ) : null}
                          </div>
                        );
                      })(),
                    )}
                    {!hasElements ? (
                      <div className="pointer-events-none absolute inset-x-6 bottom-6 rounded-lg border border-dashed bg-background/90 px-4 py-3 text-sm text-muted-foreground shadow-sm">
                        Add a field from the left panel. Text fields show sample
                        values from the preview row. Image fields use supported
                        photo or QR columns.
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-border/70">
          <CardHeader className="border-b">
            <CardTitle>Element Properties</CardTitle>
            <CardDescription>
              Select a field on the preview to adjust its content, position, and
              size.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeElement ? (
              <div className="space-y-3">
                <div className="rounded-lg border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                  {activeElement.type === "text"
                    ? "Tip: use {{Field}} to inject dataset values into this text block."
                    : "Tip: drag the corner handle on the preview to resize the image block."}
                </div>
                <div className="space-y-2">
                  <Label>Value (supports {"{{Field}}"})</Label>
                  <Input
                    value={activeElement.value}
                    onChange={(e) => updateActive({ value: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label>X (%)</Label>
                    <Input
                      type="number"
                      value={activeElement.x}
                      onChange={(e) =>
                        updateActive({ x: Number(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Y (%)</Label>
                    <Input
                      type="number"
                      value={activeElement.y}
                      onChange={(e) =>
                        updateActive({ y: Number(e.target.value) || 0 })
                      }
                    />
                  </div>
                </div>
                {activeElement.type === "text" ? (
                  <>
                    <div className="space-y-2">
                      <Label>Font Family</Label>
                      <Select
                        value={activeElement.fontFamily ?? "__system__"}
                        onValueChange={(value) =>
                          updateActive({
                            fontFamily:
                              value === "__system__" ? undefined : value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select font" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__system__">
                            System Default
                          </SelectItem>
                          {fonts.map((font) => (
                            <SelectItem key={font.fileName} value={font.name}>
                              {font.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Font Size (% of width)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={activeElement.fontSize ?? 2.2}
                        onChange={(e) =>
                          updateActive({
                            fontSize: Number(e.target.value) || 2.2,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Text Color</Label>
                      <Input
                        value={activeElement.color ?? "#000000"}
                        onChange={(e) =>
                          updateActive({ color: e.target.value })
                        }
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label>Width (%)</Label>
                      <Input
                        type="number"
                        value={activeElement.width ?? 24}
                        onChange={(e) =>
                          updateActive({ width: Number(e.target.value) || 24 })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Height (%)</Label>
                      <Input
                        type="number"
                        value={activeElement.height ?? 40}
                        onChange={(e) =>
                          updateActive({
                            height: Number(e.target.value) || 40,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Corner Radius (%)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="50"
                        value={activeElement.borderRadius ?? 0}
                        onChange={(e) =>
                          updateActive({
                            borderRadius: Math.max(
                              0,
                              Math.min(50, Number(e.target.value) || 0),
                            ),
                          })
                        }
                      />
                    </div>
                  </>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setElements((prev) =>
                      prev.filter((e) => e.id !== activeElement.id),
                    );
                    setActiveElementId(null);
                  }}
                >
                  Remove Element
                </Button>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                Select a text or image block on the preview. This panel will
                then show the controls for editing that item.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border border-border/70 overflow-hidden">
        <CardHeader className="border-b">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Rows to Print</CardTitle>
              <CardDescription>
                Check the rows you want to export. Click any row to preview it
                on the card above.
              </CardDescription>
            </div>
            <Badge variant="outline">{selectedRecordIds.length} selected</Badge>
          </div>
        </CardHeader>
        <CardContent className="overflow-auto px-0 py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">
                  <Checkbox
                    checked={selectedAll}
                    onCheckedChange={(checked) => {
                      setSelectedRecordIds(
                        checked ? records.map((r) => r.id) : [],
                      );
                    }}
                  />
                </TableHead>
                {headers.map((header) => (
                  <TableHead key={header}>{header}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={headers.length + 1}>
                    Loading records...
                  </TableCell>
                </TableRow>
              ) : records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={headers.length + 1}>No records</TableCell>
                </TableRow>
              ) : (
                records.map((record) => {
                  const checked = selectedRecordIds.includes(record.id);
                  const isPreview = previewRecord?.id === record.id;
                  return (
                    <TableRow
                      key={record.id}
                      className={cn(
                        "cursor-pointer",
                        isPreview && "bg-primary/5",
                      )}
                      onClick={() => setPreviewRecordId(record.id)}
                    >
                      <TableCell>
                        <Checkbox
                          checked={checked}
                          onClick={(e) => e.stopPropagation()}
                          onCheckedChange={(value) => {
                            if (value) {
                              setSelectedRecordIds((prev) => [
                                ...prev,
                                record.id,
                              ]);
                            } else {
                              setSelectedRecordIds((prev) =>
                                prev.filter((id) => id !== record.id),
                              );
                            }
                          }}
                        />
                      </TableCell>
                      {headers.map((header) => (
                        <TableCell key={`${record.id}-${header}`}>
                          {(() => {
                            const rawValue = String(record.data[header] ?? "");
                            const imageSrc = isImageField(header)
                              ? resolveRecordImageSrc(record, header)
                              : null;
                            const displayValue =
                              imageSrc && rawValue
                                ? getCompactFileName(rawValue)
                                : rawValue;

                            return (
                              <div className="flex min-w-0 items-center gap-2">
                                {imageSrc ? (
                                  <Avatar className="h-8 w-8 shrink-0 rounded-md">
                                    <AvatarImage
                                      src={imageSrc}
                                      alt={header}
                                      className="rounded-md object-cover"
                                    />
                                    <AvatarFallback className="rounded-md text-[10px]">
                                      IMG
                                    </AvatarFallback>
                                  </Avatar>
                                ) : null}
                                <span className="truncate text-sm">
                                  {displayValue}
                                </span>
                                {header === headers[0] && isPreview ? (
                                  <Badge variant="outline">Preview</Badge>
                                ) : null}
                              </div>
                            );
                          })()}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
