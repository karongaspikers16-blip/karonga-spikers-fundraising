import { siteConfig, type TierId, type UpdateCategory } from "@/config/site";

export const UPDATE_CATEGORIES = Object.keys(siteConfig.updates.categories) as UpdateCategory[];

export type UpdatePhoto = {
  id: string;
  storage_path: string;
  caption: string | null;
  sort_order: number;
  width: number;
  height: number;
};

export type UpdatePost = {
  id: string;
  slug: string;
  title: string;
  body: string;
  category: UpdateCategory;
  published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  cover_photo_id: string | null;
  photos: UpdatePhoto[];
  sponsors: { id: string; name: string; tier: TierId }[];
};

/** Column list for a post with its photos and thanked sponsors. */
export const UPDATE_SELECT =
  "id, slug, title, body, category, published, published_at, created_at, updated_at, cover_photo_id, " +
  "photos:update_photos!update_photos_update_id_fkey(id, storage_path, caption, sort_order, width, height), " +
  "update_sponsors(sponsors(id, name, tier))";

export type UpdateRow = Omit<UpdatePost, "sponsors" | "photos"> & {
  photos: UpdatePhoto[] | null;
  update_sponsors: { sponsors: UpdatePost["sponsors"][number] | null }[] | null;
};

export function toPost(row: UpdateRow): UpdatePost {
  const { update_sponsors, photos, ...rest } = row;
  return {
    ...rest,
    category: UPDATE_CATEGORIES.includes(rest.category) ? rest.category : "general",
    photos: [...(photos ?? [])].sort((a, b) => a.sort_order - b.sort_order),
    sponsors: (update_sponsors ?? [])
      .map((link) => link.sponsors)
      .filter((s): s is UpdatePost["sponsors"][number] => s !== null)
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
}

export function categoryLabel(category: UpdateCategory) {
  return siteConfig.updates.categories[category];
}

/** The chosen cover, or the first photo. */
export function coverPhoto(post: Pick<UpdatePost, "photos" | "cover_photo_id">) {
  return post.photos.find((p) => p.id === post.cover_photo_id) ?? post.photos[0] ?? null;
}

export function postDate(post: Pick<UpdatePost, "published_at" | "created_at">) {
  return post.published_at ?? post.created_at;
}

export function postPath(slug: string) {
  return `/updates/${slug}`;
}

/** Plain text excerpt, cut at a word boundary. */
export function excerpt(body: string, maxLength = 160) {
  const text = body.replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) return text;
  const cut = text.slice(0, maxLength);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), maxLength * 0.6)).trimEnd()}…`;
}

/** Paragraphs from the plain textarea: blank lines split paragraphs, single line breaks stay. */
export function paragraphs(body: string) {
  return body
    .replace(/\r\n?/g, "\n")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}
