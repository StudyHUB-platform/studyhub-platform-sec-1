CREATE TABLE public.user_stats (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  public_id text NOT NULL UNIQUE,
  shards int NOT NULL DEFAULT 0,
  shards_reached_at timestamptz NOT NULL DEFAULT now(),
  xp int NOT NULL DEFAULT 0,
  level int NOT NULL DEFAULT 1,
  streak int NOT NULL DEFAULT 0,
  last_study_day date,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.user_stats TO authenticated;
GRANT ALL ON public.user_stats TO service_role;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stats own read" ON public.user_stats FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());

CREATE TABLE public.reward_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL,
  ref text NOT NULL,
  xp int NOT NULL DEFAULT 0,
  shards int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, kind, ref)
);
GRANT SELECT ON public.reward_events TO authenticated;
GRANT ALL ON public.reward_events TO service_role;
ALTER TABLE public.reward_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rewards own read" ON public.reward_events FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());

CREATE TABLE public.phone_logins (
  phone text PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.phone_logins TO authenticated;
GRANT ALL ON public.phone_logins TO service_role;
ALTER TABLE public.phone_logins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "phone login own read" ON public.phone_logins FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());

CREATE TABLE public.device_link_tokens (
  token_hash text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.device_link_tokens TO service_role;
ALTER TABLE public.device_link_tokens ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.flashcards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  question text NOT NULL,
  answer text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.flashcards TO authenticated;
GRANT ALL ON public.flashcards TO service_role;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "flashcards own" ON public.flashcards FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.gen_public_id() RETURNS text LANGUAGE plpgsql VOLATILE SET search_path = public AS $$
DECLARE v text;
BEGIN
  LOOP
    v := (floor(random() * 9) + 1)::int::text || lpad(floor(random() * 1000000000)::bigint::text, 9, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.user_stats WHERE public_id = v);
  END LOOP;
  RETURN v;
END $$;

CREATE OR REPLACE FUNCTION public.ensure_user_stats(_uid uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_stats (user_id, public_id) VALUES (_uid, public.gen_public_id()) ON CONFLICT (user_id) DO NOTHING;
END $$;

INSERT INTO public.user_stats (user_id, public_id)
SELECT u.id, public.gen_public_id() FROM auth.users u ON CONFLICT DO NOTHING;

INSERT INTO public.phone_logins (phone, user_id)
SELECT split_part(u.email, '@', 1), u.id FROM auth.users u
WHERE u.email ~ '^[0-9]{11}@studyhub\.app$' ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, phone, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone'),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  PERFORM public.ensure_user_stats(NEW.id);
  IF NEW.email ~ '^[0-9]{11}@studyhub\.app$' THEN
    INSERT INTO public.phone_logins (phone, user_id) VALUES (split_part(NEW.email, '@', 1), NEW.id) ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END; $function$;

CREATE OR REPLACE FUNCTION public.level_xp_required(_l int) RETURNS int LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN _l <= 1 THEN 100
    ELSE (round((120 + 880 * power((LEAST(_l, 49) - 2) / 47.0, 1.2)) / 10) * 10)::int END
$$;

CREATE OR REPLACE FUNCTION public.level_for_xp(_xp int) RETURNS int LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE l int := 1; acc int := 0;
BEGIN
  WHILE l < 50 AND _xp >= acc + public.level_xp_required(l) LOOP
    acc := acc + public.level_xp_required(l);
    l := l + 1;
  END LOOP;
  RETURN l;
END $$;

CREATE OR REPLACE FUNCTION public.award(_uid uuid, _kind text, _ref text, _xp int, _shards int) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _id uuid;
BEGIN
  IF _uid IS NULL THEN RETURN; END IF;
  PERFORM public.ensure_user_stats(_uid);
  INSERT INTO public.reward_events (user_id, kind, ref, xp, shards)
  VALUES (_uid, _kind, _ref, GREATEST(_xp, 0), GREATEST(_shards, 0))
  ON CONFLICT DO NOTHING RETURNING id INTO _id;
  IF _id IS NULL THEN RETURN; END IF;
  UPDATE public.user_stats SET
    xp = xp + GREATEST(_xp, 0),
    shards = shards + GREATEST(_shards, 0),
    shards_reached_at = CASE WHEN _shards > 0 THEN now() ELSE shards_reached_at END
  WHERE user_id = _uid;
END $$;

CREATE OR REPLACE FUNCTION public.trg_exam_reward() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.award(NEW.user_id, 'exam', NEW.id::text, 60, round(NEW.percentage)::int);
  RETURN NEW;
END $$;
CREATE TRIGGER exam_attempts_reward AFTER INSERT ON public.exam_attempts FOR EACH ROW EXECUTE FUNCTION public.trg_exam_reward();

CREATE OR REPLACE FUNCTION public.trg_cl_reward() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'submitted' AND OLD.status IS DISTINCT FROM 'submitted' THEN
    PERFORM public.award(NEW.user_id, 'cl_exam', NEW.id::text, 0, round(NEW.percentage)::int);
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER cl_attempts_reward AFTER UPDATE ON public.cl_attempts FOR EACH ROW EXECUTE FUNCTION public.trg_cl_reward();

CREATE OR REPLACE FUNCTION public.trg_todo_reward() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.is_done AND NOT OLD.is_done THEN
    PERFORM public.award(NEW.user_id, 'todo', NEW.id::text, 20, 0);
    IF NOT EXISTS (SELECT 1 FROM public.todos WHERE user_id = NEW.user_id AND NOT is_done) THEN
      PERFORM public.award(NEW.user_id, 'todo_all', NEW.id::text, 50, 0);
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER todos_reward AFTER UPDATE ON public.todos FOR EACH ROW EXECUTE FUNCTION public.trg_todo_reward();

CREATE OR REPLACE FUNCTION public.trg_session_reward() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s record; _day date; _streak int;
BEGIN
  IF NEW.mode <> 'study' OR NEW.minutes <= 0 THEN RETURN NEW; END IF;
  PERFORM public.award(NEW.user_id, 'focus', NEW.id::text, 30, 0);
  _day := (NEW.created_at AT TIME ZONE 'Africa/Cairo')::date;
  SELECT * INTO s FROM public.user_stats WHERE user_id = NEW.user_id FOR UPDATE;
  IF s.last_study_day = _day THEN RETURN NEW; END IF;
  IF s.last_study_day = _day - 1 THEN _streak := s.streak + 1; ELSE _streak := 1; END IF;
  UPDATE public.user_stats SET streak = _streak, last_study_day = _day WHERE user_id = NEW.user_id;
  IF _streak % 7 = 0 THEN
    PERFORM public.award(NEW.user_id, 'streak_week', _day::text, 0, 200);
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER study_sessions_reward AFTER INSERT ON public.study_sessions FOR EACH ROW EXECUTE FUNCTION public.trg_session_reward();

CREATE OR REPLACE FUNCTION public.my_stats() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s record; _computed int; _base int := 0; l int; _today date := (now() AT TIME ZONE 'Africa/Cairo')::date;
BEGIN
  IF auth.uid() IS NULL THEN RETURN NULL; END IF;
  PERFORM public.ensure_user_stats(auth.uid());
  SELECT * INTO s FROM public.user_stats WHERE user_id = auth.uid();
  _computed := public.level_for_xp(s.xp);
  FOR l IN 1..(s.level - 1) LOOP _base := _base + public.level_xp_required(l); END LOOP;
  RETURN jsonb_build_object(
    'public_id', s.public_id,
    'shards', s.shards,
    'xp', s.xp,
    'level', s.level,
    'pending_level', _computed,
    'xp_in_level', s.xp - _base,
    'xp_needed', public.level_xp_required(s.level),
    'streak', CASE WHEN s.last_study_day IS NOT NULL AND s.last_study_day >= _today - 1 THEN s.streak ELSE 0 END,
    'studied_today', s.last_study_day = _today
  );
END $$;

CREATE OR REPLACE FUNCTION public.claim_level_up() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s record; _new int; l int;
BEGIN
  SELECT * INTO s FROM public.user_stats WHERE user_id = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN RETURN NULL; END IF;
  _new := public.level_for_xp(s.xp);
  IF _new <= s.level THEN RETURN jsonb_build_object('from', s.level, 'to', s.level, 'reward', 0); END IF;
  UPDATE public.user_stats SET level = _new WHERE user_id = auth.uid();
  FOR l IN (s.level + 1).._new LOOP
    PERFORM public.award(auth.uid(), 'level_up', l::text, 0, 50);
  END LOOP;
  RETURN jsonb_build_object('from', s.level, 'to', _new, 'reward', 50 * (_new - s.level));
END $$;

CREATE OR REPLACE FUNCTION public.honor_board()
RETURNS TABLE (rank int, name text, shards int, level int, is_me boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT (row_number() OVER (ORDER BY s.shards DESC, s.shards_reached_at ASC))::int,
         COALESCE(NULLIF(trim(p.full_name), ''), 'طالب Study HUB'),
         s.shards, s.level, s.user_id = auth.uid()
  FROM public.user_stats s LEFT JOIN public.profiles p ON p.id = s.user_id
  WHERE s.shards > 0
  ORDER BY s.shards DESC, s.shards_reached_at ASC
  LIMIT 10
$$;

CREATE OR REPLACE FUNCTION public.create_device_link() RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE _t text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'يجب تسجيل الدخول'; END IF;
  DELETE FROM public.device_link_tokens WHERE user_id = auth.uid() AND used_at IS NULL;
  _t := encode(extensions.gen_random_bytes(32), 'hex');
  INSERT INTO public.device_link_tokens (token_hash, user_id, expires_at)
  VALUES (encode(extensions.digest(_t, 'sha256'), 'hex'), auth.uid(), now() + interval '2 minutes');
  RETURN _t;
END $$;

REVOKE EXECUTE ON FUNCTION public.award(uuid, text, text, int, int) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ensure_user_stats(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.gen_public_id() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_exam_reward(), public.trg_cl_reward(), public.trg_todo_reward(), public.trg_session_reward() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.my_stats(), public.claim_level_up(), public.honor_board(), public.create_device_link() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_stats(), public.claim_level_up(), public.honor_board(), public.create_device_link() TO authenticated;