CREATE POLICY coach_creds_insert_own ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'coach-credentials' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY coach_creds_select_own ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'coach-credentials' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY coach_creds_update_own ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'coach-credentials' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY coach_creds_select_admin ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'coach-credentials' AND public.has_system_role(auth.uid(), 'admin'));