import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { TsdMatrixRow } from '@/services/tsdSynthesizer';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const dirPath = typeof body.dirPath === 'string' && body.dirPath.startsWith('/')
      ? body.dirPath
      : process.cwd();
    const rows = (body.tsdRows || []) as TsdMatrixRow[];

    let matchedCount = 0;
    const filesToSearch: string[] = [];

    const collectFiles = (cur: string) => {
      if (!fs.existsSync(cur)) return;
      const entries = fs.readdirSync(cur, { withFileTypes: true });
      for (const e of entries) {
        if (
          e.name === 'node_modules' ||
          e.name === '.git' ||
          e.name === '.next' ||
          e.name === 'dist' ||
          e.name === 'build'
        ) {
          continue;
        }
        const full = path.join(cur, e.name);
        if (e.isDirectory()) {
          collectFiles(full);
        } else if (/\.(ts|tsx|js|jsx|py|go|php|java|prisma|sql)$/.test(e.name)) {
          filesToSearch.push(full);
        }
      }
    };

    try {
      collectFiles(dirPath);
    } catch {}

    const updatedRows = rows.map((row) => {
      try {
        const regex = new RegExp(row.grepPattern, 'i');
        for (const file of filesToSearch) {
          const content = fs.readFileSync(file, 'utf8');
          const lines = content.split('\n');
          for (let i = 0; i < lines.length; i++) {
            if (regex.test(lines[i])) {
              matchedCount++;
              const relPath = path.relative(dirPath, file).replace(/\\/g, '/');
              return {
                ...row,
                matchedFile: `${relPath}:${i + 1}`,
                matchedSnippet: lines[i].trim().slice(0, 120),
                verificationStatus: 'VERIFIED_IN_CODEBASE' as const,
              };
            }
          }
        }
      } catch {}
      return row;
    });

    return NextResponse.json({
      success: true,
      scannedDirectory: dirPath,
      updatedRows,
      matchedCount,
      totalScannedFiles: filesToSearch.length,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
