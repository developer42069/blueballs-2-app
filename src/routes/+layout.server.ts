import type { LayoutServerLoad } from './$types';

// Server-side session loading is no longer needed with client-side auth
// The client handles session persistence via localStorage
export const load: LayoutServerLoad = async () => {
	return {};
};
