import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals }) => {
	try {
		// Check if user is authenticated (but don't return session/user - parent layout provides those)
		const { session, user } = await locals.safeGetSession();

		if (!session || !user) {
			// Not authenticated - redirect will be handled by client
			// Only return page-specific data
			return {
				canceled: false
			};
		}

		// Check if user returned from Stripe without completing payment
		const canceled = url.searchParams.get('canceled') === 'true';

		if (canceled) {
			console.log(`User ${user.id} returned from Stripe without completing payment`);
		}

		// Only return page-specific data - parent layout already provides session/user
		return {
			canceled
		};
	} catch (error) {
		console.error('Error in subscribe page server load:', error);
		// Return safe default for page-specific data only
		return {
			canceled: false
		};
	}
};
