import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

/** Favoritos por usuário, salvos em users/{uid}.favorites (sincroniza entre dispositivos) */
export function useFavorites(uid: string | null) {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!uid) { setFavorites(new Set()); return; }
    getDoc(doc(db, 'users', uid))
      .then(snap => {
        const favs = snap.exists() ? (snap.data().favorites as string[] | undefined) : undefined;
        setFavorites(new Set(favs ?? []));
      })
      .catch(console.error);
  }, [uid]);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      if (uid) {
        setDoc(doc(db, 'users', uid), { favorites: [...next] }, { merge: true }).catch(console.error);
      }
      return next;
    });
  }, [uid]);

  const isFavorite = useCallback((id: string) => favorites.has(id), [favorites]);

  return { favorites, toggleFavorite, isFavorite };
}
