import { apiFetch } from "./client";

export type SchoolDto = {
  id: string;
  email: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  mobileNumber: string;
  emailVerified: boolean;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string | Date;
};

export async function listSchools() {
  return apiFetch<{ success: true; data: SchoolDto[] }>("/schools");
}

export async function createSchool(body: {
  email: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  mobileNumber: string;
  emailVerified?: boolean;
  isActive?: boolean;
  isDeleted?: boolean;
}) {
  return apiFetch<{ success: true; data: SchoolDto }>("/schools", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateSchool(
  id: string,
  body: Partial<{
    email: string;
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    mobileNumber: string;
    emailVerified: boolean;
    isActive: boolean;
    isDeleted: boolean;
  }>,
) {
  return apiFetch<{ success: true; data: SchoolDto }>(`/schools/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deleteSchool(id: string) {
  return apiFetch<{ success: true; data: { id: string } }>(`/schools/${id}`, {
    method: "DELETE",
  });
}

