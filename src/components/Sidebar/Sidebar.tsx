import { Logo } from '../Logo/Logo';
import styles from './Sidebar.module.css';
import type { Section } from '../../lib/types';

interface SidebarProps {
  sections: Section[];
  prompts: { sectionId: string }[];
  activeSectionId: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectSection: (id: string) => void;
  onNewPrompt: () => void;
  onAdmin: () => void;
  isAdminActive: boolean;
}

export function Sidebar({
  sections,
  prompts,
  activeSectionId,
  isOpen,
  onClose,
  onSelectSection,
  onNewPrompt,
  onAdmin,
  isAdminActive,
}: SidebarProps) {
  const totalPrompts = prompts.length;

  return (
    <>
      {isOpen && <div className={styles.overlay} onClick={onClose} />}
      <nav className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
        <div className={styles.header}>
          <Logo />
        </div>

        <div className={styles.nav}>
          <div className={styles.navLabel}>Biblioteca</div>
          <button
            className={`${styles.navItem} ${activeSectionId === 'all' && !isAdminActive ? styles.active : ''}`}
            onClick={() => { onSelectSection('all'); onClose(); }}
          >
            <span className={styles.icon}>◈</span>
            Todos os Prompts
            <span className={styles.count}>{totalPrompts}</span>
          </button>

          <div className={styles.divider} />
          <div className={styles.navLabel}>Seções</div>

          {sections.map(section => {
            const count = prompts.filter(p => p.sectionId === section.id).length;
            return (
              <button
                key={section.id}
                className={`${styles.navItem} ${activeSectionId === section.id && !isAdminActive ? styles.active : ''}`}
                onClick={() => { onSelectSection(section.id); onClose(); }}
              >
                <span className={styles.icon}>{section.icon}</span>
                {section.name}
                <span className={styles.count}>{count}</span>
              </button>
            );
          })}

          <div className={styles.divider} />
          <div className={styles.navLabel}>Gerenciar</div>
          <button
            className={`${styles.navItem} ${isAdminActive ? styles.active : ''}`}
            onClick={() => { onAdmin(); onClose(); }}
          >
            <span className={styles.icon}>⚙</span>
            Painel Admin
          </button>
        </div>

        <div className={styles.footer}>
          <button className={styles.newBtn} onClick={() => { onNewPrompt(); onClose(); }}>
            + Novo Prompt
          </button>
        </div>
      </nav>
    </>
  );
}
