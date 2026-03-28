
-- Create bornes (terminals) table
CREATE TABLE public.bornes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  client_name text NOT NULL,
  location text DEFAULT '',
  plan text NOT NULL DEFAULT 'trial',
  status text NOT NULL DEFAULT 'active',
  apps_installed jsonb NOT NULL DEFAULT '["sadaka"]'::jsonb,
  terminal_id text DEFAULT NULL,
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bornes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage bornes"
  ON public.bornes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE TRIGGER update_bornes_updated_at
  BEFORE UPDATE ON public.bornes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
