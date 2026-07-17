-- Migration: Add Protocolo ASO (ProcessoASO)
-- Execute este SQL no SQL Editor do Supabase

-- 1. Criar enums
CREATE TYPE "StatusProtocolo" AS ENUM (
  'AGUARDANDO_COLETA', 
  'EM_COLETA', 
  'NA_FILA_MEDICA', 
  'EM_ATENDIMENTO', 
  'DOCUMENTOS_PENDENTES', 
  'CONCLUIDO', 
  'CANCELADO'
);

CREATE TYPE "TipoExame" AS ENUM (
  'ADMISSIONAL', 
  'PERIODICO', 
  'DEMISSIONAL', 
  'MUDANCA_FUNCAO', 
  'RETORNO_TRABALHO'
);

-- 2. Criar tabela processos_aso
CREATE TABLE "processos_aso" (
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

-- 3. Índices para performance
CREATE INDEX "processos_aso_empresa_id_idx" ON "processos_aso"("empresa_id");
CREATE INDEX "processos_aso_clinica_id_idx" ON "processos_aso"("clinica_id");
CREATE INDEX "processos_aso_paciente_id_idx" ON "processos_aso"("paciente_id");
CREATE INDEX "processos_aso_medico_id_idx" ON "processos_aso"("medico_id");
CREATE INDEX "processos_aso_status_idx" ON "processos_aso"("status");
CREATE INDEX "processos_aso_numero_protocolo_idx" ON "processos_aso"("numero_protocolo");

-- 4. Foreign key de processos_aso.exam_request_id -> exam_request.id
ALTER TABLE "processos_aso" 
  ADD CONSTRAINT "processos_aso_exam_request_id_fkey" 
  FOREIGN KEY ("exam_request_id") REFERENCES "exam_request"("id") ON DELETE SET NULL;

-- 5. Adicionar coluna em exam_request (opcional para compatibilidade com legados)
ALTER TABLE "exam_request" ADD COLUMN "processo_aso_id" UUID UNIQUE;

-- 6. Foreign key de exam_request.processo_aso_id -> processos_aso.id
ALTER TABLE "exam_request" 
  ADD CONSTRAINT "exam_request_processo_aso_id_fkey" 
  FOREIGN KEY ("processo_aso_id") REFERENCES "processos_aso"("id") ON DELETE SET NULL;

-- 7. Trigger para updated_at (opcional - Prisma gerencia via @updatedAt)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_processos_aso_updated_at
  BEFORE UPDATE ON "processos_aso"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();