<script lang="ts">
	import { onMount } from 'svelte';
	import { user, profile } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import { supabase, type Profile, type Affiliate, type SystemSetting } from '$lib/supabase';
	import {
		LayoutDashboard,
		Users,
		DollarSign,
		Settings,
		Mail,
		BarChart3,
		Search,
		Edit,
		CheckCircle,
		XCircle,
		Ban,
		Crown,
		Shield,
		Save,
		X,
		Send,
		Code
	} from 'lucide-svelte';

	let loading = true;
	let activeTab: 'dashboard' | 'users' | 'affiliates' | 'settings' | 'email' | 'ads' = 'dashboard';
	let error = '';
	let success = '';
	let actionLoading = false;

	// Dashboard stats
	let totalUsers = 0;
	let activeSubscriptions = 0;
	let totalRevenue = 0;
	let monthlyRevenue = 0;
	let pendingAffiliates = 0;

	// Users management
	let users: Profile[] = [];
	let userSearch = '';
	let selectedUser: Profile | null = null;
	let editingUser = false;
	let newTier: 'free' | 'mid' | 'big' = 'free';

	// Affiliates management
	let affiliates: Affiliate[] = [];
	let affiliateSearch = '';
	let selectedAffiliate: Affiliate | null = null;

	// System settings
	let systemSettings: SystemSetting[] = [];
	let editingSettings: { [key: string]: string } = {};

	// Email marketing
	let emailSubject = '';
	let emailBody = '';
	let emailTarget: 'all' | 'free' | 'mid' | 'big' = 'all';
	let sendingEmail = false;

	// Ads management
	let adPositions = [
		{ id: 'header', name: 'Header Banner', code: '' },
		{ id: 'sidebar', name: 'Sidebar', code: '' },
		{ id: 'game_end', name: 'Game End Screen', code: '' },
		{ id: 'footer', name: 'Footer', code: '' }
	];

	onMount(async () => {
		// Wait a bit for user to load
		await new Promise(resolve => setTimeout(resolve, 100));

		console.log('Admin page - User:', $user);
		console.log('Admin page - User email:', $user?.email);
		console.log('Admin page - Profile:', $profile);

		if (!$user) {
			console.log('No user, redirecting to login');
			goto('/auth/login');
			return;
		}

		// Check if user is admin by email (hardcoded)
		const adminEmails = ['canbeerliquor@gmail.com'];
		const userEmail = $user.email || '';
		const isAdmin = adminEmails.includes(userEmail);

		console.log('Checking admin access...');
		console.log('User email:', userEmail);
		console.log('Admin emails:', adminEmails);
		console.log('Is admin:', isAdmin);

		if (!isAdmin) {
			console.log('Not admin, redirecting to home');
			goto('/');
			return;
		}

		console.log('✅ Admin access granted!');
		await loadDashboardStats();
		loading = false;
	});

	async function loadDashboardStats() {
		try {
			// Total users
			const { count: userCount } = await supabase
				.from('profiles')
				.select('*', { count: 'exact', head: true });
			totalUsers = userCount || 0;

			// Active subscriptions
			const { count: subCount } = await supabase
				.from('profiles')
				.select('*', { count: 'exact', head: true })
				.in('membership_tier', ['mid', 'big']);
			activeSubscriptions = subCount || 0;

			// Pending affiliates
			const { count: affCount } = await supabase
				.from('affiliates')
				.select('*', { count: 'exact', head: true })
				.eq('status', 'pending');
			pendingAffiliates = affCount || 0;

			// Revenue (mock data - you'd calculate from actual transactions)
			totalRevenue = activeSubscriptions * 6; // Average
			monthlyRevenue = totalRevenue;
		} catch (e: any) {
			error = 'Failed to load dashboard stats';
		}
	}

	async function loadUsers() {
		try {
			let query = supabase.from('profiles').select('*').order('created_at', { ascending: false });

			if (userSearch) {
				query = query.or(`username.ilike.%${userSearch}%,email.ilike.%${userSearch}%`);
			}

			const { data, error: fetchError } = await query.limit(50);

			if (fetchError) throw fetchError;
			users = data || [];
		} catch (e: any) {
			error = 'Failed to load users';
		}
	}

	async function updateUserTier(userId: string, tier: 'free' | 'mid' | 'big') {
		actionLoading = true;
		error = '';
		success = '';

		try {
			const { error: updateError } = await supabase
				.from('profiles')
				.update({ membership_tier: tier })
				.eq('id', userId);

			if (updateError) throw updateError;

			success = 'User tier updated successfully!';
			await loadUsers();
			editingUser = false;
			selectedUser = null;
		} catch (e: any) {
			error = e.message || 'Failed to update user tier';
		} finally {
			actionLoading = false;
		}
	}

	async function toggleUserBan(userId: string, currentlyBanned: boolean) {
		actionLoading = true;
		error = '';
		success = '';

		try {
			const { error: updateError } = await supabase
				.from('profiles')
				.update({ is_banned: !currentlyBanned })
				.eq('id', userId);

			if (updateError) throw updateError;

			success = `User ${currentlyBanned ? 'unbanned' : 'banned'} successfully!`;
			await loadUsers();
		} catch (e: any) {
			error = e.message || 'Failed to update user status';
		} finally {
			actionLoading = false;
		}
	}

	async function loadAffiliates() {
		try {
			let query = supabase
				.from('affiliates')
				.select('*, profiles:user_id(*)')
				.order('created_at', { ascending: false });

			if (affiliateSearch) {
				query = query.ilike('affiliate_code', `%${affiliateSearch}%`);
			}

			const { data, error: fetchError } = await query;

			if (fetchError) throw fetchError;
			affiliates = data || [];
		} catch (e: any) {
			error = 'Failed to load affiliates';
		}
	}

	async function updateAffiliateStatus(
		affiliateId: string,
		status: 'approved' | 'rejected'
	) {
		actionLoading = true;
		error = '';
		success = '';

		try {
			const updates: any = { status };
			if (status === 'approved') {
				updates.approved_at = new Date().toISOString();
			}

			const { error: updateError } = await supabase
				.from('affiliates')
				.update(updates)
				.eq('id', affiliateId);

			if (updateError) throw updateError;

			success = `Affiliate ${status} successfully!`;
			await loadAffiliates();
			await loadDashboardStats();
		} catch (e: any) {
			error = e.message || 'Failed to update affiliate status';
		} finally {
			actionLoading = false;
		}
	}

	async function processAffiliatePayout(affiliateId: string) {
		actionLoading = true;
		error = '';
		success = '';

		try {
			// In a real app, you'd integrate with a payment processor
			// For now, just mark earnings as processed
			const affiliate = affiliates.find((a) => a.id === affiliateId);
			if (!affiliate) throw new Error('Affiliate not found');

			if (affiliate.pending_earnings < 100) {
				throw new Error('Minimum payout is $100');
			}

			const { error: updateError } = await supabase
				.from('affiliates')
				.update({
					total_earnings: affiliate.total_earnings + affiliate.pending_earnings,
					pending_earnings: 0
				})
				.eq('id', affiliateId);

			if (updateError) throw updateError;

			success = 'Payout processed successfully!';
			await loadAffiliates();
		} catch (e: any) {
			error = e.message || 'Failed to process payout';
		} finally {
			actionLoading = false;
		}
	}

	async function loadSystemSettings() {
		try {
			const { data, error: fetchError } = await supabase
				.from('system_settings')
				.select('*')
				.order('key');

			if (fetchError) throw fetchError;

			systemSettings = data || [];
			editingSettings = {};
			data?.forEach((setting) => {
				editingSettings[setting.key] = setting.value;
			});
		} catch (e: any) {
			error = 'Failed to load system settings';
		}
	}

	async function saveSystemSettings() {
		actionLoading = true;
		error = '';
		success = '';

		try {
			for (const [key, value] of Object.entries(editingSettings)) {
				const { error: updateError } = await supabase
					.from('system_settings')
					.upsert({
						key,
						value,
						updated_at: new Date().toISOString(),
						updated_by: $user?.id
					});

				if (updateError) throw updateError;
			}

			success = 'System settings saved successfully!';
			await loadSystemSettings();
		} catch (e: any) {
			error = e.message || 'Failed to save system settings';
		} finally {
			actionLoading = false;
		}
	}

	async function sendBulkEmail() {
		if (!emailSubject || !emailBody) {
			error = 'Please provide both subject and body';
			return;
		}

		sendingEmail = true;
		error = '';
		success = '';

		try {
			// In a real app, you'd call a backend API that handles email sending
			// For now, this is a placeholder
			const response = await fetch('/api/send-bulk-email', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					subject: emailSubject,
					body: emailBody,
					target: emailTarget
				})
			});

			if (!response.ok) throw new Error('Failed to send emails');

			success = 'Bulk email campaign started!';
			emailSubject = '';
			emailBody = '';
		} catch (e: any) {
			error = e.message || 'Failed to send bulk email';
		} finally {
			sendingEmail = false;
		}
	}

	async function saveAdCode(position: string, code: string) {
		actionLoading = true;
		error = '';
		success = '';

		try {
			const { error: updateError } = await supabase
				.from('system_settings')
				.upsert({
					key: `ad_${position}`,
					value: code,
					updated_at: new Date().toISOString(),
					updated_by: $user?.id,
					description: `Ad code for ${position}`
				});

			if (updateError) throw updateError;

			success = 'Ad code saved successfully!';
		} catch (e: any) {
			error = e.message || 'Failed to save ad code';
		} finally {
			actionLoading = false;
		}
	}

	function handleTabChange(tab: typeof activeTab) {
		activeTab = tab;
		error = '';
		success = '';

		switch (tab) {
			case 'users':
				loadUsers();
				break;
			case 'affiliates':
				loadAffiliates();
				break;
			case 'settings':
				loadSystemSettings();
				break;
		}
	}

	function formatCurrency(amount: number) {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD'
		}).format(amount);
	}

	function formatDate(dateString: string | null) {
		if (!dateString) return 'N/A';
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>Admin Panel - Blue Balls</title>
</svelte:head>

{#if loading}
	<div class="min-h-screen flex items-center justify-center">
		<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
	</div>
{:else}
	<div class="min-h-screen p-4">
		<div class="max-w-7xl mx-auto">
			<h1 class="text-3xl font-bold mb-2 flex items-center gap-2">
				<Shield size={32} class="text-red-600" />
				Admin Panel
			</h1>
			<p class="dark:text-gray-300 mb-6">Manage users, affiliates, and system settings</p>

			{#if error}
				<div class="bg-red-100 dark:bg-red-900/20 border border-red-400 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-4 flex items-start gap-2">
					<X size={20} class="flex-shrink-0 mt-0.5" />
					<span>{error}</span>
				</div>
			{/if}

			{#if success}
				<div class="bg-green-100 dark:bg-green-900/20 border border-green-400 text-green-700 dark:text-green-400 px-4 py-3 rounded mb-4 flex items-start gap-2">
					<CheckCircle size={20} class="flex-shrink-0 mt-0.5" />
					<span>{success}</span>
				</div>
			{/if}

			<!-- Tabs -->
			<div class="flex gap-2 mb-6 overflow-x-auto">
				<button
					on:click={() => handleTabChange('dashboard')}
					class="px-4 py-2 rounded-lg font-bold whitespace-nowrap {activeTab === 'dashboard'
						? 'bg-primary text-white'
						: 'bg-gray-200 dark:bg-dark-accent hover:bg-gray-300 dark:hover:bg-gray-700'}"
				>
					<LayoutDashboard size={18} class="inline" /> Dashboard
				</button>
				<button
					on:click={() => handleTabChange('users')}
					class="px-4 py-2 rounded-lg font-bold whitespace-nowrap {activeTab === 'users'
						? 'bg-primary text-white'
						: 'bg-gray-200 dark:bg-dark-accent hover:bg-gray-300 dark:hover:bg-gray-700'}"
				>
					<Users size={18} class="inline" /> Users
				</button>
				<button
					on:click={() => handleTabChange('affiliates')}
					class="px-4 py-2 rounded-lg font-bold whitespace-nowrap {activeTab === 'affiliates'
						? 'bg-primary text-white'
						: 'bg-gray-200 dark:bg-dark-accent hover:bg-gray-300 dark:hover:bg-gray-700'}"
				>
					<DollarSign size={18} class="inline" /> Affiliates
					{#if pendingAffiliates > 0}
						<span class="bg-red-500 text-white text-xs px-2 py-1 rounded-full ml-1">
							{pendingAffiliates}
						</span>
					{/if}
				</button>
				<button
					on:click={() => handleTabChange('settings')}
					class="px-4 py-2 rounded-lg font-bold whitespace-nowrap {activeTab === 'settings'
						? 'bg-primary text-white'
						: 'bg-gray-200 dark:bg-dark-accent hover:bg-gray-300 dark:hover:bg-gray-700'}"
				>
					<Settings size={18} class="inline" /> Settings
				</button>
				<button
					on:click={() => handleTabChange('email')}
					class="px-4 py-2 rounded-lg font-bold whitespace-nowrap {activeTab === 'email'
						? 'bg-primary text-white'
						: 'bg-gray-200 dark:bg-dark-accent hover:bg-gray-300 dark:hover:bg-gray-700'}"
				>
					<Mail size={18} class="inline" /> Email Marketing
				</button>
				<button
					on:click={() => handleTabChange('ads')}
					class="px-4 py-2 rounded-lg font-bold whitespace-nowrap {activeTab === 'ads'
						? 'bg-primary text-white'
						: 'bg-gray-200 dark:bg-dark-accent hover:bg-gray-300 dark:hover:bg-gray-700'}"
				>
					<Code size={18} class="inline" /> Ads
				</button>
			</div>

			<!-- Dashboard Tab -->
			{#if activeTab === 'dashboard'}
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
					<div class="card bg-gradient-to-br from-blue-500 to-cyan-600 text-white">
						<div class="flex items-center justify-between">
							<div>
								<p class="text-sm opacity-90">Total Users</p>
								<p class="text-3xl font-bold">{totalUsers}</p>
							</div>
							<Users size={48} class="opacity-50" />
						</div>
					</div>

					<div class="card bg-gradient-to-br from-green-500 to-emerald-600 text-white">
						<div class="flex items-center justify-between">
							<div>
								<p class="text-sm opacity-90">Active Subscriptions</p>
								<p class="text-3xl font-bold">{activeSubscriptions}</p>
							</div>
							<Crown size={48} class="opacity-50" />
						</div>
					</div>

					<div class="card bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
						<div class="flex items-center justify-between">
							<div>
								<p class="text-sm opacity-90">Monthly Revenue</p>
								<p class="text-2xl font-bold">{formatCurrency(monthlyRevenue)}</p>
							</div>
							<BarChart3 size={48} class="opacity-50" />
						</div>
					</div>

					<div class="card bg-gradient-to-br from-orange-500 to-red-600 text-white">
						<div class="flex items-center justify-between">
							<div>
								<p class="text-sm opacity-90">Pending Affiliates</p>
								<p class="text-3xl font-bold">{pendingAffiliates}</p>
							</div>
							<DollarSign size={48} class="opacity-50" />
						</div>
					</div>
				</div>

				<div class="card mt-6">
					<h2 class="text-xl font-bold mb-4">Recent Activity</h2>
					<p class="dark:text-gray-300">Activity logs would appear here...</p>
				</div>
			{/if}

			<!-- Users Tab -->
			{#if activeTab === 'users'}
				<div class="card mb-4">
					<div class="flex gap-4">
						<input
							type="text"
							bind:value={userSearch}
							placeholder="Search by username or email..."
							class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-dark-accent dark:text-white"
						/>
						<button on:click={loadUsers} class="btn-primary">
							<Search size={18} class="inline" /> Search
						</button>
					</div>
				</div>

				<div class="card overflow-x-auto">
					<table class="w-full">
						<thead>
							<tr class="border-b border-gray-300 dark:border-gray-600">
								<th class="text-left py-3 px-2">Username</th>
								<th class="text-left py-3 px-2">Email</th>
								<th class="text-left py-3 px-2">Tier</th>
								<th class="text-left py-3 px-2">Level</th>
								<th class="text-left py-3 px-2">Joined</th>
								<th class="text-center py-3 px-2">Actions</th>
							</tr>
						</thead>
						<tbody>
							{#each users as user}
								<tr class="border-b border-gray-200 dark:border-gray-700">
									<td class="py-3 px-2 font-bold">{user.username}</td>
									<td class="py-3 px-2 text-sm">{user.email}</td>
									<td class="py-3 px-2">
										<span
											class="px-2 py-1 rounded text-xs font-bold {user.membership_tier ===
											'big'
												? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'
												: user.membership_tier === 'mid'
													? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300'
													: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'}"
										>
											{user.membership_tier.toUpperCase()}
										</span>
									</td>
									<td class="py-3 px-2">{user.lifetime_level}</td>
									<td class="py-3 px-2 text-sm">{formatDate(user.created_at)}</td>
									<td class="py-3 px-2">
										<div class="flex justify-center gap-2">
											<button
												on:click={() => {
													selectedUser = user;
													newTier = user.membership_tier;
													editingUser = true;
												}}
												class="text-blue-600 hover:text-blue-800 dark:text-blue-400"
												title="Edit"
											>
												<Edit size={18} />
											</button>
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>

					{#if users.length === 0}
						<p class="text-center py-8 dark:text-gray-300">No users found</p>
					{/if}
				</div>

				<!-- Edit User Modal -->
				{#if editingUser && selectedUser}
					<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
						<div class="card max-w-md w-full">
							<h3 class="text-xl font-bold mb-4">Edit User: {selectedUser.username}</h3>

							<div class="mb-4">
								<label class="block font-bold mb-2">Membership Tier</label>
								<select
									bind:value={newTier}
									class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-dark-accent dark:text-white"
								>
									<option value="free">Free</option>
									<option value="mid">Mid ($2/month)</option>
									<option value="big">Big ($10/month)</option>
								</select>
							</div>

							<div class="flex gap-4">
								<button
									on:click={() => updateUserTier(selectedUser!.id, newTier)}
									class="btn-primary flex-1"
									disabled={actionLoading}
								>
									{actionLoading ? 'Saving...' : 'Save'}
								</button>
								<button
									on:click={() => {
										editingUser = false;
										selectedUser = null;
									}}
									class="btn-primary bg-gray-500 hover:bg-gray-600"
								>
									Cancel
								</button>
							</div>
						</div>
					</div>
				{/if}
			{/if}

			<!-- Affiliates Tab -->
			{#if activeTab === 'affiliates'}
				<div class="card mb-4">
					<div class="flex gap-4">
						<input
							type="text"
							bind:value={affiliateSearch}
							placeholder="Search by affiliate code..."
							class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-dark-accent dark:text-white"
						/>
						<button on:click={loadAffiliates} class="btn-primary">
							<Search size={18} class="inline" /> Search
						</button>
					</div>
				</div>

				<div class="grid grid-cols-1 gap-4">
					{#each affiliates as affiliate}
						<div class="card">
							<div class="flex flex-col md:flex-row justify-between gap-4">
								<div class="flex-1">
									<div class="flex items-center gap-2 mb-2">
										<h3 class="font-bold text-lg">{affiliate.affiliate_code}</h3>
										<span
											class="px-2 py-1 rounded text-xs font-bold {affiliate.status ===
											'approved'
												? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
												: affiliate.status === 'pending'
													? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
													: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'}"
										>
											{affiliate.status.toUpperCase()}
										</span>
									</div>

									<div class="grid grid-cols-2 gap-4 text-sm mb-2">
										<div>
											<p class="text-gray-600 dark:text-gray-400">Total Earnings</p>
											<p class="font-bold">{formatCurrency(affiliate.total_earnings)}</p>
										</div>
										<div>
											<p class="text-gray-600 dark:text-gray-400">Pending Earnings</p>
											<p class="font-bold">{formatCurrency(affiliate.pending_earnings)}</p>
										</div>
									</div>

									<p class="text-sm dark:text-gray-300 mb-2">
										<span class="font-bold">BTC:</span>
										{affiliate.btc_address || 'Not provided'}
									</p>
									<p class="text-sm dark:text-gray-300">
										<span class="font-bold">USDT:</span>
										{affiliate.usdt_address || 'Not provided'}
									</p>

									<details class="mt-2">
										<summary class="cursor-pointer font-bold text-sm">Promotion Plan</summary>
										<p class="text-sm dark:text-gray-300 mt-2 whitespace-pre-wrap">
											{affiliate.promotion_plan}
										</p>
									</details>
								</div>

								<div class="flex flex-col gap-2">
									{#if affiliate.status === 'pending'}
										<button
											on:click={() => updateAffiliateStatus(affiliate.id, 'approved')}
											class="btn-primary bg-green-500 hover:bg-green-600 flex items-center gap-2"
											disabled={actionLoading}
										>
											<CheckCircle size={18} /> Approve
										</button>
										<button
											on:click={() => updateAffiliateStatus(affiliate.id, 'rejected')}
											class="btn-primary bg-red-500 hover:bg-red-600 flex items-center gap-2"
											disabled={actionLoading}
										>
											<XCircle size={18} /> Reject
										</button>
									{:else if affiliate.status === 'approved' && affiliate.pending_earnings >= 100}
										<button
											on:click={() => processAffiliatePayout(affiliate.id)}
											class="btn-primary bg-blue-500 hover:bg-blue-600 flex items-center gap-2"
											disabled={actionLoading}
										>
											<DollarSign size={18} /> Process Payout
										</button>
									{/if}
								</div>
							</div>
						</div>
					{/each}

					{#if affiliates.length === 0}
						<div class="card text-center py-8">
							<p class="dark:text-gray-300">No affiliates found</p>
						</div>
					{/if}
				</div>
			{/if}

			<!-- System Settings Tab -->
			{#if activeTab === 'settings'}
				<div class="card">
					<h2 class="text-xl font-bold mb-4">System Settings</h2>

					<div class="space-y-6">
						<!-- Chat Cooldowns -->
						<div>
							<h3 class="font-bold mb-3">Chat Cooldowns (seconds)</h3>
							<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
								<div>
									<label class="block text-sm mb-1">Free Tier</label>
									<input
										type="number"
										bind:value={editingSettings['chat_cooldown_free']}
										class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-dark-accent dark:text-white"
										placeholder="600"
									/>
								</div>
								<div>
									<label class="block text-sm mb-1">Mid Tier</label>
									<input
										type="number"
										bind:value={editingSettings['chat_cooldown_mid']}
										class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-dark-accent dark:text-white"
										placeholder="180"
									/>
								</div>
								<div>
									<label class="block text-sm mb-1">Big Tier</label>
									<input
										type="number"
										bind:value={editingSettings['chat_cooldown_big']}
										class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-dark-accent dark:text-white"
										placeholder="60"
									/>
								</div>
							</div>
						</div>

						<!-- Rank Thresholds -->
						<div>
							<h3 class="font-bold mb-3">Rank Thresholds (points)</h3>
							<div class="grid grid-cols-2 md:grid-cols-3 gap-4">
								<div>
									<label class="block text-sm mb-1">Silver</label>
									<input
										type="number"
										bind:value={editingSettings['rank_silver']}
										class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-dark-accent dark:text-white"
										placeholder="1000"
									/>
								</div>
								<div>
									<label class="block text-sm mb-1">Gold</label>
									<input
										type="number"
										bind:value={editingSettings['rank_gold']}
										class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-dark-accent dark:text-white"
										placeholder="5000"
									/>
								</div>
								<div>
									<label class="block text-sm mb-1">Platinum</label>
									<input
										type="number"
										bind:value={editingSettings['rank_platinum']}
										class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-dark-accent dark:text-white"
										placeholder="10000"
									/>
								</div>
								<div>
									<label class="block text-sm mb-1">Diamond</label>
									<input
										type="number"
										bind:value={editingSettings['rank_diamond']}
										class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-dark-accent dark:text-white"
										placeholder="25000"
									/>
								</div>
								<div>
									<label class="block text-sm mb-1">Black</label>
									<input
										type="number"
										bind:value={editingSettings['rank_black']}
										class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-dark-accent dark:text-white"
										placeholder="50000"
									/>
								</div>
							</div>
						</div>

						<!-- SMTP Configuration -->
						<div>
							<h3 class="font-bold mb-3">SMTP Configuration</h3>
							<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<label class="block text-sm mb-1">SMTP Host</label>
									<input
										type="text"
										bind:value={editingSettings['smtp_host']}
										class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-dark-accent dark:text-white"
										placeholder="smtp.example.com"
									/>
								</div>
								<div>
									<label class="block text-sm mb-1">SMTP Port</label>
									<input
										type="number"
										bind:value={editingSettings['smtp_port']}
										class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-dark-accent dark:text-white"
										placeholder="587"
									/>
								</div>
								<div>
									<label class="block text-sm mb-1">SMTP Username</label>
									<input
										type="text"
										bind:value={editingSettings['smtp_username']}
										class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-dark-accent dark:text-white"
										placeholder="user@example.com"
									/>
								</div>
								<div>
									<label class="block text-sm mb-1">SMTP Password</label>
									<input
										type="password"
										bind:value={editingSettings['smtp_password']}
										class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-dark-accent dark:text-white"
										placeholder="••••••••"
									/>
								</div>
							</div>
						</div>
					</div>

					<button
						on:click={saveSystemSettings}
						class="btn-primary mt-6 flex items-center gap-2"
						disabled={actionLoading}
					>
						<Save size={18} />
						{actionLoading ? 'Saving...' : 'Save All Settings'}
					</button>
				</div>
			{/if}

			<!-- Email Marketing Tab -->
			{#if activeTab === 'email'}
				<div class="card">
					<h2 class="text-xl font-bold mb-4">Send Bulk Email</h2>

					<div class="mb-4">
						<label class="block font-bold mb-2">Target Audience</label>
						<select
							bind:value={emailTarget}
							class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-dark-accent dark:text-white"
						>
							<option value="all">All Users</option>
							<option value="free">Free Members Only</option>
							<option value="mid">Mid Members Only</option>
							<option value="big">Big Members Only</option>
						</select>
					</div>

					<div class="mb-4">
						<label class="block font-bold mb-2">Subject</label>
						<input
							type="text"
							bind:value={emailSubject}
							class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-dark-accent dark:text-white"
							placeholder="Email subject..."
						/>
					</div>

					<div class="mb-4">
						<label class="block font-bold mb-2">Message</label>
						<textarea
							bind:value={emailBody}
							rows="10"
							class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-dark-accent dark:text-white resize-none"
							placeholder="Email body (HTML supported)..."
						></textarea>
					</div>

					<button
						on:click={sendBulkEmail}
						class="btn-primary flex items-center gap-2"
						disabled={sendingEmail}
					>
						<Send size={18} />
						{sendingEmail ? 'Sending...' : 'Send Bulk Email'}
					</button>
				</div>
			{/if}

			<!-- Ads Tab -->
			{#if activeTab === 'ads'}
				<div class="space-y-6">
					{#each adPositions as position}
						<div class="card">
							<h3 class="font-bold mb-3">{position.name}</h3>
							<textarea
								bind:value={position.code}
								rows="6"
								class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-dark-accent dark:text-white font-mono text-sm resize-none mb-3"
								placeholder="Paste your ad code here..."
							></textarea>
							<button
								on:click={() => saveAdCode(position.id, position.code)}
								class="btn-primary flex items-center gap-2"
								disabled={actionLoading}
							>
								<Save size={18} />
								{actionLoading ? 'Saving...' : 'Save Ad Code'}
							</button>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
{/if}
