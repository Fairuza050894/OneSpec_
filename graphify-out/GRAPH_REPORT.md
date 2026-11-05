# Graph Report - OneSpec SDLC Studio  (2026-11-06)

## Corpus Check
- 51 files · ~57,484 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: .example 1, (none) 1, .prisma 1)

## Summary
- 438 nodes · 806 edges · 42 communities (24 shown, 18 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- page.tsx
- sdlc.ts
- index.ts
- devDependencies
- compilerOptions
- triModalDiscoveryService.ts
- scripts
- ARCHITECTURE_AND_SDLC_SPEC.md — OneSpec SDLC Workbench
- Bagian 3: Urutan Prompt Step-by-Step untuk AI Perusahaan Anda
- ReaBridgeService
- DESIGN.md — OneSpec SDLC Workbench Visual & Architecture Specification
- LiveRunnerWorkbench.tsx
- AGENTS.md
- bpmn-js.d.ts
- dependencies
- package.json
- verify-master-functional-upgrade.js
- next
- elkjs
- ref_path
- bpmn-js
- playwright
- blindCrawlerService.ts
- capture-step4.js
- capture-step6.js
- capture-step7.js
- rea-agents@^6.8.0
- sdlcCompiler.ts
- LiveRunnerWorkbench.tsx
- test-blind-crawl-live.js
- @monaco-editor/react
- test-cmdk.js
- test-explorer.js
- test-terminal.js
- verify-all-steps-crawled.js
- verify-master-upgrade-final.js
- @fastify/sensible
- @fastify/cors
- @prisma/client
- prisma@6.19.3

## God Nodes (most connected - your core abstractions)
1. `OneSpecEngineeringWorkbench()` - 16 edges
2. `compilerOptions` - 16 edges
3. `playwright` - 15 edges
4. `automationSynthesizerService` - 14 edges
5. `triModalDiscoveryService` - 14 edges
6. `TriModalDiscoveryResult` - 13 edges
7. `scripts` - 12 edges
8. `lucide-react` - 12 edges
9. `react` - 12 edges
10. `DiscoveredApiEndpoint` - 12 edges

## Surprising Connections (you probably didn't know these)
- `verify()` --calls--> `createApp()`  [EXTRACTED]
  scripts/verify-foundation.ts → src/server/index.ts
- `DatabaseErdCanvasProps` --references--> `DatabaseErdTable`  [EXTRACTED]
  src/components/discovery/DatabaseErdCanvas.tsx → src/types/sdlc.ts
- `ApiContractExplorerProps` --references--> `DiscoveredApiEndpoint`  [EXTRACTED]
  src/components/discovery/ApiContractExplorer.tsx → src/types/sdlc.ts
- `DomTraceabilityMapProps` --references--> `DomTraceabilityBinding`  [EXTRACTED]
  src/components/discovery/DomTraceabilityMap.tsx → src/types/sdlc.ts
- `RtmSpreadsheetGridProps` --references--> `SynthesizedRtmRow`  [EXTRACTED]
  src/components/rtm/RtmSpreadsheetGrid.tsx → src/services/rtmSynthesizer.ts

## Import Cycles
- None detected.

## Communities (42 total, 18 thin omitted)

### Community 0 - "page.tsx"
Cohesion: 0.08
Nodes (38): lucide-react, react, DatabaseErdCanvas, ExtractedEntity, LiveRunnerWorkbench, MonacoEditor, OneSpecEngineeringWorkbench(), GapAuditorWorkbench() (+30 more)

### Community 1 - "sdlc.ts"
Cohesion: 0.06
Nodes (35): BlindCrawlAuthType, BlindCrawlDiscoveredForm, BpmnActorType, BpmnEdge, BpmnNode, BpmnNodeProperties, BpmnNodeType, BpmnProcessModel (+27 more)

### Community 2 - "index.ts"
Cohesion: 0.06
Nodes (34): fastify@^5.12.8, zod@^4.6.7, fastify, zod, verify(), globalForPrisma, prisma, bootstrap() (+26 more)

### Community 3 - "devDependencies"
Cohesion: 0.09
Nodes (22): devDependencies, autoprefixer@^10.6.2, concurrently@^10.0.6, playwright@^1.64.1, postcss@^8.5.32, tailwindcss@^4.3.3, @tailwindcss/postcss@^4.3.4, tsx@^4.23.15 (+14 more)

### Community 4 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 5 - "triModalDiscoveryService.ts"
Cohesion: 0.22
Nodes (12): ApiContractExplorerProps, DEFAULT_GIT_REFS, TriModalDiscoveryToolbarProps, triModalDiscoveryService, AutoDiscoveryMode, DatabaseErdTable, DiscoveredApiEndpoint, GitDiscoveryConfig (+4 more)

### Community 6 - "scripts"
Cohesion: 0.17
Nodes (12): scripts, build, dev, dev:next, dev:server, prisma:generate, prisma:push, start (+4 more)

### Community 7 - "ARCHITECTURE_AND_SDLC_SPEC.md — OneSpec SDLC Workbench"
Cohesion: 0.18
Nodes (10): 1. Executive Summary & Single-Manpower Problem Statement, 2. Two-Phase SDLC Data Flow Architecture, 3. Tri-Modal Auto-Discovery Architecture (Answering the Greenfield Challenge), 4. Camunda-Style BPMN 2.0 Specification (Step 3 Revision), 5. REA Live Runner Diagram Streaming & Bottleneck Detection (Step 7), 6. Full Parity with Standalone Automation Tools, ARCHITECTURE_AND_SDLC_SPEC.md — OneSpec SDLC Workbench, Mode A: Direct Git Repository Connect (`git_repo`) (+2 more)

### Community 8 - "Bagian 3: Urutan Prompt Step-by-Step untuk AI Perusahaan Anda"
Cohesion: 0.18
Nodes (10): AGENTS_MASTER_PROMPT.md — Rulebook & Step-by-Step Prompts for Company AI Coding Agent, Bagian 1: Persiapan Environment Lokal (Jalankan Sekali di Terminal), Bagian 2: Isi Blok `AGENTS.md` / `CLAUDE.md` (Otomatis Dibaca AI Perusahaan), Bagian 3: Urutan Prompt Step-by-Step untuk AI Perusahaan Anda, PROMPT TAHAP 1: Inisialisasi Monorepo, Skema Data ISO, dan Koneksi `morluto/rea`, PROMPT TAHAP 2: Membangun Engine Fase 1 (MoM ➔ BRD, PRD & Matrix RTM ISO 29119), PROMPT TAHAP 3: Membangun Camunda-Style BPMN 2.0 Modeler & Stateful Wireframe (Langkah 3), PROMPT TAHAP 4: Membangun Tri-Modal Auto-Discovery (`morluto/rea`) untuk Git, Lokal & Staging (Langkah 5) (+2 more)

### Community 10 - "DESIGN.md — OneSpec SDLC Workbench Visual & Architecture Specification"
Cohesion: 0.25
Nodes (7): 1. Product Identity & Design Philosophy, 2. Layout Geometry & Window Discipline (`100vh x 100vw`), 3. Surface & Color Palette Tokens (Dark Linear / Geist), 4. Typography & Numeric Precision, 5. Strict Anti-Slop Prohibitions (`R-01` to `R-40`), Dark Linear / Vercel Geist Desktop Engineering Workbench, DESIGN.md — OneSpec SDLC Workbench Visual & Architecture Specification

### Community 12 - "LiveRunnerWorkbench.tsx"
Cohesion: 0.17
Nodes (6): automationSynthesizerService, UnifiedReportData, FunctionalTestCaseResult, K6MetricSummary, TestSuiteExecutionTrace, UnifiedRunnerExecutionSummary

### Community 14 - "bpmn-js.d.ts"
Cohesion: 0.50
Nodes (3): bpmn-js, bpmn-js/dist/bpmn-modeler.production.min.js, bpmn-js/dist/bpmn-navigated-viewer.production.min.js

### Community 15 - "dependencies"
Cohesion: 0.11
Nodes (19): dependencies, cmdk@^1.1.1, cross-env@^10.1.0, @fastify/websocket@^11.3.6, lucide-react@^1.66.0, react@^19.3.1, react-dom@^19.3.1, react-resizable-panels@^2.1.9 (+11 more)

### Community 16 - "package.json"
Cohesion: 0.15
Nodes (12): author, clsx@^2.1.1, @scalar/api-reference-react@^0.9.87, description, keywords, license, main, name (+4 more)

### Community 17 - "verify-master-functional-upgrade.js"
Cohesion: 0.33
Nodes (3): { chromium }, fs, path

### Community 18 - "next"
Cohesion: 0.25
Nodes (4): nextConfig, next@^16.4.4, next, metadata

### Community 19 - "elkjs"
Cohesion: 0.50
Nodes (3): elkjs@^0.12.1, elkjs, elkjs/lib/elk.bundled.js

### Community 21 - "bpmn-js"
Cohesion: 0.67
Nodes (3): bpmn-js@^18.31.1, bpmn-js, initBpmnViewer()

### Community 22 - "playwright"
Cohesion: 0.40
Nodes (3): playwright, { chromium }, path

### Community 23 - "blindCrawlerService.ts"
Cohesion: 0.26
Nodes (4): blindCrawlerService, BpmnGeneratorInput, BlindCrawlConfig, BlindCrawlResult

### Community 24 - "capture-step4.js"
Cohesion: 0.40
Nodes (3): { chromium }, fs, path

### Community 29 - "sdlcCompiler.ts"
Cohesion: 0.25
Nodes (10): GapAuditorWorkbenchProps, ContractWireframeProps, gapAuditorService, CompiledSdlcState, AuditDiscrepancyItem, BrdMatrixRow, DefectTicketPayload, GapAuditSummary (+2 more)

### Community 30 - "LiveRunnerWorkbench.tsx"
Cohesion: 0.24
Nodes (8): LiveRunnerWorkbench(), LiveRunnerWorkbenchProps, MonacoEditor, nodeTypes, PipelineStageNodeData, ExecutionPipelineStage, PipelineStageType, StagePerformanceStatus

### Community 32 - "@monaco-editor/react"
Cohesion: 0.67
Nodes (3): @monaco-editor/react@^4.7.0, @monaco-editor/react, MonacoDiffEditor

## Knowledge Gaps
- **18 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `playwright` connect `playwright` to `test-cmdk.js`, `test-explorer.js`, `devDependencies`, `test-terminal.js`, `verify-all-steps-crawled.js`, `verify-master-upgrade-final.js`, `package.json`, `verify-master-functional-upgrade.js`, `ref_path`, `blindCrawlerService.ts`, `capture-step4.js`, `capture-step6.js`, `capture-step7.js`, `test-blind-crawl-live.js`?**
  _High betweenness centrality (0.190) - this node is a cross-community bridge._
- **Should `page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08392156862745098 - nodes in this community are weakly interconnected._
- **Why does `next` connect `next` to `package.json`, `page.tsx`, `sdlcCompiler.ts`, `LiveRunnerWorkbench.tsx`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Should `sdlc.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05555555555555555 - nodes in this community are weakly interconnected._
- **Why does `scripts` connect `scripts` to `package.json`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **Should `index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05952380952380952 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._