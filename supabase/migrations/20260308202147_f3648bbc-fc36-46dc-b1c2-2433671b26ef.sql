
-- 1. Create borne_users mapping table (links admin users to bornes)
CREATE TABLE public.borne_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  borne_id uuid NOT NULL REFERENCES public.bornes(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, borne_id)
);

ALTER TABLE public.borne_users ENABLE ROW LEVEL SECURITY;

-- Super admins can manage all borne_users
CREATE POLICY "Super admins can manage borne_users"
  ON public.borne_users FOR ALL
  USING (has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- Admins can view their own assignments
CREATE POLICY "Users can view own borne assignments"
  ON public.borne_users FOR SELECT
  USING (auth.uid() = user_id);

-- 2. Add borne_id to causes
ALTER TABLE public.causes ADD COLUMN borne_id uuid REFERENCES public.bornes(id) ON DELETE CASCADE;

-- 3. Add borne_id to donations
ALTER TABLE public.donations ADD COLUMN borne_id uuid REFERENCES public.bornes(id) ON DELETE CASCADE;

-- 4. Create helper function: get user's borne_ids
CREATE OR REPLACE FUNCTION public.get_user_borne_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT borne_id FROM public.borne_users WHERE user_id = _user_id
$$;

-- 5. Update RLS on causes: admins see only their bornes' causes
DROP POLICY IF EXISTS "Admins can manage all causes" ON public.causes;
CREATE POLICY "Admins can manage their borne causes"
  ON public.causes FOR ALL
  USING (
    has_role(auth.uid(), 'super_admin')
    OR (has_role(auth.uid(), 'admin') AND borne_id IN (SELECT public.get_user_borne_ids(auth.uid())))
  )
  WITH CHECK (
    has_role(auth.uid(), 'super_admin')
    OR (has_role(auth.uid(), 'admin') AND borne_id IN (SELECT public.get_user_borne_ids(auth.uid())))
  );

-- 6. Update RLS on donations: admins see only their bornes' donations
DROP POLICY IF EXISTS "Admins can view all donations" ON public.donations;
DROP POLICY IF EXISTS "Admins can update donations" ON public.donations;
DROP POLICY IF EXISTS "Super admins can view all donations" ON public.donations;

CREATE POLICY "Admins can view their borne donations"
  ON public.donations FOR SELECT
  USING (
    has_role(auth.uid(), 'super_admin')
    OR (has_role(auth.uid(), 'admin') AND borne_id IN (SELECT public.get_user_borne_ids(auth.uid())))
  );

CREATE POLICY "Admins can update their borne donations"
  ON public.donations FOR UPDATE
  USING (
    has_role(auth.uid(), 'super_admin')
    OR (has_role(auth.uid(), 'admin') AND borne_id IN (SELECT public.get_user_borne_ids(auth.uid())))
  );
