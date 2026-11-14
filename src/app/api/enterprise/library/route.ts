import { NextRequest, NextResponse } from 'next/server';
import { workspaceVaultService, type SavedProjectRecord } from '@/services/workspaceVaultService';
import { enterpriseLibraryPortalService } from '@/services/enterpriseLibraryPortalService';

export async function GET(req: NextRequest) {
  try {
    const query = req.nextUrl.searchParams.get('q') || '';
    const indexEntries = workspaceVaultService.listProjects();
    const records: SavedProjectRecord[] = indexEntries
      .map((entry) => workspaceVaultService.getProject(entry.projectId))
      .filter((r): r is SavedProjectRecord => Boolean(r));

    if (query.trim().length >= 2) {
      const results = enterpriseLibraryPortalService.searchAcrossProjects(records, query);
      return NextResponse.json({
        success: true,
        query,
        totalHits: results.length,
        results,
      });
    }

    const portfolio = enterpriseLibraryPortalService.buildEnterprisePortfolioSummary(records);
    const docControls = Object.fromEntries(
      records.map((rec) => [rec.projectId, enterpriseLibraryPortalService.buildIsoDocumentControlSheet(rec)])
    );

    return NextResponse.json({
      success: true,
      portfolio,
      docControls,
      records,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Enterprise library error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
