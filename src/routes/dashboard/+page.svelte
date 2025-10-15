<script lang="ts">
	import { onMount } from 'svelte';
	import { user, profile } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import { supabase, type GameScore } from '$lib/supabase';
	import { RANK_NAMES, MEMBERSHIP_TIERS } from '$lib/utils/gameConfig';
	import { Heart, Trophy, TrendingUp, Clock, Star, Play } from 'lucide-svelte';

	let recentScores: GameScore[] = [];
	let loading = true;
	let livesRegen = '';

	onMount(async () => {
		if (!$user) {
			goto('/auth/login');
			return;
		}

		await loadRecentScores();
		calculateLivesRegen();
		loading = false;

		// Update lives regen time every minute
		const interval = setInterval(calculateLivesRegen, 60000);
		return () => clearInterval(interval);
	});

	async function loadRecentScores() {
		if (!$user) return;

		const { data } = await supabase
			.from('game_scores')
			.select('*')
			.eq('user_id', $user.id)
			.order('created_at', { ascending: false })
			.limit(10);

		recentScores = data || [];
	}

	function calculateLivesRegen() {
		if (!$profile) return;

		if ($profile.lives >= $profile.max_lives) {
			livesRegen = 'Full';
			return;
		}

		const lastRegen = new Date($profile.last_life_regen);
		const now = new Date();
		const diff = now.getTime() - lastRegen.getTime();
		const minutesSinceRegen = Math.floor(diff / 60000);
		const minutesPerLife = 60 / $profile.lives_per_hour;
		const minutesUntilNext = minutesPerLife - (minutesSinceRegen % minutesPerLife);

		livesRegen = `${minutesUntilNext}m`;
	}

	function formatDate(dateString: string) {
		const date = new Date(dateString);
		const now = new Date();
		const diff = now.getTime() - date.getTime();
		const minutes = Math.floor(diff / 60000);
		const hours = Math.floor(minutes / 60);
		const days = Math.floor(hours / 24);

		if (minutes < 1) return 'Just now';
		if (minutes < 60) return `${minutes}m ago`;
		if (hours < 24) return `${hours}h ago`;
		return `${days}d ago`;
	}

	function calculateProgress() {
		if (!$profile) return 0;

		// Calculate progress to next level (example: 100 points per level)
		const pointsForCurrentLevel = ($profile.lifetime_level - 1) * 100;
		const pointsForNextLevel = $profile.lifetime_level * 100;
		const progress = (($profile.lifetime_points - pointsForCurrentLevel) / (pointsForNextLevel - pointsForCurrentLevel)) * 100;

		return Math.min(100, Math.max(0, progress));
	}

	function getRankColor(rank: string) {
		const color = RANK_NAMES[rank as keyof typeof RANK_NAMES]?.color;
		return color || '#666666';
	}
</script>

<svelte:head>
	<title>Dashboard - Blue Balls</title>
</svelte:head>

{#if loading}
	<div class="min-h-screen flex items-center justify-center">
		<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
	</div>
{:else if !$profile}
	<div class="min-h-screen flex items-center justify-center p-4">
		<div class="card max-w-md text-center">
			<h2 class="text-2xl font-bold mb-4">Profile Not Found</h2>
			<p class="mb-4 dark:text-gray-300">There was an error loading your profile.</p>
			<a href="/" class="btn-primary inline-block">Go Home</a>
		</div>
	</div>
{:else}
	<div class="min-h-screen p-4">
		<div class="max-w-6xl mx-auto">
			<h1 class="text-3xl font-bold mb-6">Dashboard</h1>

			<!-- Stats Overview -->
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
				<!-- Lives -->
				<div class="card bg-gradient-to-br from-red-500 to-pink-600 text-white">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-sm opacity-90">Lives</p>
							<p class="text-3xl font-bold">{$profile.lives}</p>
							<p class="text-xs opacity-75">Next in {livesRegen}</p>
						</div>
						<Heart size={48} class="opacity-50" />
					</div>
				</div>

				<!-- Level -->
				<div class="card bg-gradient-to-br from-blue-500 to-cyan-600 text-white">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-sm opacity-90">Level</p>
							<p class="text-3xl font-bold">{$profile.lifetime_level}</p>
							<p class="text-xs opacity-75">{$profile.lifetime_points.toLocaleString()} points</p>
						</div>
						<TrendingUp size={48} class="opacity-50" />
					</div>
				</div>

				<!-- Rank -->
				<div class="card bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-sm opacity-90">Rank</p>
							<p class="text-2xl font-bold" style="color: {getRankColor($profile.current_rank)}">
								{RANK_NAMES[$profile.current_rank].name}
							</p>
							<p class="text-xs opacity-75">Keep playing to rank up!</p>
						</div>
						<Trophy size={48} class="opacity-50" />
					</div>
				</div>

				<!-- Membership -->
				<div class="card bg-gradient-to-br from-yellow-500 to-orange-600 text-white">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-sm opacity-90">Membership</p>
							<p class="text-xl font-bold">{MEMBERSHIP_TIERS[$profile.membership_tier].name}</p>
							{#if $profile.membership_tier === 'free'}
								<a href="/subscribe" class="text-xs underline opacity-75 hover:opacity-100">Upgrade</a>
							{:else}
								<p class="text-xs opacity-75">Active</p>
							{/if}
						</div>
						<Star size={48} class="opacity-50" />
					</div>
				</div>
			</div>

			<!-- Progress Bar -->
			<div class="card mb-6">
				<div class="flex items-center justify-between mb-2">
					<h3 class="font-bold">Level Progress</h3>
					<span class="text-sm dark:text-gray-300">Level {$profile.lifetime_level} → {$profile.lifetime_level + 1}</span>
				</div>
				<div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
					<div
						class="bg-gradient-to-r from-primary to-secondary h-4 rounded-full transition-all duration-500"
						style="width: {calculateProgress()}%"
					></div>
				</div>
				<p class="text-xs text-center mt-1 dark:text-gray-300">{calculateProgress().toFixed(1)}% to next level</p>
			</div>

			<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<!-- High Scores -->
				<div class="card">
					<h2 class="text-xl font-bold mb-4 flex items-center gap-2">
						<Trophy size={24} class="text-yellow-500" />
						High Scores
					</h2>
					<div class="space-y-3">
						<div class="flex items-center justify-between p-3 bg-blue-500/20 rounded-lg">
							<div>
								<p class="font-semibold text-blue-600 dark:text-blue-400">Easy</p>
								<p class="text-2xl font-bold">{$profile.high_score_easy.toLocaleString()}</p>
							</div>
							<a href="/game/easy" class="btn-primary bg-blue-500 hover:bg-blue-600 text-sm py-2">
								<Play size={16} class="inline" /> Play
							</a>
						</div>
						<div class="flex items-center justify-between p-3 bg-orange-500/20 rounded-lg">
							<div>
								<p class="font-semibold text-orange-600 dark:text-orange-400">Medium</p>
								<p class="text-2xl font-bold">{$profile.high_score_medium.toLocaleString()}</p>
							</div>
							<a href="/game/medium" class="btn-primary bg-orange-500 hover:bg-orange-600 text-sm py-2">
								<Play size={16} class="inline" /> Play
							</a>
						</div>
						<div class="flex items-center justify-between p-3 bg-pink-500/20 rounded-lg">
							<div>
								<p class="font-semibold text-pink-600 dark:text-pink-400">Hard</p>
								<p class="text-2xl font-bold">{$profile.high_score_hard.toLocaleString()}</p>
							</div>
							<a href="/game/hard" class="btn-primary text-sm py-2">
								<Play size={16} class="inline" /> Play
							</a>
						</div>
					</div>
				</div>

				<!-- Recent Games -->
				<div class="card">
					<h2 class="text-xl font-bold mb-4 flex items-center gap-2">
						<Clock size={24} class="text-blue-500" />
						Recent Games
					</h2>
					{#if recentScores.length === 0}
						<div class="text-center py-8">
							<p class="dark:text-gray-300 mb-4">No games played yet</p>
							<a href="/game/easy" class="btn-primary inline-block">
								<Play size={16} class="inline" /> Play Your First Game
							</a>
						</div>
					{:else}
						<div class="space-y-2 max-h-96 overflow-y-auto">
							{#each recentScores as score}
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
					{/if}
				</div>
			</div>

			<!-- Quick Actions -->
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
				<a href="/leaderboard" class="card hover:shadow-lg transition text-center">
					<Trophy class="mx-auto mb-2 text-yellow-500" size={32} />
					<h3 class="font-bold">View Leaderboard</h3>
					<p class="text-sm dark:text-gray-300">See where you rank</p>
				</a>
				<a href="/settings" class="card hover:shadow-lg transition text-center">
					<Star class="mx-auto mb-2 text-purple-500" size={32} />
					<h3 class="font-bold">Settings</h3>
					<p class="text-sm dark:text-gray-300">Customize your profile</p>
				</a>
				{#if $profile.membership_tier === 'free'}
					<a href="/subscribe" class="card hover:shadow-lg transition text-center bg-gradient-to-br from-secondary to-pink-600 text-white">
						<Star class="mx-auto mb-2" size={32} />
						<h3 class="font-bold">Upgrade</h3>
						<p class="text-sm opacity-90">Get more lives & features</p>
					</a>
				{/if}
			</div>
		</div>
	</div>
{/if}
