import type { Route } from "./+types/hanzi-writing";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useFetcher } from "react-router";
import { ArrowRight, BookOpen, CheckCircle2, ChevronDown, Menu, Map as MapIcon, RotateCcw, Volume2, X } from "lucide-react";
import { SiteLayout } from "~/components/Layout";
import { requireUser } from "~/lib/auth.server";
import { prisma } from "~/lib/db.server";
import { sound } from "~/lib/sound";
import sentenceData from "../../data/bai1-10-sentences.json";
import sentenceData11To20 from "../../data/bai11-20-sentences.json";
import sentenceData21To30 from "../../data/bai21-30-sentences.json";
import sentenceData31To40 from "../../data/bai31-40-sentences.json";

type WritingWord = {
  chinese: string;
  pinyin: string;
  meaningVi: string;
};

type PracticeMode = "hanzi" | "meaning" | "quiz" | "sentence";
type SourceTab = "roadmap" | "hsk30";

type SentencePracticeItem = {
  lesson: number;
  vietnamese: string;
  hanzi: string;
  pinyin: string;
  vocabulary: { hanzi: string; pinyin: string; meaning: string }[];
};

type WordModal =
  | { type: "next-topic"; nextValue: string; nextTitle: string }
  | { type: "level-complete"; level: string };

type WritingItem = {
  id: string;
  title: string;
  phase: string;
  level: string;
  orderNo: number;
  source: "roadmap" | "lesson";
  sourceType: string;
  vocabulary: WritingWord[];
};

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireUser(request);
  const [roadmapItems, lessons, sentenceProgress] = await Promise.all([
    prisma.roadmapItem.findMany({
      select: { id: true, title: true, phase: true, level: true, orderNo: true, vocabulary: true },
      orderBy: [{ level: "asc" }, { orderNo: "asc" }],
    }),
    prisma.lesson.findMany({
      where: { status: "PUBLISHED", source: "HSK30" },
      select: {
        id: true,
        title: true,
        level: true,
        orderNo: true,
        source: true,
        vocabularies: { select: { chinese: true, pinyin: true, meaningVi: true } },
      },
      orderBy: [{ level: "asc" }, { orderNo: "asc" }],
    }),
    prisma.sentencePracticeProgress.findUnique({
      where: { userId: user.id },
      select: { sentenceIndex: true, results: true },
    }),
  ]);

  const items: WritingItem[] = [
    ...roadmapItems.map((item) => ({
      ...item,
      level: item.level || item.phase,
      source: "roadmap" as const,
      sourceType: "Roadmap",
      vocabulary: toWritingWords(item.vocabulary),
    })),
    ...lessons.map((lesson) => ({
      id: `lesson-${lesson.id}`,
      title: lesson.title,
      phase: lesson.source,
      level: lesson.level,
      orderNo: lesson.orderNo,
      source: "lesson" as const,
      sourceType: lesson.source,
      vocabulary: toWritingWords(lesson.vocabularies),
    })),
  ];

  return {
    user,
    items,
    sentenceProgress: {
      sentenceIndex: sentenceProgress?.sentenceIndex ?? 0,
      results: Array.isArray(sentenceProgress?.results) ? sentenceProgress.results : [],
    },
  };
}

export async function action({ request }: Route.ActionArgs) {
  const user = await requireUser(request);
  const payload = await request.json() as {
    intent?: string;
    sentenceIndex?: number;
    results?: unknown;
  };

  if (payload.intent !== "save-sentence-progress") {
    return { ok: false };
  }

  const sentenceIndex = Number(payload.sentenceIndex);
  const results = Array.isArray(payload.results)
    ? payload.results
      .filter((result): result is { hanzi: string; vietnamese: string; correct: boolean } => (
        Boolean(result)
        && typeof result === "object"
        && typeof (result as { hanzi?: unknown }).hanzi === "string"
        && typeof (result as { vietnamese?: unknown }).vietnamese === "string"
        && typeof (result as { correct?: unknown }).correct === "boolean"
      ))
      .slice(0, 300)
    : [];

  if (!Number.isInteger(sentenceIndex) || sentenceIndex < 0) {
    return { ok: false };
  }

  await prisma.sentencePracticeProgress.upsert({
    where: { userId: user.id },
    create: { userId: user.id, sentenceIndex, results },
    update: { sentenceIndex, results },
  });

  return { ok: true };
}

function toWritingWords(value: unknown): WritingWord[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((item) => ({
      chinese: String(item.chinese || item.word || item.hanzi || "").trim(),
      pinyin: String(item.pinyin || "").trim(),
      meaningVi: String(item.meaningVi || item.meaning_vi || item.vi || item.meaning || "").trim(),
    }))
    .filter((word) => word.chinese && word.meaningVi);
}

function uniqueWritingWords(words: WritingWord[]) {
  const unique = new Map<string, WritingWord>();
  for (const word of words) {
    const key = word.chinese.normalize("NFC").replace(/\s+/g, "");
    if (!unique.has(key)) unique.set(key, word);
  }
  return [...unique.values()];
}

function shuffleWords(words: WritingWord[]) {
  const shuffled = [...words];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }
  return shuffled;
}

function normalizeMeaning(value: string) {
  return value
    .toLocaleLowerCase("vi-VN")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function compareLevels(first: string, second: string) {
  const firstNumber = Number(first.match(/\d+(?:\.\d+)?/)?.[0] || Number.POSITIVE_INFINITY);
  const secondNumber = Number(second.match(/\d+(?:\.\d+)?/)?.[0] || Number.POSITIVE_INFINITY);
  return firstNumber - secondNumber || first.localeCompare(second, "vi");
}

function formatHskLevel(value: string) {
  const normalized = value.trim();
  const number = normalized.match(/^HSK\s*(\d+(?:\.\d+)?)$/i)?.[1] || normalized.match(/^\d+(?:\.\d+)?$/)?.[0];
  return number ? `HSK ${number}` : normalized;
}

type SourceOption = {
  value: string;
  label: string;
  count: number;
  level: string;
};

function SourceSelect({
  value,
  groups,
  onChange,
}: {
  value: string;
  groups: { label: string; options: SourceOption[]; icon: typeof MapIcon }[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const levelLabel = groups[0]?.label || "Chọn cấp độ";
  const LevelIcon = groups[0]?.icon;

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  return (
    <div ref={ref} className="relative w-full min-w-0 font-sans sm:min-w-64">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((isOpen) => !isOpen)}
        className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border-0 bg-transparent px-2.5 py-2 text-left outline-none transition ${
          open ? "bg-red-50 text-red-700" : "hover:bg-slate-50"
        }`}
      >
        <span className="flex min-w-0 items-center gap-3">
          {LevelIcon ? <LevelIcon size={19} className="shrink-0 text-red-500" /> : null}
          <span className="min-w-0">
            <span className="block truncate text-sm font-black text-slate-800">{formatHskLevel(levelLabel)}</span>
            <span className="mt-0.5 block text-[11px] font-bold uppercase tracking-wide text-slate-400">Chọn chủ đề</span>
          </span>
        </span>
        <ChevronDown size={18} className={`shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div role="listbox" className="mt-1 rounded-xl bg-slate-50/80 p-1">
          {groups.map((group) => {
            const GroupIcon = group.icon;
            if (group.options.length === 0) return null;
            return (
              <div key={group.label} className="not-first:mt-2">
                {group.options.map((option) => {
                  const isSelected = option.value === value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        onChange(option.value);
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm transition ${
                        isSelected ? "bg-red-50 font-black text-red-700" : "font-semibold text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span>{option.label}</span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export default function HanziWriting({ loaderData }: Route.ComponentProps) {
  const { user, items } = loaderData;
  const progressFetcher = useFetcher<typeof action>();
  const sentenceItems = useMemo<SentencePracticeItem[]>(
    () => [sentenceData, sentenceData11To20, sentenceData21To30, sentenceData31To40]
      .flatMap((data) => data.lessons.flatMap((lesson) => lesson.sentences.map((sentence) => ({ ...sentence, lesson: lesson.lesson })))),
    [],
  );
  const selections = useMemo(() => {
    const roadmapItems = items
      .filter((item) => item.source === "roadmap")
      .sort((first, second) => (
        compareLevels(first.level, second.level)
        || first.orderNo - second.orderNo
        || first.title.localeCompare(second.title, "vi")
      ));
    const lessonItems = items
      .filter((item) => item.source === "lesson" && item.sourceType === "HSK30")
      .sort((first, second) => (
        compareLevels(first.level, second.level)
        || first.orderNo - second.orderNo
        || first.title.localeCompare(second.title, "vi")
      ));

    return {
      roadmapItems,
      lessonItems,
    };
  }, [items]);
  const sourceGroups = useMemo(() => [
    {
      label: "Lộ trình",
      icon: MapIcon,
      options: selections.roadmapItems.map((item) => ({
        value: `roadmap:${item.id}`,
        label: item.title,
        count: item.vocabulary.length,
        level: item.level,
      })),
    },
    {
      label: "HSK 3.0",
      icon: BookOpen,
      options: selections.lessonItems.map((item) => ({
        value: `lesson:${item.id}`,
        label: `${formatHskLevel(item.level)} · ${item.title}`,
        count: item.vocabulary.length,
        level: item.level,
      })),
    },
  ], [items, selections]);
  const firstSelection = selections.roadmapItems[0]
    ? `roadmap:${selections.roadmapItems[0].id}`
    : selections.lessonItems[0]
      ? `lesson:${selections.lessonItems[0].id}`
      : "";
  const [sourceTab, setSourceTab] = useState<SourceTab>("roadmap");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedSource, setSelectedSource] = useState(firstSelection);
  const [wordIndex, setWordIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [practiceMode, setPracticeMode] = useState<PracticeMode>("hanzi");
  const [showPinyin, setShowPinyin] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [results, setResults] = useState<{ chinese: string; pinyin: string; meaningVi: string; correct: boolean }[]>([]);
  const [sentenceIndex, setSentenceIndex] = useState(loaderData.sentenceProgress.sentenceIndex);
  const [sentenceAnswer, setSentenceAnswer] = useState("");
  const [sentenceCorrect, setSentenceCorrect] = useState<boolean | null>(null);
  const [sentenceSubmitted, setSentenceSubmitted] = useState(false);
  const [sentenceResults, setSentenceResults] = useState<{ hanzi: string; vietnamese: string; correct: boolean }[]>(loaderData.sentenceProgress.results as { hanzi: string; vietnamese: string; correct: boolean }[]);
  const [wordModal, setWordModal] = useState<WordModal | null>(null);
  const sentenceSubmittedRef = useRef(false);
  const submittedSentenceIndexRef = useRef<number | null>(null);
  const sentenceInputRef = useRef<HTMLInputElement>(null);
  const answerInputRef = useRef<HTMLInputElement>(null);

  const selectSourceTab = (tab: SourceTab) => {
    setSourceTab(tab);
    const group = sourceGroups[tab === "roadmap" ? 0 : 1];
    if (group?.options[0]) setSelectedSource(group.options[0].value);
  };

  const restartWordTopic = () => {
    setWordIndex(0);
    setAnswer("");
    setIsCorrect(null);
    setWordModal(null);
  };

  const continueToNextTopic = () => {
    if (!wordModal || wordModal.type !== "next-topic") return;
    setSelectedSource(wordModal.nextValue);
    setWordModal(null);
  };

  const words = useMemo(() => {
    return uniqueWritingWords(
      items
        .filter((item) => {
          const itemSelection = item.source === "roadmap"
            ? `roadmap:${item.id}`
            : `lesson:${item.id}`;
          return itemSelection === selectedSource;
        })
        .flatMap((item) => item.vocabulary),
    );
  }, [items, selectedSource]);
  const quizWords = useMemo(() => shuffleWords(words), [words]);
  const currentWords = practiceMode === "quiz" ? quizWords : words;
  const currentWord = currentWords[wordIndex];
  const currentSentence = sentenceItems[sentenceIndex];
  const quizOptions = useMemo(() => {
    if (!currentWord) return [];
    const byMeaning = new Map<string, WritingWord>();
    for (const word of words) {
      const meaningKey = normalizeMeaning(word.meaningVi);
      if (!byMeaning.has(meaningKey)) byMeaning.set(meaningKey, word);
    }
    const correctKey = normalizeMeaning(currentWord.meaningVi);
    const distractors = shuffleWords(
      [...byMeaning.values()].filter((word) => normalizeMeaning(word.meaningVi) !== correctKey),
    ).slice(0, 3);
    return shuffleWords([currentWord, ...distractors]);
  }, [currentWord, words]);
  useEffect(() => {
    setWordIndex(0);
    setAnswer("");
    setIsCorrect(null);
    setResults([]);
  }, [selectedSource]);

  useEffect(() => {
    setWordIndex(0);
    setAnswer("");
    setIsCorrect(null);
    setResults([]);
  }, [practiceMode]);

  useEffect(() => {
    setAnswer("");
    setIsCorrect(null);
  }, [wordIndex]);

  useEffect(() => {
    sentenceSubmittedRef.current = false;
    submittedSentenceIndexRef.current = null;
    setSentenceSubmitted(false);
    setSentenceAnswer("");
    setSentenceCorrect(null);
  }, [sentenceIndex]);

  useEffect(() => {
    if (practiceMode !== "sentence" || sentenceSubmitted || sentenceCorrect !== null) return;
    const timeout = window.setTimeout(() => sentenceInputRef.current?.focus(), 0);
    return () => window.clearTimeout(timeout);
  }, [practiceMode, sentenceCorrect, sentenceIndex, sentenceSubmitted]);

  useEffect(() => {
    if (practiceMode === "sentence" || practiceMode === "quiz" || isCorrect !== null || wordModal) return;
    const timeout = window.setTimeout(() => answerInputRef.current?.focus(), 0);
    return () => window.clearTimeout(timeout);
  }, [isCorrect, practiceMode, selectedSource, wordIndex, wordModal]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      progressFetcher.submit(JSON.stringify({
        intent: "save-sentence-progress",
        sentenceIndex,
        results: sentenceResults,
      }), { method: "post", encType: "application/json" });
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [sentenceIndex, sentenceResults]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      if (event.key === "`") {
        event.preventDefault();
        setShowPinyin((value) => !value);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const goToWord = (nextIndex: number) => {
    setWordIndex(Math.max(0, Math.min(nextIndex, currentWords.length - 1)));
  };

  const speak = () => {
    const text = practiceMode === "sentence" ? currentSentence?.hanzi : currentWord?.chinese;
    if (!text || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "zh-CN";
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  };

  const checkSentenceAnswer = () => {
    if (!currentSentence || !sentenceAnswer.trim() || sentenceSubmittedRef.current || submittedSentenceIndexRef.current === sentenceIndex || sentenceSubmitted || sentenceCorrect !== null) return;
    sentenceSubmittedRef.current = true;
    submittedSentenceIndexRef.current = sentenceIndex;
    setSentenceSubmitted(true);
    const submittedAnswer = sentenceAnswer.trim();
    const correct = normalizeSentence(submittedAnswer) === normalizeSentence(currentSentence.hanzi);
    setSentenceAnswer("");
    if (sentenceInputRef.current) sentenceInputRef.current.value = "";
    setSentenceCorrect(correct);
    if (correct) sound.playCorrect();
    else sound.playIncorrect();
    setSentenceResults((prev) => [
      { hanzi: currentSentence.hanzi, vietnamese: currentSentence.vietnamese, correct },
      ...prev,
    ]);

    const nextIndex = sentenceIndex + 1;
    if (nextIndex < sentenceItems.length) {
      window.setTimeout(() => setSentenceIndex(nextIndex), 300);
    }
  };

  const checkAnswer = () => {
    if (!currentWord || !answer.trim() || isCorrect !== null) return;
    const submittedAnswer = answer.trim();
    const correct = practiceMode === "hanzi"
      ? submittedAnswer === currentWord.chinese
      : (() => {
          const normalizedAnswer = normalizeMeaning(submittedAnswer);
          const normalizedExpected = normalizeMeaning(currentWord.meaningVi);
          return normalizedAnswer === normalizedExpected
            || normalizedExpected.includes(normalizedAnswer)
            || normalizedAnswer.includes(normalizedExpected);
        })();
    setAnswer("");
    setIsCorrect(correct);
    if (correct) {
      sound.playCorrect();
    } else {
      sound.playIncorrect();
    }
    setResults((prev) => [
      { chinese: currentWord.chinese, pinyin: currentWord.pinyin, meaningVi: currentWord.meaningVi, correct },
      ...prev,
    ]);
    if (wordIndex >= currentWords.length - 1) {
      const currentGroup = sourceGroups.find((group) => group.options.some((option) => option.value === selectedSource));
      const currentOptionIndex = currentGroup?.options.findIndex((option) => option.value === selectedSource) ?? -1;
      const currentOption = currentGroup?.options[currentOptionIndex];
      const nextOption = currentGroup?.options
        .slice(currentOptionIndex + 1)
        .find((option) => option.level === currentOption?.level);

      if (nextOption) {
        setWordModal({ type: "next-topic", nextValue: nextOption.value, nextTitle: nextOption.label });
      } else {
        setWordModal({ type: "level-complete", level: formatHskLevel(currentOption?.level || "") });
      }
      return;
    }
    if (wordIndex < currentWords.length - 1) {
      window.setTimeout(() => {
        setWordIndex((index) => index + 1);
      }, 300);
    }
  };

  const chooseQuizAnswer = (meaning: string) => {
    if (!currentWord || isCorrect !== null) return;
    const correct = normalizeMeaning(meaning) === normalizeMeaning(currentWord.meaningVi);
    setIsCorrect(correct);
    if (correct) {
      sound.playCorrect();
    } else {
      sound.playIncorrect();
    }
    setResults((prev) => [
      { chinese: currentWord.chinese, pinyin: currentWord.pinyin, meaningVi: currentWord.meaningVi, correct },
      ...prev,
    ]);
    if (wordIndex < currentWords.length - 1) {
      window.setTimeout(() => {
        setWordIndex((index) => index + 1);
      }, 300);
    }
  };

  return (
    <SiteLayout user={user} lockScroll>
      <main className="h-[calc(100vh-4rem)] w-full overflow-hidden">
        {wordModal && typeof document !== "undefined" ? createPortal((
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
            <div className="w-full max-w-md overflow-hidden rounded-[2rem] border border-slate-200 bg-[#fffdf8] shadow-2xl">
              {wordModal.type === "next-topic" ? (
                <>
                  <div className="border-b border-red-100 bg-red-50/70 px-6 py-5 sm:px-8">
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                        <CheckCircle2 size={24} />
                      </span>
                      <div className="min-w-0 text-left">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-red-600">Chủ đề đã hoàn thành</p>
                        <p className="mt-1 truncate text-sm font-black text-slate-800">{wordModal.nextTitle}</p>
                      </div>
                    </div>
                  </div>
                  <div className="px-6 py-6 text-left sm:px-8">
                    <h2 className="text-xl font-black tracking-tight text-slate-900">Tiếp tục luyện tập?</h2>
                    <p className="mt-2 text-sm font-medium leading-6 text-slate-500">Bạn muốn làm lại chủ đề này hay chuyển sang chủ đề tiếp theo?</p>
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={restartWordTopic}
                      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-600 transition hover:bg-white hover:border-slate-300"
                    >
                      <RotateCcw size={16} />
                      Không
                    </button>
                    <button
                      type="button"
                      onClick={continueToNextTopic}
                      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-black text-white transition hover:bg-red-700"
                    >
                      Có <ArrowRight size={16} />
                    </button>
                  </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="border-b border-emerald-100 bg-emerald-50/70 px-6 py-6 text-center sm:px-8">
                    <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                      <CheckCircle2 size={26} />
                    </span>
                    <p className="mt-3 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-600">{wordModal.level}</p>
                  </div>
                  <div className="px-6 py-6 text-center sm:px-8">
                    <h2 className="text-xl font-black tracking-tight text-slate-900">Bạn đã hoàn thành!</h2>
                    <p className="mt-2 text-sm font-medium leading-6 text-slate-500">Bạn đã hoàn thành toàn bộ chủ đề trong cấp độ này.</p>
                    <button
                      type="button"
                      onClick={restartWordTopic}
                      className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white transition hover:bg-emerald-700"
                    >
                      <RotateCcw size={16} />
                      Làm lại cấp độ
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        ), document.body) : null}
        <div className="grid h-full min-h-0 gap-6 lg:grid-cols-[22rem_minmax(0,1fr)] lg:items-start lg:gap-0">
          {sidebarOpen ? (
            <button
              type="button"
              aria-label="Đóng sidebar"
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 z-[65] bg-slate-900/20 lg:hidden"
            />
          ) : null}
          <aside className={`no-scrollbar fixed bottom-0 left-0 top-16 z-[70] w-[min(22rem,88vw)] overflow-y-auto border-y border-r border-slate-200 bg-[#fffdf8] px-5 py-6 shadow-2xl transition-transform duration-300 lg:sticky lg:top-0 lg:order-1 lg:h-full lg:w-auto lg:translate-x-0 lg:border-l-0 lg:shadow-[8px_0_24px_rgba(15,23,42,0.04)] ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
            <div className="border-b border-slate-200/80 pb-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="mt-1 font-sans text-lg font-black tracking-tight text-slate-800">Nguồn luyện tập</h2>
                </div>
                <button
                  type="button"
                  aria-label="Đóng sidebar"
                  onClick={() => setSidebarOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
                >
                  <X size={18} />
                </button>
              </div>
              <p className="mt-1 text-xs font-medium leading-5 text-slate-400">Chọn cấp độ rồi mở chủ đề muốn luyện.</p>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-1 rounded-2xl border border-slate-200/80 bg-slate-100/80 p-1">
              {([
                ["roadmap", "Lộ trình"],
                ["hsk30", "HSK 3.0"],
              ] as const).map(([tab, label]) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => selectSourceTab(tab)}
                  className={`rounded-lg px-2 py-2 text-xs font-black transition ${
                    sourceTab === tab ? "bg-white text-red-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="mt-4 grid gap-5">
              {sourceGroups
                .filter((_, index) => (sourceTab === "roadmap" ? index === 0 : index === 1))
                .map((group) => {
                const levels = [...new Set(group.options.map((option) => option.level))].sort(compareLevels);
                return (
                  <div key={group.label} className="grid gap-3">
                    {levels.map((level) => (
                      <div key={`${group.label}-${level}`} className="min-w-0">
                        <SourceSelect
                          value={selectedSource}
                          groups={[{
                            ...group,
                            label: level,
                            options: group.options.filter((option) => option.level === level),
                          }]}
                          onChange={(value) => {
                            setSelectedSource(value);
                            setSidebarOpen(false);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </aside>

          <section className="no-scrollbar order-2 flex h-full min-h-0 min-w-0 flex-col overflow-hidden px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        <div className="relative z-[50] mb-6">
          <div className="flex min-w-0 items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="mt-1 font-sans text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Luyện chữ Hán</h1>
              <p className="mt-1 max-w-xl font-sans text-sm font-medium leading-5 text-slate-500">Ôn chữ Hán từ lộ trình và bài học HSK 3.0.</p>
            </div>
            <button
              type="button"
              aria-label="Mở sidebar nguồn luyện tập"
              onClick={() => setSidebarOpen(true)}
              className="mt-1 shrink-0 rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 shadow-sm hover:border-red-200 hover:text-red-600 lg:hidden"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>

        <div className="mb-4 flex w-full rounded-2xl border border-slate-200 bg-white p-1 shadow-sm sm:mb-6 sm:mx-auto sm:max-w-xl">
          <button
            type="button"
            onClick={() => setPracticeMode("hanzi")}
            className={`flex min-h-10 flex-1 items-center justify-center rounded-xl px-3 py-2 text-xs font-black transition sm:text-sm ${
              practiceMode === "hanzi" ? "bg-red-600 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            Viết chữ Hán
          </button>
          <button
            type="button"
            onClick={() => setPracticeMode("meaning")}
            className={`flex min-h-10 flex-1 items-center justify-center rounded-xl px-3 py-2 text-xs font-black transition sm:text-sm ${
              practiceMode === "meaning" ? "bg-red-600 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            Nhập nghĩa
          </button>
          <button
            type="button"
            onClick={() => setPracticeMode("quiz")}
            className={`flex min-h-10 flex-1 items-center justify-center rounded-xl px-3 py-2 text-xs font-black transition sm:text-sm ${
              practiceMode === "quiz" ? "bg-red-600 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            Trắc nghiệm
          </button>
          <button
            type="button"
            onClick={() => setPracticeMode("sentence")}
            className={`flex min-h-10 flex-1 items-center justify-center rounded-xl px-3 py-2 text-xs font-black transition sm:text-sm ${
              practiceMode === "sentence" ? "bg-red-600 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            Dịch câu
          </button>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-red-50 to-amber-50 p-3 sm:rounded-[2rem] sm:p-6">
          <div className="relative mx-auto max-w-3xl overflow-hidden rounded-2xl bg-white p-3 pt-10 text-center shadow-md sm:rounded-[2rem] sm:p-8 sm:pt-14">
            {practiceMode === "sentence" ? (
              currentSentence ? (
                <>
                  <button
                    type="button"
                    onClick={speak}
                    aria-label="Nghe câu tiếng Trung"
                    className="absolute right-3 top-3 rounded-full bg-red-50 p-2.5 text-red-600 transition-colors hover:bg-red-100 sm:right-6 sm:top-6 sm:p-3"
                  >
                    <Volume2 size={20} />
                  </button>

                  <p className="font-sans text-xs font-black uppercase tracking-[0.16em] text-red-500">
                    Bài {currentSentence.lesson} · Dịch câu
                  </p>
                  <p className="mt-4 break-words font-sans text-2xl font-black leading-relaxed text-slate-800 sm:text-3xl">
                    {currentSentence.vietnamese}
                  </p>
                  <p className="mt-2 font-sans text-sm font-semibold text-slate-400">
                    Nhập câu tiếng Trung tương ứng
                  </p>

                  <div className="mt-5 flex flex-wrap justify-center gap-2">
                    {currentSentence.vocabulary.map((word) => (
                      <span key={`${word.hanzi}-${word.pinyin}`} className="rounded-xl bg-amber-50 px-3 py-2 font-hanzi text-lg font-bold text-amber-800">
                        {word.hanzi}
                      </span>
                    ))}
                  </div>

                  <div className="mt-5">
                    <input
                      ref={sentenceInputRef}
                      value={sentenceAnswer}
                      readOnly={sentenceCorrect !== null || sentenceSubmitted}
                      disabled={sentenceCorrect !== null || sentenceSubmitted}
                      onChange={(event) => {
                        if (sentenceSubmittedRef.current || sentenceSubmitted || sentenceCorrect !== null) return;
                        setSentenceAnswer(event.target.value);
                        setSentenceCorrect(null);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.repeat) {
                          event.preventDefault();
                          event.stopPropagation();
                          if (sentenceSubmittedRef.current || sentenceSubmitted) return;
                          checkSentenceAnswer();
                        }
                      }}
                      placeholder="Nhập câu chữ Hán..."
                      aria-label="Nhập câu chữ Hán"
                      className={`input-hanzi w-full min-w-0 rounded-2xl border px-3 py-3 font-hanzi text-xl font-bold outline-none transition sm:px-4 sm:text-2xl ${
                        sentenceCorrect === true
                          ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                          : sentenceCorrect === false
                            ? "border-red-400 bg-red-50 text-red-700"
                            : "border-slate-200 focus:border-red-400"
                      }`}
                    />
                    {sentenceCorrect !== null ? (
                      <p className={`mt-2 font-sans text-sm font-bold ${sentenceCorrect ? "text-emerald-600" : "text-red-600"}`}>
                        {sentenceCorrect ? "Chính xác!" : `Đáp án: ${currentSentence.hanzi}`}
                      </p>
                    ) : null}
                  </div>

                  <div className="mt-4 flex items-center justify-center gap-2 font-sans text-xs font-bold text-slate-400">
                    Câu {sentenceIndex + 1} / {sentenceItems.length}
                  </div>
                </>
              ) : (
                <div className="py-16 text-sm font-semibold text-slate-500">Chưa có dữ liệu câu để luyện.</div>
              )
            ) : currentWord ? (
              <>
                <button
                  type="button"
                  onClick={speak}
                  aria-label="Nghe phát âm"
                  className="absolute right-3 top-3 rounded-full bg-red-50 p-2.5 text-red-600 transition-colors hover:bg-red-100 sm:right-6 sm:top-6 sm:p-3"
                >
                  <Volume2 size={20} />
                </button>

                <button
                  type="button"
                  onClick={() => setShowPinyin((value) => !value)}
                  aria-label={showPinyin ? "Ẩn pinyin" : "Hiện pinyin"}
                  className={`absolute left-3 top-3 inline-flex h-6 w-10 cursor-pointer items-center rounded-full transition sm:left-6 sm:top-6 ${showPinyin ? "bg-red-600" : "bg-slate-300"}`}
                >
                  <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${showPinyin ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>

                <p className={`${practiceMode !== "hanzi" ? "font-hanzi" : "font-sans"} break-words text-4xl font-black tracking-wide text-slate-400 sm:text-6xl`}>
                  {practiceMode !== "hanzi" ? currentWord.chinese : showPinyin ? currentWord.pinyin : "?"}
                </p>
                <p className="mt-2 break-words font-sans text-base font-bold leading-6 text-slate-600 sm:text-lg">
                  {practiceMode === "meaning" ? (showPinyin ? currentWord.pinyin : "") : practiceMode === "quiz" ? "Chọn nghĩa tiếng Việt đúng" : currentWord.meaningVi}
                </p>

                {practiceMode === "quiz" ? (
                  <div className="mt-5 grid gap-2 text-left sm:grid-cols-2">
                    {quizOptions.map((option) => (
                      <button
                        key={option.chinese + option.meaningVi}
                        type="button"
                        disabled={isCorrect !== null}
                        onClick={() => chooseQuizAnswer(option.meaningVi)}
                        className={`min-h-12 rounded-2xl border px-4 py-3 font-sans text-sm font-bold transition ${
                          isCorrect !== null && normalizeMeaning(option.meaningVi) === normalizeMeaning(currentWord.meaningVi)
                            ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 bg-white text-slate-700 hover:border-red-300 hover:bg-red-50"
                        } disabled:cursor-default`}
                      >
                        {option.meaningVi}
                      </button>
                    ))}
                    {isCorrect !== null ? (
                      <p className={`sm:col-span-2 mt-1 font-sans text-sm font-bold ${isCorrect ? "text-emerald-600" : "text-red-600"}`}>
                        {isCorrect ? "Chính xác!" : `Đáp án: ${currentWord.meaningVi}`}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <div className="mt-5">
                    <input
                      ref={answerInputRef}
                      value={answer}
                      disabled={isCorrect !== null || Boolean(wordModal)}
                      onChange={(event) => {
                        if (isCorrect !== null) return;
                        setAnswer(event.target.value);
                        setIsCorrect(null);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          if (isCorrect !== null) return;
                          checkAnswer();
                        }
                      }}
                      placeholder={practiceMode === "hanzi" ? "Nhập chữ Hán..." : "Nhập nghĩa tiếng Việt..."}
                      aria-label={practiceMode === "hanzi" ? "Nhập chữ Hán" : "Nhập nghĩa tiếng Việt"}
                      className={`w-full min-w-0 rounded-2xl border px-3 py-3 ${practiceMode === "hanzi" ? "input-hanzi font-hanzi text-2xl font-bold" : "input-normal font-sans text-xl font-bold tracking-normal"} outline-none transition sm:px-4 sm:text-2xl ${
                        isCorrect === true
                          ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                          : isCorrect === false
                            ? "border-red-400 bg-red-50 text-red-700"
                            : "border-slate-200 focus:border-red-400"
                      }`}
                    />
                    {isCorrect !== null && (
                      <p className={`mt-2 font-sans text-sm font-bold ${isCorrect ? "text-emerald-600" : "text-red-600"}`}>
                        {isCorrect ? "Chính xác!" : "Chưa đúng, thử lại nhé."}
                      </p>
                    )}
                  </div>
                )}

                <div className="mt-4 flex items-center justify-center gap-2 font-sans text-xs font-bold text-slate-400">
                  Từ {wordIndex + 1} / {currentWords.length}
                </div>
              </>
            ) : (
              <div className="py-16 text-sm font-semibold text-slate-500">Chặng này chưa có dữ liệu từ vựng để luyện.</div>
            )}
          </div>
        </div>

        <div className="mt-6 flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 sm:p-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-sans text-sm font-black uppercase tracking-wide text-slate-700">Nhật ký luyện tập</h2>
            <span className="font-sans text-xs font-bold text-slate-400">
              {practiceMode === "sentence"
                ? `${sentenceResults.filter((result) => result.correct).length} đúng / ${sentenceResults.length} câu`
                : `${results.filter((result) => result.correct).length} đúng / ${results.length} từ`}
            </span>
          </div>
          {practiceMode === "sentence" ? sentenceResults.length > 0 ? (
            <ul className="no-scrollbar grid min-h-0 flex-1 content-start auto-rows-[70px] grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-4">
              {sentenceResults.map((result, index) => (
                <li
                  key={index}
                  className={`relative h-[70px] min-w-0 overflow-hidden rounded-xl border px-3 py-1.5 font-sans text-sm ${
                    result.correct ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-2 pr-10">
                    <span className="block min-w-0 truncate font-hanzi text-lg font-black leading-6">{result.hanzi}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 break-words pr-1 text-xs font-bold leading-3.5">{result.vietnamese}</p>
                  <span className="absolute right-3 top-3 whitespace-nowrap text-xs font-black uppercase">{result.correct ? "Đúng" : "Sai"}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="font-sans text-sm font-semibold text-slate-400">Chưa có câu nào được kiểm tra.</p>
          ) : results.length > 0 ? (
            <ul
              className="no-scrollbar grid min-h-0 flex-1 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-5"
              style={{ alignContent: "start", gridAutoRows: "64px" }}
            >
              {results.map((result, index) => (
                <li
                  key={index}
                  className={`h-16 min-h-16 max-h-16 min-w-0 self-start overflow-hidden flex items-center gap-2 rounded-xl border px-3 py-2.5 font-sans text-sm ${
                    result.correct ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"
                  }`}
                >
                  <span className="shrink-0 font-hanzi text-xl font-black">{result.chinese}</span>
                  <span className="min-w-0 flex-1 overflow-hidden flex flex-col leading-tight">
                    <span className="block truncate font-bold">{result.pinyin}</span>
                    <span className="truncate text-xs opacity-70">{result.meaningVi}</span>
                  </span>
                  <span className="ml-auto shrink-0 whitespace-nowrap text-xs font-black uppercase">{result.correct ? "Đúng" : "Sai"}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="font-sans text-sm font-semibold text-slate-400">Chưa có từ nào được kiểm tra.</p>
          )}
        </div>
          </section>
        </div>
      </main>
    </SiteLayout>
  );
}

function normalizeSentence(value: string) {
  return value.normalize("NFC").replace(/\s+/g, "").replace(/[，。！？、,.!?]/g, "");
}
