<script lang="ts">
	import NavMain from './nav-main.svelte';
	import NavUser from './nav-user.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { authStore } from '$lib/stores/auth.svelte.js';
	import HomeIcon from '@lucide/svelte/icons/home';
	import UsersIcon from '@lucide/svelte/icons/users';
	import UserIcon from '@lucide/svelte/icons/user';
	import type { ComponentProps } from 'svelte';

	let {
		ref = $bindable(null),
		collapsible = 'icon',
		...restProps
	}: ComponentProps<typeof Sidebar.Root> = $props();

	const allNavItems = [
		{ title: 'Dashboard', url: '/dashboard', icon: HomeIcon },
		{ title: 'All Accounts', url: '/dashboard/accounts/all', icon: UsersIcon, superAdminOnly: true },
		{ title: 'Admins', url: '/dashboard/accounts/admins', icon: UserIcon, superAdminOnly: true },
		{ title: 'Distributors', url: '/dashboard/accounts/distributors', icon: UserIcon, superAdminOnly: true },
		{ title: 'Retailers', url: '/dashboard/accounts/retailers', icon: UserIcon, superAdminOnly: true },
		{ title: 'Staff', url: '/dashboard/accounts/staff', icon: UserIcon, superAdminOnly: true },
		{ title: 'Users', url: '/dashboard/accounts/users', icon: UserIcon, superAdminOnly: true },
	];

	const navItems = $derived(
		allNavItems.filter((item) => {
			if ('superAdminOnly' in item && item.superAdminOnly) {
				return authStore.user?.role === 'SUPER_ADMIN';
			}
			return true;
		})
	);
</script>

{#if authStore.user}
	<Sidebar.Root bind:ref {collapsible} {...restProps}>
		<Sidebar.Header>
			<Sidebar.Menu>
				<Sidebar.MenuItem>
					<Sidebar.MenuButton class="data-[slot=sidebar-menu-button]:p-1.5! flex items-center gap-2">
						<span class="relative flex items-center gap-2">
                  <span class="block group-hover:hidden">
                    <img src={"/logo.png"} height={16} width={16} alt="logo"/>
                  </span>
                  <span class="hidden group-hover:block">
                    <Sidebar.SidebarTrigger class="ml-0 p-0 size-5!" />
                  </span>
                  <span class="text-base font-semibold">Brozz</span>
                </span>
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
			</Sidebar.Menu>
		</Sidebar.Header>
		<Sidebar.Content>
			<NavMain items={navItems} />
		</Sidebar.Content>
		<Sidebar.Footer>
			<Sidebar.Separator />
			<NavUser user={authStore.user} />
		</Sidebar.Footer>
	</Sidebar.Root>
{/if}
