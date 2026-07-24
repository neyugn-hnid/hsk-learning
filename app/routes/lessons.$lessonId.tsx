import type { Route } from "./+types/lessons.$lessonId";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { data, useNavigate } from "react-router";
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
import { requireUser } from "~/lib/auth.server";
import { prisma } from "~/lib/db.server";

export async function loader({ request, params }: Route.LoaderArgs) {
  const user = await requireUser(request);
  const lesson = await prisma.lesson.findUnique({
    where: { id: params.lessonId },
    include: { vocabularies: true, grammars: true, quizzes: true },
  });

  if (!lesson) throw data("Không tìm thấy bài học", { status: 404 });

  const vocabulariesWithImages = lesson.vocabularies.map((v) => ({
    ...v,
    imageUrl: v.imageUrl || `/images/${encodeURIComponent(v.chinese)}.jpg`,
  }));

  return {
    user,
    lesson: { ...lesson, vocabularies: vocabulariesWithImages },
  };
}

type StudyTab = "vocabulary" | "translation" | "hanzi" | "quiz";
type QuizMode = "meaning" | "pinyin" | "recognition" | "listening";

function shuffleItems<T>(items: T[]): T[] {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
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

export default function LessonDetail({ loaderData }: Route.ComponentProps) {
  const { lesson } = loaderData;
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<StudyTab>("vocabulary");
  const [vocabPos, setVocabPos] = useState(0);
  const [vocabSk, setVocabSk] = useState(0);
  const [showMeaning, setShowMeaning] = useState(false);
  const [translationAnswer, setTranslationAnswer] = useState("");
  const [checkedTranslation, setCheckedTranslation] = useState(false);
  const [hanziAnswer, setHanziAnswer] = useState("");
  const [checkedHanzi, setCheckedHanzi] = useState(false);
  const [quizPos, setQuizPos] = useState(0);
  const [quizSk, setQuizSk] = useState(0);
  const [quizResponse, setQuizResponse] = useState("");
  const [quizMode, setQuizMode] = useState<QuizMode>("pinyin");
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const translationInputRef = useRef<HTMLInputElement>(null);
  const hanziInputRef = useRef<HTMLInputElement>(null);

  const vocabItems = lesson.vocabularies;

  // Trộn thứ tự: đi hết 1 vòng mới trộn lại
  const vocabOrder = useMemo(
    () => shuffleItems([...Array(vocabItems.length).keys()]),
    [vocabItems.length, vocabSk],
  );
  const vocabIdx = vocabOrder[vocabPos] ?? 0;
  const currentVocab = vocabItems[vocabIdx];

  const quizItems = lesson.quizzes;

  const generatedQuizzes = useMemo(() => {
    return vocabItems.map((vocab) => {
      const distractors = vocabItems
        .filter((v) => v.chinese !== vocab.chinese)
        .map((v) => {
          if (quizMode === "pinyin") return v.pinyin;
          if (quizMode === "recognition" || quizMode === "listening") return v.chinese;
          return v.meaningVi;
        })
        .filter(Boolean);
      const answer =
        quizMode === "pinyin" ? vocab.pinyin
        : quizMode === "recognition" || quizMode === "listening" ? vocab.chinese
        : vocab.meaningVi;
      // Lấy ngẫu nhiên 3 đáp án từ câu khác làm đáp án sai
      const uniqueD = [...new Set(distractors.filter((x) => x !== answer))];
      const randomD = shuffleItems(uniqueD).slice(0, 3);
      return {
        type: quizMode === "pinyin" ? "PINYIN" : quizMode === "recognition" || quizMode === "listening" ? "CHAR_RECOGNITION" : "MEANING",
        question: quizMode === "pinyin" ? `"${vocab.chinese}" đọc pinyin là gì?`
          : quizMode === "listening" ? "Nghe và chọn chữ Hán đúng"
          : quizMode === "recognition" ? `Chữ Hán nào có pinyin "${vocab.pinyin}"?`
          : `"${vocab.chinese}" nghĩa là gì?`,
        options: shuffleItems([answer, ...randomD]),
        answer,
        promptPinyin: vocab.pinyin,
      };
    });
  }, [quizMode, vocabItems]);

  const practiceQuestions = quizItems.length && quizMode === "meaning" ? quizItems : generatedQuizzes;

  const quizOrder = useMemo(
    () => shuffleItems([...Array(practiceQuestions.length).keys()]),
    [practiceQuestions.length, quizSk],
  );
  const quizIdx = quizOrder[quizPos] ?? 0;

  const currentQuiz = practiceQuestions[quizIdx];

  const normalizedUserMeaning = translationAnswer.trim().toLowerCase();
  const correctMeanings = (currentVocab?.meaningVi || "").split(/[;,/]| - |\/| hoặc /).map(s => s.trim().toLowerCase()).filter(Boolean);
  const translationCorrect = checkedTranslation && normalizedUserMeaning.length > 0 && correctMeanings.some(m => {
    if (normalizedUserMeaning === m) return true;
    if (normalizedUserMeaning.length >= Math.max(3, m.length / 2)) {
      return m.includes(normalizedUserMeaning) || normalizedUserMeaning.includes(m);
    }
    return false;
  });

  const normalizedUserHanzi = hanziAnswer.trim();
  const normalizedCorrectHanzi = (currentVocab?.chinese || "").trim();
  const hanziCorrect = checkedHanzi && normalizedUserHanzi.length > 0 && normalizedUserHanzi === normalizedCorrectHanzi;

  const hasQuizAnswer = quizResponse.trim().length > 0;
  const quizCorrect = hasQuizAnswer && quizResponse.trim() === (currentQuiz?.answer || "").trim();

  const hanziHasCJK = /[\u4e00-\u9fff]/.test(hanziAnswer);

  // Phát âm thanh khi kiểm tra dịch nghĩa
  useEffect(() => {
    if (checkedTranslation) playSound(translationCorrect);
  }, [checkedTranslation, translationCorrect]);
  // Phát âm thanh khi kiểm tra chữ Hán
  useEffect(() => {
    if (checkedHanzi) playSound(hanziCorrect);
  }, [checkedHanzi, hanziCorrect]);
  // Phát âm thanh khi chọn đáp án quiz
  useEffect(() => {
    if (hasQuizAnswer) playSound(quizCorrect);
  }, [hasQuizAnswer, quizCorrect]);

  useEffect(() => {
    setVocabPos(0);
    setVocabSk((k) => k + 1);
    setShowMeaning(false);
    setTranslationAnswer(""); setCheckedTranslation(false);
    setHanziAnswer(""); setCheckedHanzi(false);
    setQuizPos(0);
    setQuizSk((k) => k + 1);
    setQuizResponse("");
    setQuizMode("pinyin");
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "quiz" && quizMode === "listening" && currentQuiz?.answer) {
      speakChinese(currentQuiz.answer as string);
    }
  }, [quizIdx, quizMode, activeTab, currentQuiz?.answer]);

  // Tự động focus input khi chuyển từ mới
  useEffect(() => {
    if (activeTab === "translation") {
      translationInputRef.current?.focus();
    } else if (activeTab === "hanzi") {
      hanziInputRef.current?.focus();
    }
  }, [vocabIdx, activeTab]);

  const switchTab = (tab: StudyTab) => {
    if (!vocabItems.length && tab !== "quiz") return;
    if (tab === "quiz" && !vocabItems.length && !quizItems.length) return;
    setActiveTab(tab);
  };

  const nextVocab = useCallback(() => {
    if (!vocabItems.length) return;
    if (vocabPos + 1 >= vocabOrder.length) {
      setShowCompleteModal(true);
    } else {
      setVocabPos(vocabPos + 1);
      setShowMeaning(false); setTranslationAnswer(""); setCheckedTranslation(false);
      setHanziAnswer(""); setCheckedHanzi(false);
    }
  }, [vocabItems.length, vocabPos, vocabOrder.length]);
  const prevVocab = useCallback(() => {
    if (!vocabItems.length) return;
    setVocabPos((vocabPos - 1 + vocabOrder.length) % vocabOrder.length);
    setShowMeaning(false); setTranslationAnswer(""); setCheckedTranslation(false);
    setHanziAnswer(""); setCheckedHanzi(false);
  }, [vocabItems.length, vocabPos, vocabOrder.length]);
  const nextQuiz = useCallback(() => {
    if (!practiceQuestions.length) return;
    if (quizPos + 1 >= quizOrder.length) {
      setShowCompleteModal(true);
    } else {
      setQuizPos(quizPos + 1);
      setQuizResponse("");
    }
  }, [practiceQuestions.length, quizPos, quizOrder.length]);
  const prevQuiz = useCallback(() => {
    if (!practiceQuestions.length) return;
    setQuizResponse("");
    setQuizPos((quizPos - 1 + quizOrder.length) % quizOrder.length);
  }, [practiceQuestions.length, quizPos, quizOrder.length]);

  // Phím tắt: ← Trước, → Tiếp
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Bỏ qua nếu đang focus vào input
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (activeTab === "quiz") prevQuiz();
        else prevVocab();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        if (activeTab === "quiz") nextQuiz();
        else nextVocab();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTab, prevVocab, nextVocab, prevQuiz, nextQuiz]);

  const tabTitle = activeTab === "vocabulary" ? "Từ Vựng" : activeTab === "translation" ? "Dịch Nghĩa" : activeTab === "hanzi" ? "Chữ Hán" : "Luyện Tập";
  const activeCount = activeTab === "quiz" ? practiceQuestions.length : vocabItems.length;

  return (
    <SiteLayout user={loaderData.user}>
      <main className="mx-auto max-w-3xl px-3 py-4 md:px-4 md:py-8">
        <div className="mt-4 md:mt-6">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:rounded-3xl sm:p-4 md:p-6">
            <div className="mb-4 flex flex-col gap-3">
              <div>
                <h1 className="flex items-center gap-1.5 text-lg font-bold sm:text-xl">
                  <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-red-500 transition"><ChevronLeft size={26} /></button>
                  {lesson.title}
                </h1>
                <p className="mt-1 pl-8 text-sm text-slate-500">{lesson.description}</p>
              </div>
              
              {/* Tab row */}
              <div className="-mx-1 flex flex-wrap justify-center gap-1">
                {(["vocabulary", "translation", "hanzi", "quiz"] as StudyTab[]).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => switchTab(tab)}
                    disabled={!vocabItems.length && tab !== "quiz"}
                    className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition sm:rounded-2xl sm:px-5 sm:py-2.5 sm:text-sm ${
                      activeTab === tab ? "bg-red-600 text-white" : "bg-slate-100 text-slate-500"
                    } disabled:cursor-not-allowed disabled:opacity-40`}
                  >
                    {tab === "vocabulary" ? "Từ Vựng" : tab === "translation" ? "Dịch Nghĩa" : tab === "hanzi" ? "Chữ Hán" : "Luyện Tập"}
                  </button>
                ))}
              </div>
              {/* Progress bar */}
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${(activeTab === "quiz"
                      ? ((quizPos + 1) / activeCount)
                      : ((vocabPos + 1) / activeCount)) * 100}%`,
                    background: getProgressColor(
                      activeTab === "quiz"
                        ? (quizPos + 1) / activeCount
                        : (vocabPos + 1) / activeCount
                    ),
                  }}
                />
              </div>
            </div>

            {/* VOCABULARY */}
            {activeTab === "vocabulary" && currentVocab ? (
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-red-50 to-amber-50 p-2 shadow-sm sm:rounded-[2rem] sm:p-6">
                <div className="relative mx-auto max-w-3xl overflow-hidden rounded-2xl bg-white p-3 pt-10 text-center shadow-md sm:rounded-[2rem] sm:p-6 sm:pt-14">
                  <button onClick={() => speakChinese(currentVocab.chinese)} className="absolute right-2 top-2 rounded-full bg-red-50 p-2.5 text-red-600 shadow-sm hover:bg-red-100 sm:right-5 sm:top-5 sm:p-3" title="Nghe phát âm" type="button"><Volume2 size={18} className="sm:w-5 sm:h-5" /></button>
                  <p className="break-all font-hanzi text-5xl font-black text-red-600 sm:text-6xl md:text-7xl" suppressHydrationWarning>{currentVocab.chinese}</p>
                  <p className="mt-3 break-words text-base font-bold text-slate-800 sm:mt-4 sm:text-xl" suppressHydrationWarning>{currentVocab.pinyin}</p>
                  {showMeaning ? (
                    <div className="mt-4 rounded-2xl bg-amber-50 p-3 sm:mt-6 sm:rounded-3xl sm:p-5">
                      <p className="text-lg font-extrabold text-slate-900 sm:text-2xl">{currentVocab.meaningVi}</p>
                      {currentVocab.exampleChinese ? (
                        <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 sm:mt-4 sm:gap-2">
                          <p className="break-words text-sm font-semibold sm:text-lg">{currentVocab.exampleChinese}</p>
                          <button onClick={() => speakChinese(currentVocab.exampleChinese || "")} className="rounded-full bg-white p-1.5 text-red-600 hover:bg-red-100 sm:p-2" type="button"><Volume2 size={14} className="sm:w-4 sm:h-4" /></button>
                        </div>
                      ) : null}
                      {currentVocab.examplePinyin ? <p className="mt-1 text-xs font-semibold text-red-600 sm:text-sm">{currentVocab.examplePinyin}</p> : null}
                      {currentVocab.exampleMeaning ? <p className="mt-1 text-xs text-slate-600 sm:text-sm">{currentVocab.exampleMeaning}</p> : null}
                    </div>
                  ) : (
                    <div className="mt-4 rounded-2xl border border-dashed border-slate-200 p-4 text-xs text-slate-400 sm:mt-6 sm:rounded-3xl sm:p-5 sm:text-sm">Ẩn nghĩa để bạn tự nhớ trước</div>
                  )}
                  <div className="mt-4 flex items-center justify-center gap-2 sm:mt-6 sm:gap-2.5">
                    <NavBtn onClick={prevVocab} label="Trước" />
                    <button onClick={() => setShowMeaning((p) => !p)} type="button" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-700 sm:h-12 sm:w-12">
                      {showMeaning ? <EyeOff size={18} className="sm:w-5 sm:h-5" /> : <Eye size={18} className="sm:w-5 sm:h-5" />}
                    </button>
                    <NavBtn onClick={nextVocab} label="Tiếp" next />
                  </div>
                </div>
              </div>
            ) : activeTab === "vocabulary" ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-400">Bài này chưa có từ vựng.</div>
            ) : null}

            {/* TRANSLATION */}
            {activeTab === "translation" && currentVocab && (
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-red-50 to-amber-50 p-2 shadow-sm sm:rounded-[2rem] sm:p-6">
                <div className="relative mx-auto max-w-3xl overflow-hidden rounded-2xl bg-white p-3 pt-10 text-center shadow-md sm:rounded-[2rem] sm:p-6 sm:pt-14">
                  <button onClick={() => speakChinese(currentVocab.chinese)} className="absolute right-2 top-2 rounded-full bg-red-50 p-2.5 text-red-600 shadow-sm hover:bg-red-100 sm:right-5 sm:top-5 sm:p-3" type="button"><Volume2 size={18} /></button>
                  <p className="break-all font-hanzi text-5xl font-black text-red-600 sm:text-6xl md:text-7xl" suppressHydrationWarning>{currentVocab.chinese}</p>
                  {checkedTranslation ? (
                    <p className="mt-3 break-words text-base font-bold text-slate-800 sm:mt-4 sm:text-xl" suppressHydrationWarning>{currentVocab.pinyin}</p>
                  ) : null}
                  <div className="mt-5">
                    <input ref={translationInputRef} value={translationAnswer} onChange={(e) => setTranslationAnswer(e.target.value)} placeholder="Nhập nghĩa tiếng Việt..."
                      className={`w-full input-normal rounded-2xl border px-4 py-3 text-xl font-bold outline-none transition ${checkedTranslation ? (translationCorrect ? "border-emerald-400 bg-emerald-50" : "border-red-400 bg-red-50") : "border-slate-200 focus:border-red-400"}`}
                      onKeyDown={(e) => { if (e.key === "Enter") { setCheckedTranslation(true); (e.target as HTMLInputElement).blur(); } }} />
                  </div>
                  <div className="mt-4 flex items-center justify-center gap-2.5">
                    <NavBtn onClick={prevVocab} label="Trước" />
                    {!checkedTranslation ? (
                      <button onClick={() => setCheckedTranslation(true)} disabled={!translationAnswer.trim()} className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 sm:h-12 sm:w-12" type="button"><Check size={20} /></button>
                    ) : (
                      <button onClick={nextVocab} className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-700 sm:h-12 sm:w-12" type="button"><ChevronRight size={20} /></button>
                    )}
                    <NavBtn onClick={nextVocab} label="Tiếp" next />
                  </div>
                  {checkedTranslation ? (
                    <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-left">
                      <p className="text-xs font-bold uppercase tracking-wide text-amber-700">Đáp án tham khảo</p>
                      <p className="mt-1 text-xl font-extrabold text-slate-900">{currentVocab.meaningVi}</p>
                    </div>
                  ) : null}
                </div>
              </div>
            )}

            {/* HANZI */}
            {activeTab === "hanzi" && currentVocab && (
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-red-50 to-amber-50 p-2 shadow-sm sm:rounded-[2rem] sm:p-6">
                <div className="relative mx-auto max-w-3xl overflow-hidden rounded-2xl bg-white p-3 pt-10 text-center shadow-md sm:rounded-[2rem] sm:p-6 sm:pt-14">
                  <button onClick={() => speakChinese(currentVocab.chinese)} className="absolute right-2 top-2 rounded-full bg-red-50 p-2.5 text-red-600 shadow-sm hover:bg-red-100 sm:right-5 sm:top-5 sm:p-3" type="button"><Volume2 size={18} /></button>
                  {checkedHanzi ? (
                    <p className="break-all text-4xl font-black text-red-600 sm:text-5xl" suppressHydrationWarning>{currentVocab.pinyin}</p>
                  ) : (
                    <p className="text-4xl font-black text-slate-300 sm:text-5xl">?</p>
                  )}
                  <p className="mt-2 text-base text-slate-500 sm:text-lg" suppressHydrationWarning>{currentVocab.meaningVi}</p>
                  <div className="mt-5">
                    <input ref={hanziInputRef} value={hanziAnswer} onChange={(e) => setHanziAnswer(e.target.value)} placeholder="Nhập chữ Hán..."
                      className={`w-full input-hanzi rounded-2xl border px-4 py-3 text-2xl font-bold outline-none transition ${hanziHasCJK ? "font-hanzi" : ""} ${checkedHanzi ? (hanziCorrect ? "border-emerald-400 bg-emerald-50" : "border-red-400 bg-red-50") : "border-slate-200 focus:border-red-400"}`}
                      onKeyDown={(e) => { if (e.key === "Enter") { setCheckedHanzi(true); (e.target as HTMLInputElement).blur(); } }} />
                  </div>
                  {checkedHanzi ? (
                    <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-left">
                      <p className="text-xs font-bold uppercase tracking-wide text-amber-700">Đáp án</p>
                      <p className="mt-1 font-hanzi text-2xl font-black text-red-600">{currentVocab.chinese}</p>
                    </div>
                  ) : null}
                  <div className="mt-4 flex items-center justify-center gap-2.5">
                    <NavBtn onClick={prevVocab} label="Trước" />
                    {!checkedHanzi ? (
                      <button onClick={() => setCheckedHanzi(true)} disabled={!hanziAnswer.trim()} className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 sm:h-12 sm:w-12" type="button"><Check size={20} /></button>
                    ) : (
                      <button onClick={nextVocab} className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-700 sm:h-12 sm:w-12" type="button"><ChevronRight size={20} /></button>
                    )}
                    <NavBtn onClick={nextVocab} label="Tiếp" next />
                  </div>
                </div>
              </div>
            )}

            {/* QUIZ */}
            {activeTab === "quiz" && currentQuiz && (
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-red-50 to-amber-50 p-2 shadow-sm sm:rounded-[2rem] sm:p-6">
                <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl bg-white p-3 shadow-md sm:rounded-[2rem] sm:p-6">
                  {/* Quiz mode pills */}
                  <div className="-mx-1 mb-4 flex justify-center overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
                    {([ "pinyin", "meaning", "recognition", "listening"] as const).map((m) => (
                      <button key={m} onClick={() => { setQuizMode(m); setQuizPos(0); setQuizResponse(""); }}
                        className={`mx-1 shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition sm:rounded-xl sm:px-4 sm:py-2 sm:text-sm ${quizMode === m ? "bg-red-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                        {m === "pinyin" ? "Pinyin" : m === "meaning" ? "Nghĩa" : m === "recognition" ? "Chữ Hán" : "Nghe"}
                      </button>
                    ))}
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-900 sm:text-2xl">{renderQuizQuestion(currentQuiz.question)}</h3>
                  {quizMode === "listening" ? (
                    <button onClick={() => speakChinese(currentQuiz.answer as string)} className="mt-3 flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600 sm:rounded-2xl sm:px-4 sm:py-2.5 sm:text-sm" type="button">
                      <Volume2 size={16} />
                    </button>
                  ) : null}
                  <div className="mt-4 grid gap-2">
                    {(currentQuiz.options as string[]).map((option: string) => {
                      const isSelected = quizResponse === option;
                      const isCorrectOpt = option === currentQuiz.answer;
                      return (
                        <button key={option} type="button" onClick={() => setQuizResponse(option)}
                          className={`rounded-2xl border px-4 py-3 text-left text-base font-bold transition ${
                            quizMode === "recognition" || quizMode === "listening" ? "font-hanzi" : ""
                          } ${
                            hasQuizAnswer ? isCorrectOpt ? "border-emerald-300 bg-emerald-50 text-emerald-700" : isSelected ? "border-red-300 bg-red-50 text-red-700" : "border-slate-200 bg-white text-slate-500"
                            : isSelected ? "border-red-300 bg-red-50 text-red-700" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          }`}>
                          {option}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:justify-center sm:gap-3">
                    <NavBtn onClick={prevQuiz} label="Trước" />
                    <NavBtn onClick={nextQuiz} label="Tiếp" next />
                  </div>
                </div>
              </div>
            )}

            {activeTab !== "quiz" && !currentVocab ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-400">Bài này chưa có từ vựng.</div>
            ) : null}
            {activeTab === "quiz" && !currentQuiz ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-400">Bài này chưa có quiz.</div>
            ) : null}
          </section>

          {/* Completion Modal */}
          {showCompleteModal ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                  <svg className="h-8 w-8 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-extrabold text-slate-900">Đã hoàn thành!</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Bạn đã học xong {activeTab === "quiz" ? "bài luyện tập" : "tất cả từ vựng"}.
                </p>
                <div className="mt-5 flex gap-3">
                  <button
                    onClick={() => {
                      setShowCompleteModal(false);
                      if (activeTab === "quiz") {
                        setQuizSk((k) => k + 1);
                        setQuizPos(0);
                        setQuizResponse("");
                      } else {
                        setVocabSk((k) => k + 1);
                        setVocabPos(0);
                        setShowMeaning(false);
                        setTranslationAnswer(""); setCheckedTranslation(false);
                        setHanziAnswer(""); setCheckedHanzi(false);
                      }
                    }}
                    className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                  >
                    {activeTab === "quiz" ? "Làm lại" : "Học lại"}
                  </button>
                  <button
                    onClick={() => {
                      setShowCompleteModal(false);
                      if (activeTab === "quiz") {
                        const modes: QuizMode[] = ["pinyin", "meaning", "recognition", "listening"];
                        const idx = modes.indexOf(quizMode);
                        if (idx < modes.length - 1) {
                          setQuizMode(modes[idx + 1]);
                          setQuizPos(0);
                          setQuizResponse("");
                        }
                      } else {
                        const tabs: StudyTab[] = ["vocabulary", "translation", "hanzi", "quiz"];
                        const idx = tabs.indexOf(activeTab);
                        if (idx < tabs.length - 1) setActiveTab(tabs[idx + 1]);
                      }
                    }}
                    className="flex-1 rounded-2xl bg-red-600 px-4 py-3 text-sm font-bold text-white hover:bg-red-700"
                  >
                    Tiếp
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </main>
    </SiteLayout>
  );
}

function NavBtn({ onClick, label, next }: { onClick: () => void; label: string; next?: boolean }) {
  return (
    <button onClick={onClick} type="button"
      className={`flex min-h-10 items-center justify-center gap-1 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 sm:min-h-12 sm:gap-2 sm:px-5 sm:py-3 sm:text-sm ${next ? "flex-row-reverse" : ""}`}>
      {next ? <ChevronRight size={16} className="sm:w-[18px] sm:h-[18px]" /> : <ChevronLeft size={16} className="sm:w-[18px] sm:h-[18px]" />}{label}
    </button>
  );
}
