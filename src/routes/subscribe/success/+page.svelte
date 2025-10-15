<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { CheckCircle, Sparkles, Crown, Zap, Share2, Play } from 'lucide-svelte';

	let tier = 'mid'; // default
	let autoRedirect = true;
	let countdown = 5;

	onMount(() => {
		// Get tier from URL query parameter
		tier = $page.url.searchParams.get('tier') || 'mid';

		// Countdown timer
		const interval = setInterval(() => {
			countdown--;
			if (countdown <= 0) {
				clearInterval(interval);
				if (autoRedirect) {
					goto('/');
				}
			}
		}, 1000);

		return () => clearInterval(interval);
	});

	function handleShare() {
		const text = tier === 'big'
			? "🎮 Just upgraded to Blue Balls Big! Unlimited lives, here I come! 🏀💙"
			: "🎮 Just upgraded to Blue Balls Mid! More lives, more fun! 🏀⚡";
		const url = 'https://blueballs.lol';

		if (navigator.share) {
			navigator.share({
				title: 'Blue Balls - Premium Upgrade!',
				text: text,
				url: url
			}).catch(() => {
				// Fallback: copy to clipboard
				navigator.clipboard.writeText(`${text} ${url}`);
				alert('Link copied to clipboard!');
			});
		} else {
			// Fallback: copy to clipboard
			navigator.clipboard.writeText(`${text} ${url}`);
			alert('Link copied to clipboard! Share it with your friends!');
		}
	}

	function playNow() {
		autoRedirect = false;
		goto('/');
	}
</script>

<svelte:head>
	<title>Welcome to {tier === 'big' ? 'Big' : 'Mid'} - Blue Balls</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary via-secondary to-pink-500">
	<div class="card max-w-lg w-full text-center bg-white/95 dark:bg-dark-secondary/95 backdrop-blur">
		<div class="mb-6">
			<div class="w-24 h-24 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center animate-bounce">
				{#if tier === 'big'}
					<Crown size={56} class="text-yellow-500" />
				{:else}
					<Zap size={56} class="text-orange-500" />
				{/if}
			</div>
		</div>

		<h1 class="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
			{#if tier === 'big'}
				Congratulations!<br>You're now a Blue Balls Big! 👑
			{:else}
				Awesome!<br>You're now a Blue Balls Mid! ⚡
			{/if}
		</h1>

		<div class="mb-6 p-4 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-lg">
			<p class="text-xl font-bold mb-2 dark:text-gray-200 flex items-center justify-center gap-2">
				<Sparkles size={24} class="text-yellow-500 animate-pulse" />
				Your Premium Benefits
				<Sparkles size={24} class="text-yellow-500 animate-pulse" />
			</p>
			<ul class="text-left text-sm space-y-2 dark:text-gray-300 max-w-sm mx-auto">
				{#if tier === 'big'}
					<li class="flex items-center gap-2">
						<CheckCircle size={18} class="text-green-500 flex-shrink-0" />
						<span class="font-bold">UNLIMITED LIVES!</span>
					</li>
					<li class="flex items-center gap-2">
						<CheckCircle size={18} class="text-green-500 flex-shrink-0" />
						<span>No daily limits - play as much as you want</span>
					</li>
					<li class="flex items-center gap-2">
						<CheckCircle size={18} class="text-green-500 flex-shrink-0" />
						<span>Chat cooldown: Only 1 minute</span>
					</li>
					<li class="flex items-center gap-2">
						<CheckCircle size={18} class="text-green-500 flex-shrink-0" />
						<span>Custom profile picture</span>
					</li>
					<li class="flex items-center gap-2">
						<CheckCircle size={18} class="text-green-500 flex-shrink-0" />
						<span>Exclusive Big badge & crown</span>
					</li>
				{:else}
					<li class="flex items-center gap-2">
						<CheckCircle size={18} class="text-green-500 flex-shrink-0" />
						<span class="font-bold">40 lives per hour!</span>
					</li>
					<li class="flex items-center gap-2">
						<CheckCircle size={18} class="text-green-500 flex-shrink-0" />
						<span>Max 1000 lives per day</span>
					</li>
					<li class="flex items-center gap-2">
						<CheckCircle size={18} class="text-green-500 flex-shrink-0" />
						<span>Chat cooldown: 3 minutes</span>
					</li>
					<li class="flex items-center gap-2">
						<CheckCircle size={18} class="text-green-500 flex-shrink-0" />
						<span>Custom profile picture</span>
					</li>
					<li class="flex items-center gap-2">
						<CheckCircle size={18} class="text-green-500 flex-shrink-0" />
						<span>Priority support</span>
					</li>
				{/if}
			</ul>
		</div>

		<div class="flex flex-col sm:flex-row gap-3 mb-4">
			<button
				on:click={playNow}
				class="btn-primary bg-gradient-to-r from-primary to-secondary hover:opacity-90 flex items-center justify-center gap-2 flex-1"
			>
				<Play size={20} />
				Start Playing Now!
			</button>
			<button
				on:click={handleShare}
				class="btn-primary bg-gradient-to-r from-pink-500 to-purple-500 hover:opacity-90 flex items-center justify-center gap-2 flex-1"
			>
				<Share2 size={20} />
				Share with Friends
			</button>
		</div>

		<div class="text-sm dark:text-gray-500">
			{autoRedirect ? `Auto-redirecting in ${countdown} seconds...` : 'Redirecting...'}
		</div>
	</div>
</div>
