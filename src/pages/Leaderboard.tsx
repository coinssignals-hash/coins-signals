import { useState, useRef, useEffect } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { Header } from '@/components/layout/Header';
import { ToolPageHeader } from '@/components/tools/ToolCard';
import { useTranslation } from '@/i18n/LanguageContext';
import { Crown } from 'lucide-react';
import { useLeaderboard, LeaderboardPeriod, LeaderboardCategory } from '@/hooks/useLeaderboard';
import { LeaderboardFilters } from '@/components/leaderboard/LeaderboardFilters';
import { LeaderboardPodium } from '@/components/leaderboard/LeaderboardPodium';
import { LeaderboardList } from '@/components/leaderboard/LeaderboardList';
import { LeaderboardEmpty } from '@/components/leaderboard/LeaderboardEmpty';
import { Skeleton } from '@/components/ui/skeleton';

const ACCENT = '45 95% 55%';

export default function Leaderboard() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<LeaderboardPeriod>('alltime');
  const [category, setCategory] = useState<LeaderboardCategory>('pnl');
  const { traders, total, loading, error } = useLeaderboard(period, category);

  const top3 = traders.slice(0, 3);
  const rest = traders.slice(3);

  // Swipeable tabs
  const tabsRef = useRef<HTMLDivElement>(null);
  const tabKeys: LeaderboardPeriod[] = ['weekly', 'monthly', 'alltime'];
  const tabIndex = tabKeys.indexOf(period);

  const startX = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => { startX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - startX.current;
    if (Math.abs(dx) > 60) {
      const next = dx < 0 ? Math.min(tabIndex + 1, 2) : Math.max(tabIndex - 1, 0);
      setPeriod(tabKeys[next]);
    }
  };

  return (
    <PageShell>
      <Header />
      <main className="container py-3 max-w-lg mx-auto px-3 space-y-3">
        <ToolPageHeader
          icon={<Crown className="w-5 h-5" style={{ color: `hsl(${ACCENT})` }} />}
          title={t('drawer_leaderboard') || 'Leaderboard'}
          subtitle="Ranking de los mejores traders"
          accent={ACCENT}
        />

        <LeaderboardFilters
          period={period}
          setPeriod={setPeriod}
          category={category}
          setCategory={setCategory}
          accent={ACCENT}
        />

        <div
          ref={tabsRef}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="min-h-[300px]"
        >
          {loading && (
            <div className="space-y-3 pt-2">
              <div className="flex items-end justify-center gap-3">
                {[0, 1, 2].map(i => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <Skeleton className="w-16 h-3" />
                    <Skeleton className="w-16 rounded-t-lg" style={{ height: [100, 130, 80][i] }} />
                  </div>
                ))}
              </div>
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
            </div>
          )}

          {!loading && !error && traders.length === 0 && <LeaderboardEmpty accent={ACCENT} />}

          {!loading && !error && top3.length >= 3 && (
            <LeaderboardPodium traders={top3} category={category} accent={ACCENT} />
          )}

          {!loading && !error && (
            <LeaderboardList traders={rest} category={category} accent={ACCENT} total={total} />
          )}

          {error && !loading && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Error al cargar el leaderboard. Intenta de nuevo.
            </div>
          )}
        </div>
      </main>
    </PageShell>
  );
}
