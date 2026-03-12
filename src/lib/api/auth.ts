import { apiFetch } from "./client";

export type CurrentUser = {
  id: string;
  email: string;
  name?: string | null;
  mobileNumber?: string | null;
  role: "admin" | "school";
  createdAt?: string | null;
};

export async function schoolLogin(email: string, password: string) {
  return apiFetch<{ success: true; data: { token: string } }>("/auth/school/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function schoolRegister(payload: {
  email: string;
  password: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  mobileNumber: string;
}) {
  return apiFetch<{
    success: true;
    data: {
      id: string;
      email: string;
      name: string;
      mobileNumber: string;
      isVerified: boolean;
    };
  }>("/auth/school/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function schoolVerifyOtp(email: string, otp: string) {
  return apiFetch<{ success: true; data: { id: string }; message?: string }>(
    "/auth/school/verify-otp",
    {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    },
  );
}

export async function schoolResendOtp(email: string) {
  return apiFetch<{ success: true; message?: string }>("/auth/school/resend-otp", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function getCurrentUser() {
  return apiFetch<{ success: true; data: CurrentUser }>("/auth/me");
}

export async function requestPasswordReset(email: string) {
  return apiFetch<{ success: true; message: string }>("/auth/school/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(email: string, otp: string, password: string) {
  return apiFetch<{ success: true; message: string }>("/auth/school/reset-password", {
    method: "POST",
    body: JSON.stringify({ email, otp, password }),
  });
}
