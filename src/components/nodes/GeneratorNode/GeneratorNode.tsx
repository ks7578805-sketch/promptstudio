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

// Provedor + modelo fundidos num único dropdown (escolher um modelo define os dois)
const MODEL_OPTIONS: { model: AnyImageModel; provider: Provider }[] = [
  ...GEMINI_MODELS.map(m => ({ model: m as AnyImageModel, provider: 'google' as Provider })),
  ...OPENAI_MODELS.map(m => ({ model: m as AnyImageModel, provider: 'openai' as Provider })),
];

type GeneratorSpaceNode = Node<GeneratorNodeData, 'generator'>;

// O NÓ INTEIRO muda de forma pela proporção. Geometria fixando o LADO MAIOR
// (≈460px) e com LARGURA MÍNIMA (300px) pra a barra de controles nunca espremer.
// Não usa aspect-ratio em div de largura fixa — calcula w/h de verdade.
const LONG_SIDE = 460;
const MIN_WIDTH = 300;
const SQUARE = 380;

function nodeSize(ratio: string): { width: number; height: number } {
  const [w, h] = ratio.split(':').map(Number);
  if (!w || !h) return { width: SQUARE, height: SQUARE };
  if (w === h) return { width: SQUARE, height: SQUARE };

  let width: number;
  let height: number;
  if (w > h) {
    // paisagem: largura = lado maior
    width = LONG_SIDE;
    height = LONG_SIDE * (h / w);
  } else {
    // retrato: altura = lado maior
    height = LONG_SIDE;
    width = LONG_SIDE * (w / h);
  }
  // largura mínima → recalcula altura mantendo a proporção
  if (width < MIN_WIDTH) {
    width = MIN_WIDTH;
    height = MIN_WIDTH * (h / w);
  }
  return { width: Math.round(width), height: Math.round(height) };
}

export function GeneratorNode({ id, data, selected, positionAbsoluteX, positionAbsoluteY }: NodeProps<GeneratorSpaceNode>) {
  const { updateNodeData, getEdges, getNode, addNodes, addEdges, deleteElements } = useReactFlow();
  const allNodes = useNodes();
  const [status, setStatus] = useState<'idle' | 'generating' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [hovered, setHovered] = useState(false);

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

  const generating = status === 'generating';
  const canGenerate = !generating && !!data.prompt.trim();
  // O nó SEMPRE assume a forma da proporção (igual à referência Freepik/Magnific).
  const { width, height } = nodeSize(data.ratio);

  // Form (prompt + controles), sobreposto na base do preview
  const form = (
    <>
      {error && status === 'error' && <div className={styles.errorMsg}>{error}</div>}

      <textarea
        className={`${styles.textarea} nodrag nowheel`}
        placeholder="Descreva a imagem que você deseja gerar..."
        value={data.prompt}
        onChange={e => updateNodeData(id, { prompt: e.target.value })}
      />

      <div className={`${styles.controls} nodrag`}>
        {/* Quantidade */}
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

        {/* Modelo (provedor + modelo fundidos) */}
        <div className={`${styles.modelWrap} nodrag nowheel`}>
          <select
            className={styles.modelSelect}
            value={data.model}
            onChange={e => {
              const m = e.target.value as AnyImageModel;
              const opt = MODEL_OPTIONS.find(o => o.model === m);
              updateNodeData(id, { model: m, provider: opt?.provider ?? data.provider });
            }}
          >
            {MODEL_OPTIONS.map(o => (
              <option key={o.model} value={o.model}>{`${MODEL_LABELS[o.model]} (${PROVIDER_INFO[o.provider].name})`}</option>
            ))}
          </select>
        </div>

        {/* Proporção (pílula com ícone dinâmico) */}
        <RatioControl value={data.ratio} onChange={(r: Ratio) => updateNodeData(id, { ratio: r })} />

        {/* Opções (placeholder visual) */}
        <button className={styles.gearBtn} title="Opções">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        </button>

        {/* Gerar (play num círculo) */}
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
    </>
  );

  return (
    <div
      className={`${styles.node} ${generating ? styles.generating : ''} ${selected ? styles.selected : ''}`}
      style={{ width, height }}
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

      {/* Corpo: grande área escura de preview (flex:1); prompt + controles sobrepostos na base */}
      <div className={styles.body}>
        {generating ? (
          <div className={styles.previewLoading}><span className={styles.spinnerLg} /></div>
        ) : preview ? (
          <img src={preview} alt="resultado" className={styles.previewImg} draggable={false} />
        ) : null}
        <div className={styles.baseOverlay}>{form}</div>
      </div>

      <Handle type="source" position={Position.Right} id="gen-out" className={styles.handle} />
    </div>
  );
}
