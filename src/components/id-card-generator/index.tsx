"use client";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PrinterIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { PrintPreview } from "./print-preview";
import { StudentSelector } from "./student-selector";
import { TemplateDesigner } from "./template-designer";

// Standard fields available for ID Cards
export const ID_CARD_FIELDS = [
	{ id: "name", label: "Student Name", defaultLabel: "Name:" },
	{ id: "roll", label: "Roll No.", defaultLabel: "Roll No:" },
	{ id: "admission_number", label: "Admission No.", defaultLabel: "Adm No:" },
	{ id: "father", label: "Father Name", defaultLabel: "Father:" },
	{ id: "dob", label: "Date of Birth", defaultLabel: "DOB:" },
	{ id: "class", label: "Class", defaultLabel: "Class:" },
	{ id: "section", label: "Section", defaultLabel: "Section:" },
	{ id: "phone", label: "Phone", defaultLabel: "Ph:" },
	{ id: "blood", label: "Blood Group", defaultLabel: "Blood:" },
	{ id: "address", label: "Address", defaultLabel: "Addr:" },
	{ id: "photo", label: "Student Photo", defaultLabel: "Photo" },
];

export type IdCardFieldPlacement = {
	id: string; // The field ID or a unique ID if multiple
	fieldId: string; // The reference to mapped student data
	x: number; // X coordinate (percentage or pixels)
	y: number; // Y coordinate
	fontSize: number;
	fontWeight: "normal" | "bold";
	color: string;
	showLabel: boolean;
	customLabel: string;
	width?: number; // Used for images (percentage)
	height?: number; // Used for images (percentage)
};

export function IdCardEditor() {
	const [activeTab, setActiveTab] = useState("designer");
	const [templateImage, setTemplateImage] = useState<string | null>(null);
	const [fields, setFields] = useState<IdCardFieldPlacement[]>([]);
	const [selectedStudents, setSelectedStudents] = useState<any[]>([]);

	const handlePrint = () => {
		window.print();
	};

	return (
		<div className="flex flex-col h-full bg-background rounded-lg @container">
			<Tabs
				value={activeTab}
				onValueChange={setActiveTab}
				className="flex flex-col h-full w-full"
			>
				<div className="flex items-center justify-between border-b px-4 py-3 shrink-0 print:hidden">
					<TabsList>
						<TabsTrigger value="designer">1. Design Template</TabsTrigger>
						<TabsTrigger value="students">2. Select Students</TabsTrigger>
						<TabsTrigger value="preview">3. Print Preview</TabsTrigger>
					</TabsList>
					<Button
						onClick={handlePrint}
						disabled={
							activeTab !== "preview" ||
							selectedStudents.length === 0 ||
							!templateImage
						}
					>
						<HugeiconsIcon icon={PrinterIcon} className="mr-2" />
						Print Cards
					</Button>
				</div>
				<div className="flex-1 overflow-hidden relative">
					<TabsContent
						value="designer"
						className="h-full m-0 p-0 border-none outline-none data-[state=active]:flex"
					>
						<TemplateDesigner
							templateImage={templateImage}
							setTemplateImage={setTemplateImage}
							fields={fields}
							setFields={setFields}
							students={selectedStudents}
						/>
					</TabsContent>
					<TabsContent
						value="students"
						className="h-full m-0 p-0 border-none outline-none data-[state=active]:flex"
					>
						<StudentSelector
							selectedStudents={selectedStudents}
							setSelectedStudents={setSelectedStudents}
						/>
					</TabsContent>
					<TabsContent
						value="preview"
						className="h-[calc(100vh-250px)] overflow-auto bg-muted/30 p-8 data-[state=active]:block"
					>
						<PrintPreview
							templateImage={templateImage}
							fields={fields}
							students={selectedStudents}
						/>
					</TabsContent>
				</div>
			</Tabs>
		</div>
	);
}
