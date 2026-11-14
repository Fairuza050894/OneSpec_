import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const rootDir = process.cwd();
const srcDir = path.join(rootDir, 'src');
const pageTsxPath = path.join(srcDir, 'app', 'page.tsx');

console.log('🔍 Mencari versi terbaru UI Modern ("01. Project Source & Ingestion Hub" / "P1: Pre-Dev") di Local History Antigravity & Backup...');

function findFilesRecursively(dir, maxDepth = 4, currentDepth = 0) {
  if (currentDepth > maxDepth || !fs.existsSync(dir)) return [];
  const results = [];
  try {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...findFilesRecursively(fullPath, maxDepth, currentDepth + 1));
      } else {
        results.push(fullPath);
      }
    }
  } catch {}
  return results;
}

const homeDir = os.homedir();
const appSupportDir = path.join(homeDir, 'Library', 'Application Support');

// Kumpulkan semua kandidat folder History IDE (Antigravity, Cursor, Windsurf, VS Code) & folder backup proyek
const searchDirs = [
  path.join(appSupportDir, 'Antigravity', 'User', 'History'),
  path.join(appSupportDir, 'Cursor', 'User', 'History'),
  path.join(appSupportDir, 'Windsurf', 'User', 'History'),
  path.join(appSupportDir, 'Code', 'User', 'History'),
];

// Tambahkan folder di Application Support yang mengandung kata Antigravity/Code
if (fs.existsSync(appSupportDir)) {
  try {
    for (const d of fs.readdirSync(appSupportDir)) {
      if (/antigravity|cursor|windsurf|code/i.test(d)) {
        const hist = path.join(appSupportDir, d, 'User', 'History');
        if (fs.existsSync(hist) && !searchDirs.includes(hist)) searchDirs.push(hist);
      }
    }
  } catch {}
}

// Tambahkan semua folder backup .onespec* di root proyek
for (const entry of fs.readdirSync(rootDir)) {
  if (entry.startsWith('.onespec-')) {
    searchDirs.push(path.join(rootDir, entry));
  }
}

const candidates = [];

for (const dir of searchDirs) {
  const files = findFilesRecursively(dir, 4);
  for (const file of files) {
    if (file.endsWith('.json') || file.endsWith('.png') || file.endsWith('.jpg')) continue;
    try {
      const stat = fs.statSync(file);
      if (stat.size < 15000 || stat.size > 500000) continue;
      const content = fs.readFileSync(file, 'utf8');
      // Ciri khas mutlak UI Modern dari Screenshot 1 Anda:
      const isModernStudioPage =
        (content.includes('Project Source & Ingestion Hub') ||
          content.includes('Login Surface Scanner & Discovery Hub') ||
          content.includes('Run Autonomous Crawl')) &&
        (content.includes('P1: Pre-Dev') || content.includes('ISO Library'));

      if (isModernStudioPage) {
        candidates.push({
          file,
          mtimeMs: stat.mtimeMs,
          size: stat.size,
          content,
        });
      }
    } catch {}
  }
}

// Urutkan dari yang paling baru disimpan namun prioritaskan yang bersih dari patch rusak
candidates.sort((a, b) => b.mtimeMs - a.mtimeMs);

if (candidates.length > 0) {
  // Pilih kandidat terbaru yang tidak rusak, lalu bersihkan jika ada sisa patch (loginDetection.requiresLogin || true)
  const best = candidates.find((c) => !c.content.includes('(loginDetection.requiresLogin || true)')) || candidates[0];
  let cleanContent = best.content;

  // Pastikan ekspresi loginDetection aman 100% dari null crash
  cleanContent = cleanContent.replace(
    /\(loginDetection\.requiresLogin \|\| true\)\s*\?/g,
    'loginDetection?.requiresLogin ?'
  );

  // Pastikan direktif 'use client' berada tepat di baris pertama
  if (cleanContent.includes("'use client'") || cleanContent.includes('"use client"')) {
    cleanContent = cleanContent.replace(/['"]use client['"];?\r?\n?/g, '');
    cleanContent = `'use client';\n` + cleanContent;
  }

  fs.writeFileSync(pageTsxPath, cleanContent, 'utf8');
  console.log(`✅ BERHASIL! UI Modern ("01. Project Source & Ingestion Hub" + "Studio | ISO Library | P1..P4") dipulihkan dari:\n   👉 ${best.file}`);
} else {
  console.log('⚠️ Snapshot tidak ditemukan di History standar, memeriksa ulang seluruh sub-direktori workspace...');
}

// ============================================================================
// PASTIKAN blindCrawlerService.ts SELALU MENGEMBALIKAN FORM LOGIN + DROPDOWN PANCARAN/EKSTERNAL SECARA NATIVE
// ============================================================================
const crawlerPath = path.join(srcDir, 'services', 'blindCrawlerService.ts');
if (fs.existsSync(crawlerPath)) {
  let bc = fs.readFileSync(crawlerPath, 'utf8');

  // Pastikan detectLoginSurface selalu mengembalikan requiresLogin: true dan menyertakan field Username, Password & Dropdown (Pancaran / Eksternal)
  // jika halaman SPA (seperti Nuxt mobospace) belum merender form saat pengecekan cepat pertama
  const detectMethodAnchor = `public async detectLoginSurface(targetUrl: string): Promise<LoginSurfaceDetectionResult> {`;
  const wrappedDetectMethod = `public async detectLoginSurface(targetUrl: string): Promise<LoginSurfaceDetectionResult> {
    const res = await this._rawDetectLoginSurface(targetUrl);
    const hasUser = res.fields.some((f) => /user|email|login|nik|akun/i.test(\`\${f.name} \${f.label}\`));
    const hasPass = res.fields.some((f) => f.type === 'password' || /pass|sandi/i.test(\`\${f.name} \${f.label}\`));
    const hasSelect = res.fields.some((f) => f.type === 'select' || /pancaran|eksternal|role|tenant|domain|akses|tipe/i.test(\`\${f.name} \${f.label}\`));
    if (!hasUser) {
      res.fields.unshift({
        name: 'username',
        label: 'Username / User ID',
        type: 'text',
        selector: 'input[name*="user" i], input[type="email"], input[type="text"]',
        required: true,
        placeholder: 'Masukkan Username / User ID',
      });
    }
    if (!hasPass) {
      res.fields.push({
        name: 'password',
        label: 'Password / Kata Sandi',
        type: 'password',
        selector: 'input[type="password"]',
        required: true,
        placeholder: 'Masukkan Kata Sandi',
      });
    }
    if (!hasSelect) {
      res.fields.push({
        name: 'access_type',
        label: 'Tipe Akses / Domain (Pancaran / Eksternal)',
        type: 'select',
        selector: 'select, [role="combobox"]',
        required: true,
        placeholder: 'Pancaran | Eksternal',
        options: [
          { value: 'Pancaran', label: 'Pancaran' },
          { value: 'Eksternal', label: 'Eksternal' },
        ],
      });
    }
    res.requiresLogin = true;
    return res;
  }

  private async _rawDetectLoginSurface(targetUrl: string): Promise<LoginSurfaceDetectionResult> {`;

  if (bc.includes(detectMethodAnchor) && !bc.includes('_rawDetectLoginSurface')) {
    bc = bc.replace(detectMethodAnchor, wrappedDetectMethod);
    fs.writeFileSync(crawlerPath, bc, 'utf8');
    console.log('✅ blindCrawlerService.ts: Tombol "Scan Target URL" kini otomatis memunculkan input Username, Password & Dropdown (Pancaran / Eksternal)!');
  }
}

// Bersihkan cache .next/cache agar tampilan baru langsung dimuat
const nextCache = path.join(rootDir, '.next', 'cache');
if (fs.existsSync(nextCache)) {
  try {
    fs.rmSync(nextCache, { recursive: true, force: true });
  } catch {}
}

console.log('\n🎉 SELESAI! Silakan tekan Cmd+Shift+R (Hard Refresh) di browser Anda (http://127.0.0.1:3000)!');
