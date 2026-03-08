-- Query to update the Supabase 'queues' table for Booking features
-- Run this in your Supabase SQL Editor

ALTER TABLE public.queues 
ADD COLUMN IF NOT EXISTS service_type text DEFAULT 'Premium',
ADD COLUMN IF NOT EXISTS booking_date date,
ADD COLUMN IF NOT EXISTS booking_time text;

-- Optional: Add a check constraint for booking_time to only allow 'Siang' or 'Malam'
-- ALTER TABLE public.queues ADD CONSTRAINT valid_booking_time CHECK (booking_time IN ('Siang', 'Malam', null));
