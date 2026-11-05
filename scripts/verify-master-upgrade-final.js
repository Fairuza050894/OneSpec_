const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = '/Users/user/.gemini/antigravity-cli/brain/eb8d5ac8-b8a8-481b-a3f5-53e1d1269d07';

async function run() {
  console.log('[PLAYWRIGHT] Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  console.log('[PLAYWRIGHT] Navigating to http://localhost:3000 ...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  // 1. Step 01: Click BLIND URL / ZERO-DOC mode button
  console.log('[PLAYWRIGHT] Testing Step 01 Blind URL Mode...');
  const blindModeBtn = page.locator('button:has-text("BLIND URL / ZERO-DOC")');
  if (await blindModeBtn.count() > 0) {
    await blindModeBtn.first().click();
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'upgrade-step1-blind-crawler.png'),
    });
    console.log('[PLAYWRIGHT] Captured upgrade-step1-blind-crawler.png');
  }

  // 2. Step 03: BPMN 2.0 View
  console.log('[PLAYWRIGHT] Testing Step 03 BPMN 2.0 Canvas...');
  const step3Btn = page.locator('button:has-text("03. BPMN 2.0 & Wireframe")');
  if (await step3Btn.count() > 0) {
    await step3Btn.first().click();
    await page.waitForTimeout(1500);
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'upgrade-step3-bpmn-polished.png'),
    });
    console.log('[PLAYWRIGHT] Captured upgrade-step3-bpmn-polished.png');
  }

  // 3. Step 04: RTM Matrix & Inspector
  console.log('[PLAYWRIGHT] Testing Step 04 RTM & Inspector...');
  const step4Btn = page.locator('button:has-text("04. RTM & Test Matrix")');
  if (await step4Btn.count() > 0) {
    await step4Btn.first().click();
    await page.waitForTimeout(1200);

    // Click on row TC-001 or row TC-003
    const row = page.locator('td:has-text("TC-001")');
    if (await row.count() > 0) {
      await row.first().click();
      await page.waitForTimeout(1000);
    }

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'upgrade-step4-rtm-inspector.png'),
    });
    console.log('[PLAYWRIGHT] Captured upgrade-step4-rtm-inspector.png');
  }

  // 4. Step 07: Live Runner 2-Row Toolbar & Canvas
  console.log('[PLAYWRIGHT] Testing Step 07 Live Runner...');
  const step7Btn = page.locator('button:has-text("07. Playwright & REA Live Runner")');
  if (await step7Btn.count() > 0) {
    await step7Btn.first().click();
    await page.waitForTimeout(1500);
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'upgrade-step7-runner-polished.png'),
    });
    console.log('[PLAYWRIGHT] Captured upgrade-step7-runner-polished.png');
  }

  await browser.close();
  console.log('[PLAYWRIGHT] All verification captures completed successfully!');
}

run().catch((err) => {
  console.error('[PLAYWRIGHT ERROR]', err);
  process.exit(1);
});
