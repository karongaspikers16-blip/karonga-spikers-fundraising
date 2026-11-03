# Karonga Spikers Volleyball Club: fundraising page

Next.js 16 + TypeScript + Tailwind CSS 4 + Lucide, with Supabase for the news posts and admin area.
The page works without Supabase; news sections stay hidden until it is set up.

## Run locally (Windows, PowerShell or CMD)

```
npm install
npm run dev
```

Open http://localhost:3000

## Before the page goes live

Everything editable is in `src/config/site.ts`. Values marked SAMPLE are mock data.

1. `fundraising`: real target, amount raised and "last updated" date. Progress % and remaining amount are calculated.
2. `needs`: real budget estimates (set any `estimate` to `null` to hide it).
3. `payments`: verified mobile money and bank details. Add `branch` / `swiftCode` if you have them.
4. `contact`: real phone, WhatsApp number (digits only, e.g. 265991234567), email and Facebook page URL.
5. `sponsorship.tiers[].amount`: set a minimum per tier, or leave `null` for "Amount by arrangement".
6. `sponsorship.currentSponsors`: add sponsors as they confirm; a thank-you strip appears automatically.
7. `journey.currentStep`: move it forward as the campaign progresses.
8. `siteUrl`: your live Vercel URL (used in share links and the WhatsApp/Facebook preview card).
9. Set each `isSample` flag to `false` once its details are real. That removes the yellow "Sample" badges.

Hero photos: put them in `public/images/` and list them in `hero.slides` (set `club.logo` for the badge).

## Deploy

Push to GitHub, import the repo in Vercel, deploy. Add the two Supabase variables below to turn on news posts.

## News posts and admin area (Supabase)

1. Create a Supabase project. In **SQL Editor**, run all of `supabase/schema.sql`.
2. Optional check: run `supabase/rls-tests.sql`. It should print `PASS 1` to `PASS 12` and changes nothing.
3. In **Authentication → Users**, add the admin, secretary and treasurer (email + password).
4. Give each one a role in **SQL Editor** (copy the user id from the Users list):
   ```sql
   insert into public.profiles (id, full_name, role) values ('<user id>', 'Name', 'admin');
   insert into public.profiles (id, full_name, role) values ('<user id>', 'Name', 'secretary');
   insert into public.profiles (id, full_name, role) values ('<user id>', 'Name', 'treasurer');
   ```
5. Copy `.env.example` to `.env.local` and fill in the URL and anon key from **Project Settings → API**.
   Add the same two variables in Vercel and redeploy.
6. In **Authentication → Sign In / Providers**, turn off **Allow new users to sign up**. Staff accounts are
   added by the admin; nobody else needs one.

## The admin dashboard (`/admin`)

| Section | Admin | Treasurer | Secretary |
|---|---|---|---|
| Overview: raised vs target, money waiting to check, countdown, drafts | ✅ | ✅ | ✅ (no money details) |
| Challenge: day results and the ready-made 8pm announcement | ✅ | ✅ | ✅ |
| Contributions: record, verify, reject, export CSV | ✅ (and delete) | ✅ | — |
| Updates: news posts with photos | ✅ | view only | ✅ |
| Sponsors: add, edit, remove | ✅ | view only | ✅ |
| Settings: target, journey step, payment numbers, contacts, Sample badges, daily challenge | ✅ | — | — |

**The amount raised is never typed in by hand.** It is the sum of *verified* contributions. Supporters who
pay can fill in **"Record my contribution"** on the website; that arrives as **To check** until the treasurer
matches it against the Mobile Money or bank statement and taps **Verify**. Donors choose whether their name
appears on the public supporters list; amounts and phone numbers are never shown.

Campaign figures, payment details, contacts, the journey step and sponsors now come from the dashboard.
The matching values in `src/config/site.ts` are only used when Supabase is not set up.
This is enforced by row level security in the database, not just hidden in the page.

## How to check contributions (for the treasurer)

1. Log in at `/admin` and open **Contributions**. **To check** lists what supporters reported on the website.
2. For each one, find the transaction ID in the Mobile Money or bank statement. If the money arrived with
   the right amount, tap **Verify**. It now counts towards the total on the website. If it did not arrive,
   tap **Reject**.
3. Cash or a payment someone told you about: tap **Record**, fill it in and save. It is verified straight away.
4. Made a mistake? **Undo verify** moves it back to To check. **Edit** fixes the details.
5. **Export CSV** downloads everything for Excel, for the club's records.

## How to post an update (for the secretary)

You can do all of this on your phone.

1. **Log in.** Open the website address followed by `/admin` (for example `karonga-spikers-fundraising.vercel.app/admin`)
   and sign in with your email and password. Tip: add it to your home screen.
2. **New post.** Tap **New post**. Write a short title, choose a category (Training, Match day…) and write
   what happened. Leave an empty line between paragraphs. If a sponsor helped, tap their name under
   **Thank sponsors**. Tap **Save and add photos**.
3. **Add photos.** Tap **Add photos** and take a picture or choose up to 8 from your gallery. They are made
   smaller on your phone first, so they upload quickly even on a slow connection. If one fails, tap **Retry**.
   - Add a caption under a photo if you like (who is in it, where it was).
   - Use the arrows to change the order. Tap **Make cover** on the best photo: it is the one people see
     on WhatsApp and on the website.
4. **Publish.** Switch the toggle from **Draft** to **Published** and tap **Save and publish**.
   Drafts are only visible to you and the treasurer.
5. **Share.** After publishing, the **Share this post** box appears at the top. Tap **Share on WhatsApp**
   to send it to the club groups, or **Copy** to paste the link on Facebook. Every post ends with a
   **Support the team** button that takes people to the donation details.

Changes show on the public website within about a minute. To hide a post again, switch it back to
**Draft** and save. To remove it completely, tap **Delete post** at the bottom (its photos are deleted too).

## The Daily 50K Challenge

The big target is broken into a daily one: **MWK 50,000 a day from 3 to 10 November**. Anyone can join from
**MWK 200**. Each day closes at **8pm** (Malawi time) and the result is posted on WhatsApp and Facebook.

- **Only verified money counts.** Money reported on the website but not yet checked shows lighter on the
  bar ("being checked") so people can see the day moving, but it never counts in a result.
- **A day closes at 8pm.** Anything reported on the website after 8pm counts for the next day. When the
  treasurer records cash, it counts for the **Date paid** on the form.
- **Names, never amounts.** Supporters who tick "Thank me by name" are thanked on the website and in the
  announcement, using their **Name to show** (for example "Chikondi M.") if they gave one. The box is
  unticked unless they choose it.
- **Settings** (admin): Admin → Settings → Daily challenge has the on/off switch, daily target, first and
  last day, closing time and the smallest amount. Switch it off after 10 November to hide it.

### Every day, for the treasurer

1. Check **Contributions → To check** a few times a day (for example 12pm, 4pm and 7:30pm). Each card
   shows the **Transaction ID** in large letters: find it in your Airtel Money, TNM Mpamba or bank
   messages. If the money arrived with the right amount, tap **Verify**; if not, tap **Reject**.
2. Have everything checked by **7:45pm**, so it is in the 8pm result. Cash received after 8pm: record it
   with tomorrow's date.

### Every evening at 8pm, for the secretary

1. Open **Admin → Challenge** (or the challenge box on the Overview). After 8pm it opens on the day that
   has just closed.
2. If it says entries are still waiting to be checked, ask the treasurer first.
3. Tap **Copy message** and paste it into the WhatsApp groups and on Facebook, or tap **Share on WhatsApp**.
   The message has the day's result, the running total, the thank-you names and the link.
4. During the day you can post the same page as a "so far today" update to build excitement.
