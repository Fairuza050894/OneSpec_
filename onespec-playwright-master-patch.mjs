import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');
const BACKUP_DIR = path.join(ROOT, `.onespec-master-backup-${TIMESTAMP}`);

console.log('====================================================================');
console.log(' OneSpec v2.3 — Master Patch: Deep Sidebar & Playwright Anti-Timeout');
console.log('====================================================================\n');

if (!fs.existsSync(path.join(ROOT, 'package.json'))) {
  console.error('[ERROR] Jalankan script ini di root folder proyek onespec!');
  process.exit(1);
}

function backupFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const rel = path.relative(ROOT, filePath);
  const dest = path.join(BACKUP_DIR, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(filePath, dest);
}

function walkCodeFiles(dir, results = []) {
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.next', '.git', 'dist', 'build'].includes(entry.name)) continue;
    if (entry.name.startsWith('.onespec-')) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkCodeFiles(fullPath, results);
    } else if (/\.(ts|tsx|js|mjs)$/.test(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

const HELPER_BLOCK = `
// === [ONESPEC MASTER PATCH: DEEP SIDEBAR EXPANDER & SPA ROUTE HARVESTER] ===
async function expandAndHarvestSidebar(page: any, baseUrl?: string): Promise<string[]> {
  const discovered = new Set<string>();
  try {
    // 1. Buka semua accordion / submenu sidebar yang tertutup (hingga 3 tingkat kedalaman)
    for (let pass = 0; pass < 3; pass++) {
      const clickedCount = await page.evaluate(() => {
        let count = 0;
        const selectors = [
          'aside [aria-expanded="false"]',
          'nav [aria-expanded="false"]',
          '[class*="sidebar"] [aria-expanded="false"]',
          '[class*="sidenav"] [aria-expanded="false"]',
          '.ant-menu-submenu-closed > .ant-menu-submenu-title',
          '[data-state="closed"] > button',
          '[data-state="closed"] > [role="button"]',
        ];
        document.querySelectorAll(selectors.join(',')).forEach((el: any) => {
          try {
            if (el && typeof el.click === 'function') {
              el.click();
              count++;
            }
          } catch {}
        });
        return count;
      });
      if (!clickedCount) break;
      await page.waitForTimeout(350);
    }

    // 2. Scroll bertahap pada seluruh container sidebar/nav agar item lazy/bawah ter-render
    await page.evaluate(async () => {
      const containers = document.querySelectorAll(
        'aside, nav, [class*="sidebar"], [class*="sidenav"], [class*="menu-scroll"], [role="navigation"]'
      );
      for (const container of Array.from(containers)) {
        if (container.scrollHeight > container.clientHeight) {
          const step = Math.max(150, Math.floor(container.clientHeight * 0.7));
          for (let pos = 0; pos <= container.scrollHeight; pos += step) {
            container.scrollTop = pos;
            await new Promise((r) => setTimeout(r, 120));
          }
          container.scrollTop = 0;
        }
      }
    });
    await page.waitForTimeout(300);

    // 3. Kumpulkan semua href & atribut route dari sidebar/nav
    const rawPaths: string[] = await page.evaluate(() => {
      const urls: string[] = [];
      const rootSelectors = 'aside, nav, [class*="sidebar"], [class*="sidenav"], [role="navigation"], body';
      const scope = document.querySelector(rootSelectors) || document;

      scope.querySelectorAll('a[href]').forEach((a: any) => {
        const href = a.getAttribute('href');
        if (href && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:') && !href.startsWith('javascript:')) {
          urls.push(href);
        }
      });

      scope.querySelectorAll('[data-href], [data-route], [data-path], [data-url]').forEach((el: any) => {
        const val = el.getAttribute('data-href') || el.getAttribute('data-route') || el.getAttribute('data-path') || el.getAttribute('data-url');
        if (val) urls.push(val);
      });

      return Array.from(new Set(urls));
    });

    const origin = baseUrl ? new URL(baseUrl).origin : new URL(page.url()).origin;
    for (const item of rawPaths) {
      try {
        const resolved = new URL(item, origin);
        if (resolved.origin === origin && !/logout|signout|login|signin/i.test(resolved.pathname)) {
          discovered.add(resolved.pathname + resolved.search);
        }
      } catch {}
    }
  } catch {}
  return Array.from(discovered);
}
// === [END ONESPEC MASTER PATCH] ===
`;

const allFiles = walkCodeFiles(ROOT);
const candidateFiles = allFiles.filter((f) => {
  const rel = path.relative(ROOT, f);
  if (rel.startsWith('scripts/')) return false;
  const content = fs.readFileSync(f, 'utf8');
  return (
    /blindCrawler|runner\/execute|sdlcCompiler|automationSynthesizer/i.test(rel) ||
    /chromium|playwright|networkidle|maxPages|maxRoutes/i.test(content)
  );
});

let totalPatched = 0;

for (const file of candidateFiles) {
  const rel = path.relative(ROOT, file);
  let code = fs.readFileSync(file, 'utf8');
  const original = code;
  const changes = [];

  // 1. Jika ini API Route Next.js (route.ts), tambahkan maxDuration = 300 agar tidak timeout di detik ke-60
  if (rel.endsWith('route.ts') || rel.endsWith('route.js')) {
    if (!code.includes('maxDuration')) {
      code = `export const maxDuration = 300;\nexport const dynamic = 'force-dynamic';\n` + code;
      changes.push('Menambahkan maxDuration = 300s pada Next.js API Route');
    }
  }

  // 2. Naikkan batas kuota halaman/menu crawl (maxPages, maxRoutes, maxMenus, maxLinks, limit)
  const beforeCap = code;
  code = code.replace(
    /\b(maxPages|maxRoutes|MAX_PAGES|MAX_ROUTES|maxMenus|maxLinks|maxSteps|crawlLimit)\s*([:=])\s*([1-9]|1[0-9]|2[0-5])\b/g,
    '$1$2 50'
  );
  code = code.replace(
    /\.slice\(\s*0\s*,\s*([1-9]|1[0-9]|2[0-5])\s*\)/g,
    '.slice(0, 50)'
  );
  if (code !== beforeCap) {
    changes.push('Menaikkan batas kuota route/menu crawl menjadi 50 halaman');
  }

  // 3. Perpanjang global timeout runner/crawler (20s - 120s -> 300s) agar semua sidebar selesai
  const beforeGlobalTimeout = code;
  code = code.replace(
    /\b(crawlTimeout|totalTimeout|runnerTimeout|globalTimeout|executionTimeout|MAX_CRAWL_MS)\s*([:=])\s*(1[5-9]\d{3}|[2-9]\d{4}|1[0-2]\d{4})\b/gi,
    '$1$2 300000'
  );
  if (code !== beforeGlobalTimeout) {
    changes.push('Memperpanjang global crawl timeout menjadi 300.000 ms (5 menit)');
  }

  // 4. Ubah waitUntil: 'domcontentloaded' menjadi 'domcontentloaded' agar halaman peta/polling tidak hang
  const beforeNetworkIdle = code;
  code = code.replace(
    /waitUntil\s*:\s*['"]networkidle['"]/g,
    "waitUntil: 'domcontentloaded'"
  );
  if (code !== beforeNetworkIdle) {
    changes.push("Mengganti waitUntil: 'domcontentloaded' -> 'domcontentloaded'");
  }

  // 5. Pastikan per-page goto timeout tidak terlalu lama (15s cap) & tidak menggantung
  const beforeGotoTimeout = code;
  code = code.replace(
    /(page\.goto\s*\([^)]*timeout\s*:\s*)(30000|45000|60000)/g,
    '$115000'
  );
  if (code !== beforeGotoTimeout) {
    changes.push('Mengoptimalkan per-page goto timeout menjadi 15.000 ms agar halaman lambat tidak menyita waktu crawl');
  }

  // 6. Nonaktifkan animasi CSS pada page.screenshot agar capture lebih cepat & tidak timeout menunggu font/animasi
  const beforeShot = code;
  code = code.replace(
    /page\.screenshot\(\s*\{([^}]*)\}\s*\)/g,
    (match, inner) => {
      if (inner.includes('animations')) return match;
      const trimmed = inner.trim();
      const sep = trimmed.endsWith(',') || trimmed.length === 0 ? '' : ',';
      return `page.screenshot({ ${trimmed}${sep} animations: 'disabled' })`;
    }
  );
  if (code !== beforeShot) {
    changes.push("Menambahkan animations: 'disabled' pada page.screenshot()");
  }

  // 7. Suntikkan expandAndHarvestSidebar ke dalam blindCrawlerService.ts
  if (/blindCrawlerService/i.test(rel) && !code.includes('expandAndHarvestSidebar')) {
    const lastImportIdx = code.lastIndexOf('\nimport ');
    if (lastImportIdx !== -1) {
      const insertPos = code.indexOf('\n', lastImportIdx + 1) + 1;
      code = code.slice(0, insertPos) + HELPER_BLOCK + code.slice(insertPos);
    } else {
      code = HELPER_BLOCK + '\n' + code;
    }

    // Panggil expandAndHarvestSidebar tepat sebelum ekstraksi link/menu pertama
    const hookRegex = /(const\s+[a-zA-Z0-9_]+\s*=\s*await\s+page\.(?:evaluate|\$\$eval)\s*\([\s\S]{0,160}?(?:a\[href\]|querySelectorAll))/;
    if (hookRegex.test(code)) {
      code = code.replace(
        hookRegex,
        `const _expandedSidebarRoutes = await expandAndHarvestSidebar(page);\n    $1`
      );
    }
    changes.push('Menyuntikkan expandAndHarvestSidebar() untuk membuka submenu tertutup & scroll sidebar');
  }

  if (code !== original) {
    backupFile(file);
    fs.writeFileSync(file, code, 'utf8');
    totalPatched++;
    console.log(`[PATCHED] ${rel}`);
    changes.forEach((c) => console.log(`   - ${c}`));
  }
}

console.log('\n====================================================================');
if (totalPatched > 0) {
  console.log(` SELESAI! ${totalPatched} file berhasil ditambal.`);
  console.log(` Backup file asli tersimpan di: ${path.relative(ROOT, BACKUP_DIR)}`);
  console.log('\n Langkah Selanjutnya:');
  console.log(' 1. Restart server OneSpec (Ctrl+C lalu jalankan: pnpm dev)');
  console.log(' 2. Buka 12-Step Studio Mode -> jalankan ulang Live Crawler / Runner');
  console.log(' 3. Cek kembali Wiki Reader Mode pada Mobomap s.d. MOD-10');
} else {
  console.log(' Tidak ada perubahan otomatis yang diterapkan. Silakan tempel isi');
  console.log(' src/services/blindCrawlerService.ts agar dibuatkan patch presisi.');
}
console.log('====================================================================');
