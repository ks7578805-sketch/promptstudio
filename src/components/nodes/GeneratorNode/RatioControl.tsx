import { useState, useRef, useEffect } from 'react';
import type { Ratio } from '../../../lib/spacesTypes';
import styles from './RatioControl.module.css';

// Ordem exata pedida na tarefa
export const RATIOS: Ratio[] = ['1:1', '16:9', '9:16', '2:3', '3:4', '1:2', '2:1', '4:5', '3:2', '4:3'];

/** Ícone cuja FORMA reflete a orientação da proporção (quadrado, deitado, em pé...) */
export function RatioIcon({ ratio, size = 16 }: { ratio: string; size?: number }) {
  const [w, h] = ratio.split(':').map(Number);
  const max = Math.max(w, h);
  const pad = 2;
  const avail = size - pad * 2;
  const rw = (w / max) * avail;
  const rh = (h / max) * avail;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none" style={{ flexShrink: 0 }}>
      <rect
        x={(size - rw) / 2}
        y={(size - rh) / 2}
        width={rw}
        height={rh}
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}

interface Props {
  value: Ratio;
  onChange: (r: Ratio) => void;
}

/** Pílula que abre um dropdown com as 10 proporções; texto + ícone refletem a escolha */
export function RatioControl({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  return (
    <div className={`${styles.wrap} nodrag nowheel`} ref={ref}>
      <button type="button" className={styles.pill} onClick={() => setOpen(o => !o)} title="Proporção">
        <RatioIcon ratio={value} size={13} />
        <span className={styles.pillText}>{value}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className={styles.menu}>
          {RATIOS.map(r => (
            <button
              key={r}
              type="button"
              className={`${styles.item} ${r === value ? styles.active : ''}`}
              onClick={() => { onChange(r); setOpen(false); }}
            >
              <RatioIcon ratio={r} size={16} />
              <span>{r}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
