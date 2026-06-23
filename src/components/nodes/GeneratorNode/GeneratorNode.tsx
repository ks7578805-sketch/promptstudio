import { useState, useCallback } from 'react';
import {
  Handle, Position, type NodeProps, type Node,
  useReactFlow,
} from '@xyflow/react';
import { ref as storageRef, uploadString, getDownloadURL } from 'firebase/storage';
import { storage } from '../../../lib/firebase';
import { generateImagesForSpace } from '../../../lib/generateImage';
import type { GeneratorNodeData, ImageNodeData, SpaceNode } from '../../../lib/spacesTypes';
import { MODEL_LABELS, PROVIDER_INFO } from '../../../lib/types';
import type { Provider, AnyImageModel, GeminiModel, OpenAIModel } from '../../../lib/types';
import styles from './GeneratorNode.module.css';

const GEMINI_MODELS: GeminiModel[] = ['gemini-2.5-flash-image', 'gemini-3.1-flash-image', 'gemini-3-pro-image'];
const OPENAI_MODELS: OpenAIModel[] = ['gpt-image-1-mini', 'gpt-image-1.5', 'gpt-image-2'];
const RATIOS = ['1:1', '9:16', '16:9', '4:5'] as const;

type GeneratorSpaceNode = Node<GeneratorNodeData, 'generator'>;

export function GeneratorNode({ id, data, positionAbsoluteX, positionAbsoluteY }: NodeProps<GeneratorSpaceNode>) {
  const { updateNodeData, getEdges, getNode, addNodes, addEdges } = useReactFlow();
  const [status, setStatus] = useState<'idle' | 'generating' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    if (status === 'generating' || !data.prompt.trim()) return;
    setStatus('generating');
    setError(null);

    try {
      // Collect reference images from connected ImageNodes
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

      // Upload each result to Storage and create ImageNodes
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
          position: { x: positionAbsoluteX + 420, y: startY + i * spacing },
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
      setStatus('idle');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(msg);
      setStatus('error');
    }
  }, [status, data, id, positionAbsoluteX, positionAbsoluteY, getEdges, getNode, addNodes, addEdges]);

  const providerModels = data.provider === 'google' ? GEMINI_MODELS : OPENAI_MODELS;

  return (
    <div className={`${styles.node} ${status === 'generating' ? styles.generating : ''}`}>
      <Handle type="target" position={Position.Left} id="ref-in" className={styles.handle} />

      {/* Header */}
      <div className={styles.header}>
        <span className={styles.headerIcon}>{PROVIDER_INFO[data.provider].icon}</span>
        <span className={styles.headerLabel}>Gerador</span>
        {status === 'generating' && <span className={styles.spinner} />}
      </div>

      {/* Provider selector */}
      <div className={`${styles.row} nodrag`}>
        {(['google', 'openai'] as Provider[]).map(p => (
          <button
            key={p}
            className={`${styles.provBtn} ${data.provider === p ? styles.provActive : ''}`}
            onClick={() => {
              const firstModel = p === 'google' ? GEMINI_MODELS[0] : OPENAI_MODELS[0];
              updateNodeData(id, { provider: p, model: firstModel });
            }}
          >
            {PROVIDER_INFO[p].icon} {PROVIDER_INFO[p].name}
          </button>
        ))}
      </div>

      {/* Model */}
      <div className="nodrag nowheel">
        <select
          className={styles.select}
          value={data.model}
          onChange={e => updateNodeData(id, { model: e.target.value as AnyImageModel })}
        >
          {providerModels.map(m => (
            <option key={m} value={m}>{MODEL_LABELS[m]}</option>
          ))}
        </select>
      </div>

      {/* Prompt */}
      <div className="nodrag nowheel">
        <textarea
          className={styles.textarea}
          placeholder="Descreva a imagem..."
          value={data.prompt}
          onChange={e => updateNodeData(id, { prompt: e.target.value })}
          rows={4}
        />
      </div>

      {/* Ratio + Count */}
      <div className={`${styles.controls} nodrag`}>
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>Proporção</label>
          <select
            className={styles.selectSm}
            value={data.ratio}
            onChange={e => updateNodeData(id, { ratio: e.target.value })}
          >
            {RATIOS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>Quantidade</label>
          <input
            type="number"
            className={styles.numberInput}
            value={data.count}
            min={1}
            max={10}
            onChange={e => updateNodeData(id, { count: Math.max(1, Math.min(10, Number(e.target.value))) })}
          />
        </div>
      </div>

      {/* Error */}
      {status === 'error' && error && (
        <div className={styles.errorMsg}>{error}</div>
      )}

      {/* Generate button */}
      <div className="nodrag">
        <button
          className={`${styles.genBtn} ${status === 'generating' ? styles.genBtnLoading : ''}`}
          onClick={handleGenerate}
          disabled={status === 'generating' || !data.prompt.trim()}
        >
          {status === 'generating' ? (
            'Gerando...'
          ) : (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
              Gerar
            </>
          )}
        </button>
      </div>

      <Handle type="source" position={Position.Right} id="gen-out" className={styles.handle} />
    </div>
  );
}
