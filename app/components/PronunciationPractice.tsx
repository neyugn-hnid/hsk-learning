import { useEffect, useRef, useState } from "react";
import { LoaderCircle, Mic, MicOff } from "lucide-react";

type PronunciationPracticeProps = {
  chinese: string;
  pinyin?: string;
};

type PracticeResult = {
  transcript: string;
  score: number;
  feedback: string;
};

type BrowserSpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives?: number;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

type SpeechRecognitionResultLike = {
  0: {
    transcript: string;
  };
  isFinal: boolean;
  length: number;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
};

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export function PronunciationPractice({ chinese, pinyin }: PronunciationPracticeProps) {
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<PracticeResult | null>(null);
  const supported = typeof window !== "undefined" && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    setError("");
    setResult(null);
    setIsListening(false);
    recognitionRef.current?.stop();
    recognitionRef.current = null;
  }, [chinese, pinyin]);

  const startPractice = () => {
    if (typeof window === "undefined") return;
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setError("Trình duyệt này chưa hỗ trợ nhận giọng nói. Nên dùng Chrome hoặc Edge.");
      return;
    }

    recognitionRef.current?.stop();
    const recognition = new Recognition();
    recognition.lang = "zh-CN";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setError("");
    setResult(null);
    setIsListening(true);

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .slice(event.resultIndex)
        .map((item) => item[0]?.transcript || "")
        .join(" ")
        .trim();

      if (!transcript) {
        setError("Không nhận được giọng nói. Bạn thử nói chậm và rõ hơn.");
        return;
      }

      setResult(scorePronunciation({ transcript, chinese, pinyin }));
    };

    recognition.onerror = (event) => {
      const message = toRecognitionErrorMessage(event.error);
      setError(message);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopPractice = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  return (
    <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-3 text-left sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="text-sm font-bold text-slate-900">Luyện nói</h4>
        </div>
        {isListening ? (
          <button type="button" onClick={stopPractice} aria-label="Dừng ghi âm" className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 sm:w-auto">
            <MicOff size={18} />
            <span className="sr-only sm:not-sr-only sm:inline">Dừng ghi âm</span>
          </button>
        ) : (
          <button type="button" onClick={startPractice} aria-label="Nói và chấm điểm" disabled={!supported} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto">
            <Mic size={18} />
            <span className="sr-only sm:not-sr-only sm:inline">Nói và chấm điểm</span>
          </button>
        )}
      </div>

      {isListening ? (
        <div className="mt-4 flex flex-col gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-red-600 sm:flex-row sm:items-center">
          <LoaderCircle size={16} className="animate-spin" />
          <span className="break-words">Đang nghe, bạn hãy đọc: {chinese}</span>
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      {result ? (
        <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Kết quả</p>
              <p className="mt-1 break-words text-sm text-slate-500">Bạn đã đọc: {result.transcript}</p>
            </div>
            <span className={`w-fit rounded-full px-4 py-2 text-sm font-bold ${result.score >= 85 ? "bg-emerald-100 text-emerald-700" : result.score >= 60 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
              {result.score}/100
            </span>
          </div>
          <p className="mt-3 text-sm font-medium text-slate-700">{result.feedback}</p>
          {pinyin ? <p className="mt-2 text-xs text-slate-500">Pinyin mục tiêu: {pinyin}</p> : null}
        </div>
      ) : null}
    </div>
  );
}

function scorePronunciation({ transcript, chinese, pinyin }: { transcript: string; chinese: string; pinyin?: string }): PracticeResult {
  const normalizedTranscript = normalizeChinese(transcript);
  const normalizedChinese = normalizeChinese(chinese);
  const normalizedTranscriptLatin = normalizeLatin(transcript);
  const normalizedPinyin = normalizeLatin(stripToneMarks(pinyin || ""));

  const chineseScore = similarityScore(normalizedTranscript, normalizedChinese);
  const pinyinScore = normalizedPinyin ? similarityScore(normalizedTranscriptLatin, normalizedPinyin) : 0;
  const exactChineseBonus = normalizedTranscript === normalizedChinese ? 100 : 0;
  const containsChineseBonus = normalizedTranscript.includes(normalizedChinese) || normalizedChinese.includes(normalizedTranscript) ? 92 : 0;

  const scoreBase = Math.max(chineseScore, pinyinScore, exactChineseBonus, containsChineseBonus);
  const score = Math.max(0, Math.min(100, Math.round(scoreBase)));

  return {
    transcript,
    score,
    feedback: toFeedback(score, chinese, transcript),
  };
}

function normalizeChinese(value: string) {
  return value.replace(/[\s.,!?;:'"`~@#$%^&*()\-_=+\[\]{}|\\/，。！？；：、】【]/g, "").trim();
}

function normalizeLatin(value: string) {
  return stripToneMarks(value).toLowerCase().replace(/[^a-z0-9]/g, "").trim();
}

function stripToneMarks(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function similarityScore(source: string, target: string) {
  if (!source || !target) return 0;
  const distance = levenshteinDistance(source, target);
  const maxLength = Math.max(source.length, target.length);
  if (!maxLength) return 100;
  return ((maxLength - distance) / maxLength) * 100;
}

function levenshteinDistance(a: string, b: string) {
  const matrix = Array.from({ length: b.length + 1 }, () => Array<number>(a.length + 1).fill(0));

  for (let i = 0; i <= b.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= a.length; j += 1) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i += 1) {
    for (let j = 1; j <= a.length; j += 1) {
      const cost = a[j - 1] === b[i - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }

  return matrix[b.length][a.length];
}

function toFeedback(score: number, expected: string, transcript: string) {
  if (score >= 90) return `Rất tốt. Câu đọc của bạn gần như trùng với "${expected}".`;
  if (score >= 75) return `Khá ổn. Bạn đã nói gần đúng, thử đọc lại chậm hơn để khớp hơn với "${expected}".`;
  if (score >= 55) return `Có nhận được nội dung, nhưng độ khớp chưa cao. Bạn thử nghe mẫu rồi đọc lại rõ từng âm.`;
  return `Độ khớp còn thấp. Hệ thống nghe được "${transcript}", bạn nên nghe mẫu rồi thử lại.`;
}

function toRecognitionErrorMessage(error?: string) {
  if (error === "not-allowed") return "Trình duyệt chưa được cấp quyền microphone.";
  if (error === "no-speech") return "Không nghe thấy giọng nói. Bạn thử đọc to và rõ hơn.";
  if (error === "audio-capture") return "Không truy cập được microphone trên máy này.";
  if (error === "network") return "Nhận giọng nói bị gián đoạn do kết nối.";
  return "Không thể nhận giọng nói lúc này. Bạn thử lại một lần nữa.";
}
