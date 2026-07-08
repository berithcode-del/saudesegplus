import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@saudeseg.com';
  const password = 'admin'; // Senha super segura para ambiente de desenvolvimento

  const existingAdmin = await prisma.userAccount.findUnique({
    where: { email },
  });

  if (existingAdmin) {
    console.log(`Admin ${email} already exists!`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.userAccount.create({
    data: {
      email,
      passwordHash,
      role: Role.ADMIN,
    },
  });

  console.log(`Successfully created ADMIN user: ${email} / password: ${password}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
