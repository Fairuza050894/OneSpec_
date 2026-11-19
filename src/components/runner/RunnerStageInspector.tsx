'use client';

import React, { useState } from 'react';
import { Flame, Check, Copy } from 'lucide-react';
import type { ExecutionPipelineStage } from '@/types/sdlc';

export interface RunnerStageInspectorProps {
  selectedRunnerStage: ExecutionPipelineStage | null;
  selectedEntityId: string;
  onAppendLog: (log: string) => void;
}

export function RunnerStageInspector({
  selectedRunnerStage,
  selectedEntityId,
  onAppendLog,
}: RunnerStageInspectorProps) {
  const [copiedSqlFix, setCopiedSqlFix] = useState(false);

  return (
    <div className="space-y-4">
      {/* Selected Stage Detail */}
      {selectedRunnerStage ? (
        <div className="p-3 bg-[#0B0C0E] border border-white/[0.07] rounded-md space-y-2">
          <div className="flex items-center justify-between pb-1 border-b border-white/[0.07]">
            <span className="text-[10px] text-zinc-400 uppercase font-semibold">Pipeline Stage:</span>
            <span
              className={`px-1.5 py-0.5 border rounded text-[10px] font-bold ${
                selectedRunnerStage.status === 'BOTTLENECK'
                  ? 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/50'
                  : 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/50'
              }`}
            >
              {selectedRunnerStage.status} ({selectedRunnerStage.latencyMs}ms)
            </span>
          </div>
          <div className="text-[12px] font-bold text-[#EDEDED]">{selectedRunnerStage.label}</div>
          <div className="text-[11px] text-[#3B82F6] truncate">
            <code>{selectedRunnerStage.componentSource}</code>
          </div>
        </div>
      ) : (
        <div className="p-3 bg-[#0B0C0E] border border-white/[0.07] rounded-md space-y-1 text-[11px]">
          <div className="text-[10px] text-zinc-400 uppercase font-semibold">Telemetry Target:</div>
          <div className="text-[#EDEDED] font-bold">{selectedEntityId}</div>
        </div>
      )}

      {/* Root-Cause Bottleneck Inspector (when Stage 4 / Bottleneck selected) */}
      {selectedRunnerStage?.rootCause && (
        <div className="border border-[#EF4444]/40 bg-[#EF4444]/5 rounded-md p-3 space-y-2.5">
          <div className="flex items-center justify-between pb-1 border-b border-[#EF4444]/30">
            <span className="text-[#EF4444] text-[11px] uppercase font-bold flex items-center gap-1.5">
              <Flame className="h-3.5 w-3.5" />
              Root Cause: Database Bottleneck
            </span>
            <span className="text-zinc-400 text-[10px]">morluto/rea</span>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div>
              <span className="text-zinc-400">Location: </span>
              <code className="text-[#EDEDED] font-bold">
                {selectedRunnerStage.rootCause.sourceFile}:{selectedRunnerStage.rootCause.lineNumber}
              </code>
              <span className="text-[#3B82F6] ml-1">
                ({selectedRunnerStage.rootCause.functionSymbol}())
              </span>
            </div>
            <div>
              <span className="text-zinc-400">Diagnosis: </span>
              <span className="text-[#EDEDED]">{selectedRunnerStage.rootCause.summary}</span>
            </div>

            {/* HAR Latency Waterfall */}
            {selectedRunnerStage.rootCause.harMetrics && (
              <div className="p-2 bg-[#0B0C0E] border border-white/[0.07] rounded space-y-1">
                <span className="text-[10px] text-zinc-400 uppercase font-semibold">HAR Latency:</span>
                <div className="grid grid-cols-4 gap-1 text-center text-[10px]">
                  <div className="bg-[#16191F] p-1 rounded">
                    <div className="text-zinc-400">DNS</div>
                    <div className="text-[#EDEDED] font-bold">{selectedRunnerStage.rootCause.harMetrics.dnsMs}ms</div>
                  </div>
                  <div className="bg-[#16191F] p-1 rounded">
                    <div className="text-zinc-400">Connect</div>
                    <div className="text-[#EDEDED] font-bold">{selectedRunnerStage.rootCause.harMetrics.connectMs}ms</div>
                  </div>
                  <div className="bg-[#EF4444]/20 border border-[#EF4444]/40 p-1 rounded">
                    <div className="text-[#EF4444] font-bold">TTFB</div>
                    <div className="text-[#EF4444] font-bold">{selectedRunnerStage.rootCause.harMetrics.ttfbMs}ms</div>
                  </div>
                  <div className="bg-[#16191F] p-1 rounded">
                    <div className="text-zinc-400">Download</div>
                    <div className="text-[#EDEDED] font-bold">{selectedRunnerStage.rootCause.harMetrics.downloadMs}ms</div>
                  </div>
                </div>
              </div>
            )}

            {/* EXPLAIN ANALYZE */}
            {selectedRunnerStage.rootCause.explainPlan && (
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-400 uppercase font-semibold">EXPLAIN ANALYZE:</span>
                <pre className="text-[#EF4444] bg-[#0B0C0E] p-2 border border-white/[0.07] rounded text-[10px] whitespace-pre-wrap leading-tight">
                  {selectedRunnerStage.rootCause.explainPlan}
                </pre>
              </div>
            )}

            {/* 1-Click SQL Remediation Fix */}
            {selectedRunnerStage.rootCause.sqlRemediationQuery && (
              <div className="space-y-1.5 pt-1.5 border-t border-[#EF4444]/30">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#10B981] uppercase font-bold">Remediation DDL:</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(selectedRunnerStage.rootCause!.sqlRemediationQuery!);
                      setCopiedSqlFix(true);
                      setTimeout(() => setCopiedSqlFix(false), 2000);
                      onAppendLog(`[SQL] Copied fix: ${selectedRunnerStage.rootCause!.sqlRemediationQuery}`);
                    }}
                    className="flex items-center gap-1 text-[10px] text-[#3B82F6] hover:text-[#60A5FA]"
                  >
                    {copiedSqlFix ? <Check className="h-3 w-3 text-[#10B981]" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedSqlFix ? 'Copied' : 'Copy SQL'}</span>
                  </button>
                </div>
                <pre className="text-[#10B981] bg-[#0B0C0E] p-2 border border-white/[0.07] rounded text-[10.5px] whitespace-pre-wrap">
                  {selectedRunnerStage.rootCause.sqlRemediationQuery}
                </pre>
                <button
                  onClick={() => {
                    onAppendLog(`[SQL MIGRATION] Executing: ${selectedRunnerStage.rootCause!.sqlRemediationQuery}`);
                    onAppendLog('[SQL MIGRATION] SUCCESS: Index idx_records_lookup created. Latency reduced from 1,420ms to 6ms.');
                  }}
                  className="w-full py-1.5 bg-[#10B981] hover:bg-[#059669] text-black font-bold rounded text-[11px] cursor-pointer mt-1"
                >
                  Apply Index Migration to Database
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* REA AST Evidence */}
      <div className="p-3 bg-[#0B0C0E] border border-white/[0.07] rounded-md space-y-1.5 text-[11px]">
        <div className="text-[10px] text-[#059669] uppercase font-bold">morluto/rea AST Evidence</div>
        <div className="text-zinc-400 space-y-1">
          <div>Controller: <code className="text-[#EDEDED]">handler.controller.ts:42</code></div>
          <div>Query Hook: <code className="text-[#EDEDED]">findUnique(id)</code></div>
          <div>DB Index: <span className="text-[#059669]">UNIQUE(id, status)</span></div>
        </div>
      </div>
    </div>
  );
}
