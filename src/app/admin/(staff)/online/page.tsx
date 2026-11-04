import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";
import { canManageMoney, getStaff } from "@/lib/auth";
import { formatDate, formatMoney } from "@/lib/format";
import { onlinePaymentsEnabled, settleToken } from "@/lib/paychangu";
import {
  ConnectButton,
  DeleteTransferButton,
  RecheckButton,
  TestCheckoutButton,
  TransferForm,
} from "@/components/admin/OnlineActions";

type Transfer = { id: string; amount: number; transferred_on: string; reference: string | null; note: string | null };
type OnlineRow = { amount: number; status: string; created_at: string };

/** Online payments: connection, money owed to the club by Travel with Hawkins, and the transfer log. */
export default async function OnlinePaymentsPage() {
  const staff = await getStaff();
  if (!staff?.user || !staff.role) return null;
  if (!canManageMoney(staff.role)) redirect("/admin");
  const admin = staff.role === "admin";
  const enabled = onlinePaymentsEnabled();

  const [{ data: rows }, { data: transfers }, link] = await Promise.all([
    staff.supabase.from("contributions").select("amount, status, created_at").eq("source", "online"),
    staff.supabase.from("paychangu_transfers").select("id, amount, transferred_on, reference, note").order("transferred_on", { ascending: false }),
    enabled ? staff.supabase.rpc("paychangu_link_status", { p_token: settleToken() }) : Promise.resolve({ data: null }),
  ]);
  const online = (rows ?? []) as OnlineRow[];
  const log = (transfers ?? []) as Transfer[];
  const confirmed = online.filter((r) => r.status === "verified");
  const confirmedTotal = confirmed.reduce((sum, r) => sum + Number(r.amount), 0);
  const transferred = log.reduce((sum, t) => sum + Number(t.amount), 0);
  const tenMinutesAgo = Date.now() - 10 * 60_000;
  const waiting = online.filter((r) => r.status === "pending" && new Date(r.created_at).getTime() < tenMinutesAgo).length;
  const linkStatus = link.data as "ok" | "missing" | "different" | null;

  return (
    <>
      <h1 className="font-display text-4xl font-extrabold uppercase leading-none text-forest">Online payments</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Paid on /donate through PayChangu (Travel with Hawkins&apos; merchant account) and confirmed automatically.
      </p>

      {!enabled ? (
        <p className="mt-6 flex gap-2 rounded-2xl bg-gold-tint p-4 text-ink ring-1 ring-gold">
          <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden />
          <span>Not set up: add PAYCHANGU_SECRET_KEY in Vercel and redeploy (see README.md). Until then the website shows the manual payment details only.</span>
        </p>
      ) : linkStatus === "ok" ? (
        <p className="mt-6 flex items-center gap-2 rounded-2xl bg-club-tint p-4 text-sm font-medium text-forest">
          <CheckCircle2 className="size-5 shrink-0 text-club" aria-hidden /> Connected: payments are confirmed automatically.
        </p>
      ) : (
        <div className="mt-6 rounded-2xl bg-gold-tint p-4 text-ink ring-1 ring-gold">
          <p className="flex gap-2">
            <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden />
            <span>
              {linkStatus === "different"
                ? "The PayChangu key has changed. Connect again so payments can be confirmed."
                : linkStatus === "missing"
                  ? "One more step: connect the website to the database so payments can be confirmed."
                  : "Could not check the connection. Has supabase/schema.sql (section 6) been run?"}
              {!admin && " Ask the admin to do this."}
            </span>
          </p>
          {admin && linkStatus && (
            <div className="mt-3">
              <ConnectButton />
            </div>
          )}
        </div>
      )}

      <section aria-labelledby="owed-title" className="mt-6 rounded-2xl bg-forest p-5 text-white sm:p-6">
        <h2 id="owed-title" className="text-sm text-white/75">
          Online payments owed to the club
        </h2>
        <p className="mt-1 font-display text-4xl font-extrabold tabular-nums text-gold sm:text-5xl">
          {formatMoney(confirmedTotal - transferred)}
        </p>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-white/70">Confirmed online</dt>
            <dd className="font-display text-xl font-bold tabular-nums">{formatMoney(confirmedTotal)}</dd>
            <dd className="text-xs text-white/60">{confirmed.length} payments</dd>
          </div>
          <div>
            <dt className="text-white/70">Transferred to the club</dt>
            <dd className="font-display text-xl font-bold tabular-nums">{formatMoney(transferred)}</dd>
            <dd className="text-xs text-white/60">{log.length} transfers</dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-white/60">
          Amounts the supporters paid. PayChangu&apos;s fees are taken from these before Travel with Hawkins receives them.
        </p>
      </section>

      {enabled && (
        <section aria-labelledby="recheck-title" className="mt-6 rounded-2xl bg-white p-5 ring-1 ring-line sm:p-6">
          <h2 id="recheck-title" className="font-display text-2xl font-bold text-forest">
            Payments not confirmed yet
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            {waiting === 0
              ? "None waiting longer than 10 minutes."
              : `${waiting} waiting longer than 10 minutes. Usually the supporter closed the page without paying.`}{" "}
            Re-checking asks PayChangu again; a payment is never counted twice.
          </p>
          <div className="mt-4 flex flex-wrap items-start gap-3">
            <RecheckButton />
            <Link
              href="/admin/contributions?status=all&method=online"
              className="inline-flex items-center gap-1 px-1 py-3 text-sm font-bold text-club hover:underline"
            >
              See online payments <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </section>
      )}

      <section aria-labelledby="transfer-title" className="mt-6 rounded-2xl bg-white p-5 ring-1 ring-line sm:p-6">
        <h2 id="transfer-title" className="font-display text-2xl font-bold text-forest">
          Log a transfer to the club
        </h2>
        <p className="mt-1 mb-4 text-sm text-ink-soft">
          Each time Travel with Hawkins sends the online money to the treasurer, record what arrived.
        </p>
        <TransferForm />

        {log.length > 0 && (
          <ul className="mt-6 divide-y divide-line border-t border-line">
            {log.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="font-display text-xl font-bold tabular-nums text-forest">{formatMoney(Number(t.amount))}</p>
                  <p className="text-sm text-ink-soft">
                    {formatDate(t.transferred_on)}
                    {t.reference && ` · ${t.reference}`}
                    {t.note && ` · ${t.note}`}
                  </p>
                </div>
                {admin && <DeleteTransferButton id={t.id} />}
              </li>
            ))}
          </ul>
        )}
      </section>

      {admin && enabled && (
        <section aria-labelledby="test-title" className="mt-6 rounded-2xl bg-white p-5 ring-1 ring-line sm:p-6">
          <h2 id="test-title" className="font-display text-2xl font-bold text-forest">
            Test (admin only, temporary)
          </h2>
          <p className="mt-1 mb-4 text-sm text-ink-soft">
            Opens a real MWK 200 checkout in your name, with your name kept private. Check that it shows “Karonga Spikers
            Volleyball Club”, then pay or cancel.
          </p>
          <TestCheckoutButton />
        </section>
      )}
    </>
  );
}
