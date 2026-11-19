'use client';

import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  ShieldCheck,
  FileText,
  Download,
  Copy,
  Check,
  Printer,
  Lock,
  Key,
} from 'lucide-react';
import {
  complianceBinderService,
  type ComplianceAssessmentInput,
  type ComplianceAssessmentResult,
  type ComplianceControlItem,
  type RegulatoryFramework,
} from '@/services/complianceBinderService';
import type {
  DiscoveredApiEndpoint,
  DatabaseErdTable,
  ValidationRuleContract,
  BrdMatrixRow,
  TestSuiteExecutionTrace,
} from '@/types/sdlc';
import type { SynthesizedRtmRow } from '@/services/rtmSynthesizer';
import { useStudioLocale } from '@/lib/i18n';
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center font-mono text-[11px] text-[#707070] bg-[#0E1015]">
      Loading Monaco Compliance Binder View...
    </div>
  ),
});

interface ComplianceBinderWorkbenchProps {
  input?: ComplianceAssessmentInput;
  initialAssessment?: ComplianceAssessmentResult;
  targetUrl?: string;
  appName?: string;
  apiEndpoints?: DiscoveredApiEndpoint[];
  databaseTables?: DatabaseErdTable[];
  validationRules?: ValidationRuleContract[];
  businessRules?: BrdMatrixRow[];
  rtmRows?: SynthesizedRtmRow[];
  executionTraces?: TestSuiteExecutionTrace[];
  onAppendLog?: (msg: string) => void;
}

export function ComplianceBinderWorkbench(props: ComplianceBinderWorkbenchProps) {
  const { copy } = useStudioLocale();
  const [activeTab, setActiveTab] = useState<'SCORECARD' | 'MATRIX' | 'SIGNED_BINDER'>('SCORECARD');
  const [selectedFramework, setSelectedFramework] = useState<RegulatoryFramework | 'ALL'>('ALL');
  const [selectedControl, setSelectedControl] = useState<ComplianceControlItem | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [binderViewMode, setBinderViewMode] = useState<'FORMAL_DOC' | 'MARKDOWN'>('FORMAL_DOC');

  const computedInput: ComplianceAssessmentInput = useMemo(() => {
    if (props.input) return props.input;
    return {
      targetUrl: props.targetUrl || 'http://localhost:3000',
      appName: props.appName || 'Active Project',
      apiEndpoints: props.apiEndpoints || [],
      databaseTables: props.databaseTables || [],
      validationRules: props.validationRules || [],
      businessRules: props.businessRules || [],
      rtmRows: props.rtmRows || [],
      executionTraces: props.executionTraces,
    };
  }, [props]);

  // Perform factual regulatory assessment
  const assessment: ComplianceAssessmentResult = useMemo(() => {
    if (props.initialAssessment) return props.initialAssessment;
    return complianceBinderService.assessCompliance(computedInput);
  }, [props.initialAssessment, computedInput]);
  const { scorecard, controls, generatedAuditBinderMarkdown } = assessment;

  const filteredControls = useMemo(() => {
    if (selectedFramework === 'ALL') return controls;
    return controls.filter((c) => c.framework === selectedFramework);
  }, [controls, selectedFramework]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownloadMarkdown = () => {
    const slug = (computedInput.appName || 'Regulatory').toLowerCase().replace(/[^a-z0-9]/g, '_');
    const blob = new Blob([generatedAuditBinderMarkdown], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `COMPLIANCE_BINDER_${slug}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#0B0C0E] border border-[#22262E] rounded-[4px] overflow-hidden min-h-0">
      {/* Top Regulatory Header Toolbar */}
      <div className="min-h-[40px] py-1 bg-[#16191F] border-b border-[#22262E] px-3 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono shrink-0 select-none">
        <div className="flex items-center gap-2 min-w-0">
          <ShieldCheck className="h-4 w-4 text-[#10B981] shrink-0" />
          <span className="text-[#EDEDED] font-bold uppercase tracking-wide truncate max-w-[150px]" title={computedInput.appName}>
            {computedInput.appName}
          </span>
          <span className="text-[#707070] hidden xl:inline whitespace-nowrap">{copy.step08.complianceSubtitle}</span>
          <span className="badge-tag px-1.5 py-0.2 bg-[#059669]/20 text-[#10B981] font-bold text-[9.5px] whitespace-nowrap">
            {scorecard.overallComplianceRate}% COMPLIANT
          </span>
        </div>

        {/* View Switcher Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center bg-[#0B0C0E] border border-[#22262E] p-0.5 rounded-[3px] text-[11px] font-mono">
            <button
              onClick={() => setActiveTab('SCORECARD')}
              className={`px-3 py-1 rounded-[2px] transition-colors cursor-pointer ${
                activeTab === 'SCORECARD' ? 'bg-[#2563EB] text-white font-bold' : 'text-[#A1A1A1] hover:text-[#EDEDED]'
              }`}
            >
              {copy.step08.tabScorecard}
            </button>
            <button
              onClick={() => setActiveTab('MATRIX')}
              className={`px-3 py-1 rounded-[2px] transition-colors cursor-pointer ${
                activeTab === 'MATRIX' ? 'bg-[#2563EB] text-white font-bold' : 'text-[#A1A1A1] hover:text-[#EDEDED]'
              }`}
            >
              {copy.step08.tabEvidenceMatrix} ({controls.length})
            </button>
            <button
              onClick={() => setActiveTab('SIGNED_BINDER')}
              className={`px-3 py-1 rounded-[2px] transition-colors cursor-pointer ${
                activeTab === 'SIGNED_BINDER' ? 'bg-[#2563EB] text-white font-bold' : 'text-[#A1A1A1] hover:text-[#EDEDED]'
              }`}
            >
              {copy.step08.tabSignedBinder}
            </button>
          </div>

          <div className="h-4 w-px bg-[#22262E] mx-1" />

          <button
            onClick={handleDownloadMarkdown}
            className="flex items-center gap-1 px-2.5 py-1 bg-[#111317] border border-[#22262E] hover:border-[#3B82F6] text-[#EDEDED] rounded-[2px] cursor-pointer transition-colors"
            title="Download Formal Regulatory Compliance Binder"
          >
            <Download className="h-3 w-3 text-[#3B82F6]" />
            <span className="hidden sm:inline">{copy.step08.downloadBinder}</span>
          </button>
        </div>
      </div>

      {/* Main Content Pane */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {/* =========================================================================
         * SUB-VIEW 1: EXECUTIVE COMPLIANCE SCORECARD
         * ========================================================================= */}
        {activeTab === 'SCORECARD' && (
          <div className="space-y-4 font-mono text-[11px]">
            {/* 4 Multi-Jurisdiction Framework Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {Object.entries(scorecard.frameworkSummary).map(([key, fw]) => (
                <div
                  key={key}
                  onClick={() => {
                    setSelectedFramework(key as RegulatoryFramework);
                    setActiveTab('MATRIX');
                  }}
                  className="p-3.5 bg-[#111317] border border-[#22262E] hover:border-[#3B82F6] rounded-[3px] space-y-2 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#707070] uppercase font-bold truncate">{key}</span>
                    <span className="text-[#3B82F6] font-bold text-[11px] tabular-nums">
                      {fw.passed} dari {fw.total} kontrol
                    </span>
                  </div>
                  <div className="text-[12px] font-sans font-bold text-[#EDEDED] truncate">{fw.name}</div>
                  <div className="pt-1 border-t border-[#22262E]/60 text-[10px] text-[#A1A1A1] space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span>Cakupan Dinilai:</span>
                      <strong className="text-[#10B981] tabular-nums">
                        {fw.passed} dari {fw.total} kontrol berlaku
                      </strong>
                    </div>
                    {key === 'ISO_27001' && (
                      <div className="text-[9px] text-[#707070] leading-tight">
                        (2 kontrol teknis SDLC A.8 dari 93 kontrol ISO 27001)
                      </div>
                    )}
                    {key === 'PCI_DSS' && (
                      <div className="text-[9px] text-[#707070] leading-tight">
                        (2 kontrol web &amp; sesi dari standar PCI-DSS)
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* PII & Data Sovereignty Card (UU PDP No. 27/2022) */}
            <div className="p-4 bg-[#111317] border border-[#22262E] rounded-[3px] space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#22262E]">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-[#F59E0B]" />
                  <span className="text-[#EDEDED] font-bold text-[12px]">
                    UU PDP No. 27/2022 Data Sovereignty &amp; PII Exposure Audit
                  </span>
                </div>
                <span className="badge-tag px-1.5 py-0.2 bg-[#F59E0B]/20 text-[#F59E0B] font-bold text-[9.5px]">
                  {scorecard.piiExposureAudit.piiFieldsDetected.length} PII ATTRIBUTES SCANNED
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 bg-[#0B0C0E] border border-[#22262E] rounded-[2px] space-y-1">
                  <span className="text-[10px] text-[#707070] uppercase font-bold block">Detected PII Attributes:</span>
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {scorecard.piiExposureAudit.piiFieldsDetected.length > 0 ? (
                      scorecard.piiExposureAudit.piiFieldsDetected.map((p) => (
                        <span key={p} className="px-1.5 py-0.5 bg-[#16191F] border border-[#22262E] text-[#38BDF8] rounded-[2px] break-all max-w-full">
                          {p}
                        </span>
                      ))
                    ) : (
                      <span className="text-[#10B981]">Zero unprotected PII fields</span>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-[#0B0C0E] border border-[#22262E] rounded-[2px] space-y-1">
                  <span className="text-[10px] text-[#707070] uppercase font-bold block">Database Storage Tables:</span>
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {scorecard.piiExposureAudit.piiStorageTables.map((t) => (
                      <span key={t} className="px-1.5 py-0.2 bg-[#16191F] border border-[#22262E] text-[#F59E0B] rounded-[2px]">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-[#0B0C0E] border border-[#22262E] rounded-[2px] space-y-1">
                  <span className="text-[10px] text-[#707070] uppercase font-bold block">Public Ingress Exposure:</span>
                  <div className="text-[11px] font-semibold pt-0.5">
                    {scorecard.piiExposureAudit.unprotectedPiiEndpoints.length === 0 ? (
                      <span className="text-[#10B981]">100% Protected via Ingress Auth Gate</span>
                    ) : (
                      <span className="text-[#EF4444]">Unauthenticated routes handling PII</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Cryptographic Tamper-Evident Integrity Seal */}
            <div className="p-4 bg-[#111317] border border-[#22262E] rounded-[3px] space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-[#22262E]">
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-[#3B82F6]" />
                  <span className="text-[#EDEDED] font-bold">Cryptographic Integrity Seal &amp; Non-Repudiation Proof</span>
                </div>
                <span className="text-[10px] text-[#707070]">POJK 11 / ISO 27001 Sealed</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                <div className="p-2.5 bg-[#0B0C0E] border border-[#22262E] rounded-[2px]">
                  <span className="text-[9.5px] text-[#707070] uppercase font-bold block">Seal Algorithm</span>
                  <span className="text-[#EDEDED] text-[11px] font-semibold">{scorecard.auditCryptographicSignature.algorithm}</span>
                </div>
                <div className="p-2.5 bg-[#0B0C0E] border border-[#22262E] rounded-[2px]">
                  <span className="text-[9.5px] text-[#707070] uppercase font-bold block">Timestamp</span>
                  <span className="text-[#EDEDED] text-[11px] font-semibold">{scorecard.auditCryptographicSignature.timestamp}</span>
                </div>
                <div className="p-2.5 bg-[#0B0C0E] border border-[#22262E] rounded-[2px]">
                  <span className="text-[9.5px] text-[#707070] uppercase font-bold block">SHA-256 Digest</span>
                  <span className="text-[#38BDF8] text-[10.5px] break-all">{scorecard.auditCryptographicSignature.digestSha256}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
         * SUB-VIEW 2: REGULATORY CONTROL EVIDENCE MATRIX
         * ========================================================================= */}
        {activeTab === 'MATRIX' && (
          <div className="space-y-3 font-mono text-[11px]">
            {/* Filter toolbar */}
            <div className="flex items-center justify-between pb-2 border-b border-[#22262E]">
              <div className="flex items-center gap-1 bg-[#111317] border border-[#22262E] p-0.5 rounded-[3px] text-[10.5px]">
                {(['ALL', 'UU_PDP', 'POJK_BI', 'ISO_27001', 'PCI_DSS'] as const).map((fw) => (
                  <button
                    key={fw}
                    onClick={() => setSelectedFramework(fw)}
                    className={`px-2.5 py-1 rounded-[2px] transition-colors cursor-pointer ${
                      selectedFramework === fw ? 'bg-[#2563EB] text-white font-bold' : 'text-[#A1A1A1] hover:text-[#EDEDED]'
                    }`}
                  >
                    {fw === 'ALL' ? 'All Frameworks' : fw.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>

              <span className="text-[#707070] text-[10.5px]">{filteredControls.length} Controls Displayed</span>
            </div>

            {/* Matrix Table */}
            <div className="border border-[#22262E] rounded-[3px] overflow-hidden">
              <table className="w-full border-collapse text-left text-[11px]">
                <thead className="bg-[#16191F] text-[#707070] border-b border-[#22262E] uppercase text-[10px]">
                  <tr>
                    <th className="p-2.5 w-24 border-r border-[#22262E]">Control ID</th>
                    <th className="p-2.5 w-60 border-r border-[#22262E]">Clause Reference</th>
                    <th className="p-2.5 w-72 border-r border-[#22262E]">Regulatory Title</th>
                    <th className="p-2.5 border-r border-[#22262E]">Technical Audit Proof</th>
                    <th className="p-2.5 w-32">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#22262E] bg-[#0B0C0E]">
                  {filteredControls.map((c) => (
                    <tr
                      key={c.controlId}
                      onClick={() => setSelectedControl(c)}
                      className={`hover:bg-[#16191F] cursor-pointer transition-colors ${
                        selectedControl?.controlId === c.controlId ? 'bg-[#16191F]' : ''
                      }`}
                    >
                      <td className="p-2.5 font-bold text-[#3B82F6] border-r border-[#22262E]">{c.controlId}</td>
                      <td className="p-2.5 border-r border-[#22262E] text-[#EDEDED] font-semibold">{c.clauseReference}</td>
                      <td className="p-2.5 border-r border-[#22262E] text-[#A1A1A1]">{c.title}</td>
                      <td className="p-2.5 border-r border-[#22262E] text-[#EDEDED] font-mono text-[10.5px]">
                        {c.technicalProof}
                      </td>
                      <td className="p-2.5">
                        <span
                          className={`badge-tag px-1.5 py-0.2 rounded-[2px] font-bold text-[9.5px] ${
                            c.evidenceStatus === 'VERIFIED_COMPLIANT'
                              ? 'bg-[#059669]/20 text-[#10B981]'
                              : c.evidenceStatus === 'PARTIALLY_SATISFIED'
                              ? 'bg-[#D97706]/20 text-[#F59E0B]'
                              : 'bg-[#DC2626]/20 text-[#EF4444]'
                          }`}
                        >
                          {c.evidenceStatus.replace(/_/g, ' ')}
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
         * SUB-VIEW 3: SIGNED AUDIT BINDER (FORMAL DOCUMENT & MARKDOWN)
         * ========================================================================= */}
        {activeTab === 'SIGNED_BINDER' && (
          <div className="bg-[#111317] border border-[#22262E] rounded-[3px] flex flex-col overflow-hidden min-h-0">
            <div className="h-[38px] bg-[#16191F] border-b border-[#22262E] px-4 flex items-center justify-between text-[11px] font-mono shrink-0 select-none">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#3B82F6]" />
                <span className="font-bold text-[#EDEDED]">
                  COMPLIANCE_BINDER_{(computedInput.appName || 'APP').replace(/[^a-zA-Z0-9]/g, '_')}.md
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center bg-[#0B0C0E] border border-[#22262E] p-0.5 rounded-[2px] text-[10px]">
                  <button
                    onClick={() => setBinderViewMode('FORMAL_DOC')}
                    className={`px-2.5 py-1 rounded-[2px] transition-colors cursor-pointer ${
                      binderViewMode === 'FORMAL_DOC' ? 'bg-[#2563EB] text-white font-bold' : 'text-[#707070] hover:text-[#EDEDED]'
                    }`}
                  >
                    Formal Document View
                  </button>
                  <button
                    onClick={() => setBinderViewMode('MARKDOWN')}
                    className={`px-2.5 py-1 rounded-[2px] transition-colors cursor-pointer ${
                      binderViewMode === 'MARKDOWN' ? 'bg-[#2563EB] text-white font-bold' : 'text-[#707070] hover:text-[#EDEDED]'
                    }`}
                  >
                    Raw Markdown Spec
                  </button>
                </div>

                <div className="h-4 w-px bg-[#22262E] mx-1" />

                <button
                  onClick={handlePrint}
                  className="px-2.5 py-1 bg-[#111317] border border-[#22262E] hover:border-[#3B82F6] text-[#EDEDED] rounded-[2px] transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Printer className="h-3 w-3 text-[#A1A1A1]" />
                  <span>Print / Save as PDF</span>
                </button>

                <button
                  onClick={() => handleCopy(generatedAuditBinderMarkdown, 'md')}
                  className="px-2.5 py-1 bg-[#22262E] hover:bg-[#2A2E39] text-[#EDEDED] rounded-[2px] transition-colors cursor-pointer flex items-center gap-1"
                >
                  {copiedKey === 'md' ? <Check className="h-3 w-3 text-[#10B981]" /> : <Copy className="h-3 w-3" />}
                  <span>Copy</span>
                </button>
              </div>
            </div>

            {binderViewMode === 'FORMAL_DOC' ? (
              <div className="p-8 max-w-4xl mx-auto w-full space-y-6 bg-[#0B0C0E] text-[#EDEDED] font-sans min-h-[600px] overflow-y-auto">
                <div className="border-b border-[#22262E] pb-4 space-y-2">
                  <div className="font-mono text-[11px] text-[#10B981] font-bold">
                    OFFICIAL MULTI-JURISDICTION AUDIT EVIDENCE BINDER
                  </div>
                  <h1 className="text-[24px] font-bold text-[#EDEDED]">
                    {computedInput.appName} — Regulatory Compliance &amp; Technical Evidence Report
                  </h1>
                  <div className="font-mono text-[10.5px] text-[#A1A1A1]">
                    Audited Target: <code className="text-[#3B82F6]">{computedInput.targetUrl}</code> · Seal: {scorecard.auditCryptographicSignature.digestSha256}
                  </div>
                </div>

                {/* Scorecard table */}
                <div className="space-y-2 font-mono text-[11px]">
                  <div className="font-bold text-[#EDEDED] text-[13px]">1.0 Executive Compliance Scorecard</div>
                  <table className="w-full border border-[#22262E] rounded-[2px] text-left">
                    <thead className="bg-[#16191F] text-[#707070]">
                      <tr>
                        <th className="p-2 border-r border-[#22262E]">Regulatory Framework</th>
                        <th className="p-2 border-r border-[#22262E]">Jurisdiction Scope</th>
                        <th className="p-2 border-r border-[#22262E]">Cakupan Kontrol Dinilai</th>
                        <th className="p-2">Status Kesesuaian Teruji</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#22262E] bg-[#111317]">
                      {Object.entries(scorecard.frameworkSummary).map(([key, fw]) => (
                        <tr key={fw.name}>
                          <td className="p-2 font-bold text-[#EDEDED] border-r border-[#22262E]">
                            <div>{fw.name}</div>
                            {key === 'ISO_27001' && (
                              <div className="text-[9px] text-[#707070] font-normal">
                                Cakupan terbatas: 2 dari 93 kontrol ISO 27001 Annex A
                              </div>
                            )}
                            {key === 'PCI_DSS' && (
                              <div className="text-[9px] text-[#707070] font-normal">
                                Cakupan terbatas: 2 kontrol teknis dari persyaratan PCI-DSS
                              </div>
                            )}
                          </td>
                          <td className="p-2 text-[#A1A1A1] border-r border-[#22262E]">Financial &amp; Invariant Controls</td>
                          <td className="p-2 text-[#EDEDED] border-r border-[#22262E]">
                            {fw.passed} dari {fw.total} kontrol berlaku dinilai
                          </td>
                          <td className="p-2 font-bold text-[#10B981]">
                            {fw.passed === fw.total ? 'Terpenuhi (Kontrol Teruji)' : `${fw.passed}/${fw.total} Teruji`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Control rows */}
                <div className="space-y-3 font-mono text-[11px]">
                  <div className="font-bold text-[#EDEDED] text-[13px]">2.0 Detailed Control Verifications</div>
                  {controls.map((c) => (
                    <div key={c.controlId} className="p-3 bg-[#111317] border border-[#22262E] rounded-[3px] space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[#3B82F6] font-bold">[{c.controlId}] {c.title}</span>
                        <span className="badge-tag px-1.5 py-0.2 bg-[#059669]/20 text-[#10B981] font-bold text-[9px]">
                          {c.evidenceStatus}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#A1A1A1]">{c.clauseReference}</div>
                      <p className="text-[11px] font-sans text-[#EDEDED] leading-relaxed">{c.requirementStatement}</p>
                      <div className="p-2 bg-[#0B0C0E] border border-[#22262E] rounded-[2px] text-[10px] text-[#38BDF8]">
                        Technical Audit Proof: {c.technicalProof}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[600px] min-h-[600px]">
                <MonacoEditor
                  height="100%"
                  language="markdown"
                  theme="vs-dark"
                  value={generatedAuditBinderMarkdown}
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
            )}
          </div>
        )}
      </div>
    </div>
  );
}
