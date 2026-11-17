import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { blindCrawlerService } from '@/services/blindCrawlerService';
import type { LoginSurfaceProbeResult } from '@/types/sdlc';

export const maxDuration = 300;

const blindCrawlSchema = z.object({
  targetUrl: z.string().min(1, 'Target URL or IP:Port is required'),
  authType: z
    .enum(['NONE', 'LOGIN_FORM', 'BEARER_COOKIE', 'INTERACTIVE_LOGIN', 'BASIC_OR_FORM'])
    .default('NONE'),
  username: z.string().optional(),
  password: z.string().optional(),
  accessRoleOrTenant: z.string().optional(),
  authHeaderOrCookie: z.string().optional(),
  crawlDepth: z.enum(['FULL_DOM_JS_AST', 'DOM_ONLY', 'DEEP_INTERACTIVE']).default('FULL_DOM_JS_AST'),
  captureHar: z.boolean().default(true),
  dynamicFieldValues: z.record(z.string(), z.string()).optional(),
});

export async function POST(req: NextRequest) {
  let rawBody: Record<string, unknown> = {};
  try {
    const parsed: unknown = await req.json();
    if (parsed && typeof parsed === 'object') {
      rawBody = parsed as Record<string, unknown>;
    }
  } catch {
    rawBody = {};
  }

  const action = typeof rawBody.action === 'string' ? rawBody.action : '';

  if (action === 'PROBE_LOGIN_SURFACE') {
    const targetUrl = typeof rawBody.targetUrl === 'string' ? rawBody.targetUrl.trim() : '';
    if (!targetUrl) {
      return NextResponse.json(
        { success: false, error: 'Target URL wajib diisi untuk pemindaian.' },
        { status: 400 }
      );
    }
    try {
      const probe = await blindCrawlerService.probeUrlLoginSurface(targetUrl);
      return NextResponse.json({ success: true, data: probe });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memindai form login URL target';
      return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
  }

  if (action === 'RUN_AUTO_ROBOT') {
    const targetUrl = typeof rawBody.targetUrl === 'string' ? rawBody.targetUrl.trim() : '';
    if (!targetUrl) {
      return NextResponse.json(
        { success: false, error: 'Target URL wajib diisi sebelum menjalankan robot.' },
        { status: 400 }
      );
    }
    try {
      const dynamicFieldValues: Record<string, string> = {};
      if (rawBody.dynamicFieldValues && typeof rawBody.dynamicFieldValues === 'object') {
        for (const [k, v] of Object.entries(rawBody.dynamicFieldValues as Record<string, unknown>)) {
          if (typeof v === 'string') dynamicFieldValues[k] = v;
        }
      }
      const probeResult =
        rawBody.probeResult && typeof rawBody.probeResult === 'object'
          ? (rawBody.probeResult as LoginSurfaceProbeResult)
          : null;
      const crawlResult = await blindCrawlerService.runAutoRobotCrawl({
        targetUrl,
        dynamicFieldValues,
        probeResult,
      });
      return NextResponse.json({ success: true, data: crawlResult });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menjalankan robot otomatis';
      return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
  }

  if (action === 'START_INTERACTIVE' || action === 'START_HUMAN_SESSION') {
    const targetUrl = typeof rawBody.targetUrl === 'string' ? rawBody.targetUrl.trim() : '';
    if (!targetUrl) {
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
    const res = await blindCrawlerService.startInteractiveSession(targetUrl);
    return NextResponse.json(
      {
        success: res.success,
        sessionStarted: res.sessionStarted,
        message: res.message,
        error: res.success ? undefined : res.message,
      },
      { status: res.success ? 200 : 500 }
    );
  }
  const parsed = blindCrawlSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: 'INVALID_INPUT',
        details: z.treeifyError(parsed.error),
      },
      { status: 400 }
    );
  }

  try {
    const crawlResult = await blindCrawlerService.crawlAndReverseEngineer(parsed.data);
    return NextResponse.json({
      success: true,
      data: crawlResult,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Blind URL crawling and back-generation failed';
    return NextResponse.json(
      {
        success: false,
        error: msg,
      },
      { status: 500 }
    );
  }
}
