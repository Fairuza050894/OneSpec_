# OneSpec SDLC Studio

> **Autonomous Enterprise SDLC Engineering Workbench & ISO Compliance Platform**  
> *Built with Next.js 16 (Turbopack), React 19, TypeScript, Playwright, and Fastify.*

[![Next.js 16](https://img.shields.io/badge/Next.js-16%20Turbopack-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Playwright](https://img.shields.io/badge/Playwright-1.64-green?style=flat-square&logo=playwright)](https://playwright.dev/)
[![Fastify](https://img.shields.io/badge/Fastify-5-black?style=flat-square&logo=fastify)](https://fastify.dev/)
[![ISO 29148](https://img.shields.io/badge/ISO%2FIEC%2FIEEE-29148-orange?style=flat-square)](https://www.iso.org/standard/45171.html)
[![ISO 19510](https://img.shields.io/badge/ISO%2FIEC-19510%20(BPMN%202.0)-red?style=flat-square)](https://www.iso.org/standard/62652.html)
[![ISO 29119](https://img.shields.io/badge/ISO%2FIEC%2FIEEE-29119-green?style=flat-square)](https://www.iso.org/standard/56736.html)
[![ISO 26514](https://img.shields.io/badge/ISO%2FIEC%2FIEEE-26514-purple?style=flat-square)](https://www.iso.org/standard/43073.html)

---

## 1. Overview & Single-Manpower Problem Statement

In enterprise environments lacking dedicated Business Analysts, Technical Writers, QA Automation Engineers, or GRC Auditors, a single technical lead must wear every hat across the entire software delivery lifecycle:

1. **Pre-Development Vacuum (Phase 1):** Early stakeholder meetings produce unstructured notes (MoM). The lead must manually draft the BRD, PRD, BPMN 2.0 flowcharts, DFD level-0/1 diagrams, and Bi-Directional RTM test matrices before any code or domain exists.
2. **Post-Development Black Box (Phase 2):** Developers deliver complex SPAs (Vue/Nuxt, React/Next), microservices, and databases without documentation. The lead must reverse-engineer routes, API contracts, RBAC matrices, and foreign-key relationships.
3. **GRC, Security & Formal Assurance (Phases 3 & 4):** Regulated industries demand OWASP API Top 10 security audits, tamper-evident Merkle audit vaults, SMT Z3 formal logic verification, and Delphi ARB consensus sign-offs.

**OneSpec SDLC Studio** unifies all four dimensions into a local-first, zero-slop desktop engineering workbench.

---

## 2. Modern Studio Workbench Architecture (4 Phases, 12 Steps)

The top navigation provides fast switching between the active **Studio Workbench**, the centralized **ISO Library**, and the 4 phases:

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  1S OneSpec  [Project Switcher ▾] [+]   Studio | ISO Library (12) | P1: Pre-Dev | P2: Staging | P3: GRC | P4: Formal  │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

```
PHASE 1: PRE-DEVELOPMENT
  ├── 01. Project Source & Ingestion Hub
  │     ├── Mode A · Autonomous Discovery (Run Autonomous Crawl)
  │     ├── Mode B · Guided Browser Session (Launch Guided Browser)
  │     └── Ingestion Tabs: Live URL, Git Repo (AST), .ZIP / Local Folder, Stakeholder Notes (MoM)
  ├── 02. Architecture & BPMN / DFD
  │     ├── ISO/IEC 19510 BPMN 2.0 Pool & Swimlane Modeler (UI vs API/DB, XOR Gateways)
  │     └── DFD Level-0 & Level-1 Interactive Process Graph
  ├── 03. Normative Specs (ISO/IEC/IEEE 29148)
  │     ├── Business Requirements Document (BRD / StRS: BR-01..BR-n)
  │     └── System Requirements Specification (PRD / SyRS: REQ-US-01..n)
  └── 04. QA Workbook & Traceability
        ├── Bi-Directional RTM (BR-xx ➔ REQ-US-xx ➔ TC-xxx)
        └── Quick Export Toolbar (.xlsx, .docx, .spec.ts, .json, RBAC matrix)

PHASE 2: STAGING & AUTOMATION
  ├── 05. Quad-Modal Auto-Discovery (7-Layer Deep SPA Harvester 2.0)
  ├── 06. Spec-to-Code Gap Audit (PRD vs REA AST & DB Schema Conformance)
  └── 07. Live Runner & Bottlenecks (DOM ➔ Controller ➔ SQL Telemetry Stream)

PHASE 3: GRC & SECURITY
  ├── 08. GRC, Risk & Merkle Vault (Tamper-evident Audit Snapshots)
  └── 09. OWASP API Top 10 DAST (Automated BOLA, BFLA, Injection & CORS Scans)

PHASE 4: FORMAL ASSURANCE
  ├── 10. SMT Z3 Formal Proofs (State Transition & RBAC Guard Theorem Prover)
  ├── 11. Delphi ARB Consensus (Automated Architecture Review Board Scoring)
  └── 12. Executive Summary & Graph (Knowledge Graph & Multi-Artifact Export Hub)
```

---

## 3. 7-Layer Deep SPA Harvester 2.0 & Cross-Subdomain Engine

Enterprise Single Page Applications (especially Vue 2/3, Nuxt, and modern component frameworks) heavily obscure routes, authentication tokens, and backend APIs behind client-side state and multiple subdomains (e.g. `https://mobospace-sandbox.pancaran-group.co.id/` talking to `https://mobodfs-sandbox.pancaran-group.co.id/`).

OneSpec's Harvester (`src/services/deepSpaHarvester.ts`) deploys a 7-layer extraction pipeline:

1. **Cross-Subdomain XHR/Fetch Interceptor:**  
   Captures all network traffic across both target host and related backend subdomains without restrictive `/api/` filtering, recording headers, request bodies, status codes, and JSON response trees.
2. **Recursive JSON Walk (`walkJson`) & Database ERD Extraction:**  
   Recursively traverses response bodies to extract menu trees (`path`, `to`, `route`, `menu_url`, `subMenus`) and infers `DatabaseErdTable` definitions with column data types (`INTEGER`, `DECIMAL`, `TIMESTAMP`, `VARCHAR`), primary keys, and foreign keys.
3. **3-Pass Recursive Sidebar Accordion Unfolder:**  
   Locates collapsible navigation groups (`[aria-expanded="false"]`, `.el-sub-menu__title`, `.v-list-group__header`), expands them in 3 passes, and executes vertical smooth-scrolling to trigger lazy DOM rendering.
4. **Vue / Nuxt Memory Router Extraction:**  
   Directly queries `$router.getRoutes()`, `$router.options.routes`, `window.__NUXT__`, and `window.$nuxt`. Recursively resolves parent/child route hierarchies with proper path prefixing (`parentPath + '/' + childPath`).
5. **Production JavaScript Chunk Scanner:**  
   Scans `/_nuxt/*.js`, `/_next/*.js`, and `/assets/*.js` chunk files with regex heuristics to uncover hidden, unlinked, or administrative route declarations.
6. **Interactive Sidebar Non-Anchor Click Prober:**  
   For navigation items without `<a href>` attributes (using `@click` handlers), performs safe programmatic clicks, monitors URL changes and DOM headers (`h1`, `h2`), and catalogs dynamic routes.
7. **Deep Per-Module Grepping & CDP Screenshot Engine:**  
   For each discovered module, takes instant high-resolution screenshots via CDP (`Page.captureScreenshot`), extracts action buttons with coordinate pins `(xPercent, yPercent)`, interrogates form fields and dropdown options, probes sub-tabs, and triggers modals.

---

## 4. Multi-Persona RBAC Differential Matrix & Synthetic Data Factory

OneSpec automatically distinguishes authorization tiers and models differential access:

- **Personas Analyzed:**
  - `Pancaran Internal` (Full operational access, approval actions, financial views)
  - `Eksternal Partner` (Restricted partner portal, vendor vouchers, filtered data scope)
  - `Viewer / Auditor` (Read-only access, reporting, no mutation permissions)
  - `Unauthenticated` (Login surface boundary, 401/403 redirects)
- **Domain Logic Brain (`src/services/domainLogicBrainService.ts`):**  
  Classifies input fields into authentication gates (`AUTHENTICATION_RBAC_GATE`), applies `VR-AST-xx` white-box backend validation rules, and generates complete synthetic datasets:
  - Realistic Indonesian domain entities (NIK, Plat Nomor Kendaraan, NPWP, GUIDs, timestamps, currency amounts).

---

## 5. Export Engine & 100% Standalone Tool Parity

OneSpec eliminates vendor lock-in by generating industry-standard artifacts ready for immediate use in existing enterprise pipelines:

| Export Artifact | Standard / Specification | Output Format | Purpose |
| :--- | :--- | :--- | :--- |
| **Excel QA Workbook** | ISO/IEC/IEEE 29119 | `.xlsx` (17 Sheets) | Complete traceability, test cases, data dictionary, bus factor, RBAC matrix |
| **User Manual** | ISO/IEC/IEEE 26514 | `.docx` (9 Sections, Bilingual `EN`/`ID`) | Visual SOP with 1:1 callout pins, step-by-step procedures, glossary |
| **Playwright Suite** | Playwright Test Runner | `.spec.ts` | Executable E2E scenarios with auto-healing locators & assertion gates |
| **Postman Collection** | Postman v2.1 Schema | `.json` | Full API endpoint collection with environment variables & test scripts |
| **RBAC Differential Matrix** | Enterprise GRC Schema | `.json` | Matrix of modules vs personas with permission levels (CRUD + Approve) |
| **BDD Specifications** | Cucumber / Gherkin | `.feature` | User stories & scenarios in Given-When-Then syntax |
| **Audit Snapshot Vault** | Merkle Tree Audit | `.json` | SHA-256 tamper-evident SDLC project snapshot for compliance records |

The **Quick Export Toolbar** (`src/components/shared/QuickExportToolbar.tsx`) provides 1-click access to these exports directly in **Step 04**, **Step 12**, and the **ISO Library**.

---

## 6. API Endpoints

The Studio exposes clean HTTP REST endpoints for automated headless execution:

- `POST /api/sdlc/crawl`: Executes the 7-Layer Deep SPA Harvester, synthesizes full SDLC artifacts, and persists snapshots to the Workspace Vault.
- `POST /api/sdlc/discover`: Runs quad-modal discovery across Git repositories, local folders, or staging environments.
- `GET /api/sdlc/automation-bundle?format=playwright|postman|rbac`: Streams generated executable automation files.
- `GET /api/sdlc/vault`: Lists saved project workspaces, metadata, and snapshot diffs.
- `POST /api/export/document`: Generates `.xlsx`, `.docx`, or `.pdf` binary reports on demand.
- `POST /api/discovery/blind-crawl`: Probes target URLs for login forms, access types (`Pancaran` / `Eksternal`), and security headers.

---

## 7. Getting Started

### Prerequisites

- **Node.js:** v20.x or higher
- **Package Manager:** `pnpm` v10.x (recommended) or `npm`
- **Browsers:** Chromium installed via Playwright

### Installation

```bash
# Clone the repository
git clone https://github.com/Fairuza050894/OneSpec_.git
cd OneSpec_

# Install dependencies
pnpm install

# Install Playwright browser binaries
npx playwright install chromium
```

### Development Mode

Start both the Fastify backend server and Next.js Turbopack frontend concurrently:

```bash
pnpm dev
```

Or start the Next.js frontend individually:

```bash
pnpm dev:next
```

The application will be accessible at:
- **Studio Workbench:** `http://localhost:3000`
- **Fastify API Server:** `http://localhost:8080` (if running full dev suite)

---

## 8. Verification & Quality Gates

Run the automated test and verification suite to ensure zero regressions:

```bash
# TypeScript compiler check (Zero errors allowed)
pnpm test:types

# Verify 17-sheet Excel QA Workbook structure
pnpm test:workbook-sections

# Verify Workspace Vault Merkle snapshot diffing
pnpm test:vault-diff

# Verify Product Knowledge AST & documentation parity
pnpm test:product-knowledge

# Verify Screenshot Guard & CDP capture engine
pnpm test:screenshot-guard
```

---

## 9. Strict Enterprise AI Guardrails

All development and AI agent operations in this repository strictly adhere to [`AGENTS.md`](./AGENTS.md):

1. **UI Architecture Lock:** `src/app/page.tsx` MUST ALWAYS use the Modern Studio Workbench UI (`Studio | ISO Library | P1: Pre-Dev | P2: Staging | P3: GRC | P4: Formal`). Never revert to legacy `F1..F4` tabs.
2. **Form Visibility:** Username, Password, and Access Type dropdown (`Pancaran` / `Eksternal`) must ALWAYS remain visible and editable in Step 01.
3. **Anti-Blank Screen:** `'use client';` must remain on Line 1 of all client components. Zero broken JSDoc comments.
4. **Zero TDZ & Zero Placeholders:** No temporal dead zone variable access. Complete `.map()` data bindings only; raw `// TODO` or `...more gates...` are strictly prohibited.

---

## 10. License

Proprietary enterprise software. All rights reserved.
