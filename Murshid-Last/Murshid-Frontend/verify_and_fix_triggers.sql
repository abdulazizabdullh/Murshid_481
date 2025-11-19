-- Verification and Fix Script for Community Triggers
-- This ensures all triggers are properly set up

-- ============================================================================
-- 1. ANSWER COUNT TRIGGERS (for community_posts.answers_count)
-- ============================================================================

-- Function to increment answers_count when answer is created
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

-- Function to decrement answers_count when answer is deleted
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

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS community_answers_after_insert ON community_answers;
DROP TRIGGER IF EXISTS community_answers_after_delete ON community_answers;

-- Create triggers
CREATE TRIGGER community_answers_after_insert
    AFTER INSERT ON community_answers
    FOR EACH ROW
    EXECUTE FUNCTION increment_post_answers_count();

CREATE TRIGGER community_answers_after_delete
    AFTER DELETE ON community_answers
    FOR EACH ROW
    EXECUTE FUNCTION decrement_post_answers_count();

-- ============================================================================
-- 2. FIX EXISTING POSTS WITH INCORRECT COUNTS
-- ============================================================================

-- Recalculate answers_count for all posts to fix any inconsistencies
UPDATE community_posts
SET answers_count = (
    SELECT COUNT(*)
    FROM community_answers
    WHERE community_answers.post_id = community_posts.id
);

-- Recalculate likes_count for all posts to fix any inconsistencies
UPDATE community_posts
SET likes_count = (
    SELECT COUNT(*)
    FROM community_post_likes
    WHERE community_post_likes.post_id = community_posts.id
);

-- Recalculate likes_count for all answers to fix any inconsistencies
UPDATE community_answers
SET likes_count = (
    SELECT COUNT(*)
    FROM community_answer_likes
    WHERE community_answer_likes.answer_id = community_answers.id
);

-- Recalculate likes_count for all comments to fix any inconsistencies
UPDATE community_comments
SET likes_count = (
    SELECT COUNT(*)
    FROM community_comment_likes
    WHERE community_comment_likes.comment_id = community_comments.id
);

-- ============================================================================
-- 3. VERIFICATION QUERIES
-- ============================================================================

-- Verify triggers are created (run these separately to check)
-- SELECT trigger_name, event_manipulation, event_object_table
-- FROM information_schema.triggers
-- WHERE event_object_table IN ('community_answers', 'community_post_likes', 'community_answer_likes', 'community_comment_likes');

-- Verify counts are correct
-- SELECT id, title, answers_count,
--        (SELECT COUNT(*) FROM community_answers WHERE post_id = community_posts.id) as actual_count
-- FROM community_posts
-- WHERE answers_count != (SELECT COUNT(*) FROM community_answers WHERE post_id = community_posts.id);
