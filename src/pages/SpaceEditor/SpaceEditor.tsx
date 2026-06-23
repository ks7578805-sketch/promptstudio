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
  const pendingPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropPos = useRef<{ x: number; y: number }>({ x: 200, y: 200 });
  const { screenToFlowPosition, addNodes: rfAddNodes } = useReactFlow();

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

  const onConnect = useCallback((conn: Connection) => {
    setEdges(eds => addEdge(conn, eds));
  }, [setEdges]);

  const onPaneContextMenu = useCallback((e: MouseEvent | React.MouseEvent) => {
    e.preventDefault();
    pendingPos.current = screenToFlowPosition({ x: e.clientX, y: e.clientY });
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, [screenToFlowPosition]);

  const closeMenu = useCallback(() => setContextMenu(null), []);

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

  // File drag-and-drop
  const onDragOver = useCallback((e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('Files')) e.preventDefault();
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    if (!e.dataTransfer.files.length) return;
    e.preventDefault();
    dropPos.current = screenToFlowPosition({ x: e.clientX, y: e.clientY });
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    files.forEach(async (file, i) => {
      const imageId = `upload_${Date.now()}_${i}`;
      const imgRef = storageRef(storage, `spaces/${spaceId}/images/${imageId}`);
      await uploadBytes(imgRef, file);
      const url = await getDownloadURL(imgRef);
      const nodeId = `image_${imageId}`;
      rfAddNodes([{
        id: nodeId,
        type: 'image' as const,
        position: { x: dropPos.current.x + i * 220, y: dropPos.current.y },
        data: { type: 'image' as const, url, label: file.name.replace(/\.[^.]+$/, ''), spaceId },
      }]);
    });
  }, [screenToFlowPosition, spaceId, rfAddNodes]);

  // Upload via button
  const onFileInput = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).filter(f => f.type.startsWith('image/'));
    for (let i = 0; i < files.length; i++) {
      const imageId = `upload_${Date.now()}_${i}`;
      const imgRef = storageRef(storage, `spaces/${spaceId}/images/${imageId}`);
      await uploadBytes(imgRef, files[i]);
      const url = await getDownloadURL(imgRef);
      const nodeId = `image_${imageId}`;
      rfAddNodes([{
        id: nodeId, type: 'image' as const,
        position: { x: 200 + i * 220, y: 200 },
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
    <div className={styles.editor} onDragOver={onDragOver} onDrop={onDrop} onClick={contextMenu ? closeMenu : undefined}>
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
          fitView={loaded && nodes.length > 0}
          deleteKeyCode="Delete"
          multiSelectionKeyCode="Shift"
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="var(--border)" />
          <Controls />
          <MiniMap nodeColor={() => 'var(--red)'} maskColor="rgba(0,0,0,0.2)" />
        </ReactFlow>
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div className={styles.ctxMenu} style={{ left: contextMenu.x, top: contextMenu.y }}>
          <button className={styles.ctxItem} onClick={() => createNode('text')}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/>
            </svg>
            Texto
          </button>
          <button className={styles.ctxItem} onClick={() => createNode('generator')}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
            Imagem (gerar)
          </button>
          <button className={styles.ctxItem} onClick={() => { closeMenu(); fileInputRef.current?.click(); }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Upload
          </button>
        </div>
      )}
    </div>
  );
}
