-- ═══════════════════════════════════════════════════════════════
-- DIAGNÓSTICO: Protocolos ASO vs ExamRequests
-- SaudeSeg+ - Investigação de exames sem protocolo
-- ═══════════════════════════════════════════════════════════════

-- 1) TOTAL DE PROTOCOLOS NA TABELA processos_aso
SELECT
  'TOTAL PROTOCOLOS' AS metrica,
  COUNT(*)::text AS valor
FROM processos_aso

UNION ALL

-- 2) TOTAL DE EXAM REQUESTS
SELECT
  'TOTAL EXAM REQUESTS' AS metrica,
  COUNT(*)::text AS valor
FROM exam_requests

UNION ALL

-- 3) EXAMES COM PROTOCOLO VINCULADO
SELECT
  'EXAMES COM PROTOCOLO' AS metrica,
  COUNT(*)::text AS valor
FROM exam_requests
WHERE processo_aso_id IS NOT NULL

UNION ALL

-- 4) EXAMES SEM PROTOCOLO (PROVÁVEL FALHA)
SELECT
  'EXAMES SEM PROTOCOLO' AS metrica,
  COUNT(*)::text AS valor
FROM exam_requests
WHERE processo_aso_id IS NULL;

-- ═══════════════════════════════════════════════════════════════
-- 5) LISTA DETALHADA DE PROTOCOLOS EXISTENTES
-- ═══════════════════════════════════════════════════════════════
SELECT
  pa.id,
  pa.numero_protocolo,
  pa.status,
  pa.tipo_exame,
  pa.empresa_id,
  pa.clinica_id,
  pa.paciente_id,
  pa.medico_id,
  pa.exam_request_id,
  pa.data_abertura,
  pa.data_conclusao,
  pa.created_at,
  pa.updated_at
FROM processos_aso pa
ORDER BY pa.created_at DESC;

-- ═══════════════════════════════════════════════════════════════
-- 6) LISTA DETALHADA DE EXAMES (com ou sem protocolo)
-- ═══════════════════════════════════════════════════════════════
SELECT
  er.id AS exam_request_id,
  er.patient_id,
  er.clinic_id,
  er.invite_id,
  er.source,
  er.exam_purpose,
  er.status AS exam_status,
  er.processo_aso_id,
  CASE
    WHEN er.processo_aso_id IS NULL THEN '⚠️ SEM PROTOCOLO'
    ELSE '✅ COM PROTOCOLO'
  END AS protocolo_status,
  er.created_at,
  er.updated_at
FROM exam_requests er
ORDER BY er.created_at DESC;

-- ═══════════════════════════════════════════════════════════════
-- 7) EXAMES SEM PROTOCOLO - apenas estes (para investigação)
-- ═══════════════════════════════════════════════════════════════
SELECT
  er.id AS exam_request_id,
  er.patient_id,
  er.invite_id,
  er.source,
  er.exam_purpose,
  er.status AS exam_status,
  er.created_at
FROM exam_requests er
WHERE er.processo_aso_id IS NULL
ORDER BY er.created_at DESC;

-- ═══════════════════════════════════════════════════════════════
-- 8) DISTRIBUTION DE PROTOCOLOS POR STATUS
-- ═══════════════════════════════════════════════════════════════
SELECT
  pa.status,
  COUNT(*) AS total
FROM processos_aso pa
GROUP BY pa.status
ORDER BY total DESC;

-- ═══════════════════════════════════════════════════════════════
-- 9) DISTRIBUTION DE EXAMES POR SOURCE (direto vs convite_empresa)
-- ═══════════════════════════════════════════════════════════════
SELECT
  er.source,
  COUNT(*) AS total,
  COUNT(er.processo_aso_id) AS com_protocolo,
  COUNT(*) - COUNT(er.processo_aso_id) AS sem_protocolo
FROM exam_requests er
GROUP BY er.source
ORDER BY total DESC;
