import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import type { ImageNodeData } from '../../../lib/spacesTypes';
import styles from './ImageNode.module.css';

type ImageSpaceNode = Node<ImageNodeData, 'image'>;

export function ImageNode({ data }: NodeProps<ImageSpaceNode>) {
  return (
    <div className={styles.node}>
      <Handle type="target" position={Position.Left} id="img-in" className={styles.handle} />
      <div className={styles.imgWrap}>
        {data.url ? (
          <>
            <img src={data.url} alt={data.label ?? 'imagem'} className={styles.img} draggable={false} />
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
