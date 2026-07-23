DO $$
BEGIN
  CREATE TYPE "DataEnvironment" AS ENUM ('REAL', 'SANDBOX');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

ALTER TABLE "Clinic"
  ADD COLUMN IF NOT EXISTS "environment" "DataEnvironment" NOT NULL DEFAULT 'REAL';

ALTER TABLE "Doctor"
  ADD COLUMN IF NOT EXISTS "environment" "DataEnvironment" NOT NULL DEFAULT 'REAL';

ALTER TABLE "Company"
  ADD COLUMN IF NOT EXISTS "environment" "DataEnvironment" NOT NULL DEFAULT 'REAL';

ALTER TABLE "Patient"
  ADD COLUMN IF NOT EXISTS "environment" "DataEnvironment" NOT NULL DEFAULT 'REAL';

ALTER TABLE "ExamRequest"
  ADD COLUMN IF NOT EXISTS "environment" "DataEnvironment" NOT NULL DEFAULT 'REAL';

CREATE INDEX IF NOT EXISTS "Clinic_environment_isActive_idx"
  ON "Clinic"("environment", "isActive");

CREATE INDEX IF NOT EXISTS "Doctor_environment_verifiedAt_idx"
  ON "Doctor"("environment", "verifiedAt");

CREATE INDEX IF NOT EXISTS "Company_environment_status_idx"
  ON "Company"("environment", "status");

CREATE INDEX IF NOT EXISTS "Patient_environment_name_idx"
  ON "Patient"("environment", "name");

CREATE INDEX IF NOT EXISTS "ExamRequest_environment_status_idx"
  ON "ExamRequest"("environment", "status");
