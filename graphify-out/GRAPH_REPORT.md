# Graph Report - OneSpec SDLC Studio  (2026-11-13)

## Corpus Check
- 178 files · ~425,643 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 2, .css 2, .example 1)

## Summary
- 1663 nodes · 4672 edges · 110 communities (74 shown, 36 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 19 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `fb2aa4ac`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- page.tsx
- sdlc.ts
- triModalDiscoveryService.ts
- devDependencies
- compilerOptions
- i18n.tsx
- scripts
- ARCHITECTURE_AND_SDLC_SPEC.md — OneSpec SDLC Workbench
- Bagian 3: Urutan Prompt Step-by-Step untuk AI Perusahaan Anda
- ReaBridgeService
- DESIGN.md — OneSpec SDLC Workbench Visual & Architecture Specification
- CompiledSdlcState
- AGENTS.md
- bpmn-js.d.ts
- dependencies
- src/services/rtmSynthesizer.ts
- TestSuiteExecutionTrace
- useStudioLocale
- DatabaseErdCanvas.tsx
- playwright
- TestScenarioItem
- architectureDeconstructor.ts
- blindCrawlerService
- ref_path
- capture-step6.js
- capture-step7.js
- index.ts
- src/services/sdlcCompiler.ts
- deepBundleUnpackerService.ts
- src/components/discovery/DecompiledBundleVault.tsx
- src/services/iso26514UserManualService.ts
- test-cmdk.js
- test-explorer.js
- src/services/modernDocumentExporter.ts
- src/services/blindCrawlerService.ts
- workspaceVaultService
- .onespec-ui-backup-1794502240730/services/architectureMapEngine.ts
- iso31000RiskService
- workspaceVaultService.ts
- delphiConsensusService
- EnterpriseLibraryPortal.tsx
- architectureDeconstructorService
- ValidationRuleContract
- src/services/architectureDeconstructor.ts
- src/services/smtFormalVerifierService.ts
- tsdSynthesizerService
- reaBridge.ts
- .onespec-ui-backup-1794502240730/services/architectureDeconstructor.ts
- src/services/productKnowledgeAndMonitoringService.ts
- capture-step4.js
- triModalDiscoveryService
- blindCrawlerService
- DiscoveredApiEndpoint
- src/components/bpmn/CamundaBpmnViewer.tsx
- .onespec-ui-backup-1794502240730/components/portal/EnterpriseLibraryPortal.tsx
- .onespec-ui-backup-1794502240730/services/productKnowledgeAndMonitoringService.ts
- verify-master-upgrade-final.js
- ref_node_fs
- src/services/owaspDastService.ts
- react
- .onespec-ui-backup-1794502240730/lib/xlsxWriter.ts
- .onespec-ui-backup-1794502240730/services/sdlcCompiler.ts
- workspaceVaultService
- AuditDiscrepancyItem
- src/lib/xlsxWriter.ts
- DomTraceabilityBinding
- .onespec-ui-backup-1794502240730/services/deepBundleUnpackerService.ts
- .onespec-ui-backup-1794502240730/services/rtmSynthesizer.ts
- .onespec-ui-backup-1794502240730/services/sdlcKnowledgeGraphService.ts
- apply-master-patch.mjs
- src/lib/i18n.tsx
- automationSynthesizerService
- automationSynthesizerService
- check-product-knowledge.ts
- .onespec-ui-backup-1794502240730/lib/presentationSanitizer.ts
- .onespec-ui-backup-1794502240730/services/delphiConsensusService.ts
- buildProductKnowledgeBlueprint
- triModalDiscoveryService
- sdlcKnowledgeGraphService
- LoginSurfaceProbeResult
- .onespec-ui-backup-1794502240730/services/reaBridge.ts
- ReaBridgeService
- .onespec-ui-backup-1794502240730/components/portal/ProductKnowledgeMonitorHub.tsx
- apply-nextgen-innovations.mjs
- .onespec-ui-backup-1794502240730/lib/i18n.tsx
- .onespec-ui-backup-1794502240730/services/enterpriseLibraryPortalService.ts
- .onespec-ui-backup-1794502240730/services/workspaceVaultService.ts
- architectureDeconstructorService
- .onespec-ui-backup-1794502240730/services/dfdReverseService.ts
- .onespec-ui-backup-1794502240730/services/iso31000RiskService.ts
- iso31000RiskService
- unifiedReportGenerator
- src/components/portal/ProductKnowledgeMonitorHub.tsx
- domainLogicBrainService
- src/services/domainLogicBrainService.ts
- fix-pk-build.mjs
- @prisma/client
- .onespec-ui-backup-1794502240730/services/complianceBinderService.ts
- src/components/wireframe/ContractWireframePreview.tsx
- smtFormalVerifierService
- tsdSynthesizerService
- verify-master-functional-upgrade.js
- capture-step5.js
- test-blind-crawl-live.js
- test-terminal.js
- verify-all-steps-crawled.js
- changeImpactService

## God Nodes (most connected - your core abstractions)
1. `DiscoveredApiEndpoint` - 115 edges
2. `ValidationRuleContract` - 99 edges
3. `DatabaseErdTable` - 95 edges
4. `BrdMatrixRow` - 81 edges
5. `CompiledSdlcState` - 76 edges
6. `useStudioLocale()` - 67 edges
7. `FeatureModuleSurface` - 62 edges
8. `SynthesizedRtmRow` - 56 edges
9. `react` - 55 edges
10. `lucide-react` - 53 edges

## Surprising Connections (you probably didn't know these)
- `ApiContractExplorerProps` --references--> `DiscoveredApiEndpoint`  [EXTRACTED]
  .onespec-ui-backup-1794502240730/components/discovery/ApiContractExplorer.tsx → src/types/sdlc.ts
- `DatabaseErdCanvasProps` --references--> `DatabaseErdTable`  [EXTRACTED]
  .onespec-ui-backup-1794502240730/components/discovery/DatabaseErdCanvas.tsx → src/types/sdlc.ts
- `ContractWireframeProps` --references--> `ValidationRuleContract`  [EXTRACTED]
  .onespec-ui-backup-1794502240730/components/wireframe/ContractWireframePreview.tsx → src/types/sdlc.ts
- `DeepUnpackParams` --references--> `DiscoveredApiEndpoint`  [EXTRACTED]
  .onespec-ui-backup-1794502240730/services/deepBundleUnpackerService.ts → src/types/sdlc.ts
- `BugAndIssueMonitoringBoard` --references--> `BugReportTicket`  [EXTRACTED]
  .onespec-ui-backup-1794502240730/services/productKnowledgeAndMonitoringService.ts → src/types/sdlc.ts

## Import Cycles
- None detected.

## Communities (110 total, 36 thin omitted)

### Community 0 - "page.tsx"
Cohesion: 0.10
Nodes (35): DatabaseErdCanvas, ExtractedEntity, LiveRunnerWorkbench, OneSpecEngineeringWorkbench(), cmdk, DatabaseErdCanvas, ExtractedEntity, LiveRunnerWorkbench (+27 more)

### Community 1 - "sdlc.ts"
Cohesion: 0.05
Nodes (36): EnvironmentDetectionResult, AutoRobotFieldValue, BpmnActorType, BpmnEdge, BpmnNode, BpmnNodeProperties, BpmnNodeType, BpmnProcessModel (+28 more)

### Community 2 - "triModalDiscoveryService.ts"
Cohesion: 0.26
Nodes (16): DEFAULT_GIT_REFS, StagingDiscoveryWithAuthConfig, TriModalDiscoveryToolbarProps, DEFAULT_GIT_REFS, StagingDiscoveryWithAuthConfig, TriModalDiscoveryToolbarProps, TriModalDiscoveryExtendedResult, AutoDiscoveryMode (+8 more)

### Community 3 - "devDependencies"
Cohesion: 0.08
Nodes (32): author, description, devDependencies, autoprefixer@^10.6.2, concurrently@^10.0.6, playwright@^1.64.1, postcss@^8.5.32, prisma@6.19.3 (+24 more)

### Community 4 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 5 - "i18n.tsx"
Cohesion: 0.28
Nodes (5): metadata, RootLayout(), metadata, RootLayout(), StudioLocaleProvider()

### Community 6 - "scripts"
Cohesion: 0.13
Nodes (15): scripts, build, dev, dev:next, dev:server, prisma:generate, prisma:push, start (+7 more)

### Community 7 - "ARCHITECTURE_AND_SDLC_SPEC.md — OneSpec SDLC Workbench"
Cohesion: 0.18
Nodes (10): 1. Executive Summary & Single-Manpower Problem Statement, 2. Two-Phase SDLC Data Flow Architecture, 3. Tri-Modal Auto-Discovery Architecture (Answering the Greenfield Challenge), 4. Camunda-Style BPMN 2.0 Specification (Step 3 Revision), 5. REA Live Runner Diagram Streaming & Bottleneck Detection (Step 7), 6. Full Parity with Standalone Automation Tools, ARCHITECTURE_AND_SDLC_SPEC.md — OneSpec SDLC Workbench, Mode A: Direct Git Repository Connect (`git_repo`) (+2 more)

### Community 8 - "Bagian 3: Urutan Prompt Step-by-Step untuk AI Perusahaan Anda"
Cohesion: 0.18
Nodes (10): AGENTS_MASTER_PROMPT.md — Rulebook & Step-by-Step Prompts for Company AI Coding Agent, Bagian 1: Persiapan Environment Lokal (Jalankan Sekali di Terminal), Bagian 2: Isi Blok `AGENTS.md` / `CLAUDE.md` (Otomatis Dibaca AI Perusahaan), Bagian 3: Urutan Prompt Step-by-Step untuk AI Perusahaan Anda, PROMPT TAHAP 1: Inisialisasi Monorepo, Skema Data ISO, dan Koneksi `morluto/rea`, PROMPT TAHAP 2: Membangun Engine Fase 1 (MoM ➔ BRD, PRD & Matrix RTM ISO 29119), PROMPT TAHAP 3: Membangun Camunda-Style BPMN 2.0 Modeler & Stateful Wireframe (Langkah 3), PROMPT TAHAP 4: Membangun Tri-Modal Auto-Discovery (`morluto/rea`) untuk Git, Lokal & Staging (Langkah 5) (+2 more)

### Community 10 - "DESIGN.md — OneSpec SDLC Workbench Visual & Architecture Specification"
Cohesion: 0.25
Nodes (7): 1. Product Identity & Design Philosophy, 2. Layout Geometry & Window Discipline (`100vh x 100vw`), 3. Surface & Color Palette Tokens (Dark Linear / Geist), 4. Typography & Numeric Precision, 5. Strict Anti-Slop Prohibitions (`R-01` to `R-40`), Dark Linear / Vercel Geist Desktop Engineering Workbench, DESIGN.md — OneSpec SDLC Workbench Visual & Architecture Specification

### Community 12 - "CompiledSdlcState"
Cohesion: 0.13
Nodes (17): ProductKnowledgeMonitorHubProps, LaypersonFeatureGuide, EnterpriseNextGenCommandDeckProps, ProductKnowledgeMonitorHubProps, IntegrationContractItem, Iso26514ModuleManual, CompiledSdlcState, AzDocumentationLibrary (+9 more)

### Community 14 - "bpmn-js.d.ts"
Cohesion: 0.50
Nodes (3): bpmn-js, bpmn-js/dist/bpmn-modeler.production.min.js, bpmn-js/dist/bpmn-navigated-viewer.production.min.js

### Community 15 - "dependencies"
Cohesion: 0.06
Nodes (32): dependencies, clsx@^2.1.1, cmdk@^1.1.1, cross-env@^10.1.0, docx@^9.15.3, @fastify/cors@^11.4.0, @fastify/sensible@^6.0.7, @fastify/websocket@^11.3.6 (+24 more)

### Community 16 - "src/services/rtmSynthesizer.ts"
Cohesion: 0.21
Nodes (18): RtmSpreadsheetGrid(), RtmSpreadsheetGridProps, @tanstack/react-table, RtmSpreadsheetGrid(), RtmSpreadsheetGridProps, ChangeImpactAnalysisReport, changeImpactService, ChangeRequestInput (+10 more)

### Community 17 - "TestSuiteExecutionTrace"
Cohesion: 0.15
Nodes (25): delay(), LiveRunnerWorkbench(), LiveRunnerWorkbenchProps, MonacoEditor, nodeTypes, PipelineStageNodeData, AutomationSynthesisState, UnifiedReportData (+17 more)

### Community 18 - "useStudioLocale"
Cohesion: 0.08
Nodes (33): MonacoEditor, GapAuditorWorkbench(), MonacoDiffEditor, ComplianceBinderWorkbench(), MonacoEditor, IsoRiskAuditWorkbench(), MonacoEditor, DelphiConsensusWorkbench() (+25 more)

### Community 19 - "DatabaseErdCanvas.tsx"
Cohesion: 0.22
Nodes (5): DatabaseErdCanvasProps, nodeTypes, elkjs@^0.12.1, elkjs, elkjs/lib/elk.bundled.js

### Community 20 - "playwright"
Cohesion: 0.40
Nodes (3): playwright, { chromium }, path

### Community 21 - "TestScenarioItem"
Cohesion: 0.19
Nodes (12): IntegrationContractItem, ChangeImpactAnalysisReport, ChangeRequestInput, Iso26514ModuleManual, SynthesizedQaWorkbook, SynthesizedRtmRow, DataDictionaryEntry, unifiedReportGenerator (+4 more)

### Community 22 - "architectureDeconstructor.ts"
Cohesion: 0.10
Nodes (22): EDGE_COLORS, ROLE_COLORS, VerifiedArchitectureMapCanvasProps, computeConnectorGeometry(), EDGE_COLORS, ROLE_COLORS, VerifiedArchitectureMapCanvasProps, DeconstructedArchitecture (+14 more)

### Community 27 - "index.ts"
Cohesion: 0.11
Nodes (24): fastify@^5.12.8, zod@^4.6.7, fastify, zod, verify(), globalForPrisma, prisma, bootstrap() (+16 more)

### Community 29 - "src/services/sdlcCompiler.ts"
Cohesion: 0.43
Nodes (14): UniversalKnowledgeGraphWorkbenchProps, BuildGraphParams, UniversalKnowledgeGraphWorkbenchProps, ComplianceAssessmentResult, DelphiConsensusSummary, IsoRiskAssessmentSummary, OwaspDastAssessmentSummary, BuildGraphParams (+6 more)

### Community 31 - "src/components/discovery/DecompiledBundleVault.tsx"
Cohesion: 0.21
Nodes (11): DecompiledBundleVault(), DecompiledBundleVaultProps, MonacoEditor, DecompiledBundleVaultProps, DeepUnpackParams, DeepUnpackResult, LeakedSecretItem, ReconstructedSourceFile (+3 more)

### Community 32 - "src/services/iso26514UserManualService.ts"
Cohesion: 0.15
Nodes (10): html, manual, Iso26514BusinessRuleItem, Iso26514ButtonEntry, Iso26514DomainGlossaryItem, Iso26514FaqItem, Iso26514FilterEntry, Iso26514SopItem (+2 more)

### Community 35 - "src/services/modernDocumentExporter.ts"
Cohesion: 0.11
Nodes (10): diff, state, bakeCalloutPinsOntoImage(), makeCell(), makeStyledTable(), modernDocumentExporter, ModernDocumentExporterService, rasterizeArchitectureSvgToImageRun() (+2 more)

### Community 36 - "src/services/blindCrawlerService.ts"
Cohesion: 0.06
Nodes (35): CapturedNetworkRequest, globalForBlindCrawler, HarvestedLoginDropdown, HarvestedLoginInput, HarvestedLoginSubmit, HarvestedLoginTab, InteractiveSessionState, LoginSurfaceSnapshot (+27 more)

### Community 38 - ".onespec-ui-backup-1794502240730/services/architectureMapEngine.ts"
Cohesion: 0.11
Nodes (14): DeconstructedArchitecture, ArchEdgeVariant, ArchFocusViewId, ArchitectureDeltaReceipt, ArchitectureLayoutGateResult, ArchitectureMapEngineService, ArchitectureValidationReceipt, ArchNodeRole (+6 more)

### Community 40 - "workspaceVaultService.ts"
Cohesion: 0.10
Nodes (12): newSnapshot, oldSnapshot, privateService, state, ChangeClassification, INDEX_FILE_PATH, LEGACY_CACHE_FILE_PATH, ModifiedApiContractDiffItem (+4 more)

### Community 42 - "EnterpriseLibraryPortal.tsx"
Cohesion: 0.12
Nodes (19): EnterpriseLibraryPortalProps, SingleProductDeepReaderProps, SyncConfirmDialogProps, EnterpriseLibraryPortalProps, ProductKnowledgeMonitorHub(), ReaderSectionId, SimulatedResponseState, SingleProductDeepReader() (+11 more)

### Community 44 - "ValidationRuleContract"
Cohesion: 0.27
Nodes (5): complianceBinderService, ComplianceControlItem, ComplianceEvidenceStatus, ComplianceScorecard, RegulatoryFramework

### Community 45 - "src/services/architectureDeconstructor.ts"
Cohesion: 0.10
Nodes (30): ArchitectureDeconstructorWorkbench(), ArchitectureDeconstructorWorkbenchProps, MonacoEditor, computeConnectorGeometry(), VerifiedArchitectureMapCanvas(), SequenceStepItem, VerifiedSequenceDiagramCanvas(), VerifiedSequenceDiagramCanvasProps (+22 more)

### Community 46 - "src/services/smtFormalVerifierService.ts"
Cohesion: 0.15
Nodes (11): SmtFormalInvariant, SmtLogicCategory, SmtVerificationVerdict, SmtVerifyParams, SmtFormalInvariant, smtFormalVerifierService, SmtLogicCategory, SmtVerificationVerdict (+3 more)

### Community 48 - "reaBridge.ts"
Cohesion: 0.20
Nodes (9): ReaApplicationAnalysis, ReaCliOptions, ReaDomSelector, ReaExecutionVerdict, ReaRouteDeclaration, ReaTableColumn, ReaTableDefinition, ReaTableIndex (+1 more)

### Community 49 - ".onespec-ui-backup-1794502240730/services/architectureDeconstructor.ts"
Cohesion: 0.12
Nodes (15): ArchitecturalFitnessFunctionItem, ArchitectureDecisionRecordItem, ArchitectureLayerBreakdownItem, ArchitectureTier, HighLevelArchitecture, IntegrationContractErrorResponse, IntegrationContractHeader, IntegrationContractParam (+7 more)

### Community 50 - "src/services/productKnowledgeAndMonitoringService.ts"
Cohesion: 0.22
Nodes (17): bindingsOf(), BugAndIssueMonitoringBoard, buildBugAndIssueMonitoringBoard(), buildDeveloperBugHandoverTicket(), buildManagementBriefingReport(), buildProductKnowledgeBlueprint(), CrudEntityPermission, endpointsOf() (+9 more)

### Community 51 - "capture-step4.js"
Cohesion: 0.40
Nodes (3): { chromium }, fs, path

### Community 54 - "DiscoveredApiEndpoint"
Cohesion: 0.16
Nodes (38): DastProbeRequestBody, ReverseDfdWorkbenchProps, ComplianceBinderWorkbenchProps, IsoRiskAuditWorkbenchProps, DelphiConsensusWorkbenchProps, SmtFormalVerifierWorkbenchProps, OwaspDastWorkbenchProps, ArchitectureDeconstructionInput (+30 more)

### Community 55 - "src/components/bpmn/CamundaBpmnViewer.tsx"
Cohesion: 0.15
Nodes (14): BpmnNodeClickEvent, CamundaBpmnViewer(), initBpmnViewer(), CamundaBpmnViewerProps, delay(), FlowStep, bpmn-js@^18.31.1, bpmn-js (+6 more)

### Community 56 - ".onespec-ui-backup-1794502240730/components/portal/EnterpriseLibraryPortal.tsx"
Cohesion: 0.22
Nodes (19): UniversalKnowledgeGraphWorkbench(), EnterpriseLibraryPortal(), ReaderSectionId, SimulatedResponseState, SingleProductDeepReader(), SyncConfirmDialog(), VerifiedArchitectureMapCanvas(), formatDateOnly() (+11 more)

### Community 57 - ".onespec-ui-backup-1794502240730/services/productKnowledgeAndMonitoringService.ts"
Cohesion: 0.21
Nodes (9): architectureMapEngine, bakeCalloutPinsOntoImage(), makeCell(), makeStyledTable(), modernDocumentExporter, ModernDocumentExporterService, rasterizeArchitectureSvgToImageRun(), TABLE_BORDERS (+1 more)

### Community 59 - "ref_node_fs"
Cohesion: 0.19
Nodes (6): brainPath, manualPath, reportPath, rootDir, srcDir, TsdMatrixRow

### Community 60 - "src/services/owaspDastService.ts"
Cohesion: 0.20
Nodes (7): nextConfig, next, OwaspApiCategory, owaspDastService, OwaspVulnerabilityFinding, SecurityHeaderAudit, VulnerabilitySeverity

### Community 61 - "react"
Cohesion: 0.13
Nodes (19): MonacoEditor, ReverseDfdWorkbench(), VerifiedDfdDiagramCanvas(), VerifiedDfdDiagramCanvasProps, ApiContractExplorer(), ApiContractExplorerProps, ApiReferenceReact, lucide-react (+11 more)

### Community 62 - ".onespec-ui-backup-1794502240730/lib/xlsxWriter.ts"
Cohesion: 0.18
Nodes (16): buildXlsxWorkbook(), cellXml(), columnLetter(), crc32(), CRC_TABLE, createZip(), encoder, escapeXml() (+8 more)

### Community 63 - ".onespec-ui-backup-1794502240730/services/sdlcCompiler.ts"
Cohesion: 0.17
Nodes (15): ComplianceAssessmentResult, DeepUnpackResult, DelphiConsensusSummary, ReverseDfdResult, IsoRiskAssessmentSummary, OwaspApiCategory, OwaspDastAssessmentSummary, owaspDastService (+7 more)

### Community 65 - "AuditDiscrepancyItem"
Cohesion: 0.21
Nodes (8): GapAuditorWorkbenchProps, gapAuditorService, GapAuditorWorkbenchProps, gapAuditorService, AuditDiscrepancyItem, DefectTicketPayload, GapAuditSummary, GapAuditVerdict

### Community 66 - "src/lib/xlsxWriter.ts"
Cohesion: 0.18
Nodes (16): buildXlsxWorkbook(), cellXml(), columnLetter(), crc32(), CRC_TABLE, createZip(), encoder, escapeXml() (+8 more)

### Community 67 - "DomTraceabilityBinding"
Cohesion: 0.27
Nodes (4): RunnerExecuteRequestBody, DomTraceabilityMapProps, RunnerExecuteRequestBody, DomTraceabilityBinding

### Community 68 - ".onespec-ui-backup-1794502240730/services/deepBundleUnpackerService.ts"
Cohesion: 0.17
Nodes (7): deepBundleUnpackerService, DeepUnpackParams, LeakedSecretItem, ReconstructedSourceFile, SecretSeverity, SecretType, ShadowEndpointItem

### Community 69 - ".onespec-ui-backup-1794502240730/services/rtmSynthesizer.ts"
Cohesion: 0.06
Nodes (22): BusinessDomainPattern, DomainIntelligenceReport, domainLogicBrainService, DomainScenarioBlueprint, Iso26514BusinessRuleItem, Iso26514ButtonEntry, Iso26514DomainGlossaryItem, Iso26514FaqItem (+14 more)

### Community 70 - ".onespec-ui-backup-1794502240730/services/sdlcKnowledgeGraphService.ts"
Cohesion: 0.11
Nodes (11): AzDocumentationLibrary, CypherQuerySample, KnowledgeEdgePredicate, KnowledgeGraphEdge, KnowledgeGraphNode, KnowledgeNodeType, LaypersonHighlightCard, LaypersonRecommendation (+3 more)

### Community 71 - "apply-master-patch.mjs"
Cohesion: 0.14
Nodes (13): allSrcFiles, backupDir, candidateZips, domainBrainPath, findFiles(), foundZip, gateReportPath, home (+5 more)

### Community 72 - "src/lib/i18n.tsx"
Cohesion: 0.14
Nodes (16): ContractWireframePreview(), ContractWireframeProps, delay(), WireframeState, EN_COPY, ID_COPY, StudioCopy, StudioLocale (+8 more)

### Community 75 - "check-product-knowledge.ts"
Cohesion: 0.20
Nodes (9): blueprint, board, briefing, diff, invoiceModule, loginModule, manual, state (+1 more)

### Community 76 - ".onespec-ui-backup-1794502240730/lib/presentationSanitizer.ts"
Cohesion: 0.22
Nodes (10): EnvironmentLabel, formatDateOnly(), formatRelativeTime(), getEnvironmentLabel(), isPrivateHost(), maskTargetUrl(), PresentationLocale, RAW_PROMPT_MARKERS (+2 more)

### Community 77 - ".onespec-ui-backup-1794502240730/services/delphiConsensusService.ts"
Cohesion: 0.20
Nodes (6): DebateStance, delphiConsensusService, DelphiDebateEntry, DelphiPersona, DelphiRound, PersonaSignOffSeal

### Community 78 - "buildProductKnowledgeBlueprint"
Cohesion: 0.17
Nodes (21): bindingsOf(), BugAndIssueMonitoringBoard, buildBugAndIssueMonitoringBoard(), buildManagementBriefingReport(), buildProductKnowledgeBlueprint(), CrudEntityPermission, CrudMatrixRow, endpointsOf() (+13 more)

### Community 79 - "triModalDiscoveryService"
Cohesion: 0.23
Nodes (7): BpmnDiscoveredModuleFlow, BpmnGeneratorInput, escapeXml(), generateCanonicalBpmn2Xml(), compileGreenfieldFromMoM(), synthesizeFullSdlcFromCrawl(), triModalDiscoveryService

### Community 81 - "LoginSurfaceProbeResult"
Cohesion: 0.18
Nodes (5): blindCrawlSchema, maxDuration, blindCrawlSchema, maxDuration, LoginSurfaceProbeResult

### Community 82 - ".onespec-ui-backup-1794502240730/services/reaBridge.ts"
Cohesion: 0.14
Nodes (12): ReaApplicationAnalysis, reaBridge, ReaCliOptions, ReaDomSelector, ReaExecutionVerdict, ReaRouteDeclaration, ReaTableColumn, ReaTableDefinition (+4 more)

### Community 84 - ".onespec-ui-backup-1794502240730/components/portal/ProductKnowledgeMonitorHub.tsx"
Cohesion: 0.22
Nodes (7): Badge(), IssueStatus, PanelId, ProductKnowledgeMonitorHub(), statusTone, ManagementBriefingReport, productKnowledgeAndMonitoringService

### Community 85 - "apply-nextgen-innovations.mjs"
Cohesion: 0.22
Nodes (8): brainPath, deckPath, findFiles(), hubFiles, pkServicePath, reportPath, rootDir, srcDir

### Community 86 - ".onespec-ui-backup-1794502240730/lib/i18n.tsx"
Cohesion: 0.22
Nodes (6): EN_COPY, ID_COPY, StudioCopy, StudioLocale, StudioLocaleContext, StudioLocaleContextValue

### Community 87 - ".onespec-ui-backup-1794502240730/services/enterpriseLibraryPortalService.ts"
Cohesion: 0.16
Nodes (11): CrossSystemDependencyNode, enterpriseLibraryPortalService, EnterprisePortfolioSummary, FederatedArtifactCategory, FederatedSearchResultItem, Iso9001DocumentControlSheet, IsoRevisionLedgerRow, ProductCatalogCard (+3 more)

### Community 88 - ".onespec-ui-backup-1794502240730/services/workspaceVaultService.ts"
Cohesion: 0.22
Nodes (8): ChangeClassification, INDEX_FILE_PATH, LEGACY_CACHE_FILE_PATH, ModifiedApiContractDiffItem, ProjectHistoricalSnapshot, ProjectIndexEntry, PROJECTS_DIR, VAULT_ROOT_DIR

### Community 90 - ".onespec-ui-backup-1794502240730/services/dfdReverseService.ts"
Cohesion: 0.17
Nodes (7): DfdDataFlow, DfdLevel, DfdModelLevel, DfdNode, DfdNodeType, dfdReverseService, PiiClassification

### Community 91 - ".onespec-ui-backup-1794502240730/services/iso31000RiskService.ts"
Cohesion: 0.25
Nodes (6): IsoRiskItem, MerkleTreeVault, RiskImpact, RiskLikelihood, RiskSeverityLevel, Soc2TrustControl

### Community 94 - "src/components/portal/ProductKnowledgeMonitorHub.tsx"
Cohesion: 0.22
Nodes (8): IssueStatus, StatusBadge(), statusTone, TabId, CrudMatrixRow, FieldLineageMapping, ModuleHealth, WorkflowStage

### Community 97 - "src/services/domainLogicBrainService.ts"
Cohesion: 0.47
Nodes (5): BusinessDomainPattern, DomainScenarioBlueprint, SyntheticDataFactoryBundle, Iso29119Technique, ManualTestStep

### Community 98 - "fix-pk-build.mjs"
Cohesion: 0.40
Nodes (4): backups, pkPath, pks, rootDir

### Community 99 - "@prisma/client"
Cohesion: 0.40
Nodes (4): globalForPrisma, prisma, @prisma/client@^6.19.3, @prisma/client

### Community 100 - ".onespec-ui-backup-1794502240730/services/complianceBinderService.ts"
Cohesion: 0.22
Nodes (5): complianceBinderService, ComplianceControlItem, ComplianceEvidenceStatus, ComplianceScorecard, RegulatoryFramework

### Community 101 - "src/components/wireframe/ContractWireframePreview.tsx"
Cohesion: 0.50
Nodes (4): ContractWireframePreview(), ContractWireframeProps, delay(), WireframeState

### Community 104 - "verify-master-functional-upgrade.js"
Cohesion: 0.40
Nodes (3): { chromium }, fs, path

## Knowledge Gaps
- **36 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `page.tsx`, `triModalDiscoveryService.ts`, `devDependencies`, `dependencies`, `src/services/rtmSynthesizer.ts`, `TestSuiteExecutionTrace`, `DatabaseErdCanvas.tsx`, `architectureDeconstructor.ts`, `src/services/sdlcCompiler.ts`, `src/components/discovery/DecompiledBundleVault.tsx`, `EnterpriseLibraryPortal.tsx`, `ValidationRuleContract`, `src/services/architectureDeconstructor.ts`, `src/services/smtFormalVerifierService.ts`, `DiscoveredApiEndpoint`, `src/components/bpmn/CamundaBpmnViewer.tsx`, `.onespec-ui-backup-1794502240730/components/portal/EnterpriseLibraryPortal.tsx`, `src/services/owaspDastService.ts`, `AuditDiscrepancyItem`, `DomTraceabilityBinding`, `src/lib/i18n.tsx`, `.onespec-ui-backup-1794502240730/components/portal/ProductKnowledgeMonitorHub.tsx`, `.onespec-ui-backup-1794502240730/lib/i18n.tsx`, `src/components/portal/ProductKnowledgeMonitorHub.tsx`, `src/components/wireframe/ContractWireframePreview.tsx`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **Should `page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10101010101010101 - nodes in this community are weakly interconnected._
- **Why does `DiscoveredApiEndpoint` connect `DiscoveredApiEndpoint` to `page.tsx`, `sdlc.ts`, `triModalDiscoveryService.ts`, `CompiledSdlcState`, `src/services/rtmSynthesizer.ts`, `TestSuiteExecutionTrace`, `src/services/sdlcCompiler.ts`, `src/components/discovery/DecompiledBundleVault.tsx`, `src/services/blindCrawlerService.ts`, `ValidationRuleContract`, `src/services/architectureDeconstructor.ts`, `src/services/smtFormalVerifierService.ts`, `.onespec-ui-backup-1794502240730/services/architectureDeconstructor.ts`, `triModalDiscoveryService`, `src/services/owaspDastService.ts`, `react`, `.onespec-ui-backup-1794502240730/services/sdlcCompiler.ts`, `AuditDiscrepancyItem`, `DomTraceabilityBinding`, `.onespec-ui-backup-1794502240730/services/deepBundleUnpackerService.ts`, `.onespec-ui-backup-1794502240730/services/rtmSynthesizer.ts`, `.onespec-ui-backup-1794502240730/services/sdlcKnowledgeGraphService.ts`, `src/lib/i18n.tsx`, `.onespec-ui-backup-1794502240730/services/delphiConsensusService.ts`, `triModalDiscoveryService`, `.onespec-ui-backup-1794502240730/services/reaBridge.ts`, `.onespec-ui-backup-1794502240730/services/dfdReverseService.ts`, `.onespec-ui-backup-1794502240730/services/iso31000RiskService.ts`, `.onespec-ui-backup-1794502240730/services/complianceBinderService.ts`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **Should `sdlc.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.04878048780487805 - nodes in this community are weakly interconnected._
- **Why does `next` connect `src/services/owaspDastService.ts` to `page.tsx`, `devDependencies`, `i18n.tsx`, `CompiledSdlcState`, `dependencies`, `TestSuiteExecutionTrace`, `ref_path`, `src/services/sdlcCompiler.ts`, `src/components/discovery/DecompiledBundleVault.tsx`, `src/services/modernDocumentExporter.ts`, `src/services/blindCrawlerService.ts`, `workspaceVaultService.ts`, `EnterpriseLibraryPortal.tsx`, `ValidationRuleContract`, `src/services/architectureDeconstructor.ts`, `src/services/smtFormalVerifierService.ts`, `DiscoveredApiEndpoint`, `ref_node_fs`, `react`, `AuditDiscrepancyItem`, `DomTraceabilityBinding`, `src/lib/i18n.tsx`, `LoginSurfaceProbeResult`, `src/app/api/discovery/interactive-session/route.ts`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.08143939393939394 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._