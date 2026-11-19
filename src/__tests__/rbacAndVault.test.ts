import test from 'node:test';
import assert from 'node:assert/strict';
import { RbacDifferentialMatrixService } from '../services/rbacDifferentialMatrixService';
import { WorkspaceVaultService } from '../services/workspaceVaultService';
import type { CompiledSdlcState } from '../services/sdlcCompiler';

test('RBAC Matrix: initializes singleton and generates standard multi-persona definitions', () => {
  const rbacService = RbacDifferentialMatrixService.getInstance();
  assert.ok(rbacService instanceof RbacDifferentialMatrixService);

  const mockState: Partial<CompiledSdlcState> = {
    appName: 'Commercial Center | Pancaran',
    targetUrl: 'http://10.10.15.79:3000',
    discoveredFeatureModules: [
      {
        id: 'mod-auth',
        name: 'Authentication & Access Gate',
        routePath: '/login',
        summary: 'Authentication surface with Pancaran / Eksternal dropdown context',
        interactiveControls: [
          {
            selector: 'input#username',
            label: 'Username',
            category: 'INPUT_FIELD',
            semanticIntent: 'USER_INPUT',
            recommendedAction: 'Input valid user credentials',
          },
          {
            selector: 'input#password',
            label: 'Password',
            category: 'INPUT_FIELD',
            semanticIntent: 'USER_INPUT',
            recommendedAction: 'Input secure password',
          },
        ],
        apiEndpoints: [
          { method: 'POST', path: '/api/v1/auth/login', summary: 'Authenticate user' },
        ],
      } as any,
      {
        id: 'mod-sq',
        name: 'Sales Quotation Management',
        routePath: '/sales-quotation',
        summary: 'Sales quotation management with price calculation and approval flow',
        interactiveControls: [
          {
            selector: 'button#btn-create-sq',
            label: 'Buat Sales Quotation',
            category: 'ACTION_BUTTON',
            semanticIntent: 'DATA_MUTATION',
            recommendedAction: 'Create new sales quotation',
          },
          {
            selector: 'button#btn-approve-sq',
            label: 'Setujui Penawaran',
            category: 'ACTION_BUTTON',
            semanticIntent: 'DATA_MUTATION',
            recommendedAction: 'Approve quotation',
          },
        ],
        apiEndpoints: [
          { method: 'GET', path: '/api/v1/sales-quotations', summary: 'List quotations' },
          { method: 'POST', path: '/api/v1/sales-quotations', summary: 'Create quotation' },
          { method: 'PUT', path: '/api/v1/sales-quotations/:id/approve', summary: 'Approve quotation' },
        ],
      } as any,
    ],
  };

  const report = rbacService.buildDifferentialMatrix(mockState as CompiledSdlcState);

  assert.equal(report.appName, 'Commercial Center | Pancaran');
  assert.ok(report.personas.length >= 4);

  const personaLevels = report.personas.map((p) => p.authorityLevel);
  assert.ok(personaLevels.includes('FULL_INTERNAL'));
  assert.ok(personaLevels.includes('EXTERNAL_PARTNER'));
  assert.ok(personaLevels.includes('READ_ONLY_AUDITOR'));
  assert.ok(personaLevels.includes('UNAUTHENTICATED'));

  // Ensure matrix rows map differential access rights properly
  assert.ok(report.rows.length > 0);

  // Check login route vs protected business route
  const loginRow = report.rows.find((r) => r.routePath === '/login');
  if (loginRow) {
    assert.equal(loginRow.unauthenticatedAccess, 'PUBLIC_LOGIN_SURFACE');
  }

  const protectedRows = report.rows.filter((r) => r.routePath !== '/login');
  for (const row of protectedRows) {
    assert.equal(row.pancaranInternalAccess, 'ALLOWED (HTTP 200/201)');
    assert.equal(row.unauthenticatedAccess, 'DENIED (HTTP 401 UNAUTHORIZED)');
    assert.match(row.owaspSecurityGate, /OWASP/);
  }
});

test('Workspace Vault: slugifyProjectId canonicalizes URLs and target names deterministically', () => {
  const vault = WorkspaceVaultService.getInstance();

  const id1 = vault.slugifyProjectId('http://10.10.15.79:3000/login');
  assert.equal(id1, '10-10-15-79-3000-login');

  const erpId = vault.slugifyProjectId('https://erp.internal.pancaran.com/app');
  assert.ok(erpId.includes('erp'));

  const cleanNameId = vault.slugifyProjectId('Commercial Center | Pancaran');
  assert.equal(cleanNameId, 'commercial-center-pancaran');
});

test('Workspace Vault: cleanProjectDisplayName sanitizes placeholders and extracts clear names', () => {
  const vault = WorkspaceVaultService.getInstance();

  // Rejects replacing actual target application with studio default
  const sanitized = vault.cleanProjectDisplayName('OneSpec SDLC Studio', 'http://10.10.15.79:3000/');
  assert.equal(sanitized, 'Commercial Center | Pancaran');

  const sanitizedFallback = vault.cleanProjectDisplayName(undefined, 'https://billing.fintech.io/portal');
  assert.equal(sanitizedFallback, 'Billing');

  const customPreserved = vault.cleanProjectDisplayName('Logistics Core Engine', 'http://127.0.0.1:8000');
  assert.equal(customPreserved, 'Logistics Core Engine');
});

test('Workspace Vault: extractMetricsFromState computes accurate, deterministic summary KPIs', () => {
  const vault = WorkspaceVaultService.getInstance();

  const mockState: Partial<CompiledSdlcState> = {
    discoveredModules: [{ name: 'Mod1' }, { name: 'Mod2' }] as any,
    discoveryResult: {
      apiEndpoints: [{ method: 'GET', path: '/api/v1/items' }],
      databaseTables: [{ tableName: 'items' }],
    } as any,
    rtmRows: [
      { id: '1', executionVerdict: 'PASSED' },
      { id: '2', executionVerdict: 'PASSED' },
      { id: '3', executionVerdict: 'FAILED' },
    ] as any,
    bugReports: [
      { id: 'BUG-1', title: 'Session timeout glitch' },
    ] as any,
    uatFlows: [
      { id: 'UAT-1', uatStatus: 'ACCEPTED' },
    ] as any,
  };

  const metrics = vault.extractMetricsFromState(mockState as CompiledSdlcState);

  assert.equal(metrics.modulesCount, 2);
  assert.equal(metrics.apisCount, 1);
  assert.equal(metrics.totalTests, 3);
  assert.equal(metrics.passedTests, 2);
  assert.equal(metrics.passRatePercent, 67);
  assert.equal(metrics.openBugsCount, 1);
  assert.equal(metrics.uatAcceptedCount, 1);
});
