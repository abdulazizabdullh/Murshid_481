# 🔍 Diagnose Profile Update Issue

## The Problem
After signing up, when you try to update profile information (like university name), it says "Saving..." and gets stuck.

## Step 1: Check Browser Console RIGHT NOW

1. **Open your browser** where the app is running
2. **Press F12** to open Developer Tools
3. **Click the "Console" tab**
4. **Try to update your profile** (change university name, etc.)
5. **Click "Save Changes"**
6. **Look at the console messages**

You should see messages like:
```
🔄 Starting profile update...
User ID: abc-123-def
Update data: { name: "...", establishment_name: "...", ... }
📝 Updating auth user metadata...
✅ Auth metadata updated
💾 Upserting to profiles table...
Payload: { id: "...", name: "...", ... }
```

### If you see an ERROR message (red text), tell me:
- **Error code:** (like `42501`, `PGRST116`, etc.)
- **Error message:** The full error text
- **Where it stopped:** Did it fail at "Auth metadata" or "Upserting to profiles table"?

## Step 2: Most Likely Issue - RLS Policies Not Set Up

### Did you run the SQL script in Supabase?

**If NO** → That's the problem! Here's how to fix it:

1. **Copy the entire contents** of `setup_profiles_complete.sql`
2. Go to https://app.supabase.com
3. Select your Murshid project
4. Click **SQL Editor** (left sidebar)
5. Click **New Query**
6. **Paste** the SQL script
7. Click **Run** (or Ctrl+Enter)
8. Wait for success messages

**If YES** → Let's verify it worked:

### Step 3: Verify RLS Policies in Supabase

1. Go to your Supabase Dashboard
2. Click **Authentication** → **Policies**
3. Look for the **profiles** table
4. You should see 4 policies:
   - ✅ "Users can view their own profile" (SELECT)
   - ✅ "Users can insert their own profile" (INSERT)
   - ✅ "Users can update their own profile" (UPDATE)
   - ✅ "Users can delete their own profile" (DELETE)

**If you DON'T see these policies** → The SQL script didn't run properly. Try again.

### Step 4: Check if Profile Row Exists

Run this in Supabase SQL Editor:

```sql
-- Check your profile
SELECT * FROM profiles WHERE id = auth.uid();
```

**Expected result:** 
- Should show your profile row with your data

**If NO rows returned:**
- Your profile doesn't exist
- The signup didn't create it (likely RLS issue during signup)

**Fix:** Run this SQL to create your profile manually:

```sql
INSERT INTO profiles (id, name)
VALUES (auth.uid(), 'Your Name')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
```

Then try updating profile again.

## Step 5: Quick Test in SQL

Try updating your profile directly in SQL to see if RLS allows it:

```sql
UPDATE profiles 
SET establishment_name = 'Test University',
    role = 'Student'
WHERE id = auth.uid();
```

**If this works:**
- RLS policies are correct
- Problem is in the frontend code (unlikely with our fixes)

**If this FAILS with error:**
- RLS policies are not set up correctly
- Run `setup_profiles_complete.sql` again

## Common Error Messages and Solutions

### Error: "new row violates row-level security policy for table 'profiles'"
**Code:** `42501`

**Meaning:** RLS policies don't allow you to update your own profile

**Fix:**
1. Run `setup_profiles_complete.sql` in Supabase
2. Make sure you're logged in (check `auth.uid()` is not null)

### Error: "No rows found"
**Code:** `PGRST116`

**Meaning:** Your profile row doesn't exist

**Fix:**
```sql
INSERT INTO profiles (id, name)
VALUES (auth.uid(), 'Your Name')
ON CONFLICT (id) DO NOTHING;
```

### Error: "Failed to fetch" or Network error

**Meaning:** Can't connect to Supabase

**Fix:**
1. Check your internet connection
2. Verify Supabase project is running (not paused)
3. Check environment variables are correct

### Error: "JWT expired" or "Invalid token"

**Meaning:** Your session expired

**Fix:**
1. Log out
2. Log in again
3. Try updating profile

## Step 6: Restart Everything

If still not working:

1. **Stop your dev server** (Ctrl+C)
2. **Clear browser cache:**
   - Press Ctrl+Shift+Delete
   - Select "Cached images and files"
   - Clear
3. **Restart dev server:**
   ```bash
   npm run dev
   ```
4. **Hard refresh browser:**
   - Press Ctrl+Shift+R (or Cmd+Shift+R on Mac)
5. **Log out and log in again**
6. **Try updating profile**

## Step 7: Enable Detailed Supabase Logging

1. Open browser console (F12)
2. Before updating profile, run this:
   ```javascript
   localStorage.setItem('supabase.auth.debug', 'true')
   ```
3. Try updating profile again
4. Check console for detailed Supabase logs

## What to Tell Me

If it's still not working, please provide:

1. **Error messages from browser console** (copy/paste the red errors)
2. **Did you run the SQL script?** (Yes/No)
3. **Can you see RLS policies in Supabase?** (Yes/No)
4. **Does the profile row exist?** (run the SELECT query above)
5. **What happens when you try the UPDATE query in SQL?** (Success/Error)
6. **Screenshot of browser console** when clicking "Save Changes"

## Quick Checklist

Before reporting the issue, verify:

- [ ] Ran `setup_profiles_complete.sql` in Supabase SQL Editor
- [ ] SQL script showed success messages (no errors)
- [ ] Can see 4 RLS policies for profiles table
- [ ] Profile row exists (SELECT query returns data)
- [ ] UPDATE query in SQL works
- [ ] Dev server restarted
- [ ] Browser cache cleared
- [ ] Logged out and back in
- [ ] Still getting stuck on "Saving..."

---

**Most Common Fix:** Just run the SQL script properly in Supabase!

99% of the time, this issue is because the RLS policies aren't set up yet.

