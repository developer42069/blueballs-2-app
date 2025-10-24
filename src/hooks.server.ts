import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { createServerClient } from '@supabase/ssr';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	try {
		/**
		 * Creates a Supabase client specific to this server request.
		 *
		 * The Supabase client is configured to use cookies to persist the user session.
		 */
		event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
			cookies: {
				getAll: () => event.cookies.getAll(),
				/**
				 * SvelteKit's cookies API requires explicitly setting the path to '/'
				 * to persist cookies across all routes.
				 */
				setAll: (cookiesToSet) => {
					cookiesToSet.forEach(({ name, value, options }) => {
						event.cookies.set(name, value, { ...options, path: '/' });
					});
				}
			}
		});

		/**
		 * Unlike `supabase.auth.getSession()`, which returns the session _without_
		 * validating the JWT, this function validates the JWT before returning the session.
		 *
		 * This is important for security because it ensures the user is actually authenticated
		 * before allowing access to protected resources.
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
				/**
				 * Supabase libraries use the `content-range` and `x-supabase-api-version`
				 * headers, so we need to tell SvelteKit to pass them through.
				 */
				return name === 'content-range' || name === 'x-supabase-api-version';
			}
		});
	} catch (error) {
		console.error('Critical error in hooks.server.ts handle function:', error);
		// If hooks fail, we still need to resolve the request
		// This prevents total app crash
		return resolve(event);
	}
};
