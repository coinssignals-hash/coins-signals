import { useCallback } from 'react';

// Map routes to their lazy import functions
const routeImports: Record<string, () => Promise<unknown>> = {
  '/': () => import('@/pages/Analysis'),
  '/signals': () => import('@/pages/Signals'),
  '/news': () => import('@/pages/News'),
  '/courses': () => import('@/pages/Courses'),
  '/broker': () => import('@/pages/Broker'),
  '/settings': () => import('@/pages/Settings'),
  '/performance': () => import('@/pages/Performance'),
  '/referrals': () => import('@/pages/Referrals'),
  '/support': () => import('@/pages/Support'),
  '/subscriptions': () => import('@/pages/Subscriptions'),
  '/auth': () => import('@/pages/Auth'),
  '/install': () => import('@/pages/Install'),
  '/about': () => import('@/pages/About'),
  '/broker-rating': () => import('@/pages/BrokerRating'),
  '/monitoring': () => import('@/pages/Monitoring'),
};

// Cache to avoid prefetching the same route multiple times
const prefetchedRoutes = new Set<string>();

export function usePrefetch() {
  const prefetch = useCallback((href: string) => {
    // Skip if already prefetched or no import function exists
    if (prefetchedRoutes.has(href)) return;
    
    const importFn = routeImports[href];
    if (importFn) {
      prefetchedRoutes.add(href);
      // Use requestIdleCallback for non-blocking prefetch
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(() => importFn());
      } else {
        setTimeout(() => importFn(), 100);
      }
    }
  }, []);

  const onMouseEnter = useCallback((href: string) => () => prefetch(href), [prefetch]);
  const onTouchStart = useCallback((href: string) => () => prefetch(href), [prefetch]);

  return { prefetch, onMouseEnter, onTouchStart };
}
