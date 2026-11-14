/**
 * Server-side screenshot integrity checks (Node + sharp).
 *
 * Used by the crawler and exporters to reject uniform-white captures that a
 * byte-length check cannot catch: a blank 1280x720 JPEG at quality 62 is
 * ~7.6 KB once base64-encoded.
 */

import sharp from 'sharp';

const SAMPLE_WIDTH = 96;
const SAMPLE_HEIGHT = 54;
const DEVIATING_SHARE_LIMIT = 0.001;
const ABSOLUTE_DOMINANT_SHARE = 0.9995;

export function isBlankSampledPixels(data: Buffer, channels: number): boolean {
  const pixelCount = Math.floor(data.length / channels);
  if (pixelCount === 0) return true;

  const buckets = new Map<number, number>();
  for (let i = 0; i < pixelCount * channels; i += channels) {
    const r = data[i];
    const g = channels >= 3 ? data[i + 1] : data[i];
    const b = channels >= 3 ? data[i + 2] : data[i];
    const bucket = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    buckets.set(bucket, (buckets.get(bucket) || 0) + 1);
  }

  let dominant = 0;
  buckets.forEach((count) => {
    if (count > dominant) dominant = count;
  });
  const dominantShare = dominant / pixelCount;
  if (dominantShare >= ABSOLUTE_DOMINANT_SHARE) return true;
  return 1 - dominantShare < DEVIATING_SHARE_LIMIT;
}

/** True when the encoded image is an empty / uniform canvas. */
export async function isBlankRasterBuffer(buffer: Buffer | null | undefined): Promise<boolean> {
  if (!buffer || buffer.length === 0) return true;
  try {
    const { data, info } = await sharp(buffer)
      .resize(SAMPLE_WIDTH, SAMPLE_HEIGHT, { fit: 'fill' })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    return isBlankSampledPixels(data, info.channels);
  } catch {
    // Undecodable payload: let the caller keep whatever Playwright produced.
    return false;
  }
}

export async function isBlankRasterDataUrl(dataUrl: string | undefined | null): Promise<boolean> {
  if (!dataUrl) return true;
  if (dataUrl.startsWith('data:image/svg+xml')) return false;
  const match = /^data:image\/[a-z0-9.+-]+;base64,(.+)$/i.exec(dataUrl);
  if (!match) return false;
  try {
    return await isBlankRasterBuffer(Buffer.from(match[1], 'base64'));
  } catch {
    return false;
  }
}
