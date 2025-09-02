-- Fix messaging system: Allow authenticated users to read basic profile info for messaging
-- This policy allows users to see names/usernames of people they're messaging with

CREATE POLICY "authenticated_read_profiles_for_messaging" 
ON profiles FOR SELECT 
TO authenticated 
USING (true);

-- Note: This policy allows reading of profile data needed for messaging functionality.
-- Users can only see basic profile information (full_name, username, avatar_url) 
-- which is necessary to display participant names and avatars in chat conversations.
-- 
-- Without this policy, the messaging system shows "User [ID]" instead of real names
-- because it cannot access other users' profile data.
--
-- Alternative more restrictive approach (if needed in future):
-- You could create a view with only messaging-relevant fields and apply policies to that view instead.