import styles from './Header.module.css';
import { Logo } from '../Logo/Logo';

interface HeaderProps {
  title: string;
  titleHighlight?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onMenuToggle: () => void;
  onNewPrompt: () => void;
  onHistory?: () => void;
  historyActiveCount?: number;
  historyTotalCount?: number;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export function Header({
  title,
  titleHighlight,
  searchValue,
  onSearchChange,
  onNewPrompt,
  theme,
  onToggleTheme,
}: HeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.logoCenter}>
        <Logo />
      </div>

      <div className={styles.title}>
        {title} {titleHighlight && <span>{titleHighlight}</span>}
        {onToggleTheme && (
          <button
            className={styles.themeBtn}
            onClick={onToggleTheme}
            aria-label="Alternar tema"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        )}
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

      <button className={styles.addBtn} onClick={onNewPrompt} aria-label="Adicionar">
        <span>+</span>
        <span>Adicionar</span>
      </button>
    </header>
  );
}
