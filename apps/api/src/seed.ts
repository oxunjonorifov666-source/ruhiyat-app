import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const ADMIN_PERMISSIONS = [
  { resource: 'users', action: 'read' },
  { resource: 'users', action: 'write' },
  { resource: 'content', action: 'read' },
  { resource: 'content', action: 'write' },
  { resource: 'content', action: 'delete' },
  { resource: 'community', action: 'read' },
  { resource: 'community', action: 'write' },
  { resource: 'community', action: 'moderate' },
  { resource: 'communication', action: 'read' },
  { resource: 'communication', action: 'write' },
  { resource: 'meetings', action: 'read' },
  { resource: 'meetings', action: 'write' },
  { resource: 'finance', action: 'read' },
  { resource: 'courses', action: 'read' },
  { resource: 'courses', action: 'write' },
  { resource: 'assessments', action: 'read' },
  { resource: 'assessments', action: 'write' },
  { resource: 'psychologists', action: 'read' },
  { resource: 'psychologists', action: 'write' },
  { resource: 'centers', action: 'read' },
  { resource: 'centers', action: 'write' },
];

const USER_PERMISSIONS = [
  { resource: 'content', action: 'read' },
  { resource: 'community', action: 'read' },
  { resource: 'community', action: 'write' },
  { resource: 'communication', action: 'read' },
  { resource: 'communication', action: 'write' },
  { resource: 'meetings', action: 'read' },
  { resource: 'assessments', action: 'read' },
  { resource: 'psychologists', action: 'read' },
  { resource: 'wellness', action: 'read' },
  { resource: 'wellness', action: 'write' },
  { resource: 'finance', action: 'write' },
];

async function seedRolesAndPermissions() {
  const superadminRole = await prisma.role.upsert({
    where: { name: 'SUPERADMIN' },
    update: { description: 'Full system access', isSystem: true },
    create: { name: 'SUPERADMIN', description: 'Full system access', isSystem: true },
  });

  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: { description: 'Center administration', isSystem: true },
    create: { name: 'ADMIN', description: 'Center administration', isSystem: true },
  });

  const userRole = await prisma.role.upsert({
    where: { name: 'USER' },
    update: { description: 'Mobile app user', isSystem: true },
    create: { name: 'USER', description: 'Mobile app user', isSystem: true },
  });

  await prisma.permission.deleteMany({ where: { roleId: adminRole.id } });
  for (const perm of ADMIN_PERMISSIONS) {
    await prisma.permission.create({
      data: { roleId: adminRole.id, resource: perm.resource, action: perm.action },
    });
  }

  await prisma.permission.deleteMany({ where: { roleId: userRole.id } });
  for (const perm of USER_PERMISSIONS) {
    await prisma.permission.create({
      data: { roleId: userRole.id, resource: perm.resource, action: perm.action },
    });
  }

  console.log(`  Roles: SUPERADMIN (id:${superadminRole.id}), ADMIN (id:${adminRole.id}), USER (id:${userRole.id})`);
  console.log(`  ADMIN permissions: ${ADMIN_PERMISSIONS.length}`);
  console.log(`  USER permissions: ${USER_PERMISSIONS.length}`);
  console.log(`  SUPERADMIN: bypasses all permission checks`);
}

async function main() {
  console.log('Seeding database...');

  const defaultPassword = await bcrypt.hash('123456', 12);
  const adminPassword = await bcrypt.hash('admin123', 12);
  const mobilePassword = await bcrypt.hash('user123', 12);

  const superadmin = await prisma.user.upsert({
    where: { email: 'admin@ruhiyat.uz' },
    update: { passwordHash: defaultPassword },
    create: {
      email: 'admin@ruhiyat.uz',
      firstName: 'Admin',
      lastName: 'Ruhiyat',
      passwordHash: defaultPassword,
      role: 'SUPERADMIN',
      isActive: true,
      isVerified: true,
    },
  });

  const superadmin2 = await prisma.user.upsert({
    where: { email: 'superadmin@ruhiyat.uz' },
    update: {},
    create: {
      email: 'superadmin@ruhiyat.uz',
      firstName: 'Super',
      lastName: 'Admin',
      passwordHash: adminPassword,
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

  console.log('Users created:');
  console.log(`  Superadmin: admin@ruhiyat.uz / 123456 (id: ${superadmin.id})`);
  console.log(`  Superadmin: superadmin@ruhiyat.uz / admin123 (id: ${superadmin2.id})`);
  console.log(`  Admin: admin@markaz.uz / admin123`);
  console.log(`  Mobile: +998901234567 / user123`);

  await seedRolesAndPermissions();

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
