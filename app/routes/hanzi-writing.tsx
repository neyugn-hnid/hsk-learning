import type { Route } from "./+types/hanzi-writing";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Check, Volume2, RotateCcw } from "lucide-react";
import { SiteLayout } from "~/components/Layout";
import { requireUser } from "~/lib/auth.server";
import { prisma } from "~/lib/db.server";
import { sound } from "~/lib/sound";

type WritingWord = {
  chinese: string;
  pinyin: string;
  meaningVi: string;
};

type RoadmapSource = {
  id: string;
  title: string;
  phase: string;
  orderNo: number;
  vocabulary: unknown;
};

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireUser(request);
  const items = await prisma.roadmapItem.findMany({
    select: { id: true, title: true, phase: true, orderNo: true, vocabulary: true },
    orderBy: [{ phase: "asc" }, { orderNo: "asc" }],
  });

  return {
    user,
    items: items.map((item) => ({
      ...item,
      vocabulary: toWritingWords(item.vocabulary),
    })),
  };
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

export default function HanziWriting({ loaderData }: Route.ComponentProps) {
  const { user, items } = loaderData;
  const [selectedItemId, setSelectedItemId] = useState(items[0]?.id || "");
  const [wordIndex, setWordIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [showPinyin, setShowPinyin] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [results, setResults] = useState<{ chinese: string; pinyin: string; meaningVi: string; correct: boolean }[]>([]);

  const selectedItem = items.find((item) => item.id === selectedItemId) || items[0];
  const words = useMemo(() => {
    const unique = new Map<string, WritingWord>();
    for (const word of selectedItem?.vocabulary || []) {
      if (!unique.has(word.chinese)) unique.set(word.chinese, word);
    }
    return [...unique.values()];
  }, [selectedItem]);
  const currentWord = words[wordIndex];
  useEffect(() => {
    setWordIndex(0);
    setAnswer("");
    setShowPinyin(false);
    setIsCorrect(null);
    setResults([]);
  }, [selectedItemId]);

  useEffect(() => {
    setAnswer("");
    setShowPinyin(false);
    setIsCorrect(null);
  }, [wordIndex]);

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
    setWordIndex(Math.max(0, Math.min(nextIndex, words.length - 1)));
  };

  const speak = () => {
    if (!currentWord || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(currentWord.chinese);
    utterance.lang = "zh-CN";
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  };

  const checkAnswer = () => {
    if (!currentWord || !answer.trim()) return;
    const correct = answer.trim() === currentWord.chinese;
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
    if (wordIndex < words.length - 1) {
      window.setTimeout(() => {
        setWordIndex((index) => index + 1);
      }, 500);
    }
  };

  return (
    <SiteLayout user={user}>
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-sans text-xs font-black uppercase tracking-[0.2em] text-red-600">Lộ trình HSK</p>
            <h1 className="mt-1 font-sans text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Luyện chữ Hán</h1>
            <p className="mt-1 font-sans text-sm font-medium text-slate-500">Ôn từng chữ trong các bài học bạn đã mở.</p>
          </div>
          <label className="font-sans text-xs font-bold text-slate-500">
            Chọn chặng học
            <select
              value={selectedItemId}
              onChange={(event) => setSelectedItemId(event.target.value)}
              className="mt-1 block w-full min-w-56 rounded-xl border border-slate-200 bg-white px-3 py-2 font-sans text-sm font-bold text-slate-700 outline-none focus:border-red-400"
            >
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.phase} · {item.title}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-red-50 to-amber-50 p-3 sm:rounded-[2rem] sm:p-6">
          <div className="relative mx-auto max-w-3xl overflow-hidden rounded-2xl bg-white p-4 pt-10 text-center shadow-md sm:rounded-[2rem] sm:p-8 sm:pt-14">
            {currentWord ? (
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

                <p className="font-sans text-5xl font-black tracking-wide text-slate-400 sm:text-6xl">{showPinyin ? currentWord.pinyin : "?"}</p>
                <p className="mt-2 font-sans text-base font-bold text-slate-600 sm:text-lg">{currentWord.meaningVi}</p>

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
                    placeholder="Nhập chữ Hán..."
                    aria-label="Nhập chữ Hán"
                    className={`input-hanzi w-full rounded-2xl border px-4 py-3 font-hanzi text-3xl font-bold outline-none transition ${
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

                <div className="mt-5 flex items-center justify-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => goToWord(wordIndex - 1)}
                    disabled={wordIndex === 0}
                    className="flex min-h-10 cursor-pointer items-center justify-center gap-1 rounded-2xl border border-slate-200 bg-white px-3 py-2 font-sans text-xs font-bold text-slate-700 shadow-2xs transition-all hover:bg-slate-50 disabled:opacity-50 sm:min-h-12 sm:gap-2 sm:px-5 sm:py-3 sm:text-sm"
                  >
                    <ChevronLeft size={16} /> <span>Trước</span>
                  </button>
                  <button
                    type="button"
                    onClick={checkAnswer}
                    className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-red-600 text-white shadow-md shadow-red-500/20 transition-all hover:bg-red-700 disabled:opacity-50 sm:h-12 sm:w-12"
                    aria-label="Kiểm tra đáp án"
                  >
                    <Check size={20} />
                  </button>
                  <button
                    type="button"
                    onClick={() => goToWord(wordIndex + 1)}
                    disabled={wordIndex >= words.length - 1}
                    className="flex min-h-10 cursor-pointer flex-row-reverse items-center justify-center gap-1 rounded-2xl border border-slate-200 bg-white px-3 py-2 font-sans text-xs font-bold text-slate-700 shadow-2xs transition-all hover:bg-slate-50 disabled:opacity-50 sm:min-h-12 sm:gap-2 sm:px-5 sm:py-3 sm:text-sm"
                  >
                    <ChevronRight size={16} /> <span>Tiếp</span>
                  </button>
                </div>

                <div className="mt-4 flex items-center justify-center gap-2 font-sans text-xs font-bold text-slate-400">
                  <RotateCcw size={13} /> Từ {wordIndex + 1} / {words.length}
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
              {results.filter((r) => r.correct).length} đúng / {results.length} từ
            </span>
          </div>
          {results.length > 0 ? (
            <ul className="grid max-h-[17rem] grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((result, index) => (
                <li
                  key={index}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2 font-sans text-sm ${
                    result.correct ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"
                  }`}
                >
                  <span className="font-hanzi text-xl font-black">{result.chinese}</span>
                  <span className="flex flex-col leading-tight">
                    <span className="font-bold">{result.pinyin}</span>
                    <span className="text-xs opacity-70">{result.meaningVi}</span>
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