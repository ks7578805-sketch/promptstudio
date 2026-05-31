import styles from './BottomNav.module.css';

export type NavView = 'library' | 'history' | 'generate' | 'admin' | 'profile';

interface BottomNavProps {
  active: NavView;
  onChange: (v: NavView) => void;
  historyBadge?: number;
  hasActiveGeneration?: boolean;
}

export function BottomNav({ active, onChange, historyBadge = 0, hasActiveGeneration = false }: BottomNavProps) {
  return (
    <nav className={styles.nav}>
      <button
        className={`${styles.item} ${active === 'library' ? styles.active : ''}`}
        onClick={() => onChange('library')}
        aria-label="Biblioteca"
      >
        <span className={styles.icon}>📚</span>
        <span className={styles.label}>Biblioteca</span>
      </button>

      <button
        className={`${styles.item} ${active === 'history' ? styles.active : ''} ${hasActiveGeneration ? styles.hasActiveJob : ''}`}
        onClick={() => onChange('history')}
        aria-label="Histórico"
      >
        <span className={styles.icon}>🕐</span>
        <span className={styles.label}>Histórico</span>
        {historyBadge > 0 && (
          <span className={styles.badge}>{historyBadge > 99 ? '99+' : historyBadge}</span>
        )}
      </button>

      <button
        className={styles.centerItem}
        onClick={() => onChange('generate')}
        aria-label="Gerar imagem"
      >
        <span className={styles.centerBtn}>✦</span>
        <span className={styles.centerLabel}>Gerar</span>
      </button>

      <button
        className={`${styles.item} ${active === 'admin' ? styles.active : ''}`}
        onClick={() => onChange('admin')}
        aria-label="Admin"
      >
        <span className={styles.icon}>⚙</span>
        <span className={styles.label}>Admin</span>
      </button>

      <button
        className={`${styles.item} ${active === 'profile' ? styles.active : ''}`}
        onClick={() => onChange('profile')}
        aria-label="Perfil"
      >
        <span className={styles.icon}>👤</span>
        <span className={styles.label}>Perfil</span>
      </button>
    </nav>
  );
}
