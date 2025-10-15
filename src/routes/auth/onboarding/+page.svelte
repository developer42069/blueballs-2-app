<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabase';
	import { ArrowRight, User, Globe } from 'lucide-svelte';

	let step = 1; // 1 = username, 2 = country
	let username = '';
	let country = '';
	let loading = false;
	let error = '';
	let userData: any = null;

	const countries = [
		'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France',
		'Spain', 'Italy', 'Netherlands', 'Sweden', 'Norway', 'Denmark', 'Finland',
		'Poland', 'Belgium', 'Austria', 'Switzerland', 'Ireland', 'Portugal', 'Greece',
		'Japan', 'South Korea', 'China', 'Taiwan', 'Singapore', 'Hong Kong', 'Thailand',
		'Philippines', 'Malaysia', 'Indonesia', 'Vietnam', 'India', 'Brazil', 'Mexico',
		'Argentina', 'Chile', 'Colombia', 'Peru', 'Russia', 'Ukraine', 'Turkey',
		'South Africa', 'Egypt', 'Nigeria', 'Kenya', 'New Zealand', 'Israel', 'UAE',
		'Saudi Arabia', 'Other'
	];

	// Map country names to 2-letter codes
	const countryToCodes: Record<string, string> = {
		'United States': 'US', 'United Kingdom': 'GB', 'Canada': 'CA', 'Australia': 'AU',
		'Germany': 'DE', 'France': 'FR', 'Spain': 'ES', 'Italy': 'IT', 'Netherlands': 'NL',
		'Sweden': 'SE', 'Norway': 'NO', 'Denmark': 'DK', 'Finland': 'FI', 'Poland': 'PL',
		'Belgium': 'BE', 'Austria': 'AT', 'Switzerland': 'CH', 'Ireland': 'IE', 'Portugal': 'PT',
		'Greece': 'GR', 'Japan': 'JP', 'South Korea': 'KR', 'China': 'CN', 'Taiwan': 'TW',
		'Singapore': 'SG', 'Hong Kong': 'HK', 'Thailand': 'TH', 'Philippines': 'PH',
		'Malaysia': 'MY', 'Indonesia': 'ID', 'Vietnam': 'VN', 'India': 'IN', 'Brazil': 'BR',
		'Mexico': 'MX', 'Argentina': 'AR', 'Chile': 'CL', 'Colombia': 'CO', 'Peru': 'PE',
		'Russia': 'RU', 'Ukraine': 'UA', 'Turkey': 'TR', 'South Africa': 'ZA', 'Egypt': 'EG',
		'Nigeria': 'NG', 'Kenya': 'KE', 'New Zealand': 'NZ', 'Israel': 'IL', 'UAE': 'AE',
		'Saudi Arabia': 'SA', 'Other': 'XX'
	};

	// Map country codes to regions
	function getRegion(countryCode: string): string {
		const asiaCountries = ['CN', 'JP', 'KR', 'IN', 'TH', 'VN', 'SG', 'MY', 'ID', 'PH', 'TW', 'HK'];
		const europeCountries = ['GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'SE', 'NO', 'DK', 'FI', 'PL', 'RU', 'BE', 'AT', 'CH', 'IE', 'PT', 'GR', 'UA'];
		const northAmericaCountries = ['US', 'CA', 'MX'];
		const southAmericaCountries = ['BR', 'AR', 'CL', 'CO', 'PE'];
		const africaCountries = ['ZA', 'NG', 'EG', 'KE'];
		const oceaniaCountries = ['AU', 'NZ'];

		if (asiaCountries.includes(countryCode)) return 'asia';
		if (europeCountries.includes(countryCode)) return 'europe';
		if (northAmericaCountries.includes(countryCode)) return 'north_america';
		if (southAmericaCountries.includes(countryCode)) return 'south_america';
		if (africaCountries.includes(countryCode)) return 'africa';
		if (oceaniaCountries.includes(countryCode)) return 'oceania';
		return 'north_america'; // default
	}

	onMount(() => {
		// Get user data from session storage
		const storedData = sessionStorage.getItem('onboarding_user');
		if (!storedData) {
			goto('/auth/login');
			return;
		}

		userData = JSON.parse(storedData);
		username = userData.suggested_username || '';
	});

	async function handleUsernameSubmit() {
		error = '';

		if (!username.trim()) {
			error = 'Username is required';
			return;
		}

		if (username.trim().length < 3) {
			error = 'Username must be at least 3 characters';
			return;
		}

		if (username.trim().length > 20) {
			error = 'Username must be less than 20 characters';
			return;
		}

		if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
			error = 'Username can only contain letters, numbers, and underscores';
			return;
		}

		// Check if username is taken
		const { data: existingUser } = await supabase
			.from('profiles')
			.select('id')
			.eq('username', username.trim())
			.single();

		if (existingUser) {
			error = 'Username is already taken';
			return;
		}

		// Move to next step
		step = 2;
	}

	async function handleCountrySubmit() {
		error = '';

		if (!country) {
			error = 'Please select a country';
			return;
		}

		loading = true;

		try {
			const countryCode = countryToCodes[country] || 'US';
			const region = getRegion(countryCode);

			// Create profile
			const { error: profileError } = await supabase.from('profiles').insert({
				id: userData.id,
				username: username.trim(),
				email: userData.email,
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
				profile_picture_url: userData.avatar_url || null,
				profile_public: true,
				allow_friend_requests: true,
				is_admin: false
			});

			if (profileError) throw profileError;

			// Clear session storage
			sessionStorage.removeItem('onboarding_user');

			// Redirect to welcome screen
			goto('/auth/welcome');
		} catch (e: any) {
			console.error('Profile creation error:', e);
			error = e.message || 'Failed to create profile';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Welcome to Blue Balls - Setup Your Account</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary to-secondary">
	<div class="card max-w-md w-full">
		<!-- Progress indicator -->
		<div class="flex justify-center gap-2 mb-6">
			<div class="w-20 h-1 rounded-full {step === 1 ? 'bg-primary' : 'bg-green-500'}"></div>
			<div class="w-20 h-1 rounded-full {step === 2 ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}"></div>
		</div>

		{#if step === 1}
			<!-- Step 1: Username -->
			<div class="text-center mb-6">
				<div class="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
					<User size={32} class="text-primary" />
				</div>
				<h1 class="text-3xl font-bold mb-2">Choose Your Username</h1>
				<p class="text-gray-600 dark:text-gray-300">
					This is how other players will see you
				</p>
			</div>

			<form on:submit|preventDefault={handleUsernameSubmit} class="space-y-4">
				<div>
					<input
						type="text"
						bind:value={username}
						placeholder="Enter your username"
						class="w-full px-4 py-3 text-lg border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-dark-accent dark:text-white"
						minlength="3"
						maxlength="20"
						pattern="[a-zA-Z0-9_]+"
						autofocus
					/>
					<p class="text-sm text-gray-500 dark:text-gray-400 mt-2">
						3-20 characters, letters, numbers, and underscores only
					</p>
				</div>

				{#if error}
					<div class="bg-red-100 dark:bg-red-900/20 border border-red-400 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
						{error}
					</div>
				{/if}

				<button
					type="submit"
					class="btn-primary w-full py-3 text-lg flex items-center justify-center gap-2"
				>
					Continue
					<ArrowRight size={20} />
				</button>
			</form>
		{:else}
			<!-- Step 2: Country -->
			<div class="text-center mb-6">
				<div class="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
					<Globe size={32} class="text-primary" />
				</div>
				<h1 class="text-3xl font-bold mb-2">Select Your Country</h1>
				<p class="text-gray-600 dark:text-gray-300">
					This helps us show you on the regional leaderboards
				</p>
			</div>

			<form on:submit|preventDefault={handleCountrySubmit} class="space-y-4">
				<div>
					<select
						bind:value={country}
						class="w-full px-4 py-3 text-lg border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-dark-accent dark:text-white"
						autofocus
					>
						<option value="">Select a country</option>
						{#each countries as countryOption}
							<option value={countryOption}>{countryOption}</option>
						{/each}
					</select>
				</div>

				{#if error}
					<div class="bg-red-100 dark:bg-red-900/20 border border-red-400 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
						{error}
					</div>
				{/if}

				<button
					type="submit"
					class="btn-primary w-full py-3 text-lg flex items-center justify-center gap-2"
					disabled={loading}
				>
					{#if loading}
						Creating your account...
					{:else}
						Complete Setup
						<ArrowRight size={20} />
					{/if}
				</button>

				<button
					type="button"
					on:click={() => step = 1}
					class="w-full py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition"
					disabled={loading}
				>
					← Back
				</button>
			</form>
		{/if}
	</div>
</div>
