import { apiFetch } from "./client";

export type SectionDto = {
  id: string;
  classId: string;
  name: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  studentsCount: number;
	className?: string; // added optional className
};

export async function listAllSections() {
	return apiFetch<{ success: true; data: SectionDto[] }>(`/sections`);
}

export async function listSectionsByClass(classId: string) {
  return apiFetch<{ success: true; data: SectionDto[] }>(`/sections/by-class/${classId}`);
}

export async function getSection(id: string) {
  return apiFetch<{ success: true; data: SectionDto }>(`/sections/${id}`);
}

export async function createSection(body: { classId: string; name: string }) {
  return apiFetch<{ success: true; data: SectionDto }>(`/sections`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateSection(id: string, body: { name: string }) {
  return apiFetch<{ success: true; data: SectionDto }>(`/sections/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deleteSection(id: string) {
  return apiFetch<{ success: true; data: { id: string } }>(`/sections/${id}`, { method: "DELETE" });
}

export async function listStudentsFromSection(sectionId: string) {
  return apiFetch<{ success: true; data: any[] }>(`/sections/${sectionId}/students`);
}

