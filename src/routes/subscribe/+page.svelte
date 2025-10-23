<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { user, profile } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabase';
	import { MEMBERSHIP_TIERS } from '$lib/utils/gameConfig';
	import { Heart, Zap, Star, CheckCircle, X, Crown, Image, MessageCircle, XCircle } from 'lucide-svelte';
	import { analytics } from '$lib/analytics';
	import StripeEmbeddedCheckout from '$lib/components/StripeEmbeddedCheckout.svelte';
	import { PUBLIC_SUPABASE_URL } from '$env/static/public';

	let loading = true;
	let processingCheckout = false;
	let error = '';
	let success = '';
	let cancelLoading = false;
	let changingSubscription = false;

	// Embedded checkout state
	let showCheckout = false;
	let checkoutClientSecret = '';
	let checkoutPublishableKey = '';
	let checkoutIsTestMode = false;
	let selectedTier: 'mid' | 'big' | null = null;

	// Reset states and refresh session when user returns (e.g., from back button)
	const handleVisibilityChange = async () => {
		if (document.visibilityState === 'visible') {
			// Reset checkout states
			processingCheckout = false;
			changingSubscription = false;
			showCheckout = false;
			checkoutClientSecret = '';
			selectedTier = null;

			// Refresh auth session to ensure it's valid
			if ($user) {
				const { data } = await supabase.auth.refreshSession();
				if (data.session) {
					// Session is valid, reload profile
					const { data: profileData } = await supabase
						.from('profiles')
						.select('*')
						.eq('id', $user.id)
						.single();

					if (profileData) {
						$profile = profileData;
					}
				}
			}
		}
	};

	// Also handle focus events
	const handleFocus = async () => {
		processingCheckout = false;
		changingSubscription = false;
		showCheckout = false;

		// Refresh session
		if ($user) {
			await supabase.auth.refreshSession();
		}
	};

	onMount(async () => {
		// Wait a bit for auth to load before redirecting
		await new Promise(resolve => setTimeout(resolve, 500));

		if (!$user) {
			goto('/auth/login');
			return;
		}

		// Track subscription page view
		analytics.viewSubscription();

		loading = false;

		// Add event listeners
		document.addEventListener('visibilitychange', handleVisibilityChange);
		window.addEventListener('focus', handleFocus);
	});

	onDestroy(() => {
		// Clean up event listeners
		document.removeEventListener('visibilitychange', handleVisibilityChange);
		window.removeEventListener('focus', handleFocus);

		// Clean up any pending states
		showCheckout = false;
		checkoutClientSecret = '';
	});

	async function handleSubscribe(tier: 'mid' | 'big') {
		if (!$user) return;

		processingCheckout = true;
		error = '';
		selectedTier = tier;

		try {
			// Track checkout initiation
			const value = tier === 'mid' ? 2 : 10;
			analytics.initiateCheckout(tier, value);

			// Get the publishable key from env or fetch it
			// We need to know if we're in test mode to use the right key
			const settingsResponse = await fetch('/api/stripe/get-publishable-key', {
				credentials: 'same-origin'
			});

			if (!settingsResponse.ok) {
				throw new Error('Failed to get Stripe configuration');
			}

			const { publishableKey, isTestMode } = await settingsResponse.json();

			// Call API to create embedded checkout session
			const response = await fetch('/api/stripe/create-checkout', {
				method: 'POST',
				credentials: 'same-origin',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					tier,
					useEmbedded: true
				})
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Failed to create checkout session');
			}

			const { clientSecret, isTestMode: testMode } = await response.json();

			// Show embedded checkout
			checkoutClientSecret = clientSecret;
			checkoutPublishableKey = publishableKey;
			checkoutIsTestMode = testMode;
			showCheckout = true;
			processingCheckout = false;
		} catch (e: any) {
			error = e.message || 'Failed to start checkout process';
			processingCheckout = false;
			showCheckout = false;
		}
	}

	function closeCheckout() {
		showCheckout = false;
		checkoutClientSecret = '';
		selectedTier = null;
		error = '';
	}

	async function handleChangeSubscription(newTier: 'mid' | 'big') {
		if (!$user || !$profile) return;

		const currentTier = $profile.membership_tier;
		const isUpgrade = (currentTier === 'mid' && newTier === 'big');
		const action = isUpgrade ? 'upgrade' : 'downgrade';
		const tierName = newTier === 'mid' ? 'Mid' : 'Big';

		if (!confirm(`${isUpgrade ? 'Upgrade' : 'Downgrade'} to ${tierName}?\n\nYou'll be charged/credited proportionally for the time remaining in your billing period. The change takes effect immediately!`)) {
			return;
		}

		changingSubscription = true;
		error = '';
		success = '';

		try {
			// Track subscription change
			analytics.subscriptionChange(currentTier, newTier);

			const response = await fetch('/api/change-subscription', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
				},
				body: JSON.stringify({ newTier })
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Failed to change subscription');
			}

			success = `Successfully ${action}d to ${tierName}! Your new benefits are active immediately.`;

			// Reload profile
			const { data } = await supabase
				.from('profiles')
				.select('*')
				.eq('id', $user.id)
				.single();

			if (data) $profile = data;

			// Redirect to success page after a brief moment
			setTimeout(() => {
				goto(`/subscribe/success?tier=${newTier}`);
			}, 1500);
		} catch (e: any) {
			error = e.message || 'Failed to change subscription';
		} finally {
			changingSubscription = false;
		}
	}

	async function handleCancelSubscription() {
		if (!$user || !$profile) return;

		const tierName = $profile.membership_tier === 'mid' ? 'Mid' : 'Big';

		if (!confirm(`Are you sure you want to cancel your ${tierName} subscription?\n\nYou'll keep all premium features until the end of your billing period, then automatically return to the Free tier.\n\nNo refunds will be issued.`)) {
			return;
		}

		cancelLoading = true;
		error = '';
		success = '';

		try {
			// Track subscription cancellation
			analytics.subscriptionCancel($profile.membership_tier);

			const response = await fetch('/api/cancel-subscription', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
				}
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Failed to cancel subscription');
			}

			const result = await response.json();
			const endDate = new Date(result.endsAt).toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'long',
				day: 'numeric'
			});

			success = `Subscription cancelled successfully! You'll keep your ${tierName} benefits until ${endDate}, then return to the Free tier.`;

			// Reload profile
			const { data } = await supabase
				.from('profiles')
				.select('*')
				.eq('id', $user.id)
				.single();

			if (data) $profile = data;
		} catch (e: any) {
			error = e.message || 'Failed to cancel subscription';
		} finally {
			cancelLoading = false;
		}
	}

	function formatDate(dateString: string | null) {
		if (!dateString) return 'N/A';
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>Subscribe - Blue Balls</title>
</svelte:head>

{#if loading}
	<div class="min-h-screen flex items-center justify-center">
		<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
	</div>
{:else}
	<div class="min-h-screen p-4">
		<div class="max-w-7xl mx-auto">
			<h1 class="text-3xl md:text-4xl font-bold mb-2 text-center">Choose Your Plan</h1>
			<p class="text-center dark:text-gray-300 mb-8">Upgrade for more lives, custom profiles, and more!</p>

			{#if error}
				<div class="bg-red-100 dark:bg-red-900/20 border border-red-400 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-4 max-w-2xl mx-auto">
					{error}
				</div>
			{/if}

			{#if success}
				<div class="bg-green-100 dark:bg-green-900/20 border border-green-400 text-green-700 dark:text-green-400 px-4 py-3 rounded mb-4 max-w-2xl mx-auto">
					{success}
				</div>
			{/if}

			<!-- Current Subscription Status -->
			{#if $profile && $profile.membership_tier !== 'free'}
				<div class="card max-w-2xl mx-auto mb-8 bg-gradient-to-br from-primary to-secondary text-white">
					<div class="flex items-center justify-between flex-wrap gap-4">
						<div class="flex-1">
							<h3 class="text-xl font-bold mb-1">Current Plan: {MEMBERSHIP_TIERS[$profile.membership_tier].name}</h3>
							<p class="text-sm opacity-90">
								{#if $profile.subscription_ends_at}
									{#if $profile.stripe_subscription_id}
										Renews on: {formatDate($profile.subscription_ends_at)}
									{:else}
										<strong>⚠️ Cancelled</strong> - Access ends: {formatDate($profile.subscription_ends_at)}
									{/if}
								{:else}
									Active
								{/if}
							</p>
						</div>
						{#if $profile.stripe_subscription_id}
							<button
								on:click={handleCancelSubscription}
								class="btn-primary bg-red-500 hover:bg-red-600 flex items-center gap-2"
								disabled={cancelLoading}
							>
								<XCircle size={18} />
								{cancelLoading ? 'Cancelling...' : 'Cancel Subscription'}
							</button>
						{:else}
							<div class="text-sm opacity-90">
								Subscription cancelled<br>
								Returns to Free after expiry
							</div>
						{/if}
					</div>
				</div>
			{/if}

			<!-- Pricing Cards -->
			<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
				<!-- Free Tier -->
				<div class="card relative {$profile?.membership_tier === 'free' ? 'ring-2 ring-primary' : ''}">
					{#if $profile?.membership_tier === 'free'}
						<div class="absolute top-4 right-4 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">
							CURRENT
						</div>
					{/if}
					<div class="text-center mb-6">
						<Heart size={48} class="mx-auto mb-2 text-blue-500" />
						<h2 class="text-2xl font-bold mb-2">BlueBalls</h2>
						<div class="text-4xl font-bold mb-2">FREE</div>
						<p class="text-sm dark:text-gray-300">Perfect for casual players</p>
					</div>

					<ul class="space-y-3 mb-6">
						<li class="flex items-start gap-2">
							<CheckCircle size={18} class="text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
							<span class="text-sm">4 lives per hour</span>
						</li>
						<li class="flex items-start gap-2">
							<CheckCircle size={18} class="text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
							<span class="text-sm">Max 100 lives/day</span>
						</li>
						<li class="flex items-start gap-2">
							<CheckCircle size={18} class="text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
							<span class="text-sm">Basic profile</span>
						</li>
						<li class="flex items-start gap-2">
							<X size={18} class="text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
							<span class="text-sm">No custom profile picture</span>
						</li>
						<li class="flex items-start gap-2">
							<X size={18} class="text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
							<span class="text-sm">Chat cooldown: 10 minutes</span>
						</li>
					</ul>

					<button class="btn-primary bg-gray-400 cursor-not-allowed w-full" disabled>
						Current Plan
					</button>
				</div>

				<!-- Mid Tier -->
				<div class="card relative {$profile?.membership_tier === 'mid' ? 'ring-2 ring-orange-500' : ''}">
					{#if $profile?.membership_tier === 'mid'}
						<div class="absolute top-4 right-4 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
							CURRENT
						</div>
					{/if}
					<div class="text-center mb-6">
						<Zap size={48} class="mx-auto mb-2 text-orange-500" />
						<h2 class="text-2xl font-bold mb-2">BlueBalls Mid</h2>
						<div class="text-4xl font-bold mb-2">
							$2<span class="text-lg">/month</span>
						</div>
						<p class="text-sm dark:text-gray-300">For dedicated players</p>
					</div>

					<ul class="space-y-3 mb-6">
						<li class="flex items-start gap-2">
							<CheckCircle size={18} class="text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
							<span class="text-sm font-bold">40 lives per hour</span>
						</li>
						<li class="flex items-start gap-2">
							<CheckCircle size={18} class="text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
							<span class="text-sm font-bold">Max 1000 lives/day</span>
						</li>
						<li class="flex items-start gap-2">
							<Image size={18} class="text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
							<span class="text-sm font-bold">Custom profile picture</span>
						</li>
						<li class="flex items-start gap-2">
							<MessageCircle size={18} class="text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
							<span class="text-sm font-bold">Chat cooldown: 3 minutes</span>
						</li>
						<li class="flex items-start gap-2">
							<Star size={18} class="text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
							<span class="text-sm">Priority support</span>
						</li>
					</ul>

					{#if $profile?.membership_tier === 'mid'}
						<button class="btn-primary bg-gray-400 cursor-not-allowed w-full" disabled>
							Current Plan
						</button>
					{:else if $profile?.membership_tier === 'big'}
						<button
							on:click={() => handleChangeSubscription('mid')}
							class="btn-primary bg-orange-500 hover:bg-orange-600 w-full"
							disabled={changingSubscription}
						>
							{changingSubscription ? 'Switching...' : 'Switch to Mid'}
						</button>
					{:else if $profile?.membership_tier === 'free'}
						<button
							on:click={() => handleSubscribe('mid')}
							class="btn-primary bg-orange-500 hover:bg-orange-600 w-full"
							disabled={processingCheckout}
						>
							{processingCheckout ? 'Processing...' : 'Upgrade to Mid'}
						</button>
					{/if}
				</div>

				<!-- Big Tier -->
				<div class="card relative bg-gradient-to-br from-secondary to-pink-600 text-white {$profile?.membership_tier === 'big' ? 'ring-4 ring-yellow-400' : ''}">
					<div class="absolute top-4 right-4 bg-yellow-400 text-gray-900 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
						<Crown size={14} />
						{$profile?.membership_tier === 'big' ? 'CURRENT' : 'POPULAR'}
					</div>

					<div class="text-center mb-6">
						<Crown size={48} class="mx-auto mb-2" />
						<h2 class="text-2xl font-bold mb-2">BlueBalls Big</h2>
						<div class="text-4xl font-bold mb-2">
							$10<span class="text-lg">/month</span>
						</div>
						<p class="text-sm opacity-90">Ultimate gaming experience</p>
					</div>

					<ul class="space-y-3 mb-6">
						<li class="flex items-start gap-2">
							<CheckCircle size={18} class="mt-0.5 flex-shrink-0" />
							<span class="text-sm font-bold">UNLIMITED lives</span>
						</li>
						<li class="flex items-start gap-2">
							<CheckCircle size={18} class="mt-0.5 flex-shrink-0" />
							<span class="text-sm font-bold">No daily limits</span>
						</li>
						<li class="flex items-start gap-2">
							<Image size={18} class="mt-0.5 flex-shrink-0" />
							<span class="text-sm font-bold">Custom profile picture</span>
						</li>
						<li class="flex items-start gap-2">
							<MessageCircle size={18} class="mt-0.5 flex-shrink-0" />
							<span class="text-sm font-bold">Chat cooldown: 1 minute</span>
						</li>
						<li class="flex items-start gap-2">
							<Star size={18} class="mt-0.5 flex-shrink-0" />
							<span class="text-sm font-bold">Ad-free experience</span>
						</li>
						<li class="flex items-start gap-2">
							<Crown size={18} class="mt-0.5 flex-shrink-0" />
							<span class="text-sm font-bold">Exclusive Big badge</span>
						</li>
					</ul>

					{#if $profile?.membership_tier === 'big'}
						<button class="btn-primary bg-white/20 cursor-not-allowed w-full" disabled>
							Current Plan
						</button>
					{:else if $profile?.membership_tier === 'mid'}
						<button
							on:click={() => handleChangeSubscription('big')}
							class="btn-primary bg-white text-primary hover:bg-gray-100 w-full font-bold"
							disabled={changingSubscription}
						>
							{changingSubscription ? 'Upgrading...' : 'Upgrade to Big'}
						</button>
					{:else if $profile?.membership_tier === 'free'}
						<button
							on:click={() => handleSubscribe('big')}
							class="btn-primary bg-white text-primary hover:bg-gray-100 w-full font-bold"
							disabled={processingCheckout}
						>
							{processingCheckout ? 'Processing...' : 'Upgrade to Big'}
						</button>
					{/if}
				</div>
			</div>

			<!-- FAQ Section -->
			<div class="card max-w-4xl mx-auto">
				<h2 class="text-2xl font-bold mb-6 text-center">Frequently Asked Questions</h2>

				<div class="space-y-6">
					<div>
						<h3 class="font-bold mb-2">How do lives work?</h3>
						<p class="dark:text-gray-300 text-sm">
							Lives regenerate automatically based on your membership tier. Free members get 4 per hour,
							Mid members get 40 per hour, and Big members have unlimited lives with no waiting!
						</p>
					</div>

					<div>
						<h3 class="font-bold mb-2">Can I cancel anytime?</h3>
						<p class="dark:text-gray-300 text-sm">
							Yes! You can cancel your subscription at any time. You'll keep all premium features
							until the end of your billing period. After that, you'll automatically return to the Free tier.
							Your game progress and stats will be preserved.
						</p>
					</div>

					<div>
						<h3 class="font-bold mb-2">How do I switch between Mid and Big?</h3>
						<p class="dark:text-gray-300 text-sm">
							You can switch between Mid and Big instantly! Stripe automatically handles prorated billing:
							<br><br>
							<strong>Upgrading from Mid to Big:</strong> Click "Upgrade to Big" and you'll be charged the prorated difference immediately.
							<br><br>
							<strong>Downgrading from Big to Mid:</strong> Click "Switch to Mid" and you'll receive a credit for unused time applied to your next invoice.
							<br><br>
							Both changes take effect immediately with no waiting period!
						</p>
					</div>

					<div>
						<h3 class="font-bold mb-2">What payment methods do you accept?</h3>
						<p class="dark:text-gray-300 text-sm">
							We accept all major credit cards, debit cards, and various other payment methods through Stripe.
						</p>
					</div>

					<div>
						<h3 class="font-bold mb-2">What is your refund policy?</h3>
						<p class="dark:text-gray-300 text-sm">
							We do not offer refunds. When you cancel your subscription, you keep full access to premium features
							until the end of your billing period. This ensures you get what you paid for.
						</p>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- Embedded Checkout Modal -->
{#if showCheckout && checkoutClientSecret}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div class="modal-backdrop" on:click={closeCheckout}>
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div class="modal-content" on:click|stopPropagation>
			<div class="modal-header">
				<h2 class="text-2xl font-bold">
					Complete Your Subscription
				</h2>
				<button type="button" class="close-button" on:click={closeCheckout}>
					<X size={24} />
				</button>
			</div>

			<div class="modal-body">
				<StripeEmbeddedCheckout
					clientSecret={checkoutClientSecret}
					publishableKey={checkoutPublishableKey}
					isTestMode={checkoutIsTestMode}
				/>
			</div>
		</div>
	</div>
{/if}

<style>
	/* Modal styles */
	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.8);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 9999;
		padding: 1rem;
		animation: fadeIn 0.2s ease;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.modal-content {
		background: white;
		border-radius: 1rem;
		max-width: 700px;
		width: 100%;
		max-height: 90vh;
		overflow-y: auto;
		box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
		animation: slideUp 0.3s ease;
	}

	:global(.dark) .modal-content {
		background: #1f2937;
	}

	@keyframes slideUp {
		from {
			transform: translateY(20px);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.5rem;
		border-bottom: 1px solid #e5e7eb;
	}

	:global(.dark) .modal-header {
		border-bottom-color: #374151;
	}

	.modal-header h2 {
		color: #111827;
	}

	:global(.dark) .modal-header h2 {
		color: #f9fafb;
	}

	.close-button {
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.5rem;
		border-radius: 0.5rem;
		color: #6b7280;
		transition: all 0.2s ease;
	}

	.close-button:hover {
		background: #f3f4f6;
		color: #111827;
	}

	:global(.dark) .close-button:hover {
		background: #374151;
		color: #f9fafb;
	}

	.modal-body {
		padding: 1.5rem;
	}
</style>
