# Graph Report - OneSpec SDLC Studio  (2026-11-15)

## Corpus Check
- 128 files · ~280,101 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: (none) 5, .example 1, .prisma 1)

## Summary
- 1258 nodes · 3263 edges · 90 communities (60 shown, 30 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 20 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d38517e0`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- page.tsx
- sdlc.ts
- triModalDiscoveryService.ts
- devDependencies
- compilerOptions
- featureModuleCoverage.ts
- scripts
- ARCHITECTURE_AND_SDLC_SPEC.md — OneSpec SDLC Workbench
- Bagian 3: Urutan Prompt Step-by-Step untuk AI Perusahaan Anda
- ReaBridgeService
- DESIGN.md — OneSpec SDLC Workbench Visual & Architecture Specification
- featureModuleScreenshotSanitizer.ts
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
- modernDocumentExporter.ts
- src/services/blindCrawlerService.ts
- workspaceVaultService.ts
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
- reaBridge.ts
- ArchitectureMapEngineService
- src/services/productKnowledgeAndMonitoringService.ts
- capture-step4.js
- triModalDiscoveryService
- test-master-deep-engine.ts
- sdlcCompiler.ts
- SavedProjectRecord
- next
- export-all-bundle/route.ts
- verify-master-upgrade-final.js
- discoveryRoutes.ts
- ReverseDfdWorkbench.tsx
- dfdReverseService
- generateCanonicalBpmn2Xml
- bpmn-js
- react
- src/lib/xlsxWriter.ts
- ref_node_fs
- DelphiConsensusWorkbench.tsx
- safe-git-push.sh
- IsoRiskAuditWorkbench.tsx
- ci-gate/route.ts
- i18n.tsx
- selfHealingPatchService
- VerifiedSequenceDiagramCanvas.tsx
- cmdk
- @fastify/cors
- @fastify/websocket
- FeatureSurfaceInput
- blind-crawl/route.ts
- deepSpaHarvester.ts
- buildFeatureModuleBlueprintSvgDataUrl
- ProductKnowledgeMonitorHub.tsx
- domainLogicBrainService
- package.json
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
- `LoginSurfaceSnapshot` --references--> `ScreenControlCatalogItem`  [EXTRACTED]
  .onespec-crawler-backup-2026-11-13T11-43-28-062Z/src/services/blindCrawlerService.ts → src/types/sdlc.ts

## Import Cycles
- None detected.

## Communities (90 total, 30 thin omitted)

### Community 0 - "page.tsx"
Cohesion: 0.14
Nodes (27): DatabaseErdCanvas, ExtractedEntity, LiveRunnerWorkbench, MonacoEditor, OneSpecEngineeringWorkbench(), GapAuditorWorkbench(), BpmnNodeClickEvent, CamundaBpmnViewer() (+19 more)

### Community 1 - "sdlc.ts"
Cohesion: 0.05
Nodes (39): AutoRobotFieldValue, BpmnActorType, BpmnEdge, BpmnNode, BpmnNodeProperties, BpmnNodeType, BpmnProcessModel, BpmnSwimlane (+31 more)

### Community 2 - "triModalDiscoveryService.ts"
Cohesion: 0.24
Nodes (9): DEFAULT_GIT_REFS, StagingDiscoveryWithAuthConfig, TriModalDiscoveryToolbarProps, AutoDiscoveryMode, BlindCrawlAuthType, GitDiscoveryConfig, GitProvider, LocalDiscoveryConfig (+1 more)

### Community 3 - "devDependencies"
Cohesion: 0.08
Nodes (24): devDependencies, autoprefixer@^10.6.2, concurrently@^10.0.6, playwright@^1.64.1, postcss@^8.5.32, prisma@6.19.3, tailwindcss@^4.3.3, @tailwindcss/postcss@^4.3.4 (+16 more)

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

### Community 12 - "featureModuleScreenshotSanitizer.ts"
Cohesion: 0.60
Nodes (4): buildBlueprintForSurface(), isFilterControl(), sanitizeFeatureModuleScreenshots(), ScreenshotBlankCheck

### Community 13 - "OneSpec SDLC Studio"
Cohesion: 0.06
Nodes (29): 1. UI ARCHITECTURE LOCK (NEVER REVERT TO LEGACY UI), 2. NEXT.JS 16 (TURBOPACK) & REACT 19 SYNTAX INTEGRITY (ZERO WHITE SCREEN), 3. TYPESCRIPT & RUNTIME SAFETY (ZERO TDZ & ZERO PLACEHOLDERS), 4. PROTECTED CORE SERVICES (`src/services/`), ONESPEC SDLC STUDIO — STRICT ENTERPRISE AI GUARDRAILS (ANTIGRAVITY RULES), 1. UI ARCHITECTURE LOCK (NEVER REVERT TO LEGACY UI), 2. NEXT.JS 16 (TURBOPACK) & REACT 19 SYNTAX INTEGRITY (ZERO WHITE SCREEN), 3. TYPESCRIPT & RUNTIME SAFETY (ZERO TDZ & ZERO PLACEHOLDERS) (+21 more)

### Community 14 - "bpmn-js.d.ts"
Cohesion: 0.50
Nodes (3): bpmn-js, bpmn-js/dist/bpmn-modeler.production.min.js, bpmn-js/dist/bpmn-navigated-viewer.production.min.js

### Community 15 - "dependencies"
Cohesion: 0.09
Nodes (22): dependencies, clsx@^2.1.1, cross-env@^10.1.0, lucide-react@^1.66.0, @monaco-editor/react@^4.7.0, next@^16.4.4, @prisma/client@^6.19.3, rea-agents@^6.8.0 (+14 more)

### Community 16 - "DiscoveredApiEndpoint"
Cohesion: 0.15
Nodes (30): DastProbeRequestBody, ReverseDfdWorkbenchProps, ComplianceBinderWorkbenchProps, IsoRiskAuditWorkbenchProps, DelphiConsensusWorkbenchProps, SmtFormalVerifierWorkbenchProps, OwaspDastWorkbenchProps, ArchitectureDeconstructionInput (+22 more)

### Community 17 - "SingleProductDeepReader.tsx"
Cohesion: 0.20
Nodes (15): VerifiedArchitectureMapCanvas(), EnterpriseLibraryPortal(), normalizeManualImgSrc(), ReaderSectionId, SimulatedResponseState, SingleProductDeepReader(), EnvironmentLabel, CrossSystemDependencyNode (+7 more)

### Community 18 - "owaspDastService.ts"
Cohesion: 0.25
Nodes (5): OwaspApiCategory, owaspDastService, OwaspVulnerabilityFinding, SecurityHeaderAudit, VulnerabilitySeverity

### Community 19 - "elkjs"
Cohesion: 0.50
Nodes (3): elkjs@^0.12.1, elkjs, elkjs/lib/elk.bundled.js

### Community 20 - "playwright"
Cohesion: 0.40
Nodes (3): playwright, { chromium }, path

### Community 21 - "steps"
Cohesion: 0.09
Nodes (22): name, runs-on, steps, timeout-minutes, concurrency, cancel-in-progress, group, jobs (+14 more)

### Community 22 - "architectureDeconstructor.ts"
Cohesion: 0.14
Nodes (16): computeConnectorGeometry(), EDGE_COLORS, ROLE_COLORS, VerifiedArchitectureMapCanvasProps, ArchEdgeVariant, ArchFocusViewId, ArchitectureDeltaReceipt, ArchitectureLayoutGateResult (+8 more)

### Community 23 - "blindCrawlerService"
Cohesion: 0.07
Nodes (9): blindCrawlerService, InteractiveSessionState, blindCrawlerService, InteractiveSessionState, BlindCrawlDiscoveredForm, BlindCrawlResult, CrawledModuleSummary, FeatureModuleSurface (+1 more)

### Community 27 - "index.ts"
Cohesion: 0.25
Nodes (10): verify(), globalForPrisma, prisma, bootstrap(), createApp(), discoveryRoutes(), reaRoutes(), CACHE_FILE_PATH (+2 more)

### Community 29 - "ci-gate/route.ts"
Cohesion: 0.16
Nodes (5): automationBundleExportService, rbacDifferentialMatrixService, RbacDifferentialReport, RbacDifferentialRow, RbacPersonaDefinition

### Community 30 - "deepBundleUnpackerService.ts"
Cohesion: 0.17
Nodes (7): deepBundleUnpackerService, DeepUnpackParams, LeakedSecretItem, ReconstructedSourceFile, SecretSeverity, SecretType, ShadowEndpointItem

### Community 31 - ".onespec-crawler-backup-2026-11-13T11-43-28-062Z/src/services/blindCrawlerService.ts"
Cohesion: 0.10
Nodes (17): CapturedNetworkRequest, globalForBlindCrawler, HarvestedLoginDropdown, HarvestedLoginInput, HarvestedLoginSubmit, HarvestedLoginTab, LoginSurfaceSnapshot, ModuleRuntimeError (+9 more)

### Community 32 - "src/services/iso26514UserManualService.ts"
Cohesion: 0.14
Nodes (9): Iso26514BusinessRuleItem, Iso26514ButtonEntry, Iso26514DomainGlossaryItem, Iso26514FaqItem, Iso26514FilterEntry, Iso26514SopItem, Iso26514StateTransitionItem, Iso26514UiInteractionItem (+1 more)

### Community 35 - "modernDocumentExporter.ts"
Cohesion: 0.07
Nodes (26): sharp, diff, state, blankSvg(), clientVerdict(), main(), moduleSurface, toDataUrl() (+18 more)

### Community 36 - "src/services/blindCrawlerService.ts"
Cohesion: 0.12
Nodes (15): EnvironmentDetectionResult, CapturedNetworkRequest, globalForBlindCrawler, HarvestedLoginDropdown, HarvestedLoginInput, HarvestedLoginSubmit, HarvestedLoginTab, ModuleRuntimeError (+7 more)

### Community 37 - "workspaceVaultService.ts"
Cohesion: 0.08
Nodes (18): newSnapshot, oldSnapshot, privateService, state, maxDuration, POST(), maxDuration, POST() (+10 more)

### Community 38 - "presentationSanitizer.ts"
Cohesion: 0.24
Nodes (9): formatDateOnly(), formatRelativeTime(), getEnvironmentLabel(), isPrivateHost(), maskTargetUrl(), PresentationLocale, RAW_PROMPT_MARKERS, redactSensitiveText() (+1 more)

### Community 40 - "deep-harvest-cli.mjs"
Cohesion: 0.24
Nodes (8): authStatePath, cachePath, captureCdpShot(), indexPath, rootDir, runUnlimitedHarvest(), inspectSingleRoute(), vaultDir

### Community 42 - "SingleProductDeepReader.tsx"
Cohesion: 0.22
Nodes (13): EnterpriseNextGenCommandDeck(), MonacoEditor, normalizeManualImgSrc(), UniversalKnowledgeGraphWorkbench(), ModuleScreenshot(), ModuleScreenshotProps, isBlankOrMissingScreenshot(), cacheKey() (+5 more)

### Community 45 - "architectureDeconstructor.ts"
Cohesion: 0.14
Nodes (13): ArchitecturalFitnessFunctionItem, ArchitectureDecisionRecordItem, ArchitectureLayerBreakdownItem, ArchitectureTier, HighLevelArchitecture, IntegrationContractErrorResponse, IntegrationContractHeader, IntegrationContractParam (+5 more)

### Community 48 - "reaBridge.ts"
Cohesion: 0.18
Nodes (10): ReaApplicationAnalysis, ReaCliOptions, ReaDomSelector, ReaExecutionVerdict, ReaExtractedBackendRule, ReaRouteDeclaration, ReaTableColumn, ReaTableDefinition (+2 more)

### Community 50 - "src/services/productKnowledgeAndMonitoringService.ts"
Cohesion: 0.10
Nodes (31): blueprint, board, briefing, diff, invoiceModule, loginModule, manual, state (+23 more)

### Community 51 - "capture-step4.js"
Cohesion: 0.40
Nodes (3): { chromium }, fs, path

### Community 52 - "triModalDiscoveryService"
Cohesion: 0.38
Nodes (3): synthesizeFullSdlcFromCrawl(), triModalDiscoveryService, StagingDiscoveryConfig

### Community 53 - "test-master-deep-engine.ts"
Cohesion: 0.53
Nodes (4): main(), testDomainLogicBrainAndWhiteBoxScenarios(), testReaBridgeAstExtractor(), testUserManualSection7()

### Community 54 - "sdlcCompiler.ts"
Cohesion: 0.05
Nodes (81): dynamic, maxDuration, RunnerExecuteRequestBody, DomTraceabilityMapProps, EnterpriseNextGenCommandDeckProps, UniversalKnowledgeGraphWorkbenchProps, ProductKnowledgeMonitorHubProps, SingleProductDeepReaderProps (+73 more)

### Community 55 - "SavedProjectRecord"
Cohesion: 0.29
Nodes (3): EnterpriseLibraryPortalProps, enterpriseLibraryPortalService, SavedProjectRecord

### Community 56 - "next"
Cohesion: 0.11
Nodes (19): nextConfig, @monaco-editor/react, next, ArchitectureDeconstructorWorkbench(), ArchitectureDeconstructorWorkbenchProps, MonacoEditor, VerifiedSequenceDiagramCanvas(), GapAuditorWorkbenchProps (+11 more)

### Community 57 - "export-all-bundle/route.ts"
Cohesion: 0.43
Nodes (6): dynamic, GET(), handleExportBundle(), maxDuration, POST(), resolveStateAndProject()

### Community 59 - "discoveryRoutes.ts"
Cohesion: 0.13
Nodes (15): fastify@^5.12.8, zod@^4.6.7, fastify, zod, blindCrawlSchema, gitConnectSchema, gitRefsQuerySchema, reportGenerateSchema (+7 more)

### Community 61 - "ReverseDfdWorkbench.tsx"
Cohesion: 0.26
Nodes (11): MonacoEditor, ReverseDfdWorkbench(), VerifiedDfdDiagramCanvas(), VerifiedDfdDiagramCanvasProps, DfdDataFlow, DfdLevel, DfdModelLevel, DfdNode (+3 more)

### Community 63 - "generateCanonicalBpmn2Xml"
Cohesion: 0.50
Nodes (4): BpmnDiscoveredModuleFlow, BpmnGeneratorInput, escapeXml(), generateCanonicalBpmn2Xml()

### Community 64 - "bpmn-js"
Cohesion: 0.67
Nodes (3): bpmn-js@^18.31.1, bpmn-js, initBpmnViewer()

### Community 65 - "react"
Cohesion: 0.15
Nodes (10): lucide-react, react, ApiContractExplorer(), ApiContractExplorerProps, ApiReferenceReact, DatabaseErdCanvasProps, nodeTypes, ContractWireframeProps (+2 more)

### Community 66 - "src/lib/xlsxWriter.ts"
Cohesion: 0.18
Nodes (16): buildXlsxWorkbook(), cellXml(), columnLetter(), crc32(), CRC_TABLE, createZip(), encoder, escapeXml() (+8 more)

### Community 67 - "ref_node_fs"
Cohesion: 0.28
Nodes (4): createFallbackSvg(), dynamic, GET(), MIME_TYPES

### Community 68 - "DelphiConsensusWorkbench.tsx"
Cohesion: 0.32
Nodes (5): DebateStance, DelphiDebateEntry, DelphiPersona, DelphiRound, PersonaSignOffSeal

### Community 70 - "IsoRiskAuditWorkbench.tsx"
Cohesion: 0.39
Nodes (6): IsoRiskItem, MerkleTreeVault, RiskImpact, RiskLikelihood, RiskSeverityLevel, Soc2TrustControl

### Community 71 - "ci-gate/route.ts"
Cohesion: 0.60
Nodes (5): CiGateEvaluationResult, evaluateCiGates(), GET(), POST(), resolveTargetState()

### Community 72 - "i18n.tsx"
Cohesion: 0.20
Nodes (9): metadata, RootLayout(), EN_COPY, ID_COPY, StudioCopy, StudioLocale, StudioLocaleContext, StudioLocaleContextValue (+1 more)

### Community 74 - "VerifiedSequenceDiagramCanvas.tsx"
Cohesion: 0.67
Nodes (3): SequenceStepItem, VerifiedSequenceDiagramCanvasProps, LowLevelComponentTrace

### Community 82 - "deepSpaHarvester.ts"
Cohesion: 0.29
Nodes (8): AUTH_STATE_PATH, captureInstantCdpScreenshot(), normalizeRoutePath(), runDeepSpaHarvester(), waitForSpaDataReady(), BlindCrawlConfig, DatabaseErdColumn, FeatureSurfaceAnomaly

### Community 84 - "buildFeatureModuleBlueprintSvgDataUrl"
Cohesion: 0.36
Nodes (11): BlueprintButtonEntry, BlueprintFilterEntry, BlueprintModuleInput, buildFeatureModuleBlueprintSvgDataUrl(), clamp(), clip(), escapeXml(), placeControls() (+3 more)

### Community 94 - "ProductKnowledgeMonitorHub.tsx"
Cohesion: 0.40
Nodes (5): IssueStatus, ProductKnowledgeMonitorHub(), StatusBadge(), statusTone, TabId

### Community 99 - "package.json"
Cohesion: 0.12
Nodes (16): author, docx@^9.15.3, @fastify/sensible@^6.0.7, react-dom@^19.3.1, react-resizable-panels@^2.1.9, description, keywords, license (+8 more)

### Community 104 - "verify-master-functional-upgrade.js"
Cohesion: 0.40
Nodes (3): { chromium }, fs, path

## Knowledge Gaps
- **30 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `page.tsx`, `dependencies`, `DiscoveredApiEndpoint`, `owaspDastService.ts`, `ref_fs`, `ci-gate/route.ts`, `modernDocumentExporter.ts`, `workspaceVaultService.ts`, `sdlcCompiler.ts`, `SavedProjectRecord`, `export-all-bundle/route.ts`, `interactive-session/route.ts`, `ReverseDfdWorkbench.tsx`, `react`, `ref_node_fs`, `DelphiConsensusWorkbench.tsx`, `IsoRiskAuditWorkbench.tsx`, `ci-gate/route.ts`, `i18n.tsx`, `blind-crawl/route.ts`, `package.json`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `DatabaseErdTable` (e.g. with `8. 7-Layer Deep SPA Harvester 2.0 & Cross-Subdomain Engine` and `4. 7-Layer Deep SPA Harvester 2.0`) actually correct?**
  _`DatabaseErdTable` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.13911290322580644 - nodes in this community are weakly interconnected._
- **Why does `DatabaseErdTable` connect `DiscoveredApiEndpoint` to `page.tsx`, `sdlc.ts`, `triModalDiscoveryService.ts`, `ARCHITECTURE_AND_SDLC_SPEC.md — OneSpec SDLC Workbench`, `OneSpec SDLC Studio`, `owaspDastService.ts`, `.onespec-crawler-backup-2026-11-13T11-43-28-062Z/src/services/blindCrawlerService.ts`, `src/services/iso26514UserManualService.ts`, `src/services/blindCrawlerService.ts`, `SingleProductDeepReader.tsx`, `architectureDeconstructor.ts`, `triModalDiscoveryService`, `test-master-deep-engine.ts`, `sdlcCompiler.ts`, `next`, `ReverseDfdWorkbench.tsx`, `react`, `DelphiConsensusWorkbench.tsx`, `IsoRiskAuditWorkbench.tsx`, `deepSpaHarvester.ts`, `domainLogicBrainService`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **Should `sdlc.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Why does `playwright` connect `playwright` to `devDependencies`, `capture-step6.js`, `capture-step7.js`, `.onespec-crawler-backup-2026-11-13T11-43-28-062Z/src/services/blindCrawlerService.ts`, `test-cmdk.js`, `test-explorer.js`, `modernDocumentExporter.ts`, `src/services/blindCrawlerService.ts`, `deep-harvest-cli.mjs`, `capture-step4.js`, `sdlcCompiler.ts`, `verify-master-upgrade-final.js`, `deepSpaHarvester.ts`, `package.json`, `verify-master-functional-upgrade.js`, `capture-step5.js`, `test-blind-crawl-live.js`, `test-terminal.js`, `verify-all-steps-crawled.js`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.08333333333333333 - nodes in this community are weakly interconnected._