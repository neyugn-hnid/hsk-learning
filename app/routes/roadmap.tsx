import type { Prisma } from "@prisma/client";
import type { Route } from "./+types/roadmap";
import { Link, useSearchParams } from "react-router";
import { useMemo, useState } from "react";
import {
  Search,
  BookOpen,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Layers,
  X,
  Flame,
  Volume2,
  Compass,
  Star,
  CheckCircle2,
  Crown,
  Target,
  Zap,
  Lock,
  Swords,
  Play,
  Pencil,
  Gamepad2,
  Award,
} from "lucide-react";
import { SiteLayout } from "~/components/Layout";
import { RoadmapAccessModal } from "~/components/RoadmapAccessModal";
import { getUser } from "~/lib/auth.server";
import { prisma } from "~/lib/db.server";
import { sound } from "~/lib/sound";
import { r2Asset } from "~/lib/assets";


export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const phaseParam = url.searchParams.get("phase") || "";
  const q = url.searchParams.get("q") || "";

  const where: Prisma.RoadmapItemWhereInput = {
    ...(phaseParam ? { phase: phaseParam } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" as const } },
            { description: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [user, items, allItems, allLessons] = await Promise.all([
    getUser(request),
    prisma.roadmapItem.findMany({
      where,
      orderBy: [{ orderNo: "asc" }, { createdAt: "asc" }],
    }),
    prisma.roadmapItem.findMany({
      select: {
        id: true,
        phase: true,
        vocabulary: true,
        phrases: true,
        duration: true,
      },
      orderBy: [{ phase: "asc" }, { orderNo: "asc" }],
    }),
    prisma.lesson.findMany({
      where: { status: "PUBLISHED" },
      select: { id: true, level: true, orderNo: true, title: true },
      orderBy: [{ level: "asc" }, { orderNo: "asc" }],
    }),
  ]);

  const itemsWithLessons = items.map((item) => {
    const matched =
      allLessons.find(
        (l) =>
          (l.level.toUpperCase() === item.phase.toUpperCase() ||
            l.level.toUpperCase() === (item.level || "").toUpperCase()) &&
          l.orderNo === item.orderNo
      ) ||
      allLessons.find(
        (l) =>
          l.level.toUpperCase() === item.phase.toUpperCase() ||
          l.level.toUpperCase() === (item.level || "").toUpperCase()
      ) ||
      allLessons[0];

    return {
      ...item,
      lessonId: matched?.id || null,
    };
  });

  const statsByPhase: Record<
    string,
    { phase: string; lessonCount: number; wordCount: number; phraseCount: number }
  > = {};

  for (const item of allItems) {
    if (!statsByPhase[item.phase]) {
      statsByPhase[item.phase] = {
        phase: item.phase,
        lessonCount: 0,
        wordCount: 0,
        phraseCount: 0,
      };
    }
    const stat = statsByPhase[item.phase];
    const vocabs = toRoadmapEntries(item.vocabulary);
    const phrases = toRoadmapEntries(item.phrases);

    stat.lessonCount += 1;
    stat.wordCount += vocabs.length;
    stat.phraseCount += phrases.length;
  }

  const phases = Object.keys(statsByPhase);
  const phaseStats = Object.values(statsByPhase);
  const totalLessons = phaseStats.reduce((acc, s) => acc + s.lessonCount, 0);
  const totalWords = phaseStats.reduce((acc, s) => acc + s.wordCount, 0);
  const totalPhrases = phaseStats.reduce((acc, s) => acc + s.phraseCount, 0);

  return {
    user,
    items: itemsWithLessons,
    phases,
    phaseStats,
    q,
    phaseParam,
    totalLessons,
    totalWords,
    totalPhrases,
  };
}

type RoadmapEntry = {
  chinese: string;
  pinyin: string;
  meaningVi: string;
  imageUrl?: string;
};

function toRoadmapEntries(value: unknown): RoadmapEntry[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((item) => {
      const chinese = String(item.chinese || item.word || item.hanzi || "");
      return {
        chinese,
        pinyin: String(item.pinyin || ""),
        meaningVi: String(item.meaningVi || item.meaning_vi || item.vi || item.meaning || ""),
        imageUrl: item.imageUrl ? String(item.imageUrl) : undefined,
      };
    })
    .filter((item) => item.chinese && item.meaningVi);
}

// Realm definitions matching WorldMap.tsx visual quality
const ROADMAP_REALMS = [
  {
    id: "realm-hsk1",
    phaseKey: "HSK1",
    level: "HSK 1",
    chineseName: "洛阳城",
    regionName: "Tân Thủ Thôn & Cố Đô Lạc Dương",
    shortName: "Lạc Dương Cổ Đô",
    chapter: "Chương I",
    subtitle: "Khởi nguồn vạn dặm · Nhập môn căn bản (150 Từ)",
    description: "Khám phá cái nôi văn hóa Hoa Hạ: Chào hỏi, số đếm, gia đình và những nét bút đầu tiên.",
    bgImage: "/map/luoyang.jpg",
    accentColor: "#D97706",
    primaryBg: "bg-amber-600",
    badgeBg: "bg-amber-600 text-white",
    cardBorder: "border-amber-300",
    lightTagBg: "bg-amber-50 text-amber-800 border-amber-200",
    bossTitle: "Tú Tài Lạc Dương Thành",
    bossHanzi: "秀才",
    targetWords: 150,
  },
  {
    id: "realm-hsk2",
    phaseKey: "HSK2",
    level: "HSK 2",
    chineseName: "成都竹谷",
    regionName: "Thung Lũng Rừng Trúc & Thành Đô",
    shortName: "Rừng Trúc Thành Đô",
    chapter: "Chương II",
    subtitle: "Giao tiếp đời thường · Ẩm thực & Mua sắm (300 Từ)",
    description: "Băng qua rừng trúc xanh ngát xứ Ba Thục: Ẩm thực Tứ Xuyên, hỏi đường, mua bán chợ phiên.",
    bgImage: "/map/chengdu.jpg",
    accentColor: "#059669",
    primaryBg: "bg-emerald-600",
    badgeBg: "bg-emerald-600 text-white",
    cardBorder: "border-emerald-300",
    lightTagBg: "bg-emerald-50 text-emerald-800 border-emerald-200",
    bossTitle: "Trưởng Lão Rừng Trúc",
    bossHanzi: "长老",
    targetWords: 300,
  },
  {
    id: "realm-hsk3",
    phaseKey: "HSK3",
    level: "HSK 3",
    chineseName: "夜上海",
    regionName: "Bến Thượng Hải & Đô Thị Phồn Hoa",
    shortName: "Phồn Hoa Thượng Hải",
    chapter: "Chương III",
    subtitle: "Thực chiến đời sống · Thương mại & Du lịch (600 Từ)",
    description: "Hòa mình vào ánh đèn phồn hoa bến Thượng Hải: Công sở, lữ hành, đàm phán và giao thương.",
    bgImage: "/map/shanghai.jpg",
    accentColor: "#0284C7",
    primaryBg: "bg-sky-600",
    badgeBg: "bg-sky-600 text-white",
    cardBorder: "border-sky-300",
    lightTagBg: "bg-sky-50 text-sky-800 border-sky-200",
    bossTitle: "Đại Phú Thương Bến Thượng Hải",
    bossHanzi: "富商",
    targetWords: 600,
  },
  {
    id: "realm-hsk4",
    phaseKey: "HSK4",
    level: "HSK 4",
    chineseName: "紫禁之巅",
    regionName: "Cố Cung Tử Cấm Thành & Đỉnh Hoa Sơn",
    shortName: "Tử Cấm Hoàng Thành",
    chapter: "Chương IV",
    subtitle: "Đỉnh cao Hán ngữ · Hùng biện & Luận đạo (1.200 Từ)",
    description: "Chạm tới đỉnh cao uy nghi của Tử Cấm Thành: Thảo luận các chủ đề xã hội, văn hóa, kinh tế.",
    bgImage: "/map/forbidden_city.jpg",
    accentColor: "#7C3AED",
    primaryBg: "bg-purple-600",
    badgeBg: "bg-purple-600 text-white",
    cardBorder: "border-purple-300",
    lightTagBg: "bg-purple-50 text-purple-800 border-purple-200",
    bossTitle: "Tuyệt Đỉnh Tông Sư",
    bossHanzi: "宗师",
    targetWords: 1200,
  },
];

function GemDiamondSVG({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M6 3h12l4 6-10 12L2 9l4-6z"
        fill="url(#gem-gradient-roadmap)"
        stroke="#0284C7"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M2 9h20M12 21L8 9l4-6 4 6-4 12z"
        stroke="#BAE6FD"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.8"
      />
      <defs>
        <linearGradient id="gem-gradient-roadmap" x1="2" y1="3" x2="22" y2="21" gradientUnits="userSpaceOnUse">
          <stop stopColor="#38BDF8" />
          <stop offset="1" stopColor="#0284C7" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function RoadmapPage({ loaderData }: Route.ComponentProps) {
  const {
    user,
    items,
    phases,
    phaseStats,
    q,
    phaseParam,
    totalLessons,
    totalWords,
    totalPhrases,
  } = loaderData;

  const isStudentOrAdmin = user?.role === "ADMIN" || user?.role === "STUDENT";
  const [accessModalOpen, setAccessModalOpen] = useState<boolean>(!isStudentOrAdmin);
  const [activeRealmIndex, setActiveRealmIndex] = useState<number>(0);
  const [selectedStage, setSelectedStage] = useState<(typeof items)[number] | null>(null);

  const activeRealmData = ROADMAP_REALMS[activeRealmIndex] || ROADMAP_REALMS[0];
  const activePhaseKey = activeRealmData.phaseKey;

  // Filter items for active phase
  const currentPhaseLessons = useMemo(() => {
    return items.filter((item) => item.phase === activePhaseKey);
  }, [items, activePhaseKey]);

  const speak = (text: string) => {
    if (typeof window === "undefined") return;
    fetch("/api/ai/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, lang: "zh-CN" }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(({ audio }) => {
        if (audio) new Audio(`data:audio/mp3;base64,${audio}`).play().catch(() => {});
      })
      .catch(() => {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = "zh-CN";
        u.rate = 0.85;
        window.speechSynthesis?.speak(u);
      });
  };

  return (
    <SiteLayout user={user}>
      <div className="relative min-h-screen bg-[#FDFBF7] text-slate-900 font-sans pb-28">
        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
          {/* ========================================================================= */}
          {/* 1. TOP HEADER & GAMIFICATION STATS BAR                                    */}
          {/* ========================================================================= */}
          <div className="flex flex-col justify-between gap-6 border-b border-slate-200 pb-6 sm:flex-row sm:items-center">
            <div>
              
              <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                Bản Đồ Lộ Trình Hán Ngữ
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
                Vượt qua từng ải bài học, thu thập từ vựng then chốt và chinh phục các chặng đại lục.
              </p>
            </div>

            
          </div>

          {/* ========================================================================= */}
          {/* 2. REALM NAVIGATOR DECK (HỆ THỐNG 4 CHẶNG ĐẠI LỤC)                        */}
          {/* ========================================================================= */}
          <div>
            <div className="mb-3.5 flex items-center justify-between px-1">
              <h2 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500">
                <Layers size={14} className="text-red-600" />
                Danh Sách Các Chặng Lộ Trình ({ROADMAP_REALMS.length} Vùng Đất)
              </h2>
              <span className="text-xs text-slate-500 font-medium">Chọn vùng để mở bản đồ ải</span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {ROADMAP_REALMS.map((realm, idx) => {
                const isActive = idx === activeRealmIndex;
                const stat = phaseStats.find((s) => s.phase === realm.phaseKey) || {
                  lessonCount: 10,
                  wordCount: 150,
                  phraseCount: 40,
                };

                return (
                  <button
                    key={realm.id}
                    type="button"
                    onClick={() => {
                      sound.playWoodblock();
                      setActiveRealmIndex(idx);
                    }}
                    className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl border text-left transition-all duration-200 cursor-pointer bg-white ${
                      isActive
                        ? `border-2 border-red-600 shadow-md ring-2 ring-red-100 scale-[1.02]`
                        : `border-slate-200 hover:border-slate-300 hover:shadow-md`
                    } h-52`}
                  >
                    {/* Top Image Artwork Section */}
                    <div className="relative h-32 w-full overflow-hidden bg-slate-900">
                      <img
                        src={r2Asset(realm.bgImage)}
                        alt={realm.shortName}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent" />

                      {/* Top Pill Header */}
                      <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3 z-10">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-xs ${realm.primaryBg}`}
                          >
                            {realm.chapter}
                          </span>
                          <span className="text-[10px] font-extrabold text-white bg-slate-900/70 px-2 py-0.5 rounded-full backdrop-blur-xs">
                            {realm.level}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Info Container */}
                    <div className="flex-1 flex flex-col justify-between p-3 bg-white border-t border-slate-100">
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="text-xs font-black text-slate-900 group-hover:text-red-600 transition-colors truncate">
                          {realm.shortName}
                        </h3>
                        <span className="flex items-center gap-0.5 text-[10px] font-black text-amber-600 shrink-0">
                          <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                          <span>{stat.lessonCount} Ải</span>
                        </span>
                      </div>
                      <p className="mt-0.5 text-[10px] font-medium text-slate-500 truncate">
                        {stat.wordCount} từ vựng · {realm.subtitle}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 3. MAIN ADVENTURE STAGE (HÀNH TRÌNH VƯỢT ẢI LỤC ĐỊA)                       */}
          {/* ========================================================================= */}
          <div id="adventure-stage" className="w-full space-y-6 scroll-mt-20">
            {/* Realm Hero Billboard */}
            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
                <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider text-white shadow-xs ${activeRealmData.primaryBg}`}
                      >
                        {activeRealmData.chapter} · {activeRealmData.level}
                      </span>
                      <span className="font-hanzi text-base font-bold text-slate-400">
                        {activeRealmData.chineseName}
                      </span>
                    </div>
                    <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                      {activeRealmData.regionName}
                    </h2>
                    <p className="max-w-xl text-xs sm:text-sm leading-relaxed text-slate-600 font-medium">
                      {activeRealmData.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-2.5 pt-2">
                      <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 font-semibold">
                        <Target size={14} className="text-amber-600" />
                        <span>Mục tiêu: {activeRealmData.targetWords} từ vựng</span>
                      </div>
                      <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 font-semibold">
                        <Swords size={14} className="text-red-600" />
                        <span>Boss: {activeRealmData.bossTitle}</span>
                      </div>
                    </div>
                  </div>

                  {/* Realm Status Badge */}
                  <div className="flex shrink-0 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center shadow-2xs min-w-[120px]">
                    <span className="text-3xl font-black text-red-600 font-mono">
                      {currentPhaseLessons.length}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Ải Đang Mở
                    </span>
                    <div className="mt-1 flex items-center gap-1 text-xs font-bold text-slate-700">
                      <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                      <span>{activeRealmData.level}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ===================================================================== */}
              {/* THE ADVENTURE TRAIL (CON ĐƯỜNG VƯỢT ẢI ĐỈNH CAO)                       */}
              {/* ===================================================================== */}
              <div className="relative rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-xs">
                {/* Stage Title Header */}
                <div className="mb-10 flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <Compass size={18} className="text-red-600" />
                      Hành Trình Vượt Ải Lộ Trình
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Nhấp vào từng ải để xem chi tiết từ vựng và bắt đầu luyện tập
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-xs font-bold text-slate-700">
                    {currentPhaseLessons.length} Ải Thử Thách
                  </span>
                </div>

                {/* Stages Stack Container with Winding Path */}
                <div className="relative flex flex-col items-center space-y-12 py-4">
                  {/* Connecting Dashed SVG Pathway */}
                  <svg
                    className="pointer-events-none absolute inset-0 h-full w-full"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M 50% 5% C 25% 20%, 75% 40%, 50% 55% C 25% 70%, 75% 85%, 50% 95%"
                      fill="none"
                      stroke="#CBD5E1"
                      strokeWidth="4"
                      strokeDasharray="10 8"
                      strokeLinecap="round"
                    />
                  </svg>

                  {/* Transparent backdrop to click outside and close popover */}
                  {selectedStage && (
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setSelectedStage(null)}
                    />
                  )}

                  {currentPhaseLessons.map((item, idx) => {
                    const isBoss = idx === currentPhaseLessons.length - 1;
                    const isCurrent = idx === 0;
                    const isSelected = selectedStage?.id === item.id;
                    const vocabs = toRoadmapEntries(item.vocabulary);
                    const phrases = toRoadmapEntries(item.phrases);

                    // Alternating horizontal offsets for winding RPG path feel
                    const xOffsets = [
                      "sm:-translate-x-32",
                      "sm:translate-x-28",
                      "sm:-translate-x-24",
                      "sm:translate-x-32",
                      "sm:translate-x-0",
                    ];
                    const currentOffset = xOffsets[idx % xOffsets.length];
                    // Node on left -> popover on right; Node on right -> popover on left
                    const isRightPlaced = currentOffset.includes("-translate-x") || currentOffset === "sm:translate-x-0";

                    return (
                      <div
                        key={item.id}
                        className={`relative flex flex-col items-center transition-transform duration-300 ${currentOffset} ${
                          isSelected ? "z-50" : "z-10"
                        }`}
                      >
                        {/* Compact Popover Speech Bubble attached to the side of the node */}
                        {isSelected && (
                          <div
                            className={`absolute z-50 w-72 sm:w-80 rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl text-slate-900 animate-in zoom-in-95 fade-in duration-150 text-left max-sm:bottom-[calc(100%+12px)] max-sm:left-1/2 max-sm:-translate-x-1/2 ${
                              isRightPlaced
                                ? "sm:left-[calc(100%+16px)] sm:top-1/2 sm:-translate-y-1/2"
                                : "sm:right-[calc(100%+16px)] sm:top-1/2 sm:-translate-y-1/2"
                            }`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {/* Triangle Pointer pointing directly at the button */}
                            <div
                              className={`absolute h-4 w-4 rotate-45 bg-white border-slate-200 max-sm:left-1/2 max-sm:-bottom-2 max-sm:-translate-x-1/2 max-sm:border-b max-sm:border-r ${
                                isRightPlaced
                                  ? "sm:-left-2 sm:top-1/2 sm:-translate-y-1/2 sm:border-l sm:border-b"
                                  : "sm:-right-2 sm:top-1/2 sm:-translate-y-1/2 sm:border-r sm:border-t"
                              }`}
                            />

                            

                            {/* Title & Short Description */}
                            <div className="my-2.5 space-y-1">
                              <h4 className="text-sm font-black text-slate-900 line-clamp-1">
                                {item.title}
                              </h4>
                              <p className="text-[11px] text-slate-500 font-medium line-clamp-2 leading-relaxed">
                                {item.description || "Nắm trọn từ vựng then chốt, ngữ pháp và bài tập thực chiến."}
                              </p>
                            </div>

                            {/* Start Action Buttons */}
                            <div className="space-y-1.5">
                              <Link
                                to={`/roadmap/${item.id}`}
                                onClick={() => setSelectedStage(null)}
                                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-600 py-2.5 px-4 text-xs font-black text-white shadow-md shadow-red-500/20 hover:from-red-500 hover:to-rose-500 active:scale-95 transition-all cursor-pointer"
                              >
                                <Play size={14} className="fill-white" />
                                <span>BẮT ĐẦU</span>
                              </Link>
                            </div>
                          </div>
                        )}

                        {/* 3D Physical Game Token / Stage Disc Button */}
                        <button
                          type="button"
                          onClick={() => {
                            sound.playWoodblock();
                            setSelectedStage((prev) => (prev?.id === item.id ? null : item));
                          }}
                          className={`group relative flex items-center justify-center cursor-pointer select-none transition-all duration-150 ${
                            isBoss ? "h-24 w-24 rounded-3xl btn-stage-boss" : "h-20 w-20 rounded-2xl"
                          } ${
                            isBoss
                              ? "btn-stage-boss"
                              : isCurrent
                              ? "btn-stage-active"
                              : "btn-stage-completed"
                          }`}
                        >
                          <div className="flex flex-col items-center gap-0.5">
                            {isBoss ? (
                              <>
                                <Crown className="h-8 w-8 text-amber-200 drop-shadow-xs animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-wider text-white drop-shadow-xs">
                                  Boss!
                                </span>
                              </>
                            ) : isCurrent ? (
                              <>
                                <Play className="h-8 w-8 fill-white text-white translate-x-0.5 drop-shadow-sm" />
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-950">
                                  Chiến!
                                </span>
                              </>
                            ) : (
                              <CheckCircle2 className="h-8 w-8 text-white drop-shadow-xs" />
                            )}
                            <div className="flex gap-0.5 mt-0.5">
                              {[1, 2, 3].map((s) => (
                                <Star
                                  key={s}
                                  className="h-2.5 w-2.5 fill-amber-300 text-amber-300"
                                />
                              ))}
                            </div>
                          </div>

                          {/* Stage Order Badge */}
                          <span
                            className={`absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-black shadow-sm border border-white ${
                              isBoss
                                ? "bg-slate-900 text-amber-400"
                                : isCurrent
                                ? "bg-slate-900 text-amber-400"
                                : "bg-emerald-700 text-white"
                            }`}
                          >
                            {idx + 1}
                          </span>
                        </button>

                        {/* Stage Info Card Underneath */}
                        <div className="mt-3 flex flex-col items-center text-center">
                          <div
                            onClick={() => {
                              sound.playWoodblock();
                              setSelectedStage((prev) => (prev?.id === item.id ? null : item));
                            }}
                            className="flex items-center gap-2.5 px-3.5 py-2 hover:border-red-300 cursor-pointer"
                          >
                            <div className="text-left">
                              <p className="max-w-[170px] truncate text-xs font-black text-slate-900">
                                {item.title}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
        </div>
      </div>

      {/* Modal Thông Báo Lộ Trình Riêng Dành Cho Học Viên */}
      <RoadmapAccessModal
        open={accessModalOpen}
        onClose={() => setAccessModalOpen(false)}
      />
    </SiteLayout>
  );
}
