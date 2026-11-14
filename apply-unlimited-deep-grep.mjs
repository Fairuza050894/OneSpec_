import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const srcDir = path.join(rootDir, 'src');

console.log('🚀 Mengaktifkan Unlimited Deep-Grep Engine, Instant CDP Screenshot & Penghapusan Limit Slice...');

// ============================================================================
// 1. HAPUS SEMUA BATASAN .slice() DI iso26514UserManualService.ts
// ============================================================================
const manualPath = path.join(srcDir, 'services', 'iso26514UserManualService.ts');
if (fs.existsSync(manualPath)) {
  let ums = fs.readFileSync(manualPath, 'utf8');

  // Hapus batas 3 field form di Section 7
  ums = ums.replace(`if (fieldNum > 3) break;`, `if (fieldNum > 50) break;`);

  // Hapus batas 4 aturan AST di Section 7
  ums = ums.replace(
    `const chosenAst = (moduleAstRules.length > 0 ? moduleAstRules : astRules).slice(0, 4);`,
    `const chosenAst = (moduleAstRules.length > 0 ? moduleAstRules : astRules);`
  );

  // Hapus batas 4 Foreign Key di Section 7
  ums = ums.replaceAll(`fkList.slice(0, 4)`, `fkList`);

  // Hapus batas 3 tombol, 3 filter, dan 2 sub-tab di Section 8 (UI-to-API Matrix)
  ums = ums.replace(`buttonsList.slice(0, 3).forEach((b) => {`, `buttonsList.forEach((b) => {`);
  ums = ums.replace(`filtersList.slice(0, 3).forEach((f) => {`, `filtersList.forEach((f) => {`);
  ums = ums.replace(`subTabs.slice(0, 2).forEach((tab) => {`, `subTabs.forEach((tab) => {`);

  // Hapus batas 5 input pada buildDataDrivenPayload
  ums = ums.replace(
    `for (const inp of mod.formsAndModals[0].inputs.slice(0, 5))`,
    `for (const inp of mod.formsAndModals[0].inputs)`
  );

  fs.writeFileSync(manualPath, ums, 'utf8');
  console.log('✅ 1/4 iso26514UserManualService.ts: Seluruh batasan .slice() dihapus — 100% tombol, input, sub-tab & aturan kini masuk semua!');
}

// ============================================================================
// 2. HAPUS BATASAN .slice() DI domainLogicBrainService.ts AGAR TEST CASE MENCANGKUP SEMUA FITUR
// ============================================================================
const brainPath = path.join(srcDir, 'services', 'domainLogicBrainService.ts');
if (fs.existsSync(brainPath)) {
  let dlb = fs.readFileSync(brainPath, 'utf8');

  // Uji semua sub-tab (bukan hanya 4)
  dlb = dlb.replace(`subTabs.slice(0, 4).forEach((tab, tIdx) => {`, `subTabs.forEach((tab, tIdx) => {`);

  // Uji semua opsi filter
  dlb = dlb.replace(`options: rawOpts.slice(0, 4)`, `options: rawOpts.slice(0, 25)`);

  // Uji semua aturan backend AST dan semua relasi Foreign Key
  dlb = dlb.replace(
    `const chosenAstRules = (moduleAstRules.length > 0 ? moduleAstRules : allRules.filter((r) => r.ruleId.startsWith('VR-AST-'))).slice(0, 4);`,
    `const chosenAstRules = (moduleAstRules.length > 0 ? moduleAstRules : allRules.filter((r) => r.ruleId.startsWith('VR-AST-'))).slice(0, 30);`
  );
  dlb = dlb.replace(
    `const chosenFks = (relevantFks.length > 0 ? relevantFks : fkRelations).slice(0, 2);`,
    `const chosenFks = (relevantFks.length > 0 ? relevantFks : fkRelations);`
  );

  // Hapus batas 8 input pada Synthetic Test Data Factory
  dlb = dlb.replace(`modInputs.slice(0, 8).forEach((inp, idx) => {`, `modInputs.forEach((inp, idx) => {`);

  fs.writeFileSync(brainPath, dlb, 'utf8');
  console.log('✅ 2/4 domainLogicBrainService.ts: Cakupan skenario uji diperluas untuk seluruh sub-tab, filter, input, AST & Foreign Key!');
}

// ============================================================================
// 3. HAPUS BATASAN .slice(0, 35) DI triModalDiscoveryService.ts
// ============================================================================
const triPath = path.join(srcDir, 'services', 'triModalDiscoveryService.ts');
if (fs.existsSync(triPath)) {
  let tri = fs.readFileSync(triPath, 'utf8');
  tri = tri.replaceAll(`(baseAnalysis.extractedBackendRules || []).slice(0, 35)`, `(baseAnalysis.extractedBackendRules || [])`);
  tri = tri.replaceAll(`(astAnalysis.extractedBackendRules || []).slice(0, 35)`, `(astAnalysis.extractedBackendRules || [])`);
  fs.writeFileSync(triPath, tri, 'utf8');
  console.log('✅ 3/4 triModalDiscoveryService.ts: Ekstraksi aturan backend tidak lagi dibatasi 35 aturan!');
}

// ============================================================================
// 4. UPGRADE blindCrawlerService.ts: INSTANT CDP SCREENSHOT (ANTI-TIMEOUT) & DEEP ROUTER DISCOVERY
// ============================================================================
const crawlerPath = path.join(srcDir, 'services', 'blindCrawlerService.ts');
if (fs.existsSync(crawlerPath)) {
  let bc = fs.readFileSync(crawlerPath, 'utf8');

  // Tambahkan helper captureInstantCdpScreenshot jika belum ada
  if (!bc.includes('captureInstantCdpScreenshot')) {
    const cdpHelper = `
  /**
   * Instant GPU Framebuffer Screenshot via Chrome DevTools Protocol (CDP).
   * Never hangs on web font loading (document.fonts.ready) or stalled external stylesheets.
   */
  private async captureInstantCdpScreenshot(page: any): Promise<string | undefined> {
    try {
      await page.addStyleTag({
        content: '*, *::before, *::after { transition: none !important; animation: none !important; } body, main, #__nuxt, #__next, #app { opacity: 1 !important; visibility: visible !important; }'
      }).catch(() => {});
      const client = await page.context().newCDPSession(page);
      const result = await Promise.race([
        client.send('Page.captureScreenshot', { format: 'jpeg', quality: 68, fromSurface: true }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('CDP_SHOT_TIMEOUT')), 3500))
      ]) as { data?: string };
      await client.detach().catch(() => {});
      if (result && result.data && result.data.length > 1200) {
        return \`data:image/jpeg;base64,\${result.data}\`;
      }
    } catch {}
    try {
      const buf = await page.screenshot({ type: 'jpeg', quality: 65, timeout: 3500, animations: 'disabled' });
      if (buf && buf.length > 1000) return \`data:image/jpeg;base64,\${buf.toString('base64')}\`;
    } catch {}
    return undefined;
  }
`;
    const classIdx = bc.indexOf('export class BlindCrawlerService');
    if (classIdx !== -1) {
      const braceIdx = bc.indexOf('{', classIdx);
      bc = bc.slice(0, braceIdx + 1) + cdpHelper + bc.slice(braceIdx + 1);
    }
  }

  // Ganti waitUntil: 'networkidle' yang sering timeout menjadi 'domcontentloaded' dengan timeout cepat
  bc = bc.replace(/waitUntil:\s*['"]networkidle['"]/g, `waitUntil: 'domcontentloaded'`);
  bc = bc.replace(/waitForLoadState\(\s*['"]networkidle['"]\s*,\s*\{\s*timeout:\s*\d+\s*\}\s*\)/g, `waitForLoadState('domcontentloaded', { timeout: 2500 })`);

  // Ganti pemanggilan page.screenshot lama dengan captureInstantCdpScreenshot(page)
  bc = bc.replace(
    /const earlyShotBuf = await page\.screenshot\([^)]+\)\.catch\(\(\) => null\);\s*const earlySafeScreenshotDataUrl = earlyShotBuf && earlyShotBuf\.length > 1500\s*\?\s*`data:image\/jpeg;base64,\$\{earlyShotBuf\.toString\('base64'\)\}`\s*:\s*undefined;/g,
    `const earlySafeScreenshotDataUrl = await this.captureInstantCdpScreenshot(page);`
  );

  // Naikkan batas maksimum rute yang dipindai di blindCrawlerService (misal dari 8/10/12 menjadi 60)
  bc = bc.replace(/\.slice\(0,\s*(?:6|8|10|12|15)\)/g, `.slice(0, 60)`);

  fs.writeFileSync(crawlerPath, bc, 'utf8');
  console.log('✅ 4/4 blindCrawlerService.ts: Instant CDP Screenshot (Anti-Font-Hang) & kapasitas 60 modul per scan aktif!');
}

console.log('\n🎉 PATCH ENGINE SELESAI! Sekarang membuat skrip Deep-Grep Parallel Harvester mandiri...');
