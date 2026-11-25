-- Fixed-departure availability calendar for Borneo Wild Capture.
-- Run this migration in Supabase SQL Editor AFTER the existing schema and admin-access-policy.sql.

create table if not exists public.tour_departures (
  id uuid primary key default gen_random_uuid(),
  departure_date date not null unique,
  capacity integer not null check (capacity between 1 and 100),
  booked_guests integer not null default 0 check (booked_guests >= 0),
  is_open boolean not null default true,
  note text,
  created_at timestamptz not null default now(),
  constraint tour_departures_booked_within_capacity check (booked_guests <= capacity)
);

alter table public.bookings
  add column if not exists departure_id uuid references public.tour_departures(id) on delete restrict;

alter table public.tour_departures enable row level security;

drop policy if exists "Public can read open tour departures" on public.tour_departures;
create policy "Public can read open tour departures"
on public.tour_departures for select to anon
using (is_open = true);

drop policy if exists "Admins can manage tour departures" on public.tour_departures;
create policy "Admins can manage tour departures"
on public.tour_departures for all to authenticated
using (lower(coalesce(auth.jwt() ->> 'email', '')) = 'adie.malayan@gmail.com')
with check (lower(coalesce(auth.jwt() ->> 'email', '')) = 'adie.malayan@gmail.com');

grant select on public.tour_departures to anon, authenticated;
grant insert, update, delete on public.tour_departures to authenticated;

-- Keep the shared departure capacity accurate and prevent overbooking.
create or replace function public.reserve_tour_departure()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  d public.tour_departures%rowtype;
begin
  if new.departure_id is null then
    return new;
  end if;

  select * into d
  from public.tour_departures
  where id = new.departure_id
  for update;

  if not found or not d.is_open then
    raise exception 'This tour departure is no longer available.';
  end if;

  if d.departure_date < current_date then
    raise exception 'This tour departure date has passed.';
  end if;

  if d.booked_guests + new.guests > d.capacity then
    raise exception 'Not enough seats remain for this departure.';
  end if;

  new.travel_date := d.departure_date;
  return new;
end;
$$;

create or replace function public.adjust_tour_departure_capacity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' and new.departure_id is not null then
    update public.tour_departures
      set booked_guests = booked_guests + new.guests
      where id = new.departure_id;
    return new;
  elsif tg_op = 'DELETE' and old.departure_id is not null then
    update public.tour_departures
      set booked_guests = greatest(0, booked_guests - old.guests)
      where id = old.departure_id;
    return old;
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists bookings_reserve_tour_departure on public.bookings;
create trigger bookings_reserve_tour_departure
before insert on public.bookings
for each row execute function public.reserve_tour_departure();

drop trigger if exists bookings_adjust_tour_departure_capacity on public.bookings;
create trigger bookings_adjust_tour_departure_capacity
after insert or delete on public.bookings
for each row execute function public.adjust_tour_departure_capacity();

-- Existing bookings without departure_id remain unchanged. New public bookings
-- are linked to a published fixed departure by the website form.
