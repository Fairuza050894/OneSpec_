const { chromium } = require('playwright');
const path = require('path');

async function capture() {
  const artifactDir = '/Users/user/.gemini/antigravity-cli/brain/eb8d5ac8-b8a8-481b-a3f5-53e1d1269d07';
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:3000 ...');
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  // Close command palette if open
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  // Switch to Step 6: PRD Gap Auditor
  console.log('Switching to Step 6 PRD Gap Auditor tab...');
  const step6Btn = page.locator('button:has-text("06 PRD Gap Audit"), button:has-text("Step 6: PRD Gap Auditor")').first();
  await step6Btn.click({ force: true });
  await page.waitForTimeout(2000);

  // 1. Screenshot of Gap Auditor Workbench (Discrepancy Matrix + Diff Editor)
  console.log('Capturing Gap Auditor Workbench (GAP-002 Active)...');
  const matrixPath = path.join(artifactDir, 'screenshot-step6-gap-matrix.png');
  await page.screenshot({ path: matrixPath, fullPage: false });
  console.log(`Saved screenshot to ${matrixPath}`);

  // 2. Select GAP-003 (Schema Precision Mismatch) to inspect SQL/Prisma diff
  console.log('Selecting GAP-003 Schema Type Mismatch row...');
  const gap003Row = page.locator('tr:has-text("GAP-003")').first();
  await gap003Row.click({ force: true });
  await page.waitForTimeout(2000);

  const diffPath = path.join(artifactDir, 'screenshot-step6-diff-editor.png');
  await page.screenshot({ path: diffPath, fullPage: false });
  console.log(`Saved screenshot to ${diffPath}`);

  // 3. Select GAP-004 (Undocumented Shadow API)
  console.log('Selecting GAP-004 Undocumented Shadow API row...');
  const gap004Row = page.locator('tr:has-text("GAP-004")').first();
  await gap004Row.click({ force: true });
  await page.waitForTimeout(1500);

  const inspectorPath = path.join(artifactDir, 'screenshot-step6-defect-inspector.png');
  await page.screenshot({ path: inspectorPath, fullPage: false });
  console.log(`Saved screenshot to ${inspectorPath}`);

  await browser.close();
  console.log('Step 6 visual captures completed successfully.');
}

capture().catch((err) => {
  console.error('Capture error:', err);
  process.exit(1);
});
