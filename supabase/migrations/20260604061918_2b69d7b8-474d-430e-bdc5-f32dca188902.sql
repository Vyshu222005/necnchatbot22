
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO service_role;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

-- Storage policies for documents bucket
CREATE POLICY "Anyone read documents bucket" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'documents');
CREATE POLICY "Admins upload documents" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documents' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update documents" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'documents' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete documents" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'documents' AND public.has_role(auth.uid(), 'admin'));
