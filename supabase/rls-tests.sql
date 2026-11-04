-- =====================================================================
-- KARONGA SPIKERS: ROW LEVEL SECURITY TESTS
-- ---------------------------------------------------------------------
-- Run in Supabase Dashboard -> SQL Editor AFTER schema.sql.
-- Everything happens inside one transaction that is rolled back at the
-- end, so no test users, posts or files are left behind.
-- Expected result: a list of "PASS" notices (1 to 14d) and no exception.
-- =====================================================================

begin;

-- Test accounts: a secretary, a treasurer, a signed-in user with no role, and an admin.
insert into auth.users (id, email, aud, role) values
  ('00000000-0000-4000-8000-0000000000a1', 'secretary@test.local', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-8000-0000000000b2', 'treasurer@test.local', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-8000-0000000000c3', 'nobody@test.local', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-8000-0000000000d4', 'admin@test.local', 'authenticated', 'authenticated');
insert into public.profiles (id, full_name, role) values
  ('00000000-0000-4000-8000-0000000000a1', 'Test secretary', 'secretary'),
  ('00000000-0000-4000-8000-0000000000b2', 'Test treasurer', 'treasurer'),
  ('00000000-0000-4000-8000-0000000000d4', 'Test admin', 'admin');
insert into public.sponsors (id, name, tier) values
  ('00000000-0000-4000-8000-00000000d004', 'Test Sponsor Ltd', 'gold');

-- Pretend to be a given user for the rest of the transaction.
create or replace function pg_temp.act_as(user_id uuid) returns void language plpgsql as $$
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', user_id, 'role', 'authenticated')::text, true);
end $$;

create or replace function pg_temp.act_as_public() returns void language plpgsql as $$
begin
  perform set_config('role', 'anon', true);
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
end $$;

-- 1. The secretary can create a draft, a published post, photos and sponsor links.
select pg_temp.act_as('00000000-0000-4000-8000-0000000000a1');
do $$
begin
  insert into public.updates (id, title, category, published)
    values ('00000000-0000-4000-8000-0000000000e1', 'Draft post', 'training', false);
  insert into public.updates (id, title, category, published)
    values ('00000000-0000-4000-8000-0000000000e2', 'Published post!', 'match_day', true);
  insert into public.update_photos (update_id, storage_path, width, height)
    values ('00000000-0000-4000-8000-0000000000e1', '00000000-0000-4000-8000-0000000000e1/00000000-0000-4000-8000-000000000f01.jpg', 1600, 1200),
           ('00000000-0000-4000-8000-0000000000e2', '00000000-0000-4000-8000-0000000000e2/00000000-0000-4000-8000-000000000f02.jpg', 1600, 1200);
  insert into public.update_sponsors (update_id, sponsor_id)
    values ('00000000-0000-4000-8000-0000000000e1', '00000000-0000-4000-8000-00000000d004'),
           ('00000000-0000-4000-8000-0000000000e2', '00000000-0000-4000-8000-00000000d004');
  update public.updates set title = 'Published post (edited)' where id = '00000000-0000-4000-8000-0000000000e2';

  if (select slug from public.updates where id = '00000000-0000-4000-8000-0000000000e2') <> 'published-post-000000' then
    raise exception 'FAIL: slug should be set once from the original title';
  end if;
  raise notice 'PASS 1: secretary can create, publish and edit posts, photos and sponsor links; slug stays fixed';
end $$;

-- 2. A logged-out visitor sees only the published post and its photos/sponsors, and cannot write.
select pg_temp.act_as_public();
do $$
begin
  if (select count(*) from public.updates) <> 1 then raise exception 'FAIL: public should see 1 post'; end if;
  if (select count(*) from public.update_photos) <> 1 then raise exception 'FAIL: public should see 1 photo'; end if;
  if (select count(*) from public.update_sponsors) <> 1 then raise exception 'FAIL: public should see 1 sponsor link'; end if;
  begin
    insert into public.updates (title) values ('Spam');
    raise exception 'FAIL: public insert was allowed';
  exception when insufficient_privilege then null;
  end;
  raise notice 'PASS 2: public sees only published posts, photos and sponsor links, and cannot insert';
end $$;

-- 3. The treasurer can read everything but every write is refused or affects nothing.
select pg_temp.act_as('00000000-0000-4000-8000-0000000000b2');
do $$
declare n integer;
begin
  if (select count(*) from public.updates) <> 2 then raise exception 'FAIL: treasurer should see both posts'; end if;
  if (select count(*) from public.update_photos) <> 2 then raise exception 'FAIL: treasurer should see both photos'; end if;

  begin
    insert into public.updates (title) values ('Treasurer post');
    raise exception 'FAIL: treasurer insert was allowed';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.update_photos (update_id, storage_path, width, height)
      values ('00000000-0000-4000-8000-0000000000e1', '00000000-0000-4000-8000-0000000000e1/00000000-0000-4000-8000-000000000f09.jpg', 10, 10);
    raise exception 'FAIL: treasurer photo insert was allowed';
  exception when insufficient_privilege then null;
  end;

  update public.updates set title = 'Hacked' where true;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: treasurer updated % posts', n; end if;

  delete from public.update_photos where true;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: treasurer deleted % photos', n; end if;

  delete from public.updates where true;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: treasurer deleted % posts', n; end if;

  begin
    insert into storage.objects (bucket_id, name)
      values ('update-photos', '00000000-0000-4000-8000-0000000000e1/00000000-0000-4000-8000-000000000f10.jpg');
    raise exception 'FAIL: treasurer storage upload was allowed';
  exception when insufficient_privilege then null;
  end;
  raise notice 'PASS 3: treasurer can view posts but cannot create, edit, delete or upload';
end $$;

-- 4. A signed-in user without a role sees only published posts and cannot write.
select pg_temp.act_as('00000000-0000-4000-8000-0000000000c3');
do $$
begin
  if (select count(*) from public.updates) <> 1 then raise exception 'FAIL: user without role should see 1 post'; end if;
  begin
    insert into public.updates (title) values ('No role');
    raise exception 'FAIL: user without role could insert';
  exception when insufficient_privilege then null;
  end;
  raise notice 'PASS 4: users without a role are treated like the public';
end $$;

-- 5. Storage: the secretary can upload into an existing post's folder, not elsewhere.
select pg_temp.act_as('00000000-0000-4000-8000-0000000000a1');
do $$
begin
  insert into storage.objects (bucket_id, name)
    values ('update-photos', '00000000-0000-4000-8000-0000000000e1/00000000-0000-4000-8000-000000000f11.jpg');
  begin
    insert into storage.objects (bucket_id, name) values ('update-photos', 'random/file.png');
    raise exception 'FAIL: upload with a wrong path was allowed';
  exception when insufficient_privilege then null;
  end;
  raise notice 'PASS 5: secretary can upload to {update_id}/{uuid}.jpg only';
end $$;

-- 6. Database limits: 8 photos per post, 2000 characters of text.
do $$
begin
  for i in 2..8 loop
    insert into public.update_photos (update_id, storage_path, width, height)
      values ('00000000-0000-4000-8000-0000000000e1',
              '00000000-0000-4000-8000-0000000000e1/' || gen_random_uuid() || '.jpg', 10, 10);
  end loop;
  begin
    insert into public.update_photos (update_id, storage_path, width, height)
      values ('00000000-0000-4000-8000-0000000000e1', '00000000-0000-4000-8000-0000000000e1/' || gen_random_uuid() || '.jpg', 10, 10);
    raise exception 'FAIL: a 9th photo was allowed';
  exception when check_violation then null;
  end;
  begin
    update public.updates set body = repeat('x', 2001) where id = '00000000-0000-4000-8000-0000000000e1';
    raise exception 'FAIL: a 2001-character body was allowed';
  exception when check_violation then null;
  end;
  raise notice 'PASS 6: 8-photo and 2000-character limits hold';
end $$;

-- 7. Deleting a post deletes its photo rows and sponsor links.
do $$
begin
  delete from public.updates where id = '00000000-0000-4000-8000-0000000000e1';
  if exists (select 1 from public.update_photos where update_id = '00000000-0000-4000-8000-0000000000e1')
     or exists (select 1 from public.update_sponsors where update_id = '00000000-0000-4000-8000-0000000000e1') then
    raise exception 'FAIL: photos or sponsor links were left behind';
  end if;
  raise notice 'PASS 7: deleting a post removes its photos and sponsor links';
end $$;

-- 8. The admin can do everything: posts, photos, uploads and sponsors. The treasurer cannot edit sponsors.
select pg_temp.act_as('00000000-0000-4000-8000-0000000000d4');
do $$
declare n integer;
begin
  insert into public.updates (id, title, category, published)
    values ('00000000-0000-4000-8000-0000000000e3', 'Admin post', 'general', true);
  insert into public.update_photos (update_id, storage_path, width, height)
    values ('00000000-0000-4000-8000-0000000000e3', '00000000-0000-4000-8000-0000000000e3/00000000-0000-4000-8000-000000000f20.jpg', 10, 10);
  insert into storage.objects (bucket_id, name)
    values ('update-photos', '00000000-0000-4000-8000-0000000000e3/00000000-0000-4000-8000-000000000f21.jpg');
  update public.updates set published = false where id = '00000000-0000-4000-8000-0000000000e3';
  insert into public.sponsors (name, tier) values ('Admin Sponsor', 'silver');
  update public.sponsors set tier = 'gold' where name = 'Admin Sponsor';
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'FAIL: admin could not edit a sponsor'; end if;
  delete from public.updates where id = '00000000-0000-4000-8000-0000000000e3';
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'FAIL: admin could not delete a post'; end if;
  raise notice 'PASS 8a: admin can create, publish, upload, delete and manage sponsors';
end $$;

select pg_temp.act_as('00000000-0000-4000-8000-0000000000b2');
do $$
declare n integer;
begin
  begin
    insert into public.sponsors (name) values ('Treasurer Sponsor');
    raise exception 'FAIL: treasurer could add a sponsor';
  exception when insufficient_privilege then null;
  end;
  update public.sponsors set name = 'Hacked' where true;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: treasurer edited % sponsors', n; end if;
  raise notice 'PASS 8b: treasurer cannot change sponsors';
end $$;

-- 9. Money: the public can only report (pending) and read totals; pending money never counts.
select pg_temp.act_as_public();
do $$
declare s jsonb; before bigint := (public.campaign_summary()->>'raised')::bigint;
begin
  perform public.submit_contribution('Public Donor', '0999000000', 5000, 'airtel_money', 'TESTREF001', true, 'Go team');
  begin
    perform public.submit_contribution('Again', null, 5000, 'airtel_money', 'testref001', false, null);
    raise exception 'FAIL: the same transaction ID was accepted twice';
  exception when unique_violation then null;
  end;
  begin
    perform public.submit_contribution('Cash claim', null, 5000, 'cash', 'TESTREF002', false, null);
    raise exception 'FAIL: public could report a cash contribution';
  exception when check_violation then null;
  end;
  begin
    if (select count(*) from public.contributions) <> 0 then
      raise exception 'FAIL: public could read contributions';
    end if;
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.contributions (donor_name, amount, method, status) values ('Fake', 999999, 'cash', 'verified');
    raise exception 'FAIL: public could insert a contribution directly';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.campaign_settings set target = 1 where id = 1;
    if (select target from public.campaign_settings where id = 1) = 1 then
      raise exception 'FAIL: public changed the target';
    end if;
  exception when insufficient_privilege then null;
  end;
  s := public.campaign_summary();
  if (s->>'raised')::bigint <> before then raise exception 'FAIL: pending money counted in the public total'; end if;
  if s ? 'updated_by' or (s->'settings') ? 'updated_by' then raise exception 'FAIL: summary exposes updated_by'; end if;
  raise notice 'PASS 9: public can report (pending only), cannot read or change money, totals ignore pending';
end $$;

-- 10. The secretary cannot see or record money.
select pg_temp.act_as('00000000-0000-4000-8000-0000000000a1');
do $$
begin
  if (select count(*) from public.contributions) <> 0 then raise exception 'FAIL: secretary can see contributions'; end if;
  begin
    insert into public.contributions (donor_name, amount, method) values ('Secretary', 100, 'cash');
    raise exception 'FAIL: secretary recorded a contribution';
  exception when insufficient_privilege then null;
  end;
  insert into public.sponsors (name, tier) values ('Secretary Sponsor', 'bronze');
  raise notice 'PASS 10: secretary cannot see or record money, but can add sponsors';
end $$;

-- 11. The treasurer records and verifies; verified money counts; cannot delete or change settings.
select pg_temp.act_as('00000000-0000-4000-8000-0000000000b2');
do $$
-- Compared with the totals before, so real contributions already in the database do not matter.
declare n integer; before bigint := (public.campaign_summary()->>'raised')::bigint;
begin
  if (select count(*) from public.contributions where status = 'pending' and reference = 'TESTREF001') <> 1 then
    raise exception 'FAIL: treasurer should see the pending report';
  end if;
  update public.contributions set status = 'verified' where reference = 'TESTREF001';
  if (select verified_by from public.contributions where reference = 'TESTREF001') <> '00000000-0000-4000-8000-0000000000b2' then
    raise exception 'FAIL: verified_by was not recorded';
  end if;
  insert into public.contributions (donor_name, amount, method, status, show_name)
    values ('Cash Donor', 20000, 'cash', 'verified', false);
  if (public.campaign_summary()->>'raised')::bigint <> before + 25000 then raise exception 'FAIL: verified total should grow by 25000'; end if;
  if not (public.campaign_summary()->'names') ? 'Public Donor' or (public.campaign_summary()->'names') ? 'Cash Donor' then
    raise exception 'FAIL: only opted-in names should be listed';
  end if;
  begin
    insert into public.contributions (donor_name, amount, method, source) values ('Fake form', 100, 'cash', 'public_form');
    raise exception 'FAIL: treasurer could pretend an entry came from the website';
  exception when insufficient_privilege then null;
  end;
  delete from public.contributions where true;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: treasurer deleted contributions'; end if;
  update public.campaign_settings set target = 1 where id = 1;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: treasurer changed settings'; end if;
  raise notice 'PASS 11: treasurer verifies and records; totals and names are right; no deletes or settings';
end $$;

-- 12. The admin changes settings and can delete contributions.
select pg_temp.act_as('00000000-0000-4000-8000-0000000000d4');
do $$
declare n integer;
begin
  update public.campaign_settings set target = 3000000 where id = 1;
  if (select updated_by from public.campaign_settings where id = 1) <> '00000000-0000-4000-8000-0000000000d4' then
    raise exception 'FAIL: settings change was not attributed to the admin';
  end if;
  delete from public.contributions where donor_name = 'Cash Donor';
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'FAIL: admin could not delete a contribution'; end if;
  raise notice 'PASS 12: admin can change settings and delete contributions';
end $$;

-- 13. Daily challenge: days close at 8pm, the minimum is enforced, and the summary has no private details.
select pg_temp.act_as('00000000-0000-4000-8000-0000000000d4');
update public.campaign_settings
  set challenge_enabled = true, challenge_cutoff = '20:00', min_contribution = 200,
      challenge_start = public.challenge_day_for(now()) - 1, challenge_end = public.challenge_day_for(now()) + 7
  where id = 1;

select pg_temp.act_as_public();
do $$
declare s jsonb; today jsonb;
begin
  if public.challenge_day_for('2026-11-03 19:59+02') <> date '2026-11-03'
     or public.challenge_day_for('2026-11-03 20:00+02') <> date '2026-11-04' then
    raise exception 'FAIL: challenge days should close at 8pm Malawi time';
  end if;
  begin
    perform public.submit_contribution('Tiny', null, 150, 'airtel_money', 'TESTREF130', false, null);
    raise exception 'FAIL: an amount below the minimum was accepted';
  exception when check_violation then null;
  end;
  perform public.submit_contribution('Chikondi Mwale', '0999111222', 300, 'tnm_mpamba', 'TESTREF131', true, null,
                                     'Chikondi M.', 'Karonga CDSS');
  s := public.challenge_summary();
  if s::text ~ '(Karonga CDSS|0999111222|TESTREF|Chikondi Mwale)' then
    raise exception 'FAIL: the challenge summary exposes private details';
  end if;
  select d into today from jsonb_array_elements(s->'days') d where d->>'day' = s->>'today';
  if (today->>'pending_count')::int < 1 or (today->>'pending')::bigint < 300 then
    raise exception 'FAIL: today should show the pending report (got %)', today;
  end if;
  raise notice 'PASS 13a: 8pm cut-off, minimum amount, pending shown separately, no private details in the summary';
end $$;

select pg_temp.act_as('00000000-0000-4000-8000-0000000000b2');
do $$
declare s jsonb; today jsonb; before bigint; tomorrow date := public.challenge_day_for(now()) + 1;
begin
  if (select challenge_day from public.contributions where reference = 'TESTREF131') <> public.challenge_day_for(now()) then
    raise exception 'FAIL: a website entry should count for the day it was sent';
  end if;
  s := public.challenge_summary();
  select (d->>'raised')::bigint into before from jsonb_array_elements(s->'days') d where d->>'day' = s->>'today';
  update public.contributions set status = 'verified' where reference = 'TESTREF131';
  insert into public.contributions (donor_name, amount, method, status, contributed_on)
    values ('Cash Tomorrow', 1000, 'cash', 'verified', tomorrow);
  if (select challenge_day from public.contributions where donor_name = 'Cash Tomorrow') <> tomorrow then
    raise exception 'FAIL: a staff entry should count for the date paid';
  end if;
  s := public.challenge_summary();
  select d into today from jsonb_array_elements(s->'days') d where d->>'day' = s->>'today';
  if not (today->'names') ? 'Chikondi M.' or (today->'names') ? 'Chikondi Mwale' then
    raise exception 'FAIL: the chosen display name should be thanked, not the full name (got %)', today->'names';
  end if;
  if (today->>'raised')::bigint <> before + 300 then
    raise exception 'FAIL: verifying 300 today should add exactly 300 (got % -> %)', before, today->>'raised';
  end if;
  raise notice 'PASS 13b: entries land on the right day; display names are used';
end $$;

select pg_temp.act_as('00000000-0000-4000-8000-0000000000a1');
do $$
begin
  if (public.challenge_summary()->>'enabled')::boolean is not true then
    raise exception 'FAIL: the secretary should be able to read the challenge summary';
  end if;
  if (select count(*) from public.contributions) <> 0 then raise exception 'FAIL: secretary can see contributions'; end if;
  raise notice 'PASS 13c: secretary reads the challenge summary but still cannot see contributions';
end $$;

-- 14. Online payments (PayChangu): only the server's token can start or settle a payment, a payment
--     counts once, staff cannot change whether it was paid, and transfers are money-roles only.
select pg_temp.act_as('00000000-0000-4000-8000-0000000000b2');
do $$
begin
  begin
    perform public.paychangu_link('test-token-0123456789abcdef0123456789abcdef');
    raise exception 'FAIL: the treasurer should not be able to connect online payments';
  exception when insufficient_privilege then null;
  end;
end $$;

select pg_temp.act_as('00000000-0000-4000-8000-0000000000d4');
select public.paychangu_link('test-token-0123456789abcdef0123456789abcdef');

select pg_temp.act_as_public();
do $$
declare ref text; ref2 text; before bigint; s jsonb;
begin
  begin
    perform public.paychangu_start('wrong-token-0123456789abcdef0123456789', 'Faker', null, null, 5000, 'supporter', null, true, null);
    raise exception 'FAIL: starting a payment without the server token should fail';
  exception when insufficient_privilege then null;
  end;

  before := (public.campaign_summary()->>'raised')::bigint;
  s := public.challenge_summary();
  ref := public.paychangu_start('test-token-0123456789abcdef0123456789abcdef', 'Online Tester', '0991000000',
                                null, 1000, 'student', 'Karonga CDSS', true, 'Go Spikers');
  if ref !~ '^KSVC-' then raise exception 'FAIL: tx_ref should start with KSVC- (got %)', ref; end if;

  if public.challenge_summary() is distinct from s then
    raise exception 'FAIL: an unpaid online checkout should not show as "being checked"';
  end if;

  begin
    perform public.paychangu_settle('wrong-token-0123456789abcdef0123456789', ref, 'success', 1000, 'MWK', 'X1');
    raise exception 'FAIL: settling without the server token should fail';
  exception when insufficient_privilege then null;
  end;
  if public.paychangu_settle('test-token-0123456789abcdef0123456789abcdef', ref, 'success', 999, 'MWK', 'X1') <> 'mismatch'
     or public.paychangu_settle('test-token-0123456789abcdef0123456789abcdef', ref, 'success', 1000, 'USD', 'X1') <> 'mismatch' then
    raise exception 'FAIL: a lower amount or another currency must not confirm';
  end if;
  if public.paychangu_settle('test-token-0123456789abcdef0123456789abcdef', ref, 'success', 1000, 'MWK', 'PCREF1') <> 'confirmed'
     or public.paychangu_settle('test-token-0123456789abcdef0123456789abcdef', ref, 'success', 1000, 'MWK', 'PCREF1') <> 'already' then
    raise exception 'FAIL: the first success should confirm and a replay should say already';
  end if;
  if (public.campaign_summary()->>'raised')::bigint <> before + 1000 then
    raise exception 'FAIL: a confirmed online payment should add exactly its amount once';
  end if;
  if not (public.campaign_summary()->'names') ? 'Online Tester' then
    raise exception 'FAIL: an online supporter who chose to be thanked should be named';
  end if;
  if (public.paychangu_receipt(ref)->>'status') <> 'verified' then raise exception 'FAIL: receipt should say verified'; end if;

  -- Cancelled, then PayChangu says it was paid after all: it still counts.
  ref2 := public.paychangu_start('test-token-0123456789abcdef0123456789abcdef', 'Late Payer', '0881000000',
                                 'late@test.local', 500, 'supporter', null, false, null);
  if public.paychangu_settle('test-token-0123456789abcdef0123456789abcdef', ref2, 'cancelled') <> 'cancelled'
     or public.paychangu_settle('test-token-0123456789abcdef0123456789abcdef', ref2, 'success', 500, 'MWK', 'PCREF2') <> 'confirmed' then
    raise exception 'FAIL: a cancelled payment that PayChangu later confirms should count';
  end if;
  raise notice 'PASS 14a: online payments need the server token, confirm once, and check amount and currency';
end $$;

select pg_temp.act_as('00000000-0000-4000-8000-0000000000b2');
do $$
begin
  if (select confirmed_by from public.contributions where reference = 'PCREF1') <> 'paychangu' then
    raise exception 'FAIL: the treasurer should see the auto-verified payment';
  end if;
  begin
    update public.contributions set status = 'pending' where reference = 'PCREF1';
    raise exception 'FAIL: staff should not be able to un-verify an online payment';
  exception when check_violation then null;
  end;
  begin
    update public.contributions set amount = 5 where reference = 'PCREF1';
    raise exception 'FAIL: staff should not be able to change an online amount';
  exception when check_violation then null;
  end;
  update public.contributions set note = 'Checked the statement', show_name = false where reference = 'PCREF1';
  begin
    insert into public.contributions (donor_name, amount, method, status) values ('Fake online', 100, 'paychangu', 'verified');
    raise exception 'FAIL: staff should not be able to record a PayChangu payment by hand';
  exception when check_violation then null;
  end;
  insert into public.paychangu_transfers (amount, reference) values (1400, 'TWH-TRANSFER-1');
  raise notice 'PASS 14b: staff can edit the name and note of an online payment but not whether it was paid; transfers logged';
end $$;

select pg_temp.act_as('00000000-0000-4000-8000-0000000000a1');
do $$
begin
  if (select count(*) from public.paychangu_transfers) <> 0 then raise exception 'FAIL: secretary can see transfers'; end if;
  begin
    insert into public.paychangu_transfers (amount) values (1);
    raise exception 'FAIL: secretary should not log transfers';
  exception when insufficient_privilege then null;
  end;
  raise notice 'PASS 14c: the secretary cannot see or log transfers';
end $$;

select pg_temp.act_as_public();
do $$
begin
  begin
    perform count(*) from public.paychangu_transfers;
    raise exception 'FAIL: the public should not read transfers';
  exception when insufficient_privilege then null;
  end;
  begin
    perform count(*) from public.payment_secrets;
    raise exception 'FAIL: the public should not read payment_secrets';
  exception when insufficient_privilege then null;
  end;
  raise notice 'PASS 14d: transfers and the token hash are hidden from the public';
end $$;

rollback;
