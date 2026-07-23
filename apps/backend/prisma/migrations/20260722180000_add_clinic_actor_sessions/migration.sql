CREATE TYPE "ClinicActorType" AS ENUM ('OPERATOR', 'DOCTOR', 'CLINIC_ADMIN');

ALTER TABLE "Operator"
  ADD COLUMN "operationalPinHash" TEXT,
  ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE "ClinicDoctor" (
  "id" TEXT NOT NULL,
  "clinicId" TEXT NOT NULL,
  "doctorId" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endedAt" TIMESTAMP(3),
  "operationalPinHash" TEXT,
  CONSTRAINT "ClinicDoctor_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClinicActorSession" (
  "id" TEXT NOT NULL,
  "clinicId" TEXT NOT NULL,
  "actorType" "ClinicActorType" NOT NULL,
  "actorId" TEXT NOT NULL,
  "actorName" TEXT NOT NULL,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "endedAt" TIMESTAMP(3),
  CONSTRAINT "ClinicActorSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClinicAuditEvent" (
  "id" TEXT NOT NULL,
  "clinicId" TEXT NOT NULL,
  "actorSessionId" TEXT,
  "actorType" "ClinicActorType" NOT NULL,
  "actorId" TEXT NOT NULL,
  "actorName" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "resourceType" TEXT NOT NULL,
  "resourceId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ClinicAuditEvent_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ExamResult"
  ADD COLUMN "performedByType" "ClinicActorType",
  ADD COLUMN "performedById" TEXT,
  ADD COLUMN "performedByName" TEXT,
  ADD COLUMN "actorSessionId" TEXT,
  ALTER COLUMN "collectedById" DROP NOT NULL;

ALTER TABLE "ExamResult"
  ALTER COLUMN "performedByType" SET DEFAULT 'OPERATOR',
  ALTER COLUMN "performedByType" SET NOT NULL,
  ALTER COLUMN "performedById" SET NOT NULL,
  ALTER COLUMN "performedByName" SET NOT NULL;

CREATE UNIQUE INDEX "ClinicDoctor_clinicId_doctorId_key" ON "ClinicDoctor"("clinicId", "doctorId");
CREATE INDEX "ClinicDoctor_clinicId_active_idx" ON "ClinicDoctor"("clinicId", "active");
CREATE INDEX "ClinicDoctor_doctorId_active_idx" ON "ClinicDoctor"("doctorId", "active");
CREATE INDEX "ClinicActorSession_clinicId_endedAt_idx" ON "ClinicActorSession"("clinicId", "endedAt");
CREATE INDEX "ClinicActorSession_actorType_actorId_idx" ON "ClinicActorSession"("actorType", "actorId");
CREATE INDEX "ClinicAuditEvent_clinicId_createdAt_idx" ON "ClinicAuditEvent"("clinicId", "createdAt");
CREATE INDEX "ClinicAuditEvent_resourceType_resourceId_idx" ON "ClinicAuditEvent"("resourceType", "resourceId");

ALTER TABLE "ClinicDoctor" ADD CONSTRAINT "ClinicDoctor_clinicId_fkey"
  FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ClinicDoctor" ADD CONSTRAINT "ClinicDoctor_doctorId_fkey"
  FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ClinicActorSession" ADD CONSTRAINT "ClinicActorSession_clinicId_fkey"
  FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ClinicAuditEvent" ADD CONSTRAINT "ClinicAuditEvent_clinicId_fkey"
  FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ClinicAuditEvent" ADD CONSTRAINT "ClinicAuditEvent_actorSessionId_fkey"
  FOREIGN KEY ("actorSessionId") REFERENCES "ClinicActorSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
