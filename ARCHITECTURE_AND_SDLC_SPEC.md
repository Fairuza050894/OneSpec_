# ARCHITECTURE_AND_SDLC_SPEC.md — OneSpec SDLC Workbench

## 1. Executive Summary & Single-Manpower Problem Statement

In organizations operating without a dedicated technical Product Manager or technically fluent Scrum Master, a single engineer acting simultaneously as **Business Analyst (BA)**, **Technical Writer (TW)**, and **Manual/Automation QA** faces three structural bottlenecks:
1. **Pre-Development Vacuum (Phase 1):** Early stakeholder meetings produce unstructured business notes. The BA/QA must manually draft the BRD, PRD, process flowcharts, UI wireframes, and test matrices before a single line of application code or domain URL exists.
2. **Post-Development Black Box (Phase 2):** Developers deliver fragmented frontend components, backend APIs, and database tables without architectural documentation. The QA/TW is forced to manually reverse-engineer endpoints, foreign keys, and E2E flows.
3. **Tool Fragmentation:** Writing BRD/PRD in Word/Confluence, drawing flows in Camunda/Draw.io, managing test cases in Excel/TestRail, testing APIs in Postman, and coding E2E scripts in Playwright duplicates effort across 5+ disconnected tools.

**OneSpec SDLC Workbench** unifies both phases into a single local-first platform compliant with **ISO/IEC/IEEE 29148**, **ISO/IEC 19510 (BPMN 2.0)**, and **ISO/IEC/IEEE 29119**, powered by **`morluto/rea` (`rea-agents`)** for automated reverse engineering and live bottleneck streaming.

---

## 2. Two-Phase SDLC Data Flow Architecture

```
=========================================================================================
PHASE 1: PRE-DEVELOPMENT (NO SYSTEM CODE OR NEW DOMAIN EXISTS YET)
=========================================================================================
[Raw MoM Notes + Project Mode (Greenfield | Brownfield Domain)]
       │
       ▼
[1. Context & Baseline Engine]
   ├── Greenfield Mode: Loads ISO Starter Tokens from DESIGN.md
   └── Brownfield Mode: Runs REA Browser Inspector on existing domain for CSS/DOM baseline
       │
       ▼
[2. ISO/IEC/IEEE 29148 Compiler]
   ├── Generates BRD (StRS): Normative Business Rules (BR-01..BR-n), KPIs, Scope Boundary
   └── Generates PRD (SyRS): User Stories (REQ-US-01..n), BDD Criteria, Field & HTTP Contracts
       │
       ▼
[3. Visual Process & UI Specifier]
   ├── Camunda-Style BPMN 2.0 Engine: Renders Pool, Swimlanes (UI vs API/DB), XOR Gateways
   └── Stateful Wireframe Simulator: Interactive Normal, Error (HTTP 4xx), and Success states
       │
       ▼
[4. ISO/IEC/IEEE 29119 Test Matrix Builder]
   └── Generates Bi-Directional RTM (BR-xx ➔ REQ-US-xx ➔ TC-xxx) + Gherkin .feature files

=========================================================================================
PHASE 2: POST-DEVELOPMENT (CODE DELIVERED VIA GIT, LOCAL CLONE, OR STAGING URL)
=========================================================================================
[Tri-Modal Ingestion Engine powered by morluto/rea (rea-agents MCP & CLI)]
   ├── Mode A (Git Repo Connect): Shallow-clones branch; parses AST routes & ORM schemas
   ├── Mode B (Local Cloned Repo / ZIP): Runs `rea-agents analyze-javascript-application` locally
   └── Mode C (Staging URL + Read-Only DB): Runs Playwright HAR interceptor + SQL Introspector
       │
       ▼
[5. Spec-to-Implementation Conformance Auditor]
   └── Cross-checks Phase 1 PRD rules against Phase 2 REA AST & DB Schema evidence (Flags Dev Misses)
       │
       ▼
[6. Unified E2E + API Runner & Live Diagram Streamer]
   ├── Synthesizes Playwright (.spec.ts) + Postman Collection v2.1 + JUnit XML (100% Tool Parity)
   └── Streams real-time execution latency per node (DOM ➔ Controller ➔ SQL) to pinpoint bottlenecks
```

---

## 3. Tri-Modal Auto-Discovery Architecture (Answering the Greenfield Challenge)

When a project is **Greenfield** (no existing domain in Phase 1, or backend/frontend code is pushed to Git before a staging server is provisioned in Phase 2), Step 5 (Auto-Discovery) operates via three interchangeable adapters built around [`morluto/rea`](https://github.com/morluto/rea):

### Mode A: Direct Git Repository Connect (`git_repo`)
- **Mechanism:** Connects via SSH key or Personal Access Token (GitHub, GitLab, Bitbucket, Gitea) and performs a read-only sparse checkout into `/tmp/onespec-workspaces/<project-id>`.
- **REA Integration:**
  - Invokes `rea-agents` MCP tools and static analyzers across TypeScript/JavaScript, Go, Python, Java, or .NET source trees.
  - Extracts HTTP route declarations (e.g., Express/NestJS decorators `@Post('/vouchers/apply')`, Next.js App Router handlers, Go Gin routes), controller file paths, line numbers, and request validation schemas (Zod, Joi, class-validator).
  - Parses database schema definitions directly from `prisma/schema.prisma`, SQL migration files (`migrations/*.sql`), TypeORM entities, or SQLite snapshots.

### Mode B: Local Cloned Repository / Archive Upload (`local_clone`)
- **Mechanism:** Accepts a local filesystem path (e.g., `/Users/engineer/repos/target-app`) or `.zip` / `.tar.gz` archive.
- **REA Integration:**
  - Executes `npx -y rea-agents@latest analyze-javascript-application <absolute-path> --json` and REA SQLite/binary inspectors locally.
  - Optionally boots an **Ephemeral Local Container/Process** (`npm run dev` or Docker Compose) inside an isolated local port (`http://127.0.0.1:4000`) so Playwright can harvest live DOM selectors and runtime HAR traces without requiring external cloud staging infrastructure.

### Mode C: Live Staging URL + Read-Only Database Introspection (`staging_url`)
- **Mechanism:** Connects to a deployed staging URL and a read-only database URI (`postgresql://`, `mysql://`, `sqlite://`).
- **REA + Playwright Integration:**
  - Launches Playwright with CDP (Chrome DevTools Protocol) network interception and REA website analysis to capture exact DOM `data-testid` selectors, XHR/Fetch payloads, and SQL catalog metadata (`information_schema.columns`, `table_constraints`).

---

## 4. Camunda-Style BPMN 2.0 Specification (Step 3 Revision)

To prevent visual clutter and adhere to **ISO/IEC 19510 (BPMN 2.0)**, all process diagrams in Step 3 must follow Camunda Modeler layout rules:
1. **Horizontal Pool & Swimlanes:** Every workflow is enclosed in a named **Pool** divided into horizontal **Lanes** separating actor boundaries (e.g., `Lane 1: Client UI / Actor` and `Lane 2: Backend API & Database`).
2. **Standard BPMN 2.0 Symbols:**
   - **Start Event:** Thin single-line circle (`stroke-width: 2px`).
   - **User Task / Service Task:** Rounded rectangle (`rx="6"`) labeled with task stereotype (`[USER TASK]` or `[SERVICE TASK]`) and linked PRD Requirement ID (`REQ-US-xx`).
   - **Exclusive Gateway (XOR):** Diamond polygon containing an `×` marker, with orthogonal sequence flows explicitly labeled with guard conditions (`[YES: HTTP 200]` vs `[NO: HTTP 409 / 422]`).
   - **End Event:** Thick single-line circle (`stroke-width: 3.5px`).
3. **Orthogonal Routing Only:** Sequence connectors must use horizontal and vertical Manhattan routing (`<path d="M ... L ..." />`) with directional arrowheads; diagonal crossing lines are prohibited.

---

## 5. REA Live Runner Diagram Streaming & Bottleneck Detection (Step 7)

During test execution, OneSpec does not merely output pass/fail text logs. It streams live execution telemetry over WebSocket (`ws://localhost:8080/ws/runner-stream`) onto the architecture diagram:

1. **Span Instrumentation:**
   - **Span 1 (UI DOM Layer):** Measures Playwright action dispatch latency (`locator.fill`, `locator.click`, layout stability).
   - **Span 2 (API Transport & Controller Layer):** Captures HTTP round-trip time (`waitForResponse`), status code, and maps the endpoint to the exact controller file/line discovered by `morluto/rea`.
   - **Span 3 (Database / Persistence Layer):** Correlates API execution with SQL query duration (`EXPLAIN ANALYZE` or ORM query log) and schema index presence.
   - **Span 4 (ISO 29119 Assertion Oracle):** Evaluates actual HTTP status, JSON schema, and DOM state against the RTM expected result.
2. **Automated Bottleneck Pinpointing:**
   - Each node compares `actualDurationMs` against its configured SLA threshold (`thresholdMs`).
   - Any node exceeding `thresholdMs` (e.g., `1,253ms > 150ms SLA`) is immediately highlighted in `--status-defect` (`#B91C1C`) on the live stream diagram alongside REA's static code evidence (e.g., *"Unindexed sequential scan on `orders.voucher_code` at `voucher.controller.ts:84`"*).

---

## 6. Full Parity with Standalone Automation Tools

To guarantee that single-manpower QA output matches dedicated enterprise toolchains without switching apps, the Generator Layer exports four industry-standard formats from the same RTM model:

| Output Artifact | Target Ecosystem Parity | Generated File Format |
| :--- | :--- | :--- |
| **Playwright Unified E2E + API Suite** | Native `@playwright/test` runner | `tests/<project_code>.spec.ts` + `playwright.config.ts` |
| **API Collection & Environment** | Postman v2.1 & Newman CLI runner | `<project_code>.postman_collection.json` |
| **BDD Feature Specification** | Cucumber / SpecFlow / Behave | `features/<project_code>.feature` |
| **CI/CD Execution Telemetry** | Jenkins / GitLab CI / GitHub Actions / Xray | `reports/junit-results.xml` + `trace.zip` |