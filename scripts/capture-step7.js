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
  await page.waitForTimeout(3000);

  // Close command palette if open
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  // Switch to Step 7: Playwright & REA Live Runner tab
  console.log('Switching to Step 7 Live Runner tab...');
  const step7Btn = page.locator('button:has-text("07 Live Runner"), button:has-text("Step 7: Playwright")').first();
  await step7Btn.click({ force: true });
  await page.waitForTimeout(2500);

  // 1. Screenshot of Live Execution Trace Canvas with TC-008 Bottleneck
  console.log('Capturing Live Execution Trace Canvas (TC-008 Bottleneck)...');
  const canvasPath = path.join(artifactDir, 'screenshot-step7-trace-canvas.png');
  await page.screenshot({ path: canvasPath, fullPage: false });
  console.log(`Saved screenshot to ${canvasPath}`);

  // 2. Click on Stage 4 (Database Query Execution) node in the canvas to focus inspector
  console.log('Focusing Stage 4 Database Query Execution node...');
  const stage4Node = page.locator('div:has-text("4. Database Query Execution")').last();
  if (await stage4Node.isVisible()) {
    await stage4Node.click({ force: true });
    await page.waitForTimeout(1000);
  }

  const bottleneckPath = path.join(artifactDir, 'screenshot-step7-bottleneck-detected.png');
  await page.screenshot({ path: bottleneckPath, fullPage: false });
  console.log(`Saved screenshot to ${bottleneckPath}`);

  // 3. Switch to Playwright Spec Sub-Tab (.spec.ts in Monaco Editor)
  console.log('Switching to Playwright Spec Sub-Tab...');
  const playwrightSubTab = page.locator('button:has-text("2. Playwright E2E + API Unified Suite")').first();
  await playwrightSubTab.click({ force: true });
  await page.waitForTimeout(2000);

  const specPath = path.join(artifactDir, 'screenshot-step7-playwright-spec.png');
  await page.screenshot({ path: specPath, fullPage: false });
  console.log(`Saved screenshot to ${specPath}`);

  // 4. Switch to Postman Collection or JUnit XML Sub-Tab and capture Right Inspector
  console.log('Switching to JUnit XML Sub-Tab...');
  const junitSubTab = page.locator('button:has-text("4. CI/CD JUnit XML")').first();
  await junitSubTab.click({ force: true });
  await page.waitForTimeout(1500);

  const inspectorPath = path.join(artifactDir, 'screenshot-step7-root-cause-inspector.png');
  await page.screenshot({ path: inspectorPath, fullPage: false });
  console.log(`Saved screenshot to ${inspectorPath}`);

  await browser.close();
  console.log('Step 7 visual captures completed successfully.');
}

capture().catch((err) => {
  console.error('Capture error:', err);
  process.exit(1);
});
