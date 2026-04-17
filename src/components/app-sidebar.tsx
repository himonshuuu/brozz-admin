"use client";

import {
  HomeIcon,
  User02Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type * as React from "react";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { isAdminRole } from "@/lib/api/auth";
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
import { useAuthStore } from "@/stores/useAuthStore";
import { SidebarTrigger } from "./ui/sidebar";
import Image from "next/image";

const navMain = [
  {
    title: "Dashboard",
    url: "/",
    icon: <HugeiconsIcon icon={HomeIcon} strokeWidth={2} />,
  },
  {
    title: "All Accounts",
    url: "/accounts/all",
    icon: <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} />,
    superAdminOnly: true,
  },
  {
    title: "Admins",
    url: "/accounts/admins",
    icon: <HugeiconsIcon icon={User02Icon} strokeWidth={2} />,
    superAdminOnly: true,
  },
  {
    title: "Distributors",
    url: "/accounts/distributors",
    icon: <HugeiconsIcon icon={User02Icon} strokeWidth={2} />,
    superAdminOnly: true,
  },
  {
    title: "Retailers",
    url: "/accounts/retailers",
    icon: <HugeiconsIcon icon={User02Icon} strokeWidth={2} />,
    superAdminOnly: true,
  },
  {
    title: "Staff",
    url: "/accounts/staff",
    icon: <HugeiconsIcon icon={User02Icon} strokeWidth={2} />,
    superAdminOnly: true,
  },
  {
    title: "Users",
    url: "/accounts/users",
    icon: <HugeiconsIcon icon={User02Icon} strokeWidth={2} />,
    superAdminOnly: true,
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const user = useAuthStore((s) => s.user);
  if (!user) return null;

  const isSuperAdmin = user.role === "SUPER_ADMIN";

  const filteredNav = navMain.filter((item) => {
    if (item.superAdminOnly) return isSuperAdmin;
    return true;
  });

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
                    <Image src={"/logo.png"} height={16} width={16} alt="logo"/>
                  </span>
                  <span className="hidden group-hover:block">
                    <SidebarTrigger className="ml-0 p-0 size-5!" />
                  </span>
                  <span className="text-base font-semibold">Brozz</span>
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
        <SidebarSeparator />
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
