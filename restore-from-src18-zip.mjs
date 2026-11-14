import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';

const rootDir = process.cwd();
const srcDir = path.join(rootDir, 'src');
const pageTsxPath = path.join(srcDir, 'app', 'page.tsx');
const homeDir = os.homedir();

console.log('🔍 Mencari arsip src_18.zip / src_17.zip / src_15.zip di Mac Anda untuk memulihkan UI Modern...');

const candidateZips = new Set();

// 1. Cek folder umum tempat Anda menyimpan src_18.zip / src_17.zip
const searchFolders = [
  rootDir,
  path.resolve(rootDir, '..'),
  path.join(homeDir, 'Downloads'),
  path.join(homeDir, 'Desktop'),
  path.join(homeDir, 'Documents'),
  path.join(homeDir, '.Trash'),
];

for (const folder of searchFolders) {
  if (!fs.existsSync(folder)) continue;
  try {
    for (const name of fs.readdirSync(folder)) {
      if (name.endsWith('.zip') && !name.includes('OneSpec SDLC Studio_2')) {
        candidateZips.add(path.join(folder, name));
      }
    }
  } catch {}
}

// 2. Gunakan Spotlight macOS (mdfind) untuk mencari semua file src*.zip di seluruh Mac
try {
  const mdfindOut = execFileSync(
    'mdfind',
    ['kMDItemFSName == "src*.zip" || kMDItemFSName == "*src_*.zip"'],
    { encoding: 'utf8', timeout: 8000 }
  );
  for (const line of mdfindOut.split('\n').map((s) => s.trim()).filter(Boolean)) {
    if (fs.existsSync(line)) candidateZips.add(line);
  }
} catch {}

// Urutkan agar memprioritaskan src_18.zip -> src_17.zip -> src_16.zip -> src_15.zip (tetapi BUKAN src_19.zip karena src_19 dibuat setelah tertimpa)
const sortedZips = Array.from(candidateZips)
  .filter((z) => !z.endsWith('src_19.zip'))
  .sort((a, b) => {
    const score = (p) => {
      const base = path.basename(p);
      if (base === 'src_18.zip') return 1000;
      if (base === 'src_17.zip') return 900;
      if (base === 'src_16.zip') return 800;
      if (base === 'src_15.zip') return 700;
      if (/^src_\d+\.zip$/.test(base)) return 600;
      if (base === 'src.zip') return 500;
      return 100;
    };
    return score(b) - score(a);
  });

let restored = false;

for (const zipPath of sortedZips) {
  try {
    const listOut = execFileSync('unzip', ['-Z1', zipPath], {
      encoding: 'utf8',
      timeout: 8000,
    });
    const entries = listOut.split('\n').map((s) => s.trim()).filter(Boolean);
    const pageEntry = entries.find(
      (e) => e === 'app/page.tsx' || e === 'src/app/page.tsx' || e.endsWith('/app/page.tsx')
    );

    if (!pageEntry) continue;

    const extractedCode = execFileSync('unzip', ['-p', zipPath, pageEntry], {
      encoding: 'utf8',
      maxBuffer: 25 * 1024 * 1024,
    });

    // Pastikan ini adalah UI Modern ("Project Source & Ingestion Hub" / "P1: Pre-Dev" / "Run Autonomous Crawl")
    const isModernUi =
      extractedCode.includes('Project Source & Ingestion Hub') ||
      extractedCode.includes('Run Autonomous Crawl') ||
      extractedCode.includes('Login Surface Scanner & Discovery Hub') ||
      extractedCode.includes('P1: Pre-Dev');

    if (isModernUi) {
      let finalCode = extractedCode;

      // Pastikan direktif 'use client' berada di baris pertama
      if (finalCode.includes("'use client'") || finalCode.includes('"use client"')) {
        finalCode = finalCode.replace(/['"]use client['"];?\r?\n?/g, '');
        finalCode = `'use client';\n` + finalCode;
      }

      // Tambahkan tombol Unduh Cepat Playwright (.spec.ts) & Postman v2.1 di Step 12 dengan aman
      if (finalCode.includes('Markdown (.md)') && !finalCode.includes('/api/sdlc/automation-bundle?format=playwright')) {
        finalCode = finalCode.replace(
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

      fs.writeFileSync(pageTsxPath, finalCode, 'utf8');
      console.log(`✅ BERHASIL! UI Modern ("01. Project Source & Ingestion Hub") berhasil dipulihkan dari arsip:\n   📦 ${zipPath} (${pageEntry})`);
      restored = true;
      break;
    }
  } catch {}
}

// 3. Jika file zip tidak ditemukan di lokasi standar, cari di seluruh folder ~/.gemini & Application Support tanpa batas ukuran file
if (!restored) {
  console.log('🔍 Memindai folder ~/.gemini dan Application Support tanpa batas ukuran file...');
  const deepDirs = [
    path.join(homeDir, '.gemini'),
    path.join(homeDir, 'Library', 'Application Support', 'Antigravity'),
    path.join(homeDir, 'Library', 'Application Support', 'Cursor'),
    path.join(homeDir, 'Library', 'Application Support', 'Code'),
  ];

  function scanAllFiles(dir, depth = 0) {
    if (depth > 8 || !fs.existsSync(dir)) return [];
    const out = [];
    try {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) out.push(...scanAllFiles(full, depth + 1));
        else out.push(full);
      }
    } catch {}
    return out;
  }

  const hits = [];
  for (const d of deepDirs) {
    for (const f of scanAllFiles(d)) {
      try {
        const st = fs.statSync(f);
        if (st.size < 5000 || st.size > 5 * 1024 * 1024) continue;
        const txt = fs.readFileSync(f, 'utf8');
        if (
          txt.includes('Project Source & Ingestion Hub') &&
          txt.includes('Run Autonomous Crawl') &&
          txt.includes('export default function')
        ) {
          hits.push({ file: f, mtimeMs: st.mtimeMs, content: txt });
        }
      } catch {}
    }
  }

  hits.sort((a, b) => b.mtimeMs - a.mtimeMs);
  if (hits.length > 0) {
    fs.writeFileSync(pageTsxPath, hits[0].content, 'utf8');
    console.log(`✅ BERHASIL! UI Modern dipulihkan dari snapshot: ${hits[0].file}`);
    restored = true;
  }
}

if (!restored) {
  console.error('❌ File src_18.zip / src_17.zip belum ditemukan otomatis. Pastikan file src_18.zip ada di folder Downloads atau folder proyek Anda, lalu jalankan ulang: node restore-from-src18-zip.mjs');
} else {
  const nextCache = path.join(rootDir, '.next', 'cache');
  if (fs.existsSync(nextCache)) {
    try {
      fs.rmSync(nextCache, { recursive: true, force: true });
    } catch {}
  }
  console.log('\n🎉 SELESAI 100%! Sekarang kembali ke http://127.0.0.1:3000 dan tekan Cmd+Shift+R (Hard Refresh)!');
}
