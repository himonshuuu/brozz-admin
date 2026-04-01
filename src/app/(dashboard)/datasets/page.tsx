"use client";

import { useEffect, useState } from "react";
import { DynamicRecordsManager } from "@/components/dynamic-records-manager";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiFetch } from "@/lib/api/client";
import { useAuthStore } from "@/stores/useAuthStore";

export default function DatasetsPage() {
  const user = useAuthStore((s) => s.user);
  const [orgId, setOrgId] = useState("");
  const [orgs, setOrgs] = useState<{ id: string; name: string; email: string }[]>([]);

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
        // Ignore org selector load errors here.
      });
  }, [user?.role]);

  const scopedOrgId = user?.role === "admin" ? orgId || undefined : user?.id;

  return (
    <div className="space-y-4 px-4 lg:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Datasets</h1>
          <p className="text-sm text-muted-foreground">
            Upload spreadsheets, map fields, and manage printable records.
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
      <DynamicRecordsManager orgId={scopedOrgId} />
    </div>
  );
}
