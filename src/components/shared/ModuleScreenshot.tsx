'use client';

import { useEffect, useRef, useState } from 'react';
import { isBlankOrMissingScreenshot } from '@/lib/featureModuleBlueprint';
import { detectBlankRasterDataUrl, isRasterDataUrl } from '@/lib/screenshotQuality';

export interface ModuleScreenshotProps {
  /** Captured SPA screenshot; may be missing or a uniform white frame. */
  src?: string | null;
  /** Deterministic ISO 26514 blueprint used when the capture carries no pixels. */
  blueprintDataUrl: string;
  alt: string;
  className?: string;
  title?: string;
  /** Shows a compact "blueprint" tag whenever the capture was replaced. */
  showSourceBadge?: boolean;
}

/**
 * Renders a module visual with a three-stage guard:
 *   1. missing / unusably small capture  -> blueprint immediately
 *   2. decodable but pixel-uniform frame -> blueprint after canvas sampling
 *   3. load error                        -> blueprint
 * A uniform white JPEG is ~7.6 KB as base64, so length checks alone cannot catch it.
 */
export function ModuleScreenshot({
  src,
  blueprintDataUrl,
  alt,
  className,
  title,
  showSourceBadge = true,
}: ModuleScreenshotProps) {
  const fallbackSvg =
    blueprintDataUrl ||
    'data:image/svg+xml;base64,' +
      (typeof btoa !== 'undefined'
        ? btoa(
            `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720"><rect width="1280" height="720" fill="#0B0C0E"/><text x="640" y="360" fill="#64748B" font-family="sans-serif" font-size="20" text-anchor="middle">Module Visual Mockup</text></svg>`
          )
        : '');

  const isInvalid = !src || typeof src !== 'string' || isBlankOrMissingScreenshot(src);
  const initialSrc = isInvalid ? fallbackSvg : (src as string);
  const [resolvedSrc, setResolvedSrc] = useState(initialSrc);
  const [usedBlueprint, setUsedBlueprint] = useState(initialSrc === fallbackSvg);
  const requestRef = useRef(0);

  useEffect(() => {
    const requestId = ++requestRef.current;
    if (isBlankOrMissingScreenshot(src)) {
      setResolvedSrc(fallbackSvg);
      setUsedBlueprint(true);
      return;
    }
    const candidate = src as string;
    setResolvedSrc(candidate);
    setUsedBlueprint(false);
    if (!isRasterDataUrl(candidate)) return;

    let cancelled = false;
    void detectBlankRasterDataUrl(candidate).then((verdict) => {
      if (cancelled || requestId !== requestRef.current) return;
      if (verdict === 'BLANK') {
        setResolvedSrc(fallbackSvg);
        setUsedBlueprint(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [src, fallbackSvg]);

  return (
    <div className="relative w-full min-h-[260px] bg-slate-950 flex items-center justify-center">
      <img
        src={resolvedSrc}
        alt={alt}
        title={title}
        data-screenshot-source={usedBlueprint ? 'blueprint' : 'capture'}
        className={`w-full min-h-[260px] bg-slate-950 object-contain block ${className || ''}`}
        onError={(event) => {
          const img = event.currentTarget;
          if (img.dataset.blueprintFallback === '1') return;
          img.dataset.blueprintFallback = '1';
          img.src = fallbackSvg;
          setUsedBlueprint(true);
        }}
      />
      {showSourceBadge && usedBlueprint && (
        <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-[2px] bg-[#0B0C0E]/90 border border-[#22262E] text-[9px] font-mono font-bold uppercase tracking-wide text-[#10B981] pointer-events-none z-10">
          ISO 26514 Blueprint
        </span>
      )}
    </div>
  );
}
