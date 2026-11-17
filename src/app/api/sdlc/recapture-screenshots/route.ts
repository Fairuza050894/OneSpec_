import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { workspaceVaultService } from '@/services/workspaceVaultService';
import {
  captureInstantCdpScreenshot,
  waitForSpaDataReady,
  normalizeRoutePath,
} from '@/services/deepSpaHarvester';
import { sdlcKnowledgeGraphService } from '@/services/sdlcKnowledgeGraphService';

export const maxDuration = 300;

const AUTH_STATE_PATH = path.resolve(process.cwd(), '.onespec-auth-state.json');
const SESSION_STATE_PATH = path.resolve(process.cwd(), '.onespec-session-storage.json');

export async function POST(req: NextRequest) {
  let browser: any = null;
  try {
    const body = (await req.json().catch(() => ({}))) as { projectId?: string; targetUrl?: string };
    const allProjects = workspaceVaultService.listProjects();
    const projectId =
      body.projectId ||
      allProjects[0]?.projectId ||
      '';

    const record = projectId ? workspaceVaultService.getProject(projectId) : null;
    if (!record?.latestState) {
      return NextResponse.json(
        { success: false, error: 'Project record not found in vault' },
        { status: 404 }
      );
    }

    const state = record.latestState;
    const modules = state.discoveredFeatureModules || [];
    if (modules.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No discoveredFeatureModules to recapture' },
        { status: 400 }
      );
    }

    const targetUrl = (state.targetUrl || body.targetUrl || 'http://localhost:3000').trim();
    let parsedOrigin = 'http://localhost:3000';
    try {
      parsedOrigin = new URL(targetUrl).origin;
    } catch {}

    const pw = await import('playwright');
    browser = await pw.chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    const context = await browser.newContext({
      viewport: { width: 1366, height: 768 },
      storageState: fs.existsSync(AUTH_STATE_PATH) ? AUTH_STATE_PATH : undefined,
      ignoreHTTPSErrors: true,
    });

    if (fs.existsSync(SESSION_STATE_PATH)) {
      try {
        const rawSession = fs.readFileSync(SESSION_STATE_PATH, 'utf8');
        const parsedSession = JSON.parse(rawSession);
        if (parsedSession && typeof parsedSession === 'object' && Object.keys(parsedSession).length > 0) {
          const serializedPayload = JSON.stringify(parsedSession);
          await context.addInitScript(`(() => {
            try {
              const dump = ${serializedPayload};
              for (const [k, v] of Object.entries(dump)) {
                if (typeof v === 'string') window.sessionStorage.setItem(k, v);
              }
            } catch {}
          })()`);
        }
      } catch {}
    }

    const page = await context.newPage();
    let updatedCount = 0;

    for (const mod of modules) {
      const cleanRoute = normalizeRoutePath(mod.routePath);
      if (
        cleanRoute === '/home' ||
        /halaman tidak ditemukan|404\s*not\s*found|page\s*not\s*found|tidak\s*ditemukan/i.test(mod.moduleName)
      ) {
        continue;
      }
      const fullUrl = mod.fullUrl || `${parsedOrigin}${cleanRoute}`;
      try {
        await page.goto(fullUrl, { waitUntil: 'domcontentloaded', timeout: 12000 }).catch(() => {});
        await waitForSpaDataReady(page, cleanRoute, 3500);
        const shot = await captureInstantCdpScreenshot(page);
        if (shot && shot.startsWith('data:image/') && shot.length > 2500) {
          mod.screenshotDataUrl = shot;
          updatedCount++;
        }
      } catch (err: any) {
        console.warn(`[Recapture] Failed on ${cleanRoute}:`, err?.message);
      }
    }

    await browser.close();
    browser = null;

    // Refresh knowledge graph and user manuals with updated screenshots
    if (state.discoveredFeatureModules) {
      try {
        const kgSummary = sdlcKnowledgeGraphService.buildUniversalGraph({
          appName: state.appName,
          targetUrl: state.targetUrl,
          discoveredFeatureModules: state.discoveredFeatureModules,
          databaseTables: state.databaseTables || [],
          apiEndpoints: state.discoveryResult?.apiEndpoints || [],
          businessRules: state.brdMatrixRows || [],
          validationRules: state.validationRules || [],
          bugReports: state.bugReports || [],
          testScenarios: state.testScenarios || [],
          locale: 'id',
        });
        state.knowledgeGraphSummary = kgSummary;
      } catch (kgErr: any) {
        console.warn('[Recapture] Could not refresh Knowledge Graph:', kgErr?.message);
      }
    }

    // Save updated state into permanent workspace vault
    const saved = workspaceVaultService.saveProjectState({
      projectId: record.projectId,
      projectName: record.projectName,
      targetUrl: record.targetUrl,
      compiledState: state,
      createSnapshot: false,
    });

    return NextResponse.json({
      success: true,
      updatedCount,
      compiledState: saved?.latestState || state,
    });
  } catch (err: unknown) {
    if (browser) {
      try {
        await browser.close();
      } catch {}
    }
    const msg = err instanceof Error ? err.message : 'Re-capture failed';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
