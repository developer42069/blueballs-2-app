import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/public';

// Create a simple singleton client for use throughout the app
// Uses localStorage for session persistence
export const supabase = createClient(
	env.PUBLIC_SUPABASE_URL,
	env.PUBLIC_SUPABASE_ANON_KEY,
	{
		auth: {
			persistSession: true,
			autoRefreshToken: true,
			detectSessionInUrl: true,
			flowType: 'pkce'
		}
	}
);

export type Profile = {
	id: string;
	username: string;
	email: string;
	country_code: string;
	region: 'asia' | 'europe' | 'north_america' | 'south_america' | 'africa' | 'oceania';
	membership_tier: 'free' | 'mid' | 'big';
	stripe_customer_id: string | null;
	stripe_subscription_id: string | null;
	subscription_ends_at: string | null;
	lives: number;
	max_lives: number;
	last_life_regen: string;
	lives_per_hour: number;
	lifetime_level: number;
	lifetime_points: number;
	last_30_days_points: number;
	current_rank: 'blue' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'black';
	high_score_easy: number;
	high_score_medium: number;
	high_score_hard: number;
	profile_picture_url: string | null; // Legacy column - use profile_image_url instead
	profile_image_url: string | null; // Current column for profile images
	profile_public: boolean;
	social_link: string | null;
	social_platform: string | null;
	message_to_world: string | null;
	allow_friend_requests: boolean;
	is_admin: boolean;
	created_at: string;
	updated_at: string;
};

export type GameScore = {
	id: string;
	user_id: string | null;
	score: number;
	difficulty: 'easy' | 'medium' | 'hard';
	points_earned: number;
	created_at: string;
};

export type ChatMessage = {
	id: string;
	user_id: string;
	message: string;
	created_at: string;
	profiles?: Profile;
};

export type Friend = {
	id: string;
	user_id: string;
	friend_id: string;
	created_at: string;
	friend?: Profile;
};

export type Affiliate = {
	id: string;
	user_id: string;
	affiliate_code: string;
	promotion_plan: string;
	status: 'pending' | 'approved' | 'rejected';
	total_earnings: number;
	pending_earnings: number;
	btc_address: string | null;
	usdt_address: string | null;
	created_at: string;
	approved_at: string | null;
	auto_approve_at: string | null;
};

export type SystemSetting = {
	key: string;
	value: string;
	description: string | null;
	updated_at: string;
	updated_by: string | null;
};
