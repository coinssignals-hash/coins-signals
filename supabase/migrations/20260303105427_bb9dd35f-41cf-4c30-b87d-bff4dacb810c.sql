
CREATE TABLE public.user_alert_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.user_alert_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own alert config"
ON public.user_alert_configs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own alert config"
ON public.user_alert_configs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own alert config"
ON public.user_alert_configs FOR UPDATE
USING (auth.uid() = user_id);

CREATE TRIGGER update_user_alert_configs_updated_at
BEFORE UPDATE ON public.user_alert_configs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
