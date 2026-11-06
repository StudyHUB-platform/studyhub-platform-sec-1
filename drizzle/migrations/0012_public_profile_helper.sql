-- Minimal public profile fields for friends, battles, leaderboards and results.
CREATE OR REPLACE FUNCTION public.public_profile(_ids uuid[])
RETURNS TABLE(id uuid, full_name text, avatar_id integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT p.id, COALESCE(NULLIF(trim(p.full_name), ''), 'طالب Study HUB'), p.avatar_id
  FROM public.profiles p
  WHERE p.id = ANY(_ids)
$$;
GRANT EXECUTE ON FUNCTION public.public_profile(uuid[]) TO authenticated;