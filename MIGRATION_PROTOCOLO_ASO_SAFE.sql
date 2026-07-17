-- Migration: Add Protocolo ASO (ProcessoASO) - Safe Version
-- Execute no SQL Editor do Supabase

-- 1. Criar enums (se não existirem)
DO $$ 
BEGIN
    CREATE TYPE "StatusProtocolo" AS ENUM (
      'AGUARDANDO_COLETA', 
      'EM_COLETA', 
      'NA_FILA_MEDICA', 
      'EM_ATENDIMENTO', 
      'DOCUMENTOS_PENDENTES', 
      'CONCLUIDO', 
      'CANCELADO'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
    CREATE TYPE "TipoExame" AS ENUM (
      'ADMISSIONAL', 
      'PERIODICO', 
      'DEMISSIONAL', 
      'MUDANCA_FUNCAO', 
      'RETORNO_TRABALHO'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Criar tabela processos_aso (se não existir)
CREATE TABLE IF NOT EXISTS "processos_aso" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "numero_protocolo" VARCHAR(255) NOT NULL UNIQUE,
  "empresa_id" VARCHAR(255) NOT NULL,
  "clinica_id" VARCHAR(255),
  "paciente_id" VARCHAR(255) NOT NULL,
  "medico_id" VARCHAR(255),
  "exam_request_id" UUID UNIQUE,
  "status" "StatusProtocolo" NOT NULL DEFAULT 'AGUARDANDO_COLETA',
  "tipo_exame" "TipoExame" NOT NULL,
  "data_abertura" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "data_conclusao" TIMESTAMPTZ,
  "documentos" JSONB NOT NULL DEFAULT '[]',
  "historico" JSONB NOT NULL DEFAULT '[]',
  "observacoes" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Índices
DO $$ 
BEGIN
    CREATE INDEX "processos_aso_empresa_id_idx" ON "processos_aso"("empresa_id");
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

DO $$ 
BEGIN
    CREATE INDEX "processos_aso_clinica_id_idx" ON "processos_aso"("clinica_id");
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

DO $$ 
BEGIN
    CREATE INDEX "processos_aso_paciente_id_idx" ON "processos_aso"("paciente_id");
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

DO $$ 
BEGIN
    CREATE INDEX "processos_aso_medico_id_idx" ON "processos_aso"("medico_id");
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

DO $$ 
BEGIN
    CREATE INDEX "processos_aso_status_idx" ON "processos_aso"("status");
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

DO $$ 
BEGIN
    CREATE INDEX "processos_aso_numero_protocolo_idx" ON "processos_aso"("numero_protocolo");
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

-- 3. Foreign key processos_aso.exam_request_id -> "ExamRequest".id
DO $$ 
BEGIN
    ALTER TABLE "processos_aso" 
    ADD CONSTRAINT "processos_aso_exam_request_id_fkey" 
    FOREIGN KEY ("exam_request_id") REFERENCES "ExamRequest"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 4. Adicionar coluna em ExamRequest (se não existir)
DO $$ 
BEGIN
    ALTER TABLE "ExamRequest" ADD COLUMN "processo_aso_id" UUID UNIQUE;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- 4. Foreign key ExamRequest.processo_aso_id -> processos_aso.id
DO $$ 
BEGIN
    ALTER TABLE "ExamRequest" 
    ADD CONSTRAINT "exam_request_processo_aso_id_fkey" 
    FOREIGN KEY ("processo_aso_id") REFERENCES "processos_aso"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END; $$;

DO $$ 
BEGIN
    CREATE TRIGGER update_processos_aso_updated_at
      BEFORE UPDATE ON "processos_aso"
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;