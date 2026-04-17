<script lang="ts">
	import './layout.css';
	import { Toaster } from '$lib/components/ui/sonner/index.js';
	import { onMount } from 'svelte';
	import { authStore } from '$lib/stores/auth.svelte.js';

	let { children } = $props();

	onMount(() => {
		authStore.hydrate();
	});
</script>

{@render children()}
<Toaster richColors />
