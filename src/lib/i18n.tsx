'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

export type StudioLocale = 'en' | 'id';

export interface StudioCopy {
  header: {
    workspaceLabel: string;
    phase1: string;
    phase2: string;
    phase3: string;
    phase4: string;
    seedData: string;
    cmdkTooltip: string;
    localeTooltip: string;
    newProjectBtn: string;
    historyBtn: string;
  };
  vault: {
    modalTitle: string;
    modalSubtitle: string;
    snapshotsTab: string;
    projectsTab: string;
    saveSnapshotNow: string;
    diffTitle: string;
    passRateDelta: string;
    newModules: string;
    removedModules: string;
    newApis: string;
    newBugs: string;
    bugsResolved: string;
    noPriorSnapshot: string;
    loadProject: string;
    deleteProject: string;
    createNewModalTitle: string;
    createNewDesc: string;
    startFromZeroBtn: string;
    startFromUrlBtn: string;
    startFromGitBtn: string;
    startFromZipBtn: string;
    close: string;
  };
  nav: {
    group1: string;
    group2: string;
    group3: string;
    group4: string;
    artifactExplorer: string;
    businessRulesLabel: string;
    validationRulesLabel: string;
    steps: Array<{ step: number; label: string; title: string }>;
  };
  inspector: {
    title: string;
    closeTitle: string;
    manualSpecHeader: string;
    objective: string;
    preconditions: string;
    executionSteps: string;
    expected3Layer: string;
    actualLiveResult: string;
    gherkinTitle: string;
    copyGherkin: string;
    copied: string;
  };
  terminal: {
    tabConsole: string;
    tabAst: string;
    tabStream: string;
    expand: string;
    collapse: string;
  };
  step01: {
    title: string;
    subtitle: string;
    primaryCta: string;
    primaryCtaBusy: string;
    tabWebUrl: string;
    tabGitRepo: string;
    tabZipFolder: string;
    tabNotes: string;
    scannerTitle: string;
    scannerHint: string;
    targetUrlLabel: string;
    scanBtn: string;
    scanBtnBusy: string;
    detectedSurface: string;
    publicPageBanner: string;
    selectPrefix: string;
    enterPrefix: string;
    modeATitle: string;
    modeADesc: string;
    modeABtn: string;
    modeABtnBusy: string;
    modeBTitle: string;
    modeBDesc: string;
    modeBBtn: string;
    modeBBtnBusy: string;
    liveSessionTitle: string;
    liveSessionExploring: string;
    liveSessionPassive: string;
    autoTraverseBtn: string;
    finishCompileBtn: string;
    safetyGuardLabel: string;
    safetySandbox: string;
    safetyProduction: string;
    momCardTitle: string;
    activeScopeLabel: string;
    entitiesCardTitle: string;
    extractedBadge: string;
    colType: string;
    colId: string;
    colStatement: string;
    colExcerpt: string;
    entitiesTip: string;
    errTargetUrlScan: string;
    errTargetUrlAuto: string;
    errTargetUrlGuided: string;
    guidedActiveNotice: string;
    guidedFinishNotice: string;
    charsLabel: string;
    invariantsLabel: string;
    rulesUnit: string;
    contractsUnit: string;
    greenfieldNameLabel: string;
    greenfieldNamePlaceholder: string;
    greenfieldHint: string;
  };
  step02: {
    title: string;
    subtitle: string;
    tabOrchestrator: string;
    tabArchitecture: string;
    tabDfd: string;
    contractSimulator: string;
    simulateNominal: string;
    simulateRejection: string;
  };
  step03: {
    title: string;
    subtitle: string;
    tabBrd: string;
    tabPrd: string;
    tabTsd: string;
    tabRawIso: string;
    backToOrchestrator: string;
    colRuleId: string;
    colCategory: string;
    colStatement: string;
    colKpi: string;
    colSource: string;
    colValId: string;
    colStoryRef: string;
    colField: string;
    colConstraint: string;
    colHttpError: string;
    colUiError: string;
    scanCodebaseBtn: string;
    exportTsdBtn: string;
    exportSpecBtn: string;
  };
  step04: {
    title: string;
    subtitle: string;
    modulesLabel: string;
    allModules: string;
    searchPlaceholder: string;
    tabScenarios: string;
    tabCases: string;
    tabDefects: string;
    tabUat: string;
    exportCsv: string;
    exportFeature: string;
    exportMarkdown: string;
    exportDefectMd: string;
    exportDefectCsv: string;
    colScenarioId: string;
    colFeatureModule: string;
    colCategory: string;
    colScenarioCoverage: string;
    colLinkedTcs: string;
    colBugId: string;
    colSeverity: string;
    colDefectSteps: string;
    colExpectedActual: string;
    colEvidenceFix: string;
    noDefectsTitle: string;
    noDefectsDesc: string;
    noMatchingCases: string;
    uatJourneyHeader: string;
    uatCriteriaHeader: string;
    uatTesterNotes: string;
    footerHint: string;
    modulesStat: string;
    defectsStat: string;
  };
  step05: {
    title: string;
    subtitle: string;
    tabApi: string;
    tabErd: string;
    tabDom: string;
    tabVault: string;
    modeAGit: string;
    modeBArchive: string;
    modeCStaging: string;
    executeDiscovery: string;
    launchGuided: string;
    errStagingUrl: string;
  };
  step06: {
    title: string;
    subtitle: string;
    copyTechDoc: string;
    copied: string;
    exportReport: string;
    searchPlaceholder: string;
    rulesMapped: string;
    colAuditId: string;
    colVerdict: string;
    colRuleRef: string;
    colUserStory: string;
    colTargetEntity: string;
    colSeverity: string;
    colTitle: string;
  };
  step07: {
    title: string;
    subtitle: string;
    tabLiveTrace: string;
    tabScripts: string;
    tabCiCd: string;
    gatePass: string;
    gateFail: string;
    applyFix: string;
    runAll: string;
    runningE2e: string;
    runningLoad: string;
    runningAst: string;
    reportsLabel: string;
    exportHtml: string;
    exportMd: string;
    exportBundle: string;
    kpiFunctional: string;
    kpiVus: string;
    kpiThroughput: string;
    kpiLatency: string;
    kpiErrorRate: string;
    passedLabel: string;
    failedLabel: string;
    activeVusLabel: string;
    sloPass: string;
    sloFail: string;
  };
  step08: {
    title: string;
    subtitle: string;
    tabRegulatory: string;
    tabRiskVault: string;
    complianceSubtitle: string;
    tabScorecard: string;
    tabEvidenceMatrix: string;
    tabSignedBinder: string;
    downloadBinder: string;
    riskTitleSuffix: string;
    tabHeatmap: string;
    tabSoc2: string;
    tabMerkle: string;
    tabAuditReport: string;
    exportBinder: string;
  };
  step09: {
    title: string;
    subtitle: string;
    subtitleSuffix: string;
    tabMatrix: string;
    tabHeadersCors: string;
    tabReport: string;
    runProbe: string;
    probing: string;
  };
  step10: {
    title: string;
    subtitle: string;
    subtitleSuffix: string;
    tabInvariants: string;
    tabSmtCode: string;
    tabSpecDoc: string;
    runProver: string;
    solving: string;
    exportSpec: string;
  };
  step11: {
    title: string;
    subtitle: string;
    subtitleSuffix: string;
    tabDebates: string;
    tabSeals: string;
    tabPacket: string;
    conveneArb: string;
    convening: string;
    exportPacket: string;
    verdictLabel: string;
  };
  step12: {
    title: string;
    subtitle: string;
    readinessLabel: string;
    exportHtmlPdf: string;
    exportAzPortal: string;
    saveSnapshot: string;
    savingSnapshot: string;
    exportMarkdown: string;
    tabSummary: string;
    tabLibrary: string;
    tabIntegration: string;
    tabGraph: string;
    readinessScoreLabel: string;
    breakdownTitle: string;
    stagesUnit: string;
    scopeLabel: string;
    outcomeLabel: string;
    impactLabel: string;
    openStepPrefix: string;
    guideTitle: string;
    featuresUnit: string;
    controlsLabel: string;
    howToUseLabel: string;
    recommendationsTitle: string;
    itemsUnit: string;
    userImpactLabel: string;
    actionLabel: string;
    previewTab: string;
    markdownTab: string;
    copyReport: string;
    stageCol: string;
    statusCol: string;
    outcomeCol: string;
    impactCol: string;
    exportWhitepaper: string;
    regressionCardTitle: string;
    archPlainTitle: string;
    integrationKitTitle: string;
    dataDictTitle: string;
    searchDictPlaceholder: string;
    copyBookMd: string;
    copyCurl: string;
    copied: string;
  };
}

const EN_COPY: StudioCopy = {
  header: {
    workspaceLabel: 'WORKSPACE:',
    phase1: 'Phase 1: Pre-Dev',
    phase2: 'Phase 2: Staging & REA',
    phase3: 'Phase 3: GRC & Security',
    phase4: 'Phase 4: Formal Assurance',
    seedData: 'Seed Data',
    cmdkTooltip: 'Open Command Palette (Cmd+K)',
    localeTooltip: 'Switch global workbench language (EN / ID)',
    newProjectBtn: '+ New Project',
    historyBtn: 'History & Diff',
  },
  vault: {
    modalTitle: 'Multi-Project Vault, Snapshot History & Regression Diff',
    modalSubtitle: 'Permanent disk storage (.onespec-vault) across Greenfield, Active Web, and Git projects',
    snapshotsTab: 'Snapshots & Regression Diff',
    projectsTab: 'All Saved Projects',
    saveSnapshotNow: 'Save Current Snapshot',
    diffTitle: 'Automatic Regression Diff vs Prior Snapshot',
    passRateDelta: 'Pass Rate Delta',
    newModules: 'New Modules',
    removedModules: 'Removed Modules',
    newApis: 'New APIs',
    newBugs: 'New Bugs',
    bugsResolved: 'Resolved Bugs',
    noPriorSnapshot: 'Baseline snapshot recorded. Re-scan or save another snapshot to view cross-run regression diffs.',
    loadProject: 'Load Project',
    deleteProject: 'Delete',
    createNewModalTitle: 'Create or Register Project Workspace',
    createNewDesc: 'Choose an ingestion mode: start from zero (Greenfield MoM), scan a live web app, connect Git, or upload .ZIP.',
    startFromZeroBtn: 'New Project From Zero (MoM Notes)',
    startFromUrlBtn: 'Existing Web Application (Live URL)',
    startFromGitBtn: 'Git Repository (Clone & AST)',
    startFromZipBtn: 'Local Folder / .ZIP Archive',
    close: 'Close',
  },
  nav: {
    group1: 'Phase 1: Pre-Development',
    group2: 'Phase 2: Staging & Automation',
    group3: 'Phase 3: GRC & Security',
    group4: 'Phase 4: Formal Assurance',
    artifactExplorer: 'Artifact Explorer',
    businessRulesLabel: 'Business Rules:',
    validationRulesLabel: 'Validation Rules:',
    steps: [
      { step: 1, label: '01. Project Ingestion Hub', title: '01. Project Source & Ingestion Hub' },
      { step: 2, label: '02. Architecture & BPMN/DFD', title: '02. System Architecture & DFD (IEEE 1016)' },
      { step: 3, label: '03. Normative Specs (ISO 29148)', title: '03. Normative Specifications (ISO/IEC/IEEE 29148)' },
      { step: 4, label: '04. QA Workbook & Traceability', title: '04. QA Test Workbook & Traceability (ISO 29119)' },
      { step: 5, label: '05. Quad-Modal Auto-Discovery', title: '05. Quad-Modal Technical Auto-Discovery' },
      { step: 6, label: '06. Spec-to-Code Gap Audit', title: '06. Spec-to-Code Gap Auditor' },
      { step: 7, label: '07. Live Runner & Bottlenecks', title: '07. Playwright Automation & REA Live Runner' },
      { step: 8, label: '08. GRC, Risk & Merkle Vault', title: '08. Enterprise GRC, ISO 31000 & Merkle Vault' },
      { step: 9, label: '09. OWASP API Top 10 DAST', title: '09. Active OWASP API Top 10 DAST Prober' },
      { step: 10, label: '10. SMT Z3 Formal Proofs', title: '10. SMT Solver Z3 Formal Proofs' },
      { step: 11, label: '11. Delphi ARB Consensus', title: '11. Delphi Consensus Board (Virtual ARB)' },
      { step: 12, label: '12. Executive Summary & Graph', title: '12. Executive SDLC Summary & Knowledge Graph' },
    ],
  },
  inspector: {
    title: 'Contextual Inspector',
    closeTitle: 'Close Inspector (Esc)',
    manualSpecHeader: 'MANUAL TEST SPEC (ISO 29119-4)',
    objective: 'Objective:',
    preconditions: 'Preconditions:',
    executionSteps: 'Numbered Test Execution Steps',
    expected3Layer: 'Expected 3-Layer Verification Contract:',
    actualLiveResult: 'Observed Live Result',
    gherkinTitle: 'Cucumber Gherkin (.feature)',
    copyGherkin: 'Copy .feature',
    copied: 'Copied',
  },
  terminal: {
    tabConsole: 'Execution Console',
    tabAst: 'AST Parser Output',
    tabStream: 'morluto/rea Live Stream',
    expand: 'Expand Terminal',
    collapse: 'Collapse Terminal',
  },
  step01: {
    title: '01. Project Source & Ingestion Hub',
    subtitle: 'Unified Ingestion Engine: Live Web URL, Git Repository, Archive / Local Folder, & Stakeholder Notes',
    primaryCta: 'Build Full SDLC Pipeline',
    primaryCtaBusy: 'Analyzing Source...',
    tabWebUrl: '1. Live Web URL',
    tabGitRepo: '2. Git Repo (AST)',
    tabZipFolder: '3. .ZIP / Local Folder',
    tabNotes: '4. Stakeholder Notes (MoM)',
    scannerTitle: 'Login Surface Scanner & Discovery Hub',
    scannerHint: 'Adaptive DOM Detection · Autonomous Crawl or Guided Session',
    targetUrlLabel: 'TARGET URL:',
    scanBtn: 'Scan Target URL',
    scanBtnBusy: 'Scanning Target...',
    detectedSurface: 'Detected Surface',
    publicPageBanner: 'Public page detected (no sign-in form required) — ready for exploration',
    selectPrefix: 'Select',
    enterPrefix: 'Enter',
    modeATitle: 'MODE A · Autonomous Discovery',
    modeADesc: 'Signs in using the fields above, traverses sub-menus, and compiles Steps 01–12 automatically.',
    modeABtn: 'Run Autonomous Crawl',
    modeABtnBusy: 'Running Autonomous Crawl...',
    modeBTitle: 'MODE B · Guided Browser Session',
    modeBDesc: 'Opens a live Chrome window for manual sign-in (MFA, CAPTCHA, SSO) while recording telemetry.',
    modeBBtn: 'Launch Guided Browser',
    modeBBtnBusy: 'Launching Chrome...',
    liveSessionTitle: 'Live Session Recording',
    liveSessionExploring: 'Autonomous crawler is traversing remaining menus...',
    liveSessionPassive: 'Passive capture active — sign in and explore pages inside the Chrome window.',
    autoTraverseBtn: 'Auto-Traverse Remaining Menus',
    finishCompileBtn: 'Finish & Compile Steps 01–12',
    safetyGuardLabel: 'Safety Guard:',
    safetySandbox: 'SANDBOX / STAGING (Autonomous Robot Enabled)',
    safetyProduction: 'PRODUCTION DETECTED (Read-Only Safe Guard)',
    momCardTitle: 'Raw Stakeholder MoM & Notes',
    activeScopeLabel: 'Active Scope:',
    entitiesCardTitle: 'Extracted Entities, Actors & Business Constraints',
    extractedBadge: 'EXTRACTED',
    colType: 'Type',
    colId: 'ID',
    colStatement: 'Statement / Constraint',
    colExcerpt: 'Source Excerpt',
    entitiesTip: 'Select any row to open the Contextual Inspector drawer for constraint editing.',
    errTargetUrlScan: 'Enter a target URL first (e.g., http://localhost:3000 or https://app.example.com).',
    errTargetUrlAuto: 'Enter a target URL before running autonomous discovery.',
    errTargetUrlGuided: 'Enter a target URL before launching a guided browser session.',
    guidedActiveNotice: 'Guided session active. Sign in and explore inside Chrome, then select "Finish & Compile Steps 01–12".',
    guidedFinishNotice: 'Guided browser session completed and authentication state compiled into Steps 01–12.',
    charsLabel: 'chars',
    invariantsLabel: 'Invariants',
    rulesUnit: 'Business Rules',
    contractsUnit: 'Validation Contracts',
    greenfieldNameLabel: 'NEW PROJECT NAME:',
    greenfieldNamePlaceholder: 'e.g. Vendor Portal Integration v1',
    greenfieldHint: 'Greenfield Mode · Compiles BA, Architecture, DB, APIs & QA Specs directly from Notes',
  },
  step02: {
    title: '02. Process Orchestrator & Architecture Engine',
    subtitle: 'Multi-Lane Process Pipeline & Invariant Simulator',
    tabOrchestrator: '1. Process Orchestrator (BPMN & Wireframe)',
    tabArchitecture: '2. C4 Architecture (HLA & LLA)',
    tabDfd: '3. Reverse Data Flow Diagram (DFD 0-2 & UU PDP)',
    contractSimulator: 'Contract Simulator',
    simulateNominal: 'Simulate Nominal Flow',
    simulateRejection: 'Simulate Rejection',
  },
  step03: {
    title: '03. BRD, PRD & TSD/TRD Specification Engine',
    subtitle: 'ISO/IEC/IEEE 29148:2018 (StRS / SyRS / TSD) & IEEE 1016 Software Design Description',
    tabBrd: '1. Business Rules (BRD)',
    tabPrd: '2. Validation Contracts (PRD)',
    tabTsd: '3. Technical Specs (TSD / TRD)',
    tabRawIso: '4. Raw ISO Spec',
    backToOrchestrator: 'Camunda Orchestrator',
    colRuleId: 'Rule ID',
    colCategory: 'Category',
    colStatement: 'Business Rule Statement (ISO RFC-2119)',
    colKpi: 'Target KPI',
    colSource: 'Linked Source',
    colValId: 'Validation ID',
    colStoryRef: 'Story Ref',
    colField: 'Field & Type',
    colConstraint: 'Constraint Contract',
    colHttpError: 'HTTP / Error Code',
    colUiError: 'Exact UI Error Copy',
    scanCodebaseBtn: 'Run Codebase Grep',
    exportTsdBtn: 'Export TSD (.md)',
    exportSpecBtn: 'Export ISO Spec (.md)',
  },
  step04: {
    title: '04. Requirement Traceability Matrix (RTM)',
    subtitle: 'ISO/IEC/IEEE 29119-3 Synthesized Test Cases with Bi-Directional VR-xx Binding',
    modulesLabel: 'Modules:',
    allModules: 'All Modules',
    searchPlaceholder: 'Filter scenarios, tests, bugs...',
    tabScenarios: '1. Test Scenarios',
    tabCases: '2. Test Cases & Execution',
    tabDefects: '3. Defect Register',
    tabUat: '4. E2E & UAT Sign-Off',
    exportCsv: 'Export CSV',
    exportFeature: 'Export .feature',
    exportMarkdown: 'Export Markdown',
    exportDefectMd: 'Export Defect Report (.md)',
    exportDefectCsv: 'Export Defect CSV',
    colScenarioId: 'Scenario ID',
    colFeatureModule: 'Feature Module',
    colCategory: 'Category',
    colScenarioCoverage: 'Scenario & Coverage',
    colLinkedTcs: 'Linked TCs',
    colBugId: 'Bug ID',
    colSeverity: 'Severity',
    colDefectSteps: 'Defect & Reproduction Steps',
    colExpectedActual: 'Expected vs Actual',
    colEvidenceFix: 'Evidence & Remediation',
    noDefectsTitle: 'Zero Runtime Defects or Anomalies Detected',
    noDefectsDesc: 'All probed endpoints, tables, validations, and console streams operated cleanly.',
    noMatchingCases: 'No matching test cases found in RTM dataset.',
    uatJourneyHeader: 'End-to-End Business Journey',
    uatCriteriaHeader: 'Acceptance Criteria Verification',
    uatTesterNotes: 'TESTER NOTES:',
    footerHint: 'Select a scenario or test row to inspect full 3-layer verification & Gherkin',
    modulesStat: 'Modules:',
    defectsStat: 'Defects:',
  },
  step05: {
    title: '05. Quad-Modal Technical Auto-Discovery',
    subtitle: 'Backend OpenAPI 3.1, Database ERD, DOM Traceability & Decompiled Bundle Secret Vault',
    tabApi: '1. Discovered API Contracts',
    tabErd: '2. Database Schema ERD',
    tabDom: '3. DOM Traceability Map',
    tabVault: '4. Bundle AST & Secret Scan',
    modeAGit: 'Mode A: Git / PR Connect',
    modeBArchive: 'Mode B: Device .ZIP Upload',
    modeCStaging: 'Mode C: Live URL / Blind Crawl',
    executeDiscovery: 'Execute Auto-Discovery',
    launchGuided: 'Launch Guided Browser',
    errStagingUrl: 'Enter a staging or target URL before launching the guided browser.',
  },
  step06: {
    title: '06. Spec-to-Code Gap Auditor',
    subtitle: 'Automated PRD vs Implementation Discrepancy Matrix & Semantic Diff (Monaco DiffEditor)',
    copyTechDoc: 'Copy Tech Doc',
    copied: 'Copied',
    exportReport: 'Export Report',
    searchPlaceholder: 'Filter discrepancy rules...',
    rulesMapped: 'Rules Mapped',
    colAuditId: 'Audit ID',
    colVerdict: 'Audit Verdict',
    colRuleRef: 'Rule Ref',
    colUserStory: 'User Story',
    colTargetEntity: 'Target Entity',
    colSeverity: 'Severity',
    colTitle: 'Discrepancy Title',
  },
  step07: {
    title: '07. Unified E2E, API & Load Execution Runner',
    subtitle: 'Playwright Functional E2E, OpenAPI Contract Probing, k6 SLA Benchmarking & AST Bottleneck Correlation (ISO 29119-4)',
    tabLiveTrace: '1. Live Execution Stream',
    tabScripts: '2. Scripts & Results (.spec.ts / .k6.js)',
    tabCiCd: '3. CI/CD Bundles',
    gatePass: 'RELEASE GATE: PRODUCTION GO (SLOs PASS)',
    gateFail: 'RELEASE GATE: NO-GO (Bottleneck / Failure)',
    applyFix: 'Apply DB Fix',
    runAll: 'Run All (E2E + k6)',
    runningE2e: 'Running E2E & API...',
    runningLoad: 'k6 Stress',
    runningAst: 'Correlating AST...',
    reportsLabel: 'REPORTS:',
    exportHtml: 'HTML Report',
    exportMd: 'Markdown (.md)',
    exportBundle: 'JSON / JUnit',
    kpiFunctional: 'E2E & API Functional',
    kpiVus: 'k6 Virtual Users',
    kpiThroughput: 'Throughput (RPS)',
    kpiLatency: 'Latency p(95) SLO',
    kpiErrorRate: 'Error Rate',
    passedLabel: 'Passed',
    failedLabel: 'Failed',
    activeVusLabel: 'Active VUs',
    sloPass: 'SLO PASS',
    sloFail: 'SLO FAIL',
  },
  step08: {
    title: '08. Enterprise GRC, Risk Register & Merkle Audit Vault',
    subtitle: 'Multi-Jurisdiction Regulatory Binder · 5x5 Risk Heatmap · Merkle Vault',
    tabRegulatory: '1. Regulatory Compliance (UU PDP, POJK, ISO 27001, PCI-DSS)',
    tabRiskVault: '2. ISO 31000 5x5 Risk Heatmap & SOC 2 Merkle Vault',
    complianceSubtitle: '· Multi-Jurisdiction Compliance',
    tabScorecard: '1. Executive Scorecard',
    tabEvidenceMatrix: '2. Control Evidence Matrix',
    tabSignedBinder: '3. Signed Audit Binder',
    downloadBinder: 'Download Binder',
    riskTitleSuffix: '· ISO 31000 Risk Register & SOC 2 Vault',
    tabHeatmap: '5x5 Heatmap & Register',
    tabSoc2: 'SOC 2 Telemetry',
    tabMerkle: 'Merkle Tree Vault',
    tabAuditReport: 'Audit Report (.md)',
    exportBinder: 'Export Binder',
  },
  step09: {
    title: '09. OWASP API Top 10 Security & DAST Auditor',
    subtitle: 'Automated Ingress Security Probing, Header Hardening & CORS Vulnerability Matrix (OWASP ASVS v4.0 · ISO 27001)',
    subtitleSuffix: '· OWASP API Top 10 DAST',
    tabMatrix: 'Vulnerability Matrix',
    tabHeadersCors: 'Headers & CORS',
    tabReport: 'DAST Report (.md)',
    runProbe: 'Run Live OWASP DAST Probe',
    probing: 'Probing Target Ingress...',
  },
  step10: {
    title: '10. Formal Logic & Invariant Prover (Z3 SMT)',
    subtitle: 'First-Order Predicate Verification & Counter-Example Elimination (ISO/IEC 29119-2 · SMT-LIB v2)',
    subtitleSuffix: '· Z3 Formal Verification',
    tabInvariants: 'Invariants & Proofs',
    tabSmtCode: 'SMT-LIB v2 Logic Scripts',
    tabSpecDoc: 'Formal Spec (.md)',
    runProver: 'Run Z3 Prover',
    solving: 'Solving Proofs...',
    exportSpec: 'Export Spec',
  },
  step11: {
    title: '11. Architecture Review Board (Delphi Consensus)',
    subtitle: 'Multi-Role Sign-Off Debates & Formal Governance Clearance Seals (ISO/IEC/IEEE 42010 ARB)',
    subtitleSuffix: '· Delphi Consensus',
    tabDebates: 'Boardroom Debates',
    tabSeals: 'Sign-Off Seals (6/6)',
    tabPacket: 'Clearance Packet (.md)',
    conveneArb: 'Convene Virtual ARB',
    convening: 'Simulating ARB...',
    exportPacket: 'Export Packet',
    verdictLabel: 'Verdict',
  },
  step12: {
    title: '12. Executive Summary & A–Z Documentation Library',
    subtitle: 'Stakeholder readiness across Steps 01–11, 4-Book A–Z Library, Cross-Project Integration Kit & Knowledge Graph.',
    readinessLabel: 'Readiness',
    exportHtmlPdf: 'Export HTML / PDF',
    exportAzPortal: 'Download A–Z Portal (.HTML / PDF)',
    saveSnapshot: 'Save Snapshot to Vault',
    savingSnapshot: 'Saving...',
    exportMarkdown: 'Export Markdown',
    tabSummary: '1. Executive Summary (01–11)',
    tabLibrary: '2. A–Z Library (4 Books)',
    tabIntegration: '3. Integration Kit & Dictionary',
    tabGraph: '4. Knowledge Graph',
    readinessScoreLabel: 'Readiness Score:',
    breakdownTitle: 'Lifecycle Verification Breakdown (Steps 01–11)',
    stagesUnit: 'Stages',
    scopeLabel: 'Scope:',
    outcomeLabel: 'Outcome:',
    impactLabel: 'Business Impact:',
    openStepPrefix: 'Open',
    guideTitle: 'Feature Directory & User Guides',
    featuresUnit: 'Features',
    controlsLabel: 'Available Controls & Columns:',
    howToUseLabel: 'How to Use:',
    recommendationsTitle: 'Actionable Recommendations',
    itemsUnit: 'Items',
    userImpactLabel: 'User Impact:',
    actionLabel: 'Recommended Action:',
    previewTab: 'Structured Reader',
    markdownTab: 'Markdown Source',
    copyReport: 'Copy Report',
    stageCol: 'Stage',
    statusCol: 'Status',
    outcomeCol: 'Outcome',
    impactCol: 'Business Impact',
    exportWhitepaper: 'Export Whitepaper',
    regressionCardTitle: 'Regression Diff vs. Previous Snapshot',
    archPlainTitle: 'As-Is Architecture Overview (4 Layers)',
    integrationKitTitle: 'Cross-Project Integration Handoff Kit',
    dataDictTitle: 'Master Data Dictionary',
    searchDictPlaceholder: 'Filter table, column, or business meaning...',
    copyBookMd: 'Copy Book (.md)',
    copyCurl: 'Copy cURL',
    copied: 'Copied',
  },
};

const ID_COPY: StudioCopy = {
  header: {
    workspaceLabel: 'RUANG KERJA:',
    phase1: 'Fase 1: Pra-Dev',
    phase2: 'Fase 2: Staging & REA',
    phase3: 'Fase 3: GRC & Keamanan',
    phase4: 'Fase 4: Jaminan Formal',
    seedData: 'Muat Sampel',
    cmdkTooltip: 'Buka Palet Perintah (Cmd+K)',
    localeTooltip: 'Ubah bahasa workbench global (EN / ID)',
    newProjectBtn: '+ Project Baru',
    historyBtn: 'Riwayat & Diff',
  },
  vault: {
    modalTitle: 'Vault Multi-Project, Riwayat Snapshot & Regression Diff',
    modalSubtitle: 'Penyimpanan permanen (.onespec-vault) lintas project baru (dari 0), web aktif, dan repositori Git',
    snapshotsTab: 'Riwayat Snapshot & Regression Diff',
    projectsTab: 'Semua Project Tersimpan',
    saveSnapshotNow: 'Simpan Snapshot Sekarang',
    diffTitle: 'Perbandingan Regresi Otomatis vs Snapshot Sebelumnya',
    passRateDelta: 'Delta Kelulusan',
    newModules: 'Modul Baru',
    removedModules: 'Modul Hilang',
    newApis: 'API Baru',
    newBugs: 'Bug Baru',
    bugsResolved: 'Bug Selesai',
    noPriorSnapshot: 'Snapshot dasar tersimpan. Lakukan pemindaian ulang atau simpan snapshot baru untuk melihat diff regresi.',
    loadProject: 'Buka Project',
    deleteProject: 'Hapus',
    createNewModalTitle: 'Buat atau Daftarkan Workspace Project Baru',
    createNewDesc: 'Pilih sumber proyek: mulai dari nol (MoM / Catatan), web yang sudah berjalan, Git repo, atau arsip .ZIP.',
    startFromZeroBtn: 'Project Baru Dari 0 (Catatan MoM)',
    startFromUrlBtn: 'Web Berjalan (URL Langsung)',
    startFromGitBtn: 'Repositori Git (Clone & AST)',
    startFromZipBtn: 'Folder Lokal / Arsip .ZIP',
    close: 'Tutup',
  },
  nav: {
    group1: 'Fase 1: Pra-Pengembangan',
    group2: 'Fase 2: Staging & Otomasi',
    group3: 'Fase 3: GRC & Keamanan',
    group4: 'Fase 4: Jaminan Formal',
    artifactExplorer: 'Penjelajah Artefak',
    businessRulesLabel: 'Aturan Bisnis:',
    validationRulesLabel: 'Kontrak Validasi:',
    steps: [
      { step: 1, label: '01. Pusat Ingesti Proyek', title: '01. Pusat Sumber & Ingesti Proyek' },
      { step: 2, label: '02. Arsitektur & BPMN/DFD', title: '02. Orkestrator Proses & Arsitektur (IEEE 1016)' },
      { step: 3, label: '03. Spesifikasi ISO 29148', title: '03. Mesin Spesifikasi Normatif (ISO/IEC/IEEE 29148)' },
      { step: 4, label: '04. Matriks QA & Uji UAT', title: '04. Buku Kerja QA & Ketertelusuran (ISO 29119)' },
      { step: 5, label: '05. Penemuan Otomatis', title: '05. Penemuan Teknis Quad-Modal Otomatis' },
      { step: 6, label: '06. Audit Kesenjangan', title: '06. Auditor Kesenjangan Spesifikasi vs Kode' },
      { step: 7, label: '07. Pengujian & Performa', title: '07. Eksekutor Otomatis Playwright & k6' },
      { step: 8, label: '08. Tata Kelola & Risiko', title: '08. Kepatuhan Regulasi, Risiko ISO 31000 & Merkle Vault' },
      { step: 9, label: '09. Audit Keamanan OWASP', title: '09. Uji Penetrasi API OWASP Top 10' },
      { step: 10, label: '10. Verifikasi Logika Z3', title: '10. Pembuktian Formal SMT Solver Z3' },
      { step: 11, label: '11. Konsensus Dewan ARB', title: '11. Dewan Peninjau Arsitektur (Delphi ARB)' },
      { step: 12, label: '12. Ringkasan & Graf SDLC', title: '12. Ringkasan Eksekutif SDLC & Graf Pengetahuan' },
    ],
  },
  inspector: {
    title: 'Inspektor Kontekstual',
    closeTitle: 'Tutup Inspektor (Esc)',
    manualSpecHeader: 'SPESIFIKASI UJI MANUAL (ISO 29119-4)',
    objective: 'Tujuan Pengujian:',
    preconditions: 'Prasyarat:',
    executionSteps: 'Langkah Eksekusi Terurut',
    expected3Layer: 'Kontrak Verifikasi 3 Lapisan:',
    actualLiveResult: 'Hasil Observasi Aktual',
    gherkinTitle: 'Skenario Gherkin (.feature)',
    copyGherkin: 'Salin .feature',
    copied: 'Tersalin',
  },
  terminal: {
    tabConsole: 'Konsol Eksekusi',
    tabAst: 'Keluaran Parser AST',
    tabStream: 'Aliran morluto/rea',
    expand: 'Perluas Terminal',
    collapse: 'Ciutkan Terminal',
  },
  step01: {
    title: '01. Pusat Sumber & Ingesti Proyek',
    subtitle: 'Mesin Ingesti Terpadu: URL Web Langsung, Repositori Git, Arsip / Folder Lokal, & Catatan Pemangku Kepentingan',
    primaryCta: 'Bangun Pipeline SDLC Lengkap',
    primaryCtaBusy: 'Menganalisis Sumber...',
    tabWebUrl: '1. URL Web',
    tabGitRepo: '2. Repo Git (AST)',
    tabZipFolder: '3. .ZIP / Lokal',
    tabNotes: '4. Notulen Pemangku Kepentingan',
    scannerTitle: 'Pemindai Halaman Autentikasi & Pusat Eksekusi',
    scannerHint: 'Deteksi DOM Adaptif · Penjelajahan Otonom atau Sesi Terpandu',
    targetUrlLabel: 'URL TARGET:',
    scanBtn: 'Pindai URL Target',
    scanBtnBusy: 'Memindai Target...',
    detectedSurface: 'Permukaan Terdeteksi',
    publicPageBanner: 'Halaman publik terdeteksi (tanpa formulir masuk) — siap dieksplorasi',
    selectPrefix: 'Pilih',
    enterPrefix: 'Masukkan',
    modeATitle: 'MODE A · Penjelajahan Otonom',
    modeADesc: 'Mengisi kolom masuk di atas, menelusuri sub-menu, dan menyusun Step 01–12 secara otomatis.',
    modeABtn: 'Jalankan Penjelajahan Otonom',
    modeABtnBusy: 'Menjalankan Penjelajahan Otonom...',
    modeBTitle: 'MODE B · Sesi Browser Terpandu',
    modeBDesc: 'Membuka jendela Chrome untuk login manual (MFA, CAPTCHA, SSO) sambil merekam telemetri.',
    modeBBtn: 'Buka Browser Terpandu',
    modeBBtnBusy: 'Membuka Chrome...',
    liveSessionTitle: 'Perekaman Sesi Aktif',
    liveSessionExploring: 'Crawler otonom sedang menelusuri menu tersisa...',
    liveSessionPassive: 'Perekaman pasif aktif — silakan masuk dan jelajahi halaman di jendela Chrome.',
    autoTraverseBtn: 'Otomasi Jelajah Menu Tersisa',
    finishCompileBtn: 'Selesaikan & Kompilasi Step 01–12',
    safetyGuardLabel: 'Pengaman Lingkungan:',
    safetySandbox: 'SANDBOX / STAGING (Eksplorasi Otonom Diizinkan)',
    safetyProduction: 'PRODUKSI TERDETEKSI (Mode Baca-Saja Aktif)',
    momCardTitle: 'Catatan & Notulen Pemangku Kepentingan',
    activeScopeLabel: 'Cakupan Aktif:',
    entitiesCardTitle: 'Entitas, Aktor & Batasan Bisnis Terekstrak',
    extractedBadge: 'TEREKSTRAK',
    colType: 'Tipe',
    colId: 'ID',
    colStatement: 'Pernyataan / Batasan',
    colExcerpt: 'Kutipan Sumber',
    entitiesTip: 'Pilih baris mana saja untuk membuka Inspektor Kontekstual dan menyunting batasan.',
    errTargetUrlScan: 'Masukkan URL target terlebih dahulu (mis. http://localhost:3000 atau https://app.contoh.id).',
    errTargetUrlAuto: 'Masukkan URL target sebelum menjalankan penjelajahan otonom.',
    errTargetUrlGuided: 'Masukkan URL target sebelum membuka sesi browser terpandu.',
    guidedActiveNotice: 'Sesi browser terpandu aktif. Silakan masuk dan jelajahi fitur di Chrome, lalu pilih "Selesaikan & Kompilasi Step 01–12".',
    guidedFinishNotice: 'Sesi browser terpandu selesai dan state autentikasi telah dikompilasi ke Step 01–12.',
    charsLabel: 'karakter',
    invariantsLabel: 'Invarian',
    rulesUnit: 'Aturan Bisnis',
    contractsUnit: 'Kontrak Validasi',
    greenfieldNameLabel: 'NAMA PROJECT BARU:',
    greenfieldNamePlaceholder: 'mis. Portal Integrasi Vendor v1',
    greenfieldHint: 'Mode Greenfield · Menyusun Spek BA, Arsitektur, DB, API & QA langsung dari Catatan',
  },
  step02: {
    title: '02. Orkestrator Proses & Mesin Arsitektur',
    subtitle: 'Pipeline Proses Multi-Jalur & Simulator Invarian',
    tabOrchestrator: '1. Orkestrator Proses (BPMN & Wireframe)',
    tabArchitecture: '2. Arsitektur C4 (HLA & LLA)',
    tabDfd: '3. Diagram Aliran Data (DFD 0-2 & UU PDP)',
    contractSimulator: 'Simulator Kontrak',
    simulateNominal: 'Simulasi Alur Normal',
    simulateRejection: 'Simulasi Penolakan',
  },
  step03: {
    title: '03. Mesin Spesifikasi BRD, PRD & TSD/TRD',
    subtitle: 'ISO/IEC/IEEE 29148:2018 (StRS / SyRS / TSD) & Deskripsi Desain Perangkat Lunak IEEE 1016',
    tabBrd: '1. Aturan Bisnis (BRD)',
    tabPrd: '2. Kontrak Validasi (PRD)',
    tabTsd: '3. Spesifikasi Teknis (TSD/TRD)',
    tabRawIso: '4. Dokumen ISO Mentah',
    backToOrchestrator: 'Orkestrator Camunda',
    colRuleId: 'ID Aturan',
    colCategory: 'Kategori',
    colStatement: 'Pernyataan Aturan Bisnis (ISO RFC-2119)',
    colKpi: 'Target KPI',
    colSource: 'Sumber Terkait',
    colValId: 'ID Validasi',
    colStoryRef: 'Ref Story',
    colField: 'Kolom & Tipe',
    colConstraint: 'Kontrak Batasan',
    colHttpError: 'HTTP / Kode Galat',
    colUiError: 'Pesan Galat UI Persis',
    scanCodebaseBtn: 'Pindai Basis Kode',
    exportTsdBtn: 'Ekspor TSD (.md)',
    exportSpecBtn: 'Ekspor Spec ISO (.md)',
  },
  step04: {
    title: '04. Matriks Ketertelusuran Kebutuhan (RTM)',
    subtitle: 'Kasus Uji Tersintesis ISO/IEC/IEEE 29119-3 dengan Pengikatan Dua Arah VR-xx',
    modulesLabel: 'Modul:',
    allModules: 'Semua Modul',
    searchPlaceholder: 'Saring skenario, uji, cacat...',
    tabScenarios: '1. Skenario Uji',
    tabCases: '2. Kasus & Hasil Uji',
    tabDefects: '3. Daftar Cacat (Bug)',
    tabUat: '4. Persetujuan E2E & UAT',
    exportCsv: 'Ekspor CSV',
    exportFeature: 'Ekspor .feature',
    exportMarkdown: 'Ekspor Markdown',
    exportDefectMd: 'Ekspor Laporan Cacat (.md)',
    exportDefectCsv: 'Ekspor Cacat CSV',
    colScenarioId: 'ID Skenario',
    colFeatureModule: 'Modul Fitur',
    colCategory: 'Kategori',
    colScenarioCoverage: 'Skenario & Cakupan',
    colLinkedTcs: 'Uji Terkait',
    colBugId: 'ID Cacat',
    colSeverity: 'Keparahan',
    colDefectSteps: 'Cacat & Langkah Reproduksi',
    colExpectedActual: 'Ekspektasi vs Aktual',
    colEvidenceFix: 'Bukti Teknis & Perbaikan',
    noDefectsTitle: 'Nihil Cacat atau Anomali Terdeteksi',
    noDefectsDesc: 'Seluruh endpoint, tabel, validasi, dan konsol berjalan bersih selama pemeriksaan.',
    noMatchingCases: 'Tidak ada kasus uji yang sesuai dengan filter.',
    uatJourneyHeader: 'Alur Bisnis End-to-End',
    uatCriteriaHeader: 'Verifikasi Kriteria Penerimaan',
    uatTesterNotes: 'CATATAN PENGUJI:',
    footerHint: 'Pilih baris skenario atau pengujian untuk memeriksa verifikasi 3-lapisan & Gherkin',
    modulesStat: 'Modul:',
    defectsStat: 'Cacat:',
  },
  step05: {
    title: '05. Penemuan Teknis Quad-Modal Otomatis',
    subtitle: 'Kontrak OpenAPI 3.1, ERD Basis Data, Peta Selektor DOM & Brankas Dekompilasi Bundel',
    tabApi: '1. Kontrak API Ditemukan',
    tabErd: '2. Skema Database ERD',
    tabDom: '3. Peta Selektor DOM',
    tabVault: '4. AST Bundel & Audit Rahasia',
    modeAGit: 'Mode A: Koneksi Git / PR',
    modeBArchive: 'Mode B: Unggah Arsip .ZIP',
    modeCStaging: 'Mode C: URL Langsung / Blind Crawl',
    executeDiscovery: 'Jalankan Penemuan Otomatis',
    launchGuided: 'Buka Browser Terpandu',
    errStagingUrl: 'Masukkan URL staging atau target sebelum membuka browser terpandu.',
  },
  step06: {
    title: '06. Auditor Kesenjangan Spesifikasi vs Kode',
    subtitle: 'Matriks Kesenjangan PRD vs Implementasi & Diff Semantik (Monaco DiffEditor)',
    copyTechDoc: 'Salin Dok Teknis',
    copied: 'Tersalin',
    exportReport: 'Ekspor Laporan',
    searchPlaceholder: 'Saring aturan kesenjangan...',
    rulesMapped: 'Aturan Terpetakan',
    colAuditId: 'ID Audit',
    colVerdict: 'Status Audit',
    colRuleRef: 'Ref Aturan',
    colUserStory: 'User Story',
    colTargetEntity: 'Entitas Target',
    colSeverity: 'Keparahan',
    colTitle: 'Judul Kesenjangan',
  },
  step07: {
    title: '07. Eksekutor Terpadu E2E, API & Beban Sistem',
    subtitle: 'Eksekusi Playwright Fungsional, Probe Kontrak OpenAPI, Uji Beban k6 & Korelasi Bottleneck AST (ISO 29119-4)',
    tabLiveTrace: '1. Aliran Eksekusi Langsung',
    tabScripts: '2. Skrip & Hasil (.spec.ts / .k6.js)',
    tabCiCd: '3. Paket CI/CD',
    gatePass: 'GERBANG RILIS: LAYAK PRODUKSI (SLO TERPENUHI)',
    gateFail: 'GERBANG RILIS: DITAHAN (Bottleneck / Kegagalan)',
    applyFix: 'Terapkan Perbaikan DB',
    runAll: 'Jalankan Semua (E2E + k6)',
    runningE2e: 'Menjalankan E2E & API...',
    runningLoad: 'Uji Beban k6',
    runningAst: 'Mengkorelasi AST...',
    reportsLabel: 'LAPORAN:',
    exportHtml: 'Laporan HTML',
    exportMd: 'Markdown (.md)',
    exportBundle: 'JSON / JUnit',
    kpiFunctional: 'Fungsional E2E & API',
    kpiVus: 'Pengguna Virtual k6',
    kpiThroughput: 'Throughput (RPS)',
    kpiLatency: 'Latensi p(95) SLO',
    kpiErrorRate: 'Tingkat Galat',
    passedLabel: 'Lulus',
    failedLabel: 'Gagal',
    activeVusLabel: 'VU Aktif',
    sloPass: 'SLO LULUS',
    sloFail: 'SLO GAGAL',
  },
  step08: {
    title: '08. Tata Kelola Enterprise, Daftar Risiko & Brankas Merkle',
    subtitle: 'Kepatuhan Multi-Yurisdiksi · Peta Risiko 5x5 · Brankas Audit Merkle',
    tabRegulatory: '1. Kepatuhan Regulasi (UU PDP, POJK, ISO 27001, PCI-DSS)',
    tabRiskVault: '2. Peta Risiko ISO 31000 & Brankas Merkle SOC 2',
    complianceSubtitle: '· Kepatuhan Multi-Yurisdiksi',
    tabScorecard: '1. Kartu Skor Eksekutif',
    tabEvidenceMatrix: '2. Matriks Bukti Kontrol',
    tabSignedBinder: '3. Berkas Audit Tertanda',
    downloadBinder: 'Unduh Berkas',
    riskTitleSuffix: '· Daftar Risiko ISO 31000 & Brankas SOC 2',
    tabHeatmap: 'Peta Risiko 5x5',
    tabSoc2: 'Telemetri SOC 2',
    tabMerkle: 'Brankas Pohon Merkle',
    tabAuditReport: 'Laporan Audit (.md)',
    exportBinder: 'Ekspor Berkas',
  },
  step09: {
    title: '09. Auditor Keamanan & DAST OWASP API Top 10',
    subtitle: 'Pengujian Keamanan Ingress Otomatis, Audit Header & Matriks Kerentanan CORS (OWASP ASVS v4.0 · ISO 27001)',
    subtitleSuffix: '· Penguji DAST OWASP API Top 10',
    tabMatrix: 'Matriks Kerentanan',
    tabHeadersCors: 'Header & CORS',
    tabReport: 'Laporan DAST (.md)',
    runProbe: 'Jalankan Uji DAST OWASP',
    probing: 'Menguji Ingress Target...',
  },
  step10: {
    title: '10. Pembukti Logika Formal & Invarian (Z3 SMT)',
    subtitle: 'Verifikasi Logika Orde-Pertama & Eliminasi Counter-Example (ISO/IEC 29119-2 · SMT-LIB v2)',
    subtitleSuffix: '· Verifikasi Formal Z3',
    tabInvariants: 'Invarian & Pembuktian',
    tabSmtCode: 'Skrip Logika SMT-LIB v2',
    tabSpecDoc: 'Spesifikasi Formal (.md)',
    runProver: 'Jalankan Pembukti Z3',
    solving: 'Memecahkan Bukti...',
    exportSpec: 'Ekspor Spesifikasi',
  },
  step11: {
    title: '11. Dewan Peninjau Arsitektur (Konsensus Delphi ARB)',
    subtitle: 'Sidang Evaluasi Lintas Peran & Segel Persetujuan Tata Kelola Rilis (ISO/IEC/IEEE 42010 ARB)',
    subtitleSuffix: '· Konsensus Dewan ARB',
    tabDebates: 'Diskusi Dewan ARB',
    tabSeals: 'Segel Persetujuan (6/6)',
    tabPacket: 'Paket Persetujuan (.md)',
    conveneArb: 'Sidangkan Dewan ARB',
    convening: 'Mensimulasikan ARB...',
    exportPacket: 'Ekspor Paket',
    verdictLabel: 'Keputusan',
  },
  step12: {
    title: '12. Ringkasan Eksekutif & Library Dokumentasi A–Z',
    subtitle: 'Ringkasan kesiapan Step 01–11 untuk non-teknis, Library 4 Buku A–Z, Kit Integrasi Project Baru & Graf Relasi.',
    readinessLabel: 'Kesiapan',
    exportHtmlPdf: 'Ekspor HTML / PDF',
    exportAzPortal: 'Download Portal Dokumentasi A–Z (.HTML / PDF)',
    saveSnapshot: 'Simpan Snapshot ke Vault',
    savingSnapshot: 'Menyimpan...',
    exportMarkdown: 'Ekspor Markdown',
    tabSummary: '1. Ringkasan Eksekutif (01–11)',
    tabLibrary: '2. Library A–Z (4 Buku)',
    tabIntegration: '3. Kit Integrasi & Kamus Data',
    tabGraph: '4. Graf Teknis & Cypher',
    readinessScoreLabel: 'Skor Kesiapan Rilis:',
    breakdownTitle: 'Ringkasan Verifikasi Siklus Hidup (Step 01–11)',
    stagesUnit: 'Tahapan',
    scopeLabel: 'Cakupan Verifikasi:',
    outcomeLabel: 'Hasil Audit:',
    impactLabel: 'Dampak Bisnis:',
    openStepPrefix: 'Buka',
    guideTitle: 'Direktori & Panduan Pengguna Fitur',
    featuresUnit: 'Fitur',
    controlsLabel: 'Kontrol & Kolom Tersedia:',
    howToUseLabel: 'Panduan Penggunaan:',
    recommendationsTitle: 'Rekomendasi Tindak Lanjut',
    itemsUnit: 'Poin',
    userImpactLabel: 'Dampak Pengguna:',
    actionLabel: 'Saran Tindakan Teknis:',
    previewTab: 'Pembaca Terstruktur',
    markdownTab: 'Sumber Markdown',
    copyReport: 'Salin Laporan',
    stageCol: 'Tahapan',
    statusCol: 'Status',
    outcomeCol: 'Hasil Audit',
    impactCol: 'Dampak Bisnis',
    exportWhitepaper: 'Ekspor Whitepaper',
    regressionCardTitle: 'Perbandingan Regresi vs Snapshot Sebelumnya',
    archPlainTitle: 'Penjelasan Arsitektur As-Is (4 Lapisan)',
    integrationKitTitle: 'Kit Integrasi untuk Project Baru',
    dataDictTitle: 'Master Data Dictionary (Kamus Data)',
    searchDictPlaceholder: 'Saring tabel, kolom, atau arti bisnis...',
    copyBookMd: 'Salin Buku (.md)',
    copyCurl: 'Salin cURL',
    copied: 'Tersalin',
  },
};

interface StudioLocaleContextValue {
  locale: StudioLocale;
  setLocale: (loc: StudioLocale) => void;
  copy: StudioCopy;
}

const StudioLocaleContext = createContext<StudioLocaleContextValue>({
  locale: 'en',
  setLocale: () => {},
  copy: EN_COPY,
});

export function StudioLocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<StudioLocale>('en');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('onespec_studio_locale');
      if (saved === 'en' || saved === 'id') {
        setLocaleState(saved);
        document.documentElement.lang = saved;
      }
    } catch {}
  }, []);

  const setLocale = useCallback((next: StudioLocale) => {
    setLocaleState(next);
    try {
      localStorage.setItem('onespec_studio_locale', next);
      document.documentElement.lang = next;
    } catch {}
  }, []);

  const copy = useMemo(() => (locale === 'id' ? ID_COPY : EN_COPY), [locale]);

  const value = useMemo(() => ({ locale, setLocale, copy }), [locale, setLocale, copy]);

  return <StudioLocaleContext.Provider value={value}>{children}</StudioLocaleContext.Provider>;
}

export function useStudioLocale(): StudioLocaleContextValue {
  return useContext(StudioLocaleContext);
}
