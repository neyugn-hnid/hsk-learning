require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const t0 = performance.now();
  // Fetch by standard and level
  const vocabs = await prisma.vocabulary.findMany({
    where: {
      level: 'HSK1',
      lesson: {
        source: 'HSK20'
      }
    },
    select: {
      id: true,
      chinese: true,
      pinyin: true,
      meaningVi: true,
      level: true,
      lessonId: true,
      lesson: {
        select: {
          id: true,
          title: true,
          level: true,
          source: true,
        },
      },
    },
  });
  const t1 = performance.now();
  console.log(`Fetched ${vocabs.length} HSK1 HSK20 vocabs in ${(t1 - t0).toFixed(1)}ms`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
