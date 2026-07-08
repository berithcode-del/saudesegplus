import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const occupationalRisks = [
  { cboCode: '2141-05', functionName: 'Médico do Trabalho', riskGrade: 'baixo', requiredExams: ['audiometria', 'espirometria', 'acuidade_visual'], requiresInPerson: false, periodicFrequencyMonths: 12 },
  { cboCode: '2141-10', functionName: 'Médico Ocupacional', riskGrade: 'baixo', requiredExams: ['audiometria', 'espirometria', 'acuidade_visual'], requiresInPerson: false, periodicFrequencyMonths: 12 },
  { cboCode: '3221-05', functionName: 'Técnico em Segurança do Trabalho', riskGrade: 'medio', requiredExams: ['audiometria', 'espirometria', 'acuidade_visual', 'eletrocardiograma'], requiresInPerson: true, periodicFrequencyMonths: 12 },
  { cboCode: '3221-10', functionName: 'Técnico de Segurança do Trabalho', riskGrade: 'medio', requiredExams: ['audiometria', 'espirometria', 'acuidade_visual', 'eletrocardiograma'], requiresInPerson: true, periodicFrequencyMonths: 12 },
  { cboCode: '7111-05', functionName: 'Operador de Máquinas Fixas', riskGrade: 'alto', requiredExams: ['audiometria', 'espirometria', 'acuidade_visual', 'eletrocardiograma', 'eletroencefalograma'], requiresInPerson: true, periodicFrequencyMonths: 6 },
  { cboCode: '7112-10', functionName: 'Operador de Máquinas Móveis', riskGrade: 'alto', requiredExams: ['audiometria', 'espirometria', 'acuidade_visual', 'eletrocardiograma'], requiresInPerson: true, periodicFrequencyMonths: 6 },
  { cboCode: '7211-10', functionName: 'Moldador de Fundição', riskGrade: 'alto', requiredExams: ['audiometria', 'espirometria', 'acuidade_visual', 'radiografia_torax'], requiresInPerson: true, periodicFrequencyMonths: 6 },
  { cboCode: '7232-10', functionName: 'Soldador', riskGrade: 'alto', requiredExams: ['audiometria', 'espirometria', 'acuidade_visual', 'radiografia_torax', 'eletrocardiograma'], requiresInPerson: true, periodicFrequencyMonths: 6 },
  { cboCode: '7241-05', functionName: 'Mecânico de Manutenção', riskGrade: 'medio', requiredExams: ['audiometria', 'espirometria', 'acuidade_visual', 'eletrocardiograma'], requiresInPerson: true, periodicFrequencyMonths: 12 },
  { cboCode: '7242-10', functionName: 'Mecânico de Máquinas Industriais', riskGrade: 'medio', requiredExams: ['audiometria', 'espirometria', 'acuidade_visual', 'eletrocardiograma'], requiresInPerson: true, periodicFrequencyMonths: 12 },
  { cboCode: '7251-10', functionName: 'Eletricista de Manutenção', riskGrade: 'alto', requiredExams: ['audiometria', 'espirometria', 'acuidade_visual', 'eletrocardiograma', 'eletroencefalograma'], requiresInPerson: true, periodicFrequencyMonths: 12 },
  { cboCode: '7842-05', functionName: 'Operador de Processos Químicos', riskGrade: 'alto', requiredExams: ['audiometria', 'espirometria', 'acuidade_visual', 'radiografia_torax', 'exames_laboratoriais'], requiresInPerson: true, periodicFrequencyMonths: 6 },
  { cboCode: '8111-10', functionName: 'Operador de Caldeira', riskGrade: 'alto', requiredExams: ['audiometria', 'espirometria', 'acuidade_visual', 'eletrocardiograma', 'radiografia_torax'], requiresInPerson: true, periodicFrequencyMonths: 6 },
  { cboCode: '8131-05', functionName: 'Operador de Moagem', riskGrade: 'alto', requiredExams: ['audiometria', 'espirometria', 'acuidade_visual', 'radiografia_torax'], requiresInPerson: true, periodicFrequencyMonths: 6 },
  { cboCode: '8411-10', functionName: 'Motorista de Caminhão', riskGrade: 'medio', requiredExams: ['audiometria', 'espirometria', 'acuidade_visual', 'eletrocardiograma', 'psicossocial'], requiresInPerson: true, periodicFrequencyMonths: 12 },
  { cboCode: '8412-05', functionName: 'Motorista de Ônibus', riskGrade: 'medio', requiredExams: ['audiometria', 'espirometria', 'acuidade_visual', 'eletrocardiograma', 'psicossocial'], requiresInPerson: true, periodicFrequencyMonths: 12 },
  { cboCode: '9111-05', functionName: 'Operador de Produção', riskGrade: 'medio', requiredExams: ['audiometria', 'espirometria', 'acuidade_visual'], requiresInPerson: true, periodicFrequencyMonths: 12 },
  { cboCode: '9112-10', functionName: 'Ajudante de Produção', riskGrade: 'medio', requiredExams: ['audiometria', 'espirometria', 'acuidade_visual'], requiresInPerson: true, periodicFrequencyMonths: 12 },
  { cboCode: '9191-05', functionName: 'Trabalhador em Exposição a Ruído', riskGrade: 'alto', requiredExams: ['audiometria', 'espirometria', 'acuidade_visual', 'eletrocardiograma'], requiresInPerson: true, periodicFrequencyMonths: 6 },
  { cboCode: '9192-10', functionName: 'Trabalhador em Exposição a Poeira', riskGrade: 'alto', requiredExams: ['audiometria', 'espirometria', 'acuidade_visual', 'radiografia_torax', 'espirometria'], requiresInPerson: true, periodicFrequencyMonths: 6 },
  { cboCode: '9511-05', functionName: 'Vigia', riskGrade: 'baixo', requiredExams: ['audiometria', 'acuidade_visual'], requiresInPerson: false, periodicFrequencyMonths: 24 },
  { cboCode: '5121-05', functionName: 'Cozinheiro Industrial', riskGrade: 'baixo', requiredExams: ['audiometria', 'acuidade_visual', 'exames_laboratoriais'], requiresInPerson: false, periodicFrequencyMonths: 12 },
  { cboCode: '5143-10', functionName: 'Atendente de Enfermagem', riskGrade: 'medio', requiredExams: ['audiometria', 'espirometria', 'acuidade_visual', 'exames_laboratoriais'], requiresInPerson: true, periodicFrequencyMonths: 12 },
  { cboCode: '4110-05', functionName: 'Escriturário', riskGrade: 'baixo', requiredExams: ['acuidade_visual'], requiresInPerson: false, periodicFrequencyMonths: 24 },
  { cboCode: '4141-05', functionName: 'Almoxarife', riskGrade: 'baixo', requiredExams: ['audiometria', 'acuidade_visual'], requiresInPerson: false, periodicFrequencyMonths: 24 },
  { cboCode: '7151-10', functionName: 'Carpinteiro', riskGrade: 'medio', requiredExams: ['audiometria', 'espirometria', 'acuidade_visual', 'eletrocardiograma'], requiresInPerson: true, periodicFrequencyMonths: 12 },
  { cboCode: '7152-05', functionName: 'Armador de Ferragens', riskGrade: 'medio', requiredExams: ['audiometria', 'espirometria', 'acuidade_visual', 'eletrocardiograma'], requiresInPerson: true, periodicFrequencyMonths: 12 },
  { cboCode: '7153-10', functionName: 'Pedreiro', riskGrade: 'medio', requiredExams: ['audiometria', 'espirometria', 'acuidade_visual', 'eletrocardiograma', 'radiografia_torax'], requiresInPerson: true, periodicFrequencyMonths: 12 },
  { cboCode: '7154-05', functionName: 'Azulejista', riskGrade: 'medio', requiredExams: ['audiometria', 'espirometria', 'acuidade_visual', 'eletrocardiograma'], requiresInPerson: true, periodicFrequencyMonths: 12 },
  { cboCode: '7155-10', functionName: 'Gesseiro', riskGrade: 'medio', requiredExams: ['audiometria', 'espirometria', 'acuidade_visual', 'eletrocardiograma'], requiresInPerson: true, periodicFrequencyMonths: 12 },
];

async function main() {
  console.log('Starting seed...');

  const email = 'admin@saudeseg.com';
  const password = '123456';

  await prisma.userAccount.upsert({
    where: { email },
    update: {
      passwordHash: await bcrypt.hash(password, 10),
    },
    create: {
      email,
      passwordHash: await bcrypt.hash(password, 10),
      role: Role.ADMIN,
    },
  });

  console.log(`Admin user created: ${email} / ${password}`);

  console.log('Seeding OccupationalRisk (CBOs NR-7/NR-9)...');
  for (const risk of occupationalRisks) {
    await prisma.occupationalRisk.upsert({
      where: { cboCode: risk.cboCode },
      update: risk,
      create: risk,
    });
  }
  console.log(`Inserted ${occupationalRisks.length} occupational risk records.`);

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
