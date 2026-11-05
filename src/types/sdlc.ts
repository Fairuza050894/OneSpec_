/**
 * OneSpec SDLC Workbench - Core Domain Types
 * Standards Compliance:
 * - ISO/IEC/IEEE 29148:2018 (Systems and software engineering — Life cycle processes — Requirements engineering)
 * - ISO/IEC 19510:2013 / BPMN 2.0 (Information technology — Object Management Group Business Process Model and Notation)
 * - ISO/IEC/IEEE 29119-3:2022 (Software and systems engineering — Software testing — Part 3: Test documentation)
 */

export type ProjectMode = 'GREENFIELD' | 'BROWNFIELD' | 'BLIND_URL';

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
  constraintExpression?: string; // e.g. "cartTotal >= 50000"
  errorCode: string;
  errorHttpStatus: number; // e.g. 400, 422
  exactUiErrorString?: string; // e.g. "Total belanja minimum Rp 50.000 untuk menggunakan voucher ini"
}

export interface ValidationRuleContract {
  ruleId: string; // "VR-01"
  userStoryId: string; // "REQ-US-01"
  fieldName: string;
  dataType: string;
  constraintExpression: string;
  errorCode: string;
  httpStatus: number;
  exactUiErrorString: string;
}

export interface BrdMatrixRow {
  ruleId: string; // "BR-01"
  category: string;
  statement: string; // RFC 2119: SHALL, SHALL NOT, SHOULD
  targetKpi: string;
  sourceMoMLine: string;
  priority: BusinessRulePriority;
  complianceReference?: string;
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
  domSelector?: string | null; // e.g. '[data-testid="voucher-input"]'
  apiEndpoint?: string | null; // e.g. 'POST /api/v1/vouchers/apply'
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

export type BlindCrawlAuthType = 'NONE' | 'LOGIN_FORM' | 'BEARER_COOKIE' | 'BASIC_OR_FORM';

export interface BlindCrawlConfig {
  targetUrl: string; // e.g. "http://10.10.15.75:3100/"
  authType: BlindCrawlAuthType;
  username?: string;
  password?: string;
  authHeaderOrCookie?: string;
  bearerOrCookie?: string;
  crawlDepth?: 'FULL_DOM_JS_AST' | 'DOM_ONLY' | 'DEEP_INTERACTIVE' | 'FULL_DOM_JS_HAR';
  captureHar?: boolean;
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
  extractedEntities?: any[];
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
  requestBodySchema?: Record<string, unknown> | null;
  responseSchemas?: Record<string, unknown>;
  linkedTestCaseIds: string[]; // e.g. ["TC-001", "TC-002", "TC-003"]
  linkedRequirementId: string; // e.g. "REQ-US-01"
  authRequired?: boolean;
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
  domSelector: string; // '[data-testid="voucher-input"]'
  ariaRole: string; // "textbox"
  targetElement: string; // "<input id='voucher-code' />"
  apiEndpoint: string; // "POST /api/v1/checkout/apply-voucher"
  dbTarget: string; // "Vouchers.code"
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
  | 'SCHEMA_TYPE_MISMATCH';

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
  ruleRef: string; // "VR-01", "BR-03", etc.
  userStoryRef: string; // "REQ-US-01"
  targetEntity: string; // "POST /api/v1/checkout/apply-voucher"
  discrepancyTitle: string;
  discrepancyDescription: string;
  severity: 'CRITICAL' | 'MAJOR' | 'MODERATE' | 'LOW';
  diffLanguage: 'typescript' | 'json' | 'sql' | 'markdown';
  expectedSpec: string;
  actualImplementation: string;
  defectTicket: DefectTicketPayload;
  remediationAction: string;
}

export interface GapAuditSummary {
  totalAudited: number;
  compliantCount: number;
  missingInBackendCount: number;
  shadowApiCount: number;
  schemaMismatchCount: number;
  complianceRatePercent: number;
  auditTimestamp: string;
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
  totalRequests: number;
  throughputRps: number;
  errorRatePercent: number;
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
  testId: string; // e.g. "TC-001"
  title: string;
  ruleRef: string;
  userStoryRef: string;
  scenarioType: 'POSITIVE' | 'BOUNDARY' | 'NEGATIVE' | 'CONCURRENCY';
  verdict: 'PASSED' | 'FAILED' | 'BOTTLENECK';
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
}
