DROP FUNCTION public.honor_board();
CREATE OR REPLACE FUNCTION public.honor_board()
RETURNS TABLE(rank integer, name text, shards integer, level integer, is_me boolean, avatar_id integer, public_id text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT (row_number() OVER (ORDER BY s.shards DESC, s.shards_reached_at ASC))::int,
         COALESCE(NULLIF(trim(p.full_name), ''), 'طالب Study HUB'),
         s.shards, s.level, s.user_id = auth.uid(), p.avatar_id, s.public_id
  FROM public.user_stats s LEFT JOIN public.profiles p ON p.id = s.user_id
  WHERE s.shards > 0
  ORDER BY s.shards DESC, s.shards_reached_at ASC
  LIMIT 10
$function$;
GRANT EXECUTE ON FUNCTION public.honor_board() TO authenticated, anon;