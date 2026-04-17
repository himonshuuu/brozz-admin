<script lang="ts">
	import LoginForm from '$lib/components/login-form.svelte';
</script>

<div class="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
	<div class="flex w-full max-w-sm flex-col gap-6">
		<a href="/" class="flex items-center gap-2 self-center font-medium">
			<div class="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
				<span class="text-xs font-bold">B</span>
			</div>
			Brozz Admin
		</a>
		<LoginForm />
	</div>
</div>
