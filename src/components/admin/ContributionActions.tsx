"use client";

import { useState, useTransition } from "react";
import { Check, RotateCcw, Trash2, X } from "lucide-react";
import type { ContributionStatus } from "@/lib/contributions";
import { deleteContribution, setContributionStatus } from "@/app/admin/(staff)/contributions/actions";

/** Verify / reject / undo buttons on a contribution card. */
export function ContributionStatusButtons({ id, status }: { id: string; status: ContributionStatus }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const change = (next: ContributionStatus, confirmText?: string) => {
    if (confirmText && !window.confirm(confirmText)) return;
    startTransition(async () => {
      const result = await setContributionStatus(id, next);
      setMessage({ ok: result.ok, text: result.message });
    });
  };

  const base = "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-bold disabled:opacity-60";

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {status === "pending" && (
          <>
            <button
              type="button"
              disabled={pending}
              onClick={() => change("verified")}
              className={`${base} bg-club text-white hover:bg-forest`}
            >
              <Check className="size-4" aria-hidden /> Verify
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => change("rejected", "Reject this contribution? Use this when the money did not arrive.")}
              className={`${base} border border-line bg-white text-ink hover:bg-gold-tint`}
            >
              <X className="size-4" aria-hidden /> Reject
            </button>
          </>
        )}
        {status !== "pending" && (
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              change(
                "pending",
                status === "verified" ? "Move back to 'To check'? It will stop counting towards the total." : undefined,
              )
            }
            className={`${base} border border-line bg-white text-forest hover:bg-club-tint`}
          >
            <RotateCcw className="size-4" aria-hidden /> {status === "verified" ? "Undo verify" : "Restore"}
          </button>
        )}
      </div>
      {message && !message.ok && (
        <p role="alert" className="mt-2 text-sm font-medium text-ink">
          {message.text}
        </p>
      )}
    </div>
  );
}

export function DeleteContributionButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!window.confirm("Delete this contribution permanently? To keep a record, reject it instead.")) return;
          startTransition(async () => {
            const result = await deleteContribution(id);
            if (!result.ok) setError(result.message);
          });
        }}
        className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-4 py-3 font-semibold text-ink hover:bg-gold-tint disabled:opacity-60"
      >
        <Trash2 className="size-5" aria-hidden /> {pending ? "Deleting…" : "Delete contribution"}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-ink">
          {error}
        </p>
      )}
    </div>
  );
}
