"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, ImagePlus, RotateCw, Star, Trash2, X } from "lucide-react";
import { siteConfig } from "@/config/site";
import { formatBytes } from "@/lib/format";
import { resizeImage } from "@/lib/resize-image";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { PHOTO_BUCKET, photoUrl, supabaseAnonKey, supabaseUrl } from "@/lib/supabase/env";
import {
  addPhoto,
  deletePhoto,
  reorderPhotos,
  setCoverPhoto,
  updateCaption,
  type SavedPhoto,
} from "@/app/admin/(staff)/updates/actions";

type Status = "waiting" | "compressing" | "uploading" | "saving" | "failed" | "rejected";

type QueueItem = {
  key: string;
  name: string;
  status: Status;
  progress: number;
  originalSize: number;
  compressedSize: number | null;
  error: string | null;
};

type Job = {
  file: File;
  path: string;
  resized: { blob: Blob; width: number; height: number } | null;
  uploaded: boolean;
};

/** Uploads straight to Supabase Storage with XMLHttpRequest, which reports progress. */
function uploadWithProgress(path: string, blob: Blob, token: string, onProgress: (fraction: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${supabaseUrl}/storage/v1/object/${PHOTO_BUCKET}/${path}`);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("apikey", supabaseAnonKey);
    xhr.setRequestHeader("Content-Type", "image/jpeg");
    xhr.setRequestHeader("cache-control", "max-age=31536000");
    xhr.setRequestHeader("x-upsert", "true"); // a retry may resend a file that already arrived
    xhr.timeout = 180_000;
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(xhr.status === 403 || xhr.status === 401 ? "Not allowed to upload." : "Upload failed."));
    xhr.onerror = () => reject(new Error("Connection problem."));
    xhr.ontimeout = () => reject(new Error("The connection is too slow."));
    xhr.send(blob);
  });
}

const statusText: Record<Status, string> = {
  waiting: "Waiting…",
  compressing: "Making smaller…",
  uploading: "Uploading",
  saving: "Saving…",
  failed: "Failed",
  rejected: "Not added",
};

const iconButton =
  "grid size-10 place-items-center rounded-lg border border-line text-forest hover:bg-club-tint disabled:opacity-40 disabled:hover:bg-transparent";

export function PhotoManager({
  updateId,
  initialPhotos,
  initialCoverId,
}: {
  updateId: string;
  initialPhotos: SavedPhoto[];
  initialCoverId: string | null;
}) {
  const { maxPhotos } = siteConfig.updates;
  const [photos, setPhotos] = useState(initialPhotos);
  const [coverId, setCoverId] = useState(initialCoverId);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [sizes, setSizes] = useState<Record<string, { original: number; compressed: number }>>({});
  const [captions, setCaptions] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const jobs = useRef(new Map<string, Job>());
  const chain = useRef<Promise<void>>(Promise.resolve());
  const input = useRef<HTMLInputElement>(null);

  const reserved = queue.filter((q) => q.status !== "rejected").length;
  const slotsLeft = maxPhotos - photos.length - reserved;
  const effectiveCover = coverId ?? photos[0]?.id ?? null;

  const patch = (key: string, changes: Partial<QueueItem>) =>
    setQueue((items) => items.map((item) => (item.key === key ? { ...item, ...changes } : item)));

  async function process(key: string) {
    const job = jobs.current.get(key);
    if (!job) return;
    try {
      if (!job.resized) {
        patch(key, { status: "compressing", error: null });
        try {
          job.resized = await resizeImage(job.file);
        } catch (error) {
          patch(key, { status: "rejected", error: (error as Error).message });
          jobs.current.delete(key);
          return;
        }
        patch(key, { compressedSize: job.resized.blob.size });
      }

      if (!job.uploaded) {
        patch(key, { status: "uploading", progress: 0, error: null });
        const { data } = (await getBrowserSupabase()?.auth.getSession()) ?? { data: { session: null } };
        const token = data.session?.access_token;
        if (!token) throw new Error("You have been signed out. Sign in again.");
        await uploadWithProgress(job.path, job.resized.blob, token, (progress) => patch(key, { progress }));
        job.uploaded = true;
      }

      patch(key, { status: "saving", error: null });
      const result = await addPhoto(updateId, {
        storagePath: job.path,
        width: job.resized.width,
        height: job.resized.height,
      });
      if (!result.ok) throw new Error(result.message);

      setPhotos((list) => [...list, result.photo]);
      setSizes((s) => ({ ...s, [result.photo.id]: { original: job.file.size, compressed: job.resized!.blob.size } }));
      setQueue((items) => items.filter((item) => item.key !== key));
      jobs.current.delete(key);
    } catch (error) {
      patch(key, { status: "failed", error: (error as Error).message || "Something went wrong." });
    }
  }

  // One photo at a time, so a slow connection is not split across several uploads.
  const enqueue = (key: string) => {
    chain.current = chain.current.then(() => process(key));
  };

  function onFiles(files: FileList | null) {
    if (!files?.length) return;
    const list = Array.from(files);
    const accepted = list.slice(0, Math.max(0, slotsLeft));
    setNotice(
      accepted.length < list.length
        ? `A post can have ${maxPhotos} photos. ${list.length - accepted.length} ${list.length - accepted.length === 1 ? "photo was" : "photos were"} not added.`
        : null,
    );

    const items: QueueItem[] = accepted.map((file) => {
      const key = crypto.randomUUID();
      const isImage = file.type.startsWith("image/");
      if (isImage) jobs.current.set(key, { file, path: `${updateId}/${crypto.randomUUID()}.jpg`, resized: null, uploaded: false });
      return {
        key,
        name: file.name || "Photo",
        status: isImage ? "waiting" : "rejected",
        progress: 0,
        originalSize: file.size,
        compressedSize: null,
        error: isImage ? null : "This file is not a photo.",
      };
    });
    setQueue((q) => [...q, ...items]);
    items.filter((i) => i.status === "waiting").forEach((i) => enqueue(i.key));
    if (input.current) input.current.value = "";
  }

  function retry(key: string) {
    patch(key, { status: "waiting", error: null });
    enqueue(key);
  }

  function dismiss(key: string) {
    const job = jobs.current.get(key);
    // Remove a file that reached storage but was never saved to the post.
    if (job?.uploaded) void getBrowserSupabase()?.storage.from(PHOTO_BUCKET).remove([job.path]);
    jobs.current.delete(key);
    setQueue((items) => items.filter((item) => item.key !== key));
  }

  async function run(action: () => Promise<{ ok: boolean; message: string }>, undo?: () => void) {
    setBusy(true);
    const result = await action().catch(() => ({ ok: false, message: "Connection problem. Try again." }));
    setBusy(false);
    if (!result.ok) {
      undo?.();
      setNotice(result.message);
    }
    return result.ok;
  }

  function move(index: number, by: -1 | 1) {
    const before = photos;
    const next = [...photos];
    [next[index], next[index + by]] = [next[index + by], next[index]];
    setPhotos(next);
    void run(() => reorderPhotos(updateId, next.map((p) => p.id)), () => setPhotos(before));
  }

  function chooseCover(photoId: string) {
    const before = coverId;
    setCoverId(photoId);
    void run(() => setCoverPhoto(updateId, photoId), () => setCoverId(before));
  }

  async function remove(photo: SavedPhoto) {
    if (!window.confirm("Delete this photo? It will be removed from the post and from storage.")) return;
    if (await run(() => deletePhoto(photo.id))) {
      setPhotos((list) => list.filter((p) => p.id !== photo.id));
      if (coverId === photo.id) setCoverId(null);
    }
  }

  function saveCaption(photo: SavedPhoto) {
    const draft = captions[photo.id];
    if (draft === undefined || draft.trim() === (photo.caption ?? "")) return;
    const caption = draft.trim() || null;
    setPhotos((list) => list.map((p) => (p.id === photo.id ? { ...p, caption } : p)));
    void run(() => updateCaption(photo.id, draft), () =>
      setPhotos((list) => list.map((p) => (p.id === photo.id ? photo : p))),
    );
  }

  return (
    <section aria-labelledby="photos-title" className="rounded-2xl bg-white p-5 ring-1 ring-line sm:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="photos-title" className="font-display text-2xl font-bold text-forest">
          Photos
        </h2>
        <p className="text-sm text-ink-soft tabular-nums">
          {photos.length} / {maxPhotos}
        </p>
      </div>
      <p className="mt-1 text-sm text-ink-soft">
        Photos are made smaller on your phone before they upload. The cover photo is shown on cards and in WhatsApp
        previews.
      </p>

      <label
        className={`mt-5 flex cursor-pointer items-center justify-center gap-2.5 rounded-xl border-2 border-dashed border-club/40 bg-club-tint px-4 py-5 text-base font-bold text-club hover:border-club ${
          slotsLeft <= 0 ? "pointer-events-none opacity-50" : ""
        }`}
      >
        <ImagePlus className="size-6" aria-hidden />
        {slotsLeft <= 0 ? "Photo limit reached" : "Add photos"}
        <input
          ref={input}
          type="file"
          accept="image/*"
          multiple
          disabled={slotsLeft <= 0}
          onChange={(e) => onFiles(e.target.files)}
          className="sr-only"
        />
      </label>

      {notice && (
        <p role="status" className="mt-3 rounded-lg bg-gold-tint px-3.5 py-2.5 text-sm font-medium text-ink">
          {notice}
        </p>
      )}

      {queue.length > 0 && (
        <ul className="mt-5 space-y-3" aria-label="Photos being added">
          {queue.map((item) => (
            <li key={item.key} className="rounded-xl bg-mist p-3.5 ring-1 ring-line">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{item.name}</p>
                  <p className="mt-0.5 text-xs text-ink-soft tabular-nums">
                    {formatBytes(item.originalSize)}
                    {item.compressedSize !== null && ` → ${formatBytes(item.compressedSize)}`}
                  </p>
                </div>
                <p
                  className={`shrink-0 text-xs font-semibold ${
                    item.status === "failed" || item.status === "rejected" ? "text-ink" : "text-club"
                  }`}
                >
                  {statusText[item.status]}
                  {item.status === "uploading" && ` ${Math.round(item.progress * 100)}%`}
                </p>
              </div>
              {(item.status === "uploading" || item.status === "saving") && (
                <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-line" aria-hidden>
                  <div
                    className="h-full rounded-full bg-club transition-[width]"
                    style={{ width: `${item.status === "saving" ? 100 : Math.round(item.progress * 100)}%` }}
                  />
                </div>
              )}
              {item.error && <p className="mt-2 text-sm text-ink">{item.error}</p>}
              {(item.status === "failed" || item.status === "rejected") && (
                <div className="mt-3 flex gap-2">
                  {item.status === "failed" && (
                    <button
                      type="button"
                      onClick={() => retry(item.key)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-club px-3.5 py-2 text-sm font-bold text-white hover:bg-forest"
                    >
                      <RotateCw className="size-4" aria-hidden /> Retry
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => dismiss(item.key)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3.5 py-2 text-sm font-semibold text-forest"
                  >
                    <X className="size-4" aria-hidden /> Remove
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {photos.length > 0 && (
        <ol className="mt-5 space-y-3">
          {photos.map((photo, index) => {
            const isCover = photo.id === effectiveCover;
            const size = sizes[photo.id];
            return (
              <li key={photo.id} className="rounded-xl p-3 ring-1 ring-line">
                <div className="flex gap-3">
                  <div className="relative size-24 shrink-0 overflow-hidden rounded-lg bg-forest">
                    <Image src={photoUrl(photo.storage_path)} alt="" fill sizes="96px" className="object-cover" />
                    {isCover && (
                      <span className="absolute inset-x-0 bottom-0 bg-gold py-0.5 text-center text-[11px] font-bold text-forest">
                        Cover
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <label className="block">
                      <span className="text-xs font-semibold text-ink-soft">Caption (optional)</span>
                      <input
                        type="text"
                        maxLength={200}
                        value={captions[photo.id] ?? photo.caption ?? ""}
                        onChange={(e) => setCaptions((c) => ({ ...c, [photo.id]: e.target.value }))}
                        onBlur={() => saveCaption(photo)}
                        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                        placeholder="Who or what is in the photo"
                        className="mt-1 block w-full rounded-lg border border-line px-3 py-2 text-base text-ink focus:border-club focus:outline-none"
                      />
                    </label>
                    {size && (
                      <p className="mt-1 text-xs text-ink-soft tabular-nums">
                        {formatBytes(size.original)} → {formatBytes(size.compressed)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={busy || index === 0}
                    aria-label={`Move photo ${index + 1} up`}
                    className={iconButton}
                  >
                    <ArrowUp className="size-5" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={busy || index === photos.length - 1}
                    aria-label={`Move photo ${index + 1} down`}
                    className={iconButton}
                  >
                    <ArrowDown className="size-5" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => chooseCover(photo.id)}
                    disabled={busy || isCover}
                    aria-pressed={isCover}
                    className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-line px-3 text-sm font-semibold text-forest hover:bg-club-tint disabled:opacity-60"
                  >
                    <Star className={`size-4 ${isCover ? "fill-gold text-forest" : ""}`} aria-hidden />
                    {isCover ? "Cover photo" : "Make cover"}
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(photo)}
                    disabled={busy}
                    aria-label={`Delete photo ${index + 1}`}
                    className={`${iconButton} ml-auto`}
                  >
                    <Trash2 className="size-5" aria-hidden />
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
