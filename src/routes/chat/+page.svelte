<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { supabase } from '$lib/supabase';
	import { user, profile } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import type { ChatMessage } from '$lib/supabase';
	import { Send, AlertCircle } from 'lucide-svelte';
	import { analytics } from '$lib/analytics';

	let messages: (ChatMessage & { profiles: any })[] = [];
	let newMessage = '';
	let loading = true;
	let sending = false;
	let error = '';
	let canSendMessage = true;
	let cooldownSeconds = 0;
	let messagesContainer: HTMLDivElement;

	let subscription: any;

	onMount(async () => {
		if (!$user) {
			goto('/auth/login');
			return;
		}

		await loadMessages();
		subscribeToMessages();
		checkCooldown();
	});

	onDestroy(() => {
		if (subscription) {
			subscription.unsubscribe();
		}
	});

	async function loadMessages() {
		const { data, error: err } = await supabase
			.from('chat_messages')
			.select(`
				*,
				profiles:user_id (
					id,
					username,
					membership_tier,
					current_rank
				)
			`)
			.order('created_at', { ascending: false })
			.limit(50);

		if (data) {
			messages = data.reverse();
			setTimeout(scrollToBottom, 100);
		}
		loading = false;
	}

	function subscribeToMessages() {
		subscription = supabase
			.channel('chat_messages')
			.on('postgres_changes', {
				event: 'INSERT',
				schema: 'public',
				table: 'chat_messages'
			}, async (payload) => {
				// Check if message already exists (to prevent duplicates from our own sends)
				const messageExists = messages.some(m => m.id === payload.new.id);
				if (messageExists) return;

				// Load the profile data for the new message
				const { data: profileData } = await supabase
					.from('profiles')
					.select('id, username, membership_tier, current_rank')
					.eq('id', payload.new.user_id)
					.single();

				const newMsg = {
					...payload.new as ChatMessage,
					profiles: profileData
				};

				messages = [...messages, newMsg];
				setTimeout(scrollToBottom, 100);
			})
			.subscribe();
	}

	async function checkCooldown() {
		if (!$user) return;

		const { data } = await supabase
			.from('chat_rate_limits')
			.select('*')
			.eq('user_id', $user.id)
			.single();

		if (data) {
			const cooldown = getCooldownForTier($profile?.membership_tier || 'free');
			const lastMessageTime = new Date(data.last_message_at).getTime();
			const now = Date.now();
			const timeSince = (now - lastMessageTime) / 1000;

			if (timeSince < cooldown) {
				canSendMessage = false;
				cooldownSeconds = Math.ceil(cooldown - timeSince);
				startCooldownTimer();
			}
		}
	}

	function getCooldownForTier(tier: string): number {
		switch (tier) {
			case 'big': return 60;
			case 'mid': return 180;
			default: return 300;
		}
	}

	function startCooldownTimer() {
		const interval = setInterval(() => {
			cooldownSeconds--;
			if (cooldownSeconds <= 0) {
				canSendMessage = true;
				clearInterval(interval);
			}
		}, 1000);
	}

	async function sendMessage() {
		if (!$user || !newMessage.trim() || !canSendMessage || sending) return;

		sending = true;
		error = '';

		const messageText = newMessage.trim();
		newMessage = ''; // Clear input immediately for better UX

		try {
			// Insert message
			const { data: insertedMessage, error: insertError } = await supabase
				.from('chat_messages')
				.insert({
					user_id: $user.id,
					message: messageText
				})
				.select()
				.single();

			if (insertError) throw insertError;

			// Optimistically add the message to the UI immediately
			if (insertedMessage) {
				const newMsg = {
					...insertedMessage,
					profiles: {
						id: $profile?.id,
						username: $profile?.username,
						membership_tier: $profile?.membership_tier,
						current_rank: $profile?.current_rank
					}
				};
				messages = [...messages, newMsg];
				setTimeout(scrollToBottom, 100);
			}

			// Update rate limit
			const { error: rateLimitError } = await supabase
				.from('chat_rate_limits')
				.upsert({
					user_id: $user.id,
					last_message_at: new Date().toISOString(),
					message_count: 1
				});

			if (rateLimitError) throw rateLimitError;

			canSendMessage = false;
			cooldownSeconds = getCooldownForTier($profile?.membership_tier || 'free');
			startCooldownTimer();

			// Track message sent
			analytics.sendMessage('global');
		} catch (err: any) {
			error = err.message || 'Failed to send message';
			newMessage = messageText; // Restore message on error
		} finally {
			sending = false;
		}
	}

	function scrollToBottom() {
		if (messagesContainer) {
			messagesContainer.scrollTop = messagesContainer.scrollHeight;
		}
	}

	function getRankColor(rank: string): string {
		const colors: Record<string, string> = {
			blue: 'text-blue-500 dark:text-blue-300',
			silver: 'text-gray-500 dark:text-gray-300',
			gold: 'text-yellow-500 dark:text-yellow-400',
			platinum: 'text-gray-400 dark:text-gray-200',
			diamond: 'text-cyan-500 dark:text-cyan-300',
			black: 'text-black dark:text-white'
		};
		return colors[rank] || 'text-gray-600 dark:text-gray-400';
	}

	function getTierBadge(tier: string): string {
		switch (tier) {
			case 'big': return '👑';
			case 'mid': return '⭐';
			default: return '';
		}
	}

	function formatTime(timestamp: string): string {
		const date = new Date(timestamp);
		return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	}
</script>

<svelte:head>
	<title>Global Chat - Blue Balls</title>
</svelte:head>

<div class="container mx-auto p-4 max-w-4xl">
	<div class="card">
		<h1 class="text-3xl font-bold mb-4">Global Chat</h1>

		<div class="mb-4 p-4 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
			<p class="text-sm dark:text-gray-300">
				<strong>Chat Rules:</strong> Be respectful. Messages are deleted after 3 hours.
				{#if $profile}
					<br />Your cooldown:
					{#if $profile.membership_tier === 'free'}
						5 minutes (Free)
					{:else if $profile.membership_tier === 'mid'}
						3 minutes (Mid) ⭐
					{:else}
						1 minute (Big) 👑
					{/if}
				{/if}
			</p>
		</div>

		<!-- Messages Container -->
		<div
			bind:this={messagesContainer}
			class="h-96 overflow-y-auto mb-4 space-y-3 bg-gray-50 dark:bg-dark p-4 rounded-lg"
		>
			{#if loading}
				<div class="text-center py-8">
					<p>Loading messages...</p>
				</div>
			{:else if messages.length === 0}
				<div class="text-center py-8 text-gray-500">
					<p>No messages yet. Be the first to chat!</p>
				</div>
			{:else}
				{#each messages as message}
					<div class="flex gap-3 {message.user_id === $user?.id ? 'justify-end' : 'justify-start'}">
						<div class="max-w-[70%] {message.user_id === $user?.id ? 'bg-secondary text-white' : 'bg-white dark:bg-dark-secondary'} rounded-lg p-3 shadow">
							<div class="flex items-center gap-2 mb-1">
								<span class="font-bold text-sm {getRankColor(message.profiles?.current_rank || 'blue')}">
									{message.profiles?.username || 'Unknown'}
								</span>
								{#if message.profiles?.membership_tier}
									<span class="text-xs">{getTierBadge(message.profiles.membership_tier)}</span>
								{/if}
								<span class="text-xs opacity-70 ml-auto">
									{formatTime(message.created_at)}
								</span>
							</div>
							<p class="text-sm break-words">{message.message}</p>
						</div>
					</div>
				{/each}
			{/if}
		</div>

		<!-- Message Input -->
		{#if error}
			<div class="mb-3 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg flex items-center gap-2">
				<AlertCircle size={20} />
				<span>{error}</span>
			</div>
		{/if}

		<form on:submit|preventDefault={sendMessage} class="flex gap-2">
			<input
				type="text"
				bind:value={newMessage}
				placeholder={canSendMessage ? 'Type your message...' : `Wait ${cooldownSeconds}s...`}
				disabled={!canSendMessage || sending}
				maxlength="500"
				class="input flex-1"
			/>
			<button
				type="submit"
				disabled={!canSendMessage || !newMessage.trim() || sending}
				class="btn-primary px-6 disabled:opacity-50 disabled:cursor-not-allowed"
			>
				<Send size={20} />
			</button>
		</form>

		{#if !canSendMessage && cooldownSeconds > 0}
			<p class="text-sm text-gray-600 dark:text-gray-400 mt-2">
				Next message in: {cooldownSeconds}s
			</p>
		{/if}
	</div>
</div>
