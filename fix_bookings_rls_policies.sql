-- Fix RLS policies for bookings table
-- Run this in Supabase Dashboard SQL Editor

-- First, drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Clients can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Artists can create appointments" ON public.bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON public.bookings;

-- Create new policies that allow both client and artist operations

-- 1. Users can view bookings where they are either client or artist
CREATE POLICY "Users can view their own bookings" 
ON public.bookings FOR SELECT 
USING (auth.uid() = client_id OR auth.uid() = artist_id);

-- 2. Allow inserting bookings (both client requests and artist direct appointments)
CREATE POLICY "Allow booking creation" 
ON public.bookings FOR INSERT 
WITH CHECK (auth.uid() = client_id OR auth.uid() = artist_id);

-- 3. Allow updating bookings for involved parties
CREATE POLICY "Allow booking updates" 
ON public.bookings FOR UPDATE 
USING (auth.uid() = client_id OR auth.uid() = artist_id);

-- 4. Allow deleting bookings for involved parties  
CREATE POLICY "Allow booking deletion" 
ON public.bookings FOR DELETE 
USING (auth.uid() = client_id OR auth.uid() = artist_id);

-- Verify RLS is enabled
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;