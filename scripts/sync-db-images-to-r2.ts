import { prisma } from "../app/lib/db.server";
import dotenv from "dotenv";

dotenv.config();

const R2_DOMAIN = (process.env.R2_PUBLIC_DOMAIN || process.env.VITE_R2_PUBLIC_DOMAIN || "https://pub-0f34801da01d4834a6860bed70c93c54.r2.dev").replace(/\/$/, "");

function toR2Url(url: string | null | undefined): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) {
    if (url.includes("r2.dev")) return url;
    return url;
  }
  const clean = url.replace(/^\/+/, "");
  return `${R2_DOMAIN}/${clean}`;
}

async function main() {
  console.log(`\n🔄 ĐỒNG BỘ ĐƯỜNG DẪN ẢNH DATABASE SANG CLOUDFLARE R2 CDN...`);
  console.log(`🌐 R2 Domain: ${R2_DOMAIN}\n`);

  // 1. Cập nhật Vocabulary imageUrl
  const vocabs = await prisma.vocabulary.findMany({
    where: { imageUrl: { not: null } },
  });

  console.log(`📚 Tìm thấy ${vocabs.length} từ vựng có imageUrl trong DB.`);

  let updatedVocab = 0;
  for (const v of vocabs) {
    if (v.imageUrl && !v.imageUrl.startsWith("http")) {
      const r2Url = toR2Url(v.imageUrl);
      await prisma.vocabulary.update({
        where: { id: v.id },
        data: { imageUrl: r2Url },
      });
      updatedVocab++;
    }
  }
  console.log(`✅ Đã đồng bộ ${updatedVocab} từ vựng sang URL R2.`);

  // 2. Cập nhật RoadmapItem vocabulary JSON
  const roadmaps = await prisma.roadmapItem.findMany();
  let updatedRoadmaps = 0;

  for (const r of roadmaps) {
    if (Array.isArray(r.vocabulary)) {
      let modified = false;
      const newVocab = (r.vocabulary as any[]).map((entry) => {
        if (entry.imageUrl && !entry.imageUrl.startsWith("http")) {
          modified = true;
          return { ...entry, imageUrl: toR2Url(entry.imageUrl) };
        }
        return entry;
      });

      if (modified) {
        await prisma.roadmapItem.update({
          where: { id: r.id },
          data: { vocabulary: newVocab },
        });
        updatedRoadmaps++;
      }
    }
  }

  console.log(`✅ Đã đồng bộ ${updatedRoadmaps} lộ trình sang URL R2.`);
  console.log(`\n🎉 HOÀN TẤT ĐỒNG BỘ ẢNH DATABASE SANG R2!`);
}

main()
  .catch((err) => console.error("Lỗi:", err))
  .finally(() => prisma.$disconnect());
