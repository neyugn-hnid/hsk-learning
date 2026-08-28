/**
 * Spaced Repetition System (SRS) - SuperMemo SM-2 Implementation
 * Thuật toán tính toán chu kỳ ghi nhớ và quên lãng của từ vựng
 */

export type SRSWordItem = {
  wordId: string;
  chinese: string;
  pinyin: string;
  meaningVi: string;
  level: string;
  stage: "seed" | "sprout" | "bloom" | "tree"; // Mầm non, Cây con, Hoa nở, Đại thụ
  repetition: number;
  intervalDays: number;
  easeFactor: number;
  nextReviewDate: string; // YYYY-MM-DD
  isThirsty: boolean; // Cần tưới nước (sắp quên/đến hạn ôn)
};

const SRS_STORAGE_KEY = "hsk_memory_garden_srs";

export function getTodayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function loadSRSItems(): SRSWordItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SRS_STORAGE_KEY);
    if (!raw) return [];
    const items: SRSWordItem[] = JSON.parse(raw);
    const today = getTodayString();

    // Cập nhật trạng thái isThirsty nếu đã đến hoặc quá ngày nextReviewDate
    return items.map((item) => ({
      ...item,
      isThirsty: item.nextReviewDate <= today,
    }));
  } catch {
    return [];
  }
}

export function saveSRSItems(items: SRSWordItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SRS_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent("hsk_srs_updated", { detail: items }));
  } catch {
    // ignore
  }
}

/**
 * Đánh giá kết quả ôn từ (Grade 0 -> 5)
 * 5: Nhớ hoàn hảo
 * 3: Nhớ được nhưng hơi mất thời gian
 * 1: Quên / Nhớ sai
 */
export function reviewWordSRS(word: SRSWordItem, grade: number): SRSWordItem {
  let { repetition, intervalDays, easeFactor } = word;

  if (grade >= 3) {
    if (repetition === 0) {
      intervalDays = 1;
    } else if (repetition === 1) {
      intervalDays = 3;
    } else {
      intervalDays = Math.round(intervalDays * easeFactor);
    }
    repetition += 1;
  } else {
    repetition = 0;
    intervalDays = 1;
  }

  easeFactor = Math.max(1.3, easeFactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02)));

  // Tính ngày ôn tiếp theo
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + intervalDays);
  const nextReviewDate = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}-${String(nextDate.getDate()).padStart(2, "0")}`;

  // Cập nhật stage cây
  let stage: SRSWordItem["stage"] = "seed";
  if (repetition >= 5) stage = "tree";
  else if (repetition >= 3) stage = "bloom";
  else if (repetition >= 1) stage = "sprout";

  const updated: SRSWordItem = {
    ...word,
    repetition,
    intervalDays,
    easeFactor,
    nextReviewDate,
    stage,
    isThirsty: false,
  };

  return updated;
}

export type LearnedVocabInput = {
  id: string;
  chinese: string;
  pinyin: string;
  meaningVi: string;
  level?: string;
};

/**
 * Gieo mầm từ vựng mới học vào Vườn Cây Trí Tuệ.
 * Từ mới sẽ khởi đầu ở giai đoạn Mầm Hạt ("seed") và phát triển dần theo số lần ôn tập.
 */
export function addWordsToSRS(words: LearnedVocabInput[]): SRSWordItem[] {
  if (typeof window === "undefined" || !words || words.length === 0) return [];
  
  const existing = loadSRSItems();
  const existingMap = new Map(existing.map((e) => [e.wordId, e]));
  const today = getTodayString();
  let hasNew = false;

  for (const w of words) {
    if (!existingMap.has(w.id)) {
      hasNew = true;
      const newItem: SRSWordItem = {
        wordId: w.id,
        chinese: w.chinese,
        pinyin: w.pinyin,
        meaningVi: w.meaningVi,
        level: w.level || "HSK1",
        stage: "seed",
        repetition: 0,
        intervalDays: 1,
        easeFactor: 2.5,
        nextReviewDate: today,
        isThirsty: true,
      };
      existing.push(newItem);
      existingMap.set(w.id, newItem);
    }
  }

  if (hasNew) {
    saveSRSItems(existing);
  }

  return existing;
}

