import { create } from "zustand";
import * as schoolsApi from "@/lib/api/schools";

type State = {
  schools: schoolsApi.SchoolDto[];
  loading: boolean;
  error: string | null;
  fetchSchools: () => Promise<void>;
};

export const useSchoolsStore = create<State>((set) => ({
  schools: [],
  loading: false,
  error: null,
  fetchSchools: async () => {
    set({ loading: true, error: null });
    try {
      const res = await schoolsApi.listSchools();
      set({ schools: res.data, loading: false });
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : "Failed to load schools",
        loading: false,
      });
    }
  },
}));

