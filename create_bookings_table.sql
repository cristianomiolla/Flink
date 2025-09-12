-- Migration: Create bookings table for appointment management
-- Run this in Supabase Dashboard SQL Editor

-- Create bookings table
create table public.bookings (
  id uuid not null default gen_random_uuid (),
  client_id uuid not null,
  artist_id uuid not null,
  subject text not null,
  tattoo_style text null,
  body_area text null,
  size_category text null,
  color_preferences text null,
  reference_images text[] null,
  meaning text null,
  budget_min numeric(8, 2) null,
  budget_max numeric(8, 2) null,
  appointment_date timestamp with time zone null,
  appointment_duration integer null,
  deposit_amount numeric(8, 2) null,
  artist_notes text null,
  status text not null default 'pending'::text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  expires_at timestamp with time zone null default (now() + '15 days'::interval),
  constraint bookings_pkey primary key (id),
  constraint bookings_artist_id_fkey foreign key (artist_id) references auth.users (id) on delete cascade,
  constraint bookings_client_id_fkey foreign key (client_id) references auth.users (id) on delete cascade,
  constraint bookings_status_check check (
    (
      status = any (
        array[
          'pending'::text,
          'expired'::text,
          'rejected'::text,
          'scheduled'::text,
          'rescheduled'::text,
          'cancelled'::text,
          'completed'::text
        ]
      )
    )
  )
);

-- Create indexes for performance
create index if not exists idx_bookings_client_id on public.bookings using btree (client_id);
create index if not exists idx_bookings_artist_id on public.bookings using btree (artist_id);
create index if not exists idx_bookings_status on public.bookings using btree (status);
create index if not exists idx_bookings_expires_at on public.bookings using btree (expires_at);

-- Enable RLS
alter table public.bookings enable row level security;

-- RLS Policies
-- Users can view their own bookings (as client or artist)
create policy "Users can view their own bookings" 
on public.bookings for select 
using (auth.uid() = client_id or auth.uid() = artist_id);

-- Clients can create booking requests
create policy "Clients can create bookings" 
on public.bookings for insert 
with check (auth.uid() = client_id);

-- Artists can create appointments
create policy "Artists can create appointments" 
on public.bookings for insert 
with check (auth.uid() = artist_id);

-- Users can update their own bookings (artists for status/details, clients for cancellation)
create policy "Users can update their own bookings" 
on public.bookings for update 
using (auth.uid() = client_id or auth.uid() = artist_id);

-- Trigger to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger update_bookings_updated_at 
before update on public.bookings 
for each row execute function update_updated_at_column();