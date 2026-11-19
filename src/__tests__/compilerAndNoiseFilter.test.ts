import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeUnifiedQualityMetrics,
  isNoiseUiControlOrInternalId,
  sanitizeStatementText,
  detectGlobalChromeLabels,
  synthesizeFullSdlcFromCrawl,
  compileGreenfieldFromMoM,
  evaluateBrdExportGuard,
  type CompiledSdlcState,
} from '../services/sdlcCompiler';
import {
  determineControlKind,
  getSampleValueForControl,
  domainLogicBrainService,
} from '../services/domainLogicBrainService';
import { owaspDastService } from '../services/owaspDastService';
import type {
  FeatureModuleSurface,
  BlindCrawlResult,
  DiscoveredApiEndpoint,
  DatabaseErdTable,
  ValidationRuleContract,
} from '../types/sdlc';

test('Quality Metrics: calculates exact ISO 29119-3 release gate verdicts and pass rates', () => {
  // Scenario A: 100% Pass -> PRODUCTION_GO
  const passRows = Array.from({ length: 57 }, (_, i) => ({
    id: `tc-${i}`,
    executionVerdict: 'PASSED' as const,
  }));
  const passMetrics = computeUnifiedQualityMetrics({ rtmRows: passRows } as unknown as CompiledSdlcState);
  assert.equal(passMetrics.totalCases, 57);
  assert.equal(passMetrics.passedCases, 57);
  assert.equal(passMetrics.failedCases, 0);
  assert.equal(passMetrics.warningCases, 0);
  assert.equal(passMetrics.passRatePercent, 100);
  assert.equal(passMetrics.releaseGateStatus, 'PRODUCTION_GO');

  // Scenario B: 49 Passed + 8 Warnings -> CONDITIONAL_GO (86%)
  const conditionalRows = [
    ...Array.from({ length: 49 }, (_, i) => ({ id: `p-${i}`, executionVerdict: 'PASSED' as const })),
    ...Array.from({ length: 8 }, (_, i) => ({ id: `w-${i}`, executionVerdict: 'WARNING' as const })),
  ];
  const condMetrics = computeUnifiedQualityMetrics({ rtmRows: conditionalRows } as unknown as CompiledSdlcState);
  assert.equal(condMetrics.totalCases, 57);
  assert.equal(condMetrics.passedCases, 49);
  assert.equal(condMetrics.warningCases, 8);
  assert.equal(condMetrics.failedCases, 0);
  assert.equal(condMetrics.passRatePercent, 86);
  assert.equal(condMetrics.releaseGateStatus, 'CONDITIONAL_GO');

  // Scenario C: Any Hard Failure -> NO_GO
  const failRows = [
    { id: '1', executionVerdict: 'PASSED' as const },
    { id: '2', executionVerdict: 'FAILED' as const },
  ];
  const failMetrics = computeUnifiedQualityMetrics({ rtmRows: failRows } as unknown as CompiledSdlcState);
  assert.equal(failMetrics.releaseGateStatus, 'NO_GO');
  assert.equal(failMetrics.failedCases, 1);
  assert.equal(failMetrics.passRatePercent, 50);

  // Scenario D: Zero Cases -> NOT_EXECUTED
  const zeroMetrics = computeUnifiedQualityMetrics({ rtmRows: [] } as unknown as CompiledSdlcState);
  assert.equal(zeroMetrics.totalCases, 0);
  assert.equal(zeroMetrics.passRatePercent, 0);
  assert.equal(zeroMetrics.releaseGateStatus, 'NOT_EXECUTED');
});

test('Noise Filter: comprehensively purges framework IDs, chrome controls, and pagination artifacts', () => {
  // 1. Framework auto-generated IDs
  const frameworkArtifacts = [
    '_r_d_',
    '_r_14_',
    'field-_r_d_',
    'Field- R D',
    'radix-:r1:',
    'radix-:r2a:',
    'headlessui-listbox-button-1',
    'el-id-812',
    'v-input-29',
    'mui-component-select',
    'select_0',
    'select_1',
    'input_2',
    'field_99',
    'nav-button-pricing',
  ];

  for (const artifact of frameworkArtifacts) {
    assert.equal(
      isNoiseUiControlOrInternalId(artifact),
      true,
      `Expected "${artifact}" to be recognized as noise`
    );
  }

  // 2. Global application chrome, keyboard shortcuts, and table pagination
  const chromeNoise = [
    '⌘k',
    '⌘K',
    'ctrl+k',
    'id',
    'en',
    'Baris per halaman:',
    'baris per halaman',
    'Rows per page:',
    'rows per page',
    'toggle sidebar',
    'keluar',
    'logout',
  ];

  for (const noise of chromeNoise) {
    assert.equal(
      isNoiseUiControlOrInternalId(noise),
      true,
      `Expected chrome string "${noise}" to be recognized as noise`
    );
  }

  // 3. Genuine business domain entities MUST be preserved (never filtered)
  const genuineEntities = [
    'Sales Quotation ID',
    'Nomor Penawaran',
    'Customer & PIC Name',
    'Origin Port',
    'Destination Terminal',
    'Unit Trucking',
    'Tarif Dasar Freight',
    'PPN / Pajak (11%)',
    'Total Estimasi Biaya',
    'Tanggal Pengiriman',
    'Status Persetujuan',
  ];

  for (const entity of genuineEntities) {
    assert.equal(
      isNoiseUiControlOrInternalId(entity),
      false,
      `Expected genuine business entity "${entity}" NOT to be filtered as noise`
    );
  }
});

test('T-16: Strict Noise Sanitizer & Generalization Test Suite (F-23, F-24, F-28, F-30)', () => {
  // 1. Mandatory Test Table Row 1: Word boundaries preserve words containing 'id', 'en', 'mu'
  const input1 = 'identity endpoint(s) Menu';
  const out1 = sanitizeStatementText(input1);
  assert.equal(out1, 'identity endpoint(s) Menu', 'Words containing "id", "en", "mu" must NOT be corrupted');

  // 2. Mandatory Test Table Row 2: "Cari ⌘K ID" with "ID" detected as global chrome -> "Cari"
  const input2 = 'Cari ⌘K ID';
  const out2 = sanitizeStatementText(input2, { detectedGlobalChromeLabels: ['ID'] });
  assert.equal(out2, 'Cari', 'Shortcut ⌘K and detected chrome ID must be stripped cleanly');

  // 3. Mandatory Test Table Row 3: "Halo budi.santoso" with currentUsername='budi.santoso' -> "Halo"
  const input3 = 'Halo budi.santoso';
  const out3 = sanitizeStatementText(input3, { currentUsername: 'budi.santoso' });
  assert.equal(out3, 'Halo', 'Dynamic username must be stripped with word boundaries');

  // 4. Mandatory Test Table Row 4: "field-_r_d_" as field name is filtered out
  assert.equal(isNoiseUiControlOrInternalId('field-_r_d_'), true, 'field-_r_d_ must be recognized as noise');

  // 5. Mandatory Test Table Row 5: Domain features like "Katalog" or "Sales Quotation" are NOT filtered out
  assert.equal(isNoiseUiControlOrInternalId('Katalog'), false, 'Domain entity "Katalog" must NOT be filtered out');
  assert.equal(isNoiseUiControlOrInternalId('Sales Quotation'), false, 'Domain entity "Sales Quotation" must NOT be filtered out');

  // 6. Data-driven chrome detector: Elements appearing on >= 80% pages are detected
  const crawledPages = [
    { pagePath: '/dashboard', buttons: [{ name: 'ID' }, { name: 'Simpan Data' }] },
    { pagePath: '/users', buttons: [{ name: 'ID' }, { name: 'Tambah Pengguna' }] },
    { pagePath: '/settings', buttons: [{ name: 'ID' }, { name: 'Update Profil' }] },
  ];
  const detected = detectGlobalChromeLabels(crawledPages, 0.8);
  assert.deepEqual(detected, ['ID'], 'Button "ID" on 100% of pages must be detected as global chrome');
});

test('T-17: DOM Control Classification & Login Scenario Isolation (F-25, F-26)', () => {
  // 1. Acceptance Criterion 1 (F-26): Control 'table-pagination-rows-per-page' produces numeric sample value (e.g. 25, not 'JKT-SUB-001')
  const paginationSample = getSampleValueForControl({ name: 'table-pagination-rows-per-page' });
  assert.equal(typeof paginationSample.valid, 'number', 'Pagination limit valid value must be of type number');
  assert.equal(paginationSample.valid, 25, 'Pagination limit valid value must be numeric 25');
  assert.notEqual(paginationSample.valid, 'JKT-SUB-001', 'Pagination limit must NEVER be string code JKT-SUB-001');
  assert.equal(paginationSample.invalid, -1, 'Pagination limit invalid sample must be negative integer');
  assert.ok(paginationSample.boundary, 'Pagination limit must include boundary metrics');
  assert.equal(paginationSample.boundary.belowMin, 0);
  assert.equal(paginationSample.boundary.exactN, 100);
  assert.equal(paginationSample.boundary.overLimit, 101);

  // 2. Control classifier correctly maps varied DOM attributes to ControlKind
  assert.equal(
    determineControlKind({ name: 'table-pagination-rows-per-page' }),
    'PAGINATION_LIMIT'
  );
  assert.equal(
    determineControlKind({ name: 'pageSize', role: 'combobox' }),
    'PAGINATION_LIMIT'
  );
  assert.equal(
    determineControlKind({ role: 'searchbox' }),
    'SEARCHBOX'
  );
  assert.equal(
    determineControlKind({ type: 'search', name: 'q' }),
    'SEARCHBOX'
  );
  assert.equal(
    determineControlKind({ placeholder: 'DD/MM/YYYY' }),
    'DATE_PICKER'
  );
  assert.equal(
    determineControlKind({ type: 'date', name: 'delivery_date' }),
    'DATE_PICKER'
  );
  assert.equal(
    determineControlKind({ type: 'number', min: 1, max: 100 }),
    'NUMBER_SPINBUTTON'
  );
  assert.equal(
    determineControlKind({ type: 'password', name: 'user_password' }),
    'PASSWORD_INPUT'
  );
  assert.equal(
    determineControlKind({ type: 'email', name: 'work_email' }),
    'EMAIL_INPUT'
  );

  // Date picker sample values verification
  const dateSample = getSampleValueForControl({ placeholder: 'DD/MM/YYYY' });
  assert.equal(dateSample.valid, '20/11/2026', 'Date picker valid format must match DD/MM/YYYY');
  assert.equal(dateSample.invalid, '31/02/2026', 'Date picker invalid format must test impossible date');

  // 3. Acceptance Criterion 2 (F-25): Page /login without searchbox produces 0 search scenarios
  const loginModule: FeatureModuleSurface = {
    moduleId: 'mod-login-auth',
    moduleName: 'User Authentication / Login Gate',
    routePath: '/login',
    fullUrl: 'https://app.example.com/login',
    pageHeading: 'Sign In to Enterprise Portal',
    hasDataTable: false,
    tableColumns: [],
    sampleRowData: [],
    searchFilterSelectors: [],
    hasSearchOrFilter: false,
    formsAndModals: [
      {
        formTitle: 'Login Surface',
        submitButtonText: 'Masuk ke Portal',
        inputs: [
          { name: 'username', type: 'text', placeholder: 'Username / Email', required: true, selector: 'input[name="username"]' },
          { name: 'password', type: 'password', placeholder: 'Password', required: true, selector: 'input[name="password"]' },
          { name: 'auth_type', type: 'select', role: 'combobox', placeholder: 'Pilih Otorisasi', options: ['Pancaran', 'Eksternal'], required: true, selector: 'select[name="auth_type"]' },
          { name: 'table-pagination-rows-per-page', type: 'select', role: 'combobox', placeholder: '25', required: false, selector: 'select[name="table-pagination-rows-per-page"]' },
        ],
      },
    ],
    triggeredApis: [
      { method: 'POST', path: '/api/v1/auth/login', status: 200, latencyMs: 140 },
    ],
    observedAnomalies: [],
  };

  const loginIntel = domainLogicBrainService.inferDomainIntelligence(loginModule);

  // Assert login pattern classification
  assert.equal(loginIntel.domainPattern, 'AUTHENTICATION_RBAC_GATE');

  // Assert 0 search scenarios leak to login page
  const searchScenarios = loginIntel.deepTestScenarios.filter(
    (s) =>
      s.scenarioTitle.toLowerCase().includes('search') ||
      s.category.includes('SEARCH')
  );
  assert.equal(
    searchScenarios.length,
    0,
    `Login page without searchbox must produce 0 search scenarios, found: ${searchScenarios.map((s) => s.scenarioTitle).join(', ')}`
  );

  // Assert dedicated authentication scenarios are generated
  const authScenarios = loginIntel.deepTestScenarios.filter((s) =>
    s.scenarioTitle.includes('[AUTH')
  );
  assert.ok(
    authScenarios.length >= 4,
    `Login page must have at least 4 dedicated authentication scenarios (Render, Positive, Negative, Validation), found ${authScenarios.length}`
  );

  // Assert Synthetic Data Factory for login uses numeric pagination and not string code
  const factory = loginIntel.syntheticTestDataFactory;
  assert.ok(factory, 'Synthetic data factory must be present');
  assert.equal(
    typeof factory.validProductionDataset['table-pagination-rows-per-page'],
    'number',
    'Synthetic data factory must assign numeric value to pagination limits'
  );
  assert.equal(
    factory.validProductionDataset['table-pagination-rows-per-page'],
    25
  );

  // 4. Positive verification: Genuine searchbox modules DO generate search scenarios
  const searchModule: FeatureModuleSurface = {
    moduleId: 'mod-catalog',
    moduleName: 'Product Catalog & Pricing',
    routePath: '/catalog',
    fullUrl: 'https://app.example.com/catalog',
    pageHeading: 'Daftar Katalog Produk',
    hasDataTable: true,
    tableColumns: ['SKU', 'Nama Produk', 'Harga'],
    sampleRowData: ['PRD-01', 'Container 20ft', 'Rp 15.000.000'],
    hasSearchOrFilter: true,
    searchFilterSelectors: ['input[role="searchbox"]'],
    formsAndModals: [
      {
        formTitle: 'Filter Catalog',
        submitButtonText: 'Cari',
        inputs: [
          { name: 'query', type: 'text', role: 'searchbox', placeholder: 'Cari produk...', required: false, selector: 'input[role="searchbox"]' },
        ],
      },
    ],
    triggeredApis: [],
    observedAnomalies: [],
  };

  const catalogIntel = domainLogicBrainService.inferDomainIntelligence(searchModule);
  const catalogSearchScenarios = catalogIntel.deepTestScenarios.filter((s) =>
    s.scenarioTitle.includes('[DATA-DRIVEN SEARCH]')
  );
  assert.ok(
    catalogSearchScenarios.length >= 1,
    'Module with genuine searchbox must generate [DATA-DRIVEN SEARCH] scenario'
  );
});

test('T-18: Genuine BRD Separation from As-Built Discovery (F-27)', () => {
  const mockCrawlResult: BlindCrawlResult = {
    targetUrl: 'https://app.logistics.co.id/portal',
    appName: 'Logistics Enterprise Portal',
    crawledAt: new Date().toISOString(),
    durationMs: 450,
    discoveredPages: ['/login', '/dashboard', '/rates'],
    discoveredForms: [
      {
        formId: 'form-tariff',
        action: '/api/v1/rates',
        method: 'POST',
        submitSelector: 'button[type="submit"]',
        inputs: [
          { name: 'origin', type: 'text', required: true, selector: 'input[name="origin"]' },
          { name: 'destination', type: 'text', required: true, selector: 'input[name="destination"]' },
        ],
      },
    ],
    extractedApis: [
      {
        id: 'api-rates',
        method: 'GET',
        path: '/api/v1/rates',
        controllerPath: 'rates.controller.ts',
        lineNumber: 12,
        summary: 'Fetch rate cards',
        linkedTestCaseIds: [],
        linkedRequirementId: 'REQ-01',
      },
    ],
    inferredBusinessRules: [
      {
        ruleId: 'BR-01',
        category: 'BUSINESS_LOGIC',
        statement: 'The "Rates" module (/rates) SHALL govern "Commercial Pricing" workflows.',
        targetKpi: '—',
        sourceMoMLine: 'Feature "Rates" at /rates',
        priority: 'HIGH',
        origin: 'AS_BUILT_DISCOVERED',
      },
    ],
    inferredValidationContracts: [],
    baselineSummary: '# [AUTONOMOUS ZERO-DOC DISCOVERY SUMMARY]\nDiscovered from autonomous crawler on https://app.logistics.co.id/portal',
    bpmnXml: '',
    databaseTables: [],
    domBindings: [],
  };

  // 1. Acceptance Criterion 1 (Tanpa Notulen):
  // Without stakeholder notes, all rules MUST have origin === 'AS_BUILT_DISCOVERED' and BRD export is blocked
  const zeroDocCompiled = synthesizeFullSdlcFromCrawl(mockCrawlResult, '');
  assert.equal(zeroDocCompiled.hasSourceRequirements, false, 'Without MoM, hasSourceRequirements must be false');

  // Verify all rules have origin 'AS_BUILT_DISCOVERED'
  for (const rule of zeroDocCompiled.brdMatrixRows) {
    assert.equal(
      rule.origin,
      'AS_BUILT_DISCOVERED',
      `Rule ${rule.ruleId} must have origin AS_BUILT_DISCOVERED, got ${rule.origin}`
    );
    assert.notEqual(
      rule.targetKpi,
      '100.00% Functional Conformance',
      `Rule ${rule.ruleId} must not contain generic KPI "100.00% Functional Conformance"`
    );
  }

  // Verify evaluateBrdExportGuard blocks BRD export and specifies the exact reason
  const zeroDocGuard = evaluateBrdExportGuard(zeroDocCompiled);
  assert.equal(zeroDocGuard.canExport, false, 'BRD export must be blocked when no stakeholder MoM/PRD exists');
  assert.equal(
    zeroDocGuard.reason,
    'Tambahkan notulen/PRD di Step 01',
    'Guard must return exact required prompt: "Tambahkan notulen/PRD di Step 01"'
  );
  assert.equal(
    zeroDocGuard.tabTitleId,
    '1. Aturan As-Built (hasil discovery)',
    'Step 03 tab title in Indonesian must be "1. Aturan As-Built (hasil discovery)"'
  );
  assert.equal(
    zeroDocGuard.tabTitleEn,
    '1. As-Built Rules (Discovery Results)',
    'Step 03 tab title in English must be "1. As-Built Rules (Discovery Results)"'
  );
  assert.equal(zeroDocGuard.asBuiltOnly, true);

  // 2. Acceptance Criterion 2 (Dengan Notulen):
  // With stakeholder notes, rules parsed from notes MUST have origin === 'STAKEHOLDER_SOURCE' and include sourceQuote
  const stakeholderMoM = `[MoM - 2026-11-19] Commercial Logistics Requirements Workshop
Attendees: Head of Commercial, QA Lead, Logistics Business Analyst

1. Core Business Rules:
- [REQ-01] System SHALL validate origin port and destination terminal with strict non-empty checks. Target KPI: 0% Orphan Dispatches
- [REQ-02] System SHALL reject duplicate rate cards for identical transport routes with HTTP 409 Conflict. Target KPI: Zero duplicate rates
- [REQ-03] System SHALL enforce approval workflow before published tariffs can be utilized by sales teams.`;

  const momCompiled = synthesizeFullSdlcFromCrawl(mockCrawlResult, stakeholderMoM);
  assert.equal(momCompiled.hasSourceRequirements, true, 'With MoM, hasSourceRequirements must be true');

  const stakeholderRules = momCompiled.brdMatrixRows.filter(
    (r) => r.origin === 'STAKEHOLDER_SOURCE'
  );
  assert.ok(
    stakeholderRules.length >= 3,
    `Expected at least 3 stakeholder rules parsed from MoM, got ${stakeholderRules.length}`
  );

  for (const rule of stakeholderRules) {
    assert.equal(rule.origin, 'STAKEHOLDER_SOURCE');
    assert.ok(
      rule.sourceQuote && rule.sourceQuote.length > 5,
      `Stakeholder rule ${rule.ruleId} must contain source quote citation`
    );
    assert.ok(
      rule.sourceMoMLine && rule.sourceMoMLine.length > 5,
      `Stakeholder rule ${rule.ruleId} must contain source MoM line`
    );
  }

  // Verify extracted KPI
  const req01 = stakeholderRules.find((r) => r.ruleId === 'REQ-SRC-01');
  assert.ok(req01, 'REQ-SRC-01 must be present');
  assert.equal(req01?.targetKpi, '0% Orphan Dispatches', 'Target KPI must be extracted from source text');

  // Verify evaluateBrdExportGuard permits BRD export with genuine MoM
  const momGuard = evaluateBrdExportGuard(momCompiled);
  assert.equal(momGuard.canExport, true, 'BRD export must be allowed when stakeholder MoM is provided');
  assert.equal(momGuard.tabTitleId, '1. Aturan Bisnis (BRD)');
  assert.equal(momGuard.tabTitleEn, '1. Business Rules (BRD)');
  assert.equal(momGuard.asBuiltOnly, false);

  // 3. Greenfield Project Compilation from MoM
  const greenfieldCompiled = compileGreenfieldFromMoM('Commercial Route Manager', stakeholderMoM);
  assert.equal(greenfieldCompiled.hasSourceRequirements, true);
  const greenfieldStakeholderRules = greenfieldCompiled.brdMatrixRows.filter(
    (r) => r.origin === 'STAKEHOLDER_SOURCE'
  );
  assert.ok(
    greenfieldStakeholderRules.length >= 1,
    'Greenfield compilation must produce stakeholder rules from MoM'
  );
  for (const rule of greenfieldStakeholderRules) {
    assert.equal(rule.origin, 'STAKEHOLDER_SOURCE');
    assert.ok(rule.sourceQuote, 'Greenfield rule must include source quote');
  }
  const greenfieldGuard = evaluateBrdExportGuard(greenfieldCompiled);
  assert.equal(greenfieldGuard.canExport, true);
});

test('T-19: Empirical Evidence for Security Verdicts and Honest DAST Grading (F-19)', async () => {
  const dummyEndpoints: DiscoveredApiEndpoint[] = [
    {
      id: 'ep-login',
      method: 'POST',
      path: '/api/v1/auth/login',
      controllerPath: 'auth.controller.ts',
      lineNumber: 10,
      summary: 'User Login Endpoint',
      authRequired: true,
      linkedTestCaseIds: [],
      linkedRequirementId: 'REQ-01',
    },
    {
      id: 'ep-orders',
      method: 'GET',
      path: '/api/v1/orders/:id',
      controllerPath: 'orders.controller.ts',
      lineNumber: 45,
      summary: 'Order details endpoint',
      authRequired: true,
      linkedTestCaseIds: [],
      linkedRequirementId: 'REQ-02',
    },
  ];

  const dummyTables: DatabaseErdTable[] = [
    {
      id: 'tbl-users',
      tableName: 'Users',
      primaryKeys: ['id'],
      columns: [
        { name: 'id', type: 'UUID', isPrimaryKey: true, isForeignKey: false, isNullable: false },
        { name: 'tenant_id', type: 'UUID', isPrimaryKey: false, isForeignKey: false, isNullable: false },
      ],
    },
  ];

  const dummyValidation: ValidationRuleContract[] = [
    {
      ruleId: 'VR-01',
      fieldName: 'username',
      moduleName: 'Auth',
      dataType: 'string',
      constraintExpression: 'length >= 3',
      httpStatus: 422,
      exactUiErrorString: 'Username must be at least 3 characters',
      userStoryId: 'US-01',
      errorCode: 'ERR_AUTH_01',
    },
  ];

  // 1. Acceptance Criterion 1: Tanpa probe nyata -> semua NOT_TESTED, provenance NOT_RUN, grade N/A
  const unprobedBaseline = owaspDastService.generateDastAudit({
    targetUrl: 'https://api.enterprise-logistics.test',
    appName: 'Logistics Core API',
    apiEndpoints: dummyEndpoints,
    databaseTables: dummyTables,
    validationRules: dummyValidation,
  });

  assert.equal(
    unprobedBaseline.securityPostureGrade,
    'N/A',
    'Unprobed baseline must have securityPostureGrade N/A'
  );
  assert.equal(
    unprobedBaseline.testedVectorsCount,
    0,
    'Unprobed baseline must have testedVectorsCount === 0'
  );
  assert.equal(
    unprobedBaseline.coverageTestedText,
    'Cakupan diuji: 0 dari 10',
    'Coverage text must accurately display "Cakupan diuji: 0 dari 10"'
  );
  assert.equal(
    unprobedBaseline.corsAudit.status,
    'NOT_TESTED',
    'CORS audit without live probe must be NOT_TESTED'
  );

  // Verify all findings are NOT_TESTED, have provenance NOT_RUN, and have no evidence
  assert.equal(unprobedBaseline.findings.length, 10, 'Must cover all 10 OWASP API categories');
  for (const finding of unprobedBaseline.findings) {
    assert.equal(
      finding.status,
      'NOT_TESTED',
      `Finding ${finding.id} (${finding.owaspCategory}) must be NOT_TESTED without empirical probe`
    );
    assert.equal(
      finding.provenance,
      'NOT_RUN',
      `Finding ${finding.id} must have provenance NOT_RUN`
    );
    assert.equal(
      finding.evidence,
      undefined,
      `Finding ${finding.id} must not have evidence attached when unprobed`
    );
    assert.equal(
      finding.observedResponse.includes('HTTP 429 observed after threshold breach'),
      false,
      `Finding ${finding.id} must not claim HTTP 429 was observed without evidence`
    );
  }

  // 2. Acceptance Criterion 2: Dengan respons mock 403 -> VERIFIED_SECURE memuat status 403 di evidence
  const probedWith403 = await owaspDastService.executeLiveActiveDastAudit({
    targetUrl: 'https://api.enterprise-logistics.test',
    appName: 'Logistics Core API',
    apiEndpoints: dummyEndpoints,
    databaseTables: dummyTables,
    validationRules: dummyValidation,
    mockProbeResponses: {
      authProbeStatus: 403,
      authProbeHeaders: { 'content-type': 'application/json', 'server': 'envoy' },
      authProbeBody: '{"error":"Forbidden"}',
    },
  });

  const api2 = probedWith403.findings.find((f) => f.owaspCategory === 'API2:2023');
  assert.ok(api2, 'API2:2023 finding must exist');
  assert.equal(api2.status, 'VERIFIED_SECURE', 'API2 with 403 response must be VERIFIED_SECURE');
  assert.equal(api2.provenance, 'OBSERVED_PROBE', 'API2 must have provenance OBSERVED_PROBE');
  assert.ok(api2.evidence, 'API2 must have evidence attached');
  assert.equal(
    api2.evidence?.response.status,
    403,
    'API2 evidence must record response status 403'
  );
  assert.equal(api2.evidence?.request.method, 'POST');
  assert.ok(api2.evidence?.request.url.includes('/api/v1/auth/login'));
  assert.ok(api2.evidence?.probedAt, 'Evidence must record probedAt timestamp');
  assert.ok(api2.evidence?.response.bodyHash, 'Evidence must record response body hash');

  assert.equal(probedWith403.testedVectorsCount, 1, 'Tested vectors count must be 1');
  assert.equal(probedWith403.coverageTestedText, 'Cakupan diuji: 1 dari 10');
  assert.equal(probedWith403.securityPostureGrade, 'A', 'Tested vector secure -> Grade A');

  // Verify API4 (Rate Limiting) in probedWith403 without 429:
  const api4Untested = probedWith403.findings.find((f) => f.owaspCategory === 'API4:2023');
  assert.ok(api4Untested);
  assert.equal(api4Untested.status, 'NOT_TESTED');
  assert.equal(
    api4Untested.observedResponse.includes('HTTP 429 observed after threshold breach'),
    false,
    'API4 must not contain fake HTTP 429 narrative'
  );

  // 3. Rate Limit Probe: Narasi "HTTP 429 observed after threshold breach" hanya boleh muncul bila status === 429 di evidence
  const probedWith429 = await owaspDastService.executeLiveActiveDastAudit({
    targetUrl: 'https://api.enterprise-logistics.test',
    appName: 'Logistics Core API',
    apiEndpoints: dummyEndpoints,
    databaseTables: dummyTables,
    validationRules: dummyValidation,
    mockProbeResponses: {
      authProbeStatus: 403,
      rateLimitStatus: 429,
      rateLimitHeaders: { 'retry-after': '60' },
      rateLimitBody: 'Too Many Requests',
    },
  });

  const api4Probed = probedWith429.findings.find((f) => f.owaspCategory === 'API4:2023');
  assert.ok(api4Probed);
  assert.equal(api4Probed.status, 'VERIFIED_SECURE');
  assert.equal(api4Probed.provenance, 'OBSERVED_PROBE');
  assert.ok(api4Probed.evidence);
  assert.equal(api4Probed.evidence?.response.status, 429);
  assert.equal(
    api4Probed.observedResponse,
    'HTTP 429 Too Many Requests observed after threshold breach.',
    'HTTP 429 observed narrative is only present when status 429 is in evidence'
  );
  assert.equal(probedWith429.testedVectorsCount, 2);
  assert.equal(probedWith429.coverageTestedText, 'Cakupan diuji: 2 dari 10');

  // 4. Vulnerable unauthenticated endpoint (status 200 observed on protected route)
  const probedLeaked = await owaspDastService.executeLiveActiveDastAudit({
    targetUrl: 'https://api.enterprise-logistics.test',
    appName: 'Logistics Core API',
    apiEndpoints: dummyEndpoints,
    databaseTables: dummyTables,
    validationRules: dummyValidation,
    mockProbeResponses: {
      authProbeStatus: 200,
      authProbeBody: '{"secret":"unauthorized_data"}',
    },
  });

  const api2Leaked = probedLeaked.findings.find((f) => f.owaspCategory === 'API2:2023');
  assert.ok(api2Leaked);
  assert.equal(api2Leaked.status, 'VULNERABLE');
  assert.equal(api2Leaked.severity, 'CRITICAL');
  assert.equal(api2Leaked.provenance, 'OBSERVED_PROBE');
  assert.equal(api2Leaked.evidence?.response.status, 200);
  assert.equal(probedLeaked.securityPostureGrade, 'F', 'Critical vulnerability must yield Grade F');
});
