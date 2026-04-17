import { apiFetch } from "./client";

export type UserRole =
  | "ADMIN"
  | "USER"
  | "SUPER_ADMIN"
  | "DISTRIBUTER"
  | "STAFF"
  | "RETAILER";

export type CurrentUser = {
  id: string;
  email: string;
  name?: string | null;
  organizationType?: string | null;
  mobileNumber?: string | null;
  role: UserRole;
  createdAt?: string | null;
};

type ApiResponse<T> = { success: true; data: T };

export function isAdminRole(role?: string | null) {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

export async function login(email: string, password: string) {
  return apiFetch<ApiResponse<{ token: string; role: UserRole }>>("/auth/admin/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function getCurrentUser() {
  return apiFetch<ApiResponse<CurrentUser>>("/auth/me");
}

export async function listAccounts(params: {
  role?: UserRole;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params.role) query.set("role", params.role);
  if (params.search) query.set("search", params.search);
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiFetch<{
    success: true;
    data: Array<{
      id: string;
      email: string;
      name?: string;
      mobileNumber?: string | null;
      role: UserRole;
      isVerified: boolean;
      isActive: boolean;
      isDeleted: boolean;
      createdAt?: string;
      updatedAt?: string;
    }>;
    meta: { page: number; limit: number; total: number; totalPages: number };
  }>(`/auth/accounts/list${suffix}`);
}

type CreateRoleAccountResponse = {
  id: string;
  email: string;
  name: string;
  mobileNumber: string;
  role: UserRole;
  password: string;
};

type ApiResponseWrapped<T> = { success: true; data: T };

export async function createAdminAccount(body: { email: string; name: string; mobileNumber: string }) {
  return apiFetch<ApiResponseWrapped<CreateRoleAccountResponse>>("/auth/accounts/admin", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function createDistributerAccount(body: { email: string; name: string; mobileNumber: string }) {
  return apiFetch<ApiResponseWrapped<CreateRoleAccountResponse>>("/auth/accounts/distributer", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function createRetailerAccount(body: { email: string; name: string; mobileNumber: string }) {
  return apiFetch<ApiResponseWrapped<CreateRoleAccountResponse>>("/auth/accounts/retailer", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function createStaffAccount(body: { email: string; name: string; mobileNumber: string }) {
  return apiFetch<ApiResponseWrapped<CreateRoleAccountResponse>>("/auth/accounts/staff", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateAccount(
  id: string,
  body: { name?: string; mobileNumber?: string; isActive?: boolean },
) {
  return apiFetch<ApiResponseWrapped<{
    id: string; email: string; name?: string; mobileNumber?: string | null;
    role: UserRole; isVerified: boolean; isActive: boolean; isDeleted: boolean;
  }>>(`/auth/accounts/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deleteAccount(id: string) {
  return apiFetch<ApiResponseWrapped<{ id: string }>>(`/auth/accounts/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
