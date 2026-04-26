-- Encrypt post-call messages: add ciphertext columns for E2E encryption
-- The app will write encrypted content; plaintext 'content' column kept for
-- backwards-compat with any existing rows but should not be used for new messages.

ALTER TABLE post_call_messages
  ADD COLUMN IF NOT EXISTS encrypted_content TEXT,
  ADD COLUMN IF NOT EXISTS nonce TEXT,
  ADD COLUMN IF NOT EXISTS sender_public_key TEXT,
  ADD COLUMN IF NOT EXISTS encrypted_for_sender TEXT,
  ADD COLUMN IF NOT EXISTS nonce_for_sender TEXT;

COMMENT ON COLUMN post_call_messages.encrypted_content IS
  'NaCl box ciphertext encrypted for the recipient (base64)';
COMMENT ON COLUMN post_call_messages.nonce IS
  'NaCl nonce for recipient ciphertext (base64)';
COMMENT ON COLUMN post_call_messages.sender_public_key IS
  'Sender public key used for this message (base64)';
COMMENT ON COLUMN post_call_messages.encrypted_for_sender IS
  'NaCl box ciphertext encrypted for the sender''s own readback (base64)';
COMMENT ON COLUMN post_call_messages.nonce_for_sender IS
  'NaCl nonce for sender ciphertext (base64)';
