CREATE TYPE public.app_role AS ENUM ('coach', 'trainee');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  role public.app_role NOT NULL DEFAULT 'trainee',
  coach_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.my_coach_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coach_id FROM public.profiles WHERE id = auth.uid()
$$;

CREATE POLICY "profiles_select_related" ON public.profiles FOR SELECT TO authenticated
USING (id = auth.uid() OR coach_id = auth.uid() OR id = public.my_coach_id());
CREATE POLICY "profiles_insert_self" ON public.profiles FOR INSERT TO authenticated
WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update_self" ON public.profiles FOR UPDATE TO authenticated
USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(COALESCE(NEW.email,''), '@', 1)),
    COALESCE(NEW.email, ''),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'role',''), 'trainee')::public.app_role
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.invite_codes (
  code text PRIMARY KEY,
  coach_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  used_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.invite_codes TO authenticated;
GRANT ALL ON public.invite_codes TO service_role;
ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invites_coach_all" ON public.invite_codes FOR SELECT TO authenticated USING (coach_id = auth.uid());
CREATE POLICY "invites_coach_insert" ON public.invite_codes FOR INSERT TO authenticated WITH CHECK (coach_id = auth.uid());
CREATE POLICY "invites_coach_delete" ON public.invite_codes FOR DELETE TO authenticated USING (coach_id = auth.uid());

CREATE OR REPLACE FUNCTION public.redeem_invite_code(_code text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _coach uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT coach_id INTO _coach FROM public.invite_codes
  WHERE upper(code) = upper(trim(_code)) AND used_by IS NULL;
  IF _coach IS NULL THEN RAISE EXCEPTION 'invalid_code'; END IF;
  IF _coach = auth.uid() THEN RAISE EXCEPTION 'own_code'; END IF;

  UPDATE public.invite_codes SET used_by = auth.uid(), used_at = now()
  WHERE upper(code) = upper(trim(_code));

  UPDATE public.profiles SET coach_id = _coach, role = 'trainee', updated_at = now()
  WHERE id = auth.uid();

  RETURN _coach;
END;
$$;

CREATE TABLE public.blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  trainee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  total_weeks int NOT NULL DEFAULT 4,
  workouts_per_week int NOT NULL DEFAULT 3,
  current_week int NOT NULL DEFAULT 1,
  completed_at bigint,
  weeks jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blocks TO authenticated;
GRANT ALL ON public.blocks TO service_role;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blocks_select" ON public.blocks FOR SELECT TO authenticated
USING (coach_id = auth.uid() OR trainee_id = auth.uid());
CREATE POLICY "blocks_coach_insert" ON public.blocks FOR INSERT TO authenticated
WITH CHECK (coach_id = auth.uid());
CREATE POLICY "blocks_update" ON public.blocks FOR UPDATE TO authenticated
USING (coach_id = auth.uid() OR trainee_id = auth.uid())
WITH CHECK (coach_id = auth.uid() OR trainee_id = auth.uid());
CREATE POLICY "blocks_coach_delete" ON public.blocks FOR DELETE TO authenticated
USING (coach_id = auth.uid());

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  to_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  from_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  to_role public.app_role NOT NULL DEFAULT 'trainee',
  text text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  dismissed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif_select" ON public.notifications FOR SELECT TO authenticated
USING (to_user_id = auth.uid() OR from_user_id = auth.uid());
CREATE POLICY "notif_insert" ON public.notifications FOR INSERT TO authenticated
WITH CHECK (from_user_id = auth.uid());
CREATE POLICY "notif_update_recipient" ON public.notifications FOR UPDATE TO authenticated
USING (to_user_id = auth.uid()) WITH CHECK (to_user_id = auth.uid());