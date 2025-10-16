<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase, type Profile } from '$lib/supabase';
	import { user } from '$lib/stores/auth';
	import { Trophy, Medal, Award, Globe } from 'lucide-svelte';
	import { analytics } from '$lib/analytics';

	type LeaderboardEntry = Profile & { rank: number };

	let selectedRegion: 'global' | 'asia' | 'europe' | 'north_america' | 'south_america' | 'africa' | 'oceania' = 'global';
	let selectedMode: 'all_time' | 'last_30_days' = 'all_time';
	let selectedDifficulty: 'easy' | 'medium' | 'hard' = 'easy';
	let leaderboardData: LeaderboardEntry[] = [];
	let loading = true;

	const regions = [
		{ value: 'global', label: 'Global', icon: Globe },
		{ value: 'asia', label: 'Asia' },
		{ value: 'europe', label: 'Europe' },
		{ value: 'north_america', label: 'North America' },
		{ value: 'south_america', label: 'South America' },
		{ value: 'africa', label: 'Africa' },
		{ value: 'oceania', label: 'Oceania' }
	];

	onMount(() => {
		loadLeaderboard();
	});

	$: {
		// Reload when filters change
		selectedRegion;
		selectedMode;
		selectedDifficulty;
		loadLeaderboard();
	}

	async function loadLeaderboard() {
		loading = true;

		try {
			// Track leaderboard view with type
			const viewType = selectedRegion === 'global' ? 'global' : 'regional';
			analytics.viewLeaderboard(viewType as 'global' | 'regional' | 'friends');

			let query = supabase
				.from('profiles')
				.select('*');

			// Filter by region if not global
			if (selectedRegion !== 'global') {
				query = query.eq('region', selectedRegion);
			}

			// Order by score for selected difficulty
			query = query.order(`high_score_${selectedDifficulty}`, { ascending: false });

			// Limit to top 100
			query = query.limit(100);

			const { data, error } = await query;

			if (error) throw error;

			// Add rank numbers
			leaderboardData = (data || []).map((entry, index) => ({
				...entry,
				rank: index + 1
			}));
		} catch (e) {
			console.error('Failed to load leaderboard:', e);
			leaderboardData = [];
		} finally {
			loading = false;
		}
	}

	function getRankIcon(rank: number) {
		if (rank === 1) return '🥇';
		if (rank === 2) return '🥈';
		if (rank === 3) return '🥉';
		return rank;
	}

	function getRankColor(rankName: string) {
		const colors: Record<string, string> = {
			blue: 'text-blue-600 dark:text-blue-400',
			silver: 'text-gray-400',
			gold: 'text-yellow-500',
			platinum: 'text-gray-300',
			diamond: 'text-cyan-400',
			black: 'text-gray-900 dark:text-gray-200'
		};
		return colors[rankName] || 'text-gray-500';
	}

	function getScore(entry: Profile) {
		if (selectedDifficulty === 'easy') return entry.high_score_easy;
		if (selectedDifficulty === 'medium') return entry.high_score_medium;
		return entry.high_score_hard;
	}
</script>

<svelte:head>
	<title>Leaderboard - Blue Balls</title>
</svelte:head>

<div class="min-h-screen p-4">
	<div class="max-w-6xl mx-auto">
		<div class="text-center mb-8">
			<h1 class="text-4xl font-bold mb-2 flex items-center justify-center gap-2">
				<Trophy size={40} class="text-yellow-500" />
				Leaderboard
			</h1>
			<p class="dark:text-gray-300">Compete with players from around the world!</p>
		</div>

		<!-- Filters -->
		<div class="card mb-6">
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				<!-- Region Filter -->
				<div>
					<label class="block text-sm font-medium mb-2 dark:text-gray-300">Region</label>
					<select
						bind:value={selectedRegion}
						class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary dark:bg-dark-accent dark:border-gray-600 dark:text-white"
					>
						{#each regions as region}
							<option value={region.value}>{region.label}</option>
						{/each}
					</select>
				</div>

				<!-- Difficulty Filter -->
				<div>
					<label class="block text-sm font-medium mb-2 dark:text-gray-300">Difficulty</label>
					<select
						bind:value={selectedDifficulty}
						class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary dark:bg-dark-accent dark:border-gray-600 dark:text-white"
					>
						<option value="easy">Easy</option>
						<option value="medium">Medium</option>
						<option value="hard">Hard</option>
					</select>
				</div>

				<!-- Mode Filter -->
				<div>
					<label class="block text-sm font-medium mb-2 dark:text-gray-300">Timeframe</label>
					<select
						bind:value={selectedMode}
						class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary dark:bg-dark-accent dark:border-gray-600 dark:text-white"
					>
						<option value="all_time">All Time High Scores</option>
						<option value="last_30_days">Last 30 Days Points</option>
					</select>
				</div>
			</div>
		</div>

		<!-- Leaderboard Table -->
		<div class="card overflow-hidden">
			{#if loading}
				<div class="text-center py-12">
					<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
					<p class="dark:text-gray-300">Loading leaderboard...</p>
				</div>
			{:else if leaderboardData.length === 0}
				<div class="text-center py-12">
					<Trophy size={48} class="mx-auto mb-4 text-gray-400" />
					<p class="text-xl font-bold mb-2">No players yet</p>
					<p class="dark:text-gray-300">Be the first to set a score!</p>
				</div>
			{:else}
				<div class="overflow-x-auto">
					<table class="w-full">
						<thead class="bg-primary dark:bg-accent text-white">
							<tr>
								<th class="px-4 py-3 text-left">Rank</th>
								<th class="px-4 py-3 text-left">Player</th>
								<th class="px-4 py-3 text-left">Score</th>
								<th class="px-4 py-3 text-left">Level</th>
								<th class="px-4 py-3 text-left">Rank Badge</th>
								<th class="px-4 py-3 text-left">Country</th>
							</tr>
						</thead>
						<tbody>
							{#each leaderboardData as entry, i}
								<tr
									class="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-dark-accent/50 transition {entry.id === $user?.id ? 'bg-primary/10 dark:bg-secondary/10' : ''}"
								>
									<td class="px-4 py-3">
										<span class="text-xl font-bold">
											{getRankIcon(entry.rank)}
										</span>
									</td>
									<td class="px-4 py-3">
										<a
											href="/profile/{entry.id}"
											class="font-semibold hover:text-primary dark:hover:text-secondary transition"
										>
											{entry.username}
											{#if entry.id === $user?.id}
												<span class="text-xs text-primary dark:text-secondary">(You)</span>
											{/if}
										</a>
									</td>
									<td class="px-4 py-3 font-bold">
										{getScore(entry).toLocaleString()}
									</td>
									<td class="px-4 py-3">
										Lv. {entry.lifetime_level}
									</td>
									<td class="px-4 py-3">
										<span class="font-semibold {getRankColor(entry.current_rank)}">
											{entry.current_rank.toUpperCase()}
										</span>
									</td>
									<td class="px-4 py-3">
										{entry.country_code}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>

		<!-- Info Section -->
		<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
			<div class="card text-center">
				<Trophy class="mx-auto mb-2 text-yellow-500" size={32} />
				<h3 class="font-bold">Compete</h3>
				<p class="text-sm dark:text-gray-300">Climb the ranks and become the best!</p>
			</div>
			<div class="card text-center">
				<Medal class="mx-auto mb-2 text-blue-500" size={32} />
				<h3 class="font-bold">Earn Points</h3>
				<p class="text-sm dark:text-gray-300">Every game earns you points to level up!</p>
			</div>
			<div class="card text-center">
				<Award class="mx-auto mb-2 text-purple-500" size={32} />
				<h3 class="font-bold">Unlock Ranks</h3>
				<p class="text-sm dark:text-gray-300">Progress from Blue to Black rank!</p>
			</div>
		</div>
	</div>
</div>
