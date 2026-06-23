import { NodeToolbar, Position, useReactFlow } from '@xyflow/react';
import styles from './NodeHoverToolbar.module.css';

interface Props {
  nodeId: string;
  visible: boolean;
  onDuplicate?: () => void;
}

/** Toolbar de hover (duplicar + excluir) usada pelos nós simples (texto, imagem).
 *  Excluir usa deleteElements → remove o nó e as arestas conectadas, mesmo com
 *  a textarea focada (resolve "não consigo apagar o nó"). */
export function NodeHoverToolbar({ nodeId, visible, onDuplicate }: Props) {
  const { deleteElements } = useReactFlow();

  return (
    <NodeToolbar isVisible={visible} position={Position.Top} offset={8} className={styles.toolbar}>
      {onDuplicate && (
        <button className={styles.btn} onClick={onDuplicate} title="Duplicar">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        </button>
      )}
      <button
        className={`${styles.btn} ${styles.danger}`}
        onClick={() => deleteElements({ nodes: [{ id: nodeId }] })}
        title="Excluir"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
      </button>
    </NodeToolbar>
  );
}
