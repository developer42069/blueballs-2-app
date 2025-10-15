<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { supabase } from '$lib/supabase';
	import { user, profile } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import type { Friend, Profile } from '$lib/supabase';
	import { Users, MessageCircle, Send, UserPlus } from 'lucide-svelte';

	let friends: (Friend & { friend: Profile })[] = [];
	let selectedFriend: (Friend & { friend: Profile }) | null = null;
	let messages: any[] = [];
	let newMessage = '';
	let loading = true;
	let sending = false;
	let messagesContainer: HTMLDivElement;
	let messageSubscription: any = null;

	onMount(async () => {
		if (!$user) {
			goto('/auth/login');
			return;
		}

		await loadFriends();
		loading = false;
	});

	onDestroy(() => {
		if (messageSubscription) {
			messageSubscription.unsubscribe();
		}
	});

	async function loadFriends() {
		const { data: friendsData } = await supabase
			.from('friends')
			.select(`
				*,
				friend:friend_id (*)
			`)
			.eq('user_id', $user!.id);

		if (friendsData) {
			friends = friendsData as any;
			// Sort by username
			friends.sort((a, b) => a.friend.username.localeCompare(b.friend.username));
		}
	}

	async function selectFriend(friend: Friend & { friend: Profile }) {
		selectedFriend = friend;

		// Unsubscribe from previous friend's messages
		if (messageSubscription) {
			messageSubscription.unsubscribe();
		}

		await loadChatMessages(friend.friend_id);
		subscribeToFriendMessages(friend.friend_id);
	}

	async function loadChatMessages(friendId: string) {
		// Load messages between current user and selected friend
		const { data } = await supabase
			.from('direct_messages')
			.select('*')
			.or(`and(sender_id.eq.${$user!.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${$user!.id})`)
			.order('created_at', { ascending: true })
			.limit(100);

		if (data) {
			messages = data;
			setTimeout(scrollToBottom, 100);
		} else {
			messages = [];
		}
	}

	function subscribeToFriendMessages(friendId: string) {
		// Subscribe to new messages between current user and selected friend
		messageSubscription = supabase
			.channel(`dm-${$user!.id}-${friendId}`)
			.on('postgres_changes', {
				event: 'INSERT',
				schema: 'public',
				table: 'direct_messages',
				filter: `sender_id=eq.${friendId},receiver_id=eq.${$user!.id}`
			}, (payload) => {
				// Add incoming message from friend
				messages = [...messages, payload.new];
				setTimeout(scrollToBottom, 100);
			})
			.on('postgres_changes', {
				event: 'INSERT',
				schema: 'public',
				table: 'direct_messages',
				filter: `sender_id=eq.${$user!.id},receiver_id=eq.${friendId}`
			}, (payload) => {
				// Add outgoing message to friend (in case sent from another tab/device)
				const messageExists = messages.some(m => m.id === payload.new.id);
				if (!messageExists) {
					messages = [...messages, payload.new];
					setTimeout(scrollToBottom, 100);
				}
			})
			.subscribe();
	}

	async function sendMessage() {
		if (!$user || !selectedFriend || !newMessage.trim() || sending) return;

		sending = true;

		try {
			const { error } = await supabase
				.from('direct_messages')
				.insert({
					sender_id: $user.id,
					receiver_id: selectedFriend.friend_id,
					message: newMessage.trim()
				});

			if (error) throw error;

			newMessage = '';
			await loadChatMessages(selectedFriend.friend_id);
		} catch (err: any) {
			console.error('Failed to send message:', err);
		} finally {
			sending = false;
		}
	}

	function scrollToBottom() {
		if (messagesContainer) {
			messagesContainer.scrollTop = messagesContainer.scrollHeight;
		}
	}

	function formatTime(timestamp: string): string {
		const date = new Date(timestamp);
		const now = new Date();
		const diff = now.getTime() - date.getTime();
		const hours = diff / (1000 * 60 * 60);

		if (hours < 24) {
			return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
		} else if (hours < 48) {
			return 'Yesterday ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
		} else {
			return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
		}
	}

	function getRankColor(rank: string): string {
		const colors: Record<string, string> = {
			blue: 'bg-blue-500 dark:bg-blue-400',
			silver: 'bg-gray-500 dark:bg-gray-400',
			gold: 'bg-yellow-500 dark:bg-yellow-400',
			platinum: 'bg-gray-400 dark:bg-gray-300',
			diamond: 'bg-cyan-500 dark:bg-cyan-400',
			black: 'bg-black dark:bg-gray-200 dark:text-black'
		};
		return colors[rank] || 'bg-gray-600 dark:bg-gray-500';
	}
</script>

<svelte:head>
	<title>Chat with Friends - Blue Balls</title>
</svelte:head>

<div class="container mx-auto p-4 max-w-6xl">
	<div class="card">
		<h1 class="text-3xl font-bold mb-4 flex items-center gap-2">
			<MessageCircle /> Chat with Friends
		</h1>

		{#if loading}
			<div class="text-center py-8">
				<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
			</div>
		{:else if friends.length === 0}
			<div class="text-center py-12">
				<UserPlus size={48} class="mx-auto text-gray-400 dark:text-gray-600 mb-4" />
				<p class="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">You have no friends yet</p>
				<p class="text-gray-500 dark:text-gray-400 mb-4">Add friends to start chatting!</p>
				<a href="/friends" class="btn-primary inline-block">
					Go to Friends
				</a>
			</div>
		{:else}
			<!-- Two-column layout: Friends list + Chat -->
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				<!-- Friends List -->
				<div class="md:col-span-1 bg-gray-50 dark:bg-dark-secondary rounded-lg p-4 max-h-[600px] overflow-y-auto">
					<h2 class="font-bold mb-3 flex items-center gap-2">
						<Users size={18} /> Your Friends
					</h2>
					<div class="space-y-2">
						{#each friends as friend}
							<button
								on:click={() => selectFriend(friend)}
								class="w-full text-left p-3 rounded-lg transition {selectedFriend?.friend_id === friend.friend_id ? 'bg-secondary text-white' : 'bg-white dark:bg-dark hover:bg-gray-100 dark:hover:bg-gray-700'}"
							>
								<div class="flex items-center gap-2">
									<div class="font-semibold">{friend.friend.username}</div>
									{#if friend.friend.membership_tier === 'big'}
										<span>👑</span>
									{:else if friend.friend.membership_tier === 'mid'}
										<span>⭐</span>
									{/if}
								</div>
								<div class="text-xs opacity-70 mt-1">
									<span class="px-2 py-0.5 rounded-full text-white {getRankColor(friend.friend.current_rank)}">
										{friend.friend.current_rank}
									</span>
									Level {friend.friend.lifetime_level}
								</div>
							</button>
						{/each}
					</div>
				</div>

				<!-- Chat Area -->
				<div class="md:col-span-2">
					{#if selectedFriend}
						<div class="bg-gray-50 dark:bg-dark-secondary rounded-lg p-4 h-[600px] flex flex-col">
							<!-- Chat Header -->
							<div class="mb-4 pb-3 border-b dark:border-gray-700">
								<h2 class="font-bold text-lg flex items-center gap-2">
									<MessageCircle size={20} />
									Chat with {selectedFriend.friend.username}
									{#if selectedFriend.friend.membership_tier === 'big'}
										<span>👑</span>
									{:else if selectedFriend.friend.membership_tier === 'mid'}
										<span>⭐</span>
									{/if}
								</h2>
							</div>

							<!-- Messages -->
							<div
								bind:this={messagesContainer}
								class="flex-1 overflow-y-auto mb-4 space-y-3"
							>
								{#if messages.length === 0}
									<div class="text-center py-12 text-gray-500">
										<p>No messages yet. Start the conversation!</p>
									</div>
								{:else}
									{#each messages as message}
										<div class="flex {message.sender_id === $user?.id ? 'justify-end' : 'justify-start'}">
											<div class="max-w-[70%] {message.sender_id === $user?.id ? 'bg-secondary text-white' : 'bg-white dark:bg-dark'} rounded-lg p-3 shadow">
												<p class="text-sm break-words">{message.message}</p>
												<p class="text-xs opacity-70 mt-1">
													{formatTime(message.created_at)}
												</p>
											</div>
										</div>
									{/each}
								{/if}
							</div>

							<!-- Message Input -->
							<form on:submit|preventDefault={sendMessage} class="flex gap-2">
								<input
									type="text"
									bind:value={newMessage}
									placeholder="Type your message..."
									disabled={sending}
									maxlength="500"
									class="input flex-1"
								/>
								<button
									type="submit"
									disabled={!newMessage.trim() || sending}
									class="btn-primary px-6 disabled:opacity-50 disabled:cursor-not-allowed"
								>
									<Send size={20} />
								</button>
							</form>
						</div>
					{:else}
						<div class="bg-gray-50 dark:bg-dark-secondary rounded-lg p-4 h-[600px] flex items-center justify-center">
							<div class="text-center text-gray-500">
								<MessageCircle size={48} class="mx-auto mb-4 opacity-50" />
								<p class="text-lg">Select a friend to start chatting</p>
							</div>
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</div>
