import styles from './Skeleton.module.css';

export function SkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className={styles.grid}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={styles.card}>
          <div className={styles.media} />
          <div className={styles.body}>
            <div className={`${styles.line} ${styles.title}`} />
            <div className={styles.line} />
            <div className={styles.tagsRow}>
              <div className={styles.tag} />
              <div className={styles.tag} />
              <div className={styles.tag} />
            </div>
            <div className={styles.btn} />
          </div>
        </div>
      ))}
    </div>
  );
}
