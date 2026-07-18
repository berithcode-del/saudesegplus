-- ============================================================================
-- DIAGNÓSTICO: Protocolos ASO vs ExamRequests
-- SaudeSeg+ - Investigação de exames sem protocolo
-- ============================================================================
-- Execute este script no banco de dados (psql, pgAdmin, DBeaver, Supabase SQL Editor)
-- ============================================================================

-- ============================================================================
-- 1. VER TODOS OS EXAME REQUESTS COM SEUS STATUS
-- ============================================================================
SELECT 
    er.id,
    er.status as exam_status,
    er."examPurpose",
    er.source,
    er.patient_id,
    er.clinic_id,
    er.invite_id,
    er.processo_aso_id,
    p.numero_protocolo as protocolo_numero,
    p.status as protocolo_status,
    p.tipo_exame as protocolo_tipo,
    p.data_abertura as protocolo_data
FROM "ExamRequest" er
LEFT JOIN "processos_aso" p ON er.processo_aso_id = p.id
ORDER BY er.created_at DESC;

-- ============================================================================
-- 2. CONTAGEM: EXAMES SEM PROTOCOLO (FALHA POTENCIAL)
-- ============================================================================
SELECT 
    'Exames sem protocolo' as categoria,
    COUNT(*) as total
FROM "ExamRequest" er
WHERE er.processo_aso_id IS NULL;

-- ============================================================================
-- 3. EXAMES QUE DEVERIAM TER PROTOCOLO (STATUS "EM ANDAMENTO")
-- Ajuste os status conforme seu domínio
-- ============================================================================
SELECT 
    er.id,
    er.status as exam_status,
    er."examPurpose",
    er.source,
    er.invite_id,
    er.patient_id,
    p.name as paciente_nome,
    p.cpf as paciente_cpf
FROM "ExamRequest" er
JOIN "Patient" p ON er.patient_id = p.id
WHERE er.processo_aso_id IS NULL
  AND er.status IN ('AGUARDANDO_COLETA', 'EM_COLETA', 'NA_FILA_MEDICA', 'EM_ATENDIMENTO', 'DOCUMENTOS_PENDENTES')
ORDER BY er.created_at DESC;

-- ============================================================================
-- 4. VERIFICAR CONVITES CONCLUÍDOS SEM PROTOCOLO
-- ============================================================================
SELECT 
    ei.id as invite_id,
    ei.status as invite_status,
    ei.exam_type,
    ei.company_id,
    ei.patient_id,
    er.id as exam_request_id,
    er.status as exam_status,
    er.processo_aso_id
FROM "ExamInvite" ei
LEFT JOIN "ExamRequest" er ON ei.id = er.invite_id
WHERE ei.status = 'CONCLUIDO'
  AND (er.id IS NULL OR er.processo_aso_id IS NULL)
ORDER BY ei.updated_at DESC;

-- ============================================================================
-- 5. TODOS OS PROTOCOLOS EXISTENTES
-- ============================================================================
SELECT 
    p.id,
    p.numero_protocolo,
    p.status,
    p.tipo_exame,
    p.empresa_id,
    p.clinica_id,
    p.paciente_id,
    p.medico_id,
    p.exam_request_id,
    p.data_abertura,
    p.data_conclusao,
    c.name as paciente_nome,
    c.cpf as paciente_cpf
FROM "processos_aso" p
JOIN "Patient" c ON p.paciente_id = c.id
ORDER BY p.data_abertura DESC;

-- ============================================================================
-- 6. EXAMES COM PROTOCOLO MAS STATUS INCONSISTENTE
-- ============================================================================
SELECT 
    er.id as exam_id,
    er.status as exam_status,
    p.numero_protocolo,
    p.status as protocolo_status,
    p.tipo_exame
FROM "ExamRequest" er
JOIN "processos_aso" p ON er.processo_aso_id = p.id
WHERE 
    (er.status = 'CONCLUIDO' AND p.status != 'CONCLUIDO')
    OR (er.status = 'CANCELADO' AND p.status != 'CANCELADO')
    OR (p.status = 'CONCLUIDO' AND er.status != 'CONCLUIDO');

-- ============================================================================
-- 7. RESUMO GERAL
-- ============================================================================
SELECT 
    'Total ExamRequest' as metrica, COUNT(*) as valor FROM "ExamRequest"
UNION ALL
SELECT 'ExamRequest com protocolo', COUNT(*) FROM "ExamRequest" WHERE processo_aso_id IS NOT NULL
UNION ALL
SELECT 'ExamRequest SEM protocolo', COUNT(*) FROM "ExamRequest" WHERE processo_aso_id IS NULL
UNION ALL
SELECT 'Total ProcessoASO', COUNT(*) FROM "processos_aso"
UNION ALL
SELECT 'Convites CONCLUIDO', COUNT(*) FROM "ExamInvite" WHERE status = 'CONCLUIDO'
UNION ALL
SELECT 'Convites CONCLUIDO sem ExamRequest', COUNT(*) FROM "ExamInvite" ei LEFT JOIN "ExamRequest" er ON ei.id = er.invite_id WHERE ei.status = 'CONCLUIDO' AND er.id IS NULL
UNION ALL
SELECT 'Convites CONCLUIDO com ExamRequest sem protocolo', COUNT(*) FROM "ExamInvite" ei JOIN "ExamRequest" er ON ei.id = er.invite_id WHERE ei.status = 'CONCLUIDO' AND er.processo_aso_id IS NULL;

-- ============================================================================
-- 8. VERIFICAR SE HÁ ERRO NA CRIAÇÃO (LOGS DE ERRO RECENTES)
-- ============================================================================
-- Se houver tabela de logs de erro, descomente:
-- SELECT * FROM error_logs WHERE created_at > NOW() - INTERVAL '7 days' ORDER BY created_at DESC LIMIT 20;

-- ============================================================================
-- 9. EXAMES "EM ANDAMENTO" DETALHADOS (SEU CASO: 11 EXAMES)
-- ============================================================================
-- Substitua os status abaixo pelos que você considera "em andamento"
WITH exams_em_andamento AS (
    SELECT 
        er.id,
        er.status,
        er."examPurpose",
        er.source,
        er.invite_id,
        er.processo_aso_id,
        p.name as paciente_nome,
        p.cpf as paciente_cpf,
        c.name as empresa_nome
    FROM "ExamRequest" er
    JOIN "Patient" p ON er.patient_id = p.id
    LEFT JOIN "Company" c ON er.clinic_id = c.id
    WHERE er.status IN ('AGUARDANDO_COLETA', 'EM_COLETA', 'NA_FILA_MEDICA', 'EM_ATENDIMENTO', 'DOCUMENTOS_PENDENTES')
)
SELECT 
    *,
    CASE 
        WHEN processo_aso_id IS NULL THEN '❌ SEM PROTOCOLO'
        ELSE '✅ TEM PROTOCOLO'
    END as diagnostico
FROM exams_em_andamento
ORDER BY diagnostico, id;

-- ============================================================================
-- 10. AÇÃO CORRETIVA: CRIAR PROTOCOLOS FALTANTES PARA EXAMES EM ANDAMENTO
-- ============================================================================
-- DESCOMENTE E EXECUTE APENAS APÓS CONFIRMAR O DIAGNÓSTICO ACIMA
/*
WITH missing AS (
    SELECT 
        er.id as exam_request_id,
        er.patient_id,
        er.clinic_id,
        ei.company_id,
        er."examPurpose"
    FROM "ExamRequest" er
    LEFT JOIN "ExamInvite" ei ON er.invite_id = ei.id
    WHERE er.processo_aso_id IS NULL
      AND er.status IN ('AGUARDANDO_COLETA', 'EM_COLETA', 'NA_FILA_MEDICA', 'EM_ATENDIMENTO', 'DOCUMENTOS_PENDENTES')
)
INSERT INTO "processos_aso" (
    id,
    numero_protocolo,
    empresa_id,
    clinica_id,
    paciente_id,
    tipo_exame,
    status,
    data_abertura,
    created_at,
    updated_at,
    documentos,
    historico
)
SELECT 
    gen_random_uuid(),
    'ASO-' || to_char(NOW(), 'YYYY') || '-' || LPAD((COUNT(*) OVER() + ROW_NUMBER() OVER())::text, 4, '0'),
    COALESCE(m.company_id, m.clinic_id),
    m.clinic_id,
    m.patient_id,
    CASE 
        WHEN m."examPurpose" ILIKE '%admiss%' THEN 'ADMISSIONAL'
        WHEN m."examPurpose" ILIKE '%periodic%' THEN 'PERIODICO'
        WHEN m."examPurpose" ILIKE '%demiss%' THEN 'DEMISSIONAL'
        WHEN m."examPurpose" ILIKE '%mudan%' THEN 'MUDANCA_FUNCAO'
        WHEN m."examPurpose" ILIKE '%retorn%' THEN 'RETORNO_TRABALHO'
        ELSE 'PERIODICO'
    END::"TipoExame",
    'AGUARDANDO_COLETA'::"StatusProtocolo",
    NOW(),
    NOW(),
    NOW(),
    '[]'::jsonb,
    '[{"acao": "criacao_manual", "de": null, "para": {"status": "AGUARDANDO_COLETA"}, "userId": "diagnostico-script", "timestamp": "' || NOW()::text || '"}]'::jsonb
FROM missing m
ON CONFLICT DO NOTHING;
*/

-- ============================================================================
-- 11. ATUALIZAR EXAMREQUEST COM PROTOCOLO_ID APÓS CRIAÇÃO (SE EXECUTAR O 10)
-- ============================================================================
/*
UPDATE "ExamRequest" er
SET processo_aso_id = p.id
FROM "processos_aso" p
WHERE er.processo_aso_id IS NULL
  AND p.exam_request_id = er.id;
*/