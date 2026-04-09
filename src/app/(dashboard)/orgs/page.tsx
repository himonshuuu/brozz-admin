"use client";

import {
  ArrowRight01Icon,
  Delete02Icon,
  Edit02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiFetch } from "@/lib/api/client";
import { useAuthStore } from "@/stores/useAuthStore";

type OrganizationType =
  | "organization"
  | "college"
  | "university"
  | "coaching"
  | "company"
  | "ngo"
  | "government"
  | "other";

type OrgRow = {
  id: string;
  email: string;
  name: string;
  organization_type?: string | null;
  created_at?: string | null;
  is_active?: boolean;
};

const ORG_TYPES: { value: OrganizationType; label: string }[] = [
  { value: "organization", label: "Organization" },
  { value: "college", label: "College" },
  { value: "university", label: "University" },
  { value: "coaching", label: "Coaching" },
  { value: "company", label: "Company" },
  { value: "ngo", label: "NGO" },
  { value: "government", label: "Government" },
  { value: "other", label: "Other" },
];

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function normalizeOrgType(value?: string | null): OrganizationType {
  const cleaned = String(value ?? "organization")
    .trim()
    .toLowerCase() as OrganizationType;
  return ORG_TYPES.some((t) => t.value === cleaned) ? cleaned : "organization";
}

export default function OrgsPage() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  const [orgs, setOrgs] = useState<OrgRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<OrgRow | null>(null);

  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<{
    name: string;
    email: string;
    organizationType: OrganizationType;
    isActive: boolean;
  }>({
    name: "",
    email: "",
    organizationType: "organization",
    isActive: true,
  });

  const summary = useMemo(() => {
    const total = orgs.length;
    const active = orgs.filter((o) => o.is_active !== false).length;
    return { total, active };
  }, [orgs]);

  const loadOrgs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ success: true; data: OrgRow[] }>(
        "/auth/organizations",
      );
      if (res.success) setOrgs(res.data);
    } catch (error) {
      toast.error("Failed to load organizations", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== "admin") {
      router.replace("/datasets");
      return;
    }
    void loadOrgs();
  }, [user, router, loadOrgs]);

  function openEdit(org: OrgRow) {
    setSelectedOrg(org);
    setForm({
      name: org.name ?? "",
      email: org.email ?? "",
      organizationType: normalizeOrgType(org.organization_type),
      isActive: org.is_active !== false,
    });
    setEditOpen(true);
  }

  function openDelete(org: OrgRow) {
    setSelectedOrg(org);
    setDeleteOpen(true);
  }

  async function submitEdit() {
    const org = selectedOrg;
    if (!org) return;
    setSaving(true);
    try {
      const res = await apiFetch<{ success: true; data: OrgRow }>(
        `/auth/organizations/${encodeURIComponent(org.id)}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            name: form.name.trim(),
            email: form.email.trim(),
            organizationType: form.organizationType,
            isActive: form.isActive,
          }),
        },
      );
      if (res.success) {
        setOrgs((prev) =>
          prev.map((o) => (o.id === org.id ? { ...o, ...res.data } : o)),
        );
        toast.success("Organization updated");
        setEditOpen(false);
      }
    } catch (error) {
      toast.error("Failed to update organization", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setSaving(false);
    }
  }

  async function submitDelete() {
    const org = selectedOrg;
    if (!org) return;
    setSaving(true);
    try {
      await apiFetch<{ success: true; data: { id: string } }>(
        `/auth/organizations/${encodeURIComponent(org.id)}`,
        { method: "DELETE" },
      );
      setOrgs((prev) => prev.filter((o) => o.id !== org.id));
      toast.success("Organization deleted");
      setDeleteOpen(false);
    } catch (error) {
      toast.error("Failed to delete organization", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setSaving(false);
    }
  }

  if (!user || user.role !== "admin") return null;

  return (
    <div className="space-y-4 px-4 lg:px-6">
      <Card className="border border-border/70 bg-muted/15">
        <CardHeader className="gap-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Organizations</CardTitle>
              <CardDescription>
                Click a row to jump into ID card design for that organization.
              </CardDescription>
            </div>
            <div className="text-xs text-muted-foreground">
              {loading
                ? "Loading..."
                : `${summary.active}/${summary.total} active`}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center">
                      Loading organizations...
                    </TableCell>
                  </TableRow>
                ) : orgs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center">
                      No organizations found.
                    </TableCell>
                  </TableRow>
                ) : (
                  orgs.map((org) => (
                    <TableRow
                      key={org.id}
                      role="button"
                      tabIndex={0}
                      className="cursor-pointer"
                      onClick={() =>
                        router.push(
                          `/id-cards?org=${encodeURIComponent(org.id)}`,
                        )
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          router.push(
                            `/id-cards?org=${encodeURIComponent(org.id)}`,
                          );
                        }
                      }}
                    >
                      <TableCell className="max-w-[240px] truncate font-medium">
                        <div className="flex items-center gap-2">
                          <span className="truncate">{org.name}</span>
                          {org.is_active === false ? (
                            <span className="rounded-full border px-2 py-0.5 text-[10px] text-muted-foreground">
                              Inactive
                            </span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[260px] truncate">
                        {org.email}
                      </TableCell>
                      <TableCell className="capitalize">
                        {normalizeOrgType(org.organization_type)}
                      </TableCell>
                      <TableCell>{formatDate(org.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEdit(org);
                            }}
                          >
                            <HugeiconsIcon icon={Edit02Icon} strokeWidth={2} />
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              openDelete(org);
                            }}
                          >
                            <HugeiconsIcon
                              icon={Delete02Icon}
                              strokeWidth={2}
                            />
                            Delete
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(
                                `/id-cards?org=${encodeURIComponent(org.id)}`,
                              );
                            }}
                            aria-label="Open ID cards"
                          >
                            <HugeiconsIcon
                              icon={ArrowRight01Icon}
                              strokeWidth={2}
                            />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          if (!saving) setEditOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit organization</DialogTitle>
            <DialogDescription>
              Updating email impacts login. Changes apply immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Organization name"
                disabled={saving}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                value={form.email}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="Email"
                disabled={saving}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select
                  value={form.organizationType}
                  onValueChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      organizationType: value as OrganizationType,
                    }))
                  }
                  disabled={saving}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ORG_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={form.isActive ? "active" : "inactive"}
                  onValueChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      isActive: value === "active",
                    }))
                  }
                  disabled={saving}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={() => void submitEdit()} disabled={saving}>
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteOpen}
        onOpenChange={(open) => {
          if (!saving) setDeleteOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete organization</DialogTitle>
            <DialogDescription>
              This is a soft delete. Datasets and templates will no longer be
              accessible for this organization.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border bg-muted/20 p-3 text-xs">
            <div className="font-medium">{selectedOrg?.name ?? "—"}</div>
            <div className="text-muted-foreground">
              {selectedOrg?.email ?? "—"}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => void submitDelete()}
              disabled={saving}
            >
              {saving ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
