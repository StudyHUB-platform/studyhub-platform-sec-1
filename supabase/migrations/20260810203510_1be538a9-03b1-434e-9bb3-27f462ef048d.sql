
CREATE POLICY "library files read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'library');
CREATE POLICY "library files admin insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'library' AND public.is_admin());
CREATE POLICY "library files admin update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'library' AND public.is_admin());
CREATE POLICY "library files admin delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'library' AND public.is_admin());
