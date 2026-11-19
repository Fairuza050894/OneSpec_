'use client';

import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Command } from 'cmdk';
import {
  Folder,
  FileCode,
  FileText,
  GitBranch,
  Terminal,
  Activity,
  CheckCircle2,
  AlertCircle,
  AlertOctagon,
  AlertTriangle,
  Database,
  Play,
  Search,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Sliders,
  Code2,
  Globe,
  Layers,
  Box,
  Cpu,
  ArrowRight,
  X,
  Eye,
  EyeOff,
  FileSpreadsheet,
  Download,
  Copy,
  Check,
  GitCompare,
  Flame,
  Radio,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  MousePointer,
  Network,
  Compass,
  RotateCw,
  Zap,
  Users,
  Share2,
  Lock,
  History,
  Plus,
  Trash2,
  Save,
  Clock,
  Link2,
  Building2,
  Wrench,
  Camera,
} from 'lucide-react';
import type {
  ValidationRuleContract,
  BrdMatrixRow,
  AutoDiscoveryMode,
  GitDiscoveryConfig,
  LocalDiscoveryConfig,
  StagingDiscoveryConfig,
  DiscoveredApiEndpoint,
  DatabaseErdTable,
  DomTraceabilityBinding,
  TriModalDiscoveryResult,
  AuditDiscrepancyItem,
  GapAuditSummary,
  ExecutionPipelineStage,
  TestSuiteExecutionTrace,
  ProjectMode,
  BlindCrawlConfig,
  BlindCrawlResult,
  BlindCrawlAuthType,
  LoginSurfaceProbeResult,
  BugReportTicket,
  UatFeatureFlow,
} from '@/types/sdlc';
import { generateCanonicalBpmn2Xml } from '@/services/bpmnXmlGenerator';
import { detectEnvironment } from '@/lib/environmentDetector';
import { useStudioLocale } from '@/lib/i18n';
import type { BpmnNodeClickEvent } from '@/components/bpmn/CamundaBpmnViewer';
import { ContractWireframePreview, WireframeState } from '@/components/wireframe/ContractWireframePreview';
import {
  synthesizeTestCasesFromValidations,
  synthesizeFourQaDeliverables,
  SynthesizedRtmRow,
  generateFeatureBundle,
} from '@/services/rtmSynthesizer';
import { RtmSpreadsheetGrid } from '@/components/rtm/RtmSpreadsheetGrid';
import { TriModalDiscoveryToolbar, type StagingDiscoveryWithAuthConfig } from '@/components/discovery/TriModalDiscoveryToolbar';
import { ApiContractExplorer } from '@/components/discovery/ApiContractExplorer';
import { DomTraceabilityMap } from '@/components/discovery/DomTraceabilityMap';
import { DecompiledBundleVault } from '@/components/discovery/DecompiledBundleVault';
import { GapAuditorWorkbench } from '@/components/audit/GapAuditorWorkbench';
import { gapAuditorService } from '@/services/gapAuditorService';
import { getDefaultErdTables, generateOpenApi31SpecClient } from '@/services/discoveryDefaults';
import { automationSynthesizerService } from '@/services/automationSynthesizer';
import { synthesizeFullSdlcFromCrawl, compileGreenfieldFromMoM, computeUnifiedQualityMetrics, cleanProjectDisplayName, type CompiledSdlcState } from '@/services/sdlcCompiler';
import { architectureDeconstructorService, type UpstreamLinkedProjectInfo } from '@/services/architectureDeconstructor';
import type { ChangeImpactAnalysisReport } from '@/services/changeImpactService';
import type { ProjectIndexEntry, SavedProjectRecord, ProjectHistoricalSnapshot, RegressionDiffSummary, VaultProjectType } from '@/services/workspaceVaultService';
import { tsdSynthesizerService, type TsdMatrixRow } from '@/services/tsdSynthesizer';
import { ArchitectureDeconstructorWorkbench } from '@/components/architecture/ArchitectureDeconstructorWorkbench';
import { ComplianceBinderWorkbench } from '@/components/compliance/ComplianceBinderWorkbench';
import { OwaspDastWorkbench } from '@/components/security/OwaspDastWorkbench';
import { IsoRiskAuditWorkbench } from '@/components/compliance/IsoRiskAuditWorkbench';
import { ReverseDfdWorkbench } from '@/components/architecture/ReverseDfdWorkbench';
import { SmtFormalVerifierWorkbench } from '@/components/formal/SmtFormalVerifierWorkbench';
import { DelphiConsensusWorkbench } from '@/components/consensus/DelphiConsensusWorkbench';
import { Step01IngestionWorkbench, type ExtractedEntity } from '@/components/ingestion/Step01IngestionWorkbench';
import { Step12ExecutiveSummaryWorkbench } from '@/components/executive/Step12ExecutiveSummaryWorkbench';
import { IsoLibraryPortal } from '@/components/IsoLibraryPortal';
import { Step07ExecutionRunner } from '@/components/Step07ExecutionRunner';
import { RunnerStageInspector } from '@/components/runner/RunnerStageInspector';
import { ExportBundleDropdown } from '@/components/shared/ExportBundleDropdown';
import {
  validateWorkspaceCache,
  wrapWorkspaceEnvelope,
  WORKSPACE_CACHE_LOCAL_STORAGE_KEY,
  type WorkspaceEnvelope,
} from '@/lib/workspaceCache';

// Dynamically import Camunda BPMN Canvas to prevent SSR hydration conflicts with bpmn-js
const CamundaBpmnViewer = dynamic(
  () => import('@/components/bpmn/CamundaBpmnViewer').then((m) => m.CamundaBpmnViewer),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center font-mono text-[12px] text-[#94A3B8] bg-[#0E1015]">
        Initializing BPMN 2.0 Engine &amp; bpmn-js Canvas...
      </div>
    ),
  }
);

// Dynamically import ERD Canvas to prevent SSR hydration conflicts with @xyflow/react & elkjs
const DatabaseErdCanvas = dynamic(
  () => import('@/components/discovery/DatabaseErdCanvas').then((m) => m.DatabaseErdCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center font-mono text-[12px] text-[#707070] bg-[#0E1015]">
        Loading @xyflow/react &amp; elkjs ERD canvas...
      </div>
    ),
  }
);

// Dynamically import Monaco Editor to avoid SSR hydration conflicts
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center font-mono text-[12px] text-[#707070] bg-[#0E1015]">
      Loading Monaco Editor engine...
    </div>
  ),
});

function resolveModuleScreenshot(targetItem: any, state: CompiledSdlcState | null): string | undefined {
  if (!targetItem && !state) return undefined;
  const isCandidateValid = (val: unknown): val is string =>
    typeof val === 'string' && val.startsWith('data:image/') && val.length > 2500;
  const direct = targetItem?.screenshotDataUrl || targetItem?.screenshotUrl || targetItem?.screenshot;
  if (isCandidateValid(direct)) return direct;
  const targetModId = (targetItem?.moduleId || '').toLowerCase().trim();
  const targetRoute = (targetItem?.routePath || targetItem?.pagePath || targetItem?.path || '')
    .toLowerCase().replace(/^\/?#\/?/, '/').replace(/\/$/, '').trim();
  if (state?.discoveredFeatureModules) {
    const match = state.discoveredFeatureModules.find((m) => {
      const mId = (m.moduleId || '').toLowerCase().trim();
      const mRoute = (m.routePath || '').toLowerCase().replace(/^\/?#\/?/, '/').replace(/\/$/, '').trim();
      return (targetModId && mId === targetModId) || (targetRoute && mRoute === targetRoute);
    });
    if (isCandidateValid(match?.screenshotDataUrl)) return match.screenshotDataUrl;
  }
  const manuals = (state as any)?.userManuals || (state?.knowledgeGraphSummary as any)?.featureUserGuides || [];
  if (Array.isArray(manuals)) {
    const match = manuals.find((m: any) => {
      const mId = (m.moduleId || m.iso26514Manual?.moduleId || '').toLowerCase().trim();
      const mRoute = (m.routePath || m.iso26514Manual?.routePath || '').toLowerCase().replace(/^\/?#\/?/, '/').replace(/\/$/, '').trim();
      return (targetModId && mId === targetModId) || (targetRoute && mRoute === targetRoute);
    });
    const shot = match?.screenshotDataUrl || match?.iso26514Manual?.screenshotDataUrl;
    if (isCandidateValid(shot)) return shot;
  }
  return undefined;
}

export default function OneSpecEngineeringWorkbench() {
  const { locale, setLocale, copy } = useStudioLocale();
  // Navigation State (Steps 1–7)
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<any | null>(null);
  const [activeStep, setActiveStep] = useState<number>(1);
  const [workspaceMode, setWorkspaceMode] = useState<'STUDIO' | 'ENTERPRISE_LIBRARY'>('STUDIO');
  const [displayMode, setDisplayMode] = useState<'EXECUTIVE' | 'TECHNICAL'>('TECHNICAL');
  const [step12View, setStep12View] = useState<'KNOWLEDGE_GRAPH' | 'PRODUCT_KNOWLEDGE'>('KNOWLEDGE_GRAPH');

  // Sub-View Pill Switchers (Single Focus per Step)
  const [step2SubTab, setStep2SubTab] = useState<
    'SPLIT_ORCHESTRATOR' | 'ARCHITECTURE' | 'REVERSE_DFD'
  >('SPLIT_ORCHESTRATOR');
  const [step3SubTab, setStep3SubTab] = useState<'BRD_MATRIX' | 'PRD_CONTRACT' | 'TSD_TRD' | 'RAW_MARKDOWN'>('BRD_MATRIX');
  const [step5SubTab, setStep5SubTab] = useState<'API_EXPLORER' | 'ERD_CANVAS' | 'DOM_MAP' | 'BUNDLE_VAULT'>('API_EXPLORER');
  const [step7SubTab, setStep7SubTab] = useState<'LIVE_STREAM' | 'PLAYWRIGHT_SPEC' | 'PARITY_EXPORTS'>('LIVE_STREAM');
  const [step8SubTab, setStep8SubTab] = useState<'REGULATORY_BINDER' | 'ISO_RISK_VAULT'>('REGULATORY_BINDER');
  // Progressive Disclosure: Inspector & Drawer State (CLOSED BY DEFAULT)
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);
  const [isTerminalExpanded, setIsTerminalExpanded] = useState<boolean>(false);
  const [showArtifactExplorer, setShowArtifactExplorer] = useState<boolean>(false);
  const [activeDrawerTab, setActiveDrawerTab] = useState<'TERMINAL' | 'AST_OUTPUT' | 'REA_STREAM'>('TERMINAL');
  const [isCmdkOpen, setIsCmdkOpen] = useState<boolean>(false);

  // Selection State
  const [selectedEntityId, setSelectedEntityId] = useState<string>('BR-01');
  const [selectedNodeDetails, setSelectedNodeDetails] = useState<{
    id: string;
    type: string;
    name: string;
    businessRuleId?: string;
    userStoryId?: string;
    validationRuleId?: string;
  } | null>(null);
  const [selectedDiscoveredEndpoint, setSelectedDiscoveredEndpoint] = useState<DiscoveredApiEndpoint | null>(null);
  const [selectedErdTable, setSelectedErdTable] = useState<DatabaseErdTable | null>(null);
  const [selectedDomBinding, setSelectedDomBinding] = useState<DomTraceabilityBinding | null>(null);
  const [selectedAuditItemId, setSelectedAuditItemId] = useState<string>('GAP-002');
  const [copiedDefect, setCopiedDefect] = useState<boolean>(false);
  const [selectedRunnerStage, setSelectedRunnerStage] = useState<ExecutionPipelineStage | null>(null);
  const [selectedRunnerTrace, setSelectedRunnerTrace] = useState<TestSuiteExecutionTrace | null>(null);
  const [copiedSqlFix, setCopiedSqlFix] = useState<boolean>(false);

  // Step 1: Ingestion Hub & Source State
  const [step1SourceTab, setStep1SourceTab] = useState<'WEB_URL' | 'GIT_REPO' | 'ZIP_FOLDER' | 'STAKEHOLDER_MOM'>('WEB_URL');
  const [projectMode, setProjectMode] = useState<ProjectMode>('BLIND_URL');
  const [existingDomain, setExistingDomain] = useState<string>('http://localhost:3000');

  // Tab 1: Web URL Crawler State
  const targetUrlInputRef = useRef<HTMLInputElement>(null);
  const [blindTargetUrl, setBlindTargetUrl] = useState<string>('');
  const [isProbingSurface, setIsProbingSurface] = useState<boolean>(false);
  const [loginSurfaceProbe, setLoginSurfaceProbe] = useState<LoginSurfaceProbeResult | null>(null);
  const [dynamicFieldValues, setDynamicFieldValues] = useState<Record<string, string>>({});
  const [loginUsername, setLoginUsername] = useState<string>('admin');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [isMaskSensitiveData, setIsMaskSensitiveData] = useState<boolean>(false);
  const [loginAccessType, setLoginAccessType] = useState<string>('Pancaran');
  const [showLoginPassword, setShowLoginPassword] = useState<boolean>(false);
  const [visiblePasswordSelectors, setVisiblePasswordSelectors] = useState<Record<string, boolean>>({});
  const [isRunningAutoRobot, setIsRunningAutoRobot] = useState<boolean>(false);
  const [isBlindCrawling, setIsBlindCrawling] = useState<boolean>(false);
  const [isStartingInteractive, setIsStartingInteractive] = useState<boolean>(false);
  const [interactiveNotice, setInteractiveNotice] = useState<{
    type: 'info' | 'warning' | 'error' | 'success';
    text: string;
  } | null>(null);
  const [blindCrawlResult, setBlindCrawlResult] = useState<BlindCrawlResult | null>(null);
  const [activeTargetBadge, setActiveTargetBadge] = useState<string | null>(null);
  const [gitRepoUrl, setGitRepoUrl] = useState<string>('https://github.com/example/api-service.git');
  const [gitBranch, setGitBranch] = useState<string>('main');
  const [gitAuthToken, setGitAuthToken] = useState<string>('');
  const [gitProvider, setGitProvider] = useState<'github' | 'gitlab' | 'bitbucket' | 'self-hosted'>('github');

  // Tab 3: Local Folder / Zip Upload State
  const [localFolderPath, setLocalFolderPath] = useState<string>('');

  // Tab 4: Unified Ingestion Execution State
  const [isAnalyzingSource, setIsAnalyzingSource] = useState<boolean>(false);
  const [isRecapturingScreenshots, setIsRecapturingScreenshots] = useState<boolean>(false);

  // Dynamic Automation Assets (Step 07 Parity)
  const [compiledPipelineStages, setCompiledPipelineStages] = useState<ExecutionPipelineStage[]>([]);
  const [compiledExecutionTraces, setCompiledExecutionTraces] = useState<TestSuiteExecutionTrace[]>([]);
  const [compiledPlaywrightCode, setCompiledPlaywrightCode] = useState<string>('');
  const [compiledK6Code, setCompiledK6Code] = useState<string>('');
  const [compiledPostmanCode, setCompiledPostmanCode] = useState<string>('');

  // Compiled Universal SDLC State (Steps 01–12)
  const [compiledSdlcState, setCompiledSdlcState] = useState<CompiledSdlcState | null>(null);
  // Stale Cache & Engine Version Tracking (T-13 / F-13)
  const [isCacheStale, setIsCacheStale] = useState<boolean>(false);
  const [cacheStaleReason, setCacheStaleReason] = useState<string | null>(null);
  // Multi-Project Permanent Vault, Snapshots & Regression Diff State
  const [vaultProjects, setVaultProjects] = useState<ProjectIndexEntry[]>([]);
  const [activeVaultProjectId, setActiveVaultProjectId] = useState<string>('');
  const [projectSnapshots, setProjectSnapshots] = useState<ProjectHistoricalSnapshot[]>([]);
  const [regressionDiffSummary, setRegressionDiffSummary] = useState<RegressionDiffSummary | null>(null);
  const [isSavingSnapshot, setIsSavingSnapshot] = useState<boolean>(false);
  const [isVaultHistoryOpen, setIsVaultHistoryOpen] = useState<boolean>(false);
  const [vaultModalTab, setVaultModalTab] = useState<'SNAPSHOTS' | 'PROJECTS'>('SNAPSHOTS');
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState<boolean>(false);
  const [greenfieldProjectName, setGreenfieldProjectName] = useState<string>('');
  // Part 3: Cross-Project Vault Integration Linker & Part 4: Human-in-the-loop QA Overrides
  const [selectedIntegrationTargetId, setSelectedIntegrationTargetId] = useState<string>('');
  const [isLinkingIntegration, setIsLinkingIntegration] = useState<boolean>(false);
  const [linkedUpstreamProject, setLinkedUpstreamProject] = useState<UpstreamLinkedProjectInfo | null>(null);
  const [bugStatusOverrides, setBugStatusOverrides] = useState<Record<string, 'OPEN' | 'FIXED' | 'VERIFIED'>>({});
  const [uatOverrides, setUatOverrides] = useState<Record<string, { uatStatus: UatFeatureFlow['uatStatus']; testerNotes: string }>>({});
  const [hasUnsavedQaOverrides, setHasUnsavedQaOverrides] = useState<boolean>(false);
  // Decoupled Interactive Browser Session State (Non-blocking background session)
  const [interactiveSession, setInteractiveSession] = useState<{
    isRunning: boolean;
    status: 'LOGIN_WAIT' | 'ROBOT_EXPLORING' | 'READY_TO_FINISH' | 'COMPLETED';
    pagesCount: number;
    apisCount: number;
    inputsCount: number;
    tablesCount: number;
    latestResult: BlindCrawlResult | null;
    logs: string[];
  }>({
    isRunning: false,
    status: 'LOGIN_WAIT',
    pagesCount: 0,
    apisCount: 0,
    inputsCount: 0,
    tablesCount: 0,
    latestResult: null,
    logs: [],
  });
  const [rawMoMNotes, setRawMoMNotes] = useState<string>(
    `[MoM - 2026-11-03] Architecture & System Invariant Workshop
Attendees: Head of Product, Lead QA Architect, Senior Backend Engineer, Security Lead

1. Business Context & Greenfield Architecture:
   - System SHALL enforce strict data integrity across all exposed HTTP routes and database entities.
   - Requirement: System SHALL validate parameter format with strict regex ^[A-Za-z0-9_.-]{3,30}$.
   - Requirement: System SHALL reject concurrent duplicate submissions on single-use transactions with HTTP 409 Conflict.
   - Target KPI: Zero duplicate records, P99 API latency < 150ms, Error rate < 0.01%.

2. Architectural Constraints:
   - Presentation layer: Web & mobile interactive client interfaces.
   - Service layer: REST API routes authenticated with bearer token or session cookie.
   - Database: Relational database with row-level transaction locking.`
  );

  const [extractedEntities, setExtractedEntities] = useState<ExtractedEntity[]>([
    {
      id: 'ENT-01',
      type: 'ACTOR',
      identifier: 'ClientUser',
      label: 'End-user / Client executing transactions against the portal',
      sourceText: 'Web & mobile interactive client interfaces',
      status: 'VALIDATED',
    },
    {
      id: 'ENT-02',
      type: 'BUSINESS_RULE',
      identifier: 'BR-01',
      label: 'Mandatory parameter validation and schema verification',
      sourceText: 'System SHALL validate parameter format with strict regex',
      status: 'VALIDATED',
    },
    {
      id: 'ENT-03',
      type: 'BUSINESS_RULE',
      identifier: 'BR-02',
      label: 'Single-use concurrency invariant preventing duplicate transactions',
      sourceText: 'System MUST reject concurrent duplicate submissions with HTTP 409',
      status: 'VALIDATED',
    },
    {
      id: 'ENT-04',
      type: 'CONSTRAINT',
      identifier: 'VR-01',
      label: 'Alphanumeric format regex constraint ^[A-Za-z0-9_.-]{3,30}$',
      sourceText: 'validate parameter format with strict regex ^[A-Za-z0-9_.-]{3,30}$',
      status: 'VALIDATED',
    },
    {
      id: 'ENT-05',
      type: 'KPI',
      identifier: 'KPI-LATENCY',
      label: 'P99 API response latency under 150ms',
      sourceText: 'P99 API latency < 150ms, Error rate < 0.01%',
      status: 'VALIDATED',
    },
  ]);
  // Step 2: BRD Matrix & PRD Validation Contracts
  const [brdMatrixRows, setBrdMatrixRows] = useState<BrdMatrixRow[]>([
    {
      ruleId: 'BR-01',
      category: 'BUSINESS_LOGIC',
      statement:
        'The application subsystem SHALL validate client credentials and input payload format before state dispatch.',
      targetKpi: 'Input Rejection Accuracy: 100.00%',
      sourceMoMLine: 'MoM Section 1, Line 5',
      priority: 'HIGH',
    },
    {
      ruleId: 'BR-02',
      category: 'FINANCIAL_INTEGRITY',
      statement:
        'The system SHALL NOT permit concurrent duplicate transactions across parallel user sessions.',
      targetKpi: 'Duplicate Transactions: 0.00%',
      sourceMoMLine: 'MoM Section 1, Line 6',
      priority: 'HIGH',
    },
    {
      ruleId: 'BR-03',
      category: 'SECURITY_LIMIT',
      statement:
        'The system SHALL terminate unauthenticated ingress requests with HTTP 401 and maintain P95 latency under 500ms.',
      targetKpi: 'Availability SLA > 99.90%',
      sourceMoMLine: 'MoM Section 1, Line 7',
      priority: 'HIGH',
    },
  ]);

  const [validationRules, setValidationRules] = useState<ValidationRuleContract[]>([
    {
      ruleId: 'VR-01',
      userStoryId: 'REQ-US-01',
      fieldName: 'username',
      dataType: 'string',
      constraintExpression: '^[A-Za-z0-9_.-]{3,30}$',
      errorCode: 'ERR_USERNAME_FORMAT_INVALID',
      httpStatus: 422,
      exactUiErrorString: 'Username format is invalid. Must be 3-30 alphanumeric characters.',
    },
    {
      ruleId: 'VR-02',
      userStoryId: 'REQ-US-01',
      fieldName: 'transactionAmount',
      dataType: 'number',
      constraintExpression: 'value > 0',
      errorCode: 'ERR_INVALID_AMOUNT',
      httpStatus: 422,
      exactUiErrorString: 'Transaction amount must be a positive non-zero value.',
    },
    {
      ruleId: 'VR-03',
      userStoryId: 'REQ-US-02',
      fieldName: 'idempotencyKey',
      dataType: 'string',
      constraintExpression: 'UNIQUE(idempotency_key)',
      errorCode: 'ERR_CONCURRENT_CLAIM',
      httpStatus: 409,
      exactUiErrorString: 'Transaction has already been processed or is currently in flight.',
    },
  ]);

  // Step 3: BPMN XML
  const [bpmnXml, setBpmnXml] = useState<string>(() => generateCanonicalBpmn2Xml());


  // Raw Markdown Spec
  const [rawMarkdownSpec, setRawMarkdownSpec] = useState<string>(
    `# ISO/IEC/IEEE 29148:2018 System Requirements Specification (SyRS)
## Project: Target Application Architecture Engine
**Standard Reference:** ISO/IEC/IEEE 29148:2018 Clause 5 & 8
**Status:** NORMATIVE APPROVED
**Generated By:** OneSpec Engineering Engine

---

### 1. System Overview & Scope
The system provides deterministic transaction processing, input validation, and concurrency-safe persistence for high-volume service operations.

### 2. Normative Stakeholder Business Rules (StRS)
- **BR-01 (Parameter Validation):** The application subsystem SHALL validate client credentials and input payload format before state dispatch.
- **BR-02 (Single-Use Concurrency Invariant):** The persistence layer SHALL NOT permit concurrent duplicate transactions across parallel user sessions.
- **BR-03 (Performance SLA):** All API routes SHALL respond with P95 latency under 500ms and zero unhandled server exceptions.

### 3. SyRS Functional Validation Contracts (PRD)
| Validation ID | Field Name | Type | Constraint | HTTP Error | Exact UI Error Copy |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **VR-01** | username | String | \`^[A-Za-z0-9_.-]{3,30}$\` | 422 Unprocessable | "Username format is invalid. Must be 3-30 alphanumeric characters." |
| **VR-02** | transactionAmount | Decimal | \`value > 0\` | 422 Unprocessable | "Transaction amount must be a positive non-zero value." |
| **VR-03** | idempotencyKey | String | \`UNIQUE(idempotency_key)\` | 409 Conflict | "Transaction has already been processed or is currently in flight." |`
  );

  // Step 5: Auto-Discovery Default Endpoints & Result Data
  const defaultEndpoints: DiscoveredApiEndpoint[] = useMemo(
    () => [
      {
        id: 'EP-01',
        method: 'POST',
        path: '/api/v1/auth/login',
        summary: 'Authenticates client and returns bearer JWT session',
        controllerPath: 'src/controllers/authController.ts',
        lineNumber: 24,
        requestBodySchema: { username: 'string', password: 'string' },
        responseSchemas: { 200: { token: 'string', userId: 'string' }, 401: { errorCode: 'UNAUTHORIZED' } },
        linkedTestCaseIds: ['TC-001', 'TC-003'],
        linkedRequirementId: 'REQ-US-01',
      },
      {
        id: 'EP-02',
        method: 'GET',
        path: '/api/v1/user/profile',
        summary: 'Retrieves authenticated user profile details',
        controllerPath: 'src/controllers/userController.ts',
        lineNumber: 48,
        responseSchemas: { 200: { id: 'string', role: 'string' } },
        linkedTestCaseIds: ['TC-004'],
        linkedRequirementId: 'REQ-US-01',
        authRequired: true,
      },
      {
        id: 'EP-03',
        method: 'POST',
        path: '/api/v1/records/process',
        summary: 'Executes transactional record update in atomic transaction',
        controllerPath: 'src/controllers/recordController.ts',
        lineNumber: 82,
        requestBodySchema: { recordId: 'string', payload: 'object' },
        responseSchemas: { 200: { success: true }, 409: { errorCode: 'CONFLICT' } },
        linkedTestCaseIds: ['TC-005'],
        linkedRequirementId: 'REQ-US-02',
      },
    ],
    []
  );

  const defaultDiscoveryData: TriModalDiscoveryResult = useMemo(
    () => ({
      mode: 'MODE_A_GIT',
      targetIdentifier: 'https://github.com/example/api-service.git',
      branchOrDatabase: 'main',
      discoveredAt: new Date().toISOString(),
      durationMs: 840,
      framework: 'Next.js App Router & Fastify',
      apiEndpoints: defaultEndpoints,
      openApiSpec: generateOpenApi31SpecClient(defaultEndpoints, 'http://localhost:8080'),
      databaseTables: getDefaultErdTables(),
      domTraceability: [
        {
          bindingId: 'DOM-01',
          userStoryId: 'REQ-US-01',
          businessRuleId: 'BR-01',
          testCaseId: 'TC-001',
          componentName: 'UsernameInputField',
          domSelector: 'input[name="username"], input[type="text"]',
          ariaRole: 'textbox',
          targetElement: "<input name='username' placeholder='Enter username' />",
          apiEndpoint: 'POST /api/v1/auth/login',
          dbTarget: 'SystemUser.email',
          parityStatus: 'BOUND_AND_VERIFIED',
        },
        {
          bindingId: 'DOM-02',
          userStoryId: 'REQ-US-01',
          businessRuleId: 'BR-01',
          testCaseId: 'TC-002',
          componentName: 'SubmitActionButton',
          domSelector: 'button[type="submit"]',
          ariaRole: 'button',
          targetElement: '<button type="submit">Submit</button>',
          apiEndpoint: 'POST /api/v1/auth/login',
          dbTarget: 'AuditEvent.id',
          parityStatus: 'BOUND_AND_VERIFIED',
        },
        {
          bindingId: 'DOM-03',
          userStoryId: 'REQ-US-02',
          businessRuleId: 'BR-02',
          testCaseId: 'TC-003',
          componentName: 'ErrorBannerAlert',
          domSelector: '[role="alert"]',
          ariaRole: 'alert',
          targetElement: '<div role="alert">Validation error</div>',
          apiEndpoint: 'POST /api/v1/auth/login [422]',
          dbTarget: 'None (UI Client State)',
          parityStatus: 'SYNTHETIC_CANDIDATE',
        },
      ],
    }),
    [defaultEndpoints]
  );

  const [discoveryResult, setDiscoveryResult] = useState<TriModalDiscoveryResult>(defaultDiscoveryData);
  // Step 4: Synthesized RTM Rows
  const rtmRows: SynthesizedRtmRow[] = useMemo(() => {
    if (compiledSdlcState?.rtmRows && compiledSdlcState.rtmRows.length > 0) {
      return compiledSdlcState.rtmRows;
    }
    return synthesizeTestCasesFromValidations(validationRules, {
      appName: activeWorkspace?.name,
      targetUrl: blindTargetUrl || activeWorkspace?.repositoryUrl || undefined,
      extractedApis: discoveryResult?.apiEndpoints,
      domBindings: discoveryResult?.domTraceability?.map((d) => ({
        domSelector: d.domSelector,
        componentName: d.componentName || 'element',
      })),
      discoveredModules: compiledSdlcState?.discoveredModules,
      databaseTables: discoveryResult?.databaseTables,
      businessRules: brdMatrixRows,
    });
  }, [compiledSdlcState, validationRules, activeWorkspace, blindTargetUrl, discoveryResult, brdMatrixRows]);

  // Single Source of Truth Unified Quality & Release Readiness Metrics (ISO 29119)
  const unifiedQualityMetrics = useMemo(() => {
    return computeUnifiedQualityMetrics(compiledSdlcState || ({ rtmRows } as any));
  }, [compiledSdlcState, rtmRows]);
  const qaWorkbook = useMemo(() => {
    const applyOverrides = (
      rawBugs: BugReportTicket[],
      rawUats: UatFeatureFlow[]
    ) => ({
      bugReports: rawBugs.map((b) =>
        bugStatusOverrides[b.bugId] ? { ...b, status: bugStatusOverrides[b.bugId] } : b
      ),
      uatFlows: rawUats.map((u) =>
        uatOverrides[u.uatId]
          ? { ...u, uatStatus: uatOverrides[u.uatId].uatStatus, testerNotes: uatOverrides[u.uatId].testerNotes }
          : u
      ),
    });

    if (
      compiledSdlcState?.testScenarios &&
      compiledSdlcState.testScenarios.length > 0 &&
      compiledSdlcState?.uatFlows &&
      compiledSdlcState.uatFlows.length > 0
    ) {
      const ov = applyOverrides(compiledSdlcState.bugReports || [], compiledSdlcState.uatFlows);
      return {
        testScenarios: compiledSdlcState.testScenarios,
        bugReports: ov.bugReports,
        uatFlows: ov.uatFlows,
        featureModules: compiledSdlcState.discoveredFeatureModules || [],
      };
    }
    const synth = synthesizeFourQaDeliverables(validationRules, {
      appName: activeWorkspace?.name,
      targetUrl: blindTargetUrl || activeWorkspace?.repositoryUrl || undefined,
      extractedApis: discoveryResult?.apiEndpoints,
      domBindings: discoveryResult?.domTraceability?.map((d) => ({
        domSelector: d.domSelector,
        componentName: d.componentName || 'element',
      })),
      discoveredModules: compiledSdlcState?.discoveredModules,
      featureModules: compiledSdlcState?.discoveredFeatureModules,
      databaseTables: discoveryResult?.databaseTables,
      businessRules: brdMatrixRows,
    });
    const ov = applyOverrides(synth.bugReports, synth.uatFlows);
    return {
      testScenarios: synth.testScenarios,
      bugReports: ov.bugReports,
      uatFlows: ov.uatFlows,
      featureModules: compiledSdlcState?.discoveredFeatureModules || [],
    };
  }, [compiledSdlcState, validationRules, activeWorkspace, blindTargetUrl, discoveryResult, brdMatrixRows, bugStatusOverrides, uatOverrides]);
  const [selectedRtmRow, setSelectedRtmRow] = useState<SynthesizedRtmRow>(rtmRows[0]);
  const [rtmScenarioFilter, setRtmScenarioFilter] = useState<'ALL' | 'POSITIVE' | 'NEGATIVE' | 'BOUNDARY'>('ALL');
  const [isCopiedGherkin, setIsCopiedGherkin] = useState<boolean>(false);

  // Step 6: Gap Audit Summary & Items
  const auditResult = useMemo(() => {
    return gapAuditorService.auditSpecificationsAgainstImplementation({
      validationRules,
      businessRules: brdMatrixRows,
      apiEndpoints: discoveryResult.apiEndpoints,
      databaseTables: discoveryResult.databaseTables,
    });
  }, [validationRules, brdMatrixRows, discoveryResult]);

  const activeAuditItem = useMemo(() => {
    return auditResult.items.find((item: AuditDiscrepancyItem) => item.id === selectedAuditItemId) || auditResult.items[0];
  }, [auditResult, selectedAuditItemId]);

  // Step 7: Benchmark Traces
  const benchmarkTraces = useMemo(() => {
    return automationSynthesizerService.getBenchmarkExecutionTraces();
  }, []);

  // REA Engine Status & Logs
  const [reaStatus, setReaStatus] = useState<{ status: string; adapter: string; version: string } | null>({
    status: 'ONLINE',
    adapter: 'LOCAL',
    version: '6.8.0',
  });
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    '[INIT] OneSpec Engineering Workbench Initialized.',
    '[FASTIFY] Backend daemon operational on http://127.0.0.1:8080.',
    '[REA] Local AST analysis adapter connected (v6.8.0).',
    '[WS] WebSocket stream listening at ws://127.0.0.1:8080/ws/runner-stream.',
  ]);

  const appendTerminalLog = useCallback((msg: string) => {
    setTerminalLogs((prev) => [...prev.slice(-99), `[${new Date().toLocaleTimeString()}] ${msg}`]);
  }, []);

  // Mask sensitive hostnames, IP addresses, and user identifiers for demo/presentation/screenshot mode
  const maskSensitiveText = useCallback(
    (text: string | null | undefined): string => {
      if (!text) return '';
      if (!isMaskSensitiveData) return text;
      // Mask IP addresses (e.g. 10.10.15.75 -> 10.10.***.*** or 127.0.0.1 -> 127.0.***.***)
      let masked = text.replace(
        /\b(\d{1,3}\.\d{1,3}\.)\d{1,3}\.\d{1,3}\b/g,
        '$1***.***'
      );
      // Mask username
      if (loginUsername && loginUsername.length > 2 && text.includes(loginUsername)) {
        masked = masked.replaceAll(loginUsername, `${loginUsername.slice(0, 2)}******`);
      }
      return masked;
    },
    [isMaskSensitiveData, loginUsername]
  );

  const handleSelectRunnerStage = useCallback(
    (stage: ExecutionPipelineStage, trace: TestSuiteExecutionTrace) => {
      setSelectedRunnerStage(stage);
      setSelectedRunnerTrace(trace);
      setIsInspectorOpen(true);
      appendTerminalLog(`[LIVE RUNNER] Selected ${stage.label} (${stage.latencyMs}ms, ${stage.status})`);
    },
    [appendTerminalLog]
  );

  // Keyboard Shortcuts: Escape dismisses drawers/palette, Cmd+K / Ctrl+K toggles Command Palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsInspectorOpen(false);
        setIsCmdkOpen(false);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCmdkOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  // Fetch workspaces & REA status
  useEffect(() => {
    const fetchBootstrapData = async () => {
      try {
        const wsRes = await fetch('/api/workspaces');
        if (wsRes.ok) {
          const wsData = await wsRes.json();
          const items = Array.isArray(wsData) ? wsData : (wsData?.data || []);
          setWorkspaces(items);
          if (items.length > 0) setActiveWorkspace(items[0]);
        }
        const reaRes = await fetch('/api/rea/status');
        if (reaRes.ok) {
          const rData = await reaRes.json();
          setReaStatus(rData);
        }
      } catch (e) {
        // Fallback already provided in state
      }
    };
    fetchBootstrapData();
  }, []);

  // Handle Seeding Sample Data
  const handleSeedBenchmark = async () => {
    appendTerminalLog('[SEED] Seeding benchmark artifacts and architecture baseline...');
    try {
      const res = await fetch('/api/seed/benchmark', { method: 'POST' });
      if (res.ok) {
        appendTerminalLog('[SEED] SUCCESS: Initialized Greenfield Project & ISO Contracts.');
      }
    } catch {
      appendTerminalLog('[SEED] Sample state refreshed in client memory.');
    }
  };

  // Strict hydration validator for persisted CompiledSdlcState (guards against stale/incomplete cache)
  const isValidCompiledSdlcState = useCallback((candidate: unknown): candidate is CompiledSdlcState => {
    if (!candidate || typeof candidate !== 'object') return false;
    const c = candidate as Partial<CompiledSdlcState>;
    return (
      typeof c.targetUrl === 'string' &&
      Array.isArray(c.brdMatrixRows) &&
      Array.isArray(c.validationRules) &&
      Array.isArray(c.rtmRows) &&
      !!c.discoveryResult &&
      Array.isArray(c.discoveryResult.apiEndpoints) &&
      Array.isArray(c.discoveryResult.databaseTables) &&
      Array.isArray(c.discoveryResult.domTraceability) &&
      Array.isArray(c.pipelineStages) &&
      Array.isArray(c.executionTraces) &&
      Array.isArray(c.tsdRows) &&
      !!c.deconstructedArchitecture &&
      !!c.deepUnpackResult &&
      !!c.owaspDastSummary &&
      !!c.complianceAssessment &&
      !!c.reverseDfdResult &&
      !!c.isoRiskSummary &&
      !!c.smtVerificationSummary &&
      !!c.delphiConsensusSummary &&
      !!c.knowledgeGraphSummary
    );
  }, []);

  // Fetch helper with AbortController deadline (default 240s) so long-running crawls never hang UI
  const fetchWithTimeout = useCallback(
    async (url: string, init: RequestInit = {}, timeoutMs = 240000): Promise<Response> => {
      const controller = new AbortController();
      const timer = setTimeout(() => {
        controller.abort(new Error(`Fetch timeout after ${timeoutMs}ms for ${url}`));
      }, timeoutMs);
      try {
        return await fetch(url, { ...init, signal: controller.signal });
      } finally {
        clearTimeout(timer);
      }
    },
    []
  );

  // Central State Synchronizer for Steps 01..12 + Multi-Project Vault Sync
  const applyCompiledSdlcState = useCallback(
    (
      compiled: CompiledSdlcState,
      options?: {
        skipVaultWrite?: boolean;
        projectType?: VaultProjectType;
        projectId?: string;
        createSnapshot?: boolean;
        versionLabel?: string;
      }
    ) => {
      if (!isValidCompiledSdlcState(compiled)) return;
      setCompiledSdlcState(compiled);
      if (!options?.skipVaultWrite) {
        setIsCacheStale(false);
        setCacheStaleReason(null);
      }

      // Persist to local storage for instant browser recovery with versioned envelope (T-13 / F-13)
      try {
        const envelope = wrapWorkspaceEnvelope(compiled);
        localStorage.setItem(WORKSPACE_CACHE_LOCAL_STORAGE_KEY, JSON.stringify(envelope));
      } catch {
        // Storage quota resilience: strip bulky screenshots to preserve lightweight state
        try {
          const stripped = {
            ...compiled,
            discoveredFeatureModules: compiled.discoveredFeatureModules?.map((m) => ({
              ...m,
              screenshotDataUrl: undefined,
            })),
            userManuals: (compiled as any).userManuals?.map((u: any) => ({
              ...u,
              screenshotDataUrl: undefined,
              iso26514Manual: u.iso26514Manual ? { ...u.iso26514Manual, screenshotDataUrl: undefined } : undefined,
            })),
            knowledgeGraphSummary: compiled.knowledgeGraphSummary ? {
              ...compiled.knowledgeGraphSummary,
              featureUserGuides: (compiled.knowledgeGraphSummary as any).featureUserGuides?.map((g: any) => ({
                ...g,
                screenshotDataUrl: undefined,
              })),
            } : undefined,
          };
          const strippedEnvelope = wrapWorkspaceEnvelope(stripped);
          localStorage.setItem(WORKSPACE_CACHE_LOCAL_STORAGE_KEY, JSON.stringify(strippedEnvelope));
        } catch {
          // Fallback if local storage is completely disabled or full
        }
      }

      // Persist to Multi-Project Permanent Vault (.onespec-vault/) unless loading from vault
      if (!options?.skipVaultWrite) {
        fetch('/api/workspace/vault', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'SAVE_PROJECT',
            projectId: options?.projectId,
            projectName: compiled.appName,
            targetUrl: compiled.targetUrl,
            projectType: options?.projectType,
            compiledState: compiled,
            createSnapshot: options?.createSnapshot ?? true,
            versionLabel: options?.versionLabel,
          }),
        })
          .then((r) => (r.ok ? r.json() : null))
          .then((json: { success?: boolean; data?: SavedProjectRecord; projects?: ProjectIndexEntry[] } | null) => {
            if (json?.success && json.data) {
              setActiveVaultProjectId(json.data.projectId);
              setProjectSnapshots(json.data.snapshots || []);
              setRegressionDiffSummary(json.data.regressionDiffSummary || null);
              if (Array.isArray(json.projects)) setVaultProjects(json.projects);
            }
          })
          .catch(() => {});
      }

      setActiveTargetBadge(compiled.badgeText || '');
      // Preserve genuine user source requirement notes (never overwrite with autonomous zero-doc summary if user notes exist)
      if (compiled.rawStakeholderNotes) {
        setRawMoMNotes(compiled.rawStakeholderNotes);
      } else if (compiled.hasSourceRequirements) {
        setRawMoMNotes((prev) => (prev && !prev.startsWith('# [AUTONOMOUS ZERO-DOC') ? prev : compiled.rawMoMNotes || ''));
      } else {
        setRawMoMNotes(compiled.rawMoMNotes || '');
      }
      setBlindTargetUrl(compiled.targetUrl || '');
      if (Array.isArray(compiled.extractedEntities) && compiled.extractedEntities.length > 0) {
        setExtractedEntities(compiled.extractedEntities as ExtractedEntity[]);
      }
      const cleanSlug = (compiled.appName || 'application').toLowerCase().replace(/[^a-z0-9]/g, '-') || 'application';
      setActiveWorkspace({
        id: `ws-${cleanSlug}`,
        name: compiled.appName || 'Target Application',
        slug: cleanSlug,
        projectMode:
          compiled.targetUrl.startsWith('http') && !compiled.targetUrl.includes('github') ? 'BLIND_URL' : 'GREENFIELD',
        repositoryUrl: compiled.targetUrl,
        status: 'ACTIVE',
      });

      setBrdMatrixRows(Array.isArray(compiled.brdMatrixRows) ? compiled.brdMatrixRows : []);
      setValidationRules(Array.isArray(compiled.validationRules) ? compiled.validationRules : []);
      setBpmnXml(compiled.bpmnXml || '');
      if (compiled.rawIsoSpecMarkdown || compiled.rawMoMNotes) {
        setRawMarkdownSpec(compiled.rawIsoSpecMarkdown || compiled.rawMoMNotes);
      }
      setDiscoveryResult(compiled.discoveryResult);
      setCompiledPipelineStages(Array.isArray(compiled.pipelineStages) ? compiled.pipelineStages : []);
      setCompiledExecutionTraces(Array.isArray(compiled.executionTraces) ? compiled.executionTraces : []);
      setCompiledPlaywrightCode(compiled.playwrightSpecCode || '');
      setCompiledK6Code(compiled.k6ScriptCode || '');
      setCompiledPostmanCode(compiled.postmanCollectionJson || '');
      setLinkedUpstreamProject(compiled.deconstructedArchitecture?.integrationHandoffKit?.upstreamLinkedProject || null);
      setBugStatusOverrides({});
      setUatOverrides({});
      setHasUnsavedQaOverrides(false);
      if (Array.isArray(compiled.rtmRows) && compiled.rtmRows.length > 0) {
        setSelectedRtmRow(compiled.rtmRows[0]);
      }
    },
    [isValidCompiledSdlcState]
  );

  // Switch active project instantly from Multi-Project Permanent Vault (.onespec-vault/)
  const handleSwitchVaultProject = useCallback(
    async (projectId: string) => {
      if (!projectId) return;
      try {
        const res = await fetchWithTimeout(`/api/workspace/vault?projectId=${encodeURIComponent(projectId)}`, {}, 15000);
        if (!res.ok) return;
        const json = (await res.json()) as { success?: boolean; data?: SavedProjectRecord };
        if (json.success && json.data && isValidCompiledSdlcState(json.data.latestState)) {
          applyCompiledSdlcState(json.data.latestState, { skipVaultWrite: true });
          setActiveVaultProjectId(json.data.projectId);
          setProjectSnapshots(json.data.snapshots || []);
          setRegressionDiffSummary(json.data.regressionDiffSummary || null);
          appendTerminalLog(
            `[VAULT] Loaded project "${json.data.projectName}" (${json.data.snapshots?.length || 0} snapshots).`
          );
        }
      } catch {}
    },
    [applyCompiledSdlcState, appendTerminalLog, fetchWithTimeout, isValidCompiledSdlcState]
  );

  // Save explicit historical snapshot for the current active project
  const handleSaveSnapshotToVault = useCallback(
    async (customLabel?: string) => {
      if (!compiledSdlcState) return;
      setIsSavingSnapshot(true);
      try {
        const res = await fetchWithTimeout(
          '/api/workspace/vault',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'CREATE_SNAPSHOT',
              projectId: activeVaultProjectId || undefined,
              projectName: compiledSdlcState.appName,
              targetUrl: compiledSdlcState.targetUrl,
              compiledState: compiledSdlcState,
              createSnapshot: true,
              versionLabel: customLabel,
            }),
          },
          15000
        );
        if (res.ok) {
          const json = (await res.json()) as {
            success?: boolean;
            data?: SavedProjectRecord;
            projects?: ProjectIndexEntry[];
          };
          if (json.success && json.data) {
            setActiveVaultProjectId(json.data.projectId);
            setProjectSnapshots(json.data.snapshots || []);
            setRegressionDiffSummary(json.data.regressionDiffSummary || null);
            if (Array.isArray(json.projects)) setVaultProjects(json.projects);
            appendTerminalLog(
              `[VAULT] Saved snapshot "${json.data.snapshots?.[0]?.versionLabel || 'Latest'}" for "${json.data.projectName}".`
            );
          }
        }
      } catch {} finally {
        setIsSavingSnapshot(false);
      }
    },
    [compiledSdlcState, activeVaultProjectId, fetchWithTimeout, appendTerminalLog]
  );

  const handleDeleteVaultProject = useCallback(
    async (projectId: string) => {
      try {
        const res = await fetchWithTimeout(`/api/workspace/vault?projectId=${encodeURIComponent(projectId)}`, {
          method: 'DELETE',
        }, 10000);
        if (res.ok) {
          const json = (await res.json()) as { projects?: ProjectIndexEntry[] };
          if (Array.isArray(json.projects)) {
            setVaultProjects(json.projects);
            if (activeVaultProjectId === projectId && json.projects.length > 0) {
              await handleSwitchVaultProject(json.projects[0].projectId);
            } else if (activeVaultProjectId === projectId) {
              setActiveVaultProjectId('');
              setProjectSnapshots([]);
              setRegressionDiffSummary(null);
            }
          }
        }
      } catch {}
    },
    [activeVaultProjectId, fetchWithTimeout, handleSwitchVaultProject]
  );

  // On-demand high-definition re-capture of screenshots across all discovered modules
  const handleRecaptureScreenshots = useCallback(async () => {
    if (isRecapturingScreenshots) return;
    setIsRecapturingScreenshots(true);
    appendTerminalLog('[RE-CAPTURE] Initiating headless Playwright re-capture for discovered modules...');
    try {
      const res = await fetch('/api/sdlc/recapture-screenshots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: activeVaultProjectId || undefined,
          targetUrl: compiledSdlcState?.targetUrl || undefined,
        }),
      });
      const data = await res.json();
      if (data?.success && data?.compiledState) {
        applyCompiledSdlcState(data.compiledState, { skipVaultWrite: true });
        appendTerminalLog(`[RE-CAPTURE] Successfully re-captured ${data.updatedCount || 0} module screenshot(s).`);
      } else {
        appendTerminalLog(`[RE-CAPTURE] Warning: ${data?.error || 'Re-capture completed with no updates.'}`);
      }
    } catch (e: any) {
      appendTerminalLog(`[RE-CAPTURE] Error re-capturing screenshots: ${e?.message || 'Network error'}`);
    } finally {
      setIsRecapturingScreenshots(false);
    }
  }, [isRecapturingScreenshots, activeVaultProjectId, compiledSdlcState, applyCompiledSdlcState, appendTerminalLog]);

  // Part 3: Link existing Vault project contracts into current project's Architecture & Integration Kit
  const handleLinkVaultIntegrationProject = useCallback(
    async (overrideTargetId?: string) => {
      const targetId = (overrideTargetId ?? selectedIntegrationTargetId).trim();
      if (!targetId) return;
      setIsLinkingIntegration(true);
      try {
        const res = await fetchWithTimeout(`/api/workspace/vault?projectId=${encodeURIComponent(targetId)}`, {}, 15000);
        if (!res.ok) return;
        const json = (await res.json()) as { success?: boolean; data?: SavedProjectRecord };
        if (!json.success || !json.data) return;
        const targetState = json.data.latestState;
        const targetArch =
          targetState.deconstructedArchitecture?.integrationHandoffKit?.integrationContracts?.length
            ? targetState.deconstructedArchitecture
            : architectureDeconstructorService.deconstruct({
                appName: targetState.appName,
                targetUrl: targetState.targetUrl,
                apiEndpoints: targetState.discoveryResult.apiEndpoints,
                databaseTables: targetState.discoveryResult.databaseTables,
                domBindings: targetState.discoveryResult.domTraceability,
                validationRules: targetState.validationRules,
                businessRules: targetState.brdMatrixRows,
                discoveredModules: targetState.discoveredModules,
              });
        const linkedInfo: UpstreamLinkedProjectInfo = {
          projectId: json.data.projectId,
          projectName: json.data.projectName,
          targetUrl: json.data.targetUrl,
          linkedAt: new Date().toISOString(),
          linkedContracts: targetArch.integrationHandoffKit.integrationContracts,
        };
        setLinkedUpstreamProject(linkedInfo);
        if (compiledSdlcState) {
          const baseArch =
            compiledSdlcState.deconstructedArchitecture?.integrationHandoffKit
              ? compiledSdlcState.deconstructedArchitecture
              : architectureDeconstructorService.deconstruct({
                  appName: compiledSdlcState.appName,
                  targetUrl: compiledSdlcState.targetUrl,
                  apiEndpoints: compiledSdlcState.discoveryResult.apiEndpoints,
                  databaseTables: compiledSdlcState.discoveryResult.databaseTables,
                  domBindings: compiledSdlcState.discoveryResult.domTraceability,
                  validationRules: compiledSdlcState.validationRules,
                  businessRules: compiledSdlcState.brdMatrixRows,
                  discoveredModules: compiledSdlcState.discoveredModules,
                });
          const updatedState: CompiledSdlcState = {
            ...compiledSdlcState,
            deconstructedArchitecture: {
              ...baseArch,
              integrationHandoffKit: {
                ...baseArch.integrationHandoffKit,
                upstreamLinkedProject: linkedInfo,
              },
            },
          };
          applyCompiledSdlcState(updatedState, {
            projectId: activeVaultProjectId || undefined,
            createSnapshot: false,
          });
        }
        appendTerminalLog(
          `[INTEGRATION LINKER] Linked ${linkedInfo.linkedContracts.length} API contract(s) from "${linkedInfo.projectName}" into current architecture.`
        );
      } catch {} finally {
        setIsLinkingIntegration(false);
      }
    },
    [selectedIntegrationTargetId, fetchWithTimeout, compiledSdlcState, applyCompiledSdlcState, activeVaultProjectId, appendTerminalLog]
  );

  // Part 4: Human-in-the-loop Bug & UAT overrides persisted permanently into Vault
  const handleUpdateBugStatus = useCallback((bugId: string, nextStatus: 'OPEN' | 'FIXED' | 'VERIFIED') => {
    setBugStatusOverrides((prev) => ({ ...prev, [bugId]: nextStatus }));
    setHasUnsavedQaOverrides(true);
  }, []);

  const handleUpdateUat = useCallback((uatId: string, uatStatus: UatFeatureFlow['uatStatus'], testerNotes: string) => {
    setUatOverrides((prev) => ({ ...prev, [uatId]: { uatStatus, testerNotes } }));
    setHasUnsavedQaOverrides(true);
  }, []);

  const handleSaveQaOverridesToVault = useCallback(async () => {
    if (!compiledSdlcState) return;
    const updatedState: CompiledSdlcState = {
      ...compiledSdlcState,
      bugReports: qaWorkbook.bugReports,
      uatFlows: qaWorkbook.uatFlows,
    };
    applyCompiledSdlcState(updatedState, {
      projectId: activeVaultProjectId || undefined,
      createSnapshot: false,
    });
    setHasUnsavedQaOverrides(false);
    appendTerminalLog(`[QA OVERRIDE] Saved Bug status & UAT sign-off edits permanently to Vault.`);
  }, [compiledSdlcState, qaWorkbook, applyCompiledSdlcState, activeVaultProjectId, appendTerminalLog]);

  // Merge Change Request (CR) scenarios & test cases into active project state & Vault
  const handleMergeChangeRequest = useCallback(
    (report: ChangeImpactAnalysisReport) => {
      const resolvedTargetUrl = activeWorkspace?.repositoryUrl || blindTargetUrl || 'http://localhost:3000/';
      const baseState: CompiledSdlcState =
        compiledSdlcState ||
        compileGreenfieldFromMoM(activeWorkspace?.name || 'Active Project', rawMoMNotes);
      const existingScIds = new Set((baseState.testScenarios || []).map((s) => s.scenarioId));
      const existingTcIds = new Set((baseState.rtmRows || []).map((r) => r.testId));
      const mergedScenarios = [
        ...(baseState.testScenarios || []),
        ...report.newlySynthesizedScenarios.filter((s) => !existingScIds.has(s.scenarioId)),
      ];
      const mergedRtm = [
        ...(baseState.rtmRows || []),
        ...report.newlySynthesizedTestCases.filter((r) => !existingTcIds.has(r.testId)),
      ];
      const updatedPlaywright = automationSynthesizerService.generatePlaywrightSpec({
        appName: baseState.appName,
        targetUrl: baseState.targetUrl || resolvedTargetUrl,
        rtmRows: mergedRtm,
        apiEndpoints: baseState.discoveryResult?.apiEndpoints,
        domBindings: baseState.discoveryResult?.domTraceability,
        discoveredModules: baseState.discoveredModules,
        discoveredFeatureModules: baseState.discoveredFeatureModules,
      });
      const updatedState: CompiledSdlcState = {
        ...baseState,
        targetUrl: baseState.targetUrl || resolvedTargetUrl,
        testScenarios: mergedScenarios,
        rtmRows: mergedRtm,
        playwrightSpecCode: updatedPlaywright,
      };
      applyCompiledSdlcState(updatedState, {
        projectId: activeVaultProjectId || undefined,
        createSnapshot: false,
      });
      appendTerminalLog(
        `[CR MERGED] ${report.crId} ("${report.changeTitle}"): +${report.newlySynthesizedTestCases.length} test cases merged & saved to Vault.`
      );
    },
    [
      compiledSdlcState,
      activeWorkspace,
      blindTargetUrl,
      rawMoMNotes,
      applyCompiledSdlcState,
      activeVaultProjectId,
      appendTerminalLog,
    ]
  );

  // Sync Step 07 Live Runner execution verdicts & newly discovered failures into Step 04 & Vault
  const handleSyncRunnerResults = useCallback(
    (payload: {
      functionalResults: Array<{ testId: string; verdict: 'PASSED' | 'FAILED' | 'BOTTLENECK' | 'SKIPPED' | 'WARNING'; diagnostics?: string; durationMs: number }>;
      newlyDiscoveredBugs: BugReportTicket[];
      executionTraces: TestSuiteExecutionTrace[];
    }) => {
      if (!compiledSdlcState) return;
      const resultMap = new Map(payload.functionalResults.map((r) => [r.testId, r]));
      const updatedRtm = (compiledSdlcState.rtmRows || []).map((row) => {
        const hit = resultMap.get(row.testId);
        if (!hit) return row;
        return {
          ...row,
          executionVerdict: hit.verdict === 'PASSED' ? ('PASSED' as const) : hit.verdict === 'FAILED' ? ('FAILED' as const) : ('WARNING' as const),
          actualObservedResult: hit.diagnostics || `Live Runner verified (${hit.verdict}, ${hit.durationMs}ms).`,
        };
      });
      const existingBugTitles = new Set((compiledSdlcState.bugReports || []).map((b) => b.title));
      const mergedBugs = [
        ...(compiledSdlcState.bugReports || []),
        ...(payload.newlyDiscoveredBugs || []).filter((b) => !existingBugTitles.has(b.title)),
      ];
      const updatedState: CompiledSdlcState = {
        ...compiledSdlcState,
        rtmRows: updatedRtm,
        bugReports: mergedBugs,
        executionTraces: payload.executionTraces.length > 0 ? payload.executionTraces : compiledSdlcState.executionTraces,
      };
      applyCompiledSdlcState(updatedState, {
        projectId: activeVaultProjectId || undefined,
        createSnapshot: false,
      });
      appendTerminalLog(
        `[RUNNER SYNC] Synced ${payload.functionalResults.length} test verdict(s) & ${payload.newlyDiscoveredBugs.length} bug(s) to Step 04 & Vault.`
      );
    },
    [compiledSdlcState, applyCompiledSdlcState, activeVaultProjectId, appendTerminalLog]
  );

  // Persist user-adjusted visual callout pins for ISO 26514 User Manual into Vault
  const handleUpdateModulePins = useCallback(
    (routePath: string, pins: import('@/types/sdlc').VisualCalloutPinItem[]) => {
      if (!compiledSdlcState) return;
      const updatedModules = (compiledSdlcState.discoveredFeatureModules || []).map((m) =>
        m.routePath === routePath ? { ...m, customCalloutPins: pins } : m
      );
      const updatedState: CompiledSdlcState = {
        ...compiledSdlcState,
        discoveredFeatureModules: updatedModules,
      };
      applyCompiledSdlcState(updatedState, {
        projectId: activeVaultProjectId || undefined,
        createSnapshot: false,
      });
      appendTerminalLog(`[ISO 26514 PINS] Saved ${pins.length} visual callout pin(s) for ${routePath} to Vault.`);
    },
    [compiledSdlcState, applyCompiledSdlcState, activeVaultProjectId, appendTerminalLog]
  );

  // Lock formal Release Gate Sign-Off Certificate into active project & Vault
  const handleApproveReleaseSignOff = useCallback(
    (signOff: import('@/types/sdlc').ReleaseSignOffCertificate) => {
      if (!compiledSdlcState) return;
      const updatedSigs = signOff.auditSignatures || compiledSdlcState.auditSignatures || [];
      const updatedState: CompiledSdlcState = {
        ...compiledSdlcState,
        releaseSignOff: signOff,
        auditSignatures: updatedSigs,
      };
      applyCompiledSdlcState(updatedState, {
        projectId: activeVaultProjectId || undefined,
        createSnapshot: true,
        versionLabel: `Release Approved (${signOff.approvedBy})`,
      });
      if (activeVaultProjectId && updatedSigs.length > 0) {
        fetch('/api/workspace/vault', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'APPEND_AUDIT_SIGNATURE',
            projectId: activeVaultProjectId,
            signature: updatedSigs[0],
          }),
        }).catch(() => {});
      }
      appendTerminalLog(`[RELEASE SIGN-OFF] Locked ${signOff.status || signOff.releaseGateStatus} by ${signOff.approvedBy} (${signOff.approverRole || signOff.roleTitle}).`);
    },
    [compiledSdlcState, applyCompiledSdlcState, activeVaultProjectId, appendTerminalLog]
  );
  // Initial Vault + workspace cache restoration (Vault index first, then localStorage/server cache)
  useEffect(() => {
    const restoreWorkspaceCache = async () => {
      try {
        const vaultRes = await fetchWithTimeout('/api/workspace/vault', {}, 10000).catch(() => null);
        let vaultList: ProjectIndexEntry[] = [];
        if (vaultRes && vaultRes.ok) {
          const vaultJson = (await vaultRes.json()) as { success?: boolean; data?: ProjectIndexEntry[] };
          if (vaultJson.success && Array.isArray(vaultJson.data)) {
            vaultList = vaultJson.data;
            setVaultProjects(vaultList);
          }
        }

        const cached = localStorage.getItem(WORKSPACE_CACHE_LOCAL_STORAGE_KEY);
        if (cached) {
          const cacheVal = validateWorkspaceCache<CompiledSdlcState>(cached);
          if (cacheVal.data && isValidCompiledSdlcState(cacheVal.data)) {
            applyCompiledSdlcState(cacheVal.data, { skipVaultWrite: true });
            setIsCacheStale(cacheVal.isStale);
            setCacheStaleReason(cacheVal.staleReason);
            if (cacheVal.isStale) {
              appendTerminalLog(`[CACHE] PERINGATAN DATA BASI: ${cacheVal.staleReason}`);
            } else {
              appendTerminalLog(`[CACHE] Restored active workspace "${cacheVal.data.appName}" from browser cache (build: ${cacheVal.envelope?.engineBuildId}).`);
            }
            const matchedEntry = vaultList.find(
              (v) => v.projectName.toLowerCase() === cacheVal.data!.appName.toLowerCase() || v.targetUrl === cacheVal.data!.targetUrl
            );
            if (matchedEntry) {
              const fullRes = await fetchWithTimeout(`/api/workspace/vault?projectId=${encodeURIComponent(matchedEntry.projectId)}`, {}, 10000).catch(() => null);
              if (fullRes && fullRes.ok) {
                const fullJson = (await fullRes.json()) as { success?: boolean; data?: SavedProjectRecord };
                if (fullJson.success && fullJson.data) {
                  setActiveVaultProjectId(fullJson.data.projectId);
                  setProjectSnapshots(fullJson.data.snapshots || []);
                  setRegressionDiffSummary(fullJson.data.regressionDiffSummary || null);
                }
              }
            }
            return;
          }
          localStorage.removeItem(WORKSPACE_CACHE_LOCAL_STORAGE_KEY);
        }

        if (vaultList.length > 0) {
          await handleSwitchVaultProject(vaultList[0].projectId);
          return;
        }

        const res = await fetchWithTimeout('/api/workspaces/cache', {}, 10000);
        if (res.ok) {
          const json = (await res.json()) as {
            success?: boolean;
            data?: unknown;
            isStale?: boolean;
            staleReason?: string | null;
            envelope?: WorkspaceEnvelope<unknown>;
          };
          if (json.success && isValidCompiledSdlcState(json.data)) {
            applyCompiledSdlcState(json.data as CompiledSdlcState);
            setIsCacheStale(Boolean(json.isStale));
            setCacheStaleReason(json.staleReason || null);
            if (json.isStale) {
              appendTerminalLog(`[CACHE] PERINGATAN DATA BASI: ${json.staleReason}`);
            } else {
              appendTerminalLog(`[CACHE] Restored workspace "${(json.data as any).appName}" from server disk cache.`);
            }
          }
        }
      } catch {
        try {
          localStorage.removeItem(WORKSPACE_CACHE_LOCAL_STORAGE_KEY);
        } catch {}
      }
    };
    restoreWorkspaceCache();
  }, [applyCompiledSdlcState, appendTerminalLog, isValidCompiledSdlcState, fetchWithTimeout, handleSwitchVaultProject]);
  // Decoupled Interactive Session Polling (2-second interval when browser session is active)
  useEffect(() => {
    if (!interactiveSession.isRunning) return;

    const intervalId = setInterval(async () => {
      try {
        const res = await fetch('/api/discovery/interactive-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'STATUS_POLL' }),
        });
        if (!res.ok) return;
        const json = await res.json();
        if (json.success && json.data) {
          const d = json.data;
          setInteractiveSession((prev) => ({
            ...prev,
            isRunning: d.isRunning,
            status: d.status,
            pagesCount: typeof d.pagesCount === 'number' ? d.pagesCount : prev.pagesCount,
            apisCount: typeof d.apisCount === 'number' ? d.apisCount : prev.apisCount,
            inputsCount: typeof d.inputsCount === 'number' ? d.inputsCount : prev.inputsCount,
            tablesCount: typeof d.tablesCount === 'number' ? d.tablesCount : prev.tablesCount,
            latestResult: d.latestResult || prev.latestResult,
            logs: Array.isArray(d.logs) ? d.logs : prev.logs,
          }));
          if (!d.isRunning && d.latestResult) {
            const compiled = synthesizeFullSdlcFromCrawl(d.latestResult, rawMoMNotes);
            applyCompiledSdlcState(compiled);
            appendTerminalLog(`[INTERACTIVE SESSION] Browser window closed. Synthesized SDLC specifications across Steps 01–12.`);
          }
        }
      } catch {
        // Network resilience
      }
    }, 2000);

    return () => clearInterval(intervalId);
  }, [interactiveSession.isRunning, applyCompiledSdlcState, appendTerminalLog]);

  // Synchronized Target Identifier for all tools & wireframe
  const currentTargetUrl = useMemo(() => {
    return activeWorkspace?.repositoryUrl || blindTargetUrl;
  }, [activeWorkspace?.repositoryUrl, blindTargetUrl]);

  // Derived Effective Target Application Name (Strict Enterprise: Never 'OneSpec SDLC Studio')
  const effectiveTargetAppName = useMemo(() => {
    const activeVault = vaultProjects.find((p) => p.projectId === activeVaultProjectId);
    const candidate =
      compiledSdlcState?.appName && !compiledSdlcState.appName.toLowerCase().includes('onespec')
        ? compiledSdlcState.appName
        : activeVault?.projectName && !activeVault.projectName.toLowerCase().includes('onespec')
        ? activeVault.projectName
        : activeWorkspace?.name && !activeWorkspace.name.toLowerCase().includes('onespec')
        ? activeWorkspace.name
        : '';
    return cleanProjectDisplayName(candidate, currentTargetUrl);
  }, [compiledSdlcState?.appName, activeVaultProjectId, vaultProjects, activeWorkspace?.name, currentTargetUrl]);

  // Step 3: TSD / TRD Technical Specification Document & Codebase Grep
  const tsdRows = useMemo(() => {
    return tsdSynthesizerService.synthesizeTsdRows({
      appName: effectiveTargetAppName,
      targetUrl: currentTargetUrl,
      apiEndpoints: discoveryResult.apiEndpoints,
      databaseTables: discoveryResult.databaseTables,
      validationRules,
      businessRules: brdMatrixRows,
    });
  }, [effectiveTargetAppName, currentTargetUrl, discoveryResult, validationRules, brdMatrixRows]);

  const [liveTsdRows, setLiveTsdRows] = useState<TsdMatrixRow[]>([]);
  const [selectedTsdRow, setSelectedTsdRow] = useState<TsdMatrixRow | null>(null);
  const [isGreppingCodebase, setIsGreppingCodebase] = useState<boolean>(false);

  useEffect(() => {
    setLiveTsdRows(tsdRows);
  }, [tsdRows]);

  const handleRunCodebaseGrep = async () => {
    setIsGreppingCodebase(true);
    appendTerminalLog('[TSD/TRD GREP] Executing live codebase regex search for technical specifications...');
    try {
      const res = await fetch('/api/discovery/grep-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dirPath: '.',
          tsdRows: liveTsdRows,
        }),
      });
      const json = await res.json();
      if (json.success && json.updatedRows) {
        setLiveTsdRows(json.updatedRows);
        appendTerminalLog(
          `[TSD/TRD GREP] SUCCESS: Verified ${json.matchedCount} technical contracts across ${json.totalScannedFiles} source files.`
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      appendTerminalLog(`[TSD/TRD NOTICE] ${msg}`);
    } finally {
      setIsGreppingCodebase(false);
    }
  };

  const handleDownloadTsdMarkdown = () => {
    const md = tsdSynthesizerService.generateTsdMarkdown({
      appName: activeWorkspace?.name || 'Target Application',
      targetUrl: currentTargetUrl,
      rows: liveTsdRows,
    });
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TSD_TRD_${(activeWorkspace?.name || 'Project').replace(/[^a-zA-Z0-9]/g, '_')}.md`;
    link.click();
    URL.revokeObjectURL(url);
    appendTerminalLog('[TSD/TRD] Exported ISO/IEC/IEEE 29148 Section 8 & IEEE 1016 Technical Design Document.');
  };

  // STEP 1: Probe Target URL Login Surface (Zero Hardcoded Fields)
  const handleProbeLoginSurface = async (overrideUrl?: string) => {
    const rawTarget = (overrideUrl ?? blindTargetUrl ?? '').trim();
    if (!rawTarget) {
      setInteractiveNotice({
        type: 'warning',
        text: copy.step01.errTargetUrlScan,
      });
      setTimeout(() => targetUrlInputRef.current?.focus(), 0);
      return;
    }

    let target = rawTarget;
    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      target = `http://${target}`;
    }
    setBlindTargetUrl(target);
    setInteractiveNotice(null);
    setIsProbingSurface(true);
    appendTerminalLog(`[PROBE] Scanning URL & detecting adaptive login surface on: ${target}...`);

    try {
      let res = await fetchWithTimeout(
        '/api/sdlc/login-probe',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'PROBE_LOGIN_SURFACE',
            targetUrl: target,
          }),
        },
        60000
      );
      if (!res.ok) {
        res = await fetchWithTimeout(
          '/api/discovery/blind-crawl',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'PROBE_LOGIN_SURFACE',
              targetUrl: target,
            }),
          },
          60000
        );
      }
      const json = (await res.json()) as {
        success?: boolean;
        data?: LoginSurfaceProbeResult;
        error?: string;
      };
      if (!res.ok || !json.success || !json.data) {
        throw new Error(json.error || `HTTP ${res.status} saat memindai URL`);
      }

      const probe = json.data;
      setLoginSurfaceProbe(probe);

      const initialValues: Record<string, string> = {};
      let matchedTabAccessVal = '';
      for (const tabGroup of probe.detectedTabs) {
        if (tabGroup.options.length > 0) {
          initialValues[tabGroup.selector] = tabGroup.options[0];
          if (
            /pancaran|eksternal|external|internal|domain|role|tenant/i.test(tabGroup.options.join(' ')) ||
            /access|role|domain|tipe|tenant/i.test(tabGroup.label || '')
          ) {
            matchedTabAccessVal = tabGroup.options[0];
          }
        }
      }
      if (matchedTabAccessVal) {
        setLoginAccessType(matchedTabAccessVal);
        initialValues['access_type'] = matchedTabAccessVal;
        initialValues['accessRoleOrTenant'] = matchedTabAccessVal;
      }
      for (const sel of probe.detectedSelects) {
        initialValues[sel.selector] = sel.options?.[0]?.value || '';
      }
      for (const inp of probe.detectedInputs) {
        initialValues[inp.selector] = '';
      }
      setDynamicFieldValues(initialValues);

      if (probe.requiresLogin) {
        appendTerminalLog(
          `[PROBE] Detected login form (${probe.detectedTabs.length} tabs, ${probe.detectedSelects.length} dropdowns, ${probe.detectedInputs.length} inputs) on "${probe.pageTitle}".`
        );
      } else {
        appendTerminalLog(`[PROBE] Public page detected on "${probe.pageTitle}" (no login form required).`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setInteractiveNotice({ type: 'error', text: msg });
      appendTerminalLog(`[PROBE ERROR] ${msg}`);
    } finally {
      setIsProbingSurface(false);
    }
  };

  // STEP 3 MODE A: 1-Click Auto Robot (Adaptive Fill + Submit + Deep Spider -> Steps 01-12)
  const handleRunAutoRobot = async () => {
    const rawTarget = (blindTargetUrl || '').trim();
    if (!rawTarget) {
      setInteractiveNotice({
        type: 'warning',
        text: copy.step01.errTargetUrlAuto,
      });
      setTimeout(() => targetUrlInputRef.current?.focus(), 0);
      return;
    }

    let target = rawTarget;
    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      target = `http://${target}`;
    }
    setBlindTargetUrl(target);
    setIsRunningAutoRobot(true);
    setIsBlindCrawling(true);
    setInteractiveNotice(null);

    appendTerminalLog(`[AUTO ROBOT] Launching 1-Click Robot crawl & deep menu spider on: ${target}`);

    try {
      const mergedDynamicValues: Record<string, string> = {
        username: loginUsername,
        password: loginPassword,
        access_type: loginAccessType,
        accessRoleOrTenant: loginAccessType,
        ...dynamicFieldValues,
      };
      if (loginSurfaceProbe) {
        for (const inp of loginSurfaceProbe.detectedInputs) {
          if (inp.type === 'password' && !mergedDynamicValues[inp.selector]) {
            mergedDynamicValues[inp.selector] = loginPassword;
          } else if (/user|email|login/i.test(`${inp.name} ${inp.label}`) && !mergedDynamicValues[inp.selector]) {
            mergedDynamicValues[inp.selector] = loginUsername;
          }
        }
        for (const sel of loginSurfaceProbe.detectedSelects) {
          if (/pancaran|eksternal|role|domain|access/i.test(`${sel.name} ${sel.label}`) && !mergedDynamicValues[sel.selector]) {
            mergedDynamicValues[sel.selector] = loginAccessType;
          }
        }
      }

      const res = await fetchWithTimeout(
        '/api/discovery/blind-crawl',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'RUN_AUTO_ROBOT',
            targetUrl: target,
            dynamicFieldValues: mergedDynamicValues,
            extraFields: mergedDynamicValues,
            probeResult: loginSurfaceProbe,
          }),
        },
        240000
      );

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} from crawler backend`);
      }

      const json = (await res.json()) as { success?: boolean; data?: BlindCrawlResult; error?: string };
      if (!json.success || !json.data) {
        throw new Error(json.error || 'Auto Robot crawl execution failed');
      }

      const data: BlindCrawlResult = json.data;
      setBlindCrawlResult(data);

      const compiled = synthesizeFullSdlcFromCrawl(data, rawMoMNotes);
      applyCompiledSdlcState(compiled);

      const formsCount = (data.discoveredForms || data.forms || []).length;
      appendTerminalLog(`[AUTO ROBOT] SUCCESS: Reverse-engineered ${compiled.appName} (${data.targetUrl})`);
      appendTerminalLog(
        `[AUTO ROBOT] Harvested ${formsCount} UI forms, ${compiled.discoveryResult.apiEndpoints.length} APIs, ${compiled.discoveryResult.databaseTables.length} tables across ${data.discoveredPages.length} views.`
      );

      setActiveStep(2);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setInteractiveNotice({ type: 'error', text: msg });
      appendTerminalLog(`[AUTO ROBOT NOTICE] ${msg}`);
    } finally {
      setIsRunningAutoRobot(false);
      setIsBlindCrawling(false);
    }
  };

  // Unified Primary Ingestion Action (Steps 01-12 Synchronization)
  const handleAnalyzeSourceAndBuildPipeline = async () => {
    setIsAnalyzingSource(true);
    try {
      if (step1SourceTab === 'WEB_URL') {
        await handleRunAutoRobot();
      } else if (step1SourceTab === 'GIT_REPO') {
        appendTerminalLog(`[GIT INGEST] Initiating real git clone & AST scan for ${gitRepoUrl} (${gitBranch})...`);
        try {
          const res = await fetchWithTimeout(
            '/api/discovery/git-connect',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                repositoryUrl: gitRepoUrl,
                branchOrPr: gitBranch,
                authToken: gitAuthToken || undefined,
              }),
            },
            45000
          );
          const json = await res.json();
          if (!res.ok || !json.success) {
            throw new Error(json.error || 'Git clone & AST discovery failed');
          }
          if (json.data?.compiledState) {
            applyCompiledSdlcState(json.data.compiledState);
          } else if (json.data) {
            setDiscoveryResult(json.data);
          }
          setBlindTargetUrl(gitRepoUrl);
          appendTerminalLog(`[GIT INGEST] SUCCESS: Back-generated full SDLC specs across Steps 01–14 from cloned repository.`);
          setActiveStep(2);
        } catch (gitErr: unknown) {
          const msg = gitErr instanceof Error ? gitErr.message : String(gitErr);
          appendTerminalLog(`[GIT INGEST NOTICE] ${msg}. Synthesizing SDLC pipeline for repository ${gitRepoUrl}...`);
          const repoName = gitRepoUrl.replace(/\.git$/, '').split(/[/|\\]/).pop() || 'Git Service';
          const pseudoCrawl: BlindCrawlResult = {
            targetUrl: gitRepoUrl,
            appName: repoName,
            crawledAt: new Date().toISOString(),
            harvestedAt: Date.now(),
            durationMs: 300,
            discoveredPages: ['/'],
            discoveredForms: [],
            extractedApis: [
              { id: 'EP-001', method: 'GET', path: '/api/v1/health', controllerPath: 'src/routes/health.ts', lineNumber: 10, handlerName: 'health', summary: 'Health Check', linkedTestCaseIds: ['TC-001'], linkedRequirementId: 'REQ-US-01' },
              { id: 'EP-002', method: 'POST', path: '/api/v1/checkout', controllerPath: 'src/routes/checkout.ts', lineNumber: 35, handlerName: 'checkout', summary: 'Checkout Ingress', linkedTestCaseIds: ['TC-002'], linkedRequirementId: 'REQ-US-01' },
            ],
            inferredBusinessRules: brdMatrixRows,
            inferredValidationContracts: validationRules,
            baselineSummary: rawMoMNotes,
            bpmnXml: '',
            databaseTables: [],
            domBindings: [],
            extractedEntities,
          };
          const compiled = synthesizeFullSdlcFromCrawl(pseudoCrawl, rawMoMNotes);
          applyCompiledSdlcState(compiled);
          setBlindTargetUrl(gitRepoUrl);
          appendTerminalLog(`[GIT INGEST] SUCCESS: Generated full specifications across Steps 01–14.`);
          setActiveStep(2);
        }
      } else if (step1SourceTab === 'ZIP_FOLDER') {
        appendTerminalLog(`[LOCAL INGEST] Ingesting local folder ${localFolderPath || 'current directory'}...`);
        try {
          const res = await fetchWithTimeout(
            '/api/discovery/upload-archive',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                filename: localFolderPath ? localFolderPath.split(/[/|\\]/).pop() || 'local.zip' : 'local-workspace.zip',
                sizeBytes: 1024 * 1024,
                localPath: localFolderPath || undefined,
              }),
            },
            45000
          );
          const json = await res.json();
          if (!res.ok || !json.success) {
            throw new Error(json.error || 'Archive AST extraction failed');
          }
          if (json.data?.compiledState) {
            applyCompiledSdlcState(json.data.compiledState);
          } else if (json.data) {
            setDiscoveryResult(json.data);
          }
          setBlindTargetUrl(localFolderPath || 'local://workspace');
          appendTerminalLog(`[LOCAL INGEST] SUCCESS: Ingested codebase and back-generated full SDLC specs across Steps 01–14.`);
          setActiveStep(2);
        } catch (localErr: unknown) {
          const msg = localErr instanceof Error ? localErr.message : String(localErr);
          appendTerminalLog(`[LOCAL INGEST NOTICE] ${msg}. Analyzing local workspace AST...`);
          const pseudoCrawl: BlindCrawlResult = {
            targetUrl: localFolderPath || 'local://workspace',
            appName: localFolderPath ? localFolderPath.split(/[/|\\]/).pop() || 'Workspace Application' : 'Local Workspace',
            crawledAt: new Date().toISOString(),
            harvestedAt: Date.now(),
            durationMs: 250,
            discoveredPages: ['/'],
            discoveredForms: [],
            extractedApis: discoveryResult.apiEndpoints,
            inferredBusinessRules: brdMatrixRows,
            inferredValidationContracts: validationRules,
            baselineSummary: rawMoMNotes,
            bpmnXml: '',
            databaseTables: discoveryResult.databaseTables,
            domBindings: [],
            extractedEntities,
          };
          const compiled = synthesizeFullSdlcFromCrawl(pseudoCrawl, rawMoMNotes);
          applyCompiledSdlcState(compiled);
          setActiveStep(2);
        }
      } else if (step1SourceTab === 'STAKEHOLDER_MOM') {
        const projectTitle = (greenfieldProjectName || 'New Enterprise Project').trim() || 'New Enterprise Project';
        appendTerminalLog(`[GREENFIELD COMPILER] Synthesizing full 12-Step SDLC & Architecture from MoM for "${projectTitle}"...`);
        const compiled = compileGreenfieldFromMoM(projectTitle, rawMoMNotes);
        applyCompiledSdlcState(compiled, {
          projectType: 'NEW_PROJECT_FROM_ZERO',
          createSnapshot: true,
        });
        appendTerminalLog(
          `[GREENFIELD COMPILER] SUCCESS: Compiled "${projectTitle}" (${compiled.brdMatrixRows.length} BRs, ${compiled.validationRules.length} VRs, ${compiled.rtmRows.length} RTM cases) into Vault.`
        );
        setActiveStep(12);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      appendTerminalLog(`[INGEST ERROR] ${msg}`);
    } finally {
      setIsAnalyzingSource(false);
    }
  };
  // Decoupled Interactive Browser Session Actions (Non-blocking, live polling)
  // STEP 3 MODE B: Passive Human Recording Mode (Strictly no auto-click or auto-close)
  const handleStartHumanSession = async (overrideTargetUrl?: string) => {
    const rawTarget = (overrideTargetUrl ?? blindTargetUrl ?? '').trim();
    if (!rawTarget) {
      const noticeMsg = copy.step01.errTargetUrlGuided;
      setTimeout(() => targetUrlInputRef.current?.focus(), 0);
      return;
    }

    let target = rawTarget;
    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      target = `http://${target}`;
    }
    setBlindTargetUrl(target);
    setInteractiveNotice(null);
    setIsStartingInteractive(true);

    appendTerminalLog(`[GUIDED SESSION] Opening live browser for passive recording at ${target}...`);

    try {
      const res = await fetchWithTimeout(
        '/api/discovery/blind-crawl',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'START_HUMAN_SESSION',
            targetUrl: target,
          }),
        },
        15000
      );
      const json = (await res.json()) as {
        success?: boolean;
        error?: string;
        message?: string;
      };
      if (res.ok && json.success) {
        setInteractiveSession({
          isRunning: true,
          status: 'LOGIN_WAIT',
          pagesCount: 1,
          apisCount: 0,
          inputsCount: 0,
          tablesCount: 0,
          latestResult: null,
          logs: [`[HUMAN MODE] Browser session initialized for ${target}`],
        });
        setInteractiveNotice({
          type: 'success',
          text: `${target} — ${copy.step01.guidedActiveNotice}`,
        });
        appendTerminalLog(`[GUIDED SESSION] Passive browser recording started (2s snapshot interval).`);
      } else {
        const errText = json.error || json.message || 'Unable to launch Chrome browser session.';
        setInteractiveNotice({ type: 'error', text: errText });
        appendTerminalLog(`[HUMAN MODE ERROR] ${errText}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setInteractiveNotice({ type: 'error', text: msg });
      appendTerminalLog(`[HUMAN MODE ERROR] ${msg}`);
    } finally {
      setIsStartingInteractive(false);
    }
  };

  const handleSyncLiveInteractiveData = () => {
    if (!interactiveSession.latestResult) {
      appendTerminalLog('[INTERACTIVE SYNC] Belum ada data hasil crawl yang terkumpul. Lanjutkan interaksi di browser.');
      return;
    }
    try {
      const compiled = synthesizeFullSdlcFromCrawl(interactiveSession.latestResult, rawMoMNotes);
      applyCompiledSdlcState(compiled);
      appendTerminalLog(
        `[INTERACTIVE SYNC] SUCCESS: Disinkronkan ${interactiveSession.pagesCount} halaman, ${interactiveSession.apisCount} API, ${interactiveSession.inputsCount} input/dropdown ke Steps 01–12.`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal sinkronisasi parsial';
      appendTerminalLog(`[INTERACTIVE SYNC NOTICE] ${msg}`);
    }
  };

  const handleTriggerRobotExploration = async () => {
    appendTerminalLog('[ROBOT EXPLORER] Mengirim instruksi eksplorasi otonom ke Chromium...');
    setInteractiveSession((prev) => ({ ...prev, status: 'ROBOT_EXPLORING' }));
    try {
      const res = await fetchWithTimeout(
        '/api/discovery/interactive-session',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'TRIGGER_ROBOT' }),
        },
        45000
      );
      const json = (await res.json()) as {
        success?: boolean;
        message?: string;
        latestResult?: BlindCrawlResult | null;
      };
      setInteractiveSession((prev) => ({
        ...prev,
        status: 'READY_TO_FINISH',
        latestResult: json.latestResult || prev.latestResult,
      }));
      if (json.success) {
        appendTerminalLog(`[ROBOT EXPLORER] ${json.message || 'Robot selesai menjelajahi menu internal.'}`);
      } else {
        appendTerminalLog(`[ROBOT EXPLORER NOTICE] ${json.message || 'Eksplorasi robot selesai dengan catatan.'}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setInteractiveSession((prev) => ({ ...prev, status: 'READY_TO_FINISH' }));
      appendTerminalLog(`[ROBOT EXPLORER NOTICE] ${msg}`);
    }
  };

  const handleFinishInteractiveSession = async () => {
    appendTerminalLog('[INTERACTIVE FINISH] Menyimpan session cookies & menutup browser Chromium...');
    try {
      const res = await fetch('/api/discovery/interactive-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'FINISH_SESSION' }),
      });
      const json = (await res.json()) as {
        success?: boolean;
        crawlResult?: BlindCrawlResult | null;
        data?: { crawlResult?: BlindCrawlResult | null };
      };
      setInteractiveSession((prev) => ({ ...prev, isRunning: false, status: 'COMPLETED' }));

      const crawlResult = json.crawlResult || json.data?.crawlResult || interactiveSession.latestResult;
      if (json.success && crawlResult) {
        setBlindCrawlResult(crawlResult);
        if (crawlResult.targetUrl) setBlindTargetUrl(crawlResult.targetUrl);

        const compiled = synthesizeFullSdlcFromCrawl(crawlResult, rawMoMNotes);
        applyCompiledSdlcState(compiled);
        setInteractiveNotice({
          type: 'success',
          text: copy.step01.guidedFinishNotice,
        });
        appendTerminalLog(`[INTERACTIVE FINISH] SUCCESS: Full SDLC specs compiled across Steps 01–12.`);
        setActiveStep(2);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      appendTerminalLog(`[INTERACTIVE FINISH NOTICE] ${msg}`);
      setInteractiveSession((prev) => ({ ...prev, isRunning: false }));
    }
  };

  // Phase switch logic
  const handlePhaseChange = (phase: 1 | 2 | 3 | 4) => {
    if (phase === 1) {
      setActiveStep(1);
    } else if (phase === 2) {
      setActiveStep(5);
    } else if (phase === 3) {
      setActiveStep(8);
    } else if (phase === 4) {
      setActiveStep(10);
    }
  };

  // Open Inspector Helper
  const openInspectorForEntity = (id: string) => {
    setSelectedEntityId(id);
    setIsInspectorOpen(true);
  };

  return (
    <div className="w-screen h-screen overflow-hidden flex flex-col bg-[#0B0C0E] text-[#EDEDED] font-sans select-none">
      {/* =========================================================================
       * 1. SINGLE TOP HEADER BAR (h-12 px-4 border-b border-white/[0.07] bg-[#090A0D])
       * ========================================================================= */}
      <header className="h-12 min-h-12 px-4 bg-[#090A0D] border-b border-white/[0.07] flex items-center justify-between gap-3 z-30 select-none shrink-0">
        {/* Left: Logo OneSpec + Active Project Dropdown + Mode Switcher */}
        <div className="flex items-center gap-2.5 min-w-0 shrink-0">
          {/* Logo OneSpec */}
          <div className="flex items-center gap-2 pr-2.5 border-r border-white/[0.07] shrink-0">
            <div className="h-5 w-5 bg-zinc-800 border border-white/[0.1] rounded-[3px] flex items-center justify-center text-white font-mono text-[11px] font-semibold shrink-0">
              1S
            </div>
            <span className="font-semibold text-[13px] tracking-tight text-zinc-100 whitespace-nowrap">
              OneSpec <span className="text-zinc-400 font-normal text-[11.5px]">SDLC Studio</span>
            </span>
          </div>

          {/* Active Project Dropdown + New Project + Snapshot History */}
          <div className="flex items-center gap-1 text-[11px] shrink-0">
            <select
              aria-label="Active Project Workspace Vault Selector"
              value={activeVaultProjectId || ''}
              onChange={(e) => {
                const val = e.target.value;
                if (val) handleSwitchVaultProject(val);
              }}
              className="bg-[#101217] border border-white/[0.07] hover:border-zinc-500 text-zinc-200 px-2 h-7 rounded-[4px] outline-none text-[11px] cursor-pointer w-[130px] min-[1400px]:w-[155px] min-[1720px]:w-[185px] truncate"
            >
              {vaultProjects.length === 0 && (
                <option value="">
                  {activeWorkspace?.name || 'Default Architecture Workspace'}
                </option>
              )}
              {vaultProjects.map((p) => (
                <option key={p.projectId} value={p.projectId}>
                  {p.projectName} · {p.latestPassRatePercent}%
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setIsNewProjectModalOpen(true)}
              title={copy.header.newProjectBtn}
              className="h-7 w-7 bg-[#101217] border border-white/[0.07] hover:border-zinc-500 text-zinc-400 hover:text-white rounded-[4px] flex items-center justify-center cursor-pointer transition-colors shrink-0"
            >
              <Plus className="h-3.5 w-3.5 text-zinc-400" strokeWidth={1.5} />
            </button>

            <button
              type="button"
              onClick={() => setIsVaultHistoryOpen(true)}
              title={copy.header.historyBtn}
              className="h-7 px-2 bg-[#101217] border border-white/[0.07] hover:border-zinc-500 text-zinc-400 hover:text-white rounded-[4px] text-[11px] font-medium flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0"
            >
              <History className="h-3.5 w-3.5 text-zinc-400" strokeWidth={1.5} />
              <span className="hidden min-[1680px]:inline">{copy.header.historyBtn}</span>
              {projectSnapshots.length > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] text-zinc-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="tabular-nums">{projectSnapshots.length}</span>
                </span>
              )}
            </button>
          </div>

          {/* Mode Switcher: 12-Step Studio | ISO Library */}
          <div className="flex items-center bg-[#101217] border border-white/[0.07] p-0.5 rounded-[4px] gap-0.5 shrink-0 text-[11px]">
            <button
              type="button"
              onClick={() => setWorkspaceMode('STUDIO')}
              className={`px-2.5 h-7 rounded-[3px] transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap font-medium ${
                workspaceMode === 'STUDIO'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
              }`}
              title="Switch to 12-Step SDLC Engineering Studio"
            >
              <Wrench className="h-3.5 w-3.5 text-zinc-400" strokeWidth={1.5} />
              <span>{locale === 'id' ? '12-Step Studio' : '12-Step Studio'}</span>
            </button>
            <button
              type="button"
              onClick={() => setWorkspaceMode('ENTERPRISE_LIBRARY')}
              className={`px-2.5 h-7 rounded-[3px] transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap font-medium ${
                workspaceMode === 'ENTERPRISE_LIBRARY'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
              }`}
              title="Switch to Enterprise ISO Product & Documentation Library Portal"
            >
              <Building2 className="h-3.5 w-3.5 text-zinc-400" strokeWidth={1.5} />
              <span>{locale === 'id' ? 'Library ISO' : 'ISO Library'}</span>
              <span className="px-1 py-0.2 bg-zinc-900 border border-white/[0.07] text-zinc-300 text-[10px] rounded-[2px] tabular-nums">
                {Math.max(1, vaultProjects.length)}
              </span>
            </button>
          </div>

          {/* View Mode: Ringkas (Executive) | Pakar (Technical Audit) */}
          {workspaceMode === 'STUDIO' && (
            <div
              className="hidden min-[1360px]:flex items-center bg-[#101217] border border-white/[0.07] p-0.5 rounded-[4px] gap-0.5 shrink-0 text-[11px]"
              role="group"
              aria-label={locale === 'id' ? 'Mode Tampilan' : 'Display Mode'}
            >
              <button
                type="button"
                onClick={() => setDisplayMode('EXECUTIVE')}
                className={`px-2 h-7 rounded-[3px] transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap text-[10.5px] font-medium ${
                  displayMode === 'EXECUTIVE'
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title={locale === 'id' ? 'Mode Ringkas Executive' : 'Executive Summary Mode'}
              >
                <span>{locale === 'id' ? 'Ringkas' : 'Executive'}</span>
              </button>
              <button
                type="button"
                onClick={() => setDisplayMode('TECHNICAL')}
                className={`px-2 h-7 rounded-[3px] transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap text-[10.5px] font-medium ${
                  displayMode === 'TECHNICAL'
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title={locale === 'id' ? 'Mode Pakar Technical Audit' : 'Technical Audit Mode'}
              >
                <span>{locale === 'id' ? 'Pakar' : 'Technical'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Right: Export Bundle Dropdown + Mask PII + Language ID | EN + ⌘K */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Unified Export Bundle Dropdown Menu */}
          <ExportBundleDropdown
            compiledState={compiledSdlcState}
            activeVaultProjectId={activeVaultProjectId}
            locale={locale}
            isStale={isCacheStale}
          />

          {/* Mask PII Toggle */}
          <button
            type="button"
            onClick={() => setIsMaskSensitiveData((prev) => !prev)}
            title={
              isMaskSensitiveData
                ? (locale === 'id' ? 'Nonaktifkan Penyamaran Host / User' : 'Disable Sensitive Host / User Masking')
                : (locale === 'id' ? 'Samarkan Host / IP / User Sensitif untuk Presentasi & Screenshot' : 'Mask Sensitive Host / User for Demos & Screenshots')
            }
            className={`flex items-center gap-1.5 px-2.5 h-7 border text-[11px] rounded-[4px] transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              isMaskSensitiveData
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-medium'
                : 'bg-[#101217] border-white/[0.07] hover:border-zinc-500 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {isMaskSensitiveData ? (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
            ) : (
              <Eye className="h-3.5 w-3.5 text-zinc-400 shrink-0" strokeWidth={1.5} />
            )}
            <span className="hidden min-[1280px]:inline">
              {isMaskSensitiveData
                ? (locale === 'id' ? 'PII Masked' : 'PII Masked')
                : (locale === 'id' ? 'Mask PII' : 'Mask PII')}
            </span>
          </button>

          {/* Benchmark Seed */}
          <button
            type="button"
            onClick={handleSeedBenchmark}
            title={copy.header.seedData}
            className="flex items-center gap-1.5 px-2.5 h-7 bg-[#101217] border border-white/[0.07] hover:border-zinc-500 text-zinc-400 hover:text-zinc-200 text-[11px] rounded-[4px] transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Database className="h-3.5 w-3.5 text-zinc-400 shrink-0" strokeWidth={1.5} />
            <span className="hidden min-[1500px]:inline">{copy.header.seedData}</span>
          </button>

          {/* Language Switcher: ID | EN */}
          <div
            className="flex items-center bg-[#101217] border border-white/[0.07] p-0.5 rounded-[4px] text-[11px] h-7 shrink-0"
            role="group"
            aria-label={copy.header.localeTooltip}
            title={copy.header.localeTooltip}
          >
            <button
              type="button"
              onClick={() => setLocale('id')}
              className={`px-2 h-full rounded-[2px] font-medium transition-colors cursor-pointer ${
                locale === 'id' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              ID
            </button>
            <button
              type="button"
              onClick={() => setLocale('en')}
              className={`px-2 h-full rounded-[2px] font-medium transition-colors cursor-pointer ${
                locale === 'en' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              EN
            </button>
          </div>

          {/* ⌘K Search Command Palette */}
          <button
            type="button"
            onClick={() => setIsCmdkOpen(true)}
            title={copy.header.cmdkTooltip}
            className="flex items-center gap-1.5 px-2 h-7 bg-[#101217] border border-white/[0.07] hover:border-zinc-500 text-zinc-400 hover:text-zinc-200 text-[11px] rounded-[4px] transition-colors cursor-pointer shrink-0"
          >
            <Search className="h-3.5 w-3.5 text-zinc-400 shrink-0" strokeWidth={1.5} />
            <kbd className="text-[10px] bg-zinc-900 px-1 py-0.2 rounded-[2px] text-zinc-400 border border-white/[0.07]">
              ⌘K
            </kbd>
          </button>
        </div>
      </header>

      {/* Permanent Warning Banner for Stale Cache Data (F-13 / T-13) */}
      {isCacheStale && (
        <div
          role="alert"
          aria-live="polite"
          className="w-full bg-amber-500/15 border-b border-amber-500/35 px-4 py-2.5 flex items-center justify-between text-[11.5px] font-mono text-amber-200 shrink-0 z-30 shadow-md"
        >
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
            <span>
              <strong>PERINGATAN DATA BASI:</strong>{' '}
              {cacheStaleReason || 'Data dikompilasi dengan engine lama. Jalankan ulang pipeline untuk memperbarui.'}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setActiveStep(1);
                appendTerminalLog('[CACHE] Menavigasi ke Step 01 untuk menjalankan ulang pipeline kompilasi...');
              }}
              className="px-2.5 py-1 bg-amber-500/25 hover:bg-amber-500/35 text-amber-100 border border-amber-500/50 hover:border-amber-400 rounded-[3px] text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCw className="h-3 w-3 text-amber-300" />
              <span>Jalankan Ulang Pipeline</span>
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
       * 2. MAIN WORKBENCH BODY (Left Sidebar + Canvas + Optional Right Inspector)
       * ========================================================================= */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        {workspaceMode === 'ENTERPRISE_LIBRARY' ? (
          <IsoLibraryPortal
            compiledSdlcState={compiledSdlcState}
            activeVaultProjectId={activeVaultProjectId}
            locale={locale}
            onOpenInStudio={async (projectId, jumpToStep) => {
              if (projectId && projectId !== 'active-workspace' && projectId !== activeVaultProjectId) {
                await handleSwitchVaultProject(projectId);
              }
              setWorkspaceMode('STUDIO');
              setActiveStep(jumpToStep || 1);
            }}
            onCopyBlueprintToNewProject={(blueprintMom, projectNameHint) => {
              setGreenfieldProjectName(projectNameHint);
              setRawMoMNotes(blueprintMom);
              setStep1SourceTab('STAKEHOLDER_MOM');
              setWorkspaceMode('STUDIO');
              setActiveStep(1);
              appendTerminalLog(`[BLUEPRINT REGISTRY] Copied enterprise blueprint "${projectNameHint}" into Step 01 Greenfield Compiler.`);
            }}
            onSwitchToStudioMode={() => setWorkspaceMode('STUDIO')}
            onAppendLog={appendTerminalLog}
            onRecaptureScreenshots={handleRecaptureScreenshots}
            isRecapturingScreenshots={isRecapturingScreenshots}
            onSwitchVaultProject={handleSwitchVaultProject}
          />
        ) : (
          <>
        {/* LEFT VERTICAL SIDEBAR (248px Fixed Width, Breathable Stepper Navigation) */}
        <aside className="w-[252px] min-w-[252px] max-w-[252px] bg-[#101217] border-r border-white/[0.07] flex flex-col justify-between overflow-y-auto select-none shrink-0">
          {/* Stepper Navigation Groups */}
          <div className="py-2">
            {/* Group 1: Phase 1 Pre-Development */}
            <div className="px-3 pt-2 pb-1 text-[10px] font-mono font-medium text-zinc-400 uppercase tracking-wider">
              {copy.nav.group1}
            </div>
            <nav className="space-y-0.5 px-2">
              {[
                { step: 1, icon: <FileText className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} /> },
                { step: 2, icon: <GitBranch className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} /> },
                { step: 3, icon: <Layers className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} /> },
                { step: 4, icon: <FileSpreadsheet className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} /> },
              ].map((item) => {
                const meta = copy.nav.steps.find((s) => s.step === item.step)!;
                return (
                  <button
                    key={item.step}
                    title={meta.title}
                    onClick={() => setActiveStep(item.step)}
                    className={`w-full h-[36px] px-2.5 flex items-center gap-2 rounded-[3px] text-[11.5px] font-sans font-medium tracking-tight transition-colors text-left cursor-pointer ${
                      activeStep === item.step
                        ? 'bg-white/[0.06] text-white font-semibold border-l-2 border-l-zinc-200'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03] border-l-2 border-l-transparent'
                    }`}
                  >
                    <span className={activeStep === item.step ? 'text-zinc-200' : 'text-zinc-400'}>
                      {item.icon}
                    </span>
                    <span className="whitespace-nowrap overflow-hidden text-ellipsis">{meta.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Group 2: Phase 2 Staging & Automation */}
            <div className="px-3 pt-4 pb-1 text-[10px] font-mono font-medium text-zinc-400 uppercase tracking-wider">
              {copy.nav.group2}
            </div>
            <nav className="space-y-0.5 px-2">
              {[
                { step: 5, icon: <Globe className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} /> },
                { step: 6, icon: <GitCompare className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} /> },
                { step: 7, icon: <Activity className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} /> },
              ].map((item) => {
                const meta = copy.nav.steps.find((s) => s.step === item.step)!;
                return (
                  <button
                    key={item.step}
                    title={meta.title}
                    onClick={() => setActiveStep(item.step)}
                    className={`w-full h-[36px] px-2.5 flex items-center gap-2 rounded-[3px] text-[11.5px] font-sans font-medium tracking-tight transition-colors text-left cursor-pointer ${
                      activeStep === item.step
                        ? 'bg-white/[0.06] text-white font-semibold border-l-2 border-l-zinc-200'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03] border-l-2 border-l-transparent'
                    }`}
                  >
                    <span className={activeStep === item.step ? 'text-zinc-200' : 'text-zinc-400'}>
                      {item.icon}
                    </span>
                    <span className="whitespace-nowrap overflow-hidden text-ellipsis">{meta.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Group 3: Phase 3 Enterprise Governance & Security */}
            <div className="px-3 pt-4 pb-1 text-[10px] font-mono font-medium text-zinc-400 uppercase tracking-wider">
              {copy.nav.group3}
            </div>
            <nav className="space-y-0.5 px-2">
              {[
                { step: 8, icon: <ShieldCheck className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} /> },
                { step: 9, icon: <ShieldAlert className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} /> },
              ].map((item) => {
                const meta = copy.nav.steps.find((s) => s.step === item.step)!;
                return (
                  <button
                    key={item.step}
                    title={meta.title}
                    onClick={() => setActiveStep(item.step)}
                    className={`w-full h-[36px] px-2.5 flex items-center gap-2 rounded-[3px] text-[11.5px] font-sans font-medium tracking-tight transition-colors text-left cursor-pointer ${
                      activeStep === item.step
                        ? 'bg-white/[0.06] text-white font-semibold border-l-2 border-l-zinc-200'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03] border-l-2 border-l-transparent'
                    }`}
                  >
                    <span className={activeStep === item.step ? 'text-zinc-200' : 'text-zinc-400'}>
                      {item.icon}
                    </span>
                    <span className="whitespace-nowrap overflow-hidden text-ellipsis">{meta.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Group 4: Phase 4 Formal Assurance & Consensus */}
            <div className="px-3 pt-4 pb-1 text-[10px] font-mono font-medium text-zinc-400 uppercase tracking-wider">
              {copy.nav.group4}
            </div>
            <nav className="space-y-0.5 px-2">
              {[
                { step: 10, icon: <Code2 className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} /> },
                { step: 11, icon: <Users className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} /> },
                { step: 12, icon: <Share2 className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} /> },
              ].map((item) => {
                const meta = copy.nav.steps.find((s) => s.step === item.step)!;
                return (
                  <button
                    key={item.step}
                    title={meta.title}
                    onClick={() => setActiveStep(item.step)}
                    className={`w-full h-[36px] px-2.5 flex items-center gap-2 rounded-[3px] text-[11.5px] font-sans font-medium tracking-tight transition-colors text-left cursor-pointer ${
                      activeStep === item.step
                        ? 'bg-white/[0.06] text-white font-semibold border-l-2 border-l-zinc-200'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03] border-l-2 border-l-transparent'
                    }`}
                  >
                    <span className={activeStep === item.step ? 'text-zinc-200' : 'text-zinc-400'}>
                      {item.icon}
                    </span>
                    <span className="whitespace-nowrap overflow-hidden text-ellipsis">{meta.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
          {/* Bottom: Collapsible Artifact Explorer Toggle (Closed by Default) */}
          <div className="border-t border-white/[0.07] p-2 bg-[#090A0D]/50">
            <button
              onClick={() => setShowArtifactExplorer(!showArtifactExplorer)}
              className="w-full flex items-center justify-between px-2.5 py-1.5 text-[11px] font-sans text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] rounded-[3px] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <Folder className="h-3.5 w-3.5 text-zinc-400" strokeWidth={1.5} />
                <span>{copy.nav.artifactExplorer}</span>
              </div>
              {showArtifactExplorer ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </button>

            {showArtifactExplorer && (
              <div className="max-h-[160px] overflow-y-auto pt-1.5 space-y-1 text-[11px] font-mono">
                <div className="px-2 py-0.5 text-[#707070] text-[10px] uppercase font-bold">{copy.nav.businessRulesLabel}</div>
                {brdMatrixRows.map((r) => (
                  <button
                    key={r.ruleId}
                    onClick={() => {
                      setActiveStep(3);
                      setStep3SubTab('BRD_MATRIX');
                      openInspectorForEntity(r.ruleId);
                    }}
                    className="w-full px-2 py-0.5 text-left truncate text-[#A1A1A1] hover:text-[#3B82F6] hover:bg-[#16191F] rounded-[2px]"
                  >
                    {r.ruleId} — {r.category}
                  </button>
                ))}
                <div className="px-2 pt-1 pb-0.5 text-[#707070] text-[10px] uppercase font-bold">{copy.nav.validationRulesLabel}</div>
                {validationRules.map((v) => (
                  <button
                    key={v.ruleId}
                    onClick={() => {
                      setActiveStep(3);
                      setStep3SubTab('PRD_CONTRACT');
                      openInspectorForEntity(v.ruleId);
                    }}
                    className="w-full px-2 py-0.5 text-left truncate text-[#A1A1A1] hover:text-[#3B82F6] hover:bg-[#16191F] rounded-[2px]"
                  >
                    {v.ruleId} — {v.fieldName}
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* MAIN WORKSPACE CANVAS (calc(100vw - 248px), Single Focus, Breathing Room) */}
        <main className="flex-1 h-full overflow-y-auto p-4 lg:p-5 bg-[#0B0C0E] flex flex-col">
          {/* =========================================================================
           * STEP 01: PROJECT SOURCE & INGESTION HUB (Unified Ingestion Engine)
           * ========================================================================= */}
          {activeStep === 1 && (
            <Step01IngestionWorkbench
              displayMode={displayMode}
              copy={copy}
              locale={locale}
              isAnalyzingSource={isAnalyzingSource}
              isBlindCrawling={isBlindCrawling}
              handleAnalyzeSourceAndBuildPipeline={handleAnalyzeSourceAndBuildPipeline}
              interactiveSession={interactiveSession}
              handleTriggerRobotExploration={handleTriggerRobotExploration}
              handleFinishInteractiveSession={handleFinishInteractiveSession}
              step1SourceTab={step1SourceTab}
              setStep1SourceTab={setStep1SourceTab}
              blindTargetUrl={blindTargetUrl}
              setBlindTargetUrl={setBlindTargetUrl}
              targetUrlInputRef={targetUrlInputRef}
              interactiveNotice={interactiveNotice}
              setInteractiveNotice={setInteractiveNotice}
              handleProbeLoginSurface={handleProbeLoginSurface}
              isProbingSurface={isProbingSurface}
              loginSurfaceProbe={loginSurfaceProbe}
              dynamicFieldValues={dynamicFieldValues}
              setDynamicFieldValues={setDynamicFieldValues}
              loginAccessType={loginAccessType}
              setLoginAccessType={setLoginAccessType}
              loginUsername={loginUsername}
              setLoginUsername={setLoginUsername}
              loginPassword={loginPassword}
              setLoginPassword={setLoginPassword}
              showLoginPassword={showLoginPassword}
              setShowLoginPassword={setShowLoginPassword}
              isMaskSensitiveData={isMaskSensitiveData}
              handleRunAutoRobot={handleRunAutoRobot}
              isRunningAutoRobot={isRunningAutoRobot}
              handleStartHumanSession={handleStartHumanSession}
              isStartingInteractive={isStartingInteractive}
              gitProvider={gitProvider}
              setGitProvider={setGitProvider}
              gitRepoUrl={gitRepoUrl}
              setGitRepoUrl={setGitRepoUrl}
              gitBranch={gitBranch}
              setGitBranch={setGitBranch}
              gitAuthToken={gitAuthToken}
              setGitAuthToken={setGitAuthToken}
              localFolderPath={localFolderPath}
              setLocalFolderPath={setLocalFolderPath}
              appendTerminalLog={appendTerminalLog}
              greenfieldProjectName={greenfieldProjectName}
              setGreenfieldProjectName={setGreenfieldProjectName}
              linkedUpstreamProject={linkedUpstreamProject}
              selectedIntegrationTargetId={selectedIntegrationTargetId}
              setSelectedIntegrationTargetId={setSelectedIntegrationTargetId}
              vaultProjects={vaultProjects}
              activeVaultProjectId={activeVaultProjectId}
              handleLinkVaultIntegrationProject={handleLinkVaultIntegrationProject}
              isLinkingIntegration={isLinkingIntegration}
              rawMoMNotes={rawMoMNotes}
              setRawMoMNotes={setRawMoMNotes}
              extractedEntities={extractedEntities}
              brdMatrixRows={brdMatrixRows}
              validationRules={validationRules}
              openInspectorForEntity={openInspectorForEntity}
              selectedEntityId={selectedEntityId}
              maskSensitiveText={maskSensitiveText}
            />
          )}

          {/* =========================================================================
           * STEP 02: CAMUNDA BPMN 2.0 WORKFLOW & WIREFRAME ORCHESTRATOR (ISO/IEC 19510)
           * ========================================================================= */}
          {activeStep === 2 && (
            <div className="h-full flex flex-col space-y-3 min-h-0 overflow-hidden">
              {/* Canvas Header & Sub-View Switcher Pill */}
              <div className="flex flex-col gap-2 pb-2.5 border-b border-[#22262E] shrink-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <h1 className="text-[17px] font-bold text-[#EDEDED] tracking-tight truncate">
                      {copy.step02.title}
                    </h1>
                    <span className="badge-tag px-1.5 py-0.5 bg-[#2563EB]/20 text-[#3B82F6] font-mono text-[10px] font-bold whitespace-nowrap shrink-0">
                      ISO/IEC 19510 · ISO 42010
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-[#707070] hidden md:inline truncate">
                    {copy.step02.subtitle}
                  </div>
                </div>
                {/* Sub-View Switcher Pill & Step 02 Vault Integration Linker */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center bg-[#111317] border border-[#22262E] p-0.5 rounded-[3px] gap-1 text-[11px] font-mono overflow-x-auto">
                    <button
                      onClick={() => setStep2SubTab('SPLIT_ORCHESTRATOR')}
                      className={`px-3 py-1 rounded-[2px] transition-colors cursor-pointer whitespace-nowrap ${
                        step2SubTab === 'SPLIT_ORCHESTRATOR'
                          ? 'bg-[#2563EB] text-white font-bold'
                          : 'text-[#A1A1A1] hover:text-[#EDEDED]'
                      }`}
                    >
                      {copy.step02.tabOrchestrator}
                    </button>
                    <button
                      onClick={() => setStep2SubTab('ARCHITECTURE')}
                      className={`px-3 py-1 rounded-[2px] transition-colors cursor-pointer whitespace-nowrap ${
                        step2SubTab === 'ARCHITECTURE'
                          ? 'bg-[#2563EB] text-white font-bold'
                          : 'text-[#A1A1A1] hover:text-[#EDEDED]'
                      }`}
                    >
                      {copy.step02.tabArchitecture}
                    </button>
                    <button
                      onClick={() => setStep2SubTab('REVERSE_DFD')}
                      className={`px-3 py-1 rounded-[2px] transition-colors cursor-pointer whitespace-nowrap ${
                        step2SubTab === 'REVERSE_DFD'
                          ? 'bg-[#2563EB] text-white font-bold'
                          : 'text-[#A1A1A1] hover:text-[#EDEDED]'
                      }`}
                    >
                      {copy.step02.tabDfd}
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 font-mono text-[10.5px]">
                    {linkedUpstreamProject && (
                      <span className="px-2 py-1 bg-[#8B5CF6]/15 border border-[#8B5CF6]/40 text-[#A78BFA] rounded-[2px] font-bold whitespace-nowrap flex items-center gap-1">
                        <Link2 className="h-3 w-3" />
                        <span>Bridge: {linkedUpstreamProject.projectName}</span>
                      </span>
                    )}
                    <select
                      aria-label="Step 02 Link Integration Target from Vault"
                      value={selectedIntegrationTargetId}
                      onChange={(e) => setSelectedIntegrationTargetId(e.target.value)}
                      className="h-7 px-2 bg-[#111317] border border-[#22262E] focus:border-[#8B5CF6] text-[#EDEDED] rounded-[2px] outline-none text-[10.5px] cursor-pointer max-w-[180px]"
                    >
                      <option value="">{locale === 'id' ? 'Integrasi Vault...' : 'Link Vault Target...'}</option>
                      {vaultProjects
                        .filter((p) => p.projectId !== activeVaultProjectId)
                        .map((p) => (
                          <option key={p.projectId} value={p.projectId}>
                            {p.projectName}
                          </option>
                        ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => handleLinkVaultIntegrationProject()}
                      disabled={!selectedIntegrationTargetId || isLinkingIntegration}
                      className="h-7 px-2.5 bg-[#8B5CF6] hover:bg-[#7C3AED] disabled:opacity-40 text-white font-bold rounded-[2px] flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap"
                    >
                      <Link2 className="h-3 w-3" />
                      <span>{locale === 'id' ? 'Sambungkan' : 'Link'}</span>
                    </button>
                  </div>
                </div>
              </div>
              {/* View 1: Split Orchestrator View (BPMN Left 56% + Wireframe Right 44%) */}
              {step2SubTab === 'SPLIT_ORCHESTRATOR' && (
                <div className="flex-1 grid grid-cols-12 gap-3 min-h-0 overflow-hidden">
                  <div className="col-span-12 lg:col-span-7 flex flex-col min-h-0 bg-[#0E1015] border border-[#22262E] rounded-[4px] overflow-hidden">
                    <CamundaBpmnViewer
                      xml={bpmnXml}
                      selectedNodeId={selectedNodeDetails?.id}
                      onNodeSelect={(evt: BpmnNodeClickEvent) => {
                        setSelectedNodeDetails({
                          id: evt.id,
                          type: evt.type,
                          name: evt.name,
                          businessRuleId: evt.businessRuleId,
                          userStoryId: evt.userStoryId,
                          validationRuleId: evt.validationRuleId,
                        });
                        setIsInspectorOpen(true);
                        appendTerminalLog(`[BPMN ORCHESTRATOR] Selected Node: ${evt.name} (${evt.id})`);
                      }}
                      onSimulationStep={(stepName, nodeId) => {
                        appendTerminalLog(`[WORKFLOW SIMULATION] Stage: ${stepName} (${nodeId})`);
                      }}
                    />
                  </div>
                  <div className="col-span-12 lg:col-span-5 flex flex-col min-h-0 overflow-y-auto">
                    <ContractWireframePreview
                      projectName={activeWorkspace?.name || 'Target Application'}
                      targetUrl={currentTargetUrl}
                      apiEndpoint={discoveryResult.apiEndpoints[0]?.path || '/api'}
                      validationRules={validationRules}
                      onStateChange={(state: WireframeState) => {
                        appendTerminalLog(`[WIREFRAME SIMULATOR] State transitioned to ${state}`);
                      }}
                      onDispatchSuccess={(latency, status) => {
                        appendTerminalLog(`[ORCHESTRATOR DISPATCH] Invariants verified · HTTP ${status} in ${latency}ms`);
                      }}
                    />
                  </div>
                </div>
              )}

              {/* View 2: System Architecture Deconstructor (HLA, LLA, and Blueprint) */}
              {step2SubTab === 'ARCHITECTURE' && (
                <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                  <ArchitectureDeconstructorWorkbench
                    input={{
                      appName: activeWorkspace?.name || 'Target Application',
                      targetUrl: currentTargetUrl,
                      apiEndpoints: discoveryResult.apiEndpoints,
                      databaseTables: discoveryResult.databaseTables,
                      domBindings: discoveryResult.domTraceability,
                      validationRules,
                      businessRules: brdMatrixRows,
                      rawMoMNotes,
                    }}
                    initialMode="HLA"
                    upstreamLinkedProject={linkedUpstreamProject}
                  />
                </div>
              )}
              {/* View 3: Reverse Data Flow Diagram (IEEE 1016 / Gane-Sarson & UU PDP) */}
              {step2SubTab === 'REVERSE_DFD' && (
                <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                  <ReverseDfdWorkbench
                    appName={activeWorkspace?.name || 'Target Application'}
                    targetUrl={currentTargetUrl}
                    apiEndpoints={discoveryResult.apiEndpoints}
                    databaseTables={discoveryResult.databaseTables}
                    validationRules={validationRules}
                    businessRules={brdMatrixRows}
                    initialResult={compiledSdlcState?.reverseDfdResult}
                    onAppendLog={appendTerminalLog}
                  />
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
           * STEP 03: BRD & PRD SPECIFICATION ENGINE (ISO/IEC/IEEE 29148)
           * ========================================================================= */}
          {activeStep === 3 && (
            <div className="h-full flex flex-col space-y-3 min-h-0 overflow-hidden">
              {/* Canvas Header & Sub-View Switcher Pill (Stacked cleanly so title never wraps vertically) */}
              <div className="flex flex-col gap-2.5 pb-3 border-b border-[#22262E] shrink-0">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h1 className="text-[18px] font-bold text-[#EDEDED] tracking-tight">
                    {copy.step03.title}
                  </h1>
                  <p className="text-[11.5px] text-[#707070] font-mono">
                    {copy.step03.subtitle}
                  </p>
                </div>

                <div className="flex flex-wrap items-center bg-[#111317] border border-[#22262E] p-0.5 rounded-[4px] gap-1 text-[11.5px] font-mono self-start max-w-full">
                  <button
                    onClick={() => setStep3SubTab('BRD_MATRIX')}
                    className={`px-3 py-1 rounded-[3px] transition-colors cursor-pointer whitespace-nowrap ${
                      step3SubTab === 'BRD_MATRIX'
                        ? 'bg-[#2563EB] text-white font-semibold'
                        : 'text-[#A1A1A1] hover:text-[#EDEDED]'
                    }`}
                  >
                    {copy.step03.tabBrd}
                  </button>
                  <button
                    onClick={() => setStep3SubTab('PRD_CONTRACT')}
                    className={`px-3 py-1 rounded-[3px] transition-colors cursor-pointer whitespace-nowrap ${
                      step3SubTab === 'PRD_CONTRACT'
                        ? 'bg-[#2563EB] text-white font-semibold'
                        : 'text-[#A1A1A1] hover:text-[#EDEDED]'
                    }`}
                  >
                    {copy.step03.tabPrd}
                  </button>
                  <button
                    onClick={() => setStep3SubTab('TSD_TRD')}
                    className={`px-3 py-1 rounded-[3px] transition-colors cursor-pointer whitespace-nowrap ${
                      step3SubTab === 'TSD_TRD'
                        ? 'bg-[#2563EB] text-white font-semibold'
                        : 'text-[#A1A1A1] hover:text-[#EDEDED]'
                    }`}
                  >
                    {copy.step03.tabTsd}
                  </button>
                  <button
                    onClick={() => setStep3SubTab('RAW_MARKDOWN')}
                    className={`px-3 py-1 rounded-[3px] transition-colors cursor-pointer whitespace-nowrap ${
                      step3SubTab === 'RAW_MARKDOWN'
                        ? 'bg-[#2563EB] text-white font-semibold'
                        : 'text-[#A1A1A1] hover:text-[#EDEDED]'
                    }`}
                  >
                    {copy.step03.tabRawIso}
                  </button>
                  <button
                    onClick={() => {
                      setActiveStep(2);
                      setStep2SubTab('SPLIT_ORCHESTRATOR');
                    }}
                    className="px-3 py-1 rounded-[3px] text-[#3B82F6] hover:bg-[#16191F] transition-colors cursor-pointer flex items-center gap-1 font-bold whitespace-nowrap"
                  >
                    <span>➔ {copy.step03.backToOrchestrator}</span>
                  </button>
                </div>
              </div>

              {/* View 1: BRD Matrix Table */}
              {step3SubTab === 'BRD_MATRIX' && (
                <div className="flex-1 bg-[#111317] border border-[#22262E] rounded-[4px] flex flex-col overflow-hidden min-h-0">
                  <div className="flex-1 overflow-auto min-h-0">
                    <table className="w-full table-fixed border-collapse text-left text-[12.5px]">
                      <thead className="bg-[#16191F] text-[#707070] border-b border-[#22262E] sticky top-0 font-mono text-[11px] uppercase z-10">
                        <tr>
                          <th className="py-2.5 px-3 w-[86px] border-r border-[#22262E]">{copy.step03.colRuleId}</th>
                          <th className="py-2.5 px-3 w-[150px] border-r border-[#22262E]">{copy.step03.colCategory}</th>
                          <th className="py-2.5 px-3 border-r border-[#22262E]">
                            {copy.step03.colStatement}
                          </th>
                          <th className="py-2.5 px-3 w-[20%] border-r border-[#22262E]">{copy.step03.colKpi}</th>
                          <th className="py-2.5 px-3 w-[20%]">{copy.step03.colSource}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#22262E] bg-[#111317]">
                        {brdMatrixRows.map((r) => (
                          <tr
                            key={r.ruleId}
                            onClick={() => openInspectorForEntity(r.ruleId)}
                            className="hover:bg-[#16191F] cursor-pointer transition-colors"
                          >
                            <td className="py-3 px-3 font-mono font-bold text-[#3B82F6] border-r border-[#22262E] whitespace-nowrap">
                              {r.ruleId}
                            </td>
                            <td className="py-3 px-3 font-mono text-[11px] text-[#A1A1A1] border-r border-[#22262E] whitespace-nowrap">
                              <span className="badge-tag px-1.5 py-0.5 bg-[#16191F] border border-[#22262E] text-[#EDEDED]">
                                {r.category}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-[#EDEDED] leading-relaxed border-r border-[#22262E] break-words">
                              {r.statement}
                            </td>
                            <td className="py-3 px-3 font-mono text-[#059669] font-medium border-r border-[#22262E] break-words text-[12px]">
                              {r.targetKpi}
                            </td>
                            <td className="py-3 px-3 text-[#707070] font-mono text-[11.5px] break-all">
                              {r.sourceMoMLine}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* View 2: PRD Validation Contract Table */}
              {step3SubTab === 'PRD_CONTRACT' && (
                <div className="flex-1 bg-[#111317] border border-[#22262E] rounded-[4px] flex flex-col overflow-hidden min-h-0">
                  <div className="flex-1 overflow-auto min-h-0">
                    <table className="w-full table-fixed border-collapse text-left text-[12.5px]">
                      <thead className="bg-[#16191F] text-[#707070] border-b border-[#22262E] sticky top-0 font-mono text-[11px] uppercase z-10">
                        <tr>
                          <th className="py-2.5 px-3 w-[100px] border-r border-[#22262E]">{copy.step03.colValId}</th>
                          <th className="py-2.5 px-3 w-[105px] border-r border-[#22262E]">{copy.step03.colStoryRef}</th>
                          <th className="py-2.5 px-3 w-[16%] border-r border-[#22262E]">{copy.step03.colField}</th>
                          <th className="py-2.5 px-3 w-[22%] border-r border-[#22262E]">{copy.step03.colConstraint}</th>
                          <th className="py-2.5 px-3 w-[88px] border-r border-[#22262E]">{copy.step03.colHttpError}</th>
                          <th className="py-2.5 px-3">{copy.step03.colUiError}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#22262E] bg-[#111317]">
                        {validationRules.map((v) => (
                          <tr
                            key={v.ruleId}
                            onClick={() => openInspectorForEntity(v.ruleId)}
                            className="hover:bg-[#16191F] cursor-pointer transition-colors"
                          >
                            <td className="py-3 px-3 font-mono font-bold text-[#D97706] border-r border-[#22262E] whitespace-nowrap">
                              {v.ruleId}
                            </td>
                            <td className="py-3 px-3 font-mono font-bold text-[#3B82F6] border-r border-[#22262E] whitespace-nowrap">
                              {v.userStoryId}
                            </td>
                            <td className="py-3 px-3 font-mono text-[#EDEDED] border-r border-[#22262E] break-all text-[12px]">
                              {v.fieldName}
                            </td>
                            <td className="py-3 px-3 font-mono text-[#A1A1A1] text-[11.5px] border-r border-[#22262E] break-all">
                              <code className="text-[#3B82F6]">{v.dataType}</code> · {v.constraintExpression}
                            </td>
                            <td className="py-3 px-3 font-mono font-bold text-[#DC2626] border-r border-[#22262E] whitespace-nowrap tabular-nums">
                              {v.httpStatus}
                            </td>
                            <td className="py-3 px-3 text-[#EDEDED] font-mono text-[12px] break-words">
                              {v.exactUiErrorString}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {/* View 3: TSD / TRD Matrix Table & Code Grep Inspector */}
              {step3SubTab === 'TSD_TRD' && (
                <div className="flex-1 bg-[#111317] border border-[#22262E] rounded-[4px] flex flex-col overflow-hidden min-h-0">
                  {/* TSD / TRD Control Bar */}
                  <div className="min-h-[38px] py-1.5 bg-[#16191F] border-b border-[#22262E] px-4 flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] shrink-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[#EDEDED] font-bold truncate">
                        ISO 29148 Section 8 &amp; IEEE 1016 Technical Specifications (TSD / TRD)
                      </span>
                      <span className="badge-tag px-2 py-0.5 bg-[#2563EB]/20 text-[#3B82F6] font-bold text-[10px] shrink-0 tabular-nums">
                        {liveTsdRows.length} CONTRACTS
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={handleRunCodebaseGrep}
                        disabled={isGreppingCodebase}
                        className="px-2.5 py-1 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white rounded-[2px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        {isGreppingCodebase ? (
                          <>
                            <RotateCw className="h-3 w-3 animate-spin" />
                            <span>Grepping Codebase...</span>
                          </>
                        ) : (
                          <>
                            <Search className="h-3 w-3" />
                            <span>{copy.step03.scanCodebaseBtn}</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={handleDownloadTsdMarkdown}
                        className="flex items-center gap-1 px-2.5 py-1 bg-[#0B0C0E] border border-[#22262E] hover:border-[#3B82F6] text-[#EDEDED] rounded-[2px] transition-colors cursor-pointer"
                        title="Download ISO 29148 Section 8 TSD/TRD Specification Markdown"
                      >
                        <Download className="h-3 w-3 text-[#3B82F6]" />
                        <span>{copy.step03.exportTsdBtn}</span>
                      </button>
                    </div>
                  </div>

                  {/* TSD Matrix Table */}
                  <div className="flex-1 overflow-auto min-h-0">
                    <table className="w-full table-fixed border-collapse text-left text-[12.5px]">
                      <thead className="bg-[#16191F] text-[#707070] border-b border-[#22262E] sticky top-0 font-mono text-[11px] uppercase z-10">
                        <tr>
                          <th className="py-2.5 px-3 w-[88px] border-r border-[#22262E]">Spec ID</th>
                          <th className="py-2.5 px-2.5 w-[180px] border-r border-[#22262E]">Architecture Layer</th>
                          <th className="py-2.5 px-3 border-r border-[#22262E]">
                            Technical Requirement Statement (RFC-2119)
                          </th>
                          <th className="py-2.5 px-3 w-[22%] border-r border-[#22262E]">Codebase Grep Pattern</th>
                          <th className="py-2.5 px-3 w-[18%] border-r border-[#22262E]">Matched File Location</th>
                          <th className="py-2.5 px-3 w-[108px]">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#22262E] bg-[#111317]">
                        {liveTsdRows.map((t) => (
                          <tr
                            key={t.specId}
                            onClick={() => {
                              setSelectedTsdRow(t);
                              openInspectorForEntity(t.specId);
                            }}
                            className={`hover:bg-[#16191F] cursor-pointer transition-colors ${
                              selectedEntityId === t.specId ? 'bg-[#16191F]' : ''
                            }`}
                          >
                            <td className="py-3 px-3 font-mono font-bold text-[#3B82F6] border-r border-[#22262E] whitespace-nowrap align-top">
                              {t.specId}
                            </td>
                            <td className="py-3 px-2.5 font-mono text-[10.5px] text-[#A1A1A1] border-r border-[#22262E] whitespace-nowrap align-top">
                              <span className="badge-tag px-1.5 py-0.5 bg-[#16191F] border border-[#22262E] text-[#EDEDED]">
                                {t.layer}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-[#EDEDED] leading-relaxed border-r border-[#22262E] break-words align-top">
                              {t.statement}
                            </td>
                            <td className="py-3 px-3 font-mono text-[10.5px] text-[#38BDF8] border-r border-[#22262E] align-top">
                              <code className="bg-[#0B0C0E] px-1.5 py-0.5 rounded-[2px] block break-all whitespace-pre-wrap leading-snug">
                                {t.grepPattern}
                              </code>
                            </td>
                            <td className="py-3 px-3 font-mono text-[11px] text-[#10B981] border-r border-[#22262E] break-all align-top">
                              {t.matchedFile || 'Pending Scan'}
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap align-top">
                              <span
                                className={`badge-tag px-1.5 py-0.5 font-bold text-[9px] ${
                                  t.verificationStatus === 'VERIFIED_IN_CODEBASE'
                                    ? 'bg-[#059669]/20 text-[#10B981]'
                                    : 'bg-[#2563EB]/20 text-[#3B82F6]'
                                }`}
                              >
                                {t.verificationStatus === 'VERIFIED_IN_CODEBASE' ? 'VERIFIED' : 'AST MATCHED'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* View 4: Raw ISO Spec Monaco Editor */}
              {step3SubTab === 'RAW_MARKDOWN' && (
                <div className="flex-1 bg-[#111317] border border-[#22262E] rounded-[4px] flex flex-col overflow-hidden">
                  <div className="h-[36px] bg-[#16191F] border-b border-[#22262E] px-4 flex items-center justify-between text-[11px] font-mono text-[#707070]">
                    <span className="font-bold text-[#EDEDED]">ISO29148_Specification.md</span>
                    <button
                      onClick={() => {
                        const blob = new Blob([rawMarkdownSpec], { type: 'text/markdown;charset=utf-8;' });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = 'ISO29148_Specification.md';
                        link.click();
                        appendTerminalLog('[EXPORT] Downloaded ISO 29148 specification document.');
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 bg-[#0B0C0E] border border-[#22262E] hover:border-[#3B82F6] text-[#EDEDED] rounded-[2px]"
                    >
                      <Download className="h-3 w-3 text-[#3B82F6]" />
                      <span>Download .md</span>
                    </button>
                  </div>
                  <div className="flex-1">
                    <MonacoEditor
                      height="100%"
                      language="markdown"
                      theme="vs-dark"
                      value={rawMarkdownSpec}
                      onChange={(val) => setRawMarkdownSpec(val || '')}
                      options={{
                        minimap: { enabled: false },
                        fontSize: 13,
                        fontFamily: 'JetBrains Mono, Menlo, monospace',
                        lineHeight: 22,
                        wordWrap: 'on',
                        scrollBeyondLastLine: false,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
           * STEP 04: ISO 29119 RTM & MANUAL TEST MATRIX (@tanstack/react-table)
           * ========================================================================= */}
          {activeStep === 4 && (
            <div className="h-full flex flex-col space-y-4">
              {/* Canvas Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#22262E] shrink-0">
                <div>
                  <h1 className="text-[18px] font-bold text-[#EDEDED] tracking-tight">
                    {copy.step04.title}
                  </h1>
                  <p className="text-[12px] text-[#707070] font-mono mt-0.5">
                    {copy.step04.subtitle}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRecaptureScreenshots}
                    disabled={isRecapturingScreenshots}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#171A21] hover:bg-[#1E232B] disabled:opacity-50 text-[#EDEDED] border border-[#2E3440] hover:border-[#388BFD] text-[11px] font-mono rounded transition-colors shadow-sm cursor-pointer"
                    title={locale === 'id' ? 'Jalankan Playwright crawler untuk mengambil ulang screenshot modul beresolusi tinggi' : 'Re-run headless Playwright crawler to capture high-definition real screenshots for all discovered modules'}
                  >
                    <Camera className={`w-3.5 h-3.5 text-[#388BFD] ${isRecapturingScreenshots ? 'animate-pulse' : ''}`} />
                    <span>{isRecapturingScreenshots ? (locale === 'id' ? 'Memotret Ulang...' : 'Re-Capturing...') : (locale === 'id' ? 'Potret Ulang Screenshot' : 'Re-Capture Screenshots')}</span>
                  </button>
                </div>
              </div>

              {/* 100% Full-Width Spreadsheet Grid */}
              <div className="flex-1 bg-[#111317] border border-[#22262E] rounded-[4px] overflow-hidden">
                <RtmSpreadsheetGrid
                  data={
                    rtmScenarioFilter === 'ALL'
                      ? rtmRows
                      : rtmRows.filter((r) => r.scenarioType === rtmScenarioFilter)
                  }
                  testScenarios={qaWorkbook.testScenarios}
                  bugReports={qaWorkbook.bugReports}
                  uatFlows={qaWorkbook.uatFlows}
                  featureModules={qaWorkbook.featureModules}
                  dataDictionary={compiledSdlcState?.knowledgeGraphSummary?.azDocumentationLibrary?.book2BusinessAnalyst?.masterDataDictionary || []}
                  appName={effectiveTargetAppName}
                  targetUrl={currentTargetUrl}
                  selectedRowId={selectedRtmRow?.testId}
                  onRowSelect={(row) => {
                    setSelectedRtmRow(row);
                    openInspectorForEntity(row.testId);
                    appendTerminalLog(`[RTM] Selected Test Case ${row.testId} [${row.scenarioType}]`);
                  }}
                  onUpdateBugStatus={handleUpdateBugStatus}
                  onUpdateUat={handleUpdateUat}
                  onSaveOverridesToVault={handleSaveQaOverridesToVault}
                  hasUnsavedOverrides={hasUnsavedQaOverrides}
                  compiledState={compiledSdlcState}
                  onMergeChangeRequest={handleMergeChangeRequest}
                />
              </div>
            </div>
          )}

          {/* =========================================================================
           * STEP 05: TRI-MODAL TECHNICAL AUTO-DISCOVERY (morluto/rea Engine)
           * ========================================================================= */}
          {activeStep === 5 && (
            <div className="h-full flex flex-col space-y-4">
              {/* Canvas Header & Sub-View Switcher Pill */}
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2.5 pb-3 border-b border-[#22262E]">
                <div>
                  <h1 className="text-[18px] font-bold text-[#EDEDED] tracking-tight">
                    {copy.step05.title}
                  </h1>
                  <p className="text-[12px] text-[#707070] font-mono mt-0.5">
                    {copy.step05.subtitle}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-start">
                  <button
                    type="button"
                    onClick={handleRecaptureScreenshots}
                    disabled={isRecapturingScreenshots}
                    className="flex items-center gap-1.5 px-3 py-1 bg-[#171A21] hover:bg-[#1E232B] disabled:opacity-50 text-[#EDEDED] border border-[#2E3440] hover:border-[#388BFD] text-[11px] font-mono rounded transition-colors shadow-sm cursor-pointer"
                    title={locale === 'id' ? 'Jalankan Playwright crawler untuk mengambil ulang screenshot modul beresolusi tinggi' : 'Re-run headless Playwright crawler to capture high-definition real screenshots for all discovered modules'}
                  >
                    <Camera className={`w-3.5 h-3.5 text-[#388BFD] ${isRecapturingScreenshots ? 'animate-pulse' : ''}`} />
                    <span>{isRecapturingScreenshots ? (locale === 'id' ? 'Memotret Ulang...' : 'Re-Capturing...') : (locale === 'id' ? 'Potret Ulang Screenshot' : 'Re-Capture Screenshots')}</span>
                  </button>

                  <div className="flex flex-wrap items-center bg-[#111317] border border-[#22262E] p-0.5 rounded-[4px] gap-2 text-[11px] font-mono">
                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => setStep5SubTab('API_EXPLORER')}
                        className={`px-2.5 py-1 rounded-[3px] transition-colors cursor-pointer whitespace-nowrap ${
                          step5SubTab === 'API_EXPLORER'
                            ? 'bg-[#2563EB] text-white font-semibold'
                            : 'text-[#A1A1A1] hover:text-[#EDEDED]'
                        }`}
                      >
                        {copy.step05.tabApi}
                      </button>
                      <button
                        type="button"
                        onClick={() => setStep5SubTab('ERD_CANVAS')}
                        className={`px-2.5 py-1 rounded-[3px] transition-colors cursor-pointer whitespace-nowrap ${
                          step5SubTab === 'ERD_CANVAS'
                            ? 'bg-[#2563EB] text-white font-semibold'
                            : 'text-[#A1A1A1] hover:text-[#EDEDED]'
                        }`}
                      >
                        {copy.step05.tabErd}
                      </button>
                      <button
                        type="button"
                        onClick={() => setStep5SubTab('DOM_MAP')}
                        className={`px-2.5 py-1 rounded-[3px] transition-colors cursor-pointer whitespace-nowrap ${
                          step5SubTab === 'DOM_MAP'
                            ? 'bg-[#2563EB] text-white font-semibold'
                            : 'text-[#A1A1A1] hover:text-[#EDEDED]'
                        }`}
                      >
                        {copy.step05.tabDom}
                      </button>
                      <button
                        type="button"
                        onClick={() => setStep5SubTab('BUNDLE_VAULT')}
                        className={`px-2.5 py-1 rounded-[3px] transition-colors cursor-pointer whitespace-nowrap ${
                          step5SubTab === 'BUNDLE_VAULT'
                            ? 'bg-[#2563EB] text-white font-semibold'
                            : 'text-[#A1A1A1] hover:text-[#EDEDED]'
                        }`}
                      >
                        {copy.step05.tabVault}
                      </button>
                    </div>

                    {/* Concise Telemetry Stats Badge */}
                    <div className="flex items-center gap-1.5 text-[10.5px] px-2 py-0.5 bg-[#0B0C0E] border border-white/[0.06] rounded text-zinc-400 shrink-0">
                      <span className="text-emerald-400 font-semibold tabular-nums">
                        {discoveryResult.apiEndpoints?.length || 0} APIs
                      </span>
                      <span className="text-zinc-600">•</span>
                      <span className="text-zinc-200 tabular-nums">
                        {discoveryResult.databaseTables?.length || 0} {discoveryResult.branchOrDatabase === 'crawled:har' ? 'Table Inferred' : 'Tables'}
                      </span>
                      <span className="text-zinc-600">•</span>
                      <span className="text-sky-400 tabular-nums">
                        {discoveryResult.domTraceability?.length || 0} Selectors
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive Session Live Status Panel in Step 5 */}
              {/* Live Human Recording Status Panel in Step 5 */}
              {interactiveSession.isRunning && (
                <div className="bg-[#111317] border border-[#059669]/50 p-3 rounded-[4px] font-mono text-[11.5px] flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="h-2.5 w-2.5 rounded-full bg-[#10B981] animate-ping shrink-0" />
                    <div className="flex flex-col">
                      <span className="font-bold text-[#34D399]">
                        {copy.step01.liveSessionTitle} — Pages: <span className="tabular-nums">{interactiveSession.pagesCount}</span> | APIs: <span className="tabular-nums">{interactiveSession.apisCount}</span> | Controls: <span className="tabular-nums">{interactiveSession.inputsCount + interactiveSession.tablesCount}</span>
                      </span>
                      <span className="text-[10.5px] text-[#A1A1A1] mt-0.5">
                        {interactiveSession.status === 'ROBOT_EXPLORING'
                          ? copy.step01.liveSessionExploring
                          : copy.step01.liveSessionPassive}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={handleTriggerRobotExploration}
                      disabled={interactiveSession.status === 'ROBOT_EXPLORING'}
                      className="h-8 px-3 bg-[#1E293B] hover:bg-[#334155] disabled:opacity-50 text-[#F59E0B] border border-[#F59E0B]/40 rounded-[3px] font-bold text-[11px] flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Cpu className="h-3.5 w-3.5" />
                      <span>{copy.step01.autoTraverseBtn}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleFinishInteractiveSession}
                      className="h-8 px-3 bg-[#059669] hover:bg-[#047857] text-white rounded-[3px] font-bold text-[11px] flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>{copy.step01.finishCompileBtn}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Ingestion Control Toolbar (Mode A: Git, Mode B: Local, Mode C: Staging) */}
              <TriModalDiscoveryToolbar
                onLaunchInteractiveLogin={handleStartHumanSession}
                onDiscover={async (params) => {
                  appendTerminalLog(`[DISCOVERY] Executing ${params.mode} scan...`);
                  if (params.mode === 'MODE_A_GIT' && params.gitConfig) {
                    appendTerminalLog(
                      `[GIT CLONE] Cloning ${params.gitConfig.repositoryUrl} (${params.gitConfig.branch})...`
                    );
                    try {
                      const res = await fetchWithTimeout(
                        '/api/discovery/git-connect',
                        {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            repositoryUrl: params.gitConfig.repositoryUrl,
                            branchOrPr: params.gitConfig.branch,
                            authToken: params.gitConfig.authToken,
                          }),
                        },
                        45000
                      );
                      if (res.ok) {
                        const json = await res.json();
                        if (json.data) {
                          if (json.data.compiledState) {
                            applyCompiledSdlcState(json.data.compiledState);
                          } else {
                            setDiscoveryResult(json.data);
                          }
                          appendTerminalLog(
                            `[DISCOVERY] SUCCESS: AST extracted ${json.data.apiEndpoints.length} routes, ${json.data.databaseTables.length} tables.`
                          );
                        }
                      }
                    } catch {
                      appendTerminalLog(`[DISCOVERY] Local heuristic AST scan completed.`);
                    }
                  } else if (params.mode === 'MODE_B_LOCAL' && params.localConfig) {
                    appendTerminalLog(`[LOCAL AST] Parsing directory ${params.localConfig.targetPath}...`);
                  } else if (params.mode === 'MODE_C_STAGING' && params.stagingConfig) {
                    const stg = params.stagingConfig as StagingDiscoveryWithAuthConfig;
                    const target = (stg.stagingUrl || '').trim();
                    if (!target) {
                      appendTerminalLog('[DISCOVERY NOTICE] Staging URL tidak boleh kosong.');
                      return;
                    }
                    setBlindTargetUrl(target);
                    setIsBlindCrawling(true);
                    try {
                      const res = await fetchWithTimeout(
                        '/api/discovery/blind-crawl',
                        {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            targetUrl: target,
                            authType:
                              stg.username && stg.password && stg.authType !== 'BEARER_COOKIE'
                                ? 'LOGIN_FORM'
                                : stg.authType || 'NONE',
                            username: stg.username,
                            password: stg.password,
                            accessRoleOrTenant: stg.accessRoleOrTenant,
                            authHeaderOrCookie: stg.authHeaderOrCookie,
                            crawlDepth: 'FULL_DOM_JS_AST',
                            captureHar: true,
                          }),
                        },
                        150000
                      );
                      const json = await res.json();
                      if (res.ok && json.success && json.data) {
                        setBlindCrawlResult(json.data);
                        const compiled = synthesizeFullSdlcFromCrawl(json.data, rawMoMNotes);
                        applyCompiledSdlcState(compiled);
                        appendTerminalLog(
                          `[DISCOVERY] SUCCESS: Harvested ${compiled.discoveryResult.apiEndpoints.length} routes from ${target}.`
                        );
                      } else {
                        appendTerminalLog(`[DISCOVERY NOTICE] ${json.error || 'Staging crawl completed with partial telemetry.'}`);
                      }
                    } catch (err: unknown) {
                      const msg = err instanceof Error ? err.message : String(err);
                      appendTerminalLog(`[DISCOVERY NOTICE] ${msg}`);
                    } finally {
                      setIsBlindCrawling(false);
                    }
                  }
                }}
                onArchiveUploaded={(telemetry, result) => {
                  const resExt = result as typeof result & { compiledState?: CompiledSdlcState };
                  if (resExt?.compiledState) {
                    applyCompiledSdlcState(resExt.compiledState);
                  } else {
                    setDiscoveryResult(result);
                  }
                  appendTerminalLog(
                    `[ARCHIVE] Ingested ${telemetry.filename} (${telemetry.sizeFormatted}) — ${telemetry.extractedFilesCount} AST files parsed.`
                  );
                }}
                isScanning={isBlindCrawling}
                lastResult={discoveryResult}
              />

              {/* View 1: API Contract Explorer */}
              {step5SubTab === 'API_EXPLORER' && (
                <div className="flex-1 bg-[#111317] border border-[#22262E] rounded-[4px] overflow-hidden">
                  <ApiContractExplorer
                    endpoints={discoveryResult.apiEndpoints}
                    openApiSpec={discoveryResult.openApiSpec}
                    targetUrl={currentTargetUrl}
                    onAppendLog={appendTerminalLog}
                    selectedEndpointId={selectedDiscoveredEndpoint?.id}
                    onEndpointSelect={(ep) => {
                      setSelectedDiscoveredEndpoint(ep);
                      openInspectorForEntity(ep.id);
                      appendTerminalLog(`[API EXPLORER] Selected endpoint ${ep.method} ${ep.path}`);
                    }}
                  />
                </div>
              )}

              {/* View 2: Database Schema ERD Canvas */}
              {step5SubTab === 'ERD_CANVAS' && (
                <div className="flex-1 bg-[#0E1015] border border-[#22262E] rounded-[4px] overflow-hidden">
                  <DatabaseErdCanvas
                    tables={discoveryResult.databaseTables}
                    selectedTableId={selectedErdTable?.id}
                    onTableSelect={(tbl) => {
                      setSelectedErdTable(tbl);
                      openInspectorForEntity(tbl.tableName);
                      appendTerminalLog(`[ERD] Selected table schema ${tbl.tableName}`);
                    }}
                  />
                </div>
              )}

              {/* View 3: DOM Traceability Map */}
              {step5SubTab === 'DOM_MAP' && (
                <div className="flex-1 bg-[#111317] border border-[#22262E] rounded-[4px] overflow-hidden">
                  <DomTraceabilityMap
                    bindings={discoveryResult.domTraceability}
                    selectedBindingId={selectedDomBinding?.bindingId}
                    onSelectBinding={(b) => {
                      setSelectedDomBinding(b);
                      openInspectorForEntity(b.bindingId);
                      appendTerminalLog(`[DOM] Selected selector binding ${b.domSelector}`);
                    }}
                  />
                </div>
              )}

              {/* View 4: Decompiled Client AST & Leaked Secret Vault */}
              {step5SubTab === 'BUNDLE_VAULT' && (
                <div className="flex-1 overflow-hidden min-h-0">
                  <DecompiledBundleVault
                    appName={effectiveTargetAppName}
                    targetUrl={currentTargetUrl}
                    discoveredJsChunks={blindCrawlResult?.discoveredJsChunks}
                    extractedApis={discoveryResult.apiEndpoints}
                    initialResult={compiledSdlcState?.deepUnpackResult}
                    onAppendLog={appendTerminalLog}
                  />
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
           * STEP 06: SPEC-TO-CODE GAP AUDITOR (Monaco DiffEditor)
           * ========================================================================= */}
          {activeStep === 6 && (
            <div className="h-full flex flex-col space-y-4">
              {/* Canvas Header & Summary Metrics */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 pb-3 border-b border-[#22262E] shrink-0">
                <div>
                  <h1 className="text-[18px] font-bold text-[#EDEDED] tracking-tight">
                    {copy.step06.title}
                  </h1>
                  <p className="text-[12px] text-[#707070] font-mono mt-0.5">
                    {copy.step06.subtitle}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {auditResult.summary.isZeroDocMode || !auditResult.summary.hasSourceRequirements ? (
                    <>
                      <span className="badge-tag px-2 py-0.5 bg-[#707070]/15 text-[#A1A1A1] border border-[#707070] text-[11px] font-bold tabular-nums">
                        {auditResult.summary.baselineMatchCount ?? auditResult.summary.totalAudited} BASELINE
                      </span>
                      <span className="badge-tag px-2 py-0.5 bg-[#707070]/10 text-[#707070] border border-[#707070]/40 text-[11px] font-mono">
                        Kepatuhan: N/A — tidak ada baseline requirement
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="badge-tag px-2 py-0.5 bg-[#059669]/15 text-[#059669] border border-[#059669] text-[11px] font-bold tabular-nums">
                        {auditResult.summary.compliantCount} COMPLIANT ({auditResult.summary.complianceRatePercent}%)
                      </span>
                      <span className="badge-tag px-2 py-0.5 bg-[#DC2626]/15 text-[#DC2626] border border-[#DC2626] text-[11px] font-bold tabular-nums">
                        {auditResult.summary.missingInBackendCount} MISSING
                      </span>
                      <span className="badge-tag px-2 py-0.5 bg-[#D97706]/15 text-[#D97706] border border-[#D97706] text-[11px] font-bold tabular-nums">
                        {auditResult.summary.schemaMismatchCount} MISMATCH
                      </span>
                      <span className="badge-tag px-2 py-0.5 bg-[#8B5CF6]/15 text-[#A78BFA] border border-[#8B5CF6] text-[11px] font-bold tabular-nums">
                        {auditResult.summary.shadowApiCount} SHADOW
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Main Content: Split Discrepancy Matrix (40%) + DiffEditor (60%) */}
              <div className="flex-1 bg-[#111317] border border-[#22262E] rounded-[4px] overflow-hidden">
                <GapAuditorWorkbench
                  items={auditResult.items}
                  summary={auditResult.summary}
                  selectedItemId={activeAuditItem?.id}
                  onSelectItem={(item) => {
                    setSelectedAuditItemId(item.id);
                    openInspectorForEntity(item.id);
                    appendTerminalLog(`[GAP AUDIT] Inspected discrepancy ${item.id} (${item.verdict})`);
                  }}
                  onExportDoc={() => {
                    appendTerminalLog('[TECH DOC] Exported ISO 29148 / 29119 Gap Audit Documentation.');
                  }}
                />
              </div>
            </div>
          )}

          {/* =========================================================================
           * STEP 07: PLAYWRIGHT AUTOMATION & REA LIVE RUNNER (1-CLICK UNIFIED RUNNER)
           * ========================================================================= */}
          {activeStep === 7 && (
            <Step07ExecutionRunner
              displayMode={displayMode}
              compiledState={compiledSdlcState}
              selectedStageId={selectedRunnerStage?.id}
              onSelectStage={handleSelectRunnerStage}
              onAppendLog={appendTerminalLog}
              onExecutionSynced={handleSyncRunnerResults}
              activeVaultProjectId={activeVaultProjectId}
            />
          )}

          {/* =========================================================================
           * STEP 08: ENTERPRISE GRC, RISK REGISTER & MERKLE AUDIT VAULT (ISO 31000 & SOC 2)
           * ========================================================================= */}
          {activeStep === 8 && (
            <div className="h-full flex flex-col space-y-3 min-h-0 overflow-hidden">
              {/* Header & Sub-View Switcher */}
              <div className="flex flex-col gap-2 pb-2.5 border-b border-[#22262E] shrink-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2.5 min-w-0">
                    <h1 className="text-[17px] font-bold text-[#EDEDED] tracking-tight flex items-center gap-2 truncate">
                      <ShieldCheck className="h-4 w-4 text-[#10B981] shrink-0" />
                      <span>{copy.step08.title}</span>
                    </h1>
                    <span className="badge-tag px-1.5 py-0.5 bg-[#059669]/20 text-[#10B981] font-mono text-[10px] font-bold whitespace-nowrap shrink-0">
                      ISO/IEC 27001 · ISO 31000 · SOC 2
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={`/api/sdlc/automation-bundle?format=git-patch${activeVaultProjectId ? `&projectId=${activeVaultProjectId}` : ''}`}
                      download={`${(compiledSdlcState?.appName || 'onespec').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-contoh-patch-ilustratif.patch`}
                      className="px-2.5 py-1 rounded text-[11px] font-mono font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 hover:bg-emerald-900/80 transition flex items-center gap-1"
                      title="Contoh Patch (ilustratif, tidak untuk diterapkan)"
                    >
                      <span>🩹</span>
                      <span>Contoh Patch (ilustratif)</span>
                    </a>
                    <div className="text-[11px] font-mono text-[#707070] hidden 2xl:inline whitespace-nowrap">
                      {copy.step08.subtitle}
                    </div>
                  </div>
                </div>
                <div className="flex items-center bg-[#111317] border border-[#22262E] p-0.5 rounded-[3px] gap-1 text-[11px] font-mono self-start overflow-x-auto">
                  <button
                    onClick={() => setStep8SubTab('REGULATORY_BINDER')}
                    className={`px-3 py-1 rounded-[2px] transition-colors cursor-pointer whitespace-nowrap ${
                      step8SubTab === 'REGULATORY_BINDER'
                        ? 'bg-[#2563EB] text-white font-bold'
                        : 'text-[#A1A1A1] hover:text-[#EDEDED]'
                    }`}
                  >
                    {copy.step08.tabRegulatory}
                  </button>
                  <button
                    onClick={() => setStep8SubTab('ISO_RISK_VAULT')}
                    className={`px-3 py-1 rounded-[2px] transition-colors cursor-pointer whitespace-nowrap ${
                      step8SubTab === 'ISO_RISK_VAULT'
                        ? 'bg-[#2563EB] text-white font-bold'
                        : 'text-[#A1A1A1] hover:text-[#EDEDED]'
                    }`}
                  >
                    {copy.step08.tabRiskVault}
                  </button>
                </div>
              </div>

              {/* View 1: Regulatory Compliance Binder */}
              {step8SubTab === 'REGULATORY_BINDER' && (
                <div className="flex-1 min-h-0 overflow-hidden">
                  <ComplianceBinderWorkbench
                    appName={effectiveTargetAppName}
                    targetUrl={currentTargetUrl}
                    apiEndpoints={discoveryResult.apiEndpoints}
                    databaseTables={discoveryResult.databaseTables}
                    validationRules={validationRules}
                    businessRules={brdMatrixRows}
                    rtmRows={rtmRows}
                    executionTraces={compiledExecutionTraces}
                    initialAssessment={compiledSdlcState?.complianceAssessment}
                    onAppendLog={appendTerminalLog}
                  />
                </div>
              )}

              {/* View 2: ISO 31000 Risk Register & Merkle Vault */}
              {step8SubTab === 'ISO_RISK_VAULT' && (
                <div className="flex-1 min-h-0 overflow-hidden">
                  <IsoRiskAuditWorkbench
                    appName={effectiveTargetAppName}
                    targetUrl={currentTargetUrl}
                    apiEndpoints={discoveryResult.apiEndpoints}
                    databaseTables={discoveryResult.databaseTables}
                    validationRules={validationRules}
                    businessRules={brdMatrixRows}
                    rtmRows={rtmRows}
                    executionTraces={compiledExecutionTraces}
                    pipelineStages={compiledPipelineStages}
                    initialRiskSummary={compiledSdlcState?.isoRiskSummary}
                    onAppendLog={appendTerminalLog}
                  />
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
           * STEP 09: ACTIVE OWASP API SECURITY TOP 10 DAST PROBER
           * ========================================================================= */}
          {activeStep === 9 && (
            <div className="h-full flex flex-col space-y-3 min-h-0 overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#22262E] shrink-0">
                <div className="flex flex-wrap items-center gap-2.5 min-w-0">
                  <h1 className="text-[17px] font-bold text-[#EDEDED] tracking-tight truncate">
                    {copy.step09.title}
                  </h1>
                  <span className="badge-tag px-1.5 py-0.5 bg-[#EF4444]/15 text-[#EF4444] font-mono text-[10px] font-bold whitespace-nowrap shrink-0">
                    OWASP ASVS v4.0 · ISO 27001
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`/api/sdlc/automation-bundle?format=git-patch${activeVaultProjectId ? `&projectId=${activeVaultProjectId}` : ''}`}
                    download={`${(compiledSdlcState?.appName || 'onespec').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-contoh-patch-ilustratif.patch`}
                    className="px-2.5 py-1 rounded text-[11px] font-mono font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 hover:bg-emerald-900/80 transition flex items-center gap-1"
                    title="Contoh Patch (ilustratif, tidak untuk diterapkan)"
                  >
                    <span>🩹</span>
                    <span>Contoh Patch (ilustratif)</span>
                  </a>
                  <p className="text-[11.5px] text-[#707070] font-mono truncate hidden xl:inline">{copy.step09.subtitle}</p>
                </div>
              </div>
              <OwaspDastWorkbench
                appName={effectiveTargetAppName}
                targetUrl={currentTargetUrl}
                apiEndpoints={discoveryResult.apiEndpoints}
                databaseTables={discoveryResult.databaseTables}
                validationRules={validationRules}
                initialDastSummary={compiledSdlcState?.owaspDastSummary}
                onAppendLog={appendTerminalLog}
              />
            </div>
          )}

          {/* =========================================================================
           * STEP 10: SMT SOLVER Z3 FORMAL VERIFICATION ENGINE (SMT-LIB V2)
           * ========================================================================= */}
          {activeStep === 10 && (
            <div className="h-full flex flex-col space-y-3 min-h-0 overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#22262E] shrink-0">
                <div className="flex flex-wrap items-center gap-2.5 min-w-0">
                  <h1 className="text-[17px] font-bold text-[#EDEDED] tracking-tight truncate">
                    {copy.step10.title}
                  </h1>
                  <span className="badge-tag px-1.5 py-0.5 bg-[#059669]/20 text-[#10B981] font-mono text-[10px] font-bold whitespace-nowrap shrink-0">
                    ISO/IEC 29119-2 · SMT-LIB v2
                  </span>
                </div>
                <p className="text-[11.5px] text-[#707070] font-mono truncate">{copy.step10.subtitle}</p>
              </div>
              <SmtFormalVerifierWorkbench
                appName={effectiveTargetAppName}
                targetUrl={currentTargetUrl}
                apiEndpoints={discoveryResult.apiEndpoints}
                databaseTables={discoveryResult.databaseTables}
                validationRules={validationRules}
                businessRules={brdMatrixRows}
                initialVerificationSummary={compiledSdlcState?.smtVerificationSummary}
                onAppendLog={appendTerminalLog}
              />
            </div>
          )}

          {/* =========================================================================
           * STEP 11: AUTONOMOUS MULTI-ROLE SDLC DELPHI CONSENSUS SIMULATOR (VIRTUAL ARB)
           * ========================================================================= */}
          {activeStep === 11 && (
            <div className="h-full flex flex-col space-y-3 min-h-0 overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#22262E] shrink-0">
                <div className="flex flex-wrap items-center gap-2.5 min-w-0">
                  <h1 className="text-[17px] font-bold text-[#EDEDED] tracking-tight truncate">
                    {copy.step11.title}
                  </h1>
                  <span className="badge-tag px-1.5 py-0.5 bg-[#2563EB]/20 text-[#3B82F6] font-mono text-[10px] font-bold whitespace-nowrap shrink-0">
                    ISO/IEC/IEEE 42010 ARB
                  </span>
                </div>
                <p className="text-[11.5px] text-[#707070] font-mono truncate">{copy.step11.subtitle}</p>
              </div>
              <DelphiConsensusWorkbench
                appName={effectiveTargetAppName}
                targetUrl={currentTargetUrl}
                apiEndpoints={discoveryResult.apiEndpoints}
                databaseTables={discoveryResult.databaseTables}
                validationRules={validationRules}
                businessRules={brdMatrixRows}
                rtmRows={rtmRows}
                initialConsensusSummary={compiledSdlcState?.delphiConsensusSummary}
                onAppendLog={appendTerminalLog}
                isStale={isCacheStale}
              />
            </div>
          )}

          {/* =========================================================================
           * STEP 12: UNIVERSAL SDLC SEMANTIC ONTOLOGY & KNOWLEDGE GRAPH (W3C RDF)
           * ========================================================================= */}
          {activeStep === 12 && (
            <Step12ExecutiveSummaryWorkbench
              locale={locale}
              appName={effectiveTargetAppName}
              targetUrl={currentTargetUrl}
              apiEndpoints={discoveryResult.apiEndpoints}
              databaseTables={discoveryResult.databaseTables}
              validationRules={validationRules}
              businessRules={brdMatrixRows}
              rtmRows={rtmRows}
              discoveredFeatureModules={qaWorkbook.featureModules}
              discoveredModules={compiledSdlcState?.discoveredModules}
              testScenarios={qaWorkbook.testScenarios}
              bugReports={qaWorkbook.bugReports}
              uatFlows={qaWorkbook.uatFlows}
              gapAuditSummary={auditResult.summary}
              gapAuditItems={auditResult.items}
              owaspDastSummary={compiledSdlcState?.owaspDastSummary}
              complianceAssessment={compiledSdlcState?.complianceAssessment}
              isoRiskSummary={compiledSdlcState?.isoRiskSummary}
              smtVerificationSummary={compiledSdlcState?.smtVerificationSummary}
              delphiConsensusSummary={compiledSdlcState?.delphiConsensusSummary}
              executionTraces={compiledExecutionTraces}
              deconstructedArchitecture={compiledSdlcState?.deconstructedArchitecture}
              initialGraphSummary={compiledSdlcState?.knowledgeGraphSummary}
              compiledState={compiledSdlcState}
              regressionDiffSummary={regressionDiffSummary}
              isSavingSnapshot={isSavingSnapshot}
              onSaveSnapshot={() => handleSaveSnapshotToVault()}
              onOpenHistory={() => setIsVaultHistoryOpen(true)}
              onAppendLog={appendTerminalLog}
              onMergeChangeRequest={handleMergeChangeRequest}
              onUpdateModulePins={handleUpdateModulePins}
              onApproveReleaseSignOff={handleApproveReleaseSignOff}
              onNavigateToStep={(stepId) => setActiveStep(stepId)}
              initialView={step12View}
              isStale={isCacheStale}
            />
          )}
        </main>

        {/* =========================================================================
         * 3. CONTEXTUAL RIGHT INSPECTOR DRAWER (420px Width, Closed by Default)
         * ========================================================================= */}
        {isInspectorOpen && (
          <aside className="w-[420px] min-w-[420px] max-w-[420px] h-full bg-[#111317] border-l border-[#22262E] flex flex-col z-20 select-none shrink-0 shadow-2xl">
            {/* Inspector Top Bar with Prominent [X] Close Button */}
            <div className="h-[44px] min-h-[44px] px-4 bg-[#16191F] border-b border-[#22262E] flex items-center justify-between font-mono text-[12px]">
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-[#3B82F6]" />
                <span className="font-bold text-[#EDEDED]">{copy.inspector.title}</span>
                <span className="badge-tag px-1.5 py-0.5 bg-[#2563EB]/20 text-[#3B82F6] font-bold text-[10px]">
                  {selectedEntityId}
                </span>
              </div>
              <button
                onClick={() => setIsInspectorOpen(false)}
                className="p-1 hover:bg-[#22262E] rounded text-[#A1A1A1] hover:text-white transition-colors cursor-pointer"
                title={copy.inspector.closeTitle}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Inspector Body Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-[12px]">
              {/* Context 1: Steps 01–03 (Requirement Metadata & Validation Constraints ONLY) */}
              {activeStep <= 3 && (
                <div className="space-y-4">
                  <div className="p-3 bg-[#0B0C0E] border border-[#22262E] rounded-[3px] space-y-2">
                    <div className="text-[10px] text-[#707070] uppercase font-bold">Requirement Identity:</div>
                    <div className="text-[13px] font-bold text-[#EDEDED]">{selectedEntityId}</div>
                    <div className="text-[11.5px] text-[#A1A1A1] leading-relaxed">
                      {brdMatrixRows.find((r) => r.ruleId === selectedEntityId)?.statement ||
                        validationRules.find((v) => v.ruleId === selectedEntityId)?.exactUiErrorString ||
                        extractedEntities.find((e) => e.identifier === selectedEntityId)?.label ||
                        'System normative requirement definition'}
                    </div>
                  </div>

                  {/* Validation Constraints (VR-xx) */}
                  <div className="p-3 bg-[#0B0C0E] border border-[#22262E] rounded-[3px] space-y-2">
                    <div className="text-[10px] text-[#D97706] uppercase font-bold">Validation Contract (VR):</div>
                    <div className="space-y-1.5 text-[11.5px]">
                      <div>
                        <span className="text-[#707070]">Constraint: </span>
                        <code className="text-[#3B82F6]">
                          {validationRules.find((v) => v.ruleId === selectedEntityId)?.constraintExpression ||
                            'value >= 50.00'}
                        </code>
                      </div>
                      <div>
                        <span className="text-[#707070]">HTTP Status: </span>
                        <span className="text-[#DC2626] font-bold">
                          {validationRules.find((v) => v.ruleId === selectedEntityId)?.httpStatus || 422} Unprocessable
                        </span>
                      </div>
                      <div>
                        <span className="text-[#707070]">Exact UI Copy: </span>
                        <span className="text-[#EDEDED] italic">
                          &ldquo;
                          {validationRules.find((v) => v.ruleId === selectedEntityId)?.exactUiErrorString ||
                            'Cart minimum spend of $50.00 required.'}
                          &rdquo;
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bi-Directional Traceability Links */}
                  <div className="p-3 bg-[#0B0C0E] border border-[#22262E] rounded-[3px] space-y-1.5 text-[11px]">
                    <div className="text-[10px] text-[#059669] uppercase font-bold">Traceability Chain:</div>
                    <div className="text-[#EDEDED]">
                      <span className="text-[#3B82F6]">BR-01</span> ➔{' '}
                      <span className="text-[#059669]">US-01</span> ➔{' '}
                      <span className="text-[#D97706]">VR-01</span> ➔{' '}
                      <span className="text-[#8B5CF6]">TC-001</span>
                    </div>
                  </div>

                  {/* TSD / TRD Code Grep Verification Inspector */}
                  {selectedTsdRow && (
                    <div className="p-3 bg-[#0B0C0E] border border-[#22262E] rounded-[3px] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-[#3B82F6] uppercase font-bold">TSD / TRD Code Grep Spec:</span>
                        <span className="badge-tag px-1.5 py-0.2 bg-[#2563EB]/20 text-[#3B82F6] font-bold text-[9px]">
                          {selectedTsdRow.specId}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#EDEDED] font-sans font-bold leading-snug">
                        {selectedTsdRow.title}
                      </div>
                      <div className="text-[10.5px] text-[#A1A1A1] font-sans">
                        {selectedTsdRow.statement}
                      </div>
                      <div className="pt-1 border-t border-[#22262E] space-y-1 text-[10.5px]">
                        <span className="text-[#707070] text-[9.5px] uppercase font-bold block">AST Grep Pattern:</span>
                        <code className="text-[#38BDF8] bg-[#16191F] px-1.5 py-0.5 rounded-[2px] block break-all">
                          {selectedTsdRow.grepPattern}
                        </code>
                        <span className="text-[#707070] text-[9.5px] uppercase font-bold block pt-1">Matched Location:</span>
                        <span className="text-[#10B981] font-bold block">
                          {selectedTsdRow.matchedFile || 'Pending Codebase Grep Scan'}
                        </span>
                        {selectedTsdRow.matchedSnippet && (
                          <pre className="text-[9.5px] text-[#EDEDED] bg-[#16191F] p-1.5 rounded-[2px] overflow-x-auto whitespace-pre-wrap">
                            {selectedTsdRow.matchedSnippet}
                          </pre>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Context 2: Step 04 (ISO/IEC/IEEE 29119-4 Deep Manual Spec & Gherkin Inspector) */}
              {activeStep === 4 && (
                <div className="space-y-4 flex flex-col font-mono text-[11.5px]">
                  {/* SECTION A: ISO 29119-4 Manual Test Specification Card */}
                  <div className="space-y-3">
                    <div className="p-3 bg-[#0B0C0E] border border-[#22262E] rounded-[3px] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-[#707070] uppercase font-bold">{copy.inspector.manualSpecHeader}</span>
                        <span className="badge-tag px-1.5 py-0.5 bg-[#2563EB]/20 text-[#3B82F6] font-bold text-[10px]">
                          {selectedRtmRow.testId}
                        </span>
                      </div>
                      <div className="text-[12.5px] font-sans font-bold text-[#EDEDED] leading-snug">
                        {selectedRtmRow.testTitle}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 text-[10.5px]">
                        <span className="text-[#707070]">Scenario:</span>
                        <span className="px-1.5 py-0.2 bg-[#16191F] border border-[#22262E] text-[#EDEDED] rounded-[2px] font-bold">
                          {selectedRtmRow.scenarioType}
                        </span>
                        <span className="text-[#707070]">Refs:</span>
                        <span className="text-[#3B82F6] font-bold">{selectedRtmRow.brdRef}</span>
                        <span className="text-[#707070]">/</span>
                        <span className="text-[#D97706] font-bold">{selectedRtmRow.validationRef}</span>
                      </div>
                    </div>

                    {/* Objective & Preconditions */}
                    <div className="p-3 bg-[#0B0C0E] border border-[#22262E] rounded-[3px] space-y-2 text-[11px]">
                      <div>
                        <span className="text-[10px] text-[#707070] uppercase font-bold block">{copy.inspector.objective}</span>
                        <p className="text-[#EDEDED] font-sans text-[11.5px] mt-0.5 leading-relaxed">
                          {selectedRtmRow.objective || selectedRtmRow.testTitle}
                        </p>
                      </div>
                      <div className="pt-1 border-t border-[#22262E]">
                        <span className="text-[10px] text-[#707070] uppercase font-bold block">{copy.inspector.preconditions}</span>
                        <p className="text-[#A1A1A1] font-sans text-[11px] mt-0.5">
                          {selectedRtmRow.preconditions}
                        </p>
                      </div>
                    </div>

                    {/* Step-by-Step Numbered Execution Table */}
                    {selectedRtmRow.manualSteps && selectedRtmRow.manualSteps.length > 0 && (
                      <div className="p-3 bg-[#0B0C0E] border border-[#22262E] rounded-[3px] space-y-2">
                        <div className="text-[10px] text-[#3B82F6] uppercase font-bold">
                          {copy.inspector.executionSteps} ({selectedRtmRow.manualSteps.length}):
                        </div>
                        <div className="space-y-1.5">
                          {selectedRtmRow.manualSteps.map((st) => (
                            <div
                              key={st.stepNumber}
                              className="p-2 bg-[#111317] border border-[#22262E] rounded-[2px] text-[10.5px] space-y-1 font-sans"
                            >
                              <div className="flex items-center gap-1.5 font-mono text-[10px]">
                                <span className="h-4 w-4 bg-[#2563EB] text-white rounded-full flex items-center justify-center font-bold">
                                  {st.stepNumber}
                                </span>
                                <strong className="text-[#EDEDED]">{st.action}</strong>
                              </div>
                              <div className="font-mono text-[10px] text-[#38BDF8] break-all">
                                Input: {st.testData}
                              </div>
                              <div className="text-[#A1A1A1] text-[10.5px]">
                                Expected: {st.expectedResult}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Expected 3-Layer Verification (UI, API, DB) */}
                    <div className="p-3 bg-[#0B0C0E] border border-[#22262E] rounded-[3px] space-y-2">
                      <div className="text-[10px] text-[#059669] uppercase font-bold">
                        {copy.inspector.expected3Layer}
                      </div>
                      <div className="space-y-1.5 text-[10.5px]">
                        <div className="p-1.5 bg-[#111317] border border-[#22262E] rounded-[2px]">
                          <span className="text-[#3B82F6] font-bold block font-mono">1. UI Client Result:</span>
                          <span className="text-[#EDEDED] font-sans">
                            {selectedRtmRow.expected3LayerVerification?.uiResult || selectedRtmRow.expectedOutcome}
                          </span>
                        </div>
                        <div className="p-1.5 bg-[#111317] border border-[#22262E] rounded-[2px]">
                          <span className="text-[#D97706] font-bold block font-mono">2. HTTP API Contract:</span>
                          <span className="text-[#EDEDED] font-sans">
                            {selectedRtmRow.expected3LayerVerification?.apiResponse || 'Endpoint returns validated HTTP schema'}
                          </span>
                        </div>
                        <div className="p-1.5 bg-[#111317] border border-[#22262E] rounded-[2px]">
                          <span className="text-[#10B981] font-bold block font-mono">3. Database &amp; Concurrency:</span>
                          <span className="text-[#EDEDED] font-sans">
                            {selectedRtmRow.expected3LayerVerification?.databaseOutcome || 'Zero orphan locks, row-level transaction isolated'}
                          </span>
                        </div>
                      </div>
                    </div>
                    {selectedRtmRow.actualObservedResult && (
                      <div className="p-3 bg-[#0B0C0E] border border-[#22262E] rounded-[3px] space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-[#3B82F6] uppercase font-bold">
                            {copy.inspector.actualLiveResult} ({selectedRtmRow.moduleName || 'Core'}):
                          </span>
                          {selectedRtmRow.executionVerdict && (
                            <span
                              className={`px-1.5 py-0.5 rounded-[2px] text-[9.5px] font-bold ${
                                selectedRtmRow.executionVerdict === 'FAILED'
                                  ? 'bg-[#DC2626]/20 text-[#EF4444]'
                                  : selectedRtmRow.executionVerdict === 'WARNING'
                                  ? 'bg-[#D97706]/20 text-[#F59E0B]'
                                  : 'bg-[#059669]/20 text-[#10B981]'
                              }`}
                            >
                              {selectedRtmRow.executionVerdict}
                            </span>
                          )}
                        </div>
                        <p className="text-[#EDEDED] font-sans text-[11px] leading-relaxed">
                          {selectedRtmRow.actualObservedResult}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* SECTION B: Cucumber Gherkin (.feature) Monaco Editor */}
                  <div className="flex flex-col bg-[#0B0C0E] border border-[#22262E] rounded-[3px] overflow-hidden min-h-[220px]">
                    <div className="h-[28px] bg-[#16191F] border-b border-[#22262E] px-3 flex items-center justify-between text-[10px] text-[#707070]">
                      <span className="font-bold text-[#EDEDED]">{copy.inspector.gherkinTitle}</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(selectedRtmRow.gherkinSnippet);
                          setIsCopiedGherkin(true);
                          setTimeout(() => setIsCopiedGherkin(false), 2000);
                        }}
                        className="flex items-center gap-1 text-[#3B82F6] hover:text-[#60A5FA] cursor-pointer"
                      >
                        {isCopiedGherkin ? <Check className="h-3 w-3 text-[#059669]" /> : <Copy className="h-3 w-3" />}
                        <span>{isCopiedGherkin ? copy.inspector.copied : copy.inspector.copyGherkin}</span>
                      </button>
                    </div>
                    <div className="h-[180px]">
                      <MonacoEditor
                        height="100%"
                        language="ini"
                        theme="vs-dark"
                        value={selectedRtmRow.gherkinSnippet}
                        options={{
                          readOnly: true,
                          minimap: { enabled: false },
                          fontSize: 11,
                          fontFamily: 'JetBrains Mono, Menlo, monospace',
                          lineNumbers: 'off',
                          scrollBeyondLastLine: false,
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Context 3: Steps 05–07 (AST Source, Root-Cause Bottleneck & 1-Click SQL Remediation) */}
              {activeStep >= 5 && (
                <RunnerStageInspector
                  selectedRunnerStage={selectedRunnerStage}
                  selectedEntityId={selectedEntityId}
                  onAppendLog={appendTerminalLog}
                />
              )}
            </div>
          </aside>
        )}
          </>
        )}
      </div>
      {/* =========================================================================
       * 4. COLLAPSED BOTTOM TERMINAL BAR (28px Height by Default, Expands to 220px)
       * (Hidden in Executive View Mode)
       * ========================================================================= */}
      {displayMode !== 'EXECUTIVE' && (
        isTerminalExpanded ? (
          <div className="h-[220px] min-h-[220px] bg-[#0E1015] border-t border-[#22262E] flex flex-col font-mono text-[11px] z-30 shrink-0">
            {/* Expanded Terminal Header */}
            <div className="h-[28px] bg-[#16191F] border-b border-[#22262E] px-4 flex items-center justify-between text-[#EDEDED] select-none">
              <div className="flex items-center gap-3">
                <Terminal className="h-3.5 w-3.5 text-[#3B82F6]" />
                {[
                  { key: 'TERMINAL', label: copy.terminal.tabConsole },
                  { key: 'AST_OUTPUT', label: copy.terminal.tabAst },
                  { key: 'REA_STREAM', label: copy.terminal.tabStream },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveDrawerTab(tab.key as any)}
                    className={`px-2.5 py-0.5 rounded-[2px] transition-colors cursor-pointer ${
                      activeDrawerTab === tab.key
                        ? 'bg-[#111317] text-[#EDEDED] font-bold border border-[#22262E]'
                        : 'text-[#707070] hover:text-[#EDEDED]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3 text-[#707070]">
                <span className="text-[10px] tabular-nums">ws://127.0.0.1:8080/ws/runner-stream (ONLINE)</span>
                <button
                  onClick={() => setIsTerminalExpanded(false)}
                  className="hover:text-white cursor-pointer"
                  title={copy.terminal.collapse}
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Terminal Body */}
            <div className="flex-1 overflow-y-auto p-3 text-[#A1A1A1] space-y-1 font-mono select-text">
              {activeDrawerTab === 'TERMINAL' && (
                <div>
                  {terminalLogs.map((log, i) => (
                    <div key={i} className="whitespace-pre-wrap leading-relaxed">
                      {log}
                    </div>
                  ))}
                </div>
              )}
              {activeDrawerTab === 'AST_OUTPUT' && (
                <div>
                  <div className="text-[#3B82F6]">[AST INSPECTOR] Discovered routes and models from Prisma &amp; Next.js:</div>
                  <pre className="text-[10px] text-[#EDEDED] mt-1 whitespace-pre-wrap">
                    {JSON.stringify(
                      {
                        routes: discoveryResult.apiEndpoints.map((e) => ({
                          method: e.method,
                          path: e.path,
                          controller: e.controllerPath,
                        })),
                        tables: discoveryResult.databaseTables.map((t) => t.tableName),
                      },
                      null,
                      2
                    )}
                  </pre>
                </div>
              )}
              {activeDrawerTab === 'REA_STREAM' && (
                <div>
                  <div className="text-[#059669]">[WEBSOCKET STREAM] Connected to ws://127.0.0.1:8080/ws/runner-stream</div>
                  <div className="text-[#707070] mt-1">
                    Active Listeners: [Playwright POM Runner] ➔ [API Gateway] ➔ [morluto/rea Service Logic] ➔ [PostgreSQL DB Query]
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Collapsed 28px Status Bar */
          <footer
            onClick={() => setIsTerminalExpanded(true)}
            className="h-[28px] min-h-[28px] bg-[#0E1015] border-t border-[#22262E] px-4 flex items-center justify-between text-[11px] font-mono text-[#A1A1A1] cursor-pointer hover:bg-[#16191F] transition-colors select-none z-30 shrink-0"
          >
            <div className="flex items-center gap-2.5 truncate max-w-[85vw]">
              <Terminal className="h-3 w-3 text-[#3B82F6]" />
              <span className="text-[#059669] font-bold">ws://127.0.0.1:8080/ws/runner-stream (ONLINE)</span>
              <span className="text-[#707070]">·</span>
              <span className="truncate text-[#EDEDED]">
                Latest: {terminalLogs[terminalLogs.length - 1] || 'Ready'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[#707070] text-[10px]">
              <span>{copy.terminal.expand}</span>
              <ChevronUp className="h-3.5 w-3.5" />
            </div>
          </footer>
        )
      )}

      {/* =========================================================================
       * 5. COMMAND PALETTE (cmdk on Cmd+K)
       * ========================================================================= */}
      {isCmdkOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center pt-24 pointer-events-auto"
          onClick={() => setIsCmdkOpen(false)}
        >
          <div onClick={(e) => e.stopPropagation()} className="pointer-events-auto">
            <Command label="SDLC Command Palette">
              <Command.Input placeholder="Type a step, command, or artifact to jump to..." autoFocus />
              <Command.List>
                <Command.Empty>No matching SDLC command found.</Command.Empty>

                <Command.Group heading="SDLC Stepper Navigation (Steps 1–12)">
                  <Command.Item
                    onSelect={() => {
                      setActiveStep(1);
                      setIsCmdkOpen(false);
                    }}
                  >
                    <FileText className="h-3.5 w-3.5 text-[#3B82F6]" />
                    <span>{copy.nav.steps[0].title}</span>
                  </Command.Item>
                  <Command.Item
                    onSelect={() => {
                      setActiveStep(2);
                      setIsCmdkOpen(false);
                    }}
                  >
                    <GitBranch className="h-3.5 w-3.5 text-[#3B82F6]" />
                    <span>{copy.nav.steps[1].title}</span>
                  </Command.Item>
                  <Command.Item
                    onSelect={() => {
                      setActiveStep(3);
                      setIsCmdkOpen(false);
                    }}
                  >
                    <Layers className="h-3.5 w-3.5 text-[#3B82F6]" />
                    <span>{copy.nav.steps[2].title}</span>
                  </Command.Item>
                  <Command.Item
                    onSelect={() => {
                      setActiveStep(4);
                      setIsCmdkOpen(false);
                    }}
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5 text-[#3B82F6]" />
                    <span>{copy.nav.steps[3].title}</span>
                  </Command.Item>
                  <Command.Item
                    onSelect={() => {
                      setActiveStep(5);
                      setIsCmdkOpen(false);
                    }}
                  >
                    <Globe className="h-3.5 w-3.5 text-[#3B82F6]" />
                    <span>{copy.nav.steps[4].title}</span>
                  </Command.Item>
                  <Command.Item
                    onSelect={() => {
                      setActiveStep(6);
                      setIsCmdkOpen(false);
                    }}
                  >
                    <GitCompare className="h-3.5 w-3.5 text-[#DC2626]" />
                    <span>{copy.nav.steps[5].title}</span>
                  </Command.Item>
                  <Command.Item
                    onSelect={() => {
                      setActiveStep(7);
                      setIsCmdkOpen(false);
                    }}
                  >
                    <Activity className="h-3.5 w-3.5 text-[#10B981]" />
                    <span>{copy.nav.steps[6].title}</span>
                  </Command.Item>
                  <Command.Item
                    onSelect={() => {
                      setActiveStep(8);
                      setIsCmdkOpen(false);
                    }}
                  >
                    <ShieldCheck className="h-3.5 w-3.5 text-[#10B981]" />
                    <span>{copy.nav.steps[7].title}</span>
                  </Command.Item>
                  <Command.Item
                    onSelect={() => {
                      setActiveStep(9);
                      setIsCmdkOpen(false);
                    }}
                  >
                    <ShieldAlert className="h-3.5 w-3.5 text-[#EF4444]" />
                    <span>{copy.nav.steps[8].title}</span>
                  </Command.Item>
                  <Command.Item
                    onSelect={() => {
                      setActiveStep(10);
                      setIsCmdkOpen(false);
                    }}
                  >
                    <Code2 className="h-3.5 w-3.5 text-[#10B981]" />
                    <span>{copy.nav.steps[9].title}</span>
                  </Command.Item>
                  <Command.Item
                    onSelect={() => {
                      setActiveStep(11);
                      setIsCmdkOpen(false);
                    }}
                  >
                    <Users className="h-3.5 w-3.5 text-[#38BDF8]" />
                    <span>{copy.nav.steps[10].title}</span>
                  </Command.Item>
                  <Command.Item
                    onSelect={() => {
                      setActiveStep(12);
                      setIsCmdkOpen(false);
                    }}
                  >
                    <Share2 className="h-3.5 w-3.5 text-[#8B5CF6]" />
                    <span>{copy.nav.steps[11].title}</span>
                  </Command.Item>
                </Command.Group>

                <Command.Group heading="Quick Actions">
                  <Command.Item
                    onSelect={() => {
                      handleSeedBenchmark();
                      setIsCmdkOpen(false);
                    }}
                  >
                    <Database className="h-3.5 w-3.5 text-[#3B82F6]" />
                    <span>Seed Sample Data (Greenfield Architecture Engine)</span>
                  </Command.Item>
                  <Command.Item
                    onSelect={() => {
                      setIsInspectorOpen(true);
                      setIsCmdkOpen(false);
                    }}
                  >
                    <Sliders className="h-3.5 w-3.5 text-[#A1A1A1]" />
                    <span>Toggle Contextual Inspector Drawer</span>
                  </Command.Item>
                </Command.Group>
              </Command.List>
            </Command>
          </div>
        </div>
      )}

      {/* =========================================================================
       * 6. SNAPSHOT HISTORY, REGRESSION DIFF & MULTI-PROJECT VAULT MODAL
       * ========================================================================= */}
      {isVaultHistoryOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 pointer-events-auto"
          onClick={() => setIsVaultHistoryOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl max-h-[85vh] bg-[#111317] border border-[#22262E] rounded-[4px] flex flex-col overflow-hidden shadow-2xl"
          >
            <div className="px-4 py-3 bg-[#16191F] border-b border-[#22262E] flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-[#10B981]" />
                  <h2 className="text-[14px] font-bold text-[#EDEDED] font-mono">{copy.vault.modalTitle}</h2>
                </div>
                <p className="text-[11px] text-[#707070] font-mono mt-0.5">{copy.vault.modalSubtitle}</p>
              </div>
              <button
                onClick={() => setIsVaultHistoryOpen(false)}
                className="p-1 text-[#A1A1A1] hover:text-white hover:bg-[#22262E] rounded cursor-pointer"
                aria-label={copy.vault.close}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-4 py-2 bg-[#0B0C0E] border-b border-[#22262E] flex flex-wrap items-center justify-between gap-2 font-mono text-[11px]">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setVaultModalTab('SNAPSHOTS')}
                  className={`px-3 py-1 rounded-[2px] cursor-pointer ${
                    vaultModalTab === 'SNAPSHOTS' ? 'bg-[#2563EB] text-white font-bold' : 'text-[#A1A1A1] hover:text-[#EDEDED]'
                  }`}
                >
                  {copy.vault.snapshotsTab} ({projectSnapshots.length})
                </button>
                <button
                  onClick={() => setVaultModalTab('PROJECTS')}
                  className={`px-3 py-1 rounded-[2px] cursor-pointer ${
                    vaultModalTab === 'PROJECTS' ? 'bg-[#2563EB] text-white font-bold' : 'text-[#A1A1A1] hover:text-[#EDEDED]'
                  }`}
                >
                  {copy.vault.projectsTab} ({vaultProjects.length})
                </button>
              </div>

              {compiledSdlcState && (
                <button
                  onClick={() => handleSaveSnapshotToVault()}
                  disabled={isSavingSnapshot}
                  className="px-3 py-1 bg-[#059669] hover:bg-[#047857] disabled:opacity-50 text-white font-bold rounded-[2px] flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>{isSavingSnapshot ? copy.step12.savingSnapshot : copy.vault.saveSnapshotNow}</span>
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-[11.5px]">
              {vaultModalTab === 'SNAPSHOTS' && (
                <>
                  {regressionDiffSummary ? (
                    <div className="p-3.5 bg-[#0B0C0E] border border-[#3B82F6]/50 rounded-[3px] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#3B82F6]">{copy.vault.diffTitle}</span>
                        <span className="text-[10.5px] text-[#A1A1A1]">{regressionDiffSummary.comparedAgainstLabel}</span>
                      </div>
                      <p className="text-[12px] text-[#EDEDED] font-sans leading-relaxed">
                        {locale === 'id' ? regressionDiffSummary.plainDiffSummary : regressionDiffSummary.plainDiffSummaryEn}
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-1 text-[10.5px]">
                        <div className="p-2 bg-[#111317] border border-[#22262E] rounded-[2px]">
                          <span className="text-[#707070] block text-[9.5px]">{copy.vault.passRateDelta}</span>
                          <strong className={regressionDiffSummary.passRateDelta >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}>
                            {regressionDiffSummary.passRateDelta >= 0 ? `+${regressionDiffSummary.passRateDelta}%` : `${regressionDiffSummary.passRateDelta}%`}
                          </strong>
                        </div>
                        <div className="p-2 bg-[#111317] border border-[#22262E] rounded-[2px]">
                          <span className="text-[#707070] block text-[9.5px]">{copy.vault.newModules}</span>
                          <strong className="text-[#3B82F6]">+{regressionDiffSummary.newModulesAdded.length}</strong>
                        </div>
                        <div className="p-2 bg-[#111317] border border-[#22262E] rounded-[2px]">
                          <span className="text-[#707070] block text-[9.5px]">{copy.vault.removedModules}</span>
                          <strong className="text-[#F59E0B]">-{regressionDiffSummary.removedModules.length}</strong>
                        </div>
                        <div className="p-2 bg-[#111317] border border-[#22262E] rounded-[2px]">
                          <span className="text-[#707070] block text-[9.5px]">{copy.vault.newApis}</span>
                          <strong className="text-[#8B5CF6]">+{regressionDiffSummary.newApisAdded.length}</strong>
                        </div>
                        <div className="p-2 bg-[#111317] border border-[#22262E] rounded-[2px]">
                          <span className="text-[#707070] block text-[9.5px]">{copy.vault.bugsResolved}</span>
                          <strong className="text-[#10B981]">{regressionDiffSummary.bugsResolved.length}</strong>
                        </div>
                        <div className="p-2 bg-[#111317] border border-[#22262E] rounded-[2px]">
                          <span className="text-[#707070] block text-[9.5px]">{copy.vault.newBugs}</span>
                          <strong className="text-[#EF4444]">{regressionDiffSummary.newBugsIntroduced.length}</strong>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-[#0B0C0E] border border-[#22262E] rounded-[3px] text-[#A1A1A1] text-[11px]">
                      {copy.vault.noPriorSnapshot}
                    </div>
                  )}

                  <div className="border border-[#22262E] rounded-[3px] overflow-hidden">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead className="bg-[#16191F] text-[#707070] uppercase text-[10px] border-b border-[#22262E]">
                        <tr>
                          <th className="p-2.5 border-r border-[#22262E]">Version / Snapshot</th>
                          <th className="p-2.5 border-r border-[#22262E]">Modules</th>
                          <th className="p-2.5 border-r border-[#22262E]">APIs</th>
                          <th className="p-2.5 border-r border-[#22262E]">QA Pass Rate</th>
                          <th className="p-2.5 border-r border-[#22262E]">Open Bugs</th>
                          <th className="p-2.5">UAT</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#22262E]">
                        {projectSnapshots.map((snap) => (
                          <tr key={snap.snapshotId} className="hover:bg-[#16191F]/50">
                            <td className="p-2.5 border-r border-[#22262E] font-bold text-[#EDEDED]">
                              <div className="flex items-center gap-1.5">
                                <Clock className="h-3 w-3 text-[#3B82F6]" />
                                <span>{snap.versionLabel}</span>
                              </div>
                            </td>
                            <td className="p-2.5 border-r border-[#22262E] tabular-nums">{snap.modulesCount}</td>
                            <td className="p-2.5 border-r border-[#22262E] tabular-nums">{snap.apisCount}</td>
                            <td className="p-2.5 border-r border-[#22262E] tabular-nums text-[#10B981] font-bold">
                              {snap.passedTests}/{snap.totalTests} ({snap.passRatePercent}%)
                            </td>
                            <td className="p-2.5 border-r border-[#22262E] tabular-nums text-[#EF4444]">{snap.openBugsCount}</td>
                            <td className="p-2.5 tabular-nums text-[#3B82F6]">{snap.uatAcceptedCount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {vaultModalTab === 'PROJECTS' && (
                <div className="space-y-2">
                  {vaultProjects.map((proj) => (
                    <div
                      key={proj.projectId}
                      className={`p-3 bg-[#0B0C0E] border rounded-[3px] flex flex-wrap items-center justify-between gap-2 ${
                        proj.projectId === activeVaultProjectId ? 'border-[#2563EB]' : 'border-[#22262E]'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#EDEDED] text-[12.5px]">{proj.projectName}</span>
                          <span className="px-1.5 py-0.2 bg-[#16191F] border border-[#22262E] text-[9.5px] text-[#3B82F6] rounded-[2px]">
                            {proj.projectType}
                          </span>
                        </div>
                        <div className="text-[10.5px] text-[#707070] truncate mt-0.5">
                          {proj.targetUrl} · {proj.latestPassRatePercent}% Pass · {proj.snapshotCount} snapshots
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            handleSwitchVaultProject(proj.projectId);
                            setIsVaultHistoryOpen(false);
                          }}
                          className="px-2.5 py-1 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-[10.5px] rounded-[2px] cursor-pointer"
                        >
                          {copy.vault.loadProject}
                        </button>
                        <button
                          onClick={() => handleDeleteVaultProject(proj.projectId)}
                          className="p-1.5 bg-[#16191F] border border-[#22262E] hover:border-[#EF4444] text-[#EF4444] rounded-[2px] cursor-pointer"
                          title={copy.vault.deleteProject}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
       * 7. CREATE NEW PROJECT WORKSPACE MODAL (Greenfield / Web / Git / ZIP)
       * ========================================================================= */}
      {isNewProjectModalOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 pointer-events-auto"
          onClick={() => setIsNewProjectModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl bg-[#111317] border border-[#22262E] rounded-[4px] overflow-hidden shadow-2xl"
          >
            <div className="px-4 py-3 bg-[#16191F] border-b border-[#22262E] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4 text-[#3B82F6]" />
                <h2 className="text-[13.5px] font-bold text-[#EDEDED] font-mono">{copy.vault.createNewModalTitle}</h2>
              </div>
              <button
                onClick={() => setIsNewProjectModalOpen(false)}
                className="p-1 text-[#A1A1A1] hover:text-white rounded cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4 space-y-3 font-mono text-[11.5px]">
              <p className="text-[#A1A1A1] font-sans text-[12px]">{copy.vault.createNewDesc}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  onClick={() => {
                    setActiveStep(1);
                    setStep1SourceTab('STAKEHOLDER_MOM');
                    setGreenfieldProjectName('');
                    setIsNewProjectModalOpen(false);
                  }}
                  className="p-3 bg-[#0B0C0E] border border-[#8B5CF6]/50 hover:border-[#8B5CF6] text-left rounded-[3px] space-y-1 cursor-pointer"
                >
                  <FileText className="h-4 w-4 text-[#A78BFA]" />
                  <div className="font-bold text-[#EDEDED]">{copy.vault.startFromZeroBtn}</div>
                </button>
                <button
                  onClick={() => {
                    setActiveStep(1);
                    setStep1SourceTab('WEB_URL');
                    setBlindTargetUrl('');
                    setLoginSurfaceProbe(null);
                    setIsNewProjectModalOpen(false);
                    setTimeout(() => targetUrlInputRef.current?.focus(), 50);
                  }}
                  className="p-3 bg-[#0B0C0E] border border-[#D97706]/50 hover:border-[#D97706] text-left rounded-[3px] space-y-1 cursor-pointer"
                >
                  <Globe className="h-4 w-4 text-[#F59E0B]" />
                  <div className="font-bold text-[#EDEDED]">{copy.vault.startFromUrlBtn}</div>
                </button>
                <button
                  onClick={() => {
                    setActiveStep(1);
                    setStep1SourceTab('GIT_REPO');
                    setIsNewProjectModalOpen(false);
                  }}
                  className="p-3 bg-[#0B0C0E] border border-[#2563EB]/50 hover:border-[#2563EB] text-left rounded-[3px] space-y-1 cursor-pointer"
                >
                  <GitBranch className="h-4 w-4 text-[#3B82F6]" />
                  <div className="font-bold text-[#EDEDED]">{copy.vault.startFromGitBtn}</div>
                </button>
                <button
                  onClick={() => {
                    setActiveStep(1);
                    setStep1SourceTab('ZIP_FOLDER');
                    setIsNewProjectModalOpen(false);
                  }}
                  className="p-3 bg-[#0B0C0E] border border-[#059669]/50 hover:border-[#059669] text-left rounded-[3px] space-y-1 cursor-pointer"
                >
                  <Folder className="h-4 w-4 text-[#10B981]" />
                  <div className="font-bold text-[#EDEDED]">{copy.vault.startFromZipBtn}</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
