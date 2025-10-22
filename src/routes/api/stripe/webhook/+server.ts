import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabase';
import Stripe from 'stripe';
import {
	STRIPE_SECRET_KEY,
	STRIPE_WEBHOOK_SECRET,
	STRIPE_TEST_SECRET_KEY,
	STRIPE_TEST_WEBHOOK_SECRET
} from '$env/static/private';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const body = await request.text();
		const signature = request.headers.get('stripe-signature');

		if (!signature) {
			return json({ error: 'No signature' }, { status: 400 });
		}

		// Check if test mode is enabled
		const { data: testModeSetting } = await locals.supabase
			.from('system_settings')
			.select('value')
			.eq('key', 'stripe_test_mode')
			.single();

		const isTestMode = testModeSetting?.value === 'true';

		// Use appropriate Stripe client and webhook secret based on mode
		const stripeSecretKey = isTestMode
			? (STRIPE_TEST_SECRET_KEY || STRIPE_SECRET_KEY)
			: STRIPE_SECRET_KEY;
		const webhookSecret = isTestMode
			? (STRIPE_TEST_WEBHOOK_SECRET || STRIPE_WEBHOOK_SECRET)
			: STRIPE_WEBHOOK_SECRET;

		const stripe = new Stripe(stripeSecretKey, {
			apiVersion: '2025-02-24.acacia'
		});

		// Verify webhook signature
		let event: Stripe.Event;

		try {
			event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
		} catch (err) {
			console.error('Webhook signature verification failed:', err);
			return json({ error: 'Invalid signature' }, { status: 400 });
		}

		// Handle the event
		switch (event.type) {
			case 'checkout.session.completed': {
				const session = event.data.object as Stripe.Checkout.Session;
				await handleCheckoutComplete(session, stripe);
				break;
			}

			case 'customer.subscription.updated': {
				const subscription = event.data.object as Stripe.Subscription;
				await handleSubscriptionUpdated(subscription);
				break;
			}

			case 'customer.subscription.deleted': {
				const subscription = event.data.object as Stripe.Subscription;
				await handleSubscriptionDeleted(subscription);
				break;
			}

			case 'invoice.payment_succeeded': {
				const invoice = event.data.object as Stripe.Invoice;
				await handlePaymentSucceeded(invoice);
				break;
			}

			case 'invoice.payment_failed': {
				const invoice = event.data.object as Stripe.Invoice;
				await handlePaymentFailed(invoice);
				break;
			}

			default:
				console.log(`Unhandled event type: ${event.type}`);
		}

		return json({ received: true });
	} catch (error) {
		console.error('Webhook error:', error);
		return json({ error: 'Webhook handler failed' }, { status: 500 });
	}
};

async function handleCheckoutComplete(session: Stripe.Checkout.Session, stripe: Stripe) {
	const userId = session.metadata?.user_id;
	const tier = session.metadata?.tier as 'mid' | 'big';

	if (!userId || !tier) {
		console.error('Missing metadata in checkout session');
		return;
	}

	// Get subscription details
	const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

	// Update user profile
	const updates: any = {
		membership_tier: tier,
		stripe_subscription_id: subscription.id,
		subscription_ends_at: new Date(subscription.current_period_end * 1000).toISOString()
	};

	// Update lives based on tier
	if (tier === 'mid') {
		updates.lives_per_hour = 40;
		updates.max_lives = 1000;
	} else if (tier === 'big') {
		updates.lives_per_hour = 9999; // Effectively unlimited
		updates.max_lives = 999999;
		updates.lives = 999999;
	}

	await supabase
		.from('profiles')
		.update(updates)
		.eq('id', userId);

	console.log(`Subscription activated for user ${userId} - ${tier}`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
	const customerId = subscription.customer as string;

	// Find user by customer ID
	const { data: profile } = await supabase
		.from('profiles')
		.select('id')
		.eq('stripe_customer_id', customerId)
		.single();

	if (!profile) {
		console.error('Profile not found for customer:', customerId);
		return;
	}

	// Update subscription end date
	await supabase
		.from('profiles')
		.update({
			subscription_ends_at: new Date(subscription.current_period_end * 1000).toISOString()
		})
		.eq('id', profile.id);

	console.log(`Subscription updated for user ${profile.id}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
	const customerId = subscription.customer as string;

	// Find user by customer ID
	const { data: profile } = await supabase
		.from('profiles')
		.select('id')
		.eq('stripe_customer_id', customerId)
		.single();

	if (!profile) {
		console.error('Profile not found for customer:', customerId);
		return;
	}

	// Downgrade to free tier
	await supabase
		.from('profiles')
		.update({
			membership_tier: 'free',
			stripe_subscription_id: null,
			subscription_ends_at: null,
			lives_per_hour: 4,
			max_lives: 100
		})
		.eq('id', profile.id);

	console.log(`Subscription cancelled for user ${profile.id}`);
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
	console.log(`Payment succeeded for invoice ${invoice.id}`);
	// Additional logic if needed
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
	const customerId = invoice.customer as string;

	// Find user by customer ID
	const { data: profile } = await supabase
		.from('profiles')
		.select('email, username')
		.eq('stripe_customer_id', customerId)
		.single();

	if (!profile) {
		console.error('Profile not found for customer:', customerId);
		return;
	}

	console.log(`Payment failed for user ${profile.username} (${profile.email})`);
	// You could send an email notification here
}
