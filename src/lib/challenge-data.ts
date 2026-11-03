import { cache } from "react";
import { createPublicSupabase } from "@/lib/supabase/public";
import type { Challenge } from "@/lib/challenge";

/** challenge_summary() returns numbers as JSON numbers already; this keeps the types honest. */
export function toChallenge(data: Challenge): Challenge {
  return {
    ...data,
    daily_target: Number(data.daily_target),
    min_amount: Number(data.min_amount),
    days: data.days.map((d) => ({
      ...d,
      raised: Number(d.raised),
      supporters: Number(d.supporters),
      pending: Number(d.pending),
      pending_count: Number(d.pending_count),
    })),
  };
}

/**
 * The daily challenge for the public page, or null without Supabase or before the
 * schema has section 5. Like getCampaign(), it throws on other errors at runtime so
 * Next.js keeps serving the last good page.
 */
export const getChallenge = cache(async (): Promise<Challenge | null> => {
  const db = createPublicSupabase();
  if (!db) return null;
  try {
    const { data, error } = await db.rpc("challenge_summary");
    if (error) {
      if (error.code === "PGRST202") return null; // Function not created yet.
      throw error;
    }
    return data ? toChallenge(data as Challenge) : null;
  } catch (error) {
    console.error("Could not load the daily challenge from Supabase", error);
    if (process.env.NEXT_PHASE === "phase-production-build") return null;
    throw new Error("The daily challenge is temporarily unavailable");
  }
});
