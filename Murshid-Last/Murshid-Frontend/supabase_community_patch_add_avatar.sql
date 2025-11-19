-- Quick patch to add missing author_avatar columns if the initial community migration was run without them
-- Run this in the Supabase SQL editor

ALTER TABLE community_posts
ADD COLUMN IF NOT EXISTS author_avatar TEXT;

ALTER TABLE community_answers
ADD COLUMN IF NOT EXISTS author_avatar TEXT;
