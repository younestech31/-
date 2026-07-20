'use client';

import { useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  type NodeProps
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { HEIRS } from '@/data/heirs';
import { HeirPresence } from '@/lib/inheritance-calculator';
import { isHeirExcludedInMunasakhat } from '@/data/munasakhat-exclusions';

interface HeirInputNodeData {
  [key: string]: unknown;
  heir?: { id: string; nameAr: string; nameFr: string; gender: string; allowMultiple?: boolean };
  isPresent?: boolean;
  count?: number;
  customNames?: string[];
  toggleHeir?: (id: string) => void;
  updateCount?: (id: string, count: number) => void;
  updateCustomName?: (id: string, index: number, name: string) => void;
  isDeceased?: boolean;
  deceasedName?: string;
  deceasedGender?: 'male' | 'female' | null;
  exclusionReason?: string;
}

// --- Custom Node Component ---
const HeirInputNode = ({ data }: NodeProps<Node<HeirInputNodeData>>) => {
  const { heir, isPresent, count, customNames, toggleHeir, updateCount, updateCustomName, isDeceased, deceasedName, deceasedGender, exclusionReason } = data;

  // وارث مستبعد في مسألة ثانوية
  if (exclusionReason) {
    return (
      <div className="px-3 py-2 rounded-lg border border-dashed border-red-200 bg-red-50/60 min-w-[120px] flex flex-col items-center gap-1 opacity-60 cursor-not-allowed">
        <Handle type="target" position={Position.Top} className="w-2 h-2 !bg-red-200" />
        <Handle type="source" position={Position.Bottom} className="w-2 h-2 !bg-red-200" />
        <span className="text-[10px] font-bold text-red-400 text-center">{heir?.nameAr}</span>
        <span className="text-[9px] text-red-300 text-center leading-tight">{exclusionReason}</span>
      </div>
    );
  }

  if (isDeceased) {
    return (
      <div className={`px-4 py-2 rounded-lg border-2 shadow-sm text-center min-w-[120px] ${deceasedGender === 'male' ? 'bg-[#030f1c] border-[#185fa5] text-[#b5d4f4]' : 'bg-[#150408] border-[#993556] text-[#f4c0d1]'}`}>
        <div className="text-xs opacity-80 mb-1">المتوفى</div>
        <div className="font-bold text-sm">{deceasedName}</div>
        <Handle type="source" position={Position.Bottom} className="w-2 h-2 !bg-gray-400" />
        <Handle type="source" position={Position.Top} id="top" className="w-2 h-2 !bg-gray-400" />
        <Handle type="source" position={Position.Left} id="left" className="w-2 h-2 !bg-gray-400" />
        <Handle type="source" position={Position.Right} id="right" className="w-2 h-2 !bg-gray-400" />
      </div>
    );
  }

  return (
    <div 
      className={`px-3 py-2 rounded-lg border-2 shadow-sm transition-all cursor-pointer min-w-[120px] flex flex-col items-center gap-2 ${isPresent ? 'bg-[#e7f5ed] border-[#0a5d38]' : 'bg-white border-[#e2e8f0] hover:border-[#0a5d38]/50'}`}
      onClick={() => heir && toggleHeir && toggleHeir(heir.id)}
    >
      <Handle type="target" position={Position.Top} className="w-2 h-2 !bg-gray-400" />
      <Handle type="source" position={Position.Bottom} className="w-2 h-2 !bg-gray-400" />
      
      <div className="flex items-center gap-2 w-full">
        <input
          type="checkbox"
          checked={isPresent}
          readOnly
          className="accent-[#0a5d38] pointer-events-none"
        />
        <div className="flex flex-col flex-grow items-center">
          <span className={`text-xs font-bold text-center ${isPresent ? 'text-[#0a5d38]' : 'text-[#64748b]'}`}>
            {heir?.nameAr}
          </span>
          {isPresent && Array.from({ length: count || 1 }).map((_, i) => (
            <input
              key={i}
              type="text"
              placeholder={`الاسم ${count && count > 1 ? i + 1 : ''} (اختياري)`}
              value={customNames?.[i] || ''}
              onChange={(e) => heir && updateCustomName && updateCustomName(heir.id, i, e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="mt-1 w-full text-[10px] p-1 border border-[#e2e8f0] rounded text-center focus:outline-none focus:border-[#0a5d38] bg-white/50"
            />
          ))}
        </div>
      </div>

      {heir?.allowMultiple && isPresent && (
        <div className="flex items-center gap-1 mt-1" onClick={e => e.stopPropagation()}>
          <button 
            className="w-6 h-6 rounded bg-white border border-[#e2e8f0] flex items-center justify-center text-[#64748b] hover:bg-[#f1f5f9]"
            onClick={() => heir && updateCount && updateCount(heir.id, Math.max(1, (count || 1) - 1))}
          >-</button>
          <span className="text-xs font-mono w-6 text-center">{count}</span>
          <button 
            className="w-6 h-6 rounded bg-white border border-[#e2e8f0] flex items-center justify-center text-[#64748b] hover:bg-[#f1f5f9]"
            onClick={() => heir && updateCount && updateCount(heir.id, (count || 1) + 1)}
          >+</button>
        </div>
      )}
    </div>
  );
};

interface FamilyTreeInputProps {
  heirPresence: Record<string, HeirPresence>;
  toggleHeir: (heirId: string) => void;
  updateCount: (heirId: string, count: number) => void;
  updateCustomName: (heirId: string, index: number, name: string) => void;
  deceasedGender: 'male' | 'female' | null;
  deceasedName: string;
  /** معرّف الوارث الذي توفي ثانياً (لتفعيل قواعد استبعاد المناسخات) */
  parentHeirId?: string;
}

const nodeTypes = { heirInput: HeirInputNode };

export default function FamilyTreeInput({
  heirPresence,
  toggleHeir,
  updateCount,
  updateCustomName,
  deceasedGender,
  deceasedName,
  parentHeirId,
}: FamilyTreeInputProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // 1. Structural Effect: Rebuilds nodes/edges ONLY when layout-affecting props change
  useEffect(() => {
    if (!deceasedGender) return;

    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    // Helper to add node
    const addNode = (id: string, x: number, y: number) => {
      const heir = HEIRS.find(h => h.id === id);
      if (!heir) return;
      
      // Filter out spouse based on deceased gender
      if (deceasedGender === 'male' && id === 'husband') return;
      if (deceasedGender === 'female' && id === 'wife') return;

      // فحص استبعاد المناسخات: هل هذا الوارث مستبعد في هذه المسألة الثانوية؟
      let exclusionReason: string | undefined;
      if (parentHeirId) {
        const { excluded, reason } = isHeirExcludedInMunasakhat(id, parentHeirId);
        if (excluded) {
          exclusionReason = reason.replace(/^مستبعد: /, '').substring(0, 30) + '…';
        }
      }

      newNodes.push({
        id,
        type: 'heirInput',
        position: { x, y },
        data: {
          heir,
          isPresent: false, // will be updated by second effect
          count: 1,
          customNames: [],
          toggleHeir: () => {},
          updateCount: () => {},
          updateCustomName: () => {},
          parentHeirId,
          exclusionReason,
        }
      });
    };

    // 1. Deceased Node
    newNodes.push({
      id: 'deceased',
      type: 'heirInput',
      position: { x: 0, y: 0 },
      data: {
        isDeceased: true,
        deceasedName: '', // updated by second effect
        deceasedGender
      }
    });

    // 2. Add Heirs
    // Ascendants
    addNode('father', -100, -150);
    addNode('mother', 100, -150);
    addNode('grandfather', -100, -300);
    addNode('maternal_grandmother', 200, -300);
    addNode('paternal_grandmother', -200, -300);

    // Descendants
    addNode('son', -100, 150);
    addNode('daughter', 100, 150);
    addNode('son_son', -100, 300);
    addNode('granddaughter', 100, 300);

    // Spouse
    addNode('husband', 200, 0);
    addNode('wife', 200, 0);

    // Siblings
    addNode('full_brother', -250, -50);
    addNode('full_sister', -250, 50);
    addNode('paternal_brother', -400, -50);
    addNode('paternal_sister', -400, 50);
    addNode('maternal_siblings', 350, -50);

    // Uncles and Cousins
    addNode('full_uncle', -550, -150);
    addNode('paternal_uncle', -700, -150);
    addNode('full_uncle_son', -550, -50);
    addNode('paternal_uncle_son', -700, -50);

    // Nephews
    addNode('full_nephew', -250, 150);
    addNode('paternal_nephew', -400, 150);

    // Distant Kindred
    addNode('distant_kindred', 350, -300);

    // Edges
    const createEdge = (source: string, target: string, sourceHandle?: string) => {
      if (newNodes.some(n => n.id === source) && newNodes.some(n => n.id === target)) {
        newEdges.push({
          id: `e-${source}-${target}`,
          source,
          target,
          sourceHandle,
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#cbd5e1', strokeWidth: 2 }
        });
      }
    };

    createEdge('deceased', 'father', 'top');
    createEdge('deceased', 'mother', 'top');
    createEdge('father', 'grandfather');
    createEdge('mother', 'maternal_grandmother');
    createEdge('father', 'paternal_grandmother');
    
    createEdge('deceased', 'son');
    createEdge('deceased', 'daughter');
    createEdge('son', 'son_son');
    createEdge('son', 'granddaughter');

    if (deceasedGender === 'female') createEdge('deceased', 'husband', 'right');
    if (deceasedGender === 'male') createEdge('deceased', 'wife', 'right');

    createEdge('deceased', 'full_brother', 'left');
    createEdge('deceased', 'full_sister', 'left');
    createEdge('father', 'paternal_brother');
    createEdge('father', 'paternal_sister');
    createEdge('mother', 'maternal_siblings');

    createEdge('grandfather', 'full_uncle');
    createEdge('grandfather', 'paternal_uncle');
    createEdge('full_uncle', 'full_uncle_son');
    createEdge('paternal_uncle', 'paternal_uncle_son');

    createEdge('full_brother', 'full_nephew');
    createEdge('paternal_brother', 'paternal_nephew');
    
    createEdge('maternal_grandmother', 'distant_kindred');
    createEdge('paternal_grandmother', 'distant_kindred');

    setNodes(newNodes);
    setEdges(newEdges);
  }, [deceasedGender, parentHeirId, setNodes, setEdges]);

  // 2. Data Effect: Update existing nodes without resetting layout
  useEffect(() => {
    setNodes(nds => nds.map(node => {
      if (node.id === 'deceased') {
        return { ...node, data: { ...node.data, deceasedName } };
      }

      const presence = heirPresence[node.id];
      return {
        ...node,
        data: {
          ...node.data,
          isPresent: presence?.isPresent || false,
          count: presence?.count || 1,
          customNames: presence?.customNames || [],
          toggleHeir: node.data.exclusionReason ? () => {} : toggleHeir,
          updateCount,
          updateCustomName,
        }
      };
    }));
  }, [heirPresence, deceasedName, toggleHeir, updateCount, updateCustomName, setNodes]);

  if (!deceasedGender) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-[#f8fafc]">
        <div className="w-12 h-12 bg-[#e2e8f0] rounded-full flex items-center justify-center mb-3">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0"/><path d="M12 10l0 4"/><path d="M10 12l4 0"/></svg>
        </div>
        <p className="text-sm text-[#64748b] font-bold">الرجاء تحديد جنس المتوفى أولاً</p>
        <p className="text-[11px] text-[#94a3b8] mt-1">يجب تحديد ما إذا كان المتوفى ذكراً أم أنثى لعرض شجرة الورثة.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-[#f8fafc] relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.5}
        maxZoom={1.5}
        attributionPosition="bottom-right"
      >
        <Background color="#cbd5e1" gap={16} />
        <Controls showInteractive={false} className="!bg-white !border-[#e2e8f0] !shadow-sm" />
      </ReactFlow>
      <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-3 py-1.5 rounded shadow-sm border border-[#e2e8f0] text-[10px] text-[#64748b] font-bold">
        اضغط على العقدة لاختيار الوارث
      </div>
    </div>
  );
}
