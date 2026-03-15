"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardAction,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useClassesStore } from "@/stores/useClassesStore";
import { AddClassDialog } from "@/components/add-class-dialog";
import { EditClassDialog } from "@/components/edit-class-dialog";
import { DeleteClassDialog } from "@/components/delete-class-dialog";
import type { ClassDto } from "@/lib/api/classes";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Add01Icon,
	GridViewIcon,
	User02Icon,
	Edit02Icon,
	Delete02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function ClassesPage() {
	const { classes, loading, error, fetchClasses } = useClassesStore();
	const [addOpen, setAddOpen] = useState(false);
	const [editingClass, setEditingClass] = useState<ClassDto | null>(null);
	const [deletingClass, setDeletingClass] = useState<ClassDto | null>(null);

	useEffect(() => {
		void fetchClasses();
	}, [fetchClasses]);

	return (
		<>
			<div className="flex items-center justify-between px-4 lg:px-6">
				<Label htmlFor="view-selector" className="sr-only">
					View
				</Label>
				<div className="flex-1" />

				<div className="flex items-center gap-2">
					<Button variant="outline" size="sm" onClick={() => setAddOpen(true)}>
						<HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
						<span className="hidden lg:inline">Add Class</span>
					</Button>
				</div>
			</div>
			<AddClassDialog
				open={addOpen}
				onOpenChange={setAddOpen}
				onCreated={fetchClasses}
			/>
			{editingClass && (
				<EditClassDialog
					cls={editingClass}
					open={!!editingClass}
					onOpenChange={(open) => !open && setEditingClass(null)}
					onUpdated={() => {
						setEditingClass(null);
						void fetchClasses();
					}}
				/>
			)}
			{deletingClass && (
				<DeleteClassDialog
					cls={deletingClass}
					open={!!deletingClass}
					onOpenChange={(open) => !open && setDeletingClass(null)}
					onDeleted={() => {
						setDeletingClass(null);
						void fetchClasses();
					}}
				/>
			)}
			<div className="grid grid-cols-4 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
				{error && (
					<div className="col-span-full text-sm text-destructive">{error}</div>
				)}
				{loading &&
					["a", "b", "c", "d", "e", "f", "g", "h"].map((k) => (
						<Card key={`sk-class-${k}`} className="@container/card">
							<CardHeader>
								<Skeleton className="h-4 w-20" />
								<Skeleton className="mt-2 h-8 w-28" />
								<div className="mt-3 flex gap-2">
									<Skeleton className="h-6 w-14" />
									<Skeleton className="h-6 w-14" />
								</div>
							</CardHeader>
						</Card>
					))}
				{classes.map((cls) => (
					<Link href={`/classes/${cls.id}`} key={cls.id}>
						<Card key={cls.id} className="group relative @container/card">
							<div className="absolute right-2 bottom-2 z-10 flex gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
								<Button
									variant="ghost"
									size="icon"
									className="h-6 w-6 bg-background/50 backdrop-blur-sm hover:bg-background/80 cursor-pointer"
									onClick={(e) => {
										e.preventDefault();
										e.stopPropagation();
										setEditingClass(cls);
									}}
								>
									<HugeiconsIcon icon={Edit02Icon} strokeWidth={2} className="h-2 w-2" />
									<span className="sr-only">Edit Class</span>
								</Button>
								<Button
									variant="ghost"
									size="icon"
									className="h-6 w-6   bg-background/50 backdrop-blur-sm text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer"
									onClick={(e) => {
										e.preventDefault();
										e.stopPropagation();
										setDeletingClass(cls);
									}}
								>
									<HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="h-2 w-2" />
									<span className="sr-only">Delete Class</span>
								</Button>
							</div>
							<CardHeader>
								<CardDescription>Total</CardDescription>
								<CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
									{cls.name}
								</CardTitle>
								<CardAction className="flex gap-2">
									<Badge variant="outline">
										<HugeiconsIcon icon={GridViewIcon} strokeWidth={2} />
										{cls.sectionsCount ?? 0}
									</Badge>
									<Badge variant="outline">
										<HugeiconsIcon icon={User02Icon} strokeWidth={2} />
										{cls.studentsCount ?? 0}
									</Badge>
								</CardAction>
							</CardHeader>
						</Card>
					</Link>
				))}
			</div>
		</>
	);
}
