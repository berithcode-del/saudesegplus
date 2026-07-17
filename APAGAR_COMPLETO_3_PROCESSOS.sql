-- APAGAR COMPLETAMENTE os 3 processos (Yarin, Marco, Jessica) - SEM NADA SOBRAR
-- IRREVERSÍVEL - apaga TUDO: ExamRequest, Patient, AsoDocument, ExamResult, PatientDocument, etc.

-- IDs dos ExamRequest (do resultado anterior)
-- b0f12c81-2b3e-4259-beb5-33a80a5d569c (Marco)
-- 2cf245dd-905b-4fd5-83da-713820c925e3 (Yarin)
-- (Jessica - precisa pegar o ID)

-- Ordem correta: apagar filhos primeiro, depois pai

-- 1. PatientDocument
DELETE FROM "PatientDocument" 
WHERE "requestId" IN (
  SELECT er.id FROM "ExamRequest" er 
  JOIN "Patient" p ON er."patientId" = p.id
  WHERE p.name ILIKE '%yarin%' 
     OR p.name ILIKE '%marco%' 
     OR p.name ILIKE '%jessica%'
);

-- 2. AsoDocument
DELETE FROM "AsoDocument" 
WHERE "requestId" IN (
  SELECT er.id FROM "ExamRequest" er 
  JOIN "Patient" p ON er."patientId" = p.id
  WHERE p.name ILIKE '%yarin%' 
     OR p.name ILIKE '%marco%' 
     OR p.name ILIKE '%jessica%'
);

-- 3. ExamResult
DELETE FROM "ExamResult" 
WHERE "requestId" IN (
  SELECT er.id FROM "ExamRequest" er 
  JOIN "Patient" p ON er."patientId" = p.id
  WHERE p.name ILIKE '%yarin%' 
     OR p.name ILIKE '%marco%' 
     OR p.name ILIKE '%jessica%'
);

-- 4. ExamTimelineEvent
DELETE FROM "ExamTimelineEvent" 
WHERE "examRequestId" IN (
  SELECT er.id FROM "ExamRequest" er 
  JOIN "Patient" p ON er."patientId" = p.id
  WHERE p.name ILIKE '%yarin%' 
     OR p.name ILIKE '%marco%' 
     OR p.name ILIKE '%jessica%'
);

-- 5. QueueEntry
DELETE FROM "QueueEntry" 
WHERE "requestId" IN (
  SELECT er.id FROM "ExamRequest" er 
  JOIN "Patient" p ON er."patientId" = p.id
  WHERE p.name ILIKE '%yarin%' 
     OR p.name ILIKE '%marco%' 
     OR p.name ILIKE '%jessica%'
);

-- 6. Teleconsultation
DELETE FROM "Teleconsultation" 
WHERE "requestId" IN (
  SELECT er.id FROM "ExamRequest" er 
  JOIN "Patient" p ON er."patientId" = p.id
  WHERE p.name ILIKE '%yarin%' 
     OR p.name ILIKE '%marco%' 
     OR p.name ILIKE '%jessica%'
);

-- 7. FinancialTransaction
DELETE FROM "FinancialTransaction" 
WHERE "examRequestId" IN (
  SELECT er.id FROM "ExamRequest" er 
  JOIN "Patient" p ON er."patientId" = p.id
  WHERE p.name ILIKE '%yarin%' 
     OR p.name ILIKE '%marco%' 
     OR p.name ILIKE '%jessica%'
);

-- 8. ExamRequest (o principal)
DELETE FROM "ExamRequest" 
WHERE id IN (
  SELECT er.id FROM "ExamRequest" er 
  JOIN "Patient" p ON er."patientId" = p.id
  WHERE p.name ILIKE '%yarin%' 
     OR p.name ILIKE '%marco%' 
     OR p.name ILIKE '%jessica%'
);

-- 9. Patient (apaga os 3 pacientes completamente)
DELETE FROM "Patient" 
WHERE name ILIKE '%yarin%' 
   OR name ILIKE '%marco%' 
   OR name ILIKE '%jessica%';