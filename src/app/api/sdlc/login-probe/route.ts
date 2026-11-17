import { NextRequest, NextResponse } from 'next/server';
import { blindCrawlerService } from '@/services/blindCrawlerService';

export const maxDuration = 180;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { targetUrl?: string };
    const targetUrl = typeof body?.targetUrl === 'string' ? body.targetUrl.trim() : '';

    if (!targetUrl) {
      return NextResponse.json(
        { success: false, error: 'targetUrl is required' },
        { status: 400 }
      );
    }

    const probe = await blindCrawlerService.probeUrlLoginSurface(targetUrl);
    return NextResponse.json({
      success: true,
      data: probe,
      tabs: probe.tabs || probe.detectedTabs,
      dropdowns: probe.dropdowns || probe.detectedSelects,
      inputs: probe.inputs || probe.detectedInputs,
      submitButton: probe.submitButton,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Login surface probe failed';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
