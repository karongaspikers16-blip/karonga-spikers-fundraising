"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import { reportContribution } from "@/app/actions/contribute";
import { formatMoney } from "@/lib/format";

type Props = {
  /** Payment methods shown on the page, e.g. [{ value: "airtel_money", label: "Airtel Money" }]. */
  methods: { value: string; label: string }[];
  /** Smallest amount accepted (also enforced in the database). */
  minAmount: number;
};

const field =
  "mt-1.5 block w-full rounded-lg border border-white/20 bg-white/[0.08] px-3.5 py-3 text-base text-white placeholder:text-white/40 focus:border-gold focus:outline-none";

/** "Record my contribution" form: the treasurer checks each one before it counts towards the total. */
export function ContributionReportForm({ methods, minAmount }: Props) {
  const [state, action, pending] = useActionState(reportContribution, null);
  // Shown again after an error; the key remounts the fields so React does not clear them.
  const typed = state && !state.ok ? state.values : null;

  if (state?.ok) {
    return (
      <div role="status" className="flex gap-3">
        <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-gold" aria-hidden />
        <div>
          <p className="font-display text-2xl font-bold">Thank you{state.name ? `, ${state.name}` : ""}!</p>
          <p className="mt-1 text-white/80">
            We have your details. Your contribution counts as soon as our treasurer has checked it, usually the same
            evening. Every kwacha counts!
          </p>
        </div>
      </div>
    );
  }

  return (
    <form key={state && !state.ok ? state.attempt : 0} action={action} className="grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="min" value={minAmount} />
      <label className="block">
        <span className="text-sm font-semibold">Your full name</span>
        <input name="name" required maxLength={120} autoComplete="name" defaultValue={typed?.name} className={field} />
      </label>
      <label className="block">
        <span className="text-sm font-semibold">Amount (MWK)</span>
        <input
          name="amount"
          required
          inputMode="numeric"
          defaultValue={typed?.amount}
          pattern="[0-9 ,]*"
          placeholder={`From ${formatMoney(minAmount)}`}
          className={field}
        />
      </label>
      <label className="block">
        <span className="text-sm font-semibold">Paid with</span>
        <select name="method" required defaultValue={typed?.method || methods[0]?.value} className={`${field} [&>option]:text-ink`}>
          {methods.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="text-sm font-semibold">Transaction ID</span>
        <input
          name="reference"
          required
          minLength={4}
          maxLength={80}
          defaultValue={typed?.reference}
          placeholder="From your confirmation SMS"
          className={field}
        />
      </label>
      <label className="block sm:col-span-2">
        <span className="text-sm font-semibold">
          Phone number <span className="font-normal text-white/60">(optional, never shown)</span>
        </span>
        <input name="phone" type="tel" maxLength={30} defaultValue={typed?.phone} autoComplete="tel" className={field} />
      </label>
      {/* Hidden from people; catches bots that fill in every field. */}
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />

      <fieldset className="space-y-3 rounded-xl bg-white/[0.05] p-4 ring-1 ring-white/15 sm:col-span-2">
        <legend className="sr-only">Being thanked by name</legend>
        <label className="flex items-start gap-3">
          <input name="show_name" type="checkbox" defaultChecked={typed?.show_name} className="mt-1 size-5 accent-gold" />
          <span className="text-white/85">
            Thank me by name on the website and in the daily announcement. The amount is never shown.
          </span>
        </label>
        <label className="block">
          <span className="text-sm font-semibold">
            Name to show <span className="font-normal text-white/60">(optional, e.g. “Chikondi M.”)</span>
          </span>
          <input name="display_name" maxLength={60} defaultValue={typed?.display_name} className={field} />
          <span className="mt-1 block text-xs text-white/60">Leave empty to use your full name.</span>
        </label>
      </fieldset>

      {state && !state.ok && (
        <p role="alert" className="rounded-lg bg-gold-tint px-3.5 py-2.5 text-sm font-medium text-ink sm:col-span-2">
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-gold px-6 py-3.5 text-base font-bold text-forest transition-colors hover:bg-white disabled:opacity-60 sm:col-span-2 sm:justify-self-start"
      >
        {pending ? "Sending…" : "Record my contribution"}
      </button>
    </form>
  );
}
