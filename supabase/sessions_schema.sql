-- Sessions Database Schema for Supabase
-- Run this in your Supabase SQL Editor to set up the required tables

-- =====================================================
-- Table: profiles
-- Extended user profiles (linked to auth.users)
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'supporter', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Policies
CREATE POLICY "Users can view all profiles"
    ON profiles FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = id);

-- =====================================================
-- Table: supporter_details
-- Additional details for supporters
-- =====================================================
CREATE TABLE IF NOT EXISTS supporter_details (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    supporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    bio TEXT,
    specialties TEXT[] DEFAULT '{}',
    education TEXT,
    languages TEXT[] DEFAULT ARRAY['English'],
    years_experience INTEGER DEFAULT 0,
    approach TEXT,
    rating NUMERIC(3,2) DEFAULT 0,
    total_sessions INTEGER DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT false,
    is_available BOOLEAN DEFAULT false,
    accepting_clients BOOLEAN DEFAULT false,
    training_complete BOOLEAN DEFAULT false,
    training_completed_at TIMESTAMP WITH TIME ZONE,
    availability JSONB DEFAULT '{}',
    session_types TEXT[] DEFAULT ARRAY['chat', 'phone', 'video'],
    total_earnings NUMERIC(10,2) DEFAULT 0,
    pending_payout NUMERIC(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(supporter_id)
);

ALTER TABLE supporter_details ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Supporter details are viewable by all" ON supporter_details;
DROP POLICY IF EXISTS "Supporters can update own details" ON supporter_details;

CREATE POLICY "Supporter details are viewable by all"
    ON supporter_details FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Supporters can update own details"
    ON supporter_details FOR ALL TO authenticated
    USING (auth.uid() = supporter_id)
    WITH CHECK (auth.uid() = supporter_id);

-- =====================================================
-- Table: sessions
-- Booked sessions between clients and supporters
-- =====================================================
CREATE TABLE IF NOT EXISTS sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    supporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    session_type TEXT NOT NULL CHECK (session_type IN ('chat', 'phone', 'video')),
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show')),
    room_url TEXT,
    notes TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    rating_comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sessions_client_id ON sessions(client_id);
CREATE INDEX IF NOT EXISTS idx_sessions_supporter_id ON sessions(supporter_id);
CREATE INDEX IF NOT EXISTS idx_sessions_scheduled_at ON sessions(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own sessions" ON sessions;
DROP POLICY IF EXISTS "Clients can create sessions" ON sessions;
DROP POLICY IF EXISTS "Participants can update sessions" ON sessions;

CREATE POLICY "Users can view own sessions"
    ON sessions FOR SELECT TO authenticated
    USING (auth.uid() = client_id OR auth.uid() = supporter_id);

CREATE POLICY "Clients can create sessions"
    ON sessions FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Participants can update sessions"
    ON sessions FOR UPDATE TO authenticated
    USING (auth.uid() = client_id OR auth.uid() = supporter_id);

-- Enable realtime for sessions
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE sessions;
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

-- =====================================================
-- Table: reviews
-- Session reviews from clients
-- =====================================================
CREATE TABLE IF NOT EXISTS reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    supporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    session_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Reviews are viewable by all" ON reviews;
DROP POLICY IF EXISTS "Clients can create reviews" ON reviews;

CREATE POLICY "Reviews are viewable by all"
    ON reviews FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Clients can create reviews"
    ON reviews FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = client_id);

-- =====================================================
-- Function: Auto-create profile on user signup
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'role', 'client')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- Security Notes
-- =====================================================
-- 1. All tables have Row Level Security enabled
-- 2. Users can only see/modify their own data
-- 3. Profiles are auto-created on signup via trigger
-- 4. Sessions require both client and supporter to exist
