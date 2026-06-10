import type { Route } from "./+types/api.vocabularies.import";
import { data } from "react-router";
import { requireAdmin } from "~/lib/auth.server";
import { prisma } from "~/lib/db.server";
import { normalizeVocabulary, splitByCount } from "~/lib/vocab.server";
export async function action({ request }: Route.ActionArgs) {
  await requireAdmin(request);
  const body = await request.json();
  const rawItems = Array.isArray(body.items) ? body.items : body.vocabularies || body.words || body.data || [];
  const normalized = rawItems.map(normalizeVocabulary).filter(Boolean);
  if (!normalized.length) return data({ message: "Không có từ vựng hợp lệ." }, { status: 400 });
  const finalItems = splitByCount(normalized, Number(body.wordsPerLesson || 20), body.lessonTitle || "Từ vựng cơ bản");
  const lessonMap = new Map<string, typeof finalItems>();
  for (const item of finalItems) { const key = item.lessonTitle || `${item.level} - Import`; lessonMap.set(key, [...(lessonMap.get(key) || []), item]); }
  const lessons = [];
  for (const [title, items] of lessonMap) {
    lessons.push(await prisma.lesson.create({ data: { title, level: items[0]?.level || "HSK1", description: `Bài học import tự động với ${items.length} từ vựng.`, orderNo: 999, vocabularies: { create: items.map((v) => ({ chinese: v.chinese, pinyin: v.pinyin, meaningVi: v.meaningVi, meaningEn: v.meaningEn, exampleChinese: v.exampleChinese, examplePinyin: v.examplePinyin, exampleMeaning: v.exampleMeaning, level: v.level || "HSK1" })) } }, include: { vocabularies: true } }));
  }
  return data({ message: `Đã import ${finalItems.length} từ vào ${lessons.length} bài học.`, lessons });
}
