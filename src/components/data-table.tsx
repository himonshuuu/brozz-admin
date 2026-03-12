"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "@/components/ui/drawer";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	KeyboardSensor,
	MouseSensor,
	TouchSensor,
	type UniqueIdentifier,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
	arrayMove,
	SortableContext,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
	Add01Icon,
	ArrowDown01Icon,
	ArrowLeft01Icon,
	ArrowLeftDoubleIcon,
	ArrowRight01Icon,
	ArrowRightDoubleIcon,
	Delete02Icon,
	LeftToRightListBulletIcon,
	MoreVerticalCircle01Icon,
	PencilEdit01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
	type ColumnDef,
	type ColumnFiltersState,
	flexRender,
	getCoreRowModel,
	getFacetedRowModel,
	getFacetedUniqueValues,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	type Row,
	type SortingState,
	useReactTable,
	type VisibilityState,
} from "@tanstack/react-table";
import * as React from "react";
import { z } from "zod";

export const schema = z.object({
	id: z.string(),
	roll: z.string(),
	class: z.string(),
	section: z.string(),
	admission_number: z.string(),
	name: z.string(),
	father: z.string(),
	dob: z.string(),
	phone: z.string(),
	blood: z.string(),
	address: z.string(),
});

// Columns according to schema
const columns: ColumnDef<z.infer<typeof schema>>[] = [
	{
		id: "select",
		header: ({ table }) => (
			<div className="flex items-center justify-center">
				<Checkbox
					checked={
						table.getIsAllPageRowsSelected() ||
						(table.getIsSomePageRowsSelected() && "indeterminate")
					}
					onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
					aria-label="Select all"
				/>
			</div>
		),
		cell: ({ row }) => (
			<div className="flex items-center justify-center">
				<Checkbox
					checked={row.getIsSelected()}
					onCheckedChange={(value) => row.toggleSelected(!!value)}
					aria-label="Select row"
				/>
			</div>
		),
		enableSorting: false,
		enableHiding: false,
	},
	{
		accessorKey: "roll",
		header: "Roll No.",
		cell: ({ row }) => row.original.roll,
		enableHiding: false,
	},
	{
		accessorKey: "admission_number",
		header: "Admission No.",
		cell: ({ row }) => row.original.admission_number,
	},
	{
		accessorKey: "name",
		header: "Name",
		cell: ({ row }) => <TableCellViewer item={row.original} />,
		enableHiding: false,
	},
	{
		accessorKey: "father",
		header: "Father Name",
		cell: ({ row }) => row.original.father,
	},
	{
		accessorKey: "dob",
		header: "DOB",
		cell: ({ row }) => row.original.dob,
	},
	{
		accessorKey: "class",
		header: "Class",
		cell: ({ row }) => row.original.class,
	},
	{
		accessorKey: "section",
		header: "Section",
		cell: ({ row }) => row.original.section,
	},
	{
		accessorKey: "phone",
		header: "Phone",
		cell: ({ row }) => row.original.phone,
	},
	{
		accessorKey: "blood",
		header: "Blood Type",
		cell: ({ row }) => (
			<Badge variant="outline" className="px-1.5 text-muted-foreground">
				{row.original.blood}
			</Badge>
		),
	},
	{
		accessorKey: "address",
		header: "Address",
		cell: ({ row }) => row.original.address,
	},
	{
		id: "actions",
		header: () => null,
		cell: ({ row, table }) => {
			const meta = table.options.meta as {
				onEdit: (item: z.infer<typeof schema>) => void;
				onDelete: (id: string) => void;
			};

			return (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="ghost"
							className="flex size-8 text-muted-foreground data-[state=open]:bg-muted"
							size="icon"
						>
							<HugeiconsIcon icon={MoreVerticalCircle01Icon} strokeWidth={2} />
							<span className="sr-only">Open menu</span>
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-32">
						<DropdownMenuItem onClick={() => meta.onEdit(row.original)}>
							<HugeiconsIcon icon={PencilEdit01Icon} />
							Edit
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							variant="destructive"
							onClick={() => meta.onDelete(row.original.id)}
						>
							<HugeiconsIcon icon={Delete02Icon} />
							Delete
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			);
		},
	},
];

function DraggableRow({ row }: { row: Row<z.infer<typeof schema>> }) {
	const { transform, transition, setNodeRef, isDragging } = useSortable({
		id: row.original.id,
	});

	return (
		<TableRow
			data-state={row.getIsSelected() && "selected"}
			data-dragging={isDragging}
			ref={setNodeRef}
			className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
			style={{
				transform: CSS.Transform.toString(transform),
				transition: transition,
			}}
		>
			{row.getVisibleCells().map((cell) => (
				<TableCell key={cell.id}>
					{flexRender(cell.column.columnDef.cell, cell.getContext())}
				</TableCell>
			))}
		</TableRow>
	);
}

export function DataTable({
	data: initialData,
}: {
	data: z.infer<typeof schema>[];
}) {
	const [data, setData] = React.useState(() => initialData);
	const [rowSelection, setRowSelection] = React.useState({});
	const [columnVisibility, setColumnVisibility] =
		React.useState<VisibilityState>({});
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
		[],
	);
	const [sorting, setSorting] = React.useState<SortingState>([]);
	const [pagination, setPagination] = React.useState({
		pageIndex: 0,
		pageSize: 10,
	});
	const [editingItem, setEditingItem] = React.useState<z.infer<
		typeof schema
	> | null>(null);
	const [isAddingStudent, setIsAddingStudent] = React.useState(false);
	const sortableId = React.useId();
	const sensors = useSensors(
		useSensor(MouseSensor, {}),
		useSensor(TouchSensor, {}),
		useSensor(KeyboardSensor, {}),
	);

	const dataIds = React.useMemo<UniqueIdentifier[]>(
		() => data?.map(({ id }) => id) || [],
		[data],
	);

	const handleEdit = React.useCallback((item: z.infer<typeof schema>) => {
		setEditingItem(item);
	}, []);

	const handleDelete = React.useCallback((id: string) => {
		setData((prev) => prev.filter((item) => item.id !== id));
	}, []);

	const handleSave = React.useCallback(
		(item: z.infer<typeof schema> | Omit<z.infer<typeof schema>, "id">) => {
			if ("id" in item) {
				setData((prev) => prev.map((d) => (d.id === item.id ? item : d)));
			}
			setEditingItem(null);
		},
		[],
	);

	const handleAddStudent = React.useCallback(
		(item: Omit<z.infer<typeof schema>, "id">) => {
			const newId = crypto.randomUUID();
			const newItem = { ...item, id: newId };
			setData((prev) => [...prev, newItem]);
			setIsAddingStudent(false);
		},
		[],
	);

	const table = useReactTable({
		data,
		columns,
		state: {
			sorting,
			columnVisibility,
			rowSelection,
			columnFilters,
			pagination,
		},
		getRowId: (row) => row.id.toString(),
		enableRowSelection: true,
		onRowSelectionChange: setRowSelection,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onColumnVisibilityChange: setColumnVisibility,
		onPaginationChange: setPagination,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFacetedRowModel: getFacetedRowModel(),
		getFacetedUniqueValues: getFacetedUniqueValues(),
		meta: {
			onEdit: handleEdit,
			onDelete: handleDelete,
		},
	});

	function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event;
		if (active && over && active.id !== over.id) {
			setData((data) => {
				const oldIndex = dataIds.indexOf(active.id);
				const newIndex = dataIds.indexOf(over.id);
				return arrayMove(data, oldIndex, newIndex);
			});
		}
	}

	return (
		<Tabs
			defaultValue="outline"
			className="w-full flex-col justify-start gap-6"
		>
			{editingItem && (
				<StudentFormDrawer
					item={editingItem}
					open={!!editingItem}
					onOpenChange={(open) => !open && setEditingItem(null)}
					onSave={handleSave}
				/>
			)}
			{isAddingStudent && (
				<StudentFormDrawer
					open={isAddingStudent}
					onOpenChange={setIsAddingStudent}
					onSave={handleAddStudent}
				/>
			)}
			<TabsContent
				value="outline"
				className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
			>
				<div className="overflow-hidden rounded-lg border">
					<DndContext
						collisionDetection={closestCenter}
						modifiers={[restrictToVerticalAxis]}
						onDragEnd={handleDragEnd}
						sensors={sensors}
						id={sortableId}
					>
						<Table>
							<TableHeader className="sticky top-0 z-10 bg-muted">
								{table.getHeaderGroups().map((headerGroup) => (
									<TableRow key={headerGroup.id}>
										{headerGroup.headers.map((header) => {
											return (
												<TableHead key={header.id} colSpan={header.colSpan}>
													{header.isPlaceholder
														? null
														: flexRender(
																header.column.columnDef.header,
																header.getContext(),
															)}
												</TableHead>
											);
										})}
									</TableRow>
								))}
							</TableHeader>
							<TableBody className="**:data-[slot=table-cell]:first:w-8">
								{table.getRowModel().rows?.length ? (
									<SortableContext
										items={dataIds}
										strategy={verticalListSortingStrategy}
									>
										{table.getRowModel().rows.map((row) => (
											<DraggableRow key={row.id} row={row} />
										))}
									</SortableContext>
								) : (
									<TableRow>
										<TableCell
											colSpan={columns.length}
											className="h-24 text-center"
										>
											No results.
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</DndContext>
				</div>
				<div className="flex items-center justify-between px-4">
					<div className="hidden flex-1 text-sm text-muted-foreground lg:flex">
						{table.getFilteredSelectedRowModel().rows.length} of{" "}
						{table.getFilteredRowModel().rows.length} row(s) selected.
					</div>
					<div className="flex w-full items-center gap-8 lg:w-fit">
						<div className="hidden items-center gap-2 lg:flex">
							<Label htmlFor="rows-per-page" className="text-sm font-medium">
								Rows per page
							</Label>
							<Select
								value={`${table.getState().pagination.pageSize}`}
								onValueChange={(value) => {
									table.setPageSize(Number(value));
								}}
							>
								<SelectTrigger size="sm" className="w-20" id="rows-per-page">
									<SelectValue
										placeholder={table.getState().pagination.pageSize}
									/>
								</SelectTrigger>
								<SelectContent side="top">
									<SelectGroup>
										{[10, 20, 30, 40, 50].map((pageSize) => (
											<SelectItem key={pageSize} value={`${pageSize}`}>
												{pageSize}
											</SelectItem>
										))}
									</SelectGroup>
								</SelectContent>
							</Select>
						</div>
						<div className="flex w-fit items-center justify-center text-sm font-medium">
							Page {table.getState().pagination.pageIndex + 1} of{" "}
							{table.getPageCount()}
						</div>
						<div className="ml-auto flex items-center gap-2 lg:ml-0">
							<Button
								variant="outline"
								className="hidden h-8 w-8 p-0 lg:flex"
								onClick={() => table.setPageIndex(0)}
								disabled={!table.getCanPreviousPage()}
							>
								<span className="sr-only">Go to first page</span>
								<HugeiconsIcon icon={ArrowLeftDoubleIcon} strokeWidth={2} />
							</Button>
							<Button
								variant="outline"
								className="size-8"
								size="icon"
								onClick={() => table.previousPage()}
								disabled={!table.getCanPreviousPage()}
							>
								<span className="sr-only">Go to previous page</span>
								<HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
							</Button>
							<Button
								variant="outline"
								className="size-8"
								size="icon"
								onClick={() => table.nextPage()}
								disabled={!table.getCanNextPage()}
							>
								<span className="sr-only">Go to next page</span>
								<HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
							</Button>
							<Button
								variant="outline"
								className="hidden size-8 lg:flex"
								size="icon"
								onClick={() => table.setPageIndex(table.getPageCount() - 1)}
								disabled={!table.getCanNextPage()}
							>
								<span className="sr-only">Go to last page</span>
								<HugeiconsIcon icon={ArrowRightDoubleIcon} strokeWidth={2} />
							</Button>
						</div>
					</div>
				</div>
			</TabsContent>
		</Tabs>
	);
}

function TableCellViewer({ item }: { item: z.infer<typeof schema> }) {
	const isMobile = useIsMobile();
	return (
		<Drawer direction={isMobile ? "bottom" : "right"}>
			<DrawerTrigger asChild>
				<Button variant="link" className="w-fit px-0 text-left text-foreground">
					{item.name}
				</Button>
			</DrawerTrigger>
			<DrawerContent>
				<DrawerHeader className="gap-1">
					<DrawerTitle>{item.name}</DrawerTitle>
					<DrawerDescription>Student details.</DrawerDescription>
				</DrawerHeader>
				<div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
					<form className="flex flex-col gap-4">
						<div className="flex flex-col gap-3">
							<Label htmlFor="view-roll">Roll No.</Label>
							<Input id="view-roll" defaultValue={item.roll} readOnly />
						</div>
						<div className="flex flex-col gap-3">
							<Label htmlFor="view-admission_number">Admission No.</Label>
							<Input
								id="view-admission_number"
								defaultValue={item.admission_number}
								readOnly
							/>
						</div>
						<div className="flex flex-col gap-3">
							<Label htmlFor="view-name">Student Name</Label>
							<Input id="view-name" defaultValue={item.name} readOnly />
						</div>
						<div className="flex flex-col gap-3">
							<Label htmlFor="view-father">Father Name</Label>
							<Input id="view-father" defaultValue={item.father} readOnly />
						</div>
						<div className="flex flex-col gap-3">
							<Label htmlFor="view-dob">Date of Birth</Label>
							<Input id="view-dob" defaultValue={item.dob} readOnly />
						</div>
						<div className="flex flex-col gap-3">
							<Label htmlFor="view-class">Class</Label>
							<Input id="view-class" defaultValue={item.class} readOnly />
						</div>
						<div className="flex flex-col gap-3">
							<Label htmlFor="view-section">Section</Label>
							<Input id="view-section" defaultValue={item.section} readOnly />
						</div>
						<div className="flex flex-col gap-3">
							<Label htmlFor="view-phone">Phone</Label>
							<Input id="view-phone" defaultValue={item.phone} readOnly />
						</div>
						<div className="flex flex-col gap-3">
							<Label htmlFor="view-blood">Blood Type</Label>
							<Input id="view-blood" defaultValue={item.blood} readOnly />
						</div>
						<div className="flex flex-col gap-3">
							<Label htmlFor="view-address">Address</Label>
							<Input id="view-address" defaultValue={item.address} readOnly />
						</div>
					</form>
				</div>
				<DrawerFooter>
					<DrawerClose asChild>
						<Button variant="outline">Close</Button>
					</DrawerClose>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
}

function StudentFormDrawer({
	item,
	open,
	onOpenChange,
	onSave,
}: {
	item?: z.infer<typeof schema>;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSave: (
		item: z.infer<typeof schema> | Omit<z.infer<typeof schema>, "id">,
	) => void;
}) {
	const isMobile = useIsMobile();
	const [formData, setFormData] = React.useState(
		item || {
			roll: "",
			class: "",
			section: "",
			admission_number: "",
			name: "",
			father: "",
			dob: "",
			phone: "",
			blood: "",
			address: "",
		},
	);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (item) {
			onSave({ ...formData, id: item.id });
		} else {
			onSave(formData);
		}
	};

	return (
		<Drawer
			open={open}
			onOpenChange={onOpenChange}
			direction={isMobile ? "bottom" : "right"}
		>
			<DrawerContent>
				<DrawerHeader className="gap-1">
					<DrawerTitle>{item ? "Edit Student" : "Add Student"}</DrawerTitle>
					<DrawerDescription>
						{item ? "Update student details." : "Add a new student."}
					</DrawerDescription>
				</DrawerHeader>
				<div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
					<form
						id="student-form"
						className="flex flex-col gap-4"
						onSubmit={handleSubmit}
					>
						<div className="flex flex-col gap-3">
							<Label htmlFor="form-roll">Roll No.</Label>
							<Input
								id="form-roll"
								value={formData.roll}
								onChange={(e) =>
									setFormData({ ...formData, roll: e.target.value })
								}
								required
							/>
						</div>
						<div className="flex flex-col gap-3">
							<Label htmlFor="form-admission_number">Admission No.</Label>
							<Input
								id="form-admission_number"
								value={formData.admission_number}
								onChange={(e) =>
									setFormData({ ...formData, admission_number: e.target.value })
								}
								required
							/>
						</div>
						<div className="flex flex-col gap-3">
							<Label htmlFor="form-name">Student Name</Label>
							<Input
								id="form-name"
								value={formData.name}
								onChange={(e) =>
									setFormData({ ...formData, name: e.target.value })
								}
								required
							/>
						</div>
						<div className="flex flex-col gap-3">
							<Label htmlFor="form-father">Father Name</Label>
							<Input
								id="form-father"
								value={formData.father}
								onChange={(e) =>
									setFormData({ ...formData, father: e.target.value })
								}
								required
							/>
						</div>
						<div className="flex flex-col gap-3">
							<Label htmlFor="form-dob">Date of Birth</Label>
							<Input
								id="form-dob"
								type="date"
								value={formData.dob}
								onChange={(e) =>
									setFormData({ ...formData, dob: e.target.value })
								}
								required
							/>
						</div>
						<div className="flex flex-col gap-3">
							<Label htmlFor="form-class">Class</Label>
							<Input
								id="form-class"
								value={formData.class}
								onChange={(e) =>
									setFormData({ ...formData, class: e.target.value })
								}
								required
							/>
						</div>
						<div className="flex flex-col gap-3">
							<Label htmlFor="form-section">Section</Label>
							<Input
								id="form-section"
								value={formData.section}
								onChange={(e) =>
									setFormData({ ...formData, section: e.target.value })
								}
								required
							/>
						</div>
						<div className="flex flex-col gap-3">
							<Label htmlFor="form-phone">Phone</Label>
							<Input
								id="form-phone"
								type="tel"
								value={formData.phone}
								onChange={(e) =>
									setFormData({ ...formData, phone: e.target.value })
								}
								required
							/>
						</div>
						<div className="flex flex-col gap-3">
							<Label htmlFor="form-blood">Blood Type</Label>
							<Input
								id="form-blood"
								value={formData.blood}
								onChange={(e) =>
									setFormData({ ...formData, blood: e.target.value })
								}
								required
							/>
						</div>
						<div className="flex flex-col gap-3">
							<Label htmlFor="form-address">Address</Label>
							<Input
								id="form-address"
								value={formData.address}
								onChange={(e) =>
									setFormData({ ...formData, address: e.target.value })
								}
								required
							/>
						</div>
					</form>
				</div>
				<DrawerFooter>
					<Button type="submit" form="student-form">
						{item ? "Update" : "Add"}
					</Button>
					<DrawerClose asChild>
						<Button variant="outline" type="button">
							Cancel
						</Button>
					</DrawerClose>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
}
