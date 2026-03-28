CREATE TABLE public.settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage settings" ON public.settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can read settings" ON public.settings
  FOR SELECT TO anon, authenticated
  USING (true);

-- Seed default settings
INSERT INTO public.settings (key, value) VALUES
  ('terminal', '{"terminal_id": "SADAQA-01", "terminal_name": "Borne principale", "location": "Mosquée"}'),
  ('presets', '{"amounts": [5, 10, 20, 50, 100], "currency": "EUR"}'),
  ('kiosk', '{"idle_timeout": 60, "receipt_enabled": true, "show_logo": true, "theme": "dark"}')
ON CONFLICT (key) DO NOTHING;