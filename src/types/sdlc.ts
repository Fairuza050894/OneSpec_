/**
 * OneSpec SDLC Workbench - Core Domain Types
 * Standards Compliance:
 * - ISO/IEC/IEEE 29148:2018 (Systems and software engineering — Life cycle processes — Requirements engineering)
 * - ISO/IEC 19510:2013 / BPMN 2.0 (Information technology — Object Management Group Business Process Model and Notation)
 * - ISO/IEC/IEEE 29119-3:2022 (Software and systems engineering — Software testing — Part 3: Test documentation)
 */

export type ProjectMode = 'GREENFIELD' | 'BROWNFIELD' | 'BLIND_URL' | 'LIVE_URL' | 'GIT_REPO' | 'LOCAL_ZIP' | 'GREENFIELD_MOM';

export interface ProjectWorkspace {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  projectMode: ProjectMode;
  existingDomain?: string | null;
  repositoryUrl?: string | null;
  repositoryBranch?: string | null;
  localPath?: string | null;
  databaseUrl?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;

  // Bi-directional relationships
  brdArtifacts?: BrdArtifact[];
  prdArtifacts?: PrdArtifact[];
  bpmnProcessModels?: BpmnProcessModel[];
  rtmTestCases?: RtmTestCase[];
}

/* =========================================================================
 * ISO/IEC/IEEE 29148:2018 Stakeholder Requirements Specification (StRS / BRD)
 * ========================================================================= */

export type BrdStatus = 'DRAFT' | 'REVIEW' | 'APPROVED' | 'SUPERSEDED';
export type BusinessRulePriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface KpiDefinition {
  id: string;
  metric: string;
  target: string;
  baseline?: string;
  unit?: string;
}

export interface BusinessRule {
  id: string;
  brdArtifactId: string;
  ruleId: string; // Format: "BR-01", "BR-02"
  title: string;
  statement: string; // Normative requirement statement: "The system SHALL..."
  rationale?: string | null;
  priority: BusinessRulePriority;
  complianceReference?: string | null; // e.g. "ISO 29148 Section 5.2.4"
  createdAt: string | Date;
  updatedAt: string | Date;

  // Bi-directional links
  userStories?: UserStory[];
  rtmTestCases?: RtmTestCase[];
}

export interface BrdArtifact {
  id: string;
  projectId: string;
  title: string;
  version: string;
  status: BrdStatus;
  executiveSummary?: string | null;
  rawMeetingNotes?: string | null;
  kpis: KpiDefinition[];
  scopeIn: string[];
  scopeOut: string[];
  createdAt: string | Date;
  updatedAt: string | Date;

  // Bi-directional relations
  project?: ProjectWorkspace;
  businessRules: BusinessRule[];
  prdArtifacts?: PrdArtifact[];
}

/* =========================================================================
 * ISO/IEC/IEEE 29148:2018 System Requirements Specification (SyRS / PRD)
 * ========================================================================= */

export type PrdStatus = 'DRAFT' | 'IN_DEVELOPMENT' | 'VERIFIED';
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface FieldValidationSpec {
  ruleId?: string; // Format: "VR-01", "VR-02"
  fieldName: string;
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array';
  required: boolean;
  constraints?: {
    min?: number;
    max?: number;
    pattern?: string;
    description?: string;
  };
  constraintExpression?: string; // e.g. "amount > 0"
  errorCode: string;
  errorHttpStatus: number; // e.g. 400, 422
  exactUiErrorString?: string; // e.g. "Amount must be a positive non-zero value"
}

export type RequirementProvenance = 'SOURCE_REQUIREMENT' | 'AS_BUILT_DISCOVERED';

export interface ValidationRuleContract {
  ruleId: string; // "VR-01"
  userStoryId: string; // "REQ-US-01"
  fieldName: string;
  dataType: string;
  constraintExpression: string;
  errorCode: string;
  httpStatus: number;
  exactUiErrorString: string;
  moduleName?: string;
  pagePath?: string;
  provenance?: RequirementProvenance;
}

export interface BrdMatrixRow {
  ruleId: string; // "BR-01"
  category: string;
  statement: string; // RFC 2119: SHALL, SHALL NOT, SHOULD
  targetKpi: string;
  sourceMoMLine: string;
  priority: BusinessRulePriority;
  complianceReference?: string;
  moduleName?: string;
  provenance?: RequirementProvenance;
}

export interface HttpContractSpec {
  method: HttpMethod;
  path: string;
  requestSchema?: Record<string, unknown>;
  response2xx: {
    status: number;
    schema: Record<string, unknown>;
    example?: Record<string, unknown>;
  };
  response4xx?: Array<{
    status: number;
    errorCode: string;
    description: string;
  }>;
  response5xx?: {
    status: number;
    description: string;
  };
  slaThresholdMs?: number; // Configured SLA in milliseconds
}

export interface UserStory {
  id: string;
  prdArtifactId: string;
  businessRuleId?: string | null;
  storyId: string; // Format: "REQ-US-01"
  title: string;
  role: string; // "As a [Actor]"
  capability: string; // "I want [Action]"
  benefit: string; // "So that [Outcome]"
  acceptanceCriteriaGherkin: string; // Formal Given-When-Then BDD scenario
  fieldValidations: FieldValidationSpec[];
  httpContracts: HttpContractSpec[];
  createdAt: string | Date;
  updatedAt: string | Date;
  provenance?: RequirementProvenance;

  // Traceability links
  businessRule?: BusinessRule | null;
  rtmTestCases?: RtmTestCase[];
}

export interface PrdArtifact {
  id: string;
  projectId: string;
  brdArtifactId?: string | null;
  title: string;
  version: string;
  status: PrdStatus;
  overview?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;

  // Bi-directional relations
  project?: ProjectWorkspace;
  brdArtifact?: BrdArtifact | null;
  userStories: UserStory[];
  bpmnProcessModels?: BpmnProcessModel[];
  rtmTestCases?: RtmTestCase[];
}

/* =========================================================================
 * ISO/IEC 19510:2013 (BPMN 2.0) Process Model
 * ========================================================================= */

export type BpmnNodeType =
  | 'START_EVENT'
  | 'END_EVENT'
  | 'USER_TASK'
  | 'SERVICE_TASK'
  | 'EXCLUSIVE_GATEWAY_XOR'
  | 'INTERMEDIATE_EVENT';

export type BpmnActorType =
  | 'CLIENT_UI'
  | 'BACKEND_API'
  | 'DATABASE'
  | 'EXTERNAL_SERVICE';

export interface BpmnSwimlane {
  id: string;
  name: string; // e.g. "Lane 1: Client UI / Actor" or "Lane 2: Backend API & Database"
  actorType: BpmnActorType;
  orderIndex: number;
  height?: number;
}

export interface BpmnNodeProperties {
  apiRoute?: string;
  domSelector?: string;
  slaThresholdMs?: number;
  guardCondition?: string;
}

export interface BpmnNode {
  id: string;
  laneId: string;
  type: BpmnNodeType;
  name: string;
  linkedRequirementId?: string | null; // e.g. "REQ-US-01"
  x: number;
  y: number;
  width: number;
  height: number;
  properties?: BpmnNodeProperties;
}

export interface BpmnWaypoint {
  x: number;
  y: number;
}

export interface BpmnEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  conditionExpression?: string; // e.g. "[YES: HTTP 200]" or "[NO: HTTP 409 / 422]"
  waypoints: BpmnWaypoint[]; // Orthogonal Manhattan routing only
}

export interface BpmnProcessModel {
  id: string;
  projectId: string;
  prdArtifactId?: string | null;
  name: string;
  version: string;
  poolName: string;
  swimlanes: BpmnSwimlane[];
  nodes: BpmnNode[];
  edges: BpmnEdge[];
  xmlPayload?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;

  // Bi-directional relations
  project?: ProjectWorkspace;
  prdArtifact?: PrdArtifact | null;
}

/* =========================================================================
 * ISO/IEC/IEEE 29119-3:2022 Bi-Directional Requirement Traceability Matrix (RTM)
 * ========================================================================= */

export type TestType =
  | 'POSITIVE'
  | 'NEGATIVE'
  | 'BOUNDARY_VALUE'
  | 'SECURITY'
  | 'PERFORMANCE';

export type ExecutionVerdict =
  | 'NOT_RUN'
  | 'PASSED'
  | 'FAILED'
  | 'BLOCKED'
  | 'INCONCLUSIVE';

export interface TestStepSpec {
  stepNumber: number;
  action: string;
  testData?: string;
  expectedStepResult: string;
}

export interface RtmTestCase {
  id: string;
  projectId: string;
  prdArtifactId?: string | null;
  businessRuleId?: string | null; // References BusinessRule.id or "BR-xx"
  userStoryId?: string | null; // References UserStory.id or "REQ-US-xx"
  testCaseId: string; // Format: "TC-VCH-001"
  title: string;
  testType: TestType;
  precondition: string; // ISO 29119 Test Precondition
  testSteps: TestStepSpec[];
  expectedResult: string; // ISO 29119 Test Oracle
  gherkinScenario: string; // Target BDD scenario
  domSelector?: string | null; // e.g. '[data-testid="input-field"]'
  apiEndpoint?: string | null; // e.g. 'POST /api/v1/records/process'
  executionVerdict: ExecutionVerdict;
  executionLatencyMs?: number | null; // Tabular-nums numeric latency metric
  executionLog?: string | null;
  lastExecutedAt?: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;

  // Bi-directional relations
  project?: ProjectWorkspace;
  prdArtifact?: PrdArtifact | null;
  businessRule?: BusinessRule | null;
  userStory?: UserStory | null;
}

/* =========================================================================
 * Full Bi-Directional Requirement Traceability Row
 * ========================================================================= */

export interface RequirementTraceabilityMatrixRow {
  businessRuleId: string; // "BR-01"
  businessRuleTitle: string;
  userStoryId: string; // "REQ-US-01"
  userStoryTitle: string;
  bpmnNodeId?: string;
  testCaseId: string; // "TC-VCH-001"
  testType: TestType;
  apiEndpoint?: string;
  domSelector?: string;
  executionVerdict: ExecutionVerdict;
  executionLatencyMs?: number;
}

/* =========================================================================
 * Phase 2 — Step 5: Tri-Modal Technical Auto-Discovery Types
 * ========================================================================= */

export type AutoDiscoveryMode = 'MODE_A_GIT' | 'MODE_B_LOCAL' | 'MODE_C_STAGING' | 'MODE_D_BLIND_URL';

export type BlindCrawlAuthType = 'NONE' | 'LOGIN_FORM' | 'BEARER_COOKIE' | 'INTERACTIVE_LOGIN' | 'BASIC_OR_FORM';
export type TargetEnvironmentMode = 'AUTO_DETECT' | 'SANDBOX_AUTONOMOUS' | 'PRODUCTION_READ_ONLY';

export interface BlindCrawlConfig {
  targetUrl: string; // e.g. "http://10.10.15.75:3100/"
  authType: BlindCrawlAuthType;
  environmentMode?: TargetEnvironmentMode;
  username?: string;
  password?: string;
  accessRoleOrTenant?: string;
  authHeaderOrCookie?: string;
  bearerOrCookie?: string;
  crawlDepth?: 'FULL_DOM_JS_AST' | 'DOM_ONLY' | 'DEEP_INTERACTIVE' | 'FULL_DOM_JS_HAR';
  captureHar?: boolean;
  dynamicFieldValues?: Record<string, string>;
  extraFields?: Record<string, string>;
}

export interface DetectedLoginTab {
  label: string;
  selector: string;
  options: string[];
}

export interface DetectedLoginSelect {
  name: string;
  label: string;
  selector: string;
  isCustom?: boolean;
  options: Array<{ label: string; value: string }>;
}

export interface DetectedLoginInput {
  key: string;
  name: string;
  id: string;
  type: string;
  label: string;
  placeholder: string;
  selector: string;
  required: boolean;
}

export interface DetectedSubmitButton {
  text: string;
  selector: string;
}

export interface LoginSurfaceProbeResult {
  targetUrl: string;
  requiresLogin: boolean;
  pageTitle: string;
  detectedTabs: DetectedLoginTab[];
  detectedSelects: DetectedLoginSelect[];
  detectedInputs: DetectedLoginInput[];
  submitButton: DetectedSubmitButton | null;
  tabs?: DetectedLoginTab[];
  dropdowns?: DetectedLoginSelect[];
  selects?: DetectedLoginSelect[];
  inputs?: DetectedLoginInput[];
}

export interface AutoRobotFieldValue {
  selector: string;
  kind: 'tab' | 'select' | 'custom_select' | 'input';
  value: string;
}
export interface BlindCrawlDiscoveredForm {
  formId: string;
  action: string;
  method: string;
  inputs: {
    name: string;
    selector: string;
    type: string;
    required: boolean;
    validationAttrs?: Record<string, string>;
  }[];
  submitSelector: string;
}
export interface FeatureSurfaceInput {
  name: string;
  id?: string;
  type: string;
  placeholder: string;
  labelText?: string;
  required: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  selector: string;
  pagePath?: string;
  moduleName?: string;
}

export interface FeatureSurfaceAnomaly {
  type: 'HTTP_ERROR' | 'CONSOLE_ERROR' | 'SLOW_RESPONSE' | 'MISSING_VALIDATION' | 'EMPTY_TABLE_ERROR';
  title: string;
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR';
  stepsToReproduce: string[];
  expectedBehavior: string;
  actualBehavior: string;
  technicalEvidence: string;
}
export interface SubTabCatalogItem {
  tabName: string;
  description: string;
  columnsOrCards: string[];
  actionButtons: string[];
  triggeredApis?: string[];
}

export type ScreenControlType =
  | 'MENU_NAVIGATION'
  | 'SUB_TAB'
  | 'PRIMARY_ACTION_BUTTON'
  | 'FILTER_CONTROL'
  | 'SEARCH_INPUT'
  | 'DATA_CARD_OR_TABLE'
  | 'MODAL_FORM_INPUT';

export type ScreenControlLocation =
  | 'Header Atas'
  | 'Sidebar Kiri'
  | 'Baris Sub-Tab Halaman'
  | 'Toolbar Pencarian & Filter'
  | 'Area Konten / Kartu Data'
  | 'Dialog / Modal Filter & Form'
  | 'Form Autentikasi Login';

export interface ScreenControlCatalogItem {
  controlId?: string;
  controlName: string;
  controlType: ScreenControlType;
  screenLocation: ScreenControlLocation;
  availableOptionsOrSample: string;
  calloutNumber?: number;
  xPercent?: number;
  yPercent?: number;
}
export interface FeatureCardItem {
  title: string;
  badges: string[];
  metadata: string[];
}

export interface VisualCalloutPinItem {
  calloutNumber: number;
  label: string;
  kind: 'BUTTON' | 'FILTER' | 'SUB_TAB';
  xPercent: number;
  yPercent: number;
  summary: string;
}

export interface ReleaseAuditSignatureRecord {
  signatureId: string;
  approverName: string;
  approverRole: string;
  signedAt: string; // ISO-8601
  snapshotHash: string; // SHA-256
  releaseGateStatus: string;
  approvalNotes: string;
  operatorSessionId?: string;
  prerequisitesChecked: string[];
}

export interface ReleaseSignOffCertificate {
  status: 'APPROVED_FOR_PRODUCTION' | 'CONDITIONAL_APPROVAL';
  approvedBy: string;
  roleTitle: string;
  releaseNotes: string;
  signedAt: string;
  snapshotHash?: string;
  releaseGateStatus?: string;
  prerequisitesChecked?: string[];
  operatorSessionId?: string;
  auditSignatures?: ReleaseAuditSignatureRecord[];
  isApproved?: boolean;
  approvedAt?: string;
  approverRole?: string;
  notes?: string;
}

export interface FeatureModuleSurface {
  moduleId: string;
  moduleName: string;
  routePath: string;
  fullUrl: string;
  pageHeading: string;
  hasDataTable: boolean;
  tableColumns: string[];
  sampleRowData: string[];
  sampleRows?: string[][];
  totalRowCountText?: string;
  hasSearchOrFilter?: boolean;
  searchFilterSelectors: string[];
  toolbarButtons?: string[];
  datePickers?: string[];
  subTabsCatalog?: SubTabCatalogItem[];
  paginationControls?: string[];
  screenControlsCatalog?: ScreenControlCatalogItem[];
  cardItems?: FeatureCardItem[];
  formsAndModals: Array<{
    formTitle: string;
    triggerButtonText?: string;
    inputs: FeatureSurfaceInput[];
    submitButtonText: string;
    observedValidationMessages?: string[];
  }>;
  triggeredApis: Array<{
    method: string;
    path: string;
    status: number;
    latencyMs: number;
    requestSample?: string;
    responseSample?: string;
    triggerPhase?: 'INITIAL_LOAD' | 'SUB_TAB_SWITCH' | 'ACTION_BUTTON_CLICK';
    triggerAction?: string;
  }>;
  observedAnomalies: FeatureSurfaceAnomaly[];
  screenshotDataUrl?: string;
  capturedAt?: string;
  customCalloutPins?: VisualCalloutPinItem[];
}

export interface TestScenarioItem {
  scenarioId: string;
  moduleId: string;
  moduleName: string;
  routePath: string;
  category:
    | 'POSITIVE_VIEW_TABLE'
    | 'POSITIVE_SEARCH_FILTER'
    | 'NEGATIVE_EMPTY_SEARCH'
    | 'POSITIVE_FORM_SUBMISSION'
    | 'NEGATIVE_MANDATORY_VALIDATION'
    | 'BOUNDARY_FORMAT'
    | 'SECURITY_API_CONTRACT'
    | 'MULTI_TAB_INTEGRITY'
    | 'FILTER_COMBINATION_MATRIX'
    | 'CARD_DETAIL_WORKFLOW'
    | 'DOMAIN_MUTATION_RULES'
    | 'BUSINESS_LOGIC'
    | 'DATA_INTEGRITY'
    | 'BVA_PAGINATION';
  title: string;
  description: string;
  linkedTestCaseIds: string[];
}
export interface BugReportTicket {
  bugId: string;
  moduleId: string;
  moduleName: string;
  featureUrl: string;
  title: string;
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR';
  priority: 'P1' | 'P2' | 'P3';
  status: 'OPEN' | 'FIXED' | 'VERIFIED';
  stepsToReproduce: string[];
  expectedResult: string;
  actualResult: string;
  technicalEvidence: string;
  recommendedFix: string;
}

export interface UatAcceptanceCriterion {
  criterion: string;
  expected: string;
  actual: string;
  passed: boolean;
}

export interface UatFeatureFlow {
  uatId: string;
  moduleId: string;
  moduleName: string;
  routePath: string;
  userRole: string;
  businessScenarioTitle: string;
  endToEndJourneySteps: string[];
  acceptanceCriteria: UatAcceptanceCriterion[];
  uatStatus: 'ACCEPTED' | 'ACCEPTED_WITH_NOTES' | 'REJECTED';
  testerNotes: string;
}

export interface CrawledModuleSummary {
  moduleName: string;
  pagePath: string;
  headings: string[];
  inputs: Array<{
    name: string;
    selector: string;
    type: string;
    required: boolean;
    labelText?: string;
    placeholder?: string;
  }>;
  buttons: string[];
  tabs: string[];
  tables: Array<{ tableName: string; columns: string[] }>;
  apis: Array<{ method: string; path: string; status?: number }>;
}

export interface BlindCrawlResult {
  targetUrl: string;
  appName?: string;
  crawledAt: string;
  harvestedAt?: number;
  durationMs: number;
  discoveredPages: string[];
  discoveredForms: BlindCrawlDiscoveredForm[];
  forms?: BlindCrawlDiscoveredForm[];
  extractedApis: DiscoveredApiEndpoint[];
  inferredBusinessRules: BrdMatrixRow[];
  inferredValidationContracts: ValidationRuleContract[];
  baselineSummary: string;
  bpmnXml: string;
  databaseTables: DatabaseErdTable[];
  domBindings: DomTraceabilityBinding[];
  discoveredJsChunks?: string[];
  rawJsSnippets?: Array<{ chunkUrl: string; jsCode: string }>;
  extractedEntities?: any[];
  discoveredModules?: CrawledModuleSummary[];
  discoveredFeatureModules?: FeatureModuleSurface[];
  featureModules?: FeatureModuleSurface[];
  scrapedHeadings?: string[];
  discoveredAuthContext?: {
    role?: string;
    roles?: string[];
    permissions?: string[];
    tenant_id?: string | number;
    jwtClaims?: Record<string, any>;
    storageSource?: 'localStorage' | 'sessionStorage' | 'pinia' | 'vuex' | 'nuxt' | 'next' | 'inertia' | string;
  };
}
export interface GitDiscoveryConfig {
  repositoryUrl: string;
  branch: string;
  authToken?: string;
}

export interface LocalDiscoveryConfig {
  targetPath: string;
  zipFile?: string;
}

export interface StagingDiscoveryConfig {
  stagingUrl: string;
  dbUri: string;
}

export interface DiscoveredApiEndpoint {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  controllerPath: string;
  lineNumber: number;
  handlerName?: string;
  summary: string;
  description?: string;
  featureModule?: string;
  queryParameters?: Record<string, { type: string; required?: boolean; example?: string }>;
  requestBodySchema?: Record<string, unknown> | null;
  responseSchemas?: Record<string, unknown>;
  responseSchema?: Record<string, unknown> | any;
  linkedTestCaseIds: string[]; // e.g. ["TC-001", "TC-002", "TC-003"]
  linkedRequirementId: string; // e.g. "REQ-US-01"
  authRequired?: boolean;
  triggerPhase?: 'INITIAL_LOAD' | 'SUB_TAB_SWITCH' | 'ACTION_BUTTON_CLICK';
  triggerAction?: string;
}

export interface DatabaseErdColumn {
  name: string;
  type: string;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  isNullable: boolean;
  foreignKeyTarget?: {
    table: string;
    column: string;
  };
}

export interface DatabaseErdTable {
  id: string;
  tableName: string;
  columns: DatabaseErdColumn[];
  primaryKeys: string[];
  rowCountEstimate?: number;
}

export interface DomTraceabilityBinding {
  bindingId: string;
  componentName?: string;
  userStoryId: string; // "REQ-US-01"
  businessRuleId: string; // "BR-01"
  testCaseId: string; // "TC-001"
  domSelector: string; // '[data-testid="username-input"]'
  ariaRole: string; // "textbox"
  targetElement: string; // "<input id='username' />"
  apiEndpoint: string; // "POST /api/v1/auth/login"
  dbTarget: string; // "SystemUser.email"
  parityStatus: 'BOUND_AND_VERIFIED' | 'SYNTHETIC_CANDIDATE';
}

export interface TriModalDiscoveryResult {
  mode: AutoDiscoveryMode;
  targetIdentifier: string; // Git URL, Local Path, or Staging URL
  branchOrDatabase: string;
  discoveredAt: string;
  durationMs: number;
  framework: string;
  apiEndpoints: DiscoveredApiEndpoint[];
  openApiSpec: Record<string, unknown>;
  databaseTables: DatabaseErdTable[];
  domTraceability: DomTraceabilityBinding[];
}

/* =========================================================================
 * Phase 2 — Step 6: PRD-to-Code Gap Auditor & Tech Doc Synthesizer Types
 * ========================================================================= */

export type GapAuditVerdict =
  | 'COMPLIANT'
  | 'MISSING_IN_BACKEND'
  | 'UNDOCUMENTED_SHADOW_API'
  | 'SCHEMA_TYPE_MISMATCH'
  | 'MISSING_IMPLEMENTATION'
  | 'UNDOCUMENTED_SHADOW_FEATURE'
  | 'VERIFIED_MATCH';

export interface DefectTicketPayload {
  ticketId: string;
  issueKey: string; // e.g. "SDLC-DEFECT-01"
  title: string;
  severity: 'CRITICAL' | 'MAJOR' | 'MODERATE' | 'LOW';
  component: string;
  expectedBehavior: string;
  actualBehavior: string;
  suggestedRemediation: string;
  markdownPayload: string;
}

export interface AuditDiscrepancyItem {
  id: string; // "GAP-001"
  verdict: GapAuditVerdict;
  gapCategory?: 'MISSING_VALIDATION' | 'HTTP_ERROR' | 'SCHEMA_MISMATCH' | 'SHADOW_API' | string;
  ruleRef: string; // "VR-01", "BR-03", etc.
  userStoryRef: string; // "REQ-US-01"
  targetEntity: string; // "POST /api/v1/auth/login"
  discrepancyTitle: string;
  discrepancyDescription: string;
  severity: 'CRITICAL' | 'MAJOR' | 'MODERATE' | 'LOW';
  diffLanguage: 'typescript' | 'json' | 'sql' | 'markdown';
  expectedSpec: string;
  actualImplementation: string;
  defectTicket: DefectTicketPayload;
  remediationAction: string;
}

export type GapAuditItem = AuditDiscrepancyItem;
export type DiscoveredFeatureModule = FeatureModuleSurface;

export interface GapAuditSummary {
  totalAudited: number;
  compliantCount: number;
  missingInBackendCount: number;
  shadowApiCount: number;
  schemaMismatchCount: number;
  missingImplementationCount?: number;
  undocumentedShadowCount?: number;
  verifiedMatchCount?: number;
  complianceRatePercent: number;
  auditTimestamp: string;
  isZeroDocMode?: boolean;
  hasSourceRequirements?: boolean;
}

/* =========================================================================
 * Phase 2 — Step 7: Playwright Synthesizer & REA Live Runner Stream Types
 * ========================================================================= */

export type PipelineStageType =
  | 'UI_ACTION'
  | 'API_GATEWAY'
  | 'SERVICE_LOGIC'
  | 'DATABASE_QUERY';

export type StagePerformanceStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'NOMINAL' // < 200ms
  | 'ELEVATED' // 200 - 500ms
  | 'BOTTLENECK'; // > 500ms or failure

export interface PipelineStageRootCause {
  summary: string;
  sourceFile: string;
  lineNumber: number;
  functionSymbol: string;
  sqlQuery?: string;
  explainPlan?: string;
  harMetrics?: {
    dnsMs: number;
    connectMs: number;
    ttfbMs: number;
    downloadMs: number;
  };
  recommendedFix: string;
  sqlRemediationQuery?: string;
}

export interface ExecutionPipelineStage {
  id: string; // e.g. "STAGE-UI", "STAGE-API", "STAGE-SVC", "STAGE-DB"
  label: string;
  stageNumber: 1 | 2 | 3 | 4;
  stageType: PipelineStageType;
  componentSource: string;
  latencyMs: number;
  status: StagePerformanceStatus;
  inputPayload?: string;
  outputPayload?: string;
  rootCause?: PipelineStageRootCause;
}

export interface TestSuiteExecutionTrace {
  testId: string; // "TC-001", "TC-008"
  testTitle: string;
  scenarioType: string;
  ruleRef: string;
  totalDurationMs: number;
  overallVerdict: 'PASSED' | 'FAILED' | 'BOTTLENECK_DETECTED';
  stages: ExecutionPipelineStage[];
}

/* =========================================================================
 * Git Direct Connect, Pull Request & Device Archive Types (Step 05 Upgrade)
 * ========================================================================= */

export type GitProvider = 'github' | 'gitlab' | 'bitbucket' | 'self-hosted';

export interface GitRefOption {
  id: string;
  name: string;
  type: 'BRANCH' | 'PULL_REQUEST';
  prNumber?: number;
  author?: string;
  updatedAt?: string;
  commitSha?: string;
  description?: string;
}

export interface GitConnectRequest {
  provider: GitProvider;
  repositoryUrl: string;
  authToken?: string;
  selectedRef?: string;
}

export interface UploadArchiveTelemetry {
  filename: string;
  sizeBytes: number;
  sizeFormatted: string;
  extractedFilesCount: number;
  durationMs: number;
  status: 'PARSED' | 'FAILED';
  parsedFileTypes: {
    controllers: number;
    routes: number;
    schemas: number;
    components: number;
  };
}

/* =========================================================================
 * 1-Click Unified Runner (Playwright E2E + API + k6 Load Test) Types (Step 07 Upgrade)
 * ========================================================================= */

export interface K6LoadProfile {
  vus: number; // 10 | 50 | 100
  durationSeconds: number; // 15 | 30 | 60
  rpsTarget?: number;
}

export interface K6LatencyPercentiles {
  min: number;
  avg: number;
  med: number; // p50
  p90: number;
  p95: number;
  p99: number;
  max: number;
}

export interface K6MetricSummary {
  vus: number;
  durationSeconds: number;
  requested?: {
    vus: number;
    durationSeconds: number;
  };
  effective?: {
    vus: number;
    durationSeconds: number;
  };
  totalRequests: number;
  throughputRps: number;
  errorRatePercent: number;
  provenance?: 'EMPIRICAL_K6' | 'HTTP_CONCURRENCY_PROBE' | 'ESTIMATED';
  latency: K6LatencyPercentiles;
  thresholds: {
    httpReqFailedPass: boolean;
    httpReqDurationP95Pass: boolean;
    p95ThresholdMs: number;
    p95ActualMs: number;
  };
}

export interface FunctionalStepAssertion {
  stepNumber: number;
  action: string;
  expected: string;
  actual: string;
  status: 'PASSED' | 'FAILED';
}

export interface FunctionalTestCaseResult {
  testId: string; // e.g. "TC-001" or "UAT-E2E-001"
  title: string;
  ruleRef: string;
  userStoryRef: string;
  moduleName?: string;
  pagePath?: string;
  scenarioType: 'POSITIVE' | 'BOUNDARY' | 'NEGATIVE' | 'CONCURRENCY';
  verdict: 'PASSED' | 'FAILED' | 'BOTTLENECK' | 'WARNING';
  durationMs: number;
  httpStatus: number;
  expectedHttpStatus: number;
  steps: FunctionalStepAssertion[];
  errorPayload?: Record<string, unknown> | null;
  diagnostics?: string;
}

export interface UnifiedRunnerExecutionSummary {
  runId: string;
  timestamp: string;
  profile: K6LoadProfile;
  e2eSummary: {
    total: number;
    passed: number;
    failed: number;
    passRatePercent: number;
    overallVerdict: 'ALL_PASSED' | 'HAS_FAILURES' | 'BOTTLENECK_DETECTED';
  };
  k6Summary: K6MetricSummary;
  functionalResults: FunctionalTestCaseResult[];
  executionTrace: TestSuiteExecutionTrace;
  testScenarios?: TestScenarioItem[];
  bugReports?: BugReportTicket[];
  uatFlows?: UatFeatureFlow[];
}
