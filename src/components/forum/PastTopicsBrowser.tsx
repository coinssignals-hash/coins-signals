import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GlowCard } from '@/components/ui/glow-card';
import { CardContent } from '@/components/ui/card';
import { Trophy, ChevronLeft, ChevronRight, Calendar, TrendingUp, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es, enUS, pt, fr, de, it, ar } from 'date-fns/locale';
import { useTranslation } from '@/i18n/LanguageContext';
import { useTopicTranslation } from '@/hooks/useTopicTranslation';

const DATE_LOCALES: Record<string, typeof es> = { es, en: enUS, pt, fr, de, it, ar };

interface PastTopic {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  option_a: string;
  option_b: string;
  topic_date: string;
  votes_a: number;
  votes_b: number;
}

export function PastTopicsBrowser({ onClose }: { onClose: () => void }) {
  const { language } = useTranslation();
  const { translateTopic, translating } = useTopicTranslation();
  const [topics, setTopics] = useState<PastTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [translated, setTranslated] = useState<{ title: string; description: string | null; option_a: string; option_b: string } | null>(null);

  const fetchPastTopics = useCallback(async () => {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];

    const { data } = await supabase
      .from('forum_daily_topics')
      .select('*')
      .lt('topic_date', today)
      .order('topic_date', { ascending: false })
      .limit(30);

    if (!data || data.length === 0) {
      setTopics([]);
      setLoading(false);
      return;
    }

    const topicIds = data.map(t => t.id);
    const { data: allVotes } = await supabase
      .from('forum_topic_votes')
      .select('topic_id, vote')
      .in('topic_id', topicIds);

    const voteMap = new Map<string, { a: number; b: number }>();
    if (allVotes) {
      for (const v of allVotes) {
        if (!voteMap.has(v.topic_id)) voteMap.set(v.topic_id, { a: 0, b: 0 });
        const entry = voteMap.get(v.topic_id)!;
        if (v.vote === 'a') entry.a++;
        else entry.b++;
      }
    }

    const enriched: PastTopic[] = data.map(t => {
      const votes = voteMap.get(t.id) || { a: 0, b: 0 };
      return {
        id: t.id,
        title: t.title,
        description: t.description,
        image_url: t.image_url,
        option_a: t.option_a,
        option_b: t.option_b,
        topic_date: t.topic_date,
        votes_a: votes.a,
        votes_b: votes.b,
      };
    });

    setTopics(enriched);
    setCurrentIndex(0);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPastTopics();
  }, [fetchPastTopics]);

  // Translate current topic
  useEffect(() => {
    if (topics.length === 0 || language === 'es') {
      setTranslated(null);
      return;
    }
    const topic = topics[currentIndex];
    if (!topic) return;
    let cancelled = false;
    translateTopic(topic, language).then(result => {
      if (!cancelled) setTranslated(result);
    });
    return () => { cancelled = true; };
  }, [currentIndex, topics, language, translateTopic]);

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-4 flex items-center justify-center gap-2 text-muted-foreground text-xs">
          <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
          {language === 'es' ? 'Cargando historial...' : 'Loading history...'}
        </CardContent>
      </Card>
    );
  }

  if (topics.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-4 text-center space-y-2">
          <p className="text-xs text-muted-foreground">
            {language === 'es' ? 'No hay temas anteriores disponibles' : 'No past topics available'}
          </p>
          <button onClick={onClose} className="text-xs text-primary font-semibold">
            {language === 'es' ? 'Volver' : 'Back'}
          </button>
        </CardContent>
      </Card>
    );
  }

  const topic = topics[currentIndex];
  const total = topic.votes_a + topic.votes_b;
  const pctA = total > 0 ? Math.round((topic.votes_a / total) * 100) : 0;
  const pctB = total > 0 ? Math.round((topic.votes_b / total) * 100) : 0;
  const winner = topic.votes_a > topic.votes_b ? 'a' : topic.votes_b > topic.votes_a ? 'b' : null;

  const displayTitle = translated?.title || topic.title;
  const displayDesc = translated?.description ?? topic.description;
  const displayOptA = translated?.option_a || topic.option_a;
  const displayOptB = translated?.option_b || topic.option_b;

  const historyLabel = language === 'es' ? 'Historial de Temas' : language === 'en' ? 'Topic History' : language === 'pt' ? 'Histórico de Temas' : language === 'fr' ? 'Historique des Sujets' : 'Historial de Temas';
  const winnerLabel = language === 'es' ? 'Ganador' : language === 'en' ? 'Winner' : language === 'pt' ? 'Vencedor' : language === 'fr' ? 'Gagnant' : 'Ganador';
  const votesLabel = language === 'es' ? 'votos' : language === 'en' ? 'votes' : language === 'pt' ? 'votos' : language === 'fr' ? 'votes' : 'votos';
  const totalVotesLabel = language === 'es' ? 'votos totales' : language === 'en' ? 'total votes' : language === 'pt' ? 'votos totais' : language === 'fr' ? 'votes totaux' : 'votos totales';

  const dateLocale = DATE_LOCALES[language] || es;

  return (
    <Card className="bg-card border-border overflow-hidden">
      {topic.image_url && (
        <img src={topic.image_url} alt={displayTitle} className="w-full h-28 object-cover" loading="lazy" />
      )}
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
              {historyLabel}
            </span>
            {translating && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
          </div>
          <button onClick={onClose} className="text-[10px] text-muted-foreground hover:text-primary transition-colors">
            ✕
          </button>
        </div>

        {/* Date navigation */}
        <div className="flex items-center justify-between bg-secondary/60 rounded-lg px-3 py-1.5">
          <button
            onClick={() => setCurrentIndex(Math.min(currentIndex + 1, topics.length - 1))}
            disabled={currentIndex >= topics.length - 1}
            className="p-0.5 rounded hover:bg-secondary disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-foreground" />
          </button>
          <span className="text-xs font-semibold text-foreground">
            {format(new Date(topic.topic_date + 'T12:00:00'), "d MMM yyyy", { locale: dateLocale })}
          </span>
          <button
            onClick={() => setCurrentIndex(Math.max(currentIndex - 1, 0))}
            disabled={currentIndex <= 0}
            className="p-0.5 rounded hover:bg-secondary disabled:opacity-30 transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-foreground" />
          </button>
        </div>

        <h3 className="text-sm font-bold text-foreground">{displayTitle}</h3>
        {displayDesc && <p className="text-xs text-muted-foreground">{displayDesc}</p>}

        <div className="grid grid-cols-2 gap-2">
          {(['a', 'b'] as const).map(opt => {
            const label = opt === 'a' ? displayOptA : displayOptB;
            const votes = opt === 'a' ? topic.votes_a : topic.votes_b;
            const pct = opt === 'a' ? pctA : pctB;
            const isWinner = winner === opt;

            return (
              <div
                key={opt}
                className={cn(
                  "relative overflow-hidden rounded-lg border p-3 transition-all",
                  isWinner
                    ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                    : "border-border bg-secondary/60"
                )}
              >
                <div
                  className={cn(
                    "absolute inset-0 transition-all",
                    isWinner ? "bg-primary/15" : "bg-muted/30"
                  )}
                  style={{ width: `${pct}%` }}
                />
                {isWinner && (
                  <div className="relative flex items-center gap-1 mb-1">
                    <Trophy className="w-3 h-3 text-primary" />
                    <span className="text-[9px] font-bold text-primary uppercase">{winnerLabel}</span>
                  </div>
                )}
                <span className="relative text-xs font-semibold text-foreground">{label}</span>
                <div className="relative flex items-center gap-1.5 mt-1">
                  <span className="text-[10px] text-muted-foreground">{votes} {votesLabel}</span>
                  <span className={cn(
                    "text-[10px] font-bold",
                    isWinner ? "text-primary" : "text-muted-foreground"
                  )}>
                    {pct}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
          <TrendingUp className="w-3 h-3" />
          <span>{total} {totalVotesLabel}</span>
          <span className="mx-1">·</span>
          <span>{currentIndex + 1} / {topics.length}</span>
        </div>
      </CardContent>
    </Card>
  );
}
