import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ReactFlow, ReactFlowProvider, Background, Controls, MiniMap,
  useNodesState, useEdgesState, addEdge, useReactFlow,
  type Connection, type NodeTypes, BackgroundVariant,
} from '@xyflow/react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { ImageNode } from '../../components/nodes/ImageNode/ImageNode';
import { TextNode } from '../../components/nodes/TextNode/TextNode';
import { GeneratorNode } from '../../components/nodes/GeneratorNode/GeneratorNode';
import type { SpaceNode, SpaceEdge, ImageNodeData, TextNodeData, GeneratorNodeData } from '../../lib/spacesTypes';
import { ContextMenu, type NodeAction } from './ContextMenu';
import { NodeMenu, type NodeMenuAction } from './NodeMenu';
import { CanvasToolbar, type Tool } from './CanvasToolbar';
import { useCanvasHistory } from '../../hooks/useCanvasHistory';
import styles from './SpaceEditor.module.css';

const nodeTypes: NodeTypes = {
  image: ImageNode as never,
  text: TextNode as never,
  generator: GeneratorNode as never,
};

interface Props { uid: string; spaceId: string; spaceName: string; onClose: () => void; }

export function SpaceEditor(props: Props) {
  return (
    <ReactFlowProvider>
      <SpaceEditorInner {...props} />
    </ReactFlowProvider>
  );
}

function SpaceEditorInner({ uid, spaceId, spaceName, onClose }: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState<SpaceNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<SpaceEdge>([]);
  const [loaded, setLoaded] = useState(false);
  const [name, setName] = useState(spaceName);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [nodeMenu, setNodeMenu] = useState<{ x: number; y: number; id: string; canGenerate: boolean } | null>(null);
  const [tool, setTool] = useState<Tool>('select');
  const [dropError, setDropError] = useState<string | null>(null);
  const pendingPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { screenToFlowPosition, addNodes: rfAddNodes } = useReactFlow();
  const { undo, redo, canUndo, canRedo } = useCanvasHistory(nodes, edges, setNodes, setEdges, loaded);

  // Load from Firestore
  useEffect(() => {
    getDoc(doc(db, 'users', uid, 'spaces', spaceId)).then(snap => {
      if (snap.exists()) {
        const d = snap.data();
        setNodes((d.nodes as SpaceNode[]) ?? []);
        setEdges((d.edges as SpaceEdge[]) ?? []);
        setName(d.name ?? spaceName);
      }
      setLoaded(true);
    }).catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spaceId]);

  // Autosave with debounce
  useEffect(() => {
    if (!loaded) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const thumbnail = nodes.find(n => n.data.type === 'image')
        ? (nodes.find(n => n.data.type === 'image')!.data as ImageNodeData).url
        : null;
      updateDoc(doc(db, 'users', uid, 'spaces', spaceId), {
        nodes,
        edges,
        thumbnail: thumbnail ?? null,
        updatedAt: Date.now(),
      }).catch(console.error);
    }, 800);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [nodes, edges, loaded, spaceId]);

  // Auto-dismiss do aviso de erro de upload
  useEffect(() => {
    if (!dropError) return;
    const t = setTimeout(() => setDropError(null), 6000);
    return () => clearTimeout(t);
  }, [dropError]);

  const onConnect = useCallback((conn: Connection) => {
    setEdges(eds => addEdge(conn, eds));
  }, [setEdges]);

  const onPaneContextMenu = useCallback((e: MouseEvent | React.MouseEvent) => {
    e.preventDefault();
    pendingPos.current = screenToFlowPosition({ x: e.clientX, y: e.clientY });
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, [screenToFlowPosition]);

  const closeMenu = useCallback(() => setContextMenu(null), []);
  const closeNodeMenu = useCallback(() => setNodeMenu(null), []);

  // Clique direito EM CIMA de um nó → menu de contexto do nó na posição do cursor
  const onNodeContextMenu = useCallback((e: React.MouseEvent, node: SpaceNode) => {
    e.preventDefault();
    setContextMenu(null);
    setNodeMenu({ x: e.clientX, y: e.clientY, id: node.id, canGenerate: node.type === 'generator' });
  }, []);

  // Ações do menu de nó
  const onNodeMenuAction = useCallback((action: NodeMenuAction) => {
    const target = nodeMenu;
    if (!target) return;
    const { id } = target;
    setNodeMenu(null);

    if (action === 'delete') {
      // Apaga o nó E todas as arestas conectadas a ele (source ou target)
      setNodes(nds => nds.filter(n => n.id !== id));
      setEdges(eds => eds.filter(e => e.source !== id && e.target !== id));
      return;
    }

    if (action === 'duplicate') {
      const original = nodes.find(n => n.id === id);
      if (!original) return;
      rfAddNodes([{
        ...original,
        id: `${original.type}_${Date.now()}`,
        position: { x: original.position.x + 48, y: original.position.y + 48 },
        selected: false,
        data: { ...original.data },
      } as SpaceNode]);
      return;
    }

    // start / add → dispara a geração desse nó (o GeneratorNode escuta o evento).
    // "Adicionar criação" usa a mesma ação (cada geração já anexa uma nova saída).
    if (action === 'start' || action === 'add') {
      window.dispatchEvent(new CustomEvent('space:node-generate', { detail: { id } }));
    }
  }, [nodeMenu, nodes, setNodes, setEdges, rfAddNodes]);

  // Atalhos de teclado: undo/redo (ignora quando digitando em campo de texto)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      const mod = e.ctrlKey || e.metaKey;
      if (!mod || e.key.toLowerCase() !== 'z' && e.key.toLowerCase() !== 'y') return;
      if (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey)) {
        e.preventDefault();
        redo();
      } else if (e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo]);

  const createNode = useCallback((type: 'image' | 'text' | 'generator') => {
    closeMenu();
    const pos = pendingPos.current;
    const id = `${type}_${Date.now()}`;
    let data: ImageNodeData | TextNodeData | GeneratorNodeData;
    if (type === 'image') data = { type: 'image', url: '', spaceId };
    else if (type === 'text') data = { type: 'text', content: '' };
    else data = { type: 'generator', prompt: '', provider: 'google', model: 'gemini-2.5-flash-image', ratio: '1:1', count: 1, spaceId };
    rfAddNodes([{ id, type, position: pos, data } as SpaceNode]);
  }, [closeMenu, spaceId, rfAddNodes]);

  // Ação vinda do menu de contexto: cria nó ou abre upload, sempre na pos. do cursor
  const handleMenuCreate = useCallback((action: NodeAction) => {
    if (action === 'upload') {
      closeMenu();
      fileInputRef.current?.click();
    } else {
      createNode(action);
    }
  }, [closeMenu, createNode]);

  // Drag-and-drop no canvas.
  // preventDefault() + dropEffect SEMPRE no dragover, senão o navegador bloqueia o drop.
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY });

    // Caso 1: arquivo(s) de imagem vindos do SO → upload pro Storage, salva só a URL
    const files = Array.from(e.dataTransfer.files ?? []).filter(f => f.type.startsWith('image/'));
    if (files.length) {
      files.forEach(async (file, i) => {
        try {
          const imageId = `upload_${Date.now()}_${i}`;
          const imgRef = storageRef(storage, `spaces/${spaceId}/images/${imageId}`);
          await uploadBytes(imgRef, file);
          const url = await getDownloadURL(imgRef);
          rfAddNodes([{
            id: `image_${imageId}`,
            type: 'image' as const,
            position: { x: pos.x + i * 220, y: pos.y },
            data: { type: 'image' as const, url, label: file.name.replace(/\.[^.]+$/, ''), spaceId },
          }]);
        } catch (err) {
          // upload falhou (ex.: CORS do bucket não configurado) — avisa em vez de morrer mudo
          console.error('Falha ao subir imagem:', err);
          setDropError('Não foi possível subir a imagem. Verifique a configuração de CORS do Storage.');
        }
      });
      return;
    }

    // Caso 2: drag interno de uma imagem já no canvas → reusa a URL (sem re-upload)
    const url = e.dataTransfer.getData('application/x-image-url') || e.dataTransfer.getData('text/uri-list');
    if (url) {
      rfAddNodes([{
        id: `image_${Date.now()}`,
        type: 'image' as const,
        position: pos,
        data: { type: 'image' as const, url, spaceId },
      }]);
    }
  }, [screenToFlowPosition, spaceId, rfAddNodes]);

  // Upload via botão/menu — usa a última posição apontada (cursor) como base
  const onFileInput = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).filter(f => f.type.startsWith('image/'));
    const base = pendingPos.current;
    for (let i = 0; i < files.length; i++) {
      const imageId = `upload_${Date.now()}_${i}`;
      const imgRef = storageRef(storage, `spaces/${spaceId}/images/${imageId}`);
      await uploadBytes(imgRef, files[i]);
      const url = await getDownloadURL(imgRef);
      const nodeId = `image_${imageId}`;
      rfAddNodes([{
        id: nodeId, type: 'image' as const,
        position: { x: base.x + i * 220, y: base.y },
        data: { type: 'image' as const, url, label: files[i].name.replace(/\.[^.]+$/, ''), spaceId },
      }]);
    }
    e.target.value = '';
  }, [spaceId, rfAddNodes]);

  // Name save
  const saveName = useCallback(() => {
    updateDoc(doc(db, 'users', uid, 'spaces', spaceId), { name }).catch(console.error);
  }, [uid, spaceId, name]);

  return (
    <div
      className={styles.editor}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={contextMenu || nodeMenu ? () => { closeMenu(); closeNodeMenu(); } : undefined}
    >
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <button className={styles.backBtn} onClick={onClose} title="Voltar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <input
          className={styles.nameInput}
          value={name}
          onChange={e => setName(e.target.value)}
          onBlur={saveName}
          onKeyDown={e => e.key === 'Enter' && saveName()}
        />
        <div className={styles.toolbarActions}>
          <button className={styles.toolBtn} onClick={() => createNode('text')} title="Adicionar texto">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/>
            </svg>
            Texto
          </button>
          <button className={styles.toolBtn} onClick={() => createNode('generator')} title="Adicionar gerador">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
            Gerador
          </button>
          <button className={styles.toolBtn} onClick={() => fileInputRef.current?.click()} title="Upload imagem">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Upload
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" multiple className={styles.fileInput} onChange={onFileInput} />
        </div>
      </div>

      {/* Canvas */}
      <div className={styles.canvas}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onPaneContextMenu={onPaneContextMenu}
          onNodeContextMenu={onNodeContextMenu}
          fitView={loaded && nodes.length > 0}
          deleteKeyCode={['Delete', 'Backspace']}
          multiSelectionKeyCode="Shift"
          panOnDrag={tool === 'pan' ? true : [1]}
          selectionOnDrag={tool === 'select'}
          defaultEdgeOptions={{ type: 'default', style: { stroke: 'rgba(170, 172, 182, 0.6)', strokeWidth: 1.5 } }}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="var(--border)" />
          <Controls />
          <MiniMap nodeColor={() => 'var(--red)'} maskColor="rgba(0,0,0,0.2)" />
        </ReactFlow>

        {/* Barra de ferramentas vertical (lateral esquerda) */}
        <CanvasToolbar
          tool={tool}
          onToolChange={setTool}
          onUndo={undo}
          onRedo={redo}
          canUndo={canUndo}
          canRedo={canRedo}
        />
      </div>

      {/* Aviso de erro de upload (ex.: CORS) */}
      {dropError && (
        <div className={styles.dropError} onClick={() => setDropError(null)}>
          {dropError}
        </div>
      )}

      {/* Menu de contexto do CANVAS (botão direito no vazio) — paleta de nós */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={closeMenu}
          onCreate={handleMenuCreate}
        />
      )}

      {/* Menu de contexto do NÓ (botão direito em cima do nó) */}
      {nodeMenu && (
        <NodeMenu
          x={nodeMenu.x}
          y={nodeMenu.y}
          canGenerate={nodeMenu.canGenerate}
          onAction={onNodeMenuAction}
          onClose={closeNodeMenu}
        />
      )}
    </div>
  );
}
