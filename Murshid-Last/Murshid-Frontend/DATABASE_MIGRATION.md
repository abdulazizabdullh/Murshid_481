# Database Migration Instructions

## Adding Role-Based Profile Fields to Profiles Table

### Step 1: Run the SQL Migration

Execute the following SQL in your Supabase SQL editor:

```sql
-- Add establishment_name, level, gender, role, student_type, and track columns to profiles table
ALTER TABLE profiles 
ADD COLUMN establishment_name TEXT,
ADD COLUMN level TEXT,
ADD COLUMN gender TEXT,
ADD COLUMN role TEXT,
ADD COLUMN student_type TEXT,
ADD COLUMN track TEXT;

-- Add comments to document the new columns
COMMENT ON COLUMN profiles.establishment_name IS 'Name of the educational institution (high school or university)';
COMMENT ON COLUMN profiles.level IS 'Current academic level or year of study';
COMMENT ON COLUMN profiles.gender IS 'User gender (Male, Female)';
COMMENT ON COLUMN profiles.role IS 'User role (Student, Specialist)';
COMMENT ON COLUMN profiles.student_type IS 'Student type (High School, University)';
COMMENT ON COLUMN profiles.track IS 'Academic track (Science, Medicine, Literature, Business)';
```

### Step 2: Verify the Changes

After running the migration, verify that the columns were added:

```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;
```

You should see the new columns:
- `establishment_name` (TEXT, nullable)
- `level` (TEXT, nullable)
- `gender` (TEXT, nullable)
- `role` (TEXT, nullable)
- `student_type` (TEXT, nullable)
- `track` (TEXT, nullable)

### Step 3: Test the Application

1. Start your frontend application
2. **Signup Flow**: Navigate to the signup page and create a new account with role-based fields
3. **Profile Management**: Navigate to the Profile page and click "Edit" to modify your profile
4. You should now see role-based conditional fields:
   - **Role**: Student or Specialist selection
   - **For Students**: Student type (High School/University) with conditional fields
   - **For Specialists**: Academic level (3rd Year, 4th Year, Graduate) - no redundant fields
   - **Educational Institution**: For entering your school/university name
   - **Gender**: Dropdown with Male/Female options

### Features Added

- ✅ New database columns: `establishment_name`, `level`, `gender`, `role`, `student_type`, `track`
- ✅ Role-based conditional form fields during signup and profile editing
- ✅ Student type selection with appropriate level/track options
- ✅ Specialist role with university-level options
- ✅ Updated user interface with conditional form fields
- ✅ Form validation for all new fields
- ✅ Profile display shows role-based information
- ✅ Data persistence through Supabase
- ✅ Hidden UserID from profile display

### Role-Based Logic

**For Students:**
- High School Students: Level options (1st Year, 2nd Year, 3rd Year)
- University Students: Track options (Science, Medicine, Literature, Business)

**For Specialists:**
- Level options: 3rd Year, 4th Year, Graduate
- University field only

### Notes

- All fields are optional (nullable in database)
- The fields use appropriate icons for visual consistency
- Gender field uses a dropdown with Male/Female options
- Role selection determines which additional fields are shown
- Form validation allows empty values for optional fields
- The data is stored in the `profiles` table and synced with the user's authentication profile
- Users can fill these fields during signup or update them later in their profile
