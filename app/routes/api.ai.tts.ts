import type { Route } from "./+types/api.ai.tts";
import { data } from "react-router";
import { requireUser } from "~/lib/auth.server";
import { getOrCreateTTS } from "~/lib/tts.server";

export async function action({ request }: Route.ActionArgs) {
  await requireUser(request);
  const body = (await request.json()) as { text: string; lang?: string };

  const text = body.text?.trim();
  if (!text) return data({ error: "Thiếu nội dung." }, { status: 400 });

  try {
    const audio = await getOrCreateTTS(text, body.lang || "zh-CN");
    return data({ audio: audio.toString("base64") });
  } catch {
    return data({ error: "TTS không khả dụng." }, { status: 502 });
  }
}
