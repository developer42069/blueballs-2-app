<script lang="ts">
	import { onMount } from 'svelte';
	import { user } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import { Play, Trophy, Users, MessageCircle } from 'lucide-svelte';

	onMount(() => {
		// Redirect to easy mode on mount
		goto('/game/easy');
	});
</script>

<svelte:head>
	<title>Blue Balls - Protect Your Balls | blueballs.lol</title>
	<meta name="description" content="Play Blue Balls, a fun and challenging game where you protect your balls from pink obstacles. Try to beat the global high score!" />
</svelte:head>

<div class="min-h-screen flex flex-col items-center justify-center p-4">
	<div class="max-w-4xl w-full text-center space-y-8">
		<h1 class="font-rubik text-5xl md:text-7xl font-bold text-white mb-4" style="text-shadow: 3px 3px 0 #00008B, -3px -3px 0 #00008B, 3px -3px 0 #00008B, -3px 3px 0 #00008B;">
			BLUE BALLS
		</h1>

		<p class="text-2xl text-white font-bold">
			Redirecting to Easy Mode...
		</p>

		<div class="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
			<a href="/game/easy" class="btn-primary bg-primary dark:bg-accent border-2 border-secondary py-4">
				<Play class="inline mr-2" size={20} />
				Play Easy
			</a>
			<a href="/game/medium" class="btn-primary bg-orange-500 hover:bg-orange-600 py-4">
				<Play class="inline mr-2" size={20} />
				Play Medium
			</a>
			<a href="/game/hard" class="btn-primary py-4">
				<Play class="inline mr-2" size={20} />
				Play Hard
			</a>
		</div>

		{#if !$user}
			<div class="card max-w-md mx-auto">
				<h2 class="text-2xl font-bold mb-4">Save Your Scores!</h2>
				<p class="mb-4 dark:text-gray-300">
					Login to save your high scores, compete on leaderboards, and unlock premium features!
				</p>
				<a href="/auth/login" class="btn-primary inline-block">
					Login / Register
				</a>
			</div>
		{/if}

		<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
			<div class="card text-center">
				<Trophy class="mx-auto mb-3 text-yellow-500" size={48} />
				<h3 class="font-bold text-xl mb-2">Compete Globally</h3>
				<p class="text-sm dark:text-gray-300">Regional and global leaderboards to climb!</p>
			</div>
			<div class="card text-center">
				<Users class="mx-auto mb-3 text-blue-500" size={48} />
				<h3 class="font-bold text-xl mb-2">Play with Friends</h3>
				<p class="text-sm dark:text-gray-300">Invite friends and compete together!</p>
			</div>
			<div class="card text-center">
				<MessageCircle class="mx-auto mb-3 text-green-500" size={48} />
				<h3 class="font-bold text-xl mb-2">Global Chat</h3>
				<p class="text-sm dark:text-gray-300">Chat with players worldwide!</p>
			</div>
		</div>

		<div class="mt-8">
			<a href="https://ko-fi.com/G2G11BL86B" target="_blank" rel="noopener noreferrer">
				<img height="36" style="border:0px;height:36px;" src="https://storage.ko-fi.com/cdn/kofi6.png?v=6" alt="Buy Me a Coffee at ko-fi.com" />
			</a>
		</div>
	</div>
</div>
