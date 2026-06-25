import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import type { Ratio } from '../../../lib/spacesTypes';
import styles from './RatioControl.module.css';

// Ordem exata pedida na tarefa
export const RATIOS: Ratio[] = ['1:1', '16:9', '9:16', '2:3', '3:4', '1:2', '2:1', '4:5', '3:2', '4:3'];

const MENU_WIDTH = 168;
const MENU_HEIGHT = 180; // ~5 linhas (10 ratios em 2 colunas) — usado pra decidir cima/baixo

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

/** Pílula que abre um dropdown com as 10 proporções; texto + ícone refletem a escolha.
 *  O menu é renderizado num PORTAL pra escapar do `overflow:hidden` do nó (senão é cortado). */
export function RatioControl({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top?: number; bottom?: number } | null>(null);

  // Abre PRA BAIXO da pílula por padrão; só inverte pra cima se não houver espaço
  // abaixo (perto da borda inferior da tela). getBoundingClientRect já considera o
  // zoom do canvas; clamp na borda direita evita vazar pra fora.
  useLayoutEffect(() => {
    if (!open || !btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    const left = Math.max(8, Math.min(r.left, window.innerWidth - MENU_WIDTH - 8));
    const spaceBelow = window.innerHeight - r.bottom;
    if (spaceBelow >= MENU_HEIGHT + 8) {
      setPos({ left, top: r.bottom + 6 });                       // pra baixo (padrão)
    } else {
      setPos({ left, bottom: window.innerHeight - r.top + 6 });  // inverte pra cima
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  return (
    <div className={`${styles.wrap} nodrag nowheel`}>
      <button ref={btnRef} type="button" className={styles.pill} onClick={() => setOpen(o => !o)} title="Proporção">
        <RatioIcon ratio={value} size={11} />
        <span className={styles.pillText}>{value}</span>
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && pos && createPortal(
        <div
          ref={menuRef}
          className={`${styles.menu} nodrag nowheel`}
          style={{ left: pos.left, top: pos.top, bottom: pos.bottom, width: MENU_WIDTH }}
        >
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
        </div>,
        document.body,
      )}
    </div>
  );
}
