# Universities & Majors Feature Implementation Guide

This guide provides step-by-step instructions to implement the complete Universities and Majors feature with database integration, bookmarks, search, filters, and admin management.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Database Setup](#database-setup)
3. [Features Implemented](#features-implemented)
4. [Installation Steps](#installation-steps)
5. [Admin Access](#admin-access)
6. [API Reference](#api-reference)
7. [Testing](#testing)

---

## 🎯 Overview

This implementation adds the following capabilities to your Murshid application:

- **Database-driven** universities and majors (instead of hardcoded data)
- **Student features**: bookmark universities/majors, search, and filter
- **Admin features**: full CRUD operations for universities and majors
- **Many-to-many relationship**: assign majors to universities with additional details (tuition, requirements, etc.)

---

## 🗄️ Database Setup

### Step 1: Run the Database Migration

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the entire content of `database_schema.sql`
4. Paste it into the SQL Editor
5. Click **Run** to execute the migration

This will create:
- `universities` table
- `majors` table
- `university_majors` junction table (for many-to-many relationship)
- `bookmarks` table
- All necessary indexes, RLS policies, and triggers

### Step 2: Verify Tables Were Created

Go to **Table Editor** in Supabase and verify you see these tables:
- universities
- majors
- university_majors
- bookmarks

---

## ✨ Features Implemented

### 1. **Student Features**

#### Majors Page (`/majors`)
- ✅ Fetches majors from database
- ✅ Search by name (English & Arabic)
- ✅ Filter by category (Engineering, Medicine, Business, IT, etc.)
- ✅ Filter by degree type (Bachelor, Master, PhD, Diploma)
- ✅ Bookmark/unbookmark majors
- ✅ Responsive cards with major details

#### Universities Page (`/universities`)
- ✅ Fetches universities from database
- ✅ Search by name and city
- ✅ Filter by type (Public, Private, International)
- ✅ Filter by city (dynamic list from database)
- ✅ Bookmark/unbookmark universities
- ✅ Display university details (location, ranking, student count)

#### Bookmarks
- ✅ Custom hook `useBookmarks()` for managing bookmarks
- ✅ Toggle bookmark on/off
- ✅ Visual indicator (filled bookmark icon)
- ✅ Guest users see "Please log in" message

### 2. **Admin Features**

#### Manage Universities (`/admin/universities`)
- ✅ View all universities
- ✅ Create new university
- ✅ Edit existing university
- ✅ Delete university
- ✅ Search universities
- ✅ Bilingual support (English & Arabic names/descriptions)
- ✅ Fields: name, description, city, type, website, logo, ranking, contact info, etc.

#### Manage Majors (`/admin/majors`)
- ✅ View all majors
- ✅ Create new major
- ✅ Edit existing major
- ✅ Delete major
- ✅ Search majors
- ✅ Bilingual support
- ✅ Fields: name, description, category, degree type, duration, career prospects, salary range, icon

#### Assign Majors to Universities (`/admin/university-majors`)
- ✅ Select a university
- ✅ View all majors currently offered by that university
- ✅ Assign new major to university with details:
  - Tuition fee
  - Admission requirements (EN & AR)
  - Student capacity
  - Program URL
- ✅ Remove major from university
- ✅ Prevents duplicate assignments

---

## 🚀 Installation Steps

### Step 1: Install Missing Dependencies (if needed)

The implementation uses these Shadcn UI components. Ensure they're installed:

```bash
npx shadcn@latest add skeleton
```

All other components should already be present in your project.

### Step 2: Database Migration

As described in the [Database Setup](#database-setup) section above, run the `database_schema.sql` file in your Supabase SQL Editor.

### Step 3: Add Sample Data (Optional)

The migration script includes some sample data for testing:
- 3 universities (King Saud, King Abdulaziz, KFUPM)
- 5 majors (Computer Science, Mechanical Engineering, Medicine, Business Admin, Architecture)

You can skip this or modify it based on your needs.

### Step 4: Update Admin Navigation (Optional)

You may want to add links to the new admin pages in your `AdminDashboard.tsx`:

```tsx
<Link to="/admin/universities">
  <Button>Manage Universities</Button>
</Link>
<Link to="/admin/majors">
  <Button>Manage Majors</Button>
</Link>
<Link to="/admin/university-majors">
  <Button>Assign Majors to Universities</Button>
</Link>
```

---

## 🔐 Admin Access

### Prerequisites

To access admin pages, a user must have `is_admin = true` in the `profiles` table.

### Grant Admin Access

Run this SQL in Supabase to make a user an admin:

```sql
UPDATE profiles 
SET is_admin = true 
WHERE email = 'your-admin-email@example.com';
```

### Admin Routes

Once logged in as admin:
- `/admin` - Admin Dashboard
- `/admin/universities` - Manage Universities
- `/admin/majors` - Manage Majors
- `/admin/university-majors` - Assign Majors to Universities

All admin routes are protected by `ProtectedRoute` component.

---

## 📚 API Reference

### Universities API (`src/lib/universitiesApi.ts`)

```typescript
// Get all universities with optional filters
getUniversities(filters?: { city?, type?, search? })

// Get single university with its majors
getUniversityById(id: string)

// Create university (admin only)
createUniversity(university: Partial<University>)

// Update university (admin only)
updateUniversity(id: string, updates: Partial<University>)

// Delete university (admin only)
deleteUniversity(id: string)

// Get list of cities for filter
getUniversityCities()

// Assign major to university (admin only)
assignMajorToUniversity(universityId, majorId, details?)

// Remove major from university (admin only)
removeMajorFromUniversity(universityId, majorId)
```

### Majors API (`src/lib/majorsApi.ts`)

```typescript
// Get all majors with optional filters
getMajors(filters?: { category?, degree_type?, search? })

// Get single major with its universities
getMajorById(id: string)

// Create major (admin only)
createMajor(major: Partial<Major>)

// Update major (admin only)
updateMajor(id: string, updates: Partial<Major>)

// Delete major (admin only)
deleteMajor(id: string)

// Get universities offering a major
getUniversitiesByMajor(majorId: string)

// Get majors offered by a university
getMajorsByUniversity(universityId: string)
```

### Bookmarks API (`src/lib/bookmarksApi.ts`)

```typescript
// Get all bookmarks for user
getUserBookmarks(userId: string)

// Check if item is bookmarked
isBookmarked(userId, itemType, itemId)

// Add bookmark
addBookmark(userId, itemType, itemId, notes?)

// Remove bookmark
removeBookmark(userId, itemType, itemId)

// Toggle bookmark
toggleBookmark(userId, itemType, itemId)

// Get bookmarked universities
getBookmarkedUniversities(userId)

// Get bookmarked majors
getBookmarkedMajors(userId)
```

### Hooks

#### `useBookmarks()`

```typescript
const {
  bookmarkedUniversities,  // Array of bookmarked universities
  bookmarkedMajors,        // Array of bookmarked majors
  loading,                 // Boolean
  toggleBookmark,          // (itemType, itemId) => Promise<boolean>
  isBookmarked,            // (itemType, itemId) => boolean
  refreshBookmarks         // () => Promise<void>
} = useBookmarks();
```

---

## 🧪 Testing

### Test Database Setup

1. ✅ Verify tables exist in Supabase Table Editor
2. ✅ Check RLS policies are enabled
3. ✅ Verify sample data was inserted (optional)

### Test Student Features

1. **Test Majors Page:**
   - Navigate to `/majors`
   - Verify majors load from database
   - Test search functionality
   - Test category filter
   - Test degree type filter
   - Test bookmark toggle (requires login)

2. **Test Universities Page:**
   - Navigate to `/universities`
   - Verify universities load from database
   - Test search functionality
   - Test type filter
   - Test city filter
   - Test bookmark toggle (requires login)

### Test Admin Features

1. **Make yourself admin** (run SQL above)

2. **Test University Management:**
   - Go to `/admin/universities`
   - Create a new university
   - Edit an existing university
   - Delete a university
   - Test search

3. **Test Major Management:**
   - Go to `/admin/majors`
   - Create a new major
   - Edit an existing major
   - Delete a major
   - Test search

4. **Test Major-University Assignment:**
   - Go to `/admin/university-majors`
   - Select a university
   - Assign a major with details
   - Verify major appears in list
   - Remove a major
   - Try to assign duplicate (should fail gracefully)

### Test Bookmarks

1. Login as a student (non-admin user)
2. Go to `/majors` and bookmark 2-3 majors
3. Go to `/universities` and bookmark 2-3 universities
4. Verify bookmark state persists on page reload
5. Unbookmark an item and verify it's removed

---

## 📝 Database Schema Summary

### Universities Table
- Core fields: name, name_ar, description, city, type, website
- Metadata: establishment_year, ranking, student_count
- Contact: email, phone
- Relations: has many majors through university_majors

### Majors Table
- Core fields: name, name_ar, description, category, degree_type
- Details: duration, career_prospects, salary_range
- UI: icon_name, color
- Relations: belongs to many universities through university_majors

### University_Majors Table (Junction)
- Links: university_id, major_id
- Program details: tuition_fee, admission_requirements, capacity, program_url

### Bookmarks Table
- Links: user_id, item_type ('university' | 'major'), item_id
- Optional: notes

---

## 🎨 Customization

### Add More Filters

You can easily add more filters by:
1. Adding filter state in the page component
2. Passing it to the API function
3. Updating the API function to include it in the query

Example - Add ranking filter:
```typescript
// In Universities.tsx
const [minRanking, setMinRanking] = useState(0);

// In fetchUniversities
const filters = {
  ...existingFilters,
  min_ranking: minRanking
};

// In universitiesApi.ts
if (filters?.min_ranking) {
  query = query.lte('ranking_national', filters.min_ranking);
}
```

### Customize UI

All pages use Shadcn UI components and Tailwind CSS. You can customize:
- Colors: Update the gradient classes
- Layout: Modify grid columns
- Card design: Edit Card component styling
- Icons: Change Lucide icons

---

## 🐛 Troubleshooting

### "Failed to load universities/majors"

- Check Supabase connection in `src/lib/supabase.ts`
- Verify environment variables are set
- Check browser console for errors
- Verify RLS policies are correct

### "Permission denied" when creating/updating

- Verify user has `is_admin = true` in profiles table
- Check RLS policies allow admin operations
- Ensure user is logged in

### Bookmarks not working

- Verify user is logged in (not guest)
- Check bookmarks table exists
- Verify RLS policies allow user to CRUD their own bookmarks

### Majors/Universities not showing in assignment page

- Verify data exists in respective tables
- Check the many-to-many relationship is set up correctly
- Look for errors in browser console

---

## 🚀 Next Steps

Consider adding:
1. **University/Major detail pages** - Individual pages with more info
2. **Comparison feature** - Compare multiple universities/majors
3. **Recommendations** - Based on student profile/assessment results
4. **Reviews/Ratings** - Let students review universities/majors
5. **Application tracking** - Track university applications
6. **Analytics** - Admin dashboard with stats and insights

---

## 📞 Support

If you encounter any issues:
1. Check the browser console for errors
2. Verify database setup is complete
3. Check Supabase logs
4. Review RLS policies

Happy coding! 🎉

