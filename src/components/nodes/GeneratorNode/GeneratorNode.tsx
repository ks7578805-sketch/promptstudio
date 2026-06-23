import { useState, useCallback } from 'react';
import {
  Handle, Position, NodeToolbar, type NodeProps, type Node,
  useReactFlow, useNodes,
} from '@xyflow/react';
import { ref as storageRef, uploadString, getDownloadURL } from 'firebase/storage';
import { storage } from '../../../lib/firebase';
import { generateImagesForSpace } from '../../../lib/generateImage';
import type { GeneratorNodeData, ImageNodeData, SpaceNode, Ratio } from '../../../lib/spacesTypes';
import { MODEL_LABELS, PROVIDER_INFO } from '../../../lib/types';
import type { Provider, AnyImageModel, GeminiModel, OpenAIModel } from '../../../lib/types';
import { RatioControl } from './RatioControl';
import styles from './GeneratorNode.module.css';

const GEMINI_MODELS: GeminiModel[] = ['gemini-2.5-flash-image', 'gemini-3.1-flash-image', 'gemini-3-pro-image'];
const OPENAI_MODELS: OpenAIModel[] = ['gpt-image-1-mini', 'gpt-image-1.5', 'gpt-image-2'];

type GeneratorSpaceNode = Node<GeneratorNodeData, 'generator'>;

export function GeneratorNode({ id, data, selected, positionAbsoluteX, positionAbsoluteY }: NodeProps<GeneratorSpaceNode>) {
  const { updateNodeData, getEdges, getNode, addNodes, addEdges, deleteElements } = useReactFlow();
  const allNodes = useNodes();
  const [status, setStatus] = useState<'idle' | 'generating' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [hovered, setHovered] = useState(false);

  // "Image Generator #N" — posição entre os geradores do canvas
  const genIndex = allNodes.filter(n => n.type === 'generator').findIndex(n => n.id === id) + 1;

  const handleGenerate = useCallback(async () => {
    if (status === 'generating' || !data.prompt.trim()) return;
    setStatus('generating');
    setError(null);

    try {
      // Coleta imagens de referência dos ImageNodes conectados
      const connectedEdges = getEdges().filter(e => e.target === id && e.targetHandle === 'ref-in');
      const refUrls: string[] = [];
      for (const edge of connectedEdges) {
        const sourceNode = getNode(edge.source) as SpaceNode | undefined;
        if (sourceNode?.data?.type === 'image') {
          refUrls.push((sourceNode.data as ImageNodeData).url);
        }
      }

      const results = await generateImagesForSpace({
        provider: data.provider,
        model: data.model,
        promptText: data.prompt,
        referenceImages: refUrls,
        ratio: data.ratio,
        count: data.count,
      });

      // Upload de cada resultado pro Storage e cria ImageNodes conectados
      const newNodes: SpaceNode[] = [];
      const newEdges = [];
      const spacing = 320;
      const startY = positionAbsoluteY - ((results.length - 1) * spacing) / 2;

      for (let i = 0; i < results.length; i++) {
        const imageId = `img_${Date.now()}_${i}`;
        const imgRef = storageRef(storage, `spaces/${data.spaceId}/images/${imageId}.png`);
        await uploadString(imgRef, results[i], 'data_url');
        const url = await getDownloadURL(imgRef);

        const nodeId = `imageNode_${imageId}`;
        newNodes.push({
          id: nodeId,
          type: 'image' as const,
          position: { x: positionAbsoluteX + 460, y: startY + i * spacing },
          data: { type: 'image' as const, url, label: data.prompt.slice(0, 30), spaceId: data.spaceId },
        });

        newEdges.push({
          id: `edge_${id}_${nodeId}`,
          source: id,
          sourceHandle: 'gen-out',
          target: nodeId,
          targetHandle: 'img-in',
        });
      }

      addNodes(newNodes);
      addEdges(newEdges);
      setPreview(results[0] ?? null);
      setStatus('idle');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(msg);
      setStatus('error');
    }
  }, [status, data, id, positionAbsoluteX, positionAbsoluteY, getEdges, getNode, addNodes, addEdges]);

  const duplicate = useCallback(() => {
    addNodes([{
      id: `generator_${Date.now()}`,
      type: 'generator' as const,
      position: { x: positionAbsoluteX + 48, y: positionAbsoluteY + 48 },
      data: { ...data },
    }]);
  }, [addNodes, data, positionAbsoluteX, positionAbsoluteY]);

  const remove = useCallback(() => {
    deleteElements({ nodes: [{ id }] });
  }, [deleteElements, id]);

  const providerModels = data.provider === 'google' ? GEMINI_MODELS : OPENAI_MODELS;
  const generating = status === 'generating';
  const canGenerate = !generating && !!data.prompt.trim();

  return (
    <div
      className={`${styles.node} ${generating ? styles.generating : ''} ${selected ? styles.selected : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Toolbar de hover, acima do nó */}
      <NodeToolbar isVisible={hovered || selected} position={Position.Top} offset={10} className={styles.toolbar}>
        <button className={styles.tbBtn} onClick={handleGenerate} disabled={!canGenerate} title="Gerar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4" /></svg>
        </button>
        <button className={styles.tbBtn} title="Conectar (arraste das alças)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
        </button>
        <button className={styles.tbBtn} onClick={duplicate} title="Duplicar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        </button>
        <button className={`${styles.tbBtn} ${styles.tbDanger}`} onClick={remove} title="Excluir">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
        </button>
        <button className={styles.tbBtn} title="Mais">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></svg>
        </button>
      </NodeToolbar>

      <Handle type="target" position={Position.Left} id="ref-in" className={styles.handle} />

      {/* Barra de título */}
      <div className={styles.titleBar}>
        <span className={styles.titleIcon}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
        </span>
        <span className={styles.titleText}>Image Generator #{genIndex || 1}</span>
        {generating && <span className={styles.spinner} />}
      </div>

      {/* Área de preview / output */}
      <div className={styles.preview}>
        {generating ? (
          <div className={styles.previewLoading}><span className={styles.spinnerLg} /></div>
        ) : preview ? (
          <img src={preview} alt="resultado" className={styles.previewImg} draggable={false} />
        ) : (
          <div className={styles.previewEmpty}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            <span>Sua imagem aparece aqui</span>
          </div>
        )}
      </div>

      {/* Prompt */}
      <textarea
        className={`${styles.textarea} nodrag nowheel`}
        placeholder="Descreva a imagem que quer gerar..."
        value={data.prompt}
        onChange={e => updateNodeData(id, { prompt: e.target.value })}
        rows={3}
      />

      {error && status === 'error' && <div className={styles.errorMsg}>{error}</div>}

      {/* Barra de controles inferior */}
      <div className={`${styles.controls} nodrag`}>
        <div className={styles.segmented}>
          {(['google', 'openai'] as Provider[]).map(p => (
            <button
              key={p}
              className={`${styles.segBtn} ${data.provider === p ? styles.segActive : ''}`}
              onClick={() => {
                const firstModel = p === 'google' ? GEMINI_MODELS[0] : OPENAI_MODELS[0];
                updateNodeData(id, { provider: p, model: firstModel });
              }}
            >
              {PROVIDER_INFO[p].name}
            </button>
          ))}
        </div>

        <div className="nodrag nowheel">
          <select
            className={styles.modelSelect}
            value={data.model}
            onChange={e => updateNodeData(id, { model: e.target.value as AnyImageModel })}
          >
            {providerModels.map(m => <option key={m} value={m}>{MODEL_LABELS[m]}</option>)}
          </select>
        </div>

        <div className={styles.controlRow}>
          {/* Stepper de quantidade */}
          <div className={styles.stepper}>
            <button
              className={styles.stepBtn}
              onClick={() => updateNodeData(id, { count: Math.max(1, data.count - 1) })}
              disabled={data.count <= 1}
              title="Menos"
            >−</button>
            <span className={styles.stepValue}>{data.count}</span>
            <button
              className={styles.stepBtn}
              onClick={() => updateNodeData(id, { count: Math.min(10, data.count + 1) })}
              disabled={data.count >= 10}
              title="Mais"
            >+</button>
          </div>

          {/* Pílula de proporção (dropdown) */}
          <RatioControl value={data.ratio} onChange={(r: Ratio) => updateNodeData(id, { ratio: r })} />

          {/* Botão gerar (play num círculo) */}
          <button
            className={styles.genBtn}
            onClick={handleGenerate}
            disabled={!canGenerate}
            title="Gerar imagem"
          >
            {generating
              ? <span className={styles.spinnerSm} />
              : <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4" /></svg>}
          </button>
        </div>
      </div>

      <Handle type="source" position={Position.Right} id="gen-out" className={styles.handle} />
    </div>
  );
}
