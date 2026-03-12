"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { listImportJobs, type ImportJobDto } from "@/lib/api/import";

const CACHE_KEY = "importJobs.cache.v1";

function safeParseJobs(raw: string | null): ImportJobDto[] | null {
	if (!raw) return null;
	try {
		const parsed = JSON.parse(raw) as unknown;
		if (!Array.isArray(parsed)) return null;
		return parsed as ImportJobDto[];
	} catch {
		return null;
	}
}

function statusLabel(job: ImportJobDto) {
	if (job.status === "pending") return "Pending";
	if (job.status === "processing") return "Processing";
	if (job.status === "completed") return "Completed";
	return "Failed";
}

function statusDotClass(status: ImportJobDto["status"]) {
	switch (status) {
		case "completed":
			return "bg-emerald-500";
		case "failed":
			return "bg-destructive";
		case "processing":
			return "bg-amber-500";
		default:
			return "bg-muted-foreground";
	}
}

export function NavImportJobs({ limit = 3 }: { limit?: number }) {
	const [jobs, setJobs] = useState<ImportJobDto[] | null>(null);
	const streamsRef = useRef<Record<string, EventSource>>({});

	useEffect(() => {
		const cached = safeParseJobs(window.localStorage.getItem(CACHE_KEY));
		if (cached?.length) setJobs(cached);

		let cancelled = false;
		listImportJobs()
			.then((res) => {
				if (cancelled) return;
				const next = res.data;
				setJobs(next);
				try {
					window.localStorage.setItem(CACHE_KEY, JSON.stringify(next));
				} catch {
					// Ignore cache errors.
				}
			})
			.catch(() => {
				// Keep cached jobs if fetch fails (e.g. offline).
			});

		return () => {
			cancelled = true;
		};
	}, []);

	// Open SSE streams for in-progress jobs so status is live.
	useEffect(() => {
		if (!jobs?.length) return;

		const token =
			typeof window === "undefined" ? null : window.localStorage.getItem("token");
		if (!token) return;

		const baseUrl =
			process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
			process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") ||
			"";

		const streams = streamsRef.current;

		for (const job of jobs) {
			if (job.status === "completed" || job.status === "failed") continue;
			if (streams[job.id]) continue;

			const url = `${baseUrl}/import/jobs/${encodeURIComponent(
				job.id,
			)}/stream?token=${encodeURIComponent(token)}`;

			const es = new EventSource(url);
			streams[job.id] = es;

			es.addEventListener("job", (evt) => {
				const data = JSON.parse((evt as MessageEvent).data) as Partial<ImportJobDto>;
				setJobs((prev) => {
					if (!prev) return prev;
					const next = prev.map((j) => (j.id === job.id ? { ...j, ...data } : j));
					try {
						window.localStorage.setItem(CACHE_KEY, JSON.stringify(next));
					} catch {
						// Ignore cache errors.
					}
					return next;
				});
			});

			const closeStream = () => {
				es.close();
				delete streamsRef.current[job.id];
			};

			es.addEventListener("done", (evt) => {
				const data = JSON.parse((evt as MessageEvent).data) as Partial<ImportJobDto>;
				setJobs((prev) => {
					if (!prev) return prev;
					const next = prev.map((j) => (j.id === job.id ? { ...j, ...data } : j));
					try {
						window.localStorage.setItem(CACHE_KEY, JSON.stringify(next));
					} catch {
						// Ignore cache errors.
					}
					return next;
				});
				closeStream();
			});

			es.addEventListener("error", () => {
				closeStream();
			});
		}
	}, [jobs]);

	// Cleanup on unmount: close any open streams.
	useEffect(
		() => () => {
			for (const id of Object.keys(streamsRef.current)) {
				streamsRef.current[id].close();
				delete streamsRef.current[id];
			}
		},
		[],
	);

	const items = useMemo(() => {
		const list = jobs ?? [];
		return [...list]
			.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
			.slice(0, limit);
	}, [jobs, limit]);

	if (items.length === 0) return null;

	return (
		<SidebarGroup className="px-0 py-0">
			<SidebarGroupLabel className="px-2">Import jobs</SidebarGroupLabel>
			<SidebarGroupContent>
				<SidebarMenu>
					{items.map((job) => (
						<SidebarMenuItem key={job.id}>
							<SidebarMenuButton
								disabled
								tooltip={`Import ${statusLabel(job)} • ${job.processedRows}/${job.totalRows}`}
								className="opacity-100"
							>
								<span
									className={`inline-block size-2 rounded-full ${statusDotClass(
										job.status,
									)}`}
								/>
								<span className="truncate">
									{statusLabel(job)}{" "}
									<span className="text-muted-foreground">
										{job.processedRows}/{job.totalRows}
									</span>
								</span>
							</SidebarMenuButton>
						</SidebarMenuItem>
					))}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	);
}

