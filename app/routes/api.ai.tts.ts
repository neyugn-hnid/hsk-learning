import type { Route } from "./+types/api.ai.tts";
import { data } from "react-router";
import { requireUser } from "~/lib/auth.server";

export async function action({ request }: Route.ActionArgs) {
  const user = await requireUser(request);
  const body = (await request.json()) as { text: string; lang?: string };

  const text = body.text?.trim();
  if (!text) return data({ error: "Thiếu nội dung." }, { status: 400 });

  const googleKey = process.env.GOOGLE_API_KEY?.trim();
  if (!googleKey) return data({ error: "Chưa cấu hình GOOGLE_API_KEY." }, { status: 400 });

  const lang = body.lang || "vi-VN";
  const voiceName = lang === "zh-CN" ? "cmn-CN-Standard-A" : "vi-VN-Standard-A";

  try {
    const res = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${googleKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: { text },
          voice: { languageCode: lang, name: voiceName },
          audioConfig: { audioEncoding: "MP3", speakingRate: 1.0 },
        }),
      }
    );
    if (!res.ok) {
      const err = await res.text();
      return data({ error: `Google TTS lỗi: ${res.status}` }, { status: 502 });
    }
    const result = (await res.json()) as { audioContent?: string };
    if (!result.audioContent) {
      return data({ error: "Không tạo được audio." }, { status: 502 });
    }
    // Return base64 audio
    return data({ audio: result.audioContent });
  } catch {
    return data({ error: "Lỗi kết nối Google TTS." }, { status: 502 });
  }
}
