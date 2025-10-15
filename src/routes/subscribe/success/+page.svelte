<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { CheckCircle, Sparkles } from 'lucide-svelte';

	onMount(() => {
		// Redirect to homepage after 3 seconds
		const timer = setTimeout(() => {
			goto('/');
		}, 3000);

		return () => clearTimeout(timer);
	});
</script>

<svelte:head>
	<title>Subscription Successful - Blue Balls</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary via-secondary to-pink-500">
	<div class="card max-w-md w-full text-center bg-white/95 dark:bg-dark-secondary/95 backdrop-blur">
		<div class="mb-6">
			<div class="w-20 h-20 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center animate-bounce">
				<CheckCircle size={48} class="text-green-500" />
			</div>
		</div>

		<h1 class="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
			Welcome to Premium!
		</h1>

		<p class="text-xl mb-2 flex items-center justify-center gap-2 dark:text-gray-200">
			<Sparkles size={24} class="text-yellow-500 animate-pulse" />
			Your subscription is now active
			<Sparkles size={24} class="text-yellow-500 animate-pulse" />
		</p>

		<p class="text-sm dark:text-gray-400 mb-6">
			Enjoy your enhanced gaming experience with more lives and exclusive features!
		</p>

		<div class="text-xs dark:text-gray-500">
			Redirecting to homepage in 3 seconds...
		</div>
	</div>
</div>
