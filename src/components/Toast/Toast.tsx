import { useRef, useState, useCallback } from 'react';
import styles from './Toast.module.css';

interface ToastState {
  message: string;
  type: 'success' | 'error';
  visible: boolean;
}

export function useToast() {
  const [toast, setToast] = useState<ToastState>({ message: '', type: 'success', visible: false });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ message, type, visible: true });
    timerRef.current = setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 2800);
  }, []);

  return { toast, showToast };
}

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  visible: boolean;
}

export function Toast({ message, type, visible }: ToastProps) {
  if (!visible) return null;
  return (
    <div className={`${styles.toast} ${styles[type]}`}>
      {type === 'success' ? '✓' : '!'} {message}
    </div>
  );
}
