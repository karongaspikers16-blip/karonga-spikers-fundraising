import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { siteConfig } from "@/config/site";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * PayChangu hosted checkout, server side only. The secret key never leaves the server and is
 * never logged. API: https://developer.paychangu.com/docs/standard-checkout and
 * https://developer.paychangu.com/docs/transaction-verification
 *
 * Every Karonga Spikers payment has tx_ref "KSVC-<uuid>" (made by paychangu_start() in
 * supabase/schema.sql). Travel with Hawkins shares the merchant account and ignores those.
 */

const API = "https://api.paychangu.com";
const secretKey = () => process.env.PAYCHANGU_SECRET_KEY ?? "";

/** True when "Pay online" can be offered: the key is set and Supabase is configured. */
export const onlinePaymentsEnabled = () => Boolean(secretKey()) && isSupabaseConfigured;

export const TX_REF_PREFIX = "KSVC-";
const TX_REF = /^KSVC-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
export const isClubTxRef = (value: unknown): value is string => typeof value === "string" && TX_REF.test(value);

/**
 * Proves to the database that a request comes from this server. Derived from the PayChangu key,
 * so no second secret is needed; the admin stores its hash once (Admin → Online → Connect).
 */
export function settleToken() {
  return createHmac("sha256", secretKey()).update("karonga-spikers:paychangu-settle").digest("hex");
}

function authHeaders() {
  return { Accept: "application/json", Authorization: `Bearer ${secretKey()}` };
}

/** This site's address for PayChangu's callback and return links. */
export async function siteOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return siteConfig.siteUrl;
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

type Checkout = {
  txRef: string;
  amount: number;
  fullName: string;
  email: string | null;
  origin: string;
};

/** Opens a PayChangu checkout and returns its URL. Throws when PayChangu refuses. */
export async function initiateCheckout({ txRef, amount, fullName, email, origin }: Checkout) {
  const [firstName, ...rest] = fullName.trim().split(/\s+/);
  const { onlinePayments } = siteConfig;
  const body = {
    amount,
    currency: "MWK",
    tx_ref: txRef,
    first_name: firstName,
    last_name: rest.join(" ") || firstName,
    // Only when the supporter typed one in.
    ...(email ? { email } : {}),
    callback_url: `${origin}/api/paychangu/callback`,
    return_url: `${origin}/donate/cancelled?tx_ref=${encodeURIComponent(txRef)}`,
    customization: { title: onlinePayments.checkoutTitle, description: onlinePayments.checkoutDescription },
    meta: onlinePayments.meta,
  };

  const res = await fetch(`${API}/payment`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });
  const json = await res.json().catch(() => null);
  const url = json?.data?.checkout_url;
  if (!res.ok || typeof url !== "string" || !url.startsWith("https://")) {
    throw new Error(`PayChangu did not open a checkout (HTTP ${res.status})`);
  }
  return url;
}

export type Verification =
  | { outcome: "success"; amount: number; currency: string; reference: string | null }
  | { outcome: "failed" }
  | { outcome: "pending" };

/** Asks PayChangu what happened to a payment. Anything unclear counts as still pending. */
export async function verifyPayment(txRef: string): Promise<Verification> {
  const res = await fetch(`${API}/verify-payment/${encodeURIComponent(txRef)}`, {
    headers: authHeaders(),
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });
  const json = await res.json().catch(() => null);
  const data = json?.data;
  if (res.ok && json?.status === "success" && data?.tx_ref === txRef && data?.status === "success") {
    return {
      outcome: "success",
      amount: Number(data.amount),
      currency: String(data.currency ?? ""),
      reference: data.reference ? String(data.reference) : null,
    };
  }
  if (data?.tx_ref === txRef && (data?.status === "failed" || data?.status === "cancelled")) return { outcome: "failed" };
  return { outcome: "pending" };
}

/** Any Supabase client: the database checks the token, not who is signed in. */
type Db = Pick<SupabaseClient, "rpc">;

/** What paychangu_settle() returned, or "pending" when PayChangu has no result yet. */
export type SettleResult = "confirmed" | "already" | "failed" | "cancelled" | "ignored" | "mismatch" | "unknown" | "pending";

/**
 * Verifies a payment with PayChangu and records the result. Safe to call any number of times:
 * the database counts a tx_ref once. `ifUnpaid` marks it failed or cancelled when it is not paid.
 */
export async function settlePayment(db: Db, txRef: string, ifUnpaid?: "failed" | "cancelled"): Promise<SettleResult> {
  const result = await verifyPayment(txRef);
  if (result.outcome === "pending" && !ifUnpaid) return "pending";

  const { data, error } = await db.rpc("paychangu_settle", {
    p_token: settleToken(),
    p_tx_ref: txRef,
    ...(result.outcome === "success"
      ? { p_outcome: "success", p_amount: result.amount, p_currency: result.currency, p_reference: result.reference }
      : { p_outcome: result.outcome === "failed" ? "failed" : ifUnpaid }),
  });
  if (error) throw new Error(`Could not record the PayChangu result (${error.code ?? "error"})`);
  return data as SettleResult;
}

/** Marks a payment failed without asking PayChangu, when its checkout never opened. */
export async function markCheckoutFailed(db: Db, txRef: string) {
  await db.rpc("paychangu_settle", { p_token: settleToken(), p_tx_ref: txRef, p_outcome: "failed" });
}
