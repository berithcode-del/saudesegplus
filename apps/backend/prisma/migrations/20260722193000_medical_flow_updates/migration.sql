ALTER TABLE "Doctor"
  ADD COLUMN IF NOT EXISTS "signatureProvider" TEXT DEFAULT 'MOCK';

ALTER TABLE "AsoDocument"
  ADD COLUMN IF NOT EXISTS "signatureProvider" TEXT,
  ADD COLUMN IF NOT EXISTS "certificateThumbprint" TEXT,
  ADD COLUMN IF NOT EXISTS "signaturePolicy" TEXT,
  ADD COLUMN IF NOT EXISTS "signatureTimestamp" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "Patient_name_idx" ON "Patient"("name");

CREATE TABLE IF NOT EXISTS "DoctorCertificate" (
  "id" TEXT NOT NULL,
  "doctorId" TEXT NOT NULL,
  "providerName" TEXT NOT NULL,
  "certificateThumbprint" TEXT NOT NULL,
  "certificateSubjectDN" TEXT NOT NULL,
  "issuerDN" TEXT NOT NULL,
  "validFrom" TIMESTAMP(3) NOT NULL,
  "validUntil" TIMESTAMP(3) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DoctorCertificate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "DoctorCertificate_certificateThumbprint_key"
  ON "DoctorCertificate"("certificateThumbprint");
CREATE INDEX IF NOT EXISTS "DoctorCertificate_doctorId_status_idx"
  ON "DoctorCertificate"("doctorId", "status");
ALTER TABLE "DoctorCertificate"
  ADD CONSTRAINT "DoctorCertificate_doctorId_fkey"
  FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "SignatureAudit" (
  "id" TEXT NOT NULL,
  "doctorId" TEXT NOT NULL,
  "providerName" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "documentId" TEXT,
  "metadata" JSONB,
  "ipAddress" TEXT,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SignatureAudit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "SignatureAudit_doctorId_occurredAt_idx"
  ON "SignatureAudit"("doctorId", "occurredAt");
ALTER TABLE "SignatureAudit"
  ADD CONSTRAINT "SignatureAudit_doctorId_fkey"
  FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "OperatorConversation" (
  "id" TEXT NOT NULL,
  "title" TEXT,
  "isGroup" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OperatorConversation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "OperatorConversation_updatedAt_idx"
  ON "OperatorConversation"("updatedAt");

CREATE TABLE IF NOT EXISTS "OperatorConversationParticipant" (
  "id" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" "Role" NOT NULL,
  "displayName" TEXT,
  "lastReadAt" TIMESTAMP(3),
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OperatorConversationParticipant_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "OperatorConversationParticipant_conversationId_userId_key"
  ON "OperatorConversationParticipant"("conversationId", "userId");
CREATE INDEX IF NOT EXISTS "OperatorConversationParticipant_userId_idx"
  ON "OperatorConversationParticipant"("userId");
ALTER TABLE "OperatorConversationParticipant"
  ADD CONSTRAINT "OperatorConversationParticipant_conversationId_fkey"
  FOREIGN KEY ("conversationId") REFERENCES "OperatorConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "OperatorMessage" (
  "id" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "authorName" TEXT,
  "content" TEXT NOT NULL,
  "attachments" TEXT[],
  "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OperatorMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "OperatorMessage_conversationId_sentAt_idx"
  ON "OperatorMessage"("conversationId", "sentAt");
ALTER TABLE "OperatorMessage"
  ADD CONSTRAINT "OperatorMessage_conversationId_fkey"
  FOREIGN KEY ("conversationId") REFERENCES "OperatorConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "Notification" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "targetId" TEXT,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Notification_userId_readAt_idx"
  ON "Notification"("userId", "readAt");

ALTER TYPE "TimelineEventType" ADD VALUE IF NOT EXISTS 'TELECONSULTA_BLOQUEADA';
