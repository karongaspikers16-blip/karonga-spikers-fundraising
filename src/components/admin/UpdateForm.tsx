"use client";

import { useActionState, useState } from "react";
import { siteConfig, type TierId, type UpdateCategory } from "@/config/site";
import { UPDATE_CATEGORIES, categoryLabel } from "@/lib/updates";
import { saveUpdate } from "@/app/admin/(staff)/updates/actions";

type Props = {
  post?: {
    id: string;
    title: string;
    category: UpdateCategory;
    body: string;
    published: boolean;
    sponsorIds: string[];
  };
  sponsors: { id: string; name: string; tier: TierId }[];
};

const field =
  "mt-1.5 block w-full rounded-lg border border-line bg-white px-3.5 py-3 text-base text-ink focus:border-club focus:outline-none";

export function UpdateForm({ post, sponsors }: Props) {
  const [state, action, pending] = useActionState(saveUpdate, null);
  // Controlled fields: React resets uncontrolled ones after every form action.
  const [title, setTitle] = useState(post?.title ?? "");
  const [category, setCategory] = useState<UpdateCategory>(post?.category ?? "training");
  const [body, setBody] = useState(post?.body ?? "");
  const [thanked, setThanked] = useState<string[]>(post?.sponsorIds ?? []);
  const [published, setPublished] = useState(post?.published ?? false);
  const { maxBodyLength } = siteConfig.updates;

  return (
    <form action={action} className="space-y-6 rounded-2xl bg-white p-5 ring-1 ring-line sm:p-6">
      {post && <input type="hidden" name="id" value={post.id} />}

      <label className="block">
        <span className="text-sm font-semibold text-ink">Title</span>
        <input
          name="title"
          required
          maxLength={120}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={field}
        />
      </label>

      <label className="block">
        <span className="text-sm font-semibold text-ink">Category</span>
        <select
          name="category"
          value={category}
          onChange={(e) => setCategory(e.target.value as UpdateCategory)}
          className={field}
        >
          {UPDATE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {categoryLabel(c)}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="flex items-baseline justify-between gap-3">
          <span className="text-sm font-semibold text-ink">Text</span>
          <span
            className={`text-xs tabular-nums ${body.length > maxBodyLength * 0.9 ? "font-bold text-ink" : "text-ink-soft"}`}
            aria-live="polite"
          >
            {body.length} / {maxBodyLength}
          </span>
        </span>
        <textarea
          name="body"
          rows={8}
          maxLength={maxBodyLength}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className={`${field} leading-relaxed`}
          aria-describedby="body-hint"
        />
        <span id="body-hint" className="mt-1 block text-xs text-ink-soft">
          Leave an empty line between paragraphs.
        </span>
      </label>

      <fieldset>
        <legend className="text-sm font-semibold text-ink">Thank sponsors</legend>
        {sponsors.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {sponsors.map((s) => (
              <label key={s.id} className="cursor-pointer">
                <input
                  type="checkbox"
                  name="sponsors"
                  value={s.id}
                  checked={thanked.includes(s.id)}
                  onChange={(e) =>
                    setThanked((ids) => (e.target.checked ? [...ids, s.id] : ids.filter((id) => id !== s.id)))
                  }
                  className="peer sr-only"
                />
                <span className="inline-flex rounded-full border border-line px-3.5 py-2 text-sm font-semibold text-forest peer-checked:border-forest peer-checked:bg-forest peer-checked:text-white peer-focus-visible:outline-3 peer-focus-visible:outline-gold">
                  {s.name}
                </span>
              </label>
            ))}
          </div>
        ) : (
          <p className="mt-1.5 text-sm text-ink-soft">No confirmed sponsors yet.</p>
        )}
      </fieldset>

      <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl bg-mist p-4 ring-1 ring-line">
        <span>
          <span className="block font-semibold text-ink">{published ? "Published" : "Draft"}</span>
          <span className="block text-sm text-ink-soft">
            {published ? "Everyone can see this post." : "Only club staff can see this post."}
          </span>
        </span>
        <input
          type="checkbox"
          name="published"
          checked={published}
          onChange={(e) => setPublished(e.target.checked)}
          className="peer sr-only"
        />
        <span
          aria-hidden
          className="relative h-7 w-12 shrink-0 rounded-full bg-line transition-colors peer-checked:bg-club peer-focus-visible:outline-3 peer-focus-visible:outline-gold after:absolute after:top-1 after:left-1 after:size-5 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-5"
        />
      </label>

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
        className="w-full rounded-lg bg-club px-5 py-3.5 text-base font-bold text-white transition-colors hover:bg-forest disabled:opacity-60"
      >
        {pending ? "Saving…" : post ? (published ? "Save and publish" : "Save draft") : "Save and add photos"}
      </button>
    </form>
  );
}
