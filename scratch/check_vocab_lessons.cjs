require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.vocabulary.count();
  console.log('Total vocabularies in DB:', count);
  const lessons = await prisma.lesson.findMany({
    select: { id: true, title: true, level: true, source: true, _count: { select: { vocabularies: true } } },
    orderBy: { orderNo: 'asc' }
  });
  console.log('Lessons count:', lessons.length);
  const target = lessons.filter(l => l.title.includes('8') || l.title.includes('Nhà cửa'));
  console.log('Target lessons:', target);
  for (const t of target) {
    const v = await prisma.vocabulary.findMany({ where: { lessonId: t.id } });
    console.log(`Vocab in "${t.title}" (ID: ${t.id}, level: ${t.level}, source: ${t.source}): ${v.length} words`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
