-- Real-time Messaging System Database Schema
-- Run this script in Supabase SQL editor

BEGIN;

-- ============================================================================
-- CONVERSATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for sorting by most recent activity
CREATE INDEX IF NOT EXISTS idx_conversations_updated 
    ON conversations(updated_at DESC);

-- ============================================================================
-- CONVERSATION PARTICIPANTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS conversation_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    last_read_at TIMESTAMPTZ DEFAULT NOW(),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure a user can only be in a conversation once
    UNIQUE(conversation_id, user_id)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user 
    ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation 
    ON conversation_participants(conversation_id);

-- ============================================================================
-- MESSAGES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_read BOOLEAN DEFAULT FALSE,
    
    -- Ensure content is not empty
    CONSTRAINT messages_content_not_empty CHECK (length(trim(content)) > 0)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_messages_conversation 
    ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender 
    ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created 
    ON messages(created_at DESC);

-- ============================================================================
-- TRIGGER: Auto-update conversation's updated_at on new message
-- ============================================================================
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations 
    SET updated_at = NOW() 
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_conversation_timestamp ON messages;
CREATE TRIGGER trigger_update_conversation_timestamp
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_timestamp();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- CONVERSATIONS POLICIES
-- Users can only see conversations they are part of
CREATE POLICY "Users can view their conversations"
    ON conversations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM conversation_participants 
            WHERE conversation_id = conversations.id 
            AND user_id = auth.uid()
        )
    );

-- Users can create conversations
CREATE POLICY "Authenticated users can create conversations"
    ON conversations FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update conversations they're part of
CREATE POLICY "Participants can update their conversations"
    ON conversations FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM conversation_participants 
            WHERE conversation_id = conversations.id 
            AND user_id = auth.uid()
        )
    );

-- CONVERSATION PARTICIPANTS POLICIES
-- Users can view participants of their conversations
CREATE POLICY "Users can view conversation participants"
    ON conversation_participants FOR SELECT
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM conversation_participants cp 
            WHERE cp.conversation_id = conversation_participants.conversation_id 
            AND cp.user_id = auth.uid()
        )
    );

-- Users can add themselves or be added to conversations
CREATE POLICY "Authenticated users can join conversations"
    ON conversation_participants FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update their own participant record (e.g., last_read_at)
CREATE POLICY "Users can update their participation"
    ON conversation_participants FOR UPDATE
    USING (user_id = auth.uid());

-- MESSAGES POLICIES
-- Users can view messages in their conversations
CREATE POLICY "Users can view messages in their conversations"
    ON messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM conversation_participants 
            WHERE conversation_id = messages.conversation_id 
            AND user_id = auth.uid()
        )
    );

-- Users can send messages to conversations they're part of
CREATE POLICY "Participants can send messages"
    ON messages FOR INSERT
    WITH CHECK (
        sender_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM conversation_participants 
            WHERE conversation_id = messages.conversation_id 
            AND user_id = auth.uid()
        )
    );

-- Users can update their own messages (mark as read, etc.)
CREATE POLICY "Users can update messages in their conversations"
    ON messages FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM conversation_participants 
            WHERE conversation_id = messages.conversation_id 
            AND user_id = auth.uid()
        )
    );

-- ============================================================================
-- ENABLE REALTIME
-- ============================================================================
-- Enable realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

COMMIT;

