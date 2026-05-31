import styles from './StatsBar.module.css';

interface StatsBarProps {
  totalPrompts: number;
  totalSections: number;
  copiedToday: number;
}

export function StatsBar({ totalPrompts, totalSections, copiedToday }: StatsBarProps) {
  return (
    <div className={styles.bar}>
      <div className={styles.card}>
        <div className={styles.label}>Total de Prompts</div>
        <div className={styles.value}>{totalPrompts}</div>
      </div>
      <div className={styles.card}>
        <div className={styles.label}>Seções</div>
        <div className={styles.value}>{totalSections}</div>
      </div>
      <div className={styles.card}>
        <div className={styles.label}>Copiados hoje</div>
        <div className={styles.value}>{copiedToday}</div>
      </div>
    </div>
  );
}
