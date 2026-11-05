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

  // Switch to Step 5: Tri-Modal Discovery
  console.log('Switching to Step 5 Auto-Discovery tab...');
  const step5Btn = page.locator('button:has-text("05 Auto-Discovery"), button:has-text("Step 5: Tri-Modal Discovery")').first();
  await step5Btn.click({ force: true });
  await page.waitForTimeout(2000);

  // 1. Screenshot of API Contract Explorer (Sub-tab 1)
  console.log('Capturing API Contract Explorer...');
  const apiExplorerPath = path.join(artifactDir, 'screenshot-step5-api-contract-explorer.png');
  await page.screenshot({ path: apiExplorerPath, fullPage: false });
  console.log(`Saved screenshot to ${apiExplorerPath}`);

  // 2. Switch to Sub-tab 2: Database ERD Canvas
  console.log('Switching to Sub-tab 2: Database ERD Canvas...');
  const erdTabBtn = page.locator('button:has-text("2. Database ERD Canvas")').first();
  await erdTabBtn.click({ force: true });
  await page.waitForTimeout(2500);

  const erdPath = path.join(artifactDir, 'screenshot-step5-database-erd.png');
  await page.screenshot({ path: erdPath, fullPage: false });
  console.log(`Saved screenshot to ${erdPath}`);

  // 3. Switch to Sub-tab 3: DOM Selector & Traceability Map
  console.log('Switching to Sub-tab 3: DOM Selector & Traceability Map...');
  const domTabBtn = page.locator('button:has-text("3. DOM Selector & Traceability Map"), button:has-text("3. DOM Selector")').first();
  await domTabBtn.click({ force: true });
  await page.waitForTimeout(1500);

  const domPath = path.join(artifactDir, 'screenshot-step5-dom-traceability.png');
  await page.screenshot({ path: domPath, fullPage: false });
  console.log(`Saved screenshot to ${domPath}`);

  // 4. Switch toolbar mode to Mode C (Staging & Read-Only DB)
  console.log('Switching to Mode C in toolbar...');
  const modeCBtn = page.locator('button:has-text("Mode C: Live Staging")').first();
  await modeCBtn.click({ force: true });
  await page.waitForTimeout(1000);

  const toolbarPath = path.join(artifactDir, 'screenshot-step5-trimodal-toolbar.png');
  await page.screenshot({ path: toolbarPath, fullPage: false });
  console.log(`Saved screenshot to ${toolbarPath}`);

  await browser.close();
  console.log('Step 5 visual captures completed successfully.');
}

capture().catch((err) => {
  console.error('Capture error:', err);
  process.exit(1);
});
