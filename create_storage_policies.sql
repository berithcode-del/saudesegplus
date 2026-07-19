-- ============================================================
-- POLÍTICAS RLS PARA STORAGE BUCKETS
-- Execute no Supabase Dashboard → SQL Editor
-- ============================================================

-- Habilita RLS (se não estiver)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- POLÍTICAS PARA aso-documents (CRÍTICO PARA O ASO)
-- ============================================================

-- 1. Leitura pública (para download do PDF pelo frontend)
DROP POLICY IF EXISTS "Public read aso-documents" ON storage.objects;
CREATE POLICY "Public read aso-documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'aso-documents');

-- 2. Inserção autenticada (backend usa service role key)
DROP POLICY IF EXISTS "Authenticated insert aso-documents" ON storage.objects;
CREATE POLICY "Authenticated insert aso-documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'aso-documents' AND auth.role() = 'authenticated');

-- 3. Atualização pelo owner
DROP POLICY IF EXISTS "Owner update aso-documents" ON storage.objects;
CREATE POLICY "Owner update aso-documents"
ON storage.objects FOR UPDATE
USING (bucket_id = 'aso-documents' AND owner = auth.uid());

-- 4. Deleção pelo owner
DROP POLICY IF EXISTS "Owner delete aso-documents" ON storage.objects;
CREATE POLICY "Owner delete aso-documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'aso-documents' AND owner = auth.uid());

-- ============================================================
-- POLÍTICAS PARA company-documents
-- ============================================================

DROP POLICY IF EXISTS "Public read company-documents" ON storage.objects;
CREATE POLICY "Public read company-documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'company-documents');

DROP POLICY IF EXISTS "Authenticated insert company-documents" ON storage.objects;
CREATE POLICY "Authenticated insert company-documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'company-documents' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Owner update company-documents" ON storage.objects;
CREATE POLICY "Owner update company-documents"
ON storage.objects FOR UPDATE
USING (bucket_id = 'company-documents' AND owner = auth.uid());

DROP POLICY IF EXISTS "Owner delete company-documents" ON storage.objects;
CREATE POLICY "Owner delete company-documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'company-documents' AND owner = auth.uid());

-- ============================================================
-- POLÍTICAS PARA patient-files
-- ============================================================

DROP POLICY IF EXISTS "Public read patient-files" ON storage.objects;
CREATE POLICY "Public read patient-files"
ON storage.objects FOR SELECT
USING (bucket_id = 'patient-files');

DROP POLICY IF EXISTS "Authenticated insert patient-files" ON storage.objects;
CREATE POLICY "Authenticated insert patient-files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'patient-files' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Owner update patient-files" ON storage.objects;
CREATE POLICY "Owner update patient-files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'patient-files' AND owner = auth.uid());

DROP POLICY IF EXISTS "Owner delete patient-files" ON storage.objects;
CREATE POLICY "Owner delete patient-files"
ON storage.objects FOR DELETE
USING (bucket_id = 'patient-files' AND owner = auth.uid());

-- ============================================================
-- VERIFICAÇÃO
-- ============================================================
SELECT 
    policyname, 
    cmd, 
    qual, 
    with_check
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND (policyname LIKE '%aso-documents%' 
       OR policyname LIKE '%company-documents%' 
       OR policyname LIKE '%patient-files%')
ORDER BY policyname;