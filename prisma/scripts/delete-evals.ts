import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  await prisma.evaluation.deleteMany({});
  console.log('Deleted all evaluations');
}
main().finally(() => prisma.$disconnect());
