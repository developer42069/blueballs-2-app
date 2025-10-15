import { writable } from 'svelte/store';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface Notification {
	id: string;
	user_id: string;
	type: 'friend_request' | 'friend_accepted' | 'chat_message' | 'level_up' | 'rank_up' | 'lives_full';
	from_user_id: string | null;
	message: string;
	link: string | null;
	read: boolean;
	created_at: string;
	from_profile?: {
		username: string;
		profile_picture_url: string | null;
	};
}

export const notifications = writable<Notification[]>([]);
export const unreadCount = writable<number>(0);
export const notificationChannel = writable<RealtimeChannel | null>(null);
