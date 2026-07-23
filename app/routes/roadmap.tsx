import type { Prisma } from "@prisma/client";
import type { Route } from "./+types/roadmap";
import { Link, useSearchParams } from "react-router";
import { useMemo } from "react";
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
  BookMarked,
} from "lucide-react";
import { SiteLayout } from "~/components/Layout";
import { requireUser } from "~/lib/auth.server";
import { prisma } from "~/lib/db.server";
import { readdirSync } from "node:fs";
import { join } from "node:path";

const IMAGES_DIR = join(process.cwd(), "public", "images");

function getAvailableImages(): Set<string> {
  try {
    const files = readdirSync(IMAGES_DIR);
    return new Set(files);
  } catch {
    return new Set();
  }
}

function vocabImageUrl(chinese: string, availableImages: Set<string>): string | undefined {
  const filename = `${chinese}.jpg`;
  return availableImages.has(filename) ? `/images/${encodeURIComponent(chinese)}.jpg` : undefined;
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireUser(request);
  const url = new URL(request.url);
  const phase = url.searchParams.get("phase") || "";
  const q = url.searchParams.get("q") || "";
  const availableImages = getAvailableImages();

  const where: Prisma.RoadmapItemWhereInput = {
    ...(phase ? { phase } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" as const } },
            { description: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [items, itemsForStats] = await Promise.all([
    prisma.roadmapItem.findMany({
      where,
      orderBy: [{ orderNo: "asc" }, { createdAt: "asc" }],
    }),
    prisma.roadmapItem.findMany({
      select: {
        phase: true,
        vocabulary: true,
        phrases: true,
      },
      orderBy: [{ phase: "asc" }, { orderNo: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  const statsByPhase = new Map<
    string,
    { phase: string; lessonCount: number; wordCount: number; sampleImages: string[] }
  >();

  for (const item of itemsForStats) {
    const stat =
      statsByPhase.get(item.phase) ||
      { phase: item.phase, lessonCount: 0, wordCount: 0, sampleImages: [] };
    const entries = [
      ...toRoadmapEntries(item.vocabulary, availableImages),
      ...toRoadmapEntries(item.phrases, availableImages),
    ];

    stat.lessonCount += 1;
    stat.wordCount += entries.length;

    for (const entry of entries) {
      if (entry.imageUrl && stat.sampleImages.length < 3) {
        stat.sampleImages.push(entry.imageUrl);
      }
    }

    statsByPhase.set(item.phase, stat);
  }

  const phases = [...statsByPhase.keys()];
  const phaseStats = [...statsByPhase.values()];

  const totalLessons = phaseStats.reduce((acc, s) => acc + s.lessonCount, 0);
  const totalWords = phaseStats.reduce((acc, s) => acc + s.wordCount, 0);

  return { user, items, phases, phaseStats, q, phase, totalLessons, totalWords, availableImageNames: [...availableImages] };
}

type RoadmapEntry = {
  chinese: string;
  pinyin: string;
  meaningVi: string;
  imageUrl?: string;
};

function toRoadmapEntries(value: unknown, availableImages: Set<string>): RoadmapEntry[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((item) => {
      const chinese = String(item.chinese || "");
      return {
        chinese,
        pinyin: String(item.pinyin || ""),
        meaningVi: String(item.meaningVi || item.meaning || ""),
        imageUrl:
          item.imageUrl
            ? String(item.imageUrl)
            : vocabImageUrl(chinese, availableImages),
      };
    })
    .filter((item) => item.chinese && item.meaningVi);
}

// ── Phase color schemes ──────────────────────────────────────────
const PHASE_STYLES: Record<
  string,
  { bg: string; border: string; text: string; badge: string; gradient: string; defaultImage: string }
> = {
  "Giai đoạn 1": {
    bg: "bg-emerald-50 hover:bg-emerald-100/60",
    border: "border-emerald-200 hover:border-emerald-400",
    text: "text-emerald-700",
    badge: "bg-emerald-500 text-white",
    gradient: "from-emerald-600 to-teal-700",
    defaultImage: "/images/hsk1.svg",
  },
  "Giai đoạn 2": {
    bg: "bg-sky-50 hover:bg-sky-100/60",
    border: "border-sky-200 hover:border-sky-400",
    text: "text-sky-700",
    badge: "bg-sky-500 text-white",
    gradient: "from-sky-600 to-blue-700",
    defaultImage: "/images/hsk2.svg",
  },
  "Giai đoạn 3": {
    bg: "bg-indigo-50 hover:bg-indigo-100/60",
    border: "border-indigo-200 hover:border-indigo-400",
    text: "text-indigo-700",
    badge: "bg-indigo-500 text-white",
    gradient: "from-indigo-600 to-violet-700",
    defaultImage: "/images/hsk3.svg",
  },
  "Giai đoạn 4": {
    bg: "bg-amber-50 hover:bg-amber-100/60",
    border: "border-amber-200 hover:border-amber-400",
    text: "text-amber-700",
    badge: "bg-amber-500 text-white",
    gradient: "from-amber-500 to-orange-600",
    defaultImage: "/images/hsk_beginner.png",
  },
  "Giai đoạn 5": {
    bg: "bg-rose-50 hover:bg-rose-100/60",
    border: "border-rose-200 hover:border-rose-400",
    text: "text-rose-700",
    badge: "bg-rose-500 text-white",
    gradient: "from-rose-600 to-red-700",
    defaultImage: "/images/hsk_intermediate.png",
  },
  "Giai đoạn 6": {
    bg: "bg-purple-50 hover:bg-purple-100/60",
    border: "border-purple-200 hover:border-purple-400",
    text: "text-purple-700",
    badge: "bg-purple-600 text-white",
    gradient: "from-purple-600 to-fuchsia-700",
    defaultImage: "/images/hsk_advanced.png",
  },
};

function getPhaseStyle(ph: string) {
  const normalized = ph.trim();
  if (PHASE_STYLES[normalized]) return PHASE_STYLES[normalized];
  return {
    bg: "bg-red-50 hover:bg-red-100/60",
    border: "border-red-200 hover:border-red-400",
    text: "text-red-700",
    badge: "bg-red-600 text-white",
    gradient: "from-red-600 to-rose-700",
    defaultImage: "/images/hsk_advanced.png",
  };
}

export default function RoadmapPage({ loaderData }: Route.ComponentProps) {
  const [params, setParams] = useSearchParams();
  const { items, phases, phaseStats, q, phase, totalLessons, totalWords, availableImageNames } = loaderData;
  const availableImages = useMemo(() => new Set(availableImageNames), [availableImageNames]);

  const setPhase = (p: string) => {
    const next = new URLSearchParams(params);
    p ? next.set("phase", p) : next.delete("phase");
    setParams(next);
  };

  const clearSearch = () => {
    const next = new URLSearchParams(params);
    next.delete("q");
    setParams(next);
  };

  const showAll = !phase;

  return (
    <SiteLayout user={loaderData.user}>
      {/* Dynamic Background Wrapper */}
      <div className="min-h-screen bg-slate-50/50 pb-16">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-white py-12 md:py-20 px-4">
          {/* Subtle Calligraphy Watermark Background */}
          <div className="absolute left-8 top-1/2 -translate-y-1/2 text-9xl font-black text-white/[0.03] select-none pointer-events-none tracking-widest hidden lg:block">
            学习路线
          </div>

          {/* Ambient Glow Orbs */}
          <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-blue-600/25 blur-3xl pointer-events-none" />
          <div className="absolute right-10 bottom-0 h-96 w-96 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none" />

          <div className="relative mx-auto max-w-7xl">
            <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
              {/* Left Column: Headline, Stats & Search */}
              <div className="lg:col-span-7">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold text-blue-200 backdrop-blur border border-white/15 shadow-inner">
                  <Sparkles size={15} className="text-amber-400 animate-pulse" />
                  <span>Lộ Trình Học Tập Chuẩn Hóa</span>
                </div>

                <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl leading-tight">
                  Học Tiếng Trung{" "}
                  <span className="bg-gradient-to-r from-blue-400 via-amber-300 to-blue-200 bg-clip-text text-transparent">
                    Theo Lộ Trình
                  </span>{" "}
                  Bài Bản
                </h1>

                <p className="mt-3 text-base text-slate-300 sm:text-lg leading-relaxed max-w-2xl">
                  Học từ vựng, mẫu câu theo từng buổi học được thiết kế theo lộ trình từ cơ bản đến nâng cao.
                </p>

                {/* Search Input Box */}
                <div className="mt-6 max-w-xl">
                  <form className="relative">
                    <Search
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400"
                      size={20}
                    />
                    <input
                      name="q"
                      defaultValue={q}
                      placeholder="Tìm trong lộ trình (VD: Buổi 1, Chào hỏi, Gia đình...)"
                      className="w-full rounded-2xl border border-white/20 bg-white/15 py-4 pl-12 pr-12 text-sm text-white placeholder-slate-400 backdrop-blur shadow-2xl transition duration-200 focus:border-blue-400 focus:bg-slate-900/90 focus:outline-none focus:ring-4 focus:ring-blue-500/20"
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
                    <BookOpen size={18} className="text-blue-400" />
                    <span>
                      <strong className="text-white text-sm font-black">{totalLessons}</strong> Buổi học
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 rounded-2xl bg-white/10 px-4 py-2.5 text-xs font-semibold text-slate-200 backdrop-blur border border-white/10 shadow-sm">
                    <BookMarked size={18} className="text-amber-400" />
                    <span>
                      <strong className="text-white text-sm font-black">{totalWords}</strong> Từ & Câu
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 rounded-2xl bg-white/10 px-4 py-2.5 text-xs font-semibold text-slate-200 backdrop-blur border border-white/10 shadow-sm">
                    <Layers size={18} className="text-emerald-400" />
                    <span>
                      <strong className="text-white text-sm font-black">{phaseStats.length}</strong> Giai đoạn
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Premium Artwork Card */}
              <div className="lg:col-span-5">
                <div className="group relative overflow-hidden rounded-3xl border border-white/20 bg-slate-900/80 p-2 shadow-2xl backdrop-blur transition-all duration-500 hover:border-blue-500/50 hover:shadow-blue-950/40">
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-slate-950">
                    <img
                      src="/images/hsk_hero.png"
                      alt="Lộ trình học tập"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />

                    {/* Floating Badge Top Left */}
                    <div className="absolute top-4 left-4">
                      <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950/80 px-3 py-1.5 text-xs font-black text-amber-300 backdrop-blur border border-amber-500/30 shadow-lg">
                        <Flame size={14} className="text-amber-400" /> Từ Cơ Bản Đến Nâng Cao
                      </span>
                    </div>

                    {/* Overlay Text Bottom Left */}
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="flex items-center justify-between rounded-xl bg-slate-900/80 p-3 backdrop-blur border border-white/10">
                        <div>
                          <p className="text-xs font-bold text-white">Lộ trình từng buổi học</p>
                          <p className="text-[11px] text-slate-400">Từ vựng & Mẫu câu theo chủ đề</p>
                        </div>
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white shadow-md">
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

        {/* ── Main Content Area ── */}
        <main className="mx-auto max-w-7xl px-4 pt-8">
          {/* Active Filter Info Banner */}
          {q && (
            <div className="mt-4 flex items-center justify-between rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-900">
              <div className="flex items-center gap-2">
                <Search size={16} className="text-amber-600" />
                <span>
                  Kết quả tìm kiếm cho: <strong className="font-bold">"{q}"</strong> ({items.length} buổi học)
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

          {/* ── Content View ── */}
          {showAll ? (
            /* Phase Cards Grid View */
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <GraduationCap className="text-blue-600" size={22} />
                  <span>Chọn giai đoạn học</span>
                </h2>
                <span className="text-xs font-medium text-slate-500">
                  Hiển thị {phaseStats.length} giai đoạn
                </span>
              </div>

              {phaseStats.length === 0 ? (
                <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
                  <BookOpen size={48} className="mx-auto text-slate-300 mb-3" />
                  <h3 className="text-lg font-bold text-slate-700">Chưa có dữ liệu lộ trình</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Vui lòng thêm dữ liệu lộ trình để bắt đầu.
                  </p>
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {phaseStats.map((stat) => {
                    const phStyle = getPhaseStyle(stat.phase);
                    return (
                      <button
                        key={stat.phase}
                        type="button"
                        onClick={() => setPhase(stat.phase)}
                        className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl border bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl ${phStyle.border}`}
                      >
                        <div className="relative -mx-6 -mt-6 mb-5 h-40 overflow-hidden bg-slate-900">
                          {stat.sampleImages.length > 0 ? (
                            <div className="flex h-full w-full gap-0.5">
                              {stat.sampleImages.map((img, i) => (
                                <img key={i} src={img} alt="" className="h-full flex-1 object-cover transition-transform duration-500 group-hover:scale-110" />
                              ))}
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent" />
                            </div>
                          ) : (
                            <div className="relative h-full w-full">
                              <img src={phStyle.defaultImage} alt={stat.phase} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/40 to-slate-950/20" />
                            </div>
                          )}

                          {/* Phase Badge Overlay */}
                          <div className="absolute top-4 left-4 z-10">
                            <span
                              className={`inline-flex items-center gap-1 rounded-xl px-3 py-1 text-xs font-black shadow-md ${phStyle.badge}`}
                            >
                              <Flame size={13} /> {stat.phase}
                            </span>
                          </div>

                          {/* Phase Label Watermark */}
                          <div className="absolute right-4 bottom-3 z-10">
                            <span className="text-xl font-black text-white/90 drop-shadow-md">
                              {stat.phase}
                            </span>
                          </div>
                        </div>

                        {/* Card Body */}
                        <div>
                          <div className="flex items-center justify-between">
                            <h3 className="text-xl font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">
                              {stat.phase}
                            </h3>
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-400 group-hover:bg-blue-500 group-hover:text-white transition-all duration-200">
                              <ArrowRight size={16} />
                            </div>
                          </div>

                          {/* Stats Info */}
                          <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-slate-50 p-3 text-left">
                            <div>
                              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                Buổi học
                              </p>
                              <p className="text-base font-extrabold text-slate-800 mt-0.5 flex items-center gap-1">
                                <BookOpen size={15} className="text-blue-500" />
                                {stat.lessonCount} buổi
                              </p>
                            </div>
                            <div>
                              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                Từ & Câu
                              </p>
                              <p className="text-base font-extrabold text-slate-800 mt-0.5 flex items-center gap-1">
                                <BookMarked size={15} className="text-amber-500" />
                                {stat.wordCount} mục
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Footer Action */}
                        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-bold text-slate-500 group-hover:text-blue-600">
                          <span>Khám phá các buổi học</span>
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
            /* Roadmap Items Detail List View */
            <div className="mt-6">
              {/* Back Button & Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setPhase("")}
                    className="inline-flex items-center gap-1.5 bg-transparent px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:text-slate-900"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <div className="h-6 w-px bg-slate-200" />
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                      <span>Danh sách buổi học</span>
                      <span className={`rounded-xl px-3 py-0.5 text-xs font-bold ${getPhaseStyle(phase).badge}`}>
                        {phase}
                      </span>
                    </h2>
                  </div>
                </div>

                <div className="text-xs font-semibold text-slate-500">
                  Hiển thị <strong className="text-slate-900">{items.length}</strong> buổi học
                </div>
              </div>

              {/* Roadmap Items Grid */}
              {items.length === 0 ? (
                <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
                  <BookOpen size={48} className="mx-auto text-slate-300 mb-3" />
                  <h3 className="text-lg font-bold text-slate-700">Không tìm thấy buổi học nào</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Thử tìm kiếm với từ khóa khác hoặc bỏ lọc giai đoạn.
                  </p>
                  <button
                    onClick={() => setPhase("")}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow hover:bg-slate-800"
                  >
                    Xem tất cả giai đoạn
                  </button>
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((item) => {
                    const vocab = toRoadmapEntries(item.vocabulary, availableImages);
                    const phrases = toRoadmapEntries(item.phrases, availableImages);
                    const allWords = [...vocab, ...phrases];
                    const totalCount = allWords.length;
                    const images = allWords.filter((w) => w.imageUrl).slice(0, 3).map((w) => w.imageUrl!);
                    const phStyle = getPhaseStyle(item.phase);
                    const fallbackCover = "/images/hsk_hero_card.png";

                    return (
                      <Link
                        key={item.id}
                        to={`/roadmap/${item.id}`}
                        prefetch="intent"
                        className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-blue-300 hover:shadow-xl"
                      >
                        <div>
                          <div className="relative h-40 w-full overflow-hidden bg-slate-900">
                            {images.length > 0 ? (
                              <div className="flex h-full w-full gap-0.5">
                                {images.map((img, i) => (
                                  <img key={i} src={img} alt="" className="h-full flex-1 object-cover transition-transform duration-500 group-hover:scale-110" />
                                ))}
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent" />
                              </div>
                            ) : (
                              <div className="relative h-full w-full">
                                <img src={fallbackCover} alt={item.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-slate-950/10" />
                              </div>
                            )}

                            <div className="absolute top-3 left-3 z-10">
                              <span className="inline-flex items-center rounded-xl bg-slate-900/85 px-3 py-1 text-xs font-extrabold text-white backdrop-blur shadow-md border border-white/10">
                                Buổi {item.orderNo < 10 ? `0${item.orderNo}` : item.orderNo}
                              </span>
                            </div>

                            <div className="absolute top-3 right-3 z-10">
                              <span className="inline-flex items-center gap-1 rounded-xl bg-white/90 px-2.5 py-1 text-xs font-bold text-slate-800 backdrop-blur shadow-md">
                                <BookMarked size={13} className="text-blue-500" />
                                {totalCount} từ
                              </span>
                            </div>
                          </div>

                          <div className="p-5">
                            <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                              {item.title}
                            </h3>

                            {item.description ? (
                              <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-500">
                                {item.description}
                              </p>
                            ) : (
                              <p className="mt-2 text-xs italic text-slate-400">
                                Buổi học thuộc {item.phase}
                              </p>
                            )}

                            {allWords.length > 0 && (
                              <div className="mt-4 flex flex-wrap gap-1.5">
                                {allWords.slice(0, 3).map((w, i) => (
                                  <span
                                    key={i}
                                    className="rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 border border-slate-200/60"
                                  >
                                    {w.chinese} {w.pinyin ? `(${w.pinyin})` : ""}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Card Footer */}
                        <div className="mx-5 mb-5 flex items-center justify-between border-t border-slate-100 pt-3.5 text-xs font-bold text-slate-600 group-hover:text-blue-600">
                          <span className="flex items-center gap-1 text-slate-400">
                            <BookMarked size={14} className="text-blue-500" /> {totalCount} từ & câu
                            {item.level ? <><span className="mx-1 text-slate-300">•</span>{item.level}</> : null}
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
