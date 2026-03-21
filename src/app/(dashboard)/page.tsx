"use client";

import { useEffect, useMemo, useState } from "react";
import { listClasses } from "@/lib/api/classes";
import { listImportJobs } from "@/lib/api/import";
import { listSchools } from "@/lib/api/schools";
import {
	Card,
	CardAction,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/stores/useAuthStore";

type DashboardStats = {
	totalClasses: number;
	totalSections: number;
	totalStudents: number;
	totalImports: number;
	runningImports: number;
};

export default function Home() {
	const user = useAuthStore((s) => s.user);
	const [loading, setLoading] = useState(true);
	const [stats, setStats] = useState<DashboardStats>({
		totalClasses: 0,
		totalSections: 0,
		totalStudents: 0,
		totalImports: 0,
		runningImports: 0,
	});

	useEffect(() => {
		let cancelled = false;

		const loadStats = async () => {
			setLoading(true);
			try {
				const classesRes = await listClasses();
				const totalClasses = classesRes.data.length;
				const totalSections = classesRes.data.reduce(
					(sum, cls) => sum + (cls.sectionsCount ?? 0),
					0,
				);
				const totalStudents = classesRes.data.reduce(
					(sum, cls) => sum + (cls.studentsCount ?? 0),
					0,
				);

				let importJobs: Awaited<ReturnType<typeof listImportJobs>>["data"] = [];
				if (user?.role === "admin") {
					const schoolsRes = await listSchools();
					const jobsBySchool = await Promise.all(
						schoolsRes.data.map((school) =>
							listImportJobs({ schoolId: school.id })
								.then((res) => res.data)
								.catch(() => []),
						),
					);
					importJobs = jobsBySchool.flat();
				} else {
					const importsRes = await listImportJobs();
					importJobs = importsRes.data;
				}

				const totalImports = importJobs.length;
				const runningImports = importJobs.filter(
					(job) => job.status === "pending" || job.status === "processing",
				).length;

				if (!cancelled) {
					setStats({
						totalClasses,
						totalSections,
						totalStudents,
						totalImports,
						runningImports,
					});
				}
			} finally {
				if (!cancelled) {
					setLoading(false);
				}
			}
		};

		void loadStats();
		return () => {
			cancelled = true;
		};
	}, [user?.role]);

	const importsBadgeLabel = useMemo(() => {
		if (loading) return "Loading...";
		if (stats.runningImports === 0) return "No running jobs";
		return `${stats.runningImports} running`;
	}, [loading, stats.runningImports]);

	return (
		<div className="min-h-screen bg-background">
			<div className="mx-auto max-w-6xl px-4 py-10 lg:px-6">
				<div className="flex flex-col gap-2">
					<h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
					<p className="text-sm text-muted-foreground">Quick overview.</p>
				</div>

				<div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
					<Card className="@container/card">
						<CardHeader>
							<CardDescription>Total classes</CardDescription>
							<CardTitle className="text-3xl font-semibold tabular-nums">
								{loading ? "—" : stats.totalClasses.toLocaleString()}
							</CardTitle>
							<CardAction>
								<Badge variant="outline">Live</Badge>
							</CardAction>
						</CardHeader>
					</Card>
					<Card className="@container/card">
						<CardHeader>
							<CardDescription>Total sections</CardDescription>
							<CardTitle className="text-3xl font-semibold tabular-nums">
								{loading ? "—" : stats.totalSections.toLocaleString()}
							</CardTitle>
							<CardAction>
								<Badge variant="outline">Live</Badge>
							</CardAction>
						</CardHeader>
					</Card>
					<Card className="@container/card">
						<CardHeader>
							<CardDescription>Total students</CardDescription>
							<CardTitle className="text-3xl font-semibold tabular-nums">
								{loading ? "—" : stats.totalStudents.toLocaleString()}
							</CardTitle>
							<CardAction>
								<Badge variant="outline">Live</Badge>
							</CardAction>
						</CardHeader>
					</Card>
					<Card className="@container/card">
						<CardHeader>
							<CardDescription>Imports</CardDescription>
							<CardTitle className="text-3xl font-semibold tabular-nums">
								{loading ? "—" : stats.totalImports.toLocaleString()}
							</CardTitle>
							<CardAction>
								<Badge variant="outline">{importsBadgeLabel}</Badge>
							</CardAction>
						</CardHeader>
					</Card>
				</div>
			</div>
		</div>
	);
}
