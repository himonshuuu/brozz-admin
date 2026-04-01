import { API_BASE, apiFetch } from "./client";

export type DatasetDto = {
  id: string;
  orgId: string;
  name: string;
  headers: string[];
  headerMap: Record<string, string>;
  requiredFields: string[];
  totalRecords: number;
  createdAt: string;
  updatedAt: string;
};

export type DynamicRecordDto = {
  id: string;
  datasetId: string;
  rowIndex: number;
  data: Record<string, string | number | boolean | null>;
  normalizedData: Record<string, string | number | boolean | null>;
  photoKey: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DynamicCanvasElement = {
  id: string;
  type: "text" | "image";
  value: string;
  x: number;
  y: number;
  fontSize?: number;
  fontWeight?: "normal" | "bold";
  color?: string;
  showLabel?: boolean;
  label?: string;
  width?: number;
  height?: number;
};

export type DynamicCanvas = {
  width: number;
  height: number;
  backgroundImage: string;
  elements: DynamicCanvasElement[];
};

export type DynamicTemplateDto = {
  id: string;
  orgId: string;
  datasetId: string | null;
  name: string;
  canvas: DynamicCanvas;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export async function uploadDatasetExcel(
  file: File,
  params?: { name?: string; orgId?: string },
) {
  const form = new FormData();
  form.append("excel", file);
  if (params?.name) form.append("name", params.name);
  if (params?.orgId) form.append("orgId", params.orgId);

  return apiFetch<{ success: true; data: DatasetDto }>("/datasets/upload", {
    method: "POST",
    body: form,
  });
}

export async function listDatasets(params?: {
  orgId?: string;
  page?: number;
  pageSize?: number;
}) {
  const qs = new URLSearchParams();
  if (params?.orgId) qs.set("orgId", params.orgId);
  if (params?.page) qs.set("page", String(params.page));
  if (params?.pageSize) qs.set("pageSize", String(params.pageSize));
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch<{
    success: true;
    data: {
      items: DatasetDto[];
      total: number;
      page: number;
      pageSize: number;
    };
  }>(`/datasets${suffix}`);
}

export async function getDataset(
  datasetId: string,
  params?: { orgId?: string },
) {
  const suffix = params?.orgId
    ? `?orgId=${encodeURIComponent(params.orgId)}`
    : "";
  return apiFetch<{ success: true; data: DatasetDto }>(
    `/datasets/${datasetId}${suffix}`,
  );
}

export async function listRecords(
  datasetId: string,
  params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    orgId?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  },
) {
  const qs = new URLSearchParams();
  if (params?.page) qs.set("page", String(params.page));
  if (params?.pageSize) qs.set("pageSize", String(params.pageSize));
  if (params?.search) qs.set("search", params.search);
  if (params?.orgId) qs.set("orgId", params.orgId);
  if (params?.sortBy) qs.set("sortBy", params.sortBy);
  if (params?.sortOrder) qs.set("sortOrder", params.sortOrder);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch<{
    success: true;
    data: {
      headers: string[];
      headerMap: Record<string, string>;
      requiredFields: string[];
      items: DynamicRecordDto[];
      total: number;
      page: number;
      pageSize: number;
      sortBy: string;
      sortOrder: string;
    };
  }>(`/datasets/${datasetId}/records${suffix}`);
}

export async function createRecord(
  datasetId: string,
  data: Record<string, string | number | boolean | null>,
  params?: { orgId?: string },
) {
  return apiFetch<{ success: true; data: DynamicRecordDto }>(
    `/datasets/${datasetId}/records`,
    {
      method: "POST",
      body: JSON.stringify({ data, orgId: params?.orgId }),
    },
  );
}

export async function updateRecord(
  recordId: string,
  data: Record<string, string | number | boolean | null>,
  params?: { orgId?: string },
) {
  return apiFetch<{ success: true; data: DynamicRecordDto }>(
    `/datasets/records/${recordId}`,
    {
      method: "PATCH",
      body: JSON.stringify({ data, orgId: params?.orgId }),
    },
  );
}

export async function deleteRecord(
  recordId: string,
  params?: { orgId?: string },
) {
  const suffix = params?.orgId
    ? `?orgId=${encodeURIComponent(params.orgId)}`
    : "";
  return apiFetch<{ success: true; data: { id: string } }>(
    `/datasets/records/${recordId}${suffix}`,
    {
      method: "DELETE",
    },
  );
}

export async function upsertFieldMappings(
  datasetId: string,
  body: {
    orgId?: string;
    mappings: Array<{ sourceField: string; targetField: string }>;
    requiredFields?: string[];
  },
) {
  return apiFetch<{ success: true; data: DatasetDto }>(
    `/datasets/${datasetId}/mappings`,
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
}

export async function getTemplateVariables(
  datasetId: string,
  params?: { orgId?: string },
) {
  const suffix = params?.orgId
    ? `?orgId=${encodeURIComponent(params.orgId)}`
    : "";
  return apiFetch<{
    success: true;
    data: {
      headers: string[];
      variables: Array<{
        header: string;
        variable: string;
        mappedVariable: string;
      }>;
      headerMap: Record<string, string>;
    };
  }>(`/datasets/${datasetId}/variables${suffix}`);
}

export async function listTemplates(params?: {
  datasetId?: string;
  orgId?: string;
}) {
  const qs = new URLSearchParams();
  if (params?.datasetId) qs.set("datasetId", params.datasetId);
  if (params?.orgId) qs.set("orgId", params.orgId);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch<{ success: true; data: DynamicTemplateDto[] }>(
    `/templates${suffix}`,
  );
}

export async function createTemplate(body: {
  datasetId?: string;
  orgId?: string;
  name: string;
  canvas: DynamicCanvas;
  isDefault?: boolean;
}) {
  return apiFetch<{ success: true; data: DynamicTemplateDto }>("/templates", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateTemplate(
  templateId: string,
  body: { orgId?: string; name?: string; canvas?: DynamicCanvas; isDefault?: boolean },
) {
  return apiFetch<{ success: true; data: DynamicTemplateDto }>(
    `/templates/${templateId}`,
    {
      method: "PATCH",
      body: JSON.stringify(body),
    },
  );
}

export async function printDataset(
  datasetId: string,
  body: {
    templateId: string;
    orgId?: string;
    recordIds?: string[];
    page?: number;
    pageSize?: number;
  },
): Promise<Blob> {
  const token =
    window.localStorage.getItem("token") ||
    window.localStorage.getItem("authToken") ||
    window.localStorage.getItem("accessToken");

  const res = await fetch(`${API_BASE}/print/${datasetId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const json = (await res.json().catch(() => null)) as {
      message?: string;
    } | null;
    throw new Error(json?.message ?? `Request failed (${res.status})`);
  }

  return res.blob();
}
