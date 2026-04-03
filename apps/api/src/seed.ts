import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const superadminPassword = await bcrypt.hash('admin123', 12);
  const adminPassword = await bcrypt.hash('admin123', 12);
  const mobilePassword = await bcrypt.hash('user123', 12);

  const superadmin = await prisma.user.upsert({
    where: { email: 'superadmin@ruhiyat.uz' },
    update: {},
    create: {
      email: 'superadmin@ruhiyat.uz',
      firstName: 'Super',
      lastName: 'Admin',
      passwordHash: superadminPassword,
      role: 'SUPERADMIN',
      isActive: true,
      isVerified: true,
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@markaz.uz' },
    update: {},
    create: {
      email: 'admin@markaz.uz',
      firstName: 'Admin',
      lastName: 'Markaz',
      passwordHash: adminPassword,
      role: 'ADMINISTRATOR',
      isActive: true,
      isVerified: true,
    },
  });

  const mobileUser = await prisma.user.upsert({
    where: { phone: '+998901234567' },
    update: {},
    create: {
      phone: '+998901234567',
      firstName: 'Farrux',
      lastName: 'Mamadaliyev',
      passwordHash: mobilePassword,
      role: 'MOBILE_USER',
      isActive: true,
      isVerified: true,
    },
  });

  const center = await prisma.educationCenter.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Ruhiyat Ta\'lim Markazi',
      address: 'Toshkent, O\'zbekiston',
      phone: '+998901000000',
      email: 'info@markaz.uz',
    },
  });

  await prisma.administrator.upsert({
    where: { userId: admin.id },
    update: {},
    create: {
      userId: admin.id,
      centerId: center.id,
      firstName: 'Admin',
      lastName: 'Markaz',
      position: 'Bosh administrator',
    },
  });

  console.log('Seed completed:');
  console.log(`  Superadmin: superadmin@ruhiyat.uz / admin123`);
  console.log(`  Admin: admin@markaz.uz / admin123`);
  console.log(`  Mobile: +998901234567 / user123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
