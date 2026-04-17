<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { authStore } from '$lib/stores/auth.svelte.js';
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';

	let { children } = $props();

	onMount(async () => {
		if (!authStore.hydrated) authStore.hydrate();

		if (!authStore.isAuthenticated) {
			try {
				const intentionalLogout = window.sessionStorage.getItem('intentionalLogout') === '1';
				if (intentionalLogout) {
					window.sessionStorage.removeItem('intentionalLogout');
				}
				const pathname = $page.url.pathname;
				if (!intentionalLogout && pathname && pathname !== '/login') {
					window.sessionStorage.setItem('postLoginRedirect', pathname);
				}
			} catch { /* ignore */ }
			goto('/login');
			return;
		}

		if (!authStore.user) {
			await authStore.loadUser();
		}
	});
</script>

{#if authStore.isAuthenticated && authStore.user}
	<Sidebar.Provider
		style="--sidebar-width: calc(var(--spacing) * 38); --header-height: calc(var(--spacing) * 12);"
	>
		<AppSidebar variant="inset" />
		<Sidebar.Inset>
			<div class="flex flex-1 flex-col">
				<div class="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
					{@render children()}
				</div>
			</div>
		</Sidebar.Inset>
	</Sidebar.Provider>
{/if}
