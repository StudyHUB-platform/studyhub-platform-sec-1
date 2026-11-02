CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'owner') $$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('owner','admin')) $$;

CREATE POLICY "Staff can read audit log" ON public.admin_audit_log FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY "Staff can write audit log" ON public.admin_audit_log FOR INSERT TO authenticated WITH CHECK (public.is_staff() AND actor = auth.uid());

-- Atomic, race-safe owner bootstrap: assigns Owner to the earliest real
-- registered account exactly once. Uses an advisory lock + guard row.
CREATE OR REPLACE FUNCTION public.assign_first_owner()
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_owner uuid;
BEGIN
  PERFORM pg_advisory_xact_lock(918273645);
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'owner') THEN
    RETURN; -- Owner already exists: never assign a second one
  END IF;
  SELECT id INTO v_owner FROM auth.users ORDER BY created_at ASC LIMIT 1;
  IF v_owner IS NULL THEN RETURN; END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (v_owner, 'owner')
  ON CONFLICT (user_id, role) DO NOTHING;
  INSERT INTO public.admin_audit_log (actor, action, details)
  VALUES (v_owner, 'owner_bootstrap', jsonb_build_object('assigned_by', 'first_account_rule'));
END;
$$;

GRANT EXECUTE ON FUNCTION public.assign_first_owner() TO authenticated, anon;

-- Race-safe role grant: keeps the last Owner in place.
CREATE OR REPLACE FUNCTION public.grant_role(_user uuid, _role app_role)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_owner() THEN
    RAISE EXCEPTION 'Only the Owner can manage roles';
  END IF;
  IF _role = 'owner' THEN
    IF _user = auth.uid() THEN RAISE EXCEPTION 'You already own this role'; END IF;
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (_user, _role)
  ON CONFLICT (user_id, role) DO UPDATE SET created_at = now();
  INSERT INTO public.admin_audit_log (actor, action, details)
  VALUES (auth.uid(), 'grant_role', jsonb_build_object('target', _user, 'role', _role));
END;
$$;

CREATE OR REPLACE FUNCTION public.revoke_role(_user uuid, _role app_role)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_owner() THEN
    RAISE EXCEPTION 'Only the Owner can manage roles';
  END IF;
  IF _role = 'owner' THEN
    IF (SELECT count(*) FROM public.user_roles WHERE role = 'owner') <= 1 THEN
      RAISE EXCEPTION 'Cannot remove the last Owner - assign another Owner first';
    END IF;
    IF _user = auth.uid() THEN
      RAISE EXCEPTION 'Cannot remove your own Owner role while other owners exist is disallowed - remove the other owner instead';
    END IF;
  END IF;
  DELETE FROM public.user_roles WHERE user_id = _user AND role = _role;
  INSERT INTO public.admin_audit_log (actor, action, details)
  VALUES (auth.uid(), 'revoke_role', jsonb_build_object('target', _user, 'role', _role));
END;
$$;

GRANT EXECUTE ON FUNCTION public.grant_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_role(uuid, app_role) TO authenticated;

SELECT public.assign_first_owner();