"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canManageMoney, getStaff } from "@/lib/auth";
import { formatMoney } from "@/lib/format";
import {
  initiateCheckout,
  markCheckoutFailed,
  onlinePaymentsEnabled,
  settlePayment,
  settleToken,
  siteOrigin,
} from "@/lib/paychangu";

// Role checks here mirror the RLS policies and functions in supabase/schema.sql, which are the real guard.

export type OnlineResult = { ok: boolean; message: string } | null;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NOT_SET_UP = "Online payments are not set up: PAYCHANGU_SECRET_KEY is missing on the server.";

/** Admin: lets the database recognise this server (stores a hash of a token made from the PayChangu key). */
export async function connectOnlinePayments(): Promise<OnlineResult> {
  const staff = await getStaff();
  if (!staff?.user || staff.role !== "admin") return { ok: false, message: "Only the admin can connect online payments." };
  if (!onlinePaymentsEnabled()) return { ok: false, message: NOT_SET_UP };

  const { error } = await staff.supabase.rpc("paychangu_link", { p_token: settleToken() });
  if (error) return { ok: false, message: "Could not connect. Has supabase/schema.sql (section 6) been run?" };
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Connected. Online payments can now be confirmed automatically." };
}

/**
 * Asks PayChangu again about online payments still waiting after 10 minutes, and about ones marked
 * cancelled in the last two days (a supporter may have paid after going back). Never counts twice.
 */
export async function recheckOnlinePayments(): Promise<OnlineResult> {
  const staff = await getStaff();
  if (!staff?.user || !canManageMoney(staff.role)) return { ok: false, message: "Only the admin or treasurer can do this." };
  if (!onlinePaymentsEnabled()) return { ok: false, message: NOT_SET_UP };

  const tenMinutesAgo = new Date(Date.now() - 10 * 60_000).toISOString();
  const twoDaysAgo = new Date(Date.now() - 48 * 3_600_000).toISOString();
  const { data, error } = await staff.supabase
    .from("contributions")
    .select("tx_ref")
    .eq("source", "online")
    .or(
      `and(status.eq.pending,created_at.lt.${tenMinutesAgo}),and(status.eq.rejected,paychangu_status.eq.cancelled,created_at.gt.${twoDaysAgo})`,
    )
    .order("created_at", { ascending: true })
    .limit(40);
  if (error) return { ok: false, message: "Could not load online payments. Try again." };

  const counts = { confirmed: 0, failed: 0, waiting: 0, problems: 0 };
  for (const { tx_ref: txRef } of (data ?? []) as { tx_ref: string }[]) {
    try {
      const result = await settlePayment(staff.supabase, txRef);
      if (result === "confirmed") counts.confirmed += 1;
      else if (result === "failed") counts.failed += 1;
      else if (result === "mismatch") counts.problems += 1;
      else counts.waiting += 1;
    } catch {
      counts.problems += 1;
    }
  }

  if (counts.confirmed > 0) revalidatePath("/", "layout");
  revalidatePath("/admin", "layout");
  const checked = (data ?? []).length;
  if (checked === 0) return { ok: true, message: "Nothing to re-check: no online payment has been waiting more than 10 minutes." };
  return {
    ok: counts.problems === 0,
    message:
      `Checked ${checked}: ${counts.confirmed} confirmed, ${counts.failed} failed, ${counts.waiting} not paid yet` +
      (counts.problems ? `, ${counts.problems} need a look (amount differs or PayChangu did not answer).` : "."),
  };
}

/** Admin and treasurer: log money Travel with Hawkins passed on to the club. */
export async function logTransfer(_: OnlineResult, formData: FormData): Promise<OnlineResult> {
  const staff = await getStaff();
  if (!staff?.user || !canManageMoney(staff.role)) return { ok: false, message: "Only the admin or treasurer can log transfers." };

  const amount = Number(String(formData.get("amount") ?? "").replace(/[\s,]/g, ""));
  const transferredOn = String(formData.get("transferred_on") ?? "");
  if (!Number.isInteger(amount) || amount <= 0) return { ok: false, message: "Enter the amount received in whole kwacha." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(transferredOn)) return { ok: false, message: "Enter the date it arrived." };

  const { error } = await staff.supabase.from("paychangu_transfers").insert({
    amount,
    transferred_on: transferredOn,
    reference: String(formData.get("reference") ?? "").trim().slice(0, 80) || null,
    note: String(formData.get("note") ?? "").trim().slice(0, 300) || null,
  });
  if (error) return { ok: false, message: "Could not save. Try again." };
  revalidatePath("/admin", "layout");
  return { ok: true, message: `Logged ${formatMoney(amount)}.` };
}

export async function deleteTransfer(id: string): Promise<OnlineResult> {
  const staff = await getStaff();
  if (!staff?.user || staff.role !== "admin" || !UUID.test(id)) return { ok: false, message: "Only the admin can delete transfers." };
  const { data, error } = await staff.supabase.from("paychangu_transfers").delete().eq("id", id).select("id").maybeSingle();
  if (error || !data) return { ok: false, message: "Could not delete. Try again." };
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Deleted." };
}

/** Admin only, temporary: a real MWK 200 checkout to test the whole flow end to end. */
export async function startTestCheckout(): Promise<OnlineResult> {
  const staff = await getStaff();
  if (!staff?.user || staff.role !== "admin") return { ok: false, message: "Only the admin can start a test checkout." };
  if (!onlinePaymentsEnabled()) return { ok: false, message: NOT_SET_UP };

  const name = staff.name && !staff.name.includes("@") ? staff.name : "Admin test";
  const { data: txRef, error } = await staff.supabase.rpc("paychangu_start", {
    p_token: settleToken(),
    p_name: name,
    p_phone: "",
    p_email: "",
    p_amount: 200,
    p_supporter_type: "other",
    p_organisation: "",
    p_show_name: false,
    p_message: "",
    p_note: "Test checkout from the admin area",
  });
  if (error || typeof txRef !== "string") {
    return {
      ok: false,
      message: error?.message.includes("invalid_amount")
        ? "MWK 200 is below the smallest amount set in Settings."
        : "Could not start. Is online payments connected (button above)?",
    };
  }

  let url: string;
  try {
    url = await initiateCheckout({ txRef, amount: 200, fullName: name, email: null, origin: await siteOrigin() });
  } catch {
    await markCheckoutFailed(staff.supabase, txRef).catch(() => {});
    return { ok: false, message: "PayChangu did not open a checkout. Check that PAYCHANGU_SECRET_KEY is the live key." };
  }
  redirect(url);
}
