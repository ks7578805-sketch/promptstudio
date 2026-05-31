import styles from './Header.module.css';

interface HeaderProps {
  title: string;
  titleHighlight?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onMenuToggle: () => void;
  onNewPrompt: () => void;
}

export function Header({
  title,
  titleHighlight,
  searchValue,
  onSearchChange,
  onMenuToggle,
  onNewPrompt,
}: HeaderProps) {
  return (
    <header className={styles.header}>
      <button className={styles.menuBtn} onClick={onMenuToggle} aria-label="Menu">
        ☰
      </button>

      <div className={styles.title}>
        {title} {titleHighlight && <span>{titleHighlight}</span>}
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

      <button className={styles.addBtn} onClick={onNewPrompt}>
        <span>+</span>
        <span>Adicionar</span>
      </button>
    </header>
  );
}
