import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');
const BACKUP_DIR = path.join(ROOT, `.onespec-crawler-backup-${TIMESTAMP}`);

const targetFiles = [
  'src/services/blindCrawlerService.ts',
  'src/app/api/runner/execute/route.ts',
  'src/services/sdlcCompiler.ts',
];

function backupFile(relPath) {
  const full = path.join(ROOT, relPath);
  if (!fs.existsSync(full)) return;
  const dest = path.join(BACKUP_DIR, relPath);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(full, dest);
}

console.log('=== 1. AUDIT KONFIGURASI CRAWLER SAAT INI ===');
for (const rel of targetFiles) {
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) continue;
  const lines = fs.readFileSync(full, 'utf8').split('\n');
  console.log(`\nFile: ${rel} (${lines.length} baris)`);
  lines.forEach((line, idx) => {
    if (
      /maxPages|maxRoutes|slice\(0,|networkidle|waitUntil|screenshot\(|querySelectorAll|goto\(|timeout/i.test(line)
    ) {
      console.log(`  L${idx + 1}: ${line.trim()}`);
    }
  });
}

console.log('\n=== 2. MENERAPKAN PATCH PADA blindCrawlerService.ts ===');
const crawlerPath = path.join(ROOT, 'src/services/blindCrawlerService.ts');

if (!fs.existsSync(crawlerPath)) {
  console.error('[ERROR] src/services/blindCrawlerService.ts tidak ditemukan.');
  process.exit(1);
}

backupFile('src/services/blindCrawlerService.ts');
let code = fs.readFileSync(crawlerPath, 'utf8');
const originalCode = code;

// 1. Naikkan batas maxPages / maxRoutes / slice(0, N) kecil menjadi 30
code = code.replace(
  /\b(maxPages|maxRoutes|MAX_PAGES|MAX_ROUTES)\s*[:=]\s*([1-9]|1[0-5])\b/g,
  '$1 = 30'
);
code = code.replace(
  /\.slice\(\s*0\s*,\s*([1-9]|1[0-5])\s*\)/g,
  '.slice(0, 30)'
);

// 2. Ubah waitUntil: 'domcontentloaded' menjadi 'domcontentloaded' agar halaman map (/mobomap) tidak timeout
code = code.replace(
  /waitUntil\s*:\s*['"]networkidle['"]/g,
  "waitUntil: 'domcontentloaded'"
);

// 3. Pastikan timeout goto cukup longgar namun tidak menggantung selamanya
code = code.replace(
  /timeout\s*:\s*([1-9]\d{3})\b/g,
  (match, ms) => (Number(ms) < 15000 ? 'timeout: 20000' : match)
);

// 4. Suntikkan helper auto-scroll sidebar & perluas selector navigasi sebelum ekstraksi link
const sidebarHelper = `
async function expandAndScrollNavigation(page: any) {
  try {
    await page.evaluate(async () => {
      // Buka accordion / menu sidebar yang tertutup
      const toggles = document.querySelectorAll(
        'aside [aria-expanded="false"], nav [aria-expanded="false"], [class*="sidebar"] button'
      );
      toggles.forEach((btn: any) => {
        try {
          if (!btn.closest('header') && btn.innerText && btn.innerText.length < 40) {
            btn.click();
          }
        } catch {}
      });

      // Scroll seluruh container sidebar dari atas ke bawah agar item lazy/virtual ter-render
      const scrollables = document.querySelectorAll('aside, nav, [class*="sidebar"], [class*="menu"]');
      for (const el of Array.from(scrollables)) {
        if (el.scrollHeight > el.clientHeight) {
          el.scrollTop = el.scrollHeight;
          await new Promise((r) => setTimeout(r, 250));
          el.scrollTop = 0;
        }
      }
    });
    await page.waitForTimeout(600);
  } catch {}
}
`;

if (!code.includes('expandAndScrollNavigation')) {
  const firstImportEnd = code.indexOf('\n', code.lastIndexOf('import '));
  if (firstImportEnd !== -1) {
    code =
      code.slice(0, firstImportEnd + 1) +
      sidebarHelper +
      code.slice(firstImportEnd + 1);
  } else {
    code = sidebarHelper + '\n' + code;
  }

  // Panggil helper tepat sebelum querySelectorAll('a[href]') pertama
  code = code.replace(
    /(await\s+page\.(?:evaluate|\$\$eval)\s*\(\s*(?:async\s*)?\(\)\s*=>\s*\{[\s\S]{0,120}?a\[href\])/,
    'await expandAndScrollNavigation(page);\n    $1'
  );
}

if (code !== originalCode) {
  fs.writeFileSync(crawlerPath, code, 'utf8');
  console.log('  -> Berhasil menambal src/services/blindCrawlerService.ts');
  console.log(`  -> Backup tersimpan di: ${path.relative(ROOT, BACKUP_DIR)}`);
} else {
  console.log('  -> Tidak ada pola standar yang berubah otomatis. Silakan kirim isi src/services/blindCrawlerService.ts untuk patch presisi.');
}
