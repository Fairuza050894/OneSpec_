import { NextRequest, NextResponse } from 'next/server';
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
  return `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540">
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
    <text x="480" y="285" fill="#f8fafc" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="600" text-anchor="middle">${safeLabel}</text>
    <text x="480" y="315" fill="#94a3b8" font-family="system-ui, -apple-system, sans-serif" font-size="14" text-anchor="middle">OneSpec Asset Placeholder — Klik Capture UI / Upload untuk mengganti gambar</text>
  </svg>`;
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

  const svg = createFallbackSvg(fileName.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '));
  return new NextResponse(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'no-store',
    },
  });
}
