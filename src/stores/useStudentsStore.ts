import { create } from "zustand";
import * as studentsApi from "@/lib/api/students";

type State = {
  students: studentsApi.StudentDto[];
  loading: boolean;
  error: string | null;
  fetchStudents: (params?: { classId?: string; sectionId?: string }) => Promise<void>;
};

export const useStudentsStore = create<State>((set) => ({
  students: [],
  loading: false,
  error: null,
  fetchStudents: async (params) => {
    set({ loading: true, error: null });
    try {
      const res = await studentsApi.listStudents(params);
      set({ students: res.data, loading: false });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "Failed to load students", loading: false });
    }
  },
}));

