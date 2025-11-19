-- Check and Fix Admin Status
-- Run this in Supabase SQL Editor to diagnose and fix admin issues

-- Step 1: Check if is_admin column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'is_admin';

-- Step 2: Check current user's admin status
-- (Make sure you're logged in to the app first)
SELECT 
  id,
  email,
  name,
  is_admin,
  created_at
FROM profiles 
WHERE id = auth.uid();

-- Step 3: Check all users and their admin status
SELECT 
  p.id,
  u.email,
  p.name,
  p.is_admin,
  p.created_at
FROM profiles p
JOIN auth.users u ON p.id = u.id
ORDER BY p.created_at DESC;

-- Step 4: Make your current logged-in user an admin
-- Run this if is_admin is NULL or FALSE
UPDATE profiles 
SET is_admin = TRUE 
WHERE id = auth.uid();

-- Step 5: Verify the update
SELECT 
  id,
  email,
  name,
  is_admin
FROM profiles 
WHERE id = auth.uid();

-- Step 6: Make a specific user admin by email
-- Replace 'your-email@example.com' with the actual admin email
/*
UPDATE profiles 
SET is_admin = TRUE 
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'your-email@example.com'
);
*/

-- Step 7: Check all admin users
SELECT 
  p.id,
  u.email,
  p.name,
  p.is_admin
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.is_admin = TRUE;

