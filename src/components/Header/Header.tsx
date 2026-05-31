import styles from './Header.module.css';
import { Logo } from '../Logo/Logo';

interface HeaderProps {
  title: string;
  titleHighlight?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onMenuToggle: () => void;
  onNewPrompt: () => void;
  onHistory: () => void;
  historyActiveCount: number;
  historyTotalCount: number;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export function Header({
  title,
  titleHighlight,
  searchValue,
  onSearchChange,
  onMenuToggle,
  onNewPrompt,
  onHistory,
  historyActiveCount,
  historyTotalCount,
  theme,
  onToggleTheme,
}: HeaderProps) {
  const hasActive = historyActiveCount > 0;
  const showBadge = historyTotalCount > 0;

  return (
    <header className={styles.header}>
      <button className={styles.menuBtn} onClick={onMenuToggle} aria-label="Menu">
        ☰
      </button>

      <div className={styles.title}>
        {title} {titleHighlight && <span>{titleHighlight}</span>}
      </div>

      <div className={styles.logoCenter}>
        <Logo />
      </div>

      <div className={styles.search}>
        <span className={styles.searchIcon}>⌕</span>
        <input
          className={styles.searchInput}
          type="text"
          placeholder="Buscar prompts..."
          value={searchValue}
          onChange={e => onSearchChange(e.target.value)}
        />
      </div>

      <button
        className={styles.themeBtn}
        onClick={onToggleTheme}
        aria-label="Alternar tema"
        title={theme === 'light' ? 'Modo escuro' : 'Modo claro'}
      >
        {theme === 'light' ? '🌙' : '☀'}
      </button>

      <button
        className={`${styles.historyBtn} ${hasActive ? styles.hasActive : ''}`}
        onClick={onHistory}
        aria-label="Histórico"
        title="Histórico de gerações"
      >
        {hasActive ? '⏳' : '✦'}
        {showBadge && (
          <span className={styles.historyBadge}>
            {historyTotalCount}
          </span>
        )}
      </button>

      <button className={styles.addBtn} onClick={onNewPrompt} aria-label="Adicionar">
        <span>+</span>
        <span>Adicionar</span>
      </button>
    </header>
  );
}
