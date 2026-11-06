CREATE OR REPLACE FUNCTION public.public_stats(_ids uuid[])
RETURNS TABLE(user_id uuid, level integer, shards integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT s.user_id, s.level, s.shards FROM public.user_stats s WHERE s.user_id = ANY(_ids)
$$;
GRANT EXECUTE ON FUNCTION public.public_stats(uuid[]) TO authenticated;