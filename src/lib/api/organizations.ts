import { apiFetch } from "./client";

export type OrganizationDto = {
  id: string;
  email: string;
  name: string;
  organization_type?: string | null;
  created_at?: string | null;
  is_active?: boolean;
};

type ApiResponse<T> = { success: true; data: T };

export async function listOrganizations() {
  return apiFetch<ApiResponse<OrganizationDto[]>>("/auth/organizations");
}

export async function updateOrganization(
  orgId: string,
  body: {
    name: string;
    email: string;
    organizationType: string;
    isActive: boolean;
  },
) {
  return apiFetch<ApiResponse<OrganizationDto>>(
    `/auth/organizations/${encodeURIComponent(orgId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(body),
    },
  );
}

export async function deleteOrganization(orgId: string) {
  return apiFetch<ApiResponse<{ id: string }>>(
    `/auth/organizations/${encodeURIComponent(orgId)}`,
    {
      method: "DELETE",
    },
  );
}