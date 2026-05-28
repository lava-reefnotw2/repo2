import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('admin123', 10);
  
  await prisma.usuario.upsert({
    where: { email: 'admin@unitru.edu.pe' },
    update: {},
    create: {
      nombre: 'Administrador UNT',
      email: 'admin@unitru.edu.pe',
      password,
      rol: 'ADMINISTRADOR',
    },
  });

  console.log('Database seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
