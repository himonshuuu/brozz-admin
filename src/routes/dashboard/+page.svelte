<script lang="ts">
	import { onMount } from 'svelte';
	import { listAccounts } from '$lib/api/auth.js';
	import { authStore } from '$lib/stores/auth.svelte.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import HomeIcon from '@lucide/svelte/icons/home';
	import UsersIcon from '@lucide/svelte/icons/users';
	import UserIcon from '@lucide/svelte/icons/user';
	import ShoppingCartIcon from '@lucide/svelte/icons/shopping-cart';
	import TrendingUpIcon from '@lucide/svelte/icons/trending-up';
	import type { Component } from 'svelte';

	type RoleCounts = { admins: number; distributors: number; retailers: number; staff: number; users: number };
	type RecentAccount = { id: string; name?: string; email: string; role: string; createdAt?: string };

	const ROLE_LABELS: Record<string, string> = {
		ADMIN: 'Admin', DISTRIBUTER: 'Distributor', RETAILER: 'Retailer',
		STAFF: 'Staff', USER: 'User', SUPER_ADMIN: 'Super Admin',
	};
	const ROLE_COLORS: Record<string, string> = {
		SUPER_ADMIN: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800',
		ADMIN: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800',
		DISTRIBUTER: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
		RETAILER: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
		STAFF: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
		USER: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
	};

	let counts = $state<RoleCounts>({ admins: 0, distributors: 0, retailers: 0, staff: 0, users: 0 });
	let recent = $state<RecentAccount[]>([]);
	let loading = $state(true);

	const totalAccounts = $derived(
		counts.admins + counts.distributors + counts.retailers + counts.staff + counts.users
	);

	onMount(async () => {
		if (authStore.user?.role !== 'SUPER_ADMIN') { loading = false; return; }

		try {
			const [adminsRes, distributorsRes, retailersRes, staffRes, usersRes, allRes] =
				await Promise.allSettled([
					listAccounts({ role: 'ADMIN', limit: 1 }),
					listAccounts({ role: 'DISTRIBUTER', limit: 1 }),
					listAccounts({ role: 'RETAILER', limit: 1 }),
					listAccounts({ role: 'STAFF', limit: 1 }),
					listAccounts({ role: 'USER', limit: 1 }),
					listAccounts({ limit: 5 }),
				]);

			counts = {
				admins: adminsRes.status === 'fulfilled' ? adminsRes.value.meta.total : 0,
				distributors: distributorsRes.status === 'fulfilled' ? distributorsRes.value.meta.total : 0,
				retailers: retailersRes.status === 'fulfilled' ? retailersRes.value.meta.total : 0,
				staff: staffRes.status === 'fulfilled' ? staffRes.value.meta.total : 0,
				users: usersRes.status === 'fulfilled' ? usersRes.value.meta.total : 0,
			};
			if (allRes.status === 'fulfilled') recent = allRes.value.data;
		} finally {
			loading = false;
		}
	});
</script>

{#snippet statCard(title: string, value: number, description: string, Icon: Component, href: string)}
	<a href={href}>
		<Card.Root class="hover:bg-muted/40 transition-colors cursor-pointer">
			<Card.Header class="flex flex-row items-center justify-between pb-2">
				<Card.Description class="text-sm font-medium">{title}</Card.Description>
				<div class="text-muted-foreground"><Icon class="size-5" /></div>
			</Card.Header>
			<Card.Content>
				<Card.Title class="text-3xl font-bold tabular-nums">
					{loading ? '—' : value.toLocaleString()}
				</Card.Title>
				<p class="text-xs text-muted-foreground mt-1">{description}</p>
			</Card.Content>
		</Card.Root>
	</a>
{/snippet}

<div class="w-full px-4 py-10 lg:px-6">
	<div class="mb-8">
		<h1 class="text-2xl font-semibold tracking-tight">
			Welcome back, {authStore.user?.name ?? authStore.user?.email ?? 'Super Admin'}
		</h1>
		<p class="text-sm text-muted-foreground mt-1">Here's an overview of your Brozz platform.</p>
	</div>

	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 mb-8">
		{@render statCard('Admins', counts.admins, 'Admin accounts', UserIcon, '/dashboard/accounts/admins')}
		{@render statCard('Distributors', counts.distributors, 'Distributor accounts', UsersIcon, '/dashboard/accounts/distributors')}
		{@render statCard('Retailers', counts.retailers, 'Retailer accounts', ShoppingCartIcon, '/dashboard/accounts/retailers')}
		{@render statCard('Staff', counts.staff, 'Staff accounts', UsersIcon, '/dashboard/accounts/staff')}
		{@render statCard('Users', counts.users, 'End user accounts', UserIcon, '/dashboard/accounts/users')}
	</div>

	<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
		<Card.Root>
			<Card.Header>
				<div class="flex items-center justify-between">
					<Card.Title class="text-base font-semibold">Total Accounts</Card.Title>
					<TrendingUpIcon class="size-5 text-muted-foreground" />
				</div>
			</Card.Header>
			<Card.Content class="flex flex-col gap-3">
				<p class="text-4xl font-bold tabular-nums">{loading ? '—' : totalAccounts.toLocaleString()}</p>
				<div class="flex flex-col gap-2 text-sm">
					{#each [
						{ label: 'Admins', count: counts.admins, href: '/dashboard/accounts/admins' },
						{ label: 'Distributors', count: counts.distributors, href: '/dashboard/accounts/distributors' },
						{ label: 'Retailers', count: counts.retailers, href: '/dashboard/accounts/retailers' },
						{ label: 'Staff', count: counts.staff, href: '/dashboard/accounts/staff' },
						{ label: 'Users', count: counts.users, href: '/dashboard/accounts/users' },
					] as row (row.label)}
						<div class="flex items-center justify-between">
							<a href={row.href} class="text-muted-foreground hover:text-foreground transition-colors">{row.label}</a>
							<span class="font-medium tabular-nums">{loading ? '—' : row.count.toLocaleString()}</span>
						</div>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>

		<Card.Root class="lg:col-span-2">
			<Card.Header>
				<div class="flex items-center justify-between">
					<Card.Title class="text-base font-semibold">Recently Added Accounts</Card.Title>
					<Button variant="ghost" size="sm" href="/dashboard/accounts/all">View all</Button>
				</div>
			</Card.Header>
			<Card.Content class="p-0">
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Name</Table.Head>
							<Table.Head>Email</Table.Head>
							<Table.Head>Role</Table.Head>
							<Table.Head>Joined</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#if loading}
							<Table.Row>
								<Table.Cell colspan={4} class="text-center text-muted-foreground py-8">Loading...</Table.Cell>
							</Table.Row>
						{:else if recent.length === 0}
							<Table.Row>
								<Table.Cell colspan={4} class="text-center text-muted-foreground py-8">No accounts yet.</Table.Cell>
							</Table.Row>
						{:else}
							{#each recent as acc (acc.id)}
								<Table.Row>
									<Table.Cell class="font-medium">{acc.name ?? '—'}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{acc.email}</Table.Cell>
									<Table.Cell>
										<Badge class="border text-xs font-medium {ROLE_COLORS[acc.role] ?? ROLE_COLORS.USER}">
											{ROLE_LABELS[acc.role] ?? acc.role}
										</Badge>
									</Table.Cell>
									<Table.Cell class="text-muted-foreground text-sm">
										{acc.createdAt ? new Date(acc.createdAt).toLocaleDateString() : '—'}
									</Table.Cell>
								</Table.Row>
							{/each}
						{/if}
					</Table.Body>
				</Table.Root>
			</Card.Content>
		</Card.Root>
	</div>
</div>
