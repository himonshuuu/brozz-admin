<script lang="ts">
	import { onMount } from 'svelte';
	import {
		listAccounts,
		createAdminAccount,
		createDistributerAccount,
		createRetailerAccount,
		createStaffAccount,
		deleteAccount,
		updateAccount,
		type UserRole,
	} from '$lib/api/auth.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Label } from '$lib/components/ui/label/index.js';

	type Account = {
		id: string;
		email: string;
		name?: string;
		mobileNumber?: string | null;
		role: UserRole;
		isVerified: boolean;
		isActive: boolean;
		isDeleted: boolean;
		createdAt?: string;
	};

	type Meta = { page: number; limit: number; total: number; totalPages: number };

	const ROLE_LABELS: Record<string, string> = {
		ADMIN: 'Admin',
		DISTRIBUTER: 'Distributor',
		RETAILER: 'Retailer',
		STAFF: 'Staff',
		USER: 'User',
		SUPER_ADMIN: 'Super Admin',
	};

	const ROLE_COLORS: Record<string, string> = {
		SUPER_ADMIN: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800',
		ADMIN: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800',
		DISTRIBUTER: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
		RETAILER: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
		STAFF: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
		USER: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
	};

	type CreateFn = (body: { email: string; name: string; mobileNumber: string }) => Promise<unknown>;

	const CREATE_FNS: Partial<Record<UserRole, CreateFn>> = {
		ADMIN: createAdminAccount,
		DISTRIBUTER: createDistributerAccount,
		RETAILER: createRetailerAccount,
		STAFF: createStaffAccount,
	};

	let { role, title, canCreate = false }: { role?: UserRole; title: string; canCreate?: boolean } = $props();

	let accounts = $state<Account[]>([]);
	let meta = $state<Meta>({ page: 1, limit: 20, total: 0, totalPages: 1 });
	let search = $state('');
	let currentPage = $state(1);
	let loading = $state(true);
	let error = $state<string | null>(null);

	// Create
	let createOpen = $state(false);
	let createForm = $state({ email: '', name: '', mobileNumber: '' });
	let creating = $state(false);
	let createError = $state<string | null>(null);
	let createdPassword = $state<string | null>(null);

	// Edit
	let editTarget = $state<Account | null>(null);
	let editForm = $state({ name: '', mobileNumber: '', isActive: true });
	let saving = $state(false);
	let editError = $state<string | null>(null);

	// Delete
	let deleteTarget = $state<Account | null>(null);
	let deleting = $state(false);
	let deleteError = $state<string | null>(null);

	async function load() {
		loading = true;
		error = null;
		try {
			const res = await listAccounts({ role, search: search || undefined, page: currentPage, limit: 20 });
			accounts = res.data;
			meta = res.meta;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load accounts';
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		void load();
	});

	$effect(() => {
		search; // track
		currentPage = 1;
	});

	async function handleCreate(e: SubmitEvent) {
		e.preventDefault();
		if (!role) return;
		const createFn = CREATE_FNS[role];
		if (!createFn) return;
		creating = true;
		createError = null;
		try {
			const res = await createFn(createForm) as { success: true; data: { password: string } };
			createdPassword = res.data.password;
			createForm = { email: '', name: '', mobileNumber: '' };
			void load();
		} catch (e) {
			createError = e instanceof Error ? e.message : 'Failed to create account';
		} finally {
			creating = false;
		}
	}

	function handleCreateClose(val: boolean) {
		createOpen = val;
		if (!val) {
			createdPassword = null;
			createError = null;
			createForm = { email: '', name: '', mobileNumber: '' };
		}
	}

	function openEdit(acc: Account) {
		editTarget = acc;
		editForm = { name: acc.name ?? '', mobileNumber: acc.mobileNumber ?? '', isActive: acc.isActive };
		editError = null;
	}

	async function handleSave(e: SubmitEvent) {
		e.preventDefault();
		if (!editTarget) return;
		saving = true;
		editError = null;
		try {
			await updateAccount(editTarget.id, {
				name: editForm.name || undefined,
				mobileNumber: editForm.mobileNumber || undefined,
				isActive: editForm.isActive,
			});
			editTarget = null;
			void load();
		} catch (e) {
			editError = e instanceof Error ? e.message : 'Failed to update account';
		} finally {
			saving = false;
		}
	}

	async function handleDelete() {
		if (!deleteTarget) return;
		deleting = true;
		deleteError = null;
		try {
			await deleteAccount(deleteTarget.id);
			deleteTarget = null;
			void load();
		} catch (e) {
			deleteError = e instanceof Error ? e.message : 'Failed to delete account';
		} finally {
			deleting = false;
		}
	}
</script>

<div class="w-full px-4 py-10 lg:px-6">
	<!-- Header -->
	<div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-6">
		<div>
			<h1 class="text-2xl font-semibold tracking-tight">{title}</h1>
			<p class="text-sm text-muted-foreground mt-1">
				{meta.total} account{meta.total !== 1 ? 's' : ''} total
			</p>
		</div>
		<div class="flex gap-2">
			<Input
				placeholder="Search by name or email..."
				value={search}
				oninput={(e) => (search = (e.currentTarget as HTMLInputElement).value)}
				class="w-64"
			/>
			{#if canCreate && role && CREATE_FNS[role]}
				<Dialog.Root open={createOpen} onOpenChange={handleCreateClose}>
					<Dialog.Trigger>
						{#snippet child({ props })}
							<Button {...props}>Create {ROLE_LABELS[role!]}</Button>
						{/snippet}
					</Dialog.Trigger>
					<Dialog.Content>
						<Dialog.Header>
							<Dialog.Title>Create {ROLE_LABELS[role!]} Account</Dialog.Title>
						</Dialog.Header>
						{#if createdPassword}
							<div class="flex flex-col gap-4">
								<p class="text-sm text-muted-foreground">Account created. Share these credentials securely.</p>
								<div class="rounded-md bg-muted p-3 text-sm font-mono">
									<div>Email: {createForm.email || '—'}</div>
									<div>Password: <span class="font-bold">{createdPassword}</span></div>
								</div>
								<Button onclick={() => handleCreateClose(false)}>Done</Button>
							</div>
						{:else}
							<form onsubmit={handleCreate} class="flex flex-col gap-4">
								<div class="flex flex-col gap-1.5">
									<Label for="c-name">Name</Label>
									<Input id="c-name" required value={createForm.name}
										oninput={(e) => (createForm.name = (e.currentTarget as HTMLInputElement).value)} />
								</div>
								<div class="flex flex-col gap-1.5">
									<Label for="c-email">Email</Label>
									<Input id="c-email" type="email" required value={createForm.email}
										oninput={(e) => (createForm.email = (e.currentTarget as HTMLInputElement).value)} />
								</div>
								<div class="flex flex-col gap-1.5">
									<Label for="c-mobile">Mobile Number</Label>
									<Input id="c-mobile" required value={createForm.mobileNumber}
										oninput={(e) => (createForm.mobileNumber = (e.currentTarget as HTMLInputElement).value)} />
								</div>
								{#if createError}
									<p class="text-sm text-destructive">{createError}</p>
								{/if}
								<Button type="submit" disabled={creating}>
									{creating ? 'Creating...' : 'Create Account'}
								</Button>
							</form>
						{/if}
					</Dialog.Content>
				</Dialog.Root>
			{/if}
		</div>
	</div>

	{#if error}
		<p class="text-sm text-destructive mb-4">{error}</p>
	{/if}

	<!-- Table -->
	<div class="rounded-md border">
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head>Name</Table.Head>
					<Table.Head>Email</Table.Head>
					<Table.Head>Mobile</Table.Head>
					<Table.Head>Role</Table.Head>
					<Table.Head>Status</Table.Head>
					<Table.Head>Created</Table.Head>
					<Table.Head class="text-right">Actions</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#if loading}
					<Table.Row>
						<Table.Cell colspan={7} class="text-center text-muted-foreground py-10">Loading...</Table.Cell>
					</Table.Row>
				{:else if accounts.length === 0}
					<Table.Row>
						<Table.Cell colspan={7} class="text-center text-muted-foreground py-10">No accounts found.</Table.Cell>
					</Table.Row>
				{:else}
					{#each accounts as acc (acc.id)}
						<Table.Row>
							<Table.Cell class="font-medium">{acc.name ?? '—'}</Table.Cell>
							<Table.Cell>{acc.email}</Table.Cell>
							<Table.Cell>{acc.mobileNumber ?? '—'}</Table.Cell>
							<Table.Cell>
								<Badge class="border text-xs font-medium {ROLE_COLORS[acc.role] ?? ROLE_COLORS.USER}">
									{ROLE_LABELS[acc.role] ?? acc.role}
								</Badge>
							</Table.Cell>
							<Table.Cell>
								{#if acc.isDeleted}
									<Badge variant="destructive">Deleted</Badge>
								{:else if acc.isActive}
									<Badge>Active</Badge>
								{:else}
									<Badge variant="secondary">Inactive</Badge>
								{/if}
							</Table.Cell>
							<Table.Cell class="text-muted-foreground text-sm">
								{acc.createdAt ? new Date(acc.createdAt).toLocaleDateString() : '—'}
							</Table.Cell>
							<Table.Cell class="text-right">
								<div class="flex items-center justify-end gap-1">
									<Button
										variant="ghost"
										size="icon"
										class="h-8 w-8 text-muted-foreground hover:text-foreground"
										disabled={acc.isDeleted}
										onclick={() => openEdit(acc)}
									>
										<svg xmlns="http://www.w3.org/2000/svg" class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
											<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
											<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
										</svg>
									</Button>
									<Button
										variant="ghost"
										size="icon"
										class="h-8 w-8 text-muted-foreground hover:text-destructive"
										disabled={acc.isDeleted}
										onclick={() => { deleteTarget = acc; deleteError = null; }}
									>
										<svg xmlns="http://www.w3.org/2000/svg" class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
											<polyline points="3 6 5 6 21 6"/>
											<path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
											<path d="M10 11v6M14 11v6"/>
											<path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
										</svg>
									</Button>
								</div>
							</Table.Cell>
						</Table.Row>
					{/each}
				{/if}
			</Table.Body>
		</Table.Root>
	</div>

	<!-- Pagination -->
	{#if meta.totalPages > 1}
		<div class="flex items-center justify-between mt-4">
			<p class="text-sm text-muted-foreground">Page {meta.page} of {meta.totalPages}</p>
			<div class="flex gap-2">
				<Button variant="outline" size="sm" disabled={currentPage <= 1} onclick={() => currentPage--}>Previous</Button>
				<Button variant="outline" size="sm" disabled={currentPage >= meta.totalPages} onclick={() => currentPage++}>Next</Button>
			</div>
		</div>
	{/if}

	<!-- Edit Dialog -->
	<Dialog.Root open={Boolean(editTarget)} onOpenChange={(v) => { if (!v) editTarget = null; }}>
		<Dialog.Content>
			<Dialog.Header>
				<Dialog.Title>Edit Account</Dialog.Title>
			</Dialog.Header>
			<form onsubmit={handleSave} class="flex flex-col gap-4">
				<div class="flex flex-col gap-1.5">
					<Label for="e-name">Name</Label>
					<Input id="e-name" value={editForm.name}
						oninput={(e) => (editForm.name = (e.currentTarget as HTMLInputElement).value)} />
				</div>
				<div class="flex flex-col gap-1.5">
					<Label for="e-mobile">Mobile Number</Label>
					<Input id="e-mobile" value={editForm.mobileNumber}
						oninput={(e) => (editForm.mobileNumber = (e.currentTarget as HTMLInputElement).value)} />
				</div>
				<div class="flex items-center gap-2">
					<input
						id="e-active"
						type="checkbox"
						checked={editForm.isActive}
						onchange={(e) => (editForm.isActive = (e.currentTarget as HTMLInputElement).checked)}
						class="h-4 w-4 rounded border"
					/>
					<Label for="e-active">Active</Label>
				</div>
				{#if editError}
					<p class="text-sm text-destructive">{editError}</p>
				{/if}
				<div class="flex gap-2 justify-end">
					<Button type="button" variant="outline" onclick={() => (editTarget = null)}>Cancel</Button>
					<Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
				</div>
			</form>
		</Dialog.Content>
	</Dialog.Root>

	<!-- Delete Confirm Dialog -->
	<Dialog.Root open={Boolean(deleteTarget)} onOpenChange={(v) => { if (!v) deleteTarget = null; }}>
		<Dialog.Content>
			<Dialog.Header>
				<Dialog.Title>Delete Account</Dialog.Title>
			</Dialog.Header>
			<p class="text-sm text-muted-foreground">
				Are you sure you want to delete
				<span class="font-medium text-foreground">{deleteTarget?.name ?? deleteTarget?.email}</span>?
				This will permanently remove the account.
			</p>
			{#if deleteError}
				<p class="text-sm text-destructive">{deleteError}</p>
			{/if}
			<div class="flex gap-2 justify-end mt-2">
				<Button variant="outline" onclick={() => (deleteTarget = null)}>Cancel</Button>
				<Button variant="destructive" disabled={deleting} onclick={handleDelete}>
					{deleting ? 'Deleting...' : 'Delete'}
				</Button>
			</div>
		</Dialog.Content>
	</Dialog.Root>
</div>
