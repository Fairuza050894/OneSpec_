import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const imageExts = new Set(['.png', '.jpg', '.jpeg', '.webp']);

function walk(dir, list = []) {
  if (!fs.existsSync(dir)) return list;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.next', '.git'].includes(entry.name) || entry.name.startsWith('.onespec-backup')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, list);
    else list.push(full);
  }
  return list;
}

const allFiles = walk(ROOT);
const capturedImages = allFiles.filter((f) => imageExts.has(path.extname(f).toLowerCase()));

console.log('=== 1. DAFTAR FILE GAMBAR HASIL CAPTURE DI DISK ===');
if (capturedImages.length === 0) {
  console.log('Tidak ada file gambar ditemukan di folder proyek.');
} else {
  capturedImages.forEach((img) => {
    const stat = fs.statSync(img);
    console.log(`- ${path.relative(ROOT, img)} (${(stat.size / 1024).toFixed(1)} KB)`);
  });
}

// Normalisasi & duplikasi alias nama file agar cocok dengan route slug maupun MOD-ID
const targetDir = path.join(ROOT, 'public', 'uploads', 'manual');
fs.mkdirSync(targetDir, { recursive: true });

const routeAliases = [
  'home',
  'operationaldashboard',
  'dashboardactivity',
  'mobomap',
  'shipmentdetail',
  'verifyactivity',
  'mobodrive',
  'notificationmessage',
  'inspectionresult',
];

console.log('\n=== 2. PENCOCOKAN ROUTE MODUL VS FILE GAMBAR ===');
for (const slug of routeAliases) {
  const matched = capturedImages.find((img) =>
    path.basename(img).toLowerCase().replace(/[-_]/g, '').includes(slug)
  );

  if (matched) {
    const ext = path.extname(matched);
    const aliasDest = path.join(targetDir, `${slug}${ext}`);
    if (!fs.existsSync(aliasDest)) {
      fs.copyFileSync(matched, aliasDest);
    }
    console.log(`[OK]   /${slug} -> ditemukan (${path.basename(matched)})`);
  } else {
    console.log(`[MISS] /${slug} -> BELUM ADA GAMBAR (Playwright gagal capture route ini)`);
  }
}

console.log('\n=== 3. LOKASI FILE RUNNER PLAYWRIGHT DI PROYEK ===');
const runnerFiles = allFiles.filter((f) => {
  if (!/\.(ts|js|mjs)$/.test(f)) return false;
  const txt = fs.readFileSync(f, 'utf8');
  return txt.includes('chromium') || txt.includes('playwright') || txt.includes('screenshot(');
});
runnerFiles.forEach((f) => console.log(`- ${path.relative(ROOT, f)}`));
