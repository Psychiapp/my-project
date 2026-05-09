-- Add language preference fields for clients and language match status for assignments.
-- Note: supporter_details.languages (TEXT[]) already exists for storing languages spoken.

-- Client language preference fields on profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS preferred_language     TEXT    DEFAULT 'English',
  ADD COLUMN IF NOT EXISTS comfortable_in_english BOOLEAN DEFAULT TRUE,
  -- True when the client is waiting for a language-matched supporter.
  -- Set by matchAndAssignSupporter when preferred_language is non-English
  -- and comfortable_in_english = false and no matching supporter exists.
  ADD COLUMN IF NOT EXISTS pending_language_match BOOLEAN DEFAULT FALSE;

-- Language match status on assignments so the UI can show fallback messaging
ALTER TABLE client_assignments
  ADD COLUMN IF NOT EXISTS language_match_status TEXT
    CHECK (language_match_status IN ('matched', 'fallback'));

-- RLS: users can read/write their own language preference fields (already covered
-- by the existing "Users can update own profile" policy — no new policies needed).

-- Notification hook: when a supporter completes onboarding, this query finds
-- clients who need a language match notification.
-- TODO: wire this up to a push notification in a future update.
-- Query to use:
--   SELECT p.id, p.preferred_language
--   FROM profiles p
--   WHERE p.role = 'client'
--     AND (p.pending_language_match = TRUE
--          OR EXISTS (
--            SELECT 1 FROM client_assignments ca
--            WHERE ca.client_id = p.id
--              AND ca.status = 'active'
--              AND ca.language_match_status = 'fallback'
--              AND p.preferred_language = ANY(
--                SELECT unnest(sd.languages)
--                FROM supporter_details sd
--                WHERE sd.supporter_id = $NEW_SUPPORTER_ID
--              )
--          ));

COMMENT ON COLUMN profiles.preferred_language IS
  'Client''s preferred session language. Default English.';
COMMENT ON COLUMN profiles.comfortable_in_english IS
  'If true, client accepts an English-speaking supporter when preferred language is unavailable.';
COMMENT ON COLUMN profiles.pending_language_match IS
  'True when client has no match because no supporter speaks their preferred language '
  'and they are NOT comfortable in English. Reset to false when a match is created.';
COMMENT ON COLUMN client_assignments.language_match_status IS
  'matched = supporter speaks client''s preferred language; '
  'fallback = client prefers another language but was matched with an English speaker.';
