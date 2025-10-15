-- Blue Balls Game - Complete Database Schema (Safe Version)
-- Run this in your Supabase SQL Editor
-- This version safely handles existing types and tables

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create enum types (only if they don't exist)
DO $$ BEGIN
    CREATE TYPE membership_tier AS ENUM ('free', 'mid', 'big');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE game_difficulty AS ENUM ('easy', 'medium', 'hard');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE rank_tier AS ENUM ('blue', 'silver', 'gold', 'platinum', 'diamond', 'black');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE affiliate_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payout_status AS ENUM ('pending', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE region AS ENUM ('asia', 'europe', 'north_america', 'south_america', 'africa', 'oceania');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Drop existing tables if they exist (in correct order due to foreign keys)
DROP TABLE IF EXISTS affiliate_payouts CASCADE;
DROP TABLE IF EXISTS affiliate_referrals CASCADE;
DROP TABLE IF EXISTS affiliates CASCADE;
DROP TABLE IF EXISTS chat_rate_limits CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS friend_invitations CASCADE;
DROP TABLE IF EXISTS friends CASCADE;
DROP TABLE IF EXISTS points_history CASCADE;
DROP TABLE IF EXISTS game_scores CASCADE;
DROP TABLE IF EXISTS email_campaigns CASCADE;
DROP TABLE IF EXISTS ads CASCADE;
DROP TABLE IF EXISTS rank_thresholds CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    country_code TEXT NOT NULL,
    region region NOT NULL,
    membership_tier membership_tier DEFAULT 'free' NOT NULL,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    subscription_ends_at TIMESTAMPTZ,

    -- Lives system
    lives INTEGER DEFAULT 4 NOT NULL,
    max_lives INTEGER DEFAULT 100 NOT NULL,
    last_life_regen TIMESTAMPTZ DEFAULT NOW(),
    lives_per_hour INTEGER DEFAULT 4 NOT NULL,

    -- Leveling system
    lifetime_level INTEGER DEFAULT 1 NOT NULL,
    lifetime_points INTEGER DEFAULT 0 NOT NULL,
    last_30_days_points INTEGER DEFAULT 0 NOT NULL,
    current_rank rank_tier DEFAULT 'blue' NOT NULL,

    -- High scores
    high_score_easy INTEGER DEFAULT 0 NOT NULL,
    high_score_medium INTEGER DEFAULT 0 NOT NULL,
    high_score_hard INTEGER DEFAULT 0 NOT NULL,

    -- Profile customization
    profile_picture_url TEXT,
    profile_public BOOLEAN DEFAULT true NOT NULL,
    social_link TEXT,
    social_platform TEXT,
    message_to_world TEXT,
    allow_friend_requests BOOLEAN DEFAULT true NOT NULL,

    -- Admin
    is_admin BOOLEAN DEFAULT false NOT NULL,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Game scores table
CREATE TABLE game_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    difficulty game_difficulty NOT NULL,
    points_earned INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Points history (for 30-day rolling calculation)
CREATE TABLE points_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    points INTEGER NOT NULL,
    source TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Friends table
CREATE TABLE friends (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    friend_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, friend_id),
    CHECK (user_id != friend_id)
);

-- Friend invitations
CREATE TABLE friend_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    to_email TEXT NOT NULL,
    invited_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    bonus_claimed BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Global chat messages
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat rate limiting
CREATE TABLE chat_rate_limits (
    user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    message_count INTEGER DEFAULT 0
);

-- Affiliate system
CREATE TABLE affiliates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
    affiliate_code TEXT UNIQUE NOT NULL,
    promotion_plan TEXT NOT NULL,
    status affiliate_status DEFAULT 'pending' NOT NULL,
    total_earnings DECIMAL(10, 2) DEFAULT 0 NOT NULL,
    pending_earnings DECIMAL(10, 2) DEFAULT 0 NOT NULL,
    btc_address TEXT,
    usdt_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    auto_approve_at TIMESTAMPTZ
);

-- Affiliate referrals
CREATE TABLE affiliate_referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    affiliate_id UUID REFERENCES affiliates(id) ON DELETE CASCADE NOT NULL,
    referred_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    subscription_id TEXT,
    commission_amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Affiliate payouts
CREATE TABLE affiliate_payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    affiliate_id UUID REFERENCES affiliates(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT NOT NULL,
    wallet_address TEXT NOT NULL,
    status payout_status DEFAULT 'pending' NOT NULL,
    processed_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- System settings (for admin panel)
CREATE TABLE system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES profiles(id)
);

-- Rank thresholds
CREATE TABLE rank_thresholds (
    rank rank_tier PRIMARY KEY,
    points_required INTEGER NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email marketing
CREATE TABLE email_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    target_audience TEXT,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id)
);

-- Ads management
CREATE TABLE ads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    active BOOLEAN DEFAULT true NOT NULL,
    position TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_profiles_membership ON profiles(membership_tier);
CREATE INDEX idx_profiles_region ON profiles(region);
CREATE INDEX idx_profiles_rank ON profiles(current_rank);
CREATE INDEX idx_game_scores_user ON game_scores(user_id);
CREATE INDEX idx_game_scores_difficulty ON game_scores(difficulty);
CREATE INDEX idx_game_scores_created ON game_scores(created_at DESC);
CREATE INDEX idx_points_history_user ON points_history(user_id);
CREATE INDEX idx_points_history_created ON points_history(created_at DESC);
CREATE INDEX idx_friends_user ON friends(user_id);
CREATE INDEX idx_friends_friend ON friends(friend_id);
CREATE INDEX idx_chat_messages_created ON chat_messages(created_at DESC);
CREATE INDEX idx_affiliates_code ON affiliates(affiliate_code);
CREATE INDEX idx_affiliates_status ON affiliates(status);

-- Insert default rank thresholds
INSERT INTO rank_thresholds (rank, points_required) VALUES
    ('blue', 0),
    ('silver', 1000),
    ('gold', 3000),
    ('platinum', 7000),
    ('diamond', 15000),
    ('black', 25000);

-- Insert default system settings
INSERT INTO system_settings (key, value, description) VALUES
    ('chat_message_ttl', '10800', 'Chat message time-to-live in seconds (3 hours)'),
    ('free_chat_cooldown', '300', 'Free user chat cooldown in seconds (5 minutes)'),
    ('mid_chat_cooldown', '180', 'Mid tier chat cooldown in seconds (3 minutes)'),
    ('big_chat_cooldown', '60', 'Big tier chat cooldown in seconds (1 minute)'),
    ('affiliate_auto_approve_hours', '1', 'Hours before auto-approving affiliate'),
    ('affiliate_commission_rate', '0.10', 'Affiliate commission rate (10%)'),
    ('affiliate_min_payout', '100.00', 'Minimum payout amount'),
    ('stripe_mid_price_id', '', 'Stripe Price ID for Mid tier'),
    ('stripe_big_price_id', '', 'Stripe Price ID for Big tier'),
    ('brevo_api_key', '', 'Brevo SMTP API Key'),
    ('brevo_smtp_server', 'smtp-relay.brevo.com', 'Brevo SMTP Server'),
    ('brevo_smtp_port', '587', 'Brevo SMTP Port'),
    ('brevo_from_email', '', 'Email from address'),
    ('brevo_from_name', 'Blue Balls Game', 'Email from name');

-- Row Level Security (RLS) Policies

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone if public"
    ON profiles FOR SELECT
    USING (profile_public = true OR auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- Game scores
ALTER TABLE game_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view scores"
    ON game_scores FOR SELECT
    TO authenticated, anon
    USING (true);

CREATE POLICY "Users can insert own scores"
    ON game_scores FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Points history
ALTER TABLE points_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own points history"
    ON points_history FOR SELECT
    USING (auth.uid() = user_id);

-- Friends
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own friends"
    ON friends FOR SELECT
    USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can manage own friends"
    ON friends FOR ALL
    USING (auth.uid() = user_id);

-- Chat messages
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view recent chat messages"
    ON chat_messages FOR SELECT
    TO authenticated
    USING (created_at > NOW() - INTERVAL '3 hours');

CREATE POLICY "Authenticated users can insert messages"
    ON chat_messages FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Affiliates (users can view their own)
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own affiliate data"
    ON affiliates FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own affiliate application"
    ON affiliates FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Functions

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ads_updated_at BEFORE UPDATE ON ads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to regenerate lives
CREATE OR REPLACE FUNCTION regenerate_lives()
RETURNS void AS $$
BEGIN
    UPDATE profiles
    SET
        lives = LEAST(
            lives + (EXTRACT(EPOCH FROM (NOW() - last_life_regen)) / 3600 * lives_per_hour)::INTEGER,
            max_lives
        ),
        last_life_regen = NOW()
    WHERE lives < max_lives
    AND last_life_regen < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Function to calculate 30-day points
CREATE OR REPLACE FUNCTION calculate_30_day_points(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    total_points INTEGER;
BEGIN
    SELECT COALESCE(SUM(points), 0) INTO total_points
    FROM points_history
    WHERE user_id = user_uuid
    AND created_at > NOW() - INTERVAL '30 days';

    RETURN total_points;
END;
$$ LANGUAGE plpgsql;

-- Function to update user rank based on 30-day points
CREATE OR REPLACE FUNCTION update_user_rank(user_uuid UUID)
RETURNS void AS $$
DECLARE
    current_points INTEGER;
    new_rank rank_tier;
BEGIN
    current_points := calculate_30_day_points(user_uuid);

    UPDATE profiles
    SET last_30_days_points = current_points
    WHERE id = user_uuid;

    SELECT rank INTO new_rank
    FROM rank_thresholds
    WHERE points_required <= current_points
    ORDER BY points_required DESC
    LIMIT 1;

    UPDATE profiles
    SET current_rank = new_rank
    WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate lifetime level
CREATE OR REPLACE FUNCTION calculate_level_from_points(points INTEGER)
RETURNS INTEGER AS $$
BEGIN
    RETURN FLOOR(SQRT(points / 100.0)) + 1;
END;
$$ LANGUAGE plpgsql;

-- Function to clean old chat messages
CREATE OR REPLACE FUNCTION clean_old_chat_messages()
RETURNS void AS $$
DECLARE
    ttl_seconds INTEGER;
BEGIN
    SELECT value::INTEGER INTO ttl_seconds
    FROM system_settings
    WHERE key = 'chat_message_ttl';

    DELETE FROM chat_messages
    WHERE created_at < NOW() - (ttl_seconds || ' seconds')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-approve affiliates
CREATE OR REPLACE FUNCTION auto_approve_affiliates()
RETURNS void AS $$
BEGIN
    UPDATE affiliates
    SET
        status = 'approved',
        approved_at = NOW()
    WHERE status = 'pending'
    AND auto_approve_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (
        id,
        email,
        username,
        country_code,
        region,
        membership_tier,
        lives,
        max_lives,
        lives_per_hour,
        last_life_regen,
        lifetime_level,
        lifetime_points,
        last_30_days_points,
        current_rank,
        high_score_easy,
        high_score_medium,
        high_score_hard,
        profile_public,
        allow_friend_requests,
        is_admin
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'country_code', 'US'),
        COALESCE((NEW.raw_user_meta_data->>'region')::region, 'north_america'),
        'free',
        4,
        100,
        4,
        NOW(),
        1,
        0,
        0,
        'blue',
        0,
        0,
        0,
        true,
        true,
        false
    );
    RETURN NEW;
EXCEPTION
    WHEN others THEN
        RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set search path for security
ALTER FUNCTION handle_new_user() SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
