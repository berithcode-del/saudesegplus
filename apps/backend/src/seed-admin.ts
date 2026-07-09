import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_SEED_EMAIL ?? 'admin@saudeseg.com';
  const password = process.env.ADMIN_SEED_PASSWORD;
  if (!password || password.length < 12) {
    throw new Error('ADMIN_SEED_PASSWORD must be configured with at least 12 characters');
  }

  const existingAdmin = await prisma.userAccount.findUnique({
    where: { email },
  });

  if (existingAdmin) {
    console.log(`Admin ${email} already exists!`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.userAccount.create({
    data: {
      email,
      passwordHash,
      role: Role.ADMIN,
    },
  });

  console.log(`Successfully created ADMIN user: ${email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
