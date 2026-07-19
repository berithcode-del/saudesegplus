-- ============================================================
-- CRIAÇÃO DE BUCKETS NO SUPABASE STORAGE
-- Execute no Supabase Dashboard → SQL Editor
-- ============================================================

-- Bucket para documentos da empresa (PCMSO, PPRA, etc)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'company-documents',
    'company-documents',
    true,
    10485760,  -- 10MB
    ARRAY['application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Bucket para arquivos de pacientes (exames, documentos)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'patient-files',
    'patient-files',
    true,
    10485760,  -- 10MB
    ARRAY['application/pdf', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Bucket para ASO PDFs (O QUE ESTAVA FALTANDO)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'aso-documents',
    'aso-documents',
    true,
    10485760,  -- 10MB
    ARRAY['application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================================
-- POLÍTICAS RLS (Row Level Security) - OPCIONAL MAS RECOMENDADO
-- ============================================================

-- Policy para company-documents: acesso público para leitura
CREATE POLICY "Public read access for company-documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'company-documents');

CREATE POLICY "Authenticated insert for company-documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'company-documents' AND auth.role() = 'authenticated');

-- Policy para patient-files: acesso público para leitura
CREATE POLICY "Public read access for patient-files"
ON storage.objects FOR SELECT
USING (bucket_id = 'patient-files');

CREATE POLICY "Authenticated insert for patient-files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'patient-files' AND auth.role() = 'authenticated');

-- Policy para aso-documents: acesso público para leitura
CREATE POLICY "Public read access for aso-documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'aso-documents');

CREATE POLICY "Authenticated insert for aso-documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'aso-documents' AND auth.role() = 'authenticated');

-- Policy para UPDATE/DELETE (apenas owners ou service role)
CREATE POLICY "Owner update for company-documents"
ON storage.objects FOR UPDATE
USING (bucket_id = 'company-documents' AND owner = auth.uid());

CREATE POLICY "Owner update for patient-files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'patient-files' AND owner = auth.uid());

CREATE POLICY "Owner update for aso-documents"
ON storage.objects FOR UPDATE
USING (bucket_id = 'aso-documents' AND owner = auth.uid());

CREATE POLICY "Owner delete for company-documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'company-documents' AND owner = auth.uid());

CREATE POLICY "Owner delete for patient-files"
ON storage.objects FOR DELETE
USING (bucket_id = 'patient-files' AND owner = auth.uid());

CREATE POLICY "Owner delete for aso-documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'aso-documents' AND owner = auth.uid());

-- ============================================================
-- VERIFICAÇÃO
-- ============================================================
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id IN ('company-documents', 'patient-files', 'aso-documents');

-- ============================================================
-- FIM
-- ============================================================