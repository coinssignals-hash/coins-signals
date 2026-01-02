import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { Currency } from '@/types/news';

const STORAGE_KEY = 'favorite_currencies';

export function useFavoriteCurrencies() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Currency[]>([]);

  // Load favorites from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setFavorites(JSON.parse(stored));
      } catch {
        setFavorites([]);
      }
    }
  }, []);

  // Save to localStorage whenever favorites change
  const saveFavorites = useCallback((newFavorites: Currency[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newFavorites));
    setFavorites(newFavorites);
  }, []);

  const addFavorite = useCallback((currency: Currency) => {
    if (!favorites.includes(currency)) {
      saveFavorites([...favorites, currency]);
    }
  }, [favorites, saveFavorites]);

  const removeFavorite = useCallback((currency: Currency) => {
    saveFavorites(favorites.filter(c => c !== currency));
  }, [favorites, saveFavorites]);

  const toggleFavorite = useCallback((currency: Currency) => {
    if (favorites.includes(currency)) {
      removeFavorite(currency);
    } else {
      addFavorite(currency);
    }
  }, [favorites, addFavorite, removeFavorite]);

  const isFavorite = useCallback((currency: Currency) => {
    return favorites.includes(currency);
  }, [favorites]);

  return {
    favorites,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
  };
}
