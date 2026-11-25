-- Borneo Wild Capture admin + booking schema
-- Run this entire file in Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.bookings (
 id uuid primary key default gen_random_uuid(),
 created_at timestamptz not null default now(),
 name text not null,
 email text not null,
 phone text,
 trip text not null,
 travel_date date,
 guests integer not null default 1 check (guests between 1 and 30),
 travel_style text,
 message text,
 status text not null default 'new' check (status in ('new','contacted','confirmed','cancelled'))
);
create table if not exists public.packages (
 id uuid primary key default gen_random_uuid(),
 created_at timestamptz not null default now(),
 name text not null,
 duration text not null,
 price_note text,
 description text not null,
 is_active boolean not null default true
);
create table if not exists public.faqs (
 id uuid primary key default gen_random_uuid(),
 created_at timestamptz not null default now(),
 question text not null,
 answer text not null,
 sort_order integer not null default 0,
 is_published boolean not null default true
);

alter table public.bookings enable row level security;
alter table public.packages enable row level security;
alter table public.faqs enable row level security;

-- Public visitors can submit booking enquiries; only the designated admin can read/update them.
drop policy if exists "Public can submit booking enquiries" on public.bookings;
create policy "Public can submit booking enquiries" on public.bookings for insert to anon, authenticated with check (status = 'new');
drop policy if exists "Admins can read bookings" on public.bookings;
create policy "Admins can read bookings" on public.bookings for select to authenticated
using (lower(coalesce(auth.jwt() ->> 'email', '')) = 'adie.malayan@gmail.com');
drop policy if exists "Admins can update bookings" on public.bookings;
create policy "Admins can update bookings" on public.bookings for update to authenticated
using (lower(coalesce(auth.jwt() ->> 'email', '')) = 'adie.malayan@gmail.com')
with check (lower(coalesce(auth.jwt() ->> 'email', '')) = 'adie.malayan@gmail.com');
drop policy if exists "Admins can delete bookings" on public.bookings;
create policy "Admins can delete bookings" on public.bookings for delete to authenticated
using (lower(coalesce(auth.jwt() ->> 'email', '')) = 'adie.malayan@gmail.com');

-- Public can read only active packages and published FAQs. Only the designated admin can manage content.
drop policy if exists "Public can read active packages" on public.packages;
create policy "Public can read active packages" on public.packages for select to anon using (is_active = true);
drop policy if exists "Admins can manage packages" on public.packages;
create policy "Admins can manage packages" on public.packages for all to authenticated
using (lower(coalesce(auth.jwt() ->> 'email', '')) = 'adie.malayan@gmail.com')
with check (lower(coalesce(auth.jwt() ->> 'email', '')) = 'adie.malayan@gmail.com');
drop policy if exists "Public can read published FAQs" on public.faqs;
create policy "Public can read published FAQs" on public.faqs for select to anon using (is_published = true);
drop policy if exists "Admins can manage FAQs" on public.faqs;
create policy "Admins can manage FAQs" on public.faqs for all to authenticated
using (lower(coalesce(auth.jwt() ->> 'email', '')) = 'adie.malayan@gmail.com')
with check (lower(coalesce(auth.jwt() ->> 'email', '')) = 'adie.malayan@gmail.com');

-- IMPORTANT: In Supabase Auth settings, disable public sign-ups.
-- Create the admin account yourself in Authentication > Users > Add user.
-- Only trusted admin accounts should be allowed to sign in.

-- Explicit SQL privileges are required in addition to RLS policies.
grant usage on schema public to anon, authenticated;
grant insert on table public.bookings to anon, authenticated;
grant select, update, delete on table public.bookings to authenticated;
grant select on table public.packages, public.faqs to anon, authenticated;
grant insert, update, delete on table public.packages, public.faqs to authenticated;
