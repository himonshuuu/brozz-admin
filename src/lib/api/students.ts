import { apiFetch } from "./client";

export type StudentDto = {
  id: string;
  sectionId: string;
  roll: string;
  admissionNumber: string;
  name: string;
  fatherName: string;
  dob: string | Date;
  phone: string;
  bloodGroup: string;
  address: string;
  createdAt: string | Date;
  updatedAt: string | Date;
};

export async function listStudents(params?: { sectionId?: string; classId?: string }) {
  const qs = new URLSearchParams();
  if (params?.sectionId) qs.set("sectionId", params.sectionId);
  if (params?.classId) qs.set("classId", params.classId);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch<{ success: true; data: StudentDto[] }>(`/students${suffix}`);
}

export async function getStudent(id: string) {
  return apiFetch<{ success: true; data: StudentDto }>(`/students/${id}`);
}

export async function createStudent(body: {
  sectionId: string;
  roll: string;
  admissionNumber: string;
  name: string;
  fatherName: string;
  dob: string;
  phone: string;
  bloodGroup: string;
  address: string;
}) {
  return apiFetch<{ success: true; data: StudentDto }>(`/students`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateStudent(
  id: string,
  body: Partial<{
    roll: string;
    admissionNumber: string;
    name: string;
    fatherName: string;
    dob: string;
    phone: string;
    bloodGroup: string;
    address: string;
  }>,
) {
  return apiFetch<{ success: true; data: StudentDto }>(`/students/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deleteStudent(id: string) {
  return apiFetch<{ success: true; data: { id: string } }>(`/students/${id}`, { method: "DELETE" });
}

