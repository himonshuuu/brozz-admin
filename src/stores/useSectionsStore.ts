import { create } from "zustand";
import * as sectionsApi from "@/lib/api/sections";

type State = {
  byClassId: Record<string, sectionsApi.SectionDto[]>;
  allSections: sectionsApi.SectionDto[]; // added
  loading: boolean;
  error: string | null;
  fetchByClass: (classId: string | "all", params?: { schoolId?: string }) => Promise<void>;
};

export const useSectionsStore = create<State>((set, get) => ({
  byClassId: {},
  allSections: [],
  loading: false,
  error: null,
  fetchByClass: async (classId, params) => {
    set({ loading: true, error: null });
    try {
      if (classId === "all") {
        const res = await sectionsApi.listAllSections({ schoolId: params?.schoolId });
        set({ allSections: res.data, loading: false });
        return;
      }
      const res = await sectionsApi.listSectionsByClass(classId);
      set({ byClassId: { ...get().byClassId, [classId]: res.data }, loading: false });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "Failed to load sections", loading: false });
    }
  },
}));

