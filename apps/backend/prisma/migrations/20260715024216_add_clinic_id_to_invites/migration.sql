-- AlterTable
ALTER TABLE "ExamInvite" ADD COLUMN     "clinicId" TEXT;

-- AddForeignKey
ALTER TABLE "ExamInvite" ADD CONSTRAINT "ExamInvite_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE SET NULL ON UPDATE CASCADE;
