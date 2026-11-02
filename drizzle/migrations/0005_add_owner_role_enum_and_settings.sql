ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'owner';

CREATE TABLE public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor uuid NOT NULL,
  action text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX admin_audit_log_actor_idx ON public.admin_audit_log (actor, created_at DESC);
GRANT SELECT, INSERT ON public.admin_audit_log TO authenticated;
GRANT ALL ON public.admin_audit_log TO service_role;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Section visibility + platform settings (controlled from the admin panel)
CREATE TABLE public.platform_sections (
  key text PRIMARY KEY,
  is_visible boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.platform_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.platform_sections TO anon, authenticated;
GRANT ALL ON public.platform_sections TO service_role;
GRANT SELECT ON public.platform_settings TO anon, authenticated;
GRANT ALL ON public.platform_settings TO service_role;
ALTER TABLE public.platform_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read sections" ON public.platform_sections FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read settings" ON public.platform_settings FOR SELECT TO anon, authenticated USING (true);

INSERT INTO public.platform_sections (key) VALUES
 ('library'),('videos'),('ai'),('exams'),('flashcards'),('focus'),('todo'),('notes'),('translator'),('teachers'),('calculator'),('community'),('statistics'),('updates'),('champions'),('academy'),('battles'),('support'),('honor');
INSERT INTO public.platform_settings (key, value) VALUES ('developers_footer','1');