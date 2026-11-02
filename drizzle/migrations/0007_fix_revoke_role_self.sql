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
  END IF;
  DELETE FROM public.user_roles WHERE user_id = _user AND role = _role;
  INSERT INTO public.admin_audit_log (actor, action, details)
  VALUES (auth.uid(), 'revoke_role', jsonb_build_object('target', _user, 'role', _role));
END;
$$;

GRANT EXECUTE ON FUNCTION public.revoke_role(uuid, app_role) TO authenticated;