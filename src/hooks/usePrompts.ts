import { useState, useEffect } from 'react';
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
import type { Prompt, Section } from '../lib/types';

export function usePrompts() {
  const [sections, setSections] = useState<Section[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);

      const [sectionsSnap, promptsSnap] = await Promise.all([
        getDocs(query(collection(db, 'sections'), orderBy('order', 'asc'))),
        getDocs(collection(db, 'prompts')),
      ]);

      const loadedSections = sectionsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Section));
      const loadedPrompts = promptsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Prompt));

      // Ordenar prompts por updatedAt desc
      loadedPrompts.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));

      setSections(loadedSections);
      setPrompts(loadedPrompts);
    } catch (err) {
      setError('Erro ao carregar dados.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function savePrompt(prompt: Prompt) {
    const { id, ...data } = prompt;
    await setDoc(doc(db, 'prompts', id), { ...data, updatedAt: Date.now() });
    setPrompts(prev => {
      const exists = prev.findIndex(p => p.id === id);
      if (exists >= 0) {
        return prev.map(p => p.id === id ? { ...p, ...data, updatedAt: Date.now() } : p);
      }
      return [{ id, ...data, updatedAt: Date.now() }, ...prev];
    });
  }

  async function deletePrompt(id: string) {
    await deleteDoc(doc(db, 'prompts', id));
    setPrompts(prev => prev.filter(p => p.id !== id));
  }

  async function saveSection(section: Section) {
    const { id, ...data } = section;
    await setDoc(doc(db, 'sections', id), data);
    setSections(prev => {
      const exists = prev.findIndex(s => s.id === id);
      if (exists >= 0) return prev.map(s => s.id === id ? { id, ...data } : s);
      return [...prev, { id, ...data }];
    });
  }

  async function deleteSection(id: string) {
    await deleteDoc(doc(db, 'sections', id));
    setSections(prev => prev.filter(s => s.id !== id));
  }

  async function reorderPrompts(newPrompts: Prompt[]) {
    const batch = writeBatch(db);
    newPrompts.forEach((p, i) => {
      batch.update(doc(db, 'prompts', p.id), { order: i });
    });
    await batch.commit();
    setPrompts(newPrompts);
  }

  async function reorderSections(newSections: Section[]) {
    const batch = writeBatch(db);
    newSections.forEach((s, i) => {
      batch.update(doc(db, 'sections', s.id), { order: i });
    });
    await batch.commit();
    setSections(newSections);
  }

  async function incrementCopies(id: string) {
    // Otimista: atualiza UI imediatamente
    setPrompts(prev => prev.map(p => p.id === id ? { ...p, copies: (p.copies ?? 0) + 1 } : p));
    // Persiste no Firestore em background
    updateDoc(doc(db, 'prompts', id), { copies: increment(1) }).catch(console.error);
  }

  return {
    sections,
    prompts,
    loading,
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
