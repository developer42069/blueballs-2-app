import { env } from '$env/dynamic/public';
import { createServerClient } from '@supabase/ssr';
import type { Handle } from '@sveltejs/kit';

/**
 * Server-side auth hooks for API routes
 *
 * Note: This is SEPARATE from client-side auth in +layout.svelte
 * - Client pages use simple @supabase/supabase-js with localStorage
 * - API routes use this server-side client with cookie-based sessions
 */
export const handle: Handle = async ({ event, resolve }) => {
	try {
		// Create a Supabase server client for this request
		// This is used by API routes to validate authenticated requests
		event.locals.supabase = createServerClient(env.PUBLIC_SUPABASE_URL, env.PUBLIC_SUPABASE_ANON_KEY, {
			cookies: {
				getAll: () => event.cookies.getAll(),
				setAll: (cookiesToSet) => {
					cookiesToSet.forEach(({ name, value, options }) => {
						event.cookies.set(name, value, { ...options, path: '/' });
					});
				}
			}
		});

		/**
		 * Safely get session with JWT validation
		 * API routes use this to verify the user is authenticated
		 */
		event.locals.safeGetSession = async () => {
			try {
				const {
					data: { user },
					error
				} = await event.locals.supabase.auth.getUser();

				if (error) {
					console.error('Error getting user in safeGetSession:', error);
					return { session: null, user: null };
				}

				const {
					data: { session }
				} = await event.locals.supabase.auth.getSession();

				return { session, user };
			} catch (err) {
				console.error('Exception in safeGetSession:', err);
				return { session: null, user: null };
			}
		};

		return resolve(event, {
			filterSerializedResponseHeaders(name) {
				return name === 'content-range' || name === 'x-supabase-api-version';
			}
		});
	} catch (error) {
		console.error('Critical error in hooks.server.ts:', error);
		return resolve(event);
	}
};
