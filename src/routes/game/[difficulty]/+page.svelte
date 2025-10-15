<script lang="ts">
	import { page } from '$app/stores';
	import { user, profile } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabase';
	import GameCanvas from '$lib/components/GameCanvas.svelte';
	import { GAME_CONFIG, type Difficulty } from '$lib/utils/gameConfig';
	import { Heart, ArrowLeft } from 'lucide-svelte';

	$: difficulty = $page.params.difficulty as Difficulty;
	$: isValidDifficulty = ['easy', 'medium', 'hard'].includes(difficulty);

	let savingScore = false;
	let scoreError = '';
	let lastScore = 0;
	let lastPoints = 0;

	// Redirect to home if invalid difficulty
	$: if (!isValidDifficulty) {
		goto('/');
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
					<div class="flex items-center gap-2">
						<Heart size={24} class="text-red-500" />
						<span class="text-xl font-bold">Lives: {$profile.lives} / {$profile.max_lives}</span>
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

		<!-- High Score Display -->
		{#if $profile}
			<div class="card mt-6">
				<h3 class="font-bold mb-4">Your High Scores</h3>
				<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div class="text-center p-4 bg-blue-500/20 rounded-lg">
						<p class="text-sm text-blue-600 dark:text-blue-400 font-semibold">Easy</p>
						<p class="text-2xl font-bold">{$profile.high_score_easy}</p>
					</div>
					<div class="text-center p-4 bg-orange-500/20 rounded-lg">
						<p class="text-sm text-orange-600 dark:text-orange-400 font-semibold">Medium</p>
						<p class="text-2xl font-bold">{$profile.high_score_medium}</p>
					</div>
					<div class="text-center p-4 bg-pink-500/20 rounded-lg">
						<p class="text-sm text-pink-600 dark:text-pink-400 font-semibold">Hard</p>
						<p class="text-2xl font-bold">{$profile.high_score_hard}</p>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
