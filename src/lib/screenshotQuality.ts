/**
 * Screenshot quality guard (browser-safe, no Node dependencies).
 *
 * A blank SPA capture is not necessarily small: a 1280x720 uniform white JPEG at
 * quality 62 weighs ~7.6 KB as a base64 data URL, so a byte-length test cannot
 * detect it. This module samples decoded pixels and reports whether the frame
 * carries any rendered structure at all.
 */

export type RasterVerdict = 'BLANK' | 'CONTENT' | 'UNKNOWN';

/** Sample grid: small enough to stay cheap, large enough to keep 1px borders/text. */
const SAMPLE_WIDTH = 96;
const SAMPLE_HEIGHT = 54;
/** Below this share of non-dominant pixels the frame is an empty canvas. */
const DEVIATING_SHARE_LIMIT = 0.001;
/** One quantised colour covering almost everything is blank regardless. */
const ABSOLUTE_DOMINANT_SHARE = 0.9995;

const verdictCache = new Map<string, RasterVerdict>();
const MAX_CACHE_ENTRIES = 256;

function cacheKey(dataUrl: string): string {
  return `${dataUrl.length}:${dataUrl.slice(0, 48)}:${dataUrl.slice(-32)}`;
}

export function isRasterDataUrl(dataUrl: string | undefined | null): boolean {
  return !!dataUrl && /^data:image\/(jpe?g|png|webp|bmp)/i.test(dataUrl);
}

/**
 * Classifies a raster screenshot as BLANK, CONTENT or UNKNOWN.
 * UNKNOWN means the frame could not be inspected (SSR, tainted canvas, decode
 * failure), so callers keep the original capture instead of guessing.
 */
export async function detectBlankRasterDataUrl(
  dataUrl: string | undefined | null
): Promise<RasterVerdict> {
  if (!dataUrl) return 'BLANK';
  if (dataUrl.startsWith('data:image/svg+xml')) return 'CONTENT';
  if (!isRasterDataUrl(dataUrl)) return 'UNKNOWN';
  if (typeof document === 'undefined' || typeof Image === 'undefined') return 'UNKNOWN';

  const key = cacheKey(dataUrl);
  const cached = verdictCache.get(key);
  if (cached) return cached;

  const verdict = await new Promise<RasterVerdict>((resolve) => {
    const image = new Image();
    let settled = false;
    const finish = (value: RasterVerdict) => {
      if (settled) return;
      settled = true;
      image.onload = null;
      image.onerror = null;
      resolve(value);
    };
    const timer = setTimeout(() => finish('UNKNOWN'), 6000);
    image.onload = () => {
      clearTimeout(timer);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = SAMPLE_WIDTH;
        canvas.height = SAMPLE_HEIGHT;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return finish('UNKNOWN');
        ctx.drawImage(image, 0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT);
        const { data } = ctx.getImageData(0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT);
        finish(classifySampledPixels(data, 4));
      } catch {
        // Cross-origin capture taints the canvas; do not destroy a real screenshot.
        finish('UNKNOWN');
      }
    };
    image.onerror = () => {
      clearTimeout(timer);
      finish('UNKNOWN');
    };
    image.decoding = 'async';
    image.src = dataUrl;
  });

  if (verdictCache.size >= MAX_CACHE_ENTRIES) {
    const oldest = verdictCache.keys().next().value;
    if (oldest) verdictCache.delete(oldest);
  }
  verdictCache.set(key, verdict);
  return verdict;
}

/** Exported for deterministic tests: classify a raw RGB/RGBA sample buffer. */
export function classifySampledPixels(data: Uint8ClampedArray, channels: number = 4): RasterVerdict {
  const pixelCount = Math.floor(data.length / channels);
  if (pixelCount === 0) return 'BLANK';

  const buckets = new Map<number, number>();
  for (let i = 0; i < pixelCount * channels; i += channels) {
    const r = data[i];
    const g = channels >= 3 ? data[i + 1] : data[i];
    const b = channels >= 3 ? data[i + 2] : data[i];
    // 4-bit per channel quantisation groups JPEG noise into one bucket while
    // keeping real borders, text and table rules as distinct colours.
    const bucket = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    buckets.set(bucket, (buckets.get(bucket) || 0) + 1);
  }

  let dominantKey = 0;
  let dominant = 0;
  buckets.forEach((count, key) => {
    if (count > dominant) {
      dominant = count;
      dominantKey = key;
    }
  });

  const dominantShare = dominant / pixelCount;
  const deviatingShare = 1 - dominantShare;
  if (dominantShare >= ABSOLUTE_DOMINANT_SHARE && dominantKey >= 0) return 'BLANK';
  if (deviatingShare < DEVIATING_SHARE_LIMIT) return 'BLANK';
  return 'CONTENT';
}
