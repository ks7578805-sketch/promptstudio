import styles from './MobileSearch.module.css';

interface MobileSearchProps {
  value: string;
  onChange: (v: string) => void;
}

export function MobileSearch({ value, onChange }: MobileSearchProps) {
  return (
    <div className={styles.wrap}>
      <div className={styles.search}>
        <span className={styles.icon}>⌕</span>
        <input
          className={styles.input}
          type="text"
          placeholder="Buscar prompts..."
          value={value}
          onChange={e => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}
