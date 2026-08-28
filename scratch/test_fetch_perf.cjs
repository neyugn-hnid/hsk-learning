require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const t0 = performance.now();
  const vocabs = await prisma.vocabulary.findMany({
    select: {
      id: true,
      chinese: true,
      pinyin: true,
      meaningVi: true,
      level: true,
      lessonId: true,
      lesson: {
        select: {
          title: true,
          level: true,
          source: true,
        },
      },
    },
  });
  const t1 = performance.now();
  console.log(`Fetched ${vocabs.length} vocabs in ${(t1 - t0).toFixed(1)}ms`);
  
  // Count by lesson
  const lessonCounts = {};
  for (const v of vocabs) {
    const title = v.lesson?.title || 'Unknown';
    lessonCounts[title] = (lessonCounts[title] || 0) + 1;
  }
  console.log('Sample lesson counts:', Object.entries(lessonCounts).slice(0, 5));
  console.log('Chủ đề 8: Nhà cửa, đồ vật & động vật count:', lessonCounts['Chủ đề 8: Nhà cửa, đồ vật & động vật']);
}

main().catch(console.error).finally(() => prisma.$disconnect());
