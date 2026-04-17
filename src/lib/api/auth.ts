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

export async function registerUser(body: {
  email: string;
  password: string;
  name: string;
  mobileNumber: string;
}) {
  return apiFetch<
    ApiResponse<{ id: string; email: string; name: string; mobileNumber: string; role: UserRole; token: string }>
  >("/auth/register", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function verifyOtp(body: { email: string; otp: string }) {
  return apiFetch<ApiResponse<{ id: string }>>("/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function resendOtp(body: { email: string }) {
  return apiFetch<{ success: true; message: string }>("/auth/resend-otp", {
    method: "POST",
    body: JSON.stringify(body),
  });
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

export async function getAccountDetails(params: { id?: string; email?: string }) {
  const query = new URLSearchParams();
  if (params.id) query.set("id", params.id);
  if (params.email) query.set("email", params.email);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiFetch<
    ApiResponse<{
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
    }>
  >(`/auth/accounts/details${suffix}`);
}

type CreateRoleAccountResponse = {
  id: string;
  email: string;
  name: string;
  mobileNumber: string;
  role: UserRole;
  password: string;
};

export async function createAdminAccount(body: {
  email: string;
  name: string;
  mobileNumber: string;
}) {
  return apiFetch<ApiResponse<CreateRoleAccountResponse>>("/auth/accounts/admin", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function createDistributerAccount(body: {
  email: string;
  name: string;
  mobileNumber: string;
}) {
  return apiFetch<ApiResponse<CreateRoleAccountResponse>>("/auth/accounts/distributer", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function createRetailerAccount(body: {
  email: string;
  name: string;
  mobileNumber: string;
}) {
  return apiFetch<ApiResponse<CreateRoleAccountResponse>>("/auth/accounts/retailer", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function createStaffAccount(body: {
  email: string;
  name: string;
  mobileNumber: string;
}) {
  return apiFetch<ApiResponse<CreateRoleAccountResponse>>("/auth/accounts/staff", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateAccount(
  id: string,
  body: { name?: string; mobileNumber?: string; isActive?: boolean },
) {
  return apiFetch<ApiResponse<{
    id: string; email: string; name?: string; mobileNumber?: string | null;
    role: UserRole; isVerified: boolean; isActive: boolean; isDeleted: boolean;
  }>>(`/auth/accounts/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deleteAccount(id: string) {
  return apiFetch<ApiResponse<{ id: string }>>(`/auth/accounts/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
