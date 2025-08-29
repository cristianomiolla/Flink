-- =====================================================
-- SKUNK TATTOO APP - PRIVATE MESSAGING SYSTEM
-- Complete SQL Migration Script for Supabase
-- =====================================================
-- This script creates a complete private messaging system
-- with security policies and performance optimizations
-- 
-- Execute this script in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. DROP EXISTING TABLE (IF EXISTS) AND CREATE MESSAGES TABLE
-- =====================================================
-- Drop existing table and recreate with updated structure
-- Uses UUID for security and includes soft delete capability

-- Drop existing table if it exists (including dependent objects)
DROP TABLE IF EXISTS messages CASCADE;

CREATE TABLE messages (
    -- Primary key with automatic UUID generation
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign keys to profiles table (sender and receiver)
    sender_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    
    -- Message content and metadata
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_read BOOLEAN DEFAULT false,
    
    -- Soft delete timestamp (null = not deleted)
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    
    -- Prevent users from sending messages to themselves
    CONSTRAINT messages_different_users CHECK (sender_id != receiver_id),
    
    -- Ensure content is not empty
    CONSTRAINT messages_content_not_empty CHECK (char_length(trim(content)) > 0)
);

-- =====================================================
-- 2. CREATE PERFORMANCE INDEXES
-- =====================================================
-- Optimized indexes for common query patterns

-- Index for finding messages by sender (outbox queries)
CREATE INDEX idx_messages_sender_id ON messages(sender_id, created_at DESC);

-- Index for finding messages by receiver (inbox queries)
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id, created_at DESC);

-- Composite index for conversation queries (between two users)
CREATE INDEX idx_messages_conversation ON messages(sender_id, receiver_id, created_at DESC);
CREATE INDEX idx_messages_conversation_reverse ON messages(receiver_id, sender_id, created_at DESC);

-- Index for soft delete queries (non-deleted messages only)
CREATE INDEX idx_messages_not_deleted ON messages(created_at DESC) WHERE deleted_at IS NULL;

-- Index for unread messages queries
CREATE INDEX idx_messages_unread ON messages(receiver_id, created_at DESC) WHERE is_read = false AND deleted_at IS NULL;

-- =====================================================
-- 3. ENABLE ROW LEVEL SECURITY (RLS)
-- =====================================================
-- Enable RLS to ensure users can only access their own messages

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. CREATE SECURITY POLICIES
-- =====================================================
-- RLS policies to control access to messages

-- SELECT Policy: Users can only read messages they sent or received (and not soft-deleted)
CREATE POLICY "Users can view their own messages" 
ON messages FOR SELECT TO authenticated 
USING (
    (sender_id = auth.uid() OR receiver_id = auth.uid()) 
    AND deleted_at IS NULL
);

-- INSERT Policy: Users can only send messages as themselves
CREATE POLICY "Users can send messages as themselves" 
ON messages FOR INSERT TO authenticated 
WITH CHECK (
    sender_id = auth.uid()
    AND sender_id != receiver_id  -- Prevent self-messaging
);

-- UPDATE Policy: Only receiver can mark messages as read, only sender/receiver can soft delete
CREATE POLICY "Users can update their own messages" 
ON messages FOR UPDATE TO authenticated 
USING (sender_id = auth.uid() OR receiver_id = auth.uid())
WITH CHECK (
    -- Allow receiver to mark as read
    (receiver_id = auth.uid() AND is_read = true) 
    OR 
    -- Allow sender/receiver to soft delete (set deleted_at)
    ((sender_id = auth.uid() OR receiver_id = auth.uid()) AND deleted_at IS NOT NULL)
);

-- DELETE Policy: Prevent hard deletes (use soft delete instead)
CREATE POLICY "Prevent hard deletes" 
ON messages FOR DELETE TO authenticated 
USING (false);

-- =====================================================
-- 5. CREATE USEFUL VIEWS (OPTIONAL)
-- =====================================================
-- Views to simplify common queries

-- View for active (non-deleted) messages with sender/receiver profile info
CREATE OR REPLACE VIEW active_messages AS
SELECT 
    m.id,
    m.sender_id,
    m.receiver_id,
    m.content,
    m.created_at,
    m.is_read,
    sender.full_name as sender_name,
    sender.username as sender_username,
    sender.avatar_url as sender_avatar,
    receiver.full_name as receiver_name,
    receiver.username as receiver_username,
    receiver.avatar_url as receiver_avatar
FROM messages m
JOIN profiles sender ON m.sender_id = sender.user_id
JOIN profiles receiver ON m.receiver_id = receiver.user_id
WHERE m.deleted_at IS NULL;

-- View for conversation threads (last message per conversation)
CREATE OR REPLACE VIEW conversation_threads AS
WITH latest_messages AS (
    SELECT DISTINCT ON (
        LEAST(sender_id, receiver_id), 
        GREATEST(sender_id, receiver_id)
    )
        id,
        sender_id,
        receiver_id,
        content,
        created_at,
        is_read,
        LEAST(sender_id, receiver_id) as user1_id,
        GREATEST(sender_id, receiver_id) as user2_id
    FROM messages
    WHERE deleted_at IS NULL
    ORDER BY 
        LEAST(sender_id, receiver_id), 
        GREATEST(sender_id, receiver_id),
        created_at DESC
)
SELECT 
    lm.*,
    sender.full_name as sender_name,
    sender.username as sender_username,
    sender.avatar_url as sender_avatar,
    receiver.full_name as receiver_name,
    receiver.username as receiver_username,
    receiver.avatar_url as receiver_avatar
FROM latest_messages lm
JOIN profiles sender ON lm.sender_id = sender.user_id
JOIN profiles receiver ON lm.receiver_id = receiver.user_id;

-- =====================================================
-- 6. CREATE UTILITY FUNCTIONS (OPTIONAL)
-- =====================================================
-- Function to get unread message count for a user

CREATE OR REPLACE FUNCTION get_unread_message_count(user_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    unread_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO unread_count
    FROM messages
    WHERE receiver_id = user_uuid
      AND is_read = false
      AND deleted_at IS NULL;
    
    RETURN COALESCE(unread_count, 0);
END;
$$;

-- Function to mark conversation as read (all messages from specific sender)
CREATE OR REPLACE FUNCTION mark_conversation_read(sender_uuid UUID, receiver_uuid UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only allow if the current user is the receiver
    IF auth.uid() != receiver_uuid THEN
        RAISE EXCEPTION 'Unauthorized: can only mark own messages as read';
    END IF;
    
    UPDATE messages
    SET is_read = true
    WHERE sender_id = sender_uuid
      AND receiver_id = receiver_uuid
      AND is_read = false
      AND deleted_at IS NULL;
END;
$$;

-- =====================================================
-- 7. GRANT PERMISSIONS
-- =====================================================
-- Ensure authenticated users can use the views and functions

GRANT SELECT ON active_messages TO authenticated;
GRANT SELECT ON conversation_threads TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_message_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_conversation_read(UUID, UUID) TO authenticated;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- The messaging system is now ready for use!
-- 
-- Key features implemented:
-- ✓ Secure UUID-based messages table
-- ✓ Foreign key constraints with CASCADE behavior
-- ✓ Performance indexes for common queries
-- ✓ Row Level Security (RLS) policies
-- ✓ Soft delete capability
-- ✓ Prevention of self-messaging
-- ✓ Helpful views for common operations
-- ✓ Utility functions for unread counts
-- 
-- Best practices followed:
-- ✓ UUID instead of serial for security
-- ✓ Prepared statement compatibility
-- ✓ Optimized indexing strategy
-- ✓ Soft delete implementation
-- ✓ Comprehensive security policies
-- =====================================================