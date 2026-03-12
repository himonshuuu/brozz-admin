import { create } from "zustand";
import * as sectionsApi from "@/lib/api/sections";

type State = {
  byClassId: Record<string, sectionsApi.SectionDto[]>;
  loading: boolean;
  error: string | null;
  fetchByClass: (classId: string) => Promise<void>;
};

export const useSectionsStore = create<State>((set, get) => ({
  byClassId: {},
  loading: false,
  error: null,
  fetchByClass: async (classId) => {
    set({ loading: true, error: null });
    try {
      const res = await sectionsApi.listSectionsByClass(classId);
      set({ byClassId: { ...get().byClassId, [classId]: res.data }, loading: false });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "Failed to load sections", loading: false });
    }
  },
}));

