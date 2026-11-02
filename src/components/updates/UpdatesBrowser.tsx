"use client";

import { useState } from "react";
import type { UpdateCategory } from "@/config/site";
import { UPDATE_CATEGORIES, categoryLabel, type UpdatePost } from "@/lib/updates";
import { UpdateCard } from "@/components/updates/UpdateCard";

/** All posts with category filter chips. Filtering happens in the browser so the page stays cached. */
export function UpdatesBrowser({ posts }: { posts: UpdatePost[] }) {
  const [filter, setFilter] = useState<UpdateCategory | "all">("all");
  const used = UPDATE_CATEGORIES.filter((c) => posts.some((p) => p.category === c));
  const shown = filter === "all" ? posts : posts.filter((p) => p.category === filter);

  const chip = (value: UpdateCategory | "all", label: string) => (
    <button
      key={value}
      type="button"
      onClick={() => setFilter(value)}
      aria-pressed={filter === value}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
        filter === value ? "bg-forest text-white" : "bg-white text-forest ring-1 ring-line hover:bg-club-tint"
      }`}
    >
      {label}
    </button>
  );

  return (
    <>
      {used.length > 1 && (
        <div role="group" aria-label="Filter by category" className="mt-10 flex flex-wrap gap-2">
          {chip("all", "All")}
          {used.map((c) => chip(c, categoryLabel(c)))}
        </div>
      )}
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((post) => (
          <UpdateCard key={post.id} post={post} />
        ))}
      </div>
    </>
  );
}
