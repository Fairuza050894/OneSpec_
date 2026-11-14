'use client';

import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  ShieldAlert,
  ShieldCheck,
  Download,
  Copy,
  Check,
  Lock,
  Layers,
  Flame,
} from 'lucide-react';
import {
  iso31000RiskService,
  type IsoRiskAssessmentSummary,
  type IsoRiskItem,
  type RiskLikelihood,
  type RiskImpact,
  type RiskSeverityLevel,
} from '@/services/iso31000RiskService';
import type {
  DiscoveredApiEndpoint,
  DatabaseErdTable,
  ValidationRuleContract,
  BrdMatrixRow,
  TestSuiteExecutionTrace,
  ExecutionPipelineStage,
} from '@/types/sdlc';
import type { SynthesizedRtmRow } from '@/services/rtmSynthesizer';
import { useStudioLocale } from '@/lib/i18n';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center font-mono text-[11px] text-[#707070] bg-[#0E1015]">
      Loading Monaco Risk Audit Report...
    </div>
  ),
});

interface IsoRiskAuditWorkbenchProps {
  appName?: string;
  targetUrl: string;
  apiEndpoints: DiscoveredApiEndpoint[];
  databaseTables: DatabaseErdTable[];
  validationRules: ValidationRuleContract[];
  businessRules: BrdMatrixRow[];
  rtmRows: SynthesizedRtmRow[];
  initialRiskSummary?: IsoRiskAssessmentSummary;
  executionTraces?: TestSuiteExecutionTrace[];
  pipelineStages?: ExecutionPipelineStage[];
  onAppendLog?: (msg: string) => void;
}

export function IsoRiskAuditWorkbench({
  appName = 'Active Application',
  targetUrl,
  apiEndpoints,
  databaseTables,
  validationRules,
  businessRules,
  rtmRows,
  initialRiskSummary,
  executionTraces,
  pipelineStages,
  onAppendLog,
}: IsoRiskAuditWorkbenchProps) {
  const { copy } = useStudioLocale();
  const [activeSubTab, setActiveSubTab] = useState<'HEATMAP_REGISTER' | 'SOC2_TELEMETRY' | 'MERKLE_EXPLORER' | 'REPORT'>('HEATMAP_REGISTER');
  const [selectedSeverity, setSelectedSeverity] = useState<RiskSeverityLevel | 'ALL'>('ALL');
  const [selectedRisk, setSelectedRisk] = useState<IsoRiskItem | null>(null);
  const [selectedHeatmapCell, setSelectedHeatmapCell] = useState<{ l: RiskLikelihood; i: RiskImpact } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Compute assessment
  const assessment: IsoRiskAssessmentSummary = useMemo(() => {
    if (initialRiskSummary) return initialRiskSummary;
    return iso31000RiskService.assessProjectRisk({
      appName,
      targetUrl,
      apiEndpoints,
      databaseTables,
      validationRules,
      businessRules,
      rtmRows,
      executionTraces,
      pipelineStages,
    });
  }, [appName, targetUrl, apiEndpoints, databaseTables, validationRules, businessRules, rtmRows, executionTraces, pipelineStages]);

  const filteredRisks = useMemo(() => {
    return assessment.risks.filter((r) => {
      if (selectedHeatmapCell) {
        return r.residualLikelihood === selectedHeatmapCell.l && r.residualImpact === selectedHeatmapCell.i;
      }
      if (selectedSeverity !== 'ALL') {
        return r.residualSeverity === selectedSeverity;
      }
      return true;
    });
  }, [assessment.risks, selectedSeverity, selectedHeatmapCell]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const auditReportMarkdown = useMemo(() => {
    return iso31000RiskService.generateAuditReportMarkdown(appName, assessment);
  }, [appName, assessment]);

  const handleDownloadMarkdown = () => {
    const slug = appName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const blob = new Blob([auditReportMarkdown], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ISO31000_SOC2_AUDIT_${slug}.md`;
    link.click();
    URL.revokeObjectURL(url);
    if (onAppendLog) {
      onAppendLog(`[ISO 31000] Exported formal risk register & SOC 2 Merkle report for ${appName}.`);
    }
  };

  // Helper for heatmap cell background
  const getHeatmapColor = (l: number, i: number, count: number) => {
    const score = l * i;
    if (count === 0) {
      if (score >= 15) return 'bg-[#DC2626]/10 text-[#707070] border-[#DC2626]/20';
      if (score >= 10) return 'bg-[#F97316]/10 text-[#707070] border-[#F97316]/20';
      if (score >= 5) return 'bg-[#F59E0B]/10 text-[#707070] border-[#F59E0B]/20';
      return 'bg-[#059669]/10 text-[#707070] border-[#059669]/20';
    }
    if (score >= 15) return 'bg-[#DC2626]/25 text-[#EF4444] border-[#DC2626] font-bold';
    if (score >= 10) return 'bg-[#F97316]/25 text-[#F97316] border-[#F97316] font-bold';
    if (score >= 5) return 'bg-[#F59E0B]/25 text-[#F59E0B] border-[#F59E0B] font-bold';
    return 'bg-[#059669]/25 text-[#10B981] border-[#059669] font-bold';
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#0B0C0E] border border-[#22262E] rounded-[4px] overflow-hidden min-h-0">
      {/* Top Header Toolbar */}
      <div className="h-[40px] min-h-[40px] bg-[#16191F] border-b border-[#22262E] px-4 flex items-center justify-between text-[11px] font-mono shrink-0 select-none">
        <div className="flex items-center gap-2.5 truncate">
          <ShieldAlert className="h-4 w-4 text-[#F97316] shrink-0" />
          <span className="text-[#EDEDED] font-bold uppercase tracking-wide truncate">
            {appName} {copy.step08.riskTitleSuffix}
          </span>
          <span className="badge-tag px-1.5 py-0.2 bg-[#059669]/20 text-[#10B981] font-bold text-[9.5px]">
            SOC 2: {assessment.soc2ComplianceScore}% COMPLIANT
          </span>
          <span className="badge-tag px-1.5 py-0.2 bg-[#2563EB]/20 text-[#3B82F6] font-bold text-[9.5px] truncate max-w-[200px]">
            {assessment.merkleVault.rootHash.slice(0, 18)}...
          </span>
        </div>

        {/* Sub-View Switchers */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center bg-[#0B0C0E] border border-[#22262E] p-0.5 rounded-[3px] text-[11px] font-mono">
            <button
              onClick={() => {
                setActiveSubTab('HEATMAP_REGISTER');
                setSelectedHeatmapCell(null);
              }}
              className={`px-3 py-1 rounded-[2px] transition-colors cursor-pointer ${
                activeSubTab === 'HEATMAP_REGISTER'
                  ? 'bg-[#2563EB] text-white font-bold'
                  : 'text-[#A1A1A1] hover:text-[#EDEDED]'
              }`}
            >
              {copy.step08.tabHeatmap} ({assessment.totalRisks})
            </button>
            <button
              onClick={() => setActiveSubTab('SOC2_TELEMETRY')}
              className={`px-3 py-1 rounded-[2px] transition-colors cursor-pointer ${
                activeSubTab === 'SOC2_TELEMETRY'
                  ? 'bg-[#2563EB] text-white font-bold'
                  : 'text-[#A1A1A1] hover:text-[#EDEDED]'
              }`}
            >
              {copy.step08.tabSoc2} ({assessment.soc2Controls.length})
            </button>
            <button
              onClick={() => setActiveSubTab('MERKLE_EXPLORER')}
              className={`px-3 py-1 rounded-[2px] transition-colors cursor-pointer ${
                activeSubTab === 'MERKLE_EXPLORER'
                  ? 'bg-[#2563EB] text-white font-bold'
                  : 'text-[#A1A1A1] hover:text-[#EDEDED]'
              }`}
            >
              {copy.step08.tabMerkle}
            </button>
            <button
              onClick={() => setActiveSubTab('REPORT')}
              className={`px-3 py-1 rounded-[2px] transition-colors cursor-pointer ${
                activeSubTab === 'REPORT' ? 'bg-[#2563EB] text-white font-bold' : 'text-[#A1A1A1] hover:text-[#EDEDED]'
              }`}
            >
              {copy.step08.tabAuditReport}
            </button>
          </div>

          <div className="h-4 w-px bg-[#22262E] mx-1" />

          <button
            onClick={handleDownloadMarkdown}
            className="px-2.5 py-1 bg-[#22262E] hover:bg-[#2A2E39] text-[#EDEDED] font-mono text-[11px] rounded-[2px] transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Download className="h-3.5 w-3.5 text-[#3B82F6]" />
            <span>{copy.step08.exportBinder}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {/* Top KPI Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 shrink-0 font-mono text-[11px]">
          <div className="p-3 bg-[#111317] border border-[#22262E] rounded-[3px] flex flex-col justify-between">
            <span className="text-[10px] text-[#707070] uppercase font-bold">Inherent Risk</span>
            <span className="text-[18px] font-bold text-[#F97316] tabular-nums">
              {assessment.overallInherentRiskScore} <span className="text-[11px] text-[#707070]">/ 25</span>
            </span>
            <span className="text-[9.5px] text-[#A1A1A1]">Unmitigated Index</span>
          </div>
          <div className="p-3 bg-[#111317] border border-[#22262E] rounded-[3px] flex flex-col justify-between">
            <span className="text-[10px] text-[#707070] uppercase font-bold">Residual Risk</span>
            <span className="text-[18px] font-bold text-[#10B981] tabular-nums">
              {assessment.overallResidualRiskScore} <span className="text-[11px] text-[#707070]">/ 25</span>
            </span>
            <span className="text-[9.5px] text-[#10B981]">Post-Mitigation</span>
          </div>
          <div className="p-3 bg-[#111317] border border-[#22262E] rounded-[3px] flex flex-col justify-between">
            <span className="text-[10px] text-[#707070] uppercase font-bold">Extreme Risks</span>
            <span className="text-[18px] font-bold text-[#EF4444] tabular-nums">
              {assessment.extremeCount}
            </span>
            <span className="text-[9.5px] text-[#A1A1A1]">Score &gt;= 15</span>
          </div>
          <div className="p-3 bg-[#111317] border border-[#22262E] rounded-[3px] flex flex-col justify-between">
            <span className="text-[10px] text-[#707070] uppercase font-bold">High Risks</span>
            <span className="text-[18px] font-bold text-[#F97316] tabular-nums">
              {assessment.highCount}
            </span>
            <span className="text-[9.5px] text-[#A1A1A1]">Score 10 - 14</span>
          </div>
          <div className="p-3 bg-[#111317] border border-[#22262E] rounded-[3px] flex flex-col justify-between">
            <span className="text-[10px] text-[#707070] uppercase font-bold">SOC 2 Score</span>
            <span className="text-[18px] font-bold text-[#3B82F6] tabular-nums">
              {assessment.soc2ComplianceScore}%
            </span>
            <span className="text-[9.5px] text-[#A1A1A1]">Active Controls</span>
          </div>
          <div className="p-3 bg-[#111317] border border-[#22262E] rounded-[3px] flex flex-col justify-between">
            <span className="text-[10px] text-[#707070] uppercase font-bold">Merkle Leaves</span>
            <span className="text-[18px] font-bold text-[#EDEDED] tabular-nums">
              {assessment.merkleVault.totalLeaves}
            </span>
            <span className="text-[9.5px] text-[#10B981]">Sealed Evidence</span>
          </div>
        </div>

        {/* =========================================================================
         * SUB-VIEW 1: 5x5 HEATMAP & REGISTER
         * ========================================================================= */}
        {activeSubTab === 'HEATMAP_REGISTER' && (
          <div className="space-y-4 font-mono text-[11px]">
            {/* Heatmap & Filter Strip */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* 5x5 Matrix Heatmap Card (col-span-5) */}
              <div className="lg:col-span-5 p-4 bg-[#111317] border border-[#22262E] rounded-[3px] space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-[#22262E]">
                  <div className="flex items-center gap-2">
                    <Flame className="h-4 w-4 text-[#F97316]" />
                    <span className="text-[#EDEDED] font-bold text-[12px]">
                      ISO 31000 5x5 Residual Risk Heatmap
                    </span>
                  </div>
                  {selectedHeatmapCell && (
                    <button
                      onClick={() => setSelectedHeatmapCell(null)}
                      className="text-[10px] text-[#3B82F6] hover:underline cursor-pointer"
                    >
                      Clear Cell Filter
                    </button>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-[#707070] uppercase font-bold px-1">
                    <span>Likelihood (L) $\downarrow$ vs Impact (I) $\rightarrow$</span>
                    <span>1: Minor $\to$ 5: Catastrophic</span>
                  </div>

                  <div className="grid grid-cols-5 gap-1.5 text-center">
                    {([5, 4, 3, 2, 1] as RiskLikelihood[]).map((l) => (
                      <React.Fragment key={`row-${l}`}>
                        {([1, 2, 3, 4, 5] as RiskImpact[]).map((i) => {
                          const cellRisks = assessment.risks.filter(
                            (r) => r.residualLikelihood === l && r.residualImpact === i
                          );
                          const isSelected = selectedHeatmapCell?.l === l && selectedHeatmapCell?.i === i;
                          return (
                            <button
                              key={`cell-${l}-${i}`}
                              onClick={() => {
                                if (isSelected) setSelectedHeatmapCell(null);
                                else setSelectedHeatmapCell({ l, i });
                              }}
                              className={`h-11 border rounded-[2px] flex flex-col items-center justify-center transition-all cursor-pointer ${getHeatmapColor(
                                l,
                                i,
                                cellRisks.length
                              )} ${isSelected ? 'ring-2 ring-white scale-105 z-10' : ''}`}
                            >
                              <span className="text-[10px]">{l}x{i}</span>
                              <span className="text-[13px] font-bold tabular-nums">
                                {cellRisks.length > 0 ? cellRisks.length : '·'}
                              </span>
                            </button>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-[#707070] pt-1">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#059669]"></span> Low (1-4)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#F59E0B]"></span> Medium (5-9)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#F97316]"></span> High (10-14)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#EF4444]"></span> Extreme (15-25)
                  </span>
                </div>
              </div>

              {/* Severity Filter and Selected Risk Inspector (col-span-7) */}
              <div className="lg:col-span-7 p-4 bg-[#111317] border border-[#22262E] rounded-[3px] flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#22262E]">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-[#10B981]" />
                    <span className="text-[#EDEDED] font-bold text-[12px]">
                      Risk Register Filters &amp; Treatment
                    </span>
                  </div>

                  <div className="flex items-center gap-1 bg-[#0B0C0E] border border-[#22262E] p-0.5 rounded-[3px] text-[10.5px]">
                    {(['ALL', 'EXTREME', 'HIGH', 'MEDIUM', 'LOW'] as const).map((sev) => (
                      <button
                        key={sev}
                        onClick={() => {
                          setSelectedSeverity(sev);
                          setSelectedHeatmapCell(null);
                        }}
                        className={`px-2 py-0.5 rounded-[2px] transition-colors cursor-pointer ${
                          selectedSeverity === sev
                            ? 'bg-[#2563EB] text-white font-bold'
                            : 'text-[#A1A1A1] hover:text-[#EDEDED]'
                        }`}
                      >
                        {sev}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedRisk ? (
                  <div className="p-3 bg-[#0B0C0E] border border-[#22262E] rounded-[3px] space-y-2">
                    <div className="flex items-center justify-between pb-1 border-b border-[#22262E]">
                      <span className="font-bold text-[#EDEDED] text-[12px]">
                        [{selectedRisk.id}] {selectedRisk.title}
                      </span>
                      <span
                        className={`badge-tag px-1.5 py-0.2 rounded font-bold text-[9.5px] ${
                          selectedRisk.residualSeverity === 'EXTREME'
                            ? 'bg-[#DC2626]/20 text-[#EF4444]'
                            : selectedRisk.residualSeverity === 'HIGH'
                            ? 'bg-[#F97316]/20 text-[#F97316]'
                            : 'bg-[#059669]/20 text-[#10B981]'
                        }`}
                      >
                        Residual: {selectedRisk.residualScore} ({selectedRisk.residualSeverity})
                      </span>
                    </div>

                    <p className="text-[#A1A1A1] text-[10.5px] font-sans">{selectedRisk.threatDescription}</p>

                    <div className="space-y-1 pt-1">
                      <span className="text-[10px] text-[#10B981] uppercase font-bold block">
                        ISO 31000 Mitigation Treatment Control:
                      </span>
                      <div className="p-2 bg-[#16191F] border border-[#22262E] rounded-[2px] text-[#EDEDED] text-[10.5px]">
                        {selectedRisk.mitigationControl}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-[10px] text-[#707070] pt-1">
                      <span>Affected: {selectedRisk.affectedAssets.join(', ') || 'Global Application'}</span>
                      {selectedRisk.linkedSdlcArtifacts.testCaseId && (
                        <span>Linked TC: <code className="text-[#3B82F6]">{selectedRisk.linkedSdlcArtifacts.testCaseId}</code></span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center p-6 text-center text-[11px] text-[#707070] border border-dashed border-[#22262E] rounded-[3px]">
                    Select any risk row or heatmap cell to inspect technical threat parameters &amp; mitigation treatment controls.
                  </div>
                )}
              </div>
            </div>

            {/* Risk Register Table */}
            <div className="border border-[#22262E] rounded-[3px] overflow-hidden">
              <table className="w-full border-collapse text-left text-[11px]">
                <thead className="bg-[#16191F] text-[#707070] border-b border-[#22262E] uppercase text-[10px]">
                  <tr>
                    <th className="p-2.5 w-28 border-r border-[#22262E]">Risk ID</th>
                    <th className="p-2.5 w-44 border-r border-[#22262E]">Category</th>
                    <th className="p-2.5 border-r border-[#22262E]">Threat Scenario Description</th>
                    <th className="p-2.5 w-32 border-r border-[#22262E]">Inherent (L x I)</th>
                    <th className="p-2.5 w-32 border-r border-[#22262E]">Residual (L x I)</th>
                    <th className="p-2.5 w-32">Treatment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#22262E] bg-[#0B0C0E]">
                  {filteredRisks.map((r) => (
                    <tr
                      key={r.id}
                      onClick={() => setSelectedRisk(r)}
                      className={`hover:bg-[#16191F] cursor-pointer transition-colors ${
                        selectedRisk?.id === r.id ? 'bg-[#16191F]' : ''
                      }`}
                    >
                      <td className="p-2.5 font-bold text-[#3B82F6] border-r border-[#22262E]">{r.id}</td>
                      <td className="p-2.5 font-bold text-[#EDEDED] border-r border-[#22262E]">{r.category}</td>
                      <td className="p-2.5 border-r border-[#22262E] text-[#A1A1A1] text-[10.5px]">
                        <div className="text-[#EDEDED] font-semibold">{r.title}</div>
                        <div className="truncate max-w-[450px]">{r.threatDescription}</div>
                      </td>
                      <td className="p-2.5 border-r border-[#22262E]">
                        <span className="text-[#F97316] font-bold tabular-nums">
                          {r.inherentLikelihood}x{r.inherentImpact} = {r.inherentScore}
                        </span>
                        <span className="text-[9.5px] text-[#707070] ml-1">({r.inherentSeverity})</span>
                      </td>
                      <td className="p-2.5 border-r border-[#22262E]">
                        <span
                          className={`badge-tag px-1.5 py-0.2 rounded font-bold text-[9.5px] ${
                            r.residualSeverity === 'EXTREME'
                              ? 'bg-[#DC2626]/20 text-[#EF4444]'
                              : r.residualSeverity === 'HIGH'
                              ? 'bg-[#F97316]/20 text-[#F97316]'
                              : 'bg-[#059669]/20 text-[#10B981]'
                          }`}
                        >
                          {r.residualLikelihood}x{r.residualImpact} = {r.residualScore}
                        </span>
                      </td>
                      <td className="p-2.5">
                        <span
                          className={`badge-tag px-1.5 py-0.2 rounded font-bold text-[9px] ${
                            r.status === 'MITIGATED'
                              ? 'bg-[#059669]/20 text-[#10B981]'
                              : r.status === 'ACTION_REQUIRED'
                              ? 'bg-[#DC2626]/20 text-[#EF4444]'
                              : 'bg-[#D97706]/20 text-[#F59E0B]'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================================
         * SUB-VIEW 2: SOC 2 TELEMETRY
         * ========================================================================= */}
        {activeSubTab === 'SOC2_TELEMETRY' && (
          <div className="space-y-4 font-mono text-[11px]">
            <div className="p-4 bg-[#111317] border border-[#22262E] rounded-[3px] space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-[#22262E]">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-[#3B82F6]" />
                  <span className="text-[#EDEDED] font-bold text-[12px]">
                    AICPA SOC 2 Type II Continuous Control Monitoring (CCM)
                  </span>
                </div>
                <span className="badge-tag px-2 py-0.5 bg-[#059669]/20 text-[#10B981] font-bold text-[10px]">
                  {assessment.soc2ComplianceScore}% CONTROLS VERIFIED
                </span>
              </div>
              <p className="text-[11px] text-[#A1A1A1] font-sans">
                Continuous automated audit telemetry mapping code-level assertions, authentication boundaries, and encryption primitives directly to AICPA SOC 2 Trust Services Criteria (Security CC6.1 - CC6.8, Processing Integrity CC7.1, CC8.1).
              </p>
            </div>

            <div className="border border-[#22262E] rounded-[3px] overflow-hidden">
              <table className="w-full border-collapse text-left text-[11px]">
                <thead className="bg-[#16191F] text-[#707070] border-b border-[#22262E] uppercase text-[10px]">
                  <tr>
                    <th className="p-2.5 w-24 border-r border-[#22262E]">Criteria ID</th>
                    <th className="p-2.5 w-44 border-r border-[#22262E]">Category</th>
                    <th className="p-2.5 w-64 border-r border-[#22262E]">Trust Control Title</th>
                    <th className="p-2.5 w-32 border-r border-[#22262E]">Audit Telemetry</th>
                    <th className="p-2.5">Technical Audit Evidence Proof</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#22262E] bg-[#0B0C0E]">
                  {assessment.soc2Controls.map((c) => (
                    <tr key={c.criteriaId} className="hover:bg-[#16191F] transition-colors">
                      <td className="p-2.5 font-bold text-[#3B82F6] border-r border-[#22262E]">{c.criteriaId}</td>
                      <td className="p-2.5 font-bold text-[#EDEDED] border-r border-[#22262E]">{c.category}</td>
                      <td className="p-2.5 border-r border-[#22262E] font-semibold text-[#EDEDED]">{c.title}</td>
                      <td className="p-2.5 border-r border-[#22262E]">
                        <span
                          className={`badge-tag px-1.5 py-0.2 rounded font-bold text-[9px] ${
                            c.auditTelemetryStatus === 'COMPLIANT_ACTIVE'
                              ? 'bg-[#059669]/20 text-[#10B981]'
                              : 'bg-[#DC2626]/20 text-[#EF4444]'
                          }`}
                        >
                          {c.auditTelemetryStatus}
                        </span>
                      </td>
                      <td className="p-2.5 font-mono text-[10.5px] text-[#A1A1A1]">{c.evidenceProof}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================================
         * SUB-VIEW 3: MERKLE TREE EXPLORER
         * ========================================================================= */}
        {activeSubTab === 'MERKLE_EXPLORER' && (
          <div className="space-y-4 font-mono text-[11px]">
            {/* Merkle Root Header Card */}
            <div className="p-4 bg-[#111317] border border-[#22262E] rounded-[3px] space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#22262E]">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-[#3B82F6]" />
                  <span className="text-[#EDEDED] font-bold text-[12px]">
                    Binary Merkle Tree Cryptographic Audit Vault
                  </span>
                </div>
                <button
                  onClick={() => handleCopy(assessment.merkleVault.rootHash, 'root')}
                  className="px-2.5 py-1 bg-[#0B0C0E] border border-[#22262E] hover:border-[#3B82F6] text-[#EDEDED] rounded-[2px] transition-colors cursor-pointer flex items-center gap-1"
                >
                  {copiedKey === 'root' ? <Check className="h-3 w-3 text-[#10B981]" /> : <Copy className="h-3 w-3" />}
                  <span>Copy Root Hash</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-2.5 bg-[#0B0C0E] border border-[#22262E] rounded-[2px]">
                  <span className="text-[10px] text-[#707070] uppercase font-bold block">Root Hash Signature:</span>
                  <span className="text-[#10B981] font-bold text-[11px] break-all">
                    {assessment.merkleVault.rootHash}
                  </span>
                </div>
                <div className="p-2.5 bg-[#0B0C0E] border border-[#22262E] rounded-[2px]">
                  <span className="text-[10px] text-[#707070] uppercase font-bold block">Total Sealed Leaves:</span>
                  <span className="text-[#EDEDED] font-bold text-[14px] tabular-nums">
                    {assessment.merkleVault.totalLeaves} Leaves
                  </span>
                </div>
                <div className="p-2.5 bg-[#0B0C0E] border border-[#22262E] rounded-[2px]">
                  <span className="text-[10px] text-[#707070] uppercase font-bold block">Hashing Algorithm:</span>
                  <span className="text-[#3B82F6] font-semibold text-[10.5px]">
                    {assessment.merkleVault.algorithm}
                  </span>
                </div>
              </div>
            </div>

            {/* Leaves List */}
            <div className="border border-[#22262E] rounded-[3px] overflow-hidden">
              <div className="p-2.5 bg-[#16191F] text-[#EDEDED] font-bold border-b border-[#22262E] flex items-center justify-between text-[11px]">
                <span>Sealed Evidence Leaves ({assessment.merkleVault.leafHashes.length})</span>
                <span className="text-[10px] text-[#707070]">RFC 6962 SHA-256 Digest</span>
              </div>
              <div className="p-3 bg-[#0B0C0E] space-y-1.5 max-h-[400px] overflow-y-auto">
                {assessment.merkleVault.leafHashes.map((hash, idx) => (
                  <div
                    key={`leaf-${idx}`}
                    className="p-2 bg-[#111317] border border-[#22262E] rounded-[2px] flex items-center justify-between hover:border-[#3B82F6] transition-colors"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-[#707070] text-[10px] w-6 text-right font-bold">#{idx + 1}</span>
                      <span className="text-[#38BDF8] font-mono text-[10.5px] truncate">{hash}</span>
                    </div>
                    <button
                      onClick={() => handleCopy(hash, `leaf-${idx}`)}
                      className="text-[#707070] hover:text-[#EDEDED] transition-colors p-1"
                    >
                      {copiedKey === `leaf-${idx}` ? <Check className="h-3 w-3 text-[#10B981]" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
         * SUB-VIEW 4: AUDIT REPORT EXPORT
         * ========================================================================= */}
        {activeSubTab === 'REPORT' && (
          <div className="bg-[#111317] border border-[#22262E] rounded-[3px] flex flex-col overflow-hidden min-h-0">
            <div className="h-[38px] bg-[#16191F] border-b border-[#22262E] px-4 flex items-center justify-between text-[11px] font-mono shrink-0 select-none">
              <span className="font-bold text-[#EDEDED]">
                ISO31000_SOC2_AUDIT_{(appName || 'APP').replace(/[^a-zA-Z0-9]/g, '_')}.md
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(auditReportMarkdown, 'rpt')}
                  className="px-2.5 py-1 bg-[#22262E] hover:bg-[#2A2E39] text-[#EDEDED] rounded-[2px] transition-colors cursor-pointer flex items-center gap-1"
                >
                  {copiedKey === 'rpt' ? <Check className="h-3 w-3 text-[#10B981]" /> : <Copy className="h-3 w-3" />}
                  <span>Copy Markdown</span>
                </button>
                <button
                  onClick={handleDownloadMarkdown}
                  className="px-2.5 py-1 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold rounded-[2px] transition-colors cursor-pointer flex items-center gap-1"
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
                value={auditReportMarkdown}
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
