<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabase';
	import { goto } from '$app/navigation';
	import { user } from '$lib/stores/auth';
	import { Mail, Lock } from 'lucide-svelte';

	let email = '';
	let password = '';
	let loading = false;
	let error = '';
	let countryCode = '';
	let region: 'asia' | 'europe' | 'north_america' | 'south_america' | 'africa' | 'oceania' = 'north_america';

	onMount(async () => {
		// Redirect if already logged in
		if ($user) {
			goto('/dashboard');
			return;
		}

		// Detect country
		try {
			const response = await fetch('https://ipapi.co/json/');
			const data = await response.json();
			countryCode = data.country_code || 'US';

			// Map country to region
			const asiaCountries = ['CN', 'JP', 'KR', 'IN', 'TH', 'VN', 'SG', 'MY', 'ID', 'PH'];
			const europeCountries = ['GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'SE', 'NO', 'DK', 'FI', 'PL', 'RU'];
			const northAmericaCountries = ['US', 'CA', 'MX'];
			const southAmericaCountries = ['BR', 'AR', 'CL', 'CO', 'PE'];
			const africaCountries = ['ZA', 'NG', 'EG', 'KE', 'MA'];
			const oceaniaCountries = ['AU', 'NZ'];

			if (asiaCountries.includes(countryCode)) region = 'asia';
			else if (europeCountries.includes(countryCode)) region = 'europe';
			else if (northAmericaCountries.includes(countryCode)) region = 'north_america';
			else if (southAmericaCountries.includes(countryCode)) region = 'south_america';
			else if (africaCountries.includes(countryCode)) region = 'africa';
			else if (oceaniaCountries.includes(countryCode)) region = 'oceania';
		} catch (e) {
			console.error('Failed to detect country:', e);
		}
	});

	async function handleEmailLogin() {
		loading = true;
		error = '';

		try {
			const { data, error: signInError } = await supabase.auth.signInWithPassword({
				email,
				password
			});

			if (signInError) throw signInError;

			// Show welcome screen then redirect to homepage
			goto('/auth/welcome');
		} catch (e: any) {
			error = e.message || 'Failed to login';
		} finally {
			loading = false;
		}
	}

	async function handleOAuthLogin(provider: 'google' | 'discord') {
		loading = true;
		error = '';

		try {
			const { error: signInError } = await supabase.auth.signInWithOAuth({
				provider,
				options: {
					redirectTo: `${window.location.origin}/auth/callback`,
					queryParams: {
						country_code: countryCode,
						region: region
					}
				}
			});

			if (signInError) throw signInError;
		} catch (e: any) {
			error = e.message || 'Failed to login with OAuth';
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Login - Blue Balls</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center p-4">
	<div class="card max-w-md w-full">
		<h1 class="text-3xl font-bold text-center mb-6">Login to Blue Balls</h1>

		{#if error}
			<div class="bg-red-500/20 border border-red-500 text-red-500 px-4 py-3 rounded-lg mb-4">
				{error}
			</div>
		{/if}

		<div class="space-y-4">
			<button
				on:click={() => handleOAuthLogin('google')}
				disabled={loading}
				class="w-full bg-white hover:bg-gray-100 text-gray-800 font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-50"
			>
				<svg class="w-5 h-5" viewBox="0 0 24 24">
					<path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
					<path fill="#4285F4" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
					<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
					<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
				</svg>
				Continue with Google
			</button>

			<button
				on:click={() => handleOAuthLogin('discord')}
				disabled={loading}
				class="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-50"
			>
				<svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
					<path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
				</svg>
				Continue with Discord
			</button>

			<div class="relative">
				<div class="absolute inset-0 flex items-center">
					<div class="w-full border-t border-gray-300 dark:border-gray-600"></div>
				</div>
				<div class="relative flex justify-center text-sm">
					<span class="px-2 bg-white dark:bg-dark-secondary dark:text-gray-300">Or continue with email</span>
				</div>
			</div>

			<form on:submit|preventDefault={handleEmailLogin} class="space-y-4">
				<div>
					<label for="email" class="block text-sm font-medium mb-2 dark:text-gray-300">
						Email Address
					</label>
					<div class="relative">
						<Mail class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
						<input
							id="email"
							type="email"
							bind:value={email}
							required
							class="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary dark:bg-dark-accent dark:border-gray-600 dark:text-white"
							placeholder="your@email.com"
						/>
					</div>
				</div>

				<div>
					<div class="flex items-center justify-between mb-2">
						<label for="password" class="block text-sm font-medium dark:text-gray-300">
							Password
						</label>
						<a href="/auth/forgot-password" class="text-xs text-primary dark:text-secondary hover:underline">
							Forgot Password?
						</a>
					</div>
					<div class="relative">
						<Lock class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
						<input
							id="password"
							type="password"
							bind:value={password}
							required
							class="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary dark:bg-dark-accent dark:border-gray-600 dark:text-white"
							placeholder="••••••••"
						/>
					</div>
				</div>

				<button
					type="submit"
					disabled={loading}
					class="btn-primary w-full disabled:opacity-50"
				>
					{loading ? 'Logging in...' : 'Login'}
				</button>
			</form>

			<p class="text-center text-sm dark:text-gray-300">
				Don't have an account?
				<a href="/auth/register" class="text-primary dark:text-secondary font-semibold hover:underline">
					Register
				</a>
			</p>
		</div>
	</div>
</div>
