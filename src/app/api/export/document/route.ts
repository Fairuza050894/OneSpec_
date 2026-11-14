export const maxDuration = 300;
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { chromium } from 'playwright';
import { modernDocumentExporter } from '@/services/modernDocumentExporter';
import { sdlcKnowledgeGraphService } from '@/services/sdlcKnowledgeGraphService';
import type { CompiledSdlcState } from '@/services/sdlcCompiler';
import type { RegressionDiffSummary } from '@/services/workspaceVaultService';
import { sanitizeFeatureModuleScreenshots } from '@/lib/featureModuleScreenshotSanitizer';
import { isBlankRasterDataUrl } from '@/services/screenshotIntegrityService';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      format?: 'docx' | 'pdf';
      compiledState?: CompiledSdlcState;
      regressionDiffSummary?: RegressionDiffSummary | null;
      locale?: 'en' | 'id';
    };

    const format = body.format === 'pdf' ? 'pdf' : 'docx';
    const locale = body.locale === 'en' ? 'en' : 'id';
    const compiledState = body.compiledState;

    if (!compiledState || !compiledState.appName) {
      return NextResponse.json({ success: false, error: 'compiledState is required' }, { status: 400 });
    }

    const slug = compiledState.appName.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'onespec_project';

    // A pixel-uniform capture would embed as a white page in DOCX/PDF; swap it for
    // the deterministic ISO 26514 blueprint before either renderer runs.
    const exportState: CompiledSdlcState = {
      ...compiledState,
      discoveredFeatureModules: await sanitizeFeatureModuleScreenshots(
        compiledState.discoveredFeatureModules || [],
        isBlankRasterDataUrl
      ),
    };

    if (format === 'docx') {
      const docxBuffer = await modernDocumentExporter.generateNativeDocxBuffer(
        exportState,
        body.regressionDiffSummary,
        locale
      );
      return new NextResponse(new Uint8Array(docxBuffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="OneSpec_AZ_Documentation_${slug}.docx"`,
          'Content-Length': String(docxBuffer.byteLength),
        },
      });
    }

    // Native print-ready vector PDF via Playwright Chromium
    const html = sdlcKnowledgeGraphService.generateCompleteAzLibraryHtml(
      exportState,
      body.regressionDiffSummary,
      locale
    );

    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      await page.setContent(html, { waitUntil: 'load' });
      const pdfBytes = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '14mm',
          right: '12mm',
          bottom: '14mm',
          left: '12mm',
        },
      });
      return new NextResponse(new Uint8Array(pdfBytes), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="OneSpec_AZ_Documentation_${slug}.pdf"`,
          'Content-Length': String(pdfBytes.byteLength),
        },
      });
    } finally {
      await browser.close().catch(() => {});
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
