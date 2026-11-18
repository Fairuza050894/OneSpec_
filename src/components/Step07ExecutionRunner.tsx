'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useStudioLocale } from '@/lib/i18n';
import type { LiveRunnerWorkbenchProps } from '@/components/runner/LiveRunnerWorkbench';
import { computeUnifiedQualityMetrics } from '@/services/sdlcCompiler';
import { ShieldCheck, Activity, Gauge, AlertTriangle, AlertOctagon } from 'lucide-react';

const LiveRunnerWorkbench = dynamic(
  () => import('@/components/runner/LiveRunnerWorkbench').then((m) => m.LiveRunnerWorkbench),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center font-mono text-[12px] text-[#94A3B8] bg-[#0E1015]">
        Initializing Playwright Synthesizer &amp; @xyflow/react Live Runner...
      </div>
    ),
  }
);

export interface Step07ExecutionRunnerProps extends LiveRunnerWorkbenchProps {
  displayMode?: 'EXECUTIVE' | 'TECHNICAL';
  title?: string;
  subtitle?: string;
}

export function Step07ExecutionRunner({
  displayMode = 'TECHNICAL',
  title,
  subtitle,
  ...workbenchProps
}: Step07ExecutionRunnerProps) {
  const { copy, locale } = useStudioLocale();
  const isId = locale === 'id';

  const metrics = workbenchProps.compiledState
    ? computeUnifiedQualityMetrics(workbenchProps.compiledState)
    : null;

  return (
    <div className="h-full flex flex-col space-y-2 min-h-0 overflow-y-auto pr-0.5">
      {/* Canvas Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-1 border-b border-[#22262E] shrink-0">
        <div>
          <h1 className="text-[17px] font-bold text-[#EDEDED] tracking-tight">
            {title || copy.step07.title}
          </h1>
          <p className="text-[11.5px] text-[#94A3B8] mt-0.5">
            {subtitle || copy.step07.subtitle}
          </p>
        </div>

        {/* Executive Mode Overview Ribbon */}
        {displayMode === 'EXECUTIVE' && metrics && (
          <div className="flex items-center gap-2 bg-[#16191F] border border-[#22262E] px-3 py-1.5 rounded-[4px] shrink-0">
            <div className="flex items-center gap-1.5 text-[11px] text-[#CBD5E1]">
              <Gauge className="w-3.5 h-3.5 text-[#3B82F6]" />
              <span className="text-[#94A3B8]">{isId ? 'Tingkat Kelulusan:' : 'Pass Rate:'}</span>
              <span className="font-mono font-bold text-[#10B981]">{metrics.passRatePercent}%</span>
              <span className="text-[#64748B] text-[10px]">({metrics.passedCases}/{metrics.totalCases})</span>
            </div>
            <span className="text-[#333A44]">|</span>
            <div className="flex items-center gap-1.5 text-[11px] text-[#CBD5E1]">
              <Activity className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span className="text-[#94A3B8]">P95:</span>
              <span className="font-mono font-bold text-[#EDEDED]">{metrics.p95LatencyMs}ms</span>
            </div>
            <span className="text-[#333A44]">|</span>
            <div className="flex items-center gap-1.5 text-[10.5px]">
              {metrics.releaseGateStatus === 'PRODUCTION_GO' && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[3px] bg-[#059669]/20 text-[#10B981] font-bold">
                  <ShieldCheck className="w-3 h-3" />
                  {isId ? 'SIAP RILIS (GO)' : 'PRODUCTION GO'}
                </span>
              )}
              {metrics.releaseGateStatus === 'CONDITIONAL_GO' && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[3px] bg-[#D97706]/20 text-[#F59E0B] font-bold">
                  <AlertTriangle className="w-3 h-3" />
                  {isId ? 'STAGING BERSYARAT' : 'CONDITIONAL STAGING'}
                </span>
              )}
              {metrics.releaseGateStatus === 'NO_GO' && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[3px] bg-[#EF4444]/20 text-[#EF4444] font-bold">
                  <AlertOctagon className="w-3 h-3" />
                  {isId ? 'RILIS DITAHAN (NO GO)' : 'RELEASE BLOCKED'}
                </span>
              )}
              {metrics.releaseGateStatus === 'NOT_EXECUTED' && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[3px] bg-[#333A44] text-[#94A3B8] font-medium">
                  {isId ? 'BELUM DIEKSEKUSI' : 'NOT EXECUTED'}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Unified Full-Viewport Workbench (Master Command Bar & 4 Workspace Tabs) */}
      <div className="flex-1 bg-[#111317] border border-[#22262E] rounded-[4px] p-2 overflow-hidden flex flex-col min-h-[520px]">
        <LiveRunnerWorkbench {...workbenchProps} />
      </div>
    </div>
  );
}
