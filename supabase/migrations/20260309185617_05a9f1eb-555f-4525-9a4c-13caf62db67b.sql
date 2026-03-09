
CREATE TABLE public.scheduled_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  url text DEFAULT '/',
  tag text DEFAULT 'admin-broadcast',
  filter jsonb DEFAULT NULL,
  audience_label text DEFAULT 'Todos',
  scheduled_at timestamp with time zone NOT NULL,
  sent_at timestamp with time zone DEFAULT NULL,
  status text NOT NULL DEFAULT 'pending',
  result jsonb DEFAULT NULL,
  created_by uuid DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.scheduled_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage scheduled notifications"
  ON public.scheduled_notifications
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
