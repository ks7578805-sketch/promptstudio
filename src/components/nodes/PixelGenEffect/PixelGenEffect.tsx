import { useEffect, useRef } from 'react';
import styles from './PixelGenEffect.module.css';

/**
 * Efeito de "imagem sendo construída do zero" — uma malha de pixels que se
 * revelam em varredura diagonal e cintilam, com acentos vermelhos da paleta.
 * Preenche o container (position: absolute, inset: 0), então respeita a
 * proporção do quadro automaticamente. Substitui o spinner de loading.
 *
 * Sem props de tamanho: o pai define a forma (ratio). Respeita
 * prefers-reduced-motion desenhando um único quadro estático.
 */
export function PixelGenEffect({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Offset aleatório por instância para os quadros não cintilarem em sincronia.
  const seedRef = useRef(Math.random() * 1000);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    // consts não-nulas → a narrowing sobrevive dentro das funções aninhadas
    const canvas = cv;
    const g = ctx;

    const CELL = 14; // tamanho do "pixel" em px de tela
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const offset = seedRef.current;
    let raf = 0;
    let running = true;

    function resize() {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(r.width * dpr));
      canvas.height = Math.max(1, Math.round(r.height * dpr));
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    const ro = new ResizeObserver(() => resize());
    ro.observe(canvas);
    resize();

    function draw(t: number) {
      const r = canvas.getBoundingClientRect();
      const w = r.width;
      const h = r.height;
      g.clearRect(0, 0, w, h);
      const cols = Math.max(1, Math.ceil(w / CELL));
      const rows = Math.max(1, Math.ceil(h / CELL));
      // posição da varredura diagonal (0 → 1.4, em loop)
      const phase = ((t * 0.018 + offset) % 1.4);

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          // ruído pseudo-aleatório estável por célula
          const s = Math.sin((x + 1) * 12.9898 + (y + 1) * 78.233 + offset) * 43758.5453;
          const rnd = s - Math.floor(s);
          // progresso da revelação diagonal
          const diag = (x / cols + y / rows) / 2;
          const reveal = Math.max(0, Math.min(1, (phase - diag) * 3));
          // cintilação por célula
          const tw = 0.5 + 0.5 * Math.sin(t * 0.07 + rnd * 6.283 + offset);
          const a = reveal * (0.12 + 0.55 * tw * rnd);
          if (a <= 0.02) continue;
          const accent = rnd > 0.86;
          g.fillStyle = accent
            ? `rgba(229, 57, 53, ${a})`
            : `rgba(220, 222, 230, ${a * 0.7})`;
          g.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2);
        }
      }
    }

    if (reduce) {
      // sem animação: um quadro estático já revelado
      draw(70);
      return () => { running = false; ro.disconnect(); };
    }

    let t = 0;
    function frame() {
      if (!running) return;
      t += 1;
      draw(t);
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className={`${styles.canvas} ${className ?? ''}`} aria-hidden />;
}
