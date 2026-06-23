import { useState, useCallback } from 'react';
import { Logo } from '../../components/Logo/Logo';
import { signUpEmail, signInEmail, signInGoogle, resetPassword, authErrorMessage } from '../../hooks/useAuth';
import styles from './AuthScreen.module.css';

type Mode = 'login' | 'signup';

export function AuthScreen() {
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reset = useCallback(() => { setError(null); setInfo(null); }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    reset();
    if (!email.trim() || !password) {
      setError('Preencha email e senha.');
      return;
    }
    setBusy(true);
    try {
      if (mode === 'signup') {
        await signUpEmail(email, password, name);
      } else {
        await signInEmail(email, password);
      }
      // onAuthStateChanged em App.tsx assume daqui
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }, [mode, name, email, password, reset]);

  const handleGoogle = useCallback(async () => {
    reset();
    setBusy(true);
    try {
      await signInGoogle();
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }, [reset]);

  const handleReset = useCallback(async () => {
    reset();
    if (!email.trim()) {
      setError('Digite seu email para recuperar a senha.');
      return;
    }
    setBusy(true);
    try {
      await resetPassword(email);
      setInfo('Enviamos um link de recuperação para seu email.');
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }, [email, reset]);

  return (
    <div className={styles.screen}>
      <div className={styles.card}>
        <div className={styles.logoWrap}>
          <Logo size={40} />
        </div>

        <h1 className={styles.title}>
          {mode === 'login' ? 'Entrar' : 'Criar conta'}
        </h1>
        <p className={styles.subtitle}>
          {mode === 'login'
            ? 'Acesse sua biblioteca e seus spaces'
            : 'Sua biblioteca de prompts e canvas, só sua'}
        </p>

        <button type="button" className={styles.googleBtn} onClick={handleGoogle} disabled={busy}>
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.46 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
          </svg>
          Continuar com Google
        </button>

        <div className={styles.divider}><span>ou</span></div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {mode === 'signup' && (
            <input
              className={styles.input}
              type="text"
              placeholder="Nome"
              value={name}
              onChange={e => setName(e.target.value)}
              autoComplete="name"
            />
          )}
          <input
            className={styles.input}
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          <input
            className={styles.input}
            type="password"
            placeholder="Senha"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            required
          />

          {error && <div className={styles.error}>{error}</div>}
          {info && <div className={styles.info}>{info}</div>}

          <button type="submit" className={styles.submit} disabled={busy}>
            {busy ? 'Aguarde…' : mode === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>

        {mode === 'login' && (
          <button type="button" className={styles.linkBtn} onClick={handleReset} disabled={busy}>
            Esqueci minha senha
          </button>
        )}

        <div className={styles.switch}>
          {mode === 'login' ? (
            <>Não tem conta?{' '}
              <button type="button" onClick={() => { setMode('signup'); reset(); }}>Criar conta</button>
            </>
          ) : (
            <>Já tem conta?{' '}
              <button type="button" onClick={() => { setMode('login'); reset(); }}>Entrar</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
