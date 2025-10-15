<script lang="ts">
	import { onMount } from 'svelte';
	import { user, profile } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabase';
	import { Settings, Globe, Link2, MessageSquare, Users, Image, CheckCircle, X, Upload, Eye } from 'lucide-svelte';

	let loading = true;
	let saving = false;
	let uploadingImage = false;
	let error = '';
	let success = '';

	// Form fields
	let profilePublic = false;
	let socialPlatform = '';
	let socialLink = '';
	let messageToWorld = '';
	let allowFriendRequests = true;
	let profilePictureUrl = '';

	// File upload
	let fileInput: HTMLInputElement;
	let selectedFile: File | null = null;
	let previewUrl = '';

	const socialPlatforms = [
		{ value: '', label: 'None' },
		{ value: 'instagram', label: 'Instagram' },
		{ value: 'twitter', label: 'X (Twitter)' },
		{ value: 'tiktok', label: 'TikTok' },
		{ value: 'youtube', label: 'YouTube' },
		{ value: 'twitch', label: 'Twitch' }
	];

	onMount(async () => {
		if (!$user) {
			goto('/auth/login');
			return;
		}

		if ($profile) {
			loadSettings();
		}

		loading = false;
	});

	function loadSettings() {
		if (!$profile) return;

		profilePublic = $profile.profile_public;
		socialPlatform = $profile.social_platform || '';
		socialLink = $profile.social_link || '';
		messageToWorld = $profile.message_to_world || '';
		allowFriendRequests = $profile.allow_friend_requests;
		profilePictureUrl = $profile.profile_picture_url || '';
		previewUrl = profilePictureUrl;
	}

	function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];

		if (file) {
			if (!file.type.startsWith('image/')) {
				error = 'Please select a valid image file';
				return;
			}

			if (file.size > 5 * 1024 * 1024) {
				error = 'Image must be less than 5MB';
				return;
			}

			selectedFile = file;
			previewUrl = URL.createObjectURL(file);
			error = '';
		}
	}

	async function handleUploadImage() {
		if (!$user || !selectedFile) return;

		if ($profile?.membership_tier === 'free') {
			error = 'Profile pictures are only available for Mid and Big members. Upgrade to unlock!';
			return;
		}

		uploadingImage = true;
		error = '';
		success = '';

		try {
			// Upload to Supabase storage
			const fileExt = selectedFile.name.split('.').pop();
			const fileName = `${$user.id}-${Date.now()}.${fileExt}`;
			const filePath = `profile-pictures/${fileName}`;

			const { error: uploadError } = await supabase.storage
				.from('avatars')
				.upload(filePath, selectedFile, {
					cacheControl: '3600',
					upsert: true
				});

			if (uploadError) throw uploadError;

			// Get public URL
			const { data: { publicUrl } } = supabase.storage
				.from('avatars')
				.getPublicUrl(filePath);

			profilePictureUrl = publicUrl;

			// Update profile
			const { error: updateError } = await supabase
				.from('profiles')
				.update({ profile_picture_url: publicUrl })
				.eq('id', $user.id);

			if (updateError) throw updateError;

			// Update local profile store
			if ($profile) {
				$profile = { ...$profile, profile_picture_url: publicUrl };
			}

			success = 'Profile picture updated successfully!';
			selectedFile = null;
		} catch (e: any) {
			error = e.message || 'Failed to upload image';
		} finally {
			uploadingImage = false;
		}
	}

	async function handleSave() {
		if (!$user) return;

		saving = true;
		error = '';
		success = '';

		// Validate social link
		if (socialPlatform && !socialLink.trim()) {
			error = 'Please provide a social media URL or select "None"';
			saving = false;
			return;
		}

		// Validate message length
		if (messageToWorld.length > 500) {
			error = 'Message to the world must be less than 500 characters';
			saving = false;
			return;
		}

		try {
			const updates = {
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

			// Update local profile store
			if ($profile) {
				$profile = { ...$profile, ...updates };
			}

			success = 'Settings saved successfully!';
		} catch (e: any) {
			error = e.message || 'Failed to save settings';
		} finally {
			saving = false;
		}
	}

	function getSocialIcon(platform: string) {
		// You could return platform-specific icons here
		return Link2;
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
		<div class="max-w-4xl mx-auto">
			<h1 class="text-3xl font-bold mb-2 flex items-center gap-2">
				<Settings size={32} />
				Settings
			</h1>
			<p class="dark:text-gray-300 mb-6">Manage your profile and preferences</p>

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

			<!-- Profile Picture -->
			<div class="card mb-6">
				<h2 class="text-xl font-bold mb-4 flex items-center gap-2">
					<Image size={24} />
					Profile Picture
				</h2>

				{#if $profile?.membership_tier === 'free'}
					<div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-400 text-yellow-700 dark:text-yellow-400 px-4 py-3 rounded mb-4">
						<p class="font-bold mb-1">Premium Feature</p>
						<p class="text-sm">
							Profile pictures are only available for Mid and Big members.
							<a href="/subscribe" class="underline hover:no-underline">Upgrade now!</a>
						</p>
					</div>
				{/if}

				<div class="flex flex-col md:flex-row gap-6 items-start">
					<div class="flex-shrink-0">
						{#if previewUrl}
							<img
								src={previewUrl}
								alt="Profile preview"
								class="w-32 h-32 rounded-full object-cover border-4 border-primary"
							/>
						{:else}
							<div class="w-32 h-32 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
								<Image size={48} class="text-gray-400" />
							</div>
						{/if}
					</div>

					<div class="flex-1">
						<input
							type="file"
							bind:this={fileInput}
							on:change={handleFileSelect}
							accept="image/*"
							class="hidden"
							disabled={$profile?.membership_tier === 'free'}
						/>

						<button
							on:click={() => fileInput?.click()}
							class="btn-primary mb-2"
							disabled={$profile?.membership_tier === 'free'}
						>
							<Upload size={18} class="inline" /> Choose Image
						</button>

						{#if selectedFile}
							<button
								on:click={handleUploadImage}
								class="btn-primary bg-green-500 hover:bg-green-600 ml-2"
								disabled={uploadingImage}
							>
								{uploadingImage ? 'Uploading...' : 'Upload'}
							</button>
						{/if}

						<p class="text-sm dark:text-gray-300 mt-2">
							Recommended: Square image, at least 200x200px, max 5MB
						</p>
					</div>
				</div>
			</div>

			<!-- Profile Visibility -->
			<div class="card mb-6">
				<div class="flex items-center justify-between mb-4">
					<h2 class="text-xl font-bold flex items-center gap-2">
						<Globe size={24} />
						Profile Visibility
					</h2>
					<a
						href="/profile/{$user?.id}"
						target="_blank"
						class="btn-primary bg-purple-500 hover:bg-purple-600 text-sm py-2 px-4 flex items-center gap-2"
					>
						<Eye size={18} />
						Preview My Profile
					</a>
				</div>

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
							<div class="flex gap-2">
								<svelte:component this={getSocialIcon(socialPlatform)} size={20} class="mt-2 text-gray-500" />
								<input
									type="url"
									id="socialLink"
									bind:value={socialLink}
									placeholder={getSocialPlaceholder(socialPlatform)}
									class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-dark-accent dark:text-white"
								/>
							</div>
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
					{messageToWorld.length}/500 characters • Plain text only, no HTML
				</p>
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

			<!-- Save Button -->
			<div class="flex gap-4">
				<button
					on:click={handleSave}
					class="btn-primary flex-1"
					disabled={saving}
				>
					{#if saving}
						Saving...
					{:else}
						<CheckCircle size={18} class="inline" /> Save Settings
					{/if}
				</button>

				<button
					on:click={loadSettings}
					class="btn-primary bg-gray-500 hover:bg-gray-600"
					disabled={saving}
				>
					Reset
				</button>
			</div>

			<!-- Account Info -->
			<div class="card mt-6 bg-gray-50 dark:bg-dark-accent">
				<h3 class="font-bold mb-2">Account Information</h3>
				<div class="space-y-2 text-sm dark:text-gray-300">
					<p><span class="font-bold">Email:</span> {$user?.email}</p>
					<p><span class="font-bold">Username:</span> {$profile?.username}</p>
					<p><span class="font-bold">Member since:</span> {new Date($profile?.created_at || '').toLocaleDateString()}</p>
				</div>
			</div>
		</div>
	</div>
{/if}
