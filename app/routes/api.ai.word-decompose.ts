import type { ActionFunctionArgs } from "react-router";
import { prisma } from "~/lib/db.server";

interface AIProvider {
  name: string;
  type: "google" | "openai";
  apiKey: string;
  baseUrl: string;
  model: string;
}

// In-memory cache for fast session response (Database handles persistent storage)
const decomposeCache = new Map<string, any>();

function getProviders(): AIProvider[] {
  const providers: AIProvider[] = [];

  // 1. Google Gemini (Free & High Rate Limit)
  const googleKey = process.env.GOOGLE_API_KEY?.trim();
  if (googleKey) {
    providers.push({
      name: "Google",
      type: "google",
      apiKey: googleKey,
      baseUrl: "https://generativelanguage.googleapis.com/v1beta",
      model: process.env.GOOGLE_MODEL || "gemini-1.5-flash",
    });
  }

  // 2. Groq
  const gqKey = process.env.GROQ_API_KEY?.trim();
  if (gqKey) {
    providers.push({
      name: "Groq",
      type: "openai",
      apiKey: gqKey,
      baseUrl: process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1",
      model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
    });
  }

  // 3. DeepSeek
  const dsKey = process.env.DEEPSEEK_API_KEY?.trim();
  if (dsKey) {
    providers.push({
      name: "DeepSeek",
      type: "openai",
      apiKey: dsKey,
      baseUrl: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com",
      model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
    });
  }

  return providers;
}

function parseJsonSafe(raw: string): any {
  if (!raw || typeof raw !== "string") return null;

  // 1. Clean markdown code fences (```json ... ``` or ``` ...)
  let cleaned = raw.replace(/```(?:json)?\s*/gi, "").replace(/```/g, "").trim();

  // 2. Extract JSON object boundary
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  // 3. Attempt direct parse
  try {
    return JSON.parse(cleaned);
  } catch {
    // 4. Try cleaning trailing commas
    try {
      const sanitized = cleaned
        .replace(/,\s*}/g, "}")
        .replace(/,\s*\]/g, "]")
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, " "); // strip control chars
      return JSON.parse(sanitized);
    } catch {
      return null;
    }
  }
}

async function callProvider(
  provider: AIProvider,
  messages: { role: string; content: string }[],
  temperature = 0.6
): Promise<string> {
  if (provider.type === "google") {
    const contents: Array<{ role?: string; parts: Array<{ text: string }> }> = [];
    let systemInstruction: { parts: Array<{ text: string }> } | undefined;

    for (const msg of messages) {
      if (msg.role === "system") {
        systemInstruction = { parts: [{ text: msg.content }] };
      } else {
        contents.push({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }],
        });
      }
    }

    const url = `${provider.baseUrl}/models/${provider.model}:generateContent?key=${provider.apiKey}`;
    const payload: any = {
      contents,
      generationConfig: {
        temperature,
        maxOutputTokens: 3000,
        responseMimeType: "application/json",
      },
    };
    if (systemInstruction) {
      payload.systemInstruction = systemInstruction;
    }

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`${provider.name} API ${res.status}: ${errText}`);
    }

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  }

  // OpenAI-compatible format (Groq, DeepSeek)
  const url = `${provider.baseUrl}/chat/completions`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify({
      model: provider.model,
      messages,
      temperature,
      max_tokens: 3000,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`${provider.name} API ${res.status}: ${errText}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "{}";
}

function buildFallbackDecompose(word: string, meaning: string) {
  return {
    collocations: [
      { zh: word, pinyin: "", vi: `Từ gốc: ${meaning}` },
      { zh: `很${word}`, pinyin: "", vi: `Rất ${meaning}` },
      { zh: `${word}的`, pinyin: "", vi: `Của ${word}` },
      { zh: `${word}们`, pinyin: "", vi: `Các ${word}` },
    ],
    sentenceChallenge: {
      chinese: `我很喜欢${word}`,
      pinyin: `wǒ hěn xǐ huan ${word}`,
      meaningVi: `Tôi rất thích ${meaning}`,
      tokens: ["我", "很", "喜欢", word],
      distractors: ["不", "也"],
    },
  };
}

export async function action({ request }: ActionFunctionArgs) {
  try {
    const { word, meaning, level, force } = await request.json();
    if (!word) {
      return Response.json({ error: "Missing word" }, { status: 400 });
    }

    const cacheKey = `${word}-${level || "HSK"}`;
    if (!force && decomposeCache.has(cacheKey)) {
      return Response.json(decomposeCache.get(cacheKey));
    }

    // 1. Check in Database first
    if (!force) {
      try {
        const existingInDb = await (prisma.vocabulary as any).findFirst({
          where: {
            chinese: word,
            collocations: { not: null },
          },
          select: {
            collocations: true,
            sentenceChallenge: true,
            aiData: true,
          },
        });

        if (existingInDb && existingInDb.collocations) {
          const dbData = (existingInDb.aiData as any) || {
            collocations: existingInDb.collocations || [],
            sentenceChallenge: existingInDb.sentenceChallenge || undefined,
          };
          decomposeCache.set(cacheKey, dbData);
          return Response.json(dbData);
        }
      } catch (dbErr) {
        console.warn("[AI Decompose] DB read warning:", dbErr);
      }
    }

    const prompt = `Bạn là một chuyên gia ngôn ngữ Hán ngữ cao cấp và sư phụ giảng dạy HSK.
Hãy phân tích và tạo nội dung học tập thông minh cho từ Hán vựng: "${word}" (Nghĩa: "${meaning || ""}", Trình độ: "${level || "HSK"}").

Yêu cầu trả về đúng 4 cụm từ ghép mở rộng thông dụng nhất (tạo thành lưới 2x2 cân đối) và 1 câu đố ghép câu giao tiếp thực tế theo định dạng JSON thuần túy:
{
  "collocations": [
    { "zh": "Cụm từ 1", "pinyin": "pinyin 1", "vi": "nghĩa tiếng Việt 1" },
    { "zh": "Cụm từ 2", "pinyin": "pinyin 2", "vi": "nghĩa tiếng Việt 2" },
    { "zh": "Cụm từ 3", "pinyin": "pinyin 3", "vi": "nghĩa tiếng Việt 3" },
    { "zh": "Cụm từ 4", "pinyin": "pinyin 4", "vi": "nghĩa tiếng Việt 4" }
  ],
  "sentenceChallenge": {
    "chinese": "Một câu giao tiếp thực tế ngắn gọn (4-8 chữ Hán) chứa từ '${word}'",
    "pinyin": "Pinyin đầy đủ của câu",
    "meaningVi": "Dịch nghĩa tiếng Việt tự nhiên",
    "tokens": ["Các", "từ", "ghép", "được", "bóc", "tách", "riêng"],
    "distractors": ["1-2 từ đánh lạc hướng không có trong câu"]
  }
}`;

    const providers = getProviders();
    let resultJson = null;

    for (const provider of providers) {
      try {
        const raw = await callProvider(
          provider,
          [
            {
              role: "system",
              content:
                "You are an expert Chinese linguistics teacher. Always return strictly valid JSON object matching the required schema.",
            },
            { role: "user", content: prompt },
          ],
          0.5
        );
        const parsed = parseJsonSafe(raw);
        if (
          parsed &&
          Array.isArray(parsed.collocations) &&
          parsed.collocations.length >= 3
        ) {
          resultJson = parsed;
          break;
        }
      } catch (err: any) {
        console.warn(`[AI Decompose] Provider ${provider.name} failed:`, err?.message || err);
      }
    }

    if (!resultJson) {
      resultJson = buildFallbackDecompose(word, meaning);
    }

    // 2. Persist to Database for all matching vocabulary records
    try {
      await (prisma.vocabulary as any).updateMany({
        where: { chinese: word },
        data: {
          collocations: resultJson.collocations,
          sentenceChallenge: resultJson.sentenceChallenge,
          aiData: resultJson,
        },
      });
    } catch (dbSaveErr) {
      console.warn("[AI Decompose] DB save warning:", dbSaveErr);
    }

    // 3. Cache response in-memory
    decomposeCache.set(cacheKey, resultJson);

    return Response.json(resultJson);
  } catch (error: any) {
    console.error("api.ai.word-decompose fatal error:", error);
    return Response.json(buildFallbackDecompose("词", "Từ vựng"));
  }
}
