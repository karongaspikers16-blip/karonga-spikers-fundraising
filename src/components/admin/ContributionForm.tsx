"use client";

import { useActionState, useState } from "react";
import type { ContributionMethod } from "@/config/site";
import {
  CONTRIBUTION_METHODS,
  CONTRIBUTION_STATUSES,
  methodLabel,
  statusLabels,
  todayInMalawi,
  type Contribution,
  type ContributionStatus,
} from "@/lib/contributions";
import { saveContribution } from "@/app/admin/(staff)/contributions/actions";

const field =
  "mt-1.5 block w-full rounded-lg border border-line bg-white px-3.5 py-3 text-base text-ink focus:border-club focus:outline-none";

/** Add or edit a contribution. New entries made by staff default to Verified. */
export function ContributionForm({ contribution }: { contribution?: Contribution }) {
  const [state, action, pending] = useActionState(saveContribution, null);
  // Controlled fields: React resets uncontrolled ones after every form action.
  const [values, setValues] = useState({
    donor_name: contribution?.donor_name ?? "",
    amount: contribution ? String(contribution.amount) : "",
    method: (contribution?.method ?? "airtel_money") as ContributionMethod,
    reference: contribution?.reference ?? "",
    contributed_on: contribution?.contributed_on ?? todayInMalawi(),
    donor_phone: contribution?.donor_phone ?? "",
    status: (contribution?.status ?? "verified") as ContributionStatus,
    show_name: contribution?.show_name ?? false,
    display_name: contribution?.display_name ?? "",
    note: contribution?.note ?? "",
  });
  const set = <K extends keyof typeof values>(key: K, value: (typeof values)[K]) =>
    setValues((v) => ({ ...v, [key]: value }));
  const needsReference = ["airtel_money", "tnm_mpamba", "bank"].includes(values.method);

  return (
    <form action={action} className="space-y-5 rounded-2xl bg-white p-5 ring-1 ring-line sm:p-6">
      {contribution && <input type="hidden" name="id" value={contribution.id} />}

      <label className="block">
        <span className="text-sm font-semibold text-ink">Donor name</span>
        <input
          name="donor_name"
          required
          maxLength={120}
          value={values.donor_name}
          onChange={(e) => set("donor_name", e.target.value)}
          className={field}
        />
      </label>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-semibold text-ink">Amount (MWK)</span>
          <input
            name="amount"
            required
            inputMode="numeric"
            value={values.amount}
            onChange={(e) => set("amount", e.target.value)}
            placeholder="e.g. 25,000"
            className={`${field} tabular-nums`}
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-ink">Date paid</span>
          <input
            name="contributed_on"
            type="date"
            required
            value={values.contributed_on}
            onChange={(e) => set("contributed_on", e.target.value)}
            className={field}
          />
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-semibold text-ink">Paid with</span>
          <select
            name="method"
            value={values.method}
            onChange={(e) => set("method", e.target.value as ContributionMethod)}
            className={field}
          >
            {CONTRIBUTION_METHODS.map((m) => (
              <option key={m} value={m}>
                {methodLabel(m)}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-ink">
            Transaction ID {!needsReference && <span className="font-normal text-ink-soft">(optional)</span>}
          </span>
          <input
            name="reference"
            maxLength={80}
            required={needsReference && !contribution}
            value={values.reference}
            onChange={(e) => set("reference", e.target.value)}
            className={field}
          />
        </label>
      </div>

      <label className="block">
        <span className="text-sm font-semibold text-ink">
          Phone <span className="font-normal text-ink-soft">(optional, private)</span>
        </span>
        <input
          name="donor_phone"
          type="tel"
          maxLength={30}
          value={values.donor_phone}
          onChange={(e) => set("donor_phone", e.target.value)}
          className={field}
        />
      </label>

      <label className="block">
        <span className="text-sm font-semibold text-ink">Status</span>
        <select
          name="status"
          value={values.status}
          onChange={(e) => set("status", e.target.value as ContributionStatus)}
          className={field}
        >
          {CONTRIBUTION_STATUSES.map((s) => (
            <option key={s} value={s}>
              {statusLabels[s]}
            </option>
          ))}
        </select>
        <span className="mt-1 block text-xs text-ink-soft">Only verified contributions count towards the public total.</span>
      </label>

      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          name="show_name"
          checked={values.show_name}
          onChange={(e) => set("show_name", e.target.checked)}
          className="mt-1 size-5 accent-club"
        />
        <span className="text-ink">Show the name on the public supporters list (never the amount)</span>
      </label>

      <label className="block">
        <span className="text-sm font-semibold text-ink">
          Name to show <span className="font-normal text-ink-soft">(optional, e.g. “Chikondi M.”)</span>
        </span>
        <input
          name="display_name"
          maxLength={60}
          value={values.display_name}
          onChange={(e) => set("display_name", e.target.value)}
          className={field}
        />
      </label>

      <label className="block">
        <span className="text-sm font-semibold text-ink">
          Note <span className="font-normal text-ink-soft">(private, staff only)</span>
        </span>
        <textarea
          name="note"
          rows={2}
          maxLength={500}
          value={values.note}
          onChange={(e) => set("note", e.target.value)}
          className={field}
        />
      </label>

      {contribution?.message && (
        <p className="rounded-lg bg-mist p-3 text-sm text-ink">
          <span className="font-semibold">Message from the donor:</span> {contribution.message}
        </p>
      )}

      {state && !state.ok && (
        <p role="alert" className="rounded-lg bg-gold-tint px-3.5 py-2.5 text-sm font-medium text-ink">
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-club px-5 py-3.5 text-base font-bold text-white transition-colors hover:bg-forest disabled:opacity-60"
      >
        {pending ? "Saving…" : contribution ? "Save changes" : "Record contribution"}
      </button>
    </form>
  );
}
