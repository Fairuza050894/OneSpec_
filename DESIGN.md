# DESIGN.md — OneSpec SDLC Workbench Visual & Architecture Specification
## Dark Linear / Vercel Geist Desktop Engineering Workbench

> **Governance Notice:** This document is the authoritative visual, layout, and editorial specification strictly enforcing [`miqdadbadjuber/anti-slop`](https://github.com/miqdadbadjuber/anti-slop) (`R-01` through `R-40`) and the **Linear / Vercel Geist Desktop Engineering Workbench** paradigm from [`VoltAgent/awesome-design-md`](https://github.com/VoltAgent/awesome-design-md). Every UI component, stylesheet, and layout in this repository must comply with this file.

---

## 1. Product Identity & Design Philosophy

- **Product Name:** OneSpec SDLC Workbench
- **Archetype:** High-Density Desktop Engineering Workbench (comparable in precision and density to **Linear**, **VS Code / Cursor**, **Vercel Dashboard**, **Camunda Modeler**, and **Chrome DevTools**).
- **Target User:** Solo Technical Writer, Business Analyst, and Full-Cycle QA Automation Engineer operating under strict ISO/IEC audit regimes.
- **Aesthetic Core:** **Dark Swiss Engineering Minimalist.** Zero marketing clutter, zero decorative illustrations, zero gradient slop. Every single pixel serves requirement traceability, process control flow, AST introspection, or test telemetry.

---

## 2. Layout Geometry & Window Discipline (`100vh x 100vw`)

The application is a true locked-viewport desktop workbench:
- **Root Container:** Fixed `100vw` by `100vh`, `overflow: hidden`, zero window scrolling.
- **Top Header Bar:** Exact `36px` fixed height, `1px solid #22262E` bottom hairline border. Contains workspace switcher, Phase badge (`PHASE 1: PRE-DEV` | `PHASE 2: STAGING & REA`), SDLC Step Segmented Control (`Steps 1–7`), and `Cmd+K` shortcut trigger.
- **3-Pane Split Layout (`react-resizable-panels`):**
  - **Left Pane (`18%` default, min `14%`, max `24%`):** High-density File & Artifact Explorer Tree (`26px` row height) listing StRS rules, SyRS user stories, BPMN processes, RTM test cases, and discovered routes.
  - **Center Pane (`54%` default):** Multi-tab document and canvas work area with `1px solid #22262E` borders and `0px` outer margins.
  - **Right Pane (`28%` default):** Contextual Inspector, Field Validation Editor, and `morluto/rea` Live Trace Inspector.
  - **Bottom Collapsible Drawer:** Execution terminal, AST output stream, and Playwright runner logs.
- **Keyboard Navigation:** Native `cmdk` Command Palette (`Cmd+K` / `Ctrl+K`) for jumping across Steps 1–7, switching project modes, and triggering test runs.

---

## 3. Surface & Color Palette Tokens (Dark Linear / Geist)

All surfaces are flat, high-contrast structural planes separated by hairline dividers:

| Token Name | Hex Value | Scope & Function | WCAG Contrast |
| :--- | :--- | :--- | :--- |
| `--surface-canvas` | `#0B0C0E` | App viewport background & gutter | Base |
| `--surface-panel` | `#111317` | Document work area, explorer tree, editor surfaces | Base plane |
| `--surface-elevated` | `#16191F` | Header bar, active tabs, floating cmdk dialog | Structural |
| `--surface-terminal` | `#0E1015` | REA traces, Gherkin code blocks, test execution logs | Code surface |
| `--border-hairline` | `#22262E` | `1px solid` splitters, table grids, panel boundaries | Hairline structural |
| `--border-focus` | `#3B82F6` | Keyboard `:focus-visible` ring and active selection | Focus indicator |
| `--text-primary` | `#EDEDED` | Prose requirements, active tab titles, primary values | `14.8:1` (WCAG AAA) |
| `--text-secondary` | `#A1A1A1` | Attribute labels, lane headers, metadata annotations | `7.2:1` (WCAG AAA) |
| `--text-muted` | `#707070` | Timestamps, unselected tree nodes, secondary hints | `4.6:1` (WCAG AA) |
| `--accent-action` | `#2563EB` | Primary trigger, active step pill, selected entity | `5.6:1` (with `#EDEDED`) |
| `--status-conformant` | `#059669` | ISO conformant rules, HTTP 2xx, passed test assertions | `6.2:1` (with `#0B0C0E`) |
| `--status-warning` | `#D97706` | BPMN XOR Gateways, boundary value tests, pending audits | `5.4:1` (with `#0B0C0E`) |
| `--status-defect` | `#DC2626` | Non-conformant gaps, HTTP 4xx/5xx, latency bottlenecks | `5.8:1` (with `#0B0C0E`) |

---

## 4. Typography & Numeric Precision

- **Prose & UI Font:** `Inter`, `Geist Sans`, or system `-apple-system, BlinkMacSystemFont, sans-serif`
  - Header & Section Titles: `11px`–`12px`, `font-weight: 600`, `letter-spacing: 0.04em`, uppercase for section metadata.
  - Body & Form Labels: `12px`–`13px`, `font-weight: 400`, `line-height: 1.45`.
- **Monospace Code & Telemetry Font:** `JetBrains Mono`, `Geist Mono`, or `Menlo, monospace` (`12px`)
  - Mandatory for all Requirement IDs (`BR-01`, `REQ-US-01`, `TC-VCH-001`), DOM selectors, HTTP methods, SQL types, and millisecond latencies.
  - **Tabular Numerics:** All numeric telemetry columns MUST enforce `font-variant-numeric: tabular-nums`.

---

## 5. Strict Anti-Slop Prohibitions (`R-01` to `R-40`)

1. **NO AI Gradient Slop (`R-01`):** Blue-to-purple, violet-to-pink, and radial glow backdrops are strictly **BANNED**. Surfaces must remain flat `#111317` and `#0B0C0E`.
2. **NO Exaggerated Border Radii (`R-11`):**
   - Layout panels, pane splitters, and main containers: `0px` (`rounded-none`).
   - Buttons, inputs, and interactive controls: max `4px` (`rounded-sm`).
   - Status badges and monospace tags: `2px` (`rounded-[2px]`).
   - `rounded-xl`, `rounded-2xl`, `rounded-3xl`, and pill cards are **STRICTLY PROHIBITED**.
3. **NO Decorative Cards or Marketing Fluff (`R-24`, `R-40`):**
   - No welcome cards, hero banners, decorative avatar circles, or stat widgets with fake percentages.
   - Every metric must originate from active AST scans, database queries, or Playwright traces.
4. **NO Dead Controls (`R-24`):** Every button, split pane handle, keyboard shortcut, and filter must execute a real state change.
5. **NO Conversational Slop (`antislop-copywriting`):** Never output *"Here is your generated spec"*, *"AI magic"*, or sparkle emojis. Use formal ISO/IEC/IEEE 29148, ISO 19510, and ISO 29119 terminology.

---

## 6. Modern Studio 4-Phase Workbench Navigation & Step Hierarchy

The root layout in `src/app/page.tsx` strictly adheres to the 4-Phase 12-Step Modern Workbench architecture:

### 6.1 Top Header Bar (`36px` Fixed Height)
- **Left:** Brand badge `1S OneSpec` with semantic status dot (`#10B981` online).
- **Workspace Switcher:** Custom select dropdown bound to `/api/sdlc/vault` workspaces, plus `+` New Project quick button.
- **Primary View Switcher:** Segmented toggle between `Studio` (active workbench) and `ISO Library` (centralized project catalog with count badge).
- **4-Phase Fast Jump Controls:**
  - `P1: Pre-Dev` (Steps 01–04)
  - `P2: Staging` (Steps 05–07)
  - `P3: GRC` (Steps 08–09)
  - `P4: Formal` (Steps 10–12)
- **Utility Controls:** `Seed Data` button, Bilingual language switcher (`EN | ID`), and `Cmd+K` Command Palette shortcut.

### 6.2 Left Navigation Sidebar (12 Steps Grouped in 4 Phases)
- **PHASE 1: PRE-DEVELOPMENT:**
  - `01. Project Source & Ingestion Hub` (`Globe / Ingestion`)
  - `02. Architecture & BPMN / DFD` (`GitBranch / Flow`)
  - `03. Normative Specs (ISO 29148)` (`FileText / Requirements`)
  - `04. QA Workbook & Traceability` (`CheckSquare / Matrix`)
- **PHASE 2: STAGING & AUTOMATION:**
  - `05. Quad-Modal Auto-Discovery` (`Compass / Deep Harvester`)
  - `06. Spec-to-Code Gap Audit` (`AlertTriangle / Conformance`)
  - `07. Live Runner & Bottlenecks` (`Zap / Telemetry`)
- **PHASE 3: GRC & SECURITY:**
  - `08. GRC, Risk & Merkle Vault` (`Shield / Tamper-Evident Vault`)
  - `09. OWASP API Top 10 DAST` (`Lock / Security Scanner`)
- **PHASE 4: FORMAL ASSURANCE:**
  - `10. SMT Z3 Formal Proofs` (`Cpu / Theorem Prover`)
  - `11. Delphi ARB Consensus` (`Users / Architecture Board`)
  - `12. Executive Summary & Graph` (`BarChart2 / Multi-Artifact Export`)

---

## 7. Step 01 Ingestion Hub & Quick Export Toolbar Specifications

### 7.1 Step 01: Project Source & Ingestion Hub
- **4 Ingestion Source Tabs:**
  1. `1. Live Web URL` (Active Crawl & Guided Browser)
  2. `2. Git Repo (AST)` (Remote branch code analysis)
  3. `3. .ZIP / Local Folder` (Direct folder/archive ingestion)
  4. `4. Stakeholder Notes (MoM)` (Meeting notes compiler)
- **Live URL Surface Scanner Panel:**
  - Input field for target domain (`https://...`) and `Scan Target URL` action.
  - **Zero Credential Concealment Guarantee:** Username (`text`), Password (`password`), and Access Type (`Pancaran` / `Eksternal`) inputs MUST ALWAYS remain visible and directly editable. They must never be concealed behind a "public page detected" badge.
  - **Dual Execution Action Cards:**
    - `MODE A · Autonomous Discovery`: Direct one-click trigger for `Run Autonomous Crawl`.
    - `MODE B · Guided Browser Session`: Direct trigger for `Launch Guided Browser` with `Complete Guided Harvest` when active.

### 7.2 Quick Export Toolbar (`QuickExportToolbar.tsx`)
Embedded directly in Step 04 (QA Workbook), Step 12 (Executive Summary), and the ISO Library portal:
- Direct instant downloads for:
  - `📊 Excel QA Workbook (.xlsx)` (17 sheets)
  - `📘 Word User Manual (.docx)` (ISO 26514, bilingual, 1:1 callout pins)
  - `⚡ Playwright (.spec.ts)` (`/api/sdlc/automation-bundle?format=playwright`)
  - `🚀 Postman v2.1 (.json)` (`/api/sdlc/automation-bundle?format=postman`)
  - `🛡️ RBAC Matrix (.json)` (`/api/sdlc/automation-bundle?format=rbac`)

