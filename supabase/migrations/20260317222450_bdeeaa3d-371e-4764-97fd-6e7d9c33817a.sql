
-- ══════════════════════════════════════════════
-- FORUM / COMMUNITY CHAT SCHEMA
-- ══════════════════════════════════════════════

-- 1. Channels
CREATE TABLE public.forum_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT DEFAULT '💬',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.forum_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active channels" ON public.forum_channels
  FOR SELECT TO public USING (is_active = true);

CREATE POLICY "Admins can manage channels" ON public.forum_channels
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- 2. Messages
CREATE TABLE public.forum_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES public.forum_channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  signal_id UUID REFERENCES public.trading_signals(id) ON DELETE SET NULL,
  reply_to_id UUID REFERENCES public.forum_messages(id) ON DELETE SET NULL,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.forum_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read messages" ON public.forum_messages
  FOR SELECT TO public USING (true);

CREATE POLICY "Authenticated users can send messages" ON public.forum_messages
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can edit own messages" ON public.forum_messages
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all messages" ON public.forum_messages
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.forum_messages;

-- 3. Reactions
CREATE TABLE public.forum_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.forum_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL DEFAULT '👍',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

ALTER TABLE public.forum_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reactions" ON public.forum_reactions
  FOR SELECT TO public USING (true);

CREATE POLICY "Authenticated users can add reactions" ON public.forum_reactions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own reactions" ON public.forum_reactions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 4. Daily Topics
CREATE TABLE public.forum_daily_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  topic_date DATE NOT NULL DEFAULT CURRENT_DATE UNIQUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.forum_daily_topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view daily topics" ON public.forum_daily_topics
  FOR SELECT TO public USING (true);

CREATE POLICY "Admins can manage daily topics" ON public.forum_daily_topics
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- 5. Topic Votes
CREATE TABLE public.forum_topic_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES public.forum_daily_topics(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote TEXT NOT NULL CHECK (vote IN ('a', 'b')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(topic_id, user_id)
);

ALTER TABLE public.forum_topic_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view votes" ON public.forum_topic_votes
  FOR SELECT TO public USING (true);

CREATE POLICY "Authenticated users can vote" ON public.forum_topic_votes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can change own vote" ON public.forum_topic_votes
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can remove own vote" ON public.forum_topic_votes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 6. Direct Messages
CREATE TABLE public.forum_direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.forum_direct_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own DMs" ON public.forum_direct_messages
  FOR SELECT TO authenticated USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Authenticated users can send DMs" ON public.forum_direct_messages
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can delete own sent DMs" ON public.forum_direct_messages
  FOR DELETE TO authenticated USING (auth.uid() = sender_id);

-- Enable realtime for DMs
ALTER PUBLICATION supabase_realtime ADD TABLE public.forum_direct_messages;

-- 7. Reports
CREATE TABLE public.forum_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES public.forum_messages(id) ON DELETE CASCADE,
  dm_id UUID REFERENCES public.forum_direct_messages(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.forum_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can report" ON public.forum_reports
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Admins can manage reports" ON public.forum_reports
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- 8. User Bans
CREATE TABLE public.forum_user_bans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  banned_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT,
  banned_until TIMESTAMPTZ,
  is_permanent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.forum_user_bans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see own bans" ON public.forum_user_bans
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage bans" ON public.forum_user_bans
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- ══════════════════════════════════════════════
-- SEED: Default channels
-- ══════════════════════════════════════════════
INSERT INTO public.forum_channels (name, slug, description, icon, sort_order) VALUES
  ('General', 'general', 'Conversación general de la comunidad', '💬', 0),
  ('Forex', 'forex', 'Discusión sobre pares de divisas', '📈', 1),
  ('Crypto', 'crypto', 'Todo sobre criptomonedas', '₿', 2),
  ('Noticias', 'noticias', 'Comentarios sobre noticias del mercado', '📰', 3),
  ('Señales', 'senales', 'Comparte y discute señales de trading', '🎯', 4);
