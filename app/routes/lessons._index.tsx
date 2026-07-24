import type { Route } from "./+types/lessons._index";
import { Link, useSearchParams } from "react-router";
import {
  Search,
  BookOpen,
  Sparkles,
  ArrowRight,
  ChevronLeft,
  Layers,
  GraduationCap,
  X,
  Flame,
  CheckCircle2,
  BookMarked,
  Filter,
} from "lucide-react";
import { SiteLayout } from "~/components/Layout";
import { requireUser } from "~/lib/auth.server";
import { prisma } from "~/lib/db.server";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireUser(request);
  const url = new URL(request.url);
  const source = url.searchParams.get("source") || "HSK20";
  const level = url.searchParams.get("level") || "";
  const q = url.searchParams.get("q") || "";

  const [lessons, lessonsForStats] = await Promise.all([
    prisma.lesson.findMany({
      where: {
        status: "PUBLISHED",
        source,
        ...(level ? { level } : {}),
        ...(q ? { title: { contains: q, mode: "insensitive" as const } } : {}),
      },
      include: {
        _count: { select: { vocabularies: true } },
        vocabularies: { take: 3, orderBy: { createdAt: "asc" } },
      },
      orderBy: [{ level: "asc" }, { orderNo: "asc" }],
    }),
    prisma.lesson.findMany({
      where: { status: "PUBLISHED", source },
      select: {
        level: true,
        _count: { select: { vocabularies: true } },
        vocabularies: {
          where: { imageUrl: { not: null } },
          take: 3,
          orderBy: { createdAt: "asc" },
          select: { imageUrl: true },
        },
      },
      orderBy: [{ level: "asc" }, { orderNo: "asc" }],
    }),
  ]);

  const statsByLevel = new Map<
    string,
    { level: string; lessonCount: number; wordCount: number; sampleImages: string[] }
  >();

  for (const lesson of lessonsForStats) {
    const stat =
      statsByLevel.get(lesson.level) ||
      { level: lesson.level, lessonCount: 0, wordCount: 0, sampleImages: [] };

    stat.lessonCount += 1;
    stat.wordCount += lesson._count.vocabularies;

    for (const vocab of lesson.vocabularies) {
      if (vocab.imageUrl && stat.sampleImages.length < 3) {
        stat.sampleImages.push(vocab.imageUrl);
      }
    }

    statsByLevel.set(lesson.level, stat);
  }

  const levels = [...statsByLevel.keys()];
  const levelStats = [...statsByLevel.values()];

  const totalLessonsInSource = levelStats.reduce(
    (acc, curr) => acc + curr.lessonCount,
    0
  );
  const totalWordsInSource = levelStats.reduce(
    (acc, curr) => acc + curr.wordCount,
    0
  );

  return {
    user,
    lessons,
    levels,
    levelStats,
    source,
    level,
    q,
    totalLessonsInSource,
    totalWordsInSource,
  };
}

// Color schemes and default cover images for levels
const LEVEL_STYLES: Record<
  string,
  { bg: string; border: string; text: string; badge: string; gradient: string; defaultImage: string }
> = {
  
  "HSK1": {
    bg: "bg-sky-50 hover:bg-sky-100/60",
    border: "border-sky-200 hover:border-sky-400",
    text: "text-sky-700",
    badge: "bg-sky-500 text-white",
    gradient: "from-sky-600 to-blue-700",
    defaultImage: "/images/hsk1.png",
  },
  "HSK2": {
    bg: "bg-emerald-50 hover:bg-emerald-100/60",
    border: "border-emerald-200 hover:border-emerald-400",
    text: "text-emerald-700",
    badge: "bg-emerald-500 text-white",
    gradient: "from-emerald-600 to-teal-700",
    defaultImage: "/images/hsk2.png",
  },
  "HSK3": {
    bg: "bg-indigo-50 hover:bg-indigo-100/60",
    border: "border-indigo-200 hover:border-indigo-400",
    text: "text-indigo-700",
    badge: "bg-indigo-500 text-white",
    gradient: "from-indigo-600 to-violet-700",
    defaultImage: "/images/hsk3.png",
  },
  "HSK4": {
    bg: "bg-amber-50 hover:bg-amber-100/60",
    border: "border-amber-200 hover:border-amber-400",
    text: "text-amber-700",
    badge: "bg-amber-500 text-white",
    gradient: "from-amber-500 to-orange-600",
    defaultImage: "/images/hsk4.png",
  },
  "HSK5": {
    bg: "bg-rose-50 hover:bg-rose-100/60",
    border: "border-rose-200 hover:border-rose-400",
    text: "text-rose-700",
    badge: "bg-rose-500 text-white",
    gradient: "from-rose-600 to-red-700",
    defaultImage: "/images/hsk_advanced.png",
  },
  "HSK6": {
    bg: "bg-purple-50 hover:bg-purple-100/60",
    border: "border-purple-200 hover:border-purple-400",
    text: "text-purple-700",
    badge: "bg-purple-600 text-white",
    gradient: "from-purple-600 to-fuchsia-700",
    defaultImage: "/images/hsk_advanced.png",
  },
};

const LESSON_COVER_FALLBACKS = [
  "/images/hsk1.png",
  "/images/hsk2.png",
  "/images/hsk3.png",
  "/images/hsk4.png",
  "/images/hsk_intermediate.png",
  "/images/hsk_advanced.png",
];

function getLevelStyle(lvl: string) {
  const normalized = lvl.trim();
  if (LEVEL_STYLES[normalized]) return LEVEL_STYLES[normalized];
  return {
    bg: "bg-red-50 hover:bg-red-100/60",
    border: "border-red-200 hover:border-red-400",
    text: "text-red-700",
    badge: "bg-red-600 text-white",
    gradient: "from-red-600 to-rose-700",
    defaultImage: "/images/hsk_advanced.png",
  };
}

export default function Lessons({ loaderData }: Route.ComponentProps) {
  const [params, setParams] = useSearchParams();
  const {
    lessons,
    levels,
    levelStats,
    source,
    level,
    q,
    totalLessonsInSource,
    totalWordsInSource,
  } = loaderData;

  const setSource = (s: string) => {
    const next = new URLSearchParams(params);
    next.set("source", s);
    next.delete("level");
    setParams(next);
  };

  const setLevel = (lvl: string) => {
    const next = new URLSearchParams(params);
    lvl ? next.set("level", lvl) : next.delete("level");
    setParams(next);
  };

  const clearSearch = () => {
    const next = new URLSearchParams(params);
    next.delete("q");
    setParams(next);
  };

  const showAll = !level;

  return (
    <SiteLayout user={loaderData.user}>
      {/* Dynamic Background Wrapper */}
      <div className="min-h-screen bg-slate-50/50 pb-16">
        {/* Ultra Modern Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-rose-950 to-slate-950 text-white py-12 md:py-20 px-4">
          {/* Subtle Calligraphy Watermark Background */}
          <div className="absolute left-8 top-1/2 -translate-y-1/2 text-9xl font-black text-white/[0.03] select-none pointer-events-none tracking-widest hidden lg:block">
            汉语水平考试
          </div>

          {/* Ambient Glow Orbs */}
          <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-rose-600/25 blur-3xl pointer-events-none" />
          <div className="absolute right-10 bottom-0 h-96 w-96 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none" />

          <div className="relative mx-auto max-w-7xl">
            <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
              {/* Left Column: Headline, Stats & Search */}
              <div className="lg:col-span-7">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold text-rose-200 backdrop-blur border border-white/15 shadow-inner">
                  <Sparkles size={15} className="text-amber-400 animate-pulse" />
                  <span>Hệ Thống Học Từ Vựng HSK Chuẩn Hóa</span>
                </div>

                <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl leading-tight">
                  Chinh Phục <span className="bg-gradient-to-r from-rose-400 via-amber-300 to-rose-200 bg-clip-text text-transparent">HSK Từ Vựng</span> Dễ Dàng
                </h1>

                <p className="mt-3 text-base text-slate-300 sm:text-lg leading-relaxed max-w-2xl">
                  Luyện ghi nhớ từ vựng, chữ Hán và phiên âm pinyin theo từng bài học cấu trúc từ dễ đến nâng cao.
                </p>

                {/* Search Input Box */}
                <div className="mt-6 max-w-xl">
                  <form className="relative">
                    <Search
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-400"
                      size={20}
                    />
                    <input
                      name="q"
                      defaultValue={q}
                      placeholder="Tìm bài học (VD: Bài 1, Gia đình, Công việc...)"
                      className="w-full rounded-2xl border border-white/20 bg-white/15 py-4 pl-12 pr-12 text-sm text-white placeholder-slate-400 backdrop-blur shadow-2xl transition duration-200 focus:border-rose-400 focus:bg-slate-900/90 focus:outline-none focus:ring-4 focus:ring-rose-500/20"
                    />
                    {q ? (
                      <button
                        type="button"
                        onClick={clearSearch}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-1 text-slate-300 hover:bg-white/30 hover:text-white"
                      >
                        <X size={16} />
                      </button>
                    ) : null}
                  </form>
                </div>

                {/* Counter Badges */}
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2.5 rounded-2xl bg-white/10 px-4 py-2.5 text-xs font-semibold text-slate-200 backdrop-blur border border-white/10 shadow-sm">
                    <BookOpen size={18} className="text-rose-400" />
                    <span>
                      <strong className="text-white text-sm font-black">{totalLessonsInSource}</strong> Bài học
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 rounded-2xl bg-white/10 px-4 py-2.5 text-xs font-semibold text-slate-200 backdrop-blur border border-white/10 shadow-sm">
                    <BookMarked size={18} className="text-amber-400" />
                    <span>
                      <strong className="text-white text-sm font-black">{totalWordsInSource}</strong> Từ vựng
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 rounded-2xl bg-white/10 px-4 py-2.5 text-xs font-semibold text-slate-200 backdrop-blur border border-white/10 shadow-sm">
                    <Layers size={18} className="text-emerald-400" />
                    <span>
                      <strong className="text-white text-sm font-black">{levelStats.length}</strong> Cấp độ
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Premium 3D Artwork Showcase Card */}
              <div className="lg:col-span-5">
                <div className="group relative overflow-hidden rounded-3xl border border-white/20 bg-slate-900/80 p-2 shadow-2xl backdrop-blur transition-all duration-500 hover:border-rose-500/50 hover:shadow-rose-950/40">
                  {/* High Resolution Hero 3D Artwork */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-slate-950">
                    <img
                      src="/images/hsk_hero.png"
                      alt="HSK Study Sanctuary 3D Illustration"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />

                    {/* Floating Badge Top Left */}
                    <div className="absolute top-4 left-4">
                      <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950/80 px-3 py-1.5 text-xs font-black text-amber-300 backdrop-blur border border-amber-500/30 shadow-lg">
                        <Flame size={14} className="text-amber-400" /> Tiêu Chuẩn HSK 2026
                      </span>
                    </div>

                    {/* Overlay Text Bottom Left */}
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="flex items-center justify-between rounded-xl bg-slate-900/80 p-3 backdrop-blur border border-white/10">
                        <div>
                          <p className="text-xs font-bold text-white">Lộ trình bài học bài bản</p>
                          <p className="text-[11px] text-slate-400">Tự động lưu tiến độ & flashcard</p>
                        </div>
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-600 text-white shadow-md">
                          <GraduationCap size={18} />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content Area */}
        <main className="mx-auto max-w-7xl px-4 pt-8">
          {/* Controls Bar: HSK Standard Tabs & Quick Filters */}
          {showAll && (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5">
            {/* Source Tab Switcher */}
            <div className="inline-flex rounded-2xl bg-slate-200/70 p-1.5 shadow-inner">
              <button
                type="button"
                onClick={() => setSource("HSK20")}
                className={`flex items-center gap-2.5 rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-200 ${
                  source === "HSK20"
                    ? "bg-white text-rose-600 shadow-md shadow-rose-950/5 scale-[1.02]"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <BookOpen size={18} />
                <span>HSK 2.0</span>
                
              </button>

              <button
                type="button"
                onClick={() => setSource("HSK30")}
                className={`flex items-center gap-2.5 rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-200 ${
                  source === "HSK30"
                    ? "bg-white text-rose-600 shadow-md shadow-rose-950/5 scale-[1.02]"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Sparkles size={18} className="text-amber-500" />
                <span>HSK 3.0</span>
                
              </button>
            </div>
          </div>
          )}

          {/* Active Filter Info Banner (if searching or filtered) */}
          {q && (
            <div className="mt-4 flex items-center justify-between rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-900">
              <div className="flex items-center gap-2">
                <Search size={16} className="text-amber-600" />
                <span>
                  Kết quả tìm kiếm cho: <strong className="font-bold">"{q}"</strong> ({lessons.length} bài học)
                </span>
              </div>
              <button
                onClick={clearSearch}
                className="text-xs font-semibold text-amber-700 underline hover:text-amber-900"
              >
                Xóa tìm kiếm
              </button>
            </div>
          )}

          {/* Content View: Level Cards Grid OR Lesson Cards Grid */}
          {showAll ? (
            /* Level Cards Grid View */
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <GraduationCap className="text-rose-600" size={22} />
                  <span>Chọn cấp độ bài học</span>
                </h2>
               
              </div>

              {levelStats.length === 0 ? (
                <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
                  <BookOpen size={48} className="mx-auto text-slate-300 mb-3" />
                  <h3 className="text-lg font-bold text-slate-700">Chưa có bài học nào</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Vui lòng chọn nguồn HSK khác hoặc thử lại sau.
                  </p>
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {levelStats.map((stat) => {
                    const lvlStyle = getLevelStyle(stat.level);
                    return (
                      <button
                        key={stat.level}
                        type="button"
                        onClick={() => setLevel(stat.level)}
                        className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl border bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl ${lvlStyle.border}`}
                      >
                        {/* Top Banner / Image Header */}
                        <div className="relative h-40 overflow-hidden bg-slate-900">
                          {stat.sampleImages.length > 0 ? (
                            <div className="flex h-full w-full gap-0.5">
                              {stat.sampleImages.map((img, i) => (
                                <img
                                  key={i}
                                  src={img}
                                  alt=""
                                  className="h-full flex-1 object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                              ))}
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent" />
                            </div>
                          ) : (
                            <div className="relative h-full w-full">
                              <img
                                src={lvlStyle.defaultImage}
                                alt={stat.level}
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/40 to-slate-950/20" />
                            </div>
                          )}

                          {/* Level Badge Overlay */}
                          <div className="absolute top-4 left-4 z-10">
                            <span
                              className={`inline-flex items-center gap-1 rounded-xl px-3 py-1 text-xs font-black shadow-md ${lvlStyle.badge}`}
                            >
                              <Flame size={13} /> {stat.level}
                            </span>
                          </div>

                          {/* Chinese Title Watermark on Cover */}
                          <div className="absolute right-4 bottom-3 z-10">
                            <span className="text-xl font-black text-white/90 drop-shadow-md">
                              {stat.level}
                            </span>
                          </div>
                        </div>

                        {/* Card Body */}
                        <div className="p-6 pt-5">
                          <div className="flex items-center justify-between">
                            <h3 className="text-xl font-extrabold text-slate-900 group-hover:text-rose-600 transition-colors">
                              Cấp độ {stat.level}
                            </h3>
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-400 group-hover:bg-rose-500 group-hover:text-white transition-all duration-200">
                              <ArrowRight size={16} />
                            </div>
                          </div>

                          {/* Stats Info */}
                          <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-slate-50 p-3 text-left">
                            <div>
                              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                Bài học
                              </p>
                              <p className="text-base font-extrabold text-slate-800 mt-0.5 flex items-center gap-1">
                                <BookOpen size={15} className="text-rose-500" />
                                {stat.lessonCount} bài
                              </p>
                            </div>
                            <div>
                              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                Từ vựng
                              </p>
                              <p className="text-base font-extrabold text-slate-800 mt-0.5 flex items-center gap-1">
                                <BookMarked size={15} className="text-amber-500" />
                                {stat.wordCount} từ
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Footer Action */}
                        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-bold text-slate-500 group-hover:text-rose-600">
                          <span>Khám phá các bài học</span>
                          <span className="flex items-center gap-1">
                            Xem ngay <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Lesson Detail List View */
            <div className="mt-6">
              {/* Back Button & Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setLevel("")}
                    className="inline-flex items-center gap-1.5 bg-transparent px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:text-slate-900"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <div className="h-6 w-px bg-slate-200" />
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                      <span>Danh sách bài học</span>
                    </h2>
                  </div>
                </div>
              </div>

              {/* Lesson Grid */}
              {lessons.length === 0 ? (
                <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
                  <BookOpen size={48} className="mx-auto text-slate-300 mb-3" />
                  <h3 className="text-lg font-bold text-slate-700">Không tìm thấy bài học nào</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Thử tìm kiếm với từ khóa khác hoặc bỏ lọc cấp độ.
                  </p>
                  <button
                    onClick={() => setLevel("")}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow hover:bg-slate-800"
                  >
                  </button>
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {lessons.map((lesson, idx) => {
                    const images = (lesson.vocabularies || [])
                      .filter((v: any) => v.imageUrl)
                      .map((v: any) => v.imageUrl);
                    const lvlStyle = getLevelStyle(lesson.level);
                    const fallbackCover = "/images/hsk_intermediate.png";

                    return (
                      <Link
                        key={lesson.id}
                        to={`/lessons/${lesson.id}`}
                        prefetch="intent"
                        className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-rose-300 hover:shadow-xl"
                      >
                        <div>
                          {/* Image Header with fallback photography cover */}
                          <div className="relative h-40 w-full overflow-hidden bg-slate-900">
                            {images.length > 0 ? (
                              <div className="flex h-full w-full gap-0.5">
                                {images.map((img, i) => (
                                  <img
                                    key={i}
                                    src={img}
                                    alt=""
                                    className="h-full flex-1 object-cover transition-transform duration-500 group-hover:scale-110"
                                  />
                                ))}
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent" />
                              </div>
                            ) : (
                              <div className="relative h-full w-full">
                                <img
                                  src={fallbackCover}
                                  alt={lesson.title}
                                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-slate-950/10" />
                              </div>
                            )}

                            {/* Order Badge */}
                            <div className="absolute top-3 left-3 z-10">
                              <span className="inline-flex items-center rounded-xl bg-slate-900/85 px-3 py-1 text-xs font-extrabold text-white backdrop-blur shadow-md border border-white/10">
                                Bài {lesson.orderNo < 10 ? `0${lesson.orderNo}` : lesson.orderNo}
                              </span>
                            </div>

                            {/* Vocab Count Badge */}
                            <div className="absolute top-3 right-3 z-10">
                              <span className="inline-flex items-center gap-1 rounded-xl bg-white/90 px-2.5 py-1 text-xs font-bold text-slate-800 backdrop-blur shadow-md">
                                <BookMarked size={13} className="text-rose-500" />
                                {lesson._count?.vocabularies || 0} từ
                              </span>
                            </div>
                          </div>

                          {/* Content Body */}
                          <div className="p-5">
                            <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-rose-600 transition-colors line-clamp-1">
                              {lesson.title}
                            </h3>

                            {lesson.description ? (
                              <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-500">
                                {lesson.description}
                              </p>
                            ) : (
                              <p className="mt-2 text-xs italic text-slate-400">
                                Bài học thuộc cấp độ {lesson.level}
                              </p>
                            )}

                            {/* Sample Vocab Preview if available */}
                            {lesson.vocabularies && lesson.vocabularies.length > 0 && (
                              <div className="mt-4 flex flex-wrap gap-1.5">
                                {lesson.vocabularies.map((v: any) => (
                                  <span
                                    key={v.id}
                                    className="rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 border border-slate-200/60"
                                  >
                                    {v.word} {v.pinyin ? `(${v.pinyin})` : ""}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Card Footer */}
                        <div className="mx-5 mb-5 flex items-center justify-between border-t border-slate-100 pt-3.5 text-xs font-bold text-slate-600 group-hover:text-rose-600">
                          <span className="flex items-center gap-1 text-slate-400">
                            <CheckCircle2 size={14} className="text-emerald-500" /> Tiêu chuẩn {lesson.source}
                          </span>
                          <span className="flex items-center gap-1">
                            Bắt đầu học <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </SiteLayout>
  );
}


