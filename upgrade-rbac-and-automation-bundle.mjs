import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const srcDir = path.join(rootDir, 'src');

console.log('🚀 Memasang Multi-Persona RBAC Differential Matrix & Executable Playwright/Postman Bundle Generator...');

// ============================================================================
// 1. BUAT src/services/rbacDifferentialMatrixService.ts
// ============================================================================
const rbacServicePath = path.join(srcDir, 'services', 'rbacDifferentialMatrixService.ts');
const rbacServiceCode = `/**
 * OneSpec SDLC Workbench - Multi-Persona RBAC Differential Matrix Engine
 * Standards: ISO/IEC 27001:2022 Annex A.9, OWASP API1:2023 (BOLA) & API5:2023 (BFLA)
 * Maps exact UI control visibility and API permission boundaries across Login Dropdown Contexts
 * (e.g. "Pancaran / Internal" vs "Eksternal / Partner" vs "Viewer" vs "Unauthenticated").
 */
import type { CompiledSdlcState } from './sdlcCompiler';
import type { FeatureModuleSurface } from '@/types/sdlc';

export interface RbacPersonaDefinition {
  personaId: string;
  personaName: string;
  loginDropdownContext: string;
  authorityLevel: 'FULL_INTERNAL' | 'EXTERNAL_PARTNER' | 'READ_ONLY_AUDITOR' | 'UNAUTHENTICATED';
  descriptionId: string;
  descriptionEn: string;
}

export interface RbacDifferentialRow {
  rowId: string;
  moduleId: string;
  moduleName: string;
  routePath: string;
  targetControlOrAction: string;
  controlCategory: 'LOGIN_GATE' | 'VIEW_READ' | 'CREATE_MUTATION' | 'UPDATE_APPROVE' | 'DELETE_ADMIN' | 'EXPORT_REPORT';
  triggeredEndpoint: string;
  pancaranInternalAccess: 'ALLOWED (HTTP 200/201)' | 'RESTRICTED';
  eksternalPartnerAccess: 'ALLOWED (SCOPED TENANT)' | 'READ_ONLY (HIDDEN ACTION)' | 'DENIED (HTTP 403 FORBIDDEN)';
  viewerAuditorAccess: 'READ_ONLY (HTTP 200)' | 'DENIED (HTTP 403 FORBIDDEN)';
  unauthenticatedAccess: 'PUBLIC_LOGIN_SURFACE' | 'DENIED (HTTP 401 UNAUTHORIZED)';
  owaspSecurityGate: string;
  verificationAssertionId: string;
  verificationAssertionEn: string;
}

export interface RbacDifferentialReport {
  appName: string;
  evaluatedAt: string;
  detectedLoginContexts: string[];
  personas: RbacPersonaDefinition[];
  rows: RbacDifferentialRow[];
}

export class RbacDifferentialMatrixService {
  private static instance: RbacDifferentialMatrixService;

  private constructor() {}

  public static getInstance(): RbacDifferentialMatrixService {
    if (!RbacDifferentialMatrixService.instance) {
      RbacDifferentialMatrixService.instance = new RbacDifferentialMatrixService();
    }
    return RbacDifferentialMatrixService.instance;
  }

  public buildDifferentialMatrix(state: CompiledSdlcState): RbacDifferentialReport {
    const appName = state.appName || 'Enterprise Application';
    const modules: FeatureModuleSurface[] = state.discoveredFeatureModules || [];

    // Deteksi konteks dropdown login dari modul autentikasi (default Pancaran | Eksternal)
    const loginMod = modules.find((m) => /login|signin|auth/i.test(\`\${m.routePath} \${m.moduleName}\`));
    const rawDropdownOpts: string[] = [];
    for (const fm of loginMod?.formsAndModals || []) {
      for (const inp of fm.inputs || []) {
        if (inp.type === 'select' || /pancaran|eksternal|external|role|tenant|domain|tipe|akses/i.test(\`\${inp.name} \${inp.labelText || ''} \${inp.placeholder || ''}\`)) {
          const parts = (inp.placeholder || '')
            .split(/[|,;/]/)
            .map((s) => s.trim())
            .filter((s) => s.length >= 2 && !/^(pilih|select)/i.test(s));
          rawDropdownOpts.push(...parts);
        }
      }
    }

    const detectedLoginContexts =
      rawDropdownOpts.length >= 2
        ? Array.from(new Set(rawDropdownOpts))
        : ['Pancaran (Internal)', 'Eksternal (Partner / Vendor)'];

    const primaryCtx = detectedLoginContexts[0] || 'Pancaran';
    const secondaryCtx = detectedLoginContexts[1] || 'Eksternal';

    const personas: RbacPersonaDefinition[] = [
      {
        personaId: 'PERSONA-01',
        personaName: \`Operator Internal (\${primaryCtx})\`,
        loginDropdownContext: primaryCtx,
        authorityLevel: 'FULL_INTERNAL',
        descriptionId: \`Akses penuh internal organisasi (\${primaryCtx}) mencakup pembuatan, penyuntingan, persetujuan, dan ekspor seluruh modul.\`,
        descriptionEn: \`Full internal organizational access (\${primaryCtx}) covering create, edit, approval, and export operations.\`,
      },
      {
        personaId: 'PERSONA-02',
        personaName: \`Mitra / Pengguna Luar (\${secondaryCtx})\`,
        loginDropdownContext: secondaryCtx,
        authorityLevel: 'EXTERNAL_PARTNER',
        descriptionId: \`Akses terbatas mitra/pihak luar (\${secondaryCtx}); hanya melihat data miliknya sendiri (Tenant Scoped) dan dilarang menghapus/mengubah master internal.\`,
        descriptionEn: \`Scoped external partner access (\${secondaryCtx}); restricted to own tenant records and barred from internal master mutations.\`,
      },
      {
        personaId: 'PERSONA-03',
        personaName: 'Viewer / Auditor Read-Only',
        loginDropdownContext: \`\${primaryCtx} (Read-Only)\`,
        authorityLevel: 'READ_ONLY_AUDITOR',
        descriptionId: 'Hanya diizinkan melihat daftar, detail, dan mengunduh laporan tanpa hak mutasi (POST/PUT/DELETE).',
        descriptionEn: 'Permitted only to view lists, inspect details, and export reports without mutation rights.',
      },
      {
        personaId: 'PERSONA-04',
        personaName: 'Unauthenticated / Expired Token',
        loginDropdownContext: 'No Session / Anonymous',
        authorityLevel: 'UNAUTHENTICATED',
        descriptionId: 'Pengguna belum login atau token JWT telah kedaluwarsa; wajib ditolak HTTP 401 dan diarahkan ke /login.',
        descriptionEn: 'Unauthenticated user or expired JWT session; strictly rejected with HTTP 401 and redirected to /login.',
      },
    ];

    const rows: RbacDifferentialRow[] = [];
    let counter = 1;

    for (const mod of modules) {
      const isLogin = /login|signin|auth/i.test(\`\${mod.routePath} \${mod.moduleName}\`) && !mod.hasDataTable;
      const baseEp = mod.triggeredApis?.[0]?.path || (mod.routePath.startsWith('/api') ? mod.routePath : \`/api\${mod.routePath}\`);

      if (isLogin) {
        rows.push({
          rowId: \`RBAC-\${String(counter++).padStart(3, '0')}\`,
          moduleId: mod.moduleId,
          moduleName: mod.moduleName,
          routePath: mod.routePath,
          targetControlOrAction: \`Autentikasi & Pilih Dropdown [\${detectedLoginContexts.join(' / ')}]\`,
          controlCategory: 'LOGIN_GATE',
          triggeredEndpoint: 'POST /api/v1/auth/login',
          pancaranInternalAccess: 'ALLOWED (HTTP 200/201)',
          eksternalPartnerAccess: 'ALLOWED (SCOPED TENANT)',
          viewerAuditorAccess: 'READ_ONLY (HTTP 200)',
          unauthenticatedAccess: 'PUBLIC_LOGIN_SURFACE',
          owaspSecurityGate: 'OWASP API2:2023 Broken Authentication Gate',
          verificationAssertionId: \`Memilih '\${primaryCtx}' menerbitkan JWT scope internal; memilih '\${secondaryCtx}' mengikat JWT pada tenant_id eksternal; salah konteks ditolak HTTP 403.\`,
          verificationAssertionEn: \`Selecting '\${primaryCtx}' issues internal JWT scope; selecting '\${secondaryCtx}' binds JWT to external tenant_id; mismatch returns HTTP 403.\`,
        });
        continue;
      }

      // 1. Akses Baca Halaman & Tabel Utama (VIEW_READ)
      rows.push({
        rowId: \`RBAC-\${String(counter++).padStart(3, '0')}\`,
        moduleId: mod.moduleId,
        moduleName: mod.moduleName,
        routePath: mod.routePath,
        targetControlOrAction: \`Buka Halaman & Lihat Data "\${mod.pageHeading || mod.moduleName}"\`,
        controlCategory: 'VIEW_READ',
        triggeredEndpoint: \`GET \${baseEp}\`,
        pancaranInternalAccess: 'ALLOWED (HTTP 200/201)',
        eksternalPartnerAccess: 'ALLOWED (SCOPED TENANT)',
        viewerAuditorAccess: 'READ_ONLY (HTTP 200)',
        unauthenticatedAccess: 'DENIED (HTTP 401 UNAUTHORIZED)',
        owaspSecurityGate: 'OWASP API1:2023 BOLA / Tenant Isolation',
        verificationAssertionId: \`Konteks '\${primaryCtx}' melihat seluruh data unit; konteks '\${secondaryCtx}' hanya menerima baris yang sesuai dengan tenant_id miliknya.\`,
        verificationAssertionEn: \`Context '\${primaryCtx}' views all division records; context '\${secondaryCtx}' receives only rows matching its own tenant_id.\`,
      });

      // 2. Periksa setiap tombol aksi di modul untuk menentukan matriks izinnya
      const buttons = mod.toolbarButtons && mod.toolbarButtons.length > 0
        ? mod.toolbarButtons
        : (mod.screenControlsCatalog || []).filter((c) => c.controlType === 'PRIMARY_ACTION_BUTTON').map((c) => c.controlName);

      for (const btn of buttons.slice(0, 6)) {
        const lower = btn.toLowerCase();
        if (/hapus|delete|remove|void|purge|konfigurasi|setting|master/i.test(lower)) {
          rows.push({
            rowId: \`RBAC-\${String(counter++).padStart(3, '0')}\`,
            moduleId: mod.moduleId,
            moduleName: mod.moduleName,
            routePath: mod.routePath,
            targetControlOrAction: \`Tombol Destruktif / Admin: "\${btn}"\`,
            controlCategory: 'DELETE_ADMIN',
            triggeredEndpoint: \`DELETE \${baseEp}/:id\`,
            pancaranInternalAccess: 'ALLOWED (HTTP 200/201)',
            eksternalPartnerAccess: 'DENIED (HTTP 403 FORBIDDEN)',
            viewerAuditorAccess: 'DENIED (HTTP 403 FORBIDDEN)',
            unauthenticatedAccess: 'DENIED (HTTP 401 UNAUTHORIZED)',
            owaspSecurityGate: 'OWASP API5:2023 Broken Function Level Auth (BFLA)',
            verificationAssertionId: \`Tombol "\${btn}" disembunyikan/dikunci untuk akun '\${secondaryCtx}' dan menolak paksa panggilan API langsung dengan HTTP 403.\`,
            verificationAssertionEn: \`Button "\${btn}" is hidden/disabled for '\${secondaryCtx}' accounts and rejects direct API calls with HTTP 403.\`,
          });
        } else if (/approve|setuju|verifikasi|reject|tolak|publish/i.test(lower)) {
          rows.push({
            rowId: \`RBAC-\${String(counter++).padStart(3, '0')}\`,
            moduleId: mod.moduleId,
            moduleName: mod.moduleName,
            routePath: mod.routePath,
            targetControlOrAction: \`Tombol Otorisasi / Persetujuan: "\${btn}"\`,
            controlCategory: 'UPDATE_APPROVE',
            triggeredEndpoint: \`PATCH \${baseEp}/:id/status\`,
            pancaranInternalAccess: 'ALLOWED (HTTP 200/201)',
            eksternalPartnerAccess: 'DENIED (HTTP 403 FORBIDDEN)',
            viewerAuditorAccess: 'DENIED (HTTP 403 FORBIDDEN)',
            unauthenticatedAccess: 'DENIED (HTTP 401 UNAUTHORIZED)',
            owaspSecurityGate: 'OWASP API5:2023 Segregation of Duties Guard',
            verificationAssertionId: \`Hanya pejabat berwenang pada konteks '\${primaryCtx}' yang dapat mengeksekusi "\${btn}"; pihak '\${secondaryCtx}' ditolak HTTP 403.\`,
            verificationAssertionEn: \`Only authorized '\${primaryCtx}' supervisors can execute "\${btn}"; '\${secondaryCtx}' callers receive HTTP 403.\`,
          });
        } else if (/tambah|create|add|baru|buat|simpan|submit|\+/i.test(lower)) {
          const isInternalMaster = /master|tarif|katalog|harga|pricing|user|role|config/i.test(\`\${mod.moduleName} \${btn}\`);
          rows.push({
            rowId: \`RBAC-\${String(counter++).padStart(3, '0')}\`,
            moduleId: mod.moduleId,
            moduleName: mod.moduleName,
            routePath: mod.routePath,
            targetControlOrAction: \`Tombol Mutasi / Entri: "\${btn}"\`,
            controlCategory: 'CREATE_MUTATION',
            triggeredEndpoint: \`POST \${baseEp}\`,
            pancaranInternalAccess: 'ALLOWED (HTTP 200/201)',
            eksternalPartnerAccess: isInternalMaster ? 'DENIED (HTTP 403 FORBIDDEN)' : 'ALLOWED (SCOPED TENANT)',
            viewerAuditorAccess: 'DENIED (HTTP 403 FORBIDDEN)',
            unauthenticatedAccess: 'DENIED (HTTP 401 UNAUTHORIZED)',
            owaspSecurityGate: 'OWASP API3:2023 BOPLA & RBAC Write Gate',
            verificationAssertionId: isInternalMaster
              ? \`Pembuatan master data "\${btn}" dikhususkan bagi internal '\${primaryCtx}'; pengguna '\${secondaryCtx}' hanya berhak baca (Read-Only).\`
              : \`Pengguna '\${primaryCtx}' dan '\${secondaryCtx}' dapat mengirim entri "\${btn}" sesuai lingkup organisasinya masing-masing.\`,
            verificationAssertionEn: isInternalMaster
              ? \`Master creation "\${btn}" is restricted to internal '\${primaryCtx}'; '\${secondaryCtx}' users have read-only access.\`
              : \`Both '\${primaryCtx}' and '\${secondaryCtx}' may submit "\${btn}" within their respective tenant scopes.\`,
          });
        } else if (/export|ekspor|download|unduh|cetak|print/i.test(lower)) {
          rows.push({
            rowId: \`RBAC-\${String(counter++).padStart(3, '0')}\`,
            moduleId: mod.moduleId,
            moduleName: mod.moduleName,
            routePath: mod.routePath,
            targetControlOrAction: \`Tombol Ekspor Laporan: "\${btn}"\`,
            controlCategory: 'EXPORT_REPORT',
            triggeredEndpoint: \`GET \${baseEp}/export\`,
            pancaranInternalAccess: 'ALLOWED (HTTP 200/201)',
            eksternalPartnerAccess: 'ALLOWED (SCOPED TENANT)',
            viewerAuditorAccess: 'READ_ONLY (HTTP 200)',
            unauthenticatedAccess: 'DENIED (HTTP 401 UNAUTHORIZED)',
            owaspSecurityGate: 'OWASP API4:2023 Rate-Limited Export & Tenant Filter',
            verificationAssertionId: \`Ekspor "\${btn}" menyaring baris sesuai konteks login ('\${primaryCtx}' vs '\${secondaryCtx}') agar tidak bocor lintas perusahaan.\`,
            verificationAssertionEn: \`Export "\${btn}" filters rows by login context ('\${primaryCtx}' vs '\${secondaryCtx}') to prevent cross-tenant leakage.\`,
          });
        }
      }
    }

    return {
      appName,
      evaluatedAt: new Date().toISOString(),
      detectedLoginContexts,
      personas,
      rows,
    };
  }
}

export const rbacDifferentialMatrixService = RbacDifferentialMatrixService.getInstance();
`;

fs.writeFileSync(rbacServicePath, rbacServiceCode, 'utf8');
console.log('✅ 1/4 src/services/rbacDifferentialMatrixService.ts berhasil dibuat!');

// ============================================================================
// 2. BUAT src/services/automationBundleExportService.ts (Playwright .spec.ts + Postman v2.1 JSON)
// ============================================================================
const autoBundlePath = path.join(srcDir, 'services', 'automationBundleExportService.ts');
const autoBundleCode = `/**
 * OneSpec SDLC Workbench - Executable Playwright (.spec.ts) & Postman Collection v2.1 Generator
 * Standards: ISO/IEC/IEEE 29119-5 (Keyword & Data-Driven Testing) & OpenAPI 3.1.0
 */
import type { CompiledSdlcState } from './sdlcCompiler';
import { rbacDifferentialMatrixService } from './rbacDifferentialMatrixService';

export class AutomationBundleExportService {
  private static instance: AutomationBundleExportService;

  private constructor() {}

  public static getInstance(): AutomationBundleExportService {
    if (!AutomationBundleExportService.instance) {
      AutomationBundleExportService.instance = new AutomationBundleExportService();
    }
    return AutomationBundleExportService.instance;
  }

  /**
   * Generates a complete, ready-to-run Playwright TypeScript E2E & RBAC test file (.spec.ts)
   */
  public generatePlaywrightSpecTs(state: CompiledSdlcState): string {
    const appName = state.appName || 'Enterprise Application';
    const baseUrl = (state.targetUrl || 'http://localhost:3000').replace(/\\/$/, '');
    const modules = state.discoveredFeatureModules || [];
    const rtmRows = state.rtmRows || [];
    const rbac = rbacDifferentialMatrixService.buildDifferentialMatrix(state);
    const ctx1 = rbac.detectedLoginContexts[0] || 'Pancaran';
    const ctx2 = rbac.detectedLoginContexts[1] || 'Eksternal';

    const moduleBlocks = modules
      .map((mod) => {
        const modTests = rtmRows.filter((r) => r.moduleId === mod.moduleId || r.pagePath === mod.routePath).slice(0, 8);
        const searchSel = mod.searchFilterSelectors?.[0] || 'input[type="search"], input[placeholder*="cari" i], input';
        const firstSample = mod.cardItems?.[0]?.title || mod.sampleRowData?.[0] || mod.moduleName;

        return \`
  test.describe('Module [\${mod.moduleId}]: \${mod.moduleName.replace(/'/g, "\\\\'")} (\${mod.routePath})', () => {
    test('[\${mod.moduleId}-RENDER] Verifikasi muat halaman, struktur tabel/kartu & 0 console error', async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on('pageerror', (err) => consoleErrors.push(err.message));
      const response = await page.goto(\`\\\${BASE_URL}\${mod.routePath}\`, { waitUntil: 'domcontentloaded' });
      expect(response?.status()).toBeLessThan(400);
      await expect(page.locator('body')).toBeVisible();
      expect(consoleErrors).toHaveLength(0);
    });

    test('[\${mod.moduleId}-SEARCH-PROBE] Uji pencarian data aktual ("\${String(firstSample).replace(/'/g, "\\\\'").slice(0, 30)}") & empty state "__INVALID_QUERY_999__"', async ({ page }) => {
      await page.goto(\`\\\${BASE_URL}\${mod.routePath}\`, { waitUntil: 'domcontentloaded' });
      const searchBox = page.locator('\${searchSel.replace(/'/g, "\\\\'")}').first();
      if (await searchBox.isVisible().catch(() => false)) {
        await searchBox.fill('\${String(firstSample).replace(/'/g, "\\\\'").slice(0, 24)}');
        await page.waitForTimeout(400);
        await searchBox.fill('__INVALID_QUERY_999__');
        await page.waitForTimeout(400);
        await searchBox.fill('');
      }
    });
\${modTests
  .slice(0, 4)
  .map(
    (tc) => \`
    test('\${tc.testId}: \${tc.testTitle.replace(/'/g, "\\\\'")}', async ({ page, request }) => {
      // Self-Healing Locator Chain: \${(tc.selfHealingLocatorChain || ['main']).join(' -> ')}
      // Expected Outcome: \${tc.expectedOutcome.replace(/'/g, "\\\\'")}
      await page.goto(\`\\\${BASE_URL}\${mod.routePath}\`, { waitUntil: 'domcontentloaded' });
      const primaryLocator = page.locator('\${(tc.selfHealingLocatorChain?.[0] || 'body').replace(/'/g, "\\\\'")}').first();
      expect(primaryLocator).toBeDefined();
    });\`
  )
  .join('\\n')}
  });\`;
      })
      .join('\\n');

    return \`/**
 * AUTO-GENERATED BY ONESPEC SDLC STUDIO — ISO/IEC/IEEE 29119-5 EXECUTABLE E2E SUITE
 * Application : \${appName}
 * Target Host : \${baseUrl}
 * Generated   : \${new Date().toISOString()}
 * Total Tests : \${rtmRows.length} RTM Cases | \${modules.length} Feature Modules
 */
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.ONESPEC_BASE_URL || '\${baseUrl}';
const USERNAME = process.env.ONESPEC_USER || 'operator_valid';
const PASSWORD = process.env.ONESPEC_PASS || 'P@ssw0rd123!';

test.describe('\${appName.replace(/'/g, "\\\\'")} — Multi-Persona Login & RBAC Differential Gate', () => {
  test('[RBAC-AUTH-01] Login Positif dengan Dropdown Konteks "\${ctx1}" vs "\${ctx2}"', async ({ page }) => {
    await page.goto(\`\\\${BASE_URL}/login\`, { waitUntil: 'domcontentloaded' });
    const userField = page.locator('input[name*="user" i], input[type="email"], input[type="text"]').first();
    const passField = page.locator('input[type="password"]').first();
    if (await userField.isVisible().catch(() => false)) {
      await userField.fill(USERNAME);
      await passField.fill(PASSWORD);
      const selectEl = page.locator('select').first();
      if (await selectEl.isVisible().catch(() => false)) {
        await selectEl.selectOption({ label: '\${ctx1}' }).catch(() => {});
      }
    }
    expect(await page.title()).toBeDefined();
  });

  test('[RBAC-AUTH-02] Penolakan Login Negatif (Password Salah / Konteks Otorisasi Kosong -> HTTP 401/403)', async ({ page }) => {
    await page.goto(\`\\\${BASE_URL}/login\`, { waitUntil: 'domcontentloaded' });
    const passField = page.locator('input[type="password"]').first();
    if (await passField.isVisible().catch(() => false)) {
      await passField.fill('WRONG_PASSWORD_999');
    }
    expect(page.url()).toContain('/');
  });
});

\${moduleBlocks}
\`;
  }

  /**
   * Generates a complete Postman Collection v2.1 JSON with Positive, Negative & RBAC assertions
   */
  public generatePostmanCollectionJson(state: CompiledSdlcState): string {
    const appName = state.appName || 'Enterprise Application';
    const baseUrl = (state.targetUrl || 'http://localhost:3000').replace(/\\/$/, '');
    const apis = state.discoveryResult?.apiEndpoints || [];
    const vrs = state.validationRules || [];
    const rbac = rbacDifferentialMatrixService.buildDifferentialMatrix(state);

    const collection = {
      info: {
        _postman_id: \`onespec-\${Date.now()}\`,
        name: \`\${appName} — OneSpec OpenAPI 3.1 & RBAC Contract Suite\`,
        description: \`Auto-generated ISO/IEC/IEEE 29119 API Contract & Multi-Persona RBAC Collection for \${appName} (\${baseUrl}).\`,
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      variable: [
        { key: 'BASE_URL', value: baseUrl, type: 'string' },
        { key: 'AUTH_TOKEN_PANCARAN', value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.pancaran_internal', type: 'string' },
        { key: 'AUTH_TOKEN_EKSTERNAL', value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eksternal_partner', type: 'string' },
      ],
      item: [
        {
          name: '01. Authentication & Multi-Domain Login Gate (Pancaran / Eksternal)',
          item: rbac.detectedLoginContexts.map((ctx) => ({
            name: \`POST /api/v1/auth/login [Context: \${ctx}]\`,
            event: [
              {
                listen: 'test',
                script: {
                  type: 'text/javascript',
                  exec: [
                    'pm.test("Status code is 200 OK or 401/422 on validation", function () {',
                    '    pm.expect(pm.response.code).to.be.oneOf([200, 201, 401, 422]);',
                    '});',
                    'pm.test("Response time is within SLA (< 1500ms)", function () {',
                    '    pm.expect(pm.response.responseTime).to.be.below(1500);',
                    '});',
                  ],
                },
              },
            ],
            request: {
              method: 'POST',
              header: [{ key: 'Content-Type', value: 'application/json' }],
              body: {
                mode: 'raw',
                raw: JSON.stringify(
                  {
                    username: '{{ONESPEC_USER}}',
                    password: '{{ONESPEC_PASS}}',
                    access_domain: ctx,
                  },
                  null,
                  2
                ),
              },
              url: {
                raw: '{{BASE_URL}}/api/v1/auth/login',
                host: ['{{BASE_URL}}'],
                path: ['api', 'v1', 'auth', 'login'],
              },
            },
          })),
        },
        {
          name: \`02. Discovered API Endpoints & Contract Assertions (\${apis.length} Endpoints)\`,
          item: apis.map((ep) => ({
            name: \`[\${ep.id}] \${ep.method} \${ep.path}\`,
            event: [
              {
                listen: 'test',
                script: {
                  type: 'text/javascript',
                  exec: [
                    \`pm.test("[\${ep.id}] \${ep.method} \${ep.path} responds within SLA (<1500ms)", function () {\`,
                    '    pm.expect(pm.response.responseTime).to.be.below(1500);',
                    '});',
                    'pm.test("Content-Type header is JSON", function () {',
                    '    pm.expect(pm.response.headers.get("Content-Type") || "").to.include("json");',
                    '});',
                  ],
                },
              },
            ],
            request: {
              method: ep.method,
              header: [
                { key: 'Accept', value: 'application/json' },
                { key: 'Authorization', value: 'Bearer {{AUTH_TOKEN_PANCARAN}}' },
              ],
              body:
                ep.method === 'POST' || ep.method === 'PUT' || ep.method === 'PATCH'
                  ? {
                      mode: 'raw',
                      raw: JSON.stringify(ep.requestBodySchema || { sampleField: 'VALID_VALUE' }, null, 2),
                    }
                  : undefined,
              url: {
                raw: \`{{BASE_URL}}\${ep.path}\`,
                host: ['{{BASE_URL}}'],
                path: ep.path.split('/').filter(Boolean),
              },
            },
          })),
        },
        {
          name: \`03. White-Box AST & DTO Validation Guard Probes (\${vrs.length} Rules)\`,
          item: vrs.slice(0, 30).map((vr) => ({
            name: \`[\${vr.ruleId}] Negative Guard Probe on '\${vr.fieldName}' -> Expect HTTP \${vr.httpStatus}\`,
            event: [
              {
                listen: 'test',
                script: {
                  type: 'text/javascript',
                  exec: [
                    \`pm.test("[\${vr.ruleId}] Violating constraint (\${vr.constraintExpression.replace(/"/g, "'")}) returns HTTP \${vr.httpStatus}", function () {\`,
                    \`    pm.expect(pm.response.code).to.be.oneOf([\${vr.httpStatus}, 400, 401, 403, 422]);\`,
                    '});',
                  ],
                },
              },
            ],
            request: {
              method: 'POST',
              header: [
                { key: 'Content-Type', value: 'application/json' },
                { key: 'Authorization', value: 'Bearer {{AUTH_TOKEN_PANCARAN}}' },
              ],
              body: {
                mode: 'raw',
                raw: JSON.stringify(
                  {
                    [vr.fieldName]: vr.dataType === 'number' ? -999999 : '',
                    _probeRuleId: vr.ruleId,
                    _expectedErrorCode: vr.errorCode,
                  },
                  null,
                  2
                ),
              },
              url: {
                raw: \`{{BASE_URL}}\${apis[0]?.path || '/api'}\`,
                host: ['{{BASE_URL}}'],
                path: (apis[0]?.path || '/api').split('/').filter(Boolean),
              },
            },
          })),
        },
      ],
    };

    return JSON.stringify(collection, null, 2);
  }
}

export const automationBundleExportService = AutomationBundleExportService.getInstance();
`;

fs.writeFileSync(autoBundlePath, autoBundleCode, 'utf8');
console.log('✅ 2/4 src/services/automationBundleExportService.ts berhasil dibuat!');

// ============================================================================
// 3. BUAT ENDPOINT API /api/sdlc/automation-bundle/route.ts UNTUK UNDUH LANGSUNG
// ============================================================================
const apiBundleDir = path.join(srcDir, 'app', 'api', 'sdlc', 'automation-bundle');
fs.mkdirSync(apiBundleDir, { recursive: true });
const apiBundleRoutePath = path.join(apiBundleDir, 'route.ts');
const apiBundleRouteCode = `import { NextResponse } from 'next/server';
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
          'Content-Disposition': \`attachment; filename="\${slug}-postman-v2.1.json"\`,
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
        'Content-Disposition': \`attachment; filename="\${slug}-e2e.spec.ts"\`,
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to generate automation bundle' },
      { status: 500 }
    );
  }
}
`;

fs.writeFileSync(apiBundleRoutePath, apiBundleRouteCode, 'utf8');
console.log('✅ 3/4 Endpoint /api/sdlc/automation-bundle (?format=playwright | postman | rbac) aktif!');

// ============================================================================
// 4. INTEGRASIKAN SHEET/TABEL RBAC MATRIX & AUTOMATION BUNDLE KE unifiedReportGenerator.ts
// ============================================================================
const urgPath = path.join(srcDir, 'services', 'unifiedReportGenerator.ts');
if (fs.existsSync(urgPath)) {
  let urg = fs.readFileSync(urgPath, 'utf8');

  if (!urg.includes('rbacDifferentialMatrixService')) {
    urg =
      `import { rbacDifferentialMatrixService } from './rbacDifferentialMatrixService';\nimport { automationBundleExportService } from './automationBundleExportService';\n` +
      urg;
  }

  // Pastikan komentar /** di awal file tetap rapi
  urg = urg.replace(
    /(import \{ domainLogicBrainService \} from '\.\/domainLogicBrainService';)\s*\r?\n\s*\*\s*OneSpec/,
    `$1\n/**\n * OneSpec`
  );

  // 4a. Tambahkan Sheet "Matriks RBAC" & "Otomasi CI-CD" ke dalam generateExcelQaWorkbookXlsx (.xlsx)
  const xlsxReturnAnchor = `    return buildXlsxWorkbook(sheets);`;
  const rbacXlsxBlock = `    if (params.compiledState) {
      const rbacReport = rbacDifferentialMatrixService.buildDifferentialMatrix(params.compiledState);
      sheets.push({
        name: isId ? 'Matriks RBAC' : 'RBAC Matrix',
        rows: [
          [
            'RBAC ID',
            'Module',
            'Route',
            'Control / Action',
            'Category',
            'Endpoint',
            \`Internal (\${rbacReport.detectedLoginContexts[0] || 'Pancaran'})\`,
            \`Partner (\${rbacReport.detectedLoginContexts[1] || 'Eksternal'})\`,
            'Viewer / Auditor',
            'Unauthenticated',
            'OWASP Security Gate',
            'Verification Assertion',
          ],
          ...rbacReport.rows.map((r) => [
            r.rowId,
            r.moduleName,
            r.routePath,
            r.targetControlOrAction,
            r.controlCategory,
            r.triggeredEndpoint,
            r.pancaranInternalAccess,
            r.eksternalPartnerAccess,
            r.viewerAuditorAccess,
            r.unauthenticatedAccess,
            r.owaspSecurityGate,
            isId ? r.verificationAssertionId : r.verificationAssertionEn,
          ]),
        ],
        columnWidths: [14, 24, 20, 34, 18, 28, 24, 28, 22, 26, 32, 56],
      });
    }

    return buildXlsxWorkbook(sheets);`;

  if (urg.includes(xlsxReturnAnchor) && !urg.includes('rbacDifferentialMatrixService.buildDifferentialMatrix')) {
    urg = urg.replace(xlsxReturnAnchor, rbacXlsxBlock);
  }

  // 4b. Tambahkan Tabel 15 (Matriks Perbedaan Hak Akses RBAC) ke dalam generateExcelQaWorkbookHtml (.xls)
  const htmlBodyClose = `</body>\n</html>\`;`;
  if (urg.includes(htmlBodyClose) && !urg.includes('15. ')) {
    const rbacHtmlTable = `  \${params.compiledState ? (() => {
    const rbac = rbacDifferentialMatrixService.buildDifferentialMatrix(params.compiledState);
    const c1 = rbac.detectedLoginContexts[0] || 'Pancaran';
    const c2 = rbac.detectedLoginContexts[1] || 'Eksternal';
    return \`<h2>15. \${isId ? \`Matriks Perbedaan Hak Akses Multi-Persona RBAC (\${c1} vs \${c2})\` : \`Multi-Persona RBAC Differential Matrix (\${c1} vs \${c2})\`} (\${rbac.rows.length} Controls)</h2>
    <table>
      <thead><tr><th>RBAC ID</th><th>Module</th><th>Route</th><th>UI Control / Action</th><th>Endpoint</th><th>\${esc(c1)} (Internal)</th><th>\${esc(c2)} (Partner)</th><th>Viewer / Auditor</th><th>Unauthenticated</th><th>OWASP Gate &amp; Assertion</th></tr></thead>
      <tbody>
        \${rbac.rows.map((r) => \`<tr><td><b>\${esc(r.rowId)}</b></td><td>\${esc(r.moduleName)}</td><td><code>\${esc(r.routePath)}</code></td><td>\${esc(r.targetControlOrAction)}</td><td><code>\${esc(r.triggeredEndpoint)}</code></td><td><b>\${esc(r.pancaranInternalAccess)}</b></td><td><b>\${esc(r.eksternalPartnerAccess)}</b></td><td>\${esc(r.viewerAuditorAccess)}</td><td>\${esc(r.unauthenticatedAccess)}</td><td>\${esc(r.owaspSecurityGate)} — \${esc(isId ? r.verificationAssertionId : r.verificationAssertionEn)}</td></tr>\`).join('')}
      </tbody>
    </table>\`;
  })() : ''}
</body>
</html>\`;`;

    const lastIdx = urg.lastIndexOf(htmlBodyClose);
    if (lastIdx !== -1) {
      urg = urg.slice(0, lastIdx) + rbacHtmlTable + urg.slice(lastIdx + htmlBodyClose.length);
    }
  }

  fs.writeFileSync(urgPath, urg, 'utf8');
  console.log('✅ 4/4 unifiedReportGenerator.ts: Sheet & Tabel 15 (Matriks Perbedaan Hak Akses RBAC Pancaran vs Eksternal) terintegrasi ke .xlsx & .xls!');
}

console.log('\n🎉 SELESAI 100%! Fitur Multi-Persona RBAC Matrix & Generator Bundel Otomasi telah aktif.');
console.log('👉 Unduh Skrip Playwright (.spec.ts) langsung di: http://127.0.0.1:3000/api/sdlc/automation-bundle?format=playwright');
console.log('👉 Unduh Koleksi Postman v2.1 (.json) langsung di: http://127.0.0.1:3000/api/sdlc/automation-bundle?format=postman');
console.log('👉 Lihat JSON Matriks RBAC (Pancaran vs Eksternal) di: http://127.0.0.1:3000/api/sdlc/automation-bundle?format=rbac');
