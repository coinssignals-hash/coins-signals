
CREATE TABLE public.favorite_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  favorite_user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, favorite_user_id)
);

ALTER TABLE public.favorite_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own favorite users"
  ON public.favorite_users FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorite users"
  ON public.favorite_users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove favorite users"
  ON public.favorite_users FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
