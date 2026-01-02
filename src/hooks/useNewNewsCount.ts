import { useState, useEffect, useCallback } from 'react';
import { newsApi } from '@/services/newsApi';

const LAST_SEEN_KEY = 'news_last_seen_timestamp';

export function useNewNewsCount() {
  const [newCount, setNewCount] = useState(0);

  const getLastSeenTimestamp = useCallback(() => {
    const stored = localStorage.getItem(LAST_SEEN_KEY);
    return stored ? new Date(stored) : new Date(0);
  }, []);

  const markAsSeen = useCallback(() => {
    localStorage.setItem(LAST_SEEN_KEY, new Date().toISOString());
    setNewCount(0);
  }, []);

  const fetchNewNewsCount = useCallback(async () => {
    const lastSeen = getLastSeenTimestamp();
    
    try {
      // Get today's news
      const todayNews = await newsApi.getNewsByDate(new Date());
      
      // Count news published after last seen
      const newNews = todayNews.filter(item => {
        const publishedAt = new Date(item.published_at);
        return publishedAt > lastSeen;
      });
      
      setNewCount(newNews.length);
    } catch (err) {
      console.error('Error fetching new news count:', err);
    }
  }, [getLastSeenTimestamp]);

  useEffect(() => {
    fetchNewNewsCount();
    
    // Refresh count every 5 minutes
    const interval = setInterval(fetchNewNewsCount, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [fetchNewNewsCount]);

  return { newCount, markAsSeen };
}
