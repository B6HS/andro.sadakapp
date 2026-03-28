-- Multi-tenant : associations (slug URL) → bornes → causes / dons

CREATE TABLE public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_tenants_slug ON public.tenants (slug);

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Read active tenants"
  ON public.tenants FOR SELECT
  TO anon, authenticated
  USING (status = 'active');

CREATE POLICY "Super admins manage tenants"
  ON public.tenants FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

INSERT INTO public.tenants (slug, name) VALUES
  ('iqraa', 'Iqraa'),
  ('centresocial', 'Centre social')
ON CONFLICT (slug) DO NOTHING;

ALTER TABLE public.bornes ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;

UPDATE public.bornes b
SET tenant_id = (SELECT id FROM public.tenants t WHERE t.slug = 'iqraa' LIMIT 1)
WHERE b.tenant_id IS NULL;

ALTER TABLE public.bornes ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.tenants ADD COLUMN default_borne_id uuid REFERENCES public.bornes(id) ON DELETE SET NULL;

UPDATE public.tenants t
SET default_borne_id = sub.id
FROM (
  SELECT DISTINCT ON (tenant_id) tenant_id, id
  FROM public.bornes
  ORDER BY tenant_id, created_at ASC
) sub
WHERE t.id = sub.tenant_id AND t.default_borne_id IS NULL;

DROP POLICY IF EXISTS "Anyone can view active causes" ON public.causes;

CREATE OR REPLACE FUNCTION public.get_causes_for_borne(_borne_id uuid)
RETURNS SETOF public.causes
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.*
  FROM public.causes c
  WHERE c.active = true
    AND c.borne_id = _borne_id
  ORDER BY c.created_at ASC;
$$;

GRANT EXECUTE ON FUNCTION public.get_causes_for_borne(uuid) TO anon, authenticated;

DROP POLICY IF EXISTS "Anyone can insert donations with valid data" ON public.donations;

CREATE POLICY "Anyone can insert donations with borne"
  ON public.donations FOR INSERT
  WITH CHECK (
    amount > 0
    AND cause IS NOT NULL
    AND reference IS NOT NULL
    AND borne_id IS NOT NULL
  );
