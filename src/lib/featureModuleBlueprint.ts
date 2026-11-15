/**
 * OneSpec SDLC Workbench - Data-Driven Feature Module UI Blueprint Renderer
 *
 * Produces a crisp 1280x720 dark enterprise UI mockup (SVG data URL) from a scraped
 * FeatureModuleSurface. Used as a deterministic anti-blank-screen fallback whenever a
 * live screenshot is missing, tiny, or uniformly white.
 */

import type { FeatureModuleSurface } from '@/types/sdlc';

export interface BlueprintButtonEntry {
  buttonName: string;
  screenLocation?: string;
  primaryPurpose?: string;
  calloutNumber?: number;
  xPercent?: number;
  yPercent?: number;
}

export interface BlueprintFilterEntry {
  filterName: string;
  controlType?: string;
  sampleValues?: string;
  calloutNumber?: number;
  xPercent?: number;
  yPercent?: number;
}

export type BlueprintModuleInput = Pick<FeatureModuleSurface, 'moduleName' | 'routePath'> &
  Partial<Omit<FeatureModuleSurface, 'moduleName' | 'routePath'>>;

const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 720;

const escapeXml = (value: string | undefined | null): string =>
  (value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const clip = (value: string | undefined | null, max: number): string => {
  const clean = (value || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, Math.max(1, max - 1)).trimEnd()}…`;
};

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

interface PlacedControl {
  label: string;
  x: number;
  y: number;
  width: number;
}

const placeControls = (
  entries: Array<{ label: string; xPercent?: number; yPercent?: number }>,
  fallbackY: number,
  fallbackStartX: number,
  fallbackStep: number
): PlacedControl[] => {
  const placed: PlacedControl[] = [];
  entries.slice(0, 8).forEach((entry, idx) => {
    const label = clip(entry.label, 24);
    if (!label) return;
    const width = clamp(46 + label.length * 7, 90, 210);
    const rawX =
      typeof entry.xPercent === 'number' && Number.isFinite(entry.xPercent)
        ? (clamp(entry.xPercent, 4, 96) / 100) * CANVAS_WIDTH
        : fallbackStartX + idx * fallbackStep;
    const rawY =
      typeof entry.yPercent === 'number' && Number.isFinite(entry.yPercent)
        ? (clamp(entry.yPercent, 4, 96) / 100) * CANVAS_HEIGHT
        : fallbackY;
    placed.push({
      label,
      width,
      x: clamp(rawX - width / 2, 268, CANVAS_WIDTH - width - 24),
      y: clamp(rawY - 15, 132, 152),
    });
  });
  return placed;
};

const renderTable = (mod: BlueprintModuleInput, x: number, y: number, width: number, height: number): string => {
  const columns = (mod.tableColumns || []).filter(Boolean).slice(0, 7);
  if (columns.length === 0) return '';
  const rows = (mod.sampleRows || []).filter((row) => Array.isArray(row) && row.length > 0).slice(0, 6);
  const headerHeight = 34;
  const rowHeight = Math.min(46, Math.max(30, Math.floor((height - headerHeight) / 7)));
  const colWidth = width / columns.length;
  const parts: string[] = [];

  parts.push(`<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="4" fill="#111317" stroke="#22262E" />`);
  parts.push(`<rect x="${x}" y="${y}" width="${width}" height="${headerHeight}" rx="4" fill="#16191F" />`);
  parts.push(`<rect x="${x}" y="${y + headerHeight - 4}" width="${width}" height="4" fill="#16191F" />`);

  columns.forEach((col, idx) => {
    parts.push(
      `<text x="${x + idx * colWidth + 12}" y="${y + 22}" fill="#8A8F98" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="11" font-weight="700" letter-spacing="0.6">${escapeXml(
        clip(col, 22).toUpperCase()
      )}</text>`
    );
  });

  const bodyRows = rows.length > 0 ? rows : [columns.map((_, idx) => (idx === 0 ? '—' : ''))];
  bodyRows.forEach((row, rIdx) => {
    const rowY = y + headerHeight + rIdx * rowHeight;
    parts.push(`<line x1="${x}" y1="${rowY}" x2="${x + width}" y2="${rowY}" stroke="#1C2027" stroke-width="1" />`);
    if (rIdx % 2 === 1) {
      parts.push(`<rect x="${x}" y="${rowY}" width="${width}" height="${rowHeight}" fill="#0E1015" />`);
    }
    columns.forEach((col, cIdx) => {
      const cell = clip(row[cIdx] || (rIdx === 0 && rows.length === 0 ? 'No records captured' : ''), 20);
      parts.push(
        `<text x="${x + cIdx * colWidth + 12}" y="${rowY + rowHeight / 2 + 4}" fill="${
          cIdx === 0 ? '#EDEDED' : '#B4B9C2'
        }" font-family="ui-sans-serif, -apple-system, Segoe UI, sans-serif" font-size="12">${escapeXml(cell)}</text>`
      );
    });
  });

  if (rows.length === 0) {
    parts.push(
      `<text x="${x + width / 2}" y="${y + height - 22}" text-anchor="middle" fill="#5C6270" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="10.5">EMPTY SAMPLE SET · ${columns.length} COLUMNS DISCOVERED</text>`
    );
  }

  if (mod.totalRowCountText) {
    parts.push(
      `<text x="${x + width - 14}" y="${y + height - 12}" text-anchor="end" fill="#5C6270" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="10.5" font-variant-numeric="tabular-nums">${escapeXml(
        clip(mod.totalRowCountText, 40)
      )}</text>`
    );
  }
  return parts.join('');
};

const renderCards = (mod: BlueprintModuleInput, x: number, y: number, width: number, height: number): string => {
  const cards = (mod.cardItems || []).filter((card) => card && card.title).slice(0, 6);
  if (cards.length === 0) return '';
  const gap = 14;
  const cols = cards.length === 1 ? 1 : 2;
  const cardWidth = (width - gap * (cols - 1)) / cols;
  const rowCount = Math.ceil(cards.length / cols);
  const cardHeight = Math.min(150, Math.max(84, (height - gap * (rowCount - 1)) / rowCount));
  const parts: string[] = [];

  cards.forEach((card, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const cx = x + col * (cardWidth + gap);
    const cy = y + row * (cardHeight + gap);
    parts.push(
      `<rect x="${cx}" y="${cy}" width="${cardWidth}" height="${cardHeight}" rx="4" fill="#111317" stroke="#22262E" />`,
      `<rect x="${cx}" y="${cy}" width="3" height="${cardHeight}" rx="1.5" fill="#2563EB" />`,
      `<text x="${cx + 14}" y="${cy + 24}" fill="#EDEDED" font-family="ui-sans-serif, -apple-system, Segoe UI, sans-serif" font-size="13" font-weight="700">${escapeXml(
        clip(card.title, 34)
      )}</text>`
    );
    let badgeX = cx + 14;
    (card.badges || []).slice(0, 3).forEach((badge) => {
      const badgeText = clip(badge, 16);
      const badgeWidth = clamp(26 + badgeText.length * 6.4, 52, 150);
      parts.push(
        `<rect x="${badgeX}" y="${cy + 34}" width="${badgeWidth}" height="19" rx="2" fill="#059669" fill-opacity="0.18" stroke="#059669" stroke-opacity="0.45" />`,
        `<text x="${badgeX + badgeWidth / 2}" y="${cy + 47}" text-anchor="middle" fill="#10B981" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="10" font-weight="700">${escapeXml(
          badgeText.toUpperCase()
        )}</text>`
      );
      badgeX += badgeWidth + 6;
    });
    (card.metadata || []).slice(0, 3).forEach((meta, mIdx) => {
      parts.push(
        `<text x="${cx + 14}" y="${cy + 70 + mIdx * 16}" fill="#8A8F98" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="11">${escapeXml(
          clip(meta, 42)
        )}</text>`
      );
    });
  });
  return parts.join('');
};

/**
 * Render a 1280x720 dark enterprise UI blueprint for a feature module.
 * Returns a `data:image/svg+xml;base64,...` URL that every browser renders crisply.
 */
export function buildFeatureModuleBlueprintSvgDataUrl(
  mod: BlueprintModuleInput,
  buttons: BlueprintButtonEntry[] = [],
  filters: BlueprintFilterEntry[] = []
): string {
  const moduleName = clip(mod.moduleName || mod.pageHeading || 'Feature Module', 48) || 'Feature Module';
  const routePath = clip(mod.routePath || '/', 44) || '/';
  const pageHeading = clip(mod.pageHeading || mod.moduleName || moduleName, 58);
  const tabs = (mod.subTabsCatalog || []).map((tab) => clip(tab.tabName, 20)).filter(Boolean).slice(0, 5);
  const formTitles = (mod.formsAndModals || []).map((form) => clip(form.formTitle, 20)).filter(Boolean).slice(0, 2);
  const navItems = [...tabs, ...formTitles].slice(0, 6);

  const placedButtons = placeControls(
    buttons.map((button) => ({ label: button.buttonName, xPercent: button.xPercent, yPercent: button.yPercent })),
    132,
    CANVAS_WIDTH - 140,
    -168
  );
  const placedFilters = placeControls(
    filters.map((filter) => ({ label: filter.filterName, xPercent: filter.xPercent, yPercent: filter.yPercent })),
    132,
    300,
    170
  );

  const parts: string[] = [];
  parts.push(`<rect x="0" y="0" width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" fill="#0B0C0E" />`);

  // Top application bar
  parts.push(
    `<rect x="0" y="0" width="${CANVAS_WIDTH}" height="52" fill="#16191F" />`,
    `<line x1="0" y1="52" x2="${CANVAS_WIDTH}" y2="52" stroke="#22262E" stroke-width="1" />`,
    `<rect x="22" y="16" width="20" height="20" rx="3" fill="#2563EB" />`,
    `<text x="52" y="31" fill="#EDEDED" font-family="ui-sans-serif, -apple-system, Segoe UI, sans-serif" font-size="14.5" font-weight="700">${escapeXml(
      moduleName
    )}</text>`,
    `<text x="52" y="45" fill="#5C6270" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="10">MODULE WORKSPACE · ISO/IEC/IEEE 26514:2022</text>`,
    `<rect x="${CANVAS_WIDTH - 292}" y="15" width="266" height="22" rx="2" fill="#0B0C0E" stroke="#22262E" />`,
    `<text x="${CANVAS_WIDTH - 280}" y="30" fill="#60A5FA" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="11">${escapeXml(
      routePath
    )}</text>`
  );

  // Sidebar
  parts.push(
    `<rect x="0" y="52" width="240" height="${CANVAS_HEIGHT - 52}" fill="#111317" />`,
    `<line x1="240" y1="52" x2="240" y2="${CANVAS_HEIGHT}" stroke="#22262E" stroke-width="1" />`,
    `<text x="20" y="82" fill="#5C6270" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="9.5" font-weight="700" letter-spacing="1">APPLICATION NAVIGATION</text>`
  );
  const sidebarItems = navItems.length > 0 ? navItems : [moduleName];
  sidebarItems.forEach((item, idx) => {
    const itemY = 96 + idx * 30;
    const isActive = idx === 0;
    if (isActive) {
      parts.push(`<rect x="10" y="${itemY}" width="220" height="26" rx="2" fill="#2563EB" fill-opacity="0.14" />`);
      parts.push(`<rect x="10" y="${itemY}" width="2.5" height="26" fill="#3B82F6" />`);
    }
    parts.push(
      `<text x="24" y="${itemY + 17}" fill="${isActive ? '#EDEDED' : '#8A8F98'}" font-family="ui-sans-serif, -apple-system, Segoe UI, sans-serif" font-size="11.5" font-weight="${
        isActive ? '700' : '400'
      }">${escapeXml(item)}</text>`
    );
  });
  parts.push(
    `<rect x="10" y="${CANVAS_HEIGHT - 58}" width="220" height="40" rx="3" fill="#0B0C0E" stroke="#22262E" />`,
    `<text x="24" y="${CANVAS_HEIGHT - 38}" fill="#10B981" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="9.5" font-weight="700">ISO 26514 ANNOTATED SURFACE</text>`,
    `<text x="24" y="${CANVAS_HEIGHT - 26}" fill="#5C6270" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="9">Rendered from harvested DOM data</text>`
  );

  // Sub-tabs strip
  const tabsStartX = 260;
  const tabsBarY = 62;
  parts.push(`<rect x="${tabsStartX}" y="${tabsBarY}" width="${CANVAS_WIDTH - tabsStartX - 24}" height="30" rx="3" fill="#111317" stroke="#22262E" />`);
  const stripItems = (tabs.length > 0 ? tabs : ['Primary View']).slice(0, 5);
  let tabX = tabsStartX + 10;
  stripItems.forEach((tab, idx) => {
    const tabWidth = clamp(30 + tab.length * 6.6, 78, 176);
    const active = idx === 0;
    parts.push(
      `<rect x="${tabX}" y="${tabsBarY + 5}" width="${tabWidth}" height="20" rx="2" fill="${active ? '#2563EB' : '#16191F'}" ${
        active ? '' : 'stroke="#22262E"'
      } />`,
      `<text x="${tabX + tabWidth / 2}" y="${tabsBarY + 19}" text-anchor="middle" fill="${
        active ? '#FFFFFF' : '#8A8F98'
      }" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="10" font-weight="${active ? '700' : '400'}">${escapeXml(
        tab
      )}</text>`
    );
    tabX += tabWidth + 8;
  });

  // Page heading
  parts.push(
    `<text x="260" y="118" fill="#EDEDED" font-family="ui-sans-serif, -apple-system, Segoe UI, sans-serif" font-size="17" font-weight="700">${escapeXml(
      pageHeading
    )}</text>`
  );

  // Filter & search toolbar at harvested coordinates
  parts.push(
    `<rect x="260" y="128" width="${CANVAS_WIDTH - 284}" height="52" rx="4" fill="#111317" stroke="#22262E" />`,
    `<text x="272" y="174" fill="#5C6270" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="8.5" font-weight="700" letter-spacing="0.8">SEARCH / FILTER TOOLBAR</text>`
  );
  placedFilters.forEach((control) => {
    parts.push(
      `<rect x="${control.x}" y="${control.y}" width="${control.width}" height="26" rx="2" fill="#0B0C0E" stroke="#D97706" stroke-opacity="0.75" />`,
      `<text x="${control.x + control.width / 2}" y="${control.y + 17}" text-anchor="middle" fill="#F0B25A" font-family="ui-sans-serif, -apple-system, Segoe UI, sans-serif" font-size="10.5">${escapeXml(
        control.label
      )}</text>`
    );
  });
  placedButtons.forEach((control) => {
    parts.push(
      `<rect x="${control.x}" y="${control.y}" width="${control.width}" height="26" rx="2" fill="#2563EB" fill-opacity="0.85" />`,
      `<text x="${control.x + control.width / 2}" y="${control.y + 17}" text-anchor="middle" fill="#FFFFFF" font-family="ui-sans-serif, -apple-system, Segoe UI, sans-serif" font-size="10.5" font-weight="700">${escapeXml(
        control.label
      )}</text>`
    );
  });
  if (placedFilters.length === 0 && placedButtons.length === 0) {
    parts.push(
      `<text x="272" y="163" fill="#5C6270" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="10">NO TOOLBAR CONTROLS HARVESTED ON THIS MODULE</text>`
    );
  }

  // Main data canvas
  const canvasX = 260;
  const canvasY = 192;
  const canvasWidth = CANVAS_WIDTH - canvasX - 24;
  const canvasHeight = CANVAS_HEIGHT - canvasY - 24;
  const cards = renderCards(mod, canvasX, canvasY, canvasWidth, canvasHeight);
  if (cards) {
    parts.push(cards);
  } else {
    const table = renderTable(mod, canvasX, canvasY, canvasWidth, canvasHeight);
    if (table) {
      parts.push(table);
    } else {
      parts.push(
        `<rect x="${canvasX}" y="${canvasY}" width="${canvasWidth}" height="${canvasHeight}" rx="4" fill="#111317" stroke="#22262E" stroke-dasharray="6 5" />`,
        `<text x="${canvasX + canvasWidth / 2}" y="${canvasY + canvasHeight / 2 - 10}" text-anchor="middle" fill="#8A8F98" font-family="ui-sans-serif, -apple-system, Segoe UI, sans-serif" font-size="13" font-weight="700">${escapeXml(
          pageHeading
        )}</text>`,
        `<text x="${canvasX + canvasWidth / 2}" y="${canvasY + canvasHeight / 2 + 14}" text-anchor="middle" fill="#5C6270" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="10.5">LIVE WORKSPACE SURFACE & INTERACTIVE CONTROLS READY</text>`
      );
      const apiLines = (mod.triggeredApis || []).slice(0, 4);
      apiLines.forEach((api, idx) => {
        const lineY = canvasY + canvasHeight / 2 + 52 + idx * 18;
        parts.push(
          `<text x="${canvasX + canvasWidth / 2}" y="${lineY}" text-anchor="middle" fill="#60A5FA" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="10.5">${escapeXml(
            clip(`${api.method} ${api.path} · HTTP ${api.status}`, 64)
          )}</text>`
        );
      });
    }
  }

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" viewBox="0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}" role="img" aria-label="${escapeXml(
      `${moduleName} UI blueprint`
    )}">` +
    `<rect x="0" y="0" width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" fill="#0F172A" />` +
    parts.join('') +
    `</svg>`;

  const base64 =
    typeof Buffer !== 'undefined'
      ? Buffer.from(svg, 'utf8').toString('base64')
      : btoa(unescape(encodeURIComponent(svg)));
  return `data:image/svg+xml;base64,${base64}`;
}

/**
 * True when a screenshot data URL is missing, invalid, un-base64-encoded SVG,
 * or a suspiciously tiny JPEG/PNG that compresses to near-uniform white.
 */
export function isBlankOrMissingScreenshot(dataUrl: string | undefined | null): boolean {
  if (!dataUrl || typeof dataUrl !== 'string') return true;
  if (!dataUrl.startsWith('data:image/')) return true;
  if (dataUrl.startsWith('data:image/svg+xml;utf8')) return true;
  if (dataUrl.startsWith('data:image/svg+xml;base64,')) return false;
  return dataUrl.length < 1500;
}
