import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	STRIPE_PUBLISHABLE_KEY,
	STRIPE_TEST_PUBLISHABLE_KEY
} from '$env/static/private';

export const GET: RequestHandler = async ({ locals }) => {
	try {
		// Check if test mode is enabled
		const { data: testModeSetting } = await locals.supabase
			.from('system_settings')
			.select('value')
			.eq('key', 'stripe_test_mode')
			.single();

		const isTestMode = testModeSetting?.value === 'true';

		// Return appropriate publishable key
		const publishableKey = isTestMode
			? (STRIPE_TEST_PUBLISHABLE_KEY || STRIPE_PUBLISHABLE_KEY)
			: STRIPE_PUBLISHABLE_KEY;

		return json({
			publishableKey,
			isTestMode
		});
	} catch (error) {
		console.error('Error getting Stripe config:', error);
		return json(
			{ error: 'Failed to get Stripe configuration' },
			{ status: 500 }
		);
	}
};
