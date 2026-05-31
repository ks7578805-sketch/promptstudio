import styles from './PromptCard.module.css';
import type { Prompt, Section } from '../../lib/types';

interface PromptCardProps {
  prompt: Prompt;
  section?: Section;
  isFavorite: boolean;
  onFavorite: () => void;
  onCopy: () => void;
  onClick: () => void;
  animationDelay?: number;
}

export function PromptCard({
  prompt,
  isFavorite,
  onFavorite,
  onCopy,
  onClick,
  animationDelay = 0,
}: PromptCardProps) {
  function handleFavorite(e: React.MouseEvent) {
    e.stopPropagation();
    onFavorite();
  }

  function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    // Apenas abre o modal — o copy de verdade acontece lá dentro
    onCopy();
  }

  const subtitle = prompt.prompt
    ? `{ "prompt": "${prompt.prompt.slice(0, 32)}${prompt.prompt.length > 32 ? '...' : ''}" }`
    : '';

  return (
    <div
      className={styles.card}
      style={{ animationDelay: `${animationDelay}ms` }}
      onClick={onClick}
    >
      <div className={styles.media}>
        {prompt.image ? (
          <img src={prompt.image} alt={prompt.title} loading="lazy" />
        ) : (
          <div className={styles.mediaPlaceholder}>📷</div>
        )}

        <button
          className={`${styles.favoriteBtn} ${isFavorite ? styles.active : ''}`}
          onClick={handleFavorite}
          aria-label={isFavorite ? 'Remover favorito' : 'Favoritar'}
        />

        <button
          className={styles.copyOverlay}
          onClick={handleCopy}
        >
          ⎘ Copiar
        </button>

        {(prompt.copies ?? 0) > 0 && (
          <div className={styles.copiesBadge}>
            ⎘ {prompt.copies}
          </div>
        )}
      </div>

      <div className={styles.body}>
        <div className={styles.title}>{prompt.title}</div>
        {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
      </div>
    </div>
  );
}
