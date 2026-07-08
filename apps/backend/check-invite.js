const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.examInvite.findUnique({
  where: { token: '6af9b9e1-f7f6-4eb2-9c52-e41f5d6e7700' },
  select: { expectedCpf: true, expectedBirthDate: true, status: true }
}).then(r => {
  console.log(JSON.stringify(r, null, 2));
  p.$disconnect();
}).catch(e => {
  console.error(e);
  p.$disconnect();
});
