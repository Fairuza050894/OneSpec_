'use client';

import { useState, useMemo, useRef } from 'react';
import {
  ShieldCheck,
  Search,
  Download,
  Image as ImageIcon,
  GitBranch,
  CheckCircle2,
  Layers,
  X,
} from 'lucide-react';
import {
  architectureMapEngine,
  type VerifiedArchitectureMapIR,
  type VerifiedArchNode,
  type VerifiedArchEdge,
  type ArchFocusViewId,
} from '@/services/architectureMapEngine';
import type { DeconstructedArchitecture } from '@/services/architectureDeconstructor';
import { useStudioLocale } from '@/lib/i18n';

interface VerifiedArchitectureMapCanvasProps {
  architecture: DeconstructedArchitecture;
  baselineArchitecture?: DeconstructedArchitecture | null;
}

const ROLE_COLORS: Record<
  VerifiedArchNode['role'],
  { border: string; badgeBg: string; badgeText: string; dot: string }
> = {
  ACTOR: { border: '#3B82F6', badgeBg: '#1D4ED8', badgeText: '#DBEAFE', dot: '#60A5FA' },
  SECURITY: { border: '#8B5CF6', badgeBg: '#6D28D9', badgeText: '#EDE9FE', dot: '#A78BFA' },
  CLIENT: { border: '#06B6D4', badgeBg: '#0E7490', badgeText: '#CFFAFE', dot: '#22D3EE' },
  GATEWAY: { border: '#3B82F6', badgeBg: '#1E40AF', badgeText: '#DBEAFE', dot: '#60A5FA' },
  SERVICE: { border: '#10B981', badgeBg: '#047857', badgeText: '#D1FAE5', dot: '#34D399' },
  DATABASE: { border: '#F59E0B', badgeBg: '#B45309', badgeText: '#FEF3C7', dot: '#FBBF24' },
  UPSTREAM: { border: '#6366F1', badgeBg: '#4338CA', badgeText: '#E0E7FF', dot: '#818CF8' },
};

const EDGE_COLORS: Record<VerifiedArchEdge['variant'], string> = {
  PRIMARY: '#3B82F6',
  SECURITY: '#8B5CF6',
  DATA: '#F59E0B',
  UPSTREAM: '#06B6D4',
};

function computeConnectorGeometry(
  fromNode: VerifiedArchNode,
  toNode: VerifiedArchNode
): { pathD: string; labelX: number; labelY: number } {
  const ax = fromNode.pos[0];
  const ay = fromNode.pos[1];
  const aw = fromNode.size[0];
  const ah = fromNode.size[1];

  const bx = toNode.pos[0];
  const by = toNode.pos[1];
  const bw = toNode.size[0];
  const bh = toNode.size[1];

  const aCenterX = ax + aw / 2;
  const aCenterY = ay + ah / 2;
  const bCenterX = bx + bw / 2;
  const bCenterY = by + bh / 2;

  // Route service-to-DB vertical connections cleanly without piercing sibling stacked services
  if (Math.abs(aCenterX - bCenterX) < 60) {
    if (fromNode.id === 'domain-svc-1' && toNode.id === 'persistence-db') {
      const startX = ax + aw;
      const startY = aCenterY;
      const corridorX = Math.min(1082, ax + aw + 18);
      const endX = bx + bw;
      const endY = bCenterY;
      return {
        pathD: `M ${startX} ${startY} L ${corridorX} ${startY} L ${corridorX} ${endY} L ${endX} ${endY}`,
        labelX: corridorX - 24,
        labelY: 356,
      };
    }
    const startX = aCenterX - 36;
    const startY = aCenterY < bCenterY ? ay + ah : ay;
    const endX = bCenterX - 36;
    const endY = aCenterY < bCenterY ? by : by + bh;
    const midY = Math.round((startY + endY) / 2);
    return {
      pathD: `M ${startX} ${startY} L ${endX} ${endY}`,
      labelX: startX - 42,
      labelY: midY,
    };
  }

  // Left-to-right horizontal cubic Bezier with clean port anchors
  const startX = ax + aw;
  const startY = aCenterY;
  const endX = bx;
  const endY = bCenterY;
  const dx = Math.max(40, (endX - startX) * 0.48);
  const pathD = `M ${startX} ${startY} C ${startX + dx} ${startY}, ${endX - dx} ${endY}, ${endX} ${endY}`;

  // Cubic Bezier midpoint at t=0.5
  const labelX = Math.round((startX + endX) / 2);
  const labelY = Math.round((startY + endY) / 2 - (Math.abs(startY - endY) > 40 ? 4 : 11));
  return { pathD, labelX, labelY };
}

export function VerifiedArchitectureMapCanvas({
  architecture,
  baselineArchitecture,
}: VerifiedArchitectureMapCanvasProps) {
  const { locale } = useStudioLocale();
  const isId = locale === 'id';
  const svgRef = useRef<SVGSVGElement | null>(null);

  const [activeView, setActiveView] = useState<ArchFocusViewId>('ALL');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showGatesDrawer, setShowGatesDrawer] = useState<boolean>(false);
  const [showDeltaDrawer, setShowDeltaDrawer] = useState<boolean>(false);

  const ir: VerifiedArchitectureMapIR = useMemo(() => {
    return architectureMapEngine.buildVerifiedArchitectureIR(architecture);
  }, [architecture]);

  const deltaReceipt = useMemo(() => {
    const baseIR = baselineArchitecture
      ? architectureMapEngine.buildVerifiedArchitectureIR(baselineArchitecture)
      : null;
    return architectureMapEngine.computeArchitectureDelta(baseIR, ir);
  }, [baselineArchitecture, ir]);

  const nodeMap = useMemo(() => new Map(ir.nodes.map((n) => [n.id, n])), [ir]);

  const reachability = useMemo(() => {
    if (!selectedNodeId) return null;
    return architectureMapEngine.computeNodeReachability(ir, selectedNodeId);
  }, [ir, selectedNodeId]);

  const activeFocusView = useMemo(
    () => ir.views.find((v) => v.id === activeView) || ir.views[0],
    [ir, activeView]
  );

  const matchingSearchIds = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return null;
    return new Set(
      ir.nodes
        .filter(
          (n) =>
            n.label.toLowerCase().includes(q) ||
            n.sublabel.toLowerCase().includes(q) ||
            n.tag.toLowerCase().includes(q) ||
            n.evidenceRef.toLowerCase().includes(q) ||
            n.details.some((d) => d.toLowerCase().includes(q))
        )
        .map((n) => n.id)
    );
  }, [ir, searchQuery]);

  const selectedNode = selectedNodeId ? nodeMap.get(selectedNodeId) || null : null;

  const isNodeHighlighted = (nodeId: string): boolean => {
    if (matchingSearchIds) return matchingSearchIds.has(nodeId);
    if (reachability && selectedNodeId) {
      return (
        nodeId === selectedNodeId ||
        reachability.upstreamNodeIds.has(nodeId) ||
        reachability.downstreamNodeIds.has(nodeId)
      );
    }
    if (activeView !== 'ALL') {
      return activeFocusView.focusNodeIds.includes(nodeId);
    }
    return true;
  };

  const isEdgeHighlighted = (edge: VerifiedArchEdge): boolean => {
    if (matchingSearchIds) {
      return matchingSearchIds.has(edge.from) && matchingSearchIds.has(edge.to);
    }
    if (reachability && selectedNodeId) {
      return reachability.activeEdgeIds.has(edge.id);
    }
    if (activeView !== 'ALL') {
      return (
        activeFocusView.focusNodeIds.includes(edge.from) &&
        activeFocusView.focusNodeIds.includes(edge.to)
      );
    }
    return true;
  };

  const handleExportSvg = () => {
    if (!svgRef.current) return;
    const serializer = new XMLSerializer();
    const rawSvg = serializer.serializeToString(svgRef.current);
    const slug = (ir.systemName || 'architecture').toLowerCase().replace(/[^a-z0-9]/g, '_');
    const blob = new Blob([rawSvg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `OneSpec_Verified_Architecture_${slug}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPng = () => {
    if (!svgRef.current) return;
    const serializer = new XMLSerializer();
    const rawSvg = serializer.serializeToString(svgRef.current);
    const svgBlob = new Blob([rawSvg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 2240;
      canvas.height = 1240;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#0B0C0E';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((pngBlob) => {
          if (!pngBlob) return;
          const pngUrl = URL.createObjectURL(pngBlob);
          const slug = (ir.systemName || 'architecture').toLowerCase().replace(/[^a-z0-9]/g, '_');
          const link = document.createElement('a');
          link.href = pngUrl;
          link.download = `OneSpec_Verified_Architecture_${slug}.png`;
          link.click();
          URL.revokeObjectURL(pngUrl);
        }, 'image/png');
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  return (
    <div className="bg-[#0B0C0E] border border-[#22262E] rounded-[3px] overflow-hidden space-y-0">
      {/* Interactive Architecture Map Control Bar */}
      <div className="px-3 py-2 bg-[#16191F] border-b border-[#22262E] flex flex-wrap items-center justify-between gap-2 font-mono text-[10px]">
        {/* Focus View Presets */}
        <div className="flex flex-wrap items-center gap-1">
          {ir.views.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => {
                setActiveView(v.id);
                setSelectedNodeId(null);
              }}
              className={`px-2 py-1 rounded-[2px] border transition-colors cursor-pointer whitespace-nowrap ${
                activeView === v.id
                  ? 'bg-[#2563EB] text-white border-[#2563EB] font-bold'
                  : 'bg-[#0B0C0E] text-[#A1A1A1] border-[#22262E] hover:text-[#EDEDED]'
              }`}
            >
              {isId ? v.labelId : v.label}
            </button>
          ))}
        </div>

        {/* Right Controls: Search + 9-Gate Badge + Delta + SVG/PNG Export */}
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex items-center gap-1 bg-[#0B0C0E] border border-[#22262E] px-2 py-0.5 rounded-[2px]">
            <Search className="h-3 w-3 text-[#707070]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isId ? 'Cari komponen / route...' : 'Search node / route...'}
              className="bg-transparent border-none outline-none text-[#EDEDED] text-[10px] w-32 font-mono select-text"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-[#707070] hover:text-[#EDEDED] cursor-pointer"
                aria-label="Clear search"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowGatesDrawer((prev) => !prev)}
            className="px-2 py-1 bg-[#059669]/15 hover:bg-[#059669]/25 border border-[#059669]/50 text-[#10B981] font-bold rounded-[2px] cursor-pointer flex items-center gap-1 tabular-nums whitespace-nowrap"
            title="Deterministic 9-Gate Layout & Clearance Validation Receipt"
          >
            <ShieldCheck className="h-3 w-3" />
            <span>
              {ir.validation.passedCount}/{ir.validation.totalGates} {isId ? 'Layout Gates' : 'Layout Gates'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setShowDeltaDrawer((prev) => !prev)}
            className={`px-2 py-1 border rounded-[2px] font-bold cursor-pointer flex items-center gap-1 whitespace-nowrap ${
              showDeltaDrawer
                ? 'bg-[#8B5CF6]/20 border-[#8B5CF6] text-[#C4B5FD]'
                : 'bg-[#0B0C0E] border-[#22262E] hover:border-[#8B5CF6] text-[#A1A1A1] hover:text-[#EDEDED]'
            }`}
            title="Architecture Delta Receipt (Before / Delta / After)"
          >
            <GitBranch className="h-3 w-3 text-[#8B5CF6]" />
            <span>Delta</span>
          </button>

          <button
            type="button"
            onClick={handleExportSvg}
            className="px-2 py-1 bg-[#0B0C0E] hover:bg-[#22262E] border border-[#22262E] hover:border-[#3B82F6] text-[#60A5FA] font-bold rounded-[2px] cursor-pointer flex items-center gap-1 whitespace-nowrap"
            title="Export Vector Architecture Diagram (.svg)"
          >
            <Download className="h-3 w-3" />
            <span>.svg</span>
          </button>

          <button
            type="button"
            onClick={handleExportPng}
            className="px-2 py-1 bg-[#0B0C0E] hover:bg-[#22262E] border border-[#22262E] hover:border-[#10B981] text-[#10B981] font-bold rounded-[2px] cursor-pointer flex items-center gap-1 whitespace-nowrap"
            title="Export High-Resolution Architecture Diagram (.png)"
          >
            <ImageIcon className="h-3 w-3" />
            <span>.png</span>
          </button>
        </div>
      </div>

      {/* Collapsible 9-Gate Layout Validation Receipt */}
      {showGatesDrawer && (
        <div className="px-3 py-2.5 bg-[#111317] border-b border-[#22262E] space-y-2 font-mono text-[10px]">
          <div className="flex items-center justify-between">
            <span className="text-[#10B981] font-bold uppercase flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>
                {isId
                  ? `Validasi Geometri & Clearance Deterministik (${ir.validation.passedCount}/${ir.validation.totalGates} PASS · Jarak Minimum ${ir.validation.minNodeClearancePx}px)`
                  : `Deterministic Layout & Clearance Validation (${ir.validation.passedCount}/${ir.validation.totalGates} PASS · Min Clearance ${ir.validation.minNodeClearancePx}px)`}
              </span>
            </span>
            <button
              type="button"
              onClick={() => setShowGatesDrawer(false)}
              className="text-[#707070] hover:text-[#EDEDED] cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5">
            {ir.validation.gates.map((g) => (
              <div key={g.ruleCode} className="p-2 bg-[#0B0C0E] border border-[#22262E] rounded-[2px]">
                <div className="flex items-center justify-between">
                  <span className="text-[#EDEDED] font-bold">{g.ruleCode}</span>
                  <span className="text-[#10B981] font-bold">PASS</span>
                </div>
                <div className="text-[#A1A1A1] mt-0.5 truncate" title={g.evidence}>
                  {g.evidence}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Collapsible Architecture Delta Receipt */}
      {showDeltaDrawer && (
        <div className="px-3 py-2 bg-[#111317] border-b border-[#8B5CF6]/40 flex flex-wrap items-center justify-between gap-2 font-mono text-[10.5px]">
          <div className="flex items-center gap-2">
            <Layers className="h-3.5 w-3.5 text-[#A78BFA]" />
            <span className="text-[#EDEDED]">{deltaReceipt.summary}</span>
          </div>
          <button
            type="button"
            onClick={() => setShowDeltaDrawer(false)}
            className="text-[#707070] hover:text-[#EDEDED] cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Precision Vector SVG Canvas */}
      <div className="w-full overflow-x-auto bg-[#0B0C0E]">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${ir.viewBox.width} ${ir.viewBox.height}`}
          className="w-full h-auto min-w-[780px] block select-none"
          role="img"
          aria-label={`${ir.systemName} Verified System Architecture Diagram`}
        >
          <defs>
            <pattern id="onespec-arch-grid" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="#1C212B" />
            </pattern>
            {(['PRIMARY', 'SECURITY', 'DATA', 'UPSTREAM'] as const).map((variant) => (
              <marker
                key={variant}
                id={`arrow-${variant}`}
                viewBox="0 0 10 10"
                refX="8.5"
                refY="5"
                markerWidth="6.5"
                markerHeight="6.5"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill={EDGE_COLORS[variant]} />
              </marker>
            ))}
          </defs>

          {/* Subtle Engineering Dot Grid */}
          <rect x="0" y="0" width={ir.viewBox.width} height={ir.viewBox.height} fill="#0B0C0E" />
          <rect x="0" y="0" width={ir.viewBox.width} height={ir.viewBox.height} fill="url(#onespec-arch-grid)" />

          {/* Header Caption inside SVG */}
          <text x="20" y="24" fill="#EDEDED" fontSize="11.5" fontWeight="700" fontFamily="ui-monospace, Menlo, monospace">
            {(ir.systemName.length > 30 ? `${ir.systemName.slice(0, 29)}…` : ir.systemName).toUpperCase()} · VERIFIED SYSTEM ARCHITECTURE
          </text>
          <text
            x={ir.viewBox.width - 20}
            y="24"
            textAnchor="end"
            fill="#10B981"
            fontSize="10.5"
            fontWeight="700"
            fontFamily="ui-monospace, Menlo, monospace"
          >
            ✓ {ir.validation.passedCount}/{ir.validation.totalGates} LAYOUT GATES VERIFIED · CLICK NODE TO TRACE REACHABILITY
          </text>

          {/* Trust & Runtime Boundaries */}
          {ir.boundaries.map((b) => (
            <g key={b.id}>
              <rect
                x={b.bounds.x}
                y={b.bounds.y}
                width={b.bounds.w}
                height={b.bounds.h}
                rx="4"
                fill="#111317"
                fillOpacity="0.55"
                stroke={b.accentColor}
                strokeOpacity="0.55"
                strokeWidth="1.25"
                strokeDasharray={b.kind === 'TRUST_ZONE' ? '5 4' : undefined}
              />
              <text
                x={b.bounds.x + 10}
                y={b.bounds.y + 16}
                fill={b.accentColor}
                fontSize="9.5"
                fontWeight="700"
                fontFamily="ui-monospace, Menlo, monospace"
                letterSpacing="0.5"
              >
                {b.label}
              </text>
            </g>
          ))}

          {/* Directed Edges + Midpoint Protocol Pill Labels */}
          {ir.edges.map((edge) => {
            const fromNode = nodeMap.get(edge.from);
            const toNode = nodeMap.get(edge.to);
            if (!fromNode || !toNode) return null;
            const { pathD, labelX, labelY } = computeConnectorGeometry(fromNode, toNode);
            const highlighted = isEdgeHighlighted(edge);
            const strokeColor = EDGE_COLORS[edge.variant];
            const labelW = Math.max(66, edge.label.length * 6.5 + 14);

            return (
              <g
                key={edge.id}
                style={{ opacity: highlighted ? 1 : 0.18, transition: 'opacity 150ms ease' }}
              >
                <path
                  d={pathD}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={edge.isPrimaryPath ? 2.2 : 1.5}
                  strokeDasharray={edge.variant === 'SECURITY' ? '4 3' : undefined}
                  markerEnd={`url(#arrow-${edge.variant})`}
                />
                <rect
                  x={labelX - labelW / 2}
                  y={labelY - 9}
                  width={labelW}
                  height="18"
                  rx="2"
                  fill="#0B0C0E"
                  stroke={strokeColor}
                  strokeOpacity="0.65"
                  strokeWidth="1"
                />
                <text
                  x={labelX}
                  y={labelY + 3.5}
                  textAnchor="middle"
                  fill="#E2E8F0"
                  fontSize="9.5"
                  fontWeight="700"
                  fontFamily="ui-monospace, Menlo, monospace"
                >
                  {edge.label}
                </text>
              </g>
            );
          })}

          {/* Component Nodes */}
          {ir.nodes.map((node) => {
            const [x, y] = node.pos;
            const [w, h] = node.size;
            const palette = ROLE_COLORS[node.role];
            const highlighted = isNodeHighlighted(node.id);
            const isSelected = selectedNodeId === node.id;
            const isUpstream = reachability?.upstreamNodeIds.has(node.id);
            const isDownstream = reachability?.downstreamNodeIds.has(node.id);

            const ringColor = isSelected
              ? '#FFFFFF'
              : isUpstream
              ? '#22D3EE'
              : isDownstream
              ? '#34D399'
              : palette.border;

            return (
              <g
                key={node.id}
                onClick={() => setSelectedNodeId((prev) => (prev === node.id ? null : node.id))}
                style={{
                  opacity: highlighted ? 1 : 0.22,
                  cursor: 'pointer',
                  transition: 'opacity 150ms ease',
                }}
              >
                <rect
                  x={x}
                  y={y}
                  width={w}
                  height={h}
                  rx="4"
                  fill="#16191F"
                  stroke={ringColor}
                  strokeWidth={isSelected || isUpstream || isDownstream ? 2.2 : 1.4}
                />
                {/* Left Role Accent Bar */}
                <rect x={x} y={y} width="4" height={h} rx="1" fill={palette.border} />

                {/* Top Role & Tag Row */}
                <text
                  x={x + 12}
                  y={y + 17}
                  fill={palette.dot}
                  fontSize="9"
                  fontWeight="700"
                  fontFamily="ui-monospace, Menlo, monospace"
                >
                  {node.role}
                </text>
                <text
                  x={x + w - 10}
                  y={y + 17}
                  textAnchor="end"
                  fill="#94A3B8"
                  fontSize="8.5"
                  fontWeight="700"
                  fontFamily="ui-monospace, Menlo, monospace"
                >
                  {node.tag}
                </text>

                {/* Primary Title with zero cut-off */}
                {node.label.length > 20 && node.label.includes(' ') ? (
                  <text
                    x={x + 12}
                    y={y + 33}
                    fill="#F8FAFC"
                    fontSize="11.5"
                    fontWeight="700"
                    fontFamily="Inter, system-ui, sans-serif"
                  >
                    <tspan x={x + 12} dy="0">
                      {node.label.slice(0, node.label.lastIndexOf(' ', 22))}
                    </tspan>
                    <tspan x={x + 12} dy="14">
                      {node.label.slice(node.label.lastIndexOf(' ', 22) + 1)}
                    </tspan>
                  </text>
                ) : (
                  <text
                    x={x + 12}
                    y={y + 38}
                    fill="#F8FAFC"
                    fontSize="12.5"
                    fontWeight="700"
                    fontFamily="Inter, system-ui, sans-serif"
                  >
                    {node.label}
                  </text>
                )}

                {/* Sublabel / Tech Stack */}
                <text
                  x={x + 12}
                  y={node.label.length > 20 && node.label.includes(' ') ? y + 62 : y + 56}
                  fill="#CBD5E1"
                  fontSize="9.5"
                  fontFamily="ui-monospace, Menlo, monospace"
                >
                  {node.sublabel}
                </text>
              </g>
            );
          })}

          {/* Bottom Legend Strip inside SVG */}
          <g transform={`translate(20, ${ir.viewBox.height - 26})`}>
            <circle cx="6" cy="6" r="4" fill="#3B82F6" />
            <text x="16" y="9.5" fill="#94A3B8" fontSize="9.5" fontFamily="ui-monospace, Menlo, monospace">
              Primary Request Path
            </text>
            <circle cx="166" cy="6" r="4" fill="#8B5CF6" />
            <text x="176" y="9.5" fill="#94A3B8" fontSize="9.5" fontFamily="ui-monospace, Menlo, monospace">
              Auth / Security Boundary
            </text>
            <circle cx="348" cy="6" r="4" fill="#F59E0B" />
            <text x="358" y="9.5" fill="#94A3B8" fontSize="9.5" fontFamily="ui-monospace, Menlo, monospace">
              ACID Persistence
            </text>
            <circle cx="484" cy="6" r="4" fill="#22D3EE" />
            <text x="494" y="9.5" fill="#94A3B8" fontSize="9.5" fontFamily="ui-monospace, Menlo, monospace">
              Upstream Caller (Selected)
            </text>
            <circle cx="668" cy="6" r="4" fill="#34D399" />
            <text x="678" y="9.5" fill="#94A3B8" fontSize="9.5" fontFamily="ui-monospace, Menlo, monospace">
              Downstream Dependency (Selected)
            </text>
          </g>
        </svg>
      </div>

      {/* Interactive Reachability & Evidence Footer Bar (when any node is clicked) */}
      {selectedNode && reachability && (
        <div className="px-3.5 py-2.5 bg-[#111317] border-t border-[#3B82F6]/50 flex flex-wrap items-center justify-between gap-3 font-mono text-[10.5px]">
          <div className="space-y-0.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-1.5 py-0.5 bg-[#2563EB]/20 border border-[#2563EB]/50 text-[#60A5FA] font-bold rounded-[2px] text-[9.5px]">
                {selectedNode.role}
              </span>
              <span className="font-bold text-[#EDEDED]">{selectedNode.label}</span>
              <span className="text-[#707070]">·</span>
              <span className="text-[#10B981]">Provenance: {selectedNode.evidenceRef}</span>
            </div>
            <div className="text-[#A1A1A1] text-[10px]">
              {selectedNode.details.join(' · ')}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="text-[#22D3EE] tabular-nums">
              Upstream: <strong>{reachability.upstreamNodeIds.size}</strong>
            </span>
            <span className="text-[#34D399] tabular-nums">
              Downstream: <strong>{reachability.downstreamNodeIds.size}</strong>
            </span>
            <button
              type="button"
              onClick={() => setSelectedNodeId(null)}
              className="px-2 py-0.5 bg-[#16191F] border border-[#22262E] hover:border-[#3B82F6] text-[#EDEDED] rounded-[2px] cursor-pointer"
            >
              {isId ? 'Reset Sorotan' : 'Clear Selection'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
