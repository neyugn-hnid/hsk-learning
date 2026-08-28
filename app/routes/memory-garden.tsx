import type { Route } from "./+types/memory-garden";
import { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router";
import { SiteLayout } from "~/components/Layout";
import { getUser } from "~/lib/auth.server";
import { prisma } from "~/lib/db.server";
import { sound } from "~/lib/sound";
import { addExpAndGems } from "~/lib/gamification";
import {
  loadSRSItems,
  saveSRSItems,
  reviewWordSRS,
  getTodayString,
  type SRSWordItem,
} from "~/lib/srs";
import { r2Asset } from "~/lib/assets";
import {
  Sun,
  Droplets,
  Volume2,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Compass,
  ChevronLeft,
  ChevronRight,
  Layers,
  Sparkles,
  X,
  Search,
  BookOpen,
} from "lucide-react";

// ============================================================================
// 1. LOADER & DATA TYPES
// ============================================================================

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getUser(request);

  let learnedVocabs: Array<{
    id: string;
    chinese: string;
    pinyin: string;
    meaningVi: string;
    level: string;
  }> = [];

  if (user) {
    const progresses = await prisma.userProgress.findMany({
      where: { userId: user.id, progress: { gt: 0 } },
      select: { lessonId: true },
    });

    const lessonIds = progresses.map((p) => p.lessonId);

    if (lessonIds.length > 0) {
      learnedVocabs = await prisma.vocabulary.findMany({
        where: { lessonId: { in: lessonIds } },
        select: {
          id: true,
          chinese: true,
          pinyin: true,
          meaningVi: true,
          level: true,
        },
      });
    }
  }

  return { user, learnedVocabs };
}

// Stage config for botanical representation
const STAGES = [
  { id: "seed", label: "Mầm Hạt", img: "/garden/stage_seed.jpg", border: "border-sky-200", badge: "bg-sky-50 text-sky-700" },
  { id: "sprout", label: "Cây Non", img: "/garden/stage_sprout.jpg", border: "border-emerald-200", badge: "bg-emerald-50 text-emerald-700" },
  { id: "bloom", label: "Hoa Nở", img: "/garden/stage_bloom.jpg", border: "border-rose-200", badge: "bg-rose-50 text-rose-700" },
  { id: "tree", label: "Đại Thụ", img: "/garden/stage_tree.jpg", border: "border-amber-200", badge: "bg-amber-50 text-amber-800" },
] as const;

function getStageMeta(stage: string) {
  return STAGES.find((s) => s.id === stage) || STAGES[0];
}

const ITEMS_PER_PAGE = 12;

// ============================================================================
// 2. MAIN COMPONENT
// ============================================================================

export default function MemoryGardenPage({ loaderData }: Route.ComponentProps) {
  const { user, learnedVocabs } = loaderData;

  const [items, setItems] = useState<SRSWordItem[]>([]);
  const [activeReviewWord, setActiveReviewWord] = useState<SRSWordItem | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [reviewQueue, setReviewQueue] = useState<SRSWordItem[]>([]);

  // Navigation & Filtering
  const [activeTab, setActiveTab] = useState<"today" | "all">("today");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);

  // Sync learned vocabulary into FSRS items
  useEffect(() => {
    const validWordMap = new Map((learnedVocabs || []).map((v) => [v.id, v]));
    const today = getTodayString();

    const validSRS = loadSRSItems().filter((item) => validWordMap.has(item.wordId));
    const existingMap = new Map(validSRS.map((e) => [e.wordId, e]));

    for (const v of learnedVocabs || []) {
      if (!existingMap.has(v.id)) {
        const newItem: SRSWordItem = {
          wordId: v.id,
          chinese: v.chinese,
          pinyin: v.pinyin,
          meaningVi: v.meaningVi,
          level: v.level || "HSK1",
          stage: "seed",
          repetition: 0,
          intervalDays: 1,
          easeFactor: 2.5,
          nextReviewDate: today,
          isThirsty: true,
        };
        validSRS.push(newItem);
        existingMap.set(v.id, newItem);
      }
    }

    saveSRSItems(validSRS);
    setItems(validSRS);
  }, [learnedVocabs]);

  // Derived metrics
  const thirstyWords = useMemo(() => items.filter((i) => i.isThirsty), [items]);

  const availableLevels = useMemo(() => {
    const set = new Set(items.map((i) => i.level || "HSK1"));
    return Array.from(set).sort();
  }, [items]);

  // Filtered plants
  const displayedItems = useMemo(() => {
    let res = activeTab === "today" ? thirstyWords : items;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      res = res.filter(
        (i) =>
          i.chinese.toLowerCase().includes(q) ||
          i.pinyin.toLowerCase().includes(q) ||
          i.meaningVi.toLowerCase().includes(q)
      );
    }

    if (activeTab === "all") {
      if (stageFilter !== "all") {
        res = res.filter((i) => i.stage === stageFilter);
      }
      if (levelFilter !== "all") {
        res = res.filter((i) => (i.level || "HSK1") === levelFilter);
      }
    }

    return res;
  }, [items, activeTab, thirstyWords, stageFilter, levelFilter, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(displayedItems.length / ITEMS_PER_PAGE) || 1;
  const paginatedItems = useMemo(() => {
    if (activeTab === "today") {
      return displayedItems.slice(0, 12);
    }
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return displayedItems.slice(start, start + ITEMS_PER_PAGE);
  }, [displayedItems, activeTab, currentPage]);

  // Start a watering session
  const startWateringSession = useCallback(
    (customQueue?: SRSWordItem[]) => {
      const queue =
        customQueue || (thirstyWords.length > 0 ? thirstyWords.slice(0, 10) : items.slice(0, 6));
      if (queue.length === 0) return;
      sound.playWoodblock();
      setReviewQueue(queue);
      setActiveReviewWord(queue[0]);
      setShowAnswer(false);
    },
    [thirstyWords, items]
  );

  // SRS Grading Handler
  const handleGrade = useCallback(
    (grade: number) => {
      if (!activeReviewWord) return;

      if (grade >= 3) {
        sound.playCorrect();
      } else {
        sound.playIncorrect();
      }

      const updated = reviewWordSRS(activeReviewWord, grade);
      const newItems = items.map((it) => (it.wordId === updated.wordId ? updated : it));
      setItems(newItems);
      saveSRSItems(newItems);
      addExpAndGems(20, 2);

      const remaining = reviewQueue.filter((q) => q.wordId !== activeReviewWord.wordId);
      setReviewQueue(remaining);

      if (remaining.length > 0) {
        setActiveReviewWord(remaining[0]);
        setShowAnswer(false);
      } else {
        setActiveReviewWord(null);
        sound.playLevelUp();
        sound.playCoin();
      }
    },
    [activeReviewWord, items, reviewQueue]
  );

  // TTS Pronunciation
  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "zh-CN";
    u.rate = 0.88;
    window.speechSynthesis.speak(u);
  }, []);

  // Keyboard Shortcuts for Flashcard Modal
  useEffect(() => {
    if (!activeReviewWord) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setShowAnswer((prev) => !prev);
      } else if (e.key === "v" || e.key === "V") {
        e.preventDefault();
        speak(activeReviewWord.chinese);
      } else if (showAnswer) {
        if (e.key === "1") handleGrade(1);
        if (e.key === "2") handleGrade(3);
        if (e.key === "3") handleGrade(5);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeReviewWord, showAnswer, handleGrade, speak]);

  return (
    <SiteLayout user={user} hideFooter>
      <div className="min-h-screen bg-gradient-to-b from-[#FAF8F5] via-[#F7F4EE] to-[#F2EDE4] px-4 py-6 sm:py-8 selection:bg-emerald-100 font-sans">
        <div className="mx-auto max-w-5xl space-y-6">

          {/* ========================================================================= */}
          {/* 1. GARDEN HERO SANCTUARY BILLBOARD                                        */}
          {/* ========================================================================= */}
          <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200/80 px-3 py-1 text-[11px] font-black text-amber-800 shadow-2xs">
                  <Sun size={13} className="text-amber-600" />
                  <span>3 Phút Mỗi Ngày · Lặp Lại Ngắt Quãng FSRS</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                  Vườn Cây Trí Tuệ
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 max-w-lg leading-relaxed font-medium">
                  {thirstyWords.length > 0 ? (
                    <span>
                      Hôm nay bạn có{" "}
                      <strong className="text-rose-600 font-black">{thirstyWords.length} cây</strong> đang
                      cần tưới nước để chống lãng quên.
                    </span>
                  ) : items.length > 0 ? (
                    <span className="text-emerald-700 font-bold">
                      Tuyệt vời! Tất cả cây trồng hôm nay đều đã no nước và phát triển xanh tốt.
                    </span>
                  ) : (
                    <span>Hãy học các bài học trên Bản Đồ để gieo mầm những từ vựng đầu tiên nhé!</span>
                  )}
                </p>
              </div>

              {/* Quick Action Button */}
              {items.length > 0 && (
                <div className="shrink-0">
                  <button
                    type="button"
                    onClick={() => startWateringSession()}
                    className="flex items-center justify-center gap-2.5 rounded-2xl bg-sky-600 px-6 py-3.5 text-sm font-black text-white shadow-md shadow-sky-600/20 transition-all hover:bg-sky-700 active:scale-95 cursor-pointer group"
                  >
                    <Droplets className="h-5 w-5 text-white fill-white group-hover:scale-110 transition-transform" />
                    <span>
                      {thirstyWords.length > 0
                        ? `Tưới Nước (${thirstyWords.length} Cây)`
                        : "Ôn Tập Nhanh"}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 2. BOTANICAL PROGRESS METRICS                                             */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {STAGES.map((st) => {
              const count = items.filter((i) => i.stage === st.id).length;
              return (
                <div
                  key={st.id}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs transition-all hover:border-slate-300"
                >
                  <img
                    src={r2Asset(st.img)}
                    alt={st.label}
                    className="h-11 w-11 shrink-0 rounded-xl object-contain bg-white shadow-2xs border border-slate-100 p-0.5"
                  />
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-slate-400 block truncate uppercase">
                      {st.label}
                    </span>
                    <p className="text-base font-black text-slate-900">
                      {count} <span className="text-[11px] font-normal text-slate-400">cây</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ========================================================================= */}
          {/* 3. GARDEN CONTENT AREA & FILTER CONTROL                                   */}
          {/* ========================================================================= */}
          {items.length === 0 ? (
            <div className="rounded-3xl border border-slate-200/80 bg-white p-8 sm:p-12 text-center shadow-xs space-y-5">
              <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-3xl bg-lime-50 border border-lime-200 p-2 shadow-2xs">
                <img
                  src={r2Asset("/garden/stage_seed.jpg")}
                  alt="Khu vườn trống"
                  className="h-full w-full object-contain rounded-2xl animate-pulse"
                />
              </div>

              <div className="space-y-2 max-w-md mx-auto">
                <h3 className="text-lg sm:text-xl font-black text-slate-900">
                  Khu Vườn Đang Chờ Mầm Cây Đầu Tiên
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                  Bạn chưa có từ vựng nào trong vườn. Hãy bắt đầu học các bài học tại Lộ Trình Học Tập để
                  gieo những mầm cây đầu tiên nhé!
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-7 shadow-xs space-y-5">
              {/* Filter & View Toolbar */}
              <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 lg:flex-row lg:items-center lg:justify-between">
                {/* Mode Tabs: Today vs All */}
                <div className="flex items-center gap-2 bg-slate-100/90 p-1 rounded-2xl w-fit">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("today");
                      setCurrentPage(1);
                    }}
                    className={`flex items-center gap-1.5 px-4 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
                      activeTab === "today"
                        ? "bg-sky-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Droplets size={13} className="fill-current" />
                    <span>Cần Tưới ({thirstyWords.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("all");
                      setCurrentPage(1);
                    }}
                    className={`flex items-center gap-1.5 px-4 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
                      activeTab === "all"
                        ? "bg-slate-900 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Layers size={13} />
                    <span>Toàn Bộ Vườn ({items.length})</span>
                  </button>
                </div>

                {/* Sub-Filters & Search Bar */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-3.5 w-3.5" />
                    <input
                      type="text"
                      placeholder="Tìm từ vựng..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-36 sm:w-44 rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-200"
                    />
                  </div>

                  {/* Stage Dropdown */}
                  {activeTab === "all" && (
                    <>
                      <select
                        value={stageFilter}
                        onChange={(e) => {
                          setStageFilter(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer focus:outline-hidden"
                      >
                        <option value="all">Mọi giai đoạn</option>
                        <option value="seed">Mầm hạt</option>
                        <option value="sprout">Cây non</option>
                        <option value="bloom">Hoa nở</option>
                        <option value="tree">Đại thụ</option>
                      </select>

                      {/* Level Dropdown */}
                      {availableLevels.length > 1 && (
                        <select
                          value={levelFilter}
                          onChange={(e) => {
                            setLevelFilter(e.target.value);
                            setCurrentPage(1);
                          }}
                          className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer focus:outline-hidden"
                        >
                          <option value="all">Mọi cấp độ</option>
                          {availableLevels.map((lvl) => (
                            <option key={lvl} value={lvl}>
                              {lvl}
                            </option>
                          ))}
                        </select>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Plant Cards Grid */}
              {paginatedItems.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                    <CheckCircle2 size={32} />
                  </div>
                  <h4 className="text-base font-black text-slate-900">
                    {activeTab === "today"
                      ? "Đã Chăm Sóc Xong Toàn Bộ Cây Hôm Nay!"
                      : "Không Tìm Thấy Cây Trồng Phù Hợp"}
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    {activeTab === "today"
                      ? "Tất cả mầm cây đều đã đủ nước. Hãy quay lại vào ngày mai để tiếp tục chăm sóc nhé!"
                      : "Hãy thử kiểm tra lại từ khóa tìm kiếm hoặc đổi bộ lọc bên trên."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {paginatedItems.map((word) => {
                    const meta = getStageMeta(word.stage);

                    return (
                      <button
                        key={word.wordId}
                        type="button"
                        onClick={() => startWateringSession([word])}
                        className={`group relative flex flex-col items-center justify-between rounded-2xl border-2 p-3 text-center transition-all cursor-pointer hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] ${
                          word.isThirsty
                            ? "border-sky-300 bg-sky-50/60 ring-2 ring-sky-300/40"
                            : "border-slate-100 bg-slate-50/70 hover:border-emerald-300 hover:bg-emerald-50/30"
                        }`}
                      >
                        {/* Thirsty Droplet Animation */}
                        {word.isThirsty && (
                          <span
                            className="absolute top-2 right-2 flex items-center justify-center animate-bounce"
                            title="Cần tưới nước"
                          >
                            <Droplets size={17} className="text-sky-500 fill-sky-400 drop-shadow-xs" />
                          </span>
                        )}

                        {/* Botanical Image Art */}
                        <div className="relative flex h-20 w-20 items-center justify-center my-1 rounded-xl bg-white shadow-2xs border border-slate-200/80 p-1">
                          <img
                            src={r2Asset(meta.img)}
                            alt={word.chinese}
                            className="h-full w-full object-contain rounded-lg transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                          />
                        </div>

                        {/* Nameplate */}
                        <div className="w-full space-y-0.5 pt-1">
                          <div className="font-hanzi text-base font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                            {word.chinese}
                          </div>
                          <div className="font-mono text-[11px] font-bold text-slate-400 truncate">
                            {word.pinyin}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Pagination Controls */}
              {activeTab === "all" && totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-bold text-slate-600">
                  <span>
                    Trang {currentPage} / {totalPages} ({displayedItems.length} cây)
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <ChevronLeft size={14} />
                      <span>Trước</span>
                    </button>
                    <button
                      type="button"
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className="flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <span>Sau</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* 4. WATERING FLASHCARD & SRS REVIEW MODAL                                   */}
        {/* ========================================================================= */}
        {activeReviewWord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md animate-in fade-in duration-200">
            <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 text-center shadow-2xl animate-in zoom-in-95 duration-200 space-y-5">
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setActiveReviewWord(null)}
                className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-2xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>

              {/* Plant Visual */}
              <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-3xl bg-white shadow-md border border-slate-200 p-2">
                <img
                  src={r2Asset(getStageMeta(activeReviewWord.stage).img)}
                  alt={activeReviewWord.chinese}
                  className="h-full w-full object-contain rounded-2xl animate-in zoom-in-95 duration-200"
                />
              </div>

              {/* Chinese Flashcard Prompt */}
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-3">
                  <span className="font-hanzi text-5xl sm:text-6xl font-black text-slate-900">
                    {activeReviewWord.chinese}
                  </span>
                  <button
                    type="button"
                    onClick={() => speak(activeReviewWord.chinese)}
                    className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-600 border border-slate-200 transition-colors cursor-pointer"
                    title="Nghe phát âm (Phím V)"
                  >
                    <Volume2 size={20} />
                  </button>
                </div>

                {showAnswer ? (
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-1 animate-in fade-in duration-150">
                    <p className="font-mono text-xl font-bold text-rose-600">
                      {activeReviewWord.pinyin}
                    </p>
                    <p className="font-sans text-base font-bold text-slate-800">
                      {activeReviewWord.meaningVi}
                    </p>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowAnswer(true)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Lật Thẻ Xem Nghĩa & Pinyin
                  </button>
                )}
              </div>

              {/* 3 SRS Review Rating Buttons */}
              {showAnswer && (
                <div className="space-y-2 animate-in fade-in duration-200">
                  <div className="grid grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleGrade(1)}
                      className="flex flex-col items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 py-3.5 text-rose-700 hover:bg-rose-100 active:scale-95 transition-all cursor-pointer"
                    >
                      <AlertCircle size={18} />
                      <span className="mt-1 text-xs font-black">Chưa Thuộc</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleGrade(3)}
                      className="flex flex-col items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 py-3.5 text-amber-800 hover:bg-amber-100 active:scale-95 transition-all cursor-pointer"
                    >
                      <RotateCcw size={18} />
                      <span className="mt-1 text-xs font-black">Nhớ Tạm</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleGrade(5)}
                      className="flex flex-col items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 py-3.5 text-emerald-800 hover:bg-emerald-100 active:scale-95 transition-all cursor-pointer"
                    >
                      <CheckCircle2 size={18} />
                      <span className="mt-1 text-xs font-black">Nhớ Rất Rõ</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
