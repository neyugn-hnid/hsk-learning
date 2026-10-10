import type { Route } from "./+types/hanzi-writing";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFetcher } from "react-router";
import { BookOpen, ChevronDown, ChevronLeft, ChevronRight, Check, Map as MapIcon, Volume2 } from "lucide-react";
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

type SentencePracticeItem = {
  lesson: number;
  vietnamese: string;
  hanzi: string;
  pinyin: string;
  vocabulary: { hanzi: string; pinyin: string; meaning: string }[];
};

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
      where: { status: "PUBLISHED", source: { in: ["HSK20", "HSK30"] } },
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

function compareHskLevels(first: string, second: string) {
  const firstNumber = Number(first.match(/\d+/)?.[0] || Number.POSITIVE_INFINITY);
  const secondNumber = Number(second.match(/\d+/)?.[0] || Number.POSITIVE_INFINITY);
  return firstNumber - secondNumber || first.localeCompare(second);
}

type SourceOption = {
  value: string;
  label: string;
  count: number;
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
  const selected = groups.flatMap((group) => group.options).find((option) => option.value === value);
  const selectedGroup = groups.find((group) => group.options.some((option) => option.value === value));

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
        className={`flex min-h-14 w-full items-center justify-between gap-3 rounded-2xl border bg-white px-4 py-2.5 text-left shadow-sm outline-none transition ${
          open ? "border-red-400 ring-4 ring-red-100" : "border-slate-200 hover:border-slate-300"
        }`}
      >
        <span className="flex min-w-0 items-center gap-3">
          {selectedGroup ? <selectedGroup.icon size={19} className="shrink-0 text-red-500" /> : null}
          <span className="min-w-0">
            <span className="block truncate text-sm font-black text-slate-800">{selected?.label || "Chọn nguồn dữ liệu"}</span>
            <span className="mt-0.5 block text-[11px] font-bold uppercase tracking-wide text-slate-400">{selectedGroup?.label || "Nguồn dữ liệu"}</span>
          </span>
        </span>
        <ChevronDown size={18} className={`shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div role="listbox" className="absolute left-0 right-0 top-full z-[100] mt-2 max-h-[min(20rem,calc(100vh-8rem))] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/10">
          {groups.map((group) => {
            const GroupIcon = group.icon;
            if (group.options.length === 0) return null;
            return (
              <div key={group.label} className="not-first:mt-2">
                <div className="flex items-center gap-2 px-3 pb-1.5 pt-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                  <GroupIcon size={13} />
                  {group.label}
                </div>
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
                        setOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition ${
                        isSelected ? "bg-red-50 font-black text-red-700" : "font-semibold text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span>{option.label}</span>
                      <span className={`text-[11px] font-bold ${isSelected ? "text-red-400" : "text-slate-400"}`}>{option.count} từ</span>
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
    const roadmapLevels = [...new Set(
      items.filter((item) => item.source === "roadmap").map((item) => item.level),
    )].sort(compareHskLevels);
    const lessonLevels = [...new Set(
      items
        .filter((item) => item.source === "lesson")
        .map((item) => `${item.sourceType}:${item.level}`),
    )].sort((first, second) => compareHskLevels(first.split(":")[1], second.split(":")[1]));

    return {
      roadmapLevels,
      lessonLevels,
    };
  }, [items]);
  const sourceGroups = useMemo(() => [
    {
      label: "Lộ trình",
      icon: MapIcon,
      options: selections.roadmapLevels.map((level) => ({
        value: `roadmap:${level}`,
        label: level,
        count: uniqueWritingWords(
          items
            .filter((item) => item.source === "roadmap" && item.level === level)
            .flatMap((item) => item.vocabulary),
        ).length,
      })),
    },
    {
      label: "HSK 2.0",
      icon: BookOpen,
      options: selections.lessonLevels
        .filter((value) => value.startsWith("HSK20:"))
        .map((value) => {
          const level = value.replace("HSK20:", "");
          return {
            value: `lesson:${value}`,
            label: level,
            count: items.filter((item) => item.source === "lesson" && item.sourceType === "HSK20" && item.level === level).reduce((total, item) => total + item.vocabulary.length, 0),
          };
        }),
    },
    {
      label: "HSK 3.0",
      icon: BookOpen,
      options: selections.lessonLevels
        .filter((value) => value.startsWith("HSK30:"))
        .map((value) => {
          const level = value.replace("HSK30:", "");
          return {
            value: `lesson:${value}`,
            label: level,
            count: items.filter((item) => item.source === "lesson" && item.sourceType === "HSK30" && item.level === level).reduce((total, item) => total + item.vocabulary.length, 0),
          };
        }),
    },
  ], [items, selections]);
  const firstSelection = selections.roadmapLevels[0]
    ? `roadmap:${selections.roadmapLevels[0]}`
    : selections.lessonLevels[0]
      ? `lesson:${selections.lessonLevels[0]}`
      : "";
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
  const [sentenceResults, setSentenceResults] = useState<{ hanzi: string; vietnamese: string; correct: boolean }[]>(loaderData.sentenceProgress.results as { hanzi: string; vietnamese: string; correct: boolean }[]);

  const words = useMemo(() => {
    return uniqueWritingWords(
      items
        .filter((item) => {
          const itemSelection = item.source === "roadmap"
            ? `roadmap:${item.level}`
            : `lesson:${item.sourceType}:${item.level}`;
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
    setSentenceAnswer("");
    setSentenceCorrect(null);
  }, [sentenceIndex]);

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
    if (!currentSentence || !sentenceAnswer.trim()) return;
    const correct = normalizeSentence(sentenceAnswer) === normalizeSentence(currentSentence.hanzi);
    setSentenceCorrect(correct);
    if (correct) sound.playCorrect();
    else sound.playIncorrect();
    setSentenceResults((prev) => [
      { hanzi: currentSentence.hanzi, vietnamese: currentSentence.vietnamese, correct },
      ...prev,
    ]);
  };

  const checkAnswer = () => {
    if (!currentWord || !answer.trim()) return;
    const correct = practiceMode === "hanzi"
      ? answer.trim() === currentWord.chinese
      : (() => {
          const normalizedAnswer = normalizeMeaning(answer);
          const normalizedExpected = normalizeMeaning(currentWord.meaningVi);
          return normalizedAnswer === normalizedExpected
            || normalizedExpected.includes(normalizedAnswer)
            || normalizedAnswer.includes(normalizedExpected);
        })();
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
      }, 500);
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
      }, 500);
    }
  };

  return (
    <SiteLayout user={user}>
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="relative z-[60] mb-6 grid gap-5 sm:flex sm:items-end sm:justify-between sm:gap-6">
          <div className="min-w-0">
            <p className="font-sans text-[11px] font-black uppercase tracking-[0.16em] text-red-600 sm:text-xs sm:tracking-[0.2em]">Lộ trình HSK</p>
            <h1 className="mt-1 font-sans text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Luyện chữ Hán</h1>
            <p className="mt-1 max-w-xl font-sans text-sm font-medium leading-5 text-slate-500">Ôn chữ Hán từ lộ trình và bài học HSK 2.0, 3.0.</p>
          </div>
          <div className="w-full min-w-0 sm:w-auto sm:max-w-[22rem] sm:flex-1 lg:max-w-xs">
            <label className="mb-1.5 block font-sans text-xs font-bold text-slate-500">
              Chọn nguồn dữ liệu
            </label>
            <SourceSelect value={selectedSource} groups={sourceGroups} onChange={setSelectedSource} />
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
                      value={sentenceAnswer}
                      onChange={(event) => {
                        setSentenceAnswer(event.target.value);
                        setSentenceCorrect(null);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") checkSentenceAnswer();
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

                  <div className="mt-5 flex items-center justify-center gap-1.5 sm:gap-2.5">
                    <button
                      type="button"
                      onClick={() => setSentenceIndex((index) => Math.max(0, index - 1))}
                      disabled={sentenceIndex === 0}
                      className="flex min-h-10 min-w-0 flex-1 items-center justify-center gap-1 rounded-2xl border border-slate-200 bg-white px-2 py-2 font-sans text-xs font-bold text-slate-700 shadow-2xs transition-all hover:bg-slate-50 disabled:opacity-50 sm:min-h-12 sm:flex-none sm:gap-2 sm:px-5 sm:py-3 sm:text-sm"
                    >
                      <ChevronLeft size={16} /> <span>Trước</span>
                    </button>
                    <button
                      type="button"
                      onClick={checkSentenceAnswer}
                      aria-label="Kiểm tra câu dịch"
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-600 text-white shadow-md shadow-red-500/20 transition-all hover:bg-red-700 sm:h-12 sm:w-12"
                    >
                      <Check size={20} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSentenceIndex((index) => Math.min(index + 1, sentenceItems.length - 1))}
                      disabled={sentenceIndex >= sentenceItems.length - 1}
                      className="flex min-h-10 min-w-0 flex-1 flex-row-reverse items-center justify-center gap-1 rounded-2xl border border-slate-200 bg-white px-2 py-2 font-sans text-xs font-bold text-slate-700 shadow-2xs transition-all hover:bg-slate-50 disabled:opacity-50 sm:min-h-12 sm:flex-none sm:gap-2 sm:px-5 sm:py-3 sm:text-sm"
                    >
                      <ChevronRight size={16} /> <span>Tiếp</span>
                    </button>
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
                      value={answer}
                      onChange={(event) => {
                        setAnswer(event.target.value);
                        setIsCorrect(null);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") checkAnswer();
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

                <div className="mt-5 flex items-center justify-center gap-1.5 sm:gap-2.5">
                  <button
                    type="button"
                    onClick={() => goToWord(wordIndex - 1)}
                    disabled={wordIndex === 0}
                    className="flex min-h-10 min-w-0 flex-1 cursor-pointer items-center justify-center gap-1 rounded-2xl border border-slate-200 bg-white px-2 py-2 font-sans text-xs font-bold text-slate-700 shadow-2xs transition-all hover:bg-slate-50 disabled:opacity-50 sm:min-h-12 sm:flex-none sm:gap-2 sm:px-5 sm:py-3 sm:text-sm"
                  >
                    <ChevronLeft size={16} /> <span>Trước</span>
                  </button>
                  <button
                    type="button"
                    onClick={checkAnswer}
                    className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-red-600 text-white shadow-md shadow-red-500/20 transition-all hover:bg-red-700 disabled:opacity-50 sm:h-12 sm:w-12"
                    aria-label="Kiểm tra đáp án"
                  >
                    <Check size={20} />
                  </button>
                  <button
                    type="button"
                    onClick={() => goToWord(wordIndex + 1)}
                    disabled={wordIndex >= currentWords.length - 1}
                    className="flex min-h-10 min-w-0 flex-1 cursor-pointer flex-row-reverse items-center justify-center gap-1 rounded-2xl border border-slate-200 bg-white px-2 py-2 font-sans text-xs font-bold text-slate-700 shadow-2xs transition-all hover:bg-slate-50 disabled:opacity-50 sm:min-h-12 sm:flex-none sm:gap-2 sm:px-5 sm:py-3 sm:text-sm"
                  >
                    <ChevronRight size={16} /> <span>Tiếp</span>
                  </button>
                </div>

                <div className="mt-4 flex items-center justify-center gap-2 font-sans text-xs font-bold text-slate-400">
                  Từ {wordIndex + 1} / {currentWords.length}
                </div>
              </>
            ) : (
              <div className="py-16 text-sm font-semibold text-slate-500">Chặng này chưa có dữ liệu từ vựng để luyện.</div>
            )}
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 sm:p-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-sans text-sm font-black uppercase tracking-wide text-slate-700">Nhật ký luyện tập</h2>
            <span className="font-sans text-xs font-bold text-slate-400">
              {practiceMode === "sentence"
                ? `${sentenceResults.filter((result) => result.correct).length} đúng / ${sentenceResults.length} câu`
                : `${results.filter((result) => result.correct).length} đúng / ${results.length} từ`}
            </span>
          </div>
          {practiceMode === "sentence" ? sentenceResults.length > 0 ? (
            <ul className="grid max-h-[17rem] grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
              {sentenceResults.map((result, index) => (
                <li
                  key={index}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2 font-sans text-sm ${
                    result.correct ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"
                  }`}
                >
                  <span className="font-hanzi text-xl font-black">{result.hanzi}</span>
                  <span className="min-w-0 flex-1 truncate text-xs font-bold">{result.vietnamese}</span>
                  <span className="text-xs font-black uppercase">{result.correct ? "Đúng" : "Sai"}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="font-sans text-sm font-semibold text-slate-400">Chưa có câu nào được kiểm tra.</p>
          ) : results.length > 0 ? (
            <ul className="grid max-h-[17rem] grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((result, index) => (
                <li
                  key={index}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2 font-sans text-sm ${
                    result.correct ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"
                  }`}
                >
                  <span className="font-hanzi text-xl font-black">{result.chinese}</span>
                  <span className="min-w-0 flex flex-col leading-tight">
                    <span className="font-bold">{result.pinyin}</span>
                    <span className="truncate text-xs opacity-70">{result.meaningVi}</span>
                  </span>
                  <span className="ml-auto text-xs font-black uppercase">{result.correct ? "Đúng" : "Sai"}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="font-sans text-sm font-semibold text-slate-400">Chưa có từ nào được kiểm tra.</p>
          )}
        </div>
      </main>
    </SiteLayout>
  );
}

function normalizeSentence(value: string) {
  return value.normalize("NFC").replace(/\s+/g, "").replace(/[，。！？、,.!?]/g, "");
}