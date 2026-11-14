/**
 * Regression guard for the anti-blank screenshot pipeline.
 *
 * A post-login SPA can be captured while it is still a uniform white canvas.
 * That frame still encodes to ~7.6 KB of base64, so the original byte-length
 * heuristic let it through and the ISO 26514 reader rendered a white box.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import sharp from 'sharp';
import { classifySampledPixels } from '../src/lib/screenshotQuality';
import { buildFeatureModuleBlueprintSvgDataUrl } from '../src/lib/featureModuleBlueprint';
import { sanitizeFeatureModuleScreenshots } from '../src/lib/featureModuleScreenshotSanitizer';
import { isBlankRasterBuffer, isBlankRasterDataUrl } from '../src/services/screenshotIntegrityService';
import type { FeatureModuleSurface } from '../src/types/sdlc';

const blankSvg = (fill: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720"><rect width="1280" height="720" fill="${fill}"/></svg>`;

const sparseWhiteSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720"><rect width="1280" height="720" fill="#FFFFFF"/><text x="60" y="70" fill="#111111" font-size="24" font-family="Arial">Invoice Form</text><rect x="60" y="110" width="360" height="36" fill="#FFFFFF" stroke="#BBBBBB"/></svg>`;

const toJpeg = (svg: string) => sharp(Buffer.from(svg)).jpeg({ quality: 62 }).toBuffer();
const toDataUrl = (buffer: Buffer) => `data:image/jpeg;base64,${buffer.toString('base64')}`;

async function clientVerdict(buffer: Buffer) {
  const { data, info } = await sharp(buffer)
    .resize(96, 54, { fit: 'fill' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return classifySampledPixels(new Uint8ClampedArray(data), info.channels);
}

const moduleSurface = {
  moduleId: 'MOD-06',
  moduleName: 'Shipment Details',
  routePath: '/shipmentdetail',
  fullUrl: 'http://127.0.0.1:3000/shipmentdetail',
  pageHeading: 'Shipment Details',
  hasDataTable: true,
  tableColumns: ['AWB', 'Status'],
  sampleRowData: [],
  hasSearchOrFilter: true,
  searchFilterSelectors: ['input'],
  formsAndModals: [],
  triggeredApis: [{ method: 'GET', path: '/api/shipments/detail', status: 200, latencyMs: 42 }],
  observedAnomalies: [],
  screenControlsCatalog: [
    { controlName: 'Export Manifest', controlType: 'PRIMARY_ACTION_BUTTON', screenLocation: 'Toolbar', availableOptionsOrSample: 'Download CSV' },
    { controlName: 'List Search', controlType: 'SEARCH_INPUT', screenLocation: 'Toolbar', availableOptionsOrSample: 'AWB' },
  ],
} as unknown as FeatureModuleSurface;

async function main() {
  const blankWhite = await toJpeg(blankSvg('#FFFFFF'));
  const blankWhiteUrl = toDataUrl(blankWhite);
  assert.ok(
    blankWhiteUrl.length > 6500,
    `guard precondition: blank 1280x720 JPEG must exceed the old 6500-char heuristic (got ${blankWhiteUrl.length})`
  );
  assert.equal(await isBlankRasterBuffer(blankWhite), true, 'uniform white JPEG must be flagged blank');
  assert.equal(await isBlankRasterDataUrl(blankWhiteUrl), true, 'uniform white data URL must be flagged blank');
  assert.equal(await clientVerdict(blankWhite), 'BLANK', 'browser classifier must flag uniform white');

  const blankDark = await toJpeg(blankSvg('#0B0C0E'));
  assert.equal(await isBlankRasterBuffer(blankDark), true, 'uniform dark frame is still an empty canvas');

  const sparseWhite = await toJpeg(sparseWhiteSvg);
  assert.equal(await isBlankRasterBuffer(sparseWhite), false, 'a sparse but real page must stay a capture');
  assert.equal(await clientVerdict(sparseWhite), 'CONTENT', 'browser classifier must keep sparse real pages');

  const screenshotPath = fs.existsSync('public/docs/screenshots/screenshot-overview.png')
    ? 'public/docs/screenshots/screenshot-overview.png'
    : 'screenshot-overview.png';
  const realUi = await sharp(screenshotPath).jpeg({ quality: 62 }).toBuffer();
  assert.equal(await isBlankRasterBuffer(realUi), false, 'real workbench capture must not be replaced');
  assert.equal(await clientVerdict(realUi), 'CONTENT', 'browser classifier must keep real UI');

  const blueprintUrl = buildFeatureModuleBlueprintSvgDataUrl(moduleSurface, [], []);
  assert.ok(blueprintUrl.startsWith('data:image/svg+xml'), 'blueprint must be an SVG data URL');
  const blueprintPng = await sharp(Buffer.from(decodeURIComponent(blueprintUrl.split(',')[1]))).png().toBuffer();
  const meta = await sharp(blueprintPng).metadata();
  assert.equal(meta.width, 1280);
  assert.equal(meta.height, 720);
  assert.equal(await isBlankRasterBuffer(blueprintPng), false, 'rasterized blueprint must contain visible UI');

  const sanitized = await sanitizeFeatureModuleScreenshots(
    [
      { ...moduleSurface, screenshotDataUrl: blankWhiteUrl },
      { ...moduleSurface, moduleId: 'MOD-04', moduleName: 'Shipment Activity Dashboard', screenshotDataUrl: toDataUrl(realUi) },
    ],
    isBlankRasterDataUrl
  );
  assert.ok(sanitized[0].screenshotDataUrl?.startsWith('data:image/svg+xml'), 'blank module must fall back to blueprint');
  assert.equal(sanitized[1].screenshotDataUrl, toDataUrl(realUi), 'real capture must pass through untouched');

  console.log('Anti-blank screenshot guard (pixel sampling, blueprint fallback, export sanitizer) verified');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
