-- =====================================================
-- Create Test Supporter Accounts for Matching Testing
-- =====================================================
--
-- STEP 1: Create the auth users first via Supabase Dashboard
-- Go to: Authentication > Users > Add User
--
-- User 1 (LGBTQ+ Experienced):
--   Email: test-supporter-lgbtq@psychi.app
--   Password: TestSupporter123
--
-- User 2 (General - No LGBTQ+):
--   Email: test-supporter-general@psychi.app
--   Password: TestSupporter123
--
-- STEP 2: After creating auth users, run the SQL below
-- =====================================================

-- Get the user IDs from auth.users
-- (Run this first to get the UUIDs, then use them below)
SELECT id, email FROM auth.users
WHERE email IN ('test-supporter-lgbtq@psychi.app', 'test-supporter-general@psychi.app');

-- =====================================================
-- STEP 3: Update profiles to set role as 'supporter'
-- Replace the UUIDs below with actual values from Step 2
-- =====================================================

-- Update Alex Rivera's profile (LGBTQ+ experienced)
UPDATE profiles
SET
    full_name = 'Alex Rivera',
    role = 'supporter'
WHERE email = 'test-supporter-lgbtq@psychi.app';

-- Update Jordan Smith's profile (General)
UPDATE profiles
SET
    full_name = 'Jordan Smith',
    role = 'supporter'
WHERE email = 'test-supporter-general@psychi.app';

-- =====================================================
-- STEP 4: Create supporter_details entries
-- =====================================================

-- Alex Rivera - LGBTQ+ Experienced Supporter
INSERT INTO supporter_details (
    supporter_id,
    bio,
    specialties,
    education,
    languages,
    years_experience,
    approach,
    rating,
    total_sessions,
    total_reviews,
    is_verified,
    is_available,
    accepting_clients,
    training_complete,
    training_completed_at,
    availability,
    session_types
)
SELECT
    id,
    'I am passionate about creating safe, affirming spaces for everyone, especially members of the LGBTQ+ community. My approach combines active listening with practical coping strategies.',
    ARRAY['LGBTQ+', 'Identity', 'Coming Out', 'Anxiety', 'Self-Esteem'],
    'B.A. Psychology, UC Berkeley',
    ARRAY['English', 'Spanish'],
    2,
    'I believe in meeting you where you are. Together, we can work through challenges at your own pace in a judgment-free environment.',
    4.9,
    47,
    42,
    true,  -- is_verified
    true,  -- is_available
    true,  -- accepting_clients
    true,  -- training_complete
    NOW() - INTERVAL '30 days',  -- training_completed_at
    '{"monday": ["09:00", "10:00", "11:00", "14:00", "15:00"], "wednesday": ["09:00", "10:00", "11:00", "14:00", "15:00"], "friday": ["09:00", "10:00", "11:00"]}'::jsonb,
    ARRAY['chat', 'phone', 'video']
FROM profiles
WHERE email = 'test-supporter-lgbtq@psychi.app'
ON CONFLICT (supporter_id) DO UPDATE SET
    bio = EXCLUDED.bio,
    specialties = EXCLUDED.specialties,
    education = EXCLUDED.education,
    languages = EXCLUDED.languages,
    years_experience = EXCLUDED.years_experience,
    approach = EXCLUDED.approach,
    rating = EXCLUDED.rating,
    total_sessions = EXCLUDED.total_sessions,
    total_reviews = EXCLUDED.total_reviews,
    is_verified = EXCLUDED.is_verified,
    is_available = EXCLUDED.is_available,
    accepting_clients = EXCLUDED.accepting_clients,
    training_complete = EXCLUDED.training_complete,
    training_completed_at = EXCLUDED.training_completed_at,
    availability = EXCLUDED.availability,
    session_types = EXCLUDED.session_types;

-- Jordan Smith - General Supporter (NO LGBTQ+ specialty)
INSERT INTO supporter_details (
    supporter_id,
    bio,
    specialties,
    education,
    languages,
    years_experience,
    approach,
    rating,
    total_sessions,
    total_reviews,
    is_verified,
    is_available,
    accepting_clients,
    training_complete,
    training_completed_at,
    availability,
    session_types
)
SELECT
    id,
    'I am here to help you navigate life''s challenges with compassion and understanding. Whether you''re dealing with stress, relationships, or just need someone to talk to, I''m here for you.',
    ARRAY['Stress', 'Relationships', 'Academic Pressure', 'Work-Life Balance'],
    'B.S. Social Work, University of Michigan',
    ARRAY['English'],
    1,
    'My approach is collaborative and solution-focused. I help you identify your strengths and build on them to overcome obstacles.',
    4.7,
    31,
    28,
    true,  -- is_verified
    true,  -- is_available
    true,  -- accepting_clients
    true,  -- training_complete
    NOW() - INTERVAL '45 days',  -- training_completed_at
    '{"tuesday": ["10:00", "11:00", "14:00", "15:00", "16:00"], "thursday": ["10:00", "11:00", "14:00", "15:00", "16:00"], "saturday": ["10:00", "11:00"]}'::jsonb,
    ARRAY['chat', 'phone', 'video']
FROM profiles
WHERE email = 'test-supporter-general@psychi.app'
ON CONFLICT (supporter_id) DO UPDATE SET
    bio = EXCLUDED.bio,
    specialties = EXCLUDED.specialties,
    education = EXCLUDED.education,
    languages = EXCLUDED.languages,
    years_experience = EXCLUDED.years_experience,
    approach = EXCLUDED.approach,
    rating = EXCLUDED.rating,
    total_sessions = EXCLUDED.total_sessions,
    total_reviews = EXCLUDED.total_reviews,
    is_verified = EXCLUDED.is_verified,
    is_available = EXCLUDED.is_available,
    accepting_clients = EXCLUDED.accepting_clients,
    training_complete = EXCLUDED.training_complete,
    training_completed_at = EXCLUDED.training_completed_at,
    availability = EXCLUDED.availability,
    session_types = EXCLUDED.session_types;

-- =====================================================
-- STEP 5: Verify the accounts were created correctly
-- =====================================================

-- Check profiles
SELECT id, email, full_name, role, created_at
FROM profiles
WHERE email IN ('test-supporter-lgbtq@psychi.app', 'test-supporter-general@psychi.app');

-- Check supporter details with specialties
SELECT
    p.full_name,
    p.email,
    sd.specialties,
    sd.is_verified,
    sd.is_available,
    sd.accepting_clients,
    sd.training_complete,
    'LGBTQ+' = ANY(sd.specialties) AS has_lgbtq_experience
FROM profiles p
JOIN supporter_details sd ON p.id = sd.supporter_id
WHERE p.email IN ('test-supporter-lgbtq@psychi.app', 'test-supporter-general@psychi.app');
