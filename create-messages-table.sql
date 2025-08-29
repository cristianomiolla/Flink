-- Migration: Create messages table for chat functionality
-- Created: 2025-01-26

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_read BOOLEAN NOT NULL DEFAULT false,
    deleted_at TIMESTAMPTZ NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(receiver_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_messages_active ON messages(deleted_at) WHERE deleted_at IS NULL;

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can read messages where they are sender or receiver
CREATE POLICY "Users can read own messages" ON messages 
    FOR SELECT 
    USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Users can insert messages where they are the sender
CREATE POLICY "Users can send messages" ON messages 
    FOR INSERT 
    WITH CHECK (auth.uid() = sender_id);

-- Users can update messages where they are sender or receiver (for marking as read)
CREATE POLICY "Users can update own messages" ON messages 
    FOR UPDATE 
    USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Users can soft delete (update deleted_at) their own messages
CREATE POLICY "Users can delete own messages" ON messages 
    FOR UPDATE 
    USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Create foreign key constraints with profiles table for better joins
-- Note: We use auth.users as the primary reference since that's what Supabase auth uses
-- The profiles table should reference auth.users(id) as well

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_messages_updated_at();

-- Insert some test data (optional - remove in production)
-- Uncomment the lines below to add test messages
/*
INSERT INTO messages (sender_id, receiver_id, content) VALUES 
    ((SELECT id FROM auth.users LIMIT 1 OFFSET 0), (SELECT id FROM auth.users LIMIT 1 OFFSET 1), 'Ciao! Mi piace il tuo lavoro.'),
    ((SELECT id FROM auth.users LIMIT 1 OFFSET 1), (SELECT id FROM auth.users LIMIT 1 OFFSET 0), 'Grazie! Quando possiamo iniziare il progetto?');
*/