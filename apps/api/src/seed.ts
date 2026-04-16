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
  { resource: 'finance', action: 'write' },
  { resource: 'finance', action: 'manage' },
  { resource: 'courses', action: 'view' },
  { resource: 'courses', action: 'create' },
  { resource: 'courses', action: 'update' },
  { resource: 'courses', action: 'archive' },
  { resource: 'groups', action: 'view' },
  { resource: 'groups', action: 'create' },
  { resource: 'groups', action: 'update' },
  { resource: 'groups', action: 'archive' },
  { resource: 'enrollments', action: 'view' },
  { resource: 'enrollments', action: 'create' },
  { resource: 'enrollments', action: 'update' },
  { resource: 'enrollments', action: 'remove' },
  { resource: 'payments', action: 'view' },
  { resource: 'payments', action: 'create' },
  { resource: 'payments', action: 'update' },
  { resource: 'assessments', action: 'read' },
  { resource: 'assessments', action: 'write' },
  { resource: 'psychologists', action: 'read' },
  { resource: 'psychologists', action: 'write' },
  { resource: 'psychologists', action: 'manage' },
  { resource: 'administrators', action: 'read' },
  { resource: 'administrators', action: 'write' },
  { resource: 'administrators', action: 'manage' },
  { resource: 'centers', action: 'read' },
  { resource: 'centers', action: 'write' },
  { resource: 'moderation', action: 'read' },
  { resource: 'moderation', action: 'write' },
  { resource: 'moderation', action: 'manage' },
  { resource: 'complaints', action: 'read' },
  { resource: 'complaints', action: 'manage' },
  { resource: 'reports', action: 'read' },
  { resource: 'reports', action: 'manage' },
  { resource: 'blocks', action: 'manage' },
  { resource: 'content', action: 'moderate' },
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

async function upsertRole(name: string, description: string) {
  const existing = await prisma.role.findFirst({ where: { name, centerId: null } });
  if (existing) {
    return prisma.role.update({ where: { id: existing.id }, data: { description, isSystem: true } });
  }
  return prisma.role.create({ data: { name, description, isSystem: true } });
}

async function seedRolesAndPermissions() {
  const superadminRole = await upsertRole('SUPERADMIN', 'Full system access');
  const adminRole = await upsertRole('ADMIN', 'Center administration');
  const userRole = await upsertRole('USER', 'Mobile app user');

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

  const defaultPassword = await bcrypt.hash('Oxunjon2002', 12);
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

  await prisma.platformMonetizationSettings.upsert({
    where: { id: 1 },
    create: { id: 1, defaultCommissionPercent: 10 },
    update: {},
  });

  const tariffBasic = await prisma.centerTariffPlan.upsert({
    where: { tier: 'BASIC' },
    create: {
      tier: 'BASIC',
      name: 'Basic',
      description: 'Kichik markazlar',
      maxUsers: 100,
      maxPsychologists: 10,
      featureFlags: { analytics: false },
      sortOrder: 0,
    },
    update: {},
  });
  await prisma.centerTariffPlan.upsert({
    where: { tier: 'PRO' },
    create: {
      tier: 'PRO',
      name: 'Pro',
      description: 'O\'rta hajm',
      maxUsers: 500,
      maxPsychologists: 40,
      featureFlags: { analytics: true },
      sortOrder: 1,
    },
    update: {},
  });
  await prisma.centerTariffPlan.upsert({
    where: { tier: 'PREMIUM' },
    create: {
      tier: 'PREMIUM',
      name: 'Premium',
      description: 'Cheksiz imkoniyatlar',
      maxUsers: null,
      maxPsychologists: null,
      featureFlags: { analytics: true, priority_support: true },
      sortOrder: 2,
    },
    update: {},
  });

  const freeConsumer = await prisma.consumerPlan.upsert({
    where: { code: 'FREE' },
    create: {
      code: 'FREE',
      name: 'Freemium',
      description: 'Bepul',
      monthlyPriceUzs: 0,
      featurePsychChat: false,
      featureVideoConsultation: false,
      featureCourses: false,
      featurePremiumContent: false,
      sortOrder: 0,
    },
    update: {},
  });
  await prisma.consumerPlan.upsert({
    where: { code: 'PREMIUM' },
    create: {
      code: 'PREMIUM',
      name: 'Premium',
      description: 'Psixolog chat, video, kurslar, maxsus kontent',
      monthlyPriceUzs: 129000,
      featurePsychChat: true,
      featureVideoConsultation: true,
      featureCourses: true,
      featurePremiumContent: true,
      sortOrder: 1,
    },
    update: {},
  });

  await prisma.educationCenter.update({
    where: { id: center.id },
    data: { centerTariffPlanId: tariffBasic.id },
  });

  await prisma.mobileUser.upsert({
    where: { userId: mobileUser.id },
    create: {
      userId: mobileUser.id,
      firstName: 'Farrux',
      lastName: 'Mamadaliyev',
      consumerPlanId: freeConsumer.id,
    },
    update: { consumerPlanId: freeConsumer.id },
  });

  console.log('Users created:');
  console.log(`  Superadmin: admin@ruhiyat.uz / Oxunjon2002 (id: ${superadmin.id})`);
  console.log(`  Superadmin: superadmin@ruhiyat.uz / admin123 (id: ${superadmin2.id})`);
  console.log(`  Admin: admin@markaz.uz / admin123`);
  console.log(`  Mobile: +998901234567 / user123`);

  await seedRolesAndPermissions();

  const breathingCount = await prisma.breathingScenario.count();
  if (breathingCount === 0) {
    await prisma.breathingScenario.createMany({
      data: [
        {
          title: '4-4-4-4 (Box breathing)',
          description: 'Zerikarli emas — tinchlik va nazorat uchun klassik texnika.',
          inhaleSec: 4,
          holdSec: 4,
          exhaleSec: 4,
          cyclesDefault: 6,
          orderIndex: 0,
          isPublished: true,
        },
        {
          title: '4-7-8',
          description: 'Uyqu va xotirjamlik uchun sekin chiqarish.',
          inhaleSec: 4,
          holdSec: 7,
          exhaleSec: 8,
          cyclesDefault: 4,
          orderIndex: 1,
          isPublished: true,
        },
        {
          title: 'Yengil nafas',
          description: 'Qisqa mashg‘ulot — stress paytida.',
          inhaleSec: 3,
          holdSec: 1,
          exhaleSec: 5,
          cyclesDefault: 8,
          orderIndex: 2,
          isPublished: true,
        },
      ],
    });
  }

  const legalKeys = [
    ['privacy_policy_url', 'https://ruhiyat.uz/privacy', 'all', 'Maxfiylik siyosati URL (mobil ilova)'],
    ['terms_of_service_url', 'https://ruhiyat.uz/terms', 'all', 'Foydalanish shartlari URL'],
    ['support_email', 'support@ruhiyat.uz', 'all', 'Qo‘llab-quvvatlash email'],
    ['help_center_url', 'https://ruhiyat.uz/help', 'all', 'Yordam markazi'],
    ['app_marketing_tagline', 'Ruhiyat — ruhiy salomatlik yo‘lingiz', 'all', 'Ilova tagline'],
  ] as const;
  for (const [key, value, platform, description] of legalKeys) {
    await prisma.mobileAppSetting.upsert({
      where: { key },
      create: { key, value, platform, description },
      update: { value, description },
    });
  }

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
