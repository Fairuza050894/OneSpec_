import test from 'node:test';
import assert from 'node:assert/strict';
import { RbacDifferentialMatrixService } from '../services/rbacDifferentialMatrixService';
import { WorkspaceVaultService, validateReleaseSignOffPrerequisites } from '../services/workspaceVaultService';
import { CURRENT_ENGINE_BUILD_ID } from '../lib/workspaceCache';
import type { CompiledSdlcState } from '../services/sdlcCompiler';
import type { ReleaseAuditSignatureRecord } from '../types/sdlc';

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

test('T-14 / F-08, F-20: validateReleaseSignOffPrerequisites enforces honest gate and prerequisite rules', () => {
  // 1. Stale cache rejects immediately
  const staleRes = validateReleaseSignOffPrerequisites(
    { gateVerdict: 'GO', criticalFindingsCount: 0, isStale: true, qaReviewed: true },
    { approverName: 'Alice', approverRole: 'Lead Architect' }
  );
  assert.equal(staleRes.allowed, false);
  assert.match(staleRes.reason || '', /stale \/ kedaluwarsa/i);

  // 2. Unreviewed QA rejects immediately
  const qaRes = validateReleaseSignOffPrerequisites(
    { gateVerdict: 'GO', criticalFindingsCount: 0, isStale: false, qaReviewed: false },
    { approverName: 'Alice', approverRole: 'Lead Architect' }
  );
  assert.equal(qaRes.allowed, false);
  assert.match(qaRes.reason || '', /Tinjauan QA belum selesai/i);

  // 3. NO_GO gate without exception is rejected
  const noGoRes = validateReleaseSignOffPrerequisites(
    { gateVerdict: 'NO_GO', criticalFindingsCount: 2, isStale: false, qaReviewed: true },
    { approverName: 'Alice', approverRole: 'Lead Architect', isException: false }
  );
  assert.equal(noGoRes.allowed, false);
  assert.equal(noGoRes.isExceptionRequired, true);
  assert.match(noGoRes.reason || '', /NO GO/i);

  // 4. Critical findings > 0 even if verdict is GO is treated as blocked gate
  const critBlockedRes = validateReleaseSignOffPrerequisites(
    { gateVerdict: 'GO', criticalFindingsCount: 1, isStale: false, qaReviewed: true },
    { approverName: 'Alice', approverRole: 'Lead Architect', isException: false }
  );
  assert.equal(critBlockedRes.allowed, false);
  assert.equal(critBlockedRes.isExceptionRequired, true);

  // 5. CONDITIONAL_GO requires notes of at least 20 chars
  const condShortNote = validateReleaseSignOffPrerequisites(
    { gateVerdict: 'CONDITIONAL_GO', criticalFindingsCount: 0, isStale: false, qaReviewed: true },
    { approverName: 'Alice', approverRole: 'Lead Architect', approvalNotes: 'Short' }
  );
  assert.equal(condShortNote.allowed, false);
  assert.match(condShortNote.reason || '', /minimal 20 karakter/i);

  const condValidNote = validateReleaseSignOffPrerequisites(
    { gateVerdict: 'CONDITIONAL_GO', criticalFindingsCount: 0, isStale: false, qaReviewed: true },
    { approverName: 'Alice', approverRole: 'Lead Architect', approvalNotes: 'Approval granted conditionally pending next sprint patch.' }
  );
  assert.equal(condValidNote.allowed, true);

  // 6. Pure GO succeeds
  const goRes = validateReleaseSignOffPrerequisites(
    { gateVerdict: 'GO', criticalFindingsCount: 0, isStale: false, qaReviewed: true },
    { approverName: 'Alice', approverRole: 'Lead Architect' }
  );
  assert.equal(goRes.allowed, true);

  // 7. NO_GO with invalid exception (short note or missing accepted risks)
  const noGoShortEx = validateReleaseSignOffPrerequisites(
    { gateVerdict: 'NO_GO', criticalFindingsCount: 1, isStale: false, qaReviewed: true },
    { approverName: 'Alice', approverRole: 'Lead Architect', isException: true, approvalNotes: 'Short note', acceptedRisks: ['Risk A'] }
  );
  assert.equal(noGoShortEx.allowed, false);
  assert.match(noGoShortEx.reason || '', /minimal 20 karakter/i);

  const noGoNoRisks = validateReleaseSignOffPrerequisites(
    { gateVerdict: 'NO_GO', criticalFindingsCount: 1, isStale: false, qaReviewed: true },
    { approverName: 'Alice', approverRole: 'Lead Architect', isException: true, approvalNotes: 'Formal exception approved by management for staging release.', acceptedRisks: [] }
  );
  assert.equal(noGoNoRisks.allowed, false);
  assert.match(noGoNoRisks.reason || '', /daftar risiko/i);

  // 8. NO_GO with valid exception succeeds
  const noGoValidEx = validateReleaseSignOffPrerequisites(
    { gateVerdict: 'NO_GO', criticalFindingsCount: 1, isStale: false, qaReviewed: true },
    {
      approverName: 'Alice',
      approverRole: 'Lead Architect',
      isException: true,
      approvalNotes: 'Formal exception approved by management for staging release.',
      acceptedRisks: ['Known XSS finding mitigated by WAF in staging environment'],
    }
  );
  assert.equal(noGoValidEx.allowed, true);
  assert.equal(noGoValidEx.isExceptionRequired, true);
});

test('T-14 / F-08, F-20: WorkspaceVaultService.recordReleaseSignOff stores valid SHA-256 hash, buildId, and rejects blocked states', () => {
  const vault = WorkspaceVaultService.getInstance();
  const testProjectId = 'test-release-sign-off-project';

  // Seed project in vault
  const mockState: Partial<CompiledSdlcState> = {
    appName: 'Test Release Target',
    targetUrl: 'http://127.0.0.1:8080/app',
    discoveredModules: [{ name: 'ModAuth' }] as any,
    rtmRows: [
      { id: '1', executionVerdict: 'PASSED' },
      { id: '2', executionVerdict: 'FAILED' },
    ] as any,
  };

  vault.saveProjectState({
    projectId: testProjectId,
    projectName: 'Test Release Target',
    targetUrl: 'http://127.0.0.1:8080/app',
    compiledState: mockState as CompiledSdlcState,
  });

  const baseSig: ReleaseAuditSignatureRecord = {
    signatureId: 'SIG-TEST-001',
    approverName: 'Dr. Jane Doe',
    approverRole: 'Lead Systems Architect',
    signedAt: new Date().toISOString(),
    snapshotHash: 'invalid-non-hex-hash', // Test hash canonicalization
    releaseGateStatus: 'APPROVED_FOR_PRODUCTION',
    approvalNotes: 'Standard release approval',
    prerequisitesChecked: ['QA_AND_GAP_AUDIT_REVIEWED'],
  };

  // 1. Rejected when gate is NO_GO and not an exception
  const rejectNoGo = vault.recordReleaseSignOff(testProjectId, baseSig, {
    gateVerdict: 'NO_GO',
    criticalFindingsCount: 1,
    isStale: false,
    qaReviewed: true,
  });
  assert.equal(rejectNoGo.success, false);
  assert.match(rejectNoGo.error || '', /NO GO/i);

  // 2. Rejected when cache is stale
  const rejectStale = vault.recordReleaseSignOff(testProjectId, baseSig, {
    gateVerdict: 'GO',
    criticalFindingsCount: 0,
    isStale: true,
    qaReviewed: true,
  });
  assert.equal(rejectStale.success, false);
  assert.match(rejectStale.error || '', /stale/i);

  // 3. Rejected when QA is not reviewed
  const rejectQa = vault.recordReleaseSignOff(testProjectId, baseSig, {
    gateVerdict: 'GO',
    criticalFindingsCount: 0,
    isStale: false,
    qaReviewed: false,
  });
  assert.equal(rejectQa.success, false);
  assert.match(rejectQa.error || '', /Tinjauan QA/i);

  // 4. Valid GO approval succeeds, sets valid 64-char hex SHA-256 snapshotHash, selfAttested: true, engineBuildId
  const validGo = vault.recordReleaseSignOff(testProjectId, baseSig, {
    gateVerdict: 'GO',
    criticalFindingsCount: 0,
    isStale: false,
    qaReviewed: true,
  });
  assert.equal(validGo.success, true);
  assert.ok(validGo.record);
  assert.ok(validGo.certificate);
  assert.equal(validGo.certificate.status, 'APPROVED_FOR_PRODUCTION');
  assert.equal(validGo.certificate.selfAttested, true);
  assert.equal(validGo.certificate.engineBuildId, CURRENT_ENGINE_BUILD_ID);
  // Verify 64-char hex SHA-256
  assert.match(validGo.certificate.snapshotHash || '', /^[0-9a-fA-F]{64}$/);

  // 5. Valid exception approval on NO_GO
  const exceptionSig: ReleaseAuditSignatureRecord = {
    signatureId: 'SIG-EX-TEST-002',
    approverName: 'Dr. Jane Doe',
    approverRole: 'Lead Systems Architect',
    signedAt: new Date().toISOString(),
    snapshotHash: 'a'.repeat(64),
    releaseGateStatus: 'EXCEPTION_APPROVED',
    approvalNotes: 'Formal operational release exception authorized for staging soak testing.',
    prerequisitesChecked: ['QA_AND_GAP_AUDIT_REVIEWED', 'EXCEPTION_WORKFLOW_APPROVED'],
    isException: true,
    acceptedRisks: ['Temporary lack of CSRF tokens in read-only reports endpoint'],
  };

  const validException = vault.recordReleaseSignOff(testProjectId, exceptionSig, {
    gateVerdict: 'NO_GO',
    criticalFindingsCount: 1,
    isStale: false,
    qaReviewed: true,
  });

  assert.equal(validException.success, true);
  assert.ok(validException.certificate);
  assert.equal(validException.certificate.status, 'EXCEPTION_APPROVED');
  assert.equal(validException.certificate.isException, true);
  assert.deepEqual(validException.certificate.acceptedRisks, [
    'Temporary lack of CSRF tokens in read-only reports endpoint',
  ]);
  assert.equal(validException.certificate.snapshotHash, 'a'.repeat(64));
});
