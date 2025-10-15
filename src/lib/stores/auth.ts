import { writable } from 'svelte/store';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '$lib/supabase';

export const user = writable<User | null>(null);
export const profile = writable<Profile | null>(null);
export const loading = writable(true);
