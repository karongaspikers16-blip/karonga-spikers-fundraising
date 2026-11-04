"use client";

import { useActionState, useState, useTransition } from "react";
import { CreditCard, Link2, RefreshCw, Trash2 } from "lucide-react";
import { todayInMalawi } from "@/lib/contributions";
import {
  connectOnlinePayments,
  deleteTransfer,
  logTransfer,
  recheckOnlinePayments,
  startTestCheckout,
  type OnlineResult,
} from "@/app/admin/(staff)/online/actions";

const field =
  "mt-1.5 block w-full rounded-lg border border-line bg-white px-3.5 py-3 text-base text-ink focus:border-club focus:outline-none";

function Message({ result }: { result: OnlineResult }) {
  if (!result) return null;
  return (
    <p
      role={result.ok ? "status" : "alert"}
      className={`mt-2 rounded-lg px-3.5 py-2.5 text-sm font-medium ${result.ok ? "bg-club-tint text-forest" : "bg-gold-tint text-ink"}`}
    >
      {result.message}
    </p>
  );
}

/** A button that runs one server action and shows its message. */
function ActionButton({
  run,
  icon,
  label,
  busy,
  primary = false,
  confirmText,
}: {
  run: () => Promise<OnlineResult>;
  icon: React.ReactNode;
  label: string;
  busy: string;
  primary?: boolean;
  confirmText?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<OnlineResult>(null);
  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (confirmText && !window.confirm(confirmText)) return;
          startTransition(async () => setResult(await run()));
        }}
        className={`inline-flex items-center gap-2 rounded-lg px-4 py-3 font-bold disabled:opacity-60 ${
          primary ? "bg-club text-white hover:bg-forest" : "border border-line bg-white text-forest hover:bg-club-tint"
        }`}
      >
        {icon} {pending ? busy : label}
      </button>
      <Message result={result} />
    </div>
  );
}

export function ConnectButton() {
  return (
    <ActionButton
      primary
      run={connectOnlinePayments}
      icon={<Link2 className="size-5" aria-hidden />}
      label="Connect online payments"
      busy="Connecting…"
    />
  );
}

export function RecheckButton() {
  return (
    <ActionButton
      run={recheckOnlinePayments}
      icon={<RefreshCw className="size-5" aria-hidden />}
      label="Re-check pending online payments"
      busy="Asking PayChangu…"
    />
  );
}

export function TestCheckoutButton() {
  return (
    <ActionButton
      run={startTestCheckout}
      icon={<CreditCard className="size-5" aria-hidden />}
      label="Create MWK 200 test checkout"
      busy="Opening PayChangu…"
      confirmText="This opens a real PayChangu checkout for MWK 200. If you pay, it counts as a real contribution. Continue?"
    />
  );
}

export function DeleteTransferButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      aria-label="Delete this transfer"
      onClick={() => {
        if (!window.confirm("Delete this transfer from the log?")) return;
        startTransition(async () => {
          const result = await deleteTransfer(id);
          if (!result?.ok) window.alert(result?.message ?? "Could not delete.");
        });
      }}
      className="grid size-9 place-items-center rounded-lg text-ink-soft hover:bg-gold-tint hover:text-ink disabled:opacity-60"
    >
      <Trash2 className="size-4" aria-hidden />
    </button>
  );
}

/** The treasurer logs each transfer from Travel with Hawkins to the club. */
export function TransferForm() {
  const [result, action, pending] = useActionState(logTransfer, null);
  return (
    // A new key after each save empties the form for the next transfer.
    <form key={result?.ok ? result.message : "form"} action={action} className="grid gap-4 sm:grid-cols-2">
      <label className="block">
        <span className="text-sm font-semibold text-ink">Amount received (MWK)</span>
        <input name="amount" required inputMode="numeric" placeholder="e.g. 48,000" className={`${field} tabular-nums`} />
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-ink">Date it arrived</span>
        <input name="transferred_on" type="date" required defaultValue={todayInMalawi()} className={field} />
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-ink">
          Reference <span className="font-normal text-ink-soft">(optional)</span>
        </span>
        <input name="reference" maxLength={80} placeholder="Bank or Airtel Money reference" className={field} />
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-ink">
          Note <span className="font-normal text-ink-soft">(optional)</span>
        </span>
        <input name="note" maxLength={300} placeholder="e.g. payments of 3 to 5 Nov" className={field} />
      </label>
      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-club px-5 py-3 font-bold text-white hover:bg-forest disabled:opacity-60"
        >
          {pending ? "Saving…" : "Log transfer"}
        </button>
        <Message result={result} />
      </div>
    </form>
  );
}
