import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  writeBatch,
  increment,
  updateDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ensureUserSeeded } from '../lib/seedLibrary';
import type { Prompt, Section } from '../lib/types';

/** Dados de prompts/seções, isolados por usuário em users/{uid}/... */
export function usePrompts(uid: string | null) {
  const [sections, setSections] = useState<Section[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sectionsCol = useCallback(() => collection(db, 'users', uid!, 'sections'), [uid]);
  const promptsCol = useCallback(() => collection(db, 'users', uid!, 'prompts'), [uid]);
  const sectionDoc = useCallback((id: string) => doc(db, 'users', uid!, 'sections', id), [uid]);
  const promptDoc = useCallback((id: string) => doc(db, 'users', uid!, 'prompts', id), [uid]);

  const loadData = useCallback(async () => {
    if (!uid) return;
    try {
      setLoading(true);
      setError(null);

      // Garante que a biblioteca curada foi copiada para a conta no 1º login.
      // Pode levar alguns segundos (copia todas as imagens) — sinaliza com `seeding`.
      setSeeding(true);
      try {
        await ensureUserSeeded(uid);
      } finally {
        setSeeding(false);
      }

      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Sem conexão — verifique sua internet e tente novamente.')), 30000)
      );

      const [sectionsSnap, promptsSnap] = await Promise.race([
        Promise.all([
          getDocs(query(sectionsCol(), orderBy('order', 'asc'))),
          getDocs(promptsCol()),
        ]),
        timeout,
      ]);

      const loadedSections = sectionsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Section));
      const loadedPrompts = promptsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Prompt));

      loadedPrompts.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));

      setSections(loadedSections);
      setPrompts(loadedPrompts);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar dados.';
      setError(msg);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [uid, sectionsCol, promptsCol]);

  useEffect(() => {
    if (uid) loadData();
    else { setSections([]); setPrompts([]); setLoading(false); }
  }, [uid, loadData]);

  async function savePrompt(prompt: Prompt) {
    if (!uid) return;
    const { id, ...rawData } = prompt;
    const data = Object.fromEntries(
      Object.entries(rawData).filter(([, v]) => v !== undefined)
    );

    await setDoc(promptDoc(id), { ...data, updatedAt: Date.now() });

    setPrompts(prev => {
      const exists = prev.findIndex(p => p.id === id);
      if (exists >= 0) {
        return prev.map(p => p.id === id ? { ...p, ...data, updatedAt: Date.now() } as Prompt : p);
      }
      return [{ id, ...data, updatedAt: Date.now() } as Prompt, ...prev];
    });
  }

  async function deletePrompt(id: string) {
    if (!uid) return;
    await deleteDoc(promptDoc(id));
    setPrompts(prev => prev.filter(p => p.id !== id));
  }

  async function saveSection(section: Section) {
    if (!uid) return;
    const { id, ...data } = section;
    await setDoc(sectionDoc(id), data);
    setSections(prev => {
      const exists = prev.findIndex(s => s.id === id);
      if (exists >= 0) return prev.map(s => s.id === id ? { id, ...data } : s);
      return [...prev, { id, ...data }];
    });
  }

  async function deleteSection(id: string) {
    if (!uid) return;
    await deleteDoc(sectionDoc(id));
    setSections(prev => prev.filter(s => s.id !== id));
  }

  async function reorderPrompts(newPrompts: Prompt[]) {
    if (!uid) return;
    const batch = writeBatch(db);
    newPrompts.forEach((p, i) => {
      batch.update(promptDoc(p.id), { order: i });
    });
    await batch.commit();
    setPrompts(newPrompts);
  }

  async function reorderSections(newSections: Section[]) {
    if (!uid) return;
    const batch = writeBatch(db);
    newSections.forEach((s, i) => {
      batch.update(sectionDoc(s.id), { order: i });
    });
    await batch.commit();
    setSections(newSections);
  }

  async function incrementCopies(id: string) {
    if (!uid) return;
    setPrompts(prev => prev.map(p => p.id === id ? { ...p, copies: (p.copies ?? 0) + 1 } : p));
    updateDoc(promptDoc(id), { copies: increment(1) }).catch(console.error);
  }

  return {
    sections,
    prompts,
    loading,
    seeding,
    error,
    savePrompt,
    deletePrompt,
    saveSection,
    deleteSection,
    reorderPrompts,
    reorderSections,
    incrementCopies,
    reload: loadData,
  };
}
