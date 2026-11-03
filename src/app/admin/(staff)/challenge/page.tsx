import Link from "next/link";
import { AlertTriangle, Clock, Star } from "lucide-react";
import { siteConfig } from "@/config/site";
import { canManageMoney, getStaff } from "@/lib/auth";
import { formatMoney } from "@/lib/format";
import {
  buildAnnouncement,
  challengeTitle,
  cutoffLabel,
  defaultDay,
  formatDay,
  justClosedDay,
  resultTime,
  type Challenge,
} from "@/lib/challenge";
import { toChallenge } from "@/lib/challenge-data";
import { AnnouncementPanel } from "@/components/admin/AnnouncementPanel";

type Props = { searchParams: Promise<{ day?: string }> };

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-line">
      <dt className="text-sm text-ink-soft">{label}</dt>
      <dd className="mt-1 font-display text-2xl font-bold tabular-nums text-forest sm:text-3xl">{value}</dd>
      {sub && <dd className="text-xs text-ink-soft">{sub}</dd>}
    </div>
  );
}

/** Day-by-day results and the ready-made daily announcement. Every staff role can open it. */
export default async function ChallengePage({ searchParams }: Props) {
  const staff = await getStaff();
  if (!staff?.user || !staff.role) return null;

  const [{ data, error }, { data: summary }] = await Promise.all([
    staff.supabase.rpc("challenge_summary"),
    staff.supabase.rpc("campaign_summary"),
  ]);
  if (error || !data) {
    return (
      <p role="alert" className="rounded-lg bg-gold-tint px-4 py-3 text-ink">
        The challenge could not be loaded. Check your connection and refresh. (New setup? Run supabase/schema.sql.)
      </p>
    );
  }

  const challenge = toChallenge(data as Challenge);
  const { day: requested } = await searchParams;
  // For a while after a day closes, open that day: its result is what gets posted.
  const day = challenge.days.some((d) => d.day === requested)
    ? requested!
    : (justClosedDay(challenge) ?? defaultDay(challenge));
  const index = challenge.days.findIndex((d) => d.day === day);
  const current = challenge.days[index];
  const open = day === challenge.today;
  const cutoff = cutoffLabel(challenge.cutoff);
  const money = canManageMoney(staff.role);
  const overall = {
    raised: Number(summary?.raised ?? 0),
    target: Number(summary?.settings?.target ?? siteConfig.fundraising.target),
  };

  return (
    <>
      <h1 className="font-display text-4xl font-extrabold uppercase leading-none text-forest">
        {challengeTitle(challenge.daily_target)}
      </h1>
      <p className="mt-2 text-sm text-ink-soft">
        Each day closes at {cutoff}. Only verified contributions count. Post the announcement {resultTime(challenge.cutoff)}.
      </p>

      {!challenge.enabled && (
        <p className="mt-6 flex gap-2 rounded-2xl bg-gold-tint p-4 text-ink ring-1 ring-gold">
          <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden />
          <span>
            The challenge is switched off, so it is hidden on the website.{" "}
            {staff.role === "admin" ? (
              <Link href="/admin/settings" className="font-bold text-forest underline">
                Switch it on in Settings
              </Link>
            ) : (
              "Ask the admin to switch it on in Settings."
            )}
          </span>
        </p>
      )}

      {challenge.days.length === 0 || !current ? (
        <p className="mt-6 rounded-2xl bg-white p-6 text-center text-ink-soft ring-1 ring-line">
          No challenge days are set. The admin sets the first and last day in Settings.
        </p>
      ) : (
        <>
          <nav aria-label="Challenge days" className="mt-6 -mx-4 overflow-x-auto px-4">
            <ul className="flex gap-2">
              {challenge.days.map((d, i) => {
                const active = d.day === day;
                return (
                  <li key={d.day} className="shrink-0">
                    <Link
                      href={`/admin/challenge?day=${d.day}`}
                      aria-current={active ? "page" : undefined}
                      className={`flex flex-col items-center rounded-xl px-3 py-2 text-sm font-semibold ${
                        active ? "bg-forest text-white" : "bg-white text-forest ring-1 ring-line hover:bg-club-tint"
                      }`}
                    >
                      <span className="flex items-center gap-1">
                        Day {i + 1}
                        {d.raised >= challenge.daily_target && (
                          <Star className="size-3.5 fill-gold text-gold" aria-label="target reached" />
                        )}
                      </span>
                      <span className={`text-xs ${active ? "text-white/75" : "text-ink-soft"}`}>
                        {d.day === challenge.today ? "Today" : formatDay(d.day).replace(/^\w+ /, "")}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <h2 className="mt-6 font-display text-2xl font-bold text-forest">
            Day {index + 1}: {formatDay(day)}
          </h2>
          <dl className="mt-3 grid grid-cols-2 gap-3">
            <Stat
              label="Raised (verified)"
              value={formatMoney(current.raised)}
              sub={
                current.raised >= challenge.daily_target
                  ? "Target reached!"
                  : `${formatMoney(challenge.daily_target - current.raised)} to go`
              }
            />
            <Stat
              label="Supporters"
              value={String(current.supporters)}
              sub={`${current.names.length} to thank by name`}
            />
          </dl>

          {open && (
            <p className="mt-3 flex gap-2 rounded-2xl bg-club-tint p-4 text-sm text-forest">
              <Clock className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>
                This day is still open until {cutoff}, so the message reads as a “so far today” update. Refresh this page
                after {cutoff} for the final result.
              </span>
            </p>
          )}
          {current.pending_count > 0 && (
            <p className="mt-3 flex gap-2 rounded-2xl bg-gold-tint p-4 text-sm text-ink ring-1 ring-gold">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>
                {current.pending_count} {current.pending_count === 1 ? "entry is" : "entries are"} still waiting to be
                checked, so {current.pending_count === 1 ? "it is" : "they are"} not in the announcement yet.{" "}
                {money ? (
                  <Link href="/admin/contributions?status=pending" className="font-bold text-forest underline">
                    Check them now
                  </Link>
                ) : (
                  "Ask the treasurer to check them before posting."
                )}
              </span>
            </p>
          )}

          <div className="mt-6">
            <AnnouncementPanel text={buildAnnouncement({ challenge, day, overall })} />
          </div>
        </>
      )}
    </>
  );
}
