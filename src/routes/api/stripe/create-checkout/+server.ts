import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import Stripe from 'stripe';
import { STRIPE_SECRET_KEY, STRIPE_PRICE_ID_MID, STRIPE_PRICE_ID_BIG } from '$env/static/private';

const stripe = new Stripe(STRIPE_SECRET_KEY, {
	apiVersion: '2025-02-24.acacia'
});

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

		// Create or retrieve Stripe customer
		let customerId = profile.stripe_customer_id;

		if (!customerId) {
			const customer = await stripe.customers.create({
				email: profile.email,
				metadata: {
					user_id: user.id,
					username: profile.username
				}
			});

			customerId = customer.id;

			// Update profile with customer ID
			await locals.supabase
				.from('profiles')
				.update({ stripe_customer_id: customerId })
				.eq('id', user.id);
		}

		// Define price IDs
		const priceIds: Record<string, string> = {
			mid: STRIPE_PRICE_ID_MID,
			big: STRIPE_PRICE_ID_BIG
		};

		// Create checkout session
		const checkoutSession = await stripe.checkout.sessions.create({
			customer: customerId,
			mode: 'subscription',
			line_items: [
				{
					price: priceIds[tier],
					quantity: 1
				}
			],
			success_url: `${url.origin}/subscribe/success?session_id={CHECKOUT_SESSION_ID}&tier=${tier}`,
			cancel_url: `${url.origin}/subscribe`,
			metadata: {
				user_id: user.id,
				tier
			}
		});

		return json({
			success: true,
			sessionId: checkoutSession.id,
			url: checkoutSession.url
		});
	} catch (error) {
		console.error('Stripe checkout error:', error);
		return json({ success: false, error: 'Failed to create checkout session' }, { status: 500 });
	}
};
