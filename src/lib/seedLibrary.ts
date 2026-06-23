import { collection, getDocs, doc, getDoc, setDoc, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import type { Prompt, Section } from './types';

export interface SeedResult {
  seeded: boolean;
  sections: Section[];
  prompts: Prompt[];
}

// Deduplica chamadas concorrentes (ex.: StrictMode dispara o efeito 2x) —
// garante um único seed por uid e que toda leitura espere o mesmo término.
const inFlight = new Map<string, Promise<SeedResult>>();

export function ensureUserSeeded(uid: string): Promise<SeedResult> {
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
 *
 * Retorna os dados que acabou de copiar — assim quem chama usa direto em vez
 * de reler a subcoleção (evita a race de read-after-write do cache local).
 */
async function seedOnce(uid: string): Promise<SeedResult> {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists() && userSnap.data().seeded) {
    return { seeded: false, sections: [], prompts: [] };
  }

  const [secSnap, promptSnap] = await Promise.all([
    getDocs(collection(db, 'sections')),
    getDocs(collection(db, 'prompts')),
  ]);

  const sections = secSnap.docs.map(d => ({ id: d.id, ...d.data() } as Section));
  const prompts = promptSnap.docs.map(d => ({ id: d.id, ...d.data() } as Prompt));

  // writeBatch tem limite de 500 operações — agrupa em lotes
  const ops: { ref: ReturnType<typeof doc>; data: Record<string, unknown> }[] = [];
  sections.forEach(s => { const { id, ...data } = s; ops.push({ ref: doc(db, 'users', uid, 'sections', id), data }); });
  prompts.forEach(p => { const { id, ...data } = p; ops.push({ ref: doc(db, 'users', uid, 'prompts', id), data }); });

  for (let i = 0; i < ops.length; i += 450) {
    const batch = writeBatch(db);
    ops.slice(i, i + 450).forEach(op => batch.set(op.ref, op.data));
    await batch.commit();
  }

  await setDoc(userRef, { seeded: true, seededAt: Date.now() }, { merge: true });
  return { seeded: true, sections, prompts };
}
