import { apiFetch } from "./client";

export type ClassDto = {
  id: string;
  schoolId: string;
  name: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  sectionsCount: number;
  studentsCount: number;
};

export async function listClasses(params?: { schoolId?: string }) {
  const qs = params?.schoolId ? `?schoolId=${encodeURIComponent(params.schoolId)}` : "";
  return apiFetch<{ success: true; data: ClassDto[] }>(`/classes${qs}`);
}

export async function createClass(body: { name: string; schoolId?: string }) {
  return apiFetch<{ success: true; data: ClassDto }>(`/classes`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateClass(id: string, body: { name: string }) {
  return apiFetch<{ success: true; data: ClassDto }>(`/classes/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deleteClass(id: string) {
  return apiFetch<{ success: true; data: { id: string } }>(`/classes/${id}`, { method: "DELETE" });
}

export async function listSectionsFromClass(classId: string) {
  return apiFetch<{ success: true; data: any[] }>(`/classes/${classId}/sections`);
}

export async function listStudentsFromClass(classId: string) {
  return apiFetch<{ success: true; data: any[] }>(`/classes/${classId}/students`);
}

