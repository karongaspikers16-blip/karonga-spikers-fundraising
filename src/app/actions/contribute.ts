"use server";

import { createPublicSupabase } from "@/lib/supabase/public";

export type ReportState = { ok: true; name: string } | { ok: false; message: string } | null;

const METHODS = ["airtel_money", "tnm_mpamba", "bank"] as const;

/** The public "I have sent money" form. Saved as pending until the treasurer verifies it. */
export async function reportContribution(_: ReportState, formData: FormData): Promise<ReportState> {
  // Bots fill every field; people never see this one.
  if (String(formData.get("website") ?? "")) return { ok: true, name: "" };

  const db = createPublicSupabase();
  if (!db) return { ok: false, message: "This form is not available yet. Please confirm on WhatsApp instead." };

  const name = String(formData.get("name") ?? "").trim();
  const amount = Number(String(formData.get("amount") ?? "").replace(/[\s,]/g, ""));
  const method = String(formData.get("method") ?? "");
  const reference = String(formData.get("reference") ?? "").trim();

  if (!name) return { ok: false, message: "Please enter your name." };
  if (!Number.isInteger(amount) || amount < 50) return { ok: false, message: "Please enter the amount in kwacha." };
  if (!METHODS.includes(method as (typeof METHODS)[number])) return { ok: false, message: "Choose how you paid." };
  if (reference.length < 4) {
    return { ok: false, message: "Please enter the transaction ID from your confirmation message." };
  }

  const { error } = await db.rpc("submit_contribution", {
    p_name: name,
    p_phone: String(formData.get("phone") ?? ""),
    p_amount: amount,
    p_method: method,
    p_reference: reference,
    p_show_name: formData.get("show_name") === "on",
    p_message: String(formData.get("message") ?? ""),
  });

  if (error) {
    if (error.message.includes("duplicate_reference")) {
      return { ok: false, message: "This transaction ID has already been sent to us. Thank you!" };
    }
    if (error.message.includes("too_many")) {
      return { ok: false, message: "We are receiving a lot of messages. Please try again shortly or use WhatsApp." };
    }
    console.error("Could not save a contribution report", error);
    return { ok: false, message: "Something went wrong. Please try again, or confirm on WhatsApp." };
  }
  return { ok: true, name };
}
