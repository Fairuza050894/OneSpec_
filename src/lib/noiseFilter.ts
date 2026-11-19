/**
 * OneSpec SDLC Workbench - Centralized UI Noise & Framework Artifact Filter
 * Ticket: T-16 (F-23, F-24, F-28, F-30)
 *
 * Core Principles:
 * 1. Single source of truth for all noise filtering logic.
 * 2. Default rules ONLY contain generic framework artifacts (radix, headlessui, mui, etc).
 * 3. Zero hardcoded target-specific names (no domain features like 'katalog' or 'sales quotation').
 * 4. Word-boundary regex with Unicode support: (?<![\p{L}\p{N}])...(?![\p{L}\p{N}]).
 * 5. Data-driven chrome detection for elements appearing on >= 80% of crawled pages.
 */

export interface NoiseRules {
  ignoreExact?: string[];
  ignoreContains?: string[];
  currentUsername?: string;
  detectedGlobalChromeLabels?: string[];
}

export const GENERIC_FRAMEWORK_PREFIX_PATTERN =
  /^(_r_|radix-|headlessui-|el-id-|v-input-|mui-|field-_r_|select_\d+|input_\d+|field_\d+|nav-button-)/i;

export const GENERIC_FRAMEWORK_SUBSTRING_PATTERNS = [
  /_r_/i,
  /^radix-/i,
  /^headlessui-/i,
  /^nav-button-/i,
  /^el-id-/i,
  /^mui-/i,
  /^v-input-/i,
  /^select[_\s-]?\d+$/i,
  /^input[_\s-]?\d+$/i,
  /^field[_\s-]?\d+$/i,
  /^field[_\s-]?_r_/i,
  /^field[-\s_]+r[-\s_]+d/i,
  /^field[-\s_]+r[-\s_]+g/i,
  /^kolom\s+isian\s+#?\d+$/i,
  /^filter\s+pilihan\s+#?\d+$/i,
];

// Generic pagination, system shortcuts, language toggles, and window controls (generic only, no domain words)
export const GENERIC_UI_CHROME_EXACT_PATTERN =
  /^(⌘k|ctrl\+k|id|en|in|baris per halaman:?|rows per page:?|toggle sidebar|buka menu|logout|keluar|sign out|previous|next|selanjutnya|sebelumnya)$/i;

/**
 * Checks if a UI control name, label, or selector represents internal framework noise
 * or global navigation chrome rather than a legitimate business domain feature.
 */
export function isNoiseUiControlOrInternalId(
  nameOrLabel: string | null | undefined,
  rules?: NoiseRules
): boolean {
  if (!nameOrLabel) return true;
  const raw = String(nameOrLabel).trim();
  if (!raw) return true;
  const lower = raw.toLowerCase();

  // 1. Project-specific dynamic rules
  if (rules) {
    if (rules.ignoreExact && rules.ignoreExact.some((ex) => ex.trim().toLowerCase() === lower)) {
      return true;
    }
    if (rules.ignoreContains && rules.ignoreContains.some((sub) => sub.trim() && lower.includes(sub.trim().toLowerCase()))) {
      return true;
    }
    if (rules.currentUsername && rules.currentUsername.trim()) {
      const userLower = rules.currentUsername.trim().toLowerCase();
      if (lower === userLower || lower.includes(userLower)) {
        return true;
      }
    }
    if (rules.detectedGlobalChromeLabels && rules.detectedGlobalChromeLabels.some((lbl) => lbl.trim().toLowerCase() === lower)) {
      return true;
    }
  }

  // 2. Framework prefix pattern
  if (GENERIC_FRAMEWORK_PREFIX_PATTERN.test(raw)) return true;

  // 3. Generic UI chrome pattern
  if (GENERIC_UI_CHROME_EXACT_PATTERN.test(raw) || GENERIC_UI_CHROME_EXACT_PATTERN.test(lower)) {
    return true;
  }

  // 4. Substring checks for auto-generated framework tokens
  if (GENERIC_FRAMEWORK_SUBSTRING_PATTERNS.some((p) => p.test(lower))) {
    return true;
  }

  // 5. Standard non-domain controls
  if (
    lower.includes('baris per halaman') ||
    lower.includes('rows per page') ||
    lower.includes('toggle sidebar') ||
    lower.includes('buka menu') ||
    lower === '⌘k' ||
    lower === 'ctrl+k'
  ) {
    return true;
  }

  return false;
}

/**
 * Data-driven chrome detector: Identifies UI elements appearing across >= 80%
 * of crawled pages (e.g. global headers, persistent user badges, navigation bars).
 */
export function detectGlobalChromeLabels(
  pages: Array<{
    pagePath?: string;
    interactiveControls?: Array<{ label?: string; selector?: string }>;
    buttons?: Array<{ name?: string }>;
  }>,
  thresholdRatio: number = 0.8
): string[] {
  if (!pages || pages.length < 2) return [];

  const totalPages = pages.length;
  const labelPageCounts = new Map<string, Set<string>>();

  pages.forEach((page, pageIdx) => {
    const pageKey = page.pagePath || `page-${pageIdx}`;
    const labelsOnPage = new Set<string>();

    (page.interactiveControls || []).forEach((c) => {
      const l = (c.label || '').trim();
      if (l && l.length >= 2) labelsOnPage.add(l);
    });

    (page.buttons || []).forEach((b) => {
      const l = (b.name || '').trim();
      if (l && l.length >= 2) labelsOnPage.add(l);
    });

    labelsOnPage.forEach((label) => {
      const existing = labelPageCounts.get(label) || new Set<string>();
      existing.add(pageKey);
      labelPageCounts.set(label, existing);
    });
  });

  const globalChromeLabels: string[] = [];
  labelPageCounts.forEach((pageSet, label) => {
    const ratio = pageSet.size / totalPages;
    if (ratio >= thresholdRatio) {
      globalChromeLabels.push(label);
    }
  });

  return globalChromeLabels;
}

/**
 * Sanitizes sentence or requirement statement text using strict word boundaries.
 * Guarantees zero corruption of legitimate domain words like "identity", "endpoint", or "Menu".
 */
export function sanitizeStatementText(
  text: string,
  rules?: NoiseRules
): string {
  if (!text) return '';

  let result = text;

  // 1. Remove currentUsername with word boundaries if supplied
  if (rules?.currentUsername && rules.currentUsername.trim().length > 0) {
    const escapedUser = rules.currentUsername.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const userRegex = new RegExp(`(?<![\\p{L}\\p{N}])${escapedUser}(?![\\p{L}\\p{N}])`, 'giu');
    result = result.replace(userRegex, '');
  }

  // 2. Remove detected global chrome labels with word boundaries
  if (rules?.detectedGlobalChromeLabels && rules.detectedGlobalChromeLabels.length > 0) {
    for (const label of rules.detectedGlobalChromeLabels) {
      if (label && label.trim().length > 0) {
        const escapedLabel = label.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const labelRegex = new RegExp(`(?<![\\p{L}\\p{N}])${escapedLabel}(?![\\p{L}\\p{N}])`, 'giu');
        result = result.replace(labelRegex, '');
      }
    }
  }

  // 3. Remove generic framework tokens and UI chrome tokens using strict Unicode word boundaries
  const tokensToRemove = [
    '⌘k',
    'ctrl\\+k',
    'baris per halaman:?',
    'rows per page:?',
    'nav-button-[\\w-]+',
    'select_\\d+',
    'field-_r_\\w+',
    'field-\\w+-\\w+',
  ];

  const tokenPattern = new RegExp(
    `(?<![\\p{L}\\p{N}])(?:${tokensToRemove.join('|')})(?![\\p{L}\\p{N}])`,
    'giu'
  );
  result = result.replace(tokenPattern, '');

  // 4. Clean up dangling punctuation, double spaces, and brackets
  result = result
    .replace(/\(\s*,\s*/g, '(')
    .replace(/,\s*\)/g, ')')
    .replace(/\(\s*\)/g, '')
    .replace(/,\s*,/g, ',')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return result;
}
