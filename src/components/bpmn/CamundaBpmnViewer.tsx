'use client';

import React, { useEffect, useRef, useState } from 'react';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';
import { ZoomIn, ZoomOut, RotateCcw, AlertTriangle } from 'lucide-react';

export interface BpmnNodeClickEvent {
  id: string;
  type: string;
  name: string;
  businessRuleId?: string;
  userStoryId?: string;
  validationRuleId?: string;
  rawElement: any;
}

interface CamundaBpmnViewerProps {
  xml: string;
  onNodeSelect?: (node: BpmnNodeClickEvent) => void;
  selectedNodeId?: string | null;
}

export function CamundaBpmnViewer({ xml, onNodeSelect, selectedNodeId }: CamundaBpmnViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  useEffect(() => {
    let viewer: any = null;

    async function initBpmnViewer() {
      if (!containerRef.current) return;

      try {
        // Dynamically import BpmnNavigatedViewer to prevent SSR canvas issues in Next.js
        const BpmnViewerModule = await import('bpmn-js/dist/bpmn-navigated-viewer.production.min.js');
        const BpmnViewer = BpmnViewerModule.default || BpmnViewerModule;

        containerRef.current.innerHTML = '';
        viewer = new BpmnViewer({
          container: containerRef.current,
        });

        viewerRef.current = viewer;

        await viewer.importXML(xml);
        setError(null);

        // Zoom to fit viewport safely
        const canvas = viewer.get('canvas');
        try {
          canvas.zoom('fit-viewport');
          const currentZoom = canvas.zoom();
          if (Number.isFinite(currentZoom)) {
            setZoomLevel(currentZoom);
          }
        } catch {
          // Fallback if layout container dimensions are not settled
          try {
            canvas.zoom(1.0);
            setZoomLevel(1.0);
          } catch {}
        }

        // Event listener for node selection
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

          if (id.includes('UserTask') || id.includes('Task_Input')) {
            userStoryId = 'REQ-US-01';
            validationRuleId = 'VR-01';
          } else if (id.includes('ServiceTask') || id.includes('Task_Validate')) {
            businessRuleId = 'BR-01, BR-02';
            validationRuleId = 'VR-02';
          } else if (id.includes('Gateway')) {
            businessRuleId = 'BR-01, BR-02 (Rule Gateway)';
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
              rawElement: element,
            });
          }
        });
      } catch (err) {
        console.error('Failed to render BPMN 2.0 XML:', err);
        setError(err instanceof Error ? err.message : String(err));
      }
    }

    initBpmnViewer();

    return () => {
      if (viewer) {
        try {
          viewer.destroy();
        } catch {
          // Ignore cleanup error
        }
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
    const canvas = viewerRef.current.get('canvas');
    canvas.zoom('fit-viewport');
    setZoomLevel(canvas.zoom());
  };

  return (
    <div className="relative w-full h-[540px] bg-[#0E1015] border border-[#22262E] rounded-[2px] overflow-hidden flex flex-col">
      {/* Modeler Toolbar */}
      <div className="h-[28px] bg-[#16191F] border-b border-[#22262E] px-3 flex items-center justify-between text-[11px] font-mono z-10 select-none">
        <div className="flex items-center gap-2">
          <span className="text-[#3B82F6] font-bold">bpmn-js NavigatedViewer</span>
          <span className="text-[#707070]">· ISO/IEC 19510 Camunda Engine</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-[#707070] mr-1 tabular-nums">
            Zoom: {Math.round(zoomLevel * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-1 hover:bg-[#22262E] text-[#A1A1A1] hover:text-[#EDEDED] rounded-[2px]"
            title="Zoom In"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-1 hover:bg-[#22262E] text-[#A1A1A1] hover:text-[#EDEDED] rounded-[2px]"
            title="Zoom Out"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleResetZoom}
            className="p-1 hover:bg-[#22262E] text-[#A1A1A1] hover:text-[#EDEDED] rounded-[2px]"
            title="Fit Viewport"
          >
            <RotateCcw className="h-3.5 w-3.5" />
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
    </div>
  );
}
