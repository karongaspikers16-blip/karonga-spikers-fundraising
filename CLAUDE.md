# Karonga Spikers

Fundraising landing page for Karonga Spikers Volleyball Club and supporters helping the team attend the Raiply National Volleyball Tournament, 13–15 November 2026, in Mzuzu, Malawi.

## Stack

- Next.js 16.4.2 App Router, React 19.2.9, TypeScript 5.9.3.
- Tailwind CSS 4.3.3 via `@tailwindcss/postcss`; design tokens are in `src/app/globals.css`.
- `lucide-react` 1.58.0; `@fontsource/barlow` and `@fontsource/barlow-condensed` 5.3.0.
- `@supabase/supabase-js` 2.118.0 and `@supabase/ssr` 0.12.7 for news posts, photos and the admin login.
- Keep dependency versions pinned. Do not add, remove, or upgrade dependencies unless asked.

## Project Map

- `src/app/page.tsx`: composes the landing page sections.
- `src/app/layout.tsx`: fonts, metadata, viewport, and site-wide layout.
- `src/app/globals.css`: Tailwind import, theme tokens, base styles, and motion rules.
- `src/config/site.ts`: all campaign content and figures; the source of truth for page data.
- `src/lib/format.ts`: money, progress, contact-link, and share-link helpers.
- `Navbar.tsx`: sticky navigation to the page sections.
- `Hero.tsx` and `HeroSlideshow.tsx`: tournament introduction and rotating photos (`#home`).
- `FundraisingProgress.tsx`: target, raised amount, progress, and sharing (`#progress`).
- `WhySupport.tsx`: campaign purpose and budget needs (`#campaign`).
- `DonationMethods.tsx`: mobile money, bank transfer, and giving instructions (`#donate`).
- `SponsorshipPackages.tsx`: sponsor tiers and confirmed sponsors (`#sponsors`).
- `Journey.tsx`: tournament journey and current step (`#journey`).
- `Contact.tsx`: WhatsApp, phone, email, and Facebook (`#contact`).
- `Footer.tsx`: club identity and social links.
- `LatestUpdates.tsx`: homepage news cards (`#updates`), hidden when no post is published.
- `updates/`: `UpdateCard`, `UpdatesBrowser` (category filter) and `PhotoGallery` (full-screen viewer).
- `admin/`: login form, post form, photo uploader, share panel and delete button for `/admin`.
- `ui/ShareButtons.tsx`: WhatsApp, Facebook and copy-link buttons for any page path.
- `src/app/updates/`: `/updates` list and `/updates/[slug]` post pages (ISR, `revalidate = 60`).
- `src/app/admin/`: login, and `(staff)/updates` list, new and edit pages plus server actions.
- `src/proxy.ts`: refreshes the Supabase session and guards `/admin` (Next 16 name for middleware).
- `src/lib/supabase/`: env settings and public (no cookies), server (session) and browser clients.
- `src/lib/updates.ts` (types and helpers, safe in client code) and `src/lib/updates-data.ts` (public reads).
- `src/lib/campaign.ts`: live campaign data for public pages. `src/lib/contributions.ts`: contribution types and labels.
- `src/app/admin/(staff)/`: Overview (`page.tsx`), `challenge/`, `contributions/` (list, new, edit, CSV export), `sponsors/`, `settings/`, `updates/`.
- `ContributionReportForm.tsx` + `src/app/actions/contribute.ts`: the public "Record my contribution" form.
- `DailyChallenge.tsx` (+ `ChallengeCountdown.tsx`): the Daily 50K Challenge card (`#challenge`). `src/lib/challenge.ts` (types, dates and the 8pm announcement text; client-safe) and `src/lib/challenge-data.ts` (public read). Admin page: `src/app/admin/(staff)/challenge/`.
- `src/lib/auth.ts`: signed-in staff member and role. `src/lib/resize-image.ts`: canvas resize before upload.
- `supabase/schema.sql`: tables, RLS and the `update-photos` bucket; `supabase/rls-tests.sql`: RLS checks.
- `ui/BrandIcons.tsx`: WhatsApp and Facebook brand marks.
- `ui/CopyButton.tsx`: copy-to-clipboard control for payment details and links.
- `ui/CourtLines.tsx`: court-line background used when no hero photos are configured.
- `ui/Logo.tsx`: configured club badge and name.
- `ui/SampleBadge.tsx`: yellow sample-data labels.
- `ui/SectionHeading.tsx`: shared section heading and intro.
- `ui/VolleyballMark.tsx`: volleyball marker for the progress bar.

## Configuration

Live campaign data (target, raised, payment details, contacts, journey step, sponsors) comes from Supabase via `getCampaign()` in `src/lib/campaign.ts` and is passed to components as props; `src/config/site.ts` holds the fallback values used when Supabase is not configured, plus all static copy. The amount raised is the sum of verified `contributions`, never a typed-in number. Otherwise edit campaign content only in `src/config/site.ts`; do not hard-code figures, payment details, contacts, sponsor tiers, journey steps, or hero-slide data in components. The `isSample` flags control the yellow Sample badges. Progress percentage and remaining amount are derived from `fundraising.target` and `fundraising.raised`. `hero.slides` controls slide order, image `src`, photographer `credit`, and crop `position`; `hero.secondsPerSlide` sets timing. Slide 1 is also the share-preview background. Sponsorship tiers and confirmed sponsors are configured in `sponsorship`.

## Supabase

- Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (see `.env.example`). Without them the site must still build and run.
- Roles live in `profiles` and are read with `public.app_role()` (not `current_role`, a reserved word). `admin` and `secretary` write posts/photos (`can_edit_posts()` in SQL, `canEditPosts()` in `src/lib/auth.ts`); only `admin` writes sponsors; `treasurer` reads.
- Permissions are enforced by RLS in `supabase/schema.sql`; server actions also check the role. Never rely on hiding UI alone.
- Public pages use the cookie-less client so they stay cacheable; every public read is wrapped in try/catch.
- After any post or photo change, call `revalidatePath` for `/`, `/updates` and `/updates/<slug>`. After money, sponsor or settings changes, call `revalidatePath("/", "layout")`.
- Money: `admin` and `treasurer` (`can_manage_money()` / `canManageMoney()`) record and verify; only `admin` deletes and edits `campaign_settings`. The public writes only through `submit_contribution()` (always pending) and reads only `campaign_summary()` and `challenge_summary()`; `anon` has no access to the `contributions` table.
- Daily challenge: settings live in `campaign_settings` (`challenge_*`, `min_contribution`). Each contribution has a `challenge_day` set by the trigger: website entries by submission time with the 8pm cut-off (`challenge_day_for()`), staff entries by `contributed_on`. The public and the secretary read per-day totals and opt-in display names only through `challenge_summary()`; never loosen the contributions RLS for this.
- `getCampaign()` throws at runtime when Supabase is down so ISR keeps the last good page; during `next build` it falls back to site.ts.

## Design Rules

- Use the navy, blue, and gold palette through the existing tokens: `forest`, `club`, `gold`, `mist`, `ink`, `ink-soft`, `line`, `club-tint`, and `gold-tint`.
- Colors and fonts belong only in the `@theme` block of `src/app/globals.css`; reuse the existing tokens.
- Use Barlow Condensed for uppercase display headings and Barlow for body copy. Keep labels sentence-case.
- Use gold calls to action on dark backgrounds and blue calls to action on light backgrounds.
- Keep animation minimal and respect `prefers-reduced-motion`.

## Gotchas

- `src/app/opengraph-image.tsx` uses Satori: do not use CSS `inset`; give multi-child `<div>` elements `display: "flex"`; use template strings for mixed text.
- The logo PNG already has a transparent background; do not add another background behind it.
- Do not modify or regenerate anything in `public/images/`, `src/app/icon.png`, or `src/app/apple-icon.png`.

## Working Rules

- Do not rebuild, scaffold, or rewrite this existing project.
- Do not change dependencies unless explicitly asked; versions are pinned on purpose.
- All content belongs in `src/config/site.ts`; all colors and fonts belong in the CSS `@theme` block and use existing tokens.
- After every code change, run `npm run build` and fix build errors before reporting back.
- Keep changes minimal and list exactly which files changed when a task is complete.