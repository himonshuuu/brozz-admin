<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Field, FieldGroup, FieldLabel, FieldDescription } from '$lib/components/ui/field/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { cn } from '$lib/utils.js';
	import { login } from '$lib/api/auth.js';
	import { authStore } from '$lib/stores/auth.svelte.js';
	import { toast } from 'svelte-sonner';
	import type { HTMLAttributes } from 'svelte/elements';

	let { class: className, ...restProps }: HTMLAttributes<HTMLDivElement> = $props();

	let loading = $state(false);

	async function onSubmit(e: SubmitEvent) {
		e.preventDefault();
		const form = new FormData(e.currentTarget as HTMLFormElement);
		const email = String(form.get('email') || '');
		const password = String(form.get('password') || '');

		loading = true;
		try {
			const json = await login(email, password);
			const token = json.data?.token;
			if (!token) throw new Error('No token returned');
			authStore.setToken(token);
			void authStore.loadUser();
			toast.success('Logged in');
			const redirect =
				(typeof window !== 'undefined' && window.sessionStorage.getItem('postLoginRedirect')) || '/dashboard';
			if (typeof window !== 'undefined') window.sessionStorage.removeItem('postLoginRedirect');
			goto(redirect);
		} catch (err: unknown) {
			toast.error('Login failed', {
				description: err instanceof Error ? err.message : 'Unknown error',
			});
		} finally {
			loading = false;
		}
	}
</script>

<div class={cn('flex flex-col gap-6', className)} {...restProps}>
	<Card.Root>
		<Card.Header class="text-center">
			<Card.Title class="text-xl">Welcome back</Card.Title>
			<Card.Description>Login with your Brozz Admin account</Card.Description>
		</Card.Header>
		<Card.Content>
			<form onsubmit={onSubmit}>
				<FieldGroup>
					<Field>
						<FieldLabel for="email">Email</FieldLabel>
						<Input id="email" name="email" type="email" placeholder="m@example.com" required disabled={loading} />
					</Field>
					<Field>
						<div class="flex items-center">
							<FieldLabel for="password">Password</FieldLabel>
							<a href="/forgot-password" class="ms-auto text-sm underline-offset-4 hover:underline">
								Forgot your password?
							</a>
						</div>
						<Input id="password" name="password" type="password" required disabled={loading} />
					</Field>
					<Field>
						<Button type="submit" disabled={loading} size="lg" class="w-full">
							{loading ? 'Logging in...' : 'Login'}
						</Button>
						<FieldDescription class="text-center">
							Don't have an account? <a href="/signup">Sign up</a>
						</FieldDescription>
					</Field>
				</FieldGroup>
			</form>
		</Card.Content>
	</Card.Root>
</div>
