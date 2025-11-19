-- =============================================
-- Supabase Storage Setup for Images
-- =============================================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('avatars', 'avatars', true),
  ('university-logos', 'university-logos', true),
  ('major-icons', 'major-icons', true)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- Storage Policies for Avatars
-- =============================================

-- Allow anyone to view avatars
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Allow authenticated users to upload their own avatar
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- =============================================
-- Storage Policies for University Logos
-- =============================================

-- Allow anyone to view university logos
CREATE POLICY "University logos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'university-logos');

-- Allow only admins to upload university logos
CREATE POLICY "Only admins can upload university logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'university-logos' 
  AND auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true)
);

-- Allow only admins to update university logos
CREATE POLICY "Only admins can update university logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'university-logos' 
  AND auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true)
);

-- Allow only admins to delete university logos
CREATE POLICY "Only admins can delete university logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'university-logos' 
  AND auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true)
);

-- =============================================
-- Storage Policies for Major Icons
-- =============================================

-- Allow anyone to view major icons
CREATE POLICY "Major icons are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'major-icons');

-- Allow only admins to upload major icons
CREATE POLICY "Only admins can upload major icons"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'major-icons' 
  AND auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true)
);

-- Allow only admins to update major icons
CREATE POLICY "Only admins can update major icons"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'major-icons' 
  AND auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true)
);

-- Allow only admins to delete major icons
CREATE POLICY "Only admins can delete major icons"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'major-icons' 
  AND auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true)
);

-- =============================================
-- Add avatar_url column to profiles table
-- =============================================

-- Add avatar_url column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN avatar_url TEXT;
  END IF;
END $$;

-- =============================================
-- Notes
-- =============================================

-- Bucket URLs will be in the format:
-- https://[project-ref].supabase.co/storage/v1/object/public/[bucket-name]/[file-path]

-- Examples:
-- Avatar: https://xxx.supabase.co/storage/v1/object/public/avatars/user-id/avatar.jpg
-- University: https://xxx.supabase.co/storage/v1/object/public/university-logos/university-id.png
-- Major: https://xxx.supabase.co/storage/v1/object/public/major-icons/major-id.png

