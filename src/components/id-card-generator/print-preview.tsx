import { useMemo } from "react";
import type { IdCardFieldPlacement } from "./index";

/** Fixed card width so designer and preview share the same coordinate system (%, cqw). */
const CARD_WIDTH_PX = 600;

type StudentRecord = Record<string, unknown> & { id?: string };

type Props = {
	templateImage: string | null;
	fields: IdCardFieldPlacement[];
	students: StudentRecord[];
};

function getTextValue(fieldId: string, student: StudentRecord): string {
	const f = fieldId;
	const str = (v: unknown) => (v != null ? String(v) : "N/A");
	if (f === "name") return str(student.name);
	if (f === "roll") return str(student.roll);
	if (f === "admission_number") return str(student.admissionNumber);
	if (f === "father") return str(student.fatherName);
	if (f === "dob")
		return student.dob
			? new Date(student.dob as string).toLocaleDateString()
			: "N/A";
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
									<span className="text-[0.6em] text-muted-foreground">
										No Photo
									</span>
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
						{field.showLabel && (
							<span className="mr-1 opacity-80">{field.customLabel}</span>
						)}
						<span>{textValue}</span>
					</div>
				);
			})}
		</>
	);
}

export function PrintPreview({ templateImage, fields, students }: Props) {
	const validStudents = useMemo(() => students.filter(Boolean), [students]);

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
		<div className="flex flex-col items-center w-full pb-12">
			<div className="bg-background border rounded-lg p-4 w-full max-w-2xl shadow-sm mb-8">
				<div>
					<h3 className="font-semibold text-lg mb-1">Preview</h3>
					<p className="text-sm text-muted-foreground">
						Preview matches the designer template and selected fields.
					</p>
				</div>
			</div>

			<div className="w-full max-w-[1280px]">
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
		</div>
	);
}
