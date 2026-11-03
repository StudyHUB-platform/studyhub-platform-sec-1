ALTER TABLE public.profiles ADD COLUMN avatar_id integer NOT NULL DEFAULT 1;
GRANT UPDATE (avatar_id) ON public.profiles TO authenticated;
COMMENT ON COLUMN public.profiles.avatar_id IS 'Chosen cartoon avatar index (1-20), shown everywhere the user appears';