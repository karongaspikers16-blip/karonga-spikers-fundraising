"use client";

import { useActionState, useState } from "react";
import { Lock } from "lucide-react";
import { siteConfig } from "@/config/site";
import { formatMoney } from "@/lib/format";
import { startDonation } from "@/app/donate/actions";

const field =
  "mt-1.5 block w-full rounded-lg border border-line bg-white px-3.5 py-3 text-base text-ink focus:border-club focus:outline-none";

/** /donate form. On success the server action sends the supporter to PayChangu's checkout. */
export function DonateForm({ minAmount }: { minAmount: number }) {
  const [state, action, pending] = useActionState(startDonation, null);
  const typed = state?.values;
  const { quickAmounts, supporterTypes, partnerNote } = siteConfig.onlinePayments;
  const [amount, setAmount] = useState(typed?.amount ?? "");
  const shown = Number(amount.replace(/[\s,]/g, ""));

  return (
    // The key remounts the fields after an error so React does not clear what was typed.
    <form key={state?.attempt ?? 0} action={action} className="space-y-5">
      <input type="hidden" name="min" value={minAmount} />

      <fieldset>
        <legend className="text-sm font-semibold text-ink">Amount (MWK)</legend>
        <div className="mt-2 grid grid-cols-2 gap-2 min-[420px]:grid-cols-4">
          {quickAmounts.filter((a) => a >= minAmount).map((a) => (
            <button
              key={a}
              type="button"
              aria-pressed={shown === a}
              onClick={() => setAmount(String(a))}
              className={`rounded-lg px-3 py-3 font-display text-xl font-bold tabular-nums ring-1 transition-colors ${
                shown === a ? "bg-forest text-gold ring-forest" : "bg-white text-forest ring-line hover:bg-club-tint"
              }`}
            >
              {a.toLocaleString("en-US")}
            </button>
          ))}
        </div>
        <label className="mt-3 block">
          <span className="text-sm text-ink-soft">Or type another amount</span>
          <input
            name="amount"
            required
            inputMode="numeric"
            pattern="[0-9 ,]*"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={`From ${formatMoney(minAmount)}`}
            className={`${field} tabular-nums`}
          />
        </label>
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="text-sm font-semibold text-ink">Full name</span>
          <input name="name" required minLength={2} maxLength={120} autoComplete="name" defaultValue={typed?.name} className={field} />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-ink">Phone number</span>
          <input name="phone" type="tel" required maxLength={30} autoComplete="tel" defaultValue={typed?.phone} className={field} />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-ink">
            Email <span className="font-normal text-ink-soft">(optional, for a receipt)</span>
          </span>
          <input name="email" type="email" maxLength={120} autoComplete="email" defaultValue={typed?.email} className={field} />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-ink">I am a</span>
          <select name="supporter_type" required defaultValue={typed?.supporter_type || "supporter"} className={field}>
            {Object.entries(supporterTypes).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-ink">
            School or organisation <span className="font-normal text-ink-soft">(optional)</span>
          </span>
          <input name="organisation" maxLength={120} defaultValue={typed?.organisation} className={field} />
        </label>
      </div>

      <fieldset>
        <legend className="text-sm font-semibold text-ink">Thank me by name publicly?</legend>
        <p className="text-sm text-ink-soft">On the website and in the daily announcement. The amount is never shown.</p>
        <div className="mt-2 flex gap-2">
          {[
            ["yes", "Yes, thank me by name"],
            ["no", "No, keep it private"],
          ].map(([value, label]) => (
            <label
              key={value}
              className="flex flex-1 cursor-pointer items-center gap-2.5 rounded-lg bg-white px-3.5 py-3 ring-1 ring-line has-[:checked]:bg-club-tint has-[:checked]:ring-club"
            >
              <input
                type="radio"
                name="show_name"
                value={value}
                required
                defaultChecked={(typed?.show_name || "no") === value}
                className="size-5 accent-club"
              />
              <span className="text-ink">{label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="block">
        <span className="text-sm font-semibold text-ink">
          Message to the team <span className="font-normal text-ink-soft">(optional)</span>
        </span>
        <textarea name="message" rows={2} maxLength={300} defaultValue={typed?.message} className={field} />
      </label>

      {/* Hidden from people; catches bots that fill in every field. */}
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />

      {state && (
        <p role="alert" className="rounded-lg bg-gold-tint px-3.5 py-2.5 text-sm font-medium text-ink">
          {state.message}
        </p>
      )}

      <div>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-club px-6 py-4 text-lg font-bold text-white transition-colors hover:bg-forest disabled:opacity-60"
        >
          <Lock className="size-5" aria-hidden />
          {pending
            ? "Opening the payment page…"
            : shown >= minAmount
              ? `Pay ${formatMoney(shown)} securely`
              : "Continue to secure payment"}
        </button>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">{partnerNote}</p>
      </div>
    </form>
  );
}
