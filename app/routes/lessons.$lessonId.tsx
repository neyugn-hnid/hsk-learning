import type { Route } from "./+types/lessons.$lessonId";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { data, useNavigate, Link } from "react-router";
import {
  X,
  Volume2,
  Volume1,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  Flame,
  Star,
  Crown,
  BookOpen,
  Pencil,
  Zap,
  Compass,
  Check,
  Layers,
  MessageSquare,
  Play,
  Eraser,
  PenTool,
  Trophy,
  Smile,
  ChevronRight,
  Lightbulb,
  ChevronLeft,
  Brain,
  CheckCircle,
} from "lucide-react";
import { getUser } from "~/lib/auth.server";
import { prisma } from "~/lib/db.server";
import { sound } from "~/lib/sound";
import { addExpAndGems, claimLessonExp, isLessonExpClaimed } from "~/lib/gamification";
import { addWordsToSRS } from "~/lib/srs";
import { HanziWriterCanvas } from "~/components/HanziWriterCanvas";
import { LessonPracticeView } from "~/components/LessonPracticeView";
import {
  GemDiamondSVG,
  StreakFlameSVG,
  MascotPandaSVG,
} from "~/components/Icons/CustomSVGs";

export async function loader({ request, params }: Route.LoaderArgs) {
  const [user, lesson] = await Promise.all([
    getUser(request),
    prisma.lesson.findUnique({
      where: { id: params.lessonId },
      include: { vocabularies: true, grammars: true, quizzes: true },
    }),
  ]);

  if (!lesson) throw data("Không tìm thấy bài học", { status: 404 });

  // Find next lesson in the same level or next level
  let nextLesson = await prisma.lesson.findFirst({
    where: {
      status: "PUBLISHED",
      source: lesson.source,
      level: lesson.level,
      orderNo: { gt: lesson.orderNo },
    },
    orderBy: { orderNo: "asc" },
    select: { id: true, title: true, orderNo: true, level: true },
  });

  if (!nextLesson) {
    // If last lesson in this level, find first lesson in next level
    nextLesson = await prisma.lesson.findFirst({
      where: {
        status: "PUBLISHED",
        source: lesson.source,
        level: { gt: lesson.level },
      },
      orderBy: [{ level: "asc" }, { orderNo: "asc" }],
      select: { id: true, title: true, orderNo: true, level: true },
    });
  }

  return {
    user,
    lesson,
    nextLesson,
  };
}

export async function action({ request, params }: Route.ActionArgs) {
  const user = await getUser(request);
  try {
    const body = await request.json();
    const targetLessonId = body.lessonId || params.lessonId;
    if (user && targetLessonId) {
      await prisma.userProgress.upsert({
        where: {
          userId_lessonId: {
            userId: user.id,
            lessonId: targetLessonId,
          },
        },
        create: {
          userId: user.id,
          lessonId: targetLessonId,
          progress: 100,
          completed: true,
        },
        update: {
          progress: 100,
          completed: true,
        },
      });
    }
    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ success: false });
  }
}

function shuffleItems<T>(items: T[]): T[] {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function speakChinese(text: string, rate: number = 1.0) {
  if (typeof window === "undefined") return;
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "zh-CN";
    u.rate = rate;
    window.speechSynthesis.speak(u);
  }
}

type CollocationItem = {
  zh: string;
  pinyin?: string;
  vi: string;
};

// Smart Chinese sentence tokenizer for sentence builder puzzle
function tokenizeChineseSentence(sentence: string, targetVocab: string): string[] {
  const cleanStr = sentence.replace(/[，。？！、\s\.\!\?,;:]/g, "");
  if (!cleanStr) return [targetVocab || "你好"];

  const result: string[] = [];
  let i = 0;
  while (i < cleanStr.length) {
    if (targetVocab && cleanStr.startsWith(targetVocab, i)) {
      result.push(targetVocab);
      i += targetVocab.length;
      continue;
    }
    // Take 2 characters if available and not leaving single orphan, or 1 character
    if (i + 2 <= cleanStr.length && (cleanStr.length - i) % 2 === 0) {
      result.push(cleanStr.slice(i, i + 2));
      i += 2;
    } else {
      result.push(cleanStr[i]);
      i += 1;
    }
  }
  return result.length > 1 ? result : cleanStr.split("");
}

type SentenceToken = {
  id: string;
  text: string;
};

export default function ModernLessonStudio({ loaderData }: Route.ComponentProps) {
  const { lesson, user, nextLesson } = loaderData;
  const navigate = useNavigate();

  const [vocabIndex, setVocabIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [viewMode, setViewMode] = useState<"card" | "stroke">("card");
  const [completedWords, setCompletedWords] = useState<number[]>([]);

  // Sentence builder state
  const [selectedTokenIds, setSelectedTokenIds] = useState<string[]>([]);
  const [sentenceChecked, setSentenceChecked] = useState(false);
  const [sentenceCorrect, setSentenceCorrect] = useState(false);

  // Live gamification session
  const [expGained, setExpGained] = useState(0);
  const [gemsGained, setGemsGained] = useState(0);
  const [comboStreak, setComboStreak] = useState(0);
  const [showVictory, setShowVictory] = useState(false);
  const [isPracticeMode, setIsPracticeMode] = useState(false);

  const [activeCharIndex, setActiveCharIndex] = useState(0);
  const [aiDataMap, setAiDataMap] = useState<
    Record<
      string,
      {
        collocations: CollocationItem[];
        sentenceChallenge?: {
          chinese: string;
          pinyin?: string;
          meaningVi: string;
          tokens: string[];
          distractors: string[];
        };
      }
    >
  >({});
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const vocabularies = lesson.vocabularies;
  const currentVocab = vocabularies[vocabIndex] || vocabularies[0];

  // Auto record lesson completion and unlock next lesson
  const handleCompleteLesson = useCallback(() => {
    // 1. Record completed in localStorage
    try {
      const savedCompleted = localStorage.getItem("completed_lessons");
      const completedList: string[] = savedCompleted ? JSON.parse(savedCompleted) : [];
      if (!completedList.includes(lesson.id)) {
        completedList.push(lesson.id);
        localStorage.setItem("completed_lessons", JSON.stringify(completedList));
      }

      if (nextLesson?.id) {
        const savedUnlocked = localStorage.getItem("unlocked_lessons");
        const unlockedList: string[] = savedUnlocked ? JSON.parse(savedUnlocked) : [];
        if (!unlockedList.includes(nextLesson.id)) {
          unlockedList.push(nextLesson.id);
          localStorage.setItem("unlocked_lessons", JSON.stringify(unlockedList));
        }
      }
    } catch (e) {}

    // 2. Persist to DB if user is logged in
    fetch(`/lessons/${lesson.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId: lesson.id, progress: 100, completed: true }),
    }).catch(() => {});

    // 3. Award bonus Exp & Gems ONCE ONLY on first-time completion
    const claimRes = claimLessonExp(lesson.id, 150, 15);
    if (!claimRes.alreadyClaimed) {
      setExpGained(150);
      setGemsGained(15);
    } else {
      setExpGained(0);
      setGemsGained(0);
    }

    // 4. Gieo mầm từ vựng đã hoàn thành vào Vườn Cây Trí Tuệ
    if (lesson.vocabularies && lesson.vocabularies.length > 0) {
      addWordsToSRS(lesson.vocabularies);
    }
  }, [lesson.id, lesson.vocabularies, nextLesson]);

  // Load persistent cache from DB vocabularies and localStorage
  useEffect(() => {
    const initialMap: Record<string, any> = {};
    vocabularies.forEach((v: any) => {
      if (v.collocations || v.aiData) {
        initialMap[v.chinese] = v.aiData || {
          collocations: v.collocations || [],
          sentenceChallenge: v.sentenceChallenge,
        };
      }
    });

    try {
      const localCache = localStorage.getItem("bao_bao_ai_cache");
      if (localCache) {
        const parsed = JSON.parse(localCache);
        Object.assign(initialMap, parsed);
      }
    } catch (e) {}

    if (Object.keys(initialMap).length > 0) {
      setAiDataMap((prev) => ({ ...initialMap, ...prev }));
    }
  }, [vocabularies]);

  const fetchAIDecomposition = useCallback(
    async (word: string, meaning: string, force = false) => {
      if (!word) return;
      if (aiDataMap[word] && !force) return;
      setIsGeneratingAI(true);
      try {
        const res = await fetch("/api/ai/word-decompose", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ word, meaning, level: lesson.level }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.collocations) {
            setAiDataMap((prev) => {
              const updated = { ...prev, [word]: data };
              try {
                localStorage.setItem("bao_bao_ai_cache", JSON.stringify(updated));
              } catch (e) {}
              return updated;
            });
          }
        }
      } catch (e) {
        console.error("fetchAIDecomposition error", e);
      } finally {
        setIsGeneratingAI(false);
      }
    },
    [aiDataMap, lesson.level]
  );

  // Auto fetch AI data for current vocabulary when changed
  useEffect(() => {
    if (currentVocab?.chinese) {
      // If already in cache, skip loading state
      if (!aiDataMap[currentVocab.chinese]) {
        fetchAIDecomposition(currentVocab.chinese, currentVocab.meaningVi, false);
      }
    }
  }, [currentVocab?.chinese, currentVocab?.meaningVi, aiDataMap, fetchAIDecomposition]);

  // Smoothly scroll active vocab tab into view with margin
  useEffect(() => {
    const el = document.getElementById(`vocab-tab-${vocabIndex}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [vocabIndex]);

  const decomp = useMemo(() => {
    return aiDataMap[currentVocab?.chinese || ""] || null;
  }, [aiDataMap, currentVocab]);

  const totalSteps = vocabularies.length || 1;

  // Split Chinese word into individual Hanzi characters for stroke practice
  const charList = useMemo(() => {
    const chars = (currentVocab?.chinese || "").replace(/[^\u4e00-\u9fa5]/g, "").split("");
    return chars.length > 0 ? chars : [currentVocab?.chinese || ""];
  }, [currentVocab]);

  const currentChar = charList[activeCharIndex] || charList[0] || "";

  // Reset states when switching words
  useEffect(() => {
    setActiveCharIndex(0);
    setSelectedTokenIds([]);
    setSentenceChecked(false);
    setSentenceCorrect(false);
  }, [vocabIndex]);

  // Generate sentence challenge with segmented tokens and distractors
  const sentenceChallenge = useMemo(() => {
    if (!currentVocab) return null;

    // Check if AI provided a custom high quality sentence
    const aiSent = aiDataMap[currentVocab.chinese]?.sentenceChallenge;
    if (aiSent && aiSent.tokens && aiSent.tokens.length > 0) {
      const cleanTarget = aiSent.chinese.replace(/[，。？！、\s\.\!\?,;:]/g, "");
      const correctTokens: SentenceToken[] = aiSent.tokens.map((t, idx) => ({
        id: `ai-tok-${idx}-${t}`,
        text: t,
      }));
      const distractorTokens: SentenceToken[] = (aiSent.distractors || []).slice(0, 2).map((d, idx) => ({
        id: `ai-distract-${idx}-${d}`,
        text: d,
      }));
      const shuffled = shuffleItems([...correctTokens, ...distractorTokens]);

      return {
        targetSentence: aiSent.chinese,
        cleanTarget,
        meaningVi: aiSent.meaningVi,
        correctTokens,
        availableTokens: shuffled,
        isAI: true,
      };
    }

    // Hide old sentence while AI is actively generating in the background
    if (isGeneratingAI) {
      return null;
    }

    // Only fallback to DB example if it actually exists, otherwise return null (skeleton state)
    if (!currentVocab?.exampleChinese) {
      return null;
    }

    const chineseEx = currentVocab.exampleChinese;
    const meaningEx = currentVocab.exampleMeaning || "";

    const cleanTarget = chineseEx.replace(/[，。？！、\s\.\!\?,;:]/g, "");
    const tokens = tokenizeChineseSentence(chineseEx, currentVocab.chinese);

    const correctTokens: SentenceToken[] = tokens.map((t, idx) => ({
      id: `tok-${idx}-${t}`,
      text: t,
    }));

    const commonDistractors = ["不", "也", "很", "是", "吗", "的"].filter(
      (d) => !tokens.includes(d) && d !== currentVocab.chinese
    );
    const distractorTokens: SentenceToken[] = commonDistractors.slice(0, 1).map((d, idx) => ({
      id: `distract-${idx}-${d}`,
      text: d,
    }));

    const shuffled = shuffleItems([...correctTokens, ...distractorTokens]);

    return {
      targetSentence: chineseEx,
      cleanTarget,
      meaningVi: meaningEx,
      correctTokens,
      availableTokens: shuffled,
      isAI: false,
    };
  }, [currentVocab, aiDataMap, isGeneratingAI]);

  const handleSpeak = (text: string, rate = 1.0) => {
    setIsSpeaking(true);
    speakChinese(text, rate);
    setTimeout(() => setIsSpeaking(false), 1200);
  };

  const handleSelectToken = (tokenId: string) => {
    sound.playWoodblock();
    if (selectedTokenIds.includes(tokenId)) {
      setSelectedTokenIds((prev) => prev.filter((id) => id !== tokenId));
    } else {
      setSelectedTokenIds((prev) => [...prev, tokenId]);
    }
  };

  const handleCheckSentence = () => {
    if (!sentenceChallenge || selectedTokenIds.length === 0) return;

    const userBuiltString = selectedTokenIds
      .map((id) => sentenceChallenge.availableTokens.find((t) => t.id === id)?.text || "")
      .join("");

    const isMatch = userBuiltString === sentenceChallenge.cleanTarget;
    setSentenceChecked(true);
    setSentenceCorrect(isMatch);

    if (isMatch) {
      sound.playCorrect();
      setComboStreak((p) => p + 1);
      if (!isLessonExpClaimed(lesson.id)) {
        setExpGained((p) => p + 25);
        addExpAndGems(25, 0);
      }
      if (!completedWords.includes(vocabIndex)) {
        setCompletedWords((prev) => [...prev, vocabIndex]);
      }
    } else {
      sound.playIncorrect();
      setComboStreak(0);
    }
  };

  const handleNextWord = () => {
    sound.playWoodblock();
    if (!completedWords.includes(vocabIndex)) {
      setCompletedWords((prev) => [...prev, vocabIndex]);
    }
    if (vocabIndex + 1 >= totalSteps) {
      sound.playLevelUp();
      handleCompleteLesson();
      setShowVictory(true);
    } else {
      setVocabIndex((p) => p + 1);
    }
  };

  const handlePrevWord = () => {
    if (vocabIndex > 0) {
      sound.playWoodblock();
      setVocabIndex((p) => p - 1);
    }
  };

  // If in practice mode, render the dedicated practice studio view (no modal popup)
  if (isPracticeMode) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] text-slate-900 selection:bg-amber-100 selection:text-amber-900">
        <LessonPracticeView
          lessonId={lesson.id}
          lessonTitle={lesson.title}
          vocabularies={lesson.vocabularies}
          onExit={() => setIsPracticeMode(false)}
        />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col bg-[#FAF8F5] text-slate-900 selection:bg-rose-100 selection:text-rose-900 pb-32">
      {/* Subtle Oriental Watermark Glow */}
      <div className="pointer-events-none fixed inset-0 z-0 opacity-40 bg-[radial-gradient(ellipse_at_50%_0%,rgba(245,158,11,0.07),transparent_70%)]" />

      {/* ========================================================================= */}
      {/* 1. TOP HEADER & GAMIFICATION STATS HUD                                    */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 border-b border-amber-900/10 bg-white/85 backdrop-blur-xl shadow-xs">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          {/* Back & Breadcrumb */}
          <div className="flex items-center gap-3">
            <Link
              to="/game-map"
              prefetch="intent"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200/80 bg-white text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all cursor-pointer shadow-2xs active:scale-95"
              title="Về Bản Đồ HSK"
            >
              <X size={18} />
            </Link>

            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-gradient-to-r from-rose-500 to-red-600 px-2.5 py-0.5 text-[10px] font-black uppercase text-white shadow-2xs">
                  {lesson.level}
                </span>
                <h1 className="text-sm font-black text-slate-900 sm:text-base line-clamp-1">
                  {lesson.title}
                </h1>
              </div>
              <p className="text-[11px] text-slate-400 font-semibold hidden sm:block">
                Tiến độ: <span className="text-rose-600 font-bold">{completedWords.length}</span> / {totalSteps} từ vựng
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. HORIZONTAL VOCABULARY RIBBON (Băng Chuyền Danh Sách Từ)                */}
      {/* ========================================================================= */}
      <div className="border-b border-amber-900/10 bg-white/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center gap-3 overflow-x-auto px-4 sm:px-6 lg:px-8 py-3.5 no-scrollbar scroll-smooth">
          {vocabularies.map((v, idx) => {
            const isCurrent = idx === vocabIndex;
            const isDone = completedWords.includes(idx);

            return (
              <button
                key={v.id || idx}
                id={`vocab-tab-${idx}`}
                type="button"
                onClick={() => {
                  sound.playWoodblock();
                  setVocabIndex(idx);
                }}
                className={`group flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-black transition-all shrink-0 cursor-pointer select-none ${
                  isCurrent
                    ? "bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-md shadow-rose-600/25 scale-[1.03]"
                    : isDone
                    ? "border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100/80"
                    : "border border-slate-200/90 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-2xs"
                }`}
              >
                <span className="font-hanzi text-sm">{v.chinese}</span>
                <span className={`text-[10px] font-mono font-bold ${isCurrent ? "text-rose-100" : "text-slate-400"}`}>
                  {v.pinyin}
                </span>
                {isDone && !isCurrent && (
                  <CheckCircle size={14} className="text-emerald-600" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. BENTO INTERACTIVE LEARNING STUDIO                                      */}
      {/* ========================================================================= */}
      <main className="relative z-10 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {currentVocab && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* =================================================================== */}
            {/* LEFT COLUMN: HERO CHARACTER & CALLIGRAPHY STAGE (6 Cols)            */}
            {/* =================================================================== */}
            <div className="lg:col-span-6 flex flex-col gap-5">
              <div className="relative flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)] text-center transition-all">
                {/* Mode Switcher Header (Chiết Tự / Luyện Viết) */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="inline-flex rounded-2xl border border-slate-200/80 bg-slate-100/70 p-1">
                    <button
                      type="button"
                      onClick={() => setViewMode("card")}
                      className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-black transition-all cursor-pointer ${
                        viewMode === "card"
                          ? "bg-white text-rose-600 shadow-xs scale-[1.02]"
                          : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      <Sparkles size={14} />
                      <span>Chiết Tự</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("stroke")}
                      className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-black transition-all cursor-pointer ${
                        viewMode === "stroke"
                          ? "bg-white text-rose-600 shadow-xs scale-[1.02]"
                          : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      <PenTool size={14} />
                      <span>Luyện Viết</span>
                    </button>
                  </div>

                  {/* Pronunciation Audio Button */}
                  <button
                    type="button"
                    onClick={() => handleSpeak(currentVocab.chinese, 1.0)}
                    className={`flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50/80 p-2 text-xs font-black text-rose-700 hover:bg-rose-100 transition-all cursor-pointer shadow-2xs ${
                      isSpeaking ? "scale-105 shadow-md shadow-rose-500/30 animate-pulse ring-2 ring-rose-400" : ""
                    }`}
                    title="Phát âm chuẩn 1.0x"
                  >
                    <Volume2 size={16} />
                    
                  </button>
                </div>

                {/* View 1: Main Hanzi Card */}
                {viewMode === "card" && (
                  <div className="my-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
                    <div className="relative mx-auto flex min-h-[190px] sm:min-h-[220px] w-full max-w-md items-center justify-center rounded-3xl border border-rose-100 bg-gradient-to-b from-rose-50/30 via-white to-amber-50/20 px-6 py-4 shadow-inner">
                      {/* Subtle Traditional Rice Grid background lines */}
                      <div className="pointer-events-none absolute inset-4 border border-dashed border-rose-200/50 rounded-2xl" />
                      <div className="pointer-events-none absolute inset-x-4 top-1/2 border-b border-dashed border-rose-200/40" />
                      <div className="pointer-events-none absolute inset-y-4 left-1/2 border-r border-dashed border-rose-200/40" />

                      <h2
                        className={`font-hanzi font-black text-slate-900 tracking-wide select-none whitespace-nowrap drop-shadow-sm ${
                          (currentVocab?.chinese?.length || 1) === 1
                            ? "text-7xl sm:text-8xl md:text-9xl"
                            : (currentVocab?.chinese?.length || 1) === 2
                            ? "text-5xl sm:text-6xl md:text-7xl"
                            : "text-4xl sm:text-5xl md:text-6xl"
                        }`}
                      >
                        {currentVocab.chinese}
                      </h2>
                    </div>

                    <div className="space-y-1.5">
                      <p className="text-3xl font-black text-rose-600 font-mono tracking-wider">
                        {currentVocab.pinyin}
                      </p>
                      <p className="text-xl font-black text-slate-800">
                        {currentVocab.meaningVi}
                      </p>
                    </div>
                  </div>
                )}

                {/* View 2: Traditional Grid Guided Stroke Auto-Fill (米字格) */}
                {viewMode === "stroke" && (
                  <div className="my-5 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                    {/* Multi-Character Selector Ribbon */}
                    {charList.length > 1 && (
                      <div className="flex items-center justify-center gap-2 pb-1">
                        {charList.map((ch, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              sound.playWoodblock();
                              setActiveCharIndex(idx);
                            }}
                            className={`flex items-center gap-1.5 rounded-2xl px-4 py-1.5 text-xs font-black transition-all cursor-pointer ${
                              activeCharIndex === idx
                                ? "bg-rose-600 text-white shadow-md shadow-rose-600/20 scale-105"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                          >
                            <span className="font-hanzi text-base">{ch}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* HanziWriter Interactive Auto-Fill Canvas */}
                    <HanziWriterCanvas
                      key={`${currentVocab.id}-${currentChar}-${activeCharIndex}`}
                      character={currentChar}
                      size={260}
                      onComplete={() => {
                        if (activeCharIndex + 1 < charList.length) {
                          setTimeout(() => {
                            setActiveCharIndex((p) => p + 1);
                          }, 1000);
                        } else {
                          if (!isLessonExpClaimed(lesson.id)) {
                            addExpAndGems(20, 1);
                            setExpGained((p) => p + 20);
                            setGemsGained((p) => p + 1);
                          }
                          if (!completedWords.includes(vocabIndex)) {
                            setCompletedWords((prev) => [...prev, vocabIndex]);
                          }
                        }
                      }}
                    />
                  </div>
                )}

                {/* Example Sentence Card */}
                {currentVocab.exampleChinese && (
                  <div className="rounded-2xl border border-amber-200/70 bg-amber-50/40 p-4 text-left space-y-1.5 mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider flex items-center gap-1.5">
                        <Lightbulb size={13} className="text-amber-600" /> Ví Dụ Giao Tiếp:
                      </span>
                      <button
                        type="button"
                        onClick={() => handleSpeak(currentVocab.exampleChinese || "")}
                        className="flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 cursor-pointer"
                      >
                        <Volume2 size={13} /> Nghe câu
                      </button>
                    </div>
                    <p className="font-hanzi text-base font-bold text-slate-900">
                      {currentVocab.exampleChinese}
                    </p>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                      {currentVocab.exampleMeaning}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* =================================================================== */}
            {/* RIGHT COLUMN: COLLOCATIONS & SENTENCE BUILDER (6 Cols)             */}
            {/* =================================================================== */}
            <div className="lg:col-span-6 flex flex-col gap-5">
              {/* 2x2 Common Collocations Bento Grid */}
              <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)] space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <Layers size={15} className="text-rose-600" />
                    Cụm Từ Ghép & Mở Rộng
                  </h4>
                  <span className="text-[11px] text-slate-400 font-medium">Chạm nghe phát âm</span>
                </div>

                {!decomp || isGeneratingAI ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-pulse">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="h-16 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-3.5 flex items-center gap-3"
                      >
                        <div className="h-4 w-12 bg-slate-200 rounded-md" />
                        <div className="h-3 w-24 bg-slate-200 rounded-md" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in duration-200">
                    {decomp.collocations.map((col, i) => (
                      <div
                        key={i}
                        onClick={() => handleSpeak(col.zh)}
                        className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3.5 hover:bg-rose-50/60 hover:border-rose-300 cursor-pointer transition-all shadow-2xs group text-left"
                      >
                        <div className="flex flex-col gap-1 min-w-0 pr-2">
                          {/* Hàng 1: Chữ Hán */}
                          <span className="font-hanzi text-base font-bold text-slate-900 group-hover:text-rose-600 transition-colors">
                            {col.zh}
                          </span>
                          {/* Hàng 2: Pinyin */}
                          {col.pinyin && (
                            <span className="text-xs font-bold text-amber-700 font-mono tracking-wide">
                              {col.pinyin}
                            </span>
                          )}
                          {/* Hàng 3: Nghĩa tiếng Việt */}
                          <p className="font-sans text-xs font-medium text-slate-600 group-hover:text-slate-800 leading-snug line-clamp-1">
                            {col.vi}
                          </p>
                        </div>
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-slate-400 group-hover:text-rose-600 group-hover:bg-rose-100/70 transition-colors shadow-2xs border border-slate-100">
                          <Volume2 size={14} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Interactive Practice Mode: Mini Sentence Builder */}
              <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)] space-y-4">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 py-1 text-xs font-black text-amber-800">
                    <Layers size={13} />
                    Thử Thách Ghép Câu
                  </span>
                  <span className="text-xs font-bold text-slate-400">Sắp xếp các khối từ</span>
                </div>

                {!sentenceChallenge || isGeneratingAI ? (
                  <div className="flex flex-col items-center justify-center py-10 px-4 text-center space-y-3 rounded-2xl border border-dashed border-amber-300 bg-amber-50/40 animate-pulse">
                    <div className="flex h-11 w-11 items-center justify-center text-amber-500">
                      <Sparkles size={20} className="animate-spin" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-black text-amber-900">
                        AI đang tạo câu đố ghép cho "{currentVocab.chinese}"...
                      </p>
                      <p className="text-xs text-amber-700 font-medium">
                        Tự động bóc tách từ vựng & ngữ pháp thực tế
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                    <p className="text-xs sm:text-sm font-semibold text-slate-700 leading-snug font-sans">
                      Dịch câu: <span className="text-rose-700 font-bold font-sans">"{sentenceChallenge.meaningVi}"</span>
                    </p>

                    {/* Drop Dock (Vùng ghép từ) */}
                    <div className="min-h-[68px] rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/80 p-3 flex flex-wrap items-center justify-center gap-2.5">
                      {selectedTokenIds.length === 0 ? (
                        <span className="text-xs text-slate-400 italic select-none">
                          Chạm vào các khối từ bên dưới để ghép câu hoàn chỉnh...
                        </span>
                      ) : (
                        selectedTokenIds.map((id) => {
                          const token = sentenceChallenge.availableTokens.find((t) => t.id === id);
                          if (!token) return null;
                          return (
                            <button
                              key={id}
                              type="button"
                              disabled={sentenceChecked}
                              onClick={() => handleSelectToken(id)}
                              className="rounded-2xl border-2 border-amber-400 bg-white px-4 py-2 font-hanzi text-base font-bold text-slate-900 shadow-xs hover:border-rose-400 hover:bg-rose-50 transition-all cursor-pointer active:scale-95"
                            >
                              {token.text}
                            </button>
                          );
                        })
                      )}
                    </div>

                    {/* Available Word Tokens Bank */}
                    <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                      {sentenceChallenge.availableTokens.map((token) => {
                        const isUsed = selectedTokenIds.includes(token.id);
                        return (
                          <button
                            key={token.id}
                            type="button"
                            disabled={isUsed || sentenceChecked}
                            onClick={() => handleSelectToken(token.id)}
                            className={`rounded-2xl border-2 px-4 py-2 font-hanzi text-base font-bold transition-all active:scale-95 cursor-pointer ${
                              isUsed
                                ? "border-slate-200 bg-slate-100 text-slate-300 opacity-40 cursor-not-allowed"
                                : "border-slate-200 bg-white text-slate-800 hover:border-rose-400 hover:bg-rose-50 hover:text-rose-600 shadow-2xs"
                            }`}
                          >
                            {token.text}
                          </button>
                        );
                      })}
                    </div>

                    {/* Check Sentence Button & Result */}
                    {!sentenceChecked ? (
                      <button
                        type="button"
                        disabled={selectedTokenIds.length === 0}
                        onClick={handleCheckSentence}
                        className="w-full rounded-2xl bg-slate-900 py-3.5 text-xs sm:text-sm font-black text-white hover:bg-slate-800 transition-all disabled:opacity-40 cursor-pointer shadow-sm"
                      >
                        Kiểm Tra Câu Ghép
                      </button>
                    ) : (
                      <div
                        className={`rounded-2xl border p-4 space-y-2 text-left animate-in fade-in zoom-in-95 duration-200 ${
                          sentenceCorrect
                            ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                            : "border-rose-300 bg-rose-50 text-rose-800"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black">
                            {sentenceCorrect ? "Ghép Câu Chính Xác! (+25 EXP)" : "Chưa Chính Xác:"}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleSpeak(sentenceChallenge.targetSentence)}
                            className="flex items-center gap-1 text-[11px] font-bold text-slate-700 hover:text-rose-700 cursor-pointer"
                          >
                            <Volume2 size={13} /> Nghe phát âm
                          </button>
                        </div>

                        <p className="font-hanzi text-base font-black text-slate-900">
                          {sentenceChallenge.targetSentence}
                        </p>

                        {!sentenceCorrect && (
                          <button
                            type="button"
                            onClick={() => {
                              setSentenceChecked(false);
                              setSelectedTokenIds([]);
                            }}
                            className="mt-2 flex items-center justify-center gap-1.5 rounded-xl border border-rose-300 bg-white px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition cursor-pointer"
                          >
                            <RotateCcw size={13} />
                            <span>Thử Lại Câu Này</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* 4. FIXED FLOATING BOTTOM DOCK (Duolingo-style Action Bar)                  */}
      {/* ========================================================================= */}
      <footer className="fixed bottom-0 inset-x-0 z-30 border-t border-amber-900/10 bg-white/90 backdrop-blur-xl py-3 px-4 sm:px-6 lg:px-8 shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 sm:gap-4">
          <button
            type="button"
            disabled={vocabIndex === 0}
            onClick={handlePrevWord}
            className="flex items-center gap-1.5 rounded-2xl border border-slate-200/90 bg-slate-50 px-4 py-2.5 sm:py-3 text-xs font-black text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
          >
            <ChevronLeft size={16} />
            <span className="hidden sm:inline">Từ Trước</span>
          </button>

          {/* Center Info & Practice Button */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => {
                sound.playWoodblock();
                setIsPracticeMode(true);
              }}
              className="flex items-center gap-2 rounded-2xl border border-amber-300 bg-amber-50 hover:bg-amber-100/80 px-4 sm:px-5 py-2.5 sm:py-3 text-xs font-black text-amber-900 active:scale-95 transition-all cursor-pointer group shadow-2xs"
              title="Luyện tập 15 câu hỏi ngẫu nhiên"
            >
              <Zap size={15} className="text-amber-600 fill-amber-500 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">Luyện Tập</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleNextWord}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 px-5 sm:px-7 py-2.5 sm:py-3 text-xs sm:text-sm font-black text-white shadow-md shadow-rose-600/25 hover:from-rose-700 hover:to-red-700 active:scale-95 transition-all cursor-pointer"
          >
            <span className="hidden sm:inline">{vocabIndex + 1 >= totalSteps ? "HOÀN TẤT" : "TỪ TIẾP THEO"}</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* 5. VICTORY CELEBRATION MODAL (High-End Clean Gamified Design)              */}
      {/* ========================================================================= */}
      {showVictory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 text-center shadow-2xl animate-in zoom-in-95 duration-200 space-y-5">
            {/* Top Badge */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 text-xs font-black text-amber-800 ">
              <Sparkles size={13} className="text-amber-600" />
              <span>HOÀN THÀNH XUẤT SẮC</span>
            </div>

            {/* Mascot / Stars Centerpiece */}
            <div className="relative py-1">
              <div className="mx-auto flex h-24 w-24 items-center justify-center">
                <MascotPandaSVG className="h-full w-full object-contain animate-bounce" />
              </div>

              {/* 3 Golden Stars */}
              <div className="flex justify-center gap-2 mt-3">
                {[1, 2, 3].map((s) => (
                  <Star key={s} size={22} className="fill-amber-400 text-amber-400 drop-shadow-xs" />
                ))}
              </div>
            </div>

            {/* Lesson Title & Congratulations */}
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {lesson.title}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {expGained > 0
                  ? "Tuyệt vời! Bạn đã vượt ải và mở khóa toàn bộ kiến thức mới."
                  : "Bạn đã hoàn thành ải này trước đó · Luyện tập ôn bài củng cố trí nhớ."}
              </p>
            </div>

            {/* Rewards Breakdown 3-Grid */}
            <div className="grid grid-cols-3 gap-2.5 pt-1">
              {/* EXP */}
              <div className="rounded-2xl border border-amber-200/80 bg-amber-50/60 p-3 text-center">
                <span className="text-[10px] font-bold text-amber-800/80 block">Kinh Nghiệm</span>
                <p className="text-base sm:text-lg font-black text-amber-700">
                  +{expGained} <span className="text-[10px] font-normal text-amber-600">EXP</span>
                </p>
              </div>

              {/* Gems */}
              <div className="rounded-2xl border border-sky-200/80 bg-sky-50/60 p-3 text-center">
                <span className="text-[10px] font-bold text-sky-800/80 block">Kim Cương</span>
                <p className="text-base sm:text-lg font-black text-sky-700">
                  +{gemsGained} <span className="text-[10px] font-normal text-sky-600">Gems</span>
                </p>
              </div>

              {/* Plants Seeded */}
              <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/60 p-3 text-center">
                <span className="text-[10px] font-bold text-emerald-800/80 block">Vườn Cây</span>
                <p className="text-base sm:text-lg font-black text-emerald-700">
                  +{lesson.vocabularies?.length || 0} <span className="text-[10px] font-normal text-emerald-600">cây</span>
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 space-y-2.5">
              {nextLesson ? (
                <Link
                  to={`/lessons/${nextLesson.id}`}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 py-3.5 px-4 text-xs sm:text-sm font-black text-white shadow-md shadow-red-600/25 hover:from-red-700 hover:to-rose-700 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <span>TIẾP TỤC ẢI {nextLesson.orderNo}</span>
                  <ArrowRight size={16} />
                </Link>
              ) : (
                <Link
                  to="/game-map"
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 py-3.5 px-4 text-xs sm:text-sm font-black text-white shadow-md shadow-red-600/25 hover:from-red-700 hover:to-rose-700 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <Compass size={16} />
                  <span>TIẾP TỤC HÀNH TRÌNH</span>
                </Link>
              )}

              <Link
                to="/game-map"
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 py-3 px-4 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <Compass size={14} className="text-slate-500" />
                <span>Trở Về Bản Đồ Thế Giới</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
