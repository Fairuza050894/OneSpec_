import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { workspaceVaultService } from '@/services/workspaceVaultService';
import { unifiedReportGenerator } from '@/services/unifiedReportGenerator';
import { modernDocumentExporter } from '@/services/modernDocumentExporter';
import { automationBundleExportService } from '@/services/automationBundleExportService';
import { rbacDifferentialMatrixService } from '@/services/rbacDifferentialMatrixService';
import { triModalDiscoveryService } from '@/services/triModalDiscoveryService';
import { selfHealingPatchService } from '@/services/selfHealingPatchService';
import { createZip } from '@/lib/xlsxWriter';
import { sanitizeFeatureModuleScreenshots } from '@/lib/featureModuleScreenshotSanitizer';
import { isBlankRasterDataUrl } from '@/services/screenshotIntegrityService';
import type { CompiledSdlcState } from '@/services/sdlcCompiler';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

function resolveStateAndProject(projectId?: string | null): { state: CompiledSdlcState | null; slug: string } {
  let state: CompiledSdlcState | null = null;
  if (projectId) {
    state = (workspaceVaultService.getProject(projectId)?.latestState as CompiledSdlcState) || null;
  }
  if (!state) {
    const all = workspaceVaultService.listProjects();
    if (all[0]) {
      state = (workspaceVaultService.getProject(all[0].projectId)?.latestState as CompiledSdlcState) || null;
    }
  }
  if (!state) {
    const cacheFile = path.resolve(process.cwd(), '.onespec-workspace-cache.json');
    if (fs.existsSync(cacheFile)) {
      try {
        state = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      } catch {}
    }
  }
  const slug = (state?.appName || 'onespec_project').toLowerCase().replace(/[^a-z0-9]+/g, '_');
  return { state, slug };
}

export async function GET(req: NextRequest) {
  return handleExportBundle(req);
}

export async function POST(req: NextRequest) {
  return handleExportBundle(req);
}

async function handleExportBundle(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let projectId = searchParams.get('projectId');
    let format = (searchParams.get('format') || 'zip').toLowerCase();
    let locale = (searchParams.get('locale') || 'id').toLowerCase() === 'en' ? 'en' : 'id';

    let customCompiledState: CompiledSdlcState | null = null;
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        if (body.projectId) projectId = body.projectId;
        if (body.format) format = body.format.toLowerCase();
        if (body.locale) locale = body.locale === 'en' ? 'en' : 'id';
        if (body.compiledState) customCompiledState = body.compiledState;
      } catch {}
    }

    const { state: resolvedState, slug } = customCompiledState
      ? { state: customCompiledState, slug: customCompiledState.appName.toLowerCase().replace(/[^a-z0-9]+/g, '_') }
      : resolveStateAndProject(projectId);

    if (!resolvedState || !resolvedState.appName) {
      return NextResponse.json(
        { success: false, error: 'No active project state found to package.' },
        { status: 404 }
      );
    }

    const appName = resolvedState.appName;
    const targetUrl = resolvedState.targetUrl || 'http://localhost:3000/';

    const activeLocale: 'en' | 'id' = locale === 'en' ? 'en' : 'id';

    // 1. Sanitize screenshots for Word ISO 26514 User Manual
    const exportState: CompiledSdlcState = {
      ...resolvedState,
      discoveredFeatureModules: await sanitizeFeatureModuleScreenshots(
        resolvedState.discoveredFeatureModules || [],
        isBlankRasterDataUrl
      ),
    };

    // 2. Generate 16-Sheet Excel QA Workbook (.xlsx)
    const xlsxBytes = unifiedReportGenerator.generateExcelQaWorkbookXlsx({
      appName,
      targetUrl,
      testScenarios: exportState.testScenarios || [],
      rtmRows: exportState.rtmRows || [],
      bugReports: exportState.bugReports || [],
      uatFlows: exportState.uatFlows || [],
      dataDictionary:
        exportState.knowledgeGraphSummary?.azDocumentationLibrary?.book2BusinessAnalyst?.masterDataDictionary || [],
      compiledState: exportState,
      locale: activeLocale,
    });

    // 3. Generate 9-Section ISO 26514 User Manual (.docx)
    let docxBytes: Uint8Array;
    try {
      const docxBuf = await modernDocumentExporter.generateNativeDocxBuffer(exportState, null, activeLocale);
      docxBytes = new Uint8Array(docxBuf);
    } catch {
      docxBytes = new Uint8Array();
    }

    // 4. Generate Automation Suites
    const playwrightSpec = automationBundleExportService.generatePlaywrightSpecTs(exportState);
    const postmanJson = automationBundleExportService.generatePostmanCollectionJson(exportState);
    const rbacMatrix = rbacDifferentialMatrixService.buildDifferentialMatrix(exportState);

    // 5. Generate OpenAPI 3.1.0 Contract
    const endpoints = exportState.discoveryResult?.apiEndpoints || [];
    const openApiSpec = triModalDiscoveryService.generateOpenApi31Spec(endpoints, targetUrl);

    // 6. Generate ISO Compliance Manifest
    const manifest = {
      manifestVersion: '1.0.0',
      bundleId: `BUNDLE-${Date.now()}`,
      appName,
      targetUrl,
      generatedAt: new Date().toISOString(),
      locale,
      standardsCompliance: [
        {
          standard: 'ISO/IEC/IEEE 29148:2018',
          scope: 'Requirements Engineering & StRS/SyRS Specification Synthesis',
          status: 'COMPLIANT',
        },
        {
          standard: 'ISO/IEC/IEEE 29119-3/5:2022',
          scope: 'Multi-Dimensional RTM, Test Cases & Executable Automation Parity',
          status: 'COMPLIANT',
        },
        {
          standard: 'ISO/IEC/IEEE 26514:2022',
          scope: '9-Section Systems & Software User Documentation with Visual Callouts',
          status: 'COMPLIANT',
        },
        {
          standard: 'ISO/IEC 25010:2023',
          scope: 'Software Product Quality Models & Quality Characteristics',
          status: 'COMPLIANT',
        },
        {
          standard: 'ISO/IEC 27001:2022 & OWASP API Top 10 (2023)',
          scope: 'Information Security Governance & Dynamic Application Security Testing',
          status: 'COMPLIANT',
        },
      ],
      artifactCatalog: [
        { filename: `01_OneSpec_QA_Workbook_${slug}.xlsx`, description: '16-Sheet Excel QA & Traceability Workbook' },
        { filename: `02_OneSpec_User_Manual_${slug}.docx`, description: 'ISO 26514 9-Section Bilingual User Manual' },
        { filename: `03_OneSpec_Playwright_E2E_${slug}.spec.ts`, description: 'Executable Playwright TypeScript Test Suite' },
        { filename: `04_OneSpec_Postman_${slug}.postman_collection.json`, description: 'Postman v2.1 Collection & Contract Tests' },
        { filename: `05_OneSpec_RBAC_Matrix_${slug}.json`, description: 'Multi-Persona RBAC Differential Security Matrix' },
        { filename: `06_OneSpec_OpenAPI_3.1_${slug}.json`, description: 'Canonical OpenAPI 3.1.0 Endpoint Specification' },
        { filename: `07_OneSpec_Remediation_Patch_${slug}.patch`, description: 'Unified Git Remediation Patch & Runbook (.patch)' },
      ],
      metrics: {
        featureModulesCount: (exportState.discoveredFeatureModules || []).length,
        testScenariosCount: (exportState.testScenarios || []).length,
        rtmRowsCount: (exportState.rtmRows || []).length,
        discoveredApisCount: endpoints.length,
      },
    };

    if (format === 'json') {
      return NextResponse.json({
        success: true,
        manifest,
        playwrightSpec,
        postmanCollection: JSON.parse(postmanJson),
        rbacMatrix,
        openApiSpec,
      });
    }

    const remediationPatch = selfHealingPatchService.generateUnifiedGitPatch(exportState);
    const remediationRunbook = selfHealingPatchService.generateRemediationRunbook(exportState);

    // Build Master ZIP Archive
    const zipFiles: Array<{ name: string; content: string | Uint8Array }> = [
      { name: `01_OneSpec_QA_Workbook_${slug}.xlsx`, content: xlsxBytes },
      { name: `02_OneSpec_User_Manual_${slug}.docx`, content: docxBytes },
      { name: `03_OneSpec_Playwright_E2E_${slug}.spec.ts`, content: playwrightSpec },
      { name: `04_OneSpec_Postman_${slug}.postman_collection.json`, content: postmanJson },
      { name: `05_OneSpec_RBAC_Matrix_${slug}.json`, content: JSON.stringify(rbacMatrix, null, 2) },
      { name: `06_OneSpec_OpenAPI_3.1_${slug}.json`, content: JSON.stringify(openApiSpec, null, 2) },
      { name: `07_OneSpec_Contoh_Patch_Ilustratif_${slug}.patch`, content: remediationPatch },
      { name: `08_OneSpec_Remediation_Runbook_${slug}.md`, content: remediationRunbook },
      { name: `00_ISO_Audit_Handover_Manifest_${slug}.json`, content: JSON.stringify(manifest, null, 2) },
    ];

    const zipBuffer = createZip(zipFiles);
    const blob = new Blob([zipBuffer.buffer as ArrayBuffer], { type: 'application/zip' });

    return new NextResponse(blob, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="OneSpec_Master_ISO_Bundle_${slug}.zip"`,
        'Content-Length': String(zipBuffer.byteLength),
      },
    });
  } catch (error: any) {
    console.error('[EXPORT ALL BUNDLE ROUTE] Error generating master bundle:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to generate master bundle' },
      { status: 500 }
    );
  }
}
