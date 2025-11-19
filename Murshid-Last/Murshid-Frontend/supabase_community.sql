-- Community tables for posts and answers
-- Run this script in Supabase SQL editor to provision the community feature

BEGIN;

-- Reusable updated_at helper
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Posts table
CREATE TABLE IF NOT EXISTS community_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    author_name TEXT,
    author_role TEXT CHECK (author_role IN ('student', 'specialist', 'admin')),
    author_avatar TEXT,
    author_university TEXT,
    author_major TEXT,
    author_academic_level TEXT,
    post_type TEXT NOT NULL CHECK (post_type IN ('question', 'discussion', 'announcement')),
    tags TEXT[] DEFAULT '{}',
    major_tags TEXT[] DEFAULT '{}',
    university_tags TEXT[] DEFAULT '{}',
    likes_count INTEGER DEFAULT 0,
    answers_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    is_solved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Answers table
CREATE TABLE IF NOT EXISTS community_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    author_name TEXT,
    author_role TEXT CHECK (author_role IN ('student', 'specialist', 'admin')),
    author_avatar TEXT,
    author_university TEXT,
    author_major TEXT,
    author_academic_level TEXT,
    likes_count INTEGER DEFAULT 0,
    is_accepted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_community_posts_type ON community_posts(post_type);
CREATE INDEX IF NOT EXISTS idx_community_posts_author ON community_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_community_answers_post ON community_answers(post_id);
CREATE INDEX IF NOT EXISTS idx_community_answers_author ON community_answers(author_id);

-- RLS
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_answers ENABLE ROW LEVEL SECURITY;

-- Read access for everyone
CREATE POLICY "Community posts are viewable by everyone"
    ON community_posts FOR SELECT
    USING (true);

CREATE POLICY "Community answers are viewable by everyone"
    ON community_answers FOR SELECT
    USING (true);

-- Authenticated users can create posts (front-end enforces role rules)
CREATE POLICY "Authenticated users can create posts"
    ON community_posts FOR INSERT
    WITH CHECK (auth.uid() = author_id);

-- Authors can update/delete their posts; admins can too
CREATE POLICY "Authors can update their posts"
    ON community_posts FOR UPDATE
    USING (
      auth.uid() = author_id
      OR auth.uid() IN (SELECT id FROM profiles WHERE is_admin = TRUE)
    )
    WITH CHECK (
      auth.uid() = author_id
      OR auth.uid() IN (SELECT id FROM profiles WHERE is_admin = TRUE)
    );

CREATE POLICY "Authors can delete their posts"
    ON community_posts FOR DELETE
    USING (
      auth.uid() = author_id
      OR auth.uid() IN (SELECT id FROM profiles WHERE is_admin = TRUE)
    );

-- Authenticated users can answer
CREATE POLICY "Authenticated users can create answers"
    ON community_answers FOR INSERT
    WITH CHECK (auth.uid() = author_id);

-- Authors/Admins can update/delete their answers
CREATE POLICY "Authors can update their answers"
    ON community_answers FOR UPDATE
    USING (
      auth.uid() = author_id
      OR auth.uid() IN (SELECT id FROM profiles WHERE is_admin = TRUE)
    )
    WITH CHECK (
      auth.uid() = author_id
      OR auth.uid() IN (SELECT id FROM profiles WHERE is_admin = TRUE)
    );

CREATE POLICY "Authors can delete their answers"
    ON community_answers FOR DELETE
    USING (
      auth.uid() = author_id
      OR auth.uid() IN (SELECT id FROM profiles WHERE is_admin = TRUE)
    );

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_community_posts_updated_at ON community_posts;
CREATE TRIGGER update_community_posts_updated_at
    BEFORE UPDATE ON community_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_community_answers_updated_at ON community_answers;
CREATE TRIGGER update_community_answers_updated_at
    BEFORE UPDATE ON community_answers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Keep answers_count in sync
CREATE OR REPLACE FUNCTION increment_post_answers_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE community_posts
    SET answers_count = answers_count + 1,
        updated_at = NOW()
    WHERE id = NEW.post_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION decrement_post_answers_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE community_posts
    SET answers_count = GREATEST(answers_count - 1, 0),
        updated_at = NOW()
    WHERE id = OLD.post_id;
    RETURN OLD;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS community_answers_after_insert ON community_answers;
CREATE TRIGGER community_answers_after_insert
    AFTER INSERT ON community_answers
    FOR EACH ROW
    EXECUTE FUNCTION increment_post_answers_count();

DROP TRIGGER IF EXISTS community_answers_after_delete ON community_answers;
CREATE TRIGGER community_answers_after_delete
    AFTER DELETE ON community_answers
    FOR EACH ROW
    EXECUTE FUNCTION decrement_post_answers_count();

COMMIT;
