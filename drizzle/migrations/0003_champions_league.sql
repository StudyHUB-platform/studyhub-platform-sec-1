CREATE TABLE public.cl_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  registration_open boolean NOT NULL DEFAULT true,
  bracket_published boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.cl_settings TO authenticated;
GRANT ALL ON public.cl_settings TO service_role;
ALTER TABLE public.cl_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cl settings read" ON public.cl_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "cl settings admin" ON public.cl_settings FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE public.cl_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  name text NOT NULL,
  phone text NOT NULL,
  gender text NOT NULL CHECK (gender IN ('boy','girl')),
  study_type text NOT NULL CHECK (study_type IN ('general','languages')),
  emoji text NOT NULL UNIQUE,
  seed int,
  is_warned boolean NOT NULL DEFAULT false,
  warning_note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cl_participants TO authenticated;
GRANT ALL ON public.cl_participants TO service_role;
ALTER TABLE public.cl_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cl participants own read" ON public.cl_participants FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "cl participants admin" ON public.cl_participants FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE public.cl_rounds (
  round int PRIMARY KEY CHECK (round BETWEEN 1 AND 4),
  start_at timestamptz,
  end_at timestamptz,
  duration_minutes int NOT NULL DEFAULT 18,
  question_limit int,
  is_open boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cl_rounds TO authenticated;
GRANT ALL ON public.cl_rounds TO service_role;
ALTER TABLE public.cl_rounds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cl rounds read" ON public.cl_rounds FOR SELECT TO authenticated USING (true);
CREATE POLICY "cl rounds admin" ON public.cl_rounds FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE public.cl_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  round int NOT NULL REFERENCES public.cl_rounds(round) ON DELETE CASCADE,
  subject text NOT NULL,
  track text NOT NULL DEFAULT 'all' CHECK (track IN ('all','general','languages')),
  question_text text NOT NULL DEFAULT '',
  image_url text,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  correct_answer text NOT NULL,
  explanation text,
  position int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cl_questions TO authenticated;
GRANT ALL ON public.cl_questions TO service_role;
ALTER TABLE public.cl_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cl questions admin" ON public.cl_questions FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE public.cl_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  round int NOT NULL CHECK (round BETWEEN 1 AND 4),
  slot int NOT NULL,
  p1 uuid REFERENCES public.cl_participants(id) ON DELETE SET NULL,
  p2 uuid REFERENCES public.cl_participants(id) ON DELETE SET NULL,
  winner uuid REFERENCES public.cl_participants(id) ON DELETE SET NULL,
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (round, slot)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cl_matches TO authenticated;
GRANT ALL ON public.cl_matches TO service_role;
ALTER TABLE public.cl_matches ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.cl_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  round int NOT NULL,
  participant_id uuid NOT NULL REFERENCES public.cl_participants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  match_id uuid REFERENCES public.cl_matches(id) ON DELETE SET NULL,
  question_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  deadline timestamptz NOT NULL,
  submitted_at timestamptz,
  score int NOT NULL DEFAULT 0,
  total int NOT NULL DEFAULT 0,
  percentage numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'in_progress',
  UNIQUE (round, participant_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cl_attempts TO authenticated;
GRANT ALL ON public.cl_attempts TO service_role;
ALTER TABLE public.cl_attempts ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.cl_is_participant() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.cl_participants WHERE user_id = auth.uid())
$$;

CREATE POLICY "cl matches read" ON public.cl_matches FOR SELECT TO authenticated USING (
  public.is_admin() OR (public.cl_is_participant() AND EXISTS (SELECT 1 FROM public.cl_settings s WHERE s.id = 1 AND s.bracket_published))
);
CREATE POLICY "cl matches admin" ON public.cl_matches FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "cl attempts read" ON public.cl_attempts FOR SELECT TO authenticated USING (
  user_id = auth.uid() OR public.is_admin() OR (status = 'submitted' AND public.cl_is_participant())
);
CREATE POLICY "cl attempts admin" ON public.cl_attempts FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE OR REPLACE FUNCTION public.cl_taken_emojis() RETURNS SETOF text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT emoji FROM public.cl_participants
$$;

CREATE OR REPLACE FUNCTION public.cl_participant_count() RETURNS int LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT count(*)::int FROM public.cl_participants
$$;

CREATE OR REPLACE FUNCTION public.cl_bracket_participants()
RETURNS TABLE (id uuid, name text, emoji text, is_warned boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.name, p.emoji, p.is_warned FROM public.cl_participants p
  WHERE public.cl_is_participant() OR public.is_admin()
$$;

CREATE OR REPLACE FUNCTION public.cl_register(_name text, _phone text, _gender text, _study_type text, _emoji text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _id uuid; _count int; _open boolean;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'يجب تسجيل الدخول أولاً'; END IF;
  LOCK TABLE public.cl_participants IN SHARE ROW EXCLUSIVE MODE;
  SELECT registration_open INTO _open FROM public.cl_settings WHERE id = 1;
  IF NOT COALESCE(_open, false) THEN RAISE EXCEPTION 'التسجيل في البطولة مغلق'; END IF;
  IF EXISTS (SELECT 1 FROM public.cl_participants WHERE user_id = auth.uid()) THEN RAISE EXCEPTION 'أنت مسجل بالفعل في البطولة'; END IF;
  SELECT count(*) INTO _count FROM public.cl_participants;
  IF _count >= 16 THEN RAISE EXCEPTION 'اكتمل عدد المتسابقين (16) وتم إغلاق التسجيل'; END IF;
  IF length(trim(COALESCE(_name, ''))) < 2 THEN RAISE EXCEPTION 'اكتب الاسم'; END IF;
  IF COALESCE(_phone, '') !~ '^[0-9]{11}$' THEN RAISE EXCEPTION 'رقم الهاتف يجب أن يكون 11 رقم'; END IF;
  IF _gender NOT IN ('boy','girl') THEN RAISE EXCEPTION 'اختر النوع'; END IF;
  IF _study_type NOT IN ('general','languages') THEN RAISE EXCEPTION 'اختر نوع الدراسة'; END IF;
  IF length(trim(COALESCE(_emoji, ''))) = 0 THEN RAISE EXCEPTION 'اختر Emoji'; END IF;
  IF EXISTS (SELECT 1 FROM public.cl_participants WHERE emoji = _emoji) THEN RAISE EXCEPTION 'هذا الـEmoji محجوز لمتسابق آخر'; END IF;
  INSERT INTO public.cl_participants (user_id, name, phone, gender, study_type, emoji, seed)
  VALUES (auth.uid(), trim(_name), _phone, _gender, _study_type, _emoji, _count + 1)
  RETURNING id INTO _id;
  IF _count + 1 >= 16 THEN
    UPDATE public.cl_settings SET registration_open = false, updated_at = now() WHERE id = 1;
  END IF;
  RETURN _id;
END $$;

CREATE OR REPLACE FUNCTION public.cl_finalize(_attempt uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE a record; _score int := 0; _total int := 0;
BEGIN
  SELECT * INTO a FROM public.cl_attempts WHERE id = _attempt FOR UPDATE;
  IF NOT FOUND OR a.status <> 'in_progress' THEN RETURN; END IF;
  _total := jsonb_array_length(a.question_ids);
  SELECT count(*) INTO _score FROM public.cl_questions q
  WHERE q.id::text IN (SELECT jsonb_array_elements_text(a.question_ids))
    AND trim(COALESCE(a.answers->>q.id::text, '')) <> ''
    AND lower(trim(a.answers->>q.id::text)) = lower(trim(q.correct_answer));
  UPDATE public.cl_attempts SET
    status = 'submitted',
    submitted_at = LEAST(now(), a.deadline),
    score = _score,
    total = _total,
    percentage = CASE WHEN _total > 0 THEN round(_score * 100.0 / _total, 2) ELSE 0 END
  WHERE id = _attempt;
END $$;

CREATE OR REPLACE FUNCTION public.cl_place_winner(_round int, _slot int, _winner uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _round >= 4 OR _winner IS NULL THEN RETURN; END IF;
  INSERT INTO public.cl_matches (round, slot, p1, p2)
  VALUES (_round + 1, _slot / 2,
    CASE WHEN _slot % 2 = 0 THEN _winner END,
    CASE WHEN _slot % 2 = 1 THEN _winner END)
  ON CONFLICT (round, slot) DO UPDATE SET
    p1 = CASE WHEN _slot % 2 = 0 THEN EXCLUDED.p1 ELSE public.cl_matches.p1 END,
    p2 = CASE WHEN _slot % 2 = 1 THEN EXCLUDED.p2 ELSE public.cl_matches.p2 END;
END $$;

CREATE OR REPLACE FUNCTION public.cl_resolve_match(_match uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE m record; r record; a1 record; a2 record; _ended boolean; _w uuid; has1 boolean; has2 boolean; e1 interval; e2 interval;
BEGIN
  SELECT * INTO m FROM public.cl_matches WHERE id = _match FOR UPDATE;
  IF NOT FOUND OR m.winner IS NOT NULL THEN RETURN; END IF;
  SELECT * INTO r FROM public.cl_rounds WHERE round = m.round;
  _ended := FOUND AND r.end_at IS NOT NULL AND now() >= r.end_at;

  PERFORM public.cl_finalize(t.id) FROM public.cl_attempts t
  WHERE t.round = m.round AND t.participant_id IN (m.p1, m.p2) AND t.status = 'in_progress'
    AND (now() > t.deadline OR _ended);

  has1 := false; has2 := false;
  IF m.p1 IS NOT NULL THEN
    SELECT * INTO a1 FROM public.cl_attempts WHERE round = m.round AND participant_id = m.p1;
    has1 := FOUND;
  END IF;
  IF m.p2 IS NOT NULL THEN
    SELECT * INTO a2 FROM public.cl_attempts WHERE round = m.round AND participant_id = m.p2;
    has2 := FOUND;
  END IF;

  IF has1 AND has2 AND a1.status = 'submitted' AND a2.status = 'submitted' THEN
    IF a1.percentage > a2.percentage THEN _w := m.p1;
    ELSIF a2.percentage > a1.percentage THEN _w := m.p2;
    ELSE
      e1 := a1.submitted_at - a1.started_at;
      e2 := a2.submitted_at - a2.started_at;
      IF e1 < e2 THEN _w := m.p1; ELSIF e2 < e1 THEN _w := m.p2; END IF;
    END IF;
  ELSIF _ended THEN
    IF has1 AND NOT has2 THEN _w := m.p1;
    ELSIF has2 AND NOT has1 THEN _w := m.p2;
    ELSIF NOT has1 AND NOT has2 THEN
      IF m.p1 IS NOT NULL AND m.p2 IS NULL THEN _w := m.p1;
      ELSIF m.p2 IS NOT NULL AND m.p1 IS NULL THEN _w := m.p2;
      END IF;
    END IF;
  END IF;

  IF _w IS NOT NULL THEN
    UPDATE public.cl_matches SET winner = _w, decided_at = now() WHERE id = _match;
    PERFORM public.cl_place_winner(m.round, m.slot, _w);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.cl_refresh() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE mid uuid; t record;
BEGIN
  FOR t IN SELECT id FROM public.cl_attempts WHERE status = 'in_progress' AND now() > deadline LOOP
    PERFORM public.cl_finalize(t.id);
  END LOOP;
  FOR rn IN 1..4 LOOP
    FOR mid IN SELECT id FROM public.cl_matches WHERE round = rn AND winner IS NULL LOOP
      PERFORM public.cl_resolve_match(mid);
    END LOOP;
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.cl_start_attempt(_round int) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p record; r record; m record; _qids jsonb; _id uuid; _pub boolean;
BEGIN
  SELECT * INTO p FROM public.cl_participants WHERE user_id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'أنت غير مسجل في البطولة'; END IF;
  SELECT bracket_published INTO _pub FROM public.cl_settings WHERE id = 1;
  IF NOT COALESCE(_pub, false) THEN RAISE EXCEPTION 'لم يتم اعتماد خريطة البطولة بعد'; END IF;
  SELECT * INTO r FROM public.cl_rounds WHERE round = _round;
  IF NOT FOUND OR r.start_at IS NULL OR r.end_at IS NULL OR now() < r.start_at THEN RAISE EXCEPTION 'الجولة لم تبدأ بعد'; END IF;
  IF now() >= r.end_at THEN RAISE EXCEPTION 'انتهت الجولة'; END IF;
  IF NOT r.is_open THEN RAISE EXCEPTION 'الجولة مغلقة حالياً'; END IF;
  SELECT * INTO m FROM public.cl_matches WHERE round = _round AND (p1 = p.id OR p2 = p.id);
  IF NOT FOUND THEN RAISE EXCEPTION 'أنت لست ضمن مواجهات هذه الجولة'; END IF;
  IF m.winner IS NOT NULL THEN RAISE EXCEPTION 'تم حسم هذه المواجهة'; END IF;
  IF EXISTS (SELECT 1 FROM public.cl_attempts WHERE round = _round AND participant_id = p.id) THEN
    RAISE EXCEPTION 'لديك محاولة واحدة فقط لهذه الجولة';
  END IF;
  SELECT COALESCE(jsonb_agg(s.id ORDER BY s.ord), '[]'::jsonb) INTO _qids FROM (
    SELECT q.id, row_number() OVER (ORDER BY array_position(ARRAY['arabic','english','history','math','science','philosophy'], q.subject), q.position, q.created_at) AS ord
    FROM public.cl_questions q
    WHERE q.round = _round AND q.track IN ('all', p.study_type)
    ORDER BY array_position(ARRAY['arabic','english','history','math','science','philosophy'], q.subject), q.position, q.created_at
    LIMIT r.question_limit
  ) s;
  IF jsonb_array_length(_qids) = 0 THEN RAISE EXCEPTION 'لا توجد أسئلة لهذه الجولة بعد'; END IF;
  INSERT INTO public.cl_attempts (round, participant_id, user_id, match_id, question_ids, deadline)
  VALUES (_round, p.id, auth.uid(), m.id, _qids, LEAST(now() + make_interval(mins => r.duration_minutes), r.end_at))
  RETURNING id INTO _id;
  RETURN _id;
END $$;

CREATE OR REPLACE FUNCTION public.cl_get_exam(_round int) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE a record; _qs jsonb;
BEGIN
  SELECT * INTO a FROM public.cl_attempts WHERE round = _round AND user_id = auth.uid();
  IF NOT FOUND THEN RETURN NULL; END IF;
  IF a.status = 'in_progress' AND now() > a.deadline THEN
    PERFORM public.cl_finalize(a.id);
    IF a.match_id IS NOT NULL THEN PERFORM public.cl_resolve_match(a.match_id); END IF;
    SELECT * INTO a FROM public.cl_attempts WHERE id = a.id;
  END IF;
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object('id', q.id, 'subject', q.subject, 'track', q.track, 'question_text', q.question_text, 'image_url', q.image_url, 'options', q.options)
    || CASE WHEN a.status = 'submitted' THEN jsonb_build_object('correct_answer', q.correct_answer, 'explanation', q.explanation) ELSE '{}'::jsonb END
    ORDER BY e.ord), '[]'::jsonb) INTO _qs
  FROM jsonb_array_elements_text(a.question_ids) WITH ORDINALITY AS e(qid, ord)
  JOIN public.cl_questions q ON q.id::text = e.qid;
  RETURN jsonb_build_object('attempt', to_jsonb(a), 'questions', _qs, 'server_now', now());
END $$;

CREATE OR REPLACE FUNCTION public.cl_save_answers(_round int, _answers jsonb) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.cl_attempts SET answers = COALESCE(_answers, '{}'::jsonb)
  WHERE round = _round AND user_id = auth.uid() AND status = 'in_progress' AND now() <= deadline + interval '3 seconds';
  RETURN FOUND;
END $$;

CREATE OR REPLACE FUNCTION public.cl_submit_attempt(_round int, _answers jsonb) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE a record;
BEGIN
  SELECT * INTO a FROM public.cl_attempts WHERE round = _round AND user_id = auth.uid();
  IF NOT FOUND THEN RETURN; END IF;
  IF a.status = 'in_progress' THEN
    IF _answers IS NOT NULL AND now() <= a.deadline + interval '3 seconds' THEN
      UPDATE public.cl_attempts SET answers = _answers WHERE id = a.id;
    END IF;
    PERFORM public.cl_finalize(a.id);
  END IF;
  IF a.match_id IS NOT NULL THEN PERFORM public.cl_resolve_match(a.match_id); END IF;
END $$;

CREATE OR REPLACE FUNCTION public.cl_admin_set_winner(_match uuid, _winner uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE m record;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'غير مسموح'; END IF;
  SELECT * INTO m FROM public.cl_matches WHERE id = _match FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'المواجهة غير موجودة'; END IF;
  IF _winner IS NOT NULL AND _winner IS DISTINCT FROM m.p1 AND _winner IS DISTINCT FROM m.p2 THEN
    RAISE EXCEPTION 'الفائز يجب أن يكون أحد طرفي المواجهة';
  END IF;
  IF m.winner IS NOT NULL AND m.round < 4 THEN
    UPDATE public.cl_matches SET
      p1 = CASE WHEN p1 = m.winner THEN NULL ELSE p1 END,
      p2 = CASE WHEN p2 = m.winner THEN NULL ELSE p2 END
    WHERE round = m.round + 1 AND slot = m.slot / 2;
  END IF;
  UPDATE public.cl_matches SET winner = _winner, decided_at = CASE WHEN _winner IS NULL THEN NULL ELSE now() END WHERE id = _match;
  IF _winner IS NOT NULL THEN PERFORM public.cl_place_winner(m.round, m.slot, _winner); END IF;
END $$;

REVOKE EXECUTE ON FUNCTION public.cl_finalize(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cl_place_winner(int, int, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cl_resolve_match(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cl_register(text, text, text, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.cl_refresh() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.cl_start_attempt(int) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.cl_get_exam(int) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.cl_save_answers(int, jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.cl_submit_attempt(int, jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.cl_admin_set_winner(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cl_register(text, text, text, text, text), public.cl_refresh(), public.cl_start_attempt(int), public.cl_get_exam(int), public.cl_save_answers(int, jsonb), public.cl_submit_attempt(int, jsonb), public.cl_admin_set_winner(uuid, uuid), public.cl_taken_emojis(), public.cl_participant_count(), public.cl_bracket_participants(), public.cl_is_participant() TO authenticated;