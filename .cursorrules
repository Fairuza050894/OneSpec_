# ONESPEC SDLC STUDIO — STRICT ENTERPRISE AI GUARDRAILS (ANTIGRAVITY RULES)

## 1. UI ARCHITECTURE LOCK (NEVER REVERT TO LEGACY UI)
- The active frontend in `src/app/page.tsx` MUST ALWAYS use the **Modern Studio Workbench UI**:
  - Top Navigation: `Studio | ISO Library | P1: Pre-Dev | P2: Staging | P3: GRC | P4: Formal`
  - Step 01 Header: `01. Project Source & Ingestion Hub` with `Login Surface Scanner & Discovery Hub`
  - Execution Modes: `MODE A · Autonomous Discovery (Run Autonomous Crawl)` and `MODE B · Guided Browser Session (Launch Guided Browser)`
- **STRICTLY FORBIDDEN:** NEVER overwrite `src/app/page.tsx` with legacy backup files showing `F1: Discovery & Harvest` or `01. Requirement & MoM Ingestion`.
- **LOGIN FORM VISIBILITY:** NEVER hide the Username, Password, and Authorization Dropdown (`Pancaran / Eksternal`) fields behind a `Public page detected (no sign-in form required)` message when scanning enterprise targets.

## 2. NEXT.JS 16 (TURBOPACK) & REACT 19 SYNTAX INTEGRITY (ZERO WHITE SCREEN)
- In every Client Component (`.tsx`), `'use client';` MUST remain on **Line 1** before any `import` statement.
- NEVER leave broken JSDoc comments at the top of any file (e.g., `* OneSpec` without an opening `/**`).
- NEVER access properties on nullable React state (e.g., `loginDetection.requiresLogin`) without optional chaining (`loginDetection?.requiresLogin`).

## 3. TYPESCRIPT & RUNTIME SAFETY (ZERO TDZ & ZERO PLACEHOLDERS)
- **NO TEMPORAL DEAD ZONE (TDZ):** NEVER reference any `const` or `let` variable before its declaration line (such as `isWildcardCreds`, `isWildcard`, `hasLiveHeaders`, or `cspVal` in `src/services/owaspDastService.ts`). Declare all derived flags at the very top of the function.
- **ZERO PLACEHOLDER TEXT:** NEVER write dummy placeholders like `...more gates...`, `...synthetic test data rows...`, or `// TODO` inside HTML/Markdown/Excel generators or service logic. Always write complete `.map()` data bindings.
- **REGEX & CALL SYNTAX:** Always verify opening and closing parentheses on method calls (e.g., `attrs.match(/.../)` in `src/services/reaBridge.ts`).

## 4. PROTECTED CORE SERVICES (`src/services/`)
Do NOT remove or downgrade any of the following enterprise modules:
1. `deepSpaHarvester.ts`: 7-Layer SPA route discovery (Cross-Subdomain XHR/Fetch & JSON body interceptor, Recursive walkJson & DatabaseErdTable extraction, 3-Pass sidebar accordion unfolder & smooth scrolling, Vue/Nuxt memory router with child route prefix propagation, JS chunk scanner, Non-anchor click prober, Sub-Tab & Modal prober, CDP instant screenshot).
2. `domainLogicBrainService.ts`: Priority `AUTHENTICATION_RBAC_GATE` classification (checks `type === 'password'` first), `Pancaran / Eksternal` login dropdown recognition, `VR-AST-xx` white-box backend rules, DB Foreign Key integrity scenarios, and `SyntheticDataFactoryBundle`.
3. `iso26514UserManualService.ts`: 9-Section bilingual (`id`/`en`) ISO/IEC/IEEE 26514 User Manual with 1:1 visual callout pins, login dropdown SOPs, and dynamic glossary.
4. `rbacDifferentialMatrixService.ts`: Multi-Persona RBAC Differential Matrix (`Pancaran Internal` vs `Eksternal Partner` vs `Viewer` vs `Unauthenticated`).
5. `automationBundleExportService.ts`: Executable Playwright (`.spec.ts`) & Postman Collection v2.1 (`.json`) generator served via `/api/sdlc/automation-bundle`.
6. `unifiedReportGenerator.ts`: Full parity across 17-sheet `.xlsx` and 15-table `.xls` exports (including Table 13 SRE/CTO Bus-Factor, Table 14 Synthetic Test Data Factory, and Table 15 RBAC Differential Matrix).
