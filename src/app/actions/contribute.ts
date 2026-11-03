"use server";

import { formatMoney } from "@/lib/format";
import { createPublicSupabase } from "@/lib/supabase/public";

/** What was typed, sent back on an error so the form can show it again. */
export type ReportValues = Record<"name" | "amount" | "method" | "reference" | "school" | "phone" | "display_name", string> & {
  show_name: boolean;
};

export type ReportState =
  | { ok: true; name: string }
  | { ok: false; message: string; values: ReportValues; attempt: number }
  | null;

const METHODS = ["airtel_money", "tnm_mpamba", "bank"] as const;

/** The public "Record my contribution" form. Saved as pending until the treasurer verifies it. */
export async function reportContribution(previous: ReportState, formData: FormData): Promise<ReportState> {
  // Bots fill every field; people never see this one.
  if (String(formData.get("website") ?? "")) return { ok: true, name: "" };

  const get = (key: string) => String(formData.get(key) ?? "").trim();
  const values: ReportValues = {
    name: get("name"),
    amount: get("amount"),
    method: get("method"),
    reference: get("reference"),
    school: get("school"),
    phone: get("phone"),
    display_name: get("display_name"),
    show_name: formData.get("show_name") === "on",
  };
  const attempt = (previous && !previous.ok ? previous.attempt : 0) + 1;
  const fail = (message: string): ReportState => ({ ok: false, message, values, attempt });

  const db = createPublicSupabase();
  if (!db) return fail("This form is not available yet. Please confirm on WhatsApp instead.");

  // Only used for the wording below; the database enforces the real minimum.
  const min = Number(formData.get("min")) || 1;
  const amount = Number(values.amount.replace(/[\s,]/g, ""));

  if (!values.name) return fail("Please enter your name.");
  if (!Number.isInteger(amount) || amount < min) return fail(`Please enter the amount in kwacha, from ${formatMoney(min)}.`);
  if (!METHODS.includes(values.method as (typeof METHODS)[number])) return fail("Choose how you paid.");
  if (values.reference.length < 4) return fail("Please enter the transaction ID from your confirmation message.");

  const { error } = await db.rpc("submit_contribution", {
    p_name: values.name,
    p_phone: values.phone,
    p_amount: amount,
    p_method: values.method,
    p_reference: values.reference,
    p_show_name: values.show_name,
    p_message: "",
    p_display_name: values.display_name,
    p_school: values.school,
  });

  if (error) {
    if (error.message.includes("duplicate_reference")) {
      return fail("This transaction ID has already been sent to us. Thank you!");
    }
    if (error.message.includes("invalid_amount")) return fail(`The smallest amount we can record is ${formatMoney(min)}.`);
    if (error.message.includes("too_many")) {
      return fail("We are receiving a lot of messages. Please try again shortly or use WhatsApp.");
    }
    console.error("Could not save a contribution report", error);
    return fail("Something went wrong. Please try again, or confirm on WhatsApp.");
  }
  return { ok: true, name: values.display_name || values.name };
}
