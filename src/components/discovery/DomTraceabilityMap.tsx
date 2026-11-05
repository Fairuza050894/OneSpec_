'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  Target,
  FileCode,
  Database,
} from 'lucide-react';
import type { DomTraceabilityBinding } from '@/types/sdlc';

interface DomTraceabilityMapProps {
  bindings: DomTraceabilityBinding[];
  onSelectBinding?: (binding: DomTraceabilityBinding) => void;
  selectedBindingId?: string;
}

export function DomTraceabilityMap({
  bindings,
  onSelectBinding,
  selectedBindingId,
}: DomTraceabilityMapProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredBindings = useMemo(() => {
    return bindings.filter((b) => {
      const matchStatus = statusFilter === 'ALL' || b.parityStatus === statusFilter;
      const matchSearch =
        b.domSelector.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.userStoryId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.testCaseId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.apiEndpoint.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.dbTarget.toLowerCase().includes(searchQuery.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [bindings, statusFilter, searchQuery]);

  const handleCopySelector = (selector: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(selector);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#111317] border border-[#22262E] rounded-[2px] overflow-hidden select-none">
      {/* Sub-Header Toolbar */}
      <div className="h-[32px] bg-[#16191F] border-b border-[#22262E] px-3 flex items-center justify-between font-mono text-[11px] gap-2 shrink-0">
        <div className="flex items-center gap-2">
          {/* Global Search */}
          <div className="flex items-center gap-1 bg-[#0B0C0E] border border-[#22262E] px-2 py-0.5 rounded-[2px]">
            <Search className="h-3 w-3 text-[#707070]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search DOM selectors, endpoints, database..."
              className="bg-transparent border-none outline-none text-[#EDEDED] text-[11px] w-64 font-mono"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-[#0B0C0E] border border-[#22262E] p-0.5 rounded-[2px]">
            {['ALL', 'BOUND_AND_VERIFIED', 'SYNTHETIC_CANDIDATE'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2 py-0.5 rounded-[2px] text-[10px] font-bold transition-colors ${
                  statusFilter === st
                    ? 'bg-[#2563EB] text-white'
                    : 'text-[#707070] hover:text-[#EDEDED]'
                }`}
              >
                {st === 'ALL'
                  ? 'ALL'
                  : st === 'BOUND_AND_VERIFIED'
                  ? 'VERIFIED'
                  : 'CANDIDATE'}
              </button>
            ))}
          </div>

          <span className="text-[10px] text-[#707070] tabular-nums">
            {filteredBindings.length} / {bindings.length} Mapped Elements
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] text-[#059669]">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Stage 2 Playwright Automation Link Ready</span>
        </div>
      </div>

      {/* Spreadsheet Table Container */}
      <div className="flex-1 overflow-auto bg-[#0E1015]">
        <table className="w-full text-left font-mono text-[11px] border-collapse">
          {/* Sticky Header */}
          <thead className="bg-[#16191F] text-[#707070] border-b border-[#22262E] sticky top-0 z-10 shadow-sm">
            <tr className="h-[28px]">
              <th className="py-1 px-2.5 w-24 border-r border-[#22262E] text-[10px] uppercase font-semibold text-[#A1A1A1]">
                Binding ID
              </th>
              <th className="py-1 px-2.5 w-24 border-r border-[#22262E] text-[10px] uppercase font-semibold text-[#A1A1A1]">
                SyRS / StRS
              </th>
              <th className="py-1 px-2.5 w-20 border-r border-[#22262E] text-[10px] uppercase font-semibold text-[#A1A1A1]">
                RTM Test
              </th>
              <th className="py-1 px-2.5 border-r border-[#22262E] text-[10px] uppercase font-semibold text-[#A1A1A1]">
                DOM Target Selector (Playwright Locator)
              </th>
              <th className="py-1 px-2.5 w-24 border-r border-[#22262E] text-[10px] uppercase font-semibold text-[#A1A1A1]">
                ARIA Role
              </th>
              <th className="py-1 px-2.5 w-60 border-r border-[#22262E] text-[10px] uppercase font-semibold text-[#A1A1A1]">
                Discovered API Route
              </th>
              <th className="py-1 px-2.5 w-44 border-r border-[#22262E] text-[10px] uppercase font-semibold text-[#A1A1A1]">
                Database Target
              </th>
              <th className="py-1 px-2.5 w-32 text-[10px] uppercase font-semibold text-[#A1A1A1]">
                Parity Status
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-[#22262E] bg-[#111317]">
            {filteredBindings.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-[#707070]">
                  No matching DOM selectors or traceability bindings found.
                </td>
              </tr>
            ) : (
              filteredBindings.map((binding) => {
                const isSelected = selectedBindingId === binding.bindingId;
                return (
                  <tr
                    key={binding.bindingId}
                    onClick={() => onSelectBinding?.(binding)}
                    className={`h-[28px] max-h-[28px] cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#16191F] border-l-2 border-l-[#2563EB]'
                        : 'hover:bg-[#16191F]/60'
                    }`}
                  >
                    <td className="py-1 px-2.5 border-r border-[#22262E] font-bold text-[#3B82F6] truncate">
                      {binding.bindingId}
                    </td>
                    <td className="py-1 px-2.5 border-r border-[#22262E] text-[#059669] font-semibold truncate">
                      {binding.userStoryId}
                    </td>
                    <td className="py-1 px-2.5 border-r border-[#22262E] font-bold text-[#EDEDED] truncate">
                      {binding.testCaseId}
                    </td>
                    <td className="py-1 px-2.5 border-r border-[#22262E] truncate font-mono">
                      <div className="flex items-center justify-between gap-1">
                        <code className="text-[#3B82F6] truncate max-w-[340px]" title={binding.domSelector}>
                          {binding.domSelector}
                        </code>
                        <button
                          onClick={(e) => handleCopySelector(binding.domSelector, binding.bindingId, e)}
                          className="text-[#707070] hover:text-[#EDEDED] p-0.5 rounded"
                          title="Copy selector"
                        >
                          {copiedId === binding.bindingId ? (
                            <Check className="h-3 w-3 text-[#059669]" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-1 px-2.5 border-r border-[#22262E] text-[#A1A1A1] truncate">
                      <span className="badge-tag px-1 py-0.2 bg-[#0B0C0E] border border-[#22262E] text-[10px]">
                        {binding.ariaRole}
                      </span>
                    </td>
                    <td className="py-1 px-2.5 border-r border-[#22262E] text-[#EDEDED] truncate font-mono text-[10px]">
                      {binding.apiEndpoint}
                    </td>
                    <td className="py-1 px-2.5 border-r border-[#22262E] text-[#D97706] truncate font-mono text-[10px]">
                      {binding.dbTarget}
                    </td>
                    <td className="py-1 px-2.5 truncate">
                      <span
                        className={`badge-tag px-1.5 py-0.2 text-[9px] font-bold ${
                          binding.parityStatus === 'BOUND_AND_VERIFIED'
                            ? 'bg-[#059669]/20 text-[#059669] border border-[#059669]'
                            : 'bg-[#2563EB]/20 text-[#3B82F6] border border-[#2563EB]'
                        }`}
                      >
                        {binding.parityStatus === 'BOUND_AND_VERIFIED' ? 'VERIFIED' : 'CANDIDATE'}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="h-[24px] bg-[#16191F] border-t border-[#22262E] px-3 flex items-center justify-between text-[10px] font-mono text-[#707070] shrink-0">
        <div className="flex items-center gap-3">
          <span>Standards: <strong className="text-[#EDEDED]">ISO/IEC/IEEE 29119-3 Clause 7 (Automation Parity)</strong></span>
          <span>Coverage: <strong className="text-[#059669]">100% Core DOM Elements Mapped</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <span>Target Runner: <code>Playwright + Cucumber-JS Engine</code></span>
        </div>
      </div>
    </div>
  );
}
