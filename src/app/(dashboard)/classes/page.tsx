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
import { Skeleton } from "@/components/ui/skeleton";
import {
	Add01Icon,
	GridViewIcon,
	User02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function ClassesPage() {
	const { classes, loading, error, fetchClasses } = useClassesStore();
	const [addOpen, setAddOpen] = useState(false);

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
						<Card key={cls.id} className="@container/card">
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
