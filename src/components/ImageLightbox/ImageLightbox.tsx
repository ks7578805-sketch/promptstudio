import { useEffect } from 'react';
import styles from './ImageLightbox.module.css';

interface ImageLightboxProps {
  isOpen: boolean;
  images: string[];
  index: number;
  title?: string;
  onClose: () => void;
  onNavigate: (newIndex: number) => void;
  onDownload: (index: number) => void;
}

export function ImageLightbox({
  isOpen, images, index, title,
  onClose, onNavigate, onDownload,
}: ImageLightboxProps) {

  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && index > 0) onNavigate(index - 1);
      if (e.key === 'ArrowRight' && index < images.length - 1) onNavigate(index + 1);
    }
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, index, images.length, onClose, onNavigate]);

  if (!isOpen) return null;

  const current = images[index];
  const hasPrev = index > 0;
  const hasNext = index < images.length - 1;

  return (
    <div className={styles.overlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.topBar}>
        <div className={styles.title}>{title ?? 'Visualizar imagem'}</div>
        <div className={styles.counter}>{index + 1} / {images.length}</div>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Fechar">×</button>
      </div>

      <div className={styles.body}>
        {hasPrev && (
          <button
            className={`${styles.navBtn} ${styles.prev}`}
            onClick={() => onNavigate(index - 1)}
            aria-label="Anterior"
          >
            ‹
          </button>
        )}

        <img className={styles.image} src={current} alt={title ?? `Imagem ${index + 1}`} />

        {hasNext && (
          <button
            className={`${styles.navBtn} ${styles.next}`}
            onClick={() => onNavigate(index + 1)}
            aria-label="Próxima"
          >
            ›
          </button>
        )}
      </div>

      <div className={styles.bottomBar}>
        <button className={styles.downloadBtn} onClick={() => onDownload(index)}>
          ⬇ Baixar esta imagem
        </button>
      </div>
    </div>
  );
}
