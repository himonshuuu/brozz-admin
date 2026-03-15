"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useSchoolsStore } from "@/stores/useSchoolsStore";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AddSchoolDialog } from "@/components/add-school-dialog";
import { EditSchoolDialog } from "@/components/edit-school-dialog";
import { DeleteSchoolDialog } from "@/components/delete-school-dialog";

export default function SchoolsPage() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const { schools, loading, error, fetchSchools } = useSchoolsStore();
  const [addOpen, setAddOpen] = useState(false);
  const [editingSchoolId, setEditingSchoolId] = useState<string | null>(null);
  const [deletingSchoolId, setDeletingSchoolId] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.role !== "admin") {
      router.replace("/");
    }
  }, [user, router]);

  useEffect(() => {
    if (user?.role === "admin") {
      void fetchSchools();
    }
  }, [user?.role, fetchSchools]);

  if (!user || user.role !== "admin") return null;

  const editingSchool = editingSchoolId
    ? schools.find((s) => s.id === editingSchoolId) ?? null
    : null;
  const deletingSchool = deletingSchoolId
    ? schools.find((s) => s.id === deletingSchoolId) ?? null
    : null;

  return (
    <div className="space-y-4 px-4 lg:px-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Schools</h1>
          <p className="text-sm text-muted-foreground">
            Manage all registered schools.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}>
          Add School
        </Button>
      </div>

      {error && <div className="text-sm text-destructive">{error}</div>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading &&
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={`sk-school-${String(i)}`}>
              <CardHeader>
                <Skeleton className="h-4 w-32" />
                <Skeleton className="mt-2 h-3 w-48" />
                <div className="mt-3 flex gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </CardHeader>
            </Card>
          ))}

        {!loading &&
          schools.map((s) => (
            <Card
              key={s.id}
              className="@container/card cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setEditingSchoolId(s.id)}
            >
              <CardHeader>
                <CardTitle className="text-base font-semibold truncate">
                  {s.name}
                </CardTitle>
                <CardDescription className="truncate">{s.email}</CardDescription>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <Badge variant={s.emailVerified ? "default" : "outline"}>
                    {s.emailVerified ? "Email verified" : "Unverified"}
                  </Badge>
                  <Badge variant={s.isActive ? "outline" : "destructive"}>
                    {s.isActive ? "Active" : "Inactive"}
                  </Badge>
                  {s.isDeleted && (
                    <Badge variant="destructive">
                      Deleted
                    </Badge>
                  )}
                </div>
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingSchoolId(s.id);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingSchoolId(s.id);
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}
      </div>

      <AddSchoolDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onCreated={fetchSchools}
      />

      {editingSchool && (
        <EditSchoolDialog
          school={editingSchool}
          open={!!editingSchool}
          onOpenChange={(open) => {
            if (!open) setEditingSchoolId(null);
          }}
          onUpdated={fetchSchools}
        />
      )}

      {deletingSchool && (
        <DeleteSchoolDialog
          school={deletingSchool}
          open={!!deletingSchool}
          onOpenChange={(open) => {
            if (!open) setDeletingSchoolId(null);
          }}
          onDeleted={fetchSchools}
        />
      )}
    </div>
  );
}

