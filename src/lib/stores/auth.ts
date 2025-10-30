import { writable, get } from 'svelte/store';
import type { User, Session } from '@supabase/supabase-js';
import type { Profile } from '$lib/supabase';
import { supabase } from '$lib/supabase';

export const user = writable<User | null>(null);
export const session = writable<Session | null>(null);
export const profile = writable<Profile | null>(null);
export const loading = writable(true);

/**
 * Initialize authentication state and set up listener
 * Call this once in the root layout component
 *
 * @returns The auth subscription (for cleanup)
 */
export async function initializeAuth() {
	try {
		console.log('Initializing auth...');

		// Get current session
		const { data: { session: currentSession }, error } = await supabase.auth.getSession();
		if (error) {
			console.error('Error getting session:', error);
			throw error;
		}

		// Set initial state
		session.set(currentSession);
		user.set(currentSession?.user ?? null);

		console.log('Initial session loaded:', currentSession?.user?.id ?? 'no user');

		// Listen for auth changes
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange(async (event, newSession) => {
			console.log('Auth state changed:', event, newSession?.user?.id ?? 'no user');
			session.set(newSession);
			user.set(newSession?.user ?? null);
		});

		loading.set(false);
		return subscription;
	} catch (error) {
		console.error('Auth initialization error:', error);
		loading.set(false);
		return null;
	}
}

/**
 * Refresh the profile from the database
 * This ensures all components have the latest profile data
 *
 * @returns Promise that resolves when profile is refreshed (does not throw errors)
 */
export async function refreshProfile(): Promise<void> {
	const currentUser = get(user);
	if (!currentUser) {
		console.warn('Cannot refresh profile: No user logged in');
		return;
	}

	try {
		const { data, error } = await supabase
			.from('profiles')
			.select('*')
			.eq('id', currentUser.id)
			.single();

		if (error) {
			console.error('Failed to refresh profile:', error);
			// Don't throw - just log the error to prevent page crashes
			return;
		}

		if (data) {
			profile.set(data);
			console.log('Profile refreshed successfully');
		}
	} catch (error) {
		console.error('Error refreshing profile:', error);
		// Don't throw - just log the error to prevent page crashes
	}
}
