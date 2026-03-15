"use client";

import { NavMain } from "@/components/nav-main";
import { NavImportJobs } from "@/components/nav-import-jobs";
import { NavUser } from "@/components/nav-user";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarSeparator,
} from "@/components/ui/sidebar";
import {
	BookOpen01Icon,
	HomeIcon,
	GridViewIcon,
	PrinterIcon,
	StudentIcon,
	ContactBookIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type * as React from "react";
import { SidebarTrigger } from "./ui/sidebar";
import { useAuthStore } from "@/stores/useAuthStore";

const navMain = [
	{
		title: "Dashboard",
		url: "/",
		icon: <HugeiconsIcon icon={HomeIcon} strokeWidth={2} />,
	},
	{
		title: "Schools",
		url: "/schools",
		icon: <HugeiconsIcon icon={HomeIcon} strokeWidth={2} />,
		adminOnly: true,
	},
	{
		title: "Classes",
		url: "/classes",
		icon: <HugeiconsIcon icon={BookOpen01Icon} strokeWidth={2} />,
	},
	{
		title: "Sections",
		url: "/sections",
		icon: <HugeiconsIcon icon={GridViewIcon} strokeWidth={2} />,
	},
	{
		title: "Students",
		url: "/students",
		icon: <HugeiconsIcon icon={StudentIcon} strokeWidth={2} />,
	},
	{
		title: "ID Cards",
		url: "/id-cards",
		icon: <HugeiconsIcon icon={ContactBookIcon} strokeWidth={2} />,
		adminOnly: true,
	},
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const user = useAuthStore((s) => s.user);
	if (!user) return null;

	const filteredNav = navMain.filter(
		(item) => !item.adminOnly || user.role === "admin",
	);

	return (
		<Sidebar collapsible="icon" {...props}>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<div className="relative">
							<SidebarMenuButton
								asChild
								className="data-[slot=sidebar-menu-button]:p-1.5! flex items-center gap-2 group"
							>
								<span className="relative flex items-center gap-2">
									<span className="block group-hover:hidden">
										<HugeiconsIcon
											icon={PrinterIcon}
											strokeWidth={2}
											className="size-5!"
										/>
									</span>
									<span className="hidden group-hover:block">
										<SidebarTrigger className="ml-0 p-0 size-5!" />
									</span>
									<span className="text-base font-semibold">Printlooom</span>
								</span>
							</SidebarMenuButton>
						</div>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<NavMain items={filteredNav} />
			</SidebarContent>
			<SidebarFooter>
				<NavImportJobs />
				<SidebarSeparator />
				<NavUser user={user} />
			</SidebarFooter>
		</Sidebar>
	);
}
