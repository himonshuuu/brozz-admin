import { apiFetch } from "./client";

export type CurrentUser = {
  id: string;
  email: string;
  name?: string | null;
  organizationType?: string | null;
  mobileNumber?: string | null;
  role: string;
  createdAt?: string | null;
};

export async function login(email: string, password: string) {
  return apiFetch<{ success: true; data: { token: string } }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function register(payload: {
  email: string;
  password: string;
  name: string;
  organizationType:
    | "organization"
    | "college"
    | "university"
    | "coaching"
    | "company"
    | "ngo"
    | "government"
    | "other";
}) {
  return apiFetch<{
    success: true;
    data: {
      id: string;
      email: string;
      name: string;
      organizationType: string;
      isVerified: boolean;
    };
  }>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function verifyOtp(email: string, otp: string) {
  return apiFetch<{ success: true; data: { id: string }; message?: string }>(
    "/auth/verify-otp",
    {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    },
  );
}

export async function resendOtp(email: string) {
  return apiFetch<{ success: true; message?: string }>("/auth/resend-otp", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function getCurrentUser() {
  return apiFetch<{ success: true; data: CurrentUser }>("/auth/me");
}

export async function deleteMe() {
  return apiFetch<{ success: true; message?: string }>("/auth/me", {
    method: "DELETE",
  });
}

export async function requestPasswordReset(email: string) {
  return apiFetch<{ success: true; message: string }>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(
  email: string,
  otp: string,
  password: string,
) {
  return apiFetch<{ success: true; message: string }>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ email, otp, password }),
  });
}
