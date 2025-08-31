-- Enable DELETE policy for portfolio_items table
-- Users can only delete their own portfolio items
-- Following the same pattern as existing UPDATE policy

CREATE POLICY "artists_delete_own_portfolio" 
ON portfolio_items FOR DELETE 
TO authenticated 
USING (user_id = auth.uid());