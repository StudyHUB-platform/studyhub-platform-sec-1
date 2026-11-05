CREATE OR REPLACE FUNCTION public.claim_todo_list_bonus()
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_total integer;
  v_done integer;
  v_ref text;
BEGIN
  IF v_uid IS NULL THEN RETURN false; END IF;
  SELECT count(*), count(*) FILTER (WHERE is_done) INTO v_total, v_done
  FROM public.todos WHERE user_id = v_uid;
  IF v_total = 0 OR v_done < v_total THEN RETURN false; END IF;
  -- One bonus per completion episode: adding new tasks and finishing them again grants it anew.
  SELECT format('todo_all_complete:%s:%s', v_total,
    COALESCE((SELECT max(created_at)::text FROM public.todos WHERE user_id = v_uid), ''))
  INTO v_ref;
  PERFORM public.award(v_uid, 'todo_all_complete', v_ref, 50, 0);
  RETURN true;
END;
$$;
GRANT EXECUTE ON FUNCTION public.claim_todo_list_bonus() TO authenticated;