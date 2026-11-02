import Link from "next/link";
import { AlertTriangle, ArrowRight, CalendarDays, CheckCircle2, HandCoins, Newspaper, Plus } from "lucide-react";
import { siteConfig } from "@/config/site";
import { canEditPosts, canManageMoney, getStaff } from "@/lib/auth";
import { formatDate, formatMoney, getProgress } from "@/lib/format";
import { methodLabel, summarise, type Contribution } from "@/lib/contributions";
import type { CampaignSettings } from "@/lib/campaign";

const DAY = 24 * 60 * 60 * 1000;

function daysUntil(isoDate: string) {
  // Midnight in Malawi (UTC+2) on the given date.
  const start = new Date(`${isoDate}T00:00:00+02:00`).getTime();
  return Math.ceil((start - Date.now()) / DAY);
}

function Stat({ label, value, sub, dark = false }: { label: string; value: string; sub?: string; dark?: boolean }) {
  return (
    <div className={`rounded-2xl p-4 ${dark ? "bg-forest text-white" : "bg-white ring-1 ring-line"}`}>
      <dt className={`text-sm ${dark ? "text-white/75" : "text-ink-soft"}`}>{label}</dt>
      <dd className={`mt-1 font-display text-2xl font-bold tabular-nums sm:text-3xl ${dark ? "text-gold" : "text-forest"}`}>
        {value}
      </dd>
      {sub && <dd className={`text-xs ${dark ? "text-white/70" : "text-ink-soft"}`}>{sub}</dd>}
    </div>
  );
}

export default async function OverviewPage() {
  const staff = await getStaff();
  if (!staff?.user || !staff.role) return null;
  const { supabase: db, role } = staff;
  const money = canManageMoney(role);
  const editor = canEditPosts(role);

  const [summaryRes, contributionsRes, postsRes] = await Promise.all([
    db.rpc("campaign_summary"),
    money
      ? db.from("contributions").select("*").order("created_at", { ascending: false }).limit(2000)
      : Promise.resolve({ data: null }),
    db.from("updates").select("id, title, published, created_at").order("created_at", { ascending: false }),
  ]);

  const summary = summaryRes.data as { settings: CampaignSettings; raised: number; contributions: number } | null;
  const contributions = (contributionsRes.data ?? []) as Contribution[];
  const posts = (postsRes.data ?? []) as { id: string; title: string; published: boolean; created_at: string }[];
  const settings = summary?.settings;
  const raised = Number(summary?.raised ?? 0);
  const target = Number(settings?.target ?? siteConfig.fundraising.target);
  const progress = getProgress(raised, target);
  const totals = summarise(contributions);
  const weekAgo = Date.now() - 7 * DAY;
  const thisWeek = contributions
    .filter((c) => c.status === "verified" && c.verified_at && new Date(c.verified_at).getTime() > weekAgo)
    .reduce((sum, c) => sum + Number(c.amount), 0);
  const days = daysUntil(siteConfig.tournament.startsOn);
  const drafts = posts.filter((p) => !p.published);

  const checklist = settings
    ? [
        { done: settings.target_confirmed, label: "Confirm the fundraising target" },
        { done: settings.payments_confirmed, label: "Enter and check the real payment details" },
        { done: settings.contacts_confirmed, label: "Enter the real contact details" },
      ]
    : [];
  const openChecks = checklist.filter((c) => !c.done);

  return (
    <>
      <h1 className="font-display text-4xl font-extrabold uppercase leading-none text-forest">Overview</h1>
      <p className="mt-2 flex items-center gap-1.5 text-sm text-ink-soft">
        <CalendarDays className="size-4" aria-hidden />
        {days > 0
          ? `${days} ${days === 1 ? "day" : "days"} until the ${siteConfig.tournament.name}`
          : days > -3
            ? "The tournament is on now. Good luck, team!"
            : "The tournament has finished."}
      </p>

      {role === "admin" && openChecks.length > 0 && (
        <div className="mt-6 rounded-2xl bg-gold-tint p-5 ring-1 ring-gold">
          <p className="flex items-center gap-2 font-semibold text-ink">
            <AlertTriangle className="size-5 shrink-0" aria-hidden /> Before you share the website
          </p>
          <ul className="mt-3 space-y-1.5">
            {checklist.map((c) => (
              <li key={c.label} className={`flex items-center gap-2 text-sm ${c.done ? "text-ink-soft line-through" : "text-ink"}`}>
                <CheckCircle2 className={`size-4 shrink-0 ${c.done ? "text-club" : "opacity-30"}`} aria-hidden />
                {c.label}
              </li>
            ))}
          </ul>
          <Link href="/admin/settings" className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-forest hover:underline">
            Open settings <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      )}

      <section aria-labelledby="money-title" className="mt-6 rounded-2xl bg-white p-5 ring-1 ring-line sm:p-6">
        <h2 id="money-title" className="sr-only">
          Fundraising
        </h2>
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-sm text-ink-soft">Raised (verified)</p>
            <p className="font-display text-4xl font-extrabold tabular-nums text-forest sm:text-5xl">{formatMoney(raised)}</p>
          </div>
          <p className="font-display text-2xl font-bold text-club">{progress.label}</p>
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-mist ring-1 ring-inset ring-line" aria-hidden>
          <div className="h-full rounded-full bg-gradient-to-r from-forest to-club" style={{ width: `${progress.percent}%` }} />
        </div>
        <p className="mt-2 text-sm text-ink-soft tabular-nums">
          {formatMoney(progress.remaining)} still needed of {formatMoney(target)}
        </p>
      </section>

      <dl className="mt-3 grid grid-cols-2 gap-3">
        {money && (
          <>
            <Stat dark label="Waiting to check" value={String(totals.pending.count)} sub={formatMoney(totals.pending.amount)} />
            <Stat label="Verified this week" value={formatMoney(thisWeek)} />
          </>
        )}
        <Stat label="Contributions" value={String(summary?.contributions ?? 0)} sub="verified" />
        <Stat label="Posts" value={String(posts.length - drafts.length)} sub={`published · ${drafts.length} drafts`} />
      </dl>

      <div className="mt-6 grid gap-2 sm:grid-cols-2">
        {money && (
          <Link
            href={totals.pending.count > 0 ? "/admin/contributions?status=pending" : "/admin/contributions/new"}
            className="flex items-center justify-center gap-2 rounded-lg bg-club px-4 py-3.5 font-bold text-white hover:bg-forest"
          >
            <HandCoins className="size-5" aria-hidden />
            {totals.pending.count > 0 ? `Check ${totals.pending.count} contributions` : "Record a contribution"}
          </Link>
        )}
        {editor && (
          <Link
            href="/admin/updates/new"
            className="flex items-center justify-center gap-2 rounded-lg border border-line bg-white px-4 py-3.5 font-bold text-forest hover:bg-club-tint"
          >
            <Plus className="size-5" aria-hidden /> New post
          </Link>
        )}
      </div>

      {money && contributions.length > 0 && (
        <section aria-labelledby="recent-title" className="mt-8">
          <div className="flex items-baseline justify-between">
            <h2 id="recent-title" className="font-display text-2xl font-bold text-forest">
              Latest contributions
            </h2>
            <Link href="/admin/contributions?status=all" className="text-sm font-semibold text-club hover:underline">
              See all
            </Link>
          </div>
          <ul className="mt-3 divide-y divide-line rounded-2xl bg-white ring-1 ring-line">
            {contributions.slice(0, 5).map((c) => (
              <li key={c.id}>
                <Link href={`/admin/contributions/${c.id}`} className="flex items-center justify-between gap-3 p-4 hover:bg-mist">
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-ink">{c.donor_name}</span>
                    <span className="block text-xs text-ink-soft">
                      {methodLabel(c.method)} · {formatDate(c.contributed_on)}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block font-display text-lg font-bold tabular-nums text-forest">{formatMoney(c.amount)}</span>
                    <span
                      className={`text-xs font-semibold ${
                        c.status === "verified" ? "text-club" : c.status === "pending" ? "text-ink" : "text-ink-soft line-through"
                      }`}
                    >
                      {c.status === "verified" ? "Verified" : c.status === "pending" ? "To check" : "Rejected"}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {editor && drafts.length > 0 && (
        <section aria-labelledby="drafts-title" className="mt-8">
          <h2 id="drafts-title" className="font-display text-2xl font-bold text-forest">
            Drafts
          </h2>
          <ul className="mt-3 space-y-2">
            {drafts.slice(0, 3).map((p) => (
              <li key={p.id}>
                <Link
                  href={`/admin/updates/${p.id}`}
                  className="flex items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-line hover:ring-club"
                >
                  <Newspaper className="size-5 shrink-0 text-club" aria-hidden />
                  <span className="min-w-0 truncate font-semibold text-ink">{p.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
