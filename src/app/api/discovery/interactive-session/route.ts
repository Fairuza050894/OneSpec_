import { NextRequest, NextResponse } from 'next/server';
import { blindCrawlerService } from '@/services/blindCrawlerService';

export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    const parsed: unknown = await req.json();
    if (parsed && typeof parsed === 'object') {
      body = parsed as Record<string, unknown>;
    }
  } catch {
    body = {};
  }

  const action = typeof body.action === 'string' ? body.action : 'STATUS_POLL';
  const targetUrl = typeof body.targetUrl === 'string' ? body.targetUrl : undefined;
  try {
    if (action === 'START_INTERACTIVE' || action === 'START_HUMAN_SESSION') {
      const trimmedUrl = typeof targetUrl === 'string' ? targetUrl.trim() : '';
      if (!trimmedUrl) {
        return NextResponse.json(
          {
            success: false,
            sessionStarted: false,
            error: 'Target URL wajib diisi sebelum membuka browser interaktif.',
            message: 'Target URL wajib diisi sebelum membuka browser interaktif.',
          },
          { status: 400 }
        );
      }
      const res = await blindCrawlerService.startInteractiveSession(trimmedUrl);
      if (!res.success) {
        return NextResponse.json(
          {
            success: false,
            error: res.message,
            message: res.message,
          },
          { status: 500 }
        );
      }
      return NextResponse.json({
        success: res.success,
        sessionStarted: res.sessionStarted,
        message: res.message,
      });
    }

    if (action === 'STATUS_POLL') {
      const status = blindCrawlerService.getInteractiveSessionStatus();
      return NextResponse.json({
        success: true,
        data: status,
      });
    }

    if (action === 'TRIGGER_ROBOT') {
      const res = await blindCrawlerService.triggerRobotSession();
      return NextResponse.json({
        success: res.success,
        message: res.message,
        latestResult: res.latestResult,
      });
    }

    if (action === 'FINISH_SESSION') {
      const res = await blindCrawlerService.finishInteractiveSession();
      return NextResponse.json({
        success: res.success,
        crawlResult: res.crawlResult,
        cookies: res.cookies,
        message: res.message,
        data: {
          crawlResult: res.crawlResult,
          cookies: res.cookies,
        },
      });
    }

    return NextResponse.json(
      { success: false, error: `Unknown action: ${action}` },
      { status: 400 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Interactive session error';
    return NextResponse.json(
      { success: false, error: msg, message: msg },
      { status: 500 }
    );
  }
}

export async function GET() {
  const status = blindCrawlerService.getInteractiveSessionStatus();
  return NextResponse.json({
    success: true,
    data: status,
  });
}
