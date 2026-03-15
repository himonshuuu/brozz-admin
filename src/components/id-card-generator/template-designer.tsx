"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { ID_CARD_FIELDS, type IdCardFieldPlacement } from "./index";
import {
	Upload01Icon,
	Delete02Icon,
	Settings01Icon,
	LayerIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

const CARD_WIDTH = 600;
const SNAP_GRID = 2; // percent; 0 = no snap
const NUDGE_STEP = 1; // percent per arrow key

type Props = {
	templateImage: string | null;
	setTemplateImage: (img: string | null) => void;
	fields: IdCardFieldPlacement[];
	setFields: (
		fields:
			| IdCardFieldPlacement[]
			| ((prev: IdCardFieldPlacement[]) => IdCardFieldPlacement[]),
	) => void;
	students: {
		id: string;
		name?: string;
		roll?: string;
		[k: string]: unknown;
	}[];
};

function snap(value: number, step: number): number {
	if (step <= 0) return value;
	return Math.round(value / step) * step;
}

export function TemplateDesigner({
	templateImage,
	setTemplateImage,
	fields,
	setFields,
	students,
}: Props) {
	const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const canvasRef = useRef<HTMLDivElement>(null);
	const [dragging, setDragging] = useState<string | null>(null);
	const dragOffsetRef = useRef({ x: 0, y: 0 });
	const [resizingId, setResizingId] = useState<string | null>(null);
	const resizeStartRef = useRef({
		width: 0,
		height: 0,
		pointerX: 0,
		pointerY: 0,
	});
	const [previewStudentId, setPreviewStudentId] = useState<string | null>(null);
	const [showGrid, setShowGrid] = useState(true);
	const effectiveSnap = showGrid ? SNAP_GRID : 0;

	const previewStudent =
		students.find((s) => s.id === previewStudentId) ?? null;

	const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = (event) => {
			if (event.target?.result) setTemplateImage(event.target.result as string);
		};
		reader.readAsDataURL(file);
	};

	const addField = useCallback(
		(fieldId: string) => {
			const baseField = ID_CARD_FIELDS.find((f) => f.id === fieldId);
			if (!baseField) return;
			const newField: IdCardFieldPlacement = {
				id: crypto.randomUUID(),
				fieldId,
				x: 20,
				y: 20,
				fontSize: 14,
				fontWeight: "normal",
				color: "#000000",
				showLabel: fieldId !== "photo",
				// customLabel: baseField.defaultLabel,
				customLabel: "",
				...(fieldId === "photo" ? { width: 25, height: 35 } : {}),
			};
			setFields((prev) => [...prev, newField]);
			setActiveFieldId(newField.id);
		},
		[setFields],
	);

	const removeField = useCallback(
		(id: string) => {
			setFields((prev) => prev.filter((f) => f.id !== id));
			if (activeFieldId === id) setActiveFieldId(null);
		},
		[activeFieldId, setFields],
	);

	const updateActiveField = useCallback(
		(updates: Partial<IdCardFieldPlacement>) => {
			if (!activeFieldId) return;
			setFields((prev) =>
				prev.map((f) => (f.id === activeFieldId ? { ...f, ...updates } : f)),
			);
		},
		[activeFieldId, setFields],
	);

	const activeField = fields.find((f) => f.id === activeFieldId);

	const handleCanvasPointerDown = (e: React.PointerEvent) => {
		if (e.target !== canvasRef.current) return;
		setActiveFieldId(null);
	};

	const handleFieldPointerDown = (e: React.PointerEvent, id: string) => {
		if (!canvasRef.current) return;
		e.stopPropagation();
		e.preventDefault();
		const rect = canvasRef.current.getBoundingClientRect();
		const field = fields.find((f) => f.id === id);
		if (!field) return;
		// Center of element in px
		const centerX = (field.x / 100) * rect.width;
		const centerY = (field.y / 100) * rect.height;
		dragOffsetRef.current = {
			x: e.clientX - rect.left - centerX,
			y: e.clientY - rect.top - centerY,
		};
		setDragging(id);
		setActiveFieldId(id);
		(e.target as HTMLElement).setPointerCapture(e.pointerId);
	};

	const handlePointerMove = useCallback(
		(e: React.PointerEvent) => {
			if (!canvasRef.current) return;
			if (!dragging && !resizingId) return;
			e.preventDefault();
			const rect = canvasRef.current.getBoundingClientRect();

			if (dragging) {
				const centerX = e.clientX - rect.left - dragOffsetRef.current.x;
				const centerY = e.clientY - rect.top - dragOffsetRef.current.y;
				let xPct = (centerX / rect.width) * 100;
				let yPct = (centerY / rect.height) * 100;
				xPct = Math.max(0, Math.min(100, xPct));
				yPct = Math.max(0, Math.min(100, yPct));
				if (effectiveSnap > 0) {
					xPct = snap(xPct, effectiveSnap);
					yPct = snap(yPct, effectiveSnap);
				}
				setFields((prev) =>
					prev.map((f) => (f.id === dragging ? { ...f, x: xPct, y: yPct } : f)),
				);
			} else if (resizingId) {
				const dx = e.clientX - resizeStartRef.current.pointerX;
				const dy = e.clientY - resizeStartRef.current.pointerY;
				const baseWidthPct = resizeStartRef.current.width;
				const baseHeightPct = resizeStartRef.current.height;

				const widthPx = (baseWidthPct / 100) * rect.width + dx;
				const heightPx = (baseHeightPct / 100) * rect.height + dy;

				let newWidthPct = (widthPx / rect.width) * 100;
				let newHeightPct = (heightPx / rect.height) * 100;

				newWidthPct = Math.max(5, Math.min(80, newWidthPct));
				newHeightPct = Math.max(5, Math.min(80, newHeightPct));

				setFields((prev) =>
					prev.map((f) =>
						f.id === resizingId
							? {
									...f,
									width: Math.round(newWidthPct),
									height: Math.round(newHeightPct),
								}
							: f,
					),
				);
			}
		},
		[dragging, resizingId, setFields, effectiveSnap],
	);

	const handlePointerUp = useCallback(
		(e: React.PointerEvent) => {
			if (dragging || resizingId) {
				try {
					(e.target as HTMLElement).releasePointerCapture(e.pointerId);
				} catch {}
				if (dragging) setDragging(null);
				if (resizingId) setResizingId(null);
			}
		},
		[dragging, resizingId],
	);

	const handlePhotoResizePointerDown = (e: React.PointerEvent, id: string) => {
		if (!canvasRef.current) return;
		e.stopPropagation();
		e.preventDefault();
		const field = fields.find((f) => f.id === id);
		if (!field || field.width == null || field.height == null) return;

		resizeStartRef.current = {
			width: field.width,
			height: field.height,
			pointerX: e.clientX,
			pointerY: e.clientY,
		};
		setResizingId(id);
		setActiveFieldId(id);
		(e.target as HTMLElement).setPointerCapture(e.pointerId);
	};

	// Keyboard: nudge, Delete
	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if (!activeFieldId || !activeField) return;
			const step = NUDGE_STEP;
			if (e.key === "Delete" || e.key === "Backspace") {
				e.preventDefault();
				removeField(activeFieldId);
				return;
			}
			if (
				e.key === "ArrowLeft" ||
				e.key === "ArrowRight" ||
				e.key === "ArrowUp" ||
				e.key === "ArrowDown"
			) {
				e.preventDefault();
				let dx = 0;
				let dy = 0;
				if (e.key === "ArrowLeft") dx = -step;
				if (e.key === "ArrowRight") dx = step;
				if (e.key === "ArrowUp") dy = -step;
				if (e.key === "ArrowDown") dy = step;
				const x =
					effectiveSnap > 0
						? snap(activeField.x + dx, effectiveSnap)
						: activeField.x + dx;
				const y =
					effectiveSnap > 0
						? snap(activeField.y + dy, effectiveSnap)
						: activeField.y + dy;
				updateActiveField({
					x: Math.max(0, Math.min(100, x)),
					y: Math.max(0, Math.min(100, y)),
				});
			}
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [
		activeFieldId,
		activeField,
		removeField,
		updateActiveField,
		effectiveSnap,
	]);

	function getPreviewText(field: IdCardFieldPlacement): string {
		const label =
			ID_CARD_FIELDS.find((f) => f.id === field.fieldId)?.label ??
			field.fieldId;
		if (!previewStudent) return `[${label}]`;
		const f = field.fieldId;
		if (f === "name") return previewStudent.name ?? "N/A";
		if (f === "roll") return previewStudent.roll ?? "N/A";
		if (f === "admission_number")
			return String(
				(previewStudent as { admissionNumber?: string }).admissionNumber ??
					"N/A",
			);
		if (f === "father")
			return String(
				(previewStudent as { fatherName?: string }).fatherName ?? "N/A",
			);
		if (f === "dob") {
			const dob = (previewStudent as { dob?: string }).dob;
			return dob ? new Date(dob).toLocaleDateString() : "N/A";
		}
		if (f === "class")
			return String((previewStudent as { class?: string }).class ?? "N/A");
		if (f === "section")
			return String((previewStudent as { section?: string }).section ?? "N/A");
		if (f === "phone")
			return String((previewStudent as { phone?: string }).phone ?? "N/A");
		if (f === "blood")
			return String(
				(previewStudent as { bloodGroup?: string }).bloodGroup ?? "N/A",
			);
		if (f === "address")
			return String((previewStudent as { address?: string }).address ?? "N/A");
		return "N/A";
	}

	return (
		<div
			className="flex h-full w-full overflow-hidden"
			onPointerMove={handlePointerMove}
			onPointerUp={handlePointerUp}
			onPointerLeave={handlePointerUp}
			onPointerCancel={handlePointerUp}
		>
			{/* Left: Fields + Layers */}
			<div className="flex flex-col w-64 border-r bg-muted/20 shrink-0">
				<div className="p-3 border-b font-medium text-sm">Add field</div>
				<ScrollArea className="flex-1">
					<div className="p-2 flex flex-col gap-1">
						{ID_CARD_FIELDS.map((field) => (
							<Button
								key={field.id}
								variant="ghost"
								size="sm"
								className="justify-start font-normal"
								onClick={() => addField(field.id)}
							>
								+ {field.label}
							</Button>
						))}
					</div>
				</ScrollArea>
				{fields.length > 0 && (
					<>
						<div className="p-3 border-t border-b flex items-center gap-2 font-medium text-sm">
							<HugeiconsIcon icon={LayerIcon} className="w-4 h-4" />
							Layers
						</div>
						<ScrollArea className="flex-1 max-h-40">
							<div className="p-2 flex flex-col gap-0.5">
								{fields.map((f) => {
									const label =
										ID_CARD_FIELDS.find((x) => x.id === f.fieldId)?.label ??
										f.fieldId;
									const isActive = activeFieldId === f.id;
									return (
										<button
											key={f.id}
											type="button"
											onClick={() => setActiveFieldId(f.id)}
											className={`flex items-center justify-between gap-2 px-2 py-1.5 rounded text-left text-sm truncate ${isActive ? "bg-primary/15 text-primary font-medium" : "hover:bg-muted/60"}`}
										>
											<span className="truncate">{label}</span>
											<button
												type="button"
												aria-label="Remove"
												onClick={(ev) => {
													ev.stopPropagation();
													removeField(f.id);
												}}
												className="shrink-0 p-0.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
											>
												<HugeiconsIcon
													icon={Delete02Icon}
													className="w-3.5 h-3.5"
												/>
											</button>
										</button>
									);
								})}
							</div>
						</ScrollArea>
					</>
				)}
			</div>

			{/* Center: Canvas */}
			<div className="flex-1 flex flex-col items-center justify-center p-6 bg-muted/30 overflow-auto min-h-0">
				{!templateImage ? (
					<div className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-12 text-center bg-background max-w-sm">
						<HugeiconsIcon
							icon={Upload01Icon}
							className="w-10 h-10 text-muted-foreground mb-4"
						/>
						<h3 className="font-semibold text-lg">Upload template</h3>
						<p className="text-sm text-muted-foreground mb-4">
							Upload a high-quality image of the ID card (no text). You’ll place
							fields on top.
						</p>
						<Button onClick={() => fileInputRef.current?.click()}>
							Browse files
						</Button>
						<input
							type="file"
							className="hidden"
							ref={fileInputRef}
							accept="image/*"
							onChange={handleImageUpload}
						/>
					</div>
				) : (
					<div className="flex flex-col gap-3 items-center">
						<div className="flex items-center justify-between w-full max-w-[620px] gap-4">
							<div className="flex items-center gap-2">
								<span className="text-sm font-medium">Preview:</span>
								<Select
									value={previewStudentId ?? "none"}
									onValueChange={(v) =>
										setPreviewStudentId(v === "none" ? null : v)
									}
								>
									<SelectTrigger className="w-[200px] h-8 text-xs">
										<SelectValue placeholder="Generic" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="none">Generic</SelectItem>
										{students.map((s) => (
											<SelectItem key={s.id} value={s.id}>
												{s.name ?? "—"} ({s.roll ?? "—"})
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="flex items-center gap-2">
								<label className="flex items-center gap-2 text-sm cursor-pointer">
									<input
										type="checkbox"
										checked={showGrid}
										onChange={(e) => setShowGrid(e.target.checked)}
										className="rounded"
									/>
									Grid
								</label>
								<Button
									variant="outline"
									size="sm"
									onClick={() => fileInputRef.current?.click()}
									className="h-8 text-xs"
								>
									Change template
								</Button>
								<input
									type="file"
									className="hidden"
									ref={fileInputRef}
									accept="image/*"
									onChange={handleImageUpload}
								/>
							</div>
						</div>

						{/* Canvas: fixed size, grid, image, overlays */}
						<div
							ref={canvasRef}
							className="relative shrink-0 overflow-hidden bg-white ring-1 ring-border shadow-lg @container"
							style={{
								width: CARD_WIDTH,
								backgroundImage: showGrid
									? `radial-gradient(circle at center, var(--muted) 1px, transparent 1px)`
									: undefined,
								backgroundSize: showGrid ? "20px 20px" : undefined,
							}}
							onPointerDown={handleCanvasPointerDown}
						>
							<img
								src={templateImage}
								alt=""
								className="block w-full h-auto pointer-events-none select-none"
								draggable={false}
							/>

							{fields.map((field) => {
								const isPhoto = field.fieldId === "photo";
								const previewText = getPreviewText(field);
								const isActive = activeFieldId === field.id;

								return (
									<div
										key={field.id}
										className={`absolute cursor-grab active:cursor-grabbing select-none touch-none outline-none ${isActive ? "ring-2 ring-primary ring-offset-1 ring-offset-white z-10" : "hover:ring-1 hover:ring-primary/50 z-1"} ${dragging === field.id ? "z-20" : ""}`}
										style={{
											top: `${field.y}%`,
											left: `${field.x}%`,
											transform: "translate(-50%, -50%)",
											fontSize: `${field.fontSize}cqw`,
											fontWeight: field.fontWeight,
											color: field.color,
											...(isPhoto && field.width != null && field.height != null
												? {
														width: `${field.width}cqw`,
														height: `${field.height}cqw`,
														display: "flex",
														alignItems: "center",
														justifyContent: "center",
														textAlign: "center",
													}
												: { padding: "2px 4px" }),
										}}
										onPointerDown={(e) => handleFieldPointerDown(e, field.id)}
									>
										{isPhoto ? (
											<div className="relative w-full h-full bg-muted border-2 border-dashed border-muted-foreground flex flex-col items-center justify-center overflow-hidden">
												<HugeiconsIcon
													icon={Upload01Icon}
													className="w-1/3 h-1/3 text-muted-foreground opacity-50"
												/>
												<span className="text-[0.5em] mt-0.5 text-muted-foreground">
													Photo
												</span>
												{/* Resize handle (bottom-right) */}
												<div
													className="absolute right-[-6px] bottom-[-6px] w-3 h-3 rounded-sm bg-primary border border-background cursor-se-resize"
													onPointerDown={(e) =>
														handlePhotoResizePointerDown(e, field.id)
													}
												/>
											</div>
										) : (
											<>
												{field.showLabel && (
													<span className="mr-1 opacity-80">
														{field.customLabel}
													</span>
												)}
												<span className="whitespace-nowrap">{previewText}</span>
											</>
										)}
									</div>
								);
							})}
						</div>

						<p className="text-xs text-muted-foreground">
							Drag to move · Arrow keys to nudge · Delete to remove · Click
							canvas to deselect
						</p>
					</div>
				)}
			</div>

			{/* Right: Properties */}
			{activeField && (
				<div className="w-72 border-l bg-background shrink-0 flex flex-col p-4 gap-5 overflow-y-auto">
					<div>
						<h3 className="font-semibold flex items-center gap-2 mb-0.5">
							<HugeiconsIcon icon={Settings01Icon} className="w-4 h-4" />
							Properties
						</h3>
						<p className="text-xs text-muted-foreground">
							{ID_CARD_FIELDS.find((f) => f.id === activeField.fieldId)?.label}
						</p>
					</div>

					{/* Position (Figma-like X/Y) */}
					<div className="space-y-2">
						<Label className="text-xs font-medium">Position (%)</Label>
						<div className="grid grid-cols-2 gap-2">
							<div>
								<Label className="text-[10px] text-muted-foreground">X</Label>
								<Input
									type="number"
									min={0}
									max={100}
									step={effectiveSnap || 0.5}
									value={Number(activeField.x.toFixed(1))}
									onChange={(e) => {
										const v = Number.parseFloat(e.target.value);
										if (!Number.isNaN(v))
											updateActiveField({ x: Math.max(0, Math.min(100, v)) });
									}}
									className="h-8 text-xs font-mono"
								/>
							</div>
							<div>
								<Label className="text-[10px] text-muted-foreground">Y</Label>
								<Input
									type="number"
									min={0}
									max={100}
									step={effectiveSnap || 0.5}
									value={Number(activeField.y.toFixed(1))}
									onChange={(e) => {
										const v = Number.parseFloat(e.target.value);
										if (!Number.isNaN(v))
											updateActiveField({ y: Math.max(0, Math.min(100, v)) });
									}}
									className="h-8 text-xs font-mono"
								/>
							</div>
						</div>
					</div>

					<div className="space-y-2 flex items-center justify-between">
						<Label>Show label</Label>
						<Switch
							checked={activeField.showLabel}
							onCheckedChange={(v) => updateActiveField({ showLabel: v })}
						/>
					</div>

					{activeField.showLabel && (
						<div className="space-y-2">
							<Label>Label text</Label>
							<Input
								value={activeField.customLabel}
								onChange={(e) =>
									updateActiveField({ customLabel: e.target.value })
								}
								className="h-8"
							/>
						</div>
					)}

					{activeField.fieldId !== "photo" && (
						<>
							<div className="space-y-2">
								<Label className="flex justify-between text-xs">
									<span>Font size</span>
									<span className="text-muted-foreground font-normal">
										{activeField.fontSize}
									</span>
								</Label>
								<Slider
									value={[activeField.fontSize]}
									min={4}
									max={24}
									step={0.5}
									onValueChange={([v]) =>
										updateActiveField({ fontSize: v ?? activeField.fontSize })
									}
								/>
							</div>
							<div className="space-y-2">
								<Label>Weight</Label>
								<Select
									value={activeField.fontWeight}
									onValueChange={(v: "normal" | "bold") =>
										updateActiveField({ fontWeight: v })
									}
								>
									<SelectTrigger className="h-8">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="normal">Normal</SelectItem>
										<SelectItem value="bold">Bold</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label>Color</Label>
								<div className="flex gap-2 items-center">
									<input
										type="color"
										value={activeField.color}
										onChange={(e) =>
											updateActiveField({ color: e.target.value })
										}
										className="h-8 w-8 rounded cursor-pointer shrink-0 p-0 border border-input"
									/>
									<Input
										value={activeField.color}
										onChange={(e) =>
											updateActiveField({ color: e.target.value })
										}
										className="flex-1 h-8 font-mono text-xs uppercase"
									/>
								</div>
							</div>
						</>
					)}

					{activeField.fieldId === "photo" && (
						<>
							<div className="space-y-2">
								<Label className="flex justify-between text-xs">
									<span>Width %</span>
									<span className="text-muted-foreground font-normal">
										{activeField.width ?? 25}
									</span>
								</Label>
								<Slider
									value={[activeField.width ?? 25]}
									min={5}
									max={80}
									step={1}
									onValueChange={([v]) => updateActiveField({ width: v })}
								/>
							</div>
							<div className="space-y-2">
								<Label className="flex justify-between text-xs">
									<span>Height %</span>
									<span className="text-muted-foreground font-normal">
										{activeField.height ?? 35}
									</span>
								</Label>
								<Slider
									value={[activeField.height ?? 35]}
									min={5}
									max={80}
									step={1}
									onValueChange={([v]) => updateActiveField({ height: v })}
								/>
							</div>
						</>
					)}

					<Button
						variant="outline"
						size="sm"
						className="text-destructive border-destructive/50 hover:bg-destructive/10"
						onClick={() => removeField(activeField.id)}
					>
						<HugeiconsIcon icon={Delete02Icon} className="w-4 h-4 mr-2" />
						Remove field
					</Button>
				</div>
			)}
		</div>
	);
}
