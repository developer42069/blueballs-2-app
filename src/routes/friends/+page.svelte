<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabase';
	import { user, profile } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import type { Friend, Profile } from '$lib/supabase';
	import { UserPlus, Mail, Trophy, TrendingUp } from 'lucide-svelte';

	let friends: (Friend & { friend: Profile })[] = [];
	let friendsWithScores: any[] = [];
	let inviteEmail = '';
	let loading = true;
	let inviting = false;
	let inviteSuccess = '';
	let inviteError = '';

	onMount(async () => {
		if (!$user) {
			goto('/auth/login');
			return;
		}

		await loadFriends();
		loading = false;
	});

	async function loadFriends() {
		// Load friends
		const { data: friendsData } = await supabase
			.from('friends')
			.select(`
				*,
				friend:friend_id (*)
			`)
			.eq('user_id', $user!.id);

		if (friendsData) {
			friends = friendsData as any;

			// Sort friends by rank and level
			friendsWithScores = [...friends].sort((a, b) => {
				// Compare by last_30_days_points first
				if (b.friend.last_30_days_points !== a.friend.last_30_days_points) {
					return b.friend.last_30_days_points - a.friend.last_30_days_points;
				}
				// Then by lifetime level
				return b.friend.lifetime_level - a.friend.lifetime_level;
			});

			// Add user's own position
			if ($profile) {
				const userPosition = {
					isCurrentUser: true,
					friend: $profile
				};

				// Find where to insert current user
				let inserted = false;
				for (let i = 0; i < friendsWithScores.length; i++) {
					const friend = friendsWithScores[i].friend;
					if ($profile.last_30_days_points > friend.last_30_days_points ||
						($profile.last_30_days_points === friend.last_30_days_points && $profile.lifetime_level > friend.lifetime_level)) {
						friendsWithScores.splice(i, 0, userPosition);
						inserted = true;
						break;
					}
				}
				if (!inserted) {
					friendsWithScores.push(userPosition);
				}
			}
		}
	}

	async function inviteFriend() {
		if (!inviteEmail.trim() || inviting) return;

		inviting = true;
		inviteSuccess = '';
		inviteError = '';

		try {
			const { error } = await supabase
				.from('friend_invitations')
				.insert({
					from_user_id: $user!.id,
					to_email: inviteEmail.trim()
				});

			if (error) throw error;

			inviteSuccess = `Invitation sent to ${inviteEmail}! You'll get 100 bonus lives when they join and play.`;
			inviteEmail = '';
		} catch (err: any) {
			inviteError = err.message || 'Failed to send invitation';
		} finally {
			inviting = false;
		}
	}

	async function removeFriend(friendId: string) {
		if (!confirm('Remove this friend?')) return;

		const { error } = await supabase
			.from('friends')
			.delete()
			.eq('user_id', $user!.id)
			.eq('friend_id', friendId);

		if (!error) {
			await loadFriends();
		}
	}

	function getRankColor(rank: string): string {
		const colors: Record<string, string> = {
			blue: 'bg-blue-600',
			silver: 'bg-gray-400',
			gold: 'bg-yellow-500',
			platinum: 'bg-gray-300',
			diamond: 'bg-cyan-400',
			black: 'bg-black'
		};
		return colors[rank] || 'bg-gray-600';
	}

	function getRankName(rank: string): string {
		return rank.charAt(0).toUpperCase() + rank.slice(1);
	}
</script>

<svelte:head>
	<title>Friends - Blue Balls</title>
</svelte:head>

<div class="container mx-auto p-4 max-w-4xl">
	<div class="card mb-6">
		<h1 class="text-3xl font-bold mb-4 flex items-center gap-2">
			<UserPlus /> Friends
		</h1>

		<!-- Invite Friend -->
		<div class="mb-6 p-4 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
			<h2 class="font-bold mb-2 flex items-center gap-2">
				<Mail size={20} /> Invite a Friend
			</h2>
			<p class="text-sm mb-3 dark:text-gray-300">
				Invite friends via email and get <strong>100 bonus lives</strong> when they join and play!
			</p>

			{#if inviteSuccess}
				<div class="mb-3 p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">
					{inviteSuccess}
				</div>
			{/if}

			{#if inviteError}
				<div class="mb-3 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded">
					{inviteError}
				</div>
			{/if}

			<form on:submit|preventDefault={inviteFriend} class="flex gap-2">
				<input
					type="email"
					bind:value={inviteEmail}
					placeholder="friend@example.com"
					disabled={inviting}
					class="input flex-1"
					required
				/>
				<button
					type="submit"
					disabled={inviting || !inviteEmail.trim()}
					class="btn-primary disabled:opacity-50"
				>
					{inviting ? 'Sending...' : 'Send Invite'}
				</button>
			</form>
		</div>
	</div>

	<!-- Friends Leaderboard -->
	<div class="card">
		<h2 class="text-2xl font-bold mb-4 flex items-center gap-2">
			<Trophy /> Friends Ranking
		</h2>

		{#if loading}
			<div class="text-center py-8">
				<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
			</div>
		{:else if friendsWithScores.length === 0}
			<div class="text-center py-12">
				<UserPlus size={48} class="mx-auto text-gray-400 dark:text-gray-600 mb-4" />
				<p class="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">You have no friends yet</p>
				<p class="text-gray-500 dark:text-gray-400">Invite a friend to compete!</p>
			</div>
		{:else}
			<div class="space-y-2">
				{#each friendsWithScores as item, index}
					<div class="p-4 rounded-lg {item.isCurrentUser ? 'bg-secondary/20 border-2 border-secondary' : 'bg-gray-100 dark:bg-dark-secondary'} flex items-center gap-4">
						<div class="text-2xl font-bold w-8 text-center">
							{index + 1}
						</div>

						<div class="flex-1">
							<div class="flex items-center gap-2 mb-1">
								<a
									href="/profile/{item.friend.id}"
									class="font-bold hover:underline {item.isCurrentUser ? 'text-secondary' : ''}"
								>
									{item.friend.username} {item.isCurrentUser ? '(You)' : ''}
								</a>
								<span class="text-xs px-2 py-1 rounded-full {getRankColor(item.friend.current_rank)} text-white">
									{getRankName(item.friend.current_rank)}
								</span>
								{#if item.friend.membership_tier === 'big'}
									<span>👑</span>
								{:else if item.friend.membership_tier === 'mid'}
									<span>⭐</span>
								{/if}
							</div>

							<div class="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
								<span class="flex items-center gap-1">
									<TrendingUp size={14} /> Level {item.friend.lifetime_level}
								</span>
								<span class="flex items-center gap-1">
									<Trophy size={14} /> {item.friend.last_30_days_points} pts (30d)
								</span>
							</div>
						</div>

						{#if !item.isCurrentUser}
							<button
								on:click={() => removeFriend(item.friend.id)}
								class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm"
							>
								Remove
							</button>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
