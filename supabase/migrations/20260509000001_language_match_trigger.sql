-- Language match notification trigger
-- When a supporter saves or updates their languages_spoken in supporter_details,
-- call the notify-language-match-clients Edge Function to:
--   1. Notify pending clients (pending_language_match = true) and re-attempt matching
--   2. Notify fallback clients (language_match_status = 'fallback') so they can opt in

-- ─── RPC: match_and_assign_client ───────────────────────────────────────────
-- A thin server-side wrapper so the Edge Function can trigger re-matching
-- without needing client-side code.  Mirrors matchAndAssignSupporter in JS.
CREATE OR REPLACE FUNCTION public.match_and_assign_client(p_client_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_prefs JSONB;
  v_lang  TEXT;
  v_comfortable BOOLEAN;
  v_supporter_id UUID;
  v_score INTEGER := 0;
BEGIN
  -- Load preferences
  SELECT preferences,
         preferred_language,
         comfortable_in_english
  INTO v_prefs, v_lang, v_comfortable
  FROM profiles
  WHERE id = p_client_id;

  -- Find the best language-matched supporter
  SELECT p.id INTO v_supporter_id
  FROM profiles p
  JOIN supporter_details sd ON sd.supporter_id = p.id
  WHERE p.role = 'supporter'
    AND p.onboarding_complete = true
    AND p.stripe_payouts_enabled = true
    AND sd.is_verified = true
    AND sd.accepting_clients = true
    AND sd.suspended_at IS NULL
    AND v_lang = ANY(sd.languages)
    AND NOT EXISTS (
      SELECT 1 FROM client_assignments ca
      WHERE ca.supporter_id = p.id AND ca.status = 'active'
        AND ca.client_id = p_client_id
    )
  ORDER BY RANDOM()
  LIMIT 1;

  IF v_supporter_id IS NULL THEN
    -- No match found yet — keep pending flag
    RETURN;
  END IF;

  -- End any existing active assignment
  UPDATE client_assignments
  SET status = 'ended', updated_at = now()
  WHERE client_id = p_client_id AND status = 'active';

  -- Create the new assignment as a language match
  INSERT INTO client_assignments (client_id, supporter_id, status, started_at, language_match_status)
  VALUES (p_client_id, v_supporter_id, 'active', now(), 'matched')
  ON CONFLICT DO NOTHING;

  -- Clear pending flag
  UPDATE profiles
  SET pending_language_match = false
  WHERE id = p_client_id;
END;
$$;

COMMENT ON FUNCTION public.match_and_assign_client(UUID) IS
'Server-side re-matching for pending language clients. Called by the
notify-language-match-clients Edge Function when a new supporter with
the required language joins. Clears pending_language_match on success.';


-- ─── pg_net helper: invoke_language_match_notification ──────────────────────
CREATE OR REPLACE FUNCTION public.invoke_language_match_notification(
  p_supporter_id UUID,
  p_languages    TEXT[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  service_role_key TEXT;
  project_url      TEXT := 'https://oockipafkvgarldpgzac.supabase.co';
BEGIN
  SELECT decrypted_secret INTO service_role_key
  FROM vault.decrypted_secrets
  WHERE name = 'service_role_key'
  LIMIT 1;

  IF service_role_key IS NULL THEN
    RAISE WARNING 'service_role_key not found in vault — language match notifications skipped.';
    RETURN;
  END IF;

  PERFORM net.http_post(
    url     := project_url || '/functions/v1/notify-language-match-clients',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || service_role_key
    ),
    body    := jsonb_build_object(
      'supporter_id', p_supporter_id::text,
      'languages',    to_jsonb(p_languages)
    )
  );
END;
$$;


-- ─── Trigger function on supporter_details ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.on_supporter_languages_changed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_langs  TEXT[];
  diff_langs TEXT[];
BEGIN
  new_langs := COALESCE(NEW.languages, ARRAY[]::TEXT[]);

  IF TG_OP = 'INSERT' THEN
    diff_langs := new_langs;           -- all languages are "new" on insert
  ELSE
    -- Only languages that didn't exist in the old array
    SELECT ARRAY(
      SELECT unnest(new_langs)
      EXCEPT
      SELECT unnest(COALESCE(OLD.languages, ARRAY[]::TEXT[]))
    ) INTO diff_langs;
  END IF;

  IF array_length(diff_langs, 1) > 0 THEN
    PERFORM public.invoke_language_match_notification(NEW.supporter_id, diff_langs);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_supporter_languages_changed ON supporter_details;

CREATE TRIGGER trigger_supporter_languages_changed
  AFTER INSERT OR UPDATE OF languages
  ON supporter_details
  FOR EACH ROW
  EXECUTE FUNCTION public.on_supporter_languages_changed();

COMMENT ON TRIGGER trigger_supporter_languages_changed ON supporter_details IS
'Fires when a supporter saves or updates their languages_spoken. Calls
notify-language-match-clients Edge Function to identify clients waiting
for this language and send push notifications / attempt re-matching.';
