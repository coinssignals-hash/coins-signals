import { useCallback, useEffect } from 'react';
import { RealNewsItem } from './useRealNews';

const CACHE_KEY = 'visited_news_cache';
const MAX_CACHED_NEWS = 50; // Maximum news items to keep in cache
const CACHE_EXPIRY_DAYS = 7; // News older than this will be removed

interface CachedNewsItem extends RealNewsItem {
  cached_at: string;
}

interface NewsCache {
  items: CachedNewsItem[];
  lastCleanup: string;
}

function getCache(): NewsCache {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (error) {
    console.error('[NewsCache] Error reading cache:', error);
  }
  return { items: [], lastCleanup: new Date().toISOString() };
}

function saveCache(cache: NewsCache): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('[NewsCache] Error saving cache:', error);
    // If storage is full, clear old items and try again
    try {
      cache.items = cache.items.slice(0, MAX_CACHED_NEWS / 2);
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch {
      // Last resort: clear the cache
      localStorage.removeItem(CACHE_KEY);
    }
  }
}

function cleanupExpiredNews(cache: NewsCache): NewsCache {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() - CACHE_EXPIRY_DAYS);
  
  const validItems = cache.items.filter(item => {
    const cachedAt = new Date(item.cached_at);
    return cachedAt > expiryDate;
  });
  
  return {
    items: validItems,
    lastCleanup: new Date().toISOString()
  };
}

export function useNewsCache() {
  // Cleanup on mount (once per day)
  useEffect(() => {
    const cache = getCache();
    const lastCleanup = new Date(cache.lastCleanup);
    const now = new Date();
    const hoursSinceCleanup = (now.getTime() - lastCleanup.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceCleanup >= 24) {
      const cleanedCache = cleanupExpiredNews(cache);
      saveCache(cleanedCache);
    }
  }, []);

  // Save a news item to cache
  const cacheNews = useCallback((newsItem: RealNewsItem) => {
    const cache = getCache();
    
    // Check if already cached
    const existingIndex = cache.items.findIndex(item => item.id === newsItem.id);
    
    if (existingIndex >= 0) {
      // Update the existing item with fresh data
      cache.items[existingIndex] = {
        ...newsItem,
        cached_at: new Date().toISOString()
      };
    } else {
      // Add new item at the beginning
      cache.items.unshift({
        ...newsItem,
        cached_at: new Date().toISOString()
      });
      
      // Keep only the most recent items
      if (cache.items.length > MAX_CACHED_NEWS) {
        cache.items = cache.items.slice(0, MAX_CACHED_NEWS);
      }
    }
    
    saveCache(cache);
  }, []);

  // Get a cached news item by ID
  const getCachedNews = useCallback((newsId: string): RealNewsItem | null => {
    const cache = getCache();
    const cachedItem = cache.items.find(item => item.id === newsId);
    
    if (cachedItem) {
      // Check if not expired
      const cachedAt = new Date(cachedItem.cached_at);
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() - CACHE_EXPIRY_DAYS);
      
      if (cachedAt > expiryDate) {
        // Return without the cached_at field
        const { cached_at, ...newsItem } = cachedItem;
        return newsItem;
      }
    }
    
    return null;
  }, []);

  // Get all cached news
  const getAllCachedNews = useCallback((): RealNewsItem[] => {
    const cache = getCache();
    return cache.items.map(({ cached_at, ...item }) => item);
  }, []);

  // Clear the cache
  const clearCache = useCallback(() => {
    localStorage.removeItem(CACHE_KEY);
  }, []);

  return {
    cacheNews,
    getCachedNews,
    getAllCachedNews,
    clearCache
  };
}
