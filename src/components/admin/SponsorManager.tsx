"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { siteConfig, type TierId } from "@/config/site";
import { deleteSponsor, saveSponsor } from "@/app/admin/(staff)/sponsors/actions";

export type SponsorRow = { id: string; name: string; tier: TierId; confirmed: boolean };

const tierLabel = (tier: TierId) => siteConfig.sponsorship.tiers.find((t) => t.id === tier)?.name ?? tier;
const field =
  "block w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-base text-ink focus:border-club focus:outline-none";

function SponsorFields({ sponsor, onChange }: { sponsor: Omit<SponsorRow, "id">; onChange: (s: Omit<SponsorRow, "id">) => void }) {
  return (
    <>
      <label className="block min-w-0 flex-1">
        <span className="sr-only">Sponsor name</span>
        <input
          name="name"
          required
          maxLength={120}
          placeholder="Sponsor name"
          value={sponsor.name}
          onChange={(e) => onChange({ ...sponsor, name: e.target.value })}
          className={field}
        />
      </label>
      <label className="block">
        <span className="sr-only">Tier</span>
        <select
          name="tier"
          value={sponsor.tier}
          onChange={(e) => onChange({ ...sponsor, tier: e.target.value as TierId })}
          className={field}
        >
          {siteConfig.sponsorship.tiers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm font-semibold text-ink">
        <input
          type="checkbox"
          name="confirmed"
          checked={sponsor.confirmed}
          onChange={(e) => onChange({ ...sponsor, confirmed: e.target.checked })}
          className="size-5 accent-club"
        />
        Confirmed
      </label>
    </>
  );
}

function NewSponsor() {
  const empty = { name: "", tier: "bronze" as TierId, confirmed: true };
  const [state, action, pending] = useActionState(saveSponsor, null);
  const [sponsor, setSponsor] = useState(empty);
  const lastState = useRef(state);

  useEffect(() => {
    if (state !== lastState.current && state?.ok) setSponsor(empty);
    lastState.current = state;
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <form action={action} className="rounded-2xl bg-white p-4 ring-1 ring-line sm:p-5">
      <h2 className="font-display text-2xl font-bold text-forest">Add a sponsor</h2>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <SponsorFields sponsor={sponsor} onChange={setSponsor} />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-lg bg-club px-4 py-2.5 font-bold text-white hover:bg-forest disabled:opacity-60"
        >
          <Plus className="size-5" aria-hidden /> Add
        </button>
      </div>
      {state && (
        <p role="status" className={`mt-3 text-sm font-medium ${state.ok ? "text-forest" : "text-ink"}`}>
          {state.message}
        </p>
      )}
    </form>
  );
}

function SponsorItem({ initial }: { initial: SponsorRow }) {
  const [state, action, pending] = useActionState(saveSponsor, null);
  const [sponsor, setSponsor] = useState(initial);
  const [removing, startRemove] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const changed =
    sponsor.name !== initial.name || sponsor.tier !== initial.tier || sponsor.confirmed !== initial.confirmed;

  return (
    <li>
      <form action={action} className="rounded-2xl bg-white p-4 ring-1 ring-line">
        <input type="hidden" name="id" value={initial.id} />
        <div className="flex flex-wrap items-center gap-3">
          <SponsorFields sponsor={sponsor} onChange={(s) => setSponsor({ ...s, id: initial.id })} />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending || !changed}
              className="rounded-lg bg-club px-4 py-2.5 text-sm font-bold text-white hover:bg-forest disabled:opacity-40"
            >
              Save
            </button>
            <button
              type="button"
              disabled={removing}
              aria-label={`Remove ${initial.name}`}
              onClick={() => {
                if (!window.confirm(`Remove ${initial.name}? It is also removed from any post that thanks them.`)) return;
                startRemove(async () => {
                  const result = await deleteSponsor(initial.id);
                  if (!result.ok) setError(result.message);
                });
              }}
              className="grid size-10 place-items-center rounded-lg border border-line text-ink hover:bg-gold-tint disabled:opacity-40"
            >
              <Trash2 className="size-5" aria-hidden />
            </button>
          </div>
        </div>
        {(error || (state && !changed)) && (
          <p role="status" className="mt-2 text-sm font-medium text-ink-soft">
            {error ?? state?.message}
          </p>
        )}
      </form>
    </li>
  );
}

/** Add, edit and remove sponsors. Confirmed sponsors appear on the public page and can be thanked in posts. */
export function SponsorManager({ sponsors, canEdit }: { sponsors: SponsorRow[]; canEdit: boolean }) {
  if (!canEdit) {
    return (
      <ul className="space-y-2">
        {sponsors.map((s) => (
          <li key={s.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4 ring-1 ring-line">
            <span className="font-semibold text-ink">{s.name}</span>
            <span className="text-sm text-ink-soft">
              {tierLabel(s.tier)}
              {!s.confirmed && " · not confirmed"}
            </span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="space-y-5">
      <NewSponsor />
      {sponsors.length > 0 && (
        <ul className="space-y-3">
          {sponsors.map((s) => (
            <SponsorItem key={`${s.id}-${s.name}-${s.tier}-${s.confirmed}`} initial={s} />
          ))}
        </ul>
      )}
    </div>
  );
}
