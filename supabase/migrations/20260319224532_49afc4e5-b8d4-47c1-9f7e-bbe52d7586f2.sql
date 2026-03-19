
CREATE TABLE public.forum_suggestion_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  category text NOT NULL,
  option_value text NOT NULL,
  poll_date date NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '1 day')::date,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, category, poll_date)
);

ALTER TABLE public.forum_suggestion_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view suggestion votes"
  ON public.forum_suggestion_votes FOR SELECT
  TO public USING (true);

CREATE POLICY "Authenticated users can vote"
  ON public.forum_suggestion_votes FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can change own vote"
  ON public.forum_suggestion_votes FOR UPDATE
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can remove own vote"
  ON public.forum_suggestion_votes FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
