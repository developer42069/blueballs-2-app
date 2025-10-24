import { writable, get } from 'svelte/store';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '$lib/supabase';
import { supabase } from '$lib/supabase';

export const user = writable<User | null>(null);
export const profile = writable<Profile | null>(null);
export const loading = writable(true);

/**
 * Refresh the profile from the database
 * This ensures all components have the latest profile data
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
			throw error;
		}

		if (data) {
			profile.set(data);
			console.log('Profile refreshed successfully');
		}
	} catch (error) {
		console.error('Error refreshing profile:', error);
		throw error;
	}
}
