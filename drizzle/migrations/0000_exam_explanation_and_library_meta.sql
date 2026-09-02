ALTER TABLE public.exam_questions ADD COLUMN IF NOT EXISTS explanation TEXT;
ALTER TABLE public.library_items ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;