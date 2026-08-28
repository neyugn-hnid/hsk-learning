import type { Route } from "./+types/roadmap.$roadmapId";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { data } from "react-router";
import { useNavigate } from "react-router";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Check,
  Volume2,
  BookOpen,
} from "lucide-react";
import { SiteLayout } from "~/components/Layout";
import { getUser } from "~/lib/auth.server";
import { prisma } from "~/lib/db.server";

export async function loader({ request, params }: Route.LoaderArgs) {
  const user = await getUser(request);
  const roadmap = await prisma.roadmapItem.findUnique({
    where: { id: params.roadmapId },
  });
  if (!roadmap) throw data("Không tìm thấy buổi học", { status: 404 });

  const vocab = toEntries(roadmap.vocabulary);
  const phrases = toEntries(roadmap.phrases);
  const allVocab = [...vocab, ...phrases];

  return {
    user,
    lesson: {
      id: roadmap.id,
      title: roadmap.title,
      description: roadmap.description,
      level: roadmap.level || roadmap.phase || "HSK1",
      orderNo: roadmap.orderNo,
      status: "PUBLISHED" as const,
      source: "",
      createdAt: roadmap.createdAt,
      updatedAt: roadmap.updatedAt,
      vocabularies: allVocab.map((v, i) => ({
        id: `rv-${i}`,
        chinese: v.chinese,
        pinyin: v.pinyin,
        meaningVi: v.meaningVi,
        meaningEn: v.meaningEn || null,
        exampleChinese: v.exampleChinese || null,
        examplePinyin: v.examplePinyin || null,
        exampleMeaning: v.exampleMeaning || null,
        imageUrl: v.imageUrl || `/images/${encodeURIComponent(v.chinese)}.jpg`,
        level: v.level || "",
        lessonId: roadmap.id,
        createdAt: new Date(),
      })),
      grammars: [],
      quizzes: [],
    },
  };
}

type Entry = {
  chinese: string;
  pinyin: string;
  meaningVi: string;
  meaningEn?: string;
  level?: string;
  exampleChinese?: string;
  examplePinyin?: string;
  exampleMeaning?: string;
  imageUrl?: string;
};
function toEntries(value: unknown): Entry[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (item): item is Record<string, unknown> =>
        Boolean(item) && typeof item === "object",
    )
    .map((item) => ({
      chinese: String(item.chinese || ""),
      pinyin: String(item.pinyin || ""),
      meaningVi: String(item.meaningVi || item.meaning || ""),
      meaningEn: item.meaningEn ? String(item.meaningEn) : undefined,
      level: item.level ? String(item.level) : undefined,
      exampleChinese: item.exampleChinese
        ? String(item.exampleChinese)
        : undefined,
      examplePinyin: item.examplePinyin
        ? String(item.examplePinyin)
        : undefined,
      exampleMeaning: item.exampleMeaning
        ? String(item.exampleMeaning)
        : undefined,
      imageUrl: item.imageUrl ? String(item.imageUrl) : undefined,
    }))
    .filter((item) => item.chinese && item.meaningVi);
}

type StudyTab = "vocabulary" | "translation" | "hanzi" | "quiz";
type QuizMode = "meaning" | "pinyin" | "recognition" | "listening";

function shuffleItems<T>(items: T[]): T[] {
  const s = [...items];
  for (let i = s.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [s[i], s[j]] = [s[j], s[i]];
  }
  return s;
}
function speakChinese(text: string) {
  if (typeof window === "undefined") return;
  fetch("/api/ai/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, lang: "zh-CN" }),
  })
    .then(r => r.ok ? r.json() : Promise.reject())
    .then(({ audio }) => {
      if (audio) new Audio(`data:audio/mp3;base64,${audio}`).play().catch(() => {});
    })
    .catch(() => {});
}

function playSound(correct: boolean) {
  if (typeof window === "undefined") return;
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    if (correct) {
      // Âm "ding" vui tai: 2 nốt cao ngắn
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);        // A5
      osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1); // C#6
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } else {
      // Âm "buzz" trầm ngắn
      osc.type = "square";
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    }
  } catch { /* bỏ qua nếu không hỗ trợ */ }
}

function getProgressColor(ratio: number): string {
  if (ratio >= 1) return "#22c55e";
  if (ratio <= 0) return "#ef4444";
  // red(#ef4444) → amber(#f59e0b) → green(#22c55e)
  if (ratio < 0.5) {
    const t = ratio / 0.5;
    const r = Math.round(239 + (245 - 239) * t);
    const g = Math.round(68 + (158 - 68) * t);
    const b = Math.round(68 + (11 - 68) * t);
    return `rgb(${r},${g},${b})`;
  } else {
    const t = (ratio - 0.5) / 0.5;
    const r = Math.round(245 + (34 - 245) * t);
    const g = Math.round(158 + (197 - 158) * t);
    const b = Math.round(11 + (94 - 11) * t);
    return `rgb(${r},${g},${b})`;
  }
}

function renderQuizQuestion(q: string) {
  const parts = q.split(/("[^"]+")/g);
  return parts.map((part, i) => {
    if (part.startsWith('"') && part.endsWith('"')) {
      const inner = part.slice(1, -1);
      const hasCJK = /[\u4e00-\u9fff]/.test(inner);
      return <span key={i} className={hasCJK ? "font-hanzi" : ""}>{part}</span>;
    }
    return part;
  });
}

export default function RoadmapDetail({ loaderData }: Route.ComponentProps) {
  const { lesson } = loaderData;
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<StudyTab>(
    lesson.vocabularies.length ? "vocabulary" : "quiz",
  );
  const [vocabPos, setVocabPos] = useState(0);
  const [vocabSk, setVocabSk] = useState(0);
  const [showMeaning, setShowMeaning] = useState(false);
  const [tlA, setTlA] = useState("");
  const [tlC, setTlC] = useState(false);
  const [hzA, setHzA] = useState("");
  const [hzC, setHzC] = useState(false);
  const [quizPos, setQuizPos] = useState(0);
  const [quizSk, setQuizSk] = useState(0);
  const [qzR, setQzR] = useState("");
  const [qzM, setQzM] = useState<QuizMode>("pinyin");
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showPinyin, setShowPinyin] = useState(false);
  const translationInputRef = useRef<HTMLInputElement>(null);
  const hanziInputRef = useRef<HTMLInputElement>(null);

  const sVocab = lesson.vocabularies;

  // Trộn thứ tự: đi hết 1 vòng mới trộn lại
  const vocabOrder = useMemo(
    () => shuffleItems([...Array(sVocab.length).keys()]),
    [sVocab.length, vocabSk],
  );
  const vocabIdx = vocabOrder[vocabPos] ?? 0;

  const genQ = useMemo(() => {
    return sVocab.map((v) => {
      const d = sVocab
        .filter((x) => x.chinese !== v.chinese)
        .map((x) =>
          qzM === "pinyin"
            ? x.pinyin
            : qzM === "recognition" || qzM === "listening"
              ? x.chinese
              : x.meaningVi,
        )
        .filter(Boolean);
      const a =
        qzM === "pinyin"
          ? v.pinyin
          : qzM === "recognition" || qzM === "listening"
            ? v.chinese
            : v.meaningVi;
      // Lấy ngẫu nhiên 3 đáp án từ câu khác làm đáp án sai
      const uniqueD = [...new Set(d.filter((x) => x !== a))];
      const randomD = shuffleItems(uniqueD).slice(0, 3);
      return {
        type:
          qzM === "pinyin"
            ? "PINYIN"
            : qzM === "recognition" || qzM === "listening"
              ? "CHAR_RECOGNITION"
              : "MEANING",
        question:
          qzM === "pinyin"
            ? `"${v.chinese}" đọc pinyin là gì?`
            : qzM === "listening"
              ? "Nghe và chọn chữ Hán đúng"
              : qzM === "recognition"
                ? `Chữ Hán nào có pinyin "${v.pinyin}"?`
                : `"${v.chinese}" nghĩa là gì?`,
        options: shuffleItems([a, ...randomD]),
        answer: a,
        promptPinyin: v.pinyin,
      };
    });
  }, [qzM, sVocab]);

  const quizOrder = useMemo(
    () => shuffleItems([...Array(genQ.length).keys()]),
    [genQ.length, quizSk],
  );
  const quizIdx = quizOrder[quizPos] ?? 0;

  const cVocab = sVocab[vocabIdx];
  const cQuiz = genQ[quizIdx];
  const correctMeanings = (cVocab?.meaningVi || "").split(/[;,/]| - |\/| hoặc /).map((s: string) => s.trim().toLowerCase()).filter(Boolean);
  const tlOK =
    tlC &&
    tlA.trim().length > 0 && correctMeanings.some((m: string) => {
      const u = tlA.trim().toLowerCase();
      if (u === m) return true;
      if (u.length >= Math.max(3, m.length / 2)) {
        return m.includes(u) || u.includes(m);
      }
      return false;
    });
  const hzOK = hzC && hzA.trim() === (cVocab?.chinese || "").trim();
  const qzHas = qzR.trim().length > 0;
  const qzOK = qzHas && qzR.trim() === (cQuiz?.answer || "").trim();
  const hanziHasCJK = /[\u4e00-\u9fff]/.test(hzA);

  // Phát âm thanh khi kiểm tra dịch nghĩa
  useEffect(() => {
    if (tlC) playSound(tlOK);
  }, [tlC, tlOK]);
  // Phát âm thanh khi kiểm tra chữ Hán
  useEffect(() => {
    if (hzC) playSound(hzOK);
  }, [hzC, hzOK]);
  // Phát âm thanh khi chọn đáp án quiz
  useEffect(() => {
    if (qzHas) playSound(qzOK);
  }, [qzHas, qzOK]);

  useEffect(() => {
    setVocabPos(0);
    setVocabSk((k) => k + 1);
    setShowMeaning(false);
    setTlA("");
    setTlC(false);
    setShowPinyin(false);
    setHzA("");
    setHzC(false);
    setQuizPos(0);
    setQuizSk((k) => k + 1);
    setQzR("");
    setQzM("pinyin");
  }, [activeTab]);
  useEffect(() => {
    if (activeTab === "quiz" && qzM === "listening" && cQuiz?.answer)
      speakChinese(cQuiz.answer as string);
  }, [quizIdx, qzM, activeTab, cQuiz?.answer]);

  // Tự động focus input khi chuyển từ mới
  useEffect(() => {
    if (activeTab === "translation") {
      translationInputRef.current?.focus();
    } else if (activeTab === "hanzi") {
      hanziInputRef.current?.focus();
    }
  }, [vocabIdx, activeTab]);

  const sw = (t: StudyTab) => {
    if (!sVocab.length && t !== "quiz") return;
    setActiveTab(t);
  };
  const nV = useCallback(() => {
    if (!sVocab.length) return;
    if (vocabPos + 1 >= vocabOrder.length) {
      setShowCompleteModal(true);
    } else {
      setVocabPos(vocabPos + 1);
      setShowMeaning(false); setTlA(""); setTlC(false);
      setHzA(""); setHzC(false);
    }
  }, [sVocab.length, vocabPos, vocabOrder.length]);
  const pV = useCallback(() => {
    if (!sVocab.length) return;
    setVocabPos((vocabPos - 1 + vocabOrder.length) % vocabOrder.length);
    setShowMeaning(false); setTlA(""); setTlC(false);
    setHzA(""); setHzC(false);
  }, [sVocab.length, vocabPos, vocabOrder.length]);
  const nQ = useCallback(() => {
    if (!genQ.length) return;
    if (quizPos + 1 >= quizOrder.length) {
      setShowCompleteModal(true);
    } else {
      setQuizPos(quizPos + 1);
      setQzR("");
    }
  }, [genQ.length, quizPos, quizOrder.length]);
  const pQ = useCallback(() => {
    if (!genQ.length) return;
    setQzR("");
    setQuizPos((quizPos - 1 + quizOrder.length) % quizOrder.length);
  }, [genQ.length, quizPos, quizOrder.length]);

  // Phím tắt: ← Trước, → Tiếp
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (activeTab === "quiz") pQ();
        else pV();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        if (activeTab === "quiz") nQ();
        else nV();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTab, pV, nV, pQ, nQ]);

  const title =
    activeTab === "vocabulary"
      ? "Từ Vựng"
      : activeTab === "translation"
        ? "Dịch Nghĩa"
        : activeTab === "hanzi"
          ? "Chữ Hán"
          : "Luyện Tập";
  const cnt = activeTab === "quiz" ? genQ.length : sVocab.length;

  return (
    <SiteLayout user={loaderData.user} hideFooter>
      <div className="relative min-h-screen bg-[#FDFBF7] text-slate-900 font-sans pb-28">
        <main className="mx-auto max-w-3xl px-3 py-4 md:px-4 md:py-8">
          <div className="mt-2 md:mt-4">
            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-xs sm:p-6 md:p-8">
              <div className="mb-6 flex flex-col gap-3">
                <div>
                  <h1 className="flex items-center gap-2 text-xl font-black tracking-tight text-slate-900 sm:text-2xl font-sans">
                    <button
                      onClick={() => navigate(-1)}
                      className="inline-flex text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                      aria-label="Quay lại"
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <span>{lesson.title}</span>
                  </h1>
                  {lesson.description && (
                    <p className="mt-1 pl-0 sm:pl-8 text-xs sm:text-sm text-slate-500 font-medium leading-relaxed font-sans">
                      {lesson.description}
                    </p>
                  )}
                </div>
                
                <div className="-mx-1 flex flex-wrap justify-center gap-1.5 pt-2">
                  {(
                    ["vocabulary", "translation", "hanzi", "quiz"] as StudyTab[]
                  ).map((t) => (
                    <button
                      key={t}
                      onClick={() => sw(t)}
                      disabled={!sVocab.length && t !== "quiz"}
                      className={`rounded-full px-3.5 py-1.5 text-xs font-black transition-all sm:rounded-2xl sm:px-5 sm:py-2.5 sm:text-sm font-sans cursor-pointer ${
                        activeTab === t
                          ? "bg-gradient-to-r from-red-600 via-rose-600 to-red-600 text-white shadow-md shadow-red-500/20"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                      } disabled:cursor-not-allowed disabled:opacity-40`}
                    >
                      {t === "vocabulary"
                        ? "Từ Vựng"
                        : t === "translation"
                          ? "Dịch Nghĩa"
                          : t === "hanzi"
                            ? "Chữ Hán"
                            : "Luyện Tập"}
                    </button>
                  ))}
                </div>
                {/* Progress bar */}
                <div className="h-2 overflow-hidden rounded-full bg-slate-100 mt-2">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${(activeTab === "quiz"
                        ? ((quizPos + 1) / cnt)
                        : ((vocabPos + 1) / cnt)) * 100}%`,
                      background: getProgressColor(
                        activeTab === "quiz"
                          ? (quizPos + 1) / cnt
                          : (vocabPos + 1) / cnt
                      ),
                    }}
                  />
                </div>
              </div>

              {activeTab === "vocabulary" && cVocab ? (
                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-red-50 to-amber-50 p-3 shadow-xs sm:rounded-[2rem] sm:p-6">
                  <div className="relative mx-auto max-w-3xl overflow-hidden rounded-2xl bg-white p-4 pt-10 text-center shadow-md sm:rounded-[2rem] sm:p-8 sm:pt-14">
                    <button
                      onClick={() => speakChinese(cVocab.chinese)}
                      className="absolute right-3 top-3 rounded-full bg-red-50 p-2.5 text-red-600 shadow-xs hover:bg-red-100 transition-colors cursor-pointer sm:right-6 sm:top-6 sm:p-3"
                      title="Nghe phát âm"
                      type="button"
                    >
                      <Volume2 size={20} />
                    </button>
                    <p className="break-all font-hanzi text-5xl font-black text-red-600 sm:text-6xl md:text-7xl" suppressHydrationWarning>
                      {cVocab.chinese}
                    </p>
                    <p className="mt-3 break-words text-base font-bold text-amber-700 sm:mt-4 sm:text-xl font-sans" suppressHydrationWarning>
                      {cVocab.pinyin}
                    </p>
                    {showMeaning ? (
                      <div className="mt-5 rounded-2xl bg-amber-50/80 border border-amber-200/60 p-4 sm:mt-6 sm:rounded-3xl sm:p-6">
                        <p className="text-xl font-black text-slate-900 sm:text-2xl font-sans">
                          {cVocab.meaningVi}
                        </p>
                        {cVocab.exampleChinese ? (
                          <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2 sm:mt-4">
                            <p className="break-words font-hanzi text-sm font-bold sm:text-lg text-slate-800">
                              {cVocab.exampleChinese}
                            </p>
                            <button
                              onClick={() => speakChinese(cVocab.exampleChinese || "")}
                              className="rounded-full bg-white p-1.5 text-red-600 hover:bg-red-100 shadow-2xs transition-colors cursor-pointer sm:p-2"
                              type="button"
                              title="Nghe câu ví dụ"
                            >
                              <Volume2 size={15} />
                            </button>
                          </div>
                        ) : null}
                        {cVocab.examplePinyin ? (
                          <p className="mt-1 text-xs font-bold text-amber-600 sm:text-sm font-sans">
                            {cVocab.examplePinyin}
                          </p>
                        ) : null}
                        {cVocab.exampleMeaning ? (
                          <p className="mt-1 text-xs text-slate-600 sm:text-sm font-medium font-sans">
                            {cVocab.exampleMeaning}
                          </p>
                        ) : null}
                      </div>
                    ) : (
                      <div className="mt-5 rounded-2xl border border-dashed border-slate-200 p-4 text-xs font-medium text-slate-400 sm:mt-6 sm:rounded-3xl sm:p-5 sm:text-sm font-sans">
                        Ẩn nghĩa để bạn tự nhớ trước
                      </div>
                    )}
                    <div className="mt-5 flex items-center justify-center gap-2 sm:mt-6 sm:gap-3">
                      <Nb onClick={pV} label="Trước" />
                      <button
                        onClick={() => setShowMeaning((p) => !p)}
                        type="button"
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-600 text-white shadow-md shadow-red-500/20 hover:bg-red-700 transition-all cursor-pointer sm:h-12 sm:w-12"
                      >
                        {showMeaning ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                      <Nb onClick={nV} label="Tiếp" next />
                    </div>
                  </div>
                </div>
              ) : activeTab === "vocabulary" ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-400 font-sans">
                  Bài này chưa có từ vựng.
                </div>
              ) : null}

              {activeTab === "translation" && cVocab && (
                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-red-50 to-amber-50 p-3 sm:rounded-[2rem] sm:p-6">
                  <div className="relative mx-auto max-w-3xl overflow-hidden rounded-2xl bg-white p-4 pt-10 text-center shadow-md sm:rounded-[2rem] sm:p-8 sm:pt-14">
                    <button
                      onClick={() => speakChinese(cVocab.chinese)}
                      className="absolute right-3 top-3 rounded-full bg-red-50 p-2.5 text-red-600 hover:bg-red-100 transition-colors cursor-pointer sm:right-6 sm:top-6 sm:p-3"
                    >
                      <Volume2 size={20} />
                    </button>
                    <p className="break-all font-hanzi text-5xl font-black text-red-600 sm:text-6xl md:text-7xl" suppressHydrationWarning>
                      {cVocab.chinese}
                    </p>
                    {(showPinyin || tlC) ? (
                      <p className="mt-3 text-base font-bold text-amber-700 sm:mt-4 sm:text-xl font-sans" suppressHydrationWarning>
                        {cVocab.pinyin}
                      </p>
                    ) : null}
                    <div className="mt-5">
                      <input
                        ref={translationInputRef}
                        value={tlA}
                        onChange={(e) => setTlA(e.target.value)}
                        placeholder="Nhập nghĩa tiếng Việt..."
                        className={`w-full input-normal font-sans rounded-2xl border px-4 py-3 text-lg sm:text-xl font-bold outline-none transition ${
                          tlC
                            ? tlOK
                              ? "border-emerald-400 bg-emerald-50 text-emerald-900"
                              : "border-red-400 bg-red-50 text-red-900"
                            : "border-slate-200 focus:border-red-400"
                        }`}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") { setTlC(true); (e.target as HTMLInputElement).blur(); }
                        }}
                      />
                    </div>
                    {!tlC ? null : (
                      <div className="mt-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/60 p-4 text-left font-sans">
                        <p className="text-xs font-black uppercase tracking-wider text-amber-700">
                          Đáp án tham khảo
                        </p>
                        <p className="mt-1 text-xl font-black text-slate-900">
                          {cVocab.meaningVi}
                        </p>
                      </div>
                    )}
                    <button
                      onClick={() => setShowPinyin(!showPinyin)}
                      type="button"
                      className={`absolute left-3 top-3 sm:left-6 sm:top-6 inline-flex h-6 w-10 items-center rounded-full transition cursor-pointer ${
                        showPinyin ? "bg-red-500" : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                          showPinyin ? "translate-x-5" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                    <div className="mt-5 flex items-center justify-center gap-2.5">
                      <Nb onClick={pV} label="Trước" />
                      {!tlC ? (
                        <button
                          onClick={() => setTlC(true)}
                          disabled={!tlA.trim()}
                          className="flex h-11 w-11 items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-700 shadow-md shadow-red-500/20 disabled:opacity-50 transition-all cursor-pointer sm:h-12 sm:w-12"
                          type="button"
                        >
                          <Check size={20} />
                        </button>
                      ) : (
                        <button
                          onClick={nV}
                          className="flex h-11 w-11 items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-700 shadow-md shadow-red-500/20 transition-all cursor-pointer sm:h-12 sm:w-12"
                          type="button"
                        >
                          <ChevronRight size={20} />
                        </button>
                      )}
                      <Nb onClick={nV} label="Tiếp" next />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "hanzi" && cVocab && (
                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-red-50 to-amber-50 p-3 sm:rounded-[2rem] sm:p-6">
                  <div className="relative mx-auto max-w-3xl overflow-hidden rounded-2xl bg-white p-4 pt-10 text-center shadow-md sm:rounded-[2rem] sm:p-8 sm:pt-14">
                    <button
                      onClick={() => speakChinese(cVocab.chinese)}
                      className="absolute right-3 top-3 rounded-full bg-red-50 p-2.5 text-red-600 hover:bg-red-100 transition-colors cursor-pointer sm:right-6 sm:top-6 sm:p-3"
                    >
                      <Volume2 size={20} />
                    </button>
                    {(showPinyin || hzC) ? (
                      <p className="break-all text-4xl font-black text-amber-700 sm:text-5xl font-sans">
                        {cVocab.pinyin}
                      </p>
                    ) : (
                      <p className="text-4xl font-black text-slate-300 sm:text-5xl font-sans">?</p>
                    )}
                    <button
                      onClick={() => setShowPinyin(!showPinyin)}
                      type="button"
                      className={`absolute left-3 top-3 sm:left-6 sm:top-6 inline-flex h-6 w-10 items-center rounded-full transition cursor-pointer ${
                        showPinyin ? "bg-red-500" : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                          showPinyin ? "translate-x-5" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                    <p className="mt-2 text-base text-slate-600 sm:text-lg font-bold font-sans">
                      {cVocab.meaningVi}
                    </p>
                    <div className="mt-5">
                      <input
                        ref={hanziInputRef}
                        value={hzA}
                        onChange={(e) => setHzA(e.target.value)}
                        placeholder="Nhập chữ Hán..."
                        className={`w-full input-hanzi rounded-2xl border px-4 py-3 text-xl font-bold outline-none transition ${
                          hanziHasCJK ? "font-hanzi" : "font-sans"
                        } ${
                          hzC
                            ? hzOK
                              ? "border-emerald-400 bg-emerald-50 text-emerald-900"
                              : "border-red-400 bg-red-50 text-red-900"
                            : "border-slate-200 focus:border-red-400"
                        }`}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") { setHzC(true); (e.target as HTMLInputElement).blur(); }
                        }}
                      />
                    </div>
                    {!hzC ? null : (
                      <div className="mt-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/60 p-4 text-left font-sans">
                        <p className="text-xs font-black uppercase tracking-wider text-amber-700">
                          Đáp án
                        </p>
                        <p className="mt-1 font-hanzi text-2xl font-black text-red-600">
                          {cVocab.chinese}
                        </p>
                      </div>
                    )}
                    <div className="mt-5 flex items-center justify-center gap-2.5">
                      <Nb onClick={pV} label="Trước" />
                      {!hzC ? (
                        <button
                          onClick={() => setHzC(true)}
                          disabled={!hzA.trim()}
                          className="flex h-11 w-11 items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-700 shadow-md shadow-red-500/20 disabled:opacity-50 transition-all cursor-pointer sm:h-12 sm:w-12"
                          type="button"
                        >
                          <Check size={20} />
                        </button>
                      ) : (
                        <button
                          onClick={nV}
                          className="flex h-11 w-11 items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-700 shadow-md shadow-red-500/20 transition-all cursor-pointer sm:h-12 sm:w-12"
                          type="button"
                        >
                          <ChevronRight size={20} />
                        </button>
                      )}
                      <Nb onClick={nV} label="Tiếp" next />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "quiz" && cQuiz && (
                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-red-50 to-amber-50 p-3 sm:rounded-[2rem] sm:p-6">
                  <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl bg-white p-4 shadow-md sm:rounded-[2rem] sm:p-8">
                    <div className="-mx-1 mb-4 flex flex-wrap justify-center gap-1.5">
                      {(
                        ["pinyin", "meaning", "recognition", "listening"] as const
                      ).map((m) => (
                        <button
                          key={m}
                          onClick={() => { setQzM(m); setQuizPos(0); setQzR(""); }}
                          className={`rounded-full px-3.5 py-1.5 text-xs font-black transition-all sm:rounded-xl sm:px-4 sm:py-2 sm:text-sm font-sans cursor-pointer ${
                            qzM === m
                              ? "bg-gradient-to-r from-red-600 via-rose-600 to-red-600 text-white shadow-md shadow-red-500/20"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                          }`}
                        >
                          {m === "pinyin"
                            ? "Pinyin"
                            : m === "meaning"
                              ? "Dịch Nghĩa"
                              : m === "recognition"
                                ? "Chữ Hán"
                                : "Luyện Nghe"}
                        </button>
                      ))}
                    </div>
                    <h3 className="text-lg font-black text-slate-900 sm:text-2xl font-sans">
                      {renderQuizQuestion(cQuiz.question)}
                    </h3>
                    {qzM === "listening" ? (
                      <button
                        onClick={() => speakChinese(cQuiz.answer as string)}
                        className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-red-50 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-100 shadow-2xs transition-colors cursor-pointer sm:px-4 sm:py-2.5 sm:text-sm font-sans"
                      >
                        <Volume2 size={16} />
                        <span>Phát âm lại</span>
                      </button>
                    ) : null}
                    <div className="mt-5 grid gap-2.5">
                      {(cQuiz.options as string[]).map((opt: string) => {
                        const s = qzR === opt;
                        const c = opt === cQuiz.answer;
                        const isCJKOption = qzM === "recognition" || qzM === "listening";
                        return (
                          <button
                            key={opt}
                            onClick={() => setQzR(opt)}
                            className={`rounded-2xl border px-4 py-3.5 text-left font-bold transition-all cursor-pointer ${
                              isCJKOption ? "font-hanzi text-xl sm:text-2xl font-black" : "font-sans text-base sm:text-lg"
                            } ${
                              qzHas
                                ? c
                                  ? "border-emerald-300 bg-emerald-50 text-emerald-800 shadow-2xs"
                                  : s
                                    ? "border-red-300 bg-red-50 text-red-800"
                                    : "border-slate-200 bg-white text-slate-500 opacity-60"
                                : s
                                  ? "border-red-300 bg-red-50 text-red-800"
                                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-2xs"
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-5 grid grid-cols-2 gap-2 sm:flex sm:justify-center sm:gap-3">
                      <Nb onClick={pQ} label="Trước" />
                      <Nb onClick={nQ} label="Tiếp" next />
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Completion Modal */}
            {showCompleteModal ? (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
                <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl font-sans">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                    <svg className="h-8 w-8 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 font-sans">Đã hoàn thành!</h3>
                  <p className="mt-1 text-sm text-slate-500 font-medium font-sans">
                    Bạn đã học xong {activeTab === "quiz" ? "bài luyện tập" : "tất cả từ vựng"}.
                  </p>
                  <div className="mt-5 flex gap-3 font-sans">
                    <button
                      onClick={() => {
                        setShowCompleteModal(false);
                        if (activeTab === "quiz") {
                          setQuizSk((k) => k + 1);
                          setQuizPos(0);
                          setQzR("");
                        } else {
                          setVocabSk((k) => k + 1);
                          setVocabPos(0);
                          setShowMeaning(false);
                          setTlA(""); setTlC(false);
                          setHzA(""); setHzC(false);
                        }
                      }}
                      className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      {activeTab === "quiz" ? "Làm lại" : "Học lại"}
                    </button>
                    <button
                      onClick={() => {
                        setShowCompleteModal(false);
                        if (activeTab === "quiz") {
                          const modes: QuizMode[] = ["pinyin", "meaning", "recognition", "listening"];
                          const idx = modes.indexOf(qzM);
                          if (idx < modes.length - 1) {
                            setQzM(modes[idx + 1]);
                            setQuizPos(0);
                            setQzR("");
                          }
                        } else {
                          const tabs: StudyTab[] = ["vocabulary", "translation", "hanzi", "quiz"];
                          const idx = tabs.indexOf(activeTab);
                          if (idx < tabs.length - 1) setActiveTab(tabs[idx + 1]);
                        }
                      }}
                      className="flex-1 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-600 px-4 py-3 text-sm font-black text-white shadow-md shadow-red-500/20 hover:from-red-500 hover:to-rose-500 transition-all cursor-pointer"
                    >
                      Tiếp
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </main>
      </div>
    </SiteLayout>
  );
}

function Nb({
  onClick,
  label,
  next,
}: {
  onClick: () => void;
  label: string;
  next?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex min-h-10 items-center justify-center gap-1 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs font-sans transition-all cursor-pointer sm:min-h-12 sm:gap-2 sm:px-5 sm:py-3 sm:text-sm ${next ? "flex-row-reverse" : ""}`}
    >
      {next ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      <span>{label}</span>
    </button>
  );
}
