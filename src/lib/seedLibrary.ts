import { collection, getDocs, doc, getDoc, setDoc, writeBatch } from 'firebase/firestore';
import { db } from './firebase';

// Deduplica chamadas concorrentes (ex.: StrictMode dispara o efeito 2x) —
// garante um único seed por uid e que toda leitura espere o mesmo término.
const inFlight = new Map<string, Promise<boolean>>();

export function ensureUserSeeded(uid: string): Promise<boolean> {
  let p = inFlight.get(uid);
  if (!p) {
    p = seedOnce(uid).finally(() => inFlight.delete(uid));
    inFlight.set(uid, p);
  }
  return p;
}

/**
 * Na primeira vez que um usuário entra, copia a biblioteca global curada
 * (coleções `sections` e `prompts`) para a subcoleção dele em `users/{uid}`.
 * Idempotente: marca `seeded: true` no doc do usuário para nunca duplicar.
 * Retorna true se algo foi semeado.
 */
async function seedOnce(uid: string): Promise<boolean> {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists() && userSnap.data().seeded) return false;

  const [secSnap, promptSnap] = await Promise.all([
    getDocs(collection(db, 'sections')),
    getDocs(collection(db, 'prompts')),
  ]);

  // writeBatch tem limite de 500 operações — agrupa em lotes
  const ops: { ref: ReturnType<typeof doc>; data: Record<string, unknown> }[] = [];
  secSnap.forEach(s => ops.push({ ref: doc(db, 'users', uid, 'sections', s.id), data: s.data() }));
  promptSnap.forEach(p => ops.push({ ref: doc(db, 'users', uid, 'prompts', p.id), data: p.data() }));

  for (let i = 0; i < ops.length; i += 450) {
    const batch = writeBatch(db);
    ops.slice(i, i + 450).forEach(op => batch.set(op.ref, op.data));
    await batch.commit();
  }

  await setDoc(userRef, { seeded: true, seededAt: Date.now() }, { merge: true });
  return ops.length > 0;
}
