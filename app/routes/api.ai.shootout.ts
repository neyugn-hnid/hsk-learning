import type { Route } from "./+types/api.ai.shootout";
import { data } from "react-router";
import { prisma } from "~/lib/db.server";

type ShootoutGeneratedQuestion = {
  id?: string;
  sentence: string;
  options: [string, string, string, string];
  correctIndex: number;
  meaningVi: string;
  pinyin: string;
  explanation: string;
  level?: string;
  source?: string;
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

  // 1. Groq (Siêu nhanh, miễn phí, model openai/gpt-oss-120b)
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

  // 2. DeepSeek (deepseek-chat)
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

  // 3. OpenAI
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

  // 4. Google AI Studio (Dự phòng cuối)
  const googleKey = process.env.GOOGLE_API_KEY?.trim();
  if (googleKey) {
    providers.push({
      name: "Google",
      type: "google",
      apiKey: googleKey,
      baseUrl: "https://generativelanguage.googleapis.com/v1beta",
      model: process.env.GOOGLE_MODEL || "gemini-2.5-flash",
    });
  }

  // 5. Ollama (local)
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

  return providers;
}

async function callProvider(provider: AIProvider, messages: { role: string; content: string }[], temperature: number) {
  if (provider.type === "google") {
    const systemMsg = messages.find((m) => m.role === "system");
    const chatMsgs = messages.filter((m) => m.role !== "system");

    const body: any = {
      contents: chatMsgs.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
      generationConfig: {
        temperature,
        maxOutputTokens: 2500,
        responseMimeType: "application/json",
      },
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
    const result = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    return text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  }

  // OpenAI / DeepSeek / Groq
  const chatUrl = provider.baseUrl.endsWith("/v1")
    ? `${provider.baseUrl}/chat/completions`
    : `${provider.baseUrl}/v1/chat/completions`;

  const requestBody: Record<string, any> = {
    model: provider.model,
    messages,
    stream: false,
    temperature,
    max_tokens: 2500,
  };

  if (provider.name === "Groq") {
    requestBody.reasoning_format = "hidden";
  }

  const res = await fetch(chatUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`${provider.name} error ${res.status}: ${t.slice(0, 200)}`);
  }
  const result = await res.json();
  const rawText = result.choices?.[0]?.message?.content?.trim() || "";
  return rawText.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
}

async function callAI(messages: { role: string; content: string }[], temperature = 0.7): Promise<string> {
  const providers = getProviders();
  if (providers.length === 0) {
    throw new Error("Không có AI Provider nào khả dụng trong cấu hình.");
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
      console.warn(`[AI Shootout Fallback] ${msg}`);
    }
  }

  throw new Error(`Tất cả AI providers đều thất bại:\n${errors.join("\n")}`);
}

export async function action({ request }: Route.ActionArgs) {
  let standard = "HSK20";
  let level = "HSK1";
  let count = 10;

  try {
    const body = (await request.json()) as {
      standard?: string;
      level?: string;
      topicId?: string;
      lessonTitle?: string;
      count?: number;
      sampleVocab?: Array<{ chinese: string; pinyin: string; meaningVi: string }>;
    };

    standard = body.standard || "HSK20";
    level = body.level || "HSK1";
    const lessonTitle = body.lessonTitle || "";
    count = Math.min(15, Math.max(1, body.count || 10));

    let vocabContext = "";
    if (body.sampleVocab && body.sampleVocab.length > 0) {
      vocabContext = body.sampleVocab
        .slice(0, 15)
        .map((v) => `- ${v.chinese} (${v.pinyin}): ${v.meaningVi}`)
        .join("\n");
    }

    // BẢNG QUY TẮC NGỮ PHÁP HSK CHUẨN (HSK 1 - HSK 6 & HSK 7-9)
    const grammarMap: Record<string, string> = {
      HSK1: `CÁC DẠNG NGỮ PHÁP HSK 1:
1. Trợ từ sở hữu '的' ([Chủ sở hữu] + 的 + [Danh từ trung tâm]).
2. Câu phán đoán chữ '是' ([Chủ ngữ] + 是 + [Tân ngữ/Danh từ]).
3. Câu sở hữu/tồn tại chữ '有' ([Chủ ngữ] + 有 + [Số lượng] + [Danh từ]).
4. Trạng ngữ nơi chốn '在' ([Chủ ngữ] + 在 [Địa điểm] + [Động từ]).
5. Động từ năng nguyện '想' (muốn), '会' (biết/kỹ năng), '能' (có thể).
6. Đại từ nghi vấn: 什么 (gì), 谁 (ai), 哪儿 (ở đâu), 几 (mấy), 怎么 (thế nào).
7. Trợ từ nghi vấn cuối câu: 吗 (không?), 呢 (thì sao/đang?), 吧 (nhé/đi).
8. Lượng từ danh từ cơ bản: 个, 本 (sách), 支 (bút), 张 (bàn/giấy), 块 (đồng/miếng).
9. Câu vị ngữ tính từ đi với phó từ mức độ '很', '太...了' (không dùng 是 với tính từ).`,

      HSK2: `CÁC DẠNG NGỮ PHÁP HSK 2:
1. Câu so sánh chữ '比' (A + 比 + B + [Tính từ/Bổ ngữ]).
2. Bổ ngữ trạng thái/mức độ với '得' ([Động từ] + 得 + [Phó từ] + [Tính từ]).
3. Cấu trúc nhấn mạnh quá khứ '是...的' (nhấn mạnh thời gian, địa điểm, phương thức).
4. Động tác đang tiếp diễn: 正在...呢, [Động từ] + 着.
5. Hành động sắp diễn ra: 快要...了, 就要...了.
6. Cặp liên từ nguyên nhân - kết quả: 因为...所以...
7. Cặp liên từ chuyển ngoặt: 虽然...但是...
8. Bổ ngữ kết quả cơ bản: 完 (xong), 好 (xong/tốt), 懂 (hiểu), 见 (thấy), 对/错.
9. Câu cấm đoán, cầu khiến: 别...了, 不要...
10. Giới từ cự ly & phương hướng: 离 (cách), 从...到... (từ... đến...), 往/向 (về phía).`,

      HSK3: `CÁC DẠNG NGỮ PHÁP HSK 3:
1. Câu chữ '把' xử lý tân ngữ ([Chủ ngữ] + 把 + [Tân ngữ] + [Động từ] + [Thành phần khác]).
2. Câu chữ '被' / '让' / '叫' bị động ([Chủ ngữ chịu tác động] + 被 + [Chủ thể] + [Động từ]).
3. Cấu trúc tăng tiến: 越...越... (càng... càng...), 越来越... (càng ngày càng...).
4. Cấu trúc loại trừ: 除了...以外 (都/还...) (Ngoài... ra...).
5. Bổ ngữ xu hướng đơn & kép: 出来, 进去, 上来, 下去, 站起来, 走过去.
6. Bổ ngữ khả năng: 看得懂 / 看不懂, 听得清楚 / 听不清楚, 做得完 / 做不完.
7. Cặp liên từ điều kiện giả định: 只要...就... (Chỉ cần... thì...), 如果...就... (Nếu... thì...).
8. Cặp liên từ hành động song song: 一边...一边... (Vừa... vừa...).
9. Cặp liên từ thời gian liên tiếp: 一...就... (Vừa mới... đã...), 先...然后... (Trước tiên... sau đó...).`,

      HSK4: `CÁC DẠNG NGỮ PHÁP HSK 4:
1. Cặp liên từ tăng tiến: 不仅...而且... / 不但...还... (Không những... mà còn...).
2. Cấu trúc nhấn mạnh cực đoan: 连...都/也... (Ngay cả... cũng...).
3. Cấu trúc tương phản/lựa chọn: 不是...而是... (Không phải... mà là...), 要么...要么...
4. Giới từ chỉ căn cứ & đối tượng: 根据 (căn cứ vào), 对于 (đối với), 关于 (về việc), 按照.
5. Phân biệt chính xác 3 trợ từ: 的 (Định ngữ + Danh từ), 地 (Trạng ngữ + Động từ), 得 (Động từ + Bổ ngữ).
6. Cặp liên từ nhượng bộ: 哪怕...也... (Cho dù... cũng...), 即使...也... (Dù cho... cũng...).
7. Bổ ngữ xu hướng mở rộng: [Động từ] + 起来 (bắt đầu & phát triển), [Động từ] + 下去 (duy trì tiếp tục).
8. Câu tồn hiện: [Nơi chốn] + [Động từ] + 着/了 + [Danh từ/Số lượng] (biểu thị sự tồn tại, xuất hiện).`,

      HSK5: `CÁC DẠNG NGỮ PHÁP HSK 5:
1. Mẫu câu vô điều kiện: 无论/不管...都/也... (Bất luận/Bất kể... đều...).
2. Mẫu câu so sánh lựa chọn: 与其...不如... (Thay vì... chi bằng...), 宁可...也不... (Thà... chứ không...).
3. Cấu trúc giới từ mở đầu luận điểm: 从...角度来看 (Xét từ góc độ...), 就...而言 (Đối với/Xét về...), 在...方面.
4. Cặp liên từ nguyên cớ logic: 既然...就... (Đã... thì...).
5. Phó từ ngữ khí & liên kết logic: 究竟 (rốt cuộc), 偏偏 (trớ trêu/lại cứ), 未免 (e rằng/không tránh khỏi), 固然...但是... (tuy rằng... nhưng...).
6. Câu bị động trang trọng / chính quy: 由...负责 (Do... phụ trách), 为...所... (Được... bởi...).
7. Cấu trúc đảo ngữ đưa tân ngữ lên đầu câu để nhấn mạnh.`,

      HSK6: `CÁC DẠNG NGỮ PHÁP HSK 6 & HSK 7-9:
1. Cấu trúc văn ngôn & trang trọng: 鉴于 (Xét thấy), 基于 (Dựa trên), 藉此 (Nhân dịp này), 毋庸置疑 (Không còn nghi ngờ gì), 以便, 以免.
2. Bổ ngữ khả năng cao cấp: 经得起 (Chịu đựng được thử thách), 禁不住 (Không kìm được), 顾得上 / 顾不上 (Có kịp lo / Không kịp lo).
3. Mẫu câu điều kiện duy nhất: 唯有...方能... (Chỉ có... mới có thể...), 非...不可 (Không... không được), 除非...否则...
4. Cặp liên từ đối ứng văn học: 既...又..., 固...亦..., 倘若...则... (Nếu như... thì...).
5. Thành ngữ 4 chữ biểu đạt tư tưởng triết học và lập luận học thuật sâu sắc.`,
    };

    const targetGrammarRules = grammarMap[level] || grammarMap.HSK1;

    const systemPrompt = `Bạn là chuyên gia ngôn ngữ học tiếng Hán và khảo thí HSK hàng đầu thế giới.
Nhiệm vụ của bạn là tạo ${count} câu hỏi trắc nghiệm ĐIỀN TỪ VÀO CHỖ TRỐNG THEO NGỮ PHÁP (Grammar Fill-in-the-blank) cho trò chơi "Sút Phạt Đền HSK".

NGUYÊN TẮC QUAN TRỌNG:
- BƯỚC 1: Tạo một câu tiếng Trung HOÀN CHỈNH, CÓ NGHĨA TỰ NHIÊN, CHUẨN NGỮ CẢNH, áp dụng đúng cấu trúc ngữ pháp của cấp độ ${level} (${standard}).
- BƯỚC 2: BỎ TRỐNG ĐÚNG 1 TỪ/CỤM TỪ KHÓA NGỮ PHÁP (ký hiệu bằng "____") để người chơi kiểm tra kiến thức ngữ pháp đó (ví dụ: liên từ, trợ từ 的/得/地, giới từ, bổ ngữ kết quả/khả năng/xu hướng, lượng từ, cấu trúc câu chữ 把/被/比, v.v.).
- BƯỚC 3: Tạo 4 phương án lựa chọn (options: [A, B, C, D]) gồm 1 đáp án ĐÚNG và 3 đáp án SAI (từ gây nhiễu cùng từ loại ngữ pháp, cùng độ khó, dễ nhầm lẫn).

HỆ THỐNG NGỮ PHÁP CẦN ÁP DỤNG CHO CẤP ĐỘ ${level}:
${targetGrammarRules}

${lessonTitle ? `Gắn liền với chủ đề bài học: "${lessonTitle}"` : ""}
${vocabContext ? `Lồng ghép tự nhiên các từ vựng sau vào câu:\n${vocabContext}` : ""}

ĐỊNH DẠNG ĐẦU RA (BẮT BUỘC TRẢ VỀ JSON THUẦN):
{
  "questions": [
    {
      "sentence": "虽然今天天气很冷，____ 我还是坚持去公园跑步了。",
      "options": ["但是", "因为", "所以", "如果"],
      "correctIndex": 0,
      "meaningVi": "Tuy rằng hôm nay trời rất lạnh, nhưng tôi vẫn kiên trì đi công viên chạy bộ.",
      "pinyin": "Suīrán jīntiān tiānqì hěn lěng, dànshì wǒ háishì jiānchí qù gōngyuán pǎobù le.",
      "explanation": "Cấu trúc liên từ chuyển ngoặt: 虽然...但是... (Tuy... nhưng...). Vế sau cần dùng '但是'."
    }
  ]
}`;

    const rawResponse = await callAI(
      [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Hãy tạo ngẫu nhiên ${count} câu hỏi điền từ ngữ pháp HSK cấp độ ${level} (${standard}) hoàn toàn mới lạ, phong phú, không trùng lặp. Đa dạng hóa các chủ đề đời sống, công việc, học tập, du lịch, cảm xúc. Random Seed: ${Date.now()}. Trả về JSON thuần có key "questions".`,
        },
      ],
      0.85
    );

    let rawQuestions: any[] = [];
    try {
      const cleanJson = rawResponse.replace(/```json\s*|```/gi, "").trim();
      const parsed = JSON.parse(cleanJson);
      if (Array.isArray(parsed)) {
        rawQuestions = parsed;
      } else if (parsed && Array.isArray(parsed.questions)) {
        rawQuestions = parsed.questions;
      }
    } catch {
      // Fallback regex matching array or object
      const arrayMatch = rawResponse.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (arrayMatch) {
        try {
          rawQuestions = JSON.parse(arrayMatch[0]);
        } catch {}
      } else {
        const objMatch = rawResponse.match(/\{[\s\S]*\}/);
        if (objMatch) {
          try {
            const parsedObj = JSON.parse(objMatch[0]);
            if (Array.isArray(parsedObj.questions)) {
              rawQuestions = parsedObj.questions;
            }
          } catch {}
        }
      }
    }

    // Format & Shuffle options to ensure correct answers are evenly spread across A, B, C, D
    const formattedQuestions: ShootoutGeneratedQuestion[] = rawQuestions.map((q, idx) => {
      const originalOptions = Array.isArray(q.options) && q.options.length === 4 ? q.options : ["A", "B", "C", "D"];
      const correctWord = originalOptions[q.correctIndex || 0] || originalOptions[0];

      // Shuffle options randomly
      const shuffledOptions = [...originalOptions].sort(() => Math.random() - 0.5);
      const newCorrectIndex = shuffledOptions.indexOf(correctWord);

      return {
        id: `ai-shootout-${Date.now()}-${idx + 1}`,
        sentence: q.sentence || "____",
        options: shuffledOptions as [string, string, string, string],
        correctIndex: newCorrectIndex >= 0 ? newCorrectIndex : 0,
        meaningVi: q.meaningVi || "",
        pinyin: q.pinyin || "",
        explanation: q.explanation || `Đáp án đúng là: ${correctWord}`,
        level,
        source: standard,
      };
    });

    // NẾU TẤT CẢ AI THẤT BẠI HOẶC TRẢ VỀ RỖNG: DÙNG BỘ NGỮ PHÁP DỰ PHÒNG CHUẨN THEO CẤP ĐỘ
    if (formattedQuestions.length === 0) {
      const fallbackQuestions = getGrammarFallbackQuestions(level, standard, count);
      return Response.json({
        success: true,
        questions: fallbackQuestions,
        level,
        standard,
      });
    }

    return Response.json({
      success: true,
      questions: formattedQuestions,
      level,
      standard,
    });
  } catch (error: any) {
    console.warn("[API AI Shootout Fallback Activated]:", error?.message);
    const fallbackQuestions = getGrammarFallbackQuestions(level, standard, count);
    return Response.json({
      success: true,
      questions: fallbackQuestions,
      level,
      standard,
    });
  }
}

// BỘ CÂU HỎI NGỮ PHÁP DỰ PHÒNG THEO TỪNG CẤP ĐỘ HSK 1 - HSK 6
function getGrammarFallbackQuestions(level: string, standard: string, count: number): ShootoutGeneratedQuestion[] {
  const bank: Record<string, Array<{
    sentence: string;
    options: [string, string, string, string];
    correctIndex: number;
    meaningVi: string;
    pinyin: string;
    explanation: string;
  }>> = {
    HSK1: [
      {
        sentence: "这是我 ____ 汉语老师。",
        options: ["的", "得", "地", "了"],
        correctIndex: 0,
        meaningVi: "Đây là giáo viên tiếng Trung của tôi.",
        pinyin: "Zhè shì wǒ de hànyǔ lǎoshī.",
        explanation: "Trợ từ kết cấu '的' dùng để biểu thị mối quan hệ sở hữu giữa đại từ nhân xưng và danh từ trung tâm.",
      },
      {
        sentence: "他 ____ 我们的新同学。",
        options: ["是", "有", "在", "去"],
        correctIndex: 0,
        meaningVi: "Anh ấy là bạn học mới của chúng tôi.",
        pinyin: "Tā shì wǒmen de xīn tóngxué.",
        explanation: "Câu phán đoán chữ '是': [Chủ ngữ] + 是 + [Tân ngữ/Danh từ] khẳng định danh tính.",
      },
      {
        sentence: "我想买一 ____ 汉语词典。",
        options: ["本", "个", "张", "条"],
        correctIndex: 0,
        meaningVi: "Tôi muốn mua một cuốn từ điển tiếng Trung.",
        pinyin: "Wǒ xiǎng mǎi yì běn hànyǔ cídiǎn.",
        explanation: "Lượng từ thích hợp nhất đi kèm với sách/từ điển (书/词典) là '本'.",
      },
      {
        sentence: "今天天气 ____ 好。",
        options: ["很", "是", "在", "有"],
        correctIndex: 0,
        meaningVi: "Hôm nay thời tiết rất đẹp.",
        pinyin: "Jīntiān tiānqì hěn hǎo.",
        explanation: "Trong câu vị ngữ tính từ tiếng Hán, dùng phó từ mức độ '很' đứng trước tính từ.",
      },
      {
        sentence: "你明天去学校 ____ ？",
        options: ["吗", "呢", "吧", "啊"],
        correctIndex: 0,
        meaningVi: "Ngày mai bạn có đi đến trường không?",
        pinyin: "Nǐ míngtiān qù xuéxiào ma?",
        explanation: "Trợ từ nghi vấn '吗' đặt ở cuối câu trần thuật để tạo câu hỏi Có/Không.",
      },
      {
        sentence: "我 ____ 图书馆看书。",
        options: ["在", "从", "往", "离"],
        correctIndex: 0,
        meaningVi: "Tôi đọc sách ở thư viện.",
        pinyin: "Wǒ zài túshūguǎn kànshū.",
        explanation: "Trạng ngữ chỉ nơi chốn: [Chủ ngữ] + 在 [Địa điểm] + [Động từ].",
      },
    ],
    HSK2: [
      {
        sentence: "今天 ____ 昨天冷多了。",
        options: ["比", "跟", "像", "有"],
        correctIndex: 0,
        meaningVi: "Hôm nay lạnh hơn hôm qua nhiều.",
        pinyin: "Jīntiān bǐ zuótiān lěng duō le.",
        explanation: "Cấu trúc so sánh chữ '比': A + 比 + B + [Tính từ] biểu thị sự chênh lệch.",
      },
      {
        sentence: "他汉语说 ____ 非常流利。",
        options: ["得", "的", "地", "了"],
        correctIndex: 0,
        meaningVi: "Anh ấy nói tiếng Trung rất lưu loát.",
        pinyin: "Tā hànyǔ shuō de fēicháng liúlì.",
        explanation: "Bổ ngữ trạng thái: [Động từ] + 得 + [Cụm tính từ miêu tả/đánh giá].",
      },
      {
        sentence: "因为生病了，____ 我今天没去上课。",
        options: ["所以", "但是", "而且", "如果"],
        correctIndex: 0,
        meaningVi: "Bởi vì bị ốm, cho nên hôm nay tôi không đi học.",
        pinyin: "Yīnwèi shēngbìng le, suǒyǐ wǒ jīntiān méi qù shàngkè.",
        explanation: "Cặp liên từ nhân quả: 因为...所以... (Bởi vì... cho nên...).",
      },
      {
        sentence: "虽然工作很累，____ 他依然很开心。",
        options: ["但是", "所以", "因为", "或者"],
        correctIndex: 0,
        meaningVi: "Tuy rằng công việc rất mệt, nhưng anh ấy vẫn rất vui.",
        pinyin: "Suīrán gōngzuò hěn lèi, dànshì tā yīrán hěn kāixīn.",
        explanation: "Cặp liên từ chuyển ngoặt: 虽然...但是... (Tuy rằng... nhưng mà...).",
      },
      {
        sentence: "火车 ____ 要开走了，快一点！",
        options: ["快", "正", "刚", "才"],
        correctIndex: 0,
        meaningVi: "Tàu hỏa sắp sửa chạy rồi, nhanh lên một chút!",
        pinyin: "Huǒchē kuài yào kāi zǒu le, kuài yìdiǎnr!",
        explanation: "Cấu trúc diễn tả hành động sắp xảy ra: 快要...了 / 就要...了.",
      },
      {
        sentence: "我 ____ 坐飞机来北京旅游的。",
        options: ["是", "在", "有", "去"],
        correctIndex: 0,
        meaningVi: "Tôi đến Bắc Kinh du lịch bằng máy bay.",
        pinyin: "Wǒ shì zuò fēijī lái Běijīng lǚyóu de.",
        explanation: "Cấu trúc nhấn mạnh phương thức hành động đã xảy ra trong quá khứ: 是...的.",
      },
    ],
    HSK3: [
      {
        sentence: "请你 ____ 门关上，外面风很大。",
        options: ["把", "被", "让", "给"],
        correctIndex: 0,
        meaningVi: "Xin bạn hãy đóng cửa lại, bên ngoài gió rất to.",
        pinyin: "Qǐng nǐ bǎ mén guān shàng, wàimiàn fēng hěn dà.",
        explanation: "Câu chữ '把': [Chủ ngữ] + 把 + [Tân ngữ] + [Động từ] + [Bổ ngữ/Thành phần khác].",
      },
      {
        sentence: "桌子上的蛋糕 ____ 弟弟吃光了。",
        options: ["被", "把", "给", "叫"],
        correctIndex: 0,
        meaningVi: "Chiếc bánh ngọt trên bàn đã bị em trai ăn hết sạch rồi.",
        pinyin: "Zhuōzi shàng de dàngāo bèi dìdi chī guāng le.",
        explanation: "Câu bị động chữ '被': [Chủ thể bị tác động] + 被 + [Chủ thể hành vi] + [Động từ].",
      },
      {
        sentence: "雨越下 ____ 大了，我们等一会儿再走吧。",
        options: ["越", "又", "更", "再"],
        correctIndex: 0,
        meaningVi: "Mưa càng lúc càng to rồi, chúng ta đợi một lát rồi hãy đi nhé.",
        pinyin: "Yǔ yuè xià yuè dà le, wǒmen děng yíhuìr zài zǒu ba.",
        explanation: "Cấu trúc tăng tiến: 越...越... (Càng... càng...).",
      },
      {
        sentence: "除了小李以外，大家都 ____ 了。",
        options: ["来", "去", "在", "走"],
        correctIndex: 0,
        meaningVi: "Ngoài Tiểu Lý ra, mọi người đều đã đến đông đủ rồi.",
        pinyin: "Chúle Xiǎo Lǐ yǐwài, dàjiā dōu lái le.",
        explanation: "Cấu trúc loại trừ: 除了...以外 + 都... (Ngoài... ra, tất cả đều...).",
      },
      {
        sentence: "字写得太小了，我看不 ____ 。",
        options: ["清楚", "干净", "饱", "完"],
        correctIndex: 0,
        meaningVi: "Chữ viết bé quá, tôi nhìn không rõ.",
        pinyin: "Zì xiě de tài xiǎo le, wǒ kàn bù qīngchǔ.",
        explanation: "Bổ ngữ khả năng: 看不清楚 (Nhìn không rõ).",
      },
      {
        sentence: "他喜欢 ____ 听音乐 ____ 做饭。",
        options: ["一边...一边", "又...又", "越...越", "不仅...而且"],
        correctIndex: 0,
        meaningVi: "Anh ấy thích vừa nghe nhạc vừa nấu ăn.",
        pinyin: "Tā xǐhuan yìbiān tīng yīnyuè yìbiān zuòfàn.",
        explanation: "Cặp liên từ diễn tả hai hành động diễn ra song song: 一边...一边...",
      },
    ],
    HSK4: [
      {
        sentence: "他不仅会说英语，____ 汉语也说得非常流利。",
        options: ["而且", "但是", "所以", "从而"],
        correctIndex: 0,
        meaningVi: "Anh ấy không những biết nói tiếng Anh mà tiếng Trung cũng nói rất lưu loát.",
        pinyin: "Tā bùjǐn huì shuō yīngyǔ, érqiě hànyǔ yě shuō de fēicháng liúlì.",
        explanation: "Cặp liên từ tăng tiến: 不仅...而且... (Không những... mà còn...).",
      },
      {
        sentence: "这个问题太难了，____ 老师一时也想不出答案。",
        options: ["连", "把", "被", "由"],
        correctIndex: 0,
        meaningVi: "Câu hỏi này khó quá, ngay cả thầy giáo nhất thời cũng chưa nghĩ ra đáp án.",
        pinyin: "Zhège wèntí tài nán le, lián lǎoshī yìshí yě xiǎng bù chū dá'àn.",
        explanation: "Cấu trúc nhấn mạnh trường hợp cực đoan: 连...也/都... (Ngay cả... cũng...).",
      },
      {
        sentence: "他认真 ____ 完成了老师布置的所有作业。",
        options: ["地", "的", "得", "着"],
        correctIndex: 0,
        meaningVi: "Anh ấy đã nghiêm túc hoàn thành toàn bộ bài tập thầy giáo giao.",
        pinyin: "Tā rènzhēn de wánchéng le lǎoshī bùzhì de suǒyǒu zuòyè.",
        explanation: "Trợ từ kết cấu '地' dùng sau tính từ làm trạng ngữ bổ nghĩa cho động từ.",
      },
      {
        sentence: "____ 这份调查报告，大多数年轻人喜欢网购。",
        options: ["根据", "关于", "对于", "由于"],
        correctIndex: 0,
        meaningVi: "Căn cứ vào bản báo cáo điều tra này, đại đa số giới trẻ thích mua sắm online.",
        pinyin: "Gēnjù zhè fèn diàochá bàogào, dàduōshù niánqīngrén xǐhuan wǎnggòu.",
        explanation: "Giới từ chỉ căn cứ: 根据 (Căn cứ vào, dựa theo).",
      },
      {
        sentence: "这不是一次失败，____ 一次难得的学习机会。",
        options: ["而是", "而且", "或者", "因为"],
        correctIndex: 0,
        meaningVi: "Đây không phải là một thất bại, mà là một cơ hội học hỏi quý giá.",
        pinyin: "Zhè bú shì yí cì shībài, ér shì yí cì nándé de xuéxí jīhuì.",
        explanation: "Cấu trúc phủ định và khẳng định song song: 不是...而是... (Không phải... mà là...).",
      },
    ],
    HSK5: [
      {
        sentence: "____ 遇到多大的困难，我们都不能轻易放弃。",
        options: ["无论", "既然", "与其", "宁可"],
        correctIndex: 0,
        meaningVi: "Bất kể gặp phải khó khăn to lớn đến đâu, chúng ta cũng không được dễ dàng từ bỏ.",
        pinyin: "Wúlùn yù dào duō dà de kùnnan, wǒmen dōu bù néng qīngyì fàngqì.",
        explanation: "Liên từ biểu thị điều kiện vô điều kiện: 无论/不管...都/也... (Bất luận... đều...).",
      },
      {
        sentence: "与其在这里无谓地抱怨，____ 想办法去解决问题。",
        options: ["不如", "而且", "否则", "只好"],
        correctIndex: 0,
        meaningVi: "Thay vì ở đây phàn nàn vô ích, chi bằng nghĩ cách giải quyết vấn đề.",
        pinyin: "Yǔqí zài zhèlǐ wúwèi de bàoyuàn, bùrú xiǎng bànfǎ qù jiějué wèntí.",
        explanation: "Cấu trúc so sánh lựa chọn: 与其 A (từ bỏ) 不如 B (lựa chọn tốt hơn).",
      },
      {
        sentence: "既然你已经下定决心了，____ 放手去拼搏吧。",
        options: ["就", "才", "却", "便"],
        correctIndex: 0,
        meaningVi: "Đã hạ quyết tâm rồi thì hãy cứ mạnh dạn phấn đấu đi.",
        pinyin: "Jìrán nǐ yǐjīng xiàdìng juéxīn le, jiù fàngshǒu qù pīnbó ba.",
        explanation: "Cặp liên từ logic: 既然...就... (Đã... thì...).",
      },
      {
        sentence: "这项重大的科研项目 ____ 李教授亲自主持。",
        options: ["由", "让", "叫", "给"],
        correctIndex: 0,
        meaningVi: "Dự án nghiên cứu khoa học trọng điểm này do đích thân Giáo sư Lý chủ trì.",
        pinyin: "Zhè xiàng zhòngdà de kēyán xiàngmù yóu Lǐ jiàoshòu qīnzì zhǔchí.",
        explanation: "Giới từ bị động/chỉ định trách nhiệm trang trọng: 由... phụ trách/chủ trì.",
      },
    ],
    HSK6: [
      {
        sentence: "____ 当前国际经济形势，各国呼吁加强金融合作。",
        options: ["鉴于", "基于", "关于", "出于"],
        correctIndex: 0,
        meaningVi: "Xét thấy tình hình kinh tế quốc tế hiện tại, các quốc gia kêu gọi tăng cường hợp tác tài chính.",
        pinyin: "Jiànyú dāngqián guójì jīngjì xíngshì, gè guó hūyù jiāqiáng jīnróng hézuò.",
        explanation: "Giới từ trang trọng: 鉴于 (Xét thấy, xuất phát từ nguyên cớ thực tiễn).",
      },
      {
        sentence: "任何科学理论都必须 ____ 实践的长久检验。",
        options: ["经得起", "看得起", "对得起", "受得住"],
        correctIndex: 0,
        meaningVi: "Bất kỳ lý thuyết khoa học nào cũng đều phải chịu được sự thử thách lâu dài của thực tiễn.",
        pinyin: "Rènhé kēxué lǐlùn dōu bìxū jīng de qǐ shíjiàn de chángjiǔ jiǎnyàn.",
        explanation: "Bổ ngữ khả năng chuyên sâu: 经得起 (Chịu đựng được, vượt qua được thử thách).",
      },
      {
        sentence: "____ 始终保持初心，方能在这条道路上行稳致远。",
        options: ["唯有", "只要", "哪怕", "无论"],
        correctIndex: 0,
        meaningVi: "Chỉ có luôn giữ vững tâm nguyện ban đầu mới có thể tiến bước vững vàng và đi xa.",
        pinyin: "Wéiyǒu shǐzhōng bǎochí chūxīn, fāng néng zài zhè tiáo dàolù shàng xíng wěn zhì yuǎn.",
        explanation: "Mẫu câu văn ngôn điều kiện duy nhất: 唯有...方能... (Chỉ có... mới có thể...).",
      },
    ],
  };

  const currentPool = bank[level] || bank.HSK1;
  const result: ShootoutGeneratedQuestion[] = [];

  for (let i = 0; i < Math.min(count, currentPool.length); i++) {
    const item = currentPool[i];
    const originalOptions = [...item.options];
    const correctWord = originalOptions[item.correctIndex];
    const shuffledOptions = [...originalOptions].sort(() => Math.random() - 0.5);
    const newCorrectIdx = shuffledOptions.indexOf(correctWord);

    result.push({
      id: `fb-grammar-${Date.now()}-${i + 1}`,
      sentence: item.sentence,
      options: shuffledOptions as [string, string, string, string],
      correctIndex: newCorrectIdx >= 0 ? newCorrectIdx : 0,
      meaningVi: item.meaningVi,
      pinyin: item.pinyin,
      explanation: item.explanation,
      level,
      source: standard,
    });
  }

  return result;
}

