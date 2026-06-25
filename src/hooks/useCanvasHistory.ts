import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import type { SpaceNode, SpaceEdge } from '../lib/spacesTypes';

interface Snapshot { nodes: SpaceNode[]; edges: SpaceEdge[]; }

const LIMIT = 50;     // teto de passos guardados
const DEBOUNCE = 400; // só registra quando o grafo "assenta" (evita 1 passo por pixel de drag)

/** Serializa só o que importa pra história — ignora flags voláteis (selected/dragging)
 *  que o React Flow injeta, senão selecionar um nó viraria um passo de undo. */
function serialize(nodes: SpaceNode[], edges: SpaceEdge[]): string {
  const n = nodes.map(x => ({ id: x.id, type: x.type, position: x.position, data: x.data }));
  const e = edges.map(x => ({ id: x.id, source: x.source, target: x.target, sourceHandle: x.sourceHandle, targetHandle: x.targetHandle }));
  return JSON.stringify({ n, e });
}

/** Cópia limpa (sem flags voláteis) pra restaurar depois sem arrastar estado de seleção. */
function clean(nodes: SpaceNode[], edges: SpaceEdge[]): Snapshot {
  return {
    nodes: nodes.map(n => ({ id: n.id, type: n.type, position: { ...n.position }, data: n.data } as SpaceNode)),
    edges: edges.map(e => ({ id: e.id, source: e.source, target: e.target, sourceHandle: e.sourceHandle, targetHandle: e.targetHandle } as SpaceEdge)),
  };
}

/** Histórico de undo/redo para o canvas. Tira snapshots com debounce quando nodes/edges
 *  mudam e param de mudar; restaura via setNodes/setEdges. */
export function useCanvasHistory(
  nodes: SpaceNode[],
  edges: SpaceEdge[],
  setNodes: Dispatch<SetStateAction<SpaceNode[]>>,
  setEdges: Dispatch<SetStateAction<SpaceEdge[]>>,
  ready: boolean,
) {
  const past = useRef<Snapshot[]>([]);
  const future = useRef<Snapshot[]>([]);
  const presentSnap = useRef<Snapshot | null>(null);
  const presentKey = useRef<string | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  useEffect(() => {
    if (!ready) return;
    const key = serialize(nodes, edges);
    // baseline (primeira vez que carrega)
    if (presentSnap.current === null) {
      presentSnap.current = clean(nodes, edges);
      presentKey.current = key;
      return;
    }
    // mudança sem efeito real (ex.: seleção) → ignora
    if (key === presentKey.current) return;

    const t = setTimeout(() => {
      past.current.push(presentSnap.current!);
      if (past.current.length > LIMIT) past.current.shift();
      future.current = [];
      presentSnap.current = clean(nodes, edges);
      presentKey.current = key;
      setCanUndo(true);
      setCanRedo(false);
    }, DEBOUNCE);
    return () => clearTimeout(t);
  }, [nodes, edges, ready]);

  const undo = useCallback(() => {
    if (!past.current.length) return;
    const prev = past.current.pop()!;
    future.current.push(presentSnap.current!);
    presentSnap.current = prev;
    presentKey.current = serialize(prev.nodes, prev.edges);
    setNodes(prev.nodes.map(n => ({ ...n })));
    setEdges(prev.edges.map(e => ({ ...e })));
    setCanUndo(past.current.length > 0);
    setCanRedo(true);
  }, [setNodes, setEdges]);

  const redo = useCallback(() => {
    if (!future.current.length) return;
    const next = future.current.pop()!;
    past.current.push(presentSnap.current!);
    presentSnap.current = next;
    presentKey.current = serialize(next.nodes, next.edges);
    setNodes(next.nodes.map(n => ({ ...n })));
    setEdges(next.edges.map(e => ({ ...e })));
    setCanUndo(true);
    setCanRedo(future.current.length > 0);
  }, [setNodes, setEdges]);

  return { undo, redo, canUndo, canRedo };
}
