# 🚀 Quick Start Checklist

Follow these steps to get your Universities & Majors features up and running!

## ✅ Step-by-Step Setup

### Step 1: Database Setup (5 minutes)

1. **Open Supabase Dashboard**
   - Go to your Supabase project
   - Navigate to **SQL Editor**

2. **Run Migration**
   - Open the file `database_schema.sql`
   - Copy ALL content (Ctrl/Cmd + A, then Ctrl/Cmd + C)
   - Paste into Supabase SQL Editor
   - Click **RUN** button
   - Wait for "Success" message

3. **Verify Tables**
   - Go to **Table Editor** in Supabase
   - You should see these 4 new tables:
     - ✅ `universities`
     - ✅ `majors`
     - ✅ `university_majors`
     - ✅ `bookmarks`

---

### Step 2: Grant Admin Access (1 minute)

1. **Find Your Email**
   - Note the email address you use to login

2. **Run SQL Command**
   - Go back to **SQL Editor** in Supabase
   - Run this command (replace with your email):

```sql
UPDATE profiles 
SET is_admin = true 
WHERE email = 'your-email@example.com';
```

3. **Verify**
   - Go to **Table Editor** → `profiles`
   - Find your profile
   - Check that `is_admin` is now `true`

---

### Step 3: Install Dependencies (1 minute)

**Optional** - only if you see errors about missing `skeleton` component:

```bash
cd Murshid-Frontend
npx shadcn@latest add skeleton
```

---

### Step 4: Start Development Server

```bash
npm run dev
# or
bun dev
```

---

### Step 5: Test Features (10 minutes)

#### A. Test Admin Access

1. **Login** with your admin account
2. **Navigate to** `/admin`
3. You should see 3 new management cards:
   - Manage Universities
   - Manage Majors
   - Assign Majors

#### B. Add a University

1. **Click** "Manage Universities"
2. **Click** "+ Add University" button
3. **Fill form** with sample data:
   - Name: "Test University"
   - City: "Riyadh"
   - Type: "Public"
   - (optional) Fill other fields
4. **Click** "Create University"
5. ✅ Success! You should see it in the list

#### C. Add a Major

1. **Go back** and click "Manage Majors"
2. **Click** "+ Add Major" button
3. **Fill form** with sample data:
   - Name: "Test Major"
   - Category: "Engineering"
   - Degree Type: "Bachelor"
   - Duration: 4
   - Icon: 📚
4. **Click** "Create Major"
5. ✅ Success! You should see it in the list

#### D. Assign Major to University

1. **Go back** and click "Assign Majors"
2. **Select** the university you created
3. **Click** "+ Assign Major" button
4. **Select** the major you created
5. **Add program details** (optional):
   - Tuition fee: 50000
   - Capacity: 100
6. **Click** "Assign Major"
7. ✅ Success! You should see the major listed under the university

#### E. Test Student Features

1. **Logout** (or open incognito window)
2. **Navigate to** `/universities`
   - You should see your test university
   - Try searching
   - Try filtering by type
   - Click bookmark icon (login required)

3. **Navigate to** `/majors`
   - You should see your test major
   - Try searching
   - Try filtering by category
   - Click bookmark icon (login required)

4. **Login as student** (non-admin account)
   - Bookmark a university
   - Bookmark a major
   - Reload page - bookmarks should persist
   - Click bookmark again to remove

---

## 🎯 What to Expect

### Universities Page (`/universities`)
- Grid of university cards
- Search bar
- Type filter (Public/Private/International)
- City filter (dynamic list)
- Bookmark button on each card
- Loading skeletons while fetching

### Majors Page (`/majors`)
- Grid of major cards
- Search bar
- Category filter
- Degree type filter
- Bookmark button on each card
- Loading skeletons while fetching

### Admin Pages
- `/admin/universities` - Full CRUD for universities
- `/admin/majors` - Full CRUD for majors
- `/admin/university-majors` - Assign majors to universities

---

## 🐛 Troubleshooting

### "Failed to load universities/majors"

**Check:**
1. Supabase connection is working (check other pages)
2. Tables were created successfully
3. Browser console for errors

**Solution:**
- Verify `database_schema.sql` was run successfully
- Check RLS policies are enabled
- Restart dev server

---

### "Permission denied" errors

**Check:**
1. You're logged in
2. Your account has `is_admin = true` in profiles table

**Solution:**
```sql
-- Run in Supabase SQL Editor
UPDATE profiles 
SET is_admin = true 
WHERE email = 'your-email@example.com';
```

---

### Bookmarks not working

**Check:**
1. You're logged in (not guest)
2. `bookmarks` table exists

**Solution:**
- Make sure you ran the full `database_schema.sql`
- Check browser console for errors

---

### TypeScript errors

**Check:**
- All new files are in the correct locations
- No missing imports

**Solution:**
```bash
# Restart TypeScript server in VS Code
Ctrl/Cmd + Shift + P → "TypeScript: Restart TS Server"
```

---

## 📚 Documentation

For more details:
- **Complete guide:** See `IMPLEMENTATION_GUIDE.md`
- **Features list:** See `FEATURES_SUMMARY.md`
- **Database schema:** See `database_schema.sql`

---

## ✨ Sample Data (Optional)

The migration includes sample universities and majors. If you want to remove them:

```sql
-- Remove sample data
DELETE FROM university_majors;
DELETE FROM majors WHERE name IN ('Computer Science', 'Mechanical Engineering', 'Medicine', 'Business Administration', 'Architecture');
DELETE FROM universities WHERE name IN ('King Saud University', 'King Abdulaziz University', 'King Fahd University of Petroleum and Minerals');
```

---

## 🎉 You're All Set!

Your Murshid application now has:
- ✅ Database-driven universities and majors
- ✅ Student bookmarks
- ✅ Advanced search and filters
- ✅ Full admin management
- ✅ Many-to-many relationships
- ✅ Bilingual support
- ✅ Secure RLS policies

**Happy coding!** 🚀

If you encounter any issues, check:
1. Browser console for errors
2. Supabase logs
3. `IMPLEMENTATION_GUIDE.md` for detailed instructions

