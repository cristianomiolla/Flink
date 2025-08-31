-- Create followers table for artist following functionality
CREATE TABLE followers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(follower_id, following_id)
);

-- Create indexes for performance
CREATE INDEX idx_followers_follower_id ON followers(follower_id);
CREATE INDEX idx_followers_following_id ON followers(following_id);
CREATE INDEX idx_followers_created_at ON followers(created_at DESC);

-- Enable RLS
ALTER TABLE followers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public can view all follows" ON followers FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated users can follow" ON followers FOR INSERT TO authenticated WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow themselves" ON followers FOR DELETE TO authenticated USING (auth.uid() = follower_id);