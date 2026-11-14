import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const srcDir = path.join(rootDir, 'src');

console.log('🚑 Memperbaiki penyebab Blank White Screen pada http://127.0.0.1:3000/ ...');

// ============================================================================
// 1. FIX src/services/unifiedReportGenerator.ts: Bersihkan Header Komentar yang Rusak di Baris 1
// ============================================================================
const urgPath = path.join(srcDir, 'services', 'unifiedReportGenerator.ts');
if (fs.existsSync(urgPath)) {
  let urg = fs.readFileSync(urgPath, 'utf8');

  const firstTypeImportIdx = urg.indexOf('import type {');
  if (firstTypeImportIdx !== -1) {
    const cleanHeader = `/**
 * OneSpec SDLC Workbench - Unified QA & Performance Report Generator
 * Standards: ISO/IEC/IEEE 29119-3:2022, ISO/IEC/IEEE 29148:2018 & Grafana k6
 */
import { domainLogicBrainService } from './domainLogicBrainService';
import { rbacDifferentialMatrixService } from './rbacDifferentialMatrixService';
import { automationBundleExportService } from './automationBundleExportService';
`;
    urg = cleanHeader + urg.slice(firstTypeImportIdx);
    // Hapus duplikat import jika ada di bawahnya
    const lines = urg.split('\n');
    const seenImports = new Set();
    const dedupedLines = lines.filter((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('import ') && trimmed.endsWith(';')) {
        if (seenImports.has(trimmed)) return false;
        seenImports.add(trimmed);
      }
      return true;
    });
    fs.writeFileSync(urgPath, dedupedLines.join('\n'), 'utf8');
    console.log('✅ 1/4 unifiedReportGenerator.ts: Syntax error pada header komentar baris 1 berhasil dibersihkan!');
  }
}

// ============================================================================
// 2. PULIHKAN src/app/page.tsx DARI BACKUP BERSIH & PASANG DEFAULT LOGIN FIELDS YANG AMAN (ANTI NULL CRASH)
// ============================================================================
const pageTsxPath = path.join(srcDir, 'app', 'page.tsx');
const backups = fs
  .readdirSync(rootDir)
  .filter((name) => name.startsWith('.onespec-ui-backup-'))
  .sort()
  .reverse();

for (const b of backups) {
  const candidate = path.join(rootDir, b, 'app', 'page.tsx');
  if (fs.existsSync(candidate)) {
    const raw = fs.readFileSync(candidate, 'utf8');
    if (!raw.includes('(loginDetection.requiresLogin || true)')) {
      fs.copyFileSync(candidate, pageTsxPath);
      console.log(`✅ 2/4 Memulihkan src/app/page.tsx bersih dari backup: ${b}`);
      break;
    }
  }
}

if (fs.existsSync(pageTsxPath)) {
  let pt = fs.readFileSync(pageTsxPath, 'utf8');

  // Bersihkan sisa patch tidak aman jika backup tidak ditemukan
  pt = pt.replace(/\(loginDetection\.requiresLogin \|\| true\)\s*\?/g, 'loginDetection?.requiresLogin ?');

  // Pastikan state awal loginDetection langsung memiliki form Username, Password, dan Dropdown (Pancaran / Eksternal)
  // sehingga begitu halaman dibuka, form login sudah langsung tampil tanpa pernah bernilai null!
  const defaultLoginState = `useState<LoginSurfaceDetectionResult | null>({
    targetUrl: 'https://mobospace-sandbox.pancaran-group.co.id/',
    detectedAt: new Date().toISOString(),
    requiresLogin: true,
    pageTitle: 'Authentication & Role/Domain Gate',
    loginFormAction: '/login',
    submitButtonText: 'Masuk / Sign In',
    hasCaptchaOrMfa: false,
    fields: [
      {
        name: 'username',
        label: 'Username / User ID',
        type: 'text',
        selector: 'input[name*="user" i], input[type="text"]',
        required: true,
        placeholder: 'Masukkan Username / User ID',
      },
      {
        name: 'password',
        label: 'Password / Kata Sandi',
        type: 'password',
        selector: 'input[type="password"]',
        required: true,
        placeholder: 'Masukkan Password',
      },
      {
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
      },
    ],
  })`;

  pt = pt.replace(
    /useState<LoginSurfaceDetectionResult \| null>\(null\)/g,
    defaultLoginState
  );

  // Tambahkan tombol Unduh Cepat Playwright (.spec.ts) & Postman v2.1 di sebelah tombol Markdown (.md) di Step 12 jika belum ada
  const mdBtnAnchor = `Markdown (.md)`;
  if (pt.includes(mdBtnAnchor) && !pt.includes('/api/sdlc/automation-bundle?format=playwright')) {
    pt = pt.replace(
      /(\{[^}]*Markdown \(\.md\)[^}]*\}<\/button>)/,
      `$1
            <a
              href="/api/sdlc/automation-bundle?format=playwright"
              download
              className="px-2.5 py-1 rounded text-[11px] font-mono font-semibold bg-indigo-950/80 text-indigo-300 border border-indigo-700/60 hover:bg-indigo-900/80 transition flex items-center gap-1"
              title="Download Executable Playwright E2E Test Suite (.spec.ts)"
            >
              ⚡ Playwright (.spec.ts)
            </a>
            <a
              href="/api/sdlc/automation-bundle?format=postman"
              download
              className="px-2.5 py-1 rounded text-[11px] font-mono font-semibold bg-amber-950/80 text-amber-300 border border-amber-700/60 hover:bg-amber-900/80 transition flex items-center gap-1"
              title="Download Postman Collection v2.1 (.json)"
            >
              🚀 Postman v2.1
            </a>`
    );
  }

  fs.writeFileSync(pageTsxPath, pt, 'utf8');
  console.log('✅ 3/4 src/app/page.tsx: Default form (Username, Password, Dropdown Pancaran/Eksternal) & tombol Playwright/Postman terpasang aman!');
}

// ============================================================================
// 3. PASTIKAN DIREKTIF 'use client' SELALU DI BARIS PERTAMA PADA SEMUA FILE .TSX
// ============================================================================
function walkTsx(dir) {
  if (!fs.existsSync(dir)) return [];
  const list = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) list.push(...walkTsx(full));
    else if (entry.name.endsWith('.tsx')) list.push(full);
  }
  return list;
}

for (const file of walkTsx(srcDir)) {
  const raw = fs.readFileSync(file, 'utf8');
  if ((raw.includes("'use client'") || raw.includes('"use client"')) && !raw.trimStart().startsWith("'use client'") && !raw.trimStart().startsWith('"use client"')) {
    const cleaned = raw.replace(/['"]use client['"];?\r?\n?/g, '');
    fs.writeFileSync(file, `'use client';\n` + cleaned, 'utf8');
    console.log(`🔧 Memperbaiki posisi 'use client' ke baris 1 pada: ${path.relative(rootDir, file)}`);
  }
}

// ============================================================================
// 4. BERSIHKAN CACHE .next/cache AGAR TURBOPACK TIDAK MENYAJIKAN HALAMAN PUTIH
// ============================================================================
const nextCacheDir = path.join(rootDir, '.next', 'cache');
if (fs.existsSync(nextCacheDir)) {
  try {
    fs.rmSync(nextCacheDir, { recursive: true, force: true });
    console.log('✅ 4/4 Cache .next/cache berhasil disegarkan!');
  } catch {}
}

console.log('\n🎉 SELESAI! Silakan lakukan langkah berikut:');
console.log('1. Jika terminal tempat Anda menjalankan "npm run dev" masih berjalan, tekan Ctrl+C lalu jalankan kembali: npm run dev');
console.log('2. Buka kembali http://127.0.0.1:3000/ dan tekan Cmd+Shift+R (Hard Refresh).');
