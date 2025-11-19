# Admin System Setup Guide

## ✅ What's Been Added

### 1. **Admin Dashboard**
- Minimalist design with clean table layout
- View all users and their information
- Search functionality to filter users
- Statistics cards showing total users, students, and specialists
- Real-time data from Supabase

### 2. **Admin Authentication**
- Admin users are automatically redirected to `/admin` dashboard
- Regular users cannot access the admin dashboard
- Admin status stored in `is_admin` field in profiles table

### 3. **Database Changes**
- Added `is_admin` boolean column to profiles table
- Default value is `FALSE` for all users

---

## 🚀 Setup Instructions

### Step 1: Update Database Schema

1. Go to your **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. The `setup_profiles_complete.sql` has been updated with the `is_admin` column
4. Run the SQL script (if you haven't already)

The script will:
- Add `is_admin` column to profiles table
- Set default value to `FALSE`

### Step 2: Create an Admin Account

You have **two options**:

#### Option A: Make Your Current Account an Admin

Run this in Supabase SQL Editor while logged in:

```sql
UPDATE profiles 
SET is_admin = TRUE 
WHERE id = auth.uid();
```

#### Option B: Create a New Admin Account

1. **Sign up** with a new account (e.g., `admin@murshid.com`)
2. Run this in Supabase SQL Editor:

```sql
UPDATE profiles 
SET is_admin = TRUE 
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'admin@murshid.com'
);
```

Replace `admin@murshid.com` with your admin email.

### Step 3: Test Admin Access

1. **Logout** if you're currently logged in
2. **Login** with your admin account
3. You should be automatically redirected to `/admin` dashboard
4. You should see:
   - List of all users
   - User statistics
   - Search functionality
   - Clean, minimalist interface

---

## 📊 Admin Dashboard Features

### **User Table Columns:**
- Name
- Email
- Role (Student/Specialist)
- Institution
- Level
- Gender
- Joined Date
- Status (Admin badge for admin users)

### **Statistics:**
- Total Users count
- Students count
- Specialists count

### **Search:**
- Search by name, email, or institution
- Real-time filtering

### **Security:**
- Only admin users can access `/admin` route
- Regular users trying to access will be redirected
- Admin status checked on both frontend and can be verified with RLS in backend

---

## 🔒 Security Notes

### **Current Implementation:**
- Frontend checks `is_admin` field
- Protected route redirects non-admin users
- Admin status loaded from Supabase profiles table

### **Production Recommendations:**

1. **Add RLS Policies for Admin Operations:**

```sql
-- Only admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    auth.uid() IN (SELECT id FROM profiles WHERE is_admin = TRUE)
    OR auth.uid() = id
  );
```

2. **Prevent Users from Making Themselves Admin:**

```sql
-- Prevent users from setting is_admin via app
CREATE POLICY "Only admins can modify admin status"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    CASE 
      WHEN is_admin != (SELECT is_admin FROM profiles WHERE id = auth.uid())
      THEN auth.uid() IN (SELECT id FROM profiles WHERE is_admin = TRUE)
      ELSE TRUE
    END
  );
```

---

## 🎨 Admin Dashboard Design

The dashboard follows a **minimalist design**:

- ✅ Clean white background
- ✅ Simple table layout
- ✅ Subtle borders and shadows
- ✅ Icon-based navigation
- ✅ Card-based statistics
- ✅ Responsive design
- ✅ Search with instant feedback
- ✅ Badge indicators for roles and status

---

## 📱 Routes

| Route | Access | Description |
|-------|--------|-------------|
| `/login` | Public | Login page with admin support |
| `/admin` | Admin Only | Admin dashboard |
| `/` | Authenticated | Regular user homepage |
| `/profile` | Authenticated | User profile page |

---

## 🔧 Troubleshooting

### **Issue: Can't access admin dashboard after making account admin**

**Solution:**
1. Logout completely
2. Clear browser cache
3. Login again
4. Check Supabase that `is_admin = TRUE` in profiles table

### **Issue: "Access denied" message when accessing /admin**

**Solution:**
1. Check database:
```sql
SELECT id, email, is_admin FROM profiles WHERE email = 'your-email@example.com';
```
2. Ensure `is_admin` is `TRUE`
3. If not, run the UPDATE query again

### **Issue: Admin sees regular homepage instead of dashboard**

**Solution:**
The AuthContext redirects admin users to `/admin` on login. If this doesn't happen:
1. Check browser console for errors
2. Verify `is_admin` field is loaded correctly
3. Logout and login again

---

## 💡 Quick Commands

### Make Current User Admin:
```sql
UPDATE profiles SET is_admin = TRUE WHERE id = auth.uid();
```

### Remove Admin Rights:
```sql
UPDATE profiles SET is_admin = FALSE WHERE id = auth.uid();
```

### List All Admins:
```sql
SELECT id, name, email FROM profiles WHERE is_admin = TRUE;
```

### Count Total Users:
```sql
SELECT COUNT(*) FROM profiles;
```

---

## ✨ Summary

You now have:
- ✅ Fully functional admin dashboard
- ✅ User management interface
- ✅ Search and filter capabilities
- ✅ Statistics overview
- ✅ Secure admin authentication
- ✅ Minimalist, clean design
- ✅ Mobile responsive

**Next Steps:**
1. Run the updated SQL script
2. Create or promote an admin account
3. Login and access `/admin`
4. Enjoy managing your users!

---

**Created:** October 23, 2025  
**Version:** 1.0

