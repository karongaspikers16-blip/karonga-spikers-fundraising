"use server";

import { redirect } from "next/navigation";
import { siteConfig, type SupporterType } from "@/config/site";
import { formatMoney } from "@/lib/format";
import { createPublicSupabase } from "@/lib/supabase/public";
import { initiateCheckout, markCheckoutFailed, onlinePaymentsEnabled, settleToken, siteOrigin } from "@/lib/paychangu";

/** What was typed, sent back on an error so the form can show it again. */
export type DonateValues = Record<
  "name" | "phone" | "email" | "amount" | "supporter_type" | "organisation" | "show_name" | "message",
  string
>;

export type DonateState = { message: string; values: DonateValues; attempt: number } | null;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_AMOUNT = 10_000_000;

/** /donate: saves a pending online contribution, then sends the supporter to PayChangu's checkout. */
export async function startDonation(previous: DonateState, formData: FormData): Promise<DonateState> {
  const get = (key: string) => String(formData.get(key) ?? "").trim();
  const values: DonateValues = {
    name: get("name"),
    phone: get("phone"),
    email: get("email"),
    amount: get("amount"),
    supporter_type: get("supporter_type"),
    organisation: get("organisation"),
    show_name: get("show_name"),
    message: get("message"),
  };
  const fail = (message: string): DonateState => ({ message, values, attempt: (previous?.attempt ?? 0) + 1 });

  // Bots fill every field; people never see this one.
  if (get("website")) return fail("Something went wrong. Please try again.");

  const db = createPublicSupabase();
  if (!db || !onlinePaymentsEnabled()) {
    return fail("Online payments are not available right now. Please use Airtel Money, TNM Mpamba or the bank details.");
  }

  // The database enforces the real minimum; this is for the wording.
  const min = Number(get("min")) || siteConfig.fundraising.minContribution;
  const amount = Number(values.amount.replace(/[\s,]/g, ""));
  const phoneDigits = values.phone.replace(/\D/g, "");

  if (values.name.length < 2 || values.name.length > 120) return fail("Please enter your full name.");
  if (phoneDigits.length < 9 || phoneDigits.length > 15) return fail("Please enter your phone number.");
  if (values.email && (!EMAIL.test(values.email) || values.email.length > 120)) {
    return fail("Please check your email address, or leave it empty.");
  }
  if (!Number.isInteger(amount) || amount < min) return fail(`Please enter a whole amount in kwacha, from ${formatMoney(min)}.`);
  if (amount > MAX_AMOUNT) return fail(`For more than ${formatMoney(MAX_AMOUNT)}, please use the bank details or contact us.`);
  if (!(values.supporter_type in siteConfig.onlinePayments.supporterTypes)) return fail("Please choose what describes you.");
  if (values.show_name !== "yes" && values.show_name !== "no") return fail("Please choose whether we may thank you by name.");
  if (values.organisation.length > 120 || values.message.length > 300) return fail("Some answers are too long.");

  const { data: txRef, error } = await db.rpc("paychangu_start", {
    p_token: settleToken(),
    p_name: values.name,
    p_phone: values.phone,
    p_email: values.email,
    p_amount: amount,
    p_supporter_type: values.supporter_type as SupporterType,
    p_organisation: values.organisation,
    p_show_name: values.show_name === "yes",
    p_message: values.message,
  });
  if (error || typeof txRef !== "string") {
    if (error?.message.includes("invalid_amount")) return fail(`The smallest amount is ${formatMoney(min)}.`);
    if (error?.message.includes("too_many")) return fail("We are receiving a lot of payments. Please try again in a few minutes.");
    console.error("Could not start an online payment", error?.code ?? "no reference");
    return fail("Online payments are not available right now. Please try again shortly, or use mobile money.");
  }

  let checkoutUrl: string;
  try {
    checkoutUrl = await initiateCheckout({
      txRef,
      amount,
      fullName: values.name,
      email: values.email || null,
      origin: await siteOrigin(),
    });
  } catch (cause) {
    console.error("PayChangu checkout failed", cause instanceof Error ? cause.message : "unknown");
    await markCheckoutFailed(db, txRef).catch(() => {});
    return fail("We could not open the payment page. Please try again, or use mobile money.");
  }

  redirect(checkoutUrl);
}
