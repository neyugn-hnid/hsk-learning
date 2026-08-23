import type { Route } from "./+types/lessons.$lessonId";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { data, Link, useNavigate } from "react-router";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Check,
  Volume2,
  BookOpen,
  Languages,
  PenLine,
  Zap,
  RotateCcw,
  ArrowRight,
  Trophy,
  Headphones,
} from "lucide-react";
import { SiteLayout } from "~/components/Layout";
import HanziSvg from "~/components/HanziSvg";
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
  return { user, lesson: { ...lesson, vocabularies: vocabulariesWithImages } };
}

type StudyTab = "vocabulary" | "translation" | "hanzi" | "quiz";
type QuizMode = "meaning" | "pinyin" | "recognition" | "listening";

function shuffleItems<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function speakChinese(text: string) {
  if (typeof window === "undefined") return;
  fetch("/api/ai/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, lang: "zh-CN" }),
  })
    .then((r) => (r.ok ? r.json() : Promise.reject()))
    .then(({ audio }) => {
      if (audio) new Audio(`data:audio/mp3;base64,${audio}`).play().catch(() => { });
    })
    .catch(() => { });
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
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(); osc.stop(ctx.currentTime + 0.3);
    } else {
      osc.type = "square";
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.start(); osc.stop(ctx.currentTime + 0.25);
    }
  } catch { /* ignore */ }
}

function renderQuizQuestion(q: string) {
  return q.split(/(\"[^\"]+\")/g).map((part, i) => {
    if (part.startsWith('"') && part.endsWith('"')) {
      const inner = part.slice(1, -1);
      const hasCJK = /[\u4e00-\u9fff]/.test(inner);
      return <span key={i} className={hasCJK ? "font-hanzi font-black text-amber-400" : "font-bold text-white"}>{part}</span>;
    }
    return <span key={i}>{part}</span>;
  });
}

/* ─── Animated card wrapper ─── */
function AnimCard({ children, animKey }: { children: React.ReactNode; animKey: string | number }) {
  return (
    <div key={animKey} style={{ animation: "cardIn 0.28s cubic-bezier(0.16,1,0.3,1) both" }}>
      {children}
    </div>
  );
}

/* ─── Speaking button with wave rings ─── */
function SpeakBtn({ text, size = "md" }: { text: string; size?: "sm" | "md" }) {
  const [active, setActive] = useState(false);
  const dim = size === "sm" ? "h-8 w-8" : "h-11 w-11";
  const iconSize = size === "sm" ? 14 : 18;
  return (
    <button
      type="button"
      onClick={() => { setActive(true); speakChinese(text); setTimeout(() => setActive(false), 1200); }}
      className={`relative flex shrink-0 items-center justify-center rounded-full bg-amber-500 text-white shadow-md shadow-amber-900/30 transition hover:bg-amber-400 active:scale-95 ${dim}`}
      title="Nghe phát âm"
    >
      {active && (
        <>
          <span className="absolute inset-0 rounded-full bg-amber-400 opacity-40" style={{ animation: "wave 0.9s ease-out infinite" }} />
          <span className="absolute inset-0 rounded-full bg-amber-400 opacity-20" style={{ animation: "wave 0.9s 0.3s ease-out infinite" }} />
        </>
      )}
      <Volume2 size={iconSize} />
    </button>
  );
}

/* ─── Pinyin toggle ─── */
function PinyinToggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors duration-200 ${on ? "bg-amber-500" : "bg-white/15"}`}
    >
      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${on ? "translate-x-7" : "translate-x-1"}`} />
    </button>
  );
}

/* ─── Nav button ─── */
function NavBtn({ onClick, label, next }: { onClick: () => void; label: string; next?: boolean }) {
  return (
    <button
      onClick={onClick}
      type="button"
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-amber-700/30 bg-white/5 py-3 text-sm font-semibold text-amber-200/70 backdrop-blur transition hover:border-amber-600/40 hover:bg-white/10 active:scale-98 ${next ? "flex-row-reverse" : ""}`}
    >
      {next ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      {label}
    </button>
  );
}

/* ─── Empty state ─── */
function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl border-2 border-dashed border-amber-700/30 py-20 text-center">
      <BookOpen size={28} className="text-amber-400/30" />
      <p className="text-sm text-amber-200/40">{text}</p>
    </div>
  );
}

/* ─── Confetti ─── */
function Confetti() {
  const cols = ["#f43f5e", "#fb923c", "#facc15", "#4ade80", "#60a5fa", "#c084fc", "#f472b6"];
  const items = useMemo(() =>
    Array.from({ length: 40 }, (_, i) => ({
      id: i, color: cols[i % cols.length],
      left: 10 + Math.random() * 80,
      delay: Math.random() * 0.7,
      size: 5 + Math.random() * 7,
      circle: Math.random() > 0.45,
      dur: 1.1 + Math.random() * 0.9,
    })), []);
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 h-full overflow-hidden">
      {items.map((p) => (
        <span key={p.id} style={{
          position: "absolute", left: `${p.left}%`, top: "5%",
          width: p.size, height: p.size, background: p.color,
          borderRadius: p.circle ? "50%" : "2px",
          animation: `confettiFall ${p.dur}s ease-in ${p.delay}s both`,
        }} />
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════
   Main Component
══════════════════════════════════════════ */
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
  const [showPinyin, setShowPinyin] = useState(false);
  const [cardKey, setCardKey] = useState(0);

  const translationInputRef = useRef<HTMLInputElement>(null);
  const hanziInputRef = useRef<HTMLInputElement>(null);

  const vocabItems = lesson.vocabularies;

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
        }).filter(Boolean);
      const answer =
        quizMode === "pinyin" ? vocab.pinyin
          : quizMode === "recognition" || quizMode === "listening" ? vocab.chinese
            : vocab.meaningVi;
      const uniqueD = [...new Set(distractors.filter((x) => x !== answer))];
      return {
        type: quizMode === "pinyin" ? "PINYIN" : quizMode === "recognition" || quizMode === "listening" ? "CHAR_RECOGNITION" : "MEANING",
        question:
          quizMode === "pinyin" ? `"${vocab.chinese}" đọc pinyin là gì?`
            : quizMode === "listening" ? "Nghe và chọn chữ Hán đúng"
              : quizMode === "recognition" ? `Chữ Hán nào có pinyin "${vocab.pinyin}"?`
                : `"${vocab.chinese}" nghĩa là gì?`,
        options: shuffleItems([answer, ...shuffleItems(uniqueD).slice(0, 3)]),
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
  const correctMeanings = (currentVocab?.meaningVi || "").split(/[;,/]| - |\/| hoặc /).map((s) => s.trim().toLowerCase()).filter(Boolean);
  const translationCorrect = checkedTranslation && normalizedUserMeaning.length > 0 && correctMeanings.some((m) => {
    if (normalizedUserMeaning === m) return true;
    if (normalizedUserMeaning.length >= Math.max(3, m.length / 2)) return m.includes(normalizedUserMeaning) || normalizedUserMeaning.includes(m);
    return false;
  });

  const normalizedUserHanzi = hanziAnswer.trim();
  const hanziCorrect = checkedHanzi && normalizedUserHanzi.length > 0 && normalizedUserHanzi === (currentVocab?.chinese || "").trim();

  const hasQuizAnswer = quizResponse.trim().length > 0;
  const quizCorrect = hasQuizAnswer && quizResponse.trim() === (currentQuiz?.answer || "").trim();

  const hanziHasCJK = /[\u4e00-\u9fff]/.test(hanziAnswer);

  useEffect(() => { if (checkedTranslation) playSound(translationCorrect); }, [checkedTranslation, translationCorrect]);
  useEffect(() => { if (checkedHanzi) playSound(hanziCorrect); }, [checkedHanzi, hanziCorrect]);
  useEffect(() => { if (hasQuizAnswer) playSound(quizCorrect); }, [hasQuizAnswer, quizCorrect]);

  useEffect(() => {
    setVocabPos(0); setVocabSk((k) => k + 1); setShowMeaning(false);
    setTranslationAnswer(""); setCheckedTranslation(false);
    setHanziAnswer(""); setCheckedHanzi(false); setShowPinyin(false);
    setQuizPos(0); setQuizSk((k) => k + 1); setQuizResponse(""); setQuizMode("pinyin");
    setCardKey((k) => k + 1);
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "quiz" && quizMode === "listening" && currentQuiz?.answer) {
      speakChinese(currentQuiz.answer as string);
    }
  }, [quizIdx, quizMode, activeTab, currentQuiz?.answer]);

  useEffect(() => {
    if (activeTab === "translation") translationInputRef.current?.focus();
    else if (activeTab === "hanzi") hanziInputRef.current?.focus();
  }, [vocabIdx, activeTab]);

  const bump = () => setCardKey((k) => k + 1);

  const nextVocab = useCallback(() => {
    if (!vocabItems.length) return;
    if (vocabPos + 1 >= vocabOrder.length) { setShowCompleteModal(true); return; }
    bump();
    setTimeout(() => { setVocabPos(vocabPos + 1); setShowMeaning(false); setTranslationAnswer(""); setCheckedTranslation(false); setHanziAnswer(""); setCheckedHanzi(false); }, 0);
  }, [vocabItems.length, vocabPos, vocabOrder.length]);

  const prevVocab = useCallback(() => {
    if (!vocabItems.length) return;
    bump();
    setTimeout(() => { setVocabPos((vocabPos - 1 + vocabOrder.length) % vocabOrder.length); setShowMeaning(false); setTranslationAnswer(""); setCheckedTranslation(false); setHanziAnswer(""); setCheckedHanzi(false); }, 0);
  }, [vocabItems.length, vocabPos, vocabOrder.length]);

  const nextQuiz = useCallback(() => {
    if (!practiceQuestions.length) return;
    if (quizPos + 1 >= quizOrder.length) { setShowCompleteModal(true); return; }
    bump();
    setTimeout(() => { setQuizPos(quizPos + 1); setQuizResponse(""); }, 0);
  }, [practiceQuestions.length, quizPos, quizOrder.length]);

  const prevQuiz = useCallback(() => {
    if (!practiceQuestions.length) return;
    bump();
    setTimeout(() => { setQuizResponse(""); setQuizPos((quizPos - 1 + quizOrder.length) % quizOrder.length); }, 0);
  }, [practiceQuestions.length, quizPos, quizOrder.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowLeft") { e.preventDefault(); activeTab === "quiz" ? prevQuiz() : prevVocab(); }
      else if (e.key === "ArrowRight") { e.preventDefault(); activeTab === "quiz" ? nextQuiz() : nextVocab(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeTab, prevVocab, nextVocab, prevQuiz, nextQuiz]);

  const switchTab = (tab: StudyTab) => {
    if (!vocabItems.length && tab !== "quiz") return;
    if (tab === "quiz" && !vocabItems.length && !quizItems.length) return;
    setActiveTab(tab);
  };

  const activeCount = activeTab === "quiz" ? practiceQuestions.length : vocabItems.length;
  const activePos = activeTab === "quiz" ? quizPos : vocabPos;
  const progress = activeCount > 0 ? (activePos + 1) / activeCount : 0;

  const TABS: { id: StudyTab; label: string; icon: React.ReactNode }[] = [
    { id: "vocabulary", label: "Từ Vựng", icon: <BookOpen size={15} /> },
    { id: "translation", label: "Dịch Nghĩa", icon: <Languages size={15} /> },
    { id: "hanzi", label: "Chữ Hán", icon: <PenLine size={15} /> },
    { id: "quiz", label: "Luyện Tập", icon: <Zap size={15} /> },
  ];

  const QUIZ_MODES: { id: QuizMode; label: string }[] = [
    { id: "pinyin", label: "Pinyin" },
    { id: "meaning", label: "Nghĩa" },
    { id: "recognition", label: "Chữ Hán" },
    { id: "listening", label: "Nghe" },
  ];

  return (
    <SiteLayout user={loaderData.user} hideFooter>
      <style>{`
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(14px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        @keyframes wave {
          0%   { transform: scale(1);   opacity: 0.5; }
          100% { transform: scale(2.4); opacity: 0;   }
        }
        @keyframes confettiFall {
          0%   { transform: translateY(0)    rotate(0deg);   opacity: 1; }
          100% { transform: translateY(280px) rotate(540deg); opacity: 0; }
        }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.9) translateY(20px); }
          to   { opacity: 1; transform: scale(1)   translateY(0);    }
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
        .fade-slide { animation: fadeSlideIn 0.22s ease both; }
      `}</style>

      <div
        className="min-h-screen"
        style={{ background: "linear-gradient(180deg,#020810 0%,#061220 18%,#0a1a30 40%,#081428 65%,#040e20 85%,#020818 100%)" }}
      >
      <main className="mx-auto max-w-xl px-4 py-5 md:py-8">

        {/* ── Lesson header ── */}
        <div className="mb-5 flex items-start gap-3">
          <button
            onClick={() => navigate(-1)}
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-700/30 bg-white/5 text-amber-300/70 backdrop-blur transition hover:bg-white/10 hover:text-amber-200"
          >
            <ChevronLeft size={19} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="truncate text-xl font-black text-white">{lesson.title}</h1>
            {lesson.description && (
              <p className="mt-0.5 line-clamp-1 text-sm text-amber-200/50">{lesson.description}</p>
            )}
          </div>
          {vocabItems.length >= 4 && (
            <Link
              to={`/game/${lesson.id}`}
              className="mt-0.5 flex shrink-0 items-center gap-1.5 rounded-xl bg-amber-500 px-3 py-2 text-xs font-bold text-white shadow-sm shadow-amber-900/30 transition hover:bg-amber-400 active:scale-95"
            >
              🎮 <span className="hidden sm:inline">Chơi game</span>
            </Link>
          )}
        </div>

        {/* ── Tab bar ── */}
        <div className="mb-4 flex gap-1 rounded-2xl bg-white/5 p-1 backdrop-blur border border-white/10">
          {TABS.map((tab) => {
            const disabled = !vocabItems.length && tab.id !== "quiz";
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => switchTab(tab.id)}
                disabled={disabled}
                className={`flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-[10px] font-bold transition sm:flex-row sm:justify-center sm:gap-1.5 sm:text-xs
                  ${activeTab === tab.id ? "bg-amber-500/90 text-white shadow-sm shadow-amber-900/40" : "text-amber-200/50 hover:text-amber-200/80"}
                  disabled:cursor-not-allowed disabled:opacity-30`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── Progress ── */}
        <div className="mb-5 flex items-center gap-3">
          <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-white/10">
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
              style={{
                width: `${progress * 100}%`,
                backgroundColor: progress >= 1 ? "#22c55e" : progress >= 0.6 ? "#f59e0b" : "#ef4444",
              }}
            />
          </div>
          <span className="w-10 text-right text-xs font-bold tabular-nums text-amber-300/60">
            {activePos + 1}/{activeCount || 1}
          </span>
        </div>

        {/* ══════ VOCABULARY ══════ */}
        {activeTab === "vocabulary" && currentVocab ? (
          <AnimCard animKey={`v-${vocabIdx}-${cardKey}`}>
            <div className="rounded-3xl border border-amber-700/30 bg-white/5 shadow-xl shadow-black/20 backdrop-blur">
              {/* Top */}
              <div className="flex items-center justify-between px-6 pt-5">
                <span className="rounded-lg bg-amber-500/15 px-2.5 py-1 text-xs font-bold text-amber-400">
                  {activePos + 1} / {activeCount}
                </span>
                <SpeakBtn text={currentVocab.chinese} />
              </div>

              {/* Character */}
              <div className="flex flex-col items-center px-6 py-6 text-center">
                <HanziSvg chinese={currentVocab.chinese} size={110} className="mb-3 opacity-90" />
                <p className="mt-4 text-xl font-bold tracking-wide text-amber-200/80" suppressHydrationWarning>
                  {currentVocab.pinyin}
                </p>
              </div>

              {/* Meaning area */}
              <div className="px-5 pb-2">
                {showMeaning ? (
                  <div className="fade-slide rounded-2xl bg-amber-500/10 border border-amber-700/20 p-5">
                    <p className="text-2xl font-extrabold text-white">{currentVocab.meaningVi}</p>
                    {currentVocab.exampleChinese && (
                      <div className="mt-3 border-t border-amber-700/20 pt-3">
                        <div className="flex items-start gap-2">
                          <p className="flex-1 text-sm font-semibold text-amber-100/80">{currentVocab.exampleChinese}</p>
                          <SpeakBtn text={currentVocab.exampleChinese} size="sm" />
                        </div>
                        {currentVocab.examplePinyin && (
                          <p className="mt-1.5 text-xs font-semibold text-amber-400">{currentVocab.examplePinyin}</p>
                        )}
                        {currentVocab.exampleMeaning && (
                          <p className="mt-1 text-xs text-amber-200/50">{currentVocab.exampleMeaning}</p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowMeaning(true)}
                    className="w-full rounded-2xl border-2 border-dashed border-amber-700/30 py-5 text-sm font-semibold text-amber-300/50 transition hover:border-amber-600/40 hover:bg-amber-500/10 hover:text-amber-300"
                  >
                    Nhấn để xem nghĩa
                  </button>
                )}
              </div>

              {/* Footer nav */}
              <div className="flex items-center gap-2 border-t border-amber-700/20 px-5 py-4">
                <NavBtn onClick={prevVocab} label="Trước" />
                <button
                  onClick={() => setShowMeaning((p) => !p)}
                  type="button"
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition active:scale-95 ${showMeaning ? "bg-white/10 text-amber-200/60" : "bg-amber-500 text-white shadow-md shadow-amber-900/30"
                    }`}
                >
                  {showMeaning ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
                <NavBtn onClick={nextVocab} label="Tiếp" next />
              </div>
            </div>
          </AnimCard>
        ) : activeTab === "vocabulary" ? <EmptyState text="Bài này chưa có từ vựng." /> : null}

        {/* ══════ TRANSLATION ══════ */}
        {activeTab === "translation" && currentVocab && (
          <AnimCard animKey={`t-${vocabIdx}-${cardKey}`}>
            <div className="rounded-3xl border border-amber-700/30 bg-white/5 shadow-xl shadow-black/20 backdrop-blur">
              {/* Top bar */}
              <div className="flex items-center justify-between px-6 pt-5">
                <div className="flex items-center gap-2.5">
                  <PinyinToggle on={showPinyin} onToggle={() => setShowPinyin((p) => !p)} />
                  <span className="text-xs font-semibold text-amber-200/50">Pinyin</span>
                </div>
                <SpeakBtn text={currentVocab.chinese} />
              </div>

              {/* Character */}
              <div className="flex flex-col items-center px-6 py-6 text-center">
                <p className="font-hanzi text-7xl font-black leading-none text-white md:text-8xl" suppressHydrationWarning>
                  {currentVocab.chinese}
                </p>
                <div className={`mt-4 overflow-hidden transition-all duration-300 ${(showPinyin || checkedTranslation) ? "max-h-12 opacity-100" : "max-h-0 opacity-0"}`}>
                  <p className="text-xl font-bold text-amber-400" suppressHydrationWarning>
                    {currentVocab.pinyin}
                  </p>
                </div>
              </div>

              {/* Input */}
              <div className="px-5">
                <input
                  ref={translationInputRef}
                  value={translationAnswer}
                  onChange={(e) => setTranslationAnswer(e.target.value)}
                  placeholder="Nhập nghĩa tiếng Việt..."
                  className={`input-normal w-full rounded-2xl border-2 px-4 py-3.5 text-lg font-bold outline-none transition placeholder:text-white/20 ${checkedTranslation
                      ? translationCorrect
                        ? "border-emerald-400 bg-emerald-500/15 text-emerald-300"
                        : "border-red-400 bg-red-500/15 text-red-300"
                      : "border-amber-700/30 bg-white/5 text-white focus:border-amber-500"
                    }`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { setCheckedTranslation(true); (e.target as HTMLInputElement).blur(); }
                  }}
                />

                {checkedTranslation && (
                  <div className={`fade-slide mt-3 flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-bold ${translationCorrect ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"
                    }`}>
                    {translationCorrect ? "✓  Chính xác!" : `✗  Đáp án: ${currentVocab.meaningVi}`}
                  </div>
                )}
              </div>

              {/* Footer nav */}
              <div className="flex items-center gap-2 border-t border-amber-700/20 px-5 py-4 mt-4">
                <NavBtn onClick={prevVocab} label="Trước" />
                {!checkedTranslation ? (
                  <button
                    onClick={() => setCheckedTranslation(true)}
                    disabled={!translationAnswer.trim()}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white shadow-md shadow-amber-900/30 transition hover:bg-amber-400 disabled:opacity-40 active:scale-95"
                    type="button"
                  >
                    <Check size={20} />
                  </button>
                ) : (
                  <button
                    onClick={nextVocab}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white shadow-md shadow-amber-900/30 transition hover:bg-amber-400 active:scale-95"
                    type="button"
                  >
                    <ChevronRight size={20} />
                  </button>
                )}
                <NavBtn onClick={nextVocab} label="Tiếp" next />
              </div>
            </div>
          </AnimCard>
        )}

        {/* ══════ HANZI ══════ */}
        {activeTab === "hanzi" && currentVocab && (
          <AnimCard animKey={`h-${vocabIdx}-${cardKey}`}>
            <div className="rounded-3xl border border-amber-700/30 bg-white/5 shadow-xl shadow-black/20 backdrop-blur">
              {/* Top bar */}
              <div className="flex items-center justify-between px-6 pt-5">
                <div className="flex items-center gap-2.5">
                  <PinyinToggle on={showPinyin} onToggle={() => setShowPinyin((p) => !p)} />
                  <span className="text-xs font-semibold text-amber-200/50">Pinyin</span>
                </div>
                <SpeakBtn text={currentVocab.chinese} />
              </div>

              {/* Prompt */}
              <div className="flex flex-col items-center px-6 py-6 text-center">
                <div className={`overflow-hidden transition-all duration-300 ${(showPinyin || checkedHanzi) ? "max-h-16 opacity-100" : "max-h-0 opacity-0"}`}>
                  <p className="font-hanzi text-5xl font-black text-amber-400" suppressHydrationWarning>
                    {currentVocab.pinyin}
                  </p>
                </div>
                {!showPinyin && !checkedHanzi && (
                  <p className="text-5xl font-black text-white/15">?</p>
                )}
                <p className="mt-3 text-xl font-bold text-amber-100/80" suppressHydrationWarning>
                  {currentVocab.meaningVi}
                </p>
              </div>

              {/* Input */}
              <div className="px-5">
                <input
                  ref={hanziInputRef}
                  value={hanziAnswer}
                  onChange={(e) => setHanziAnswer(e.target.value)}
                  placeholder="Nhập chữ Hán..."
                  className={`w-full input-hanzi rounded-2xl border-2 px-4 py-3.5 text-center text-2xl font-bold outline-none transition ${hanziHasCJK ? "font-hanzi" : ""} placeholder:text-white/20 placeholder:font-sans placeholder:text-base ${checkedHanzi
                      ? hanziCorrect
                        ? "border-emerald-400 bg-emerald-500/15 text-emerald-300"
                        : "border-red-400 bg-red-500/15 text-red-300"
                      : "border-amber-700/30 bg-white/5 text-white focus:border-amber-500"
                    }`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { setCheckedHanzi(true); (e.target as HTMLInputElement).blur(); }
                  }}
                />

                {checkedHanzi && (
                  <div className={`fade-slide mt-3 flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold ${hanziCorrect ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"
                    }`}>
                    {hanziCorrect ? "✓  Chính xác!" : (
                      <>
                        <span>✗  Đáp án:</span>
                        <span className="font-hanzi text-xl font-black">{currentVocab.chinese}</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Footer nav */}
              <div className="flex items-center gap-2 border-t border-amber-700/20 px-5 py-4 mt-4">
                <NavBtn onClick={prevVocab} label="Trước" />
                {!checkedHanzi ? (
                  <button
                    onClick={() => setCheckedHanzi(true)}
                    disabled={!hanziAnswer.trim()}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white shadow-md shadow-amber-900/30 transition hover:bg-amber-400 disabled:opacity-40 active:scale-95"
                    type="button"
                  >
                    <Check size={20} />
                  </button>
                ) : (
                  <button
                    onClick={nextVocab}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white shadow-md shadow-amber-900/30 transition hover:bg-amber-400 active:scale-95"
                    type="button"
                  >
                    <ChevronRight size={20} />
                  </button>
                )}
                <NavBtn onClick={nextVocab} label="Tiếp" next />
              </div>
            </div>
          </AnimCard>
        )}

        {/* ══════ QUIZ ══════ */}
        {activeTab === "quiz" && currentQuiz && (
          <AnimCard animKey={`q-${quizIdx}-${quizMode}-${cardKey}`}>
            <div className="rounded-3xl border border-amber-700/30 bg-white/5 shadow-xl shadow-black/20 backdrop-blur">
              {/* Mode pills */}
              <div className="flex gap-1.5 overflow-x-auto px-5 pt-5 pb-0">
                {QUIZ_MODES.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => { setQuizMode(m.id); setQuizPos(0); setQuizResponse(""); bump(); }}
                    className={`shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${quizMode === m.id
                        ? "bg-amber-500 text-white shadow-sm shadow-amber-900/40"
                        : "bg-white/5 text-amber-200/50 hover:bg-white/10 hover:text-amber-200/80"
                      }`}
                  >
                    {m.id === "listening" && <Headphones size={11} />}
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Question */}
              <div className="px-5 pt-5 pb-3">
                <p className="text-lg font-extrabold leading-snug text-white">
                  {renderQuizQuestion(currentQuiz.question)}
                </p>
                {quizMode === "listening" && (
                  <button
                    onClick={() => speakChinese(currentQuiz.answer as string)}
                    className="mt-3 inline-flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-sm font-semibold text-amber-200/70 transition hover:bg-white/10"
                    type="button"
                  >
                    <Volume2 size={15} className="text-amber-400" />
                    Nghe lại
                  </button>
                )}
              </div>

              {/* Options */}
              <div className="grid gap-2 px-5 pb-4">
                {(currentQuiz.options as string[]).map((option, oi) => {
                  const isSelected = quizResponse === option;
                  const isCorrectOpt = option === currentQuiz.answer;
                  const hasCJK = /[\u4e00-\u9fff]/.test(option);

                  let cls = "border-amber-700/30 bg-white/5 text-amber-100/80 hover:border-amber-600/40 hover:bg-white/10";
                  let badgeStyle: React.CSSProperties = { background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)" };

                  if (!hasQuizAnswer) {
                    if (isSelected) {
                      cls = "border-amber-500 bg-amber-500/15 text-amber-200";
                      badgeStyle = { background: "#f59e0b", color: "white" };
                    }
                  } else {
                    if (isCorrectOpt) {
                      cls = "border-emerald-400 bg-emerald-500/15 text-emerald-300";
                      badgeStyle = { background: "#22c55e", color: "white" };
                    } else if (isSelected) {
                      cls = "border-red-400 bg-red-500/15 text-red-300";
                      badgeStyle = { background: "#ef4444", color: "white" };
                    } else {
                      cls = "border-white/5 bg-white/[0.02] text-white/30";
                    }
                  }

                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => { if (!hasQuizAnswer) setQuizResponse(option); }}
                      className={`flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left text-base font-bold transition ${hasCJK ? "font-hanzi" : ""} ${cls}`}
                      style={{ cursor: hasQuizAnswer ? "default" : "pointer" }}
                    >
                      <span
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-black"
                        style={badgeStyle}
                      >
                        {String.fromCharCode(65 + oi)}
                      </span>
                      {option}
                    </button>
                  );
                })}
              </div>

              {/* Feedback */}
              {hasQuizAnswer && (
                <div className={`fade-slide mx-5 mb-4 flex items-center gap-2.5 rounded-2xl px-4 py-3 text-sm font-bold ${quizCorrect ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"
                  }`}>
                  {quizCorrect
                    ? <><span className="text-xl">🎉</span> Chính xác!</>
                    : <><span className="text-xl">💡</span> Đáp án đúng: <span className={`font-black ${/[\u4e00-\u9fff]/.test(currentQuiz.answer as string) ? "font-hanzi text-lg" : ""}`}>{currentQuiz.answer as string}</span></>
                  }
                </div>
              )}

              {/* Nav */}
              <div className="flex gap-2 border-t border-amber-700/20 px-5 py-4">
                <NavBtn onClick={prevQuiz} label="Trước" />
                <NavBtn onClick={nextQuiz} label="Tiếp" next />
              </div>
            </div>
          </AnimCard>
        )}

        {activeTab !== "quiz" && !currentVocab ? <EmptyState text="Bài này chưa có từ vựng." /> : null}
        {activeTab === "quiz" && !currentQuiz ? <EmptyState text="Bài này chưa có câu hỏi." /> : null}

        {/* Keyboard hint */}
        <p className="mt-4 hidden text-center text-xs text-white/20 sm:block">
          ← → để điều hướng
        </p>
      </main>

      {/* ══════ COMPLETION MODAL ══════ */}
      {showCompleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div
            className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-amber-700/30 bg-[#0a1a30] p-8 text-center shadow-2xl"
            style={{ animation: "modalIn 0.32s cubic-bezier(0.34,1.56,0.64,1) both" }}
          >
            <Confetti />

            <div className="relative z-10">
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-500 shadow-lg shadow-amber-900/40">
                <Trophy size={36} className="text-white" />
              </div>
              <h3 className="text-2xl font-black text-white">Hoàn thành!</h3>
              <p className="mt-1.5 text-sm text-amber-200/60">
                Bạn đã học xong{" "}
                <span className="font-bold text-amber-400">
                  {activeTab === "quiz" ? "bài luyện tập" : "tất cả từ vựng"}
                </span>
                .
              </p>

              <div className="mt-7 grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setShowCompleteModal(false);
                    if (activeTab === "quiz") {
                      setQuizSk((k) => k + 1); setQuizPos(0); setQuizResponse("");
                    } else {
                      setVocabSk((k) => k + 1); setVocabPos(0); setShowMeaning(false);
                      setTranslationAnswer(""); setCheckedTranslation(false);
                      setHanziAnswer(""); setCheckedHanzi(false);
                    }
                    bump();
                  }}
                  className="flex items-center justify-center gap-2 rounded-2xl border-2 border-amber-700/30 py-3 text-sm font-bold text-amber-200/70 transition hover:bg-white/5"
                >
                  <RotateCcw size={15} />
                  {activeTab === "quiz" ? "Làm lại" : "Học lại"}
                </button>
                <button
                  onClick={() => {
                    setShowCompleteModal(false);
                    if (activeTab === "quiz") {
                      const modes: QuizMode[] = ["pinyin", "meaning", "recognition", "listening"];
                      const idx = modes.indexOf(quizMode);
                      if (idx < modes.length - 1) { setQuizMode(modes[idx + 1]); setQuizPos(0); setQuizResponse(""); }
                    } else {
                      const tabs: StudyTab[] = ["vocabulary", "translation", "hanzi", "quiz"];
                      const idx = tabs.indexOf(activeTab);
                      if (idx < tabs.length - 1) setActiveTab(tabs[idx + 1]);
                    }
                    bump();
                  }}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-amber-500 py-3 text-sm font-bold text-white shadow-lg shadow-amber-900/40 transition hover:bg-amber-400"
                >
                  Tiếp theo
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </SiteLayout>
  );
}
