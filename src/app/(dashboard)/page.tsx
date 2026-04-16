"use client";

import { useEffect, useMemo, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiFetch } from "@/lib/api/client";
import { getDashboardStats } from "@/lib/api/dashboard";
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/stores/useAuthStore";

type DashboardStats = {
  totalDatasets: number;
  totalRecords: number;
  totalImports: number;
  runningImports: number;
  totalOrganizations?: number;
  activeOrganizations?: number;
};

export default function Home() {
  const user = useAuthStore((s) => s.user);
  const [orgId, setOrgId] = useState("");
  const [orgs, setOrgs] = useState<{ id: string; name: string; email: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalDatasets: 0,
    totalRecords: 0,
    totalImports: 0,
    runningImports: 0,
  });

  useEffect(() => {
    if (user?.role !== "admin") return;
    void apiFetch<{
      success: true;
      data: { id: string; name: string; email: string }[];
    }>("/auth/organizations")
      .then((res) => {
        if (res.success) setOrgs(res.data);
      })
      .catch(() => {
        // Ignore sidebar/dashboard org list errors.
      });
  }, [user?.role]);

  useEffect(() => {
    let cancelled = false;

    const loadStats = async () => {
      setLoading(true);
      try {
        const scopedOrgId =
          user?.role === "admin" ? orgId || undefined : user?.id;
        const statsRes = await getDashboardStats(
          scopedOrgId ? { orgId: scopedOrgId } : undefined,
        );

        if (!cancelled) {
          setStats(statsRes.data);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadStats();
    return () => {
      cancelled = true;
    };
  }, [orgId, user?.role, user?.id]);

  const importsBadgeLabel = useMemo(() => {
    if (loading) return "Loading...";
    if (stats.runningImports === 0) return "No running jobs";
    return `${stats.runningImports} running`;
  }, [loading, stats.runningImports]);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-10 lg:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Overview of datasets, records, and import activity.
            </p>
          </div>
          {user?.role === "admin" && (
            <Select
              value={orgId || "all"}
              onValueChange={(value) => setOrgId(value === "all" ? "" : value)}
            >
              <SelectTrigger className="w-[260px]">
                <SelectValue placeholder="All organizations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All organizations</SelectItem>
                {orgs.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {user?.role === "admin" && stats.totalOrganizations != null && (
            <Card className="@container/card">
              <CardHeader>
                <CardDescription>Organizations</CardDescription>
                <CardTitle className="text-3xl font-semibold tabular-nums">
                  {loading ? "—" : stats.totalOrganizations.toLocaleString()}
                </CardTitle>
                <CardAction>
                  <Badge variant="outline">
                    {loading
                      ? "..."
                      : `${stats.activeOrganizations ?? 0} active`}
                  </Badge>
                </CardAction>
              </CardHeader>
            </Card>
          )}
          <Card className="@container/card">
            <CardHeader>
              <CardDescription>Datasets</CardDescription>
              <CardTitle className="text-3xl font-semibold tabular-nums">
                {loading ? "—" : stats.totalDatasets.toLocaleString()}
              </CardTitle>
              <CardAction>
                <Badge variant="outline">Live</Badge>
              </CardAction>
            </CardHeader>
          </Card>
          <Card className="@container/card">
            <CardHeader>
              <CardDescription>Total records</CardDescription>
              <CardTitle className="text-3xl font-semibold tabular-nums">
                {loading ? "—" : stats.totalRecords.toLocaleString()}
              </CardTitle>
              <CardAction>
                <Badge variant="outline">Live</Badge>
              </CardAction>
            </CardHeader>
          </Card>
          <Card className="@container/card">
            <CardHeader>
              <CardDescription>Imports</CardDescription>
              <CardTitle className="text-3xl font-semibold tabular-nums">
                {loading ? "—" : stats.totalImports.toLocaleString()}
              </CardTitle>
              <CardAction>
                <Badge variant="outline">{importsBadgeLabel}</Badge>
              </CardAction>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}
