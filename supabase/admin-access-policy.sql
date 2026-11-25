-- Restrict all admin database actions to the designated Borneo Wild Capture admin.
-- Run this in Supabase SQL Editor on the EXISTING project.
-- Public visitors retain INSERT-only access to bookings and read-only access to active packages/published FAQs.

drop policy if exists "Public can submit booking enquiries" on public.bookings;
create policy "Public can submit booking enquiries"
on public.bookings for insert to anon, authenticated
with check (true);

drop policy if exists "Admins can read bookings" on public.bookings;
create policy "Admins can read bookings"
on public.bookings for select to authenticated
using (lower(coalesce(auth.jwt() ->> 'email', '')) = 'adie.malayan@gmail.com');

drop policy if exists "Admins can update bookings" on public.bookings;
create policy "Admins can update bookings"
on public.bookings for update to authenticated
using (lower(coalesce(auth.jwt() ->> 'email', '')) = 'adie.malayan@gmail.com')
with check (lower(coalesce(auth.jwt() ->> 'email', '')) = 'adie.malayan@gmail.com');

drop policy if exists "Admins can delete bookings" on public.bookings;
create policy "Admins can delete bookings"
on public.bookings for delete to authenticated
using (lower(coalesce(auth.jwt() ->> 'email', '')) = 'adie.malayan@gmail.com');

drop policy if exists "Public can read active packages" on public.packages;
create policy "Public can read active packages"
on public.packages for select to anon
using (is_active = true);

drop policy if exists "Admins can manage packages" on public.packages;
create policy "Admins can manage packages"
on public.packages for all to authenticated
using (lower(coalesce(auth.jwt() ->> 'email', '')) = 'adie.malayan@gmail.com')
with check (lower(coalesce(auth.jwt() ->> 'email', '')) = 'adie.malayan@gmail.com');

drop policy if exists "Public can read published FAQs" on public.faqs;
create policy "Public can read published FAQs"
on public.faqs for select to anon
using (is_published = true);

drop policy if exists "Admins can manage FAQs" on public.faqs;
create policy "Admins can manage FAQs"
on public.faqs for all to authenticated
using (lower(coalesce(auth.jwt() ->> 'email', '')) = 'adie.malayan@gmail.com')
with check (lower(coalesce(auth.jwt() ->> 'email', '')) = 'adie.malayan@gmail.com');
