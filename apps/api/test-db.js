const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const users = await prisma.user.findMany({ select: { email: true, passwordHash: true, role: true } });
  console.log(users);
  process.exit(0);
}
run();
