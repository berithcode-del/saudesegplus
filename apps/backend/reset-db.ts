import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  Limpando banco de dados...');

  // Ordem importa por causa das FK constraints
  await prisma.examTimelineEvent.deleteMany();
  await prisma.asoDocument.deleteMany();
  await prisma.examResult.deleteMany();
  await prisma.teleconsultation.deleteMany();
  await prisma.queueEntry.deleteMany();
  await prisma.patientDocument.deleteMany();
  await prisma.anamnese.deleteMany();
  await prisma.examRequest.deleteMany();
  await prisma.examInvite.deleteMany();
  await prisma.financialTransaction.deleteMany();
  await prisma.calendarEvent.deleteMany();
  await prisma.companyPatientRelation.deleteMany();
  await prisma.companyDocument.deleteMany();
  await prisma.companyAdmin.deleteMany();
  await prisma.operator.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.company.deleteMany();
  await prisma.clinic.deleteMany();
  await prisma.userAccount.deleteMany();
  await prisma.servicePrice.deleteMany();
  await prisma.financialConfig.deleteMany();

  console.log('✅ Banco limpo!');

  // Recria o admin root
  const passwordHash = await bcrypt.hash('admin', 10);
  await prisma.userAccount.create({
    data: {
      email: 'admin@saudeseg.com',
      passwordHash,
      role: 'ADMIN',
    },
  });

  console.log('✅ Admin criado: admin@saudeseg.com / admin');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
