import { NextRequest, NextResponse } from 'next/server';
import { POST as handleCrawlPost } from '../crawl/route';

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  return handleCrawlPost(req);
}
