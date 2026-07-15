-- Add isMatriz field to Clinic model for hierarchical clinic structure (Matriz -> Filiais)
-- This enables the routing logic: Matriz -> City -> GPS -> Matriz fallback

ALTER TABLE "Clinic" ADD COLUMN "isMatriz" BOOLEAN NOT NULL DEFAULT false;

-- Create index for fast Matriz lookups
CREATE INDEX "Clinic_isMatriz_idx" ON "Clinic"("isMatriz");

-- Add parentClinicId for hierarchical relationship (Filial -> Matriz)
ALTER TABLE "Clinic" ADD COLUMN "parentClinicId" TEXT;

-- Add foreign key constraint for parentClinicId
ALTER TABLE "Clinic" ADD CONSTRAINT "Clinic_parentClinicId_fkey" FOREIGN KEY ("parentClinicId") REFERENCES "Clinic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create index for parentClinicId lookups
CREATE INDEX "Clinic_parentClinicId_idx" ON "Clinic"("parentClinicId");