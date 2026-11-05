const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = '/Users/user/.gemini/antigravity-cli/brain/eb8d5ac8-b8a8-481b-a3f5-53e1d1269d07';

async function capture() {
  console.log('[PLAYWRIGHT] Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`[BROWSER ERROR] ${msg.text()}`);
    }
  });

  console.log('[PLAYWRIGHT] Navigating to http://localhost:3000 ...');
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2500);

  // Capture Step 1
  console.log('[PLAYWRIGHT] Capturing Step 1 (MoM)...');
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'clean-step1-mom.png'),
    fullPage: false,
  });

  // Step 2
  console.log('[PLAYWRIGHT] Clicking Step 2...');
  const step2Btn = page.locator('button:has-text("02. BRD & PRD Spec")');
  if (await step2Btn.count() > 0) {
    await step2Btn.first().click();
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'clean-step2-spec.png'),
      fullPage: false,
    });
  }

  // Step 3
  console.log('[PLAYWRIGHT] Clicking Step 3...');
  const step3Btn = page.locator('button:has-text("03. BPMN 2.0 & Wireframe")');
  if (await step3Btn.count() > 0) {
    await step3Btn.first().click();
    await page.waitForTimeout(1500);
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'clean-step3-bpmn.png'),
      fullPage: false,
    });
  }

  // Step 4
  console.log('[PLAYWRIGHT] Clicking Step 4...');
  const step4Btn = page.locator('button:has-text("04. RTM & Test Matrix")');
  if (await step4Btn.count() > 0) {
    await step4Btn.first().click();
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'clean-step4-rtm.png'),
      fullPage: false,
    });

    // Row selection for inspector
    console.log('[PLAYWRIGHT] Selecting row in Step 4...');
    const tableRow = page.locator('tbody tr').first();
    if (await tableRow.count() > 0) {
      await tableRow.click();
      await page.waitForTimeout(800);
      await page.screenshot({
        path: path.join(ARTIFACT_DIR, 'clean-step4-with-inspector.png'),
        fullPage: false,
      });

      // Close inspector via [X]
      const closeBtn = page.locator('button[aria-label="Close Inspector"]').or(page.locator('button:has-text("Close")')).first();
      if (await closeBtn.count() > 0) {
        await closeBtn.click();
        await page.waitForTimeout(400);
      }
    }
  }

  // Step 5
  console.log('[PLAYWRIGHT] Clicking Step 5...');
  const step5Btn = page.locator('button:has-text("05. Tri-Modal Auto-Discovery")');
  if (await step5Btn.count() > 0) {
    await step5Btn.first().click();
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'clean-step5-discovery.png'),
      fullPage: false,
    });
  }

  // Step 6
  console.log('[PLAYWRIGHT] Clicking Step 6...');
  const step6Btn = page.locator('button:has-text("06. Spec-to-Code Gap Audit")');
  if (await step6Btn.count() > 0) {
    await step6Btn.first().click();
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'clean-step6-gap-audit.png'),
      fullPage: false,
    });
  }

  // Step 7
  console.log('[PLAYWRIGHT] Clicking Step 7...');
  const step7Btn = page.locator('button:has-text("07. Playwright & REA Live Runner")');
  if (await step7Btn.count() > 0) {
    await step7Btn.first().click();
    await page.waitForTimeout(1500);
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'clean-step7-runner.png'),
      fullPage: false,
    });

    // Run suite to show live stream and bottleneck
    console.log('[PLAYWRIGHT] Triggering Run Suite in Step 7...');
    const runBtn = page.locator('button:has-text("Run Unified Suite")');
    if (await runBtn.count() > 0) {
      await runBtn.first().click();
      await page.waitForTimeout(3000);
      await page.screenshot({
        path: path.join(ARTIFACT_DIR, 'clean-step7-running.png'),
        fullPage: false,
      });
    }
  }

  // Command Palette Cmd+K Test
  console.log('[PLAYWRIGHT] Testing Command Palette Cmd+K...');
  await page.keyboard.press('Meta+k');
  await page.waitForTimeout(800);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'clean-cmdk-palette.png'),
    fullPage: false,
  });

  await browser.close();
  console.log('[PLAYWRIGHT] All captures complete!');
}

capture().catch(err => {
  console.error('[PLAYWRIGHT ERROR]', err);
  process.exit(1);
});
