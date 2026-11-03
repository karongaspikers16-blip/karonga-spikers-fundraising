import { siteConfig } from "@/config/site";
import { formatMoney, getProgress } from "@/lib/format";

/** One day of the daily challenge, as returned by challenge_summary() in supabase/schema.sql. */
export type ChallengeDay = {
  /** YYYY-MM-DD */
  day: string;
  /** Verified money for the day. */
  raised: number;
  /** Different people with verified gifts that day. */
  supporters: number;
  /** Reported but not yet checked (0 when the admin hides it). */
  pending: number;
  pending_count: number;
  /** Opt-in display names, in the order they were verified. */
  names: string[];
};

export type Challenge = {
  enabled: boolean;
  daily_target: number;
  start: string;
  end: string;
  /** "20:00" */
  cutoff: string;
  min_amount: number;
  /** The challenge day it is right now (after the cut-off, tomorrow's). */
  today: string;
  days: ChallengeDay[];
};

/** 50000 -> "50K", 1500 -> "1.5K", 1000000 -> "1M". */
export function shortAmount(amount: number) {
  if (amount >= 1_000_000) return `${+(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${+(amount / 1_000).toFixed(1)}K`;
  return String(amount);
}

/** "Daily 50K Challenge" */
export function challengeTitle(dailyTarget: number) {
  return `Daily ${shortAmount(dailyTarget)} Challenge`;
}

/** A cut-off of "24:00" means each day runs until midnight. */
export function isMidnight(cutoff: string) {
  return cutoff >= "24:00";
}

/** "20:00" -> "8pm", "20:30" -> "8:30pm", "24:00" -> "midnight". */
export function cutoffLabel(cutoff: string) {
  if (isMidnight(cutoff)) return "midnight";
  const [h, m] = cutoff.split(":").map(Number);
  const hour = h % 12 || 12;
  return `${hour}${m ? `:${String(m).padStart(2, "0")}` : ""}${h < 12 ? "am" : "pm"}`;
}

const dayFormat = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

/** "2026-11-03" -> "Tue 3 Nov". */
export function formatDay(day: string) {
  return dayFormat.format(new Date(`${day}T00:00:00Z`));
}

/** Whole days from one YYYY-MM-DD date to another. */
export function daysBetween(from: string, to: string) {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

/** "2026-11-03", 1 -> "2026-11-04". */
export function addDays(day: string, days: number) {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** When a challenge day closes, as an ISO time (Malawi is UTC+2 all year). */
export function closesAt(day: string, cutoff: string) {
  return isMidnight(cutoff) ? `${addDays(day, 1)}T00:00:00+02:00` : `${day}T${cutoff}:00+02:00`;
}

/** When the day's result is posted: "at 8pm", or the next morning when days run to midnight. */
export function resultTime(cutoff: string) {
  return isMidnight(cutoff) ? "first thing the next morning" : `at ${cutoffLabel(cutoff)}`;
}

/** The day that closed in the last 12 hours, if any: that is the result the secretary posts. */
export function justClosedDay(challenge: Challenge, now = Date.now()) {
  const previous = addDays(challenge.today, -1);
  if (!challenge.days.some((d) => d.day === previous)) return null;
  return now - Date.parse(closesAt(previous, challenge.cutoff)) < 12 * 3_600_000 ? previous : null;
}

export function challengePhase(challenge: Challenge): "before" | "running" | "after" {
  if (challenge.today < challenge.start) return "before";
  if (challenge.today > challenge.end) return "after";
  return "running";
}

/** The day to show by default: today while running, otherwise the first or last day. */
export function defaultDay(challenge: Challenge) {
  const phase = challengePhase(challenge);
  return phase === "running" ? challenge.today : phase === "before" ? challenge.start : challenge.end;
}

/** Days that reached the target, and the challenge totals so far. */
export function challengeTotals(challenge: Challenge) {
  return challenge.days.reduce(
    (t, d) => ({
      raised: t.raised + d.raised,
      daysHit: t.daysHit + (d.raised >= challenge.daily_target ? 1 : 0),
    }),
    { raised: 0, daysHit: 0 },
  );
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

type AnnouncementInput = {
  challenge: Challenge;
  day: string;
  /** All verified money so far, and the overall target. */
  overall: { raised: number; target: number };
};

/**
 * The daily result post for WhatsApp and Facebook (*bold* is WhatsApp formatting). Before the
 * cut-off it reads as a "so far today" update. Celebrates givers; never shames anyone.
 */
export function buildAnnouncement({ challenge, day, overall }: AnnouncementInput) {
  const index = challenge.days.findIndex((d) => d.day === day);
  const d = challenge.days[index];
  if (!d) return "";

  const target = challenge.daily_target;
  const short = shortAmount(target);
  const open = day === challenge.today;
  const lastDay = index === challenge.days.length - 1;
  const people = plural(d.supporters, "supporter");
  const lines = [`🏐 *${challengeTitle(target).toUpperCase()} · DAY ${index + 1} OF ${challenge.days.length}* (${formatDay(day)})`, ""];

  if (d.raised >= target) {
    lines.push(
      open
        ? `🎉 We have already hit ${short} today! *${formatMoney(d.raised)}* from *${people}*. Every extra kwacha brings Mzuzu closer.`
        : `🎉 WE DID IT! *${formatMoney(d.raised)}* raised today from *${people}*. Target smashed!`,
    );
  } else if (open) {
    lines.push(
      d.supporters > 0 ? `So far today: *${formatMoney(d.raised)}* from *${people}*.` : `Day ${index + 1} has started!`,
      `⏳ *${formatMoney(target - d.raised)}* to go before ${cutoffLabel(challenge.cutoff)}!`,
    );
  } else if (d.supporters > 0) {
    lines.push(
      `💪 *${formatMoney(d.raised)}* raised today from *${people}*. Thank you!`,
      ...(lastDay ? [] : [`Tomorrow we go for ${short} again!`]),
    );
  } else {
    lines.push(lastDay ? "The challenge is complete." : `Tomorrow is a fresh chance to hit ${short}!`);
  }

  const progress = getProgress(overall.raised, overall.target);
  lines.push("", `📊 Running total: *${formatMoney(overall.raised)}* of ${formatMoney(overall.target)} (${progress.label})`);
  const untilTravel = daysBetween(day, siteConfig.challenge.travelsOn);
  if (untilTravel > 0) lines.push(`🚌 ${plural(untilTravel, "day")} until we travel to Mzuzu.`);

  if (d.names.length > 0) {
    lines.push("", "🙏 *Thank you to:*", d.names.join(", "));
    if (d.supporters > d.names.length) lines.push("…and everyone who gave without being named.");
  } else if (d.supporters > 0) {
    lines.push("", "🙏 Thank you to everyone who gave today!");
  }

  const url = `${siteConfig.siteUrl}/#challenge`;
  lines.push(
    "",
    lastDay && !open
      ? `Thank you for every kwacha. Next stop: Mzuzu! ${siteConfig.siteUrl}`
      : `Every kwacha counts. Join ${open ? "today's" : "tomorrow's"} challenge from ${formatMoney(challenge.min_amount)}: ${url}`,
    "",
    siteConfig.challenge.signOff,
  );
  return lines.join("\n");
}
