const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = '/Users/user/.gemini/antigravity-cli/brain/eb8d5ac8-b8a8-481b-a3f5-53e1d1269d07';

async function testTerminal() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);

  // Click Expand Terminal anywhere in the footer bar
  const footerBar = page.locator('footer, div:has-text("Expand Terminal")').last();
  await footerBar.click();
  await page.waitForTimeout(800);

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'clean-terminal-expanded.png'),
    fullPage: false,
  });

  await browser.close();
}

testTerminal().catch(console.error);
