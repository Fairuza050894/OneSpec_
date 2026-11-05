const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

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

  // Close any modal dialog if open
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  // Click on Step 4: ISO 29119 RTM in header or center tab
  console.log('Switching to Step 4 RTM tab...');
  const rtmButton = page.locator('button:has-text("04 ISO 29119 RTM"), button:has-text("Step 4: ISO 29119 RTM Grid")').first();
  await rtmButton.click({ force: true });
  await page.waitForTimeout(1500);

  // Take screenshot of Step 4 RTM Grid
  const gridScreenshotPath = path.join(artifactDir, 'screenshot-step4-rtm-grid.png');
  await page.screenshot({ path: gridScreenshotPath, fullPage: false });
  console.log(`Saved screenshot to ${gridScreenshotPath}`);

  // Click on row TC-002 (Boundary)
  console.log('Selecting TC-002 row for Gherkin inspection...');
  const tc002Row = page.locator('tr:has-text("TC-002")').first();
  await tc002Row.click({ force: true });
  await page.waitForTimeout(1500);

  // Take screenshot with TC-002 selected and Gherkin editor in right pane
  const gherkinScreenshotPath = path.join(artifactDir, 'screenshot-step4-gherkin-inspector.png');
  await page.screenshot({ path: gherkinScreenshotPath, fullPage: false });
  console.log(`Saved screenshot to ${gherkinScreenshotPath}`);

  // Test filter by clicking "BOUNDARY"
  console.log('Filtering by BOUNDARY scenario...');
  const boundaryFilterBtn = page.locator('button:text-is("BOUNDARY")').first();
  await boundaryFilterBtn.click({ force: true });
  await page.waitForTimeout(1000);

  const filterScreenshotPath = path.join(artifactDir, 'screenshot-step4-rtm-filtered.png');
  await page.screenshot({ path: filterScreenshotPath, fullPage: false });
  console.log(`Saved screenshot to ${filterScreenshotPath}`);

  await browser.close();
  console.log('Screenshots capture complete.');
}

capture().catch((err) => {
  console.error('Capture error:', err);
  process.exit(1);
});
