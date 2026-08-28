import type { Route } from "./+types/api.ai.sentence";

interface AIProvider {
  name: string;
  type: "google" | "openai";
  apiKey: string;
  baseUrl: string;
  model: string;
}

export type SentenceAIGeneratedQuestion = {
  id: string;
  vietnamese: string;
  chineseTokens: string[];
  pinyin: string;
  grammarNote: string;
  category?: string;
  distractors?: string[];
  tokenRoles?: Record<string, "subject" | "adverbial" | "verb" | "object" | "complement" | "particle">;
  level?: string;
  source?: string;
}

function getProviders(): AIProvider[] {
  const providers: AIProvider[] = [];

  // 1. Groq (Fast Chinese LLM openai/gpt-oss-120b)
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

  // 4. Google AI Studio (Dự phòng)
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

  return providers;
}

async function callProvider(
  provider: AIProvider,
  messages: { role: string; content: string }[],
  temperature = 0.7
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

    const body: Record<string, any> = {
      contents,
      generationConfig: {
        temperature,
        maxOutputTokens: 3000,
        responseMimeType: "application/json",
      },
    };
    if (systemInstruction) {
      body.systemInstruction = systemInstruction;
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
    max_tokens: 3000,
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
      console.warn(`[AI Sentence Fallback] ${msg}`);
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
      category?: string;
      lessonTitle?: string;
      count?: number;
      sampleVocab?: Array<{ chinese: string; pinyin: string; meaningVi: string }>;
    };

    standard = body.standard || "HSK20";
    level = body.level || "HSK1";
    const category = body.category || "ALL";
    const lessonTitle = body.lessonTitle || "";
    count = Math.min(15, Math.max(1, body.count || 10));

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
Nhiệm vụ của bạn là tạo đúng ${count} câu đố XẾP KHỐI TẠO CÂU (Sentence Builder) áp dụng chính xác các cấu trúc ngữ pháp HSK.

HỆ THỐNG CẤU TRÚC NGỮ PHÁP ÁP DỤNG CHO CẤP ĐỘ ${level}:
${targetGrammarRules}

YÊU CẦU BẮT BUỘC:
1. Tạo ĐỦ ${count} câu khác nhau (từ 1 đến ${count}).
2. Chuẩn HSK: ${standard === "HSK30" ? "HSK 3.0" : "HSK 2.0"}, Trình độ: ${level}.
3. Mỗi câu gồm:
   - vietnamese: bản dịch tiếng Việt tự nhiên, rõ nghĩa.
   - chineseTokens: mảng các khối từ (3 đến 7 mảnh từ) ghép thành câu hoàn chỉnh đúng trật tự cú pháp.
   - pinyin: phiên âm có dấu thanh điệu chuẩn.
   - grammarNote: giải thích điểm ngữ pháp ngắn gọn trong 1 câu (dưới 25 chữ).
   - category: tên mẫu câu/ngữ pháp trọng tâm.
   - distractors: mảng 2-3 từ bẫy gây nhiễu cùng cấp độ HSK.

${category !== "ALL" ? `Ưu tiên tập trung vào chủ điểm ngữ pháp: "${category}"` : ""}
${lessonTitle ? `Gắn liền với chủ đề bài học: "${lessonTitle}"` : ""}

ĐỊNH DẠNG ĐẦU RA (BẮT BUỘC TRẢ VỀ JSON THUẦN):
{
  "questions": [
    {
      "vietnamese": "Tôi đang học tiếng Trung ở thư viện.",
      "chineseTokens": ["我", "在", "图书馆", "学习", "汉语"],
      "pinyin": "Wǒ zài túshūguǎn xuéxí hànyǔ.",
      "grammarNote": "Trạng ngữ nơi chốn đứng trước động từ: [Chủ ngữ] + 在 [Địa điểm] + [Động từ] + [Tân ngữ].",
      "category": "Trạng ngữ nơi chốn (在)",
      "distractors": ["去", "有"]
    }
  ]
}`;

    const rawResponse = await callAI(
      [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Hãy tạo đúng ${count} câu ghép tạo câu HSK cấp độ ${level} (${standard}) hoàn toàn mới lạ, độc đáo, đa dạng tình huống đời sống. Random Seed: ${Date.now()}. Trả về đúng định dạng JSON có key "questions".`,
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

    const formattedQuestions: SentenceAIGeneratedQuestion[] = rawQuestions.map((q, idx) => {
      const tokens = Array.isArray(q.chineseTokens) && q.chineseTokens.length >= 2
        ? q.chineseTokens
        : ["我", "是", "学生"];

      return {
        id: `ai-sent-${Date.now()}-${idx + 1}`,
        vietnamese: q.vietnamese || "Dịch câu tiếng Trung sang tiếng Việt",
        chineseTokens: tokens,
        pinyin: q.pinyin || "",
        grammarNote: q.grammarNote || "Trật tự từ ngữ câu tiếng Hán chuẩn.",
        category: q.category || "Ngữ pháp tổng hợp",
        distractors: Array.isArray(q.distractors) ? q.distractors : ["有", "去"],
        level,
        source: standard,
      };
    });

    if (formattedQuestions.length === 0) {
      const fallbackQuestions = getSentenceGrammarFallbackQuestions(level, standard, count);
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
    console.warn("[api.ai.sentence Fallback Activated]:", error?.message);
    const fallbackQuestions = getSentenceGrammarFallbackQuestions(level, standard, count);
    return Response.json({
      success: true,
      questions: fallbackQuestions,
      level,
      standard,
    });
  }
}

// BỘ CẦU HỎI GHÉP CÂU NGỮ PHÁP DỰ PHÒNG THEO CẤP ĐỘ HSK 1 - HSK 6
function getSentenceGrammarFallbackQuestions(
  level: string,
  standard: string,
  count: number
): SentenceAIGeneratedQuestion[] {
  const bank: Record<string, Array<{
    vietnamese: string;
    chineseTokens: string[];
    pinyin: string;
    grammarNote: string;
    category: string;
    distractors: string[];
    tokenRoles?: Record<string, string>;
  }>> = {
    HSK1: [
      {
        vietnamese: "Đây là giáo viên tiếng Trung của tôi.",
        chineseTokens: ["这", "是", "我", "的", "汉语", "老师"],
        pinyin: "Zhè shì wǒ de hànyǔ lǎoshī.",
        grammarNote: "Trợ từ sở hữu '的': [Chủ ngữ] + 是 + [Định ngữ] + 的 + [Danh từ].",
        category: "Trợ từ sở hữu 的",
        distractors: ["得", "了", "有"],
      },
      {
        vietnamese: "Tôi đang học tiếng Trung ở trường học.",
        chineseTokens: ["我", "在", "学校", "学习", "汉语"],
        pinyin: "Wǒ zài xuéxiào xuéxí hànyǔ.",
        grammarNote: "Trạng ngữ nơi chốn đứng trước động từ: [Chủ ngữ] + 在 [Địa điểm] + [Động từ].",
        category: "Trạng ngữ nơi chốn (在)",
        distractors: ["去", "到", "看"],
      },
      {
        vietnamese: "Tôi muốn uống một cốc trà nóng.",
        chineseTokens: ["我", "想", "喝", "一杯", "热茶"],
        pinyin: "Wǒ xiǎng hē yì bēi rè chá.",
        grammarNote: "Động từ năng nguyện '想' đứng trước động từ chính.",
        category: "Động từ năng nguyện (想)",
        distractors: ["吃", "在", "做"],
      },
      {
        vietnamese: "Hôm nay thời tiết rất đẹp.",
        chineseTokens: ["今天", "天气", "很", "好"],
        pinyin: "Jīntiān tiānqì hěn hǎo.",
        grammarNote: "Câu vị ngữ tính từ: [Chủ ngữ] + 很 + [Tính từ].",
        category: "Vị ngữ tính từ (很)",
        distractors: ["是", "在", "有"],
      },
      {
        vietnamese: "Anh ấy có ba người bạn Trung Quốc.",
        chineseTokens: ["他", "有", "三个", "中国", "朋友"],
        pinyin: "Tā yǒu sān gè zhōngguó péngyou.",
        grammarNote: "Câu chữ '有' biểu thị sở hữu: [Chủ ngữ] + 有 + [Số lượng] + [Danh từ].",
        category: "Câu chữ 有",
        distractors: ["是", "在", "做"],
      },
      {
        vietnamese: "Bạn tên là gì vậy?",
        chineseTokens: ["你", "叫", "什么", "名字"],
        pinyin: "Nǐ jiào shénme míngzi?",
        grammarNote: "Đại từ nghi vấn 什么 đặt trước danh từ trung tâm.",
        category: "Đại từ nghi vấn (什么)",
        distractors: ["谁", "哪儿", "几"],
      },
      {
        vietnamese: "Ngày mai tôi đi Bắc Kinh xem phim.",
        chineseTokens: ["明天", "我", "去", "北京", "看电影"],
        pinyin: "Míngtiān wǒ qù Běijīng kàn diànyǐng.",
        grammarNote: "Câu liên động biểu thị mục đích: 去 + [Địa điểm] + [Hành động].",
        category: "Câu liên động",
        distractors: ["在", "有", "想"],
      },
      {
        vietnamese: "Quyển sách này bao nhiêu tiền?",
        chineseTokens: ["这本", "书", "多少", "钱"],
        pinyin: "Zhè běn shū duōshao qián?",
        grammarNote: "Hỏi giá tiền dùng cụm '多少钱'.",
        category: "Đại từ nghi vấn (多少)",
        distractors: ["几", "个", "什么"],
      },
      {
        vietnamese: "Bố tôi là bác sĩ bệnh viện.",
        chineseTokens: ["我爸爸", "是", "医院", "的", "医生"],
        pinyin: "Wǒ bàba shì yīyuàn de yīshēng.",
        grammarNote: "Câu phán đoán chữ 是 với trợ từ định ngữ 的.",
        category: "Câu chữ 是",
        distractors: ["在", "有", "想"],
      },
      {
        vietnamese: "Bây giờ là mấy giờ rồi?",
        chineseTokens: ["现在", "几点", "了"],
        pinyin: "Xiànzài jǐ diǎn le?",
        grammarNote: "Hỏi thời gian dùng '几点' kết hợp trợ từ ngữ khí '了'.",
        category: "Hỏi thời gian",
        distractors: ["什么", "多少", "哪儿"],
      },
    ],
    HSK2: [
      {
        vietnamese: "Hôm nay trời lạnh hơn hôm qua nhiều.",
        chineseTokens: ["今天", "比", "昨天", "冷", "多了"],
        pinyin: "Jīntiān bǐ zuótiān lěng duō le.",
        grammarNote: "Cấu trúc so sánh: A + 比 + B + [Tính từ] + 多了.",
        category: "Câu so sánh (比)",
        distractors: ["很", "真", "像"],
      },
      {
        vietnamese: "Anh ấy nói tiếng Trung rất lưu loát.",
        chineseTokens: ["他", "汉语", "说", "得", "非常", "流利"],
        pinyin: "Tā hànyǔ shuō de fēicháng liúlì.",
        grammarNote: "Bổ ngữ trạng thái: [Động từ] + 得 + [Phó từ] + [Tính từ].",
        category: "Bổ ngữ trạng thái (得)",
        distractors: ["的", "地", "了"],
      },
      {
        vietnamese: "Bởi vì trời mưa nên tôi không đi công viên.",
        chineseTokens: ["因为", "下雨", "所以", "我", "没去", "公园"],
        pinyin: "Yīnwèi xiàyǔ, suǒyǐ wǒ méi qù gōngyuán.",
        grammarNote: "Cặp liên từ nhân quả: 因为 [Nguyên nhân], 所以 [Kết quả].",
        category: "Liên từ (因为...所以)",
        distractors: ["虽然", "但是", "如果"],
      },
      {
        vietnamese: "Tôi đến sân bay bằng taxi.",
        chineseTokens: ["我", "是", "坐出租车", "去", "机场", "的"],
        pinyin: "Wǒ shì zuò chūzūchē qù jīchǎng de.",
        grammarNote: "Cấu trúc 是...的 nhấn mạnh phương thức di chuyển.",
        category: "Cấu trúc nhấn mạnh (是...的)",
        distractors: ["在", "了", "想"],
      },
      {
        vietnamese: "Anh ấy đang nghe nhạc trong phòng.",
        chineseTokens: ["他", "正在", "房间里", "听", "音乐", "呢"],
        pinyin: "Tā zhèngzài fángjiān lǐ tīng yīnyuè ne.",
        grammarNote: "Biểu thị hành động đang tiếp diễn: 正在...呢.",
        category: "Động tác tiếp diễn (正在...呢)",
        distractors: ["就要", "快要", "已经"],
      },
      {
        vietnamese: "Tàu hỏa sắp khởi hành rồi.",
        chineseTokens: ["火车", "快要", "开", "了"],
        pinyin: "Huǒchē kuàiyào kāi le.",
        grammarNote: "Biểu thị hành động sắp xảy ra: 快要...了.",
        category: "Hành động sắp diễn ra (快要...了)",
        distractors: ["正在", "已经", "才"],
      },
      {
        vietnamese: "Mặc dù rất mệt nhưng anh ấy vẫn kiên trì.",
        chineseTokens: ["虽然", "很累", "但是", "他", "很开心"],
        pinyin: "Suīrán hěn lèi, dànshì tā hěn kāixīn.",
        grammarNote: "Cặp liên từ chuyển ý: 虽然 [Nhượng bộ], 但是 [Kết quả].",
        category: "Liên từ (虽然...但是)",
        distractors: ["因为", "所以", "Nếu"],
      },
      {
        vietnamese: "Tôi đã làm xong bài tập tiếng Trung rồi.",
        chineseTokens: ["我", "做", "完", "汉语", "作业", "了"],
        pinyin: "Wǒ zuò wán hànyǔ zuòyè le.",
        grammarNote: "Bổ ngữ kết quả: [Động từ] + 完 + [Tân ngữ] + 了.",
        category: "Bổ ngữ kết quả (完)",
        distractors: ["好", "懂", "见"],
      },
      {
        vietnamese: "Đừng chơi điện thoại nữa, mau ngủ đi.",
        chineseTokens: ["别", "玩", "手机", "了", "快睡觉"],
        pinyin: "Bié wán shǒujī le, kuài shuìjiào.",
        grammarNote: "Câu cầu khiến cấm đoán: 别 + [Động từ] + 了.",
        category: "Câu cấm đoán (别...了)",
        distractors: ["不要", "没", "不"],
      },
      {
        vietnamese: "Nhà tôi cách công ty rất gần.",
        chineseTokens: ["我家", "离", "公司", "很", "近"],
        pinyin: "Wǒ jiā lí gōngsī hěn jìn.",
        grammarNote: "Giới từ cự ly: A + 离 + B + 很 + [Gần/Xa].",
        category: "Giới từ khoảng cách (离)",
        distractors: ["从", "到", "往"],
      },
    ],
    HSK3: [
      {
        vietnamese: "Xin hãy giúp tôi đóng cánh cửa đó lại.",
        chineseTokens: ["请", "把", "那扇门", "关", "上"],
        pinyin: "Qǐng bǎ nà shàn mén guān shàng.",
        grammarNote: "Câu chữ 把: [Chủ ngữ] + 把 + [Tân ngữ] + [Động từ] + [Bổ ngữ].",
        category: "Câu chữ 把",
        distractors: ["被", "让", "给"],
      },
      {
        vietnamese: "Chiếc bánh ngọt đã bị em trai ăn hết rồi.",
        chineseTokens: ["蛋糕", "被", "弟弟", "吃", "完", "了"],
        pinyin: "Dàngāo bèi dìdi chī wán le.",
        grammarNote: "Câu bị động chữ 被: [Vật] + 被 + [Người] + [Động từ] + 完 + 了.",
        category: "Câu chữ 被",
        distractors: ["把", "使", "叫"],
      },
      {
        vietnamese: "Tiếng Trung càng học càng cảm thấy thú vị.",
        chineseTokens: ["汉语", "越", "学", "越", "觉得", "有意思"],
        pinyin: "Hànyǔ yuè xué yuè juéde yǒu yìsi.",
        grammarNote: "Cấu trúc tăng tiến: 越 + [Động từ] + 越 + [Tính từ].",
        category: "Cấu trúc 越...越...",
        distractors: ["又", "再", "更"],
      },
      {
        vietnamese: "Ngoài táo ra, anh ấy cái gì cũng thích ăn.",
        chineseTokens: ["除了", "苹果", "以外", "他", "什么", "都爱吃"],
        pinyin: "Chúle píngguǒ yǐwài, tā shénme dōu ài chī.",
        grammarNote: "Cấu trúc loại trừ: 除了...以外, 都/还...",
        category: "Cấu trúc loại trừ (除了...以外)",
        distractors: ["如果", "虽然", "只有"],
      },
      {
        vietnamese: "Anh ấy vừa nghe nhạc vừa làm bài tập.",
        chineseTokens: ["他", "一边", "听音乐", "一边", "做作业"],
        pinyin: "Tā yìbiān tīng yīnyuè, yìbiān zuò zuòyè.",
        grammarNote: "Cặp liên từ hành động song song: 一边...一边...",
        category: "Hành động song song (一边...一边)",
        distractors: ["又...又", "先...再", "因为"],
      },
      {
        vietnamese: "Chỉ cần chăm chỉ, bạn nhất định sẽ tiến bộ.",
        chineseTokens: ["只要", "努力", "就", "一定能", "进步"],
        pinyin: "Zhǐyào nǔlì, jiù yídìng néng jìnbù.",
        grammarNote: "Cặp liên từ điều kiện đủ: 只要...就...",
        category: "Điều kiện đủ (只要...就)",
        distractors: ["只有", "才", "虽然"],
      },
      {
        vietnamese: "Bài khóa này chữ quá nhỏ, tôi nhìn không rõ.",
        chineseTokens: ["字太小了", "我", "看", "不", "清楚"],
        pinyin: "Zì tài xiǎo le, wǒ kàn bu qīngchu.",
        grammarNote: "Bổ ngữ khả năng phủ định: [Động từ] + 不 + [Kết quả].",
        category: "Bổ ngữ khả năng",
        distractors: ["得", "完", "了"],
      },
      {
        vietnamese: "Anh ấy vừa về đến nhà là bắt đầu nấu cơm.",
        chineseTokens: ["他", "一", "到家", "就", "做饭"],
        pinyin: "Tā yí dào jiā jiù zuòfàn.",
        grammarNote: "Cặp liên từ thời gian liên tiếp: 一...就...",
        category: "Thời gian liên tiếp (一...就)",
        distractors: ["先", "然后", "才"],
      },
      {
        vietnamese: "Thời tiết càng ngày càng trở nên ấm áp.",
        chineseTokens: ["天气", "越来越", "暖和", "了"],
        pinyin: "Tiānqì yuè lái yuè nuǎnhuo le.",
        grammarNote: "Phó từ chỉ mức độ tăng dần theo thời gian: 越来越 + [Tính từ].",
        category: "Phó từ 越来越",
        distractors: ["越...越", "非常", "很"],
      },
      {
        vietnamese: "Cậu từ trên lầu đi xuống đây một lát.",
        chineseTokens: ["你", "从", "楼上", "走", "下来", "一下"],
        pinyin: "Nǐ cóng lóushàng zǒu xiàlái yíxià.",
        grammarNote: "Bổ ngữ xu hướng hướng về phía người nói dùng '下来'.",
        category: "Bổ ngữ xu hướng (下来)",
        distractors: ["上去", "下去", "起来"],
      },
    ],
    HSK4: [
      {
        vietnamese: "Anh ấy không những thông minh mà còn vô cùng chăm chỉ.",
        chineseTokens: ["他", "不仅", "聪明", "而且", "非常", "刻苦"],
        pinyin: "Tā bùjǐn cōngmíng, érqiě fēicháng kèkǔ.",
        grammarNote: "Cặp liên từ tăng tiến: 不仅...而且... (Không những... mà còn...).",
        category: "Liên từ tăng tiến (不仅...而且)",
        distractors: ["虽然", "但是", "从而"],
      },
      {
        vietnamese: "Câu hỏi khó này ngay cả thầy giáo cũng chưa nghĩ ra.",
        chineseTokens: ["这个难题", "连", "老师", "也", "没想出", "答案"],
        pinyin: "Zhège nántí lián lǎoshī yě méi xiǎng chū dá'àn.",
        grammarNote: "Cấu trúc nhấn mạnh cực đoan: 连...也/都...",
        category: "Cấu trúc nhấn mạnh (连...都/也)",
        distractors: ["把", "被", "从"],
        tokenRoles: { "这个难题": "subject", "连": "adverbial", "老师": "adverbial", "也": "adverbial", "没想出": "verb", "答案": "object" },
      },
      {
        vietnamese: "Lần thất bại này không phải do thiếu may mắn mà do chưa chuẩn bị kỹ.",
        chineseTokens: ["这次失败", "不是", "运气差", "而是", "准备", "不充分"],
        pinyin: "Zhè cì shībài bú shì yùnqi chà, ér shì zhǔnbèi bù chōngfèn.",
        grammarNote: "Cấu trúc phủ định tương phản: 不是...而是...",
        category: "Cấu trúc tương phản (不是...而是)",
        distractors: ["不仅", "而且", "哪怕"],
      },
      {
        vietnamese: "Căn cứ vào kết quả khảo sát, người trẻ ngày càng thích du lịch.",
        chineseTokens: ["根据", "调查结果", "年轻人", "越来越", "喜欢", "旅行"],
        pinyin: "Gēnjù diàochá jiéguǒ, niánqīngrén yuè lái yuè xǐhuan lǚxíng.",
        grammarNote: "Giới từ chỉ căn cứ dẫn chứng: 根据 + [Căn cứ].",
        category: "Giới từ dẫn chứng (根据)",
        distractors: ["对于", "关于", "按照"],
      },
      {
        vietnamese: "Cô ấy vui mừng cười tươi chào đón mọi người.",
        chineseTokens: ["她", "高兴地", "笑着", "欢迎", "大家"],
        pinyin: "Tā gāoxìng de xiàozhe huānyíng dàjiā.",
        grammarNote: "Trợ từ trạng ngữ '地' đứng trước động từ chỉ trạng thái hành động.",
        category: "Trợ từ trạng ngữ 地",
        distractors: ["的", "得", "了"],
      },
      {
        vietnamese: "Cho dù công việc có bận hơn nữa, anh ấy cũng đọc sách mỗi ngày.",
        chineseTokens: ["哪怕", "工作", "再忙", "他也", "坚持", "读书"],
        pinyin: "Nǎpà gōngzuò zài máng, tā yě jiānchí dúshū.",
        grammarNote: "Cặp liên từ nhượng bộ giả định: 哪怕...也...",
        category: "Liên từ nhượng bộ (哪怕...也)",
        distractors: ["虽然", "因为", "只要"],
      },
      {
        vietnamese: "Trên bàn đang đặt một cốc cà phê nóng.",
        chineseTokens: ["桌子上", "放着", "一杯", "热咖啡"],
        pinyin: "Zhuōzi shang fàng zhe yì bēi rè kāfēi.",
        grammarNote: "Câu tồn hiện: [Nơi chốn] + [Động từ] + 着 + [Danh từ].",
        category: "Câu tồn hiện (放着)",
        distractors: ["有", "是", "把"],
      },
      {
        vietnamese: "Mọi người đều nhiệt tình thảo luận sôi nổi lên.",
        chineseTokens: ["大家", "热烈地", "讨论", "了起来"],
        pinyin: "Dàjiā rèliè de tǎolùn le qǐlái.",
        grammarNote: "Bổ ngữ xu hướng mở rộng '起来' biểu thị hành động bắt đầu và tiếp diễn.",
        category: "Bổ ngữ xu hướng (起来)",
        distractors: ["下去", "出来", "过来"],
      },
      {
        vietnamese: "Đối với vấn đề này, mỗi người có cách nhìn khác nhau.",
        chineseTokens: ["对于", "这个问题", "每个人", "看法", "都不同"],
        pinyin: "Duìyú zhège wèntí, měi gè rén kànfǎ dōu bù tóng.",
        grammarNote: "Giới từ chỉ đối tượng nhắm đến: 对于 + [Vấn đề].",
        category: "Giới từ đối tượng (对于)",
        distractors: ["关于", "根据", "按照"],
      },
      {
        vietnamese: "Chỉ cần tiếp tục kiên trì, kế hoạch sẽ thành công.",
        chineseTokens: ["只要", "坚持下去", "计划", "就一定会", "成功"],
        pinyin: "Zhǐyào jiānchí xiàqù, jìhuà jiù yídìng huì chénggōng.",
        grammarNote: "Bổ ngữ xu hướng '下去' biểu thị hành động tiếp tục duy trì.",
        category: "Bổ ngữ xu hướng (下去)",
        distractors: ["起来", "上来", "过来"],
      },
    ],
    HSK5: [
      {
        vietnamese: "Bất kể gặp phải khó khăn gì, chúng ta cũng không được nản lòng.",
        chineseTokens: ["无论", "遇到", "什么困难", "我们", "都不能", "灰心"],
        pinyin: "Wúlùn yù dào shénme kùnnan, wǒmen dōu bù néng huīxīn.",
        grammarNote: "Liên từ biểu thị điều kiện vô điều kiện: 无论/不管 + [Đại từ nghi vấn] + 都/也 + [Kết quả].",
        category: "Mẫu câu vô điều kiện (无论...都)",
        distractors: ["哪怕", "既然", "与其"],
        tokenRoles: { "无论": "adverbial", "遇到": "verb", "什么困难": "object", "我们": "subject", "都不能": "adverbial", "灰心": "verb" },
      },
      {
        vietnamese: "Thay vì phàn nàn quá khứ, chi bằng nắm bắt hiện tại.",
        chineseTokens: ["与其", "抱怨", "过去", "不如", "把握", "现在"],
        pinyin: "Yǔqí bàoyuàn guòqù, bùrú bǎwò xiànzài.",
        grammarNote: "Cặp liên từ so sánh lựa chọn: 与其 A (vế từ bỏ) 不如 B (vế ưu tiên).",
        category: "Cấu trúc lựa chọn (与其...不如)",
        distractors: ["宁可", "也不", "只好"],
        tokenRoles: { "与其": "adverbial", "抱怨": "verb", "过去": "object", "不如": "adverbial", "把握": "verb", "现在": "object" },
      },
      {
        vietnamese: "Đã đưa ra quyết định rồi thì hãy toàn tâm toàn ý thực hiện.",
        chineseTokens: ["既然", "做出了决定", "就应该", "全力以赴"],
        pinyin: "Jìrán zuòchū le juédìng, jiù yīnggāi quánlì yǐ fù.",
        grammarNote: "Cặp liên từ nhân quả tiền đề: 既然...就...",
        category: "Liên từ tiền đề (既然...就)",
        distractors: ["虽然", "哪怕", "与其"],
      },
      {
        vietnamese: "Xét từ góc độ lâu dài, đầu tư giáo dục là quan trọng nhất.",
        chineseTokens: ["从长远角度来看", "教育投资", "是", "最核心的"],
        pinyin: "Cóng chángyuǎn jiǎodù lái kàn, jiàoyù tóuzī shì zuì héxīn de.",
        grammarNote: "Cấu trúc mở đầu luận điểm: 从...角度来看.",
        category: "Cấu trúc luận điểm (从...角度来看)",
        distractors: ["就...而言", "基于", "关于"],
      },
      {
        vietnamese: "Dự án này sẽ do chuyên gia hàng đầu trực tiếp phụ trách.",
        chineseTokens: ["这个项目", "由", "资深专家", "亲自", "负责"],
        pinyin: "Zhège xiàngmù yóu zīshēn zhuānjiā qīnzì fùzé.",
        grammarNote: "Giới từ trang trọng chỉ chủ thể đảm nhiệm: 由 + [Chủ thể] + [Động từ].",
        category: "Giới từ đảm nhiệm (由)",
        distractors: ["被", "把", "给"],
      },
      {
        vietnamese: "Rốt cuộc nguyên nhân gì đã khiến sự việc chuyển biến đột ngột?",
        chineseTokens: ["究竟", "是什么原因", "导致了", "事情突变"],
        pinyin: "Jiūjìng shì shénme yuányīn dǎozhì le shìqing tūbiàn?",
        grammarNote: "Phó từ truy vấn ngữ khí: 究竟 (rốt cuộc, rốt lại).",
        category: "Phó từ ngữ khí (究竟)",
        distractors: ["难道", "难道不", "偏偏"],
      },
      {
        vietnamese: "Anh ấy thà chịu gian khổ chứ quyết không từ bỏ lý tưởng.",
        chineseTokens: ["他", "宁可", "吃苦", "也决不", "放弃理想"],
        pinyin: "Tā nìngkě chīkǔ, yě juébù fàngqì lǐxiǎng.",
        grammarNote: "Cặp liên từ quyết tâm lựa chọn: 宁可...也不/决不...",
        category: "Cấu trúc kiên định (宁可...决不)",
        distractors: ["与其", "不如", "哪怕"],
      },
      {
        vietnamese: "Xét riêng về mặt kỹ thuật, sản phẩm này đã dẫn đầu thị trường.",
        chineseTokens: ["就技术而言", "该产品", "已经", "领先市场"],
        pinyin: "Jiù jìshù ér yán, gāi chǎnpǐn yǐjīng lǐngxiān shìchǎng.",
        grammarNote: "Cấu trúc giới hạn phạm vi xem xét: 就...而言.",
        category: "Cấu trúc phạm vi (就...而言)",
        distractors: ["鉴于", "基于", "根据"],
      },
      {
        vietnamese: "Đến trễ nửa tiếng quả là có phần thất lễ.",
        chineseTokens: ["迟到半小时", "未免", "有点儿", "失礼"],
        pinyin: "Chídào bàn xiǎoshí wèimiǎn yǒudiǎnr shīlǐ.",
        grammarNote: "Phó từ ngữ khí đánh giá nhẹ nhàng: 未免 (e rằng, không tránh khỏi).",
        category: "Phó từ đánh giá (未免)",
        distractors: ["难免", "不免", "究竟"],
      },
      {
        vietnamese: "Dù điều kiện có khắc nghiệt, họ vẫn hoàn thành nhiệm vụ đúng hạn.",
        chineseTokens: ["尽管", "条件艰苦", "他们仍", "按时", "完成了任务"],
        pinyin: "Jǐnguǎn tiáojiàn jiānkǔ, tāmen réng ànshí wánchéng le rènwu.",
        grammarNote: "Cặp liên từ tương phản chính thức: 尽管...仍/还是...",
        category: "Liên từ tương phản (尽管...仍)",
        distractors: ["因为", "只要", "除非"],
      },
    ],
    HSK6: [
      {
        vietnamese: "Xét thấy tình hình hiện tại, chúng ta cần nhanh chóng điều chỉnh phương án.",
        chineseTokens: ["鉴于", "目前的形势", "我们", "需要", "迅速调整", "方案"],
        pinyin: "Jiànyú mùqián de xíngshì, wǒmen xūyào xùnsù tiáozhěng fāng'àn.",
        grammarNote: "Giới từ trang trọng mở đầu lý do căn cứ: 鉴于 (Xét thấy, xuất phát từ thực tiễn).",
        category: "Giới từ trang trọng (鉴于)",
        distractors: ["关于", "基于", "至于"],
        tokenRoles: { "鉴于": "adverbial", "目前的形势": "adverbial", "我们": "subject", "需要": "verb", "迅速调整": "verb", "方案": "object" },
      },
      {
        vietnamese: "Chỉ có giữ vững tâm nguyện ban đầu mới có thể tiến bước vững vàng và đi xa.",
        chineseTokens: ["唯有", "坚守初心", "方能", "行稳", "致远"],
        pinyin: "Wéiyǒu jiānshǒu chūxīn, fāng néng xíng wěn zhì yuǎn.",
        grammarNote: "Mẫu câu văn ngôn điều kiện duy nhất: 唯有...方能... (Chỉ có... mới có thể...).",
        category: "Mẫu câu văn ngôn (唯有...方能)",
        distractors: ["只要", "除非", "哪怕"],
        tokenRoles: { "唯有": "adverbial", "坚守初心": "verb", "方能": "adverbial", "行稳": "verb", "致远": "complement" },
      },
      {
        vietnamese: "Công trình vĩ đại này ắt hẳn sẽ chịu đựng được thử thách của thời gian.",
        chineseTokens: ["这项伟大的工程", "必定", "经得起", "时间的检验"],
        pinyin: "Zhè xiàng wěidà de gōngchéng bìdìng jīng de qǐ shíjiān de jiǎnyàn.",
        grammarNote: "Bổ ngữ khả năng cao cấp: 经得起 (chịu đựng nổi thử thách).",
        category: "Bổ ngữ khả năng (经得起)",
        distractors: ["禁不住", "顾不上", "谈不上"],
      },
      {
        vietnamese: "Dựa trên dữ liệu thực nghiệm phong phú, ông đã đề xuất lý thuyết mới.",
        chineseTokens: ["基于", "大量的实验数据", "他提出了", "崭新的理论"],
        pinyin: "Jīyú dàliàng de shíyàn shùjù, tā tíchū le zhǎnxīn de lǐlùn.",
        grammarNote: "Giới từ biểu thị nền tảng căn cứ học thuật: 基于 (Dựa trên).",
        category: "Giới từ căn cứ (基于)",
        distractors: ["鉴于", "出于", "关于"],
      },
      {
        vietnamese: "Trừ phi các bên đạt được thỏa hiệp, nếu không khó tránh khỏi xung đột.",
        chineseTokens: ["除非", "各方达成妥协", "否则", "冲突", "难以避免"],
        pinyin: "Chúfēi gè fāng dáchéng tuǒxié, fǒuzé chōngtū nányǐ bìmiǎn.",
        grammarNote: "Cặp liên từ điều kiện loại trừ cưỡng bách: 除非...否则...",
        category: "Cặp liên từ (除非...否则)",
        distractors: ["只要", "只有", "既然"],
      },
      {
        vietnamese: "Nghe câu chuyện cảm động này, mọi người đều không kìm được rơi lệ.",
        chineseTokens: ["听到这个感人的故事", "大家", "禁不住", "流下了眼泪"],
        pinyin: "Tīng dào zhège gǎnrén de gùshi, dàjiā jīnbuzhù liúxià le yǎnlèi.",
        grammarNote: "Động từ biểu cảm bất giác không kiềm chế được: 禁不住.",
        category: "Động từ ngữ khí (禁不住)",
        distractors: ["经得起", "舍不得", "巴不得"],
      },
      {
        vietnamese: "Thành công này không thể nghi ngờ là một cột mốc lịch sử quan trọng.",
        chineseTokens: ["毋庸置疑", "这项成功", "是一个", "里程碑"],
        pinyin: "Wúyōng zhìyí, zhè xiàng chénggōng shì yí gè lǐchéngbēi.",
        grammarNote: "Thành ngữ biểu thị tính khẳng định tuyệt đối: 毋庸置疑 (Không cần nghi ngờ).",
        category: "Thành ngữ khẳng định (毋庸置疑)",
        distractors: ["总而言之", "理所当然", "显而易见"],
      },
      {
        vietnamese: "Nhân chuyến thăm lần này, hai bên đã ký kết nhiều thỏa thuận quan trọng.",
        chineseTokens: ["藉此访华之际", "双方", "签署了", "多项重要协议"],
        pinyin: "Jiè cǐ fǎng huá zhī jì, shuāngfāng qiānshǔ le duō xiàng zhòngyào xiéyì.",
        grammarNote: "Giới từ văn ngôn nhân dịp thời cơ: 藉此 (Nhân dịp này, nhờ cơ hội này).",
        category: "Giới từ văn ngôn (藉此)",
        distractors: ["以此", "鉴于", "因其"],
      },
      {
        vietnamese: "Công việc quá tải khiến anh ấy không kịp lo đến cuộc sống cá nhân.",
        chineseTokens: ["繁重的工作", "让他", "顾不上", "个人生活"],
        pinyin: "Fánzhòng de gōngzuò ràng tā gù bu shàng gèrén shēnghuó.",
        grammarNote: "Bổ ngữ khả năng bận rộn không xoay xở kịp: 顾不上.",
        category: "Bổ ngữ khả năng (顾不上)",
        distractors: ["经得起", "看不起", "瞧不上"],
      },
      {
        vietnamese: "Nếu như dự báo chính xác thì chúng ta đã tránh được tổn thất to lớn.",
        chineseTokens: ["倘若", "预警准确", "则我们", "能避免", "巨大损失"],
        pinyin: "Tǎngruò yùjǐng zhǔnquè, zé wǒmen néng bìmiǎn jùdà sǔnshī.",
        grammarNote: "Cặp liên từ văn ngôn giả thiết tương ứng: 倘若...则... (Nếu như... thì...).",
        category: "Liên từ văn ngôn (倘若...则)",
        distractors: ["即使", "虽然", "只要"],
      },
    ],
  };

  const pool = bank[level] || bank.HSK1;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const result: SentenceAIGeneratedQuestion[] = [];

  for (let i = 0; i < count; i++) {
    const item = shuffled[i % shuffled.length];
    result.push({
      id: `fb-sent-${Date.now()}-${i + 1}`,
      vietnamese: item.vietnamese,
      chineseTokens: item.chineseTokens,
      pinyin: item.pinyin,
      grammarNote: item.grammarNote,
      category: item.category,
      distractors: item.distractors,
      level,
      source: standard,
    });
  }

  return result;
}
