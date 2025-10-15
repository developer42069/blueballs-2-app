<script lang="ts">
	import { onMount } from 'svelte';
	import { user, profile } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import { supabase, type Affiliate } from '$lib/supabase';
	import { DollarSign, TrendingUp, Users, Copy, CheckCircle, AlertCircle, Clock, Wallet } from 'lucide-svelte';

	let affiliate: Affiliate | null = null;
	let loading = true;
	let submitting = false;
	let error = '';
	let success = '';
	let copied = false;

	// Form fields
	let promotionPlan = '';
	let btcAddress = '';
	let usdtAddress = '';

	// Stats
	let referralCount = 0;
	let clickCount = 0;

	onMount(async () => {
		if (!$user) {
			goto('/auth/login');
			return;
		}

		await loadAffiliate();
		loading = false;
	});

	async function loadAffiliate() {
		if (!$user) return;

		const { data } = await supabase
			.from('affiliates')
			.select('*')
			.eq('user_id', $user.id)
			.single();

		affiliate = data;

		if (affiliate) {
			btcAddress = affiliate.btc_address || '';
			usdtAddress = affiliate.usdt_address || '';

			// Load referral stats
			const { count: refCount } = await supabase
				.from('profiles')
				.select('*', { count: 'exact', head: true })
				.eq('referred_by', affiliate.affiliate_code);

			referralCount = refCount || 0;

			// Load click stats (if you have a clicks table)
			// For now, we'll use a placeholder
			clickCount = 0;
		}
	}

	async function handleSubmit() {
		if (!$user) return;

		error = '';
		success = '';
		submitting = true;

		if (!promotionPlan.trim()) {
			error = 'Please describe your promotion plan';
			submitting = false;
			return;
		}

		if (!btcAddress.trim() && !usdtAddress.trim()) {
			error = 'Please provide at least one wallet address';
			submitting = false;
			return;
		}

		try {
			// Generate unique affiliate code
			const code = `BB${$user.id.substring(0, 8).toUpperCase()}`;

			const { error: insertError } = await supabase
				.from('affiliates')
				.insert({
					user_id: $user.id,
					affiliate_code: code,
					promotion_plan: promotionPlan,
					btc_address: btcAddress || null,
					usdt_address: usdtAddress || null,
					status: 'pending'
				});

			if (insertError) throw insertError;

			success = 'Application submitted successfully! We will review it within 24 hours.';
			await loadAffiliate();
		} catch (e: any) {
			error = e.message || 'Failed to submit application';
		} finally {
			submitting = false;
		}
	}

	async function updateWallets() {
		if (!$user || !affiliate) return;

		error = '';
		success = '';
		submitting = true;

		if (!btcAddress.trim() && !usdtAddress.trim()) {
			error = 'Please provide at least one wallet address';
			submitting = false;
			return;
		}

		try {
			const { error: updateError } = await supabase
				.from('affiliates')
				.update({
					btc_address: btcAddress || null,
					usdt_address: usdtAddress || null
				})
				.eq('id', affiliate.id);

			if (updateError) throw updateError;

			success = 'Wallet addresses updated successfully!';
			await loadAffiliate();
		} catch (e: any) {
			error = e.message || 'Failed to update wallet addresses';
		} finally {
			submitting = false;
		}
	}

	function copyCode() {
		if (!affiliate) return;
		navigator.clipboard.writeText(`https://blueballs.lol/?ref=${affiliate.affiliate_code}`);
		copied = true;
		setTimeout(() => copied = false, 2000);
	}

	function getStatusColor(status: string) {
		switch (status) {
			case 'approved': return 'text-green-600 dark:text-green-400';
			case 'pending': return 'text-yellow-600 dark:text-yellow-400';
			case 'rejected': return 'text-red-600 dark:text-red-400';
			default: return 'text-gray-600 dark:text-gray-400';
		}
	}

	function getStatusIcon(status: string) {
		switch (status) {
			case 'approved': return CheckCircle;
			case 'pending': return Clock;
			case 'rejected': return AlertCircle;
			default: return AlertCircle;
		}
	}
</script>

<svelte:head>
	<title>BB Club - Affiliate Program</title>
</svelte:head>

{#if loading}
	<div class="min-h-screen flex items-center justify-center">
		<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
	</div>
{:else}
	<div class="min-h-screen p-4">
		<div class="max-w-6xl mx-auto">
			<h1 class="text-3xl font-bold mb-2">BB Club - Affiliate Program</h1>
			<p class="dark:text-gray-300 mb-6">Earn 10% commission on referrals. Minimum payout: $100</p>

			{#if error}
				<div class="bg-red-100 dark:bg-red-900/20 border border-red-400 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-4">
					{error}
				</div>
			{/if}

			{#if success}
				<div class="bg-green-100 dark:bg-green-900/20 border border-green-400 text-green-700 dark:text-green-400 px-4 py-3 rounded mb-4">
					{success}
				</div>
			{/if}

			{#if !affiliate}
				<!-- Application Form -->
				<div class="card">
					<h2 class="text-2xl font-bold mb-4">Apply to Join BB Club</h2>
					<p class="dark:text-gray-300 mb-6">
						Join our affiliate program and earn 10% commission on all referrals. You'll receive payments
						in BTC or USDT once you reach the minimum payout threshold of $100.
					</p>

					<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
						<div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center">
							<DollarSign class="mx-auto mb-2 text-blue-600 dark:text-blue-400" size={32} />
							<h3 class="font-bold">10% Commission</h3>
							<p class="text-sm dark:text-gray-300">On all referral sales</p>
						</div>
						<div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
							<TrendingUp class="mx-auto mb-2 text-green-600 dark:text-green-400" size={32} />
							<h3 class="font-bold">$100 Minimum</h3>
							<p class="text-sm dark:text-gray-300">Payout threshold</p>
						</div>
						<div class="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg text-center">
							<Wallet class="mx-auto mb-2 text-purple-600 dark:text-purple-400" size={32} />
							<h3 class="font-bold">BTC / USDT</h3>
							<p class="text-sm dark:text-gray-300">Payment options</p>
						</div>
					</div>

					<form on:submit|preventDefault={handleSubmit}>
						<div class="mb-4">
							<label for="promotionPlan" class="block font-bold mb-2">
								How do you plan to promote Blue Balls?
							</label>
							<textarea
								id="promotionPlan"
								bind:value={promotionPlan}
								rows="6"
								class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-dark-accent dark:text-white"
								placeholder="Describe your promotion strategy (social media, YouTube, blog, etc.)..."
								required
							></textarea>
						</div>

						<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
							<div>
								<label for="btcAddress" class="block font-bold mb-2">
									BTC Wallet Address (Optional)
								</label>
								<input
									type="text"
									id="btcAddress"
									bind:value={btcAddress}
									class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-dark-accent dark:text-white"
									placeholder="bc1..."
								/>
							</div>

							<div>
								<label for="usdtAddress" class="block font-bold mb-2">
									USDT Wallet Address (Optional)
								</label>
								<input
									type="text"
									id="usdtAddress"
									bind:value={usdtAddress}
									class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-dark-accent dark:text-white"
									placeholder="0x..."
								/>
							</div>
						</div>

						<p class="text-sm dark:text-gray-300 mb-4">
							Note: You must provide at least one wallet address. You can update them later.
						</p>

						<button type="submit" class="btn-primary w-full" disabled={submitting}>
							{submitting ? 'Submitting...' : 'Submit Application'}
						</button>
					</form>
				</div>
			{:else}
				<!-- Affiliate Dashboard -->
				<div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
					<!-- Status Card -->
					<div class="card">
						<h3 class="font-bold mb-2 flex items-center gap-2">
							<svelte:component this={getStatusIcon(affiliate.status)} size={20} class={getStatusColor(affiliate.status)} />
							Status
						</h3>
						<p class="text-2xl font-bold capitalize {getStatusColor(affiliate.status)}">
							{affiliate.status}
						</p>
						{#if affiliate.status === 'pending'}
							<p class="text-sm dark:text-gray-300 mt-2">
								Your application is under review. We'll notify you within 24 hours.
							</p>
						{:else if affiliate.status === 'rejected'}
							<p class="text-sm dark:text-gray-300 mt-2">
								Your application was not approved. Please contact support for more information.
							</p>
						{/if}
					</div>

					<!-- Earnings Card -->
					<div class="card bg-gradient-to-br from-green-500 to-emerald-600 text-white">
						<div class="flex items-center justify-between">
							<div>
								<p class="text-sm opacity-90">Total Earnings</p>
								<p class="text-3xl font-bold">${affiliate.total_earnings.toFixed(2)}</p>
								<p class="text-xs opacity-75">Pending: ${affiliate.pending_earnings.toFixed(2)}</p>
							</div>
							<DollarSign size={48} class="opacity-50" />
						</div>
					</div>

					<!-- Referrals Card -->
					<div class="card bg-gradient-to-br from-blue-500 to-cyan-600 text-white">
						<div class="flex items-center justify-between">
							<div>
								<p class="text-sm opacity-90">Referrals</p>
								<p class="text-3xl font-bold">{referralCount}</p>
								<p class="text-xs opacity-75">Total conversions</p>
							</div>
							<Users size={48} class="opacity-50" />
						</div>
					</div>
				</div>

				{#if affiliate.status === 'approved'}
					<!-- Affiliate Link -->
					<div class="card mb-6">
						<h3 class="font-bold mb-2">Your Affiliate Link</h3>
						<div class="flex gap-2">
							<input
								type="text"
								value="https://blueballs.lol/?ref={affiliate.affiliate_code}"
								readonly
								class="flex-1 px-4 py-2 bg-gray-100 dark:bg-dark-accent border border-gray-300 dark:border-gray-600 rounded-lg"
							/>
							<button on:click={copyCode} class="btn-primary flex items-center gap-2">
								{#if copied}
									<CheckCircle size={18} /> Copied!
								{:else}
									<Copy size={18} /> Copy
								{/if}
							</button>
						</div>
						<p class="text-sm dark:text-gray-300 mt-2">
							Share this link to earn 10% commission on all referral subscriptions!
						</p>
					</div>

					<!-- Affiliate Code -->
					<div class="card mb-6">
						<h3 class="font-bold mb-2">Your Affiliate Code</h3>
						<p class="text-2xl font-mono font-bold text-primary">{affiliate.affiliate_code}</p>
					</div>
				{/if}

				<!-- Wallet Addresses -->
				<div class="card">
					<h3 class="font-bold mb-4">Payment Wallet Addresses</h3>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
						<div>
							<label for="btcAddressUpdate" class="block font-bold mb-2">
								BTC Wallet Address
							</label>
							<input
								type="text"
								id="btcAddressUpdate"
								bind:value={btcAddress}
								class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-dark-accent dark:text-white"
								placeholder="bc1..."
							/>
						</div>

						<div>
							<label for="usdtAddressUpdate" class="block font-bold mb-2">
								USDT Wallet Address
							</label>
							<input
								type="text"
								id="usdtAddressUpdate"
								bind:value={usdtAddress}
								class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-dark-accent dark:text-white"
								placeholder="0x..."
							/>
						</div>
					</div>

					<button on:click={updateWallets} class="btn-primary" disabled={submitting}>
						{submitting ? 'Updating...' : 'Update Wallet Addresses'}
					</button>
				</div>

				<!-- Commission Info -->
				<div class="card mt-6">
					<h3 class="font-bold mb-4">How It Works</h3>
					<ul class="space-y-2 dark:text-gray-300">
						<li class="flex items-start gap-2">
							<CheckCircle size={20} class="text-green-600 dark:text-green-400 mt-0.5" />
							<span>Earn 10% commission on all subscription payments from your referrals</span>
						</li>
						<li class="flex items-start gap-2">
							<CheckCircle size={20} class="text-green-600 dark:text-green-400 mt-0.5" />
							<span>Recurring commissions for as long as your referrals stay subscribed</span>
						</li>
						<li class="flex items-start gap-2">
							<CheckCircle size={20} class="text-green-600 dark:text-green-400 mt-0.5" />
							<span>Minimum payout threshold: $100 (paid in BTC or USDT)</span>
						</li>
						<li class="flex items-start gap-2">
							<CheckCircle size={20} class="text-green-600 dark:text-green-400 mt-0.5" />
							<span>Payments processed monthly for balances over $100</span>
						</li>
					</ul>
				</div>
			{/if}
		</div>
	</div>
{/if}
