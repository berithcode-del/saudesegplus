import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const companies = await prisma.company.findMany({
    where: { status: { in: ['CADASTRO_INCOMPLETO', 'EM_ANALISE', 'LIBERADA'] } },
    select: { id: true, razaoSocial: true, status: true, pcmsoValidUntil: true, ppraValidUntil: true },
  });
  console.log('Companies found:', companies.length);
  companies.forEach(c => {
    console.log(`- ${c.razaoSocial} | status=${c.status} | pcmso=${c.pcmsoValidUntil?.toISOString().slice(0,10) ?? 'null'} | ppra=${c.ppraValidUntil?.toISOString().slice(0,10) ?? 'null'}`);
  });
  await prisma.$disconnect();
}
main().catch(e => console.error(e));