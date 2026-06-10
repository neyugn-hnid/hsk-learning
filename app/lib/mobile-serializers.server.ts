export function serializeQuizOptions(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item)).filter(Boolean);
}

export function serializeRoadmapEntries(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .filter(
      (item): item is Record<string, unknown> =>
        Boolean(item) && typeof item === "object",
    )
    .map((item) => ({
      chinese: String(item.chinese || ""),
      pinyin: String(item.pinyin || ""),
      meaningVi: String(item.meaningVi || item.meaning || ""),
      meaningEn: item.meaningEn ? String(item.meaningEn) : null,
      level: item.level ? String(item.level) : null,
      exampleChinese: item.exampleChinese ? String(item.exampleChinese) : null,
      examplePinyin: item.examplePinyin ? String(item.examplePinyin) : null,
      exampleMeaning: item.exampleMeaning ? String(item.exampleMeaning) : null,
    }))
    .filter((item) => item.chinese && item.meaningVi);
}

export function serializeStringArray(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => String(item)).filter(Boolean);
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
}
