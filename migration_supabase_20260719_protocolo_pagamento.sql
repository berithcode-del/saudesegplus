-- ============================================================
-- MIGRAÇÃO: Mover criação do protocolo para o momento do pagamento
-- Execute no Supabase SQL Editor (pode rodar tudo de uma vez)
-- Data: 2026-07-19
-- ============================================================

-- ============================================================
-- PASSO 0: ADICIONAR VALORES AO ENUM StatusProtocolo
-- ============================================================
-- Execute estes PRIMEIRO (um por vez se der erro "already exists")

ALTER TYPE "StatusProtocolo" ADD VALUE 'INICIADO';
ALTER TYPE "StatusProtocolo" ADD VALUE 'EM_PROGRESSO';
ALTER TYPE "StatusProtocolo" ADD VALUE 'FINALIZADO';

-- Se der erro "value already exists", ignore e continue.

-- ============================================================
-- PASSO 1: TABELA processos_aso (ProcessoASO)
-- ============================================================

-- 1.1 Adicionar invite_id (FK para ExamInvite) - TEXT, nullable, unique
ALTER TABLE "processos_aso" 
ADD COLUMN IF NOT EXISTS "invite_id" TEXT;

-- Unique constraint para invite_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'processos_aso_invite_id_key'
    ) THEN
        ALTER TABLE "processos_aso" 
        ADD CONSTRAINT "processos_aso_invite_id_key" UNIQUE ("invite_id");
    END IF;
END $$;

-- 1.2 Tornar paciente_id nullable (permite criar protocolo antes do paciente existir)
ALTER TABLE "processos_aso" 
ALTER COLUMN "paciente_id" DROP NOT NULL;

-- 1.3 Adicionar FK invite_id -> ExamInvite (TEXT -> TEXT)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'processos_aso_invite_id_fkey'
    ) THEN
        ALTER TABLE "processos_aso"
        ADD CONSTRAINT "processos_aso_invite_id_fkey" 
        FOREIGN KEY ("invite_id") REFERENCES "ExamInvite"("id") 
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- 1.4 Índice para invite_id
CREATE INDEX IF NOT EXISTS "processos_aso_invite_id_idx" ON "processos_aso"("invite_id");

-- 1.5 Mudar default do status para 'INICIADO'
ALTER TABLE "processos_aso" 
ALTER COLUMN "status" SET DEFAULT 'INICIADO';

-- 1.6 Atualizar registros existentes sem paciente para INICIADO
UPDATE "processos_aso" 
SET "status" = 'INICIADO' 
WHERE "status" = 'AGUARDANDO_COLETA' 
  AND "paciente_id" IS NULL;

-- ============================================================
-- 2. TABELA ExamInvite
-- ============================================================

-- 2.1 Adicionar processoAsoId (FK para ProcessoASO) - TEXT
ALTER TABLE "ExamInvite" 
ADD COLUMN IF NOT EXISTS "processoAsoId" TEXT;

-- Unique constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'ExamInvite_processoASoId_key'
    ) THEN
        ALTER TABLE "ExamInvite" 
        ADD CONSTRAINT "ExamInvite_processoASoId_key" UNIQUE ("processoAsoId");
    END IF;
END $$;

-- 2.2 FK processoAsoId -> processos_aso (TEXT -> TEXT)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'ExamInvite_processoASoId_fkey'
    ) THEN
        ALTER TABLE "ExamInvite"
        ADD CONSTRAINT "ExamInvite_processoASoId_fkey" 
        FOREIGN KEY ("processoAsoId") REFERENCES "processos_aso"("id") 
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- ============================================================
-- 3. MIGRAÇÃO DE DADOS EXISTENTES
-- ============================================================

-- 3.1 Migrar registros órfãos (sem paciente) de AGUARDANDO_COLETA para INICIADO
UPDATE "processos_aso" 
SET "status" = 'INICIADO' 
WHERE "status" = 'AGUARDANDO_COLETA' 
  AND "paciente_id" IS NULL;

-- ============================================================
-- 4. VERIFICAÇÃO PÓS-MIGRAÇÃO
-- ============================================================

-- Verificar estrutura final
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name IN ('processos_aso', 'ExamInvite')
  AND column_name IN ('invite_id', 'processoAsoId', 'paciente_id', 'status')
ORDER BY table_name, column_name;

-- Verificar foreign keys
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('processos_aso', 'ExamInvite')
  AND kcu.column_name IN ('invite_id', 'processoAsoId');

-- Verificar enum StatusProtocolo
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = 'StatusProtocolo'::regtype 
ORDER BY enumsortorder;

-- ============================================================
-- FIM DA MIGRAÇÃO
-- ============================================================