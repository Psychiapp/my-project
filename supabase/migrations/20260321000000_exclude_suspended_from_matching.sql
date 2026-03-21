-- Update find_available_supporter function to exclude suspended supporters
-- Suspended supporters should not be matched with clients for live support

CREATE OR REPLACE FUNCTION find_available_supporter(p_exclude_ids UUID[] DEFAULT '{}'::UUID[])
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT p.id FROM profiles p
    LEFT JOIN supporter_details sd ON sd.supporter_id = p.id
    WHERE p.role = 'supporter'
      AND p.is_online = true
      AND p.in_session = false
      AND p.available_for_live_support = true
      AND p.id != ALL(COALESCE(p_exclude_ids, '{}'::UUID[]))
      AND sd.suspended_at IS NULL  -- Exclude suspended supporters
    ORDER BY p.last_seen DESC
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
