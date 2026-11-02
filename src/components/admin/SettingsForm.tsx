"use client";

import { useActionState, useState, type ReactNode } from "react";
import { siteConfig } from "@/config/site";
import type { CampaignSettings } from "@/lib/campaign";
import { saveSettings } from "@/app/admin/(staff)/settings/actions";

const field =
  "mt-1.5 block w-full rounded-lg border border-line bg-white px-3.5 py-3 text-base text-ink focus:border-club focus:outline-none";

type Values = Record<string, string | boolean>;

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-4 rounded-2xl bg-white p-5 ring-1 ring-line sm:p-6">
      <legend className="sr-only">{title}</legend>
      <div>
        <h2 className="font-display text-2xl font-bold text-forest">{title}</h2>
        {hint && <p className="mt-1 text-sm text-ink-soft">{hint}</p>}
      </div>
      {children}
    </fieldset>
  );
}

export function SettingsForm({ settings }: { settings: CampaignSettings }) {
  const [state, action, pending] = useActionState(saveSettings, null);
  // Controlled fields: React resets uncontrolled ones after every form action.
  const [values, setValues] = useState<Values>(() =>
    Object.fromEntries(
      Object.entries(settings).map(([k, v]) => [k, typeof v === "boolean" ? v : v === null ? "" : String(v)]),
    ),
  );

  const input = (name: string, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="block">
      <span className="text-sm font-semibold text-ink">{label}</span>
      <input
        name={name}
        value={String(values[name] ?? "")}
        onChange={(e) => setValues((v) => ({ ...v, [name]: e.target.value }))}
        className={field}
        {...props}
      />
    </label>
  );

  const confirm = (name: string, label: string) => (
    <label className="flex items-start gap-3 rounded-xl bg-mist p-3.5 ring-1 ring-line">
      <input
        type="checkbox"
        name={name}
        checked={Boolean(values[name])}
        onChange={(e) => setValues((v) => ({ ...v, [name]: e.target.checked }))}
        className="mt-0.5 size-5 accent-club"
      />
      <span className="text-sm text-ink">
        <span className="font-semibold">{label}</span>
        <span className="block text-ink-soft">Removes the yellow “Sample” badge from this part of the website.</span>
      </span>
    </label>
  );

  return (
    <form action={action} className="space-y-6">
      <Section title="Fundraising" hint="The amount raised is added up from verified contributions automatically.">
        {input("target", "Target (MWK)", { inputMode: "numeric", required: true })}
        <label className="block">
          <span className="text-sm font-semibold text-ink">Where the team is now</span>
          <select
            name="journey_step"
            value={String(values.journey_step)}
            onChange={(e) => setValues((v) => ({ ...v, journey_step: e.target.value }))}
            className={field}
          >
            {siteConfig.journey.steps.map((step, i) => (
              <option key={step.title} value={i + 1}>
                Step {i + 1}: {step.title}
              </option>
            ))}
          </select>
        </label>
        {confirm("target_confirmed", "The target is final")}
      </Section>

      <Section
        title="Payment details"
        hint="Shown to everyone who wants to give. Double-check every digit: money sent to a wrong number cannot be recovered."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {input("airtel_number", "Airtel Money number", { type: "tel", placeholder: "+265 99..." })}
          {input("airtel_name", "Airtel Money registered name")}
          {input("mpamba_number", "TNM Mpamba number", { type: "tel", placeholder: "+265 88..." })}
          {input("mpamba_name", "TNM Mpamba registered name")}
        </div>
        <p className="text-xs text-ink-soft">Leave a number empty to hide that wallet.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {input("bank_name", "Bank")}
          {input("bank_account_number", "Account number", { inputMode: "numeric" })}
          {input("bank_account_name", "Account name")}
          {input("bank_branch", "Branch (optional)")}
          {input("bank_swift", "SWIFT code (optional, for gifts from abroad)")}
        </div>
        <p className="text-xs text-ink-soft">Leave the account number empty to hide the bank card.</p>
        {confirm("payments_confirmed", "These payment details are real and checked")}
      </Section>

      <Section title="Contact details">
        <div className="grid gap-4 sm:grid-cols-2">
          {input("contact_phone", "Phone (as shown)", { type: "tel", placeholder: "+265 99..." })}
          {input("contact_whatsapp", "WhatsApp number (digits, with 265)", { inputMode: "numeric", placeholder: "265991234567" })}
          {input("contact_email", "Email", { type: "email" })}
          {input("facebook_url", "Facebook page link", { type: "url", placeholder: "https://www.facebook.com/..." })}
        </div>
        {confirm("contacts_confirmed", "These contact details are real")}
      </Section>

      {state && (
        <p
          role="status"
          className={`rounded-lg px-3.5 py-2.5 text-sm font-medium ${state.ok ? "bg-club-tint text-forest" : "bg-gold-tint text-ink"}`}
        >
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="sticky bottom-4 w-full rounded-lg bg-club px-5 py-3.5 text-base font-bold text-white shadow-lg transition-colors hover:bg-forest disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}
