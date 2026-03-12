"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardAction,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { AddSectionDialog } from "@/components/add-section-dialog";
import { useClassesStore } from "@/stores/useClassesStore";
import { useSectionsStore } from "@/stores/useSectionsStore";
import { Add01Icon, User02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export default function SectionsPage() {
	const {
		classes,
		fetchClasses,
		loading: classesLoading,
		error: classesError,
	} = useClassesStore();
	const {
		byClassId,
		fetchByClass,
		loading: sectionsLoading,
		error: sectionsError,
	} = useSectionsStore();
	const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
	const [addOpen, setAddOpen] = useState(false);

	useEffect(() => {
		void fetchClasses();
	}, [fetchClasses]);

	useEffect(() => {
		const first = classes[0];
		if (!selectedClassId && first) {
			setSelectedClassId(first.id);
		}
	}, [classes, selectedClassId]);

	useEffect(() => {
		if (!selectedClassId) return;
		void fetchByClass(selectedClassId);
	}, [fetchByClass, selectedClassId]);

	const sections = useMemo(() => {
		if (!selectedClassId) return [];
		return byClassId[selectedClassId] ?? [];
	}, [byClassId, selectedClassId]);

	return (
		<>
			<div className="flex items-center justify-between px-4 lg:px-6">
				<Label htmlFor="view-selector" className="sr-only">
					View
				</Label>
				<Select
					value={selectedClassId ?? undefined}
					onValueChange={(v) => setSelectedClassId(v)}
				>
					<SelectTrigger
						className="flex w-fit @4xl/main:hidden"
						size="sm"
						id="view-selector"
					>
						<SelectValue placeholder="Select class" />
					</SelectTrigger>
					<SelectContent>
						<SelectGroup>
							{classes.map((c) => (
								<SelectItem key={c.id} value={c.id}>
									{c.name}
								</SelectItem>
							))}
						</SelectGroup>
					</SelectContent>
				</Select>

				<div className="flex items-center gap-2">
					<Button variant="outline" size="sm" onClick={() => setAddOpen(true)}>
						<HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
						<span className="hidden lg:inline">Add Section</span>
					</Button>
				</div>
			</div>
			<AddSectionDialog
				open={addOpen}
				onOpenChange={setAddOpen}
				classId={selectedClassId}
				onCreated={() => {
					if (selectedClassId) void fetchByClass(selectedClassId);
				}}
			/>
			<div className="grid grid-cols-4 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
				{classesError && (
					<div className="col-span-full text-sm text-destructive">
						{classesError}
					</div>
				)}
				{sectionsError && (
					<div className="col-span-full text-sm text-destructive">
						{sectionsError}
					</div>
				)}
				{(classesLoading || sectionsLoading) &&
					["a", "b", "c", "d", "e", "f", "g", "h"].map((k) => (
						<Card key={`sk-section-${k}`} className="@container/card">
							<CardHeader>
								<Skeleton className="h-4 w-28" />
								<Skeleton className="mt-2 h-8 w-16" />
								<div className="mt-3">
									<Skeleton className="h-6 w-14" />
								</div>
							</CardHeader>
							<CardFooter className="flex-col items-start gap-1.5 text-sm">
								<Skeleton className="h-4 w-24" />
							</CardFooter>
						</Card>
					))}

				{sections.map((section) => (
					<Link href={`/sections/${section.id}`} key={section.id}>
						<Card key={section.id} className="@container/card">
							<CardHeader>
								<CardDescription>Total Students</CardDescription>
								<CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
									{section.name}
								</CardTitle>
								<CardAction>
									<Badge variant="outline">
										<HugeiconsIcon icon={User02Icon} strokeWidth={2} />
										{section.studentsCount ?? 0}
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
