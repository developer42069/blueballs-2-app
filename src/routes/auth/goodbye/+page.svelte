<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabase';
	import { Heart, Sparkles } from 'lucide-svelte';

	onMount(() => {
		// Sign out the user
		(async () => {
			try {
				const { error } = await supabase.auth.signOut();

				if (error) {
					console.error('Logout error:', error);
				}
			} catch (e) {
				console.error('Logout failed:', e);
			}
		})();

		// Redirect to homepage after 3 seconds with full page reload
		// This ensures all cached state and data is completely cleared
		const timer = setTimeout(() => {
			window.location.href = '/';
		}, 3000);

		return () => clearTimeout(timer);
	});
</script>

<svelte:head>
	<title>See You Soon - Blue Balls</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-500 via-pink-500 to-secondary animate-gradient">
	<div class="text-center">
		<div class="mb-8 animate-pulse">
			<div class="w-32 h-32 mx-auto rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
				<Heart size={64} class="text-white" />
			</div>
		</div>

		<div class="space-y-4 animate-fade-in">
			<h1 class="text-4xl md:text-5xl font-bold text-white drop-shadow-lg">
				Sad to see you go!
			</h1>
			<p class="text-xl md:text-2xl text-white/90 flex items-center justify-center gap-2 flex-wrap">
				<Sparkles size={24} class="animate-pulse" />
				<span class="px-2">Remember to come back when your balls are refilled</span>
				<Sparkles size={24} class="animate-pulse" />
			</p>
		</div>

		<div class="mt-12">
			<div class="flex justify-center gap-2">
				<div class="w-2 h-2 bg-white rounded-full animate-bounce" style="animation-delay: 0ms"></div>
				<div class="w-2 h-2 bg-white rounded-full animate-bounce" style="animation-delay: 150ms"></div>
				<div class="w-2 h-2 bg-white rounded-full animate-bounce" style="animation-delay: 300ms"></div>
			</div>
			<p class="text-white/70 text-sm mt-4">See you next time...</p>
		</div>
	</div>
</div>

<style>
	@keyframes gradient {
		0% { background-position: 0% 50%; }
		50% { background-position: 100% 50%; }
		100% { background-position: 0% 50%; }
	}

	.animate-gradient {
		background-size: 200% 200%;
		animation: gradient 3s ease infinite;
	}

	@keyframes fade-in {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.animate-fade-in {
		animation: fade-in 0.8s ease-out;
	}
</style>
