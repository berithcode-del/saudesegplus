CREATE TYPE "PaymentFlow" AS ENUM ('COMPANY_INVITE', 'CLINIC_WALK_IN');
CREATE TYPE "PriceItemCategory" AS ENUM ('ASO', 'EXAM', 'SPECIAL_CLEARANCE');

CREATE TABLE "ExamItemPrice" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "category" "PriceItemCategory" NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "clinicFeePercent" DOUBLE PRECISION NOT NULL DEFAULT 30.0,
  "doctorFeePercent" DOUBLE PRECISION NOT NULL DEFAULT 40.0,
  "platformFeePercent" DOUBLE PRECISION NOT NULL DEFAULT 30.0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ExamItemPrice_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Payment" (
  "id" TEXT NOT NULL,
  "flow" "PaymentFlow" NOT NULL,
  "status" "PaymentStatus" NOT NULL DEFAULT 'PENDENTE',
  "amount" DOUBLE PRECISION NOT NULL,
  "method" TEXT,
  "companyId" TEXT,
  "clinicId" TEXT,
  "quoteSnapshot" TEXT NOT NULL,
  "checkoutPayload" TEXT,
  "externalId" TEXT,
  "confirmedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ExamInvite" ADD COLUMN "paymentId" TEXT;
ALTER TABLE "ExamRequest" ADD COLUMN "paymentId" TEXT;
ALTER TABLE "FinancialTransaction" ADD COLUMN "paymentId" TEXT;

CREATE UNIQUE INDEX "ExamItemPrice_code_key" ON "ExamItemPrice"("code");
CREATE INDEX "ExamItemPrice_category_isActive_idx" ON "ExamItemPrice"("category", "isActive");
CREATE UNIQUE INDEX "Payment_externalId_key" ON "Payment"("externalId");
CREATE INDEX "Payment_companyId_status_idx" ON "Payment"("companyId", "status");
CREATE INDEX "Payment_clinicId_status_idx" ON "Payment"("clinicId", "status");
CREATE UNIQUE INDEX "ExamInvite_paymentId_key" ON "ExamInvite"("paymentId");
CREATE UNIQUE INDEX "ExamRequest_paymentId_key" ON "ExamRequest"("paymentId");

ALTER TABLE "Payment" ADD CONSTRAINT "Payment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ExamInvite" ADD CONSTRAINT "ExamInvite_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ExamRequest" ADD CONSTRAINT "ExamRequest_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FinancialTransaction" ADD CONSTRAINT "FinancialTransaction_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
