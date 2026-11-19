import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeUnifiedQualityMetrics,
  isNoiseUiControlOrInternalId,
  sanitizeStatementText,
  detectGlobalChromeLabels,
  type CompiledSdlcState,
} from '../services/sdlcCompiler';
import {
  determineControlKind,
  getSampleValueForControl,
  domainLogicBrainService,
} from '../services/domainLogicBrainService';
import type { FeatureModuleSurface } from '../types/sdlc';

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
