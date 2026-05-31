import { useState, useEffect } from 'react';

const STORAGE_KEY = 'promptstudio-favorites';

export function useFavorites() {
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return new Set(raw ? JSON.parse(raw) : []);
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...favorites]));
  }, [favorites]);

  function toggleFavorite(id: string) {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function isFavorite(id: string) {
    return favorites.has(id);
  }

  return { favorites, toggleFavorite, isFavorite };
}
