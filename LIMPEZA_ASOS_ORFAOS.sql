-- Limpeza de ASOs órfãos (sem PDF e sem protocolo)
-- Execute APÓS a migration ter sido aplicada
-- Nomes das colunas em camelCase (como o Prisma cria no PostgreSQL)

-- 1. Verificar ASOs órfãos (sem PDF e sem protocolo)
SELECT 
  ad.id, 
  ad."requestId", 
  er.id, 
  er.status, 
  er.processo_aso_id, 
  p.name
FROM "AsoDocument" ad
JOIN "ExamRequest" er ON ad."requestId" = er.id
JOIN "Patient" p ON er."patientId" = p.id
WHERE ad."pdfUrl" IS NULL AND er.processo_aso_id IS NULL;

-- 2. Limpar ASOs órfãos (APAGA DADOS - revise antes)
DELETE FROM "AsoDocument" 
WHERE "pdfUrl" IS NULL 
  AND "requestId" IN (
    SELECT er.id FROM "ExamRequest" er 
    WHERE er.processo_aso_id IS NULL
  );

-- 3. Reabrir exames órfãos (resetar status)
UPDATE "ExamRequest" 
SET status = 'AGUARDANDO_COLETA'
WHERE processo_aso_id IS NULL 
  AND status = 'CONCLUIDO'
  AND id NOT IN (SELECT "requestId" FROM "AsoDocument" WHERE "pdfUrl" IS NOT NULL);