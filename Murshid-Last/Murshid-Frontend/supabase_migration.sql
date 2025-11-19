-- Add establishment_name, level, gender, role, student_type, and track columns to profiles table
-- Run this in your Supabase SQL editor

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

-- Optional: Add constraints if needed
-- ALTER TABLE profiles ADD CONSTRAINT check_role CHECK (role IN ('Student', 'Specialist'));
-- ALTER TABLE profiles ADD CONSTRAINT check_student_type CHECK (student_type IN ('High School', 'University'));
-- ALTER TABLE profiles ADD CONSTRAINT check_track CHECK (track IN ('Science', 'Medicine', 'Literature', 'Business'));
-- ALTER TABLE profiles ADD CONSTRAINT check_gender CHECK (gender IN ('Male', 'Female'));
