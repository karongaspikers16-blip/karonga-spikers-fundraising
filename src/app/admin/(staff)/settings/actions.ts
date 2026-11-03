"use server";

import { revalidatePath } from "next/cache";
import { siteConfig } from "@/config/site";
import { getStaff } from "@/lib/auth";

export type ActionResult = { ok: true; message: string } | { ok: false; message: string };

const text = (formData: FormData, key: string, max: number) => {
  const value = String(formData.get(key) ?? "").trim();
  return value ? value.slice(0, max) : null;
};

/** Saves the campaign settings. Admin only, here and in RLS. */
export async function saveSettings(_: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const staff = await getStaff();
  if (!staff?.user || staff.role !== "admin") return { ok: false, message: "Only the admin can change settings." };

  const target = Number(String(formData.get("target") ?? "").replace(/[\s,]/g, ""));
  const journeyStep = Number(formData.get("journey_step"));
  const whatsapp = String(formData.get("contact_whatsapp") ?? "").replace(/\D/g, "");
  const facebook = text(formData, "facebook_url", 300);
  const email = text(formData, "contact_email", 120);

  const minContribution = Number(String(formData.get("min_contribution") ?? "").replace(/[\s,]/g, ""));
  const dailyTarget = Number(String(formData.get("challenge_daily_target") ?? "").replace(/[\s,]/g, ""));
  const challengeStart = String(formData.get("challenge_start") ?? "");
  const challengeEnd = String(formData.get("challenge_end") ?? "");
  const cutoff = String(formData.get("challenge_cutoff") ?? "").slice(0, 5);

  if (!Number.isInteger(target) || target <= 0) return { ok: false, message: "Enter the target in whole kwacha." };
  if (!Number.isInteger(minContribution) || minContribution < 1 || minContribution > 1_000_000) {
    return { ok: false, message: "Enter the smallest amount in whole kwacha." };
  }
  if (!Number.isInteger(dailyTarget) || dailyTarget <= 0) return { ok: false, message: "Enter the daily target in whole kwacha." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(challengeStart) || !/^\d{4}-\d{2}-\d{2}$/.test(challengeEnd) || challengeEnd < challengeStart) {
    return { ok: false, message: "Choose the challenge's first and last day (the last day cannot be before the first)." };
  }
  if (!/^\d{2}:\d{2}$/.test(cutoff) || cutoff < "12:00") {
    return { ok: false, message: "Choose a closing time between midday and midnight, e.g. 20:00." };
  }
  if (!Number.isInteger(journeyStep) || journeyStep < 1 || journeyStep > siteConfig.journey.steps.length) {
    return { ok: false, message: "Choose the current journey step." };
  }
  if (whatsapp && (whatsapp.length < 8 || whatsapp.length > 15)) {
    return { ok: false, message: "Enter the WhatsApp number with the country code, e.g. 265991234567." };
  }
  if (facebook && !facebook.startsWith("https://")) return { ok: false, message: "The Facebook link must start with https://" };
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, message: "Check the email address." };

  const fields = {
    target,
    target_confirmed: formData.get("target_confirmed") === "on",
    journey_step: journeyStep,
    airtel_number: text(formData, "airtel_number", 30),
    airtel_name: text(formData, "airtel_name", 120),
    mpamba_number: text(formData, "mpamba_number", 30),
    mpamba_name: text(formData, "mpamba_name", 120),
    bank_name: text(formData, "bank_name", 120),
    bank_account_number: text(formData, "bank_account_number", 40),
    bank_account_name: text(formData, "bank_account_name", 120),
    bank_branch: text(formData, "bank_branch", 120),
    bank_swift: text(formData, "bank_swift", 20),
    payments_confirmed: formData.get("payments_confirmed") === "on",
    contact_phone: text(formData, "contact_phone", 30),
    contact_whatsapp: whatsapp || null,
    contact_email: email,
    facebook_url: facebook,
    contacts_confirmed: formData.get("contacts_confirmed") === "on",
    min_contribution: minContribution,
    challenge_enabled: formData.get("challenge_enabled") === "on",
    challenge_daily_target: dailyTarget,
    challenge_start: challengeStart,
    challenge_end: challengeEnd,
    challenge_cutoff: cutoff,
    challenge_show_pending: formData.get("challenge_show_pending") === "on",
  };

  const { data, error } = await staff.supabase.from("campaign_settings").update(fields).eq("id", 1).select("id").maybeSingle();
  if (error || !data) return { ok: false, message: error ? "Could not save. Check the fields and try again." : "Not allowed." };

  revalidatePath("/", "layout");
  return { ok: true, message: "Saved. The website shows the changes within a minute." };
}
