-- E2E Encryption Database Schema for Supabase
-- Run this in your Supabase SQL Editor to set up the required tables

-- =====================================================
-- Table: user_public_keys
-- Stores public keys for E2E encryption key exchange
-- =====================================================
CREATE TABLE IF NOT EXISTS user_public_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    public_key TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Index for fast lookups by user_id
CREATE INDEX IF NOT EXISTS idx_user_public_keys_user_id ON user_public_keys(user_id);

-- Enable RLS (Row Level Security)
ALTER TABLE user_public_keys ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read any public key (needed for encryption)
CREATE POLICY "Public keys are readable by all authenticated users"
    ON user_public_keys
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy: Users can only insert/update their own public key
CREATE POLICY "Users can manage their own public key"
    ON user_public_keys
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);


-- =====================================================
-- Table: encrypted_messages
-- Stores E2E encrypted messages
-- The server CANNOT read message content (only ciphertext)
-- =====================================================
CREATE TABLE IF NOT EXISTS encrypted_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Encrypted content (Base64 encoded)
    ciphertext TEXT NOT NULL,
    nonce TEXT NOT NULL,
    sender_public_key TEXT NOT NULL,

    -- Metadata (not encrypted)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Optional: message type for future features
    message_type TEXT DEFAULT 'text'
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_encrypted_messages_session_id ON encrypted_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_encrypted_messages_sender_id ON encrypted_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_encrypted_messages_recipient_id ON encrypted_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_encrypted_messages_created_at ON encrypted_messages(created_at);

-- Enable RLS
ALTER TABLE encrypted_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read messages they sent or received
CREATE POLICY "Users can read their own messages"
    ON encrypted_messages
    FOR SELECT
    TO authenticated
    USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Policy: Users can only insert messages they send
CREATE POLICY "Users can send messages"
    ON encrypted_messages
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = sender_id);

-- Policy: No updates allowed (messages are immutable)
-- Policy: No deletes allowed (for audit trail - adjust if needed)


-- =====================================================
-- Enable Realtime for encrypted_messages
-- This allows real-time subscriptions for new messages
-- =====================================================
ALTER PUBLICATION supabase_realtime ADD TABLE encrypted_messages;


-- =====================================================
-- Optional: Function to get conversation messages
-- =====================================================
CREATE OR REPLACE FUNCTION get_conversation_messages(
    p_session_id UUID,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    session_id UUID,
    sender_id UUID,
    recipient_id UUID,
    ciphertext TEXT,
    nonce TEXT,
    sender_public_key TEXT,
    created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        em.id,
        em.session_id,
        em.sender_id,
        em.recipient_id,
        em.ciphertext,
        em.nonce,
        em.sender_public_key,
        em.created_at
    FROM encrypted_messages em
    WHERE em.session_id = p_session_id
      AND (auth.uid() = em.sender_id OR auth.uid() = em.recipient_id)
    ORDER BY em.created_at ASC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;


-- =====================================================
-- Security Notes:
-- =====================================================
-- 1. Private keys NEVER touch the server - stored only on device
-- 2. Public keys can be safely stored - used for encryption only
-- 3. Ciphertext is meaningless without the recipient's private key
-- 4. Even Supabase admins cannot read message content
-- 5. The nonce ensures each message has unique encryption
-- 6. sender_public_key allows recipient to verify message origin
