
-- Competition rankings table: stores calculated scores per user per period
CREATE TABLE public.competition_rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('weekly', 'monthly', 'alltime')),
  period_label TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_trades INTEGER NOT NULL DEFAULT 0,
  winning_trades INTEGER NOT NULL DEFAULT 0,
  total_pnl NUMERIC NOT NULL DEFAULT 0,
  win_rate NUMERIC NOT NULL DEFAULT 0,
  max_drawdown NUMERIC DEFAULT 0,
  consistency_score NUMERIC DEFAULT 0,
  composite_score NUMERIC NOT NULL DEFAULT 0,
  rank INTEGER,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disqualified', 'winner', 'published')),
  admin_notes TEXT,
  badge_awarded TEXT,
  prize_description TEXT,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Published winners visible to all users
CREATE TABLE public.competition_winners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ranking_id UUID REFERENCES public.competition_rankings(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  period_type TEXT NOT NULL,
  period_label TEXT NOT NULL,
  rank INTEGER NOT NULL DEFAULT 1,
  composite_score NUMERIC NOT NULL DEFAULT 0,
  total_pnl NUMERIC NOT NULL DEFAULT 0,
  win_rate NUMERIC NOT NULL DEFAULT 0,
  total_trades INTEGER NOT NULL DEFAULT 0,
  badge TEXT,
  prize TEXT,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.competition_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_winners ENABLE ROW LEVEL SECURITY;

-- Rankings: only admins can read/write
CREATE POLICY "Admins manage rankings"
  ON public.competition_rankings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Winners: everyone can read, only admins can insert/update
CREATE POLICY "Anyone can view winners"
  ON public.competition_winners FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins manage winners"
  ON public.competition_winners FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Index for fast queries
CREATE INDEX idx_rankings_period ON public.competition_rankings (period_type, period_start DESC);
CREATE INDEX idx_rankings_user ON public.competition_rankings (user_id, period_type);
CREATE INDEX idx_winners_period ON public.competition_winners (period_type, published_at DESC);
