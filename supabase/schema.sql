-- =====================================================================
-- KARONGA SPIKERS: SUPABASE SCHEMA
-- ---------------------------------------------------------------------
-- Paste the whole file into Supabase Dashboard -> SQL Editor -> Run.
-- It is safe to run again: every statement checks what already exists.
--
-- Roles are stored in public.profiles and read with public.app_role():
--   admin      everything (posts, photos, sponsors)
--   secretary  creates, edits, publishes and deletes posts and photos
--   treasurer  views everything in the admin area, changes nothing
-- (It is not called current_role() because CURRENT_ROLE is a reserved
-- word in Postgres.)
--
-- Give someone a role after they have an account (Authentication -> Users):
--   insert into public.profiles (id, full_name, role)
--   values ('<user id>', 'Secretary name', 'secretary');
-- =====================================================================


-- =====================================================================
-- SECTION 1: ADMIN FOUNDATION (profiles, roles, sponsors, updates)
-- =====================================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

do $$
begin
  alter table public.profiles drop constraint if exists profiles_role_check;
  alter table public.profiles add constraint profiles_role_check
    check (role in ('admin', 'secretary', 'treasurer'));
end $$;

-- The signed-in user's role, or null. security definer so policies can read
-- profiles without granting everyone access to the table.
create or replace function public.app_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = auth.uid()
$$;

revoke execute on function public.app_role() from public;
grant execute on function public.app_role() to anon, authenticated;

-- True for the roles that may create, edit, publish and delete posts and photos.
create or replace function public.can_edit_posts()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(public.app_role() in ('admin', 'secretary'), false)
$$;

grant execute on function public.can_edit_posts() to anon, authenticated;

drop policy if exists "profiles: read own" on public.profiles;
create policy "profiles: read own" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));
-- No insert/update policies: roles are only assigned from the dashboard.


-- Sponsors that posts can thank. Add rows in Table Editor -> sponsors.
create table if not exists public.sponsors (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  tier text not null default 'bronze' check (tier in ('gold', 'silver', 'bronze')),
  confirmed boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.sponsors enable row level security;

drop policy if exists "sponsors: read" on public.sponsors;
create policy "sponsors: read" on public.sponsors
  for select to anon, authenticated
  using (confirmed or public.app_role() in ('admin', 'secretary', 'treasurer'));


create table if not exists public.updates (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 120),
  body text not null default '' check (char_length(body) <= 2000),
  published boolean not null default false,
  published_at timestamptz,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.updates enable row level security;

drop policy if exists "updates: read" on public.updates;
create policy "updates: read" on public.updates
  for select to anon, authenticated
  using (published or public.app_role() in ('admin', 'secretary', 'treasurer'));

drop policy if exists "updates: editor insert" on public.updates;
create policy "updates: editor insert" on public.updates
  for insert to authenticated
  with check (public.can_edit_posts());

drop policy if exists "updates: editor update" on public.updates;
create policy "updates: editor update" on public.updates
  for update to authenticated
  using (public.can_edit_posts())
  with check (public.can_edit_posts());

drop policy if exists "updates: editor delete" on public.updates;
create policy "updates: editor delete" on public.updates
  for delete to authenticated
  using (public.can_edit_posts());

drop policy if exists "sponsors: admin write" on public.sponsors;
create policy "sponsors: admin write" on public.sponsors
  for all to authenticated
  using (public.app_role() = 'admin')
  with check (public.app_role() = 'admin');

grant select on public.profiles to authenticated;
grant select on public.sponsors, public.updates to anon, authenticated;
grant insert, update, delete on public.sponsors to authenticated;
grant insert, update, delete on public.updates to authenticated;


-- =====================================================================
-- SECTION 2: PHOTO NEWS UPDATES
-- Slugs, categories, photos, sponsor thank-yous and the photo bucket.
-- =====================================================================

-- 2.1 Extend updates -------------------------------------------------

alter table public.updates
  add column if not exists slug text,
  add column if not exists category text not null default 'general',
  add column if not exists cover_photo_id uuid,
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'updates_category_check') then
    alter table public.updates add constraint updates_category_check
      check (category in ('training', 'fundraising', 'sponsors', 'travel', 'match_day', 'general'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'updates_slug_key') then
    alter table public.updates add constraint updates_slug_key unique (slug);
  end if;
end $$;

-- "Training at Karonga Stadium!" -> "training-at-karonga-stadium"
create or replace function public.slugify(value text)
returns text
language sql
immutable
set search_path = ''
as $$
  select coalesce(
    nullif(trim(both '-' from left(regexp_replace(lower(value), '[^a-z0-9]+', '-', 'g'), 60)), ''),
    'update'
  )
$$;

-- Sets the slug once (title + first 6 characters of the id) and never changes
-- it, so links already shared on WhatsApp keep working after a title edit.
create or replace function public.updates_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    new.id := old.id;
    new.created_by := old.created_by;
    new.created_at := old.created_at;
    new.slug := old.slug;
  end if;

  if new.slug is null then
    new.slug := public.slugify(new.title) || '-' || left(replace(new.id::text, '-', ''), 6);
  end if;

  if new.published and new.published_at is null then
    new.published_at := now();
  end if;

  if new.cover_photo_id is not null and not exists (
    select 1 from public.update_photos p where p.id = new.cover_photo_id and p.update_id = new.id
  ) then
    raise exception 'The cover photo must belong to this post' using errcode = 'check_violation';
  end if;

  new.updated_at := now();
  return new;
end $$;

-- 2.2 Photos ---------------------------------------------------------

create table if not exists public.update_photos (
  id uuid primary key default gen_random_uuid(),
  update_id uuid not null,
  storage_path text not null unique,
  caption text check (caption is null or char_length(caption) <= 200),
  sort_order integer not null default 0,
  width integer not null check (width > 0),
  height integer not null check (height > 0),
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  -- Named explicitly: the API uses this name to tell the two links between the tables apart.
  constraint update_photos_update_id_fkey
    foreign key (update_id) references public.updates (id) on delete cascade,
  constraint update_photos_path_check
    check (storage_path like update_id::text || '/%')
);

create index if not exists update_photos_update_id_idx on public.update_photos (update_id, sort_order);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'updates_cover_photo_id_fkey') then
    alter table public.updates add constraint updates_cover_photo_id_fkey
      foreign key (cover_photo_id) references public.update_photos (id) on delete set null;
  end if;
end $$;

-- The trigger refers to update_photos, so it is attached after that table exists.
drop trigger if exists updates_before_write on public.updates;
create trigger updates_before_write
  before insert or update on public.updates
  for each row execute function public.updates_before_write();

-- Give slugs to any posts created before this section was run.
update public.updates set updated_at = updated_at where slug is null;
alter table public.updates alter column slug set not null;

create or replace function public.update_photos_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select count(*) from public.update_photos where update_id = new.update_id) >= 8 then
    raise exception 'A post can have at most 8 photos' using errcode = 'check_violation';
  end if;
  return new;
end $$;

drop trigger if exists update_photos_limit on public.update_photos;
create trigger update_photos_limit
  before insert on public.update_photos
  for each row execute function public.update_photos_limit();

-- 2.3 Sponsors thanked in a post -------------------------------------

create table if not exists public.update_sponsors (
  update_id uuid not null references public.updates (id) on delete cascade,
  sponsor_id uuid not null references public.sponsors (id) on delete cascade,
  primary key (update_id, sponsor_id)
);

-- 2.4 Row level security for photos and sponsor links ---------------

alter table public.update_photos enable row level security;
alter table public.update_sponsors enable row level security;

drop policy if exists "update_photos: read" on public.update_photos;
create policy "update_photos: read" on public.update_photos
  for select to anon, authenticated
  using (
    public.app_role() in ('admin', 'secretary', 'treasurer')
    or exists (select 1 from public.updates u where u.id = update_id and u.published)
  );

drop policy if exists "update_photos: editor insert" on public.update_photos;
create policy "update_photos: editor insert" on public.update_photos
  for insert to authenticated
  with check (public.can_edit_posts());

drop policy if exists "update_photos: editor update" on public.update_photos;
create policy "update_photos: editor update" on public.update_photos
  for update to authenticated
  using (public.can_edit_posts())
  with check (public.can_edit_posts());

drop policy if exists "update_photos: editor delete" on public.update_photos;
create policy "update_photos: editor delete" on public.update_photos
  for delete to authenticated
  using (public.can_edit_posts());

drop policy if exists "update_sponsors: read" on public.update_sponsors;
create policy "update_sponsors: read" on public.update_sponsors
  for select to anon, authenticated
  using (
    public.app_role() in ('admin', 'secretary', 'treasurer')
    or exists (select 1 from public.updates u where u.id = update_id and u.published)
  );

drop policy if exists "update_sponsors: editor insert" on public.update_sponsors;
create policy "update_sponsors: editor insert" on public.update_sponsors
  for insert to authenticated
  with check (public.can_edit_posts());

drop policy if exists "update_sponsors: editor delete" on public.update_sponsors;
create policy "update_sponsors: editor delete" on public.update_sponsors
  for delete to authenticated
  using (public.can_edit_posts());

grant select on public.update_photos, public.update_sponsors to anon, authenticated;
grant insert, update, delete on public.update_photos to authenticated;
grant insert, delete on public.update_sponsors to authenticated;

-- 2.5 Storage bucket: update-photos -----------------------------------
-- Public read (photos are served by URL). Only admin and secretary can write.
-- Files must be named {update_id}/{uuid}.jpg for an existing post.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('update-photos', 'update-photos', true, 3145728, array['image/jpeg'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Listing files (used when cleaning up a deleted post).
drop policy if exists "update-photos: staff list" on storage.objects;
create policy "update-photos: staff list" on storage.objects
  for select to authenticated
  using (bucket_id = 'update-photos' and public.app_role() in ('admin', 'secretary', 'treasurer'));

drop policy if exists "update-photos: editor insert" on storage.objects;
create policy "update-photos: editor insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'update-photos'
    and public.can_edit_posts()
    and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.jpg$'
    and exists (select 1 from public.updates u where u.id::text = split_part(name, '/', 1))
  );

drop policy if exists "update-photos: editor update" on storage.objects;
create policy "update-photos: editor update" on storage.objects
  for update to authenticated
  using (bucket_id = 'update-photos' and public.can_edit_posts())
  with check (
    bucket_id = 'update-photos'
    and public.can_edit_posts()
    and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.jpg$'
  );

drop policy if exists "update-photos: editor delete" on storage.objects;
create policy "update-photos: editor delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'update-photos' and public.can_edit_posts());


-- =====================================================================
-- SECTION 3: ADMIN ROLE CLEANUP
-- The write policies were renamed from "secretary ..." to "editor ..." when
-- the admin role was added. Remove the old names from databases set up earlier.
-- =====================================================================

drop policy if exists "updates: secretary insert" on public.updates;
drop policy if exists "updates: secretary update" on public.updates;
drop policy if exists "updates: secretary delete" on public.updates;
drop policy if exists "update_photos: secretary insert" on public.update_photos;
drop policy if exists "update_photos: secretary update" on public.update_photos;
drop policy if exists "update_photos: secretary delete" on public.update_photos;
drop policy if exists "update_sponsors: secretary insert" on public.update_sponsors;
drop policy if exists "update_sponsors: secretary delete" on public.update_sponsors;
drop policy if exists "update-photos: secretary insert" on storage.objects;
drop policy if exists "update-photos: secretary update" on storage.objects;
drop policy if exists "update-photos: secretary delete" on storage.objects;


-- =====================================================================
-- SECTION 4: FINANCES, SPONSORS AND CAMPAIGN SETTINGS
--   contributions          every donation; only 'verified' ones count publicly
--   campaign_settings      one row: target, journey step, payment and contact details
--   submit_contribution()  the public "I have sent money" form (always 'pending')
--   campaign_summary()     everything the public page needs, in one call
-- =====================================================================

-- True for the roles that handle money (record and verify contributions).
create or replace function public.can_manage_money()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(public.app_role() in ('admin', 'treasurer'), false)
$$;

grant execute on function public.can_manage_money() to anon, authenticated;

-- Staff can see each other's names (for "verified by" and "changed by").
drop policy if exists "profiles: staff read" on public.profiles;
create policy "profiles: staff read" on public.profiles
  for select to authenticated
  using (public.app_role() in ('admin', 'secretary', 'treasurer'));

-- 4.1 Sponsors: admin and secretary manage them ----------------------

alter table public.sponsors add column if not exists updated_at timestamptz not null default now();

drop policy if exists "sponsors: admin write" on public.sponsors;
drop policy if exists "sponsors: editor write" on public.sponsors;
create policy "sponsors: editor write" on public.sponsors
  for all to authenticated
  using (public.can_edit_posts())
  with check (public.can_edit_posts());

-- 4.2 Campaign settings (exactly one row) ------------------------------

create table if not exists public.campaign_settings (
  id smallint primary key default 1 check (id = 1),
  target bigint not null default 2000000 check (target > 0 and target <= 1000000000),
  target_confirmed boolean not null default false,
  journey_step smallint not null default 3 check (journey_step between 1 and 10),
  airtel_number text check (airtel_number is null or char_length(airtel_number) <= 30),
  airtel_name text check (airtel_name is null or char_length(airtel_name) <= 120),
  mpamba_number text check (mpamba_number is null or char_length(mpamba_number) <= 30),
  mpamba_name text check (mpamba_name is null or char_length(mpamba_name) <= 120),
  bank_name text check (bank_name is null or char_length(bank_name) <= 120),
  bank_account_number text check (bank_account_number is null or char_length(bank_account_number) <= 40),
  bank_account_name text check (bank_account_name is null or char_length(bank_account_name) <= 120),
  bank_branch text check (bank_branch is null or char_length(bank_branch) <= 120),
  bank_swift text check (bank_swift is null or char_length(bank_swift) <= 20),
  payments_confirmed boolean not null default false,
  contact_phone text check (contact_phone is null or char_length(contact_phone) <= 30),
  contact_whatsapp text check (contact_whatsapp is null or contact_whatsapp ~ '^[0-9]{8,15}$'),
  contact_email text check (contact_email is null or char_length(contact_email) <= 120),
  facebook_url text check (facebook_url is null or facebook_url ~ '^https://'),
  contacts_confirmed boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

-- The smallest amount the public form accepts, and the Daily 50K Challenge (section 5).
alter table public.campaign_settings
  add column if not exists min_contribution bigint not null default 200 check (min_contribution between 1 and 1000000),
  add column if not exists challenge_enabled boolean not null default false,
  add column if not exists challenge_daily_target bigint not null default 50000
    check (challenge_daily_target between 1 and 100000000),
  add column if not exists challenge_start date not null default date '2026-11-03',
  add column if not exists challenge_end date not null default date '2026-11-10',
  -- Each challenge day closes at this time (Malawi; '24:00' = midnight); later gifts count for the next day.
  add column if not exists challenge_cutoff time not null default time '24:00' check (challenge_cutoff >= time '12:00'),
  -- Show "reported, being checked" money on the public bar. Turn off if the form is abused.
  add column if not exists challenge_show_pending boolean not null default true;

-- Starts with the sample values from src/config/site.ts; the admin replaces them in /admin/settings.
insert into public.campaign_settings (
  id, target, journey_step, airtel_number, airtel_name, bank_name, bank_account_number, bank_account_name,
  contact_phone, contact_whatsapp, contact_email, facebook_url
) values (
  1, 2000000, 3, '+265 999 123 456', 'Karonga Spikers Volleyball Club', 'National Bank of Malawi', '1234567890',
  'Karonga Spikers Volleyball Club', '+265 999 123 456', '265999123456', 'karongaspikers@gmail.com',
  'https://www.facebook.com/search/top?q=Karonga%20Spikers%20Volleyball%20Club'
) on conflict (id) do nothing;

alter table public.campaign_settings enable row level security;

drop policy if exists "campaign_settings: read" on public.campaign_settings;
create policy "campaign_settings: read" on public.campaign_settings
  for select to anon, authenticated
  using (true);

drop policy if exists "campaign_settings: admin update" on public.campaign_settings;
create policy "campaign_settings: admin update" on public.campaign_settings
  for update to authenticated
  using (public.app_role() = 'admin')
  with check (public.app_role() = 'admin');

create or replace function public.campaign_settings_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.id := 1;
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end $$;

drop trigger if exists campaign_settings_before_update on public.campaign_settings;
create trigger campaign_settings_before_update
  before update on public.campaign_settings
  for each row execute function public.campaign_settings_before_update();

grant select on public.campaign_settings to anon, authenticated;
grant update on public.campaign_settings to authenticated;

-- 4.3 Contributions ------------------------------------------------------

create table if not exists public.contributions (
  id uuid primary key default gen_random_uuid(),
  donor_name text not null check (char_length(donor_name) between 1 and 120),
  donor_phone text check (donor_phone is null or char_length(donor_phone) <= 30),
  amount bigint not null check (amount > 0 and amount <= 100000000),
  method text not null check (method in ('airtel_money', 'tnm_mpamba', 'bank', 'cash', 'in_kind', 'other')),
  reference text check (reference is null or char_length(reference) <= 80),
  contributed_on date not null default ((now() at time zone 'Africa/Blantyre')::date),
  show_name boolean not null default false,
  message text check (message is null or char_length(message) <= 300),
  status text not null default 'pending' check (status in ('pending', 'verified', 'rejected')),
  source text not null default 'staff' check (source in ('public_form', 'staff')),
  note text check (note is null or char_length(note) <= 500),
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  verified_by uuid references auth.users (id) on delete set null,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- The same transaction ID cannot be counted twice (rejected entries do not block it).
create unique index if not exists contributions_reference_key
  on public.contributions (method, lower(reference))
  where reference is not null and status <> 'rejected';
create index if not exists contributions_status_idx on public.contributions (status, created_at desc);

-- display_name: how the supporter wants to be thanked (e.g. "Chikondi M."); null means donor_name.
-- school: no longer asked for (the challenge is for everyone); kept so the form function stays compatible.
-- challenge_day: set by the trigger below.
alter table public.contributions
  add column if not exists display_name text check (display_name is null or char_length(display_name) <= 60),
  add column if not exists school text check (school is null or char_length(school) <= 80),
  add column if not exists challenge_day date;
create index if not exists contributions_challenge_day_idx on public.contributions (challenge_day, status);

-- The challenge day a moment belongs to. Days close at the cut-off (midnight by default; with 8pm, a gift at 9pm counts for tomorrow).
create or replace function public.challenge_day_for(ts timestamptz)
returns date
language sql
stable
set search_path = ''
as $$
  select ((ts at time zone 'Africa/Blantyre')
          + (interval '24 hours'
             - coalesce((select challenge_cutoff from public.campaign_settings where id = 1), time '24:00')::interval))::date
$$;

grant execute on function public.challenge_day_for(timestamptz) to anon, authenticated;

create or replace function public.contributions_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    new.id := old.id;
    new.source := old.source;
    new.created_by := old.created_by;
    new.created_at := old.created_at;
  end if;

  if new.status = 'verified' then
    if tg_op = 'INSERT' or old.status <> 'verified' then
      new.verified_by := auth.uid();
      new.verified_at := now();
    else
      new.verified_by := old.verified_by;
      new.verified_at := old.verified_at;
    end if;
  else
    new.verified_by := null;
    new.verified_at := null;
  end if;

  -- Website entries count for the challenge day they were sent in (fixed); staff entries for the date paid.
  if new.source = 'staff' then
    new.challenge_day := new.contributed_on;
  elsif tg_op = 'INSERT' then
    new.challenge_day := public.challenge_day_for(now());
  else
    new.challenge_day := coalesce(old.challenge_day, public.challenge_day_for(old.created_at));
  end if;

  new.display_name := nullif(trim(new.display_name), '');
  new.school := nullif(trim(new.school), '');
  new.reference := nullif(trim(new.reference), '');
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists contributions_before_write on public.contributions;
create trigger contributions_before_write
  before insert or update on public.contributions
  for each row execute function public.contributions_before_write();

alter table public.contributions enable row level security;

drop policy if exists "contributions: money read" on public.contributions;
create policy "contributions: money read" on public.contributions
  for select to authenticated
  using (public.can_manage_money());

drop policy if exists "contributions: money insert" on public.contributions;
create policy "contributions: money insert" on public.contributions
  for insert to authenticated
  with check (public.can_manage_money() and source = 'staff');

drop policy if exists "contributions: money update" on public.contributions;
create policy "contributions: money update" on public.contributions
  for update to authenticated
  using (public.can_manage_money())
  with check (public.can_manage_money());

drop policy if exists "contributions: admin delete" on public.contributions;
create policy "contributions: admin delete" on public.contributions
  for delete to authenticated
  using (public.app_role() = 'admin');

-- Logged-out visitors get no table access at all; they use submit_contribution() and campaign_summary().
revoke all on public.contributions from anon;
grant select, insert, update, delete on public.contributions to authenticated;

-- 4.4 Public "I have sent money" form ------------------------------------
-- The only way the public can write anything. Always saved as 'pending'.

-- The first version had no display name or school.
drop function if exists public.submit_contribution(text, text, bigint, text, text, boolean, text);

create or replace function public.submit_contribution(
  p_name text,
  p_phone text,
  p_amount bigint,
  p_method text,
  p_reference text,
  p_show_name boolean,
  p_message text,
  p_display_name text default null,
  p_school text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_id uuid;
begin
  if char_length(trim(coalesce(p_name, ''))) not between 1 and 120 then
    raise exception 'invalid_name' using errcode = 'check_violation';
  end if;
  if p_amount is null or p_amount > 100000000
     or p_amount < coalesce((select min_contribution from public.campaign_settings where id = 1), 50) then
    raise exception 'invalid_amount' using errcode = 'check_violation';
  end if;
  if p_method not in ('airtel_money', 'tnm_mpamba', 'bank') then
    raise exception 'invalid_method' using errcode = 'check_violation';
  end if;
  if char_length(trim(coalesce(p_reference, ''))) not between 4 and 80 then
    raise exception 'invalid_reference' using errcode = 'check_violation';
  end if;
  -- Flood guard: pending submissions never change public totals, but cap them anyway.
  if (select count(*) from public.contributions
      where source = 'public_form' and created_at > now() - interval '1 hour') >= 100 then
    raise exception 'too_many' using errcode = 'check_violation';
  end if;

  insert into public.contributions
    (donor_name, donor_phone, amount, method, reference, show_name, message, display_name, school, status, source, created_by)
  values (
    trim(p_name),
    nullif(left(trim(coalesce(p_phone, '')), 30), ''),
    p_amount,
    p_method,
    trim(p_reference),
    coalesce(p_show_name, false),
    nullif(left(trim(coalesce(p_message, '')), 300), ''),
    nullif(left(trim(coalesce(p_display_name, '')), 60), ''),
    nullif(left(trim(coalesce(p_school, '')), 80), ''),
    'pending',
    'public_form',
    null
  )
  returning id into new_id;
  return new_id;
exception
  when unique_violation then
    raise exception 'duplicate_reference' using errcode = 'unique_violation';
end $$;

revoke execute on function public.submit_contribution(text, text, bigint, text, text, boolean, text, text, text) from public;
grant execute on function public.submit_contribution(text, text, bigint, text, text, boolean, text, text, text)
  to anon, authenticated;

-- 4.5 Public summary ------------------------------------------------------
-- Totals and opt-in names only: no amounts per person, no phone numbers.

create or replace function public.campaign_summary()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'settings', (select to_jsonb(s) - 'updated_by' from public.campaign_settings s where s.id = 1),
    'raised', coalesce((select sum(amount) from public.contributions where status = 'verified'), 0),
    'contributions', (select count(*) from public.contributions where status = 'verified'),
    'last_verified_at', (select max(verified_at) from public.contributions where status = 'verified'),
    'names', coalesce((
      select jsonb_agg(t.shown order by t.latest desc)
      from (
        select min(coalesce(display_name, donor_name)) as shown, max(verified_at) as latest
        from public.contributions
        where status = 'verified' and show_name
        group by lower(coalesce(display_name, donor_name))
        order by max(verified_at) desc
        limit 80
      ) t
    ), '[]'::jsonb),
    'sponsors', coalesce((
      select jsonb_agg(jsonb_build_object('name', name, 'tier', tier)
                       order by array_position(array['gold', 'silver', 'bronze'], tier), name)
      from public.sponsors
      where confirmed
    ), '[]'::jsonb)
  )
$$;

revoke execute on function public.campaign_summary() from public;
grant execute on function public.campaign_summary() to anon, authenticated;

-- =========================================================================
-- 5. Daily 50K Challenge
-- =========================================================================
-- Per-day totals for the public challenge card and the 8pm announcement. Public data only:
-- day totals, supporter counts and opt-in names. No amounts per person, phones or schools.
-- The secretary reads it through this function, so the contributions table stays hidden from them.

create or replace function public.challenge_summary()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with s as (
    select * from public.campaign_settings where id = 1
  ),
  c as (
    select c.challenge_day, c.status, c.amount, c.show_name, c.donor_name, c.verified_at,
           coalesce(c.display_name, c.donor_name) as shown
    from public.contributions c, s
    where c.challenge_day between s.challenge_start and s.challenge_end and c.status <> 'rejected'
  ),
  days as (
    select d::date as day from s, generate_series(s.challenge_start, s.challenge_end, interval '1 day') d
  )
  select jsonb_build_object(
    'enabled', s.challenge_enabled,
    'daily_target', s.challenge_daily_target,
    'start', s.challenge_start,
    'end', s.challenge_end,
    'cutoff', to_char(s.challenge_cutoff, 'HH24:MI'),
    'min_amount', s.min_contribution,
    'today', public.challenge_day_for(now()),
    'days', coalesce((
      select jsonb_agg(jsonb_build_object(
        'day', days.day,
        'raised', coalesce((select sum(amount) from c where c.challenge_day = days.day and c.status = 'verified'), 0),
        'supporters', (select count(distinct lower(donor_name)) from c
                       where c.challenge_day = days.day and c.status = 'verified'),
        -- Each report counts for at most one day's target, so one fake entry cannot fill the bar.
        'pending', case when s.challenge_show_pending then coalesce((
                     select sum(least(amount, s.challenge_daily_target)) from c
                     where c.challenge_day = days.day and c.status = 'pending'), 0) else 0 end,
        'pending_count', (select count(*) from c where c.challenge_day = days.day and c.status = 'pending'),
        'names', coalesce((
          select jsonb_agg(n.shown order by n.first_verified)
          from (
            select min(shown) as shown, min(verified_at) as first_verified
            from c
            where c.challenge_day = days.day and c.status = 'verified' and c.show_name
            group by lower(shown)
            order by min(verified_at)
            limit 300
          ) n
        ), '[]'::jsonb)
      ) order by days.day)
      from days
    ), '[]'::jsonb)
  )
  from s
$$;

revoke execute on function public.challenge_summary() from public;
grant execute on function public.challenge_summary() to anon, authenticated;

-- Give contributions made before section 5 their challenge day (the trigger fills it in on update).
update public.contributions set updated_at = updated_at where challenge_day is null;
