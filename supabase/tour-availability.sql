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
  if tg_op = 'INSERT' and new.departure_id is not null and new.status <> 'cancelled' then
    update public.tour_departures
      set booked_guests = booked_guests + new.guests
      where id = new.departure_id;
    return new;
  elsif tg_op = 'DELETE' and old.departure_id is not null and old.status <> 'cancelled' then
    update public.tour_departures
      set booked_guests = greatest(0, booked_guests - old.guests)
      where id = old.departure_id;
    return old;
  elsif tg_op = 'UPDATE' and new.departure_id is not null and old.departure_id = new.departure_id then
    if old.status <> 'cancelled' and new.status = 'cancelled' then
      update public.tour_departures
        set booked_guests = greatest(0, booked_guests - old.guests)
        where id = old.departure_id;
    elsif old.status = 'cancelled' and new.status <> 'cancelled' then
      update public.tour_departures
        set booked_guests = booked_guests + new.guests
        where id = new.departure_id;
    end if;
    return new;
  end if;
  return coalesce(new, old);
end;
$$;

create or replace function public.validate_reopen_tour_departure()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  d public.tour_departures%rowtype;
begin
  if old.status = 'cancelled' and new.status <> 'cancelled' and new.departure_id is not null then
    select * into d from public.tour_departures where id = new.departure_id for update;
    if not found or not d.is_open or d.booked_guests + new.guests > d.capacity then
      raise exception 'This departure does not have enough seats to restore this booking.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists bookings_validate_reopen_tour_departure on public.bookings;
create trigger bookings_validate_reopen_tour_departure
before update of status on public.bookings
for each row execute function public.validate_reopen_tour_departure();

drop trigger if exists bookings_adjust_tour_departure_capacity on public.bookings;
create trigger bookings_adjust_tour_departure_capacity
after insert or update of status or delete on public.bookings
for each row execute function public.adjust_tour_departure_capacity();

-- Existing bookings without departure_id remain unchanged. New public bookings
-- are linked to a published fixed departure by the website form.


-- DATE-RANGE BOOKING EXTENSION
-- Run this file again in Supabase SQL Editor to add exclusive date ranges.

alter table public.bookings
  add column if not exists start_date date,
  add column if not exists end_date date;

alter table public.bookings drop constraint if exists bookings_valid_date_range;
alter table public.bookings add constraint bookings_valid_date_range
  check ((start_date is null and end_date is null) or
         (start_date is not null and end_date is not null and end_date >= start_date));

create or replace function public.get_unavailable_tour_date_ranges()
returns table(start_date date, end_date date)
language sql stable security definer set search_path = public
as $$
  select b.start_date, b.end_date
  from public.bookings b
  where b.start_date is not null and b.end_date is not null
    and b.status <> 'cancelled' and b.end_date >= current_date
  order by b.start_date;
$$;
grant execute on function public.get_unavailable_tour_date_ranges() to anon, authenticated;

create or replace function public.validate_tour_booking_date_range()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if new.start_date is null or new.end_date is null or new.end_date < new.start_date then
    raise exception 'Please select a valid start and end date.';
  end if;
  if new.start_date < current_date or new.end_date > current_date + 29 then
    raise exception 'Please choose dates within the next 30 days.';
  end if;
  perform pg_advisory_xact_lock(hashtext('borneo-wild-capture-date-range-booking'));
  if exists (
    select 1 from public.bookings b
    where b.id is distinct from new.id
      and b.start_date is not null and b.end_date is not null
      and b.status <> 'cancelled'
      and daterange(b.start_date,b.end_date,'[]') && daterange(new.start_date,new.end_date,'[]')
  ) then
    raise exception 'Those dates are already booked. Choose another range or ask for a custom date.';
  end if;
  new.travel_date := new.start_date;
  return new;
end;
$$;

drop trigger if exists bookings_validate_date_range on public.bookings;
create trigger bookings_validate_date_range
before insert or update of start_date, end_date, status on public.bookings
for each row when (new.start_date is not null or new.end_date is not null)
execute function public.validate_tour_booking_date_range();


-- Final safety refinements: include legacy fixed dates and allow cancellation cleanly.
create or replace function public.get_unavailable_tour_date_ranges()
returns table(start_date date, end_date date)
language sql stable security definer set search_path = public
as $$
  select coalesce(b.start_date,b.travel_date),
         coalesce(b.end_date,b.start_date,b.travel_date)
  from public.bookings b
  where coalesce(b.start_date,b.travel_date) is not null
    and b.status <> 'cancelled'
    and coalesce(b.end_date,b.start_date,b.travel_date) >= current_date
  order by coalesce(b.start_date,b.travel_date);
$$;

create or replace function public.validate_tour_booking_date_range()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if new.status = 'cancelled' then
    return new;
  end if;
  if new.start_date is null or new.end_date is null or new.end_date < new.start_date then
    raise exception 'Please select a valid start and end date.';
  end if;
  if new.start_date < current_date or new.end_date > current_date + 29 then
    raise exception 'Please choose dates within the next 30 days.';
  end if;
  perform pg_advisory_xact_lock(hashtext('borneo-wild-capture-date-range-booking'));
  if exists (
    select 1 from public.bookings b
    where b.id is distinct from new.id
      and coalesce(b.start_date,b.travel_date) is not null
      and b.status <> 'cancelled'
      and daterange(coalesce(b.start_date,b.travel_date),coalesce(b.end_date,b.start_date,b.travel_date),'[]')
          && daterange(new.start_date,new.end_date,'[]')
  ) then
    raise exception 'Those dates are already booked. Choose another range or ask for a custom date.';
  end if;
  new.travel_date := new.start_date;
  return new;
end;
$$;

create or replace function public.adjust_tour_departure_capacity()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.departure_id is not null and new.status <> 'cancelled' then
      update public.tour_departures set booked_guests = booked_guests + new.guests where id = new.departure_id;
    end if;
    return null;
  elsif tg_op = 'DELETE' then
    if old.departure_id is not null and old.status <> 'cancelled' then
      update public.tour_departures set booked_guests = greatest(0,booked_guests-old.guests) where id = old.departure_id;
    end if;
    return null;
  elsif tg_op = 'UPDATE' then
    if new.departure_id is not null and old.departure_id = new.departure_id then
      if old.status <> 'cancelled' and new.status = 'cancelled' then
        update public.tour_departures set booked_guests = greatest(0,booked_guests-old.guests) where id = old.departure_id;
      elsif old.status = 'cancelled' and new.status <> 'cancelled' then
        update public.tour_departures set booked_guests = booked_guests+new.guests where id = new.departure_id;
      end if;
    end if;
    return null;
  end if;
  return null;
end;
$$;
