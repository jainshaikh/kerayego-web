// Shrinks a car photo in the browser before it's uploaded: phone photos are
// often 4000+ px and 5–15 MB, far more than a listing needs. The photo is
// scaled so its longer side is at most MAX_PHOTO_DIMENSION and saved as JPEG,
// lowering the quality (then the size) until it fits TARGET_PHOTO_BYTES. The
// backend still refuses anything over 5 MB (MAX_VEHICLE_PHOTO_BYTES), so the
// result is checked against that too.

/** Longest side of an uploaded car photo — plenty for a full-width gallery. */
export const MAX_PHOTO_DIMENSION = 2048;
/** What compression aims for; most photos end well under it. */
export const TARGET_PHOTO_BYTES = 1.5 * 1024 * 1024;
/** The largest original we try to compress — beyond this a browser tab may run out of memory decoding it. */
export const MAX_ORIGINAL_PHOTO_BYTES = 40 * 1024 * 1024;

const QUALITY_STEPS = [0.85, 0.78, 0.7, 0.62];
const MIN_DIMENSION = 1024;

/** The size an image of `width`×`height` is drawn at so its longer side is at most `max`. */
export function fitWithin(width: number, height: number, max: number): { width: number; height: number } {
  const scale = Math.min(1, max / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

/** "IMG_1234.PNG" → "IMG_1234.jpg". */
export function jpegFileName(name: string): string {
  const base = name.replace(/\.[^./\\]+$/, '') || 'photo';
  return `${base}.jpg`;
}

interface Decoded {
  source: CanvasImageSource;
  width: number;
  height: number;
  close: () => void;
}

async function decode(file: File): Promise<Decoded> {
  // createImageBitmap applies the photo's EXIF rotation, so a portrait phone
  // photo doesn't come out sideways.
  if (typeof createImageBitmap === 'function') {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    return { source: bitmap, width: bitmap.width, height: bitmap.height, close: () => bitmap.close() };
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, close: () => undefined };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function encode(decoded: Decoded, maxDimension: number, quality: number): Promise<Blob | null> {
  const { width, height } = fitWithin(decoded.width, decoded.height, maxDimension);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) return Promise.resolve(null);
  // JPEG has no transparency: a PNG's clear areas would turn black.
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, width, height);
  context.imageSmoothingQuality = 'high';
  context.drawImage(decoded.source, 0, 0, width, height);
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
}

/**
 * The photo to upload: a smaller JPEG, or the original when compressing
 * doesn't make it smaller (an already small photo) or the browser can't decode
 * it. Never throws for a decode problem — the upload's own 5 MB check decides.
 */
export async function compressPhoto(file: File): Promise<File> {
  let decoded: Decoded;
  try {
    decoded = await decode(file);
  } catch {
    return file;
  }
  try {
    let best: Blob | null = null;
    for (let maxDimension = MAX_PHOTO_DIMENSION; maxDimension >= MIN_DIMENSION; maxDimension = Math.round(maxDimension * 0.75)) {
      for (const quality of QUALITY_STEPS) {
        const blob = await encode(decoded, maxDimension, quality);
        if (!blob) return file;
        if (!best || blob.size < best.size) best = blob;
        if (blob.size <= TARGET_PHOTO_BYTES) {
          return blob.size < file.size ? new File([blob], jpegFileName(file.name), { type: 'image/jpeg' }) : file;
        }
      }
    }
    // Couldn't reach the target (a very detailed photo): the smallest attempt
    // still beats a multi-megabyte original.
    return best && best.size < file.size ? new File([best], jpegFileName(file.name), { type: 'image/jpeg' }) : file;
  } finally {
    decoded.close();
  }
}
