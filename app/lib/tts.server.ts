import { execFile } from "node:child_process";
import { writeFile, unlink, readFile, mkdir } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { join } from "node:path";

const TMP_DIR = join(process.cwd(), "temp");
const ttsCache = new Map<string, string>();

async function googleTranslateTTS(text: string, lang: string): Promise<string> {
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${lang}&q=${encodeURIComponent(text)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Google TTS failed");
  const buf = await res.arrayBuffer();
  return Buffer.from(buf).toString("base64");
}

function edgeTTS(text: string, voice: string, rate: string = "+0%"): Promise<string> {
  return new Promise(async (resolve, reject) => {
    const id = randomUUID();
    const inPath = join(TMP_DIR, `${id}.txt`);
    const outPath = join(TMP_DIR, `${id}.mp3`);
    try {
      await mkdir(TMP_DIR, { recursive: true });
      await writeFile(inPath, text, "utf-8");
      execFile("edge-tts", [
        "--file", inPath, "--voice", voice, "--rate", rate, "--write-media", outPath,
      ], { timeout: 20000, windowsHide: true }, async (err) => {
        await unlink(inPath).catch(() => {});
        if (err) return reject(err);
        try {
          const buf = await readFile(outPath);
          await unlink(outPath).catch(() => {});
          resolve(buf.toString("base64"));
        } catch (e) { reject(e); }
      });
    } catch (e) { reject(e); }
  });
}

export async function getOrCreateTTS(text: string, lang: string = "zh-CN"): Promise<Buffer> {
  const key = `gt:${lang}:${text}`;
  const cached = ttsCache.get(key);
  if (cached) return Buffer.from(cached, "base64");

  try {
    const b64 = await googleTranslateTTS(text, lang);
    ttsCache.set(key, b64);
    return Buffer.from(b64, "base64");
  } catch { /* fallback */ }

  const voice = lang === "zh-CN" ? "zh-CN-XiaoxiaoNeural" : "vi-VN-HoaiMyNeural";
  const b64 = await edgeTTS(text, voice, "-5%");
  ttsCache.set(key, b64);
  return Buffer.from(b64, "base64");
}
