"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import * as dynamicApi from "@/lib/api/dynamic";

type ScalarValue = string | number | boolean | null;

type Props = {
  orgId?: string;
};

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

function isRenderableImageValue(value: string) {
  return (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:image/")
  );
}

export function DynamicFormDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  headers: string[];
  requiredFields: string[];
  headerMap: Record<string, string>;
  editingRecord?: dynamicApi.DynamicRecordDto | null;
  orgId?: string;
  onSubmit: (data: Record<string, ScalarValue>) => Promise<void>;
}) {
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [uploadedPreviewUrls, setUploadedPreviewUrls] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    if (!props.open) return;
    const initial: Record<string, string> = {};
    for (const header of props.headers) {
      initial[header] = String(props.editingRecord?.data?.[header] ?? "");
    }
    setForm(initial);
    setUploadedPreviewUrls({});
  }, [props.open, props.headers, props.editingRecord]);

  const requiredRawHeaders = useMemo(() => {
    const byMapped = new Set(props.requiredFields);
    return props.headers.filter((h) => byMapped.has(props.headerMap[h] ?? h));
  }, [props.headers, props.requiredFields, props.headerMap]);

  async function submit() {
    const payload: Record<string, ScalarValue> = {};
    for (const header of props.headers)
      payload[header] = (form[header] ?? "").trim();

    for (const requiredHeader of requiredRawHeaders) {
      if (!String(payload[requiredHeader] ?? "").trim()) {
        toast.error(`Missing required field: ${requiredHeader}`);
        return;
      }
    }

    setSaving(true);
    try {
      await props.onSubmit(payload);
      props.onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {props.editingRecord ? "Edit Record" : "Add Record"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[60vh] overflow-auto pr-1">
          {props.headers.map((header) => {
            const mapped = props.headerMap[header] ?? header;
            const isRequired = props.requiredFields.includes(mapped);
            const imageField = isImageField(header);
            const fieldValue = String(form[header] ?? "");
            const uploadedPreviewUrl = uploadedPreviewUrls[header] ?? null;
            const storedPreviewUrl =
              imageField &&
              props.editingRecord?.photoKey &&
              props.editingRecord.photoKey === fieldValue.trim()
                ? (props.editingRecord.photoUrl ?? null)
                : null;
            const previewUrl =
              uploadedPreviewUrl ??
              storedPreviewUrl ??
              (isRenderableImageValue(fieldValue.trim())
                ? fieldValue.trim()
                : null);
            return (
              <div key={header} className="space-y-1.5">
                <Label>
                  {header}
                  {isRequired ? " *" : ""}
                </Label>
                {imageField ? (
                  <div className="space-y-2">
                    {previewUrl ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-12 w-12 rounded-md" size="lg">
                          <AvatarImage
                            src={previewUrl}
                            alt={header}
                            className="rounded-md"
                          />
                          <AvatarFallback className="rounded-md">
                            IMG
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 text-xs text-muted-foreground break-all">
                          {fieldValue}
                        </div>
                      </div>
                    ) : null}
                    <Input
                      value={fieldValue}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          [header]: e.target.value,
                        }))
                      }
                      placeholder="Image URL or storage key"
                    />
                    <Input
                      type="file"
                      accept="image/*"
                      disabled={saving || uploadingField === header}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setUploadingField(header);
                        try {
                          const res = await dynamicApi.uploadRecordImage(file, {
                            orgId: props.orgId,
                          });
                          setForm((prev) => ({
                            ...prev,
                            [header]: res.data.key,
                          }));
                          setUploadedPreviewUrls((prev) => ({
                            ...prev,
                            [header]: res.data.url,
                          }));
                          toast.success("Image uploaded");
                        } catch (error) {
                          toast.error("Failed to upload image", {
                            description:
                              error instanceof Error
                                ? error.message
                                : "Unknown error",
                          });
                        } finally {
                          setUploadingField(null);
                          e.currentTarget.value = "";
                        }
                      }}
                    />
                  </div>
                ) : (
                  <Input
                    value={fieldValue}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, [header]: e.target.value }))
                    }
                  />
                )}
              </div>
            );
          })}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => props.onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DynamicRecordsManager({ orgId }: Props) {
  const [datasets, setDatasets] = useState<dynamicApi.DatasetDto[]>([]);
  const [datasetId, setDatasetId] = useState<string>("");
  const [records, setRecords] = useState<dynamicApi.DynamicRecordDto[]>([]);
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [headerMap, setHeaderMap] = useState<Record<string, string>>({});
  const [requiredFields, setRequiredFields] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<string>("rowIndex");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [loading, setLoading] = useState(false);
  const [editingRecord, setEditingRecord] =
    useState<dynamicApi.DynamicRecordDto | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const loadDatasets = useMemoizedCallback(async () => {
    const res = await dynamicApi.listDatasets({
      orgId,
      page: 1,
      pageSize: 100,
    });
    setDatasets(res.data.items);
    if (!datasetId && res.data.items[0]) {
      setDatasetId(res.data.items[0].id);
    }
  }, [datasetId, orgId]);

  const loadRecords = useMemoizedCallback(
    async (
      targetDatasetId: string,
      targetPage = page,
      targetSearch = search,
      targetSortBy = sortBy,
      targetSortOrder = sortOrder,
    ) => {
      if (!targetDatasetId) return;
      setLoading(true);
      try {
        const res = await dynamicApi.listRecords(targetDatasetId, {
          page: targetPage,
          pageSize,
          search: targetSearch || undefined,
          orgId,
          sortBy: targetSortBy,
          sortOrder: targetSortOrder,
        });
        setRecords(res.data.items);
        setHeaders(res.data.headers);
        setHeaderMap(res.data.headerMap);
        setRequiredFields(res.data.requiredFields);
        setTotal(res.data.total);
      } catch (error) {
        toast.error("Failed to load records", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      } finally {
        setLoading(false);
      }
    },
    [datasetId, orgId, page, search, pageSize, sortBy, sortOrder],
  );

  useEffect(() => {
    void loadDatasets();
  }, [loadDatasets]);

  useEffect(() => {
    if (!datasetId) return;
    setSelectedRecordIds([]);
    void loadRecords(datasetId, page, search, sortBy, sortOrder);
  }, [datasetId, page, search, sortBy, sortOrder, loadRecords]);

  const currentDataset = datasets.find((d) => d.id === datasetId) ?? null;
  const effectiveOrgId = currentDataset?.orgId ?? orgId;
  const allSelected =
    records.length > 0 && selectedRecordIds.length === records.length;

  function toggleRecordSelection(recordId: string, checked: boolean) {
    setSelectedRecordIds((prev) =>
      checked
        ? [...new Set([...prev, recordId])]
        : prev.filter((id) => id !== recordId),
    );
  }

  async function deleteRecords(recordIds: string[]) {
    if (recordIds.length === 0) return;

    try {
      await Promise.all(
        recordIds.map((recordId) =>
          dynamicApi.deleteRecord(recordId, {
            orgId: effectiveOrgId,
          }),
        ),
      );
      setSelectedRecordIds((prev) =>
        prev.filter((id) => !recordIds.includes(id)),
      );
      toast.success(
        recordIds.length === 1
          ? "Record deleted"
          : `${recordIds.length} records deleted`,
      );
      if (datasetId) {
        await loadRecords(datasetId, page, search, sortBy, sortOrder);
      }
    } catch (error) {
      toast.error("Delete failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  function renderRecordValue(
    record: dynamicApi.DynamicRecordDto,
    header: string,
  ) {
    if (isImageField(header)) {
      const fieldValue = String(record.data[header] ?? "").trim();
      const previewUrl =
        record.photoKey && record.photoKey === fieldValue
          ? record.photoUrl
          : isRenderableImageValue(fieldValue)
            ? fieldValue
            : null;

      return (
        <div className="flex min-w-0 items-center gap-2">
          {previewUrl ? (
            <Avatar className="h-8 w-8 rounded-md shrink-0" size="default">
              <AvatarImage
                src={previewUrl}
                alt={header}
                className="rounded-md"
              />
              <AvatarFallback className="rounded-md text-[10px]">
                IMG
              </AvatarFallback>
            </Avatar>
          ) : null}
          <span className="block max-w-full overflow-x-auto whitespace-nowrap text-sm">
            {String(record.data[header] ?? "")}
          </span>
        </div>
      );
    }

    return (
      <span className="block max-w-full overflow-x-auto whitespace-nowrap text-sm">
        {String(record.data[header] ?? "")}
      </span>
    );
  }

  return (
    <div className="space-y-4 px-4 lg:px-6">
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={datasetId || undefined}
          onValueChange={(value) => {
            setDatasetId(value);
            setPage(1);
            setSearch("");
            setSortBy("rowIndex");
            setSortOrder("asc");
          }}
        >
          <SelectTrigger className="w-[320px]" size="sm">
            <SelectValue placeholder="Select dataset" />
          </SelectTrigger>
          <SelectContent>
            {datasets.map((dataset) => (
              <SelectItem key={dataset.id} value={dataset.id}>
                {dataset.name} ({dataset.totalRecords})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex-1" />
        <Button
          variant="destructive"
          size="sm"
          disabled={selectedRecordIds.length === 0}
          onClick={() => void deleteRecords(selectedRecordIds)}
        >
          Delete Selected ({selectedRecordIds.length})
        </Button>
        <Button
          onClick={() => {
            setEditingRecord(null);
            setFormOpen(true);
          }}
          disabled={!datasetId}
          size="sm"
        >
          Add Record
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Input
          placeholder="Search in dataset"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
        <Select value={sortBy} onValueChange={(value) => setSortBy(value)}>
          <SelectTrigger className="w-[220px]" size="sm">
            <SelectValue placeholder="Sort field" />
          </SelectTrigger>
          <SelectContent>
            {headers.map((header) => (
              <SelectItem key={header} value={header}>
                {header}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={sortOrder}
          onValueChange={(value) => setSortOrder(value as "asc" | "desc")}
        >
          <SelectTrigger className="w-[140px]" size="sm">
            <SelectValue placeholder="Order" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">Ascending</SelectItem>
            <SelectItem value="desc">Descending</SelectItem>
          </SelectContent>
        </Select>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setPage(1);
            if (datasetId)
              void loadRecords(datasetId, 1, search, sortBy, sortOrder);
          }}
        >
          Search
        </Button>
      </div>

      <div className="hidden rounded-md border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[48px]">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={(checked) => {
                    setSelectedRecordIds(
                      checked ? records.map((record) => record.id) : [],
                    );
                  }}
                  aria-label="Select all records"
                />
              </TableHead>
              {headers.map((header) => (
                <TableHead key={header}>{header}</TableHead>
              ))}
              <TableHead className="w-[160px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={headers.length + 2}>Loading...</TableCell>
              </TableRow>
            ) : records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={headers.length + 2}>
                  No records found
                </TableCell>
              </TableRow>
            ) : (
              records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedRecordIds.includes(record.id)}
                      onCheckedChange={(checked) =>
                        toggleRecordSelection(record.id, Boolean(checked))
                      }
                      aria-label={`Select row ${record.rowIndex + 1}`}
                    />
                  </TableCell>
                  {headers.map((header) => (
                    <TableCell
                      key={`${record.id}-${header}`}
                      className="max-w-[260px]"
                    >
                      {renderRecordValue(record, header)}
                    </TableCell>
                  ))}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingRecord(record);
                          setFormOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => void deleteRecords([record.id])}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-3 md:hidden">
        {loading ? (
          <div className="rounded-md border p-4 text-sm text-muted-foreground">
            Loading...
          </div>
        ) : records.length === 0 ? (
          <div className="rounded-md border p-4 text-sm text-muted-foreground">
            No records found
          </div>
        ) : (
          records.map((record) => (
            <div key={record.id} className="rounded-md border p-3 space-y-3">
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={selectedRecordIds.includes(record.id)}
                  onCheckedChange={(checked) =>
                    toggleRecordSelection(record.id, Boolean(checked))
                  }
                  aria-label={`Select row ${record.rowIndex + 1}`}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">
                    Row {record.rowIndex + 1}
                  </div>
                  <div className="mt-2 space-y-2">
                    {headers.map((header) => (
                      <div key={`${record.id}-${header}`} className="space-y-1">
                        <div className="text-xs font-medium text-muted-foreground">
                          {header}
                        </div>
                        {renderRecordValue(record, header)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingRecord(record);
                    setFormOpen(true);
                  }}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => void deleteRecords([record.id])}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={page <= 1}
          onClick={() => setPage((p) => p - 1)}
        >
          Previous
        </Button>
        <div className="text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </div>
        <Button
          size="sm"
          variant="outline"
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </Button>
      </div>

      <DynamicFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        headers={headers}
        requiredFields={requiredFields}
        headerMap={headerMap}
        editingRecord={editingRecord}
        orgId={effectiveOrgId}
        onSubmit={async (data) => {
          if (!datasetId) return;
          if (editingRecord) {
            await dynamicApi.updateRecord(editingRecord.id, data, {
              orgId: effectiveOrgId,
            });
            toast.success("Record updated");
          } else {
            await dynamicApi.createRecord(datasetId, data, {
              orgId: effectiveOrgId,
            });
            toast.success("Record created");
          }
          await loadRecords(datasetId, page, search);
        }}
      />
    </div>
  );
}
