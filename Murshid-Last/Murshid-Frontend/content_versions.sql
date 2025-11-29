-- Content Versions table for edit history tracking
-- Run this script in Supabase SQL editor

BEGIN;

-- Content versions table to store edit history
CREATE TABLE IF NOT EXISTS content_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type TEXT NOT NULL CHECK (content_type IN ('post', 'answer')),
    content_id UUID NOT NULL,
    version_number INTEGER NOT NULL,
    previous_data JSONB NOT NULL,      -- Snapshot of content before edit
    diff JSONB,                         -- jsondiffpatch delta (computed client-side)
    edited_by UUID REFERENCES auth.users(id),
    editor_name TEXT,                   -- Denormalized for display
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure unique version numbers per content
    UNIQUE(content_type, content_id, version_number)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_content_versions_content 
    ON content_versions(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_content_versions_created 
    ON content_versions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_versions_editor 
    ON content_versions(edited_by);

-- Enable RLS
ALTER TABLE content_versions ENABLE ROW LEVEL SECURITY;

-- Everyone can view version history
CREATE POLICY "Content versions are viewable by everyone"
    ON content_versions FOR SELECT
    USING (true);

-- Only the content author or admins can create version records
-- (This is enforced at the application level during updates)
CREATE POLICY "Authenticated users can create version records"
    ON content_versions FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- No one can update or delete version records (immutable history)
-- Admins might need delete for GDPR compliance - add if needed

COMMIT;

