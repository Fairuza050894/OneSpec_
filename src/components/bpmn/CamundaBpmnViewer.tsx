'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import 'bpmn-js/dist/assets/diagram-js.css';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  AlertTriangle,
  Play,
  RotateCw,
  CheckCircle2,
  Download,
  Copy,
  Check,
  Activity,
} from 'lucide-react';
import { useStudioLocale } from '@/lib/i18n';

export interface BpmnNodeClickEvent {
  id: string;
  type: string;
  name: string;
  businessRuleId?: string;
  userStoryId?: string;
  validationRuleId?: string;
  laneTitle?: string;
  rawElement?: unknown;
}

interface CamundaBpmnViewerProps {
  xml: string;
  onNodeSelect?: (node: BpmnNodeClickEvent) => void;
  selectedNodeId?: string | null;
  onSimulationStep?: (stepName: string, nodeId: string) => void;
}

const delay = (ms: number): Promise<void> => {
  const { promise, resolve } = Promise.withResolvers<void>();
  setTimeout(resolve, ms);
  return promise;
};

interface FlowStep {
  nodeId: string;
  name: string;
  edgeId?: string;
  tokenLabel: string;
}

export function CamundaBpmnViewer({
  xml,
  onNodeSelect,
  selectedNodeId,
  onSimulationStep,
}: CamundaBpmnViewerProps) {
  const { copy } = useStudioLocale();
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [activeStepText, setActiveStepText] = useState<string | null>(null);
  const [simulationVerdict, setSimulationVerdict] = useState<'IDLE' | 'RUNNING' | 'SUCCESS' | 'REJECTED'>('IDLE');
  const [copiedXml, setCopiedXml] = useState<boolean>(false);

  // Clear all overlays and SVG inline visual styles
  const clearVisualSimulation = useCallback(() => {
    if (!viewerRef.current) return;
    try {
      const overlays = viewerRef.current.get('overlays');
      overlays.clear();

      const elementRegistry = viewerRef.current.get('elementRegistry');
      const allElements = elementRegistry.getAll();
      for (const el of allElements) {
        const gfx = elementRegistry.getGraphics(el.id);
        if (gfx) {
          const shape = gfx.querySelector('.djs-visual > :first-child');
          if (shape) {
            shape.removeAttribute('style');
          }
          const path = gfx.querySelector('.djs-visual > path');
          if (path) {
            path.removeAttribute('style');
          }
        }
      }
    } catch {}
  }, []);

  // Sync external selectedNodeId
  useEffect(() => {
    if (!viewerRef.current || !selectedNodeId) return;
    try {
      const elementRegistry = viewerRef.current.get('elementRegistry');
      const gfx = elementRegistry.getGraphics(selectedNodeId);
      if (gfx) {
        const shape = gfx.querySelector('.djs-visual > :first-child');
        if (shape) {
          shape.style.stroke = '#3B82F6';
          shape.style.strokeWidth = '3px';
        }
      }
    } catch {}
  }, [selectedNodeId]);

  useEffect(() => {
    let viewer: any = null;
    let timer1: any;
    let timer2: any;
    let resizeObserver: ResizeObserver | null = null;

    async function initBpmnViewer() {
      if (!containerRef.current) return;

      try {
        const BpmnViewerModule = await import('bpmn-js/dist/bpmn-navigated-viewer.production.min.js');
        const BpmnViewer = (BpmnViewerModule as any).default || BpmnViewerModule;

        containerRef.current.innerHTML = '';
        viewer = new BpmnViewer({
          container: containerRef.current,
        });

        viewerRef.current = viewer;

        await viewer.importXML(xml);
        setError(null);

        const canvas = viewer.get('canvas');
        const fitCanvas = () => {
          try {
            canvas.zoom('fit-viewport', 'auto');
            const currentZoom = canvas.zoom();
            if (Number.isFinite(currentZoom)) {
              if (currentZoom < 0.65) {
                try {
                  canvas.zoom('fit-viewport', { top: 24, right: 24, bottom: 24, left: 24 });
                } catch {
                  canvas.zoom(Math.min(Math.max(currentZoom * 1.35, 0.75), 1.1));
                }
              }
              setZoomLevel(canvas.zoom());
            }
          } catch {
            try {
              canvas.zoom(0.95);
              setZoomLevel(0.95);
            } catch {}
          }
        };

        fitCanvas();
        requestAnimationFrame(() => {
          fitCanvas();
        });
        timer1 = setTimeout(fitCanvas, 150);
        timer2 = setTimeout(fitCanvas, 400);

        if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
          resizeObserver = new ResizeObserver(() => {
            fitCanvas();
          });
          resizeObserver.observe(containerRef.current);
        }

        viewer.on('element.click', (event: any) => {
          const { element } = event;
          if (!element || element.type === 'bpmn:Process' || element.type === 'bpmn:Collaboration') {
            return;
          }

          const businessObject = element.businessObject || {};
          const name = businessObject.name || element.id;
          const id = element.id;

          let businessRuleId = 'BR-01';
          let userStoryId = 'REQ-US-01';
          let validationRuleId = 'VR-01';
          let laneTitle = 'API Gateway & Service Logic';

          if (id.includes('UserTask') || id.includes('Lane_UI') || id.includes('StartEvent')) {
            laneTitle = 'Presentation Layer (DOM)';
            userStoryId = 'REQ-US-01';
            validationRuleId = 'VR-01';
          } else if (id.includes('ServiceTask_Db') || id.includes('Lane_DB') || id.includes('Success')) {
            laneTitle = 'Persistence & ACID Settlement';
            businessRuleId = 'BR-02 (ACID Row Lock)';
            validationRuleId = 'VR-03';
          } else if (id.includes('Gateway')) {
            laneTitle = 'Gateway Invariant Decision';
            businessRuleId = 'BR-01, BR-02';
            validationRuleId = 'VR-01, VR-02';
          }

          if (onNodeSelect) {
            onNodeSelect({
              id,
              type: element.type,
              name,
              businessRuleId,
              userStoryId,
              validationRuleId,
              laneTitle,
              rawElement: element,
            });
          }
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('Failed to render BPMN 2.0 XML:', msg);
        setError(msg);
      }
    }

    initBpmnViewer();

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (viewer) {
        try {
          viewer.destroy();
        } catch {}
      }
    };
  }, [xml, onNodeSelect]);

  const handleZoomIn = () => {
    if (!viewerRef.current) return;
    const canvas = viewerRef.current.get('canvas');
    const newZoom = canvas.zoom() * 1.2;
    canvas.zoom(newZoom);
    setZoomLevel(newZoom);
  };

  const handleZoomOut = () => {
    if (!viewerRef.current) return;
    const canvas = viewerRef.current.get('canvas');
    const newZoom = canvas.zoom() * 0.8;
    canvas.zoom(newZoom);
    setZoomLevel(newZoom);
  };

  const handleResetZoom = () => {
    if (!viewerRef.current) return;
    try {
      const canvas = viewerRef.current.get('canvas');
      canvas.zoom('fit-viewport', 'auto');
      const z = canvas.zoom();
      if (Number.isFinite(z) && z < 0.65) {
        try {
          canvas.zoom('fit-viewport', { top: 24, right: 24, bottom: 24, left: 24 });
        } catch {
          canvas.zoom(Math.min(Math.max(z * 1.35, 0.75), 1.1));
        }
      }
      setZoomLevel(canvas.zoom());
    } catch {}
  };

  const handleDownloadXml = () => {
    const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `camunda-orchestrator-${Date.now()}.bpmn`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyXml = () => {
    navigator.clipboard.writeText(xml);
    setCopiedXml(true);
    setTimeout(() => setCopiedXml(false), 2000);
  };

  // HIGH-IMPACT LIVE VISUAL FLOW SIMULATION ENGINE
  const handleRunSimulation = async (outcome: 'HAPPY_PATH' | 'NEGATIVE_PATH' = 'HAPPY_PATH') => {
    if (!viewerRef.current || isSimulating) return;

    setIsSimulating(true);
    setSimulationVerdict('RUNNING');
    clearVisualSimulation();

    const elementRegistry = viewerRef.current.get('elementRegistry');
    const overlays = viewerRef.current.get('overlays');

    let flowSequence: FlowStep[] = [];
    const hasSingleFlow = Boolean(elementRegistry.get('ServiceTask_BackendValidation'));
    if (hasSingleFlow) {
      flowSequence =
        outcome === 'HAPPY_PATH'
          ? [
              {
                nodeId: 'StartEvent_Trigger',
                name: '1. User Ingress Trigger',
                tokenLabel: 'TOKEN #001: USER INGRESS',
              },
              {
                nodeId: 'UserTask_Interaction',
                name: '2. Client Form Input & Dispatch',
                edgeId: 'Flow_StartToUserTask',
                tokenLabel: 'TOKEN #002: FORM DISPATCHED',
              },
              {
                nodeId: 'ServiceTask_GatewayAuth',
                name: '3. API Gateway Signature & Rate Limit',
                edgeId: 'Flow_UserTaskToGatewayAuth',
                tokenLabel: 'TOKEN #003: GATEWAY AUTH [200]',
              },
              {
                nodeId: 'ServiceTask_BackendValidation',
                name: '4. Domain Invariant Rules Engine',
                edgeId: 'Flow_GatewayToValidation',
                tokenLabel: 'TOKEN #004: INVARIANTS SATISFIED',
              },
              {
                nodeId: 'Gateway_ValidationDecision',
                name: '5. Contract Decision Gateway',
                edgeId: 'Flow_ValidationToDecision',
                tokenLabel: 'TOKEN #005: DECISION: VALID',
              },
              {
                nodeId: 'ServiceTask_DbCommit',
                name: '6. Persistence ACID Commit & Row Lock',
                edgeId: 'Flow_DecisionHappyPath',
                tokenLabel: 'TOKEN #006: ACID ROW LOCKED',
              },
              {
                nodeId: 'EndEvent_Success',
                name: '7. Transaction Completed [HTTP 200 OK]',
                edgeId: 'Flow_DbToSuccess',
                tokenLabel: 'TOKEN #007: SETTLED [HTTP 200 OK]',
              },
            ]
          : [
              {
                nodeId: 'StartEvent_Trigger',
                name: '1. User Ingress Trigger',
                tokenLabel: 'TOKEN #001: USER INGRESS',
              },
              {
                nodeId: 'UserTask_Interaction',
                name: '2. Client Form Input & Dispatch',
                edgeId: 'Flow_StartToUserTask',
                tokenLabel: 'TOKEN #002: MALFORMED PAYLOAD',
              },
              {
                nodeId: 'ServiceTask_GatewayAuth',
                name: '3. API Gateway Signature Verification',
                edgeId: 'Flow_UserTaskToGatewayAuth',
                tokenLabel: 'TOKEN #003: GATEWAY INGRESS',
              },
              {
                nodeId: 'ServiceTask_BackendValidation',
                name: '4. Domain Invariant Violation Detected',
                edgeId: 'Flow_GatewayToValidation',
                tokenLabel: 'TOKEN #004: INVARIANT FAILED',
              },
              {
                nodeId: 'Gateway_ValidationDecision',
                name: '5. Contract Decision Gateway: REJECT',
                edgeId: 'Flow_ValidationToDecision',
                tokenLabel: 'TOKEN #005: DECISION: REJECT',
              },
              {
                nodeId: 'EndEvent_ErrorFeedback',
                name: '6. Client Feedback Rejection [HTTP 422]',
                edgeId: 'Flow_DecisionNegativePath',
                tokenLabel: 'TOKEN #006: REJECTION BANNER [422]',
              },
            ];
    } else {
      // Dynamic graph traversal for multi-module BPMN 2.0 workflows
      const visited = new Set<string>();
      let current: any = elementRegistry.get('StartEvent_Trigger');
      let incomingEdgeId: string | undefined = undefined;
      let stepNum = 1;
      while (current && !visited.has(current.id) && stepNum <= 80) {
        visited.add(current.id);
        const elName = current.businessObject?.name || current.id;
        flowSequence.push({
          nodeId: current.id,
          name: `${stepNum}. ${elName}`,
          edgeId: incomingEdgeId,
          tokenLabel: `TOKEN #${String(stepNum).padStart(3, '0')}: ${elName.slice(0, 26).toUpperCase()}`,
        });
        stepNum++;
        const outgoing: any[] = current.outgoing || [];
        if (outgoing.length === 0) break;
        let chosenFlow = outgoing[0];
        if (outgoing.length > 1) {
          chosenFlow =
            outgoing.find((f: any) =>
              outcome === 'HAPPY_PATH'
                ? f.id === 'Flow_DecisionHappyPath' || /yes|valid/i.test(f.businessObject?.name || '')
                : f.id === 'Flow_DecisionNegativePath' || /no|reject/i.test(f.businessObject?.name || '')
            ) || outgoing[0];
        }
        incomingEdgeId = chosenFlow?.id;
        current = chosenFlow?.target;
      }
    }
    const isHappy = outcome === 'HAPPY_PATH';

    for (let i = 0; i < flowSequence.length; i++) {
      const step = flowSequence[i];
      setActiveStepText(step.name);

      if (onSimulationStep) {
        onSimulationStep(step.name, step.nodeId);
      }

      // 1. Animate Incoming Sequence Flow Edge
      if (step.edgeId) {
        try {
          const edgeGfx = elementRegistry.getGraphics(step.edgeId);
          const path = edgeGfx?.querySelector('.djs-visual > path');
          if (path) {
            path.style.stroke = isHappy ? '#10B981' : '#EF4444';
            path.style.strokeWidth = '3.5px';
            path.style.strokeDasharray = '8 4';
            path.style.animation = 'flowPulse 0.4s linear infinite';
            path.style.filter = `drop-shadow(0 0 6px ${isHappy ? '#10B981' : '#EF4444'})`;
          }
        } catch {}
      }

      // 2. Animate and Highlight Active Node
      try {
        const nodeGfx = elementRegistry.getGraphics(step.nodeId);
        const shape = nodeGfx?.querySelector('.djs-visual > :first-child');
        if (shape) {
          shape.style.stroke = '#3B82F6';
          shape.style.strokeWidth = '4px';
          shape.style.fill = 'rgba(37, 99, 235, 0.35)';
          shape.style.filter = 'drop-shadow(0 0 12px rgba(59, 130, 246, 0.85))';
        }
      } catch {}

      // 3. Add Live Pulsing Overlays Badge
      try {
        overlays.clear();
        overlays.add(step.nodeId, 'flow-token', {
          position: { top: -24, left: 10 },
          html: `<div class="flow-token-pill ${isHappy ? 'token-green' : 'token-red'}">
            <span class="token-ping"></span>
            <span class="token-text">${step.tokenLabel}</span>
          </div>`,
        });
      } catch {}

      await delay(550);

      // 4. Settle Node Color to permanent passed/failed state
      try {
        const nodeGfx = elementRegistry.getGraphics(step.nodeId);
        const shape = nodeGfx?.querySelector('.djs-visual > :first-child');
        if (shape) {
          shape.style.stroke = isHappy ? '#10B981' : '#EF4444';
          shape.style.strokeWidth = '2.5px';
          shape.style.fill = isHappy ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)';
          shape.style.filter = `drop-shadow(0 0 4px ${isHappy ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'})`;
        }
      } catch {}
    }

    setIsSimulating(false);
    setActiveStepText(null);
    setSimulationVerdict(isHappy ? 'SUCCESS' : 'REJECTED');
  };

  return (
    <div className="relative w-full h-full flex-1 bg-[#0E1015] border border-[#22262E] rounded-[2px] overflow-hidden flex flex-col min-h-[480px]">
      {/* Modeler & Orchestrator Toolbar */}
      <div className="min-h-[36px] py-1 bg-[#16191F] border-b border-[#22262E] px-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono z-10 select-none shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Activity className="h-4 w-4 text-[#3B82F6] shrink-0" />
          <span className="text-[#EDEDED] font-bold whitespace-nowrap">Camunda Modeler</span>
          <span className="hidden xl:inline badge-tag px-1.5 py-0.2 bg-[#3B82F6]/20 text-[#3B82F6] font-bold text-[9px] whitespace-nowrap">
            Camunda 8 / 7
          </span>

          {simulationVerdict !== 'IDLE' && (
            <span
              className={`badge-tag px-2 py-0.5 rounded-[2px] font-bold text-[10px] flex items-center gap-1 whitespace-nowrap ${
                simulationVerdict === 'SUCCESS'
                  ? 'bg-[#059669]/20 text-[#10B981] border border-[#10B981]'
                  : simulationVerdict === 'REJECTED'
                  ? 'bg-[#DC2626]/20 text-[#EF4444] border border-[#EF4444]'
                  : 'bg-[#2563EB]/20 text-[#3B82F6] border border-[#3B82F6] animate-pulse'
              }`}
            >
              {simulationVerdict === 'SUCCESS' ? (
                <>
                  <CheckCircle2 className="h-3 w-3 shrink-0" />
                  <span>PIPELINE VERIFIED [200]</span>
                </>
              ) : simulationVerdict === 'REJECTED' ? (
                <span>REJECTION VERIFIED [422]</span>
              ) : (
                <span className="truncate max-w-[200px]">{activeStepText || 'ORCHESTRATING...'}</span>
              )}
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Visual Simulation triggers */}
          <button
            onClick={() => handleRunSimulation('HAPPY_PATH')}
            disabled={isSimulating}
            className="h-7 px-2.5 bg-[#059669] hover:bg-[#047857] disabled:opacity-50 text-white rounded-[2px] font-bold flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap shrink-0"
            title="Execute Live Visual Token Flow Simulation through Presentation -> Gateway -> Logic -> DB"
          >
            {isSimulating ? <RotateCw className="h-3 w-3 animate-spin shrink-0" /> : <Play className="h-3 w-3 fill-current shrink-0" />}
            <span>{copy.step02.simulateNominal}</span>
          </button>

          <button
            onClick={() => handleRunSimulation('NEGATIVE_PATH')}
            disabled={isSimulating}
            className="h-7 px-2 bg-[#16191F] border border-[#22262E] hover:border-[#EF4444] text-[#A1A1A1] hover:text-[#EF4444] disabled:opacity-50 rounded-[2px] flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap shrink-0"
            title="Simulate Negative Rejection Flow"
          >
            <span>{copy.step02.simulateRejection}</span>
          </button>
          <button
            onClick={clearVisualSimulation}
            disabled={isSimulating}
            className="p-1 hover:bg-[#22262E] text-[#707070] hover:text-[#EDEDED] rounded-[2px] cursor-pointer"
            title="Clear Simulation Markers"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>

          <div className="h-4 w-px bg-[#22262E] mx-1" />

          {/* Zoom controls */}
          <span className="text-[10px] text-[#707070] mr-0.5 tabular-nums hidden lg:inline">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-1 hover:bg-[#22262E] text-[#A1A1A1] hover:text-[#EDEDED] rounded-[2px] cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-1 hover:bg-[#22262E] text-[#A1A1A1] hover:text-[#EDEDED] rounded-[2px] cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleResetZoom}
            className="p-1 hover:bg-[#22262E] text-[#A1A1A1] hover:text-[#EDEDED] rounded-[2px] cursor-pointer"
            title="Fit Viewport"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>

          <div className="h-4 w-px bg-[#22262E] mx-1" />

          {/* Export BPMN XML */}
          <button
            onClick={handleCopyXml}
            className="p-1 hover:bg-[#22262E] text-[#A1A1A1] hover:text-[#EDEDED] rounded-[2px] cursor-pointer"
            title="Copy Camunda 8/7 BPMN 2.0 XML"
          >
            {copiedXml ? <Check className="h-3.5 w-3.5 text-[#10B981]" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={handleDownloadXml}
            className="p-1 hover:bg-[#22262E] text-[#A1A1A1] hover:text-[#EDEDED] rounded-[2px] cursor-pointer"
            title="Download Camunda .bpmn File"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {error ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-xs font-mono text-[#DC2626]">
          <AlertTriangle className="h-6 w-6 mb-2" />
          <div className="font-bold">Failed to render BPMN 2.0 XML Schema</div>
          <div className="text-[10px] text-[#707070] mt-1">{error}</div>
        </div>
      ) : (
        <div
          ref={containerRef}
          className="flex-1 w-full h-full bpmn-dark-theme cursor-grab active:cursor-grabbing"
        />
      )}

      {/* Embedded CSS for BPMN Dark Tokens & Live Flow Pulse */}
      <style jsx global>{`
        .bpmn-dark-theme .djs-container {
          background-color: #0b0c0e !important;
        }
        .bpmn-dark-theme .djs-shape .djs-visual rect,
        .bpmn-dark-theme .djs-shape .djs-visual circle,
        .bpmn-dark-theme .djs-shape .djs-visual polygon {
          fill: #111317 !important;
          stroke: #333945 !important;
          stroke-width: 1.5px !important;
          transition: all 0.3s ease;
        }
        .bpmn-dark-theme .djs-shape.djs-participant .djs-visual rect,
        .bpmn-dark-theme .djs-shape.djs-lane .djs-visual rect {
          fill: #0e1015 !important;
          stroke: #22262e !important;
        }
        .bpmn-dark-theme .djs-shape .djs-label text,
        .bpmn-dark-theme .djs-label {
          fill: #ededed !important;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
          font-size: 11.5px !important;
          font-weight: 600 !important;
          letter-spacing: 0.01em !important;
        }
        .bpmn-dark-theme .djs-connection .djs-visual path {
          stroke: #4b5563 !important;
          stroke-width: 1.5px !important;
          transition: all 0.3s ease;
        }
        .bpmn-dark-theme .djs-connection .djs-visual marker path {
          fill: #4b5563 !important;
          stroke: #4b5563 !important;
        }
        .bjs-powered-by {
          display: none !important;
        }
        @keyframes flowPulse {
          to {
            stroke-dashoffset: -24;
          }
        }
        /* Live Floating Token Badge Overlays */
        .flow-token-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 2px 8px;
          border-radius: 4px;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.02em;
          white-space: nowrap;
          pointer-events: none;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
          animation: badgePop 0.25s ease-out;
        }
        .token-green {
          background-color: #059669;
          color: #ffffff;
          border: 1px solid #10b981;
          box-shadow: 0 0 14px rgba(16, 185, 129, 0.6);
        }
        .token-red {
          background-color: #dc2626;
          color: #ffffff;
          border: 1px solid #ef4444;
          box-shadow: 0 0 14px rgba(239, 68, 68, 0.6);
        }
        .token-ping {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: #ffffff;
          animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        @keyframes badgePop {
          from {
            opacity: 0;
            transform: translateY(4px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
