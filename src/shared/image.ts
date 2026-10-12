import { decode, encode } from 'blurhash';

const MAX_SIDE = 2048;

/**
 * Prepares a photo for upload as the API contract asks: longest side at most 2048 px, JPEG 80 %, EXIF orientation
 * applied, plus a blurhash for the placeholder.
 */
export async function preparePhoto(file: File): Promise<{ blob: Blob; blurhash: string; preview: string }> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, width, height);
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not encode the photo'))), 'image/jpeg', 0.8),
  );

  // Blurhash from a tiny copy: fast and plenty for a placeholder.
  const small = document.createElement('canvas');
  small.width = 32;
  small.height = Math.max(1, Math.round((32 * height) / width));
  const ctx = small.getContext('2d')!;
  ctx.drawImage(bitmap, 0, 0, small.width, small.height);
  const pixels = ctx.getImageData(0, 0, small.width, small.height);
  const blurhash = encode(pixels.data, small.width, small.height, 4, 3);
  bitmap.close();

  return { blob, blurhash, preview: URL.createObjectURL(blob) };
}

/** A small data URL from a blurhash, used as an image placeholder. */
export function blurhashDataUrl(hash: string, width = 32, height = 24): string | null {
  try {
    const pixels = decode(hash, width, height);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const image = ctx.createImageData(width, height);
    image.data.set(pixels);
    ctx.putImageData(image, 0, 0);
    return canvas.toDataURL();
  } catch {
    return null;
  }
}
