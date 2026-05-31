import { useState } from 'react';
import styles from './PromptCard.module.css';
import type { Prompt, Section } from '../../lib/types';

interface PromptCardProps {
  prompt: Prompt;
  section?: Section;
  isFavorite: boolean;
  onFavorite: () => void;
  onCopy: () => void;
  onEdit: () => void;
  onClick: () => void;
  animationDelay?: number;
}

export function PromptCard({
  prompt,
  section,
  isFavorite,
  onFavorite,
  onCopy,
  onEdit,
  onClick,
  animationDelay = 0,
}: PromptCardProps) {
  const [copied, setCopied] = useState(false);

  function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    navigator.clipboard.writeText(prompt.prompt).then(() => {
      setCopied(true);
      onCopy();
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleEdit(e: React.MouseEvent) {
    e.stopPropagation();
    onEdit();
  }

  function handleFavorite(e: React.MouseEvent) {
    e.stopPropagation();
    onFavorite();
  }

  const peopleTags = prompt.tags?.filter(t => t.includes('pessoa')) ?? [];
  const otherTags = prompt.tags?.filter(t => !t.includes('pessoa')) ?? [];

  return (
    <div
      className={styles.card}
      style={{ animationDelay: `${animationDelay}ms` }}
      onClick={onClick}
    >
      {/* Imagem */}
      <div className={styles.media}>
        {prompt.image ? (
          <img src={prompt.image} alt={prompt.title} loading="lazy" />
        ) : (
          <div className={styles.mediaPlaceholder}>📷</div>
        )}

        {/* Favorito */}
        <button
          className={`${styles.favoriteBtn} ${isFavorite ? styles.active : ''}`}
          onClick={handleFavorite}
          title={isFavorite ? 'Remover favorito' : 'Favoritar'}
        >
          {isFavorite ? '❤️' : '🤍'}
        </button>

        {/* Cópias */}
        {(prompt.copies ?? 0) > 0 && (
          <div className={styles.copiesBadge}>
            ⎘ {prompt.copies}
          </div>
        )}
      </div>

      {/* Body */}
      <div className={styles.body}>
        <div className={styles.title}>{prompt.title}</div>

        <div className={styles.tags}>
          {section && (
            <span className={`${styles.tag} ${styles.red}`}>
              {section.icon} {section.name}
            </span>
          )}
          <span className={`${styles.tag} ${styles.blue}`}>{prompt.ratio}</span>
          <span className={`${styles.tag} ${styles.model}`}>{prompt.model}</span>
          {peopleTags.map(t => (
            <span key={t} className={styles.tag}>{t}</span>
          ))}
          {otherTags.slice(0, 2).map(t => (
            <span key={t} className={styles.tag}>{t}</span>
          ))}
        </div>

        <div className={styles.actions}>
          <button
            className={`${styles.copyBtn} ${copied ? styles.copied : ''}`}
            onClick={handleCopy}
          >
            {copied ? '✓ Copiado!' : '⎘ Copiar Prompt'}
          </button>
          <button className={styles.editBtn} onClick={handleEdit} title="Editar">
            ✎
          </button>
        </div>
      </div>
    </div>
  );
}
