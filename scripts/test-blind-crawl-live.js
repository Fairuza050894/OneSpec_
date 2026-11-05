const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = '/Users/user/.gemini/antigravity-cli/brain/eb8d5ac8-b8a8-481b-a3f5-53e1d1269d07';

async function main() {
  console.log('[TEST] Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on('console', msg => console.log(`[CLIENT CONSOLE] ${msg.text()}`));

  console.log('[TEST] Navigating to http://localhost:3000 ...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);

  // 1. Click BLIND URL / ZERO-DOC mode button
  console.log('[TEST] Switching to BLIND URL / ZERO-DOC mode...');
  const blindModeBtn = page.locator('button:has-text("BLIND URL / ZERO-DOC")');
  await blindModeBtn.click();
  await page.waitForTimeout(500);

  // 2. Click Crawl URL button
  console.log('[TEST] Clicking Crawl URL button...');
  const crawlBtn = page.locator('button:has-text("Crawl URL & Back-Generate")');
  await crawlBtn.click();

  // Wait for crawl to complete and transition to Step 2
  console.log('[TEST] Waiting for crawl completion (3-4 seconds)...');
  await page.waitForTimeout(4500);

  // Capture Step 2 with Mobospace specs
  console.log('[TEST] Capturing Step 2 Mobospace BRD/PRD Specs...');
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'mobospace-step2-specs.png'),
  });

  // Navigate to Step 3 to capture BPMN
  console.log('[TEST] Navigating to Step 3 BPMN...');
  const step3Btn = page.locator('button:has-text("03. BPMN 2.0 & Wireframe")');
  await step3Btn.click();
  await page.waitForTimeout(1500);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'mobospace-step3-bpmn.png'),
  });

  // Navigate to Step 4 to capture RTM
  console.log('[TEST] Navigating to Step 4 RTM...');
  const step4Btn = page.locator('button:has-text("04. RTM & Test Matrix")');
  await step4Btn.click();
  await page.waitForTimeout(1500);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'mobospace-step4-rtm.png'),
  });

  // Navigate back to Step 1 to show updated MoM and Extracted Entities
  console.log('[TEST] Navigating back to Step 1 MoM...');
  const step1Btn = page.locator('button:has-text("01. Requirement & MoM")');
  await step1Btn.click();
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'mobospace-step1-mom-harvested.png'),
  });

  await browser.close();
  console.log('[TEST] Complete!');
}

main().catch(err => {
  console.error('[TEST ERROR]', err);
  process.exit(1);
});
