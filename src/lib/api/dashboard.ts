import { apiFetch } from "./client";

export type DashboardStatsDto = {
  totalDatasets: number;
  totalRecords: number;
  totalImports: number;
  runningImports: number;
};

export async function getDashboardStats(opts?: { orgId?: string }) {
  const query = new URLSearchParams();
  if (opts?.orgId) query.set("orgId", opts.orgId);
  const suffix = query.toString() ? `?${query.toString()}` : "";

  return apiFetch<{ success: true; data: DashboardStatsDto }>(
    `/dashboard/stats${suffix}`,
  );
}
