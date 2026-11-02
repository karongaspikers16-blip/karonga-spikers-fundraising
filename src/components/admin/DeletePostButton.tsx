"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteUpdate } from "@/app/admin/(staff)/updates/actions";

export function DeletePostButton({ updateId }: { updateId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onClick() {
    if (!window.confirm("Delete this post and all its photos? This cannot be undone.")) return;
    startTransition(async () => {
      const result = await deleteUpdate(updateId);
      if (!result.ok) setError(result.message);
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-4 py-3 font-semibold text-ink hover:bg-gold-tint disabled:opacity-60"
      >
        <Trash2 className="size-5" aria-hidden /> {pending ? "Deleting…" : "Delete post"}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-ink">
          {error}
        </p>
      )}
    </div>
  );
}
