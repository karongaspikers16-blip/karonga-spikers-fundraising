import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { createPublicSupabase } from "@/lib/supabase/public";
import { isClubTxRef, onlinePaymentsEnabled, settlePayment, type SettleResult } from "@/lib/paychangu";

// PayChangu sends the supporter here after paying (callback_url), with ?tx_ref=…&status=….
// Nothing in the request is trusted: the payment is confirmed only after our own
// server-side verify call, by paychangu_settle(), which counts each tx_ref once.

export const dynamic = "force-dynamic";

async function handle(request: NextRequest, txRef: unknown, wantsJson: boolean) {
  const back = (path: string) => NextResponse.redirect(new URL(path, request.url), 303);
  if (!isClubTxRef(txRef)) return wantsJson ? NextResponse.json({ ok: true }) : back("/donate");

  const db = createPublicSupabase();
  let result: SettleResult = "pending";
  if (db && onlinePaymentsEnabled()) {
    try {
      result = await settlePayment(db, txRef);
    } catch (error) {
      console.error("PayChangu callback could not settle", error instanceof Error ? error.message : "unknown");
    }
  }
  // Totals, the progress bar, the challenge card and the thank-you names.
  if (result === "confirmed") revalidatePath("/", "layout");

  if (wantsJson) return NextResponse.json({ ok: true });
  const ref = encodeURIComponent(txRef);
  // How many times the thank-you page has re-checked, so it stops after a few.
  const tries = Number(request.nextUrl.searchParams.get("try")) || 0;
  return result === "failed"
    ? back(`/donate/cancelled?tx_ref=${ref}`)
    : back(`/donate/thank-you?tx_ref=${ref}${tries ? `&try=${tries}` : ""}`);
}

export async function GET(request: NextRequest) {
  return handle(request, request.nextUrl.searchParams.get("tx_ref"), false);
}

export async function POST(request: NextRequest) {
  const type = request.headers.get("content-type") ?? "";
  let txRef: unknown = request.nextUrl.searchParams.get("tx_ref");
  try {
    if (type.includes("application/json")) {
      const body = await request.json();
      txRef = body?.tx_ref ?? body?.data?.tx_ref ?? txRef;
    } else if (type.includes("form")) {
      txRef = (await request.formData()).get("tx_ref") ?? txRef;
    }
  } catch {
    // An unreadable body is treated like any unknown payment.
  }
  return handle(request, txRef, type.includes("application/json"));
}
