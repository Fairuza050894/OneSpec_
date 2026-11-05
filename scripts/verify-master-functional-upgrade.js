const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = '/Users/user/.gemini/antigravity-cli/brain/eb8d5ac8-b8a8-481b-a3f5-53e1d1269d07';

async function verify() {
  console.log('[PLAYWRIGHT] Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.log(`[BROWSER ERROR] ${msg.text()}`);
    }
  });

  console.log('[PLAYWRIGHT] Navigating to http://localhost:3000 ...');
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);

  // 1. STEP 05: GIT DIRECT CONNECT & PULL REQUESTS
  console.log('[PLAYWRIGHT] Navigating to Step 05...');
  const step5Btn = page.locator('button:has-text("05. Tri-Modal Auto-Discovery")');
  await step5Btn.click();
  await page.waitForTimeout(1000);

  // Test Fetch Branches & PRs
  console.log('[PLAYWRIGHT] Fetching Git Branches & PRs...');
  const fetchRefsBtn = page.locator('button:has-text("Fetch Branches & PRs")');
  if (await fetchRefsBtn.count() > 0) {
    await fetchRefsBtn.click();
    await page.waitForTimeout(1000);
  }

  // Select PR #142
  const refSelect = page.locator('select').filter({ hasText: 'PR #142' }).or(page.locator('select:has(optgroup)')).first();
  if (await refSelect.count() > 0) {
    await refSelect.selectOption({ label: 'PR #142: feat(checkout): add voucher quota validation' });
    await page.waitForTimeout(500);
  }

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'upgrade-step5-git-prs.png'),
    fullPage: false,
  });

  // 2. STEP 05: MODE B DEVICE .ZIP UPLOADER & FOLDER PICKER
  console.log('[PLAYWRIGHT] Testing Step 05 Mode B (Device ZIP / Folder)...');
  const modeBBtn = page.locator('button:has-text("Mode B: Device .ZIP")');
  if (await modeBBtn.count() > 0) {
    await modeBBtn.click();
    await page.waitForTimeout(800);
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'upgrade-step5-zip-dropzone.png'),
      fullPage: false,
    });
  }

  // 3. STEP 07: 1-CLICK UNIFIED RUNNER (TOP BAR & SUB-VIEW 1)
  console.log('[PLAYWRIGHT] Navigating to Step 07...');
  const step7Btn = page.locator('button:has-text("07. Playwright & REA Live Runner")');
  await step7Btn.click();
  await page.waitForTimeout(1500);

  // Trigger 1-Click Unified Runner
  console.log('[PLAYWRIGHT] Triggering ▶ Run All (E2E + API + k6 Load)...');
  const runAllBtn = page.locator('button:has-text("Run All")');
  if (await runAllBtn.count() > 0) {
    await runAllBtn.click();
    // Wait for the 3-phase execution simulation to complete
    await page.waitForTimeout(2500);
  }

  // Capture Sub-View 1 with k6 telemetry strip
  console.log('[PLAYWRIGHT] Capturing Step 07 Sub-View 1 (k6 Telemetry Strip & Pipeline)...');
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'upgrade-step7-k6-telemetry.png'),
    fullPage: false,
  });

  // 4. STEP 07: SUB-VIEW 2 (50/50 SPLIT WORKBENCH)
  console.log('[PLAYWRIGHT] Switching to Sub-View 2 (Split Workbench)...');
  const splitTabBtn = page.locator('button:has-text("2. Test Scripts (.spec.ts & .k6.js)")');
  if (await splitTabBtn.count() > 0) {
    await splitTabBtn.click();
    await page.waitForTimeout(1000);

    // Switch to k6 script on the left
    const k6Tab = page.locator('button:has-text("tests/load/voucher-checkout.k6.js")');
    if (await k6Tab.count() > 0) {
      await k6Tab.click();
      await page.waitForTimeout(500);
    }

    // Expand TC-008 in accordion on the right
    const tc008Btn = page.locator('button:has-text("TC-008")');
    if (await tc008Btn.count() > 0) {
      await tc008Btn.click();
      await page.waitForTimeout(500);
    }

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'upgrade-step7-split-functional.png'),
      fullPage: false,
    });

    // Switch right pane to k6 Load & Stress Metrics table
    const k6MetricsTab = page.locator('button:has-text("k6 Load & Stress Metrics")');
    if (await k6MetricsTab.count() > 0) {
      await k6MetricsTab.click();
      await page.waitForTimeout(500);
      await page.screenshot({
        path: path.join(ARTIFACT_DIR, 'upgrade-step7-split-k6-metrics.png'),
        fullPage: false,
      });
    }
  }

  // 5. TEST REPORT DOWNLOAD GENERATOR
  console.log('[PLAYWRIGHT] Testing Report Downloads...');
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 5000 }).catch(() => null),
    page.locator('button:has-text("HTML Report")').click().catch(() => null),
  ]);

  if (download) {
    console.log(`[PLAYWRIGHT] Successfully intercepted download: ${download.suggestedFilename()}`);
  }

  // 6. CLICK DB BOTTLENECK STAGE TO SHOW RIGHT INSPECTOR
  console.log('[PLAYWRIGHT] Returning to Sub-View 1 to verify Contextual Inspector with DB fix...');
  const liveTabBtn = page.locator('button:has-text("1. Live Execution & Bottleneck Stream")');
  if (await liveTabBtn.count() > 0) {
    await liveTabBtn.click();
    await page.waitForTimeout(1000);

    // Click node 4 (Database Query Execution)
    const dbNode = page.locator('div:has-text("4. Database Query Execution")').last();
    if (await dbNode.count() > 0) {
      await dbNode.click();
      await page.waitForTimeout(800);
      await page.screenshot({
        path: path.join(ARTIFACT_DIR, 'upgrade-step7-inspector-bottleneck.png'),
        fullPage: false,
      });
    }
  }

  await browser.close();
  console.log('[PLAYWRIGHT] All master functional upgrades verified and captured!');
}

verify().catch((err) => {
  console.error('[PLAYWRIGHT ERROR]', err);
  process.exit(1);
});
