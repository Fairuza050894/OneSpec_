'use client';

import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  AlertTriangle,
  CheckCircle2,
  FileCode,
  Search,
  Download,
  Copy,
  Check,
  ShieldAlert,
  ArrowRight,
  GitCompare,
  Layers,
  FileText,
  Sliders,
  ExternalLink,
} from 'lucide-react';
import type {
  AuditDiscrepancyItem,
  GapAuditSummary,
  GapAuditVerdict,
} from '@/types/sdlc';
import { gapAuditorService } from '@/services/gapAuditorService';
import { useStudioLocale } from '@/lib/i18n';
// Dynamic import of DiffEditor to avoid SSR hydration conflicts
const MonacoDiffEditor = dynamic(
  () => import('@monaco-editor/react').then((mod) => mod.DiffEditor),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center font-mono text-[11px] text-[#707070] bg-[#0E1015]">
        Loading Monaco Semantic Diff Engine...
      </div>
    ),
  }
);

interface GapAuditorWorkbenchProps {
  items: AuditDiscrepancyItem[];
  summary: GapAuditSummary;
  selectedItemId?: string;
  onSelectItem?: (item: AuditDiscrepancyItem) => void;
  onExportDoc?: (docContent: string) => void;
}

export function GapAuditorWorkbench({
  items,
  summary,
  selectedItemId,
  onSelectItem,
  onExportDoc,
}: GapAuditorWorkbenchProps) {
  const { copy } = useStudioLocale();
  const [activeVerdictFilter, setActiveVerdictFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeItemId, setActiveItemId] = useState<string>(
    selectedItemId || items[1]?.id || items[0]?.id || 'GAP-002'
  );
  const [renderSideBySide, setRenderSideBySide] = useState<boolean>(true);
  const [copiedDoc, setCopiedDoc] = useState(false);

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      let matchVerdict = true;
      if (activeVerdictFilter === 'ALL') {
        matchVerdict = true;
      } else if (activeVerdictFilter === 'VERIFIED') {
        matchVerdict = item.verdict === 'VERIFIED_MATCH' || item.verdict === 'COMPLIANT';
      } else if (activeVerdictFilter === 'MISSING') {
        matchVerdict = item.verdict === 'MISSING_IMPLEMENTATION' || item.verdict === 'MISSING_IN_BACKEND';
      } else if (activeVerdictFilter === 'SHADOW') {
        matchVerdict = item.verdict === 'UNDOCUMENTED_SHADOW_FEATURE' || item.verdict === 'UNDOCUMENTED_SHADOW_API';
      } else {
        matchVerdict = item.verdict === activeVerdictFilter;
      }
      const matchSearch =
        item.discrepancyTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.ruleRef.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.targetEntity.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.userStoryRef.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.verdict.toLowerCase().includes(searchQuery.toLowerCase());
      return matchVerdict && matchSearch;
    });
  }, [items, activeVerdictFilter, searchQuery]);

  // Find active item
  const activeItem = items.find((i) => i.id === activeItemId) || items[0];

  const getVerdictBadge = (verdict: GapAuditVerdict) => {
    switch (verdict) {
      case 'COMPLIANT':
      case 'VERIFIED_MATCH':
        return 'bg-[#059669]/15 text-[#059669] border-[#059669]/40';
      case 'MISSING_IN_BACKEND':
      case 'MISSING_IMPLEMENTATION':
        return 'bg-[#DC2626]/15 text-[#DC2626] border-[#DC2626]/40';
      case 'SCHEMA_TYPE_MISMATCH':
        return 'bg-[#D97706]/15 text-[#D97706] border-[#D97706]/40';
      case 'UNDOCUMENTED_SHADOW_API':
      case 'UNDOCUMENTED_SHADOW_FEATURE':
        return 'bg-[#8B5CF6]/15 text-[#A78BFA] border-[#8B5CF6]/40';
      default:
        return 'bg-[#707070]/15 text-[#A1A1A1] border-[#707070]/40';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-[#DC2626]/20 text-[#DC2626] border-[#DC2626]';
      case 'MAJOR':
        return 'bg-[#D97706]/20 text-[#D97706] border-[#D97706]';
      case 'MODERATE':
        return 'bg-[#2563EB]/20 text-[#3B82F6] border-[#2563EB]';
      default:
        return 'bg-[#059669]/20 text-[#059669] border-[#059669]';
    }
  };

  const handleDownloadReport = () => {
    const doc = gapAuditorService.generateUnifiedTechDoc(items, summary);
    const blob = new Blob([doc], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ISO29148_PRD_Gap_Audit_Report.md';
    link.click();
    if (onExportDoc) onExportDoc(doc);
  };

  const handleCopyReport = () => {
    const doc = gapAuditorService.generateUnifiedTechDoc(items, summary);
    navigator.clipboard.writeText(doc);
    setCopiedDoc(true);
    setTimeout(() => setCopiedDoc(false), 2000);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#111317] border border-[#22262E] rounded-[2px] overflow-hidden select-none">
      {/* 1. Audit Summary & Telemetry Bar */}
      <div className="h-[36px] bg-[#16191F] border-b border-[#22262E] px-3 flex items-center justify-between font-mono text-[11px] shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold text-[#EDEDED]">
            <GitCompare className="h-3.5 w-3.5 text-[#3B82F6]" />
            <span>PRD-to-Code Gap Auditor</span>
          </div>
          <span className="text-[#707070] text-[10px]">
            Audited Rules: <strong className="text-[#EDEDED] tabular-nums">{summary.totalAudited}</strong>
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopyReport}
            className="flex items-center gap-1 px-2 py-0.5 bg-[#111317] border border-[#22262E] hover:border-[#3B82F6] text-[#A1A1A1] hover:text-[#EDEDED] rounded-[2px] text-[10px] font-bold transition-colors"
            title="Copy Unified Technical Documentation Markdown"
          >
            {copiedDoc ? <Check className="h-3 w-3 text-[#059669]" /> : <Copy className="h-3 w-3" />}
            <span>{copiedDoc ? copy.step06.copied : copy.step06.copyTechDoc}</span>
          </button>

          <button
            onClick={handleDownloadReport}
            className="flex items-center gap-1 px-2 py-0.5 bg-[#111317] border border-[#22262E] hover:border-[#3B82F6] text-[#A1A1A1] hover:text-[#EDEDED] rounded-[2px] text-[10px] font-bold transition-colors"
            title="Download ISO 29148 PRD-to-Code Audit Report"
          >
            <Download className="h-3 w-3 text-[#3B82F6]" />
            <span>{copy.step06.exportReport}</span>
          </button>
        </div>
      </div>

      {/* As-Built Baseline Info Banner when in Zero-Doc Mode */}
      {(summary.isZeroDocMode || !summary.hasSourceRequirements) && (
        <div className="bg-[#1E293B]/60 border-b border-[#3B82F6]/30 px-3 py-2 flex items-center justify-between text-[11px] font-mono text-[#93C5FD] shrink-0">
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 bg-[#3B82F6]/20 border border-[#3B82F6]/40 text-[#60A5FA] font-bold rounded-[2px] text-[10px]">
              AS-BUILT BASELINE
            </span>
            <span>
              <strong>Mode As-Built Baseline (Belum ada Dokumen PRD/MoM Pembanding)</strong> — Menganalisis konsistensi spesifikasi as-built hasil reverse-engineering dari live surface & AST. Untuk audit 1:1 terhadap kebutuhan bisnis, masukkan MoM/PRD pada Step 01.
            </span>
          </div>
          <span className="text-[10px] text-[#94A3B8] font-mono">0 MISSING (Baseline Reference)</span>
        </div>
      )}

      {/* 2. Discrepancy Matrix Upper Split (Height 42%) */}
      <div className="h-[42%] flex flex-col border-b border-[#22262E] bg-[#0E1015] overflow-hidden">
        {/* Filter & Search Toolbar */}
        <div className="h-[28px] bg-[#16191F] border-b border-[#22262E] px-2.5 flex items-center justify-between font-mono text-[10px]">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-[#0B0C0E] border border-[#22262E] px-1.5 py-0.5 rounded-[2px]">
              <Search className="h-3 w-3 text-[#707070]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={copy.step06.searchPlaceholder}
                className="bg-transparent border-none outline-none text-[#EDEDED] text-[10px] w-48 font-mono"
              />
            </div>

            <div className="flex items-center gap-1 bg-[#0B0C0E] border border-[#22262E] p-0.5 rounded-[2px]">
              {[
                { id: 'ALL', label: 'ALL' },
                { id: 'VERIFIED', label: 'MATCH / COMPLIANT' },
                { id: 'MISSING', label: 'MISSING' },
                { id: 'SHADOW', label: 'SHADOW FEATURE' },
                { id: 'SCHEMA_TYPE_MISMATCH', label: 'SCHEMA MISMATCH' },
              ].map((v) => (
                <button
                  key={v.id}
                  onClick={() => setActiveVerdictFilter(v.id)}
                  className={`px-1.5 py-0.2 rounded-[2px] text-[9px] font-bold transition-colors ${
                    activeVerdictFilter === v.id
                      ? 'bg-[#2563EB] text-white'
                      : 'text-[#707070] hover:text-[#EDEDED]'
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          <span className="text-[10px] text-[#707070] tabular-nums">
            {filteredItems.length} / {items.length} {copy.step06.rulesMapped}
          </span>
        </div>

        {/* Matrix Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left font-mono text-[11px] border-collapse">
            <thead className="bg-[#16191F] text-[#707070] border-b border-[#22262E] sticky top-0 z-10">
              <tr className="h-[26px]">
                <th className="py-1 px-2.5 w-20 border-r border-[#22262E] text-[10px] uppercase font-semibold text-[#A1A1A1]">
                  {copy.step06.colAuditId}
                </th>
                <th className="py-1 px-2.5 w-40 border-r border-[#22262E] text-[10px] uppercase font-semibold text-[#A1A1A1]">
                  {copy.step06.colVerdict}
                </th>
                <th className="py-1 px-2.5 w-24 border-r border-[#22262E] text-[10px] uppercase font-semibold text-[#A1A1A1]">
                  {copy.step06.colRuleRef}
                </th>
                <th className="py-1 px-2.5 w-24 border-r border-[#22262E] text-[10px] uppercase font-semibold text-[#A1A1A1]">
                  {copy.step06.colUserStory}
                </th>
                <th className="py-1 px-2.5 w-52 border-r border-[#22262E] text-[10px] uppercase font-semibold text-[#A1A1A1]">
                  {copy.step06.colTargetEntity}
                </th>
                <th className="py-1 px-2.5 w-20 border-r border-[#22262E] text-[10px] uppercase font-semibold text-[#A1A1A1]">
                  {copy.step06.colSeverity}
                </th>
                <th className="py-1 px-2.5 border-r border-[#22262E] text-[10px] uppercase font-semibold text-[#A1A1A1]">
                  {copy.step06.colTitle}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#22262E] bg-[#111317]">
              {filteredItems.map((item) => {
                const isSelected = item.id === activeItem?.id;
                return (
                  <tr
                    key={item.id}
                    onClick={() => {
                      setActiveItemId(item.id);
                      onSelectItem?.(item);
                    }}
                    className={`h-[28px] max-h-[28px] cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#16191F] border-l-2 border-l-[#2563EB]'
                        : 'hover:bg-[#16191F]/60'
                    }`}
                  >
                    <td className="py-1 px-2.5 border-r border-[#22262E] font-bold text-[#3B82F6]">
                      {item.id}
                    </td>
                    <td className="py-1 px-2.5 border-r border-[#22262E]">
                      <span
                        className={`badge-tag px-1.5 py-0.2 border text-[9px] font-bold rounded-[2px] ${getVerdictBadge(
                          item.verdict
                        )}`}
                      >
                        {item.verdict}
                      </span>
                    </td>
                    <td className="py-1 px-2.5 border-r border-[#22262E] font-bold text-[#EDEDED]">
                      {item.ruleRef}
                    </td>
                    <td className="py-1 px-2.5 border-r border-[#22262E] text-[#059669] font-semibold">
                      {item.userStoryRef}
                    </td>
                    <td className="py-1 px-2.5 border-r border-[#22262E] text-[#707070] text-[10px] truncate max-w-[200px]" title={item.targetEntity}>
                      <code>{item.targetEntity}</code>
                    </td>
                    <td className="py-1 px-2.5 border-r border-[#22262E]">
                      <span
                        className={`badge-tag px-1 py-0.2 border text-[9px] font-bold ${getSeverityBadge(
                          item.severity
                        )}`}
                      >
                        {item.severity}
                      </span>
                    </td>
                    <td className="py-1 px-2.5 border-r border-[#22262E] text-[#EDEDED] truncate font-medium max-w-[280px]" title={item.discrepancyTitle}>
                      {item.discrepancyTitle}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Monaco Semantic DiffEditor Lower Split (Height 58%) */}
      <div className="flex-1 flex flex-col bg-[#0B0C0E] overflow-hidden">
        {/* Diff Sub-Header */}
        <div className="h-[28px] bg-[#16191F] border-b border-[#22262E] px-3 flex items-center justify-between font-mono text-[10px] shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-[#059669] font-bold">ORIGINAL:</span>
              <span className="text-[#A1A1A1]">Expected Spec Contract (ISO 29148 PRD/StRS)</span>
            </div>
            <ArrowRight className="h-3 w-3 text-[#707070]" />
            <div className="flex items-center gap-1.5">
              <span className="text-[#3B82F6] font-bold">MODIFIED:</span>
              <span className="text-[#A1A1A1]">Discovered Code/AST Implementation (morluto/rea)</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[#707070]">Language: <code className="text-[#EDEDED]">{activeItem.diffLanguage}</code></span>
            <button
              onClick={() => setRenderSideBySide((prev) => !prev)}
              className="px-2 py-0.5 bg-[#0B0C0E] border border-[#22262E] hover:border-[#3B82F6] text-[#A1A1A1] hover:text-[#EDEDED] rounded-[2px] text-[10px] font-bold"
            >
              {renderSideBySide ? 'Side-by-Side Diff' : 'Inline Diff'}
            </button>
          </div>
        </div>

        {/* Monaco DiffEditor */}
        <div className="flex-1 w-full h-full relative overflow-hidden bg-[#0B0C0E]">
          <MonacoDiffEditor
            original={activeItem.expectedSpec}
            modified={activeItem.actualImplementation}
            language={activeItem.diffLanguage === 'sql' ? 'sql' : 'typescript'}
            theme="vs-dark"
            options={{
              readOnly: true,
              renderSideBySide,
              fontSize: 11,
              fontFamily: "'JetBrains Mono', 'Geist Mono', monospace",
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              lineNumbers: 'on',
              renderIndicators: true,
              diffWordWrap: 'on',
            }}
          />
        </div>

        {/* Diff Status Bar */}
        <div className="h-[22px] bg-[#16191F] border-t border-[#22262E] px-3 flex items-center justify-between text-[10px] font-mono text-[#707070] shrink-0">
          <div className="flex items-center gap-2">
            <span>Target: <code className="text-[#3B82F6]">{activeItem.targetEntity}</code></span>
            <span>·</span>
            <span>Rule: <strong className="text-[#EDEDED]">{activeItem.ruleRef}</strong></span>
          </div>
          <div>
            <span>Action: <span className="text-[#EDEDED] font-semibold">{activeItem.remediationAction}</span></span>
          </div>
        </div>
      </div>
    </div>
  );
}
