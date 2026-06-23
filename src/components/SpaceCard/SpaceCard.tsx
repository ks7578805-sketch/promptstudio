import styles from './SpaceCard.module.css';
import type { Space } from '../../lib/spacesTypes';

interface Props {
  space: Space;
  onClick: () => void;
  onDelete: () => void;
}

function relativeTime(ts: number) {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `${min}m atrás`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h atrás`;
  return `${Math.floor(h / 24)}d atrás`;
}

export function SpaceCard({ space, onClick, onDelete }: Props) {
  return (
    <div className={styles.card} onClick={onClick}>
      <div className={styles.thumb}>
        {space.thumbnail ? (
          <img src={space.thumbnail} alt={space.name} className={styles.thumbImg} draggable={false} />
        ) : (
          <div className={styles.thumbEmpty}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
          </div>
        )}
      </div>
      <div className={styles.info}>
        <span className={styles.name}>{space.name}</span>
        <span className={styles.date}>{relativeTime(space.updatedAt)}</span>
      </div>
      <button
        className={styles.deleteBtn}
        onClick={e => { e.stopPropagation(); onDelete(); }}
        title="Excluir space"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
          <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
        </svg>
      </button>
    </div>
  );
}
