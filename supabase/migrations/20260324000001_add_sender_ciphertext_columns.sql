-- Add columns to store sender's copy of encrypted messages
-- This allows the sender to read their own sent messages

ALTER TABLE encrypted_messages
ADD COLUMN IF NOT EXISTS sender_ciphertext TEXT,
ADD COLUMN IF NOT EXISTS sender_nonce TEXT;

-- Add comment for clarity
COMMENT ON COLUMN encrypted_messages.sender_ciphertext IS 'Ciphertext encrypted for the sender (so they can read their own messages)';
COMMENT ON COLUMN encrypted_messages.sender_nonce IS 'Nonce for sender ciphertext';
