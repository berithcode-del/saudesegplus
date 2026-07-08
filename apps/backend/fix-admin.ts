import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function run() {
  const hash = await bcrypt.hash('admin', 10);
  await prisma.userAccount.update({
    where: { email: 'admin@saudeseg.com' },
    data: { passwordHash: hash }
  });
  console.log('Password updated to admin!');
}

run().finally(() => prisma.$disconnect());
