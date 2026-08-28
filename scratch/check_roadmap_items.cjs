require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const items = await prisma.roadmapItem.findMany({ take: 5 });
  console.log('RoadmapItems count:', items.length);
  for (const item of items) {
    console.log({
      id: item.id,
      title: item.title,
      phase: item.phase,
      level: item.level,
      orderNo: item.orderNo,
      vocabLength: Array.isArray(item.vocabulary) ? item.vocabulary.length : 0,
      sampleVocab: Array.isArray(item.vocabulary) ? item.vocabulary.slice(0, 2) : item.vocabulary
    });
  }
  
  // Distinct levels in roadmapItems
  const all = await prisma.roadmapItem.findMany({ select: { level: true, phase: true } });
  const levels = [...new Set(all.map(a => a.level || a.phase))];
  console.log('Distinct Roadmap levels/phases:', levels);
}

main().catch(console.error).finally(() => prisma.$disconnect());
