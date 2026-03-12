import { create } from "zustand";
import * as classesApi from "@/lib/api/classes";

type State = {
  classes: classesApi.ClassDto[];
  loading: boolean;
  error: string | null;
  fetchClasses: (params?: { schoolId?: string }) => Promise<void>;
};

export const useClassesStore = create<State>((set) => ({
  classes: [],
  loading: false,
  error: null,
  fetchClasses: async (params) => {
    set({ loading: true, error: null });
    try {
      const res = await classesApi.listClasses(params);
      set({ classes: res.data, loading: false });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "Failed to load classes", loading: false });
    }
  },
}));

