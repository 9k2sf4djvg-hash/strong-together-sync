CREATE TYPE public.system_role AS ENUM ('admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.system_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_system_role(_user_id uuid, _role public.system_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
REVOKE ALL ON FUNCTION public.has_system_role(uuid, public.system_role) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.has_system_role(uuid, public.system_role) TO authenticated, service_role;

CREATE POLICY user_roles_select_self_or_admin ON public.user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_system_role(auth.uid(), 'admin'));

CREATE TYPE public.coach_status AS ENUM ('pending', 'approved', 'rejected', 'blocked');

CREATE TABLE public.coach_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  specialty text NOT NULL DEFAULT '',
  years_experience integer NOT NULL DEFAULT 0,
  bio text NOT NULL DEFAULT '',
  credential_path text,
  applicant_notes text NOT NULL DEFAULT '',
  status public.coach_status NOT NULL DEFAULT 'pending',
  admin_notes text NOT NULL DEFAULT '',
  rejection_reason text,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.coach_applications TO authenticated;
GRANT ALL ON public.coach_applications TO service_role;
ALTER TABLE public.coach_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY coach_app_select ON public.coach_applications FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_system_role(auth.uid(), 'admin'));

CREATE POLICY coach_app_insert_self ON public.coach_applications FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY coach_app_update_self_pending ON public.coach_applications FOR UPDATE TO authenticated
USING (user_id = auth.uid() AND status = 'pending')
WITH CHECK (user_id = auth.uid() AND status = 'pending');

CREATE POLICY coach_app_update_admin ON public.coach_applications FOR UPDATE TO authenticated
USING (public.has_system_role(auth.uid(), 'admin'))
WITH CHECK (public.has_system_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER coach_applications_updated_at BEFORE UPDATE ON public.coach_applications
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.is_approved_coach(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.coach_applications
    WHERE user_id = _user_id AND status = 'approved'
  )
$$;
REVOKE ALL ON FUNCTION public.is_approved_coach(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.is_approved_coach(uuid) TO authenticated, service_role;

CREATE TABLE public.admin_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  target_user_id uuid,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.admin_logs TO authenticated;
GRANT ALL ON public.admin_logs TO service_role;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_logs_select_admin ON public.admin_logs FOR SELECT TO authenticated
USING (public.has_system_role(auth.uid(), 'admin'));

CREATE POLICY admin_logs_insert_admin ON public.admin_logs FOR INSERT TO authenticated
WITH CHECK (admin_id = auth.uid() AND public.has_system_role(auth.uid(), 'admin'));

CREATE POLICY profiles_select_admin ON public.profiles FOR SELECT TO authenticated
USING (public.has_system_role(auth.uid(), 'admin'));

CREATE POLICY blocks_select_admin ON public.blocks FOR SELECT TO authenticated
USING (public.has_system_role(auth.uid(), 'admin'));