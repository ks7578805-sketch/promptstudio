import { useCallback, useState, type CSSProperties } from 'react';
import { Handle, Position, type NodeProps, type Node, useReactFlow } from '@xyflow/react';
import type { ImageNodeData } from '../../../lib/spacesTypes';
import { NodeHoverToolbar } from '../NodeHoverToolbar';
import { PixelGenEffect } from '../PixelGenEffect/PixelGenEffect';
import styles from './ImageNode.module.css';

type ImageSpaceNode = Node<ImageNodeData, 'image'>;

// Estilo do quadro vazio durante a geração: já nasce no formato (ratio) certo.
function genWrapStyle(ratio?: string): CSSProperties | undefined {
  if (!ratio) return undefined;
  const [w, h] = ratio.split(':').map(Number);
  if (!w || !h) return undefined;
  return { width: 240, aspectRatio: `${w} / ${h}`, minHeight: 0 };
}

export function ImageNode({ id, data, selected, positionAbsoluteX, positionAbsoluteY }: NodeProps<ImageSpaceNode>) {
  const { addNodes } = useReactFlow();
  const [hovered, setHovered] = useState(false);

  const duplicate = useCallback(() => {
    addNodes([{
      id: `image_${Date.now()}`,
      type: 'image' as const,
      position: { x: positionAbsoluteX + 40, y: positionAbsoluteY + 40 },
      data: { ...data },
    }]);
  }, [addNodes, data, positionAbsoluteX, positionAbsoluteY]);

  // Quadro ainda gerando (criado imediatamente, sem imagem ainda).
  const isGenerating = !data.url && data.status === 'generating';
  const isError = !data.url && data.status === 'error';

  return (
    <div className={styles.node} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <NodeHoverToolbar nodeId={id} visible={hovered || !!selected} onDuplicate={data.url ? duplicate : undefined} />

      <Handle type="target" position={Position.Left} id="img-in" className={styles.handle} />
      <div className={styles.imgWrap} style={isGenerating || isError ? genWrapStyle(data.ratio) : undefined}>
        {data.url ? (
          <>
            <img src={data.url} alt={data.label ?? 'imagem'} className={`${styles.img} ${styles.imgReveal}`} draggable={false} />
            {/* grip de drag interno: arrasta a imagem pro canvas e duplica (sem re-upload).
                fica num canto pra não atrapalhar o arrastar-pra-mover o nó. */}
            <div
              className={`${styles.dragGrip} nodrag`}
              title="Arraste para duplicar"
              draggable
              onDragStart={e => {
                e.dataTransfer.setData('application/x-image-url', data.url);
                e.dataTransfer.effectAllowed = 'copy';
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="6" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="9" cy="12" r="1"/>
                <circle cx="15" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="18" r="1"/>
              </svg>
            </div>
          </>
        ) : isGenerating ? (
          <div className={styles.genFill}>
            <PixelGenEffect />
            <span className={styles.genLabel}>Gerando…</span>
          </div>
        ) : isError ? (
          <div className={styles.errorFill}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>Falhou</span>
          </div>
        ) : (
          <div className={styles.placeholder}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
            </svg>
          </div>
        )}
      </div>
      {data.label && <div className={styles.label}>{data.label}</div>}
      <Handle type="source" position={Position.Right} id="img-out" className={styles.handle} />
    </div>
  );
}
