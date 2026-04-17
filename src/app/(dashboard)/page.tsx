"use client";

import { useEffect, useState } from "react";
import {
  ChartIncreaseIcon,
  Store01Icon,
  UserGroupIcon,
  UserMultipleIcon,
  ShoppingCart01Icon,
  User02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { listAccounts } from "@/lib/api/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type RoleCounts = {
  admins: number;
  distributors: number;
  retailers: number;
  staff: number;
  users: number;
};

type RecentAccount = {
  id: string;
  name?: string;
  email: string;
  role: string;
  createdAt?: string;
};

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

function StatCard({
  title,
  value,
  description,
  icon,
  loading,
  href,
}: {
  title: string;
  value: number;
  description: string;
  icon: React.ReactNode;
  loading: boolean;
  href: string;
}) {
  return (
    <Link href={href}>
      <Card className="hover:bg-muted/40 transition-colors cursor-pointer">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardDescription className="text-sm font-medium">{title}</CardDescription>
          <div className="text-muted-foreground">{icon}</div>
        </CardHeader>
        <CardContent>
          <CardTitle className="text-3xl font-bold tabular-nums">
            {loading ? "—" : value.toLocaleString()}
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [counts, setCounts] = useState<RoleCounts>({ admins: 0, distributors: 0, retailers: 0, staff: 0, users: 0 });
  const [recent, setRecent] = useState<RecentAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== "SUPER_ADMIN") return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [adminsRes, distributorsRes, retailersRes, staffRes, usersRes, allRes] =
          await Promise.allSettled([
            listAccounts({ role: "ADMIN", limit: 1 }),
            listAccounts({ role: "DISTRIBUTER", limit: 1 }),
            listAccounts({ role: "RETAILER", limit: 1 }),
            listAccounts({ role: "STAFF", limit: 1 }),
            listAccounts({ role: "USER", limit: 1 }),
            listAccounts({ limit: 5 }),
          ]);

        if (cancelled) return;

        setCounts({
          admins: adminsRes.status === "fulfilled" ? adminsRes.value.meta.total : 0,
          distributors: distributorsRes.status === "fulfilled" ? distributorsRes.value.meta.total : 0,
          retailers: retailersRes.status === "fulfilled" ? retailersRes.value.meta.total : 0,
          staff: staffRes.status === "fulfilled" ? staffRes.value.meta.total : 0,
          users: usersRes.status === "fulfilled" ? usersRes.value.meta.total : 0,
        });

        if (allRes.status === "fulfilled") {
          setRecent(allRes.value.data);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [user?.role]);

  const totalAccounts = counts.admins + counts.distributors + counts.retailers + counts.staff + counts.users;

  return (
    <div className="w-full px-4 py-10 lg:px-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome back, {user?.name ?? user?.email ?? "Super Admin"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Here&apos;s an overview of your PrintLoom platform.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 mb-8">
        <StatCard
          title="Admins"
          value={counts.admins}
          description="Admin accounts"
          icon={<HugeiconsIcon icon={User02Icon} strokeWidth={1.5} className="size-5" />}
          loading={loading}
          href="/accounts/admins"
        />
        <StatCard
          title="Distributors"
          value={counts.distributors}
          description="Distributor accounts"
          icon={<HugeiconsIcon icon={Store01Icon} strokeWidth={1.5} className="size-5" />}
          loading={loading}
          href="/accounts/distributors"
        />
        <StatCard
          title="Retailers"
          value={counts.retailers}
          description="Retailer accounts"
          icon={<HugeiconsIcon icon={ShoppingCart01Icon} strokeWidth={1.5} className="size-5" />}
          loading={loading}
          href="/accounts/retailers"
        />
        <StatCard
          title="Staff"
          value={counts.staff}
          description="Staff accounts"
          icon={<HugeiconsIcon icon={UserMultipleIcon} strokeWidth={1.5} className="size-5" />}
          loading={loading}
          href="/accounts/staff"
        />
        <StatCard
          title="Users"
          value={counts.users}
          description="End user accounts"
          icon={<HugeiconsIcon icon={UserGroupIcon} strokeWidth={1.5} className="size-5" />}
          loading={loading}
          href="/accounts/users"
        />
      </div>

      {/* Summary + Recent */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Total accounts summary */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Total Accounts</CardTitle>
              <HugeiconsIcon icon={ChartIncreaseIcon} strokeWidth={1.5} className="size-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="text-4xl font-bold tabular-nums">
              {loading ? "—" : totalAccounts.toLocaleString()}
            </p>
            <div className="flex flex-col gap-2 text-sm">
              {(
                [
                  { label: "Admins", count: counts.admins, href: "/accounts/admins" },
                  { label: "Distributors", count: counts.distributors, href: "/accounts/distributors" },
                  { label: "Retailers", count: counts.retailers, href: "/accounts/retailers" },
                  { label: "Staff", count: counts.staff, href: "/accounts/staff" },
                  { label: "Users", count: counts.users, href: "/accounts/users" },
                ] as const
              ).map((row) => (
                <div key={row.label} className="flex items-center justify-between">
                  <Link href={row.href} className="text-muted-foreground hover:text-foreground transition-colors">
                    {row.label}
                  </Link>
                  <span className="font-medium tabular-nums">
                    {loading ? "—" : row.count.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent accounts */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Recently Added Accounts</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/accounts/all">View all</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : recent.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No accounts yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  recent.map((acc) => (
                    <TableRow key={acc.id}>
                      <TableCell className="font-medium">{acc.name ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{acc.email}</TableCell>
                      <TableCell>
                        <Badge className={`border text-xs font-medium ${ROLE_COLORS[acc.role] ?? ROLE_COLORS.USER}`}>
                          {ROLE_LABELS[acc.role] ?? acc.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {acc.createdAt ? new Date(acc.createdAt).toLocaleDateString() : "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
