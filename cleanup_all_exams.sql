-- ============================================================
-- LIMPEZA COMPLETA DE EXAMES/CONVITES - SaudeSeg+
-- Execute no Supabase SQL Editor
-- ATENÇÃO: Remove TODOS os ExamInvites, ExamRequests, ProcessoASO, etc.
-- ============================================================

-- Desabilita FKs/triggers
SET session_replication_role = replica;

-- 1. ExamTimelineEvent
DELETE FROM "ExamTimelineEvent";

-- 2. ExamResult
DELETE FROM "ExamResult";

-- 3. QueueEntry
DELETE FROM "QueueEntry";

-- 4. Teleconsultation
DELETE FROM "Teleconsultation";

-- 5. FinancialTransaction
DELETE FROM "FinancialTransaction";

-- 6. AsoDocument
DELETE FROM "AsoDocument";

-- 7. PatientDocument
DELETE FROM "PatientDocument";

-- 8. ExamRequest
DELETE FROM "ExamRequest";

-- 9. ProcessoASO
DELETE FROM "ProcessoASO";

-- 10. ExamInvite
DELETE FROM "ExamInvite";

-- 11. Patient (apenas órfãos)
DELETE FROM "Patient" p
WHERE NOT EXISTS (
    SELECT 1 FROM "CompanyPatientRelation" cpr WHERE cpr."patientId" = p.id
);

-- 12. UserAccount PATIENT (apenas órfãos)
DELETE FROM "UserAccount" u
WHERE u.role = 'PATIENT'
  AND NOT EXISTS (SELECT 1 FROM "Patient" p WHERE p."userId" = u.id);

-- Reabilita FKs/triggers
SET session_replication_role = DEFAULT;

-- Verificação final
SELECT 'ExamInvite' as tabela, count(*) as total FROM "ExamInvite"
UNION ALL
SELECT 'ExamRequest', count(*) FROM "ExamRequest"
UNION ALL
SELECT 'ProcessoASO', count(*) FROM "ProcessoASO"
UNION ALL
SELECT 'ExamTimelineEvent', count(*) FROM "ExamTimelineEvent"
UNION ALL
SELECT 'Patient', count(*) FROM "Patient"
UNION ALL
SELECT 'UserAccount (PATIENT)', count(*) FROM "UserAccount" WHERE role = 'PATIENT';