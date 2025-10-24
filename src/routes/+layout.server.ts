import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	try {
		const { session, user } = await locals.safeGetSession();

		return {
			session,
			user
		};
	} catch (error) {
		console.error('Error in root layout server load:', error);
		// Return null values instead of crashing with 500
		return {
			session: null,
			user: null
		};
	}
};
