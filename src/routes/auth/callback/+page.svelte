<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabase';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let status = 'Processing authentication...';
	let error = '';

	onMount(async () => {
		try {
			// First check if user is already authenticated
			const { data: { user: existingUser } } = await supabase.auth.getUser();

			if (existingUser) {
				// User is already authenticated, just check profile and redirect
				const { data: existingProfile } = await supabase
					.from('profiles')
					.select('id')
					.eq('id', existingUser.id)
					.single();

				if (!existingProfile) {
					// No profile, go to onboarding
					sessionStorage.setItem('onboarding_user', JSON.stringify({
						id: existingUser.id,
						email: existingUser.email,
						avatar_url: existingUser.user_metadata.avatar_url,
						suggested_username: existingUser.user_metadata.username ||
							existingUser.user_metadata.full_name ||
							existingUser.email?.split('@')[0] ||
							`user${Math.random().toString(36).substring(7)}`
					}));
					goto('/auth/onboarding');
					return;
				}

				// Profile exists - show welcome screen
				goto('/auth/welcome');
				return;
			}

			// Get the code from URL
			const code = $page.url.searchParams.get('code');

			if (!code) {
				// No code and no existing session - redirect to login
				throw new Error('No authentication code provided');
			}

			// Exchange the code for a session
			const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

			if (exchangeError) throw exchangeError;

			if (data.user) {
				// Check if profile exists
				const { data: existingProfile } = await supabase
					.from('profiles')
					.select('id')
					.eq('id', data.user.id)
					.single();

				// If no profile exists, redirect to onboarding
				if (!existingProfile) {
					// Store user data temporarily for onboarding
					sessionStorage.setItem('onboarding_user', JSON.stringify({
						id: data.user.id,
						email: data.user.email,
						avatar_url: data.user.user_metadata.avatar_url,
						suggested_username: data.user.user_metadata.username ||
							data.user.user_metadata.full_name ||
							data.user.email?.split('@')[0] ||
							`user${Math.random().toString(36).substring(7)}`
					}));
					goto('/auth/onboarding');
					return;
				}

				// Profile exists - show welcome screen then redirect to homepage
				goto('/auth/welcome');
			}
		} catch (e: any) {
			console.error('Auth callback error:', e);
			error = e.message || 'Authentication failed';
			status = 'Authentication failed';

			setTimeout(() => {
				goto('/auth/login');
			}, 3000);
		}
	});
</script>

<svelte:head>
	<title>Authenticating - Blue Balls</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center p-4">
	<div class="card max-w-md w-full text-center">
		<div class="mb-4">
			{#if error}
				<div class="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
					<svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</div>
			{:else}
				<div class="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
					<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
				</div>
			{/if}
		</div>

		<h1 class="text-2xl font-bold mb-2">{status}</h1>

		{#if error}
			<p class="text-red-500 mb-4">{error}</p>
			<p class="text-sm dark:text-gray-300">Redirecting to login page...</p>
		{:else}
			<p class="text-sm dark:text-gray-300">Please wait while we complete your authentication...</p>
		{/if}
	</div>
</div>
