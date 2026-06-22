import styles from './ProfilePage.module.css';

interface ProfilePageProps {
  totalPrompts: number;
  totalGenerated: number;
}

export function ProfilePage({ totalPrompts, totalGenerated }: ProfilePageProps) {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.avatar}>👤</div>
        <div>
          <div className={styles.name}>Convidado</div>
          <div className={styles.subtitle}>Login em breve</div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Sua atividade</div>
        <div className={styles.row}>
          <span className={styles.rowIcon}>📚</span>
          <div className={styles.rowContent}>
            <div className={styles.rowTitle}>Prompts na biblioteca</div>
            <div className={styles.rowDesc}>{totalPrompts} prompts disponíveis</div>
          </div>
        </div>
        <div className={styles.row}>
          <span className={styles.rowIcon}>✦</span>
          <div className={styles.rowContent}>
            <div className={styles.rowTitle}>Imagens geradas</div>
            <div className={styles.rowDesc}>{totalGenerated} {totalGenerated === 1 ? 'geração' : 'gerações'} no histórico</div>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Sobre</div>
        <button className={styles.row} onClick={() => {}}>
          <span className={styles.rowIcon}>✦</span>
          <div className={styles.rowContent}>
            <div className={styles.rowTitle}>PromptStudio</div>
            <div className={styles.rowDesc}>v1.0 · Biblioteca de prompts + IA</div>
          </div>
          <span className={styles.rowArrow}>›</span>
        </button>
      </div>

      <div className={styles.softNote}>
        Em breve: <span>login</span>, favoritos sincronizados e contas
      </div>
    </div>
  );
}
