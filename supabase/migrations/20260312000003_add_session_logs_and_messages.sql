-- Migration: Add session_logs and post_call_messages tables
-- For production monitoring and recovery message persistence

-- =====================================================
-- Table: session_logs
-- Stores error events and important session lifecycle events
-- =====================================================
CREATE TABLE IF NOT EXISTS session_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    session_type TEXT NOT NULL CHECK (session_type IN ('chat', 'phone', 'video')),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    metadata JSONB,
    error_message TEXT,
    error_stack TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for querying logs by session
CREATE INDEX IF NOT EXISTS idx_session_logs_session_id ON session_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_session_logs_event_type ON session_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_session_logs_created_at ON session_logs(created_at);

-- RLS: Admins can read all, users can only see their own
ALTER TABLE session_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own session logs" ON session_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all session logs" ON session_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "System can insert session logs" ON session_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- Table: post_call_messages
-- Stores messages sent during the 10-minute recovery window
-- =====================================================
CREATE TABLE IF NOT EXISTS post_call_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    issue_reason TEXT CHECK (issue_reason IN ('timeout', 'disconnect', 'network')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_post_call_messages_session_id ON post_call_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_post_call_messages_sender_id ON post_call_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_post_call_messages_created_at ON post_call_messages(created_at);

-- RLS: Participants can read/write their own messages
ALTER TABLE post_call_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view their post-call messages" ON post_call_messages
    FOR SELECT USING (
        auth.uid() = sender_id OR auth.uid() = recipient_id
    );

CREATE POLICY "Participants can send post-call messages" ON post_call_messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Admins can view all for support purposes
CREATE POLICY "Admins can view all post-call messages" ON post_call_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );
