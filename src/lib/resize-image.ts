/**
 * Shrinks a phone photo in the browser before upload, so posting works on slow
 * connections and the photos load quickly for supporters.
 */
export const MAX_PHOTO_SIDE = 1600;
export const PHOTO_QUALITY = 0.82;

type Decoded = { source: CanvasImageSource; width: number; height: number; release: () => void };

async function decode(file: File): Promise<Decoded> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      return { source: bitmap, width: bitmap.width, height: bitmap.height, release: () => bitmap.close() };
    } catch {
      // Fall back to an <img> element below.
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, release: () => URL.revokeObjectURL(url) };
  } catch {
    URL.revokeObjectURL(url);
    throw new Error("This file could not be opened as a photo. Try a JPEG or PNG.");
  }
}

/** Resizes to at most 1600px on the long side and re-encodes as JPEG at quality 0.82. */
export async function resizeImage(file: File) {
  if (!file.type.startsWith("image/")) throw new Error("This file is not a photo.");

  const image = await decode(file);
  try {
    const scale = Math.min(1, MAX_PHOTO_SIDE / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("This phone could not process the photo.");

    // JPEG has no transparency: paint white under transparent PNGs instead of black.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(image.source, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", PHOTO_QUALITY));
    canvas.width = canvas.height = 0; // free the memory straight away on low-end phones
    if (!blob) throw new Error("This phone could not process the photo.");
    return { blob, width, height };
  } finally {
    image.release();
  }
}
