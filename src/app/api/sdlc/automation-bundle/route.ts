import { NextResponse } from 'next/server';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { workspaceVaultService } from '@/services/workspaceVaultService';
import { automationBundleExportService } from '@/services/automationBundleExportService';
import { rbacDifferentialMatrixService } from '@/services/rbacDifferentialMatrixService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const format = (searchParams.get('format') || 'playwright').toLowerCase();
    const projectId = searchParams.get('projectId') || '';

    let state = null;
    if (projectId) {
      state = workspaceVaultService.getProject(projectId)?.latestState || null;
    }
    if (!state) {
      const all = workspaceVaultService.listProjects();
      if (all[0]) {
        state = workspaceVaultService.getProject(all[0].projectId)?.latestState || null;
      }
    }
    if (!state) {
      const cacheFile = path.resolve(process.cwd(), '.onespec-workspace-cache.json');
      if (fs.existsSync(cacheFile)) {
        state = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      }
    }

    if (!state) {
      return NextResponse.json({ error: 'No active project state found in Vault.' }, { status: 404 });
    }

    const slug = (state.appName || 'onespec').toLowerCase().replace(/[^a-z0-9]+/g, '-');

    if (format === 'postman') {
      const json = automationBundleExportService.generatePostmanCollectionJson(state);
      return new NextResponse(json, {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="${slug}-postman-v2.1.json"`,
        },
      });
    }

    if (format === 'rbac') {
      const matrix = rbacDifferentialMatrixService.buildDifferentialMatrix(state);
      return NextResponse.json(matrix, { status: 200 });
    }

    const specTs = automationBundleExportService.generatePlaywrightSpecTs(state);
    return new NextResponse(specTs, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="${slug}-e2e.spec.ts"`,
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to generate automation bundle' },
      { status: 500 }
    );
  }
}
