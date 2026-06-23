import { useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  type User,
} from 'firebase/auth';
import { auth } from '../lib/firebase';

const googleProvider = new GoogleAuthProvider();

/** Estado de autenticação reativo — null = deslogado, loading enquanto resolve a sessão inicial */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  return { user, loading };
}

// ── Ações de auth (funções puras, não hooks) ────────────────────────────────

export async function signUpEmail(email: string, password: string, name: string): Promise<User> {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (name.trim()) await updateProfile(cred.user, { displayName: name.trim() });
  return cred.user;
}

export async function signInEmail(email: string, password: string): Promise<User> {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function signInGoogle(): Promise<User> {
  const cred = await signInWithPopup(auth, googleProvider);
  return cred.user;
}

export async function logout(): Promise<void> {
  await signOut(auth);
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

/** Traduz códigos de erro do Firebase Auth para mensagens em pt-BR */
export function authErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code ?? '';
  switch (code) {
    case 'auth/invalid-email': return 'Email inválido.';
    case 'auth/user-disabled': return 'Esta conta foi desativada.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential': return 'Email ou senha incorretos.';
    case 'auth/email-already-in-use': return 'Este email já está cadastrado.';
    case 'auth/weak-password': return 'A senha deve ter no mínimo 6 caracteres.';
    case 'auth/too-many-requests': return 'Muitas tentativas. Tente novamente em alguns minutos.';
    case 'auth/popup-closed-by-user': return 'Login cancelado.';
    case 'auth/popup-blocked': return 'O popup foi bloqueado pelo navegador.';
    case 'auth/network-request-failed': return 'Sem conexão. Verifique sua internet.';
    case 'auth/configuration-not-found':
      return 'Login não configurado no Firebase. Habilite os provedores no Console.';
    default: return 'Algo deu errado. Tente novamente.';
  }
}
