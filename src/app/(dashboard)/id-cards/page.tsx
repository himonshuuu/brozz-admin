"use client";

import { IdCardEditor } from "@/components/id-card-generator";
import { useAuthStore } from "@/stores/useAuthStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function IdCardsPage() {
	const user = useAuthStore((s) => s.user);
	const router = useRouter();

	useEffect(() => {
		if (user && user.role !== "admin") {
			router.replace("/");
		}
	}, [user, router]);

	if (!user || user.role !== "admin") return null;

	return (
		<>
			<div className="flex flex-col gap-4 px-4 lg:px-6 h-full">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-2xl font-semibold tracking-tight">ID Cards</h1>
						<p className="text-sm text-muted-foreground">
							Design and print student ID cards using custom templates
						</p>
					</div>
				</div>
				<div className="flex-1 min-h-[600px] border rounded-lg bg-background overflow-hidden">
					<IdCardEditor />
				</div>
			</div>
		</>
	);
}
