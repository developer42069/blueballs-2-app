<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { user, profile as currentUserProfile } from '$lib/stores/auth';
	import { supabase, type Profile, type GameScore } from '$lib/supabase';
	import { RANK_NAMES, MEMBERSHIP_TIERS } from '$lib/utils/gameConfig';
	import { Trophy, Calendar, Globe, Star, UserPlus, UserX, ExternalLink } from 'lucide-svelte';

	let profileData: Profile | null = null;
	let recentScores: GameScore[] = [];
	let loading = true;
	let isFriend = false;
	let isOwnProfile = false;

	$: profileId = $page.params.id;
	$: isOwnProfile = $user?.id === profileId;

	onMount(async () => {
		await loadProfile();
		loading = false;
	});

	async function loadProfile() {
		// Load profile data
		const { data: profile } = await supabase
			.from('profiles')
			.select('*')
			.eq('id', profileId)
			.single();

		if (!profile) return;

		// Check if profile is public or if it's the user's own profile
		if (!profile.profile_public && !isOwnProfile) {
			profileData = null;
			return;
		}

		profileData = profile;

		// Load recent scores
		const { data: scores } = await supabase
			.from('game_scores')
			.select('*')
			.eq('user_id', profileId)
			.order('created_at', { ascending: false })
			.limit(10);

		recentScores = scores || [];

		// Check if friend (if logged in)
		if ($user && !isOwnProfile) {
			const { data: friendData } = await supabase
				.from('friends')
				.select('id')
				.eq('user_id', $user.id)
				.eq('friend_id', profileId)
				.single();

			isFriend = !!friendData;
		}
	}

	async function toggleFriend() {
		if (!$user || !profileData) return;

		if (isFriend) {
			// Remove friend
			await supabase
				.from('friends')
				.delete()
				.eq('user_id', $user.id)
				.eq('friend_id', profileData.id);

			isFriend = false;
		} else {
			// Add friend
			await supabase
				.from('friends')
				.insert({
					user_id: $user.id,
					friend_id: profileData.id
				});

			isFriend = true;
		}
	}

	function getRankColor(rank: string) {
		const color = RANK_NAMES[rank as keyof typeof RANK_NAMES]?.color;
		return color || '#666666';
	}

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString();
	}
</script>

<svelte:head>
	<title>{profileData?.username || 'Profile'} - Blue Balls</title>
</svelte:head>

{#if loading}
	<div class="min-h-screen flex items-center justify-center">
		<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
	</div>
{:else if !profileData}
	<div class="min-h-screen flex items-center justify-center p-4">
		<div class="card max-w-md text-center">
			<h2 class="text-2xl font-bold mb-4">Profile Not Found</h2>
			<p class="mb-4 dark:text-gray-300">This profile is private or does not exist.</p>
			<a href="/" class="btn-primary inline-block">Go Home</a>
		</div>
	</div>
{:else}
	<div class="min-h-screen p-4">
		<div class="max-w-4xl mx-auto">
			<!-- Profile Header -->
			<div class="card mb-6">
				<div class="flex flex-col md:flex-row items-center md:items-start gap-6">
					<!-- Profile Picture -->
					<div class="flex-shrink-0">
						{#if profileData.profile_picture_url}
							<img
								src={profileData.profile_picture_url}
								alt={profileData.username}
								class="w-32 h-32 rounded-full border-4 border-primary dark:border-secondary object-cover"
							/>
						{:else}
							<div class="w-32 h-32 rounded-full border-4 border-primary dark:border-secondary bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-4xl font-bold">
								{profileData.username.charAt(0).toUpperCase()}
							</div>
						{/if}
					</div>

					<!-- Profile Info -->
					<div class="flex-grow text-center md:text-left">
						<h1 class="text-3xl font-bold mb-2">{profileData.username}</h1>

						<div class="flex flex-wrap gap-2 justify-center md:justify-start mb-4">
							<span
								class="px-3 py-1 rounded-full text-sm font-semibold"
								style="background-color: {getRankColor(profileData.current_rank)}20; color: {getRankColor(profileData.current_rank)}"
							>
								{RANK_NAMES[profileData.current_rank].name} Rank
							</span>
							<span class="px-3 py-1 bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-full text-sm font-semibold">
								Level {profileData.lifetime_level}
							</span>
							<span class="px-3 py-1 bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-full text-sm font-semibold">
								{MEMBERSHIP_TIERS[profileData.membership_tier].name}
							</span>
						</div>

						<div class="flex flex-wrap gap-4 justify-center md:justify-start text-sm dark:text-gray-300">
							<div class="flex items-center gap-1">
								<Globe size={16} />
								<span>{profileData.country_code}</span>
							</div>
							<div class="flex items-center gap-1">
								<Calendar size={16} />
								<span>Joined {formatDate(profileData.created_at)}</span>
							</div>
							<div class="flex items-center gap-1">
								<Trophy size={16} />
								<span>{profileData.lifetime_points.toLocaleString()} points</span>
							</div>
						</div>

						{#if profileData.message_to_world}
							<div class="mt-4 p-3 bg-gray-50 dark:bg-dark-accent rounded-lg">
								<p class="italic dark:text-gray-300">"{profileData.message_to_world}"</p>
							</div>
						{/if}

						{#if profileData.social_link && profileData.social_platform}
							<div class="mt-4">
								<a
									href={profileData.social_link}
									target="_blank"
									rel="noopener noreferrer"
									class="inline-flex items-center gap-2 text-primary dark:text-secondary hover:underline"
								>
									<ExternalLink size={16} />
									{profileData.social_platform}
								</a>
							</div>
						{/if}
					</div>

					<!-- Actions -->
					{#if $user && !isOwnProfile && profileData.allow_friend_requests}
						<div class="flex-shrink-0">
							<button
								on:click={toggleFriend}
								class="btn-primary {isFriend ? 'bg-red-500 hover:bg-red-600' : ''}"
							>
								{#if isFriend}
									<UserX size={20} class="inline" /> Unfriend
								{:else}
									<UserPlus size={20} class="inline" /> Add Friend
								{/if}
							</button>
						</div>
					{/if}

					{#if isOwnProfile}
						<div class="flex-shrink-0">
							<a href="/settings" class="btn-primary">
								Edit Profile
							</a>
						</div>
					{/if}
				</div>
			</div>

			<!-- High Scores -->
			<div class="card mb-6">
				<h2 class="text-2xl font-bold mb-4 flex items-center gap-2">
					<Trophy size={28} class="text-yellow-500" />
					High Scores
				</h2>
				<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div class="text-center p-4 bg-blue-500/20 rounded-lg">
						<p class="text-sm text-blue-600 dark:text-blue-400 font-semibold mb-1">Easy</p>
						<p class="text-3xl font-bold">{profileData.high_score_easy.toLocaleString()}</p>
					</div>
					<div class="text-center p-4 bg-orange-500/20 rounded-lg">
						<p class="text-sm text-orange-600 dark:text-orange-400 font-semibold mb-1">Medium</p>
						<p class="text-3xl font-bold">{profileData.high_score_medium.toLocaleString()}</p>
					</div>
					<div class="text-center p-4 bg-pink-500/20 rounded-lg">
						<p class="text-sm text-pink-600 dark:text-pink-400 font-semibold mb-1">Hard</p>
						<p class="text-3xl font-bold">{profileData.high_score_hard.toLocaleString()}</p>
					</div>
				</div>
			</div>

			<!-- Stats -->
			<div class="card mb-6">
				<h2 class="text-2xl font-bold mb-4 flex items-center gap-2">
					<Star size={28} class="text-purple-500" />
					Statistics
				</h2>
				<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
					<div class="text-center">
						<p class="text-3xl font-bold text-primary dark:text-secondary">{profileData.lifetime_level}</p>
						<p class="text-sm dark:text-gray-300">Level</p>
					</div>
					<div class="text-center">
						<p class="text-3xl font-bold text-primary dark:text-secondary">{profileData.lifetime_points.toLocaleString()}</p>
						<p class="text-sm dark:text-gray-300">Total Points</p>
					</div>
					<div class="text-center">
						<p class="text-3xl font-bold text-primary dark:text-secondary">{profileData.last_30_days_points.toLocaleString()}</p>
						<p class="text-sm dark:text-gray-300">30-Day Points</p>
					</div>
					<div class="text-center">
						<p class="text-3xl font-bold text-primary dark:text-secondary">{profileData.region.replace('_', ' ')}</p>
						<p class="text-sm dark:text-gray-300">Region</p>
					</div>
				</div>
			</div>

			<!-- Recent Games -->
			{#if recentScores.length > 0}
				<div class="card">
					<h2 class="text-2xl font-bold mb-4">Recent Games</h2>
					<div class="space-y-2">
						{#each recentScores.slice(0, 5) as score}
							<div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-accent rounded-lg">
								<div>
									<p class="font-semibold capitalize">{score.difficulty}</p>
									<p class="text-sm dark:text-gray-300">{formatDate(score.created_at)}</p>
								</div>
								<div class="text-right">
									<p class="text-xl font-bold">{score.score}</p>
									<p class="text-xs text-green-600 dark:text-green-400">+{score.points_earned} pts</p>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}
