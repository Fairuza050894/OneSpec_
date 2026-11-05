'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
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
import ELK from 'elkjs/lib/elk.bundled.js';
import {
  Database,
  Key,
  Link2,
  RefreshCw,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Layers,
  Table as TableIcon,
} from 'lucide-react';
import type { DatabaseErdTable } from '@/types/sdlc';
import '@xyflow/react/dist/style.css';

// Custom Table Node Component for React Flow
function ErdTableNode({ data, selected }: NodeProps) {
  const table = data.table as DatabaseErdTable;
  if (!table) return null;

  return (
    <div
      className={`w-[260px] bg-[#111317] border rounded-[2px] shadow-sm font-mono text-[11px] select-none transition-all ${
        selected ? 'border-[#3B82F6] ring-1 ring-[#3B82F6]' : 'border-[#22262E] hover:border-[#3B82F6]/60'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-[#3B82F6] !w-2 !h-2 !border-none !-left-1"
      />

      {/* Table Header */}
      <div className="h-[28px] bg-[#16191F] border-b border-[#22262E] px-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5 truncate">
          <Database className="h-3.5 w-3.5 text-[#3B82F6]" />
          <span className="font-bold text-[#EDEDED] truncate" title={table.tableName}>
            {table.tableName}
          </span>
        </div>
        <span className="text-[10px] text-[#707070] tabular-nums">
          {table.columns.length} cols
        </span>
      </div>

      {/* Columns List */}
      <div className="divide-y divide-[#22262E]/60 max-h-[280px] overflow-y-auto bg-[#0E1015]">
        {table.columns.map((col) => (
          <div
            key={col.name}
            className="h-[24px] px-2 flex items-center justify-between text-[10px] hover:bg-[#16191F]/50"
          >
            <div className="flex items-center gap-1.5 truncate max-w-[170px]">
              {col.isPrimaryKey ? (
                <span className="badge-tag px-1 py-0.2 bg-[#D97706]/20 text-[#D97706] text-[8px] font-bold border border-[#D97706]/40">
                  PK
                </span>
              ) : col.isForeignKey ? (
                <span className="badge-tag px-1 py-0.2 bg-[#3B82F6]/20 text-[#3B82F6] text-[8px] font-bold border border-[#3B82F6]/40">
                  FK
                </span>
              ) : (
                <span className="w-3" />
              )}
              <span
                className={`truncate ${
                  col.isPrimaryKey ? 'font-bold text-[#EDEDED]' : 'text-[#A1A1A1]'
                }`}
                title={col.name}
              >
                {col.name}
              </span>
            </div>

            <div className="flex items-center gap-1 text-[9px] text-[#707070]">
              <span className="font-mono">{col.type}</span>
              {col.isNullable && <span className="text-[#DC2626]/70">?</span>}
            </div>
          </div>
        ))}
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
  erdTable: ErdTableNode,
};

interface DatabaseErdCanvasProps {
  tables: DatabaseErdTable[];
  onTableSelect?: (table: DatabaseErdTable) => void;
  selectedTableId?: string;
}

export function DatabaseErdCanvas({
  tables,
  onTableSelect,
  selectedTableId,
}: DatabaseErdCanvasProps) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isLayouting, setIsLayouting] = useState(false);

  const elk = useMemo(() => new ELK(), []);

  // Compute ELK Layout
  const applyElkLayout = useCallback(
    async (rawTables: DatabaseErdTable[]) => {
      setIsLayouting(true);

      // Create initial nodes
      const initialNodes: Node[] = rawTables.map((t, idx) => ({
        id: t.tableName,
        type: 'erdTable',
        position: { x: idx * 300, y: 50 },
        data: { table: t },
      }));

      // Create edges from foreign key targets
      const initialEdges: Edge[] = [];
      let edgeIdx = 0;

      for (const table of rawTables) {
        for (const col of table.columns) {
          if (col.isForeignKey && col.foreignKeyTarget) {
            const targetTable = rawTables.find(
              (t) => t.tableName.toLowerCase() === col.foreignKeyTarget?.table.toLowerCase()
            );
            if (targetTable) {
              initialEdges.push({
                id: `edge-${edgeIdx++}`,
                source: table.tableName,
                target: targetTable.tableName,
                type: 'smoothstep',
                animated: false,
                style: { stroke: '#3B82F6', strokeWidth: 1.5 },
                markerEnd: {
                  type: MarkerType.ArrowClosed,
                  width: 12,
                  height: 12,
                  color: '#3B82F6',
                },
              });
            }
          }
        }
      }

      // If no explicit FK edges found, connect relational defaults
      if (initialEdges.length === 0 && rawTables.length > 1) {
        for (let i = 0; i < rawTables.length - 1; i++) {
          initialEdges.push({
            id: `edge-auto-${i}`,
            source: rawTables[i].tableName,
            target: rawTables[i + 1].tableName,
            type: 'smoothstep',
            style: { stroke: '#22262E', strokeWidth: 1.5, strokeDasharray: '4 4' },
          });
        }
      }

      // Layout with ELK
      const elkGraph = {
        id: 'root',
        layoutOptions: {
          'elk.algorithm': 'layered',
          'elk.direction': 'RIGHT',
          'elk.spacing.nodeNode': '60',
          'elk.layered.spacing.nodeNodeBetweenLayers': '90',
          'elk.edgeRouting': 'ORTHOGONAL',
        },
        children: initialNodes.map((n) => {
          const table = (n.data as any).table as DatabaseErdTable;
          const height = Math.min(320, 36 + (table?.columns?.length || 5) * 26);
          return {
            id: n.id,
            width: 260,
            height,
          };
        }),
        edges: initialEdges.map((e) => ({
          id: e.id,
          sources: [e.source],
          targets: [e.target],
        })),
      };

      try {
        const layouted = await elk.layout(elkGraph);

        const positionedNodes = initialNodes.map((node) => {
          const layoutNode = layouted.children?.find((c) => c.id === node.id);
          return {
            ...node,
            position: {
              x: layoutNode?.x ?? node.position.x,
              y: layoutNode?.y ?? node.position.y,
            },
          };
        });

        setNodes(positionedNodes);
        setEdges(initialEdges);
      } catch (err) {
        console.error('ELK layout error:', err);
        setNodes(initialNodes);
        setEdges(initialEdges);
      } finally {
        setIsLayouting(false);
      }
    },
    [elk]
  );

  useEffect(() => {
    if (tables && tables.length > 0) {
      applyElkLayout(tables);
    }
  }, [tables, applyElkLayout]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const table = (node.data as any).table as DatabaseErdTable;
      if (table && onTableSelect) {
        onTableSelect(table);
      }
    },
    [onTableSelect]
  );

  return (
    <div className="w-full h-full flex flex-col bg-[#111317] border border-[#22262E] rounded-[2px] overflow-hidden select-none">
      {/* Sub-Header Toolbar */}
      <div className="h-[32px] bg-[#16191F] border-b border-[#22262E] px-3 flex items-center justify-between font-mono text-[11px] shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 font-bold text-[#EDEDED]">
            <Database className="h-3.5 w-3.5 text-[#3B82F6]" />
            <span>Database ERD Graph Canvas (@xyflow/react + elkjs)</span>
          </div>
          <span className="text-[10px] text-[#707070] tabular-nums">
            {tables.length} Tables · {edges.length} Relationships
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => applyElkLayout(tables)}
            disabled={isLayouting}
            className="flex items-center gap-1 px-2.5 py-0.5 bg-[#111317] border border-[#22262E] hover:border-[#3B82F6] text-[#A1A1A1] hover:text-[#EDEDED] rounded-[2px] text-[10px] font-bold transition-colors disabled:opacity-50"
            title="Recalculate graph layout with ELK layered engine"
          >
            <RefreshCw className={`h-3 w-3 text-[#3B82F6] ${isLayouting ? 'animate-spin' : ''}`} />
            <span>{isLayouting ? 'Laying out...' : 'ELK Auto-Layout'}</span>
          </button>
        </div>
      </div>

      {/* ReactFlow Interactive Canvas */}
      <div className="flex-1 w-full h-full relative bg-[#0B0C0E]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          fitView
          className="bg-[#0B0C0E]"
          minZoom={0.2}
          maxZoom={2.0}
        >
          <Background color="#22262E" gap={16} size={1} />
          <Controls className="!bg-[#16191F] !border !border-[#22262E] !rounded-[2px] !fill-[#EDEDED]" />
          <MiniMap
            className="!bg-[#111317] !border !border-[#22262E] !rounded-[2px]"
            nodeColor="#3B82F6"
            maskColor="rgba(11, 12, 14, 0.7)"
          />
        </ReactFlow>
      </div>

      {/* Footer */}
      <div className="h-[24px] bg-[#16191F] border-t border-[#22262E] px-3 flex items-center justify-between text-[10px] font-mono text-[#707070] shrink-0">
        <div className="flex items-center gap-3">
          <span>Engine: <strong className="text-[#EDEDED]">elkjs Layered (Orthogonal)</strong></span>
          <span>Source: <strong className="text-[#059669]">schema.prisma / SQL DDL</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <span>Click any table to inspect columns and foreign key constraints in Right Pane</span>
        </div>
      </div>
    </div>
  );
}
