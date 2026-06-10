import type { Route } from "./+types/api.ai.chat";
import { data } from "react-router";
import { requireUser } from "~/lib/auth.server";
import { prisma } from "~/lib/db.server";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type AIResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

interface AIProvider {
  name: string;
  type: "openai" | "google";
  apiKey: string;
  baseUrl: string;
  model: string;
}

function getProviders(): AIProvider[] {
  const providers: AIProvider[] = [];

  // Ollama (local) - no API key needed
  const ollamaUrl = process.env.OLLAMA_URL?.trim();
  if (ollamaUrl) {
    providers.push({
      name: "Ollama",
      type: "openai",
      apiKey: "ollama",
      baseUrl: ollamaUrl,
      model: process.env.OLLAMA_MODEL || "llama3.1:8b",
    });
  }

  // Google AI Studio (Gemini)
  const googleKey = process.env.GOOGLE_API_KEY?.trim();
  if (googleKey) {
    providers.push({
      name: "Google",
      type: "google",
      apiKey: googleKey,
      baseUrl: "https://generativelanguage.googleapis.com/v1beta",
      model: process.env.GOOGLE_MODEL || "gemini-2.0-flash",
    });
  }

  // DeepSeek
  const dsKey = process.env.DEEPSEEK_API_KEY?.trim();
  if (dsKey) {
    providers.push({
      name: "DeepSeek",
      type: "openai",
      apiKey: dsKey,
      baseUrl: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com",
      model: process.env.DEEPSEEK_MODEL || "deepseek-v4-flash",
    });
  }

  // OpenAI
  const oaKey = process.env.OPENAI_API_KEY?.trim();
  if (oaKey) {
    providers.push({
      name: "OpenAI",
      type: "openai",
      apiKey: oaKey,
      baseUrl: process.env.OPENAI_BASE_URL || "https://api.openai.com",
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    });
  }

  // Groq
  const gqKey = process.env.GROQ_API_KEY?.trim();
  if (gqKey) {
    providers.push({
      name: "Groq",
      type: "openai",
      apiKey: gqKey,
      baseUrl: process.env.GROQ_BASE_URL || "https://api.groq.com/openai",
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
    });
  }

  // Any generic OpenAI-compatible provider
  const customKey = process.env.AI_CUSTOM_KEY?.trim();
  if (customKey) {
    providers.push({
      name: process.env.AI_CUSTOM_NAME || "Custom",
      type: "openai",
      apiKey: customKey,
      baseUrl: process.env.AI_CUSTOM_BASE_URL || "https://api.openai.com",
      model: process.env.AI_CUSTOM_MODEL || "gpt-4o-mini",
    });
  }

  return providers;
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function callProvider(provider: AIProvider, messages: { role: string; content: string }[], temperature: number) {
  // Google AI Studio uses a different API format
  if (provider.type === "google") {
    const systemMsg = messages.find((m) => m.role === "system");
    const chatMsgs = messages.filter((m) => m.role !== "system");

    const body: any = {
      contents: chatMsgs.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
      generationConfig: { temperature, maxOutputTokens: 2000 },
    };
    if (systemMsg) {
      body.systemInstruction = { parts: [{ text: systemMsg.content }] };
    }

    const res = await fetch(
      `${provider.baseUrl}/models/${provider.model}:generateContent?key=${provider.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`${provider.name} error ${res.status}: ${t.slice(0, 200)}`);
    }
    const result = await res.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    return result.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
  }

  // OpenAI-compatible API
  const res = await fetch(`${provider.baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify({
      model: provider.model,
      messages,
      stream: false,
      temperature,
      max_tokens: 2000,
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`${provider.name} error ${res.status}: ${t.slice(0, 200)}`);
  }
  const result = (await res.json()) as AIResponse;
  return result.choices?.[0]?.message?.content?.trim() || "";
}

async function callAI(messages: { role: string; content: string }[], temperature = 0.7): Promise<string> {
  const providers = getProviders();
  if (providers.length === 0) {
    throw new Error("Chưa cấu hình AI provider nào. Thêm DEEPSEEK_API_KEY, OPENAI_API_KEY, hoặc GROQ_API_KEY vào .env.");
  }

  const errors: string[] = [];
  for (const provider of providers) {
    try {
      const content = await callProvider(provider, messages, temperature);
      if (content) return content;
      errors.push(`${provider.name}: phản hồi rỗng`);
    } catch (err: any) {
      const msg = err?.message || String(err);
      errors.push(`${provider.name}: ${msg}`);
      console.warn(`AI fallback: ${msg}`);
    }
  }

  throw new Error(`Tất cả AI provider đều lỗi:\n${errors.join("\n")}`);
}

const SYSTEM_PROMPT = `Bạn là trợ lý AI học tiếng Trung, chuyên giúp người dùng học từ vựng, ngữ pháp, phát âm và luyện thi HSK.

Quy tắc:
- Trả lời bằng TIẾNG VIỆT, ngắn gọn, dễ hiểu.
- Khi giải thích từ vựng: đưa chữ Hán, pinyin, nghĩa tiếng Việt, ví dụ.
- Khi giải thích ngữ pháp: đưa cấu trúc, ví dụ có pinyin và nghĩa.
- Khi người dùng hỏi về cách viết chữ Hán: hướng dẫn thứ tự nét cơ bản.
- Luôn khuyến khích và tạo động lực học tập.
- Nếu câu hỏi không liên quan đến tiếng Trung, nhẹ nhàng gợi ý quay lại chủ đề học tập.`;

export async function action({ request }: Route.ActionArgs) {
  const user = await requireUser(request);
  const body = (await request.json()) as {
    intent?: "chat" | "practice_generate" | "practice_check";
    messages?: ChatMessage[];
    lessonIds?: string[];
    roadmapId?: string;
    previousWords?: string[];
    userAnswer?: string;
    question?: string;
    correctAnswer?: string;
  };

  const intent = body.intent || "chat";

  // ===== CHAT MODE =====
  if (intent === "chat") {
    const messages = body.messages || [];
    if (!messages.length) {
      return data({ error: "Vui lòng gửi tin nhắn." }, { status: 400 });
    }

    try {
      const content = await callAI([
        { role: "system", content: SYSTEM_PROMPT },
        ...messages.slice(-20),
      ]);
      return data({ reply: content });
    } catch (err) {
      console.error("AI Chat error:", err);
      return data({ error: "AI đang bận, vui lòng thử lại sau." }, { status: 502 });
    }
  }

  // ===== PRACTICE: GENERATE QUESTION =====
  if (intent === "practice_generate") {
    const lessonIds = body.lessonIds || [];
    const roadmapId = body.roadmapId;
    let vocabularies: { chinese: string; pinyin: string; meaningVi: string }[] = [];

    // Try lesson IDs first
    if (lessonIds.length > 0) {
      vocabularies = await prisma.vocabulary.findMany({
        where: { lessonId: { in: lessonIds } },
        select: { chinese: true, pinyin: true, meaningVi: true },
        take: 50,
      });
    }

    // Try roadmap ID
    if (vocabularies.length === 0 && roadmapId) {
      const roadmap = await prisma.roadmapItem.findUnique({ where: { id: roadmapId } });
      if (roadmap) {
        const rawVocab = (roadmap.vocabulary as any[]) || [];
        const rawPhrases = (roadmap.phrases as any[]) || [];
        vocabularies = [...rawVocab, ...rawPhrases].map((v: any) => ({
          chinese: v.chinese || "",
          pinyin: v.pinyin || "",
          meaningVi: v.meaningVi || v.meaning || "",
        }));
      }
    }

    // Fallback to random
    if (vocabularies.length === 0) {
      vocabularies = await prisma.vocabulary.findMany({
        select: { chinese: true, pinyin: true, meaningVi: true },
        take: 40,
        orderBy: { createdAt: "desc" },
      });
    }
    // Filter out previously used words
    const previousWords = body.previousWords || [];
    if (previousWords.length > 0) {
      vocabularies = vocabularies.filter((v) => !previousWords.includes(v.chinese));
    }

    if (vocabularies.length === 0) {
      return data({ error: "Chưa có dữ liệu từ vựng để luyện tập." }, { status: 400 });
    }

    // Shuffle to avoid AI picking the same words every time
    const shuffled = shuffleArray(vocabularies);
    const vocabList = shuffled.map((v) => `${v.chinese} (${v.pinyin}) = ${v.meaningVi}`).join("\n");

    const prompt = `Bạn là giáo viên tiếng Trung. Từ danh sách từ vựng sau, hãy chọn NGẪU NHIÊN 1 từ và tạo 1 câu hỏi trắc nghiệm.
QUAN TRỌNG: Mỗi lần gọi phải chọn từ KHÁC NHAU, không lặp lại từ đã dùng trước đó.
Chỉ trả về JSON (không markdown), format:
{"type":"meaning|pinyin|recognition","question":"câu hỏi","options":["A","B","C","D"],"answer":"đáp án","explanation":"giải thích"}

Danh sách từ:
${vocabList}`;

    try {
      const content = await callAI([
        { role: "system", content: "Trả về JSON thuần, không markdown. Mỗi lần chọn từ khác nhau." },
        { role: "user", content: prompt },
      ], 1.0); // higher temperature for variety

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return data({ error: "AI không tạo được câu hỏi." }, { status: 502 });

      const q = JSON.parse(jsonMatch[0]);
      return data({
        question: {
          id: `q-${Date.now()}`,
          type: q.type || "meaning",
          question: q.question || "",
          options: Array.isArray(q.options) ? q.options : [],
          answer: q.answer || "",
          explanation: q.explanation || "",
        },
      });
    } catch {
      return data({ error: "AI trả về định dạng không hợp lệ." }, { status: 502 });
    }
  }

  // ===== PRACTICE: CHECK ANSWER =====
  if (intent === "practice_check") {
    const { userAnswer, question, correctAnswer } = body;
    if (!userAnswer?.trim() || !correctAnswer) {
      return data({ error: "Thiếu thông tin." }, { status: 400 });
    }

    const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ").replace(/[()（）]/g, "");
    const userNorm = normalize(userAnswer);
    const correctNorm = normalize(correctAnswer);
    // Check exact match, or user answer is contained in/contains correct answer
    const isCorrect = userNorm === correctNorm || userNorm.includes(correctNorm) || correctNorm.includes(userNorm);

    try {
      const feedback = await callAI([
        {
          role: "system",
          content: "Bạn là giáo viên tiếng Trung vui tính. Phản hồi ngắn 1-2 câu bằng tiếng Việt.",
        },
        {
          role: "user",
          content: `Câu hỏi: "${question}"
Đáp án đúng: "${correctAnswer}"
Học viên trả lời: "${userAnswer}"
Kết quả: ${isCorrect ? "ĐÚNG" : "SAI"}
Hãy đưa ra phản hồi khuyến khích.`,
        },
      ]);

      return data({
        correct: isCorrect,
        feedback: feedback || (isCorrect ? "Chính xác! 🎉" : `Đáp án đúng: ${correctAnswer}`),
      });
    } catch {
      return data({ correct: isCorrect, feedback: "" });
    }
  }

  return data({ error: "intent không hợp lệ." }, { status: 400 });
}
