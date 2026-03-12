-- Add RLS policies for profiles table to allow users to update their own profiles
-- This fixes the avatar upload issue where profile updates were being blocked

-- Ensure RLS is enabled on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Policy: Users can update their own profile
-- This is critical for avatar uploads to work
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy: Users can insert their own profile (for signup flow)
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Policy: Service role bypass (for admin operations)
-- This allows Edge Functions and admin operations to work
DROP POLICY IF EXISTS "Service role can do anything" ON profiles;
CREATE POLICY "Service role can do anything"
ON profiles FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Add comment for documentation
COMMENT ON POLICY "Users can update own profile" ON profiles IS 'Allows authenticated users to update their own profile including avatar_url';
