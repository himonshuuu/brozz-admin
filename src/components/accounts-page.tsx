"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createAdminAccount,
  createDistributerAccount,
  createRetailerAccount,
  createStaffAccount,
  deleteAccount,
  listAccounts,
  updateAccount,
  type UserRole,
} from "@/lib/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Delete02Icon, PencilEdit01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

type Account = {
  id: string;
  email: string;
  name?: string;
  mobileNumber?: string | null;
  role: UserRole;
  isVerified: boolean;
  isActive: boolean;
  isDeleted: boolean;
  createdAt?: string;
};

type Meta = { page: number; limit: number; total: number; totalPages: number };

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  DISTRIBUTER: "Distributor",
  RETAILER: "Retailer",
  STAFF: "Staff",
  USER: "User",
  SUPER_ADMIN: "Super Admin",
};

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
  ADMIN:       "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800",
  DISTRIBUTER: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
  RETAILER:    "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
  STAFF:       "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
  USER:        "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
};

type CreateFn = (body: { email: string; name: string; mobileNumber: string }) => Promise<unknown>;

const CREATE_FNS: Partial<Record<UserRole, CreateFn>> = {
  ADMIN: createAdminAccount,
  DISTRIBUTER: createDistributerAccount,
  RETAILER: createRetailerAccount,
  STAFF: createStaffAccount,
};

interface Props {
  role?: UserRole;
  title: string;
  canCreate?: boolean;
}

export function AccountsPage({ role, title, canCreate = false }: Props) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [meta, setMeta] = useState<Meta>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Create ──────────────────────────────────────────────────────────
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ email: "", name: "", mobileNumber: "" });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);

  // ── Edit ────────────────────────────────────────────────────────────
  const [editTarget, setEditTarget] = useState<Account | null>(null);
  const [editForm, setEditForm] = useState({ name: "", mobileNumber: "", isActive: true });
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // ── Delete ──────────────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listAccounts({ role, search: search || undefined, page, limit: 20 });
      setAccounts(res.data);
      setMeta(res.meta);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load accounts");
    } finally {
      setLoading(false);
    }
  }, [role, search, page]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { setPage(1); }, [search]);

  // ── Create handlers ─────────────────────────────────────────────────
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!role) return;
    const createFn = CREATE_FNS[role];
    if (!createFn) return;
    setCreating(true);
    setCreateError(null);
    try {
      const res = await createFn(createForm) as { success: true; data: { password: string } };
      setCreatedPassword(res.data.password);
      setCreateForm({ email: "", name: "", mobileNumber: "" });
      void load();
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : "Failed to create account");
    } finally {
      setCreating(false);
    }
  }

  function handleCreateClose(val: boolean) {
    setCreateOpen(val);
    if (!val) {
      setCreatedPassword(null);
      setCreateError(null);
      setCreateForm({ email: "", name: "", mobileNumber: "" });
    }
  }

  // ── Edit handlers ───────────────────────────────────────────────────
  function openEdit(acc: Account) {
    setEditTarget(acc);
    setEditForm({
      name: acc.name ?? "",
      mobileNumber: acc.mobileNumber ?? "",
      isActive: acc.isActive,
    });
    setEditError(null);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    setSaving(true);
    setEditError(null);
    try {
      await updateAccount(editTarget.id, {
        name: editForm.name || undefined,
        mobileNumber: editForm.mobileNumber || undefined,
        isActive: editForm.isActive,
      });
      setEditTarget(null);
      void load();
    } catch (e) {
      setEditError(e instanceof Error ? e.message : "Failed to update account");
    } finally {
      setSaving(false);
    }
  }

  // ── Delete handlers ─────────────────────────────────────────────────
  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteAccount(deleteTarget.id);
      setDeleteTarget(null);
      void load();
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Failed to delete account");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="w-full px-4 py-10 lg:px-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {meta.total} account{meta.total !== 1 ? "s" : ""} total
          </p>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
          {canCreate && role && CREATE_FNS[role] && (
            <Dialog open={createOpen} onOpenChange={handleCreateClose}>
              <DialogTrigger asChild>
                <Button>Create {ROLE_LABELS[role]}</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create {ROLE_LABELS[role]} Account</DialogTitle>
                </DialogHeader>
                {createdPassword ? (
                  <div className="flex flex-col gap-4">
                    <p className="text-sm text-muted-foreground">
                      Account created. Share these credentials securely.
                    </p>
                    <div className="rounded-md bg-muted p-3 text-sm font-mono">
                      <div>Email: {createForm.email || "—"}</div>
                      <div>Password: <span className="font-bold">{createdPassword}</span></div>
                    </div>
                    <Button onClick={() => handleCreateClose(false)}>Done</Button>
                  </div>
                ) : (
                  <form onSubmit={(e) => void handleCreate(e)} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="c-name">Name</Label>
                      <Input id="c-name" required value={createForm.name}
                        onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="c-email">Email</Label>
                      <Input id="c-email" type="email" required value={createForm.email}
                        onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="c-mobile">Mobile Number</Label>
                      <Input id="c-mobile" required value={createForm.mobileNumber}
                        onChange={(e) => setCreateForm((f) => ({ ...f, mobileNumber: e.target.value }))} />
                    </div>
                    {createError && <p className="text-sm text-destructive">{createError}</p>}
                    <Button type="submit" disabled={creating}>
                      {creating ? "Creating..." : "Create Account"}
                    </Button>
                  </form>
                )}
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-destructive mb-4">{error}</p>}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Mobile</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-10">Loading...</TableCell>
              </TableRow>
            ) : accounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-10">No accounts found.</TableCell>
              </TableRow>
            ) : (
              accounts.map((acc) => (
                <TableRow key={acc.id}>
                  <TableCell className="font-medium">{acc.name ?? "—"}</TableCell>
                  <TableCell>{acc.email}</TableCell>
                  <TableCell>{acc.mobileNumber ?? "—"}</TableCell>
                  <TableCell>
                    <Badge className={`border text-xs font-medium ${ROLE_COLORS[acc.role] ?? ROLE_COLORS.USER}`}>
                      {ROLE_LABELS[acc.role] ?? acc.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {acc.isDeleted ? (
                      <Badge variant="destructive">Deleted</Badge>
                    ) : acc.isActive ? (
                      <Badge variant="default">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {acc.createdAt ? new Date(acc.createdAt).toLocaleDateString() : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost" size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        disabled={acc.isDeleted}
                        onClick={() => openEdit(acc)}
                      >
                        <HugeiconsIcon icon={PencilEdit01Icon} strokeWidth={1.5} className="size-4" />
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        disabled={acc.isDeleted}
                        onClick={() => { setDeleteTarget(acc); setDeleteError(null); }}
                      >
                        <HugeiconsIcon icon={Delete02Icon} strokeWidth={1.5} className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">Page {meta.page} of {meta.totalPages}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={Boolean(editTarget)} onOpenChange={(v) => { if (!v) setEditTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Account</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => void handleSave(e)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="e-name">Name</Label>
              <Input id="e-name" value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="e-mobile">Mobile Number</Label>
              <Input id="e-mobile" value={editForm.mobileNumber}
                onChange={(e) => setEditForm((f) => ({ ...f, mobileNumber: e.target.value }))} />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="e-active"
                type="checkbox"
                checked={editForm.isActive}
                onChange={(e) => setEditForm((f) => ({ ...f, isActive: e.target.checked }))}
                className="h-4 w-4 rounded border"
              />
              <Label htmlFor="e-active">Active</Label>
            </div>
            {editError && <p className="text-sm text-destructive">{editError}</p>}
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setEditTarget(null)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={Boolean(deleteTarget)} onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{" "}
            <span className="font-medium text-foreground">{deleteTarget?.name ?? deleteTarget?.email}</span>?
            This will permanently remove the account.
          </p>
          {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
          <div className="flex gap-2 justify-end mt-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" disabled={deleting} onClick={() => void handleDelete()}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
