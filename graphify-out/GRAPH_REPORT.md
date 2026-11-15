# Graph Report - OneSpec SDLC Studio  (2026-11-16)

## Corpus Check
- 128 files · ~280,895 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: (none) 5, .example 1, .prisma 1)

## Summary
- 1264 nodes · 3279 edges · 91 communities (57 shown, 34 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 20 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `165498a2`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- page.tsx
- sdlc.ts
- discoveryRoutes.ts
- devDependencies
- compilerOptions
- featureModuleCoverage.ts
- scripts
- ARCHITECTURE_AND_SDLC_SPEC.md — OneSpec SDLC Workbench
- Bagian 3: Urutan Prompt Step-by-Step untuk AI Perusahaan Anda
- ReaBridgeService
- DESIGN.md — OneSpec SDLC Workbench Visual & Architecture Specification
- sdlcCompiler.ts
- OneSpec SDLC Studio
- bpmn-js.d.ts
- dependencies
- DiscoveredApiEndpoint
- SingleProductDeepReader.tsx
- owaspDastService.ts
- elkjs
- playwright
- steps
- architectureDeconstructor.ts
- blindCrawlerService
- ref_fs
- capture-step6.js
- capture-step7.js
- index.ts
- ci-gate/route.ts
- deepBundleUnpackerService.ts
- .onespec-crawler-backup-2026-11-13T11-43-28-062Z/src/services/blindCrawlerService.ts
- src/services/iso26514UserManualService.ts
- test-cmdk.js
- test-explorer.js
- check-screenshot-guard.ts
- unifiedReportGenerator.ts
- workspaceVaultService
- presentationSanitizer.ts
- iso31000RiskService
- deep-harvest-cli.mjs
- delphiConsensusService
- SingleProductDeepReader.tsx
- architectureDeconstructorService
- complianceBinderService
- architectureDeconstructor.ts
- smtFormalVerifierService
- tsdSynthesizerService
- triModalDiscoveryService.ts
- ArchitectureMapEngineService
- src/services/productKnowledgeAndMonitoringService.ts
- capture-step4.js
- triModalDiscoveryService
- workspaceVaultService.ts
- LiveRunnerWorkbench.tsx
- SavedProjectRecord
- ArchitectureDeconstructorWorkbench.tsx
- modernDocumentExporter.ts
- verify-master-upgrade-final.js
- automationSynthesizerService
- ReverseDfdWorkbench.tsx
- dfdReverseService
- generateCanonicalBpmn2Xml
- sdlcKnowledgeGraphService.ts
- next
- src/lib/xlsxWriter.ts
- ref_node_fs
- DelphiConsensusWorkbench.tsx
- safe-git-push.sh
- sdlcKnowledgeGraphService
- FeatureModuleSurface
- layout.tsx
- selfHealingPatchService
- rtmSynthesizer.ts
- TestScenarioItem
- @fastify/cors
- iso26514UserManualService
- blindCrawlerService
- crawl/route.ts
- LoginSurfaceProbeResult
- blind-crawl/route.ts
- deepSpaHarvester.ts
- changeImpactService
- buildFeatureModuleBlueprintSvgDataUrl
- domainLogicBrainService
- verify-master-functional-upgrade.js
- capture-step5.js
- test-blind-crawl-live.js
- test-terminal.js
- verify-all-steps-crawled.js

## God Nodes (most connected - your core abstractions)
1. `CompiledSdlcState` - 77 edges
2. `DiscoveredApiEndpoint` - 62 edges
3. `DatabaseErdTable` - 60 edges
4. `ValidationRuleContract` - 55 edges
5. `FeatureModuleSurface` - 47 edges
6. `BrdMatrixRow` - 42 edges
7. `blindCrawlerService` - 41 edges
8. `blindCrawlerService` - 36 edges
9. `useStudioLocale()` - 35 edges
10. `SynthesizedRtmRow` - 34 edges

## Surprising Connections (you probably didn't know these)
- `8. 7-Layer Deep SPA Harvester 2.0 & Cross-Subdomain Engine` --references--> `DatabaseErdTable`  [INFERRED]
  ARCHITECTURE_AND_SDLC_SPEC.md → src/types/sdlc.ts
- `4. 7-Layer Deep SPA Harvester 2.0` --references--> `DatabaseErdTable`  [INFERRED]
  README.md → src/types/sdlc.ts
- `4. PROTECTED CORE SERVICES (`src/services/`)` --references--> `SyntheticDataFactoryBundle`  [INFERRED]
  AGENTS.md → src/services/domainLogicBrainService.ts
- `4. PROTECTED CORE SERVICES (`src/services/`)` --references--> `SyntheticDataFactoryBundle`  [INFERRED]
  CLAUDE.md → src/services/domainLogicBrainService.ts
- `InteractiveSessionState` --references--> `BlindCrawlResult`  [EXTRACTED]
  .onespec-crawler-backup-2026-11-13T11-43-28-062Z/src/services/blindCrawlerService.ts → src/types/sdlc.ts

## Import Cycles
- None detected.

## Communities (91 total, 34 thin omitted)

### Community 0 - "page.tsx"
Cohesion: 0.09
Nodes (39): @monaco-editor/react, DatabaseErdCanvas, ExtractedEntity, LiveRunnerWorkbench, MonacoEditor, OneSpecEngineeringWorkbench(), GapAuditorWorkbench(), MonacoDiffEditor (+31 more)

### Community 1 - "sdlc.ts"
Cohesion: 0.05
Nodes (39): AutoRobotFieldValue, BpmnActorType, BpmnEdge, BpmnNode, BpmnNodeProperties, BpmnNodeType, BpmnProcessModel, BpmnSwimlane (+31 more)

### Community 2 - "discoveryRoutes.ts"
Cohesion: 0.16
Nodes (16): DEFAULT_GIT_REFS, StagingDiscoveryWithAuthConfig, TriModalDiscoveryToolbarProps, blindCrawlSchema, gitConnectSchema, gitRefsQuerySchema, reportGenerateSchema, uploadArchiveSchema (+8 more)

### Community 3 - "devDependencies"
Cohesion: 0.08
Nodes (32): author, description, devDependencies, autoprefixer@^10.6.2, concurrently@^10.0.6, playwright@^1.64.1, postcss@^8.5.32, prisma@6.19.3 (+24 more)

### Community 4 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 5 - "featureModuleCoverage.ts"
Cohesion: 0.40
Nodes (12): buildSurfaceFromApiGroup(), buildSurfaceFromCrawledModule(), buildSurfaceFromPage(), ensureCompleteFeatureModuleCoverage(), fieldLabelsFromApi(), findCoveringModule(), humanizeSegment(), moduleNameFromRoute() (+4 more)

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

### Community 12 - "sdlcCompiler.ts"
Cohesion: 0.22
Nodes (15): GapAuditorWorkbenchProps, UniversalKnowledgeGraphWorkbenchProps, ChangeImpactAnalysisReport, ChangeRequestInput, ComplianceAssessmentResult, DelphiConsensusSummary, gapAuditorService, IsoRiskAssessmentSummary (+7 more)

### Community 13 - "OneSpec SDLC Studio"
Cohesion: 0.06
Nodes (32): 1. UI ARCHITECTURE LOCK (NEVER REVERT TO LEGACY UI), 2. NEXT.JS 16 (TURBOPACK) & REACT 19 SYNTAX INTEGRITY (ZERO WHITE SCREEN), 3. TYPESCRIPT & RUNTIME SAFETY (ZERO TDZ & ZERO PLACEHOLDERS), 4. PROTECTED CORE SERVICES (`src/services/`), ONESPEC SDLC STUDIO — STRICT ENTERPRISE AI GUARDRAILS (ANTIGRAVITY RULES), 1. UI ARCHITECTURE LOCK (NEVER REVERT TO LEGACY UI), 2. NEXT.JS 16 (TURBOPACK) & REACT 19 SYNTAX INTEGRITY (ZERO WHITE SCREEN), 3. TYPESCRIPT & RUNTIME SAFETY (ZERO TDZ & ZERO PLACEHOLDERS) (+24 more)

### Community 14 - "bpmn-js.d.ts"
Cohesion: 0.50
Nodes (3): bpmn-js, bpmn-js/dist/bpmn-modeler.production.min.js, bpmn-js/dist/bpmn-navigated-viewer.production.min.js

### Community 15 - "dependencies"
Cohesion: 0.07
Nodes (30): dependencies, bpmn-js@^18.31.1, clsx@^2.1.1, cmdk@^1.1.1, cross-env@^10.1.0, docx@^9.15.3, lucide-react@^1.66.0, @monaco-editor/react@^4.7.0 (+22 more)

### Community 16 - "DiscoveredApiEndpoint"
Cohesion: 0.18
Nodes (31): DastProbeRequestBody, ReverseDfdWorkbenchProps, ComplianceBinderWorkbenchProps, IsoRiskAuditWorkbenchProps, DelphiConsensusWorkbenchProps, SmtFormalVerifierWorkbenchProps, OwaspDastWorkbenchProps, ArchitectureDeconstructionInput (+23 more)

### Community 17 - "SingleProductDeepReader.tsx"
Cohesion: 0.18
Nodes (17): VerifiedArchitectureMapCanvas(), EnterpriseLibraryPortal(), normalizeManualImgSrc(), ReaderSectionId, SimulatedResponseState, SingleProductDeepReader(), SingleProductDeepReaderProps, EnvironmentLabel (+9 more)

### Community 18 - "owaspDastService.ts"
Cohesion: 0.16
Nodes (11): MonacoEditor, OwaspApiCategory, owaspDastService, OwaspVulnerabilityFinding, SecurityHeaderAudit, VulnerabilitySeverity, SmtLogicCategory, SmtVerificationVerdict (+3 more)

### Community 19 - "elkjs"
Cohesion: 0.50
Nodes (3): elkjs@^0.12.1, elkjs, elkjs/lib/elk.bundled.js

### Community 21 - "steps"
Cohesion: 0.09
Nodes (22): name, runs-on, steps, timeout-minutes, concurrency, cancel-in-progress, group, jobs (+14 more)

### Community 22 - "architectureDeconstructor.ts"
Cohesion: 0.13
Nodes (17): computeConnectorGeometry(), EDGE_COLORS, ROLE_COLORS, VerifiedArchitectureMapCanvasProps, ArchEdgeVariant, ArchFocusViewId, ArchitectureDeltaReceipt, ArchitectureLayoutGateResult (+9 more)

### Community 27 - "index.ts"
Cohesion: 0.14
Nodes (18): fastify@^5.12.8, @fastify/sensible@^6.0.7, @fastify/websocket@^11.3.6, @prisma/client@^6.19.3, fastify, @fastify/sensible, @fastify/websocket, @prisma/client (+10 more)

### Community 29 - "ci-gate/route.ts"
Cohesion: 0.12
Nodes (12): dynamic, GET(), handleExportBundle(), maxDuration, POST(), resolveStateAndProject(), automationBundleExportService, rbacDifferentialMatrixService (+4 more)

### Community 30 - "deepBundleUnpackerService.ts"
Cohesion: 0.17
Nodes (7): deepBundleUnpackerService, DeepUnpackParams, LeakedSecretItem, ReconstructedSourceFile, SecretSeverity, SecretType, ShadowEndpointItem

### Community 31 - ".onespec-crawler-backup-2026-11-13T11-43-28-062Z/src/services/blindCrawlerService.ts"
Cohesion: 0.06
Nodes (34): CapturedNetworkRequest, globalForBlindCrawler, HarvestedLoginDropdown, HarvestedLoginInput, HarvestedLoginSubmit, HarvestedLoginTab, LoginSurfaceSnapshot, ModuleRuntimeError (+26 more)

### Community 32 - "src/services/iso26514UserManualService.ts"
Cohesion: 0.22
Nodes (8): Iso26514BusinessRuleItem, Iso26514ButtonEntry, Iso26514DomainGlossaryItem, Iso26514FaqItem, Iso26514FilterEntry, Iso26514SopItem, Iso26514StateTransitionItem, Iso26514UiInteractionItem

### Community 35 - "check-screenshot-guard.ts"
Cohesion: 0.17
Nodes (19): sharp@^0.35.5, sharp, blankSvg(), clientVerdict(), main(), moduleSurface, toDataUrl(), toJpeg() (+11 more)

### Community 36 - "unifiedReportGenerator.ts"
Cohesion: 0.15
Nodes (10): html, manual, RtmSpreadsheetGridProps, IntegrationContractItem, Iso26514ModuleManual, DataDictionaryEntry, LaypersonFeatureGuide, UnifiedReportData (+2 more)

### Community 38 - "presentationSanitizer.ts"
Cohesion: 0.24
Nodes (9): formatDateOnly(), formatRelativeTime(), getEnvironmentLabel(), isPrivateHost(), maskTargetUrl(), PresentationLocale, RAW_PROMPT_MARKERS, redactSensitiveText() (+1 more)

### Community 40 - "deep-harvest-cli.mjs"
Cohesion: 0.24
Nodes (8): authStatePath, cachePath, captureCdpShot(), indexPath, rootDir, runUnlimitedHarvest(), inspectSingleRoute(), vaultDir

### Community 42 - "SingleProductDeepReader.tsx"
Cohesion: 0.24
Nodes (12): EnterpriseNextGenCommandDeck(), EnterpriseNextGenCommandDeckProps, normalizeManualImgSrc(), UniversalKnowledgeGraphWorkbench(), ModuleScreenshot(), ModuleScreenshotProps, isBlankOrMissingScreenshot(), cacheKey() (+4 more)

### Community 45 - "architectureDeconstructor.ts"
Cohesion: 0.14
Nodes (13): ArchitecturalFitnessFunctionItem, ArchitectureDecisionRecordItem, ArchitectureLayerBreakdownItem, ArchitectureTier, HighLevelArchitecture, IntegrationContractErrorResponse, IntegrationContractHeader, IntegrationContractParam (+5 more)

### Community 48 - "triModalDiscoveryService.ts"
Cohesion: 0.11
Nodes (19): main(), testDomainLogicBrainAndWhiteBoxScenarios(), testReaBridgeAstExtractor(), testUserManualSection7(), analyzeAppSchema, analyzeWebsiteSchema, introspectDbSchema, triModalDiscoverSchema (+11 more)

### Community 50 - "src/services/productKnowledgeAndMonitoringService.ts"
Cohesion: 0.08
Nodes (38): blueprint, board, briefing, diff, invoiceModule, loginModule, manual, state (+30 more)

### Community 51 - "capture-step4.js"
Cohesion: 0.40
Nodes (3): { chromium }, fs, path

### Community 52 - "triModalDiscoveryService"
Cohesion: 0.35
Nodes (4): synthesizeFullSdlcFromCrawl(), triModalDiscoveryService, GitDiscoveryConfig, LocalDiscoveryConfig

### Community 53 - "workspaceVaultService.ts"
Cohesion: 0.11
Nodes (12): newSnapshot, oldSnapshot, privateService, state, ChangeClassification, INDEX_FILE_PATH, LEGACY_CACHE_FILE_PATH, ModifiedApiContractDiffItem (+4 more)

### Community 54 - "LiveRunnerWorkbench.tsx"
Cohesion: 0.19
Nodes (16): dynamic, maxDuration, RunnerExecuteRequestBody, DomTraceabilityMapProps, delay(), LiveRunnerWorkbench(), LiveRunnerWorkbenchProps, MonacoEditor (+8 more)

### Community 55 - "SavedProjectRecord"
Cohesion: 0.27
Nodes (5): EnterpriseLibraryPortalProps, QuickExportToolbarProps, enterpriseLibraryPortalService, CompiledSdlcState, SavedProjectRecord

### Community 56 - "ArchitectureDeconstructorWorkbench.tsx"
Cohesion: 0.33
Nodes (8): ArchitectureDeconstructorWorkbench(), ArchitectureDeconstructorWorkbenchProps, MonacoEditor, SequenceStepItem, VerifiedSequenceDiagramCanvas(), VerifiedSequenceDiagramCanvasProps, LowLevelComponentTrace, UpstreamLinkedProjectInfo

### Community 57 - "modernDocumentExporter.ts"
Cohesion: 0.18
Nodes (9): diff, state, bakeCalloutPinsOntoImage(), makeCell(), makeStyledTable(), modernDocumentExporter, ModernDocumentExporterService, rasterizeArchitectureSvgToImageRun() (+1 more)

### Community 61 - "ReverseDfdWorkbench.tsx"
Cohesion: 0.13
Nodes (17): lucide-react, react, MonacoEditor, ReverseDfdWorkbench(), VerifiedDfdDiagramCanvas(), VerifiedDfdDiagramCanvasProps, DatabaseErdCanvasProps, nodeTypes (+9 more)

### Community 63 - "generateCanonicalBpmn2Xml"
Cohesion: 0.50
Nodes (4): BpmnDiscoveredModuleFlow, BpmnGeneratorInput, escapeXml(), generateCanonicalBpmn2Xml()

### Community 64 - "sdlcKnowledgeGraphService.ts"
Cohesion: 0.15
Nodes (11): AzDocumentationLibrary, CypherQuerySample, KnowledgeEdgePredicate, KnowledgeGraphEdge, KnowledgeGraphNode, KnowledgeNodeType, LaypersonHighlightCard, LaypersonRecommendation (+3 more)

### Community 65 - "next"
Cohesion: 0.20
Nodes (6): nextConfig, next, ApiContractExplorer(), ApiContractExplorerProps, ApiReferenceReact, TsdMatrixRow

### Community 66 - "src/lib/xlsxWriter.ts"
Cohesion: 0.18
Nodes (16): buildXlsxWorkbook(), cellXml(), columnLetter(), crc32(), CRC_TABLE, createZip(), encoder, escapeXml() (+8 more)

### Community 67 - "ref_node_fs"
Cohesion: 0.23
Nodes (9): createFallbackSvg(), dynamic, GET(), MIME_TYPES, CiGateEvaluationResult, evaluateCiGates(), GET(), POST() (+1 more)

### Community 68 - "DelphiConsensusWorkbench.tsx"
Cohesion: 0.15
Nodes (11): EN_COPY, ID_COPY, StudioCopy, StudioLocale, StudioLocaleContext, StudioLocaleContextValue, DebateStance, DelphiDebateEntry (+3 more)

### Community 71 - "FeatureModuleSurface"
Cohesion: 0.40
Nodes (5): InteractiveSessionState, InteractiveSessionState, BlindCrawlDiscoveredForm, CrawledModuleSummary, FeatureModuleSurface

### Community 72 - "layout.tsx"
Cohesion: 0.50
Nodes (3): metadata, RootLayout(), StudioLocaleProvider()

### Community 74 - "rtmSynthesizer.ts"
Cohesion: 0.38
Nodes (9): RtmSpreadsheetGrid(), AutomationParityStatus, Expected3LayerVerification, generateBugReportCsv(), generateBugReportMarkdown(), generateFeatureBundle(), generateRtmMarkdown(), generateTestRailCsv() (+1 more)

### Community 75 - "TestScenarioItem"
Cohesion: 0.33
Nodes (8): BusinessDomainPattern, DomainIntelligenceReport, DomainScenarioBlueprint, Iso29119Technique, ManualTestStep, SynthesizedQaWorkbook, TestScenarioItem, UatAcceptanceCriterion

### Community 79 - "crawl/route.ts"
Cohesion: 0.47
Nodes (4): maxDuration, POST(), maxDuration, POST()

### Community 81 - "blind-crawl/route.ts"
Cohesion: 0.33
Nodes (4): zod@^4.6.7, zod, blindCrawlSchema, maxDuration

### Community 82 - "deepSpaHarvester.ts"
Cohesion: 0.27
Nodes (9): AUTH_STATE_PATH, captureInstantCdpScreenshot(), normalizeRoutePath(), runDeepSpaHarvester(), SESSION_STATE_PATH, waitForSpaDataReady(), BlindCrawlConfig, DatabaseErdColumn (+1 more)

### Community 84 - "buildFeatureModuleBlueprintSvgDataUrl"
Cohesion: 0.36
Nodes (11): BlueprintButtonEntry, BlueprintFilterEntry, BlueprintModuleInput, buildFeatureModuleBlueprintSvgDataUrl(), clamp(), clip(), escapeXml(), placeControls() (+3 more)

### Community 104 - "verify-master-functional-upgrade.js"
Cohesion: 0.40
Nodes (3): { chromium }, fs, path

### Community 105 - "capture-step5.js"
Cohesion: 0.40
Nodes (3): playwright, { chromium }, path

## Knowledge Gaps
- **34 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `DatabaseErdTable` connect `DiscoveredApiEndpoint` to `page.tsx`, `sdlc.ts`, `ARCHITECTURE_AND_SDLC_SPEC.md — OneSpec SDLC Workbench`, `sdlcCompiler.ts`, `OneSpec SDLC Studio`, `owaspDastService.ts`, `.onespec-crawler-backup-2026-11-13T11-43-28-062Z/src/services/blindCrawlerService.ts`, `src/services/iso26514UserManualService.ts`, `SingleProductDeepReader.tsx`, `architectureDeconstructor.ts`, `triModalDiscoveryService.ts`, `triModalDiscoveryService`, `SavedProjectRecord`, `ReverseDfdWorkbench.tsx`, `sdlcKnowledgeGraphService.ts`, `DelphiConsensusWorkbench.tsx`, `rtmSynthesizer.ts`, `TestScenarioItem`, `iso26514UserManualService`, `deepSpaHarvester.ts`, `domainLogicBrainService`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `DatabaseErdTable` (e.g. with `8. 7-Layer Deep SPA Harvester 2.0 & Cross-Subdomain Engine` and `4. 7-Layer Deep SPA Harvester 2.0`) actually correct?**
  _`DatabaseErdTable` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09494949494949495 - nodes in this community are weakly interconnected._
- **Why does `next` connect `next` to `page.tsx`, `devDependencies`, `sdlcCompiler.ts`, `dependencies`, `DiscoveredApiEndpoint`, `owaspDastService.ts`, `ref_fs`, `ci-gate/route.ts`, `check-screenshot-guard.ts`, `workspaceVaultService.ts`, `LiveRunnerWorkbench.tsx`, `SavedProjectRecord`, `ArchitectureDeconstructorWorkbench.tsx`, `interactive-session/route.ts`, `ReverseDfdWorkbench.tsx`, `ref_node_fs`, `DelphiConsensusWorkbench.tsx`, `layout.tsx`, `crawl/route.ts`, `blind-crawl/route.ts`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **Should `sdlc.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Why does `playwright` connect `capture-step5.js` to `test-cmdk.js`, `test-explorer.js`, `devDependencies`, `verify-master-upgrade-final.js`, `check-screenshot-guard.ts`, `deep-harvest-cli.mjs`, `verify-master-functional-upgrade.js`, `test-blind-crawl-live.js`, `test-terminal.js`, `verify-all-steps-crawled.js`, `deepSpaHarvester.ts`, `capture-step4.js`, `playwright`, `LiveRunnerWorkbench.tsx`, `capture-step6.js`, `capture-step7.js`, `.onespec-crawler-backup-2026-11-13T11-43-28-062Z/src/services/blindCrawlerService.ts`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.08143939393939394 - nodes in this community are weakly interconnected._