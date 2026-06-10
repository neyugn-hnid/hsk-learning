export type ImportedVocabulary = {
  chinese: string;
  pinyin: string;
  meaningVi: string;
  meaningEn?: string;
  exampleChinese?: string;
  examplePinyin?: string;
  exampleMeaning?: string;
  level?: string;
  lessonTitle?: string;
};

export function normalizeVocabulary(item: any): ImportedVocabulary | null {
  const chinese = item.chinese || item.word || item.hanzi || item.character || item.simplified;
  const pinyin = item.pinyin || item.pronunciation;
  const meaningVi = item.meaningVi || item.meaning_vi || item.vi || item.meaning || item.translation;
  if (!chinese || !pinyin || !meaningVi) return null;
  return {
    chinese: String(chinese).trim(),
    pinyin: String(pinyin).trim(),
    meaningVi: String(meaningVi).trim(),
    meaningEn: item.meaningEn || item.meaning_en || item.en || "",
    exampleChinese: item.exampleChinese || item.example_chinese || item.example || "",
    examplePinyin: item.examplePinyin || item.example_pinyin || "",
    exampleMeaning: item.exampleMeaning || item.example_meaning || item.exampleVi || "",
    level: item.level || item.hsk || "HSK1",
    lessonTitle: item.lessonTitle || item.lesson || item.lessonName || "",
  };
}

export function splitByCount(items: ImportedVocabulary[], wordsPerLesson: number, title: string) {
  const counters: Record<string, number> = {};
  return items.map((item) => {
    const level = item.level || "HSK1";
    counters[level] = counters[level] || 0;
    const lessonNumber = Math.floor(counters[level] / Math.max(1, wordsPerLesson)) + 1;
    counters[level] += 1;
    return {
      ...item,
      lessonTitle: item.lessonTitle || `${level} - Bài ${lessonNumber}: ${title}`,
    };
  });
}
