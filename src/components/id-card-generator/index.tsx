"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMemoizedCallback } from "@/hooks/use-memoized-callback";
import { Button } from "@/components/ui/button";
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
import { Checkbox } from "@/components/ui/checkbox";
import * as dynamicApi from "@/lib/api/dynamic";
import { toast } from "sonner";
import { saveAs } from "file-saver";
import { apiFetch } from "@/lib/api/client";
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

export function IdCardEditor() {
  const [datasets, setDatasets] = useState<dynamicApi.DatasetDto[]>([]);
  const [datasetId, setDatasetId] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [records, setRecords] = useState<dynamicApi.DynamicRecordDto[]>([]);
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);
  const [templates, setTemplates] = useState<dynamicApi.DynamicTemplateDto[]>(
    [],
  );
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
  const canvasRef = useRef<HTMLDivElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  const activeElement = useMemo(
    () => elements.find((e) => e.id === activeElementId) ?? null,
    [elements, activeElementId],
  );

  const user = useAuthStore((s) => s.user);
  const [orgs, setOrgs] = useState<{ id: string; name: string; email: string }[]>([]);
  const [orgId, setOrgId] = useState<string>("");
  const [orgsLoading, setOrgsLoading] = useState(false);
  const currentDataset = datasets.find((dataset) => dataset.id === datasetId) ?? null;
  const effectiveOrgId =
    user?.role === "admin" ? (orgId || currentDataset?.orgId || "") : (user?.id ?? "");

  useEffect(() => {
    if (user?.role === "admin") {
      setOrgsLoading(true);
      apiFetch<{ success: true; data: { id: string; name: string; email: string }[] }>("/auth/organizations")
        .then((res) => { if (res.success) setOrgs(res.data); })
        .catch(console.error)
        .finally(() => setOrgsLoading(false));
    }
  }, [user?.role]);

  const loadDatasets = useMemoizedCallback(async () => {
    const payload: any = { page: 1, pageSize: 100 };
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

  const loadRecordsAndVariables = useMemoizedCallback(async (targetDatasetId: string) => {
    if (!targetDatasetId) return;
    const targetDataset =
      datasets.find((dataset) => dataset.id === targetDatasetId) ?? null;
    const scopedOrgId =
      user?.role === "admin"
        ? (orgId || targetDataset?.orgId || "")
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
      if (templatesRes.data[0]) {
        const t = templatesRes.data[0];
        setTemplateId(t.id);
        setTemplateName(t.name);
        setBackgroundImage(t.canvas.backgroundImage);
        setCanvasSize({
          width: t.canvas.width || DEFAULT_WIDTH,
          height: t.canvas.height || DEFAULT_HEIGHT,
        });
        setElements(t.canvas.elements);
      } else {
        setTemplateId("");
        setElements([]);
        setBackgroundImage("");
        setCanvasSize({
          width: DEFAULT_WIDTH,
          height: DEFAULT_HEIGHT,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [datasets, orgId, user?.id, user?.role]);

  useEffect(() => {
    void loadDatasets();
  }, [loadDatasets]);

  useEffect(() => {
    if (!datasetId) return;
    setSelectedRecordIds([]);
    void loadRecordsAndVariables(datasetId);
  }, [datasetId, loadRecordsAndVariables]);

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

  function onCanvasPointerMove(e: React.PointerEvent) {
    if (!draggingId || !canvasRef.current) return;
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const centerX = e.clientX - rect.left - dragOffset.current.x;
    const centerY = e.clientY - rect.top - dragOffset.current.y;
    const x = Math.max(0, Math.min(100, (centerX / rect.width) * 100));
    const y = Math.max(0, Math.min(100, (centerY / rect.height) * 100));
    setElements((prev) =>
      prev.map((el) => (el.id === draggingId ? { ...el, x, y } : el)),
    );
  }

  function onCanvasPointerUp(e: React.PointerEvent) {
    if (!draggingId) return;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    setDraggingId(null);
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
        await dynamicApi.updateTemplate(templateId, {
          orgId: effectiveOrgId || undefined,
          name: templateName,
          canvas,
          isDefault: true,
        });
        toast.success("Template updated");
      } else {
        const created = await dynamicApi.createTemplate({
          datasetId,
          orgId: effectiveOrgId || undefined,
          name: templateName || "Default Template",
          canvas,
          isDefault: true,
        });
        setTemplateId(created.data.id);
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

  return (
    <div className="flex flex-col gap-4 h-full p-4 overflow-auto">
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
          value={templateId || ""}
          onValueChange={(id) => {
            setTemplateId(id);
            const selected = templates.find((t) => t.id === id);
            if (selected) {
              setTemplateName(selected.name);
              setBackgroundImage(selected.canvas.backgroundImage);
              setCanvasSize({
                width: selected.canvas.width || DEFAULT_WIDTH,
                height: selected.canvas.height || DEFAULT_HEIGHT,
              });
              setElements(selected.canvas.elements);
            }
          }}
          disabled={templates.length === 0}
        >
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Select saved template" />
          </SelectTrigger>
          <SelectContent>
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

      <div className="grid grid-cols-1 xl:grid-cols-[260px_1fr_300px] gap-4 min-h-[620px]">
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
          <div
            ref={canvasRef}
            className="relative bg-white border overflow-hidden mx-auto"
            style={{
              width: canvasSize.width,
              minHeight: canvasSize.height,
            }}
            onPointerMove={onCanvasPointerMove}
            onPointerUp={onCanvasPointerUp}
          >
            {backgroundImage ? (
              <img
                src={backgroundImage}
                alt="template"
                className="w-full h-auto pointer-events-none"
              />
            ) : (
              <div
                className="flex items-center justify-center text-muted-foreground text-sm"
                style={{ height: canvasSize.height }}
              >
                Upload template image
              </div>
            )}
            {elements.map((el) => (
              <div
                key={el.id}
                onPointerDown={(e) => onFieldPointerDown(e, el.id)}
                onClick={() => setActiveElementId(el.id)}
                className={`absolute cursor-grab select-none ${activeElementId === el.id ? "ring-2 ring-primary" : "ring-1 ring-border"}`}
                style={{
                  left: `${el.x}%`,
                  top: `${el.y}%`,
                  transform: "translate(-50%, -50%)",
                  padding: el.type === "text" ? "2px 6px" : undefined,
                  width: el.type === "image" ? `${el.width ?? 24}%` : undefined,
                  height:
                    el.type === "image" ? `${el.height ?? 40}%` : undefined,
                  background:
                    el.type === "image"
                      ? "rgba(0,0,0,0.08)"
                      : "rgba(255,255,255,0.8)",
                  fontSize:
                    el.type === "text" ? `${el.fontSize ?? 2.2}cqw` : undefined,
                  fontWeight: el.fontWeight,
                  color: el.color,
                }}
              >
                {el.type === "text" ? el.value : `IMG ${el.value}`}
              </div>
            ))}
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
                  <Label>Font Size (% of width)</Label>
                  <Input
                    type="number"
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
