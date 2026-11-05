'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import {
  ReactFlow,
  Background,
  Controls,
  Node,
  Edge,
  Position,
  Handle,
  NodeProps,
  MarkerType,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
} from '@xyflow/react';
import {
  Play,
  RotateCw,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Clock,
  ArrowRight,
  FileCode,
  Database,
  Network,
  MousePointer,
  Activity,
  Check,
  Copy,
  Terminal,
  ExternalLink,
  ShieldCheck,
  Layers,
  Cpu,
  Flame,
  Radio,
  Download,
  Users,
  Gauge,
  Zap,
  ChevronDown,
  ChevronRight,
  Sliders,
  FileText,
} from 'lucide-react';
import type {
  ExecutionPipelineStage,
  TestSuiteExecutionTrace,
  PipelineStageType,
  StagePerformanceStatus,
  K6MetricSummary,
  FunctionalTestCaseResult,
  UnifiedRunnerExecutionSummary,
} from '@/types/sdlc';
import { automationSynthesizerService } from '@/services/automationSynthesizer';
import { unifiedReportGenerator } from '@/services/unifiedReportGenerator';
import '@xyflow/react/dist/style.css';

// Dynamic import of Monaco Editor
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center font-mono text-[11px] text-[#707070] bg-[#0E1015]">
      Initializing Monaco Suite View...
    </div>
  ),
});

interface PipelineStageNodeData {
  stage: ExecutionPipelineStage;
  isActiveRunning: boolean;
  k6P95LatencyMs: number;
  onSelect: (stage: ExecutionPipelineStage) => void;
}

// Custom Node for the 4-Stage Execution Pipeline
function PipelineStageNode({ data, selected }: NodeProps) {
  const stageData = data as unknown as PipelineStageNodeData;
  const stage = stageData.stage;
  const isActiveRunning = stageData.isActiveRunning;
  const k6Latency = stageData.k6P95LatencyMs;

  if (!stage) return null;

  const isBottleneck = stage.status === 'BOTTLENECK';
  const isElevated = stage.status === 'ELEVATED';
  const isNominal = stage.status === 'NOMINAL';
  const isRunning = stage.status === 'RUNNING' || isActiveRunning;

  const getStageIcon = (type: PipelineStageType) => {
    switch (type) {
      case 'UI_ACTION':
        return <MousePointer className="h-3.5 w-3.5 text-[#3B82F6]" />;
      case 'API_GATEWAY':
        return <Network className="h-3.5 w-3.5 text-[#8B5CF6]" />;
      case 'SERVICE_LOGIC':
        return <Cpu className="h-3.5 w-3.5 text-[#EC4899]" />;
      case 'DATABASE_QUERY':
        return <Database className="h-3.5 w-3.5 text-[#F59E0B]" />;
      default:
        return <Layers className="h-3.5 w-3.5 text-[#707070]" />;
    }
  };

  const borderColor = isBottleneck
    ? 'border-[#EF4444] ring-1 ring-[#EF4444]'
    : isElevated
    ? 'border-[#F59E0B]'
    : isNominal
    ? 'border-[#10B981]'
    : isRunning
    ? 'border-[#3B82F6] animate-pulse'
    : 'border-[#22262E]';

  return (
    <div
      onClick={() => stageData.onSelect(stage)}
      className={`w-[290px] min-h-[150px] bg-[#111317] border rounded-[4px] shadow-lg font-mono text-[11px] select-none transition-all cursor-pointer flex flex-col justify-between ${borderColor} ${
        selected ? 'ring-2 ring-[#3B82F6]' : 'hover:border-[#3B82F6]/70'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-[#3B82F6] !w-2 !h-2 !border-none !-left-1"
      />

      {/* Stage Header */}
      <div className="h-[32px] bg-[#16191F] border-b border-[#22262E] px-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5 truncate">
          {getStageIcon(stage.stageType)}
          <span className="font-bold text-[#EDEDED] text-[11.5px] truncate">{stage.label}</span>
        </div>
        <div className="flex items-center gap-1">
          {isBottleneck ? (
            <span className="px-1.5 py-0.5 bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444] text-[9.5px] font-bold flex items-center gap-0.5 rounded-[2px]">
              <Flame className="h-2.5 w-2.5" />
              BOTTLENECK
            </span>
          ) : isElevated ? (
            <span className="px-1.5 py-0.5 bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B] text-[9.5px] font-bold rounded-[2px]">
              ELEVATED
            </span>
          ) : isNominal ? (
            <span className="px-1.5 py-0.5 bg-[#10B981]/20 text-[#10B981] border border-[#10B981] text-[9.5px] font-bold rounded-[2px]">
              NOMINAL
            </span>
          ) : isRunning ? (
            <span className="px-1.5 py-0.5 bg-[#3B82F6]/20 text-[#3B82F6] border border-[#3B82F6] text-[9.5px] font-bold animate-pulse rounded-[2px]">
              RUNNING
            </span>
          ) : (
            <span className="px-1.5 py-0.5 bg-[#22262E] text-[#707070] text-[9.5px] rounded-[2px]">
              PENDING
            </span>
          )}
        </div>
      </div>

      {/* Stage Details Body */}
      <div className="p-3 space-y-2 bg-[#0B0C0E]/70 text-[10.5px] flex-1 flex flex-col justify-between">
        {/* Component / AST Source */}
        <div className="flex items-start gap-1">
          <span className="text-[#707070] shrink-0">Source:</span>
          <code className="text-[#3B82F6] truncate block max-w-[210px]" title={stage.componentSource}>
            {stage.componentSource}
          </code>
        </div>

        {/* Dual Latency Annotation: E2E vs k6 p95 */}
        <div className="pt-1 border-t border-[#22262E]/60 flex items-center justify-between text-[10px]">
          <span className="text-[#707070]">E2E Single Latency:</span>
          <span
            className={`font-bold tabular-nums ${
              isBottleneck ? 'text-[#EF4444]' : 'text-[#10B981]'
            }`}
          >
            {stage.latencyMs}ms
          </span>
        </div>
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-[#707070]">k6 p(95) Concurrency:</span>
          <span
            className={`font-bold tabular-nums ${
              k6Latency > 500 ? 'text-[#EF4444]' : 'text-[#10B981]'
            }`}
          >
            {k6Latency}ms
          </span>
        </div>

        {/* Input / Output Snippet */}
        {stage.inputPayload && (
          <div className="pt-1 border-t border-[#22262E]/60 text-[9px]">
            <div className="text-[#707070] flex items-center justify-between">
              <span>Input:</span>
              <span className="text-[#52525B] truncate max-w-[190px]">{stage.inputPayload}</span>
            </div>
          </div>
        )}

        {/* Bottleneck Warning Banner */}
        {isBottleneck && (
          <div className="mt-1 p-1.5 bg-[#EF4444]/15 border border-[#EF4444]/40 rounded-[2px] text-[#EF4444] text-[9px] flex items-center gap-1.5">
            <AlertOctagon className="h-3 w-3 shrink-0" />
            <div className="truncate">
              <strong>{stage.latencyMs}ms (&gt; 200ms SLA):</strong> {stage.rootCause?.summary || 'Elevated query latency'}
            </div>
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!bg-[#3B82F6] !w-2 !h-2 !border-none !-right-1"
      />
    </div>
  );
}

const nodeTypes = {
  pipelineStageNode: PipelineStageNode,
};

interface LiveRunnerWorkbenchProps {
  onSelectStage: (stage: ExecutionPipelineStage, trace: TestSuiteExecutionTrace) => void;
  selectedStageId?: string;
  onAppendLog?: (log: string) => void;
  targetUrl?: string;
  projectName?: string;
  playwrightCode?: string;
  k6Code?: string;
  postmanCode?: string;
  customPipelineStages?: ExecutionPipelineStage[];
  customExecutionTraces?: TestSuiteExecutionTrace[];
}

export function LiveRunnerWorkbench({
  onSelectStage,
  selectedStageId,
  onAppendLog,
  targetUrl,
  projectName,
  playwrightCode,
  k6Code,
  postmanCode,
  customPipelineStages,
  customExecutionTraces,
}: LiveRunnerWorkbenchProps) {
  const effectiveProjectName = projectName || 'Voucher Checkout Engine';
  const effectiveTargetUrl = targetUrl || 'http://localhost:3000';
  const effectivePlaywrightCode = useMemo(() => {
    return playwrightCode || automationSynthesizerService.generatePlaywrightSpec();
  }, [playwrightCode]);
  const effectiveK6Code = useMemo(() => {
    return k6Code || automationSynthesizerService.generateK6LoadScript();
  }, [k6Code]);
  const effectivePostmanCode = useMemo(() => {
    return postmanCode || JSON.stringify(automationSynthesizerService.generatePostmanCollection(), null, 2);
  }, [postmanCode]);
  // Navigation Sub-Tabs
  const [activeSubTab, setActiveSubTab] = useState<'LIVE_TRACE' | 'SPLIT_WORKBENCH' | 'CI_EXPORTS'>(
    'LIVE_TRACE'
  );

  // Load Profile States
  const [selectedVus, setSelectedVus] = useState<number>(50);
  const [selectedDuration, setSelectedDuration] = useState<number>(30);

  // Execution States
  const [isRunningAll, setIsRunningAll] = useState<boolean>(false);
  const [runningPhase, setRunningPhase] = useState<'IDLE' | 'E2E_API' | 'K6_LOAD' | 'AST_BOTTLENECK'>(
    'IDLE'
  );
  const [activeRunningStageIndex, setActiveRunningStageIndex] = useState<number>(-1);
  const [hasCompletedRun, setHasCompletedRun] = useState<boolean>(true);

  // Split Workbench Sub-States
  const [activeScriptTab, setActiveScriptTab] = useState<'PLAYWRIGHT' | 'K6'>('PLAYWRIGHT');
  const [activeResultsTab, setActiveResultsTab] = useState<'FUNCTIONAL_ACCORDION' | 'K6_METRICS'>(
    'FUNCTIONAL_ACCORDION'
  );
  const [expandedTestId, setExpandedTestId] = useState<string | null>('TC-008');

  // Sub-Tab Switcher State for CI/CD Parity Bundles (Single Full-Width View)
  const [activeCiTab, setActiveCiTab] = useState<'POSTMAN' | 'JUNIT' | 'ALLURE'>('POSTMAN');

  // Benchmark Data
  const benchmarkTraces = useMemo(() => {
    if (customExecutionTraces && customExecutionTraces.length > 0) {
      return customExecutionTraces;
    }
    return automationSynthesizerService.getBenchmarkExecutionTraces();
  }, [customExecutionTraces]);

  const [selectedTestId, setSelectedTestId] = useState<string>('TC-008');

  const activeTrace = useMemo(() => {
    return benchmarkTraces.find((t) => t.testId === selectedTestId) || benchmarkTraces[0];
  }, [benchmarkTraces, selectedTestId]);

  // k6 Metrics & Functional Assertions (Target-Aware)
  const k6Metrics: K6MetricSummary = useMemo(() => {
    return automationSynthesizerService.getK6MetricSummary(selectedVus, selectedDuration);
  }, [selectedVus, selectedDuration]);

  const functionalResults: FunctionalTestCaseResult[] = useMemo(() => {
    return automationSynthesizerService.getFunctionalTestAssertions(effectiveProjectName);
  }, [effectiveProjectName]);

  // Copy Code Feedback
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Dynamic Release Gate State & Fix Action
  const [dbMigrationApplied, setDbMigrationApplied] = useState(false);

  const handleApplyMigration = () => {
    setDbMigrationApplied(true);
    if (onAppendLog) {
      const migrationSql = effectiveProjectName.includes('Mobospace')
        ? 'ALTER TABLE "Operators" ADD CONSTRAINT chk_operator_tenant CHECK (tenant IN (\'PANCARAN\', \'EXTERNAL\'));'
        : 'CREATE INDEX CONCURRENTLY idx_sessions_token ON "AuthSessions"(token);';
      onAppendLog(`[MIGRATION] Executing migration: ${migrationSql}`);
      onAppendLog('[MIGRATION] SUCCESS: Migration applied in 38ms. Constraint/Index validated.');
      onAppendLog('[RUNNER] Re-evaluating Stage 4 (DB Latency): Reduced from 1,420ms to 8ms under concurrency.');
      onAppendLog('[RELEASE GATE] QUALITY LOCK MET: Gate flipped from BLOCKED (NO-GO) to PRODUCTION GO.');
    }
  };

  const handleCopyCode = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownloadCiFile = (targetTab?: 'POSTMAN' | 'JUNIT' | 'ALLURE') => {
    const tab = targetTab || activeCiTab;
    const slug = effectiveProjectName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    if (tab === 'POSTMAN') {
      downloadFile(`${slug}-postman-collection.json`, postmanCollectionCode, 'application/json');
    } else if (tab === 'JUNIT') {
      downloadFile(`${slug}-junit-report.xml`, junitXmlCode, 'application/xml');
    } else {
      downloadFile(`${slug}-allure-bundle.json`, allureJsonCode, 'application/json');
    }
  };

  // Safe Stage Selection
  const onSelectStageRef = useRef(onSelectStage);
  onSelectStageRef.current = onSelectStage;

  useEffect(() => {
    if (activeTrace.stages.length > 0) {
      const bottleneckStage = activeTrace.stages.find((s) => s.status === 'BOTTLENECK');
      const initialStage = bottleneckStage || activeTrace.stages[0];
      if (initialStage.id !== selectedStageId) {
        onSelectStageRef.current(initialStage, activeTrace);
      }
    }
  }, [activeTrace.testId, selectedStageId]);

  // 1-Click Unified Runner Execution
  const handleRunAll = useCallback(() => {
    setIsRunningAll(true);
    setRunningPhase('E2E_API');
    setActiveRunningStageIndex(0);
    if (onAppendLog) onAppendLog(`[RUNNER] Initiating Phase A: Playwright E2E & API Contract Suite...`);

    // Phase A: Playwright E2E & API (0ms - 800ms)
    setTimeout(() => {
      setActiveRunningStageIndex(1);
    }, 300);

    setTimeout(() => {
      setActiveRunningStageIndex(2);
      setRunningPhase('K6_LOAD');
      if (onAppendLog)
        onAppendLog(
          `[K6 LOAD] Initiating Phase B: Grafana k6 Load Test (${selectedVus} VUs, ${selectedDuration}s duration)...`
        );
    }, 700);

    // Phase B: k6 Load Test Simulation (700ms - 1500ms)
    setTimeout(() => {
      setActiveRunningStageIndex(3);
      setRunningPhase('AST_BOTTLENECK');
      if (onAppendLog)
        onAppendLog(
          `[AST / DB] Initiating Phase C: morluto/rea Database Bottleneck Correlation under concurrency...`
        );
    }, 1200);

    // Phase C: Completion & Bottleneck Pinpointing (1800ms)
    setTimeout(() => {
      setIsRunningAll(false);
      setRunningPhase('IDLE');
      setActiveRunningStageIndex(-1);
      setHasCompletedRun(true);

      const bottleneckStage = activeTrace.stages.find((s) => s.status === 'BOTTLENECK');
      if (bottleneckStage) {
        onSelectStageRef.current(bottleneckStage, activeTrace);
        if (onAppendLog)
          onAppendLog(
            `[RUNNER] COMPLETE: Performance Bottleneck Pinpointed: ${bottleneckStage.label} (${bottleneckStage.latencyMs}ms at ${selectedVus} VUs).`
          );
      } else {
        if (onAppendLog)
          onAppendLog(
            `[RUNNER] COMPLETE: All pipeline stages executed within SLA thresholds at ${selectedVus} VUs.`
          );
      }
    }, 1800);
  }, [activeTrace, selectedVus, selectedDuration, onAppendLog]);

  // Report Download Helpers
  const downloadFile = (filename: string, content: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    if (onAppendLog) onAppendLog(`[REPORT] Successfully generated and downloaded ${filename}`);
  };

  const handleDownloadHtml = () => {
    const reportData = {
      projectName: effectiveProjectName,
      projectMode: 'BLIND_URL',
      sourceIdentifier: effectiveTargetUrl,
      gitRefOrFile: effectiveProjectName,
      generatedAt: new Date().toISOString(),
      executionSummary: automationSynthesizerService.getUnifiedExecutionSummary(
        selectedVus,
        selectedDuration
      ),
    };
    const html = unifiedReportGenerator.generateStandaloneHtmlReport(reportData);
    downloadFile(`onespec-unified-qa-load-report-${Date.now()}.html`, html, 'text/html');
  };

  const handleDownloadMarkdown = () => {
    const reportData = {
      projectName: effectiveProjectName,
      projectMode: 'BLIND_URL',
      sourceIdentifier: effectiveTargetUrl,
      gitRefOrFile: effectiveProjectName,
      generatedAt: new Date().toISOString(),
      executionSummary: automationSynthesizerService.getUnifiedExecutionSummary(
        selectedVus,
        selectedDuration
      ),
    };
    const md = unifiedReportGenerator.generateMarkdownReport(reportData);
    downloadFile(`onespec-iso29119-report-${Date.now()}.md`, md, 'text/markdown');
  };

  const handleDownloadJsonBundle = () => {
    const reportData = {
      projectName: effectiveProjectName,
      projectMode: 'BLIND_URL',
      sourceIdentifier: effectiveTargetUrl,
      gitRefOrFile: effectiveProjectName,
      generatedAt: new Date().toISOString(),
      executionSummary: automationSynthesizerService.getUnifiedExecutionSummary(
        selectedVus,
        selectedDuration
      ),
    };
    const junitXml = automationSynthesizerService.generateJunitXmlReport();
    const json = unifiedReportGenerator.generateJsonBundle(reportData, junitXml);
    downloadFile(`onespec-telemetry-bundle-${Date.now()}.json`, json, 'application/json');
  };

  // ReactFlow Nodes & Edges Setup
  const initialNodes: Node[] = useMemo(() => {
    return activeTrace.stages.map((stg, index) => ({
      id: stg.id,
      type: 'pipelineStageNode',
      position: { x: index * 350 + 20, y: 70 },
      data: {
        stage: stg,
        isActiveRunning: isRunningAll && activeRunningStageIndex === index,
        k6P95LatencyMs: index === 3 ? k6Metrics.latency.p95 : stg.latencyMs,
        onSelect: (s: ExecutionPipelineStage) => onSelectStage(s, activeTrace),
      },
    }));
  }, [activeTrace, isRunningAll, activeRunningStageIndex, onSelectStage, k6Metrics.latency.p95]);

  const initialEdges: Edge[] = useMemo(() => {
    const eds: Edge[] = [];
    for (let i = 0; i < activeTrace.stages.length - 1; i++) {
      const source = activeTrace.stages[i];
      const target = activeTrace.stages[i + 1];
      const isBottleneckNext = target.status === 'BOTTLENECK';

      eds.push({
        id: `e-${source.id}-${target.id}`,
        source: source.id,
        target: target.id,
        type: 'smoothstep',
        animated: isRunningAll || isBottleneckNext,
        style: {
          stroke: isBottleneckNext ? '#EF4444' : '#3B82F6',
          strokeWidth: 2,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isBottleneckNext ? '#EF4444' : '#3B82F6',
        },
      });
    }
    return eds;
  }, [activeTrace, isRunningAll]);

  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  // Script Contents
  const playwrightSpecCode = useMemo(() => {
    return effectivePlaywrightCode;
  }, [effectivePlaywrightCode]);

  const k6ScriptCode = useMemo(() => {
    return effectiveK6Code;
  }, [effectiveK6Code]);

  const postmanCollectionCode = useMemo(() => {
    return effectivePostmanCode;
  }, [effectivePostmanCode]);

  const junitXmlCode = useMemo(() => {
    return automationSynthesizerService.generateJunitXmlReport();
  }, []);

  const allureJsonCode = useMemo(() => {
    return automationSynthesizerService.generateAllureJsonReport();
  }, []);

  return (
    <div className="h-full flex flex-col space-y-2 overflow-hidden font-mono text-[11px]">
      {/* =========================================================================
       * ROW 1: SUB-VIEW SWITCHER + DYNAMIC RELEASE GATE BADGE (NO-GO / GO)
       * ========================================================================= */}
      <div className="h-9 bg-[#16191F] border border-[#22262E] px-3 flex items-center justify-between shrink-0 rounded-[3px] gap-2">
        {/* Left: Sub-View Navigation Segmented Tabs */}
        <div className="flex items-center gap-1">
          {[
            {
              id: 'LIVE_TRACE',
              label: '1. Live Execution & Bottleneck Stream',
              icon: <Activity className="h-3.5 w-3.5" />,
            },
            {
              id: 'SPLIT_WORKBENCH',
              label: '2. Test Scripts (.spec.ts & .k6.js) & Live Runner Results',
              icon: <FileCode className="h-3.5 w-3.5" />,
            },
            {
              id: 'CI_EXPORTS',
              label: '3. CI/CD Parity Bundles (Postman, JUnit, Allure)',
              icon: <Layers className="h-3.5 w-3.5" />,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`h-7 px-3 flex items-center gap-1.5 border transition-colors rounded-[2px] text-[11px] cursor-pointer whitespace-nowrap ${
                activeSubTab === tab.id
                  ? 'bg-[#111317] text-[#EDEDED] font-bold border-[#3B82F6]'
                  : 'text-[#707070] hover:text-[#A1A1A1] border-transparent hover:bg-[#111317]/40'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Right: Dynamic Release Gate Badge (Flipping between NO-GO red and GO green) */}
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1.5 px-2.5 h-7 rounded-[2px] border text-[11px] font-mono font-bold whitespace-nowrap ${
              dbMigrationApplied
                ? 'bg-[#10B981]/15 border-[#10B981] text-[#10B981]'
                : 'bg-[#EF4444]/15 border-[#EF4444] text-[#EF4444]'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                dbMigrationApplied ? 'bg-[#10B981]' : 'bg-[#EF4444] animate-pulse'
              }`}
            />
            <span>
              {dbMigrationApplied
                ? 'RELEASE GATE: PRODUCTION GO (ALL SLOS PASS)'
                : 'RELEASE GATE: BLOCKED / NO-GO (DB Lock Contention)'}
            </span>
          </div>

          {!dbMigrationApplied && (
            <button
              onClick={handleApplyMigration}
              className="h-7 px-2.5 bg-[#2563EB]/20 border border-[#2563EB] text-[#3B82F6] hover:bg-[#2563EB] hover:text-white rounded-[2px] text-[10.5px] font-bold cursor-pointer transition-colors whitespace-nowrap"
              title="Apply composite index migration to resolve DB lock contention"
            >
              Apply DB Migration Fix
            </button>
          )}

          {/* WebSocket stream status */}
          <div className="hidden xl:flex items-center gap-1 text-[10px] text-[#707070] pl-2 border-l border-[#22262E] whitespace-nowrap">
            <Radio className="h-2.5 w-2.5 text-[#10B981] animate-pulse" />
            <span>ws:runner-stream</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
       * ROW 2: EXECUTION CONTROLS (Run All + VUs + Duration) & EXPORT REPORT ACTIONS
       * ========================================================================= */}
      <div className="h-9 bg-[#111317] border border-[#22262E] px-3 flex items-center justify-between shrink-0 rounded-[3px] gap-3">
        {/* Left: 1-Click Unified Action & Load Profile Selectors */}
        <div className="flex items-center gap-3">
          {/* Primary Action Button */}
          <button
            onClick={handleRunAll}
            disabled={isRunningAll}
            className="h-7 px-3.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[11px] font-bold rounded-[3px] flex items-center gap-2 disabled:opacity-50 transition-colors cursor-pointer whitespace-nowrap"
          >
            {isRunningAll ? (
              <>
                <RotateCw className="h-3.5 w-3.5 animate-spin" />
                <span>
                  {runningPhase === 'E2E_API'
                    ? 'Running E2E & API Suite...'
                    : runningPhase === 'K6_LOAD'
                    ? `k6 Stressing (${selectedVus} VUs)...`
                    : 'Correlating AST Bottlenecks...'}
                </span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>▶ Run All (E2E + API + k6 Load)</span>
              </>
            )}
          </button>

          {/* Quick Load Profile Config: VUs & Duration */}
          <div className="flex items-center bg-[#0B0C0E] border border-[#22262E] px-2 h-7 rounded-[3px] gap-2 text-[10.5px]">
            <span className="text-[#707070] flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>VUs:</span>
            </span>
            {[10, 50, 100].map((v) => (
              <button
                key={v}
                onClick={() => setSelectedVus(v)}
                className={`px-1.5 py-0.2 rounded-[2px] transition-colors cursor-pointer ${
                  selectedVus === v
                    ? 'bg-[#2563EB] text-white font-bold'
                    : 'text-[#707070] hover:text-[#EDEDED]'
                }`}
              >
                {v}
              </button>
            ))}

            <span className="text-[#22262E]">|</span>

            <span className="text-[#707070] flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>DURATION:</span>
            </span>
            {[15, 30, 60].map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDuration(d)}
                className={`px-1.5 py-0.2 rounded-[2px] transition-colors cursor-pointer ${
                  selectedDuration === d
                    ? 'bg-[#2563EB] text-white font-bold'
                    : 'text-[#707070] hover:text-[#EDEDED]'
                }`}
              >
                {d}s
              </button>
            ))}
          </div>
        </div>

        {/* Right: 1-Click Standalone Report Download Buttons */}
        <div className="flex items-center gap-2">
          <span className="text-[#707070] text-[10px] hidden md:inline whitespace-nowrap">DOWNLOAD REPORT:</span>

          <button
            onClick={handleDownloadHtml}
            disabled={!hasCompletedRun}
            className="flex items-center gap-1.5 h-7 px-2.5 bg-[#16191F] border border-[#22262E] hover:border-[#3B82F6] text-[#EDEDED] rounded-[2px] text-[10.5px] transition-colors cursor-pointer disabled:opacity-40 whitespace-nowrap"
            title="Download Self-Contained Offline HTML Report"
          >
            <Download className="h-3 w-3 text-[#3B82F6]" />
            <span>HTML Report</span>
          </button>

          <button
            onClick={handleDownloadMarkdown}
            disabled={!hasCompletedRun}
            className="flex items-center gap-1.5 h-7 px-2.5 bg-[#16191F] border border-[#22262E] hover:border-[#3B82F6] text-[#A1A1A1] hover:text-[#EDEDED] rounded-[2px] text-[10.5px] transition-colors cursor-pointer disabled:opacity-40 whitespace-nowrap"
            title="Download ISO 29119-3 Markdown Specification Report"
          >
            <FileText className="h-3 w-3 text-[#10B981]" />
            <span>Markdown (.md)</span>
          </button>

          <button
            onClick={handleDownloadJsonBundle}
            disabled={!hasCompletedRun}
            className="flex items-center gap-1.5 h-7 px-2.5 bg-[#16191F] border border-[#22262E] hover:border-[#3B82F6] text-[#A1A1A1] hover:text-[#EDEDED] rounded-[2px] text-[10.5px] transition-colors cursor-pointer disabled:opacity-40 whitespace-nowrap"
            title="Download Raw Telemetry JSON & JUnit XML Bundle"
          >
            <ShieldCheck className="h-3 w-3 text-[#F59E0B]" />
            <span>JSON / JUnit</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
       * SUB-VIEW 1: LIVE EXECUTION & BOTTLENECK STREAM (With k6 Telemetry Strip)
       * ========================================================================= */}
      {activeSubTab === 'LIVE_TRACE' && (
        <div className="flex-1 flex flex-col space-y-2 overflow-hidden min-h-0">
          {/* Upper Telemetry Strip (Uniform 5-column KPI grid, h-[76px]) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 shrink-0">
            {/* Metric 1: Functional E2E */}
            <div className="bg-[#111317] border border-[#22262E] p-3 rounded-[3px] h-[76px] flex flex-col justify-between">
              <div className="text-[10px] text-[#707070] uppercase font-bold tracking-wider">E2E &amp; API Functional</div>
              <div className="flex items-baseline justify-between">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[16px] font-bold text-[#10B981] tabular-nums">7/8</span>
                  <span className="text-[10.5px] text-[#A1A1A1]">Passed</span>
                </div>
                <span className="text-[10.5px] text-[#EF4444] font-bold tabular-nums">1 Failed</span>
              </div>
            </div>

            {/* Metric 2: k6 Virtual Users */}
            <div className="bg-[#111317] border border-[#22262E] p-3 rounded-[3px] h-[76px] flex flex-col justify-between">
              <div className="text-[10px] text-[#707070] uppercase font-bold tracking-wider">k6 Virtual Users</div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[16px] font-bold text-[#60A5FA] tabular-nums">{k6Metrics.vus}</span>
                <span className="text-[10.5px] text-[#A1A1A1]">Active VUs</span>
              </div>
            </div>

            {/* Metric 3: k6 Throughput */}
            <div className="bg-[#111317] border border-[#22262E] p-3 rounded-[3px] h-[76px] flex flex-col justify-between">
              <div className="text-[10px] text-[#707070] uppercase font-bold tracking-wider">Throughput (RPS)</div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[16px] font-bold text-[#EDEDED] tabular-nums">
                  {k6Metrics.throughputRps}
                </span>
                <span className="text-[10.5px] text-[#A1A1A1]">req/s</span>
              </div>
            </div>

            {/* Metric 4: k6 Latency Distribution */}
            <div className="bg-[#111317] border border-[#22262E] p-3 rounded-[3px] h-[76px] flex flex-col justify-between">
              <div className="text-[10px] text-[#707070] uppercase font-bold tracking-wider">Latency p(95) SLO</div>
              <div className="flex items-baseline justify-between">
                <span className="text-[16px] font-bold text-[#EF4444] tabular-nums">
                  {k6Metrics.latency.p95}ms
                </span>
                <span className="text-[9px] text-[#EF4444] border border-[#EF4444]/40 px-1.5 py-0.5 rounded font-mono">
                  BREACH &gt; 500ms
                </span>
              </div>
            </div>

            {/* Metric 5: k6 Error Rate */}
            <div className="bg-[#111317] border border-[#22262E] p-3 rounded-[3px] h-[76px] flex flex-col justify-between">
              <div className="text-[10px] text-[#707070] uppercase font-bold tracking-wider">Error Rate</div>
              <div className="flex items-baseline justify-between">
                <span className="text-[16px] font-bold text-[#10B981] tabular-nums">
                  {k6Metrics.errorRatePercent.toFixed(2)}%
                </span>
                <span className="text-[9px] text-[#10B981] border border-[#10B981]/40 px-1.5 py-0.5 rounded font-mono">
                  SLO PASS
                </span>
              </div>
            </div>
          </div>

          {/* Center Pipeline Canvas (@xyflow/react) */}
          <div className="flex-1 border border-[#22262E] bg-[#0E1015] rounded-[3px] overflow-hidden relative min-h-[360px]">
            {/* Canvas Telemetry Overlay */}
            <div className="absolute top-2 left-2 z-10 bg-[#16191F]/90 backdrop-blur-sm border border-[#22262E] px-2.5 py-1.5 rounded-[3px] text-[10px] text-[#A1A1A1] flex items-center gap-3 pointer-events-none">
              <div>
                <span>Trace: </span>
                <strong className="text-[#EDEDED]">{activeTrace.testId}</strong>
              </div>
              <div>
                <span>Stages: </span>
                <strong className="text-[#3B82F6]">{activeTrace.stages.length}</strong>
              </div>
              <div>
                <span>Single Latency: </span>
                <strong
                  className={`tabular-nums ${
                    activeTrace.totalDurationMs > 500 ? 'text-[#EF4444]' : 'text-[#10B981]'
                  }`}
                >
                  {activeTrace.totalDurationMs}ms
                </strong>
              </div>
              <div>
                <span>Load p(95): </span>
                <strong className="text-[#EF4444] tabular-nums">{k6Metrics.latency.p95}ms</strong>
              </div>
            </div>

            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.18 }}
              minZoom={0.4}
              maxZoom={1.5}
              style={{ width: '100%', height: '100%' }}
              className="bg-[#0B0C0E]"
            >
              <Background color="#22262E" gap={16} size={1} />
              <Controls className="!bg-[#16191F] !border-[#22262E] !fill-[#EDEDED] [&>button]:!bg-[#16191F] [&>button]:!border-[#22262E] [&>button]:!text-[#EDEDED] [&>button:hover]:!bg-[#22262E]" />
            </ReactFlow>
          </div>
        </div>
      )}

      {/* =========================================================================
       * SUB-VIEW 2: 50/50 SPLIT WORKBENCH (Dual-Script Monaco + Live Execution Results)
       * ========================================================================= */}
      {activeSubTab === 'SPLIT_WORKBENCH' && (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-2 overflow-hidden min-h-0">
          {/* LEFT 50%: Dual-Script Monaco Editor */}
          <div className="border border-[#22262E] bg-[#111317] rounded-[3px] flex flex-col overflow-hidden">
            {/* Script Tab Switcher */}
            <div className="h-[32px] bg-[#16191F] border-b border-[#22262E] px-2.5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveScriptTab('PLAYWRIGHT')}
                  className={`h-[24px] px-2.5 rounded-[2px] flex items-center gap-1.5 transition-colors cursor-pointer text-[10.5px] ${
                    activeScriptTab === 'PLAYWRIGHT'
                      ? 'bg-[#111317] text-[#EDEDED] font-bold border border-[#3B82F6]'
                      : 'text-[#707070] hover:text-[#EDEDED]'
                  }`}
                >
                  <FileCode className="h-3 w-3 text-[#3B82F6]" />
                  <span>tests/e2e/{effectiveProjectName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.spec.ts</span>
                </button>

                <button
                  onClick={() => setActiveScriptTab('K6')}
                  className={`h-[24px] px-2.5 rounded-[2px] flex items-center gap-1.5 transition-colors cursor-pointer text-[10.5px] ${
                    activeScriptTab === 'K6'
                      ? 'bg-[#111317] text-[#EDEDED] font-bold border border-[#3B82F6]'
                      : 'text-[#707070] hover:text-[#EDEDED]'
                  }`}
                >
                  <Zap className="h-3 w-3 text-[#10B981]" />
                  <span>tests/load/{effectiveProjectName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.k6.js</span>
                </button>
              </div>

              <button
                onClick={() => {
                  const code = activeScriptTab === 'PLAYWRIGHT' ? playwrightSpecCode : k6ScriptCode;
                  navigator.clipboard.writeText(code);
                  setCopiedKey(activeScriptTab);
                  setTimeout(() => setCopiedKey(null), 2000);
                }}
                className="flex items-center gap-1 px-2 py-0.5 text-[10px] text-[#A1A1A1] hover:text-white bg-[#0B0C0E] border border-[#22262E] rounded-[2px] cursor-pointer"
              >
                {copiedKey === activeScriptTab ? (
                  <>
                    <Check className="h-3 w-3 text-[#10B981]" />
                    <span className="text-[#10B981]">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* Monaco Editor Container */}
            <div className="flex-1">
              <MonacoEditor
                height="100%"
                language={activeScriptTab === 'PLAYWRIGHT' ? 'typescript' : 'javascript'}
                theme="vs-dark"
                value={activeScriptTab === 'PLAYWRIGHT' ? playwrightSpecCode : k6ScriptCode}
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  fontSize: 11,
                  fontFamily: 'JetBrains Mono, Menlo, monospace',
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                }}
              />
            </div>
          </div>

          {/* RIGHT 50%: In-Platform Unified Execution Results */}
          <div className="border border-[#22262E] bg-[#111317] rounded-[3px] flex flex-col overflow-hidden">
            {/* Results Tab Switcher */}
            <div className="h-[32px] bg-[#16191F] border-b border-[#22262E] px-2.5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveResultsTab('FUNCTIONAL_ACCORDION')}
                  className={`h-[24px] px-2.5 rounded-[2px] flex items-center gap-1.5 transition-colors cursor-pointer text-[10.5px] ${
                    activeResultsTab === 'FUNCTIONAL_ACCORDION'
                      ? 'bg-[#111317] text-[#EDEDED] font-bold border border-[#3B82F6]'
                      : 'text-[#707070] hover:text-[#EDEDED]'
                  }`}
                >
                  <CheckCircle2 className="h-3 w-3 text-[#3B82F6]" />
                  <span>Functional E2E Assertions (TC-001–008)</span>
                </button>

                <button
                  onClick={() => setActiveResultsTab('K6_METRICS')}
                  className={`h-[24px] px-2.5 rounded-[2px] flex items-center gap-1.5 transition-colors cursor-pointer text-[10.5px] ${
                    activeResultsTab === 'K6_METRICS'
                      ? 'bg-[#111317] text-[#EDEDED] font-bold border border-[#3B82F6]'
                      : 'text-[#707070] hover:text-[#EDEDED]'
                  }`}
                >
                  <Gauge className="h-3 w-3 text-[#10B981]" />
                  <span>k6 Load &amp; Stress Metrics</span>
                </button>
              </div>

              <span className="text-[10px] text-[#A1A1A1] tabular-nums">
                {activeResultsTab === 'FUNCTIONAL_ACCORDION' ? '8 Test Cases' : `${selectedVus} VUs Profile`}
              </span>
            </div>

            {/* Tab 1: Functional E2E & API Accordion */}
            {activeResultsTab === 'FUNCTIONAL_ACCORDION' && (
              <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                {functionalResults.map((t) => {
                  const isExpanded = expandedTestId === t.testId;
                  const isPassed = t.verdict === 'PASSED';

                  return (
                    <div
                      key={t.testId}
                      className={`border rounded-[2px] transition-colors ${
                        isExpanded
                          ? 'border-[#3B82F6] bg-[#0E1015]'
                          : isPassed
                          ? 'border-[#22262E] hover:border-[#3B82F6]/50 bg-[#0B0C0E]'
                          : 'border-[#EF4444]/60 bg-[#EF4444]/5'
                      }`}
                    >
                      {/* Accordion Row Header */}
                      <button
                        onClick={() => setExpandedTestId(isExpanded ? null : t.testId)}
                        className="w-full p-2 flex items-center justify-between text-left cursor-pointer"
                      >
                        <div className="flex items-center gap-2 truncate">
                          {isExpanded ? (
                            <ChevronDown className="h-3.5 w-3.5 text-[#3B82F6] shrink-0" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5 text-[#707070] shrink-0" />
                          )}
                          <span className="font-bold text-[#EDEDED] font-mono">{t.testId}</span>
                          <span className="text-[#A1A1A1] truncate text-[11px]">{t.title}</span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[#707070] text-[10px] tabular-nums font-mono">
                            {t.durationMs}ms
                          </span>
                          <span
                            className={`px-1.5 py-0.2 rounded-[2px] text-[9px] font-bold ${
                              isPassed
                                ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]'
                                : 'bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]'
                            }`}
                          >
                            {t.verdict}
                          </span>
                        </div>
                      </button>

                      {/* Accordion Expanded Details */}
                      {isExpanded && (
                        <div className="px-3 pb-2.5 pt-1 border-t border-[#22262E] text-[10.5px] space-y-2">
                          <div className="flex items-center gap-4 text-[#707070]">
                            <span>
                              Ref: <strong className="text-[#EDEDED]">{t.ruleRef}</strong>
                            </span>
                            <span>
                              HTTP Status: <strong className="text-[#EDEDED]">{t.httpStatus}</strong> (Expected: {t.expectedHttpStatus})
                            </span>
                            <span>
                              Scenario: <strong className="text-[#60A5FA]">{t.scenarioType}</strong>
                            </span>
                          </div>

                          {/* Step-by-Step Assertions */}
                          <div className="space-y-1">
                            <span className="text-[#707070] font-bold uppercase text-[9.5px]">
                              Step Execution Details:
                            </span>
                            {t.steps.map((stg) => (
                              <div
                                key={stg.stepNumber}
                                className="flex items-start gap-2 bg-[#111317] p-1.5 rounded-[2px] border border-[#22262E]"
                              >
                                <span
                                  className={`px-1 py-0.2 rounded text-[9px] font-bold shrink-0 ${
                                    stg.status === 'PASSED'
                                      ? 'bg-[#10B981]/20 text-[#10B981]'
                                      : 'bg-[#EF4444]/20 text-[#EF4444]'
                                  }`}
                                >
                                  STEP {stg.stepNumber}
                                </span>
                                <div className="flex-1 truncate">
                                  <div className="text-[#EDEDED]">{stg.action}</div>
                                  <div className="text-[#707070] text-[10px]">
                                    Actual: <span className="text-[#A1A1A1]">{stg.actual}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Diagnostics / Error Payload if Present */}
                          {t.errorPayload && (
                            <div className="p-2 bg-[#EF4444]/10 border border-[#EF4444]/40 rounded-[2px] space-y-1">
                              <span className="text-[#EF4444] font-bold uppercase text-[9.5px]">
                                Diagnostics &amp; Response Payload:
                              </span>
                              <pre className="text-[10px] text-[#F87171] overflow-x-auto p-1 bg-[#060709] rounded border border-[#EF4444]/20">
                                {JSON.stringify(t.errorPayload, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Tab 2: k6 Load & Stress Test Summary Table */}
            {activeResultsTab === 'K6_METRICS' && (
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {/* SLO Thresholds Check */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold text-[#707070] uppercase">SLO Threshold Checks</div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between p-1.5 bg-[#10B981]/10 border border-[#10B981]/40 rounded-[2px]">
                      <div className="flex items-center gap-1.5 text-[#10B981]">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>http_req_failed &lt; 1.00%</span>
                      </div>
                      <span className="font-bold text-[#10B981] tabular-nums">
                        {k6Metrics.errorRatePercent.toFixed(2)}% (PASS)
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-1.5 bg-[#EF4444]/10 border border-[#EF4444]/40 rounded-[2px]">
                      <div className="flex items-center gap-1.5 text-[#EF4444]">
                        <AlertOctagon className="h-3.5 w-3.5" />
                        <span>http_req_duration p(95) &lt; 500ms</span>
                      </div>
                      <span className="font-bold text-[#EF4444] tabular-nums">
                        {k6Metrics.latency.p95}ms (BREACH)
                      </span>
                    </div>
                  </div>
                </div>

                {/* High-Density Latency Distribution Table */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold text-[#707070] uppercase">
                    Latency Distribution Percentiles
                  </div>
                  <div className="border border-[#22262E] rounded-[2px] overflow-hidden">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-[#16191F] text-[#707070] border-b border-[#22262E]">
                          <th className="p-1.5 font-bold">PERCENTILE</th>
                          <th className="p-1.5 font-bold">LATENCY</th>
                          <th className="p-1.5 font-bold">TARGET SLA</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#22262E]">
                        <tr>
                          <td className="p-1.5 text-[#A1A1A1]">Minimum</td>
                          <td className="p-1.5 font-bold tabular-nums text-[#10B981]">{k6Metrics.latency.min}ms</td>
                          <td className="p-1.5 text-[#707070]">&lt; 100ms</td>
                        </tr>
                        <tr>
                          <td className="p-1.5 text-[#A1A1A1]">Median (p50)</td>
                          <td className="p-1.5 font-bold tabular-nums text-[#10B981]">{k6Metrics.latency.med}ms</td>
                          <td className="p-1.5 text-[#707070]">&lt; 150ms</td>
                        </tr>
                        <tr>
                          <td className="p-1.5 text-[#A1A1A1]">Average</td>
                          <td className="p-1.5 font-bold tabular-nums text-[#EDEDED]">{k6Metrics.latency.avg}ms</td>
                          <td className="p-1.5 text-[#707070]">&lt; 200ms</td>
                        </tr>
                        <tr>
                          <td className="p-1.5 text-[#A1A1A1]">p90</td>
                          <td className="p-1.5 font-bold tabular-nums text-[#F59E0B]">{k6Metrics.latency.p90}ms</td>
                          <td className="p-1.5 text-[#707070]">&lt; 350ms</td>
                        </tr>
                        <tr className="bg-[#EF4444]/5">
                          <td className="p-1.5 font-bold text-[#EF4444]">p95 (SLO)</td>
                          <td className="p-1.5 font-bold tabular-nums text-[#EF4444]">{k6Metrics.latency.p95}ms</td>
                          <td className="p-1.5 text-[#EF4444] font-bold">&lt; 500ms</td>
                        </tr>
                        <tr>
                          <td className="p-1.5 text-[#A1A1A1]">p99</td>
                          <td className="p-1.5 font-bold tabular-nums text-[#EF4444]">{k6Metrics.latency.p99}ms</td>
                          <td className="p-1.5 text-[#707070]">&lt; 1,000ms</td>
                        </tr>
                        <tr>
                          <td className="p-1.5 text-[#A1A1A1]">Maximum</td>
                          <td className="p-1.5 font-bold tabular-nums text-[#EF4444]">{k6Metrics.latency.max}ms</td>
                          <td className="p-1.5 text-[#707070]">--</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Throughput & Volume Metrics */}
                <div className="grid grid-cols-2 gap-2 text-[10.5px]">
                  <div className="bg-[#0B0C0E] border border-[#22262E] p-2 rounded-[2px]">
                    <span className="text-[#707070] block">Total Ingested Requests</span>
                    <span className="text-[13px] font-bold text-[#EDEDED] tabular-nums">
                      {k6Metrics.totalRequests.toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-[#0B0C0E] border border-[#22262E] p-2 rounded-[2px]">
                    <span className="text-[#707070] block">Throughput Rate</span>
                    <span className="text-[13px] font-bold text-[#60A5FA] tabular-nums">
                      {k6Metrics.throughputRps} req/s
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
       * SUB-VIEW 3: CI/CD PARITY BUNDLES (Postman, JUnit, Allure)
       * ========================================================================= */}
      {activeSubTab === 'CI_EXPORTS' && (
        <div className="flex-1 flex flex-col border border-[#22262E] bg-[#111317] rounded-[3px] overflow-hidden min-h-0">
          {/* Sub-view Tab Toolbar */}
          <div className="h-[36px] bg-[#16191F] border-b border-[#22262E] px-3 flex items-center justify-between shrink-0">
            {/* Left: Sub-tab switcher */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveCiTab('POSTMAN')}
                className={`px-3 py-1 text-[11px] font-mono rounded-[2px] transition-colors cursor-pointer ${
                  activeCiTab === 'POSTMAN'
                    ? 'bg-[#2563EB] text-white font-semibold'
                    : 'text-[#A1A1A1] hover:text-[#EDEDED] hover:bg-[#0B0C0E]'
                }`}
              >
                Postman v2.1 Collection
              </button>
              <button
                onClick={() => setActiveCiTab('JUNIT')}
                className={`px-3 py-1 text-[11px] font-mono rounded-[2px] transition-colors cursor-pointer ${
                  activeCiTab === 'JUNIT'
                    ? 'bg-[#2563EB] text-white font-semibold'
                    : 'text-[#A1A1A1] hover:text-[#EDEDED] hover:bg-[#0B0C0E]'
                }`}
              >
                JUnit XML (ISO 29119-3)
              </button>
              <button
                onClick={() => setActiveCiTab('ALLURE')}
                className={`px-3 py-1 text-[11px] font-mono rounded-[2px] transition-colors cursor-pointer ${
                  activeCiTab === 'ALLURE'
                    ? 'bg-[#2563EB] text-white font-semibold'
                    : 'text-[#A1A1A1] hover:text-[#EDEDED] hover:bg-[#0B0C0E]'
                }`}
              >
                Allure 2 JSON Bundle
              </button>
            </div>

            {/* Right: Copy & Download Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const val =
                    activeCiTab === 'POSTMAN'
                      ? postmanCollectionCode
                      : activeCiTab === 'JUNIT'
                      ? junitXmlCode
                      : allureJsonCode;
                  handleCopyCode(val, activeCiTab);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-[#0B0C0E] border border-[#22262E] hover:border-[#3B82F6] text-[#A1A1A1] hover:text-[#EDEDED] rounded-[2px] text-[11px] font-mono transition-colors cursor-pointer"
              >
                {copiedKey === activeCiTab ? (
                  <>
                    <Check className="h-3 w-3 text-[#10B981]" />
                    <span className="text-[#10B981]">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>

              <button
                onClick={() => handleDownloadCiFile(activeCiTab)}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-[2px] text-[11px] font-mono transition-colors cursor-pointer"
              >
                <Download className="h-3 w-3" />
                <span>Download File</span>
              </button>
            </div>
          </div>

          {/* Full-width Monaco Editor */}
          <div className="flex-1 min-h-0">
            <MonacoEditor
              height="100%"
              language={activeCiTab === 'JUNIT' ? 'xml' : 'json'}
              theme="vs-dark"
              value={
                activeCiTab === 'POSTMAN'
                  ? postmanCollectionCode
                  : activeCiTab === 'JUNIT'
                  ? junitXmlCode
                  : allureJsonCode
              }
              options={{
                readOnly: true,
                minimap: { enabled: true },
                fontSize: 12,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                fontFamily: 'JetBrains Mono, Geist Mono, monospace',
                automaticLayout: true,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
