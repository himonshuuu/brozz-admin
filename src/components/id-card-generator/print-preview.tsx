import { useMemo, useState } from "react";
import type { IdCardFieldPlacement } from "./index";
import { Button } from "@/components/ui/button";
import { Download01Icon, LoaderCircle } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { saveAs } from "file-saver";
import { generateIdCardsZip } from "@/lib/api/id-cards";

/** Fixed card width so designer and preview share the same coordinate system (%, cqw). */
const CARD_WIDTH_PX = 600;

const CARDS_PER_PAGE = 6; // 2 columns x 3 rows

type StudentRecord = Record<string, unknown> & { id?: string };

type Props = {
	templateImage: string | null;
	fields: IdCardFieldPlacement[];
	students: StudentRecord[];
};

/** Extract base64 from data URL or return as-is if already plain base64. */
function toBase64(dataUrlOrBase64: string): string {
	if (dataUrlOrBase64.startsWith("data:")) {
		const match = dataUrlOrBase64.match(/^data:image\/\w+;base64,(.+)$/);
		return match ? match[1] ?? dataUrlOrBase64 : dataUrlOrBase64;
	}
	return dataUrlOrBase64;
}

function getTextValue(fieldId: string, student: StudentRecord): string {
	const f = fieldId;
	const str = (v: unknown) => (v != null ? String(v) : "N/A");
	if (f === "name") return str(student.name);
	if (f === "roll") return str(student.roll);
	if (f === "admission_number") return str(student.admissionNumber);
	if (f === "father") return str(student.fatherName);
	if (f === "dob") return student.dob ? new Date(student.dob as string).toLocaleDateString() : "N/A";
	if (f === "class") return str(student.class);
	if (f === "section") return str(student.section);
	if (f === "phone") return str(student.phone);
	if (f === "blood") return str(student.bloodGroup);
	if (f === "address") return str(student.address);
	return "N/A";
}

function CardContent({
	student,
	fields,
	templateImage,
}: {
	student: StudentRecord;
	fields: IdCardFieldPlacement[];
	templateImage: string;
}) {
	return (
		<>
			<img
				src={templateImage}
				alt=""
				className="block w-full h-auto object-contain pointer-events-none"
			/>
			{fields.map((field) => {
				const fId = field.fieldId;
				const textValue = getTextValue(fId, student);

				if (fId === "photo") {
					return (
						<div
							key={field.id}
							className="absolute bg-muted"
							style={{
								top: `${field.y}%`,
								left: `${field.x}%`,
								width: `${field.width ?? 25}cqw`,
								height: `${field.height ?? 35}cqw`,
								transform: "translate(-50%, -50%)",
								zIndex: 10,
							}}
						>
							{student.photo ? (
								<img
									src={String(student.photo)}
									alt=""
									className="w-full h-full object-cover block"
								/>
							) : (
								<div className="w-full h-full border-2 border-dashed flex items-center justify-center bg-background/50">
									<span className="text-[0.6em] text-muted-foreground">No Photo</span>
								</div>
							)}
						</div>
					);
				}

				return (
					<div
						key={field.id}
						className="absolute whitespace-nowrap"
						style={{
							top: `${field.y}%`,
							left: `${field.x}%`,
							fontSize: `${field.fontSize}cqw`,
							fontWeight: field.fontWeight,
							color: field.color,
							transform: "translate(-50%, -50%)",
							zIndex: 10,
						}}
					>
						{field.showLabel && <span className="mr-1 opacity-80">{field.customLabel}</span>}
						<span>{textValue}</span>
					</div>
				);
			})}
		</>
	);
}

export function PrintPreview({ templateImage, fields, students }: Props) {
	const validStudents = useMemo(() => students.filter(Boolean), [students]);
	const pages = useMemo(() => {
		const p: (typeof validStudents)[] = [];
		for (let i = 0; i < validStudents.length; i += CARDS_PER_PAGE) {
			p.push(validStudents.slice(i, i + CARDS_PER_PAGE));
		}
		return p;
	}, [validStudents]);
	const [downloading, setDownloading] = useState(false);

	const handleGenerateAndDownload = async () => {
		if (!templateImage || validStudents.length === 0) return;
		setDownloading(true);
		try {
			const blob = await generateIdCardsZip(
				toBase64(templateImage),
				fields,
				validStudents.map((s) => String(s.id ?? "")).filter(Boolean),
			);
			saveAs(blob, "printloom-id-cards.zip");
		} catch (err) {
			console.error("ID card generation failed", err);
			alert(err instanceof Error ? err.message : "Failed to generate ID cards. Please try again.");
		} finally {
			setDownloading(false);
		}
	};

	if (!templateImage) {
		return (
			<div className="flex h-full items-center justify-center text-muted-foreground">
				Please upload a template image first.
			</div>
		);
	}

	if (validStudents.length === 0) {
		return (
			<div className="flex h-full items-center justify-center text-muted-foreground">
				Please select students to generate ID cards.
			</div>
		);
	}

	return (
		<div className="flex flex-col items-center w-full print:m-0 print:p-0 pb-12 print:pb-0">
			{/* Screen: instructions + download */}
			<div className="bg-background border rounded-lg p-4 w-full max-w-2xl shadow-sm print:hidden flex items-center justify-between mb-8">
				<div>
					<h3 className="font-semibold text-lg mb-1">Preview</h3>
					<p className="text-sm text-muted-foreground">
						Preview matches the designer. Print: 2×3 cards per page, empty margins.
					</p>
				</div>
				<Button onClick={handleGenerateAndDownload} disabled={downloading} variant="secondary">
					{downloading ? (
						<HugeiconsIcon icon={LoaderCircle} className="mr-2 animate-spin" />
					) : (
						<HugeiconsIcon icon={Download01Icon} className="mr-2" />
					)}
					Generate &amp; Download ZIP
				</Button>
			</div>

			{/* Screen: scrollable 2-col preview */}
			<div className="w-full max-w-[1280px] print:hidden">
				<div
					className="grid gap-6"
					style={{ gridTemplateColumns: `repeat(2, ${CARD_WIDTH_PX}px)` }}
				>
					{validStudents.map((student, idx) => (
						<div
							key={`screen-${student.id}-${idx}`}
							className="relative isolate bg-white shadow-xl ring-1 ring-border overflow-hidden"
							style={{
								width: CARD_WIDTH_PX,
								containerType: "inline-size",
								containerName: "card",
							}}
						>
							<CardContent
								student={student}
								fields={fields}
								templateImage={templateImage}
							/>
						</div>
					))}
				</div>
			</div>

			{/* Print: empty pages, 2 col x 3 row per page; card sizes to image so % positions match */}
			<div className="hidden print:block">
				{pages.map((pageStudents, pageIdx) => (
					<div
						key={pageStudents.map((s) => String(s.id ?? "")).join("-") || `page-${pageIdx}`}
						className="print-page"
						style={{
							pageBreakAfter: pageIdx < pages.length - 1 ? "always" : "auto",
							width: "210mm",
							minHeight: "297mm",
							padding: "10mm",
							boxSizing: "border-box",
							display: "grid",
							gridTemplateColumns: "1fr 1fr",
							gridTemplateRows: "1fr 1fr 1fr",
							gap: "6mm",
						}}
					>
						{Array.from({ length: CARDS_PER_PAGE }, (_, slotIndex) => {
							const student = pageStudents[slotIndex];
							const cellStyle = {
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								minHeight: 0,
								overflow: "hidden",
							} as const;
							if (!student) {
								return <div key={`slot-${String(pageStudents[0]?.id ?? "")}-${slotIndex}`} style={cellStyle} />;
							}
							return (
								<div key={String(student.id)} style={cellStyle}>
									{/* Card fills cell; image defines height so % positions match designer */}
									<div
										className="relative bg-white overflow-hidden w-full"
										style={{
											containerType: "inline-size",
											containerName: "card",
										}}
									>
										<CardContent
											student={student}
											fields={fields}
											templateImage={templateImage}
										/>
									</div>
								</div>
							);
						})}
					</div>
				))}
			</div>
		</div>
	);
}
