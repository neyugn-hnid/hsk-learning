import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const items = await prisma.roadmapItem.findMany({
  orderBy: [{ orderNo: "asc" }, { createdAt: "asc" }],
});
console.log("TOTAL", items.length);
for (const i of items) {
  console.log(i.orderNo, "|", i.phase, "|", i.level, "|", i.title);
}

const lessons = await prisma.lesson.findMany({
  orderBy: [{ level: "asc" }, { orderNo: "asc" }],
});
console.log("\nLESSONS TOTAL", lessons.length);
for (const l of lessons) {
  console.log(l.level, "|", l.source, "|", l.orderNo, "|", l.title);
}

await prisma.$disconnect();
