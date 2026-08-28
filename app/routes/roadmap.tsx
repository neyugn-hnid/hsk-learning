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
  }
];

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
  const [selectedStage, setSelectedStage] = useState<any | null>(null);

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
              <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-xs">
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

                  {currentPhaseLessons.map((item, idx) => {
                    const isBoss = idx === currentPhaseLessons.length - 1;
                    const isCurrent = idx === 0;
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

                    return (
                      <div
                        key={item.id}
                        className={`relative z-10 flex flex-col items-center transition-transform duration-300 ${currentOffset}`}
                      >
                        {/* 3D Physical Game Token / Stage Disc Button */}
                        <button
                          type="button"
                          onClick={() => {
                            sound.playWoodblock();
                            setSelectedStage(item);
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
                              setSelectedStage(item);
                            }}
                            className="flex items-center gap-2.5 px-3.5 py-2  hover:border-red-300 cursor-pointer"
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

          {/* ========================================================================= */}
          {/* 4. STAGE BRIEFING MODAL (BẢNG NHIỆM VỤ ẢI BÀI HỌC KHI CLICK)              */}
          {/* ========================================================================= */}
          {selectedStage && (() => {
            const vocabs = toRoadmapEntries(selectedStage.vocabulary);
            const phrases = toRoadmapEntries(selectedStage.phrases);

            return (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 backdrop-blur-md transition-all animate-in fade-in duration-200"
                style={{ background: "rgba(15, 23, 42, 0.65)" }}
                onClick={(e) => {
                  if (e.target === e.currentTarget) setSelectedStage(null);
                }}
              >
                <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-[28px] border border-slate-200/80 bg-white shadow-2xl text-slate-900 transition-all animate-in zoom-in-95 duration-200">
                  {/* Header Scenic Artwork Cover */}
                  <div className="relative h-36 sm:h-40 w-full overflow-hidden bg-slate-900">
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
                      style={{ backgroundImage: `url(${r2Asset(activeRealmData.bgImage)})` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-slate-950/40 to-slate-950/60" />

                    {/* Top Bar Floating Badges */}
                    <div className="relative z-10 flex items-center justify-between p-4 sm:p-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider text-white shadow-sm ${activeRealmData.primaryBg}`}
                        >
                          <span>{activeRealmData.chapter} · Ải {selectedStage.orderNo}</span>
                        </span>
                        {selectedStage.duration && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/75 backdrop-blur-md px-2.5 py-1 text-xs font-bold text-white border border-white/15">
                            <span>{selectedStage.duration}</span>
                          </span>
                        )}
                      </div>

                      {/* Glass Close Button */}
                      <button
                        type="button"
                        onClick={() => setSelectedStage(null)}
                        aria-label="Đóng bảng nhiệm vụ"
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white/90 hover:bg-black/60 hover:text-white backdrop-blur-md border border-white/20 transition-all cursor-pointer"
                      >
                        <X size={17} />
                      </button>
                    </div>

                    {/* Chinese Region Tag Watermark */}
                    <div className="absolute right-5 bottom-3 pointer-events-none select-none">
                      <span className="font-hanzi text-4xl font-black text-slate-900/10 tracking-widest">
                        {activeRealmData.chineseName}
                      </span>
                    </div>
                  </div>

                  {/* Main Content Body */}
                  <div className="p-6 sm:p-7 pt-3 space-y-5">
                    {/* Title & Stage Information */}
                    <div>
                      <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                        {selectedStage.title}
                      </h3>

                      {selectedStage.description && (
                        <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-slate-600 font-medium">
                          {selectedStage.description}
                        </p>
                      )}

                      {/* Stage Highlights & Summary Banner */}
                      <div className="mt-3.5 flex flex-wrap items-center gap-2">
                        {vocabs.length > 0 && (
                          <div className="flex items-center gap-1.5 rounded-xl border border-amber-200/80 bg-amber-50/70 px-3 py-1 text-[11px] font-bold text-amber-800">
                            <BookOpen size={12} className="text-amber-600" />
                            <span>{vocabs.length} từ vựng trọng tâm</span>
                          </div>
                        )}
                        {phrases.length > 0 && (
                          <div className="flex items-center gap-1.5 rounded-xl border border-emerald-200/80 bg-emerald-50/70 px-3 py-1 text-[11px] font-bold text-emerald-800">
                            <Sparkles size={12} className="text-emerald-600" />
                            <span>{phrases.length} mẫu câu giao tiếp</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Vocabulary Spotlight Section */}
                    {vocabs.length > 0 && (
                      <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <p className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                            <BookOpen size={13} className="text-red-600" />
                            <span>Từ Vựng Trọng Tâm ({vocabs.length} Từ)</span>
                          </p>
                          <span className="text-[10px] font-medium text-slate-400">Nhấp loa để nghe giọng đọc</span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto pr-1">
                          {vocabs.map((v, i) => (
                            <div
                              key={i}
                              className="group relative flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-2.5 shadow-2xs hover:border-amber-300 hover:shadow-sm transition-all"
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-hanzi text-lg font-bold text-slate-900 group-hover:text-red-600 transition-colors">
                                    {v.chinese}
                                  </p>
                                  <span className="inline-block mt-0.5 text-[11px] font-bold text-amber-700 font-mono tracking-wide">
                                    {v.pinyin}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => speak(v.chinese)}
                                  aria-label={`Nghe phát âm ${v.chinese}`}
                                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
                                >
                                  <Volume2 size={13} />
                                </button>
                              </div>
                              <p className="mt-2 text-xs font-semibold text-slate-600 line-clamp-1 border-t border-slate-100 pt-1.5">
                                {v.meaningVi}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Phrases Section */}
                    {phrases.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[11px] font-black uppercase text-slate-500">
                          Mẫu Câu Đàm Thoại ({phrases.length})
                        </p>
                        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                          {phrases.map((p, i) => (
                            <div
                              key={i}
                              onClick={() => speak(p.chinese)}
                              className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 border border-slate-200/80 hover:bg-amber-50/50 transition cursor-pointer"
                            >
                              <div>
                                <div className="font-hanzi text-xs font-bold text-slate-900">{p.chinese}</div>
                                <div className="text-[10px] text-amber-800 font-mono">{p.pinyin}</div>
                                <div className="text-[10px] text-slate-600">{p.meaningVi}</div>
                              </div>
                              <button type="button" className="p-1 text-slate-400 hover:text-red-700">
                                <Volume2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Call to Action Buttons */}
                    <div className="pt-2 flex flex-col gap-2.5">
                      <Link
                        to={`/roadmap/${selectedStage.id}`}
                        className="flex w-full items-center justify-center gap-2.5 rounded-2xl py-3.5 sm:py-4 text-sm font-black text-white bg-red-600 hover:bg-red-700 shadow-md shadow-red-600/20 active:scale-[0.99] transition-all cursor-pointer"
                      >
                        <BookOpen size={18} />
                        <span>VÀO HỌC BUỔI LỘ TRÌNH NÀY</span>
                        <ArrowRight size={18} />
                      </Link>

                      {selectedStage.lessonId && (
                        <Link
                          to={`/lessons/${selectedStage.lessonId}`}
                          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          <Sparkles size={14} className="text-amber-600" />
                          <span>Luyện Viết Thư Pháp & Quiz Studio</span>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
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
