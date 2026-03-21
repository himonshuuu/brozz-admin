import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Select,
	SelectContent,
	SelectGroup,
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
import { useClassesStore } from "@/stores/useClassesStore";
import { useSchoolsStore } from "@/stores/useSchoolsStore";
import { useSectionsStore } from "@/stores/useSectionsStore";
import * as sectionsApi from "@/lib/api/sections";
import { LoaderCircle, GridViewIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

type Props = {
	selectedStudents: any[];
	setSelectedStudents: (students: any[]) => void;
};

export function StudentSelector({
	selectedStudents,
	setSelectedStudents,
}: Props) {
	const { classes, fetchClasses } = useClassesStore();
	const { schools, fetchSchools } = useSchoolsStore();
	const { byClassId, fetchByClass } = useSectionsStore();

	const [selectedSchoolId, setSelectedSchoolId] = useState<string | "all">(
		"all",
	);

	const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
	const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
		null,
	);

	const [students, setStudents] = useState<any[]>([]);
	const [loadingStudents, setLoadingStudents] = useState(false);

	useEffect(() => {
		void fetchSchools();
	}, [fetchSchools]);

	useEffect(() => {
		const schoolId = selectedSchoolId === "all" ? undefined : selectedSchoolId;
		void fetchClasses({ schoolId });
		setSelectedClassId(null);
		setSelectedSectionId(null);
		setStudents([]);
	}, [selectedSchoolId, fetchClasses]);

	useEffect(() => {
		if (selectedClassId) {
			void fetchByClass(selectedClassId);
			setSelectedSectionId(null);
			setStudents([]);
		}
	}, [selectedClassId, fetchByClass]);

	useEffect(() => {
		if (selectedSectionId) {
			setLoadingStudents(true);
			sectionsApi
				.listStudentsFromSection(selectedSectionId)
				.then((res) => {
					// Enrich with class/section names for the Print Preview rendering easily
					const sClass =
						classes.find((c) => c.id === selectedClassId)?.name || "";
					const sSection =
						byClassId[selectedClassId || ""]?.find(
							(s) => s.id === selectedSectionId,
						)?.name || "";

					const enriched = res.data.map((stu) => ({
						...stu,
						class: sClass,
						section: sSection,
					}));
					setStudents(enriched);
				})
				.finally(() => setLoadingStudents(false));
		} else {
			setStudents([]);
		}
	}, [selectedSectionId, selectedClassId, byClassId, classes]);

	const toggleStudent = (student: any) => {
		const isSelected = selectedStudents.some((s) => s.id === student.id);
		if (isSelected) {
			setSelectedStudents(selectedStudents.filter((s) => s.id !== student.id));
		} else {
			setSelectedStudents([...selectedStudents, student]);
		}
	};

	const toggleAll = (checked: boolean) => {
		if (checked) {
			// Add all current view students that aren't already selected
			const newStudents = students.filter(
				(s) => !selectedStudents.some((sel) => sel.id === s.id),
			);
			setSelectedStudents([...selectedStudents, ...newStudents]);
		} else {
			// Remove all current view students from selection
			const viewIds = new Set(students.map((s) => s.id));
			setSelectedStudents(selectedStudents.filter((s) => !viewIds.has(s.id)));
		}
	};

	const sortedSchools = useMemo(
		() => [...schools].sort((a, b) => a.name.localeCompare(b.name)),
		[schools],
	);
	const sortedClasses = useMemo(
		() => [...classes].sort((a, b) => a.name.localeCompare(b.name)),
		[classes],
	);
	const sections = useMemo(
		() =>
			(selectedClassId ? byClassId[selectedClassId] || [] : [])
				.slice()
				.sort((a, b) => a.name.localeCompare(b.name)),
		[selectedClassId, byClassId],
	);
	const allViewSelected =
		students.length > 0 &&
		students.every((s) => selectedStudents.some((sel) => sel.id === s.id));
	const someViewSelected = students.some((s) =>
		selectedStudents.some((sel) => sel.id === s.id),
	);

	return (
		<div className="flex flex-col h-full w-full">
			<div className="flex items-center gap-4 p-4 border-b bg-muted/20 shrink-0">
				<div className="flex items-center gap-2">
					<span className="text-sm font-medium">School:</span>
					<Select
						value={selectedSchoolId}
						onValueChange={(v) => setSelectedSchoolId(v as "all" | string)}
					>
						<SelectTrigger className="w-[200px] bg-background">
							<SelectValue placeholder="All Schools" />
						</SelectTrigger>
						<SelectContent>
							<SelectGroup>
								<SelectItem value="all">All</SelectItem>
								{sortedSchools.map((school) => (
									<SelectItem key={school.id} value={school.id}>
										{school.name}
									</SelectItem>
								))}
							</SelectGroup>
						</SelectContent>
					</Select>
				</div>
				<div className="flex items-center gap-2">
					<span className="text-sm font-medium">Class:</span>
					<Select
						value={selectedClassId || undefined}
						onValueChange={setSelectedClassId}
					>
						<SelectTrigger className="w-[180px] bg-background">
							<SelectValue placeholder="Select Class" />
						</SelectTrigger>
						<SelectContent>
							<SelectGroup>
								{sortedClasses.map((c) => (
									<SelectItem key={c.id} value={c.id}>
										{c.name}
									</SelectItem>
								))}
							</SelectGroup>
						</SelectContent>
					</Select>
				</div>
				<div className="flex items-center gap-2">
					<span className="text-sm font-medium">Section:</span>
					<Select
						value={selectedSectionId || undefined}
						onValueChange={setSelectedSectionId}
						disabled={!selectedClassId || sections.length === 0}
					>
						<SelectTrigger className="w-[180px] bg-background">
							<SelectValue placeholder="Select Section" />
						</SelectTrigger>
						<SelectContent>
							<SelectGroup>
								{sections.map((s) => (
									<SelectItem key={s.id} value={s.id}>
										{s.name}
									</SelectItem>
								))}
							</SelectGroup>
						</SelectContent>
					</Select>
				</div>
				<div className="flex-1" />
				<div className="text-sm font-medium px-4 py-1.5 bg-primary/10 text-primary rounded-full">
					{selectedStudents.length} Selected
				</div>
				{selectedStudents.length > 0 && (
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setSelectedStudents([])}
					>
						Clear Selection
					</Button>
				)}
			</div>

			<div className="flex-1 overflow-auto p-4 shrink-0 max-h-full">
				<div className="border rounded-lg overflow-hidden relative">
					<Table>
						<TableHeader className="bg-muted/50 sticky top-0 z-10 shadow-sm">
							<TableRow>
								<TableHead className="w-[50px]">
									<Checkbox
										checked={
											allViewSelected || (someViewSelected && "indeterminate")
										}
										onCheckedChange={(v) => toggleAll(!!v)}
										disabled={students.length === 0}
									/>
								</TableHead>
								<TableHead>Roll No</TableHead>
								<TableHead>Name</TableHead>
								<TableHead>Father Name</TableHead>
								<TableHead>Phone</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{loadingStudents ? (
								<TableRow>
									<TableCell
										colSpan={5}
										className="h-32 text-center text-muted-foreground"
									>
										<HugeiconsIcon
											icon={LoaderCircle}
											className="w-6 h-6 animate-spin mx-auto mb-2"
										/>
										Loading students...
									</TableCell>
								</TableRow>
							) : students.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={5}
										className="h-32 text-center text-muted-foreground"
									>
										<HugeiconsIcon
											icon={GridViewIcon}
											className="w-8 h-8 opacity-20 mx-auto mb-2"
										/>
										{selectedSectionId
											? "No students found in this section."
											: "Select a class and section to view students."}
									</TableCell>
								</TableRow>
							) : (
								students.map((student) => {
									const isSelected = selectedStudents.some(
										(s) => s.id === student.id,
									);
									return (
										<TableRow
											key={student.id}
											data-state={isSelected ? "selected" : undefined}
											className="cursor-pointer"
											onClick={() => toggleStudent(student)}
										>
											<TableCell onClick={(e) => e.stopPropagation()}>
												<Checkbox
													checked={isSelected}
													onCheckedChange={() => toggleStudent(student)}
												/>
											</TableCell>
											<TableCell className="font-medium">
												{student.roll}
											</TableCell>
											<TableCell>{student.name}</TableCell>
											<TableCell>{student.fatherName}</TableCell>
											<TableCell>{student.phone}</TableCell>
										</TableRow>
									);
								})
							)}
						</TableBody>
					</Table>
				</div>
			</div>
		</div>
	);
}
