import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import Stripe from 'stripe';
import { STRIPE_SECRET_KEY } from '$env/static/private';

const stripe = new Stripe(STRIPE_SECRET_KEY, {
	apiVersion: '2025-02-24.acacia'
});

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
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

		// Check if user has a subscription
		if (!profile.stripe_subscription_id) {
			return json({ success: false, error: 'No active subscription found' }, { status: 400 });
		}

		// Cancel the subscription at period end (user keeps access until then)
		const subscription = await stripe.subscriptions.update(
			profile.stripe_subscription_id,
			{
				cancel_at_period_end: true
			}
		);

		// Update profile to reflect cancellation
		await locals.supabase
			.from('profiles')
			.update({
				subscription_ends_at: new Date(subscription.current_period_end * 1000).toISOString()
			})
			.eq('id', user.id);

		return json({
			success: true,
			message: 'Subscription cancelled successfully',
			endsAt: new Date(subscription.current_period_end * 1000).toISOString()
		});
	} catch (error: any) {
		console.error('Cancel subscription error:', error);
		return json({
			success: false,
			error: error.message || 'Failed to cancel subscription'
		}, { status: 500 });
	}
};
