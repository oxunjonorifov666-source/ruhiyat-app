/**
 * One-off: create or update a single SUPERADMIN user. No other tables touched.
 *
 * Usage (set env vars, never commit passwords):
 *   BOOTSTRAP_EMAIL=you@domain.com BOOTSTRAP_PASSWORD='your-strong-password' pnpm run bootstrap:superadmin
 *
 * Requires DATABASE_URL (same as Prisma / production).
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const rawEmail = process.env.BOOTSTRAP_EMAIL?.trim();
  const password = process.env.BOOTSTRAP_PASSWORD;

  if (!rawEmail || !password) {
    console.error('Missing env: set BOOTSTRAP_EMAIL and BOOTSTRAP_PASSWORD.');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('BOOTSTRAP_PASSWORD must be at least 8 characters.');
    process.exit(1);
  }

  const email = rawEmail.toLowerCase();
  const passwordHash = await bcrypt.hash(password, 12);

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    await prisma.user.update({
      where: { email },
      data: {
        passwordHash,
        isActive: true,
        isVerified: true,
        role: 'SUPERADMIN',
      },
    });
    console.log(`[bootstrap-superadmin] OK — updated existing user (password + flags + role only): ${email}`);
  } else {
    await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: 'SUPERADMIN',
        isActive: true,
        isVerified: true,
      },
    });
    console.log(`[bootstrap-superadmin] OK — created new SUPERADMIN: ${email}`);
  }

  console.log('[bootstrap-superadmin] Done. Log in via superadmin panel with this email and BOOTSTRAP_PASSWORD.');
}

main()
  .catch((e) => {
    console.error('[bootstrap-superadmin] Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
