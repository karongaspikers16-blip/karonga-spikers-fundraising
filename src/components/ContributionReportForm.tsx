"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import { reportContribution } from "@/app/actions/contribute";

type Props = {
  /** Payment methods shown on the page, e.g. [{ value: "airtel_money", label: "Airtel Money" }]. */
  methods: { value: string; label: string }[];
};

const field =
  "mt-1.5 block w-full rounded-lg border border-white/20 bg-white/[0.08] px-3.5 py-3 text-base text-white placeholder:text-white/40 focus:border-gold focus:outline-none";

/** "I have sent money" form: the treasurer checks each one before it counts towards the total. */
export function ContributionReportForm({ methods }: Props) {
  const [state, action, pending] = useActionState(reportContribution, null);

  if (state?.ok) {
    return (
      <div role="status" className="flex gap-3">
        <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-gold" aria-hidden />
        <div>
          <p className="font-display text-2xl font-bold">Thank you{state.name ? `, ${state.name}` : ""}!</p>
          <p className="mt-1 text-white/80">
            We have your details. Your contribution is added to the total as soon as our treasurer has checked it.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <label className="block">
        <span className="text-sm font-semibold">Your name</span>
        <input name="name" required maxLength={120} autoComplete="name" className={field} />
      </label>
      <label className="block">
        <span className="text-sm font-semibold">Amount (MWK)</span>
        <input name="amount" required inputMode="numeric" pattern="[0-9 ,]*" placeholder="e.g. 10,000" className={field} />
      </label>
      <label className="block">
        <span className="text-sm font-semibold">Paid with</span>
        <select name="method" required defaultValue={methods[0]?.value} className={`${field} [&>option]:text-ink`}>
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
          placeholder="From your confirmation SMS"
          className={field}
        />
      </label>
      <label className="block sm:col-span-2">
        <span className="text-sm font-semibold">
          Phone number <span className="font-normal text-white/60">(optional, so we can thank you; never shown)</span>
        </span>
        <input name="phone" type="tel" maxLength={30} autoComplete="tel" className={field} />
      </label>
      {/* Hidden from people; catches bots that fill in every field. */}
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />

      <label className="flex items-start gap-3 sm:col-span-2">
        <input name="show_name" type="checkbox" defaultChecked className="mt-1 size-5 accent-gold" />
        <span className="text-white/85">Show my name on the supporters list (the amount is never shown).</span>
      </label>

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
        {pending ? "Sending…" : "Send my details"}
      </button>
    </form>
  );
}
