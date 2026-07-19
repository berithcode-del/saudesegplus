-- ============================================================
-- LIMPEZA DE DADOS DE TESTE - SaudeSeg+
-- Execute no Supabase SQL Editor
-- Data: 2026-07-19
-- ============================================================

-- CPFs de teste identificados na interface
-- 00000000001 (teste2)
-- 00000000000 (a)
-- 08745068916 (teste teste)
-- 07651116903 (jessica fernanda dos santos)
-- 08745068917 (Marco antonio dos santos)

-- Nomes de teste identificados
-- 'teste2', 'a', 'teste teste', 'jessica fernanda dos santos', 'Marco antonio dos santos'

-- ============================================================
-- PASSO 1: Identificar IDs a serem removidos
-- ============================================================

-- NOTA: Todos os IDs no banco são TEXT (String com UUID), não UUID nativo.
-- Prisma: String @id @default(uuid()) → armazena como TEXT no PostgreSQL.

DO $$
DECLARE
    test_cpfs TEXT[] := ARRAY['00000000001', '00000000000', '08745068916', '07651116903', '08745068917'];
    test_names TEXT[] := ARRAY['teste2', 'a', 'teste teste', 'jessica fernanda dos santos', 'Marco antonio dos santos'];
    patient_ids TEXT[];        -- Patient.id é TEXT
    invite_ids TEXT[];         -- ExamInvite.id é TEXT
    exam_request_ids TEXT[];   -- ExamRequest.id é TEXT
    processo_aso_ids TEXT[];   -- ProcessoASO.id é TEXT
    user_account_ids TEXT[];   -- UserAccount.id é TEXT
BEGIN
    -- Buscar patients com CPFs de teste
    SELECT array_agg(id) INTO patient_ids
    FROM "Patient"
    WHERE cpf = ANY(test_cpfs) OR name = ANY(test_names);

    RAISE NOTICE 'Patients a remover: %', patient_ids;

    -- Buscar UserAccount IDs vinculados a esses patients
    SELECT array_agg("userId") INTO user_account_ids
    FROM "Patient"
    WHERE cpf = ANY(test_cpfs) OR name = ANY(test_names);

    RAISE NOTICE 'UserAccounts a remover: %', user_account_ids;

    -- Buscar ExamInvites ligados a esses CPFs/nomes (via expectedCpf ou collaboratorName)
    SELECT array_agg(id) INTO invite_ids
    FROM "ExamInvite"
    WHERE "expectedCpf" = ANY(test_cpfs)
       OR "collaboratorName" = ANY(test_names);

    RAISE NOTICE 'ExamInvites a remover: %', invite_ids;

    -- Buscar ExamRequests ligados a esses patients (patientId é TEXT) OU a esses invites (inviteId é TEXT)
    SELECT array_agg(id) INTO exam_request_ids
    FROM "ExamRequest"
    WHERE "patientId" = ANY(patient_ids)
       OR "inviteId" = ANY(invite_ids);

    RAISE NOTICE 'ExamRequests a remover: %', exam_request_ids;

    -- Buscar ProcessoASO ligados a esses invites OU examRequests
    SELECT array_agg(id) INTO processo_aso_ids
    FROM "ProcessoASO"
    WHERE "inviteId" = ANY(invite_ids)
       OR "examRequestId" = ANY(exam_request_ids);

    RAISE NOTICE 'ProcessoASO a remover: %', processo_aso_ids;

    -- ============================================================
    -- PASSO 2: Deletar em ordem (respeitando FKs)
    -- ============================================================

    -- 2.1 ExamTimelineEvent (FK para inviteId TEXT, examRequestId TEXT)
    IF invite_ids IS NOT NULL AND array_length(invite_ids, 1) > 0 THEN
        DELETE FROM "ExamTimelineEvent" WHERE "inviteId" = ANY(invite_ids);
        RAISE NOTICE 'ExamTimelineEvent (invite) deletados';
    END IF;

    IF exam_request_ids IS NOT NULL AND array_length(exam_request_ids, 1) > 0 THEN
        DELETE FROM "ExamTimelineEvent" WHERE "examRequestId" = ANY(exam_request_ids);
        RAISE NOTICE 'ExamTimelineEvent (examRequest) deletados';
    END IF;

    -- 2.2 ExamResult (FK para requestId TEXT)
    IF exam_request_ids IS NOT NULL AND array_length(exam_request_ids, 1) > 0 THEN
        DELETE FROM "ExamResult" WHERE "requestId" = ANY(exam_request_ids);
        RAISE NOTICE 'ExamResult deletados';
    END IF;

    -- 2.3 QueueEntry (FK para requestId TEXT)
    IF exam_request_ids IS NOT NULL AND array_length(exam_request_ids, 1) > 0 THEN
        DELETE FROM "QueueEntry" WHERE "requestId" = ANY(exam_request_ids);
        RAISE NOTICE 'QueueEntry deletados';
    END IF;

    -- 2.4 Teleconsultation (FK para requestId TEXT)
    IF exam_request_ids IS NOT NULL AND array_length(exam_request_ids, 1) > 0 THEN
        DELETE FROM "Teleconsultation" WHERE "requestId" = ANY(exam_request_ids);
        RAISE NOTICE 'Teleconsultation deletados';
    END IF;

    -- 2.5 FinancialTransaction (FK para requestId TEXT)
    IF exam_request_ids IS NOT NULL AND array_length(exam_request_ids, 1) > 0 THEN
        DELETE FROM "FinancialTransaction" WHERE "requestId" = ANY(exam_request_ids);
        RAISE NOTICE 'FinancialTransaction deletados';
    END IF;

    -- 2.6 PatientDocument (FK para patientId TEXT)
    IF patient_ids IS NOT NULL AND array_length(patient_ids, 1) > 0 THEN
        DELETE FROM "PatientDocument" WHERE "patientId" = ANY(patient_ids);
        RAISE NOTICE 'PatientDocument deletados';
    END IF;

    -- 2.7 AsoDocument (FK para requestId TEXT)
    IF exam_request_ids IS NOT NULL AND array_length(exam_request_ids, 1) > 0 THEN
        DELETE FROM "AsoDocument" WHERE "requestId" = ANY(exam_request_ids);
        RAISE NOTICE 'AsoDocument deletados';
    END IF;

    -- 2.8 ExamRequest
    IF exam_request_ids IS NOT NULL AND array_length(exam_request_ids, 1) > 0 THEN
        DELETE FROM "ExamRequest" WHERE id = ANY(exam_request_ids);
        RAISE NOTICE 'ExamRequest deletados';
    END IF;

    -- 2.9 ProcessoASO
    IF processo_aso_ids IS NOT NULL AND array_length(processo_aso_ids, 1) > 0 THEN
        DELETE FROM "ProcessoASO" WHERE id = ANY(processo_aso_ids);
        RAISE NOTICE 'ProcessoASO deletados';
    END IF;

    -- 2.10 ExamInvite
    IF invite_ids IS NOT NULL AND array_length(invite_ids, 1) > 0 THEN
        DELETE FROM "ExamInvite" WHERE id = ANY(invite_ids);
        RAISE NOTICE 'ExamInvite deletados';
    END IF;

    -- 2.11 Patient + relações
    IF patient_ids IS NOT NULL AND array_length(patient_ids, 1) > 0 THEN
        -- Remover CompanyPatientRelation primeiro
        DELETE FROM "CompanyPatientRelation" WHERE "patientId" = ANY(patient_ids);
        -- Remover Anamnese
        DELETE FROM "Anamnese" WHERE "patientId" = ANY(patient_ids);
        -- Remover UserAccount vinculado
        DELETE FROM "UserAccount" WHERE id = ANY(user_account_ids);
        -- Remover Patient
        DELETE FROM "Patient" WHERE id = ANY(patient_ids);
        RAISE NOTICE 'Patient + relações deletados';
    END IF;

    RAISE NOTICE 'LIMPEZA CONCLUÍDA COM SUCESSO';
END $$;

-- ============================================================
-- PASSO 3: Verificação pós-limpeza
-- ============================================================

-- Contar registros restantes de teste
SELECT 'Patients restantes' as tabela, count(*) as total
FROM "Patient"
WHERE cpf IN ('00000000001', '00000000000', '08745068916', '07651116903', '08745068917')
   OR name IN ('teste2', 'a', 'teste teste', 'jessica fernanda dos santos', 'Marco antonio dos santos')

UNION ALL

SELECT 'ExamInvites restantes', count(*)
FROM "ExamInvite"
WHERE "expectedCpf" IN ('00000000001', '00000000000', '08745068916', '07651116903', '08745068917')
   OR "collaboratorName" IN ('teste2', 'a', 'teste teste', 'jessica fernanda dos santos', 'Marco antonio dos santos')

UNION ALL

SELECT 'ExamRequests restantes', count(*)
FROM "ExamRequest" er
JOIN "Patient" p ON er."patientId" = p.id
WHERE p.cpf IN ('00000000001', '00000000000', '08745068916', '07651116903', '08745068917')
   OR p.name IN ('teste2', 'a', 'teste teste', 'jessica fernanda dos santos', 'Marco antonio dos santos')

UNION ALL

SELECT 'ProcessoASO restantes', count(*)
FROM "ProcessoASO"
WHERE "inviteId" IN (
    SELECT id FROM "ExamInvite"
    WHERE "expectedCpf" IN ('00000000001', '00000000000', '08745068916', '07651116903', '08745068917')
       OR "collaboratorName" IN ('teste2', 'a', 'teste teste', 'jessica fernanda dos santos', 'Marco antonio dos santos')
)
   OR "examRequestId" IN (
    SELECT er.id FROM "ExamRequest" er
    JOIN "Patient" p ON er."patientId" = p.id
    WHERE p.cpf IN ('00000000001', '00000000000', '08745068916', '07651116903', '08745068917')
       OR p.name IN ('teste2', 'a', 'teste teste', 'jessica fernanda dos santos', 'Marco antonio dos santos')
);

-- ============================================================
-- FIM DA LIMPEZA
-- ============================================================