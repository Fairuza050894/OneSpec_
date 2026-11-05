/**
 * OneSpec SDLC Workbench - Unified QA & Performance Report Generator
 * Standards: ISO/IEC/IEEE 29119-3:2022, ISO/IEC/IEEE 29148:2018 & Grafana k6
 */

import type {
  UnifiedRunnerExecutionSummary,
  TestSuiteExecutionTrace,
  K6MetricSummary,
  FunctionalTestCaseResult,
} from '@/types/sdlc';

export interface UnifiedReportData {
  projectName: string;
  projectMode: string;
  sourceIdentifier: string;
  gitRefOrFile: string;
  generatedAt: string;
  executionSummary: UnifiedRunnerExecutionSummary;
}

export class UnifiedReportGenerator {
  private static instance: UnifiedReportGenerator;

  private constructor() {}

  public static getInstance(): UnifiedReportGenerator {
    if (!UnifiedReportGenerator.instance) {
      UnifiedReportGenerator.instance = new UnifiedReportGenerator();
    }
    return UnifiedReportGenerator.instance;
  }

  /**
   * 1. Generate Standalone Self-Contained HTML Report (Dark Desktop Workbench Theme)
   */
  public generateStandaloneHtmlReport(data: UnifiedReportData): string {
    const { executionSummary, projectName, sourceIdentifier, gitRefOrFile, generatedAt } = data;
    const { e2eSummary, k6Summary, functionalResults, executionTrace } = executionSummary;
    const bottleneckStage = executionTrace.stages.find((s) => s.status === 'BOTTLENECK');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>OneSpec SDLC Studio — Unified QA & Performance Report</title>
  <style>
    :root {
      --bg-canvas: #0B0C0E;
      --bg-panel: #111317;
      --bg-header: #16191F;
      --border-hairline: #22262E;
      --text-main: #EDEDED;
      --text-muted: #A1A1A1;
      --text-dim: #707070;
      --blue-accent: #2563EB;
      --green-pass: #10B981;
      --red-fail: #EF4444;
      --amber-warn: #F59E0B;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg-canvas);
      color: var(--text-main);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 13px;
      line-height: 1.5;
      padding: 32px 48px;
    }
    code, pre, .font-mono {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
    .tabular-nums { font-variant-numeric: tabular-nums; }
    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 20px;
      border-bottom: 1px solid var(--border-hairline);
      margin-bottom: 24px;
    }
    .brand-title {
      font-size: 18px;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: var(--text-main);
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px;
      border-radius: 3px;
      font-size: 11px;
      font-weight: 600;
      font-family: ui-monospace, monospace;
    }
    .badge-pass { background: rgba(16, 185, 129, 0.15); color: var(--green-pass); border: 1px solid var(--green-pass); }
    .badge-fail { background: rgba(239, 68, 68, 0.15); color: var(--red-fail); border: 1px solid var(--red-fail); }
    .badge-warn { background: rgba(245, 158, 11, 0.15); color: var(--amber-warn); border: 1px solid var(--amber-warn); }
    .badge-info { background: rgba(37, 99, 235, 0.15); color: #60A5FA; border: 1px solid var(--blue-accent); }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
    .card {
      background: var(--bg-panel);
      border: 1px solid var(--border-hairline);
      border-radius: 4px;
      padding: 16px;
    }
    .card-title {
      font-size: 12px;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .metric-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      border-bottom: 1px solid rgba(255,255,255,0.05);
      font-size: 12px;
    }
    .metric-row:last-child { border-bottom: none; }
    .metric-label { color: var(--text-muted); }
    .metric-val { font-weight: 600; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
      font-size: 12px;
    }
    th {
      background: var(--bg-header);
      color: var(--text-muted);
      text-align: left;
      padding: 8px 12px;
      font-weight: 600;
      border: 1px solid var(--border-hairline);
      font-family: ui-monospace, monospace;
      font-size: 11px;
    }
    td {
      padding: 8px 12px;
      border: 1px solid var(--border-hairline);
      color: var(--text-main);
      background: var(--bg-panel);
    }
    .section-title {
      font-size: 14px;
      font-weight: 700;
      margin: 28px 0 12px 0;
      color: var(--text-main);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .callout-box {
      background: rgba(239, 68, 68, 0.08);
      border: 1px solid var(--red-fail);
      border-radius: 4px;
      padding: 14px 18px;
      margin: 16px 0;
    }
    .callout-title {
      font-weight: 700;
      color: var(--red-fail);
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    pre.code-block {
      background: #060709;
      border: 1px solid var(--border-hairline);
      padding: 12px;
      border-radius: 3px;
      overflow-x: auto;
      font-size: 11px;
      color: #93C5FD;
      margin-top: 8px;
    }
  </style>
</head>
<body>
  <div class="header-bar">
    <div>
      <div class="brand-title">OneSpec SDLC Studio — Standalone Unified QA &amp; Load Report</div>
      <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">
        Project: <strong style="color: var(--text-main);">${projectName}</strong> · Source: <code style="color: #60A5FA;">${sourceIdentifier}</code> · Ref: <code>${gitRefOrFile}</code>
      </div>
    </div>
    <div style="text-align: right;">
      <span class="badge ${bottleneckStage ? 'badge-warn' : 'badge-pass'}">
        VERDICT: ${bottleneckStage ? 'BOTTLENECK DETECTED (REMEDIATION REQUIRED)' : 'READY FOR PRODUCTION'}
      </span>
      <div style="font-size: 11px; color: var(--text-dim); margin-top: 4px;" class="tabular-nums">
        Generated At: ${generatedAt}
      </div>
    </div>
  </div>

  <div class="grid-2">
    <!-- Playwright & Functional E2E Summary -->
    <div class="card">
      <div class="card-title">
        <span>Playwright E2E &amp; API Contract Suite</span>
        <span class="badge badge-info">ISO 29119-3</span>
      </div>
      <div class="metric-row">
        <span class="metric-label">Total Test Cases Synthesized</span>
        <span class="metric-val tabular-nums">${e2eSummary.total}</span>
      </div>
      <div class="metric-row">
        <span class="metric-label">Passed Assertions</span>
        <span class="metric-val tabular-nums" style="color: var(--green-pass);">${e2eSummary.passed}</span>
      </div>
      <div class="metric-row">
        <span class="metric-label">Failed / Bottleneck Scenarios</span>
        <span class="metric-val tabular-nums" style="color: var(--red-fail);">${e2eSummary.failed}</span>
      </div>
      <div class="metric-row">
        <span class="metric-label">E2E Pass Rate</span>
        <span class="metric-val tabular-nums">${e2eSummary.passRatePercent}%</span>
      </div>
    </div>

    <!-- Grafana k6 Load Test Summary -->
    <div class="card">
      <div class="card-title">
        <span>Grafana k6 Load &amp; Stress Metrics</span>
        <span class="badge badge-info">Concurrency Test</span>
      </div>
      <div class="metric-row">
        <span class="metric-label">Active Virtual Users (VUs)</span>
        <span class="metric-val tabular-nums">${k6Summary.vus} VUs (${k6Summary.durationSeconds}s duration)</span>
      </div>
      <div class="metric-row">
        <span class="metric-label">Throughput Rate</span>
        <span class="metric-val tabular-nums">${k6Summary.throughputRps} req/sec (${k6Summary.totalRequests.toLocaleString()} total reqs)</span>
      </div>
      <div class="metric-row">
        <span class="metric-label">Error Rate (http_req_failed)</span>
        <span class="metric-val tabular-nums" style="color: var(--green-pass);">${k6Summary.errorRatePercent.toFixed(2)}% (Target: &lt; 1%)</span>
      </div>
      <div class="metric-row">
        <span class="metric-label">Latency p(95) SLA Threshold</span>
        <span class="metric-val tabular-nums" style="color: ${k6Summary.thresholds.httpReqDurationP95Pass ? 'var(--green-pass)' : 'var(--red-fail)'};">
          ${k6Summary.latency.p95}ms (${k6Summary.thresholds.httpReqDurationP95Pass ? 'PASS &lt; 500ms' : 'BREACH &gt; 500ms'})
        </span>
      </div>
    </div>
  </div>

  ${
    bottleneckStage && bottleneckStage.rootCause
      ? `
  <div class="callout-box">
    <div class="callout-title">
      ⚠ ROOT-CAUSE BOTTLENECK DETECTED UNDER LOAD (${k6Summary.vus} VUs)
    </div>
    <p style="color: var(--text-main); font-size: 12.5px;">
      ${bottleneckStage.rootCause.summary}
    </p>
    <div style="margin-top: 8px; font-size: 11.5px; color: var(--text-muted);">
      Source: <code style="color: #F87171;">${bottleneckStage.rootCause.sourceFile}:${bottleneckStage.rootCause.lineNumber}</code> (${bottleneckStage.rootCause.functionSymbol})
    </div>
    <div style="margin-top: 6px; font-size: 11.5px; color: var(--text-muted);">
      Execution Plan: <code>${bottleneckStage.rootCause.explainPlan}</code>
    </div>
    <div style="margin-top: 10px; font-weight: 600; font-size: 11px; text-transform: uppercase; color: var(--green-pass);">
      Recommended 1-Click Database Remediation DDL:
    </div>
    <pre class="code-block">${bottleneckStage.rootCause.sqlRemediationQuery}</pre>
  </div>
  `
      : ''
  }

  <!-- Section 1: Grafana k6 Detailed Latency Breakdown -->
  <div class="section-title">1. Grafana k6 Latency Percentile Distribution (High-Density)</div>
  <table>
    <thead>
      <tr>
        <th>METRIC</th>
        <th>MIN</th>
        <th>MEDIAN (p50)</th>
        <th>p90</th>
        <th>p95 (SLO &lt; 500ms)</th>
        <th>p99</th>
        <th>MAX</th>
        <th>STATUS</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>http_req_duration</strong></td>
        <td class="tabular-nums font-mono">${k6Summary.latency.min}ms</td>
        <td class="tabular-nums font-mono">${k6Summary.latency.med}ms</td>
        <td class="tabular-nums font-mono">${k6Summary.latency.p90}ms</td>
        <td class="tabular-nums font-mono" style="color: ${k6Summary.thresholds.httpReqDurationP95Pass ? 'var(--green-pass)' : 'var(--red-fail)'}; font-weight: 700;">
          ${k6Summary.latency.p95}ms
        </td>
        <td class="tabular-nums font-mono">${k6Summary.latency.p99}ms</td>
        <td class="tabular-nums font-mono">${k6Summary.latency.max}ms</td>
        <td>
          <span class="badge ${k6Summary.thresholds.httpReqDurationP95Pass ? 'badge-pass' : 'badge-fail'}">
            ${k6Summary.thresholds.httpReqDurationP95Pass ? 'SLO PASS' : 'SLO BREACH'}
          </span>
        </td>
      </tr>
    </tbody>
  </table>

  <!-- Section 2: Functional E2E & API Test Cases (ISO 29119-3) -->
  <div class="section-title">2. Functional E2E &amp; API Contract Test Suite (ISO/IEC/IEEE 29119-3)</div>
  <table>
    <thead>
      <tr>
        <th>TEST ID</th>
        <th>SCENARIO</th>
        <th>NORM REF</th>
        <th>TITLE &amp; DESCRIPTION</th>
        <th>HTTP STATUS</th>
        <th>DURATION</th>
        <th>VERDICT</th>
      </tr>
    </thead>
    <tbody>
      ${functionalResults
        .map(
          (t) => `
        <tr>
          <td class="font-mono"><strong>${t.testId}</strong></td>
          <td><span class="badge badge-info">${t.scenarioType}</span></td>
          <td class="font-mono">${t.ruleRef}</td>
          <td>${t.title}</td>
          <td class="tabular-nums font-mono">${t.httpStatus} (Exp: ${t.expectedHttpStatus})</td>
          <td class="tabular-nums font-mono">${t.durationMs}ms</td>
          <td>
            <span class="badge ${t.verdict === 'PASSED' ? 'badge-pass' : 'badge-fail'}">
              ${t.verdict}
            </span>
          </td>
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>

  <!-- Section 3: 4-Stage Execution Pipeline Trace -->
  <div class="section-title">3. morluto/rea 4-Stage Live Execution Trace Breakdown</div>
  <table>
    <thead>
      <tr>
        <th>STAGE #</th>
        <th>STAGE LABEL</th>
        <th>TYPE</th>
        <th>COMPONENT SOURCE</th>
        <th>LATENCY</th>
        <th>STATUS</th>
      </tr>
    </thead>
    <tbody>
      ${executionTrace.stages
        .map(
          (s) => `
        <tr>
          <td class="font-mono">${s.stageNumber}</td>
          <td><strong>${s.label}</strong></td>
          <td class="font-mono">${s.stageType}</td>
          <td class="font-mono" style="color: #60A5FA;">${s.componentSource}</td>
          <td class="tabular-nums font-mono" style="font-weight: 700; color: ${s.status === 'BOTTLENECK' ? 'var(--red-fail)' : 'var(--green-pass)'};">
            ${s.latencyMs}ms
          </td>
          <td>
            <span class="badge ${s.status === 'BOTTLENECK' ? 'badge-fail' : s.status === 'NOMINAL' ? 'badge-pass' : 'badge-warn'}">
              ${s.status}
            </span>
          </td>
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>

  <div style="margin-top: 40px; padding-top: 16px; border-top: 1px solid var(--border-hairline); font-size: 11px; color: var(--text-dim); display: flex; justify-content: space-between;">
    <span>Standard Compliance: ISO/IEC/IEEE 29148:2018, ISO/IEC/IEEE 29119-3:2022 &amp; Grafana k6</span>
    <span>Generated by OneSpec SDLC Studio Engine</span>
  </div>
</body>
</html>`;
  }

  /**
   * 2. Generate ISO 29119-3 / 29148 Markdown Report (.md)
   */
  public generateMarkdownReport(data: UnifiedReportData): string {
    const { executionSummary, projectName, sourceIdentifier, gitRefOrFile, generatedAt } = data;
    const { e2eSummary, k6Summary, functionalResults, executionTrace } = executionSummary;
    const bottleneckStage = executionTrace.stages.find((s) => s.status === 'BOTTLENECK');

    return `# OneSpec SDLC Studio — Unified QA & Performance Report
**Project:** ${projectName}  
**Source Target:** \`${sourceIdentifier}\` (\`${gitRefOrFile}\`)  
**Generated At:** ${generatedAt}  
**Standards:** ISO/IEC/IEEE 29148:2018 (Requirements) & ISO/IEC/IEEE 29119-3:2022 (Test Documentation)  

---

## 1. Executive Summary & Verdict
- **Overall Verdict:** ${bottleneckStage ? '**BOTTLENECK DETECTED (REMEDIATION REQUIRED)**' : '**READY FOR PRODUCTION**'}
- **Playwright E2E & API Contract:** ${e2eSummary.passed}/${e2eSummary.total} Passed (${e2eSummary.passRatePercent}% pass rate)
- **k6 Load Concurrency:** ${k6Summary.vus} VUs for ${k6Summary.durationSeconds}s
- **Throughput:** ${k6Summary.throughputRps} req/s (${k6Summary.totalRequests.toLocaleString()} requests executed)
- **Error Rate:** ${k6Summary.errorRatePercent.toFixed(2)}% (Target: < 1.00%)
- **Latency p(95):** ${k6Summary.latency.p95}ms (SLO Threshold: < 500ms — ${k6Summary.thresholds.httpReqDurationP95Pass ? 'PASS' : 'BREACH'})

${
  bottleneckStage && bottleneckStage.rootCause
    ? `> **WARNING: Database Performance Bottleneck Detected**  
> **Summary:** ${bottleneckStage.rootCause.summary}  
> **Location:** \`${bottleneckStage.rootCause.sourceFile}:${bottleneckStage.rootCause.lineNumber}\` (\`${bottleneckStage.rootCause.functionSymbol}\`)  
> **Execution Plan:** \`${bottleneckStage.rootCause.explainPlan}\`  
>  
> **Remediation DDL:**  
> \`\`\`sql
> ${bottleneckStage.rootCause.sqlRemediationQuery}
> \`\`\`
`
    : ''
}

---

## 2. Grafana k6 Latency Percentile Distribution

| Metric | Min | Median (p50) | p90 | p95 (SLO < 500ms) | p99 | Max | Verdict |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **http_req_duration** | \`${k6Summary.latency.min}ms\` | \`${k6Summary.latency.med}ms\` | \`${k6Summary.latency.p90}ms\` | **\`${k6Summary.latency.p95}ms\`** | \`${k6Summary.latency.p99}ms\` | \`${k6Summary.latency.max}ms\` | **${k6Summary.thresholds.httpReqDurationP95Pass ? 'PASSED' : 'FAILED'}** |

---

## 3. Functional E2E & API Test Case Results (ISO 29119-3)

| Test ID | Scenario | Norm Ref | Title | HTTP Status | Duration | Verdict |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
${functionalResults
  .map(
    (t) =>
      `| \`${t.testId}\` | \`${t.scenarioType}\` | \`${t.ruleRef}\` | ${t.title} | \`${t.httpStatus}\` (Exp: ${t.expectedHttpStatus}) | \`${t.durationMs}ms\` | **${t.verdict}** |`
  )
  .join('\n')}

---

## 4. morluto/rea 4-Stage Execution Trace

| Stage | Label | Component Source | Observed Latency | Status |
| :--- | :--- | :--- | :--- | :--- |
${executionTrace.stages
  .map(
    (s) =>
      `| ${s.stageNumber} | **${s.label}** | \`${s.componentSource}\` | \`${s.latencyMs}ms\` | \`${s.status}\` |`
  )
  .join('\n')}

---
*Generated by OneSpec SDLC Studio Engine. Compliant with ISO/IEC/IEEE 29119-3:2022.*
`;
  }

  /**
   * 3. Generate JSON Result Bundle with JUnit XML
   */
  public generateJsonBundle(data: UnifiedReportData, junitXml: string): string {
    return JSON.stringify(
      {
        reportMetadata: {
          projectName: data.projectName,
          projectMode: data.projectMode,
          sourceIdentifier: data.sourceIdentifier,
          gitRefOrFile: data.gitRefOrFile,
          generatedAt: data.generatedAt,
          standards: ['ISO/IEC/IEEE 29148:2018', 'ISO/IEC/IEEE 29119-3:2022', 'Grafana k6'],
        },
        executionSummary: data.executionSummary,
        junitXmlPayload: junitXml,
      },
      null,
      2
    );
  }
}

export const unifiedReportGenerator = UnifiedReportGenerator.getInstance();
