import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

const CACHE_FILE_PATH = path.resolve(process.cwd(), '.onespec-workspace-cache.json');

export async function GET() {
  try {
    if (fs.existsSync(CACHE_FILE_PATH)) {
      const raw = fs.readFileSync(CACHE_FILE_PATH, 'utf8');
      const data = JSON.parse(raw);
      return NextResponse.json({ success: true, data });
    }
    return NextResponse.json({ success: false, message: 'No cached workspace on disk' }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify(body, null, 2), 'utf8');
    return NextResponse.json({ success: true, message: 'Workspace cached to disk successfully' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
