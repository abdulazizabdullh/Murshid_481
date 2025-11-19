# Troubleshooting Profile Update Issues

## Problem
Profile updates don't reflect in the database and loading persists indefinitely.

## Recent Fixes Applied

### 1. Fixed `updateProfile` function in `AuthContext.tsx`
- Added `.select().single()` to the upsert operation to properly fetch updated data
- Removed `setLoading(false)` from finally block that was interfering with component loading state
- Added proper error logging for debugging
- Moved success toast to the AuthContext to ensure it shows when update succeeds

### 2. Updated `ProfileSection.tsx`
- Removed duplicate success toast
- Improved error handling
- Maintained local loading state for UI responsiveness

## Verification Steps

### Step 1: Check Supabase Row Level Security (RLS) Policies

The most common cause of profile update failures is missing or incorrect RLS policies. Run these queries in your Supabase SQL Editor:

```sql
-- Check if RLS is enabled on profiles table
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'profiles';

-- View existing policies on profiles table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'profiles';
```

### Step 2: Create Proper RLS Policies (If Missing)

If you don't have proper policies, run this SQL to create them:

```sql
-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

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

-- Optional: Allow users to delete their own profile
CREATE POLICY "Users can delete their own profile"
  ON profiles FOR DELETE
  USING (auth.uid() = id);
```

### Step 3: Verify Profiles Table Structure

Ensure all required columns exist:

```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;
```

Required columns:
- `id` (UUID, primary key, references auth.users)
- `name` (TEXT, nullable)
- `establishment_name` (TEXT, nullable)
- `level` (TEXT, nullable)
- `gender` (TEXT, nullable)
- `role` (TEXT, nullable)
- `student_type` (TEXT, nullable)
- `track` (TEXT, nullable)
- `created_at` (timestamp, optional)
- `updated_at` (timestamp, optional)

### Step 4: Check if Profile Row Exists

When you try to update a profile, check if a row exists for your user:

```sql
-- Replace 'YOUR_USER_ID' with your actual user ID
SELECT * FROM profiles WHERE id = 'YOUR_USER_ID';
```

If no row exists, you need to create one first. The signup process should handle this, but you can manually insert:

```sql
-- This will be automatically done by the app, but you can verify
INSERT INTO profiles (id, name) 
VALUES (auth.uid(), 'Your Name')
ON CONFLICT (id) DO NOTHING;
```

### Step 5: Test the Update in SQL

Test if you can manually update the profile:

```sql
-- Replace 'YOUR_USER_ID' with your actual user ID
UPDATE profiles 
SET 
  name = 'Test Name',
  establishment_name = 'Test University',
  role = 'Student',
  gender = 'Male'
WHERE id = 'YOUR_USER_ID';

-- Verify the update
SELECT * FROM profiles WHERE id = 'YOUR_USER_ID';
```

If this fails, check the error message—it will likely point to the RLS policy issue.

### Step 6: Check Browser Console for Errors

1. Open your browser's Developer Tools (F12)
2. Go to the Console tab
3. Try to update your profile
4. Look for error messages, especially:
   - "Failed to update profile" with error details
   - "new row violates row-level security policy"
   - "Profile update error:" with specific error

### Step 7: Verify Environment Variables

Ensure your `.env` file has the correct Supabase credentials:

```env
VITE_SUPABASE_URL=your-project-url.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Step 8: Check Network Tab

1. Open Developer Tools (F12)
2. Go to Network tab
3. Try to update profile
4. Look for the request to Supabase
5. Check:
   - Request payload (should contain your profile data)
   - Response status (should be 200 or 201)
   - Response body (should contain updated profile or error details)

## Common Issues and Solutions

### Issue 1: "new row violates row-level security policy"
**Solution:** Add or update RLS policies (see Step 2)

### Issue 2: Profile updates locally but not in database
**Solution:** 
- Check if the `upsert` operation is failing silently
- Verify RLS policies allow UPDATE operation
- Check if user ID matches between auth and profiles table

### Issue 3: Loading persists indefinitely
**Solution:**
- The fix applied removes the conflicting `setLoading(false)` from AuthContext
- Ensure you're using the updated code
- Check if any error is being thrown that prevents finally block execution

### Issue 4: No profile row exists for user
**Solution:**
```sql
-- Create profile row for existing users
INSERT INTO profiles (id, name)
SELECT id, COALESCE(raw_user_meta_data->>'name', email)
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles);
```

### Issue 5: "Cannot read properties of undefined"
**Solution:** 
- Ensure user is logged in
- Check if `user?.id` exists before updating
- Verify auth session is valid

## Testing Checklist

After applying fixes:

- [ ] Login to your application
- [ ] Navigate to Profile page
- [ ] Click "Edit" button
- [ ] Change some profile fields
- [ ] Click "Save Changes"
- [ ] Verify "Profile updated successfully!" toast appears
- [ ] Verify loading stops (button says "Save Changes" not "Saving...")
- [ ] Verify changes are reflected in the UI immediately
- [ ] Refresh the page
- [ ] Verify changes persist after refresh
- [ ] Check Supabase dashboard → Table Editor → profiles to see updated data

## Still Having Issues?

If problems persist after following these steps:

1. **Check Supabase Logs:**
   - Go to your Supabase dashboard
   - Navigate to Logs → API Logs
   - Look for failed requests

2. **Enable detailed logging:**
   - The updated code includes console.log statements
   - Check browser console for detailed error messages

3. **Verify authentication:**
   ```javascript
   // Run in browser console
   const { data } = await supabase.auth.getSession();
   console.log('Current user:', data.session?.user);
   ```

4. **Test with a fresh account:**
   - Create a new account
   - Try updating the profile immediately
   - This helps identify if it's a data migration issue

## Contact Support

If you've completed all steps and still experience issues, please provide:
- Error messages from browser console
- Error messages from Supabase logs
- Screenshots of RLS policies
- Network request/response details

