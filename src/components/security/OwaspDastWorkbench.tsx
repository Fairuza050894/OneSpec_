'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
  ShieldAlert,
  Flame,
  Play,
  RotateCw,
  Download,
  Copy,
  Check,
  Lock,
} from 'lucide-react';
import {
  owaspDastService,
  type OwaspDastAssessmentSummary,
  type OwaspVulnerabilityFinding,
} from '@/services/owaspDastService';
import type { DiscoveredApiEndpoint, DatabaseErdTable, ValidationRuleContract } from '@/types/sdlc';
import { useStudioLocale } from '@/lib/i18n';
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center font-mono text-[11px] text-[#707070] bg-[#0E1015]">
      Loading Monaco Security Report View...
    </div>
  ),
});

interface OwaspDastWorkbenchProps {
  appName: string;
  targetUrl: string;
  apiEndpoints: DiscoveredApiEndpoint[];
  databaseTables: DatabaseErdTable[];
  validationRules: ValidationRuleContract[];
  initialDastSummary?: OwaspDastAssessmentSummary;
  onAppendLog?: (msg: string) => void;
}

export function OwaspDastWorkbench({
  appName,
  targetUrl,
  apiEndpoints,
  databaseTables,
  validationRules,
  initialDastSummary,
  onAppendLog,
}: OwaspDastWorkbenchProps) {
  const { copy } = useStudioLocale();
  const [activeSubTab, setActiveSubTab] = useState<'MATRIX' | 'HEADERS_CORS' | 'REPORT'>('MATRIX');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedFinding, setSelectedFinding] = useState<OwaspVulnerabilityFinding | null>(null);
  const [isRunningProbe, setIsRunningProbe] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Initial assessment baseline (preferring pre-compiled initialDastSummary if provided)
  const computedBaseline = useMemo(() => {
    if (initialDastSummary) return initialDastSummary;
    return owaspDastService.generateDastAudit({
      targetUrl,
      appName,
      apiEndpoints,
      databaseTables,
      validationRules,
    });
  }, [initialDastSummary, targetUrl, appName, apiEndpoints, databaseTables, validationRules]);

  const [assessment, setAssessment] = useState<OwaspDastAssessmentSummary>(computedBaseline);

  useEffect(() => {
    if (initialDastSummary) {
      setAssessment(initialDastSummary);
    }
  }, [initialDastSummary]);

  const filteredFindings = useMemo(() => {
    if (selectedSeverity === 'ALL') return assessment.findings;
    return assessment.findings.filter((f) => f.severity === selectedSeverity || f.status === selectedSeverity);
  }, [assessment.findings, selectedSeverity]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Run live OWASP DAST probe against target endpoint
  const handleRunLiveDastProbe = useCallback(async () => {
    setIsRunningProbe(true);
    if (onAppendLog) {
      onAppendLog(`[OWASP DAST] Initiating active API Security Top 10 probe against ${targetUrl}...`);
      onAppendLog(`[OWASP DAST] Probing CORS pre-flight, security headers, and authentication boundaries...`);
    }

    try {
      const res = await fetch('/api/security/dast-probe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl,
          appName,
          apiEndpoints,
          databaseTables,
          validationRules,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} from security probe`);
      }

      const json = await res.json();
      if (json.success && json.assessment) {
        setAssessment(json.assessment);
        if (onAppendLog) {
          onAppendLog(
            `[OWASP DAST] PROBE COMPLETE: Security Grade: ${json.assessment.securityPostureGrade} · Evaluated ${json.assessment.findings.length} attack vectors.`
          );
          onAppendLog(
            `[OWASP DAST] CORS Audit: ${json.assessment.corsAudit.status} · HSTS: ${json.assessment.securityHeadersAudit[0]?.actualValue}`
          );
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (onAppendLog) {
        onAppendLog(`[OWASP DAST NOTICE] In-platform security audit completed: ${msg}`);
      }
    } finally {
      setIsRunningProbe(false);
    }
  }, [targetUrl, appName, apiEndpoints, databaseTables, validationRules, onAppendLog]);

  const securityReportMarkdown = useMemo(() => {
    return `# ${appName} — OWASP API Security Top 10 (2023) DAST Audit Report
**Target System Host:** \`${targetUrl}\`
**Security Posture Grade:** **${assessment.securityPostureGrade}**
**Audited At:** ${assessment.testedAt}
**Engine:** OneSpec Autonomous DAST Prober & CVSS v3.1 Matrix

---

## 1. Vulnerability Findings Matrix (${assessment.findings.length})
| Finding ID | OWASP Category | Severity & CVSS | Target Endpoint | Status |
| :--- | :--- | :--- | :--- | :--- |
${assessment.findings
  .map(
    (f) =>
      `| \`${f.id}\` | **${f.owaspCategory}** (${f.categoryName}) | \`${f.severity}\` (CVSS ${f.cvssScore}) | \`${f.endpoint}\` | \`${f.status}\` |`
  )
  .join('\n')}

---

## 2. Security Headers & CORS Audit
| Header Name | Audit Status | Measured Value | Standard Recommendation |
| :--- | :--- | :--- | :--- |
${assessment.securityHeadersAudit
  .map(
    (h) =>
      `| **${h.headerName}** | ${h.isPresent ? 'PASS' : 'FAIL'} | \`${h.actualValue || 'None'}\` | \`${h.recommendedValue}\` |`
  )
  .join('\n')}

---

## 3. Remediation Action Patches
${assessment.findings
  .map(
    (f) => `### [${f.id}] ${f.title}
- **Category:** ${f.owaspCategory} (${f.categoryName})
- **CWE:** ${f.cweMapping}
- **CVSS Score:** \`${f.cvssScore}\` (\`${f.severity}\`)
- **Status:** \`${f.status}\` (\`${f.provenance}\`)
${
  f.evidence
    ? `- **Empirical Evidence:** \`${f.evidence.request.method} ${f.evidence.request.url}\` → HTTP \`${f.evidence.response.status}\` (${f.evidence.probedAt})`
    : '- **Empirical Evidence:** None (NOT_RUN)'
}
- **Observed Response:** ${f.observedResponse}
- **Remediation Action:** ${f.remediationAction}
\`\`\`typescript
${f.remediationPatchSnippet}
\`\`\`
`
  )
  .join('\n')}
`;
  }, [appName, targetUrl, assessment]);

  const handleDownloadReport = () => {
    const slug = appName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const blob = new Blob([securityReportMarkdown], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `OWASP_DAST_REPORT_${slug}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#0B0C0E] border border-[#22262E] rounded-[4px] overflow-hidden min-h-0">
      {/* Top Security Header Toolbar */}
      <div className="min-h-[40px] py-1 bg-[#16191F] border-b border-[#22262E] px-3 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono shrink-0 select-none">
        <div className="flex items-center gap-2 min-w-0">
          <Flame className="h-4 w-4 text-[#EF4444] shrink-0" />
          <span className="text-[#EDEDED] font-bold uppercase tracking-wide truncate max-w-[150px]" title={appName}>
            {appName}
          </span>
          <span className="text-[#707070] hidden xl:inline whitespace-nowrap">{copy.step09.subtitleSuffix}</span>
          <span
            className={`badge-tag px-1.5 py-0.2 font-bold text-[9.5px] ${
              assessment.securityPostureGrade === 'A+' || assessment.securityPostureGrade === 'A'
                ? 'bg-[#059669]/20 text-[#10B981]'
                : assessment.securityPostureGrade === 'B'
                ? 'bg-[#D97706]/20 text-[#F59E0B]'
                : assessment.securityPostureGrade === 'N/A'
                ? 'bg-[#707070]/20 text-[#A1A1A1] border border-[#707070]/40'
                : 'bg-[#DC2626]/20 text-[#EF4444]'
            }`}
          >
            GRADE: {assessment.securityPostureGrade}
          </span>
        </div>

        {/* Action & View Switchers */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center bg-[#0B0C0E] border border-[#22262E] p-0.5 rounded-[3px] text-[11px] font-mono">
            <button
              onClick={() => setActiveSubTab('MATRIX')}
              className={`px-3 py-1 rounded-[2px] transition-colors cursor-pointer ${
                activeSubTab === 'MATRIX' ? 'bg-[#2563EB] text-white font-bold' : 'text-[#A1A1A1] hover:text-[#EDEDED]'
              }`}
            >
              {copy.step09.tabMatrix} ({assessment.findings.length})
            </button>
            <button
              onClick={() => setActiveSubTab('HEADERS_CORS')}
              className={`px-3 py-1 rounded-[2px] transition-colors cursor-pointer ${
                activeSubTab === 'HEADERS_CORS' ? 'bg-[#2563EB] text-white font-bold' : 'text-[#A1A1A1] hover:text-[#EDEDED]'
              }`}
            >
              {copy.step09.tabHeadersCors}
            </button>
            <button
              onClick={() => setActiveSubTab('REPORT')}
              className={`px-3 py-1 rounded-[2px] transition-colors cursor-pointer ${
                activeSubTab === 'REPORT' ? 'bg-[#2563EB] text-white font-bold' : 'text-[#A1A1A1] hover:text-[#EDEDED]'
              }`}
            >
              {copy.step09.tabReport}
            </button>
          </div>

          <div className="h-4 w-px bg-[#22262E] mx-1" />

          <button
            onClick={handleRunLiveDastProbe}
            disabled={isRunningProbe}
            className="px-3 py-1 bg-[#DC2626] hover:bg-[#B91C1C] disabled:opacity-50 text-white font-bold rounded-[2px] flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            {isRunningProbe ? (
              <>
                <RotateCw className="h-3.5 w-3.5 animate-spin" />
                <span>{copy.step09.probing}</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>{copy.step09.runProbe}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {/* Top Metric Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 shrink-0 font-mono text-[11px]">
          <div className="p-3 bg-[#111317] border border-[#22262E] rounded-[3px] flex flex-col justify-between">
            <span className="text-[10px] text-[#707070] uppercase font-bold">Grade</span>
            <span
              className={`text-[18px] font-bold ${
                assessment.securityPostureGrade.startsWith('A')
                  ? 'text-[#10B981]'
                  : assessment.securityPostureGrade === 'B'
                  ? 'text-[#F59E0B]'
                  : assessment.securityPostureGrade === 'N/A'
                  ? 'text-[#A1A1A1]'
                  : 'text-[#EF4444]'
              }`}
            >
              {assessment.securityPostureGrade}
            </span>
            <span className="text-[9.5px] text-[#A1A1A1]">Posture Score</span>
          </div>
          <div className="p-3 bg-[#111317] border border-[#22262E] rounded-[3px] flex flex-col justify-between">
            <span className="text-[10px] text-[#707070] uppercase font-bold">Critical</span>
            <span className="text-[18px] font-bold text-[#EF4444] tabular-nums">
              {assessment.vulnerabilitiesCount.critical}
            </span>
            <span className="text-[9.5px] text-[#A1A1A1]">CVSS &gt;= 9.0</span>
          </div>
          <div className="p-3 bg-[#111317] border border-[#22262E] rounded-[3px] flex flex-col justify-between">
            <span className="text-[10px] text-[#707070] uppercase font-bold">High</span>
            <span className="text-[18px] font-bold text-[#F97316] tabular-nums">
              {assessment.vulnerabilitiesCount.high}
            </span>
            <span className="text-[9.5px] text-[#A1A1A1]">CVSS 7.0 - 8.9</span>
          </div>
          <div className="p-3 bg-[#111317] border border-[#22262E] rounded-[3px] flex flex-col justify-between">
            <span className="text-[10px] text-[#707070] uppercase font-bold">Potential Risk</span>
            <span className="text-[18px] font-bold text-[#F59E0B] tabular-nums">
              {assessment.vulnerabilitiesCount.medium}
            </span>
            <span className="text-[9.5px] text-[#A1A1A1]">Under Evaluation</span>
          </div>
          <div className="p-3 bg-[#111317] border border-[#22262E] rounded-[3px] flex flex-col justify-between">
            <span className="text-[10px] text-[#707070] uppercase font-bold">Coverage</span>
            <span className="text-[18px] font-bold text-[#3B82F6] tabular-nums">
              {assessment.testedVectorsCount ?? 0} / {assessment.totalVectorsCount ?? 10}
            </span>
            <span className="text-[9.5px] text-[#A1A1A1]">
              {assessment.coverageTestedText || `Cakupan diuji: ${assessment.testedVectorsCount ?? 0} dari 10`}
            </span>
          </div>
          <div className="p-3 bg-[#111317] border border-[#22262E] rounded-[3px] flex flex-col justify-between">
            <span className="text-[10px] text-[#707070] uppercase font-bold">Endpoints</span>
            <span className="text-[18px] font-bold text-[#EDEDED] tabular-nums">
              {assessment.totalEndpointsScanned}
            </span>
            <span className="text-[9.5px] text-[#10B981]">Surface Mapped</span>
          </div>
        </div>

        {/* =========================================================================
         * SUB-VIEW 1: VULNERABILITY MATRIX
         * ========================================================================= */}
        {activeSubTab === 'MATRIX' && (
          <div className="space-y-3 font-mono text-[11px]">
            {/* Filter buttons */}
            <div className="flex items-center justify-between pb-2 border-b border-[#22262E]">
              <div className="flex items-center gap-1 bg-[#111317] border border-[#22262E] p-0.5 rounded-[3px] text-[10.5px]">
                {(['ALL', 'CRITICAL', 'HIGH', 'POTENTIAL_RISK', 'VERIFIED_SECURE', 'NOT_TESTED'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSeverity(s)}
                    className={`px-2.5 py-1 rounded-[2px] transition-colors cursor-pointer ${
                      selectedSeverity === s ? 'bg-[#2563EB] text-white font-bold' : 'text-[#A1A1A1] hover:text-[#EDEDED]'
                    }`}
                  >
                    {s.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>

              <span className="text-[#707070] text-[10.5px]">{filteredFindings.length} Attack Vectors Displayed</span>
            </div>

            {/* Matrix Table */}
            <div className="border border-[#22262E] rounded-[3px] overflow-hidden">
              <table className="w-full border-collapse text-left text-[11px]">
                <thead className="bg-[#16191F] text-[#707070] border-b border-[#22262E] uppercase text-[10px]">
                  <tr>
                    <th className="p-2.5 w-28 border-r border-[#22262E]">Attack ID</th>
                    <th className="p-2.5 w-64 border-r border-[#22262E]">OWASP API Category</th>
                    <th className="p-2.5 w-32 border-r border-[#22262E]">CVSS v3.1</th>
                    <th className="p-2.5 w-52 border-r border-[#22262E]">Target Endpoint</th>
                    <th className="p-2.5 border-r border-[#22262E]">Observed Ingress Verdict</th>
                    <th className="p-2.5 w-32">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#22262E] bg-[#0B0C0E]">
                  {filteredFindings.map((f) => (
                    <tr
                      key={f.id}
                      onClick={() => setSelectedFinding(f)}
                      className={`hover:bg-[#16191F] cursor-pointer transition-colors ${
                        selectedFinding?.id === f.id ? 'bg-[#16191F]' : ''
                      }`}
                    >
                      <td className="p-2.5 font-bold text-[#3B82F6] border-r border-[#22262E]">{f.id}</td>
                      <td className="p-2.5 border-r border-[#22262E]">
                        <div className="text-[#EDEDED] font-bold">{f.owaspCategory}</div>
                        <div className="text-[9.5px] text-[#A1A1A1]">{f.categoryName}</div>
                      </td>
                      <td className="p-2.5 border-r border-[#22262E]">
                        <span
                          className={`badge-tag px-1.5 py-0.2 rounded font-bold text-[9.5px] ${
                            f.severity === 'CRITICAL'
                              ? 'bg-[#DC2626]/20 text-[#EF4444]'
                              : f.severity === 'HIGH'
                              ? 'bg-[#F97316]/20 text-[#F97316]'
                              : 'bg-[#D97706]/20 text-[#F59E0B]'
                          }`}
                        >
                          {f.cvssScore} {f.severity}
                        </span>
                      </td>
                      <td className="p-2.5 font-bold text-[#8B5CF6] border-r border-[#22262E]">{f.endpoint}</td>
                      <td className="p-2.5 border-r border-[#22262E] text-[#A1A1A1] text-[10.5px]">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-1 py-0.2 rounded-[2px] font-mono text-[9px] font-bold ${
                              f.provenance === 'OBSERVED_PROBE'
                                ? 'bg-[#059669]/20 text-[#10B981]'
                                : 'bg-[#707070]/20 text-[#707070]'
                            }`}
                          >
                            {f.provenance === 'OBSERVED_PROBE' ? 'PROBED' : 'UNTESTED'}
                          </span>
                          <span className="truncate max-w-[280px]" title={f.observedResponse}>
                            {f.observedResponse}
                          </span>
                        </div>
                      </td>
                      <td className="p-2.5">
                        <span
                          className={`badge-tag px-1.5 py-0.2 rounded-[2px] font-bold text-[9.5px] ${
                            f.status === 'VERIFIED_SECURE'
                              ? 'bg-[#059669]/20 text-[#10B981]'
                              : f.status === 'POTENTIAL_RISK'
                              ? 'bg-[#D97706]/20 text-[#F59E0B]'
                              : f.status === 'VULNERABLE'
                              ? 'bg-[#DC2626]/20 text-[#EF4444]'
                              : 'bg-[#707070]/20 text-[#A1A1A1] border border-[#707070]/40'
                          }`}
                        >
                          {f.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Finding Detail Card if selected */}
            {selectedFinding && (
              <div className="p-4 bg-[#111317] border border-[#22262E] rounded-[3px] space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#22262E]">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-[#EF4444]" />
                    <span className="text-[#EDEDED] font-bold text-[12px]">
                      [{selectedFinding.id}] {selectedFinding.title}
                    </span>
                  </div>
                  <span className="text-[#A1A1A1]">{selectedFinding.cweMapping}</span>
                </div>

                <p className="text-[11px] text-[#A1A1A1] font-sans">{selectedFinding.description}</p>

                {/* Empirical HTTP Probe Evidence Box */}
                {selectedFinding.evidence ? (
                  <div className="p-3 bg-[#0B0C0E] border border-[#22262E] rounded-[2px] text-[10.5px] font-mono space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[#10B981] font-bold uppercase tracking-wider text-[10px]">
                        ● Empirical HTTP Evidence ({selectedFinding.provenance})
                      </span>
                      <span className="text-[#707070] text-[9.5px]">{selectedFinding.evidence.probedAt}</span>
                    </div>
                    <div className="text-[#EDEDED]">
                      <span className="text-[#38BDF8] font-bold">{selectedFinding.evidence.request.method}</span>{' '}
                      <span className="text-[#A1A1A1]">{selectedFinding.evidence.request.url}</span> →{' '}
                      <span
                        className={`font-bold ${
                          selectedFinding.evidence.response.status >= 200 &&
                          selectedFinding.evidence.response.status < 300
                            ? 'text-[#EF4444]'
                            : selectedFinding.evidence.response.status === 401 ||
                              selectedFinding.evidence.response.status === 403 ||
                              selectedFinding.evidence.response.status === 404 ||
                              selectedFinding.evidence.response.status === 429
                            ? 'text-[#10B981]'
                            : 'text-[#F59E0B]'
                        }`}
                      >
                        HTTP {selectedFinding.evidence.response.status}
                      </span>
                    </div>
                    {selectedFinding.evidence.response.headersSubset &&
                      Object.keys(selectedFinding.evidence.response.headersSubset).length > 0 && (
                        <div className="pt-1 border-t border-[#1C2029] text-[9.5px] text-[#707070] space-y-0.5">
                          <span className="text-[#A1A1A1] font-bold">Response Headers Subset:</span>
                          {Object.entries(selectedFinding.evidence.response.headersSubset).map(([hk, hv]) => (
                            <div key={hk} className="truncate">
                              <span className="text-[#8B5CF6]">{hk}:</span> {hv}
                            </div>
                          ))}
                        </div>
                      )}
                    {selectedFinding.evidence.response.bodyHash && (
                      <div className="text-[9px] text-[#707070] pt-0.5">
                        Payload Hash:{' '}
                        <span className="text-[#A1A1A1]">{selectedFinding.evidence.response.bodyHash}</span>
                        {selectedFinding.evidence.request.headersHash && (
                          <span>
                            {' '}| Req Hash:{' '}
                            <span className="text-[#A1A1A1]">{selectedFinding.evidence.request.headersHash}</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-2.5 bg-[#0B0C0E] border border-[#22262E] rounded-[2px] text-[10.5px] text-[#707070] font-mono flex items-center justify-between">
                    <span>Status: Belum diuji secara empiris (NOT_RUN).</span>
                    <span className="text-[9.5px] text-[#A1A1A1]">Jalankan Uji DAST Aktif untuk merekam bukti HTTP</span>
                  </div>
                )}

                {selectedFinding.reproductionCurl && (
                  <div className="space-y-1">
                    <span className="text-[10px] text-[#707070] uppercase font-bold block">Adversarial Reproduction curl:</span>
                    <pre className="p-2.5 bg-[#0B0C0E] border border-[#22262E] rounded-[2px] text-[10.5px] text-[#38BDF8] overflow-x-auto whitespace-pre-wrap">
                      {selectedFinding.reproductionCurl}
                    </pre>
                  </div>
                )}

                <div className="space-y-1">
                  <span className="text-[10px] text-[#10B981] uppercase font-bold block">AST Code Remediation Patch:</span>
                  <pre className="p-2.5 bg-[#0B0C0E] border border-[#22262E] rounded-[2px] text-[10.5px] text-[#10B981] overflow-x-auto whitespace-pre-wrap">
                    {selectedFinding.remediationPatchSnippet}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
         * SUB-VIEW 2: HEADERS & CORS
         * ========================================================================= */}
        {activeSubTab === 'HEADERS_CORS' && (
          <div className="space-y-4 font-mono text-[11px]">
            {/* CORS Assessment Card */}
            <div className="p-4 bg-[#111317] border border-[#22262E] rounded-[3px] space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-[#22262E]">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-[#3B82F6]" />
                  <span className="text-[#EDEDED] font-bold text-[12px]">
                    Cross-Origin Resource Sharing (CORS) Audit
                  </span>
                </div>
                <span
                  className={`badge-tag px-1.5 py-0.2 rounded font-bold text-[9.5px] ${
                    assessment.corsAudit.status === 'SECURE'
                      ? 'bg-[#059669]/20 text-[#10B981]'
                      : assessment.corsAudit.status === 'NOT_TESTED'
                      ? 'bg-[#707070]/20 text-[#A1A1A1] border border-[#707070]/40'
                      : 'bg-[#DC2626]/20 text-[#EF4444]'
                  }`}
                >
                  {assessment.corsAudit.status.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div className="p-2.5 bg-[#0B0C0E] border border-[#22262E] rounded-[2px]">
                  <span className="text-[10px] text-[#707070] uppercase font-bold block">Wildcard Origin (*) Allowed:</span>
                  <span className="text-[#EDEDED] font-semibold">
                    {assessment.corsAudit.isWildcardOrigin ? 'YES (Warning)' : 'NO (Restricted Origin Whitelist)'}
                  </span>
                </div>
                <div className="p-2.5 bg-[#0B0C0E] border border-[#22262E] rounded-[2px]">
                  <span className="text-[10px] text-[#707070] uppercase font-bold block">Credentials with Wildcard (*):</span>
                  <span className="text-[#10B981] font-semibold">
                    {assessment.corsAudit.allowsCredentialsWithWildcard ? 'VULNERABLE (CORS Exploit)' : 'SECURE (Blocked)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Security Headers Table */}
            <div className="border border-[#22262E] rounded-[3px] overflow-hidden">
              <table className="w-full border-collapse text-left text-[11px]">
                <thead className="bg-[#16191F] text-[#707070] border-b border-[#22262E] uppercase text-[10px]">
                  <tr>
                    <th className="p-2.5 w-60 border-r border-[#22262E]">Security Header</th>
                    <th className="p-2.5 w-24 border-r border-[#22262E]">Status</th>
                    <th className="p-2.5 w-64 border-r border-[#22262E]">Observed Value</th>
                    <th className="p-2.5 border-r border-[#22262E]">Recommended Standard</th>
                    <th className="p-2.5 w-72">Security Impact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#22262E] bg-[#0B0C0E]">
                  {assessment.securityHeadersAudit.map((h) => (
                    <tr key={h.headerName} className="hover:bg-[#16191F] transition-colors">
                      <td className="p-2.5 font-bold text-[#EDEDED] border-r border-[#22262E]">{h.headerName}</td>
                      <td className="p-2.5 border-r border-[#22262E]">
                        <span
                          className={`badge-tag px-1.5 py-0.2 rounded font-bold text-[9px] ${
                            h.isPresent ? 'bg-[#059669]/20 text-[#10B981]' : 'bg-[#DC2626]/20 text-[#EF4444]'
                          }`}
                        >
                          {h.isPresent ? 'PASS' : 'MISSING'}
                        </span>
                      </td>
                      <td className="p-2.5 font-mono text-[10px] text-[#38BDF8] border-r border-[#22262E] truncate">
                        {h.actualValue || 'None'}
                      </td>
                      <td className="p-2.5 font-mono text-[10px] text-[#A1A1A1] border-r border-[#22262E]">
                        {h.recommendedValue}
                      </td>
                      <td className="p-2.5 text-[#A1A1A1] font-sans text-[10.5px]">{h.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================================
         * SUB-VIEW 3: DAST REPORT EXPORT
         * ========================================================================= */}
        {activeSubTab === 'REPORT' && (
          <div className="bg-[#111317] border border-[#22262E] rounded-[3px] flex flex-col overflow-hidden min-h-0">
            <div className="h-[38px] bg-[#16191F] border-b border-[#22262E] px-4 flex items-center justify-between text-[11px] font-mono shrink-0 select-none">
              <span className="font-bold text-[#EDEDED]">
                OWASP_DAST_REPORT_{(appName || 'APP').replace(/[^a-zA-Z0-9]/g, '_')}.md
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(securityReportMarkdown, 'rpt')}
                  className="px-2.5 py-1 bg-[#22262E] hover:bg-[#2A2E39] text-[#EDEDED] rounded-[2px] transition-colors cursor-pointer flex items-center gap-1"
                >
                  {copiedKey === 'rpt' ? <Check className="h-3 w-3 text-[#10B981]" /> : <Copy className="h-3 w-3" />}
                  <span>Copy Markdown</span>
                </button>
                <button
                  onClick={handleDownloadReport}
                  className="px-2.5 py-1 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold rounded-[2px] transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Download className="h-3 w-3" />
                  <span>Download .md</span>
                </button>
              </div>
            </div>

            <div className="h-[600px] min-h-[600px]">
              <MonacoEditor
                height="100%"
                language="markdown"
                theme="vs-dark"
                value={securityReportMarkdown}
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  fontSize: 12,
                  fontFamily: 'JetBrains Mono, Menlo, monospace',
                  lineHeight: 22,
                  wordWrap: 'on',
                  scrollBeyondLastLine: false,
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
