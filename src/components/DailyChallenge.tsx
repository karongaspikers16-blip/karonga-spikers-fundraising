import { Clock, PartyPopper, Star, Users } from "lucide-react";
import { siteConfig } from "@/config/site";
import { formatMoney } from "@/lib/format";
import {
  challengePhase,
  challengeTitle,
  challengeTotals,
  closesAt,
  cutoffLabel,
  resultTime,
  formatDay,
  shortAmount,
  type Challenge,
} from "@/lib/challenge";
import { ChallengeCountdown } from "@/components/ChallengeCountdown";

/** Today's names shown before the rest are summarised as "and N more". */
const MAX_NAMES = 30;

function DayTiles({ challenge }: { challenge: Challenge }) {
  return (
    <ol className="mt-8 grid grid-cols-4 gap-2 sm:grid-cols-8">
      {challenge.days.map((d, i) => {
        const hit = d.raised >= challenge.daily_target;
        const isToday = d.day === challenge.today;
        const future = d.day > challenge.today;
        return (
          <li
            key={d.day}
            aria-current={isToday ? "date" : undefined}
            className={`rounded-xl px-2 py-2.5 text-center ring-1 ${
              isToday ? "bg-white/10 ring-gold" : "ring-white/15"
            } ${future ? "opacity-55" : ""}`}
          >
            <p className="text-xs font-semibold text-white/70">Day {i + 1}</p>
            <p className="text-sm font-semibold">{formatDay(d.day).replace(/^\w+ /, "")}</p>
            <p className="mt-1 flex items-center justify-center gap-1 font-display text-lg font-bold tabular-nums text-gold">
              {hit && <Star className="size-4 fill-gold" aria-label="Target reached" />}
              {future ? <span className="text-sm font-semibold text-white/60">Soon</span> : shortAmount(d.raised)}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

/** The daily challenge card on the homepage (#challenge). Only verified money counts. */
export function DailyChallenge({ challenge }: { challenge: Challenge }) {
  const phase = challengePhase(challenge);
  const target = challenge.daily_target;
  const title = challengeTitle(target);
  const cutoff = cutoffLabel(challenge.cutoff);
  const index = challenge.days.findIndex((d) => d.day === challenge.today);
  const today = challenge.days[index];
  const totals = challengeTotals(challenge);

  return (
    <section id="challenge" aria-labelledby="challenge-title" className="px-5 pt-14 sm:pt-20">
      <div className="mx-auto max-w-6xl rounded-2xl bg-forest p-6 text-white sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-wide text-gold">
          {phase === "running" && today
            ? `Day ${index + 1} of ${challenge.days.length} · ${formatDay(today.day)}`
            : phase === "before"
              ? `Starts ${formatDay(challenge.start)}`
              : "Challenge complete"}
        </p>
        <h2 id="challenge-title" className="mt-1 font-display text-4xl font-extrabold uppercase leading-none sm:text-5xl">
          {title}
        </h2>
        <p className="mt-3 max-w-2xl text-lg text-white/85">
          Join with as little as <strong className="text-gold">{formatMoney(challenge.min_amount)}</strong>, the price of a
          drink. Every day is a fresh chance to raise {formatMoney(target)}, and we share the result {resultTime(challenge.cutoff)}.
        </p>

        {phase === "running" && today && <Today challenge={challenge} day={today} cutoff={cutoff} />}

        {phase === "after" && (
          <p className="mt-6 font-display text-2xl font-bold">
            {formatMoney(totals.raised)} raised over {challenge.days.length} days, with the target reached on{" "}
            {totals.daysHit} {totals.daysHit === 1 ? "day" : "days"}. Thank you, everyone!
          </p>
        )}

        <DayTiles challenge={challenge} />
        <p className="mt-6 text-sm text-white/70">{siteConfig.challenge.tagline}</p>
      </div>
    </section>
  );
}

function Today({ challenge, day, cutoff }: { challenge: Challenge; day: Challenge["days"][number]; cutoff: string }) {
  const target = challenge.daily_target;
  const hit = day.raised >= target;
  const verifiedWidth = Math.min(100, (day.raised / target) * 100);
  const pendingWidth = Math.min(100 - verifiedWidth, (day.pending / target) * 100);

  return (
    <>
      <div className="mt-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-1">
        <p>
          <span className="block font-display text-[clamp(2.75rem,8vw,4.5rem)] font-extrabold leading-none tabular-nums text-gold">
            {formatMoney(day.raised)}
          </span>
          <span className="text-white/80">raised today of {formatMoney(target)}</span>
        </p>
        <p className="pb-1 font-display text-2xl font-bold">
          {hit ? (
            <span className="inline-flex items-center gap-2">
              <PartyPopper className="size-6 text-gold" aria-hidden /> Target reached!
            </span>
          ) : (
            `Only ${formatMoney(target - day.raised)} to go before ${cutoff}`
          )}
        </p>
      </div>

      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(verifiedWidth)}
        aria-valuetext={`${formatMoney(day.raised)} of ${formatMoney(target)} checked today`}
        className="mt-5 flex h-4 overflow-hidden rounded-full bg-white/10"
      >
        <div className="h-full bg-gold" style={{ width: `${verifiedWidth}%` }} />
        {pendingWidth > 0 && <div className="h-full bg-gold/35" style={{ width: `${pendingWidth}%` }} />}
      </div>
      {day.pending > 0 && (
        <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/75">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-3 rounded-full bg-gold" aria-hidden /> Checked
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-3 rounded-full bg-gold/35" aria-hidden /> Reported, being checked (
            {day.pending_count})
          </span>
        </p>
      )}

      <p className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-white/85">
        <span className="inline-flex items-center gap-1.5">
          <Clock className="size-4 text-gold" aria-hidden />
          <ChallengeCountdown closesAt={closesAt(day.day, challenge.cutoff)} label={cutoff} />
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Users className="size-4 text-gold" aria-hidden />
          {day.supporters} {day.supporters === 1 ? "supporter" : "supporters"} today
        </span>
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <a
          href="#donate"
          className="inline-flex items-center justify-center rounded-lg bg-gold px-6 py-3.5 text-lg font-bold text-forest transition-colors hover:bg-white"
        >
          Give from {formatMoney(challenge.min_amount)}
        </a>
        <a
          href="#report"
          className="inline-flex items-center justify-center rounded-lg border border-white/30 px-6 py-3.5 text-lg font-bold text-white transition-colors hover:bg-white/10"
        >
          Record my contribution
        </a>
      </div>

      {day.names.length > 0 && (
        <div className="mt-8 border-t border-white/15 pt-6">
          <h3 className="font-display text-xl font-bold">Thank you today</h3>
          <ul className="mt-3 flex flex-wrap gap-2">
            {day.names.slice(-MAX_NAMES).reverse().map((name) => (
              <li key={name} className="rounded-full bg-white/10 px-3 py-1 text-sm font-semibold">
                {name}
              </li>
            ))}
            {day.names.length > MAX_NAMES && (
              <li className="px-3 py-1 text-sm font-semibold text-white/70">and {day.names.length - MAX_NAMES} more</li>
            )}
          </ul>
        </div>
      )}
    </>
  );
}
