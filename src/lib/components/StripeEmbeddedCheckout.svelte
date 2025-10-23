<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { loadStripe } from '@stripe/stripe-js';
	import { Loader2 } from 'lucide-svelte';
	import { PUBLIC_SUPABASE_URL } from '$env/static/public';

	export let clientSecret: string;
	export let publishableKey: string;
	export let isTestMode: boolean = false;

	let loading = true;
	let error = '';
	let checkoutContainer: HTMLDivElement;
	let checkoutInstance: any = null; // Store reference to checkout instance

	onMount(async () => {
		try {
			console.log('Mounting Stripe checkout with clientSecret:', clientSecret.substring(0, 20) + '...');

			// Load Stripe
			const stripe = await loadStripe(publishableKey);

			if (!stripe) {
				throw new Error('Failed to load Stripe');
			}

			// Mount embedded checkout
			checkoutInstance = await stripe.initEmbeddedCheckout({
				clientSecret
			});

			checkoutInstance.mount(checkoutContainer);
			console.log('Stripe checkout mounted successfully');
			loading = false;
		} catch (err: any) {
			console.error('Stripe checkout mount error:', err);
			error = err.message || 'Failed to load checkout';
			loading = false;
		}
	});

	onDestroy(() => {
		// Properly destroy the checkout instance to prevent "multiple checkout" errors
		if (checkoutInstance) {
			console.log('Destroying Stripe checkout instance');
			try {
				checkoutInstance.destroy();
				checkoutInstance = null;
			} catch (err) {
				console.error('Error destroying checkout:', err);
			}
		}
	});
</script>

<div class="stripe-checkout-wrapper">
	<!-- Test Mode Banner -->
	{#if isTestMode}
		<div class="test-mode-banner">
			<div class="test-mode-content">
				<span class="test-mode-icon">⚠️</span>
				<div>
					<strong>TEST MODE</strong>
					<p class="test-mode-text">No real payments will be processed. Use test card: 4242 4242 4242 4242</p>
				</div>
			</div>
		</div>
	{/if}

	<!-- Loading State -->
	{#if loading}
		<div class="loading-container">
			<Loader2 size={48} class="animate-spin text-primary" />
			<p class="loading-text">Loading secure checkout...</p>
		</div>
	{/if}

	<!-- Error State -->
	{#if error}
		<div class="error-container">
			<p class="error-text">{error}</p>
		</div>
	{/if}

	<!-- Checkout Container -->
	<div bind:this={checkoutContainer} class="checkout-container" class:hidden={loading || error}></div>
</div>

<style>
	.stripe-checkout-wrapper {
		width: 100%;
		max-width: 600px;
		margin: 0 auto;
	}

	.test-mode-banner {
		background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
		border: 3px solid #d97706;
		border-radius: 0.75rem;
		padding: 1rem;
		margin-bottom: 1.5rem;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.test-mode-content {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		color: white;
	}

	.test-mode-icon {
		font-size: 1.5rem;
		flex-shrink: 0;
	}

	.test-mode-text {
		font-size: 0.875rem;
		margin: 0.25rem 0 0 0;
		opacity: 0.95;
	}

	.loading-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 2rem;
		gap: 1rem;
	}

	.loading-text {
		color: #6b7280;
		font-size: 0.875rem;
		font-weight: 500;
	}

	:global(.dark) .loading-text {
		color: #9ca3af;
	}

	.error-container {
		padding: 2rem;
		text-align: center;
	}

	.error-text {
		color: #dc2626;
		font-weight: 600;
	}

	:global(.dark) .error-text {
		color: #fca5a5;
	}

	.checkout-container {
		min-height: 400px;
		/* Stripe styles the checkout */
	}

	.hidden {
		display: none;
	}
</style>
