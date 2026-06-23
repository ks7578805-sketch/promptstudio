import { useState, useRef, useEffect, type ReactNode } from 'react';
import styles from './ContextMenu.module.css';

export type NodeAction = 'text' | 'generator' | 'upload';

interface MenuEntry {
  key: string;
  label: string;
  icon: ReactNode;
  action?: NodeAction; // sem action = visual (feature ainda não disponível)
}

const ic = (path: ReactNode) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{path}</svg>
);

const BASICS: MenuEntry[] = [
  { key: 'text', label: 'Text', action: 'text', icon: ic(<><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></>) },
  { key: 'image-generator', label: 'Image Generator', action: 'generator', icon: ic(<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>) },
  { key: 'video-generator', label: 'Video Generator', icon: ic(<><rect x="2" y="6" width="14" height="12" rx="2"/><path d="m22 8-6 4 6 4V8z"/></>) },
  { key: 'assistant', label: 'Assistant', icon: ic(<><path d="M12 8V4H8"/><rect x="4" y="8" width="16" height="12" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></>) },
  { key: 'image-upscaler', label: 'Image Upscaler', icon: ic(<><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/></>) },
  { key: 'list', label: 'List', icon: ic(<><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></>) },
];

const MEDIA: MenuEntry[] = [
  { key: 'upload', label: 'Upload', action: 'upload', icon: ic(<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>) },
  { key: 'assets', label: 'Assets', icon: ic(<><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></>) },
  { key: 'stock', label: 'Stock', icon: ic(<><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></>) },
];

const CATEGORIES = [
  ic(<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>),
  ic(<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>),
  ic(<><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></>),
  ic(<><rect x="2" y="6" width="14" height="12" rx="2"/><path d="m22 8-6 4 6 4V8z"/></>),
  ic(<><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></>),
];

interface Props {
  x: number;
  y: number;
  onClose: () => void;
  onCreate: (action: NodeAction) => void;
}

export function ContextMenu({ x, y, onClose, onCreate }: Props) {
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const match = (e: MenuEntry) => e.label.toLowerCase().includes(query.trim().toLowerCase());
  const basics = BASICS.filter(match);
  const media = MEDIA.filter(match);

  const pick = (e: MenuEntry) => { if (e.action) onCreate(e.action); };

  // primeiro item funcional filtrado (para Enter)
  const firstActionable = [...basics, ...media].find(e => e.action);

  const renderItem = (e: MenuEntry) => (
    <button
      key={e.key}
      type="button"
      className={`${styles.item} ${e.action ? '' : styles.disabled}`}
      disabled={!e.action}
      onClick={() => pick(e)}
    >
      <span className={styles.itemIcon}>{e.icon}</span>
      <span className={styles.itemLabel}>{e.label}</span>
    </button>
  );

  return (
    <div
      ref={ref}
      className={styles.menu}
      style={{ left: x, top: y }}
      onKeyDown={e => {
        if (e.key === 'Escape') onClose();
        if (e.key === 'Enter' && firstActionable) pick(firstActionable);
      }}
    >
      {/* Busca */}
      <div className={styles.searchRow}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input
          ref={inputRef}
          className={styles.search}
          placeholder="Buscar nós..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

      {/* Ícones-categoria */}
      <div className={styles.categories}>
        {CATEGORIES.map((c, i) => (
          <button key={i} type="button" className={`${styles.cat} ${i === 0 ? styles.catActive : ''}`}>{c}</button>
        ))}
      </div>

      <div className={styles.scroll}>
        {basics.length > 0 && (
          <>
            <div className={styles.sectionLabel}>BASICS</div>
            {basics.map(renderItem)}
          </>
        )}
        {media.length > 0 && (
          <>
            <div className={styles.sectionLabel}>MEDIA</div>
            {media.map(renderItem)}
          </>
        )}
        {basics.length === 0 && media.length === 0 && (
          <div className={styles.empty}>Nada encontrado</div>
        )}
      </div>

      {/* Rodapé de atalhos */}
      <div className={styles.footer}>
        <span><kbd className={styles.kbd}>↵</kbd> Open</span>
        <span><kbd className={styles.kbd}>↑↓</kbd> Navigate</span>
        <span><kbd className={styles.kbd}>esc</kbd> Insert</span>
      </div>
    </div>
  );
}
