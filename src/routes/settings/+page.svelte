<script lang="ts">
	import { onMount } from 'svelte';
	import { user, profile } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabase';
	import { theme } from '$lib/stores/theme';
	import { Settings, Globe, Link2, MessageSquare, Users, Image, CheckCircle, X, Upload, Eye, Bell, Volume2, Gamepad2, Shield, Trash2, Key, LogOut } from 'lucide-svelte';
	import { analytics } from '$lib/analytics';
	import ProfileImageUpload from '$lib/components/ProfileImageUpload.svelte';

	let loading = true;
	let saving = false;
	let error = '';
	let success = '';
	let activeTab: 'profile' | 'preferences' | 'privacy' | 'account' = 'profile';

	// Profile fields
	let username = '';
	let country = '';
	let profilePublic = false;
	let socialPlatform = '';
	let socialLink = '';
	let messageToWorld = '';
	let allowFriendRequests = true;
	let profileImageUrl = '';

	// Preferences
	let soundEffects = true;
	let backgroundMusic = false;
	let defaultDifficulty = 'medium';
	let chatNotifications = true;
	let friendRequestNotifications = true;

	// Password change
	let currentPassword = '';
	let newPassword = '';
	let confirmPassword = '';
	let changingPassword = false;

	const socialPlatforms = [
		{ value: '', label: 'None' },
		{ value: 'instagram', label: 'Instagram' },
		{ value: 'twitter', label: 'X (Twitter)' },
		{ value: 'tiktok', label: 'TikTok' },
		{ value: 'youtube', label: 'YouTube' },
		{ value: 'twitch', label: 'Twitch' }
	];

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

	// Map country codes back to names for display
	const codesToCountry: Record<string, string> = {};
	Object.keys(countryToCodes).forEach(name => {
		codesToCountry[countryToCodes[name]] = name;
	});

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

	onMount(async () => {
		if (!$user) {
			goto('/auth/login');
			return;
		}

		if ($profile) {
			loadSettings();
		}

		// Load preferences from localStorage
		loadPreferences();

		loading = false;
	});

	function loadSettings() {
		if (!$profile) return;

		username = $profile.username || '';
		// Map country_code back to country name for display
		country = $profile.country_code ? (codesToCountry[$profile.country_code] || '') : '';
		profilePublic = $profile.profile_public;
		socialPlatform = $profile.social_platform || '';
		socialLink = $profile.social_link || '';
		messageToWorld = $profile.message_to_world || '';
		allowFriendRequests = $profile.allow_friend_requests;
		profileImageUrl = $profile.profile_image_url || '';
	}

	function loadPreferences() {
		soundEffects = localStorage.getItem('soundEffects') !== 'false';
		backgroundMusic = localStorage.getItem('backgroundMusic') === 'true';
		defaultDifficulty = localStorage.getItem('defaultDifficulty') || 'medium';
		chatNotifications = localStorage.getItem('chatNotifications') !== 'false';
		friendRequestNotifications = localStorage.getItem('friendRequestNotifications') !== 'false';
	}

	function savePreferences() {
		localStorage.setItem('soundEffects', soundEffects.toString());
		localStorage.setItem('backgroundMusic', backgroundMusic.toString());
		localStorage.setItem('defaultDifficulty', defaultDifficulty);
		localStorage.setItem('chatNotifications', chatNotifications.toString());
		localStorage.setItem('friendRequestNotifications', friendRequestNotifications.toString());

		// Track preferences update
		analytics.updateSettings('preferences');

		success = 'Preferences saved successfully!';
		setTimeout(() => success = '', 3000);
	}

	function handleImageUploadSuccess(url: string) {
		profileImageUrl = url;
		if ($profile) {
			$profile = { ...$profile, profile_image_url: url };
		}
		success = 'Profile picture updated successfully!';
		setTimeout(() => success = '', 3000);
	}

	async function handleSaveProfile() {
		if (!$user) return;

		saving = true;
		error = '';
		success = '';

		// Validate username
		if (!username.trim()) {
			error = 'Username is required';
			saving = false;
			return;
		}

		if (username.trim().length < 3) {
			error = 'Username must be at least 3 characters long';
			saving = false;
			return;
		}

		if (username.trim().length > 20) {
			error = 'Username must be less than 20 characters';
			saving = false;
			return;
		}

		if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
			error = 'Username can only contain letters, numbers, and underscores';
			saving = false;
			return;
		}

		// Check if username is taken (if changed)
		if (username.trim() !== $profile?.username) {
			const { data: existingUser } = await supabase
				.from('profiles')
				.select('id')
				.eq('username', username.trim())
				.single();

			if (existingUser) {
				error = 'Username is already taken';
				saving = false;
				return;
			}
		}

		if (socialPlatform && !socialLink.trim()) {
			error = 'Please provide a social media URL or select "None"';
			saving = false;
			return;
		}

		if (messageToWorld.length > 500) {
			error = 'Message to the world must be less than 500 characters';
			saving = false;
			return;
		}

		// Validate country if changed
		if (country && !countryToCodes[country]) {
			error = 'Please select a valid country';
			saving = false;
			return;
		}

		try {
			// Calculate country_code and region from country selection
			const countryCode = country ? countryToCodes[country] : ($profile?.country_code || 'US');
			const region = getRegion(countryCode);

			const updates = {
				username: username.trim(),
				country_code: countryCode,
				region: region as any,
				profile_public: profilePublic,
				social_platform: socialPlatform || null,
				social_link: socialLink.trim() || null,
				message_to_world: messageToWorld.trim() || null,
				allow_friend_requests: allowFriendRequests,
				updated_at: new Date().toISOString()
			};

			const { error: updateError } = await supabase
				.from('profiles')
				.update(updates)
				.eq('id', $user.id);

			if (updateError) throw updateError;

			if ($profile) {
				$profile = { ...$profile, ...updates };
			}

			// Track settings update based on active tab
			if (activeTab === 'profile') {
				analytics.updateSettings('profile');
			} else if (activeTab === 'privacy') {
				analytics.updateSettings('privacy');
			}

			success = 'Profile settings saved successfully!';
		} catch (e: any) {
			error = e.message || 'Failed to save settings';
		} finally {
			saving = false;
		}
	}

	async function handleChangePassword() {
		if (!newPassword || !confirmPassword) {
			error = 'Please fill in all password fields';
			return;
		}

		if (newPassword.length < 6) {
			error = 'New password must be at least 6 characters';
			return;
		}

		if (newPassword !== confirmPassword) {
			error = 'Passwords do not match';
			return;
		}

		changingPassword = true;
		error = '';
		success = '';

		try {
			const { error: updateError } = await supabase.auth.updateUser({
				password: newPassword
			});

			if (updateError) throw updateError;

			success = 'Password changed successfully!';
			currentPassword = '';
			newPassword = '';
			confirmPassword = '';
		} catch (e: any) {
			error = e.message || 'Failed to change password';
		} finally {
			changingPassword = false;
		}
	}

	async function handleDeleteAccount() {
		const confirmed = confirm(
			'Are you ABSOLUTELY SURE you want to delete your account? This action CANNOT be undone. All your data, scores, and progress will be permanently deleted.'
		);

		if (!confirmed) return;

		const doubleConfirm = prompt('Type "DELETE" to confirm account deletion:');
		if (doubleConfirm !== 'DELETE') {
			error = 'Account deletion cancelled';
			return;
		}

		try {
			// This would need a server-side endpoint to properly delete the account
			error = 'Account deletion is not yet implemented. Please contact support.';
		} catch (e: any) {
			error = e.message || 'Failed to delete account';
		}
	}

	function getSocialPlaceholder(platform: string) {
		switch (platform) {
			case 'instagram':
				return 'https://instagram.com/yourusername';
			case 'twitter':
				return 'https://x.com/yourusername';
			case 'tiktok':
				return 'https://tiktok.com/@yourusername';
			case 'youtube':
				return 'https://youtube.com/@yourchannel';
			case 'twitch':
				return 'https://twitch.tv/yourusername';
			default:
				return 'https://...';
		}
	}
</script>

<svelte:head>
	<title>Settings - Blue Balls</title>
</svelte:head>

{#if loading}
	<div class="min-h-screen flex items-center justify-center">
		<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
	</div>
{:else}
	<div class="min-h-screen p-4">
		<div class="max-w-5xl mx-auto">
			<h1 class="text-3xl font-bold mb-2 flex items-center gap-2">
				<Settings size={32} />
				Settings
			</h1>
			<p class="dark:text-gray-300 mb-6">Manage your profile, preferences, and account</p>

			{#if error}
				<div class="bg-red-100 dark:bg-red-900/20 border border-red-400 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-4 flex items-start gap-2">
					<X size={20} class="flex-shrink-0 mt-0.5" />
					<span>{error}</span>
				</div>
			{/if}

			{#if success}
				<div class="bg-green-100 dark:bg-green-900/20 border border-green-400 text-green-700 dark:text-green-400 px-4 py-3 rounded mb-4 flex items-start gap-2">
					<CheckCircle size={20} class="flex-shrink-0 mt-0.5" />
					<span>{success}</span>
				</div>
			{/if}

			<!-- Tabs -->
			<div class="flex gap-2 mb-6 overflow-x-auto">
				<button
					on:click={() => activeTab = 'profile'}
					class="px-4 py-2 rounded-lg font-semibold transition {activeTab === 'profile' ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-dark-secondary hover:bg-gray-300 dark:hover:bg-gray-700'}"
				>
					Profile
				</button>
				<button
					on:click={() => activeTab = 'preferences'}
					class="px-4 py-2 rounded-lg font-semibold transition {activeTab === 'preferences' ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-dark-secondary hover:bg-gray-300 dark:hover:bg-gray-700'}"
				>
					Preferences
				</button>
				<button
					on:click={() => activeTab = 'privacy'}
					class="px-4 py-2 rounded-lg font-semibold transition {activeTab === 'privacy' ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-dark-secondary hover:bg-gray-300 dark:hover:bg-gray-700'}"
				>
					Privacy
				</button>
				<button
					on:click={() => activeTab = 'account'}
					class="px-4 py-2 rounded-lg font-semibold transition {activeTab === 'account' ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-dark-secondary hover:bg-gray-300 dark:hover:bg-gray-700'}"
				>
					Account
				</button>
			</div>

			<!-- Profile Tab -->
			{#if activeTab === 'profile'}
				<!-- Username -->
				<div class="card mb-6">
					<h2 class="text-xl font-bold mb-4 flex items-center gap-2">
						<Settings size={24} />
						Username
					</h2>

					<div>
						<label for="username" class="block font-bold mb-2">
							Username *
						</label>
						<input
							type="text"
							id="username"
							bind:value={username}
							placeholder="Enter your username"
							class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-dark-accent dark:text-white"
							minlength="3"
							maxlength="20"
							pattern="[a-zA-Z0-9_]+"
						/>
						<p class="text-sm dark:text-gray-300 mt-1">
							3-20 characters, letters, numbers, and underscores only
						</p>
					</div>
				</div>

				<!-- Country -->
				<div class="card mb-6">
					<h2 class="text-xl font-bold mb-4 flex items-center gap-2">
						<Globe size={24} />
						Country
					</h2>

					<div>
						<label for="country" class="block font-bold mb-2">
							Country
						</label>
						<select
							id="country"
							bind:value={country}
							class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-dark-accent dark:text-white"
						>
							<option value="">Select a country</option>
							{#each countries as countryOption}
								<option value={countryOption}>{countryOption}</option>
							{/each}
						</select>
						<p class="text-sm dark:text-gray-300 mt-1">
							This helps us show you on the regional leaderboards
						</p>
					</div>
				</div>

				<!-- Profile Picture -->
				<div class="card mb-6">
					<h2 class="text-xl font-bold mb-4 flex items-center gap-2">
						<Image size={24} />
						Profile Picture
					</h2>

					<div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-400 text-blue-700 dark:text-blue-400 px-4 py-3 rounded mb-4">
						<p class="font-bold mb-1">Free for Everyone!</p>
						<p class="text-sm">
							All users can now upload profile pictures, hosted on our super-fast CDN at cdn.blueballs.lol
						</p>
					</div>

					<div class="flex justify-center">
						<ProfileImageUpload
							currentImageUrl={profileImageUrl}
							onUploadSuccess={handleImageUploadSuccess}
						/>
					</div>
				</div>

				<!-- Social Media -->
				<div class="card mb-6">
					<h2 class="text-xl font-bold mb-4 flex items-center gap-2">
						<Link2 size={24} />
						Social Media
					</h2>

					<div class="space-y-4">
						<div>
							<label for="socialPlatform" class="block font-bold mb-2">
								Platform
							</label>
							<select
								id="socialPlatform"
								bind:value={socialPlatform}
								class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-dark-accent dark:text-white"
							>
								{#each socialPlatforms as platform}
									<option value={platform.value}>{platform.label}</option>
								{/each}
							</select>
						</div>

						{#if socialPlatform}
							<div>
								<label for="socialLink" class="block font-bold mb-2">
									URL
								</label>
								<input
									type="url"
									id="socialLink"
									bind:value={socialLink}
									placeholder={getSocialPlaceholder(socialPlatform)}
									class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-dark-accent dark:text-white"
								/>
							</div>
						{/if}
					</div>
				</div>

				<!-- Message to the World -->
				<div class="card mb-6">
					<h2 class="text-xl font-bold mb-4 flex items-center gap-2">
						<MessageSquare size={24} />
						Message to the World
					</h2>

					<textarea
						bind:value={messageToWorld}
						rows="4"
						maxlength="500"
						placeholder="Share a message that will appear on your profile..."
						class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-dark-accent dark:text-white resize-none"
					></textarea>

					<p class="text-sm dark:text-gray-300 mt-2">
						{messageToWorld.length}/500 characters
					</p>
				</div>

				<div class="flex gap-4">
					<button
						on:click={handleSaveProfile}
						class="btn-primary flex-1"
						disabled={saving}
					>
						{#if saving}
							Saving...
						{:else}
							<CheckCircle size={18} class="inline" /> Save Profile
						{/if}
					</button>

					<a
						href="/profile/{$user?.id}"
						target="_blank"
						class="btn-primary bg-purple-500 hover:bg-purple-600 flex items-center gap-2"
					>
						<Eye size={18} />
						Preview
					</a>
				</div>
			{/if}

			<!-- Preferences Tab -->
			{#if activeTab === 'preferences'}
				<!-- Game Settings -->
				<div class="card mb-6">
					<h2 class="text-xl font-bold mb-4 flex items-center gap-2">
						<Gamepad2 size={24} />
						Game Settings
					</h2>

					<div class="space-y-4">
						<label class="flex items-center gap-3 cursor-pointer">
							<input
								type="checkbox"
								bind:checked={soundEffects}
								class="w-5 h-5 text-primary focus:ring-2 focus:ring-primary rounded"
							/>
							<div>
								<p class="font-bold">Sound Effects</p>
								<p class="text-sm dark:text-gray-300">Play sound effects during gameplay</p>
							</div>
						</label>

						<label class="flex items-center gap-3 cursor-pointer">
							<input
								type="checkbox"
								bind:checked={backgroundMusic}
								class="w-5 h-5 text-primary focus:ring-2 focus:ring-primary rounded"
							/>
							<div>
								<p class="font-bold">Background Music</p>
								<p class="text-sm dark:text-gray-300">Play background music while playing</p>
							</div>
						</label>

						<div>
							<label for="defaultDifficulty" class="block font-bold mb-2">
								Default Difficulty
							</label>
							<select
								id="defaultDifficulty"
								bind:value={defaultDifficulty}
								class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-dark-accent dark:text-white"
							>
								<option value="easy">Easy</option>
								<option value="medium">Medium</option>
								<option value="hard">Hard</option>
							</select>
							<p class="text-sm dark:text-gray-300 mt-1">The game will start with this difficulty by default</p>
						</div>
					</div>
				</div>

				<!-- Notifications -->
				<div class="card mb-6">
					<h2 class="text-xl font-bold mb-4 flex items-center gap-2">
						<Bell size={24} />
						Notifications
					</h2>

					<div class="space-y-4">
						<label class="flex items-center gap-3 cursor-pointer">
							<input
								type="checkbox"
								bind:checked={chatNotifications}
								class="w-5 h-5 text-primary focus:ring-2 focus:ring-primary rounded"
							/>
							<div>
								<p class="font-bold">Chat Notifications</p>
								<p class="text-sm dark:text-gray-300">Get notified about new chat messages</p>
							</div>
						</label>

						<label class="flex items-center gap-3 cursor-pointer">
							<input
								type="checkbox"
								bind:checked={friendRequestNotifications}
								class="w-5 h-5 text-primary focus:ring-2 focus:ring-primary rounded"
							/>
							<div>
								<p class="font-bold">Friend Request Notifications</p>
								<p class="text-sm dark:text-gray-300">Get notified when you receive friend requests</p>
							</div>
						</label>
					</div>
				</div>

				<!-- Display -->
				<div class="card mb-6">
					<h2 class="text-xl font-bold mb-4 flex items-center gap-2">
						<Eye size={24} />
						Display
					</h2>

					<div>
						<label for="theme" class="block font-bold mb-2">
							Theme
						</label>
						<select
							id="theme"
							value={$theme}
							on:change={(e) => $theme = e.currentTarget.value as 'light' | 'dark'}
							class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-dark-accent dark:text-white"
						>
							<option value="light">Light</option>
							<option value="dark">Dark</option>
						</select>
					</div>
				</div>

				<button
					on:click={savePreferences}
					class="btn-primary w-full"
				>
					<CheckCircle size={18} class="inline" /> Save Preferences
				</button>
			{/if}

			<!-- Privacy Tab -->
			{#if activeTab === 'privacy'}
				<!-- Profile Visibility -->
				<div class="card mb-6">
					<h2 class="text-xl font-bold mb-4 flex items-center gap-2">
						<Globe size={24} />
						Profile Visibility
					</h2>

					<label class="flex items-center gap-3 cursor-pointer">
						<input
							type="checkbox"
							bind:checked={profilePublic}
							class="w-5 h-5 text-primary focus:ring-2 focus:ring-primary rounded"
						/>
						<div>
							<p class="font-bold">Make profile public</p>
							<p class="text-sm dark:text-gray-300">
								Allow other players to view your profile, stats, and achievements
							</p>
						</div>
					</label>
				</div>

				<!-- Friend Requests -->
				<div class="card mb-6">
					<h2 class="text-xl font-bold mb-4 flex items-center gap-2">
						<Users size={24} />
						Friend Requests
					</h2>

					<label class="flex items-center gap-3 cursor-pointer">
						<input
							type="checkbox"
							bind:checked={allowFriendRequests}
							class="w-5 h-5 text-primary focus:ring-2 focus:ring-primary rounded"
						/>
						<div>
							<p class="font-bold">Allow friend requests</p>
							<p class="text-sm dark:text-gray-300">
								Let other players send you friend requests
							</p>
						</div>
					</label>
				</div>

				<button
					on:click={handleSaveProfile}
					class="btn-primary w-full"
					disabled={saving}
				>
					{#if saving}
						Saving...
					{:else}
						<CheckCircle size={18} class="inline" /> Save Privacy Settings
					{/if}
				</button>
			{/if}

			<!-- Account Tab -->
			{#if activeTab === 'account'}
				<!-- Account Info -->
				<div class="card mb-6">
					<h3 class="font-bold mb-4 text-xl">Account Information</h3>
					<div class="space-y-3">
						<div class="flex justify-between py-2 border-b dark:border-gray-700">
							<span class="text-gray-600 dark:text-gray-400">Email</span>
							<span class="font-semibold">{$user?.email}</span>
						</div>
						<div class="flex justify-between py-2 border-b dark:border-gray-700">
							<span class="text-gray-600 dark:text-gray-400">Username</span>
							<span class="font-semibold">{$profile?.username}</span>
						</div>
						<div class="flex justify-between py-2 border-b dark:border-gray-700">
							<span class="text-gray-600 dark:text-gray-400">Member Since</span>
							<span class="font-semibold">{new Date($profile?.created_at || '').toLocaleDateString()}</span>
						</div>
						<div class="flex justify-between py-2">
							<span class="text-gray-600 dark:text-gray-400">Membership Tier</span>
							<span class="font-semibold capitalize">{$profile?.membership_tier}</span>
						</div>
					</div>
				</div>

				<!-- Change Password -->
				<div class="card mb-6">
					<h2 class="text-xl font-bold mb-4 flex items-center gap-2">
						<Key size={24} />
						Change Password
					</h2>

					<div class="space-y-4">
						<div>
							<label for="newPassword" class="block font-bold mb-2">
								New Password
							</label>
							<input
								type="password"
								id="newPassword"
								bind:value={newPassword}
								placeholder="Enter new password"
								class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-dark-accent dark:text-white"
								minlength="6"
							/>
						</div>

						<div>
							<label for="confirmPassword" class="block font-bold mb-2">
								Confirm New Password
							</label>
							<input
								type="password"
								id="confirmPassword"
								bind:value={confirmPassword}
								placeholder="Confirm new password"
								class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-dark-accent dark:text-white"
								minlength="6"
							/>
						</div>

						<button
							on:click={handleChangePassword}
							class="btn-primary w-full"
							disabled={changingPassword || !newPassword || !confirmPassword}
						>
							{#if changingPassword}
								Changing Password...
							{:else}
								<Key size={18} class="inline" /> Change Password
							{/if}
						</button>
					</div>
				</div>

				<!-- Subscription -->
				<div class="card mb-6">
					<h2 class="text-xl font-bold mb-4 flex items-center gap-2">
						<Shield size={24} />
						Subscription
					</h2>

					<p class="mb-4 dark:text-gray-300">
						Manage your subscription and billing from the subscription page.
					</p>

					<a href="/subscribe" class="btn-primary inline-block">
						Manage Subscription
					</a>
				</div>

				<!-- Danger Zone -->
				<div class="card bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700">
					<h2 class="text-xl font-bold mb-4 flex items-center gap-2 text-red-700 dark:text-red-400">
						<Trash2 size={24} />
						Danger Zone
					</h2>

					<p class="mb-4 dark:text-gray-300">
						Once you delete your account, there is no going back. All your data, scores, and progress will be permanently deleted.
					</p>

					<button
						on:click={handleDeleteAccount}
						class="btn-primary bg-red-600 hover:bg-red-700 flex items-center gap-2"
					>
						<Trash2 size={18} />
						Delete Account
					</button>
				</div>
			{/if}
		</div>
	</div>
{/if}
