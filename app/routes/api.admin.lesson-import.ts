import type { Route } from "./+types/api.admin.lesson-import";
import { data } from "react-router";
import { requireAdmin } from "~/lib/auth.server";
import { prisma } from "~/lib/db.server";

export async function action({ request }: Route.ActionArgs) {
  await requireAdmin(request);
  const form = await request.formData();
  const file = form.get("jsonFile") as File | null;
  const source = String(form.get("source") || "HSK20").trim();

  if (!file || file.size === 0) {
    return data({ error: "Vui lòng chọn file JSON." }, { status: 400 });
  }

  try {
    const rawText = await file.text();
    const json = JSON.parse(rawText);
    const rawItems: unknown[] = Array.isArray(json)
      ? json
      : json.lessons || json.data || [];

    if (!rawItems.length) {
      return data({ error: "File JSON rỗng." }, { status: 400 });
    }

    let lessonCount = 0;
    let vocabCount = 0;

    for (const item of rawItems) {
      const record = item as Record<string, unknown>;
      const title = String(record.title || record.name || "Bài học").trim();
      const level = String(record.level || record.phase || "HSK1").trim();
      const orderNo = Number(record.orderNo || record.order || 1);
      const description = record.description ? String(record.description) : null;

      // Lấy danh sách từ vựng
      const rawVocab = Array.isArray(record.vocabularies)
        ? record.vocabularies
        : Array.isArray(record.vocabulary)
          ? record.vocabulary
          : [];

      const vocabularies = rawVocab
        .map((v: unknown) => {
          const w = v as Record<string, unknown>;
          const chinese = String(w.chinese || w.word || w.hanzi || "").trim();
          const pinyin = String(w.pinyin || "").trim();
          const meaningVi = String(w.meaningVi || w.meaning_vi || w.vi || w.meaning || w.translation || "").trim();
          if (!chinese || !pinyin || !meaningVi) return null;
          return {
            chinese,
            pinyin,
            meaningVi,
            meaningEn: w.meaningEn ? String(w.meaningEn) : "",
            exampleChinese: w.exampleChinese ? String(w.exampleChinese) : "",
            examplePinyin: w.examplePinyin ? String(w.examplePinyin) : "",
            exampleMeaning: w.exampleMeaning ? String(w.exampleMeaning) : "",
            level: String(w.level || level),
          };
        })
        .filter((v): v is NonNullable<typeof v> => v != null);

      if (!vocabularies.length) continue;

      await prisma.lesson.create({
        data: {
          title,
          description: description || `Bài học ${source}`,
          level,
          source,
          orderNo,
          status: "PUBLISHED",
          vocabularies: { create: vocabularies },
        },
      });
      lessonCount++;
      vocabCount += vocabularies.length;
    }

    return data({
      message: `Đã import ${lessonCount} bài học, ${vocabCount} từ vựng vào ${source === "HSK30" ? "HSK 3.0" : "HSK 2.0"}.`,
    });
  } catch (error) {
    return data(
      { error: error instanceof Error ? error.message : "Lỗi import file." },
      { status: 500 },
    );
  }
}
