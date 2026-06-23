import styles from './ProfilePage.module.css';

interface ProfilePageProps {
  name: string;
  email: string | null;
  totalPrompts: number;
  totalGenerated: number;
  onLogout: () => void;
}

export function ProfilePage({ name, email, totalPrompts, totalGenerated, onLogout }: ProfilePageProps) {
  const initial = (name?.trim()?.[0] ?? '👤').toUpperCase();
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.avatar}>{initial}</div>
        <div>
          <div className={styles.name}>{name}</div>
          <div className={styles.subtitle}>{email ?? 'Conta conectada'}</div>
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

      <button className={styles.logoutBtn} onClick={onLogout}>
        Sair da conta
      </button>
    </div>
  );
}
