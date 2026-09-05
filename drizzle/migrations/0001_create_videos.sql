CREATE TABLE public.videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  section text NOT NULL DEFAULT 'Explanation & Solutions',
  title text NOT NULL,
  description text,
  url text NOT NULL,
  video_id text,
  thumbnail_url text,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.videos TO authenticated;
GRANT ALL ON public.videos TO service_role;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "videos read" ON public.videos FOR SELECT TO authenticated USING (true);
CREATE POLICY "videos admin write" ON public.videos FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TRIGGER videos_updated_at BEFORE UPDATE ON public.videos FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.video_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (video_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.video_likes TO authenticated;
GRANT ALL ON public.video_likes TO service_role;
ALTER TABLE public.video_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "likes read" ON public.video_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "likes insert own" ON public.video_likes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "likes delete own" ON public.video_likes FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.is_admin());

CREATE TABLE public.video_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.video_comments TO authenticated;
GRANT ALL ON public.video_comments TO service_role;
ALTER TABLE public.video_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comments read" ON public.video_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "comments insert own" ON public.video_comments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "comments delete own" ON public.video_comments FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.is_admin());

INSERT INTO public.videos (subject, section, title, description, url, thumbnail_url, created_by, created_at)
SELECT subject, 'Explanation & Solutions', title, description, url, thumbnail_url, created_by, created_at
FROM public.library_items
WHERE file_type = 'Video';
