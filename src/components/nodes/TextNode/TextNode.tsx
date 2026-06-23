import { useCallback } from 'react';
import { Handle, Position, type NodeProps, type Node, useReactFlow } from '@xyflow/react';
import type { TextNodeData } from '../../../lib/spacesTypes';
import styles from './TextNode.module.css';

type TextSpaceNode = Node<TextNodeData, 'text'>;

export function TextNode({ id, data }: NodeProps<TextSpaceNode>) {
  const { updateNodeData } = useReactFlow();

  const onChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateNodeData(id, { content: e.target.value });
  }, [id, updateNodeData]);

  return (
    <div className={styles.node}>
      <div className={styles.header}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/>
        </svg>
        Texto
      </div>
      <textarea
        className={`${styles.textarea} nodrag nowheel`}
        value={data.content}
        onChange={onChange}
        placeholder="Escreva algo..."
        rows={4}
      />
      <Handle type="source" position={Position.Right} id="text-out" className={styles.handle} />
    </div>
  );
}
