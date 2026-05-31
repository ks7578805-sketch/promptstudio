import { useState, useEffect } from 'react';
import styles from './HistoryPage.module.css';
import { ImageLightbox } from '../../components/ImageLightbox/ImageLightbox';
import type { GenerationJob } from '../../lib/types';
import { MODEL_LABELS, PROVIDER_INFO } from '../../lib/types';

interface HistoryPageProps {
  jobs: GenerationJob[];
  onRemoveJob: (id: string) => void;
  onClearDone: () => void;
  onClearAll: () => void;
}

function downloadImage(dataUrl: string, filename: string) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function downloadAll(job: GenerationJob) {
  job.results.forEach((img, i) => {
    setTimeout(() => {
      const safeName = job.promptTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      downloadImage(img, `${safeName}_${i + 1}.jpg`);
    }, i * 200);
  });
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  });
}

function formatElapsed(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

interface LightboxState {
  open: boolean;
  job?: GenerationJob;
  index: number;
}

export function HistoryPage({ jobs, onRemoveJob, onClearDone, onClearAll }: HistoryPageProps) {
  const [lightbox, setLightbox] = useState<LightboxState>({ open: false, index: 0 });
  const [now, setNow] = useState(Date.now());

  // Tick a cada segundo enquanto tiver job ativo
  useEffect(() => {
    const hasActive = jobs.some(j => j.status === 'pending' || j.status === 'generating');
    if (!hasActive) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [jobs]);

  function openLightbox(job: GenerationJob, index: number) {
    setLightbox({ open: true, job, index });
  }

  function closeLightbox() {
    setLightbox(prev => ({ ...prev, open: false }));
  }

  function navigateLightbox(newIndex: number) {
    setLightbox(prev => ({ ...prev, index: newIndex }));
  }

  function lightboxDownload(idx: number) {
    if (!lightbox.job) return;
    const safeName = lightbox.job.promptTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    downloadImage(lightbox.job.results[idx], `${safeName}_${idx + 1}.jpg`);
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.title}>
          Histórico de <span>Gerações</span>
        </div>
        {jobs.length > 0 && (
          <div className={styles.actions}>
            <button className={styles.actionBtn} onClick={onClearDone}>
              Limpar finalizados
            </button>
            <button className={`${styles.actionBtn} ${styles.danger}`} onClick={() => {
              if (confirm('Limpar todo o histórico?')) onClearAll();
            }}>
              ✕ Limpar tudo
            </button>
          </div>
        )}
      </div>

      {jobs.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>✦</div>
          <div className={styles.emptyText}>Nenhuma geração ainda</div>
          <div className={styles.emptySub}>
            Vá em qualquer prompt e clique em "Gerar Imagem"
          </div>
        </div>
      ) : (
        <div className={styles.jobList}>
          {jobs.map(job => {
            const isActive = job.status === 'pending' || job.status === 'generating';
            const elapsed = isActive ? Math.floor((now - job.createdAt) / 1000) : 0;

            return (
              <div key={job.id} className={styles.job}>
                <div className={styles.jobHeader}>
                  <div className={styles.jobTitle}>{job.promptTitle}</div>
                  <div className={`${styles.jobStatus} ${styles[job.status]}`}>
                    {job.status === 'pending' && '⏳ Aguardando'}
                    {job.status === 'generating' && (
                      <>
                        ⏳ Gerando...
                        <span className={styles.elapsed}>{formatElapsed(elapsed)}</span>
                      </>
                    )}
                    {job.status === 'done' && '✓ Pronto'}
                    {job.status === 'error' && '✕ Erro'}
                  </div>
                </div>

                <div className={styles.jobMeta}>
                  {(PROVIDER_INFO[job.provider] ?? PROVIDER_INFO.google).icon} {(PROVIDER_INFO[job.provider] ?? PROVIDER_INFO.google).name} • {MODEL_LABELS[job.model] ?? job.model} • {job.resolution} • {job.count} {job.count === 1 ? 'imagem' : 'imagens'} • {formatDate(job.createdAt)}
                </div>

                {job.error && (
                  <div className={styles.jobError}>{job.error}</div>
                )}

                {isActive && (
                  <div className={styles.imagesGrid}>
                    {Array.from({ length: job.count }).map((_, i) => (
                      <div key={i} className={`${styles.imageCard} ${styles.loading}`} />
                    ))}
                  </div>
                )}

                {job.status === 'done' && job.results.length > 0 && (
                  <div className={styles.imagesGrid}>
                    {job.results.map((img, i) => (
                      <div
                        key={i}
                        className={styles.imageCard}
                        onClick={() => openLightbox(job, i)}
                      >
                        <img src={img} alt={`Gerada ${i + 1}`} />
                        <div className={styles.viewOverlay}>👁 Visualizar</div>
                      </div>
                    ))}
                  </div>
                )}

                <div className={styles.jobActions}>
                  <button className={styles.smallBtn} onClick={() => onRemoveJob(job.id)}>
                    ✕ Remover
                  </button>
                  {job.status === 'done' && job.results.length > 1 && (
                    <button
                      className={`${styles.smallBtn} ${styles.primary}`}
                      onClick={() => downloadAll(job)}
                    >
                      ⬇ Baixar todas
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ImageLightbox
        isOpen={lightbox.open && !!lightbox.job}
        images={lightbox.job?.results ?? []}
        index={lightbox.index}
        title={lightbox.job?.promptTitle}
        onClose={closeLightbox}
        onNavigate={navigateLightbox}
        onDownload={lightboxDownload}
      />
    </div>
  );
}
