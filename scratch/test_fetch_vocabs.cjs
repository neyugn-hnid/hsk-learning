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
        }
      }
    }
  });
  const t1 = performance.now();
  console.log(`Fetched ${vocabs.length} vocabs in ${(t1 - t0).toFixed(1)}ms`);
  const jsonStr = JSON.stringify(vocabs);
  console.log(`JSON size: ${(jsonStr.length / 1024 / 1024).toFixed(2)} MB`);
  
  // Check Chủ đề 8
  const chude8Words = vocabs.filter(v => v.lesson?.title?.includes('Chủ đề 8') && v.level === 'HSK1' && v.lesson?.source === 'HSK20');
  console.log('Chủ đề 8 HSK1 words count:', chude8Words.length);
  console.log('Sample:', chude8Words.slice(0, 3));
}

main().catch(console.error).finally(() => prisma.$disconnect());
