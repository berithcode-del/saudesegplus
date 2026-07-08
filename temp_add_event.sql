-- Atualiza o enum no banco
ALTER TYPE "TimelineEventType" ADD VALUE 'COLABORADOR_CADASTRADO' AFTER 'CADASTRO_CONCLUIDO';

-- Remove coluna se existir (para evitar conflito)
ALTER TABLE "ExamTimelineEvent" DROP COLUMN IF EXISTS metadata;

-- Adiciona nova coluna para metadata
ALTER TABLE "ExamTimelineEvent" ADD COLUMN IF NOT EXISTS metadata TEXT;