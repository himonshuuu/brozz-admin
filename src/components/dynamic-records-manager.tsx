"use client";

import { useEffect, useMemo, useState } from "react";
import { useMemoizedCallback } from "@/hooks/use-memoized-callback";
import { Button } from "@/components/ui/button";
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
import * as dynamicApi from "@/lib/api/dynamic";
import { toast } from "sonner";

type ScalarValue = string | number | boolean | null;

type Props = {
  orgId?: string;
};

export function DynamicFormDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  headers: string[];
  requiredFields: string[];
  headerMap: Record<string, string>;
  editingRecord?: dynamicApi.DynamicRecordDto | null;
  onSubmit: (data: Record<string, ScalarValue>) => Promise<void>;
}) {
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!props.open) return;
    const initial: Record<string, string> = {};
    for (const header of props.headers) {
      initial[header] = String(props.editingRecord?.data?.[header] ?? "");
    }
    setForm(initial);
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
            return (
              <div key={header} className="space-y-1.5">
                <Label>
                  {header}
                  {isRequired ? " *" : ""}
                </Label>
                <Input
                  value={form[header] ?? ""}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, [header]: e.target.value }))
                  }
                />
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

  const [mappingDraft, setMappingDraft] = useState<Record<string, string>>({});
  const [requiredDraft, setRequiredDraft] = useState<string[]>([]);

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
        setMappingDraft(res.data.headerMap);
        setRequiredDraft(res.data.requiredFields);
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
    void loadRecords(datasetId, page, search, sortBy, sortOrder);
  }, [datasetId, page, search, sortBy, sortOrder, loadRecords]);

  async function saveMappings() {
    if (!datasetId) return;
    try {
      await dynamicApi.upsertFieldMappings(datasetId, {
        orgId: effectiveOrgId,
        mappings: headers.map((header) => ({
          sourceField: header,
          targetField: mappingDraft[header] || header,
        })),
        requiredFields: requiredDraft,
      });
      toast.success("Field mapping updated");
      await loadRecords(datasetId, page, search);
    } catch (error) {
      toast.error("Failed to update mapping", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  const currentDataset = datasets.find((d) => d.id === datasetId) ?? null;
  const effectiveOrgId = currentDataset?.orgId ?? orgId;

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

      {currentDataset && (
        <div className="rounded-md border p-3 space-y-3">
          <div className="text-sm font-medium">Field Mapping</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {headers.map((header) => {
              const mapped = mappingDraft[header] ?? headerMap[header] ?? "";
              const normalizedMapped = mapped
                .trim()
                .toLowerCase()
                .replace(/\s+/g, "_");
              const required = requiredDraft.includes(normalizedMapped);
              return (
                <div key={header} className="space-y-1">
                  <Label>{header}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={mapped}
                      onChange={(e) =>
                        setMappingDraft((prev) => ({
                          ...prev,
                          [header]: e.target.value,
                        }))
                      }
                    />
                    <label className="text-xs flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={required}
                        onChange={(e) => {
                          setRequiredDraft((prev) =>
                            e.target.checked
                              ? [...new Set([...prev, normalizedMapped])]
                              : prev.filter((v) => v !== normalizedMapped),
                          );
                        }}
                      />
                      Required
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
          <div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => void saveMappings()}
            >
              Save Mapping
            </Button>
          </div>
        </div>
      )}

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
            <SelectItem value="rowIndex">Row order</SelectItem>
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

      <div className="rounded-md border overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map((header) => (
                <TableHead key={header}>{header}</TableHead>
              ))}
              <TableHead className="w-[160px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={headers.length + 1}>Loading...</TableCell>
              </TableRow>
            ) : records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={headers.length + 1}>
                  No records found
                </TableCell>
              </TableRow>
            ) : (
              records.map((record) => (
                <TableRow key={record.id}>
                  {headers.map((header) => (
                    <TableCell key={`${record.id}-${header}`}>
                      {String(record.data[header] ?? "")}
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
                        onClick={() => {
                          void dynamicApi
                            .deleteRecord(record.id, {
                              orgId: effectiveOrgId,
                            })
                            .then(() => {
                              toast.success("Record deleted");
                              if (datasetId)
                                void loadRecords(datasetId, page, search);
                            })
                            .catch((error) => {
                              toast.error("Delete failed", {
                                description:
                                  error instanceof Error
                                    ? error.message
                                    : "Unknown error",
                              });
                            });
                        }}
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
