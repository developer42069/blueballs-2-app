import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import Stripe from 'stripe';
import { STRIPE_SECRET_KEY, STRIPE_PRICE_ID_MID, STRIPE_PRICE_ID_BIG } from '$env/static/private';

const stripe = new Stripe(STRIPE_SECRET_KEY, {
	apiVersion: '2025-02-24.acacia'
});

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const { newTier } = await request.json();

		// Validate tier
		if (!['mid', 'big'].includes(newTier)) {
			return json({ success: false, error: 'Invalid tier' }, { status: 400 });
		}

		// Get session from locals (set by hooks.server.ts)
		const { session, user } = await locals.safeGetSession();

		if (!session || !user) {
			return json({ success: false, error: 'Unauthorized' }, { status: 401 });
		}

		// Get user profile
		const { data: profile, error: profileError } = await locals.supabase
			.from('profiles')
			.select('*')
			.eq('id', user.id)
			.single();

		if (profileError || !profile) {
			return json({ success: false, error: 'Profile not found' }, { status: 404 });
		}

		// Check if user has an active subscription
		if (!profile.stripe_subscription_id) {
			return json({ success: false, error: 'No active subscription to change' }, { status: 400 });
		}

		// Get current subscription
		const currentSubscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id);

		// Determine new price ID
		const priceIds: Record<string, string> = {
			mid: STRIPE_PRICE_ID_MID,
			big: STRIPE_PRICE_ID_BIG
		};

		const newPriceId = priceIds[newTier];

		// Update the subscription with proration
		const updatedSubscription = await stripe.subscriptions.update(
			profile.stripe_subscription_id,
			{
				items: [
					{
						id: currentSubscription.items.data[0].id,
						price: newPriceId
					}
				],
				proration_behavior: 'always_invoice', // Immediately invoice for proration
				metadata: {
					user_id: user.id,
					tier: newTier
				}
			}
		);

		// Update profile with new tier (webhook will also do this, but we do it here for immediate effect)
		await locals.supabase
			.from('profiles')
			.update({
				membership_tier: newTier,
				// Update lives based on tier
				...(newTier === 'big' && {
					max_lives: 999999,
					lives_per_hour: 999999
				}),
				...(newTier === 'mid' && {
					max_lives: 1000,
					lives_per_hour: 40
				})
			})
			.eq('id', user.id);

		return json({
			success: true,
			message: `Subscription changed to ${newTier} successfully`,
			subscription: {
				id: updatedSubscription.id,
				status: updatedSubscription.status,
				current_period_end: updatedSubscription.current_period_end
			}
		});
	} catch (error: any) {
		console.error('Change subscription error:', error);
		return json({
			success: false,
			error: error.message || 'Failed to change subscription'
		}, { status: 500 });
	}
};
