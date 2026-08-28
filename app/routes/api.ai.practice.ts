import type { Route } from "./+types/api.ai.practice";
import { data } from "react-router";
import { requireUser } from "~/lib/auth.server";
import { prisma } from "~/lib/db.server";

type DeepSeekResponse = {
  choices?: Array<{ message?: { content?: string } }>;
};

async function callAI(messages: { role: string; content: string }[]) {
  // 1. Thử Groq
  const groqKey = process.env.GROQ_API_KEY?.trim();
  if (groqKey) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model: process.env.GROQ_MODEL || "qwen/qwen3.6-27b",
          messages,
          stream: false,
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });
      if (res.ok) {
        const result = await res.json();
        const raw = result.choices?.[0]?.message?.content?.trim() || "";
        return raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
      }
    } catch (e) {
      console.warn("[Groq Practice Fallback]:", e);
    }
  }

  // 2. Thử DeepSeek
  const deepseekKey = process.env.DEEPSEEK_API_KEY?.trim();
  if (deepseekKey) {
    try {
      const res = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${deepseekKey}`,
        },
        body: JSON.stringify({
          model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
          messages,
          stream: false,
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });
      if (res.ok) {
        const result = await res.json();
        const raw = result.choices?.[0]?.message?.content?.trim() || "";
        return raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
      }
    } catch (e) {
      console.warn("[DeepSeek Practice Fallback]:", e);
    }
  }

  throw new Error("Không thể kết nối đến AI provider (Groq/DeepSeek).");
}

export async function action({ request }: Route.ActionArgs) {
  const user = await requireUser(request);
  const body = (await request.json()) as {
    intent: "generate" | "check";
    lessonIds?: string[];
    questionId?: string;
    userAnswer?: string;
    history?: { q: string; a: string; correct: boolean }[];
  };

  if (body.intent === "generate") {
    // Lấy từ vựng từ bài học được chọn
    const lessonIds = body.lessonIds || [];
    let vocabularies: { chinese: string; pinyin: string; meaningVi: string; meaningEn?: string | null }[] = [];

    if (lessonIds.length > 0) {
      vocabularies = await prisma.vocabulary.findMany({
        where: { lessonId: { in: lessonIds } },
        select: { chinese: true, pinyin: true, meaningVi: true, meaningEn: true },
        take: 50,
      });
    }

    if (vocabularies.length === 0) {
      // Fallback: lấy từ vựng ngẫu nhiên
      vocabularies = await prisma.vocabulary.findMany({
        select: { chinese: true, pinyin: true, meaningVi: true, meaningEn: true },
        take: 30,
        orderBy: { createdAt: "desc" },
      });
    }

    if (vocabularies.length === 0) {
      return data({ error: "Chưa có dữ liệu từ vựng để luyện tập." }, { status: 400 });
    }

    const vocabList = vocabularies.map((v) => `${v.chinese} (${v.pinyin}) = ${v.meaningVi}`).join("\n");

    const systemMsg = `Bạn là giáo viên tiếng Trung. Hãy tạo 1 câu hỏi luyện tập từ danh sách từ vựng sau.
Trả về JSON (không markdown) theo định dạng:
{"type":"meaning|pinyin|recognition","question":"câu hỏi","options":["A","B","C","D"],"answer":"đáp án đúng","explanation":"giải thích ngắn"}

- type=meaning: đưa chữ Hán, hỏi nghĩa
- type=pinyin: đưa chữ Hán, hỏi pinyin
- type=recognition: đưa nghĩa/pinyin, hỏi chữ Hán phù hợp
- options: 4 đáp án, 1 đúng, 3 sai (lấy từ danh sách có sẵn)
- answer: đáp án đúng, chính xác từ danh sách trên
- explanation: giải thích ngắn bằng tiếng Việt`;

    const content = await callAI([
      { role: "system", content: systemMsg },
      { role: "user", content: `Danh sách từ vựng:\n${vocabList}\n\nHãy tạo 1 câu hỏi. Trả về JSON thuần.` },
    ]);

    // Parse JSON từ response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return data({ error: "AI không tạo được câu hỏi." }, { status: 502 });
    }

    try {
      const question = JSON.parse(jsonMatch[0]);
      const questionId = `ai-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      return data({
        question: {
          id: questionId,
          type: question.type || "meaning",
          question: question.question || "",
          options: Array.isArray(question.options) ? question.options : [],
          answer: question.answer || "",
          explanation: question.explanation || "",
        },
      });
    } catch {
      return data({ error: "AI trả về định dạng không hợp lệ." }, { status: 502 });
    }
  }

  if (body.intent === "check") {
    const { questionId, userAnswer, history } = body;
    if (!userAnswer?.trim()) {
      return data({ error: "Vui lòng nhập câu trả lời." }, { status: 400 });
    }
    const lastQ = history?.[history.length - 1];
    const correct = userAnswer.trim().toLowerCase() === lastQ?.a.trim().toLowerCase();

    // AI Feedback
    const feedbackMsg = `Học viên trả lời câu hỏi: "${lastQ?.q}"
Đáp án đúng: "${lastQ?.a}"
Câu trả lời của học viên: "${userAnswer}"
Kết quả: ${correct ? "ĐÚNG" : "SAI"}

Hãy đưa ra phản hồi ngắn (1-2 câu) bằng tiếng Việt, khuyến khích học viên. Nếu sai, giải thích nhẹ nhàng.`;

    const feedback = await callAI([
      { role: "system", content: "Bạn là giáo viên tiếng Trung vui tính." },
      { role: "user", content: feedbackMsg },
    ]);

    return data({ correct, feedback, correctAnswer: lastQ?.a || "" });
  }

  return data({ error: "intent không hợp lệ." }, { status: 400 });
}
