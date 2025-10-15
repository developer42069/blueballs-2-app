<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabase';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let status = 'Processing authentication...';
	let error = '';

	onMount(async () => {
		try {
			// Get the code from URL
			const code = $page.url.searchParams.get('code');

			if (code) {
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

					// If no profile exists, create one
					if (!existingProfile) {
						const countryCode = $page.url.searchParams.get('country_code') || 'US';
						const region = $page.url.searchParams.get('region') || 'north_america';

						// Extract username from email or user metadata
						const username = data.user.user_metadata.username ||
							data.user.user_metadata.full_name ||
							data.user.email?.split('@')[0] ||
							`user${Math.random().toString(36).substring(7)}`;

						const { error: profileError } = await supabase.from('profiles').insert({
							id: data.user.id,
							username,
							email: data.user.email || '',
							country_code: countryCode,
							region: region as any,
							membership_tier: 'free',
							lives: 100,
							max_lives: 100,
							lives_per_hour: 4,
							last_life_regen: new Date().toISOString(),
							lifetime_level: 1,
							lifetime_points: 0,
							last_30_days_points: 0,
							current_rank: 'blue',
							high_score_easy: 0,
							high_score_medium: 0,
							high_score_hard: 0,
							profile_picture_url: data.user.user_metadata.avatar_url || null,
							profile_public: true,
							allow_friend_requests: true,
							is_admin: false
						});

						if (profileError) {
							console.error('Profile creation error:', profileError);
						}
					}

					status = 'Success! Redirecting...';
					setTimeout(() => {
						goto('/dashboard');
					}, 500);
				}
			} else {
				throw new Error('No authentication code provided');
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
