import styles from './Form.module.css';

export { styles as formStyles };

interface FormGroupProps {
  label: string;
  children: React.ReactNode;
}
export function FormGroup({ label, children }: FormGroupProps) {
  return (
    <div className={styles.group}>
      <label className={styles.label}>{label}</label>
      {children}
    </div>
  );
}

export function FormRow({ children }: { children: React.ReactNode }) {
  return <div className={styles.row}>{children}</div>;
}
