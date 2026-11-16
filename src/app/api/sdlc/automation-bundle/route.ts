import { NextResponse } from 'next/server';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { workspaceVaultService } from '@/services/workspaceVaultService';
import { automationBundleExportService } from '@/services/automationBundleExportService';
import { rbacDifferentialMatrixService } from '@/services/rbacDifferentialMatrixService';
import { selfHealingPatchService } from '@/services/selfHealingPatchService';

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

    if (format === 'cypress') {
      const code = automationBundleExportService.generateCypressE2eCyTs(state);
      return new NextResponse(code, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename="${slug}-cypress.e2e.cy.ts"`,
        },
      });
    }

    if (format === 'selenium') {
      const code = automationBundleExportService.generateSeleniumSpecTs(state);
      return new NextResponse(code, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename="${slug}-selenium.webdriver.spec.ts"`,
        },
      });
    }

    if (format === 'appium' || format === 'mobile') {
      const code = automationBundleExportService.generateAppiumMobileSpecTs(state);
      return new NextResponse(code, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename="${slug}-appium.mobile.spec.ts"`,
        },
      });
    }

    if (format === 'rest-assured' || format === 'java') {
      const code = automationBundleExportService.generateRestAssuredJava(state);
      return new NextResponse(code, {
        status: 200,
        headers: {
          'Content-Type': 'text/x-java-source; charset=utf-8',
          'Content-Disposition': `attachment; filename="ApiContractTest.java"`,
        },
      });
    }

    if (format === 'jira' || format === 'jira-csv') {
      const csv = automationBundleExportService.generateJiraCsv(state);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${slug}-jira-issues.csv"`,
        },
      });
    }

    if (format === 'testrail' || format === 'testrail-csv') {
      const csv = automationBundleExportService.generateTestRailCsv(state);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${slug}-testrail-cases.csv"`,
        },
      });
    }

    if (format === 'promptfoo' || format === 'promptfoo-eval' || format === 'yaml') {
      const yaml = automationBundleExportService.generatePromptfooYaml(state);
      return new NextResponse(yaml, {
        status: 200,
        headers: {
          'Content-Type': 'text/yaml; charset=utf-8',
          'Content-Disposition': `attachment; filename="promptfooconfig.yaml"`,
        },
      });
    }

    if (format === 'allure' || format === 'allure-ci-bundle' || format === 'ci') {
      const json = automationBundleExportService.generateAllureCiBundleJson(state);
      return new NextResponse(json, {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="${slug}-onespec-devops-ci-bundle.json"`,
        },
      });
    }

    if (format === 'ai-qa' || format === 'ai-qa-blueprint' || format === 'blueprint') {
      const json = automationBundleExportService.generateAiQaBlueprintJson(state);
      return new NextResponse(json, {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="${slug}-ai-augmented-qa-architecture.json"`,
        },
      });
    }

    if (format === 'rbac') {
      const matrix = rbacDifferentialMatrixService.buildDifferentialMatrix(state);
      return NextResponse.json(matrix, { status: 200 });
    }

    if (format === 'git-patch' || format === 'patch') {
      const patch = selfHealingPatchService.generateUnifiedGitPatch(state);
      return new NextResponse(patch, {
        status: 200,
        headers: {
          'Content-Type': 'text/x-diff; charset=utf-8',
          'Content-Disposition': `attachment; filename="${slug}-self-healing-remediation.patch"`,
        },
      });
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
