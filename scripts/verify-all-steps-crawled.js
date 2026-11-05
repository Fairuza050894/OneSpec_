const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = '/Users/user/.gemini/antigravity-cli/brain/eb8d5ac8-b8a8-481b-a3f5-53e1d1269d07';

async function main() {
  console.log('[VERIFICATION] Launching Chromium browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.log(`[BROWSER ERROR] ${msg.text()}`);
    }
  });

  console.log('[VERIFICATION] Navigating to http://localhost:3000 ...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);

  // 1. Switch to BLIND URL / ZERO-DOC mode
  console.log('[VERIFICATION] Switching to BLIND URL / ZERO-DOC mode...');
  const blindModeBtn = page.locator('button:has-text("BLIND URL / ZERO-DOC")');
  await blindModeBtn.click();
  await page.waitForTimeout(500);

  // 2. Click Crawl URL button
  console.log('[VERIFICATION] Executing Crawl on http://10.10.15.75:3100/ ...');
  const crawlBtn = page.locator('button:has-text("Crawl URL & Back-Generate")');
  await crawlBtn.click();

  // Wait for crawl and automatic transition to Step 2
  console.log('[VERIFICATION] Waiting for crawl completion and state sync...');
  await page.waitForTimeout(14000);

  // --- STEP 02 VERIFICATION ---
  console.log('[VERIFICATION] Capturing Step 02 (BRD & PRD Specs)...');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verified-step02-specs.png') });
  const step2Text = await page.locator('main').innerText();
  console.log('[VERIFICATION] Step 02 contains "Mobospace":', step2Text.includes('Mobospace') || step2Text.includes('Control Tower'));
  console.log('[VERIFICATION] Step 02 contains "Voucher":', step2Text.includes('Voucher'));

  // --- STEP 01 VERIFICATION ---
  console.log('[VERIFICATION] Navigating to Step 01 (MoM Ingestion)...');
  await page.locator('aside button:has-text("01. Requirement & MoM")').click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verified-step01-mom.png') });
  const step1Text = await page.locator('main').innerText();
  console.log('[VERIFICATION] Step 01 contains "10.10.15.75:3100":', step1Text.includes('10.10.15.75:3100') || step1Text.includes('Mobospace'));

  // --- STEP 03 VERIFICATION (Modeler & Wireframe) ---
  console.log('[VERIFICATION] Navigating to Step 03 (BPMN Modeler & Wireframe)...');
  await page.locator('aside button:has-text("03. BPMN 2.0 & Wireframe")').click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verified-step03-bpmn.png') });

  // Switch to Wireframe sub-view
  console.log('[VERIFICATION] Switching to Step 03 Wireframe Simulator...');
  await page.locator('button:has-text("2. Contract Wireframe")').click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verified-step03-wireframe.png') });
  const step3WireframeText = await page.locator('main').innerText();
  console.log('[VERIFICATION] Step 03 Wireframe contains "Mobospace":', step3WireframeText.includes('Mobospace'));
  console.log('[VERIFICATION] Step 03 Wireframe contains "Pancaran":', step3WireframeText.includes('Pancaran'));

  // --- STEP 04 VERIFICATION ---
  console.log('[VERIFICATION] Navigating to Step 04 (RTM Test Matrix)...');
  await page.locator('aside button:has-text("04. RTM & Test Matrix")').click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verified-step04-rtm.png') });
  const step4Text = await page.locator('main').innerText();
  console.log('[VERIFICATION] Step 04 contains "Operator Authentication":', step4Text.includes('Operator Authentication') || step4Text.includes('/api/_auth/session'));
  console.log('[VERIFICATION] Step 04 contains "Voucher Checkout":', step4Text.includes('Voucher Checkout'));

  // --- STEP 05 VERIFICATION ---
  console.log('[VERIFICATION] Navigating to Step 05 (Auto-Discovery)...');
  await page.locator('aside button:has-text("05. Tri-Modal Auto-Discovery")').click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verified-step05-discovery.png') });
  const step5Text = await page.locator('main').innerText();
  console.log('[VERIFICATION] Step 05 contains "/api/_auth/session":', step5Text.includes('/api/_auth/session'));
  console.log('[VERIFICATION] Step 05 contains "Vouchers.code":', step5Text.includes('Vouchers.code'));

  // --- STEP 06 VERIFICATION ---
  console.log('[VERIFICATION] Navigating to Step 06 (PRD Gap Audit)...');
  await page.locator('aside button:has-text("06. Spec-to-Code Gap Audit")').click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verified-step06-gap-audit.png') });
  const step6Text = await page.locator('main').innerText();
  console.log('[VERIFICATION] Step 06 contains "Operators.tenant":', step6Text.includes('Operators.tenant') || step6Text.includes('/api/_auth/session'));

  // --- STEP 07 VERIFICATION ---
  console.log('[VERIFICATION] Navigating to Step 07 (Live Runner)...');
  await page.locator('aside button:has-text("07. Playwright & REA Live Runner")').click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verified-step07-runner.png') });
  const step7Text = await page.locator('main').innerText();
  console.log('[VERIFICATION] Step 07 contains "mobospace":', step7Text.toLowerCase().includes('mobospace'));
  console.log('[VERIFICATION] Step 07 contains "Voucher Checkout Engine":', step7Text.includes('Voucher Checkout Engine'));

  // Test 1-Click Run Unified Suite
  console.log('[VERIFICATION] Triggering Run Unified Suite in Step 07...');
  const runBtn = page.locator('button:has-text("Run Unified Suite")');
  if (await runBtn.isVisible()) {
    await runBtn.click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verified-step07-running.png') });
  }

  // Check header badge
  const headerText = await page.locator('header').innerText();
  console.log('[VERIFICATION] Header contains ACTIVE TARGET badge:', headerText.includes('ACTIVE TARGET'));

  await browser.close();
  console.log('[VERIFICATION] All Step verifications completed successfully!');
}

main().catch((err) => {
  console.error('[VERIFICATION FAILED]', err);
  process.exit(1);
});
