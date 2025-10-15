import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabase';
import Stripe from 'stripe';
import { STRIPE_SECRET_KEY, STRIPE_PRICE_ID_MID, STRIPE_PRICE_ID_BIG } from '$env/static/private';

const stripe = new Stripe(STRIPE_SECRET_KEY, {
	apiVersion: '2024-12-18.acacia'
});

export const POST: RequestHandler = async ({ request, url }) => {
	try {
		const { tier } = await request.json();

		// Validate tier
		if (!['mid', 'big'].includes(tier)) {
			return json({ success: false, error: 'Invalid tier' }, { status: 400 });
		}

		// Get the authorization header
		const authHeader = request.headers.get('authorization');
		if (!authHeader) {
			return json({ success: false, error: 'Unauthorized' }, { status: 401 });
		}

		// Get user from Supabase auth using the access token from header
		const token = authHeader.replace('Bearer ', '');
		const { data: { user }, error: authError } = await supabase.auth.getUser(token);

		if (authError || !user) {
			return json({ success: false, error: 'Unauthorized' }, { status: 401 });
		}

		// Get current profile
		const { data: profile, error: profileError } = await supabase
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
			await supabase
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
		const session = await stripe.checkout.sessions.create({
			customer: customerId,
			mode: 'subscription',
			line_items: [
				{
					price: priceIds[tier],
					quantity: 1
				}
			],
			success_url: `${url.origin}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
			cancel_url: `${url.origin}/subscribe`,
			metadata: {
				user_id: user.id,
				tier
			}
		});

		return json({
			success: true,
			sessionId: session.id,
			url: session.url
		});
	} catch (error) {
		console.error('Stripe checkout error:', error);
		return json({ success: false, error: 'Failed to create checkout session' }, { status: 500 });
	}
};
