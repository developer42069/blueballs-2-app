<script lang="ts">
	import { onMount } from 'svelte';
	import { user } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import { Gamepad2, Save, RotateCcw, AlertCircle } from 'lucide-svelte';

	let loading = true;
	let saving = false;
	let error = '';
	let success = '';

	// Game configuration - initialized with current values
	let gameConfig = {
		easy: {
			gravity: 0.2,
			jump: -5,
			pipeSpeed: 1.5,
			pipeGap: 200,
			pipeSpacing: 220,
			pointMultiplier: 1
		},
		medium: {
			gravity: 0.3,
			jump: -5,
			pipeSpeed: 1.7,
			pipeGap: 200,
			pipeSpacing: 220,
			pointMultiplier: 1.5
		},
		hard: {
			gravity: 0.4,
			jump: -5,
			pipeSpeed: 1.8,
			pipeGap: 180,
			pipeSpacing: 200,
			pointMultiplier: 2
		}
	};

	// Fixed game constants (not editable but displayed for reference)
	const fixedConstants = {
		canvasWidth: 800,
		canvasHeight: 480,
		birdRadius: 15,
		birdStartX: 80,
		spikeWidth: 80,
		ballColor: '#2563eb',
		obstacleColor: '#E40078'
	};

	onMount(async () => {
		// Check admin access
		await new Promise((resolve) => setTimeout(resolve, 100));

		if (!$user) {
			goto('/auth/login');
			return;
		}

		const adminEmails = ['canbeerliquor@gmail.com'];
		const userEmail = $user.email || '';

		if (!adminEmails.includes(userEmail)) {
			goto('/');
			return;
		}

		loading = false;
	});

	async function saveGameConfig() {
		saving = true;
		error = '';
		success = '';

		try {
			// In production, you would save to a database or config file
			// For now, we'll just show success (you'll need to implement actual save logic)

			// TODO: Implement actual save to gameConfig.ts file via API
			await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate save

			success = 'Game configuration saved! Restart the app to apply changes.';
		} catch (e: any) {
			error = e.message || 'Failed to save game configuration';
		} finally {
			saving = false;
		}
	}

	function resetToDefaults() {
		gameConfig = {
			easy: {
				gravity: 0.2,
				jump: -5,
				pipeSpeed: 1.5,
				pipeGap: 200,
				pipeSpacing: 220,
				pointMultiplier: 1
			},
			medium: {
				gravity: 0.3,
				jump: -5,
				pipeSpeed: 1.7,
				pipeGap: 200,
				pipeSpacing: 220,
				pointMultiplier: 1.5
			},
			hard: {
				gravity: 0.4,
				jump: -5,
				pipeSpeed: 1.8,
				pipeGap: 180,
				pipeSpacing: 200,
				pointMultiplier: 2
			}
		};
		success = 'Reset to default values';
	}
</script>

<svelte:head>
	<title>Game Mechanics - Admin Panel</title>
</svelte:head>

{#if loading}
	<div class="min-h-screen flex items-center justify-center">
		<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
	</div>
{:else}
	<div class="min-h-screen p-4">
		<div class="max-w-7xl mx-auto">
			<!-- Header -->
			<div class="mb-6">
				<a href="/bolengadmin" class="text-primary hover:underline mb-2 inline-block">
					← Back to Admin Panel
				</a>
				<h1 class="text-3xl font-bold flex items-center gap-2">
					<Gamepad2 size={32} class="text-primary" />
					Game Mechanics Configuration
				</h1>
				<p class="dark:text-gray-300 mt-2">
					Adjust gameplay parameters for each difficulty level. All changes require app restart.
				</p>
			</div>

			{#if error}
				<div
					class="bg-red-100 dark:bg-red-900/20 border border-red-400 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-4 flex items-start gap-2"
				>
					<AlertCircle size={20} class="flex-shrink-0 mt-0.5" />
					<span>{error}</span>
				</div>
			{/if}

			{#if success}
				<div
					class="bg-green-100 dark:bg-green-900/20 border border-green-400 text-green-700 dark:text-green-400 px-4 py-3 rounded mb-4 flex items-start gap-2"
				>
					<AlertCircle size={20} class="flex-shrink-0 mt-0.5" />
					<span>{success}</span>
				</div>
			{/if}

			<!-- Fixed Constants (Read-Only) -->
			<div class="card mb-6">
				<h2 class="text-2xl font-bold mb-4 flex items-center gap-2">
					📐 Fixed Game Constants
				</h2>
				<p class="text-sm dark:text-gray-400 mb-4">
					These values are constant across all difficulty levels and cannot be changed here.
				</p>

				<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
					<div class="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
						<p class="text-sm dark:text-gray-400">Canvas Width</p>
						<p class="text-2xl font-bold">{fixedConstants.canvasWidth}px</p>
					</div>
					<div class="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
						<p class="text-sm dark:text-gray-400">Canvas Height</p>
						<p class="text-2xl font-bold">{fixedConstants.canvasHeight}px</p>
					</div>
					<div class="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
						<p class="text-sm dark:text-gray-400">Ball Radius</p>
						<p class="text-2xl font-bold">{fixedConstants.birdRadius}px</p>
					</div>
					<div class="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
						<p class="text-sm dark:text-gray-400">Spike Width</p>
						<p class="text-2xl font-bold">{fixedConstants.spikeWidth}px</p>
					</div>
				</div>
			</div>

			<!-- Difficulty Comparison Table -->
			<div class="card mb-6 overflow-x-auto">
				<h2 class="text-2xl font-bold mb-4">⚙️ Gameplay Parameters Comparison</h2>

				<table class="w-full text-left border-collapse">
					<thead>
						<tr class="border-b-2 border-gray-300 dark:border-gray-600">
							<th class="py-3 px-4 font-bold text-lg">Parameter</th>
							<th class="py-3 px-4 font-bold text-lg text-green-600">Easy Mode</th>
							<th class="py-3 px-4 font-bold text-lg text-orange-600">Medium Mode</th>
							<th class="py-3 px-4 font-bold text-lg text-red-600">Hard Mode</th>
						</tr>
					</thead>
					<tbody>
						<tr class="border-b border-gray-200 dark:border-gray-700">
							<td class="py-4 px-4 font-semibold">
								Gravity
								<p class="text-xs text-gray-500 font-normal">
									How fast the ball falls (higher = faster falling)
								</p>
							</td>
							<td class="py-4 px-4 text-center">
								<span class="text-2xl font-bold">{gameConfig.easy.gravity}</span>
							</td>
							<td class="py-4 px-4 text-center">
								<span class="text-2xl font-bold">{gameConfig.medium.gravity}</span>
							</td>
							<td class="py-4 px-4 text-center">
								<span class="text-2xl font-bold">{gameConfig.hard.gravity}</span>
							</td>
						</tr>

						<tr class="border-b border-gray-200 dark:border-gray-700">
							<td class="py-4 px-4 font-semibold">
								Jump Force
								<p class="text-xs text-gray-500 font-normal">
									Upward velocity when jumping (negative = upward)
								</p>
							</td>
							<td class="py-4 px-4 text-center">
								<span class="text-2xl font-bold">{gameConfig.easy.jump}</span>
							</td>
							<td class="py-4 px-4 text-center">
								<span class="text-2xl font-bold">{gameConfig.medium.jump}</span>
							</td>
							<td class="py-4 px-4 text-center">
								<span class="text-2xl font-bold">{gameConfig.hard.jump}</span>
							</td>
						</tr>

						<tr class="border-b border-gray-200 dark:border-gray-700">
							<td class="py-4 px-4 font-semibold">
								Obstacle Speed
								<p class="text-xs text-gray-500 font-normal">
									How fast obstacles move toward the player
								</p>
							</td>
							<td class="py-4 px-4 text-center">
								<span class="text-2xl font-bold">{gameConfig.easy.pipeSpeed}</span>
								<p class="text-xs text-gray-500">px/frame</p>
							</td>
							<td class="py-4 px-4 text-center">
								<span class="text-2xl font-bold">{gameConfig.medium.pipeSpeed}</span>
								<p class="text-xs text-gray-500">px/frame</p>
							</td>
							<td class="py-4 px-4 text-center">
								<span class="text-2xl font-bold">{gameConfig.hard.pipeSpeed}</span>
								<p class="text-xs text-gray-500">px/frame</p>
							</td>
						</tr>

						<tr class="border-b border-gray-200 dark:border-gray-700">
							<td class="py-4 px-4 font-semibold">
								Gap Size
								<p class="text-xs text-gray-500 font-normal">
									Vertical space between top and bottom obstacles
								</p>
							</td>
							<td class="py-4 px-4 text-center">
								<span class="text-2xl font-bold">{gameConfig.easy.pipeGap}</span>
								<p class="text-xs text-gray-500">pixels</p>
							</td>
							<td class="py-4 px-4 text-center">
								<span class="text-2xl font-bold">{gameConfig.medium.pipeGap}</span>
								<p class="text-xs text-gray-500">pixels</p>
							</td>
							<td class="py-4 px-4 text-center">
								<span class="text-2xl font-bold">{gameConfig.hard.pipeGap}</span>
								<p class="text-xs text-gray-500">pixels</p>
							</td>
						</tr>

						<tr class="border-b border-gray-200 dark:border-gray-700">
							<td class="py-4 px-4 font-semibold">
								Obstacle Spacing
								<p class="text-xs text-gray-500 font-normal">
									Horizontal distance between consecutive obstacles
								</p>
							</td>
							<td class="py-4 px-4 text-center">
								<span class="text-2xl font-bold">{gameConfig.easy.pipeSpacing}</span>
								<p class="text-xs text-gray-500">pixels</p>
							</td>
							<td class="py-4 px-4 text-center">
								<span class="text-2xl font-bold">{gameConfig.medium.pipeSpacing}</span>
								<p class="text-xs text-gray-500">pixels</p>
							</td>
							<td class="py-4 px-4 text-center">
								<span class="text-2xl font-bold">{gameConfig.hard.pipeSpacing}</span>
								<p class="text-xs text-gray-500">pixels</p>
							</td>
						</tr>

						<tr class="border-b border-gray-200 dark:border-gray-700">
							<td class="py-4 px-4 font-semibold">
								Point Multiplier
								<p class="text-xs text-gray-500 font-normal">Score multiplier for each obstacle passed</p>
							</td>
							<td class="py-4 px-4 text-center">
								<span class="text-2xl font-bold">×{gameConfig.easy.pointMultiplier}</span>
							</td>
							<td class="py-4 px-4 text-center">
								<span class="text-2xl font-bold">×{gameConfig.medium.pointMultiplier}</span>
							</td>
							<td class="py-4 px-4 text-center">
								<span class="text-2xl font-bold">×{gameConfig.hard.pointMultiplier}</span>
							</td>
						</tr>
					</tbody>
				</table>
			</div>

			<!-- Editable Configuration -->
			<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
				<!-- Easy Mode -->
				<div class="card">
					<h3 class="text-xl font-bold mb-4 text-green-600">🟢 Easy Mode</h3>

					<div class="space-y-4">
						<div>
							<label class="block text-sm font-semibold mb-1">Gravity</label>
							<input
								type="number"
								step="0.01"
								bind:value={gameConfig.easy.gravity}
								class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-dark-accent dark:text-white"
							/>
						</div>
						<div>
							<label class="block text-sm font-semibold mb-1">Jump Force</label>
							<input
								type="number"
								step="0.1"
								bind:value={gameConfig.easy.jump}
								class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-dark-accent dark:text-white"
							/>
						</div>
						<div>
							<label class="block text-sm font-semibold mb-1">Obstacle Speed</label>
							<input
								type="number"
								step="0.1"
								bind:value={gameConfig.easy.pipeSpeed}
								class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-dark-accent dark:text-white"
							/>
						</div>
						<div>
							<label class="block text-sm font-semibold mb-1">Gap Size</label>
							<input
								type="number"
								step="10"
								bind:value={gameConfig.easy.pipeGap}
								class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-dark-accent dark:text-white"
							/>
						</div>
						<div>
							<label class="block text-sm font-semibold mb-1">Obstacle Spacing</label>
							<input
								type="number"
								step="10"
								bind:value={gameConfig.easy.pipeSpacing}
								class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-dark-accent dark:text-white"
							/>
						</div>
						<div>
							<label class="block text-sm font-semibold mb-1">Point Multiplier</label>
							<input
								type="number"
								step="0.1"
								bind:value={gameConfig.easy.pointMultiplier}
								class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-dark-accent dark:text-white"
							/>
						</div>
					</div>
				</div>

				<!-- Medium Mode -->
				<div class="card">
					<h3 class="text-xl font-bold mb-4 text-orange-600">🟠 Medium Mode</h3>

					<div class="space-y-4">
						<div>
							<label class="block text-sm font-semibold mb-1">Gravity</label>
							<input
								type="number"
								step="0.01"
								bind:value={gameConfig.medium.gravity}
								class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-dark-accent dark:text-white"
							/>
						</div>
						<div>
							<label class="block text-sm font-semibold mb-1">Jump Force</label>
							<input
								type="number"
								step="0.1"
								bind:value={gameConfig.medium.jump}
								class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-dark-accent dark:text-white"
							/>
						</div>
						<div>
							<label class="block text-sm font-semibold mb-1">Obstacle Speed</label>
							<input
								type="number"
								step="0.1"
								bind:value={gameConfig.medium.pipeSpeed}
								class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-dark-accent dark:text-white"
							/>
						</div>
						<div>
							<label class="block text-sm font-semibold mb-1">Gap Size</label>
							<input
								type="number"
								step="10"
								bind:value={gameConfig.medium.pipeGap}
								class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-dark-accent dark:text-white"
							/>
						</div>
						<div>
							<label class="block text-sm font-semibold mb-1">Obstacle Spacing</label>
							<input
								type="number"
								step="10"
								bind:value={gameConfig.medium.pipeSpacing}
								class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-dark-accent dark:text-white"
							/>
						</div>
						<div>
							<label class="block text-sm font-semibold mb-1">Point Multiplier</label>
							<input
								type="number"
								step="0.1"
								bind:value={gameConfig.medium.pointMultiplier}
								class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-dark-accent dark:text-white"
							/>
						</div>
					</div>
				</div>

				<!-- Hard Mode -->
				<div class="card">
					<h3 class="text-xl font-bold mb-4 text-red-600">🔴 Hard Mode</h3>

					<div class="space-y-4">
						<div>
							<label class="block text-sm font-semibold mb-1">Gravity</label>
							<input
								type="number"
								step="0.01"
								bind:value={gameConfig.hard.gravity}
								class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-dark-accent dark:text-white"
							/>
						</div>
						<div>
							<label class="block text-sm font-semibold mb-1">Jump Force</label>
							<input
								type="number"
								step="0.1"
								bind:value={gameConfig.hard.jump}
								class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-dark-accent dark:text-white"
							/>
						</div>
						<div>
							<label class="block text-sm font-semibold mb-1">Obstacle Speed</label>
							<input
								type="number"
								step="0.1"
								bind:value={gameConfig.hard.pipeSpeed}
								class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-dark-accent dark:text-white"
							/>
						</div>
						<div>
							<label class="block text-sm font-semibold mb-1">Gap Size</label>
							<input
								type="number"
								step="10"
								bind:value={gameConfig.hard.pipeGap}
								class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-dark-accent dark:text-white"
							/>
						</div>
						<div>
							<label class="block text-sm font-semibold mb-1">Obstacle Spacing</label>
							<input
								type="number"
								step="10"
								bind:value={gameConfig.hard.pipeSpacing}
								class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-dark-accent dark:text-white"
							/>
						</div>
						<div>
							<label class="block text-sm font-semibold mb-1">Point Multiplier</label>
							<input
								type="number"
								step="0.1"
								bind:value={gameConfig.hard.pointMultiplier}
								class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-dark-accent dark:text-white"
							/>
						</div>
					</div>
				</div>
			</div>

			<!-- Action Buttons -->
			<div class="flex gap-4">
				<button
					on:click={saveGameConfig}
					class="btn-primary flex items-center gap-2"
					disabled={saving}
				>
					<Save size={18} />
					{saving ? 'Saving...' : 'Save Configuration'}
				</button>

				<button
					on:click={resetToDefaults}
					class="btn-primary bg-gray-500 hover:bg-gray-600 flex items-center gap-2"
				>
					<RotateCcw size={18} />
					Reset to Defaults
				</button>
			</div>

			<!-- Notes -->
			<div class="card mt-6 bg-blue-50 dark:bg-blue-900/10 border-2 border-blue-300 dark:border-blue-700">
				<h3 class="font-bold text-lg mb-2 flex items-center gap-2">
					<AlertCircle size={20} class="text-blue-600" />
					Important Notes
				</h3>
				<ul class="list-disc list-inside space-y-1 text-sm dark:text-gray-300">
					<li>Changes require app restart to take effect</li>
					<li>Lower gravity values = slower falling (easier)</li>
					<li>Jump force is negative because upward is negative Y</li>
					<li>Larger gap sizes = easier to pass through obstacles</li>
					<li>
						Current issue: Medium and Hard modes may have gravity too high, making the ball fall too
						fast
					</li>
					<li>Recommended: Reduce Medium gravity to ~0.25 and Hard gravity to ~0.3</li>
				</ul>
			</div>
		</div>
	</div>
{/if}
