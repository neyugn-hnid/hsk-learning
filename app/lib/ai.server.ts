import type { QuizType } from "@prisma/client";
import type { ImportedVocabulary } from "~/lib/vocab.server";

export type AiLessonGroup = {
  level: string;
  title: string;
  description?: string;
  vocabularies: ImportedVocabulary[];
};

export type AiQuizQuestion = {
  type: QuizType;
  question: string;
  promptMeaning?: string;
  promptPinyin?: string;
  options: string[];
  answer: string;
};

type DeepSeekMessage = {
  role: "system" | "user";
  content: string;
};

type DeepSeekResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

function extractJson<T>(text: string): T {
  const match =
    text.match(/```json([\s\S]*?)```/) || text.match(/```([\s\S]*?)```/);
  const raw = match ? match[1] : text;
  return JSON.parse(raw.trim()) as T;
}

function getDeepSeekConfig() {
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Thiếu DEEPSEEK_API_KEY để phân bài và tạo quiz bằng AI.");
  }

  return {
    apiKey,
    baseUrl: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com",
    model: process.env.DEEPSEEK_MODEL || "deepseek-v4-flash",
  };
}

async function callDeepSeek(messages: DeepSeekMessage[]) {
  const { apiKey, baseUrl, model } = getDeepSeekConfig();
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DeepSeek API lỗi: ${response.status} ${errorText}`);
  }

  const result = (await response.json()) as DeepSeekResponse;
  const content = result.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new Error("DeepSeek không trả về nội dung hợp lệ.");
  }

  return content;
}

function normalizeQuizType(value: unknown): QuizType {
  const type = String(value || "")
    .trim()
    .toUpperCase();

  if (type === "PINYIN") return "PINYIN";
  if (type === "CHAR_RECOGNITION") return "CHAR_RECOGNITION";
  if (type === "HANZI_WRITING") return "HANZI_WRITING";
  return "MEANING";
}

function normalizeQuizItem(item: unknown): AiQuizQuestion | null {
  if (!item || typeof item !== "object") return null;

  const record = item as Record<string, unknown>;
  const options = Array.isArray(record.options)
    ? record.options.map((option) => String(option).trim()).filter(Boolean)
    : [];
  const answer = String(record.answer || "")
    .trim();
  const question = String(record.question || "")
    .trim();

  const type = normalizeQuizType(record.type);
  const isWriting = type === "HANZI_WRITING";

  if (
    !question ||
    !answer ||
    (!isWriting && (options.length < 2 || !options.includes(answer)))
  ) {
    return null;
  }

  return {
    type,
    question,
    promptMeaning: optionalString(record.promptMeaning),
    promptPinyin: optionalString(record.promptPinyin),
    options,
    answer,
  };
}

function optionalString(value: unknown) {
  const text = String(value || "").trim();
  return text || undefined;
}

export async function splitLessonsByAI(
  vocabularies: ImportedVocabulary[],
  courseTitle?: string,
): Promise<AiLessonGroup[]> {
  const totalWords = vocabularies.length;
  const prompt = `Bạn là chuyên gia thiết kế giáo trình tiếng Trung HSK.
Hãy phân nhóm danh sách từ vựng thành các bài học theo chủ đề.
Yêu cầu:
- Nhóm từ theo chủ đề tự nhiên, ngữ cảnh học và độ liên quan.
- Không được chia quá vụn thành nhiều bài nhỏ.
- Mỗi bài nên có khoảng 6-12 từ.
- Tránh tạo bài dưới 5 từ, trừ khi đó là nhóm từ rất đặc thù và thực sự cần tách riêng.
- Ưu tiên gộp các nhóm gần nhau về ngữ nghĩa thay vì tách quá chi tiết.
- Với tập khoảng 50 từ, số bài hợp lý thường nằm trong khoảng 5-8 bài.
- Với tập ít từ hơn, số bài phải giảm tương ứng.
- Mỗi bài phải có tiêu đề tiếng Việt rõ ràng.
- Mỗi bài có mô tả ngắn 1 câu.
- Giữ nguyên toàn bộ từ vựng, không được bỏ sót, không được thêm từ mới.
- Tổng số từ trong tất cả bài cộng lại phải đúng bằng ${totalWords}.
- Chỉ trả về JSON hợp lệ, không giải thích.
Định dạng:
[{"level":"HSK1","title":"HSK1 - Bài 1: Chào hỏi","description":"...","vocabularies":[{"chinese":"你好","pinyin":"nǐ hǎo","meaningVi":"xin chào","meaningEn":"hello"}]}]
Ngữ cảnh khóa học: ${courseTitle || "HSK tổng hợp"}
Số từ đầu vào: ${totalWords}
Danh sách từ vựng: ${JSON.stringify(vocabularies)}`;

  const content = await callDeepSeek([
    {
      role: "system",
      content: "Bạn chỉ được trả về JSON hợp lệ.",
    },
    {
      role: "user",
      content: prompt,
    },
  ]);

  const groups = extractJson<AiLessonGroup[]>(content);
  if (!Array.isArray(groups) || !groups.length) {
    throw new Error("AI không phân được bài học hợp lệ.");
  }

  return groups
    .map((group) => ({
      level: String(group.level || "HSK1").trim() || "HSK1",
      title: String(group.title || "").trim(),
      description: optionalString(group.description) || "Bài học được phân tự động bằng AI.",
      vocabularies: Array.isArray(group.vocabularies) ? group.vocabularies : [],
    }))
    .filter((group) => group.title && group.vocabularies.length);
}

export async function generateLessonQuizzesByAI(
  lesson: AiLessonGroup,
): Promise<AiQuizQuestion[]> {
  const prompt = `Bạn là người tạo câu hỏi trắc nghiệm cho bài học tiếng Trung HSK.
Hãy tạo quiz cơ bản nhưng hữu ích cho bài học bên dưới.
Yêu cầu:
- Tạo đúng 12 câu.
- Trộn các loại câu hỏi: MEANING, PINYIN, CHAR_RECOGNITION, HANZI_WRITING.
- Với các câu MEANING, PINYIN, CHAR_RECOGNITION: mỗi câu có đúng 4 lựa chọn và answer phải là một trong options.
- Với câu HANZI_WRITING: yêu cầu người học nhìn pinyin và tự viết chữ Hán, options phải là mảng rỗng [].
- Không tạo câu trùng nhau.
- Chỉ dùng dữ liệu có trong bài học.
- Chỉ trả về JSON hợp lệ, không giải thích.
Định dạng:
[{"type":"MEANING","question":"Nghĩa của 你好 là gì?","promptMeaning":"xin chào","promptPinyin":"nǐ hǎo","options":["Xin chào","Tạm biệt","Cảm ơn","Xin lỗi"],"answer":"Xin chào"},{"type":"HANZI_WRITING","question":"Viết chữ Hán tương ứng với pinyin này.","promptMeaning":"xin chào","promptPinyin":"nǐ hǎo","options":[],"answer":"你好"}]
Thông tin bài học: ${JSON.stringify(lesson)}`;

  const content = await callDeepSeek([
    {
      role: "system",
      content: "Bạn chỉ được trả về JSON hợp lệ.",
    },
    {
      role: "user",
      content: prompt,
    },
  ]);

  const quizzes = extractJson<unknown[]>(content);
  if (!Array.isArray(quizzes) || !quizzes.length) {
    throw new Error(`AI không tạo được quiz hợp lệ cho bài "${lesson.title}".`);
  }

  const normalized = quizzes.map(normalizeQuizItem).filter(Boolean) as AiQuizQuestion[];
  if (!normalized.length) {
    throw new Error(`Quiz AI trả về không hợp lệ cho bài "${lesson.title}".`);
  }

  return normalized;
}
