-- Add policy to allow artists to create bookings/appointments
-- Run this in Supabase Dashboard SQL Editor

CREATE POLICY "Artists can create bookings as artist" 
ON public.bookings FOR INSERT 
WITH CHECK (auth.uid() = artist_id);