import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import Stripe from 'stripe';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request, url, locals }) => {
	try {
		const { tier } = await request.json();

		// Validate tier
		if (!['mid', 'big'].includes(tier)) {
			return json({ success: false, error: 'Invalid tier' }, { status: 400 });
		}

		// Get session from locals (set by hooks.server.ts)
		const { session: userSession, user } = await locals.safeGetSession();

		if (!userSession || !user) {
			return json({ success: false, error: 'Unauthorized' }, { status: 401 });
		}

		// Get current profile
		const { data: profile, error: profileError } = await locals.supabase
			.from('profiles')
			.select('*')
			.eq('id', user.id)
			.single();

		if (profileError || !profile) {
			return json({ success: false, error: 'Profile not found' }, { status: 404 });
		}

		// Check if test mode is enabled
		const { data: testModeSetting } = await locals.supabase
			.from('system_settings')
			.select('value')
			.eq('key', 'stripe_test_mode')
			.single();

		const isTestMode = testModeSetting?.value === 'true';

		// Use appropriate Stripe client based on mode
		const stripeSecretKey = isTestMode ? (env.STRIPE_TEST_SECRET_KEY || env.STRIPE_SECRET_KEY) : env.STRIPE_SECRET_KEY;
		const stripe = new Stripe(stripeSecretKey, {
			apiVersion: '2025-02-24.acacia'
		});

		// Use existing Stripe customer if available, otherwise let Stripe create one during checkout
		// The customer ID will be saved to the profile via webhook after successful payment
		let customerId = profile.stripe_customer_id;

		// Define price IDs based on mode
		const priceIds: Record<string, string> = isTestMode
			? {
					mid: env.STRIPE_TEST_PRICE_ID_MID || env.STRIPE_PRICE_ID_MID,
					big: env.STRIPE_TEST_PRICE_ID_BIG || env.STRIPE_PRICE_ID_BIG
			  }
			: {
					mid: env.STRIPE_PRICE_ID_MID,
					big: env.STRIPE_PRICE_ID_BIG
			  };

		// Create checkout session with hosted mode (redirects to Stripe)
		const checkoutSessionParams: Stripe.Checkout.SessionCreateParams = {
			// Use existing customer ID if available, otherwise let Stripe create a new customer
			...(customerId ? { customer: customerId } : { customer_email: profile.email }),
			mode: 'subscription',
			line_items: [
				{
					price: priceIds[tier],
					quantity: 1
				}
			],
			success_url: `${url.origin}/subscribe/success?session_id={CHECKOUT_SESSION_ID}&tier=${tier}`,
			cancel_url: `${url.origin}/subscribe?canceled=true`,
			metadata: {
				user_id: user.id,
				tier,
				username: profile.username,
				test_mode: isTestMode.toString()
			}
		};

		const checkoutSession = await stripe.checkout.sessions.create(checkoutSessionParams);

		return json({
			success: true,
			sessionId: checkoutSession.id,
			url: checkoutSession.url,
			isTestMode
		});
	} catch (error) {
		console.error('Stripe checkout error:', error);
		return json({ success: false, error: 'Failed to create checkout session' }, { status: 500 });
	}
};
