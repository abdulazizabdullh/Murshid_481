# 📸 Image Upload Feature - Implementation Guide

## ✅ What Was Added

I've implemented complete **image upload functionality** for profile pictures, university logos, and major icons! All images are stored securely in Supabase Storage.

---

## 🎯 Features Implemented

### 1. **User Profile Picture** 👤
- Users can upload their profile picture
- Shows in profile page, navbar (future), and everywhere user info is displayed
- Supports JPG, PNG, GIF, WebP
- Max size: 2MB
- Easy upload/remove functionality

### 2. **University Logos** 🏛️
- Admins can upload university logos
- Shows on university cards and detail pages
- Replaces the default building icon
- Stored per university

### 3. **Major Icons/Images** 📚
- Admins can upload major icons/images
- Alternative to emoji icons
- Shows on major cards and detail pages
- Stored per major

---

## 📦 Files Created/Updated

### New Files (2)
```
Murshid-Frontend/
├── storage_setup.sql                      # Supabase storage bucket setup
└── src/
    └── components/
        └── ImageUpload.tsx                # Reusable upload component
```

### Updated Files (9)
```
src/
├── contexts/
│   └── AuthContext.tsx                    # Added avatar_url to AppUser
├── components/
│   └── ProfileSection.tsx                 # Added profile pic upload
└── pages/
    ├── AdminUniversities.tsx              # Added logo upload
    ├── AdminMajors.tsx                    # Added icon upload
    ├── Majors.tsx                         # Display images
    ├── MajorDetail.tsx                    # Display images
    ├── UniversityDetail.tsx               # Display logos
    └── Bookmarks.tsx                      # Display images (2 places)
```

---

## 🚀 Setup Instructions

### Step 1: Run Storage Setup SQL

1. **Open Supabase Dashboard**
2. Go to **SQL Editor**
3. **Copy content** from `storage_setup.sql`
4. **Run** the SQL script

This will:
- ✅ Create 3 storage buckets (`avatars`, `university-logos`, `major-icons`)
- ✅ Set up RLS policies (security)
- ✅ Add `avatar_url` column to profiles table
- ✅ Configure public access for viewing
- ✅ Configure upload permissions (users for avatars, admins for logos/icons)

### Step 2: Verify Buckets

1. Go to **Storage** in Supabase Dashboard
2. You should see 3 buckets:
   - `avatars` (public)
   - `university-logos` (public)
   - `major-icons` (public)

### Step 3: Test!

**Profile Picture:**
1. Login to your account
2. Go to `/profile`
3. Click "Edit Profile"
4. Upload an image
5. Save (automatic)
6. See your profile picture!

**University Logo (Admin):**
1. Login as admin
2. Go to `/admin/universities`
3. Create or edit a university
4. Upload logo
5. Save
6. See logo on university cards!

**Major Icon (Admin):**
1. Login as admin
2. Go to `/admin/majors`
3. Create or edit a major
4. Upload icon/image
5. Save
6. See icon on major cards!

---

## 🎨 ImageUpload Component

### Features
- ✅ Preview before/after upload
- ✅ Drag & drop support (via file input)
- ✅ File size validation
- ✅ File type validation
- ✅ Remove button
- ✅ Loading state
- ✅ Error handling
- ✅ Toast notifications
- ✅ Automatic old file deletion

### Usage Example

```tsx
import ImageUpload from '@/components/ImageUpload';

<ImageUpload
  currentImage={imageUrl}
  onImageUpload={(url) => setImageUrl(url)}
  bucket="avatars"                  // or "university-logos" or "major-icons"
  path={user?.id || 'default'}      // unique path for the file
  label="Upload Image"              // button text
  maxSizeMB={2}                     // max file size
/>
```

### Props

| Prop | Type | Description |
|------|------|-------------|
| `currentImage` | `string?` | Current image URL (optional) |
| `onImageUpload` | `(url: string) => void` | Callback when upload completes |
| `bucket` | `'avatars' \| 'university-logos' \| 'major-icons'` | Supabase storage bucket |
| `path` | `string` | Unique file path (usually ID) |
| `label` | `string?` | Upload button text (default: "Upload Image") |
| `accept` | `string?` | File types (default: "image/*") |
| `maxSizeMB` | `number?` | Max file size in MB (default: 2) |
| `className` | `string?` | Additional CSS classes |

---

## 🔒 Security (RLS Policies)

### Avatars Bucket
- ✅ **View**: Anyone can view
- ✅ **Upload**: Only authenticated users (their own avatar)
- ✅ **Update**: Only avatar owner
- ✅ **Delete**: Only avatar owner

### University-Logos Bucket
- ✅ **View**: Anyone can view
- ✅ **Upload**: Only admins
- ✅ **Update**: Only admins
- ✅ **Delete**: Only admins

### Major-Icons Bucket
- ✅ **View**: Anyone can view
- ✅ **Upload**: Only admins
- ✅ **Update**: Only admins
- ✅ **Delete**: Only admins

---

## 📂 Storage Structure

### Avatars
```
avatars/
  └── {user-id}.jpg        # e.g., 123e4567-e89b-12d3.jpg
```

### University Logos
```
university-logos/
  └── {university-id}.png  # e.g., 456e7890-e89b-12d3.png
```

### Major Icons
```
major-icons/
  └── {major-id}.jpg       # e.g., 789e0123-e89b-12d3.jpg
```

---

## 🎭 How It Works

### Upload Flow

1. **User selects file** → File input triggered
2. **Validation** → Check size and type
3. **Preview** → Show preview using FileReader
4. **Upload** → Upload to Supabase Storage
5. **Get URL** → Get public URL
6. **Callback** → Call `onImageUpload` with URL
7. **Update DB** → Save URL to database (profiles/universities/majors table)
8. **Toast** → Show success message

### Remove Flow

1. **Click remove** → X button on preview
2. **Delete from storage** → Remove file from Supabase
3. **Clear preview** → Remove preview
4. **Callback** → Call `onImageUpload` with empty string
5. **Update DB** → Remove URL from database
6. **Toast** → Show success message

---

## 🎨 Display Logic

### Major Icons
Major icons support **both emoji and image URLs**:

```tsx
{major.icon_name?.startsWith('http') ? (
  // If URL, show image
  <img src={major.icon_name} alt={name} className="w-full h-full object-cover" />
) : (
  // If emoji/text, show as text
  <span>{major.icon_name || '📚'}</span>
)}
```

### University Logos
```tsx
{university.logo_url ? (
  <img src={university.logo_url} alt={name} />
) : (
  <Building2Icon />  // Fallback icon
)}
```

### Profile Pictures
```tsx
<Avatar>
  {avatarUrl && <AvatarImage src={avatarUrl} />}
  <AvatarFallback>{initials}</AvatarFallback>
</Avatar>
```

---

## 📊 Supported File Types

- ✅ **JPEG/JPG** - Common photo format
- ✅ **PNG** - Transparency support
- ✅ **GIF** - Animated images
- ✅ **WebP** - Modern format

### File Size Limits

- **Profile Pictures**: 2MB
- **University Logos**: 2MB
- **Major Icons**: 1MB

---

## 🧪 Testing Checklist

### Profile Picture
1. ✅ Go to `/profile`
2. ✅ Click "Edit Profile"
3. ✅ See "Profile Picture" section
4. ✅ Upload an image (JPG/PNG)
5. ✅ See preview immediately
6. ✅ Image saved automatically
7. ✅ Click X to remove
8. ✅ Refresh page - still there
9. ✅ Avatar shows in profile header

### University Logo
1. ✅ Login as admin
2. ✅ Go to `/admin/universities`
3. ✅ Click "Add University" or edit existing
4. ✅ See "University Logo" section at top
5. ✅ Upload logo
6. ✅ See preview
7. ✅ Save university
8. ✅ Logo appears on card
9. ✅ Go to `/universities`
10. ✅ See logo on university card
11. ✅ Click card → See logo on detail page

### Major Icon
1. ✅ Login as admin
2. ✅ Go to `/admin/majors`
3. ✅ Click "Add Major" or edit existing
4. ✅ See "Major Icon/Image" section at top
5. ✅ Upload icon OR use emoji in text field
6. ✅ See preview
7. ✅ Save major
8. ✅ Icon appears on card
9. ✅ Go to `/majors`
10. ✅ See icon on major card
11. ✅ Click card → See icon on detail page

### File Validation
1. ✅ Try uploading >2MB file → Error message
2. ✅ Try uploading PDF → Error message
3. ✅ Upload valid image → Success

---

## 🐛 Troubleshooting

### "Failed to upload image"

**Check:**
1. Storage buckets exist in Supabase
2. RLS policies are set up correctly
3. User has permission (authenticated for avatars, admin for logos/icons)
4. File size is under limit
5. File type is supported

**Solution:**
- Re-run `storage_setup.sql`
- Check Supabase logs
- Verify user authentication

---

### Images not showing

**Check:**
1. Image URL is saved in database
2. Bucket is public
3. URL is correct format
4. Browser can access Supabase storage

**Solution:**
- Check database: `SELECT logo_url FROM universities`
- Verify bucket public setting
- Test URL directly in browser

---

### "Permission denied" when uploading

**Check:**
1. User is logged in (for avatars)
2. User is admin (for logos/icons)
3. RLS policies are correct

**Solution:**
```sql
-- For admins, verify:
SELECT is_admin FROM profiles WHERE id = 'user-id';

-- Should return true
```

---

## 📈 Statistics

**New Features:** 3  
**New Component:** 1 (ImageUpload)  
**Updated Files:** 9  
**Storage Buckets:** 3  
**RLS Policies:** 12  
**Lines of Code:** ~500  
**File Types Supported:** 4  
**Max File Size:** 2MB  

---

## ✨ What You Can Do Now

### As a User:
1. ✅ Upload your profile picture
2. ✅ Change it anytime
3. ✅ Remove it if you want
4. ✅ See it on your profile

### As an Admin:
1. ✅ Upload university logos
2. ✅ Upload major icons/images
3. ✅ Change them anytime
4. ✅ See them on all cards and pages
5. ✅ Mix emoji and images for majors

---

## 🎉 Summary

You now have:
- ✅ Complete image upload system
- ✅ Secure Supabase Storage integration
- ✅ Reusable ImageUpload component
- ✅ Profile picture uploads
- ✅ University logo uploads
- ✅ Major icon uploads
- ✅ Automatic file management
- ✅ RLS security policies
- ✅ Image/emoji hybrid support
- ✅ Responsive preview system
- ✅ Error handling & validation

**Ready to use!** Just run the `storage_setup.sql` and start uploading! 📸✨

---

## 🔗 Related Files

- **Setup**: `storage_setup.sql`
- **Component**: `src/components/ImageUpload.tsx`
- **Profile**: `src/components/ProfileSection.tsx`
- **Admin**: `src/pages/AdminUniversities.tsx`, `src/pages/AdminMajors.tsx`
- **Display**: `src/pages/Majors.tsx`, `src/pages/Universities.tsx`, etc.

---

## 📝 Next Steps (Optional Enhancements)

Consider adding:
1. **Image cropping** - Before upload
2. **Multiple images** - Gallery for universities
3. **Image compression** - Optimize file size
4. **Drag & drop area** - Better UX
5. **Progress bar** - Upload progress
6. **Batch upload** - Multiple files at once
7. **Image editor** - Basic editing tools
8. **CDN integration** - Faster delivery

Happy uploading! 🚀

