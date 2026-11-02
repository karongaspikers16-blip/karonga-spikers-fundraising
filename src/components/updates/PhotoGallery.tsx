"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { photoUrl } from "@/lib/supabase/env";
import type { UpdatePhoto } from "@/lib/updates";

/** Photo grid; tapping a photo opens a full-screen viewer with swipe, arrow keys and Escape. */
export function PhotoGallery({ photos, title }: { photos: UpdatePhoto[]; title: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const thumbs = useRef<(HTMLButtonElement | null)[]>([]);
  const closeButton = useRef<HTMLButtonElement>(null);
  const touchStart = useRef<number | null>(null);
  const total = photos.length;

  const isOpen = open !== null;
  const lastOpened = useRef(0);
  if (open !== null) lastOpened.current = open;

  const close = useCallback(() => setOpen(null), []);
  const step = useCallback((by: number) => setOpen((i) => (i === null ? i : (i + by + total) % total)), [total]);

  useEffect(() => {
    if (!isOpen) return;
    const thumb = thumbs.current;
    const returnTo = () => thumb[lastOpened.current]?.focus();
    closeButton.current?.focus();
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
      returnTo();
    };
  }, [isOpen, close, step]);

  if (total === 0) return null;
  const current = open === null ? null : photos[open];

  return (
    <>
      <ul className={`grid gap-2 sm:gap-3 ${total === 1 ? "grid-cols-1" : "grid-cols-2 sm:grid-cols-3"}`}>
        {photos.map((photo, i) => (
          <li key={photo.id} className={total === 1 ? "" : i === 0 && total % 2 === 1 ? "col-span-2 sm:col-span-1" : ""}>
            <button
              ref={(el) => {
                thumbs.current[i] = el;
              }}
              type="button"
              onClick={() => setOpen(i)}
              aria-label={`Open photo ${i + 1} of ${total}${photo.caption ? `: ${photo.caption}` : ""}`}
              className="group relative block aspect-[4/3] w-full overflow-hidden rounded-xl bg-forest"
            >
              <Image
                src={photoUrl(photo.storage_path)}
                alt={photo.caption ?? ""}
                fill
                sizes={total === 1 ? "(min-width: 768px) 768px, 100vw" : "(min-width: 640px) 256px, 50vw"}
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
            </button>
          </li>
        ))}
      </ul>

      {current && open !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${title}: photo ${open + 1} of ${total}`}
          className="fixed inset-0 z-[60] flex flex-col bg-ink/95 text-white"
          onTouchStart={(e) => (touchStart.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchStart.current === null) return;
            const dx = e.changedTouches[0].clientX - touchStart.current;
            touchStart.current = null;
            if (Math.abs(dx) > 50 && total > 1) step(dx < 0 ? 1 : -1);
          }}
        >
          <div className="flex items-center justify-between px-4 py-3">
            <p className="text-sm text-white/75 tabular-nums">
              {open + 1} / {total}
            </p>
            <button
              ref={closeButton}
              type="button"
              onClick={close}
              aria-label="Close photo viewer"
              className="grid size-11 place-items-center rounded-full bg-white/10 hover:bg-white/20"
            >
              <X className="size-6" aria-hidden />
            </button>
          </div>

          <div className="relative min-h-0 flex-1" onClick={(e) => e.target === e.currentTarget && close()}>
            <Image
              key={current.id}
              src={photoUrl(current.storage_path)}
              alt={current.caption ?? ""}
              fill
              sizes="100vw"
              className="pointer-events-none object-contain"
            />
            {total > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => step(-1)}
                  aria-label="Previous photo"
                  className="absolute top-1/2 left-2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-black/40 hover:bg-black/60 sm:left-4"
                >
                  <ChevronLeft className="size-7" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => step(1)}
                  aria-label="Next photo"
                  className="absolute top-1/2 right-2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-black/40 hover:bg-black/60 sm:right-4"
                >
                  <ChevronRight className="size-7" aria-hidden />
                </button>
              </>
            )}
          </div>

          <p className="min-h-14 px-5 py-4 text-center text-white/90" aria-live="polite">
            {current.caption}
          </p>
        </div>
      )}
    </>
  );
}
