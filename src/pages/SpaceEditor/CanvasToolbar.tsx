import { type ReactNode } from 'react';
import styles from './CanvasToolbar.module.css';

export type Tool = 'select' | 'pan';

interface Props {
  tool: Tool;
  onToolChange: (t: Tool) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const ic = (path: ReactNode, sw = 2) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">{path}</svg>
);

/** Barra vertical fixa na lateral esquerda do canvas.
 *  Funcionais: selecionar, mão (pan), desfazer, refazer.
 *  Visuais (sem função ainda): adicionar (+), cortar, forma, comentário, configurações. */
export function CanvasToolbar({ tool, onToolChange, onUndo, onRedo, canUndo, canRedo }: Props) {
  return (
    <div className={styles.bar}>
      {/* Adicionar — visual */}
      <button className={styles.btn} title="Adicionar (em breve)">
        {ic(<><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>)}
      </button>

      <div className={styles.sep} />

      {/* Selecionar — ativo por padrão */}
      <button
        className={`${styles.btn} ${tool === 'select' ? styles.active : ''}`}
        title="Selecionar"
        onClick={() => onToolChange('select')}
      >
        {ic(<path d="M3 3l7.5 18 2.5-7.5L20.5 11z" />)}
      </button>

      {/* Mão (pan) */}
      <button
        className={`${styles.btn} ${tool === 'pan' ? styles.active : ''}`}
        title="Mão (navegar)"
        onClick={() => onToolChange('pan')}
      >
        {ic(<><path d="M18 11V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2" /><path d="M14 10V4a2 2 0 0 0-2-2 2 2 0 0 0-2 2v2" /><path d="M10 10.5V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v8" /><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L9 15" /></>)}
      </button>

      {/* Cortar — visual */}
      <button className={styles.btn} title="Cortar (em breve)">
        {ic(<><circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><line x1="20" y1="4" x2="8.12" y2="15.88" /><line x1="14.47" y1="14.48" x2="20" y2="20" /><line x1="8.12" y1="8.12" x2="12" y2="12" /></>)}
      </button>

      {/* Forma — visual */}
      <button className={styles.btn} title="Forma (em breve)">
        {ic(<rect x="4" y="4" width="16" height="16" rx="2" />)}
      </button>

      {/* Comentário — visual */}
      <button className={styles.btn} title="Comentário (em breve)">
        {ic(<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />)}
      </button>

      <div className={styles.sep} />

      {/* Desfazer */}
      <button className={styles.btn} title="Desfazer" onClick={onUndo} disabled={!canUndo}>
        {ic(<><path d="M3 7v6h6" /><path d="M3 13a9 9 0 1 0 3-7.7L3 8" /></>)}
      </button>

      {/* Refazer */}
      <button className={styles.btn} title="Refazer" onClick={onRedo} disabled={!canRedo}>
        {ic(<><path d="M21 7v6h-6" /><path d="M21 13a9 9 0 1 1-3-7.7L21 8" /></>)}
      </button>

      <div className={styles.sep} />

      {/* Configurações — visual */}
      <button className={styles.btn} title="Configurações (em breve)">
        {ic(<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></>)}
      </button>
    </div>
  );
}
