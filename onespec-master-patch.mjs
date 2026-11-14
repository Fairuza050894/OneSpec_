import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');
const BACKUP_DIR = path.join(ROOT, `.onespec-backup-${TIMESTAMP}`);

console.log('==========================================================');
console.log(' OneSpec v2.3 — Total Audit & Master Image Repair Patch');
console.log('==========================================================\n');

if (!fs.existsSync(path.join(ROOT, 'package.json'))) {
  console.error('[ERROR] package.json tidak ditemukan. Jalankan perintah ini di root folder project onespec!');
  process.exit(1);
}

function backupFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const rel = path.relative(ROOT, filePath);
  const dest = path.join(BACKUP_DIR, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(filePath, dest);
}

function walkFiles(dir, results = []) {
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.next', '.git', 'dist', 'build'].includes(entry.name)) continue;
    if (entry.name.startsWith('.onespec-backup-')) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, results);
    } else {
      results.push(fullPath);
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// TAHAP 1: AUDIT STRUKTUR PROYEK & ASET GAMBAR
// ---------------------------------------------------------------------------
console.log('[1/5] Memindai struktur proyek, konfigurasi, dan aset gambar...');

const allFiles = walkFiles(ROOT);
const hasSrcDir = fs.existsSync(path.join(ROOT, 'src'));
const appDir = fs.existsSync(path.join(ROOT, 'src/app'))
  ? path.join(ROOT, 'src/app')
  : fs.existsSync(path.join(ROOT, 'app'))
    ? path.join(ROOT, 'app')
    : null;

const isTypeScript = fs.existsSync(path.join(ROOT, 'tsconfig.json'));
const publicDir = path.join(ROOT, 'public');
const uploadsDir = path.join(ROOT, 'uploads');
const publicUploadsDir = path.join(publicDir, 'uploads');

fs.mkdirSync(path.join(publicUploadsDir, 'manual'), { recursive: true });
fs.mkdirSync(path.join(uploadsDir, 'manual'), { recursive: true });

// Kumpulkan semua file gambar yang ada di proyek (hasil Playwright/upload)
const imageExts = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg']);
const existingImages = allFiles.filter((f) => imageExts.has(path.extname(f).toLowerCase()));
console.log(`  -> Ditemukan ${existingImages.length} file gambar eksisting di proyek.`);

// ---------------------------------------------------------------------------
// TAHAP 2: BUAT DYNAMIC ASSET ROUTE HANDLER DI NEXT.JS 16
// ---------------------------------------------------------------------------
console.log('\n[2/5] Memasang Next.js Dynamic Media Route Handler (/api/manual-assets)...');

if (appDir) {
  const ext = isTypeScript ? 'ts' : 'js';
  const routeFile = path.join(appDir, 'api', 'manual-assets', '[...path]', `route.${ext}`);
  fs.mkdirSync(path.dirname(routeFile), { recursive: true });
  backupFile(routeFile);

  const routeCode = isTypeScript
    ? `import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

export const dynamic = 'force-dynamic';

const MIME_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
};

function createFallbackSvg(label: string): string {
  const safeLabel = label.replace(/[<>&"']/g, '').slice(0, 60) || 'Preview Mockup / Screenshot';
  return \`<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0f172a"/>
        <stop offset="100%" stop-color="#1e293b"/>
      </linearGradient>
    </defs>
    <rect width="960" height="540" rx="12" fill="url(#bg)"/>
    <rect x="24" y="24" width="912" height="492" rx="8" fill="none" stroke="#334155" stroke-width="2" stroke-dasharray="8 6"/>
    <circle cx="480" cy="220" r="34" fill="#1d4ed8" fill-opacity="0.25" stroke="#3b82f6" stroke-width="2"/>
    <path d="M466 228 l10 -12 l8 9 l12 -15 l14 18 z" fill="#60a5fa"/>
    <circle cx="472" cy="210" r="4" fill="#93c5fd"/>
    <text x="480" y="285" fill="#f8fafc" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="600" text-anchor="middle">\${safeLabel}</text>
    <text x="480" y="315" fill="#94a3b8" font-family="system-ui, -apple-system, sans-serif" font-size="14" text-anchor="middle">OneSpec Asset Placeholder — Klik Capture UI / Upload untuk mengganti gambar</text>
  </svg>\`;
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path: segments = [] } = await context.params;
  const cleanSegments = segments.map((s) => path.basename(s));
  const relPath = cleanSegments.join('/');
  const fileName = cleanSegments[cleanSegments.length - 1] || 'asset.png';
  const root = process.cwd();

  const candidates = [
    path.join(root, 'public', 'uploads', relPath),
    path.join(root, 'public', 'uploads', 'manual', fileName),
    path.join(root, 'public', relPath),
    path.join(root, 'uploads', relPath),
    path.join(root, 'uploads', 'manual', fileName),
    path.join(root, 'storage', relPath),
    path.join(root, '.onespec', 'screenshots', fileName),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      const ext = path.extname(candidate).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      const buffer = fs.readFileSync(candidate);
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'no-store, must-revalidate',
        },
      });
    }
  }

  const svg = createFallbackSvg(fileName.replace(/\\.[^.]+$/, '').replace(/[-_]/g, ' '));
  return new NextResponse(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'no-store',
    },
  });
}
`
    : `import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

export const dynamic = 'force-dynamic';

const MIME_TYPES = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
};

export async function GET(_req, context) {
  const { path: segments = [] } = await context.params;
  const cleanSegments = segments.map((s) => path.basename(s));
  const relPath = cleanSegments.join('/');
  const fileName = cleanSegments[cleanSegments.length - 1] || 'asset.png';
  const root = process.cwd();

  const candidates = [
    path.join(root, 'public', 'uploads', relPath),
    path.join(root, 'public', 'uploads', 'manual', fileName),
    path.join(root, 'public', relPath),
    path.join(root, 'uploads', relPath),
    path.join(root, 'uploads', 'manual', fileName),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      const ext = path.extname(candidate).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      const buffer = fs.readFileSync(candidate);
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'no-store, must-revalidate',
        },
      });
    }
  }

  const label = fileName.replace(/\\.[^.]+$/, '').replace(/[-_]/g, ' ');
  const svg = \`<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540"><rect width="960" height="540" rx="12" fill="#0f172a"/><text x="480" y="270" fill="#f8fafc" font-family="sans-serif" font-size="20" text-anchor="middle">\${label}</text></svg>\`;
  return new NextResponse(svg, {
    status: 200,
    headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'no-store' },
  });
}
`;

  fs.writeFileSync(routeFile, routeCode, 'utf8');
  console.log(`  -> Berhasil membuat ${path.relative(ROOT, routeFile)}`);
} else {
  console.log('  -> Folder app/ tidak ditemukan, melewati pembuatan App Router handler.');
}

// ---------------------------------------------------------------------------
// TAHAP 3: PATCH NEXT.CONFIG UNTUK REWRITES & UNOPTIMIZED IMAGES
// ---------------------------------------------------------------------------
console.log('\n[3/5] Memeriksa & menambal next.config.* untuk routing /uploads & /images...');

const nextConfigs = ['next.config.ts', 'next.config.mjs', 'next.config.js']
  .map((f) => path.join(ROOT, f))
  .filter((f) => fs.existsSync(f));

if (nextConfigs.length > 0) {
  const cfgPath = nextConfigs[0];
  let cfg = fs.readFileSync(cfgPath, 'utf8');
  backupFile(cfgPath);

  if (!cfg.includes('/api/manual-assets')) {
    const rewriteSnippet = `
  images: { unoptimized: true },
  async rewrites() {
    return [
      { source: '/uploads/:path*', destination: '/api/manual-assets/:path*' },
      { source: '/screenshots/:path*', destination: '/api/manual-assets/:path*' },
      { source: '/manual-images/:path*', destination: '/api/manual-assets/:path*' },
    ];
  },`;

    if (cfg.match(/const\s+nextConfig[^=]*=\s*\{/)) {
      cfg = cfg.replace(/(const\s+nextConfig[^=]*=\s*\{)/, `$1${rewriteSnippet}`);
      fs.writeFileSync(cfgPath, cfg, 'utf8');
      console.log(`  -> Berhasil memperbarui rewrites & images.unoptimized di ${path.basename(cfgPath)}`);
    } else if (cfg.match(/export\s+default\s+\{/)) {
      cfg = cfg.replace(/(export\s+default\s+\{)/, `$1${rewriteSnippet}`);
      fs.writeFileSync(cfgPath, cfg, 'utf8');
      console.log(`  -> Berhasil memperbarui export default config di ${path.basename(cfgPath)}`);
    } else {
      console.log(`  -> Format ${path.basename(cfgPath)} kustom; silakan tambahkan rewrite /uploads/:path* -> /api/manual-assets/:path* secara manual jika perlu.`);
    }
  } else {
    console.log(`  -> ${path.basename(cfgPath)} sudah memiliki rule /api/manual-assets.`);
  }
}

// ---------------------------------------------------------------------------
// TAHAP 4: AUDIT & PATCH KOMPONEN USER MANUAL (NORMALISASI SRC & FALLBACK)
// ---------------------------------------------------------------------------
console.log('\n[4/5] Mengaudit & menambal komponen UI User Manual & Markdown Preview...');

const codeFiles = allFiles.filter((f) => /\.(tsx|jsx|ts|js)$/.test(f));
let patchedUiCount = 0;

for (const file of codeFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const isManualRelated =
    /manual|panduan|markdown|preview|user-manual|UserManual/i.test(file) ||
    /User Manual|Panduan Penggunaan|Daftar Isi|Export \.docx/i.test(content);

  if (!isManualRelated) continue;

  let updated = content;

  // 1. Normalisasi backslash Windows & path relatif /uploads/ pada renderer gambar
  updated = updated.replace(
    /src=\{([a-zA-Z0-9_?.]+)\}/g,
    (match, expr) => {
      if (expr.includes('normalizeManualImgSrc') || expr.startsWith('"') || expr.startsWith("'")) {
        return match;
      }
      if (/src|img|image|url|screenshot|thumb/i.test(expr)) {
        return `src={normalizeManualImgSrc(${expr})}`;
      }
      return match;
    }
  );

  // 2. Pastikan gambar di dalam dangerouslySetInnerHTML atau regex markdown diarahkan ke /api/manual-assets/
  updated = updated.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    (match, alt, rawUrl) => {
      // Jangan ubah regex pattern dalam kode parser, hanya literal template markdown
      if (rawUrl.includes('$') || rawUrl.includes('\\s') || rawUrl.includes('[')) return match;
      const clean = rawUrl.trim().replace(/\\/g, '/');
      if (clean.startsWith('http') || clean.startsWith('data:') || clean.startsWith('/api/manual-assets/')) {
        return match;
      }
      const normalized = clean.replace(/^\.?\//, '').replace(/^(public\/)?(uploads|screenshots|manual-images)\//, '');
      return `![${alt}](/api/manual-assets/${normalized})`;
    }
  );

  if (updated !== content) {
    const helperFn = `
function normalizeManualImgSrc(raw?: string | null): string {
  if (!raw) return '/api/manual-assets/placeholder.png';
  const s = String(raw).trim().replace(/\\\\/g, '/');
  if (s.startsWith('data:image/') || s.startsWith('blob:') || s.startsWith('http://') || s.startsWith('https://')) {
    return s;
  }
  if (s.startsWith('/api/manual-assets/')) return s;
  const cleaned = s
    .replace(/^\\.\\//, '')
    .replace(/^\\//, '')
    .replace(/^public\\//, '')
    .replace(/^(uploads|screenshots|manual-images)\\//, '');
  return \`/api/manual-assets/\${cleaned}\`;
}
`;
    if (!updated.includes('function normalizeManualImgSrc')) {
      const lastImportIdx = updated.lastIndexOf('\nimport ');
      if (lastImportIdx !== -1) {
        const endOfImportLine = updated.indexOf('\n', lastImportIdx + 1);
        updated =
          updated.slice(0, endOfImportLine + 1) +
          helperFn +
          updated.slice(endOfImportLine + 1);
      } else {
        updated = helperFn + '\n' + updated;
      }
    }

    backupFile(file);
    fs.writeFileSync(file, updated, 'utf8');
    patchedUiCount++;
    console.log(`  -> Patched: ${path.relative(ROOT, file)}`);
  }
}

console.log(`  -> Total ${patchedUiCount} file komponen/modul User Manual diperbarui.`);

// ---------------------------------------------------------------------------
// TAHAP 5: SINKRONISASI ASET GAMBAR KE public/uploads/manual
// ---------------------------------------------------------------------------
console.log('\n[5/5] Menyinkronkan file screenshot ke public/uploads/manual...');
let copiedCount = 0;
for (const imgPath of existingImages) {
  if (imgPath.includes('node_modules') || imgPath.includes('.next')) continue;
  const base = path.basename(imgPath);
  const dest = path.join(publicUploadsDir, 'manual', base);
  if (!fs.existsSync(dest)) {
    fs.copyFileSync(imgPath, dest);
    copiedCount++;
  }
}
console.log(`  -> ${copiedCount} file aset disinkronkan ke public/uploads/manual/.`);

console.log('\n==========================================================');
console.log(' SELESAI! Langkah Verifikasi:');
console.log(' 1. Restart dev server Anda (Ctrl+C lalu jalankan: pnpm dev)');
console.log(' 2. Buka modul User Manual -> klik Hard Refresh (Cmd+Shift+R)');
console.log(` 3. Backup file asli tersimpan aman di: ${path.relative(ROOT, BACKUP_DIR)}`);
console.log('==========================================================');
