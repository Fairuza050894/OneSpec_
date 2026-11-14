'use client';

import { useState, useRef } from 'react';
import { Download, Image as ImageIcon } from 'lucide-react';
import type { LowLevelComponentTrace } from '@/services/architectureDeconstructor';

interface VerifiedSequenceDiagramCanvasProps {
  systemName: string;
  selectedTrace?: LowLevelComponentTrace | null;
  authProtocol?: string;
}

interface SequenceStepItem {
  num: number;
  fromCol: number;
  toCol: number;
  y: number;
  label: string;
  detail: string;
  color: string;
  isReturn?: boolean;
}

export function VerifiedSequenceDiagramCanvas({
  systemName,
  selectedTrace,
  authProtocol = 'Bearer / Session Cookie',
}: VerifiedSequenceDiagramCanvasProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [activeHop, setActiveHop] = useState<number | null>(null);

  const actors = [
    { id: 'client', title: 'Client DOM', sub: selectedTrace?.uiSurface.componentName || 'Browser UI', color: '#06B6D4', x: 110 },
    { id: 'auth', title: 'Auth Guard', sub: authProtocol.slice(0, 20), color: '#8B5CF6', x: 335 },
    { id: 'gateway', title: 'API Gateway', sub: selectedTrace?.apiGateway.route || 'REST / JSON', color: '#3B82F6', x: 560 },
    { id: 'service', title: 'Domain Logic', sub: selectedTrace?.domainLogic.ruleId || 'Invariant Engine', color: '#10B981', x: 785 },
    { id: 'db', title: 'Relational DB', sub: selectedTrace?.persistenceLayer.targetTable || 'SQL / Prisma', color: '#F59E0B', x: 1010 },
  ];

  const steps: SequenceStepItem[] = [
    {
      num: 1,
      fromCol: 0,
      toCol: 1,
      y: 132,
      label: '1. Attach Session / Token',
      detail: `Client attaches credentials (${authProtocol}) before dispatching UI action.`,
      color: '#8B5CF6',
    },
    {
      num: 2,
      fromCol: 0,
      toCol: 2,
      y: 192,
      label: `2. ${selectedTrace?.apiGateway.route || 'POST /api/action'}`,
      detail: `Dispatched from ${selectedTrace?.uiSurface.selector || 'UI Form'} to ${selectedTrace?.apiGateway.controllerFile || 'Gateway'}.`,
      color: '#3B82F6',
    },
    {
      num: 3,
      fromCol: 2,
      toCol: 3,
      y: 252,
      label: `3. Evaluate ${selectedTrace?.domainLogic.ruleId || 'VR-01'}`,
      detail: `Constraint check: ${selectedTrace?.domainLogic.constraintExpr || 'Schema & business invariants validated'}.`,
      color: '#10B981',
    },
    {
      num: 4,
      fromCol: 3,
      toCol: 4,
      y: 312,
      label: `4. ACID Tx -> ${selectedTrace?.persistenceLayer.targetTable || 'Records'}`,
      detail: `Indexed lookup (${selectedTrace?.persistenceLayer.indexStrategy || 'PK / B-Tree Index'}) with row-level lock.`,
      color: '#F59E0B',
    },
    {
      num: 5,
      fromCol: 4,
      toCol: 3,
      y: 372,
      label: '5. Committed Rowset',
      detail: 'Transaction committed cleanly with zero constraint violations.',
      color: '#F59E0B',
      isReturn: true,
    },
    {
      num: 6,
      fromCol: 2,
      toCol: 0,
      y: 432,
      label: '6. HTTP 200 OK JSON',
      detail: 'Structured JSON response rendered back to user interface.',
      color: '#10B981',
      isReturn: true,
    },
  ];

  const handleExportSvg = () => {
    if (!svgRef.current) return;
    const raw = new XMLSerializer().serializeToString(svgRef.current);
    const slug = systemName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const blob = new Blob([raw], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OneSpec_Sequence_${slug}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPng = () => {
    if (!svgRef.current) return;
    const raw = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([raw], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 2240;
      canvas.height = 1040;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#0B0C0E';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((png) => {
          if (!png) return;
          const pUrl = URL.createObjectURL(png);
          const slug = systemName.toLowerCase().replace(/[^a-z0-9]/g, '_');
          const a = document.createElement('a');
          a.href = pUrl;
          a.download = `OneSpec_Sequence_${slug}.png`;
          a.click();
          URL.revokeObjectURL(pUrl);
        }, 'image/png');
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const selectedStep = activeHop !== null ? steps.find((s) => s.num === activeHop) : null;

  return (
    <div className="bg-[#0B0C0E] border border-[#22262E] rounded-[3px] overflow-hidden">
      <div className="px-3 py-1.5 bg-[#16191F] border-b border-[#22262E] flex items-center justify-between font-mono text-[10px]">
        <span className="text-[#A1A1A1]">
          Trace: <strong className="text-[#3B82F6]">{selectedTrace?.traceId || 'TRC-01'}</strong> · Click any message arrow to inspect payload
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleExportSvg}
            className="px-2 py-0.5 bg-[#0B0C0E] border border-[#22262E] hover:border-[#3B82F6] text-[#60A5FA] font-bold rounded-[2px] cursor-pointer flex items-center gap-1"
          >
            <Download className="h-3 w-3" />
            <span>.svg</span>
          </button>
          <button
            type="button"
            onClick={handleExportPng}
            className="px-2 py-0.5 bg-[#0B0C0E] border border-[#22262E] hover:border-[#10B981] text-[#10B981] font-bold rounded-[2px] cursor-pointer flex items-center gap-1"
          >
            <ImageIcon className="h-3 w-3" />
            <span>.png</span>
          </button>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <svg
          ref={svgRef}
          viewBox="0 0 1120 500"
          className="w-full h-auto min-w-[760px] block select-none"
          role="img"
          aria-label="Verified Component Interaction Sequence Diagram"
        >
          <rect x="0" y="0" width="1120" height="500" fill="#0B0C0E" />
          <defs>
            {(['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B'] as const).map((col) => (
              <marker
                key={col}
                id={`seq-arrow-${col.replace('#', '')}`}
                viewBox="0 0 10 10"
                refX="8.5"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill={col} />
              </marker>
            ))}
          </defs>

          {/* Lifelines */}
          {actors.map((act) => (
            <g key={act.id}>
              <line
                x1={act.x}
                y1={84}
                x2={act.x}
                y2={472}
                stroke={act.color}
                strokeOpacity="0.35"
                strokeWidth="1.5"
                strokeDasharray="5 4"
              />
              <rect
                x={act.x - 84}
                y={22}
                width="168"
                height="58"
                rx="4"
                fill="#16191F"
                stroke={act.color}
                strokeWidth="1.5"
              />
              <text
                x={act.x}
                y={44}
                textAnchor="middle"
                fill="#F8FAFC"
                fontSize="11.5"
                fontWeight="700"
                fontFamily="Inter, system-ui, sans-serif"
              >
                {act.title}
              </text>
              <text
                x={act.x}
                y={63}
                textAnchor="middle"
                fill={act.color}
                fontSize="9"
                fontFamily="ui-monospace, Menlo, monospace"
              >
                {act.sub.length > 22 ? `${act.sub.slice(0, 21)}…` : act.sub}
              </text>
            </g>
          ))}

          {/* Sequence Messages */}
          {steps.map((st) => {
            const x1 = actors[st.fromCol].x;
            const x2 = actors[st.toCol].x;
            const midX = Math.round((x1 + x2) / 2);
            const pillW = Math.max(120, st.label.length * 6.3 + 16);
            const isSelected = activeHop === st.num;
            return (
              <g
                key={st.num}
                onClick={() => setActiveHop((prev) => (prev === st.num ? null : st.num))}
                style={{ cursor: 'pointer' }}
              >
                <line
                  x1={x1}
                  y1={st.y}
                  x2={x2}
                  y2={st.y}
                  stroke={st.color}
                  strokeWidth={isSelected ? 2.6 : 1.8}
                  strokeDasharray={st.isReturn ? '5 3' : undefined}
                  markerEnd={`url(#seq-arrow-${st.color.replace('#', '')})`}
                />
                <rect
                  x={midX - pillW / 2}
                  y={st.y - 22}
                  width={pillW}
                  height="17"
                  rx="2"
                  fill="#111317"
                  stroke={isSelected ? '#FFFFFF' : st.color}
                  strokeWidth={isSelected ? 1.5 : 1}
                />
                <text
                  x={midX}
                  y={st.y - 10.5}
                  textAnchor="middle"
                  fill="#F8FAFC"
                  fontSize="9.5"
                  fontWeight="700"
                  fontFamily="ui-monospace, Menlo, monospace"
                >
                  {st.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {selectedStep && (
        <div className="px-3 py-2 bg-[#111317] border-t border-[#22262E] font-mono text-[10.5px] flex items-center justify-between gap-2">
          <div>
            <strong className="text-[#3B82F6] mr-2">{selectedStep.label}:</strong>
            <span className="text-[#D4D4D8]">{selectedStep.detail}</span>
          </div>
          <button
            type="button"
            onClick={() => setActiveHop(null)}
            className="text-[#707070] hover:text-[#EDEDED] cursor-pointer text-[10px]"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
