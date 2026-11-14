'use client';

import { useRef } from 'react';
import { Download, Image as ImageIcon } from 'lucide-react';
import type { DfdNode, DfdDataFlow } from '@/services/dfdReverseService';
interface VerifiedDfdDiagramCanvasProps {
  appName: string;
  levelTitle: string;
  nodes: DfdNode[];
  flows: DfdDataFlow[];
  selectedNodeId?: string;
  onSelectNode: (node: DfdNode) => void;
}

export function VerifiedDfdDiagramCanvas({
  appName,
  levelTitle,
  nodes,
  flows,
  selectedNodeId,
  onSelectNode,
}: VerifiedDfdDiagramCanvasProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  const entities = nodes.filter((n) => n.type === 'EXTERNAL_ENTITY').slice(0, 4);
  const processes = nodes.filter((n) => n.type === 'PROCESS').slice(0, 4);
  const stores = nodes.filter((n) => n.type === 'DATA_STORE').slice(0, 4);

  const positioned = new Map<string, { x: number; y: number; w: number; h: number; node: DfdNode }>();

  entities.forEach((n, idx) => {
    positioned.set(n.id, { x: 40, y: 80 + idx * 112, w: 205, h: 74, node: n });
  });
  processes.forEach((n, idx) => {
    positioned.set(n.id, { x: 445, y: 74 + idx * 114, w: 230, h: 78, node: n });
  });
  stores.forEach((n, idx) => {
    positioned.set(n.id, { x: 865, y: 80 + idx * 112, w: 215, h: 74, node: n });
  });

  const handleExportSvg = () => {
    if (!svgRef.current) return;
    const raw = new XMLSerializer().serializeToString(svgRef.current);
    const slug = appName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const blob = new Blob([raw], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OneSpec_DFD_${slug}.svg`;
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
      canvas.height = 1080;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#0B0C0E';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((png) => {
          if (!png) return;
          const pUrl = URL.createObjectURL(png);
          const slug = appName.toLowerCase().replace(/[^a-z0-9]/g, '_');
          const a = document.createElement('a');
          a.href = pUrl;
          a.download = `OneSpec_DFD_${slug}.png`;
          a.click();
          URL.revokeObjectURL(pUrl);
        }, 'image/png');
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  return (
    <div className="bg-[#0B0C0E] border border-[#22262E] rounded-[3px] overflow-hidden">
      <div className="px-3 py-1.5 bg-[#16191F] border-b border-[#22262E] flex items-center justify-between font-mono text-[10px]">
        <span className="text-[#EDEDED] font-bold uppercase">{levelTitle} · Vector Gane-Sarson Topology</span>
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
          viewBox="0 0 1120 540"
          className="w-full h-auto min-w-[780px] block select-none"
          role="img"
          aria-label="Gane-Sarson Data Flow Diagram"
        >
          <rect x="0" y="0" width="1120" height="540" fill="#0B0C0E" />
          <defs>
            <pattern id="dfd-dot-grid" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="#1C212B" />
            </pattern>
            <marker id="dfd-arrow-blue" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#38BDF8" />
            </marker>
            <marker id="dfd-arrow-red" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#EF4444" />
            </marker>
          </defs>
          <rect x="0" y="0" width="1120" height="540" fill="url(#dfd-dot-grid)" />

          {/* Column Headers */}
          <text x="40" y="34" fill="#F59E0B" fontSize="10" fontWeight="700" fontFamily="ui-monospace, Menlo, monospace">
            EXTERNAL ENTITIES (INGRESS / EGRESS)
          </text>
          <text x="445" y="34" fill="#3B82F6" fontSize="10" fontWeight="700" fontFamily="ui-monospace, Menlo, monospace">
            TRANSFORMATION PROCESSES
          </text>
          {/* Data Flow Connectors */}
          {flows.slice(0, 10).map((f) => {
            const src = positioned.get(f.fromNodeId);
            const dst = positioned.get(f.toNodeId);
            if (!src || !dst) return null;
            const goingRight = src.x <= dst.x;
            const x1 = goingRight ? src.x + src.w : src.x;
            const y1 = src.y + src.h / 2;
            const x2 = goingRight ? dst.x : dst.x + dst.w;
            const y2 = dst.y + dst.h / 2;
            const dx = Math.max(36, Math.abs(x2 - x1) * 0.45);
            const d = goingRight
              ? `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`
              : `M ${x1} ${y1} C ${x1 - dx} ${y1}, ${x2 + dx} ${y2}, ${x2} ${y2}`;
            const isPii = f.piiClassification === 'PII_CRITICAL' || f.piiClassification === 'PII_STANDARD';
            const stroke = isPii ? '#EF4444' : '#38BDF8';
            const midX = Math.round((x1 + x2) / 2);
            const midY = Math.round((y1 + y2) / 2 - 8);
            const lbl = f.dataLabel.length > 22 ? `${f.dataLabel.slice(0, 21)}…` : f.dataLabel;
            const pillW = Math.max(76, lbl.length * 6 + 14);
            const isDimmed = selectedNodeId && f.fromNodeId !== selectedNodeId && f.toNodeId !== selectedNodeId;

            return (
              <g key={f.id} style={{ opacity: isDimmed ? 0.2 : 1 }}>
                <path
                  d={d}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={isPii ? 2 : 1.5}
                  strokeDasharray={isPii ? '4 3' : undefined}
                  markerEnd={`url(#${isPii ? 'dfd-arrow-red' : 'dfd-arrow-blue'})`}
                />
                <rect
                  x={midX - pillW / 2}
                  y={midY - 8}
                  width={pillW}
                  height="16"
                  rx="2"
                  fill="#0B0C0E"
                  stroke={stroke}
                  strokeOpacity="0.7"
                />
                <text
                  x={midX}
                  y={midY + 3}
                  textAnchor="middle"
                  fill={isPii ? '#FCA5A5' : '#E2E8F0'}
                  fontSize="8.5"
                  fontWeight="700"
                  fontFamily="ui-monospace, Menlo, monospace"
                >
                  {lbl}
                </text>
              </g>
            );
          })}

          {/* Gane-Sarson Nodes */}
          {Array.from(positioned.values()).map(({ x, y, w, h, node }) => {
            const isSelected = selectedNodeId === node.id;
            const accent =
              node.type === 'EXTERNAL_ENTITY' ? '#F59E0B' : node.type === 'PROCESS' ? '#3B82F6' : '#8B5CF6';
            return (
              <g key={node.id} onClick={() => onSelectNode(node)} style={{ cursor: 'pointer' }}>
                {node.type === 'DATA_STORE' ? (
                  <>
                    <rect x={x} y={y} width={w} height={h} fill="#111317" />
                    <line x1={x} y1={y} x2={x + w} y2={y} stroke={isSelected ? '#FFFFFF' : accent} strokeWidth="2.2" />
                    <line x1={x} y1={y + h} x2={x + w} y2={y + h} stroke={isSelected ? '#FFFFFF' : accent} strokeWidth="2.2" />
                    <line x1={x + 42} y1={y} x2={x + 42} y2={y + h} stroke={accent} strokeOpacity="0.5" strokeWidth="1.2" />
                  </>
                ) : (
                  <rect
                    x={x}
                    y={y}
                    width={w}
                    height={h}
                    rx={node.type === 'PROCESS' ? 12 : 3}
                    fill="#16191F"
                    stroke={isSelected ? '#FFFFFF' : accent}
                    strokeWidth={isSelected ? 2.2 : 1.5}
                  />
                )}
                <text
                  x={x + 10}
                  y={y + 18}
                  fill={accent}
                  fontSize="9"
                  fontWeight="700"
                  fontFamily="ui-monospace, Menlo, monospace"
                >
                  {node.id}
                </text>
                {node.piiFlag && (
                  <text
                    x={x + w - 10}
                    y={y + 18}
                    textAnchor="end"
                    fill="#EF4444"
                    fontSize="8.5"
                    fontWeight="700"
                    fontFamily="ui-monospace, Menlo, monospace"
                  >
                    PII · UU PDP
                  </text>
                )}
                <text
                  x={node.type === 'DATA_STORE' ? x + 50 : x + 10}
                  y={y + 39}
                  fill="#F8FAFC"
                  fontSize="11.5"
                  fontWeight="700"
                  fontFamily="Inter, system-ui, sans-serif"
                >
                  {node.name.length > 22 ? `${node.name.slice(0, 21)}…` : node.name}
                </text>
                <text
                  x={node.type === 'DATA_STORE' ? x + 50 : x + 10}
                  y={y + 57}
                  fill="#94A3B8"
                  fontSize="9"
                  fontFamily="ui-monospace, Menlo, monospace"
                >
                  {(node.systemOwner || node.type).slice(0, 24)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
