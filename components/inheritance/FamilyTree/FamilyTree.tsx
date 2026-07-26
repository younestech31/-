'use client';

// components/FamilyTree/FamilyTree.tsx

import { useCallback, useState, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
  BackgroundVariant,
  Position,
  useReactFlow,
  getNodesBounds,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "dagre";
import * as htmlToImage from 'html-to-image';
import { Image as ImageIcon, Printer, Loader2, CheckCircle2, AlertCircle, Info, FileText, X } from 'lucide-react';
import Fraction from "fraction.js";
import { exportTreeToPDF, ExportProgress } from "@/lib/inheritance/exportTreeToPDF";

import FamilyNode, { FamilyNodeData, Relation } from "./FamilyNode";
import { CalculationResult } from "@/lib/inheritance-calculator";

function getFrac(val: unknown): Fraction {
  if (!val) return new Fraction(0);
  if (val instanceof Fraction || (typeof val === "object" && val !== null && "compare" in val && typeof (val as { compare?: unknown }).compare === "function")) {
    return val as Fraction;
  }
  if (typeof val === 'number' || typeof val === 'string') return new Fraction(val);
  if (typeof val === 'object' && val !== null) {
    const v = val as { s?: unknown; n?: unknown; d?: unknown };
    const s = typeof v.s === 'number' ? v.s : 1;
    const n = typeof v.n === 'number' ? v.n : 0;
    const d = typeof v.d === 'number' ? v.d : 1;
    return new Fraction(s * n, d);
  }
  return new Fraction(0);
}

const getHeirMeta = (heirId: string): { relation: Relation, gender: 'male'|'female', labelAr: string } => {
  if (heirId === 'husband') return { relation: 'spouse', gender: 'male', labelAr: 'الزوج' };
  if (heirId === 'wife') return { relation: 'spouse', gender: 'female', labelAr: 'الزوجة' };
  if (heirId === 'father') return { relation: 'father', gender: 'male', labelAr: 'الأب' };
  if (heirId === 'mother') return { relation: 'mother', gender: 'female', labelAr: 'الأم' };
  if (heirId === 'grandfather') return { relation: 'father', gender: 'male', labelAr: 'الجد' };
  if (heirId === 'paternal_grandmother') return { relation: 'mother', gender: 'female', labelAr: 'الجدة (أم الأب)' };
  if (heirId === 'maternal_grandmother') return { relation: 'mother', gender: 'female', labelAr: 'الجدة (أم الأم)' };
  if (heirId === 'son') return { relation: 'son', gender: 'male', labelAr: 'الابن' };
  if (heirId === 'daughter') return { relation: 'daughter', gender: 'female', labelAr: 'البنت' };
  if (heirId === 'son_son') return { relation: 'grandson', gender: 'male', labelAr: 'ابن الابن' };
  if (heirId === 'granddaughter') return { relation: 'granddaughter', gender: 'female', labelAr: 'بنت الابن' };
  if (heirId === 'full_brother') return { relation: 'brother', gender: 'male', labelAr: 'الأخ الشقيق' };
  if (heirId === 'paternal_brother') return { relation: 'brother', gender: 'male', labelAr: 'الأخ لأب' };
  if (heirId === 'maternal_siblings') return { relation: 'brother', gender: 'male', labelAr: 'الإخوة لأم' };
  if (heirId === 'full_sister') return { relation: 'sister', gender: 'female', labelAr: 'الأخت الشقيقة' };
  if (heirId === 'paternal_sister') return { relation: 'sister', gender: 'female', labelAr: 'الأخت لأب' };
  if (heirId === 'full_nephew') return { relation: 'nephew', gender: 'male', labelAr: 'ابن الأخ الشقيق' };
  if (heirId === 'paternal_nephew') return { relation: 'nephew', gender: 'male', labelAr: 'ابن الأخ لأب' };
  if (heirId === 'full_uncle') return { relation: 'uncle', gender: 'male', labelAr: 'العم الشقيق' };
  if (heirId === 'paternal_uncle') return { relation: 'uncle', gender: 'male', labelAr: 'العم لأب' };
  if (heirId === 'full_uncle_son') return { relation: 'cousin', gender: 'male', labelAr: 'ابن العم الشقيق' };
  if (heirId === 'paternal_uncle_son') return { relation: 'cousin', gender: 'male', labelAr: 'ابن العم لأب' };
  if (heirId === 'distant_kindred') return { relation: 'arham', gender: 'male', labelAr: 'ذوو الأرحام' };
  if (heirId === 'mandatory_bequest') return { relation: 'grandson', gender: 'male', labelAr: 'الوصية الواجبة' }; 
  if (heirId === 'voluntary_bequest') return { relation: 'son', gender: 'male', labelAr: 'الوصية الاختيارية' }; 
  return { relation: 'son', gender: 'male', labelAr: 'وارث' };
};

const getLogicalParent = (heirId: string): string => {
  const map: Record<string, string> = {
    'maternal_grandmother': 'mother',
    'paternal_grandmother': 'father',
    'grandfather': 'father',
    'full_brother': 'father',
    'paternal_brother': 'father',
    'maternal_siblings': 'mother',
    'full_sister': 'father',
    'paternal_sister': 'father',
    'full_uncle': 'grandfather',
    'paternal_uncle': 'grandfather',
    'full_uncle_son': 'full_uncle',
    'paternal_uncle_son': 'paternal_uncle',
    'son_son': 'son',
    'granddaughter': 'son',
    'full_nephew': 'full_brother',
    'paternal_nephew': 'paternal_brother',
  };
  return map[heirId] || 'deceased';
};

const generationRank: Record<string, number> = {
  'maternal_grandmother': -2,
  'paternal_grandmother': -2,
  'grandfather': -2,
  'father': -1,
  'mother': -1,
  'full_uncle': -1,
  'paternal_uncle': -1,
  'husband': 0,
  'wife': 0,
  'deceased': 0,
  'full_brother': 0,
  'paternal_brother': 0,
  'maternal_siblings': 0,
  'full_sister': 0,
  'paternal_sister': 0,
  'full_uncle_son': 0,
  'paternal_uncle_son': 0,
  'son': 1,
  'daughter': 1,
  'full_nephew': 1,
  'paternal_nephew': 1,
  'son_son': 2,
  'granddaughter': 2,
  'mandatory_bequest': 2,
  'voluntary_bequest': 1,
  'treasury': 3,
};

export interface HeirPresence {
  heirId: string;
  isPresent: boolean;
  count: number;
  customNames?: string[];
}

export interface StageResult {
  stage: {
    id: string;
    deceasedName: string;
    parentHeirId: string;
    parentStageId: string;
    parentHeirIndex?: number;
    heirPresence: Record<string, HeirPresence>;
  };
  results: CalculationResult[];
  netEstate: number;
}

interface FamilyTreeProps {
  allStages: StageResult[];
}

const getLayoutedElements = (initialNodes: Node[], initialEdges: Edge[]) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  
  // Set layout direction and spacing
  dagreGraph.setGraph({ rankdir: 'TB', nodesep: 50, ranksep: 80 });

  initialNodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 180, height: 160 });
  });

  initialEdges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  initialNodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.targetPosition = Position.Top;
    node.sourcePosition = Position.Bottom;

    node.position = {
      x: nodeWithPosition.x - 180 / 2,
      y: nodeWithPosition.y - 160 / 2,
    };
  });

  return { nodes: initialNodes, edges: initialEdges };
};

function ExportPanel() {
  const { getNodes } = useReactFlow();
  const [isExportingImage, setIsExportingImage] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);

  const downloadImage = async () => {
    const nodes = getNodes();
    if (nodes.length === 0) return;
    setIsExportingImage(true);

    const nodesBounds = getNodesBounds(nodes);
    
    // Add padding to ensure no nodes are cut off at the edges
    const padding = 60;
    const imageWidth = nodesBounds.width + padding * 2;
    const imageHeight = nodesBounds.height + padding * 2;

    const el = document.querySelector('#results-family-tree .react-flow__viewport');
    if (!el) {
      setIsExportingImage(false);
      return;
    }

    try {
      const dataUrl = await htmlToImage.toPng(el as HTMLElement, {
        backgroundColor: '#f8fafc',
        pixelRatio: 2,
        width: imageWidth,
        height: imageHeight,
        style: {
          width: `${imageWidth}px`,
          height: `${imageHeight}px`,
          transform: `translate(${padding - nodesBounds.x}px, ${padding - nodesBounds.y}px) scale(1)`,
        }
      });

      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = 'شجرة-الميراث.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to export image:', error);
    } finally {
      setIsExportingImage(false);
    }
  };

  const handleExportPDF = async () => {
    const nodes = getNodes();
    if (nodes.length === 0) return;
    
    setExportProgress({
      status: "idle",
      message: "بدء عملية تحويل الشجرة..."
    });

    try {
      await exportTreeToPDF(nodes, (progress) => {
        setExportProgress(progress);
      });
    } catch (error) {
      console.error("Failed to export PDF tree:", error);
      setExportProgress({
        status: "error",
        message: error instanceof Error ? error.message : "حدث خطأ غير متوقع أثناء تصدير ملف الـ PDF."
      });
    }
  };

  const isExportingPDF = exportProgress !== null && 
    exportProgress.status !== "success" && 
    exportProgress.status !== "error";

  const renderProgressOverlay = () => {
    if (!exportProgress) return null;

    const { status, message, currentPage, totalPages } = exportProgress;
    const hasProgress = currentPage !== undefined && totalPages !== undefined && totalPages > 0;
    const percent = hasProgress ? Math.round((currentPage / totalPages) * 100) : 0;

    return (
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[9999] rounded-lg p-4 transition-all duration-300"
        dir="rtl"
        style={{ pointerEvents: 'auto' }}
      >
        <div className="bg-white rounded-xl shadow-2xl border border-slate-100 max-w-md w-full p-6 text-center flex flex-col items-center gap-4 relative animate-in fade-in zoom-in-95 duration-200">
          
          {(status === "success" || status === "error") && (
            <button 
              onClick={() => setExportProgress(null)}
              className="absolute top-4 left-4 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          )}

          <div className="p-3 rounded-full bg-slate-50">
            {status === "calculating" && (
              <Info className="h-10 w-10 text-indigo-600 animate-pulse" />
            )}
            {status === "rendering" && (
              <Loader2 className="h-10 w-10 text-[#0a5d38] animate-spin" />
            )}
            {status === "saving" && (
              <FileText className="h-10 w-10 text-amber-600 animate-bounce" />
            )}
            {status === "success" && (
              <CheckCircle2 className="h-12 w-12 text-[#0a5d38]" />
            )}
            {status === "error" && (
              <AlertCircle className="h-12 w-12 text-rose-500" />
            )}
          </div>

          <h3 className="text-base font-bold text-slate-900 font-sans">
            {status === "calculating" && "جاري حساب الأبعاد"}
            {status === "rendering" && `جاري تجهيز الشجرة`}
            {status === "saving" && "تجميع وحفظ المستند"}
            {status === "success" && "اكتمل التصدير بنجاح"}
            {status === "error" && "فشل التصدير"}
          </h3>

          <p className="text-sm text-slate-600 font-sans leading-relaxed text-center px-2">
            {message}
          </p>

          {status === "rendering" && hasProgress && (
            <div className="w-full mt-2">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span className="font-mono">{percent}%</span>
                <span>الصفحة {currentPage} من {totalPages}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-[#0a5d38] h-full transition-all duration-300 rounded-full" 
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          )}

          {status === "calculating" && (
            <div className="w-full bg-indigo-100 rounded-full h-1.5 overflow-hidden mt-1">
              <div className="bg-indigo-600 h-full w-full animate-pulse rounded-full" />
            </div>
          )}

          {status === "saving" && (
            <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden">
              <div className="bg-amber-500 h-full w-full animate-pulse rounded-full" />
            </div>
          )}

          {(status === "success" || status === "error") && (
            <button 
              onClick={() => setExportProgress(null)}
              className="mt-2 px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs font-sans rounded-md transition-colors w-full cursor-pointer"
            >
              موافق (إغلاق)
            </button>
          )}

        </div>
      </div>
    );
  };

  return (
    <>
      <Panel position="top-right" className="flex gap-2 z-40">
        <button 
          onClick={downloadImage}
          disabled={isExportingImage || isExportingPDF}
          className="flex items-center gap-1.5 bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 text-gray-700 px-3 py-1.5 rounded-md text-xs font-bold shadow-sm transition-colors cursor-pointer"
        >
          {isExportingImage ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              جاري حفظ الصورة...
            </>
          ) : (
            <>
              <ImageIcon size={14} /> PNG
            </>
          )}
        </button>
        <button 
          onClick={handleExportPDF}
          disabled={isExportingImage || isExportingPDF}
          className="flex items-center gap-1.5 bg-[#0a5d38] hover:bg-[#074327] disabled:opacity-50 text-white px-3 py-1.5 rounded-md text-xs font-bold shadow-sm transition-colors cursor-pointer"
        >
          {isExportingPDF ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              جاري التصدير PDF...
            </>
          ) : (
            <>
              <Printer size={14} />
              طباعة الشجرة (PDF)
            </>
          )}
        </button>
      </Panel>
      {renderProgressOverlay()}
    </>
  );
}

const nodeTypes = { familyNode: FamilyNode };

export default function FamilyTree({ allStages }: FamilyTreeProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [_selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const initialNodes: Node<FamilyNodeData>[] = [];
    const initialEdges: Edge[] = [];

    // Track which nodes have died to link Munasakhat stages
    const deceasedNodesMap = new Map<string, string>(); // stageId -> deceasedNodeId

    allStages.forEach((stageResult, stageIndex) => {
      const { stage, results, netEstate } = stageResult;
      
      let deceasedNodeId = `deceased_${stage.id}`;

      if (stageIndex === 0) {
        // Root deceased
        initialNodes.push({
          id: deceasedNodeId,
          type: 'familyNode',
          position: { x: 0, y: 0 },
          data: {
            name: stage.deceasedName,
            gender: 'male',
            relation: 'deceased',
            isAlive: false,
            shareAmount: netEstate,
          }
        });
        deceasedNodesMap.set(stage.id, deceasedNodeId);
      } else {
        // Find the parent node in the parent stage
        const parentStageId = stage.parentStageId;
        const parentHeirId = stage.parentHeirId;
        const parentHeirIndex = stage.parentHeirIndex ?? 0;
        
        const allParentNodesOfType = initialNodes.filter(n => 
          n.id.startsWith(`${parentHeirId}_`) && 
          n.id.endsWith(`_${parentStageId}`)
        );

        let parentNode = allParentNodesOfType[parentHeirIndex];

        if (!parentNode || !parentNode.data.isAlive) {
           parentNode = allParentNodesOfType.find(n => n.data.isAlive) || allParentNodesOfType[0];
        }

        if (parentNode) {
          parentNode.data.isAlive = false; // Mark as deceased
          deceasedNodeId = parentNode.id;
          deceasedNodesMap.set(stage.id, deceasedNodeId);
        } else {
          deceasedNodesMap.set(stage.id, deceasedNodesMap.get(parentStageId) || `deceased_root`);
        }
      }

      const currentDeceasedNodeId = deceasedNodesMap.get(stage.id)!;

      // 1. Identify all required heirs (winners + their logical ancestors)
      const requiredHeirs = new Set<string>();
      Object.keys(stage.heirPresence).forEach(heirId => {
        const presence = stage.heirPresence[heirId];
        if (presence.isPresent && presence.count > 0) {
          requiredHeirs.add(heirId);
          let curr = getLogicalParent(heirId);
          while (curr && curr !== 'deceased') {
            requiredHeirs.add(curr);
            curr = getLogicalParent(curr);
          }
        }
      });

      // 2. Generate nodes for required heirs (if they aren't explicitly in the results, we create a dummy blocked node)
      const stageGeneratedNodes = new Map<string, Node[]>();
      let nodeIdCounter = 1;

      requiredHeirs.forEach((heirId) => {
        const result = results.find(r => r.heirId === heirId);
        const meta = getHeirMeta(heirId);
        const presence = stage.heirPresence[heirId];
        
        // If they are explicitly in results and not blocked, use their full data
        const isWinning = result && !result.isBlocked && (netEstate > 0 ? result.amount > 0 : getFrac(result.shareFraction).compare(0) > 0);
        const count = result?.count || 1;
        const generatedForHeir: Node[] = [];

        for (let i = 0; i < count; i++) {
          const id = `${heirId}_${nodeIdCounter++}_${stage.id}`;
          
          let nodeName = result?.nameAr || meta.labelAr || heirId;
          if (presence?.customNames?.[i]) {
            nodeName = result?.nameAr ? `${presence.customNames[i]} (${result.nameAr})` : presence.customNames[i];
          } else if (count > 1) {
            nodeName = `${nodeName} ${i + 1}`;
          }
          
          const node: Node<FamilyNodeData> = {
            id,
            type: 'familyNode',
            position: { x: 0, y: 0 },
            data: {
              name: nodeName,
              gender: meta.gender,
              relation: meta.relation,
              isAlive: true,
              isBlocked: result?.isBlocked || (!isWinning && netEstate > 0),
              shareRatio: isWinning && result.shareFraction ? getFrac(result.shareFraction).div(count).valueOf() : (result?.shareDecimal ? result.shareDecimal/count : undefined),
              shareAmount: isWinning ? (result.amount / count) : undefined,
              shareBasis: isWinning && result.shareFraction ? (result.count > 1 ? `${getFrac(result.shareFraction).div(count).toFraction(true)}` : result.share) : undefined,
            }
          };
          generatedForHeir.push(node);
          initialNodes.push(node);
        }
        stageGeneratedNodes.set(heirId, generatedForHeir);
      });

      // 3. Connect the logical chain
      // Dagre edges flow from Top -> Bottom (Rank 1 -> Rank 2)
      // So Ancestors -> Deceased -> Descendants
      requiredHeirs.forEach((heirId) => {
        const parentId = getLogicalParent(heirId);
        const nodesForHeir = stageGeneratedNodes.get(heirId)!;
        
        let parentNodes: Node[] = [];
        if (parentId === 'deceased') {
          // Deceased is always single per stage
          parentNodes = [{ id: currentDeceasedNodeId } as Node];
        } else {
          parentNodes = stageGeneratedNodes.get(parentId) || [];
        }

        // Determine hierarchy flow based on generation rank
        const heirRank = generationRank[heirId] ?? 0;
        const isAncestor = heirRank < 0;

        nodesForHeir.forEach(currNode => {
          // If parent is missing (edge case), default to deceased
          const targetParent = parentNodes.length > 0 ? parentNodes[0] : { id: currentDeceasedNodeId } as Node;

          // If ancestor: Ancestor -> Parent ( flows down to deceased )
          // If descendant or sibling (Rank >= 0): Parent -> Node ( flows down from deceased or father )
          const sourceId = isAncestor ? currNode.id : targetParent.id;
          const targetId = isAncestor ? targetParent.id : currNode.id;

          initialEdges.push({
            id: `e-${sourceId}-${targetId}`,
            source: sourceId,
            target: targetId,
            type: 'smoothstep',
            animated: stageIndex > 0,
            style: { 
              stroke: '#94a3b8', 
              strokeWidth: 1.5,
              strokeDasharray: 'none'
            }
          });
        });
      });
    });

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      initialNodes,
      initialEdges
    );

    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [allStages, setNodes, setEdges]);

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  const handleSelect = useCallback(
    (id: string) => {
      setSelectedId(id);
      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          selected: n.id === id,
        }))
      );
    },
    [setNodes, setSelectedId]
  );

  return (
    <div id="results-family-tree" className="w-full h-full bg-[#f8fafc] rounded-lg border border-[#e2e8f0] relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={1.5}
        attributionPosition="bottom-right"
        onNodeClick={(_, node) => handleSelect(node.id)}
        onPaneClick={() => handleSelect("")}
      >
        <Background color="#cbd5e1" variant={BackgroundVariant.Dots} gap={16} />
        <Controls showInteractive={false} className="!bg-white !border-[#e2e8f0] !shadow-sm" />
        <ExportPanel />
        <MiniMap 
          nodeColor={(n) => {
            if (n.data?.relation === 'deceased') return '#f59e0b';
            if (!n.data?.isAlive) return '#94a3b8';
            if (n.data?.isBlocked) return '#cbd5e1';
            return n.data?.gender === 'male' ? '#3b82f6' : '#f43f5e';
          }}
          maskColor="rgba(248, 250, 252, 0.7)"
          className="!bg-white !border-[#e2e8f0] !shadow-sm rounded-md"
        />
      </ReactFlow>
    </div>
  );
}
