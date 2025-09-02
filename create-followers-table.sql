-- Create followers table to enable artist following functionality
-- This table will track which users follow which artists

CREATE TABLE followers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(follower_id, following_id)
);

-- Create indexes for better performance
CREATE INDEX idx_followers_follower_id ON followers(follower_id);
CREATE INDEX idx_followers_following_id ON followers(following_id);
CREATE INDEX idx_followers_created_at ON followers(created_at DESC);

-- Enable Row Level Security
ALTER TABLE followers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can view all follower relationships (public read)
CREATE POLICY "Public can view all follower relationships" 
ON followers FOR SELECT TO public USING (true);

-- Authenticated users can insert their own follow relationships
CREATE POLICY "Users can create their own follows" 
ON followers FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = follower_id);

-- Users can delete their own follow relationships
CREATE POLICY "Users can delete their own follows" 
ON followers FOR DELETE TO authenticated 
USING (auth.uid() = follower_id);

-- Insert some sample data for testing (optional)
-- Note: Replace the UUIDs below with actual user IDs from your database
-- INSERT INTO followers (follower_id, following_id) VALUES 
-- ('sample-user-id-1', 'sample-artist-id-1'),
-- ('sample-user-id-2', 'sample-artist-id-1');