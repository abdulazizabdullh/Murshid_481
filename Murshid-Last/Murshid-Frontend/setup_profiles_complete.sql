-- Complete Profiles Table Setup for Murshid App
-- Run this entire script in your Supabase SQL Editor

-- Step 1: Create profiles table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  establishment_name TEXT,
  level TEXT,
  gender TEXT,
  role TEXT,
  student_type TEXT,
  track TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Step 2: Add columns if they don't exist (for existing tables)
DO $$ 
BEGIN
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS name TEXT;
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS establishment_name TEXT;
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS level TEXT;
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender TEXT;
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT;
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS student_type TEXT;
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS track TEXT;
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- Step 3: Add comments to document columns
COMMENT ON TABLE profiles IS 'User profile information extending auth.users';
COMMENT ON COLUMN profiles.id IS 'User ID from auth.users';
COMMENT ON COLUMN profiles.name IS 'User full name';
COMMENT ON COLUMN profiles.establishment_name IS 'Name of the educational institution (high school or university)';
COMMENT ON COLUMN profiles.level IS 'Current academic level or year of study';
COMMENT ON COLUMN profiles.gender IS 'User gender (Male, Female)';
COMMENT ON COLUMN profiles.role IS 'User role (Student, Specialist)';
COMMENT ON COLUMN profiles.student_type IS 'Student type (High School, University)';
COMMENT ON COLUMN profiles.track IS 'Academic track (Science, Medicine, Literature, Business)';
COMMENT ON COLUMN profiles.is_admin IS 'Whether the user has admin privileges';

-- Step 4: Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 5: Create trigger for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Step 6: Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Step 7: Drop existing policies (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON profiles;

-- Step 8: Create RLS policies
-- Allow users to read their own profile
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow users to delete their own profile (optional)
CREATE POLICY "Users can delete their own profile"
  ON profiles FOR DELETE
  USING (auth.uid() = id);

-- Step 9: Create function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 10: Create trigger to auto-create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 11: Backfill profiles for existing users (if any)
INSERT INTO profiles (id, name, created_at, updated_at)
SELECT 
  id, 
  COALESCE(raw_user_meta_data->>'name', split_part(email, '@', 1)) as name,
  created_at,
  updated_at
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;

-- Step 12: Verification queries
-- Check if table exists and has correct columns
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'profiles';

-- Count profiles
SELECT COUNT(*) as total_profiles FROM profiles;

-- Show sample profiles (will only show your own due to RLS)
SELECT 
  id,
  name,
  establishment_name,
  role,
  student_type,
  level,
  is_admin,
  created_at,
  updated_at
FROM profiles
LIMIT 5;

-- IMPORTANT: Create Admin User
-- After running this script, you need to create an admin account manually:
-- 1. Sign up normally with email: admin@murshid.com (or your preferred admin email)
-- 2. Then run this SQL to make that user an admin:
/*
UPDATE profiles 
SET is_admin = TRUE 
WHERE email IN (
  SELECT email FROM auth.users WHERE email = 'admin@murshid.com'
);
*/

-- Or if you want to make your current user an admin:
/*
UPDATE profiles 
SET is_admin = TRUE 
WHERE id = auth.uid();
*/

