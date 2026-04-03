"use client";

import { saveAs } from "file-saver";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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

const NEW_TEMPLATE_VALUE = "__new__";

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
    setDraggingId(id);
    setActiveElementId(id);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
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
    setResizingId(id);
    setActiveElementId(id);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onCanvasPointerMove(e: React.PointerEvent) {
    if (!canvasRef.current) return;
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();

    if (resizingId) {
      const rawWidth = e.clientX - rect.left - resizeOrigin.current.left;
      const rawHeight = e.clientY - rect.top - resizeOrigin.current.top;
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
            y: ((resizeOrigin.current.top + heightPx / 2) / rect.height) * 100,
          };
        }),
      );
      return;
    }

    if (!draggingId) return;
    const centerX = e.clientX - rect.left - dragOffset.current.x;
    const centerY = e.clientY - rect.top - dragOffset.current.y;
    const x = Math.max(0, Math.min(100, (centerX / rect.width) * 100));
    const y = Math.max(0, Math.min(100, (centerY / rect.height) * 100));
    setElements((prev) =>
      prev.map((el) =>
        el.id === draggingId ? { ...el, ...clampElement(el, x, y) } : el,
      ),
    );
  }

  function onCanvasPointerUp(e: React.PointerEvent) {
    if (!draggingId && !resizingId) return;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    setDraggingId(null);
    setResizingId(null);
  }

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

  return (
    <div className="flex flex-col gap-4 h-full p-4 overflow-auto">
      {fontFaceCss ? <style>{fontFaceCss}</style> : null}
      <div className="flex flex-wrap items-center gap-3">
        {user?.role === "admin" && (
          <Select
            value={orgId || "all"}
            onValueChange={(val) => setOrgId(val === "all" ? "" : val)}
            disabled={orgsLoading}
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Select Organization" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Organizations</SelectItem>
              {orgs.map((org) => (
                <SelectItem key={org.id} value={org.id}>
                  {org.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select value={datasetId || ""} onValueChange={setDatasetId}>
          <SelectTrigger className="w-[280px]">
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
        >
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Select saved template" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NEW_TEMPLATE_VALUE}>New Template</SelectItem>
            {templates.map((template) => (
              <SelectItem key={template.id} value={template.id}>
                {template.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          className="max-w-[240px]"
          placeholder="Template name"
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
        />

        <Input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onTemplateUpload(file);
            e.currentTarget.value = "";
          }}
          className="max-w-[260px]"
        />

        <Select
          value={previewRecord?.id ?? "__none__"}
          onValueChange={(value) =>
            setPreviewRecordId(value === "__none__" ? "" : value)
          }
          disabled={records.length === 0}
        >
          <SelectTrigger className="w-[240px]">
            <SelectValue placeholder="Preview record" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">No Preview Data</SelectItem>
            {records.map((record) => (
              <SelectItem key={record.id} value={record.id}>
                Row {record.rowIndex + 1}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex-1" />
        <Button variant="outline" onClick={() => void saveTemplate()}>
          Save Template
        </Button>
        <Button
          onClick={() => void handlePrint()}
          disabled={printing || loading}
        >
          {printing ? "Generating..." : "Print Selected"}
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[240px_minmax(0,1fr)_280px] 2xl:grid-cols-[260px_minmax(0,1fr)_300px] gap-4 min-h-[620px]">
        <div className="border rounded-md p-3 space-y-3">
          <div className="text-sm font-medium">Available Fields</div>
          <div className="space-y-1 max-h-[500px] overflow-auto">
            {headers.map((header) => (
              <div key={header} className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => addVariableElement(header)}
                >
                  {header}
                </Button>
                {isImageField(header) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addPhotoElement(header)}
                  >
                    Image
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="border rounded-md p-3 overflow-auto">
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
                className="relative origin-top-left bg-white border overflow-hidden"
                style={{
                  width: canvasSize.width,
                  height: canvasSize.height,
                  transform: `scale(${canvasScale})`,
                }}
                onPointerMove={onCanvasPointerMove}
                onPointerUp={onCanvasPointerUp}
              >
                {backgroundImage ? (
                  <img
                    src={backgroundImage}
                    alt="template"
                    className="pointer-events-none absolute inset-0 h-full w-full object-fill"
                  />
                ) : (
                  <div
                    className="flex items-center justify-center text-muted-foreground text-sm"
                    style={{ height: canvasSize.height }}
                  >
                    Upload template image
                  </div>
                )}
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
                          padding: el.type === "text" ? "2px 6px" : undefined,
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
                          whiteSpace: el.type === "text" ? "pre" : undefined,
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
              </div>
            </div>
          </div>
        </div>

        <div className="border rounded-md p-3 space-y-3">
          <div className="text-sm font-medium">Element Properties</div>
          {activeElement ? (
            <div className="space-y-2">
              <Label>Value (supports {"{{Field}}"})</Label>
              <Input
                value={activeElement.value}
                onChange={(e) => updateActive({ value: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>X (%)</Label>
                  <Input
                    type="number"
                    value={activeElement.x}
                    onChange={(e) =>
                      updateActive({ x: Number(e.target.value) || 0 })
                    }
                  />
                </div>
                <div>
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
                  <Label>Font Family</Label>
                  <Select
                    value={activeElement.fontFamily ?? "__system__"}
                    onValueChange={(value) =>
                      updateActive({
                        fontFamily: value === "__system__" ? undefined : value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select font" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__system__">System Default</SelectItem>
                      {fonts.map((font) => (
                        <SelectItem key={font.fileName} value={font.name}>
                          {font.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Label>Font Size (% of width)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={activeElement.fontSize ?? 2.2}
                    onChange={(e) =>
                      updateActive({ fontSize: Number(e.target.value) || 2.2 })
                    }
                  />
                  <Label>Text Color</Label>
                  <Input
                    value={activeElement.color ?? "#000000"}
                    onChange={(e) => updateActive({ color: e.target.value })}
                  />
                </>
              ) : (
                <>
                  <Label>Width (%)</Label>
                  <Input
                    type="number"
                    value={activeElement.width ?? 24}
                    onChange={(e) =>
                      updateActive({ width: Number(e.target.value) || 24 })
                    }
                  />
                  <Label>Height (%)</Label>
                  <Input
                    type="number"
                    value={activeElement.height ?? 40}
                    onChange={(e) =>
                      updateActive({ height: Number(e.target.value) || 40 })
                    }
                  />
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
            <div className="text-sm text-muted-foreground">
              Select an element on canvas.
            </div>
          )}
        </div>
      </div>

      <div className="border rounded-md overflow-auto">
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
                return (
                  <TableRow key={record.id}>
                    <TableCell>
                      <Checkbox
                        checked={checked}
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
                        {String(record.data[header] ?? "")}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
