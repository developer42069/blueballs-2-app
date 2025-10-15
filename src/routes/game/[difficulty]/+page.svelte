<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { user, profile } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import { supabase, type GameScore } from '$lib/supabase';
	import GameCanvas from '$lib/components/GameCanvas.svelte';
	import { GAME_CONFIG, RANK_NAMES, RANK_ORDER, type Difficulty } from '$lib/utils/gameConfig';
	import { Heart, ArrowLeft, TrendingUp, Trophy } from 'lucide-svelte';

	$: difficulty = $page.params.difficulty as Difficulty;
	$: isValidDifficulty = ['easy', 'medium', 'hard'].includes(difficulty);

	let savingScore = false;
	let scoreError = '';
	let lastScore = 0;
	let lastPoints = 0;
	let recentScores: GameScore[] = [];
	let livesRegen = '';

	// Redirect to home if invalid difficulty
	$: if (!isValidDifficulty) {
		goto('/');
	}

	onMount(async () => {
		if ($user) {
			await loadRecentScores();
			calculateLivesRegen();

			// Check for lives regeneration immediately
			await checkAndRegenerateLives();

			// Update lives regen time every second for countdown
			const countdownInterval = setInterval(calculateLivesRegen, 1000);

			// Check for lives regeneration every 10 seconds
			const regenInterval = setInterval(checkAndRegenerateLives, 10000);

			return () => {
				clearInterval(countdownInterval);
				clearInterval(regenInterval);
			};
		}
	});

	async function checkAndRegenerateLives() {
		if (!$user || !$profile) return;

		// Calculate if user should have gained lives
		const now = new Date();
		const lastRegen = new Date($profile.last_life_regen);
		const timeDiff = now.getTime() - lastRegen.getTime();
		const hoursPassed = timeDiff / (1000 * 60 * 60);
		const livesGained = Math.floor(hoursPassed * $profile.lives_per_hour);

		// If lives should be gained, call the API to regenerate
		if (livesGained > 0 && $profile.lives < $profile.max_lives) {
			try {
				const { data: { session } } = await supabase.auth.getSession();
				if (!session) return;

				const response = await fetch('/api/lives/regen', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${session.access_token}`
					}
				});

				const data = await response.json();

				if (data.success && data.profile) {
					// Update local profile with new lives
					$profile = {
						...$profile,
						lives: data.profile.lives,
						last_life_regen: data.profile.last_life_regen
					};
				}
			} catch (e) {
				console.error('Failed to regenerate lives:', e);
			}
		}
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
		const secondsSinceRegen = Math.floor(diff / 1000);
		const minutesPerLife = 60 / $profile.lives_per_hour;
		const secondsPerLife = minutesPerLife * 60;

		const secondsUntilNext = Math.ceil(secondsPerLife - (secondsSinceRegen % secondsPerLife));
		const minutesUntilNext = Math.floor(secondsUntilNext / 60);
		const secondsRemainder = secondsUntilNext % 60;

		if (minutesUntilNext > 0) {
			livesRegen = `${minutesUntilNext}m ${secondsRemainder}s`;
		} else {
			livesRegen = `${secondsRemainder}s`;
		}
	}

	async function loadRecentScores() {
		if (!$user) return;

		const { data } = await supabase
			.from('game_scores')
			.select('*')
			.eq('user_id', $user.id)
			.eq('difficulty', difficulty)
			.order('created_at', { ascending: false })
			.limit(5);

		recentScores = data || [];
	}

	function calculateLevelProgress() {
		if (!$profile) return 0;
		const pointsForCurrentLevel = ($profile.lifetime_level - 1) * 100;
		const pointsForNextLevel = $profile.lifetime_level * 100;
		const progress = (($profile.lifetime_points - pointsForCurrentLevel) / (pointsForNextLevel - pointsForCurrentLevel)) * 100;
		return Math.min(100, Math.max(0, progress));
	}

	function calculateRankProgress() {
		if (!$profile) return { progress: 0, currentRank: 'blue', nextRank: 'silver', currentPoints: 0, nextThreshold: 1000 };

		const currentRankIndex = RANK_ORDER.indexOf($profile.current_rank as any);
		const currentRank = RANK_ORDER[currentRankIndex];
		const nextRank = currentRankIndex < RANK_ORDER.length - 1 ? RANK_ORDER[currentRankIndex + 1] : currentRank;

		const currentThreshold = RANK_NAMES[currentRank].threshold;
		const nextThreshold = RANK_NAMES[nextRank].threshold;
		const currentPoints = $profile.last_30_days_points;

		if (currentRankIndex === RANK_ORDER.length - 1) {
			// Max rank
			return { progress: 100, currentRank, nextRank, currentPoints, nextThreshold };
		}

		const progress = ((currentPoints - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
		return {
			progress: Math.min(100, Math.max(0, progress)),
			currentRank,
			nextRank,
			currentPoints,
			nextThreshold
		};
	}

	$: rankData = calculateRankProgress();

	function formatDate(dateString: string) {
		const date = new Date(dateString);
		const now = new Date();
		const diff = now.getTime() - date.getTime();
		const minutes = Math.floor(diff / 60000);
		const hours = Math.floor(minutes / 60);

		if (minutes < 1) return 'Just now';
		if (minutes < 60) return `${minutes}m ago`;
		return `${hours}h ago`;
	}

	async function handleGameOver(event: CustomEvent<{ score: number; pointsEarned: number }>) {
		const { score, pointsEarned } = event.detail;
		lastScore = score;
		lastPoints = pointsEarned;

		// If user is logged in, save the score
		if ($user && $profile) {
			savingScore = true;
			scoreError = '';

			try {
				// Deduct a life
				const newLives = Math.max(0, $profile.lives - 1);

				// Get the access token from Supabase session
				const { data: { session } } = await supabase.auth.getSession();
				if (!session) {
					throw new Error('No active session');
				}

				const response = await fetch('/api/score', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${session.access_token}`
					},
					body: JSON.stringify({
						score,
						difficulty,
						pointsEarned
					})
				});

				const data = await response.json();

				if (!data.success) {
					throw new Error(data.error || 'Failed to save score');
				}

				// Update local profile with new data
				$profile = {
					...$profile,
					lives: newLives,
					lifetime_points: data.profile.lifetime_points,
					last_30_days_points: data.profile.last_30_days_points,
					lifetime_level: data.profile.lifetime_level,
					current_rank: data.profile.current_rank,
					[`high_score_${difficulty}` as keyof typeof $profile]: data.profile[`high_score_${difficulty}`]
				};

				// Reload recent scores
				await loadRecentScores();
			} catch (e: any) {
				scoreError = e.message || 'Failed to save score';
				console.error('Score save error:', e);
			} finally {
				savingScore = false;
			}
		}
	}

	function getDifficultyColor(diff: Difficulty) {
		if (diff === 'easy') return 'text-blue-600 dark:text-blue-400';
		if (diff === 'medium') return 'text-orange-600 dark:text-orange-400';
		return 'text-pink-600 dark:text-pink-400';
	}

	function getDifficultyBg(diff: Difficulty) {
		if (diff === 'easy') return 'bg-blue-500';
		if (diff === 'medium') return 'bg-orange-500';
		return 'bg-pink-500';
	}
</script>

<svelte:head>
	<title>Play {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} - Blue Balls</title>
</svelte:head>

<div class="min-h-screen p-4">
	<div class="max-w-4xl mx-auto">
		<!-- Header -->
		<div class="flex items-center justify-between mb-6">
			<a href="/" class="flex items-center gap-2 text-white bg-primary dark:bg-accent px-4 py-2 rounded-lg hover:opacity-80 transition">
				<ArrowLeft size={20} />
				Back to Home
			</a>

			<div class="text-right">
				<h1 class="text-2xl font-bold {getDifficultyColor(difficulty)}">
					{difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Mode
				</h1>
				<p class="text-sm dark:text-gray-300">
					Point Multiplier: {GAME_CONFIG[difficulty].pointMultiplier}x
				</p>
			</div>
		</div>

		<!-- Lives Display -->
		{#if $profile}
			<div class="card mb-6">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-4">
						<div class="flex items-center gap-2">
							<Heart size={24} class="text-red-500" />
							<span class="text-xl font-bold">Lives: {$profile.lives} / {$profile.max_lives}</span>
						</div>
						{#if $profile.lives < $profile.max_lives}
							<div class="flex items-center gap-2 bg-blue-500/20 dark:bg-blue-500/30 px-3 py-1 rounded-lg">
								<svg class="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
								</svg>
								<span class="text-sm font-semibold text-blue-600 dark:text-blue-400">Next: {livesRegen}</span>
							</div>
						{/if}
					</div>
					<div class="text-right">
						<p class="text-sm dark:text-gray-300">Level {$profile.lifetime_level}</p>
						<p class="text-sm dark:text-gray-300">{$profile.lifetime_points.toLocaleString()} total points</p>
					</div>
				</div>

				{#if $profile.lives === 0}
					<div class="mt-4 p-4 bg-red-500/20 border border-red-500 rounded-lg">
						<p class="text-red-500 font-bold text-center">
							Out of lives! Wait for regeneration or <a href="/subscribe" class="underline">upgrade your membership</a> for more lives.
						</p>
					</div>
				{/if}
			</div>
		{:else if !$user}
			<div class="card mb-6 bg-yellow-500/20 border border-yellow-500">
				<p class="text-center">
					<span class="font-bold">Guest Mode:</span> Your scores won't be saved.
					<a href="/auth/login" class="underline ml-2">Login to save scores!</a>
				</p>
			</div>
		{/if}

		<!-- Game Canvas -->
		<div class="card">
			{#if $profile && $profile.lives === 0}
				<div class="text-center py-20">
					<h2 class="text-3xl font-bold mb-4">No Lives Remaining</h2>
					<p class="mb-4 dark:text-gray-300">
						Your lives will regenerate at {$profile.lives_per_hour} per hour.
					</p>
					<a href="/subscribe" class="btn-primary inline-block">
						Get More Lives Now
					</a>
				</div>
			{:else}
				<GameCanvas {difficulty} on:gameover={handleGameOver} />

				{#if lastScore > 0}
					<div class="mt-6 p-4 {getDifficultyBg(difficulty)} bg-opacity-20 border-2 {getDifficultyBg(difficulty).replace('bg-', 'border-')} rounded-lg">
						<h3 class="font-bold text-lg text-center mb-2">Last Game Results</h3>
						<div class="grid grid-cols-2 gap-4 text-center">
							<div>
								<p class="text-2xl font-bold">{lastScore}</p>
								<p class="text-sm dark:text-gray-300">Score</p>
							</div>
							<div>
								<p class="text-2xl font-bold">{lastPoints}</p>
								<p class="text-sm dark:text-gray-300">Points Earned</p>
							</div>
						</div>

						{#if savingScore}
							<p class="text-center mt-4 text-sm">Saving score...</p>
						{/if}

						{#if scoreError}
							<p class="text-center mt-4 text-sm text-red-500">{scoreError}</p>
						{/if}
					</div>
				{/if}
			{/if}
		</div>

		<!-- Progress Bars & Stats Grid -->
		{#if $profile}
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
				<!-- Left Column: Progress -->
				<div class="space-y-6">
					<!-- Level Progress -->
					<div class="card">
						<div class="flex items-center justify-between mb-2">
							<h3 class="font-bold flex items-center gap-2">
								<TrendingUp size={20} class="text-primary" />
								Level Progress
							</h3>
							<span class="text-sm dark:text-gray-300">Level {$profile.lifetime_level} → {$profile.lifetime_level + 1}</span>
						</div>
						<div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
							<div
								class="bg-gradient-to-r from-primary to-secondary h-4 rounded-full transition-all duration-500"
								style="width: {calculateLevelProgress()}%"
							></div>
						</div>
						<p class="text-xs text-center mt-1 dark:text-gray-300">{calculateLevelProgress().toFixed(1)}% to next level</p>
					</div>

					<!-- Rank Progress -->
					<div class="card">
						<div class="flex items-center justify-between mb-2">
							<h3 class="font-bold flex items-center gap-2">
								<Trophy size={20} class="text-yellow-500" />
								Rank Progress
							</h3>
							<span class="text-sm dark:text-gray-300">
								<span style="color: {RANK_NAMES[rankData.currentRank].color}">{RANK_NAMES[rankData.currentRank].name}</span>
								{#if rankData.currentRank !== rankData.nextRank}
									→ <span style="color: {RANK_NAMES[rankData.nextRank].color}">{RANK_NAMES[rankData.nextRank].name}</span>
								{/if}
							</span>
						</div>
						<div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
							<div
								class="h-4 rounded-full transition-all duration-500"
								style="width: {rankData.progress}%; background: linear-gradient(to right, {RANK_NAMES[rankData.currentRank].color}, {RANK_NAMES[rankData.nextRank].color})"
							></div>
						</div>
						{#if rankData.currentRank !== rankData.nextRank}
							<p class="text-xs text-center mt-1 dark:text-gray-300">
								{rankData.currentPoints.toLocaleString()} / {rankData.nextThreshold.toLocaleString()} points (30-day)
							</p>
						{:else}
							<p class="text-xs text-center mt-1 dark:text-gray-300">Max Rank Achieved!</p>
						{/if}
					</div>

					<!-- High Scores -->
					<div class="card">
						<h3 class="font-bold mb-4">Your High Scores</h3>
						<div class="grid grid-cols-3 gap-2">
							<div class="text-center p-3 bg-blue-500/20 rounded-lg">
								<p class="text-xs text-blue-600 dark:text-blue-400 font-semibold">Easy</p>
								<p class="text-xl font-bold">{$profile.high_score_easy}</p>
							</div>
							<div class="text-center p-3 bg-orange-500/20 rounded-lg">
								<p class="text-xs text-orange-600 dark:text-orange-400 font-semibold">Medium</p>
								<p class="text-xl font-bold">{$profile.high_score_medium}</p>
							</div>
							<div class="text-center p-3 bg-pink-500/20 rounded-lg">
								<p class="text-xs text-pink-600 dark:text-pink-400 font-semibold">Hard</p>
								<p class="text-xl font-bold">{$profile.high_score_hard}</p>
							</div>
						</div>
					</div>
				</div>

				<!-- Right Column: Recent Scores -->
				<div class="card">
					<h3 class="font-bold mb-4">Recent Scores ({difficulty.charAt(0).toUpperCase() + difficulty.slice(1)})</h3>
					{#if recentScores.length === 0}
						<div class="text-center py-8">
							<p class="dark:text-gray-300">No scores yet. Play to set your first score!</p>
						</div>
					{:else}
						<div class="space-y-2">
							{#each recentScores as score, index}
								<div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-accent rounded-lg">
									<div class="flex items-center gap-3">
										<div class="w-8 h-8 rounded-full bg-primary dark:bg-secondary flex items-center justify-center text-white font-bold text-sm">
											{index + 1}
										</div>
										<div>
											<p class="font-semibold">{score.score} pts</p>
											<p class="text-xs dark:text-gray-400">{formatDate(score.created_at)}</p>
										</div>
									</div>
									<div class="text-right">
										<p class="text-sm text-green-600 dark:text-green-400">+{score.points_earned}</p>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</div>
