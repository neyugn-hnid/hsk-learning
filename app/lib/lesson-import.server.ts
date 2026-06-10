import { generateLessonQuizzesByAI, splitLessonsByAI } from "~/lib/ai.server";
import { prisma } from "~/lib/db.server";
import {
  normalizeVocabulary,
  type ImportedVocabulary,
} from "~/lib/vocab.server";

export type LessonImportProgress = {
  stage: "uploading" | "analyzing" | "grouping" | "quizzing" | "saving" | "completed";
  message: string;
  percent: number;
  lessonCount?: number;
  quizCount?: number;
};

export type LessonImportResult = {
  lessonCount: number;
  quizCount: number;
  vocabularyCount: number;
  message: string;
};

type ProgressHandler = (progress: LessonImportProgress) => void;

export async function runLessonImportAI(
  file: File | null,
  courseTitle: string,
  onProgress?: ProgressHandler,
): Promise<LessonImportResult> {
  if (!file || file.size === 0) {
    throw new Error("Vui lòng chọn file JSON.");
  }

  onProgress?.({
    stage: "uploading",
    message: "Đã nhận file từ thiết bị, bắt đầu đọc dữ liệu...",
    percent: 8,
  });

  let json: unknown;
  try {
    const rawText = await file.text();
    json = JSON.parse(rawText);
  } catch {
    throw new Error("File JSON không hợp lệ.");
  }

  onProgress?.({
    stage: "analyzing",
    message: "Đang chuẩn hóa dữ liệu từ vựng đầu vào...",
    percent: 16,
  });

  const source = Array.isArray(json)
    ? json
    : (json as Record<string, unknown>).vocabularies ||
      (json as Record<string, unknown>).words ||
      (json as Record<string, unknown>).data ||
      [];
  const rawItems = Array.isArray(source) ? source : [];
  const normalized = rawItems
    .map(normalizeVocabulary)
    .filter((item): item is ImportedVocabulary => Boolean(item));

  if (!normalized.length) {
    throw new Error("Không tìm thấy từ vựng hợp lệ.");
  }

  onProgress?.({
    stage: "grouping",
    message: "AI đang phân nhóm từ vựng thành các bài học...",
    percent: 28,
  });

  const groupedLessons = await splitLessonsByAI(normalized, courseTitle);
  let createdQuizCount = 0;

  for (let index = 0; index < groupedLessons.length; index += 1) {
    const group = groupedLessons[index];
    const basePercent = 35 + Math.round((index / Math.max(1, groupedLessons.length)) * 55);

    onProgress?.({
      stage: "quizzing",
      message: `AI đang tạo quiz cho bài ${index + 1}/${groupedLessons.length}: ${group.title}`,
      percent: basePercent,
      lessonCount: index,
      quizCount: createdQuizCount,
    });

    const quizzes = await generateLessonQuizzesByAI(group);

    onProgress?.({
      stage: "saving",
      message: `Đang lưu bài ${index + 1}/${groupedLessons.length} vào hệ thống...`,
      percent: Math.min(basePercent + 8, 96),
      lessonCount: index + 1,
      quizCount: createdQuizCount + quizzes.length,
    });

    await prisma.lesson.create({
      data: {
        title: group.title,
        level: group.level || "HSK1",
        description: group.description || "Bài học được phân tự động bằng AI.",
        orderNo: 999,
        vocabularies: {
          create: group.vocabularies.map((v) => ({
            chinese: v.chinese,
            pinyin: v.pinyin,
            meaningVi: v.meaningVi,
            meaningEn: v.meaningEn,
            exampleChinese: v.exampleChinese,
            examplePinyin: v.examplePinyin,
            exampleMeaning: v.exampleMeaning,
            level: v.level || "HSK1",
          })),
        },
        quizzes: {
          create: quizzes.map((quiz) => ({
            type: quiz.type,
            question: quiz.question,
            promptMeaning: quiz.promptMeaning,
            promptPinyin: quiz.promptPinyin,
            options: quiz.options,
            answer: quiz.answer,
          })),
        },
      },
    });

    createdQuizCount += quizzes.length;
  }

  const result = {
    lessonCount: groupedLessons.length,
    quizCount: createdQuizCount,
    vocabularyCount: normalized.length,
    message: `Đã dùng AI phân ${normalized.length} từ thành ${groupedLessons.length} bài và tạo ${createdQuizCount} câu quiz.`,
  };

  onProgress?.({
    stage: "completed",
    message: result.message,
    percent: 100,
    lessonCount: result.lessonCount,
    quizCount: result.quizCount,
  });

  return result;
}
