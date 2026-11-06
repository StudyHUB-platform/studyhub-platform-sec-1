-- ============ Study HUB Academy ============
CREATE TABLE public.academy_books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  grade text NOT NULL DEFAULT 'Grade 1',
  title text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  source_summary text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.academy_source_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES public.academy_books(id) ON DELETE CASCADE,
  page_number integer NOT NULL,
  content text NOT NULL,
  unclear boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (book_id, page_number)
);
CREATE TABLE public.academy_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES public.academy_books(id) ON DELETE CASCADE,
  title text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.academy_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES public.academy_units(id) ON DELETE CASCADE,
  title text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  page_start integer,
  page_end integer,
  content jsonb,
  completion integer NOT NULL DEFAULT 0,
  version integer NOT NULL DEFAULT 1,
  error_note text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.academy_lesson_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.academy_lessons(id) ON DELETE CASCADE,
  version integer NOT NULL,
  content jsonb NOT NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX academy_lessons_unit_idx ON public.academy_lessons (unit_id, position);

GRANT SELECT ON public.academy_books, public.academy_units, public.academy_lessons TO anon, authenticated;
GRANT ALL ON public.academy_books, public.academy_source_pages, public.academy_units, public.academy_lessons, public.academy_lesson_versions TO service_role;
ALTER TABLE public.academy_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_source_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_lesson_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "books public read" ON public.academy_books FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "units public read" ON public.academy_units FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "lessons published or staff" ON public.academy_lessons FOR SELECT TO anon, authenticated USING (status = 'published' OR public.is_staff());
CREATE POLICY "source pages staff only" ON public.academy_source_pages FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY "versions staff only" ON public.academy_lesson_versions FOR SELECT TO authenticated USING (public.is_staff());

-- ============ Friends ============
CREATE TABLE public.friend_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user uuid NOT NULL,
  to_user uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  CHECK (from_user <> to_user),
  UNIQUE (from_user, to_user)
);
CREATE INDEX friend_requests_to_idx ON public.friend_requests (to_user, status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.friend_requests TO authenticated;
GRANT ALL ON public.friend_requests TO service_role;
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "friends both parties" ON public.friend_requests FOR SELECT TO authenticated
  USING (from_user = auth.uid() OR to_user = auth.uid());
CREATE POLICY "friends send" ON public.friend_requests FOR INSERT TO authenticated
  WITH CHECK (from_user = auth.uid() AND status = 'pending');
CREATE POLICY "friends respond" ON public.friend_requests FOR UPDATE TO authenticated
  USING (from_user = auth.uid() OR to_user = auth.uid());
CREATE POLICY "friends cancel" ON public.friend_requests FOR DELETE TO authenticated
  USING (from_user = auth.uid() OR to_user = auth.uid());

CREATE TABLE public.user_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL,
  title text NOT NULL,
  body text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX user_notifications_user_idx ON public.user_notifications (user_id, is_read, created_at DESC);
GRANT SELECT, UPDATE ON public.user_notifications TO authenticated;
GRANT ALL ON public.user_notifications TO service_role;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications own" ON public.user_notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "notifications mark read" ON public.user_notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- ============ Battles ============
CREATE TABLE public.battles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator uuid NOT NULL,
  subject text NOT NULL,
  lesson text NOT NULL DEFAULT 'General',
  num_questions integer NOT NULL DEFAULT 5,
  status text NOT NULL DEFAULT 'lobby',
  invite_code text NOT NULL UNIQUE DEFAULT upper(substr(md5(random()::text), 1, 6)),
  winner uuid,
  current_q integer NOT NULL DEFAULT 0,
  question_started_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);
CREATE TABLE public.battle_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id uuid NOT NULL REFERENCES public.battles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  ready boolean NOT NULL DEFAULT false,
  score integer NOT NULL DEFAULT 0,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (battle_id, user_id)
);
CREATE TABLE public.battle_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id uuid NOT NULL REFERENCES public.battles(id) ON DELETE CASCADE,
  position integer NOT NULL,
  question_text text NOT NULL,
  options jsonb NOT NULL,
  correct_answer text NOT NULL,
  source_ref text,
  UNIQUE (battle_id, position)
);
CREATE TABLE public.battle_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id uuid NOT NULL REFERENCES public.battles(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.battle_questions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  is_correct boolean NOT NULL,
  ms_taken integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (question_id, user_id)
);

-- Questions contain the correct answers: never exposed to clients directly.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.battles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.battle_players TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.battle_answers TO authenticated;
GRANT ALL ON public.battles, public.battle_players, public.battle_questions, public.battle_answers TO service_role;
ALTER TABLE public.battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battle_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battle_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battle_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "battles visible to players and lobby" ON public.battles FOR SELECT TO authenticated
  USING (status IN ('lobby','active','finished') OR public.is_staff());
CREATE POLICY "battles create" ON public.battles FOR INSERT TO authenticated WITH CHECK (creator = auth.uid());
CREATE POLICY "battles update via server" ON public.battles FOR UPDATE TO authenticated USING (creator = auth.uid() OR public.is_staff());
CREATE POLICY "players read own battles" ON public.battle_players FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.battles b WHERE b.id = battle_id) AND (
    user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.battle_players mp WHERE mp.battle_id = battle_id AND mp.user_id = auth.uid())));
CREATE POLICY "players join own" ON public.battle_players FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "players update via server" ON public.battle_players FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "answers own" ON public.battle_answers FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "answers insert own" ON public.battle_answers FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());