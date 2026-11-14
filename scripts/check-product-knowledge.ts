import assert from 'node:assert/strict';
import {
  buildBugAndIssueMonitoringBoard,
  buildManagementBriefingReport,
  buildProductKnowledgeBlueprint,
} from '../src/services/productKnowledgeAndMonitoringService';
import type { CompiledSdlcState } from '../src/services/sdlcCompiler';
import type { FeatureModuleSurface } from '../src/types/sdlc';
import type { RegressionDiffSummary } from '../src/services/workspaceVaultService';
import { unifiedReportGenerator } from '../src/services/unifiedReportGenerator';
import type { Iso26514ModuleManual } from '../src/services/iso26514UserManualService';

const loginModule = {
  moduleId: 'MOD-01',
  moduleName: 'Authentication & Login',
  routePath: '/login',
  fullUrl: 'https://example.invalid/login',
  pageHeading: 'Sign in',
  hasDataTable: false,
  tableColumns: [],
  sampleRowData: [],
  hasSearchOrFilter: true,
  searchFilterSelectors: ['select[name="role"]'],
  formsAndModals: [
    {
      formTitle: 'Authentication Login Form',
      submitButtonText: 'Masuk',
      inputs: [
        { name: 'username', id: 'username', type: 'text', placeholder: 'User ID', labelText: 'User ID / Username', required: true, selector: '#username', pagePath: '/login', moduleName: 'Authentication & Login' },
        { name: 'password', id: 'password', type: 'password', placeholder: '', labelText: 'Kata Sandi', required: true, selector: '#password', pagePath: '/login', moduleName: 'Authentication & Login' },
        { name: 'role', id: 'role', type: 'select', placeholder: 'Admin | Finance | Operator', labelText: 'Role', required: false, selector: 'select[name="role"]', pagePath: '/login', moduleName: 'Authentication & Login' },
      ],
    },
  ],
  triggeredApis: [{ method: 'POST', path: '/api/v1/auth/login', status: 200, latencyMs: 120 }],
  observedAnomalies: [],
} as unknown as FeatureModuleSurface;

const invoiceModule = {
  moduleId: 'MOD-02',
  moduleName: 'Invoices',
  routePath: '/invoices',
  fullUrl: 'https://example.invalid/invoices',
  pageHeading: 'Invoice Register',
  hasDataTable: true,
  tableColumns: ['Invoice Number', 'Amount'],
  sampleRowData: [],
  hasSearchOrFilter: true,
  searchFilterSelectors: ['input[name="invoiceNumber"]'],
  formsAndModals: [
    {
      formTitle: 'Create Invoice',
      submitButtonText: 'Save Invoice',
      inputs: [
        { name: 'invoice_number', id: 'invoice_number', type: 'text', placeholder: 'INV-001', labelText: 'Invoice Number', required: true, selector: '#invoice_number', pagePath: '/invoices', moduleName: 'Invoices' },
        { name: 'amount', id: 'amount', type: 'number', placeholder: '0.00', labelText: 'Amount', required: true, selector: '#amount', pagePath: '/invoices', moduleName: 'Invoices' },
      ],
    },
  ],
  screenControlsCatalog: [
    { controlName: 'Invoice Number', controlType: 'SEARCH_INPUT', screenLocation: 'Toolbar Pencarian Atas', availableOptionsOrSample: 'INV-001', calloutNumber: 1, xPercent: 20, yPercent: 18 },
  ],
  triggeredApis: [
    { method: 'GET', path: '/api/invoices', status: 200, latencyMs: 620 },
    { method: 'POST', path: '/api/invoices', status: 201, latencyMs: 310 },
    { method: 'PUT', path: '/api/invoices/:id', status: 200, latencyMs: 280 },
    { method: 'DELETE', path: '/api/invoices/:id', status: 204, latencyMs: 190 },
  ],
  observedAnomalies: [],
} as unknown as FeatureModuleSurface;

const state = {
  appName: 'Regression Fixture',
  targetUrl: 'https://example.invalid',
  discoveredFeatureModules: [loginModule, invoiceModule],
  discoveryResult: {
    mode: 'STAGING_URL',
    targetIdentifier: 'https://example.invalid',
    branchOrDatabase: 'main',
    discoveredAt: new Date().toISOString(),
    durationMs: 1,
    framework: 'Next.js',
    apiEndpoints: [
      { method: 'POST', path: '/api/v1/auth/login', status: 200, latencyMs: 120 },
      { method: 'GET', path: '/api/invoices', status: 200, latencyMs: 620 },
      { method: 'POST', path: '/api/invoices', status: 201, latencyMs: 310 },
      { method: 'PUT', path: '/api/invoices/:id', status: 200, latencyMs: 280 },
      { method: 'DELETE', path: '/api/invoices/:id', status: 204, latencyMs: 190 },
    ],
    openApiSpec: {},
    databaseTables: [
      {
        tableName: 'invoices',
        description: 'Invoice ledger',
        rowCountEstimate: 10,
        columns: [
          { name: 'invoice_number', dataType: 'varchar', isPrimaryKey: true, isForeignKey: false, nullable: false, businessMeaning: 'Invoice number', validationRef: 'VR-01' },
          { name: 'amount', dataType: 'decimal', isPrimaryKey: false, isForeignKey: false, nullable: false, businessMeaning: 'Invoice amount', validationRef: 'VR-02' },
        ],
      },
    ],
    domTraceability: [
      {
        bindingId: 'DOM-01',
        componentName: 'InvoiceForm',
        userStoryId: 'REQ-US-01',
        businessRuleId: 'BR-01',
        testCaseId: 'TC-001',
        domSelector: '#amount',
        ariaRole: 'spinbutton',
        targetElement: 'InvoiceForm amount input',
        apiEndpoint: 'POST /api/invoices',
        dbTarget: 'invoices.amount',
        parityStatus: 'BOUND_AND_VERIFIED',
      },
    ],
  },
  validationRules: [
    { ruleId: 'VR-01', userStoryId: 'REQ-US-01', fieldName: 'invoice_number', dataType: 'string', constraintExpression: 'required', errorCode: 'VAL-01', httpStatus: 400, exactUiErrorString: 'Invoice number is required', moduleName: 'Invoices', pagePath: '/invoices' },
    { ruleId: 'VR-02', userStoryId: 'REQ-US-01', fieldName: 'amount', dataType: 'decimal', constraintExpression: 'amount > 0', errorCode: 'VAL-02', httpStatus: 400, exactUiErrorString: 'Amount must be greater than zero', moduleName: 'Invoices', pagePath: '/invoices' },
  ],
  bugReports: [
    {
      bugId: 'BUG-001',
      moduleId: 'MOD-02',
      moduleName: 'Invoices',
      featureUrl: 'https://example.invalid/invoices',
      title: 'Slow invoice list response',
      severity: 'MINOR',
      priority: 'P3',
      status: 'OPEN',
      stepsToReproduce: ['Open /invoices', 'Apply a date filter', 'Observe the list loading time'],
      expectedResult: 'List renders within 500ms',
      actualResult: 'List takes 620ms',
      technicalEvidence: 'GET /api/invoices p95 = 620ms',
      recommendedFix: 'Add a composite index on invoices.created_at',
    },
  ],
  gapAuditItems: [],
} as unknown as CompiledSdlcState;

const diff = {
  comparedAgainstSnapshotId: 'snap-1',
  comparedAgainstLabel: 'v1.0.0',
  comparedAgainstTimestamp: new Date().toISOString(),
  previousVersion: 'v1.0.0',
  newVersion: 'v1.1.0',
  autoChangeRequestId: 'CR-AUTO-002',
  changeClassification: 'MINOR_ENHANCEMENT',
  newModulesAdded: [],
  removedModules: [],
  newApisAdded: ['GET /api/invoices/export'],
  removedApis: [],
  newBugsIntroduced: ['BUG-002: Export endpoint returns 500'],
  bugsResolved: ['BUG-000: Login spinner stuck'],
  passRateDelta: 4,
  addedButtonsAndActions: ['Export CSV'],
  removedButtonsAndActions: [],
  addedSubTabs: [],
  addedOrModifiedFiltersAndInputs: ['Export format'],
  modifiedApiContracts: [],
  modifiedValidationAndErrorRules: [],
  modifiedUserManualSops: [],
  administrativeAuditNarrativeId: '',
  administrativeAuditNarrativeEn: '',
  plainDiffSummary: '',
  plainDiffSummaryEn: '',
} as unknown as RegressionDiffSummary;

const blueprint = buildProductKnowledgeBlueprint(state);
assert.equal(blueprint.endToEndWorkflowChain.length, 2, 'workflow chain must cover both modules');
assert.match(blueprint.endToEndWorkflowChain[0].whatUserDoes, /selects Role/, 'login stage must describe role dropdown');
assert.ok(
  blueprint.crudMatrixRows.some((row) => row.moduleId === 'MOD-02' && row.entityPermissions.some((p) => p.tableName === 'invoices' && p.crudFlags === 'C, R, U, D')),
  'invoices CRUD matrix must expose C, R, U, D'
);
assert.ok(
  blueprint.fieldLineageMappings.some((m) => m.moduleId === 'MOD-02' && m.uiControl === 'Amount' && m.databaseColumn === 'invoices.amount' && m.validationRule === 'VR-02'),
  'Amount must map UI -> API -> invoices.amount with VR-02'
);

const board = buildBugAndIssueMonitoringBoard(state, diff);
assert.equal(board.overallOperationalStatus, 'PERLU PERHATIAN (MINOR ISSUES)', 'slow API and open bug must elevate status');
assert.equal(board.issueLifecycleTracker.persistingOpenIssues.length, 1);
assert.deepEqual(board.issueLifecycleTracker.resolvedIssuesSinceLastScan, ['BUG-000: Login spinner stuck']);
assert.ok(board.issueLifecycleTracker.newIssuesDetected.some((issue) => issue.includes('BUG-002')));
assert.ok(board.moduleHealthMonitor.some((m) => m.moduleId === 'MOD-02' && m.avgLatencyMs === 350));

const briefing = buildManagementBriefingReport(state, diff);
assert.equal(briefing.cards.length, 4, 'briefing must expose four management cards');
assert.match(briefing.managementBriefingId, /LAPORAN RINGKAS MANAJEMEN/);
assert.match(briefing.managementBriefingId, /BUG-001/);
assert.match(briefing.managementBriefingEn, /EXECUTIVE MANAGEMENT BRIEF/);
assert.match(briefing.managementBriefingEn, /BUG-001/);

const manual = {
  moduleId: 'MOD-02',
  moduleName: 'Invoices',
  routePath: '/invoices',
  section3_ButtonsAndIconsDictionary: { heading: 'Buttons', buttons: [] },
  section4_SearchAndFiltersDictionary: { heading: 'Filters', filters: [] },
  section7_BusinessLogicAndStateRules: {
    heading: 'Business rules',
    domainClassification: { domainLabel: 'Finance', summary: 'Invoice rules' },
    coreBusinessRules: [],
    stateTransitionLifecycle: [],
  },
  section8_UiToApiAndErrorRecoveryMatrix: { heading: 'API interactions', interactions: [] },
  section9_DomainGlossaryAndAcronyms: {
    heading: 'Glossary',
    terms: [
      {
        termOrAcronym: 'AR',
        category: 'Finance',
        plainDefinition: 'Accounts Receivable, the outstanding invoice balance owed by a customer.',
        whereUsedInModule: 'Invoices list and aging report.',
      },
    ],
  },
} as unknown as Iso26514ModuleManual;

const workbookHtml = unifiedReportGenerator.generateExcelQaWorkbookHtml({
  appName: 'Regression Fixture',
  targetUrl: 'https://example.invalid',
  testScenarios: [],
  rtmRows: [],
  bugReports: state.bugReports ?? [],
  uatFlows: [],
  userManuals: [manual],
  compiledState: state,
  regressionDiff: diff,
});
assert.match(workbookHtml, /Domain Glossary & Technical Acronyms|Glosarium Domain & Kamus Akronim Teknis/, 'workbook Table 9 glossary missing');
assert.match(workbookHtml, /Accounts Receivable/, 'workbook Table 9 must carry the term definition');
assert.match(workbookHtml, /10A\./, 'workbook Table 10A CRUD matrix missing');
assert.match(workbookHtml, /10B\./, 'workbook Table 10B 3-layer lineage missing');
assert.match(workbookHtml, /10C\./, 'workbook Table 10C workflow chain missing');
assert.match(workbookHtml, /invoices\.amount/, 'workbook lineage must keep DB column evidence');
assert.match(workbookHtml, /11\./, 'workbook Table 11 bug monitoring board missing');
assert.match(workbookHtml, /BUG-001/, 'workbook Table 11 must list the open defect');

console.log('Product knowledge blueprint, CRUD/lineage, bug monitor, management briefing, and Tables 9-11 verified');
