"use client";

import { DataTable } from "@/components/data-table";
import { AddStudentDialog } from "@/components/add-student-dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useClassesStore } from "@/stores/useClassesStore";
import { useSectionsStore } from "@/stores/useSectionsStore";
import { useStudentsStore } from "@/stores/useStudentsStore";
import * as sectionsApi from "@/lib/api/sections";
import { useParams } from "next/navigation";
import { Add01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useMemo, useState } from "react";

export default function SectionStudentsPage() {
	const params = useParams<{ id: string }>();
	const sectionIdFromRoute = params?.id ?? null;

	const { classes, fetchClasses, loading: classesLoading, error: classesError } =
		useClassesStore();
	const {
		byClassId,
		fetchByClass,
		loading: sectionsLoading,
		error: sectionsError,
	} = useSectionsStore();
	const {
		students,
		loading: studentsLoading,
		error: studentsError,
		fetchStudents,
	} = useStudentsStore();

	const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
	const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
	const [addOpen, setAddOpen] = useState(false);

	useEffect(() => {
		void fetchClasses();
	}, [fetchClasses]);

	// Load section details to determine its class.
	useEffect(() => {
		let cancelled = false;
		if (!sectionIdFromRoute) return;

		(async () => {
			try {
				const res = await sectionsApi.getSection(sectionIdFromRoute);
				if (cancelled) return;
				const section = res.data;
				setSelectedClassId(section.classId);
				setSelectedSectionId(section.id);
				void fetchByClass(section.classId);
				void fetchStudents({ sectionId: section.id });
			} catch {
				// handled via store errors when fetching students/sections
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [fetchByClass, fetchStudents, sectionIdFromRoute]);

	useEffect(() => {
		if (!selectedClassId) return;
		void fetchByClass(selectedClassId);
	}, [fetchByClass, selectedClassId]);

	useEffect(() => {
		if (!selectedSectionId) return;
		void fetchStudents({ sectionId: selectedSectionId });
	}, [fetchStudents, selectedSectionId]);

	const sections = useMemo(() => {
		if (!selectedClassId) return [];
		return byClassId[selectedClassId] ?? [];
	}, [byClassId, selectedClassId]);

	const classById = useMemo(() => {
		return new Map(classes.map((c) => [c.id, c]));
	}, [classes]);

	const sectionById = useMemo(() => {
		const map = new Map<string, { id: string; classId: string; name: string }>();
		for (const list of Object.values(byClassId)) {
			for (const s of list) {
				map.set(s.id, s);
			}
		}
		return map;
	}, [byClassId]);

	const error = studentsError || sectionsError || classesError;
	const loading = studentsLoading || sectionsLoading || classesLoading;

	if (error) return <div className="px-4 text-sm text-destructive">{error}</div>;
	if (loading)
		return (
			<div className="space-y-4 px-4 lg:px-6">
				<div className="flex flex-wrap items-center gap-3">
					<Skeleton className="h-6 w-10" />
					<Skeleton className="h-9 w-[220px]" />
					<Skeleton className="h-6 w-14" />
					<Skeleton className="h-9 w-[220px]" />
					<div className="flex-1" />
					<Skeleton className="h-9 w-28" />
				</div>
				<div className="rounded-md border">
					<div className="p-4">
						<div className="grid grid-cols-5 gap-3">
							{["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"].map((k) => (
								<Skeleton
									key={`sk-student-row-${k}`}
									className="h-4 w-full col-span-5"
								/>
							))}
						</div>
					</div>
				</div>
			</div>
		);

	const data = students.map((s) => {
		const section = sectionById.get(s.sectionId);
		const cls = section ? classById.get(section.classId) : null;

		return {
			id: s.id,
			roll: s.roll,
			class: cls?.name ?? "",
			section: section?.name ?? "",
			admission_number: s.admissionNumber,
			name: s.name,
			father: s.fatherName,
			dob: String(s.dob),
			phone: s.phone,
			blood: s.bloodGroup,
			address: s.address,
		};
	});

	const totalStudents = data.length;

	return (
		<div className="space-y-4 px-4 lg:px-6">
			<div className="flex flex-wrap items-center gap-3">
				<Label className="text-sm">Class</Label>
				<Select
					value={selectedClassId ?? undefined}
					onValueChange={(v) => setSelectedClassId(v)}
				>
					<SelectTrigger className="w-[220px]" size="sm">
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

				<Label className="text-sm">Section</Label>
				<Select
					value={selectedSectionId ?? "all"}
					onValueChange={(v) => setSelectedSectionId(v === "all" ? null : v)}
					disabled={!selectedClassId}
				>
					<SelectTrigger className="w-[220px]" size="sm">
						<SelectValue placeholder="All sections" />
					</SelectTrigger>
					<SelectContent>
						<SelectGroup>
							<SelectItem value="all">All</SelectItem>
							{sections.map((s) => (
								<SelectItem key={s.id} value={s.id}>
									{s.name}
								</SelectItem>
							))}
						</SelectGroup>
					</SelectContent>
				</Select>

				<div className="flex items-center gap-4 text-xs text-muted-foreground">
					<span>
						Students:{" "}
						<span className="font-medium text-foreground">
							{totalStudents}
						</span>
					</span>
				</div>

				<div className="flex-1" />
				<Button
					variant="outline"
					size="sm"
					onClick={() => setAddOpen(true)}
					disabled={!selectedSectionId}
				>
					<HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
					<span className="hidden sm:inline">Add Student</span>
				</Button>
			</div>

			<AddStudentDialog
				open={addOpen}
				onOpenChange={setAddOpen}
				sectionId={selectedSectionId}
				onCreated={() => {
					if (selectedSectionId) void fetchStudents({ sectionId: selectedSectionId });
					else if (selectedClassId) void fetchStudents({ classId: selectedClassId });
				}}
			/>

			<DataTable data={data} />
		</div>
	);
}

