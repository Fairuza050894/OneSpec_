import { NextRequest, NextResponse } from 'next/server';
import { blindCrawlerService } from '@/services/blindCrawlerService';
import { synthesizeFullSdlcFromCrawl } from '@/services/sdlcCompiler';
import { workspaceVaultService } from '@/services/workspaceVaultService';
import type { BlindCrawlConfig } from '@/types/sdlc';

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const targetUrl = typeof body.targetUrl === 'string' ? body.targetUrl.trim() : '';

    if (!targetUrl) {
      return NextResponse.json(
        { success: false, error: 'targetUrl is required' },
        { status: 400 }
      );
    }

    const dynamicFieldValues: Record<string, string> = {};
    if (body.dynamicFieldValues && typeof body.dynamicFieldValues === 'object') {
      for (const [k, v] of Object.entries(body.dynamicFieldValues as Record<string, unknown>)) {
        if (typeof v === 'string') dynamicFieldValues[k] = v;
      }
    }
    if (typeof body.username === 'string' && !dynamicFieldValues.username) {
      dynamicFieldValues.username = body.username;
    }
    if (typeof body.password === 'string' && !dynamicFieldValues.password) {
      dynamicFieldValues.password = body.password;
    }
    if (typeof body.accessRoleOrTenant === 'string' && !dynamicFieldValues.access_type) {
      dynamicFieldValues.access_type = body.accessRoleOrTenant;
    }

    const config: BlindCrawlConfig = {
      targetUrl,
      authType: (body.authType as BlindCrawlConfig['authType']) || 'LOGIN_FORM',
      username: typeof body.username === 'string' ? body.username : dynamicFieldValues.username,
      password: typeof body.password === 'string' ? body.password : dynamicFieldValues.password,
      accessRoleOrTenant: typeof body.accessRoleOrTenant === 'string' ? body.accessRoleOrTenant : dynamicFieldValues.access_type,
      crawlDepth: 'FULL_DOM_JS_AST',
      captureHar: true,
      dynamicFieldValues,
    };

    // 1. Run 7-Layer Deep SPA Crawl & Reverse-Engineering
    const crawlResult = await blindCrawlerService.crawlAndReverseEngineer(config);

    // 2. Synthesize Full ISO-Standard SDLC State across Steps 01-12
    const compiledState = synthesizeFullSdlcFromCrawl(crawlResult);

    // 3. Persist into Workspace Vault for immediate export availability
    try {
      const slug = compiledState.appName.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'onespec-project';
      workspaceVaultService.saveProjectState({
        projectId: slug,
        projectName: compiledState.appName,
        targetUrl,
        compiledState,
        createSnapshot: true,
        versionLabel: 'Deep SPA Crawl Baseline v1.0.0',
      });
    } catch (vaultErr) {
      console.warn('[SDLC CRAWL ROUTE] Notice: Vault persistence exception:', vaultErr);
    }

    return NextResponse.json({
      success: true,
      data: crawlResult,
      compiledState,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'SDLC Crawl and synthesis failed';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
