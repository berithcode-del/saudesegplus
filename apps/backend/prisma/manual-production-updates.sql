-- Safe to run repeatedly in the Supabase SQL Editor.
-- Completes the payment, operator, and duplicate-collection migrations.

DO $$ BEGIN
  CREATE TYPE "PaymentFlow" AS ENUM ('COMPANY_INVITE', 'CLINIC_WALK_IN');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "PriceItemCategory" AS ENUM ('ASO', 'EXAM', 'SPECIAL_CLEARANCE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "ExamItemPrice" (
  "id" TEXT PRIMARY KEY, "code" TEXT NOT NULL, "name" TEXT NOT NULL,
  "category" "PriceItemCategory" NOT NULL, "amount" DOUBLE PRECISION NOT NULL,
  "clinicFeePercent" DOUBLE PRECISION NOT NULL DEFAULT 30.0,
  "doctorFeePercent" DOUBLE PRECISION NOT NULL DEFAULT 40.0,
  "platformFeePercent" DOUBLE PRECISION NOT NULL DEFAULT 30.0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE IF NOT EXISTS "Payment" (
  "id" TEXT PRIMARY KEY, "flow" "PaymentFlow" NOT NULL,
  "status" "PaymentStatus" NOT NULL DEFAULT 'PENDENTE',
  "amount" DOUBLE PRECISION NOT NULL, "method" TEXT, "companyId" TEXT,
  "clinicId" TEXT, "quoteSnapshot" TEXT NOT NULL, "checkoutPayload" TEXT,
  "externalId" TEXT, "confirmedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

ALTER TABLE "ExamInvite" ADD COLUMN IF NOT EXISTS "paymentId" TEXT;
ALTER TABLE "ExamRequest" ADD COLUMN IF NOT EXISTS "paymentId" TEXT;
ALTER TABLE "FinancialTransaction" ADD COLUMN IF NOT EXISTS "paymentId" TEXT;
ALTER TABLE "Operator" ADD COLUMN IF NOT EXISTS "name" TEXT;

UPDATE "Operator"
SET "name" = COALESCE(NULLIF(split_part((SELECT "email" FROM "UserAccount" WHERE "UserAccount"."id" = "Operator"."userId"), '@', 1), ''), 'Operador')
WHERE "name" IS NULL;
ALTER TABLE "Operator" ALTER COLUMN "name" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "ExamItemPrice_code_key" ON "ExamItemPrice"("code");
CREATE INDEX IF NOT EXISTS "ExamItemPrice_category_isActive_idx" ON "ExamItemPrice"("category", "isActive");
CREATE UNIQUE INDEX IF NOT EXISTS "Payment_externalId_key" ON "Payment"("externalId");
CREATE INDEX IF NOT EXISTS "Payment_companyId_status_idx" ON "Payment"("companyId", "status");
CREATE INDEX IF NOT EXISTS "Payment_clinicId_status_idx" ON "Payment"("clinicId", "status");
CREATE UNIQUE INDEX IF NOT EXISTS "ExamInvite_paymentId_key" ON "ExamInvite"("paymentId");
CREATE UNIQUE INDEX IF NOT EXISTS "ExamRequest_paymentId_key" ON "ExamRequest"("paymentId");
CREATE UNIQUE INDEX IF NOT EXISTS "ExamResult_requestId_typeId_key" ON "ExamResult"("requestId", "typeId");

INSERT INTO "ExamItemPrice" ("id", "code", "name", "category", "amount", "clinicFeePercent", "doctorFeePercent", "platformFeePercent", "isActive", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'ASO', 'ASO ocupacional', 'ASO', 80.00, 30.0, 40.0, 30.0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'audiometria', 'Audiometria', 'EXAM', 45.00, 35.0, 40.0, 25.0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'espirometria', 'Espirometria', 'EXAM', 55.00, 35.0, 40.0, 25.0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'acuidade_visual', 'Acuidade visual', 'EXAM', 35.00, 35.0, 40.0, 25.0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'eletrocardiograma', 'Eletrocardiograma', 'EXAM', 65.00, 35.0, 40.0, 25.0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'eletroencefalograma', 'Eletroencefalograma', 'EXAM', 90.00, 35.0, 40.0, 25.0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'radiografia_torax', 'Radiografia de torax', 'EXAM', 75.00, 35.0, 40.0, 25.0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'exames_laboratoriais', 'Exames laboratoriais', 'EXAM', 70.00, 35.0, 40.0, 25.0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'psicossocial', 'Avaliacao psicossocial', 'EXAM', 110.00, 30.0, 45.0, 25.0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'pa', 'Pressao arterial', 'EXAM', 15.00, 40.0, 35.0, 25.0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'peso_altura', 'Peso e altura', 'EXAM', 15.00, 40.0, 35.0, 25.0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'glicemia', 'Glicemia', 'EXAM', 25.00, 35.0, 40.0, 25.0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;

DO $$ BEGIN
  ALTER TABLE "Payment" ADD CONSTRAINT "Payment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "Payment" ADD CONSTRAINT "Payment_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "ExamInvite" ADD CONSTRAINT "ExamInvite_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "ExamRequest" ADD CONSTRAINT "ExamRequest_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "FinancialTransaction" ADD CONSTRAINT "FinancialTransaction_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
