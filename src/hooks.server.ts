import type { Handle } from '@sveltejs/kit';

// Simplified server hooks - auth is now handled entirely client-side
// Keep this file for future server-side needs (API routes, etc.)
export const handle: Handle = async ({ event, resolve }) => {
	return resolve(event);
};
