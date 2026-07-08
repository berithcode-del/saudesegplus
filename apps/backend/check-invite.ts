import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
async function main() {
  const invite = await p.examInvite.findUnique({
    where: { token: '6af9b9e1-f7f6-4eb2-9c52-e41f5d6e7700' },
    select: { expectedCpf: true, expectedBirthDate: true, status: true }
  });
  console.log(JSON.stringify(invite, null, 2));
  await p.$disconnect();
}
main();
