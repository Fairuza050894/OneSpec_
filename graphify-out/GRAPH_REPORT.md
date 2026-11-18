# Graph Report - OneSpec SDLC Studio  (2026-11-18)

## Corpus Check
- 140 files · ~310,362 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: (none) 5, .example 1, .prisma 1)

## Summary
- 1374 nodes · 3578 edges · 92 communities (64 shown, 28 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 20 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1147f9b3`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- useStudioLocale
- sdlc.ts
- .onespec-crawler-backup-2026-11-13T11-43-28-062Z/src/services/blindCrawlerService.ts
- devDependencies
- compilerOptions
- featureModuleCoverage.ts
- scripts
- ARCHITECTURE_AND_SDLC_SPEC.md — OneSpec SDLC Workbench
- Bagian 3: Urutan Prompt Step-by-Step untuk AI Perusahaan Anda
- ReaBridgeService
- DESIGN.md — OneSpec SDLC Workbench Visual & Architecture Specification
- GapAuditorWorkbench.tsx
- OneSpec SDLC Studio
- bpmn-js.d.ts
- dependencies
- DatabaseErdTable
- SingleProductDeepReader.tsx
- execute/route.ts
- elkjs
- playwright
- steps
- architectureDeconstructor.ts
- blindCrawlerService
- ref_fs
- capture-step6.js
- serverSecurity.ts
- package.json
- rbacDifferentialMatrixService.ts
- deepBundleUnpackerService.ts
- src/services/blindCrawlerService.ts
- src/services/iso26514UserManualService.ts
- liveMultiToolExecutorService.ts
- test-explorer.js
- check-screenshot-guard.ts
- unifiedReportGenerator.ts
- workspaceVaultService.ts
- presentationSanitizer.ts
- iso31000RiskService
- deep-harvest-cli.mjs
- aiAugmentedQaService.ts
- SingleProductDeepReader.tsx
- architectureDeconstructorService
- DiscoveredApiEndpoint
- architectureDeconstructor.ts
- smtFormalVerifierService
- tsdSynthesizerService
- triModalDiscoveryService.ts
- ArchitectureMapEngineService
- src/services/productKnowledgeAndMonitoringService.ts
- DecompiledBundleVault.tsx
- page.tsx
- liveMultiToolExecutorService
- Step07ExecutionRunner.tsx
- CompiledSdlcState
- ArchitectureDeconstructorWorkbench.tsx
- modernDocumentExporter.ts
- verify-master-upgrade-final.js
- automationSynthesizerService
- ReverseDfdWorkbench.tsx
- dfdReverseService
- generateCanonicalBpmn2Xml
- sdlcCompiler.ts
- next
- src/lib/xlsxWriter.ts
- ref_node_fs
- DelphiConsensusWorkbench.tsx
- safe-git-push.sh
- CamundaBpmnViewer.tsx
- IsoRiskAuditWorkbench.tsx
- i18n.tsx
- ci-gate/route.ts
- rtmSynthesizer.ts
- unifiedReportGenerator
- @fastify/cors
- iso26514UserManualService
- live-qa-executor/route.ts
- bpmn-js
- login-probe/route.ts
- blind-crawl/route.ts
- deepSpaHarvester.ts
- changeImpactService
- buildFeatureModuleBlueprintSvgDataUrl
- DomTraceabilityBinding
- environmentDetector.ts
- docx
- sharp
- domainLogicBrainService
- test-blind-crawl-live.js
- verify-all-steps-crawled.js

## God Nodes (most connected - your core abstractions)
1. `CompiledSdlcState` - 103 edges
2. `DiscoveredApiEndpoint` - 66 edges
3. `DatabaseErdTable` - 61 edges
4. `ValidationRuleContract` - 59 edges
5. `FeatureModuleSurface` - 51 edges
6. `blindCrawlerService` - 42 edges
7. `BrdMatrixRow` - 42 edges
8. `next` - 39 edges
9. `useStudioLocale()` - 37 edges
10. `blindCrawlerService` - 36 edges

## Surprising Connections (you probably didn't know these)
- `8. 7-Layer Deep SPA Harvester 2.0 & Cross-Subdomain Engine` --references--> `DatabaseErdTable`  [INFERRED]
  ARCHITECTURE_AND_SDLC_SPEC.md → src/types/sdlc.ts
- `4. 7-Layer Deep SPA Harvester 2.0` --references--> `DatabaseErdTable`  [INFERRED]
  README.md → src/types/sdlc.ts
- `4. PROTECTED CORE SERVICES (`src/services/`)` --references--> `SyntheticDataFactoryBundle`  [INFERRED]
  AGENTS.md → src/services/domainLogicBrainService.ts
- `4. PROTECTED CORE SERVICES (`src/services/`)` --references--> `SyntheticDataFactoryBundle`  [INFERRED]
  CLAUDE.md → src/services/domainLogicBrainService.ts
- `InteractiveSessionState` --references--> `BlindCrawlDiscoveredForm`  [EXTRACTED]
  .onespec-crawler-backup-2026-11-13T11-43-28-062Z/src/services/blindCrawlerService.ts → src/types/sdlc.ts

## Import Cycles
- 3-file cycle: `src/services/enterpriseLibraryPortalService.ts -> src/services/sdlcCompiler.ts -> src/services/sdlcKnowledgeGraphService.ts -> src/services/enterpriseLibraryPortalService.ts`

## Communities (92 total, 28 thin omitted)

### Community 0 - "useStudioLocale"
Cohesion: 0.12
Nodes (22): @monaco-editor/react, MonacoEditor, MonacoEditor, ReverseDfdWorkbench(), GapAuditorWorkbench(), MonacoDiffEditor, ComplianceBinderWorkbench(), MonacoEditor (+14 more)

### Community 1 - "sdlc.ts"
Cohesion: 0.05
Nodes (36): AutoRobotFieldValue, BpmnActorType, BpmnEdge, BpmnNode, BpmnNodeProperties, BpmnNodeType, BpmnProcessModel, BpmnSwimlane (+28 more)

### Community 2 - ".onespec-crawler-backup-2026-11-13T11-43-28-062Z/src/services/blindCrawlerService.ts"
Cohesion: 0.11
Nodes (14): CapturedNetworkRequest, globalForBlindCrawler, HarvestedLoginDropdown, HarvestedLoginInput, HarvestedLoginSubmit, HarvestedLoginTab, ModuleRuntimeError, ScrapedButton (+6 more)

### Community 3 - "devDependencies"
Cohesion: 0.08
Nodes (24): devDependencies, autoprefixer@^10.6.2, concurrently@^10.0.6, playwright@^1.64.1, postcss@^8.5.32, prisma@6.19.3, tailwindcss@^4.3.3, @tailwindcss/postcss@^4.3.4 (+16 more)

### Community 4 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 5 - "featureModuleCoverage.ts"
Cohesion: 0.17
Nodes (13): buildSurfaceFromApiGroup(), buildSurfaceFromCrawledModule(), buildSurfaceFromPage(), ensureCompleteFeatureModuleCoverage(), fieldLabelsFromApi(), findCoveringModule(), humanizeSegment(), moduleNameFromRoute() (+5 more)

### Community 6 - "scripts"
Cohesion: 0.12
Nodes (16): scripts, build, dev, dev:next, dev:server, prisma:generate, prisma:push, start (+8 more)

### Community 7 - "ARCHITECTURE_AND_SDLC_SPEC.md — OneSpec SDLC Workbench"
Cohesion: 0.11
Nodes (17): 10. ISO/IEC/IEEE 26514 Bilingual User Manual Engine, 11. Complete Multi-Artifact Export Engine, 1. Executive Summary & Single-Manpower Problem Statement, 2. Two-Phase SDLC Data Flow Architecture, 3. Tri-Modal Auto-Discovery Architecture (Answering the Greenfield Challenge), 4. Camunda-Style BPMN 2.0 Specification (Step 3 Revision), 5. REA Live Runner Diagram Streaming & Bottleneck Detection (Step 7), 6. Full Parity with Standalone Automation Tools (+9 more)

### Community 8 - "Bagian 3: Urutan Prompt Step-by-Step untuk AI Perusahaan Anda"
Cohesion: 0.12
Nodes (16): AGENTS_MASTER_PROMPT.md — Rulebook & Step-by-Step Prompts for Company AI Coding Agent, Bagian 1: Persiapan Environment Lokal (Jalankan Sekali di Terminal), Bagian 2: Isi Blok `AGENTS.md` / `CLAUDE.md` (Otomatis Dibaca AI Perusahaan), Bagian 3: Urutan Prompt Step-by-Step untuk AI Perusahaan Anda, PROMPT TAHAP 10: Membangun SMT Z3 Formal Proofs Engine (Langkah 10), PROMPT TAHAP 11: Membangun Delphi ARB Consensus Engine (Langkah 11), PROMPT TAHAP 12: Membangun Executive Summary, Knowledge Graph & Multi-Artifact Export Hub (Langkah 12), PROMPT TAHAP 1: Inisialisasi Monorepo, Skema Data ISO, dan Koneksi `morluto/rea` (+8 more)

### Community 10 - "DESIGN.md — OneSpec SDLC Workbench Visual & Architecture Specification"
Cohesion: 0.14
Nodes (13): 1. Product Identity & Design Philosophy, 2. Layout Geometry & Window Discipline (`100vh x 100vw`), 3. Surface & Color Palette Tokens (Dark Linear / Geist), 4. Typography & Numeric Precision, 5. Strict Anti-Slop Prohibitions (`R-01` to `R-40`), 6.1 Top Header Bar (`36px` Fixed Height), 6.2 Left Navigation Sidebar (12 Steps Grouped in 4 Phases), 6. Modern Studio 4-Phase Workbench Navigation & Step Hierarchy (+5 more)

### Community 12 - "GapAuditorWorkbench.tsx"
Cohesion: 0.26
Nodes (5): GapAuditorWorkbenchProps, gapAuditorService, DefectTicketPayload, GapAuditSummary, GapAuditVerdict

### Community 13 - "OneSpec SDLC Studio"
Cohesion: 0.06
Nodes (33): 1. UI ARCHITECTURE LOCK (NEVER REVERT TO LEGACY UI), 2. NEXT.JS 16 (TURBOPACK) & REACT 19 SYNTAX INTEGRITY (ZERO WHITE SCREEN), 3. TYPESCRIPT & RUNTIME SAFETY (ZERO TDZ & ZERO PLACEHOLDERS), 4. PROTECTED CORE SERVICES (`src/services/`), ONESPEC SDLC STUDIO — STRICT ENTERPRISE AI GUARDRAILS (ANTIGRAVITY RULES), This is NOT the Next.js you know, 1. UI ARCHITECTURE LOCK (NEVER REVERT TO LEGACY UI), 2. NEXT.JS 16 (TURBOPACK) & REACT 19 SYNTAX INTEGRITY (ZERO WHITE SCREEN) (+25 more)

### Community 14 - "bpmn-js.d.ts"
Cohesion: 0.50
Nodes (3): bpmn-js, bpmn-js/dist/bpmn-modeler.production.min.js, bpmn-js/dist/bpmn-navigated-viewer.production.min.js

### Community 15 - "dependencies"
Cohesion: 0.09
Nodes (23): dependencies, clsx@^2.1.1, cmdk@^1.1.1, cross-env@^10.1.0, @fastify/sensible@^6.0.7, @fastify/websocket@^11.3.6, lucide-react@^1.66.0, @monaco-editor/react@^4.7.0 (+15 more)

### Community 16 - "DatabaseErdTable"
Cohesion: 0.22
Nodes (18): IsoRiskAuditWorkbenchProps, SmtFormalVerifierWorkbenchProps, ArchitectureDeconstructionInput, AssessProjectRiskInput, SynthesizeTestCasesContext, SmtFormalInvariant, SmtLogicCategory, SmtSatisfiability (+10 more)

### Community 17 - "SingleProductDeepReader.tsx"
Cohesion: 0.12
Nodes (20): VerifiedArchitectureMapCanvas(), IsoLibraryPortalProps, EnterpriseLibraryPortal(), EnterpriseLibraryPortalProps, ProductKnowledgeMonitorHub(), normalizeManualImgSrc(), ReaderSectionId, SimulatedResponseState (+12 more)

### Community 18 - "execute/route.ts"
Cohesion: 0.18
Nodes (7): dynamic, maxDuration, RunnerExecuteRequestBody, OwaspApiCategory, owaspDastService, VulnerabilitySeverity, AutonomousRemediationItem

### Community 19 - "elkjs"
Cohesion: 0.50
Nodes (3): elkjs@^0.12.1, elkjs, elkjs/lib/elk.bundled.js

### Community 20 - "playwright"
Cohesion: 0.10
Nodes (12): nextConfig, playwright, { chromium }, path, { chromium }, path, { chromium }, path (+4 more)

### Community 21 - "steps"
Cohesion: 0.09
Nodes (22): name, runs-on, steps, timeout-minutes, concurrency, cancel-in-progress, group, jobs (+14 more)

### Community 22 - "architectureDeconstructor.ts"
Cohesion: 0.14
Nodes (16): computeConnectorGeometry(), EDGE_COLORS, ROLE_COLORS, VerifiedArchitectureMapCanvasProps, ArchEdgeVariant, ArchFocusViewId, ArchitectureDeltaReceipt, ArchitectureLayoutGateResult (+8 more)

### Community 23 - "blindCrawlerService"
Cohesion: 0.07
Nodes (6): blindCrawlerService, blindCrawlerService, BlindCrawlConfig, BlindCrawlDiscoveredForm, BlindCrawlResult, LoginSurfaceProbeResult

### Community 24 - "ref_fs"
Cohesion: 0.13
Nodes (7): { chromium }, fs, path, { chromium }, fs, path, CACHE_FILE_PATH

### Community 26 - "serverSecurity.ts"
Cohesion: 0.19
Nodes (15): POST(), POST(), BLOCKED_LOCAL_HOSTNAMES, filterSafeCookiesForTarget(), isCookieDomainMatch(), isMetadataHost(), isPrivateOrLoopbackHost(), METADATA_HOSTNAMES (+7 more)

### Community 27 - "package.json"
Cohesion: 0.12
Nodes (16): author, react-dom@^19.3.1, tailwind-merge@^3.7.0, @tanstack/react-table@^8.21.3, @xyflow/react@^12.12.1, description, keywords, license (+8 more)

### Community 29 - "rbacDifferentialMatrixService.ts"
Cohesion: 0.25
Nodes (4): rbacDifferentialMatrixService, RbacDifferentialReport, RbacDifferentialRow, RbacPersonaDefinition

### Community 31 - "src/services/blindCrawlerService.ts"
Cohesion: 0.11
Nodes (17): LoginSurfaceSnapshot, CapturedNetworkRequest, globalForBlindCrawler, HarvestedLoginDropdown, HarvestedLoginInput, HarvestedLoginSubmit, HarvestedLoginTab, LoginSurfaceSnapshot (+9 more)

### Community 32 - "src/services/iso26514UserManualService.ts"
Cohesion: 0.15
Nodes (10): html, manual, Iso26514BusinessRuleItem, Iso26514ButtonEntry, Iso26514DomainGlossaryItem, Iso26514FaqItem, Iso26514FilterEntry, Iso26514SopItem (+2 more)

### Community 33 - "liveMultiToolExecutorService.ts"
Cohesion: 0.16
Nodes (12): InAppLiveQaPanel(), InAppLiveQaPanelProps, AiAugmentedQaReport, ApiBvaProbeCase, EndpointFuzzProbeResult, Engine1MultiViewportReport, Engine2ApiBvaFuzzingReport, Engine3VisualDomDiffReport (+4 more)

### Community 35 - "check-screenshot-guard.ts"
Cohesion: 0.19
Nodes (17): blankSvg(), clientVerdict(), main(), moduleSurface, toDataUrl(), toJpeg(), dynamic, maxDuration (+9 more)

### Community 36 - "unifiedReportGenerator.ts"
Cohesion: 0.27
Nodes (16): EnterpriseNextGenCommandDeckProps, ProductKnowledgeMonitorHubProps, RtmSpreadsheetGridProps, LiveRunnerWorkbenchProps, IntegrationContractItem, ChangeImpactAnalysisReport, ChangeRequestInput, Iso26514ModuleManual (+8 more)

### Community 37 - "workspaceVaultService.ts"
Cohesion: 0.08
Nodes (19): newSnapshot, oldSnapshot, privateService, state, maxDuration, POST(), maxDuration, POST() (+11 more)

### Community 38 - "presentationSanitizer.ts"
Cohesion: 0.23
Nodes (9): formatDateOnly(), formatRelativeTime(), getEnvironmentLabel(), isPrivateHost(), maskTargetUrl(), PresentationLocale, RAW_PROMPT_MARKERS, redactSensitiveText() (+1 more)

### Community 40 - "deep-harvest-cli.mjs"
Cohesion: 0.28
Nodes (8): authStatePath, cachePath, captureCdpShot(), indexPath, rootDir, runUnlimitedHarvest(), inspectSingleRoute(), vaultDir

### Community 41 - "aiAugmentedQaService.ts"
Cohesion: 0.15
Nodes (10): aiAugmentedQaService, AiGuardrailsAuditReport, ApiContractAssistReport, CoverageGapsReport, FlakyDetectReport, LogClusterReport, SelfHealingLocatorReport, TestGenCapabilitySummary (+2 more)

### Community 42 - "SingleProductDeepReader.tsx"
Cohesion: 0.26
Nodes (11): EnterpriseNextGenCommandDeck(), normalizeManualImgSrc(), UniversalKnowledgeGraphWorkbench(), ModuleScreenshot(), ModuleScreenshotProps, isBlankOrMissingScreenshot(), cacheKey(), detectBlankRasterDataUrl() (+3 more)

### Community 44 - "DiscoveredApiEndpoint"
Cohesion: 0.24
Nodes (8): ComplianceBinderWorkbenchProps, ComplianceAssessmentInput, complianceBinderService, ComplianceControlItem, ComplianceEvidenceStatus, ComplianceScorecard, RegulatoryFramework, DiscoveredApiEndpoint

### Community 45 - "architectureDeconstructor.ts"
Cohesion: 0.14
Nodes (13): ArchitecturalFitnessFunctionItem, ArchitectureDecisionRecordItem, ArchitectureLayerBreakdownItem, ArchitectureTier, HighLevelArchitecture, IntegrationContractErrorResponse, IntegrationContractHeader, IntegrationContractParam (+5 more)

### Community 48 - "triModalDiscoveryService.ts"
Cohesion: 0.05
Nodes (53): fastify@^5.12.8, fastify, main(), testDomainLogicBrainAndWhiteBoxScenarios(), testReaBridgeAstExtractor(), testUserManualSection7(), verify(), DEFAULT_GIT_REFS (+45 more)

### Community 50 - "src/services/productKnowledgeAndMonitoringService.ts"
Cohesion: 0.09
Nodes (36): blueprint, board, briefing, diff, invoiceModule, loginModule, manual, state (+28 more)

### Community 51 - "DecompiledBundleVault.tsx"
Cohesion: 0.27
Nodes (8): DecompiledBundleVaultProps, DeepUnpackParams, DeepUnpackResult, LeakedSecretItem, ReconstructedSourceFile, SecretSeverity, SecretType, ShadowEndpointItem

### Community 52 - "page.tsx"
Cohesion: 0.18
Nodes (17): DatabaseErdCanvas, ExtractedEntity, OneSpecEngineeringWorkbench(), DecompiledBundleVault(), MonacoEditor, DomTraceabilityMap(), TriModalDiscoveryToolbar(), IsoLibraryPortal() (+9 more)

### Community 54 - "Step07ExecutionRunner.tsx"
Cohesion: 0.28
Nodes (7): delay(), LiveRunnerWorkbench(), MonacoEditor, LiveRunnerWorkbench, Step07ExecutionRunner(), Step07ExecutionRunnerProps, computeUnifiedQualityMetrics()

### Community 55 - "CompiledSdlcState"
Cohesion: 0.14
Nodes (5): automationBundleExportService, CompiledSdlcState, ToolProbeResult, toolProbeService, TsdMatrixRow

### Community 56 - "ArchitectureDeconstructorWorkbench.tsx"
Cohesion: 0.33
Nodes (8): ArchitectureDeconstructorWorkbench(), ArchitectureDeconstructorWorkbenchProps, MonacoEditor, SequenceStepItem, VerifiedSequenceDiagramCanvas(), VerifiedSequenceDiagramCanvasProps, LowLevelComponentTrace, UpstreamLinkedProjectInfo

### Community 57 - "modernDocumentExporter.ts"
Cohesion: 0.18
Nodes (9): diff, state, bakeCalloutPinsOntoImage(), makeCell(), makeStyledTable(), modernDocumentExporter, ModernDocumentExporterService, rasterizeArchitectureSvgToImageRun() (+1 more)

### Community 59 - "automationSynthesizerService"
Cohesion: 0.12
Nodes (13): LiveStreamLogEntry, nodeTypes, PipelineStageNodeData, AutomationSynthesisState, automationSynthesizerService, UnifiedReportData, ExecutionPipelineStage, FunctionalTestCaseResult (+5 more)

### Community 61 - "ReverseDfdWorkbench.tsx"
Cohesion: 0.16
Nodes (15): lucide-react, react, ReverseDfdWorkbenchProps, VerifiedDfdDiagramCanvas(), VerifiedDfdDiagramCanvasProps, DatabaseErdCanvasProps, nodeTypes, DfdDataFlow (+7 more)

### Community 63 - "generateCanonicalBpmn2Xml"
Cohesion: 0.50
Nodes (4): BpmnDiscoveredModuleFlow, BpmnGeneratorInput, escapeXml(), generateCanonicalBpmn2Xml()

### Community 64 - "sdlcCompiler.ts"
Cohesion: 0.16
Nodes (23): UniversalKnowledgeGraphWorkbenchProps, SingleProductDeepReaderProps, DeconstructedArchitecture, ComplianceAssessmentResult, DelphiConsensusSummary, IsoRiskAssessmentSummary, OwaspDastAssessmentSummary, UnifiedQualityMetrics (+15 more)

### Community 65 - "next"
Cohesion: 0.14
Nodes (10): @scalar/api-reference-react@^0.9.87, next, @scalar/api-reference-react, DastProbeRequestBody, ApiContractExplorer(), ApiContractExplorerProps, ApiReferenceReact, OwaspDastWorkbenchProps (+2 more)

### Community 66 - "src/lib/xlsxWriter.ts"
Cohesion: 0.10
Nodes (23): dynamic, GET(), handleExportBundle(), maxDuration, POST(), resolveStateAndProject(), buildXlsxWorkbook(), cellXml() (+15 more)

### Community 67 - "ref_node_fs"
Cohesion: 0.24
Nodes (4): createFallbackSvg(), dynamic, GET(), MIME_TYPES

### Community 68 - "DelphiConsensusWorkbench.tsx"
Cohesion: 0.16
Nodes (9): DelphiConsensusWorkbenchProps, safeSha256Hex(), DebateStance, delphiConsensusService, DelphiDebateEntry, DelphiPersona, DelphiRound, DelphiSimulateParams (+1 more)

### Community 70 - "CamundaBpmnViewer.tsx"
Cohesion: 0.29
Nodes (6): CamundaBpmnViewer, BpmnNodeClickEvent, CamundaBpmnViewer(), CamundaBpmnViewerProps, delay(), FlowStep

### Community 71 - "IsoRiskAuditWorkbench.tsx"
Cohesion: 0.39
Nodes (6): IsoRiskItem, MerkleTreeVault, RiskImpact, RiskLikelihood, RiskSeverityLevel, Soc2TrustControl

### Community 72 - "i18n.tsx"
Cohesion: 0.20
Nodes (9): metadata, RootLayout(), EN_COPY, ID_COPY, StudioCopy, StudioLocale, StudioLocaleContext, StudioLocaleContextValue (+1 more)

### Community 73 - "ci-gate/route.ts"
Cohesion: 0.48
Nodes (5): CiGateEvaluationResult, evaluateCiGates(), GET(), POST(), resolveTargetState()

### Community 74 - "rtmSynthesizer.ts"
Cohesion: 0.22
Nodes (15): RtmSpreadsheetGrid(), BusinessDomainPattern, DomainIntelligenceReport, DomainScenarioBlueprint, AutomationParityStatus, Expected3LayerVerification, generateBugReportCsv(), generateBugReportMarkdown() (+7 more)

### Community 78 - "live-qa-executor/route.ts"
Cohesion: 0.83
Nodes (3): GET(), POST(), resolveActiveState()

### Community 79 - "bpmn-js"
Cohesion: 0.67
Nodes (3): bpmn-js@^18.31.1, bpmn-js, initBpmnViewer()

### Community 82 - "deepSpaHarvester.ts"
Cohesion: 0.26
Nodes (11): AUTH_STATE_PATH, maxDuration, POST(), SESSION_STATE_PATH, AUTH_STATE_PATH, captureInstantCdpScreenshot(), inferRecursiveJsonShape(), normalizeRoutePath() (+3 more)

### Community 84 - "buildFeatureModuleBlueprintSvgDataUrl"
Cohesion: 0.36
Nodes (11): BlueprintButtonEntry, BlueprintFilterEntry, BlueprintModuleInput, buildFeatureModuleBlueprintSvgDataUrl(), clamp(), clip(), escapeXml(), placeControls() (+3 more)

### Community 95 - "domainLogicBrainService"
Cohesion: 0.29
Nodes (5): InteractiveSessionState, InteractiveSessionState, domainLogicBrainService, CrawledModuleSummary, FeatureModuleSurface

## Knowledge Gaps
- **28 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `CompiledSdlcState` connect `CompiledSdlcState` to `featureModuleCoverage.ts`, `GapAuditorWorkbench.tsx`, `DatabaseErdTable`, `SingleProductDeepReader.tsx`, `execute/route.ts`, `rbacDifferentialMatrixService.ts`, `liveMultiToolExecutorService.ts`, `check-screenshot-guard.ts`, `unifiedReportGenerator.ts`, `workspaceVaultService.ts`, `presentationSanitizer.ts`, `aiAugmentedQaService.ts`, `SingleProductDeepReader.tsx`, `triModalDiscoveryService.ts`, `src/services/productKnowledgeAndMonitoringService.ts`, `DecompiledBundleVault.tsx`, `page.tsx`, `liveMultiToolExecutorService`, `modernDocumentExporter.ts`, `automationSynthesizerService`, `ReverseDfdWorkbench.tsx`, `sdlcCompiler.ts`, `src/lib/xlsxWriter.ts`, `ci-gate/route.ts`, `rtmSynthesizer.ts`, `live-qa-executor/route.ts`, `changeImpactService`, `domainLogicBrainService`?**
  _High betweenness centrality (0.088) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `DatabaseErdTable` (e.g. with `8. 7-Layer Deep SPA Harvester 2.0 & Cross-Subdomain Engine` and `4. 7-Layer Deep SPA Harvester 2.0`) actually correct?**
  _`DatabaseErdTable` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `useStudioLocale` be split into smaller, more focused modules?**
  _Cohesion score 0.11857707509881422 - nodes in this community are weakly interconnected._
- **Why does `next` connect `next` to `GapAuditorWorkbench.tsx`, `dependencies`, `DatabaseErdTable`, `SingleProductDeepReader.tsx`, `execute/route.ts`, `playwright`, `ref_fs`, `serverSecurity.ts`, `package.json`, `check-screenshot-guard.ts`, `workspaceVaultService.ts`, `DiscoveredApiEndpoint`, `DecompiledBundleVault.tsx`, `page.tsx`, `Step07ExecutionRunner.tsx`, `ArchitectureDeconstructorWorkbench.tsx`, `automationSynthesizerService`, `interactive-session/route.ts`, `ReverseDfdWorkbench.tsx`, `sdlcCompiler.ts`, `src/lib/xlsxWriter.ts`, `ref_node_fs`, `DelphiConsensusWorkbench.tsx`, `IsoRiskAuditWorkbench.tsx`, `i18n.tsx`, `ci-gate/route.ts`, `live-qa-executor/route.ts`, `login-probe/route.ts`, `blind-crawl/route.ts`, `deepSpaHarvester.ts`?**
  _High betweenness centrality (0.077) - this node is a cross-community bridge._
- **Should `sdlc.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05405405405405406 - nodes in this community are weakly interconnected._
- **Why does `DatabaseErdTable` connect `DatabaseErdTable` to `sdlc.ts`, `.onespec-crawler-backup-2026-11-13T11-43-28-062Z/src/services/blindCrawlerService.ts`, `ARCHITECTURE_AND_SDLC_SPEC.md — OneSpec SDLC Workbench`, `GapAuditorWorkbench.tsx`, `OneSpec SDLC Studio`, `execute/route.ts`, `src/services/blindCrawlerService.ts`, `src/services/iso26514UserManualService.ts`, `SingleProductDeepReader.tsx`, `DiscoveredApiEndpoint`, `architectureDeconstructor.ts`, `triModalDiscoveryService.ts`, `page.tsx`, `CompiledSdlcState`, `ReverseDfdWorkbench.tsx`, `sdlcCompiler.ts`, `next`, `DelphiConsensusWorkbench.tsx`, `IsoRiskAuditWorkbench.tsx`, `rtmSynthesizer.ts`, `iso26514UserManualService`, `deepSpaHarvester.ts`, `domainLogicBrainService`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **Should `.onespec-crawler-backup-2026-11-13T11-43-28-062Z/src/services/blindCrawlerService.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._