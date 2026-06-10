import type { Route } from "./+types/roadmap.$roadmapId";
import { useEffect, useMemo, useState } from "react";
import { data } from "react-router";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Check,
  Volume2,
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
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "zh-CN";
  u.rate = 0.85;
  const voices = window.speechSynthesis.getVoices();
  // Ưu tiên giọng nữ (Ting-Ting, Mei-Jia, Yu-Xiao…)
  const zhVoice = voices
    .filter((v) => v.lang.startsWith("zh"))
    .sort((a) => (a.name.toLowerCase().includes("chen") ? 1 : -1))[0];
  if (zhVoice) u.voice = zhVoice;
  window.speechSynthesis.speak(u);
}

export default function RoadmapDetail({ loaderData }: Route.ComponentProps) {
  const { lesson } = loaderData;
  const [activeTab, setActiveTab] = useState<StudyTab>(
    lesson.vocabularies.length ? "vocabulary" : "quiz",
  );
  const [vocabIndex, setVocabIndex] = useState(0);
  const [showMeaning, setShowMeaning] = useState(false);
  const [tlA, setTlA] = useState("");
  const [tlC, setTlC] = useState(false);
  const [hzA, setHzA] = useState("");
  const [hzC, setHzC] = useState(false);
  const [qzI, setQzI] = useState(0);
  const [qzR, setQzR] = useState("");
  const [qzM, setQzM] = useState<QuizMode>("meaning");

  const [sVocab] = useState(() => shuffleItems(lesson.vocabularies));
  const [sQuiz] = useState(() => shuffleItems(lesson.quizzes));

  // Warm-up speechSynthesis cho lần phát đầu tiên
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.getVoices();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(" "));
    window.speechSynthesis.cancel();
  }, []);

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
        options: shuffleItems([...new Set([a, ...d])].slice(0, 4)),
        answer: a,
        promptPinyin: v.pinyin,
      };
    });
  }, [qzM, sVocab]);

  const cVocab = sVocab[vocabIndex];
  const cQuiz = genQ[qzI];
  const tlOK =
    tlC &&
    tlA.trim().toLowerCase() === (cVocab?.meaningVi || "").trim().toLowerCase();
  const hzOK = hzC && hzA.trim() === (cVocab?.chinese || "").trim();
  const qzHas = qzR.trim().length > 0;
  const qzOK = qzHas && qzR.trim() === (cQuiz?.answer || "").trim();

  useEffect(() => {
    setVocabIndex(0);
    setShowMeaning(false);
    setTlA("");
    setTlC(false);
    setHzA("");
    setHzC(false);
    setQzI(0);
    setQzR("");
    setQzM("meaning");
  }, [activeTab]);
  useEffect(() => {
    setQzI(0);
    setQzR("");
  }, [qzM]);
  useEffect(() => {
    setQzR("");
  }, [qzI]);
  useEffect(() => {
    if (activeTab === "quiz" && qzM === "listening" && cQuiz?.answer)
      speakChinese(cQuiz.answer as string);
  }, [qzI, qzM, activeTab, cQuiz?.answer]);

  const randomOther = (current: number, total: number) => {
    if (total <= 1) return 0;
    let next: number;
    do {
      next = Math.floor(Math.random() * total);
    } while (next === current);
    return next;
  };
  const sw = (t: StudyTab) => {
    if (!sVocab.length && t !== "quiz") return;
    setActiveTab(t);
  };
  const nV = () => {
    if (!sVocab.length) return;
    setVocabIndex(randomOther(vocabIndex, sVocab.length));
    setShowMeaning(false);
    setTlA("");
    setTlC(false);
    setHzA("");
    setHzC(false);
  };
  const pV = () => {
    if (!sVocab.length) return;
    setVocabIndex(randomOther(vocabIndex, sVocab.length));
    setShowMeaning(false);
    setTlA("");
    setTlC(false);
    setHzA("");
    setHzC(false);
  };
  const nQ = () => {
    if (!genQ.length) return;
    setQzI(randomOther(qzI, genQ.length));
  };
  const pQ = () => {
    if (!genQ.length) return;
    setQzI(randomOther(qzI, genQ.length));
  };

  const title =
    activeTab === "vocabulary"
      ? "Học từ vựng"
      : activeTab === "translation"
        ? "Dịch nghĩa"
        : activeTab === "hanzi"
          ? "Chữ Hán"
          : "Luyện tập";
  const cnt = activeTab === "quiz" ? genQ.length : sVocab.length;

  return (
    <SiteLayout user={loaderData.user}>
      <main className="mx-auto max-w-3xl px-3 py-4 md:px-4 md:py-8">
        <div className="mt-4 md:mt-6">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:rounded-3xl sm:p-4 md:p-6">
            <div className="mb-4 flex flex-col gap-3">
              <div>
                <h1 className="text-lg font-bold sm:text-xl">{lesson.title}</h1>
                <p className="mt-1 text-sm text-slate-500">{lesson.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold sm:text-xl">{title}</h2>
                <p className="text-xs text-slate-400 sm:text-sm">
                  {activeTab === "quiz"
                    ? `${qzI + 1}/${cnt}`
                    : `${vocabIndex + 1}/${cnt}`}
                </p>
              </div>
              <div className="-mx-1 flex flex-wrap justify-center gap-1">
                {(
                  ["vocabulary", "translation", "hanzi", "quiz"] as StudyTab[]
                ).map((t) => (
                  <button
                    key={t}
                    onClick={() => sw(t)}
                    disabled={!sVocab.length && t !== "quiz"}
                    className={`rounded-full px-3 py-1.5 text-[11px] font-bold sm:rounded-2xl sm:px-5 sm:py-2.5 sm:text-sm ${activeTab === t ? "bg-red-600 text-white" : "bg-slate-100 text-slate-500"} disabled:cursor-not-allowed disabled:opacity-40`}
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
            </div>

            {activeTab === "vocabulary" && cVocab && (
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-red-50 to-amber-50 p-2 sm:rounded-[2rem] sm:p-6">
                <div className="relative mx-auto max-w-3xl overflow-hidden rounded-2xl bg-white p-3 pt-10 text-center shadow-md sm:rounded-[2rem] sm:p-6 sm:pt-14">
                  <button
                    onClick={() => speakChinese(cVocab.chinese)}
                    className="absolute right-2 top-2 rounded-full bg-red-50 p-2.5 text-red-600 hover:bg-red-100 sm:right-5 sm:top-5 sm:p-3"
                  >
                    <Volume2 size={18} />
                  </button>
                  <p className="break-all text-5xl font-black text-red-600 sm:text-6xl md:text-7xl" suppressHydrationWarning>
                    {cVocab.chinese}
                  </p>
                  <p className="mt-3 text-base font-bold text-slate-800 sm:mt-4 sm:text-xl" suppressHydrationWarning>
                    {cVocab.pinyin}
                  </p>
                  {showMeaning ? (
                    <div className="mt-4 rounded-2xl bg-amber-50 p-3 sm:mt-6 sm:rounded-3xl sm:p-5">
                      <p className="text-lg font-extrabold text-slate-900 sm:text-2xl" suppressHydrationWarning>
                        {cVocab.meaningVi}
                      </p>
                    </div>
                  ) : (
                    <div className="mt-4 rounded-2xl border border-dashed border-slate-200 p-4 text-xs text-slate-400 sm:mt-6 sm:p-5 sm:text-sm">
                      Ẩn nghĩa để bạn tự nhớ trước
                    </div>
                  )}
                  <div className="mt-4 grid grid-cols-3 gap-1.5 sm:mt-6 sm:flex sm:justify-center sm:gap-2.5">
                    <Nb onClick={pV} label="Trước" />
                    <button
                      onClick={() => setShowMeaning((p) => !p)}
                      className="flex min-h-10 items-center justify-center gap-1.5 rounded-2xl bg-red-600 px-3 py-2.5 text-xs font-semibold text-white hover:bg-red-700 sm:min-h-12 sm:px-5 sm:py-3 sm:text-sm"
                    >
                      {showMeaning ? <EyeOff size={16} /> : <Eye size={16} />}
                      {showMeaning ? "Ẩn" : "Lật"}
                    </button>
                    <Nb onClick={nV} label="Tiếp" next />
                  </div>
                </div>
              </div>
            )}
            {activeTab === "translation" && cVocab && (
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-red-50 to-amber-50 p-2 sm:rounded-[2rem] sm:p-6">
                <div className="relative mx-auto max-w-3xl overflow-hidden rounded-2xl bg-white p-3 pt-10 text-center shadow-md sm:rounded-[2rem] sm:p-6 sm:pt-14">
                  <button
                    onClick={() => speakChinese(cVocab.chinese)}
                    className="absolute right-2 top-2 rounded-full bg-red-50 p-2.5 text-red-600 hover:bg-red-100 sm:right-5 sm:top-5 sm:p-3"
                  >
                    <Volume2 size={18} />
                  </button>
                  <p className="break-all text-5xl font-black text-red-600 sm:text-6xl md:text-7xl" suppressHydrationWarning>
                    {cVocab.chinese}
                  </p>
                  <p className="mt-3 text-base font-bold text-slate-800 sm:mt-4 sm:text-xl" suppressHydrationWarning>
                    {cVocab.pinyin}
                  </p>
                  <div className="mt-5">
                    <input
                      value={tlA}
                      onChange={(e) => setTlA(e.target.value)}
                      placeholder="Nhập nghĩa tiếng Việt..."
                      className={`w-full rounded-2xl border px-4 py-3 text-base font-semibold outline-none transition ${tlC ? (tlOK ? "border-emerald-400 bg-emerald-50" : "border-red-400 bg-red-50") : "border-slate-200 focus:border-red-400"}`}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") setTlC(true);
                      }}
                    />
                  </div>
                  {!tlC ? (
                    <button
                      onClick={() => setTlC(true)}
                      disabled={!tlA.trim()}
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      <Check size={18} />
                      Kiểm tra
                    </button>
                  ) : null}
                  <div className="mt-4 grid grid-cols-2 gap-1.5 sm:flex sm:justify-center sm:gap-2.5">
                    <Nb onClick={pV} label="Trước" />
                    <Nb onClick={nV} label="Tiếp" next />
                  </div>
                </div>
              </div>
            )}
            {activeTab === "hanzi" && cVocab && (
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-red-50 to-amber-50 p-2 sm:rounded-[2rem] sm:p-6">
                <div className="relative mx-auto max-w-3xl overflow-hidden rounded-2xl bg-white p-3 pt-10 text-center shadow-md sm:rounded-[2rem] sm:p-6 sm:pt-14">
                  <button
                    onClick={() => speakChinese(cVocab.chinese)}
                    className="absolute right-2 top-2 rounded-full bg-red-50 p-2.5 text-red-600 hover:bg-red-100 sm:right-5 sm:top-5 sm:p-3"
                  >
                    <Volume2 size={18} />
                  </button>
                  <p className="break-all text-4xl font-black text-red-600 sm:text-5xl">
                    {cVocab.pinyin}
                  </p>
                  <p className="mt-2 text-base text-slate-500 sm:text-lg">
                    {cVocab.meaningVi}
                  </p>
                  <div className="mt-5">
                    <input
                      value={hzA}
                      onChange={(e) => setHzA(e.target.value)}
                      placeholder="Nhập chữ Hán..."
                      className={`w-full rounded-2xl border px-4 py-3 text-base font-semibold outline-none transition ${hzC ? (hzOK ? "border-emerald-400 bg-emerald-50" : "border-red-400 bg-red-50") : "border-slate-200 focus:border-red-400"}`}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") setHzC(true);
                      }}
                    />
                  </div>
                  {!hzC ? (
                    <button
                      onClick={() => setHzC(true)}
                      disabled={!hzA.trim()}
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      <Check size={18} />
                      Kiểm tra
                    </button>
                  ) : null}
                  <div className="mt-4 grid grid-cols-2 gap-1.5 sm:flex sm:justify-center sm:gap-2.5">
                    <Nb onClick={pV} label="Trước" />
                    <Nb onClick={nV} label="Tiếp" next />
                  </div>
                </div>
              </div>
            )}
            {activeTab === "quiz" && cQuiz && (
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-red-50 to-amber-50 p-2 sm:rounded-[2rem] sm:p-6">
                <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl bg-white p-3 shadow-md sm:rounded-[2rem] sm:p-6">
                  <div className="-mx-1 mb-4 flex flex-wrap justify-center gap-1">
                    {(
                      ["meaning", "pinyin", "recognition", "listening"] as const
                    ).map((m) => (
                      <button
                        key={m}
                        onClick={() => setQzM(m)}
                        className={`rounded-full px-3 py-1.5 text-[11px] font-bold sm:rounded-xl sm:px-4 sm:py-2 sm:text-sm ${qzM === m ? "bg-red-600 text-white" : "bg-slate-100 text-slate-500"}`}
                      >
                        {m === "meaning"
                          ? "Nghĩa"
                          : m === "pinyin"
                            ? "Pinyin"
                            : m === "recognition"
                              ? "Chữ Hán"
                              : "Nghe"}
                      </button>
                    ))}
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-900 sm:text-xl">
                    {cQuiz.question}
                  </h3>
                  {qzM === "listening" ? (
                    <button
                      onClick={() => speakChinese(cQuiz.answer as string)}
                      className="mt-3 flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600 sm:rounded-2xl sm:px-4 sm:py-2.5 sm:text-sm"
                    >
                      <Volume2 size={16} />
                      Nghe lại
                    </button>
                  ) : null}
                  <div className="mt-4 grid gap-2">
                    {(Array.isArray(cQuiz.options)
                      ? cQuiz.options.map((o: unknown) => String(o))
                      : []
                    ).map((opt: string) => {
                      const s = qzR === opt;
                      const c = opt === cQuiz.answer;
                      return (
                        <button
                          key={opt}
                          onClick={() => setQzR(opt)}
                          className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold ${qzHas ? (c ? "border-emerald-300 bg-emerald-50 text-emerald-700" : s ? "border-red-300 bg-red-50 text-red-700" : "border-slate-200 bg-white text-slate-500") : s ? "border-red-300 bg-red-50 text-red-700" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:justify-center sm:gap-3">
                    <Nb onClick={pQ} label="Câu trước" />
                    <Nb onClick={nQ} label="Câu tiếp theo" next />
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
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
      className={`flex min-h-10 items-center justify-center gap-1 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 sm:min-h-12 sm:gap-2 sm:px-5 sm:py-3 sm:text-sm ${next ? "flex-row-reverse" : ""}`}
    >
      {next ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      {label}
    </button>
  );
}
