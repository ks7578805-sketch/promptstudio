import styles from './BottomNav.module.css';

export type NavView = 'library' | 'history' | 'generate' | 'admin' | 'profile' | 'spaces';

interface BottomNavProps {
  active: NavView;
  onChange: (v: NavView) => void;
  historyBadge?: number;
  hasActiveGeneration?: boolean;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export function BottomNav({ active, onChange, historyBadge = 0, hasActiveGeneration = false, theme, onToggleTheme }: BottomNavProps) {
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
        className={`${styles.item} ${active === 'spaces' ? styles.active : ''}`}
        onClick={() => onChange('spaces')}
        aria-label="Spaces"
      >
        <span className={styles.icon}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
          </svg>
        </span>
        <span className={styles.label}>Spaces</span>
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

      {onToggleTheme && (
        <button
          className={styles.item}
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
        >
          <span className={styles.icon}>{theme === 'dark' ? '☀️' : '🌙'}</span>
          <span className={styles.label}>{theme === 'dark' ? 'Claro' : 'Escuro'}</span>
        </button>
      )}

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
