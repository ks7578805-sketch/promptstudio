import { useEffect, useRef, type ReactNode } from 'react';
import styles from './NodeMenu.module.css';

export type NodeMenuAction = 'start' | 'add' | 'duplicate' | 'delete';

interface Props {
  x: number;
  y: number;
  /** true só pra nós que sabem gerar (generator). Iniciar/Adicionar criação ficam desabilitados nos demais. */
  canGenerate: boolean;
  onAction: (action: NodeMenuAction) => void;
  onClose: () => void;
}

const ic = (path: ReactNode) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{path}</svg>
);

export function NodeMenu({ x, y, canGenerate, onAction, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  // Fecha ao clicar fora ou apertar Esc
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  // Mantém o menu dentro da tela (clamp simples nas bordas direita/inferior)
  const left = Math.min(x, window.innerWidth - 230);
  const top = Math.min(y, window.innerHeight - 230);

  return (
    <div ref={ref} className={styles.menu} style={{ left, top }}>
      <button
        type="button"
        className={styles.item}
        disabled={!canGenerate}
        onClick={() => onAction('start')}
      >
        <span className={styles.icon}>{ic(<polygon points="6 4 20 12 6 20 6 4" />)}</span>
        <span className={styles.label}>Iniciar</span>
      </button>

      <button
        type="button"
        className={styles.item}
        disabled={!canGenerate}
        onClick={() => onAction('add')}
      >
        <span className={styles.icon}>{ic(<><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>)}</span>
        <span className={styles.label}>Adicionar criação</span>
      </button>

      {/* Opções — placeholder visual com submenu (sem função por enquanto) */}
      <button type="button" className={`${styles.item} ${styles.disabled}`} disabled>
        <span className={styles.icon}>{ic(<><line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="18" x2="20" y2="18" /></>)}</span>
        <span className={styles.label}>Opções</span>
        <span className={styles.chevron}>{ic(<polyline points="9 6 15 12 9 18" />)}</span>
      </button>

      <div className={styles.sep} />

      <button type="button" className={styles.item} onClick={() => onAction('duplicate')}>
        <span className={styles.icon}>{ic(<><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></>)}</span>
        <span className={styles.label}>Duplicar</span>
        <span className={styles.shortcut}>⌘D</span>
      </button>

      <button type="button" className={`${styles.item} ${styles.danger}`} onClick={() => onAction('delete')}>
        <span className={styles.icon}>{ic(<><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></>)}</span>
        <span className={styles.label}>Excluir</span>
        <span className={styles.shortcut}>⌫</span>
      </button>
    </div>
  );
}
