import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals }) => {
	try {
		// Check if user is authenticated
		const { session, user } = await locals.safeGetSession();

		if (!session || !user) {
			// Not authenticated - redirect will be handled by client
			return {
				canceled: false,
				session: null,
				user: null
			};
		}

		// Check if user returned from Stripe without completing payment
		const canceled = url.searchParams.get('canceled') === 'true';

		if (canceled) {
			console.log(`User ${user.id} returned from Stripe without completing payment`);
		}

		return {
			canceled,
			session,
			user
		};
	} catch (error) {
		console.error('Error in subscribe page server load:', error);
		// Return safe defaults instead of throwing 500
		return {
			canceled: false,
			session: null,
			user: null
		};
	}
};
