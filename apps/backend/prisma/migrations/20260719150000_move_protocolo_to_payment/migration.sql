-- Migration: move protocolo creation to payment + simplify status
-- Created at: 2026-07-19 15:00:00

-- 1. Add inviteId to ProcessoASO
ALTER TABLE "processos_aso" ADD COLUMN "invite_id" UUID;
ALTER TABLE "processos_aso" ADD CONSTRAINT "processos_aso_invite_id_key" UNIQUE ("invite_id");
ALTER TABLE "processos_aso" ADD CONSTRAINT "processos_aso_invite_id_fkey" FOREIGN KEY ("invite_id") REFERENCES "ExamInvite"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 2. Make pacienteId nullable
ALTER TABLE "processos_aso" ALTER COLUMN "paciente_id" DROP NOT NULL;

-- 3. Add processoAsoId to ExamInvite
ALTER TABLE "ExamInvite" ADD COLUMN "processoAsoId" UUID;
ALTER TABLE "ExamInvite" ADD CONSTRAINT "ExamInvite_processoAsoId_key" UNIQUE ("processoAsoId");
ALTER TABLE "ExamInvite" ADD CONSTRAINT "ExamInvite_processoAsoId_fkey" FOREIGN KEY ("processoAsoId") REFERENCES "processos_aso"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 4. Change default status from AGUARDANDO_COLETA to INICIADO
ALTER TABLE "processos_aso" ALTER COLUMN "status" SET DEFAULT 'INICIADO';

-- 5. Update existing records: change AGUARDANDO_COLETA to INICIADO (only for records without pacienteId)
UPDATE "processos_aso" SET "status" = 'INICIADO' WHERE "status" = 'AGUARDANDO_COLETA' AND "paciente_id" IS NULL;

-- 6. Create indexes
CREATE INDEX IF NOT EXISTS "processos_aso_invite_id_idx" ON "processos_aso"("invite_id");