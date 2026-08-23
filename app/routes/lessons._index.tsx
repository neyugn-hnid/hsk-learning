import type { Route } from "./+types/lessons._index";
import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import {
  Search,
  BookOpen,
  Sparkles,
  ArrowRight,
  ChevronLeft,
  Layers,
  X,
  CheckCircle2,
  BookMarked,
  Sword,
  Shield,
  ScrollText,
  Gem,
  Flame,
  KeyRound,
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
  const totalLessonsInSource = levelStats.reduce((acc, curr) => acc + curr.lessonCount, 0);
  const totalWordsInSource = levelStats.reduce((acc, curr) => acc + curr.wordCount, 0);

  return { user, lessons, levels, levelStats, source, level, q, totalLessonsInSource, totalWordsInSource };
}

const LEVEL_STYLES: Record<string, { badge: string; gradient: string }> = {
  HSK1: { badge: "bg-sky-500 text-white", gradient: "from-sky-600 to-blue-700" },
  HSK2: { badge: "bg-emerald-500 text-white", gradient: "from-emerald-600 to-teal-700" },
  HSK3: { badge: "bg-orange-500 text-white", gradient: "from-orange-500 to-amber-600" },
  HSK4: { badge: "bg-violet-500 text-white", gradient: "from-violet-600 to-purple-700" },
  HSK5: { badge: "bg-rose-500 text-white", gradient: "from-rose-600 to-red-700" },
  HSK6: { badge: "bg-fuchsia-600 text-white", gradient: "from-fuchsia-600 to-purple-700" },
};

function getLevelStyle(lvl: string) {
  return LEVEL_STYLES[lvl.trim()] ?? { badge: "bg-slate-600 text-white", gradient: "from-slate-600 to-slate-700" };
}

const LEVEL_GLOW_COLORS: Record<string, string> = {
  HSK1: "rgba(56,189,248,0.55)",
  HSK2: "rgba(52,211,153,0.55)",
  HSK3: "rgba(251,146,60,0.55)",
  HSK4: "rgba(167,139,250,0.55)",
  HSK5: "rgba(251,113,133,0.55)",
  HSK6: "rgba(232,121,249,0.55)",
};

const LEVEL_LEVER_IMGS: Record<string, string> = {
  HSK1: "/images/lv1.png",
  HSK2: "/images/lv2.png",
  HSK3: "/images/lv3.png",
  HSK4: "/images/lv4.png",
  HSK5: "/images/lv5.png",
  HSK6: "/images/lv6.png",
};

const LEVEL_BADGE_IMGS: Record<string, string> = {
  HSK1: "/images/r1.png",
  HSK2: "/images/r2.png",
  HSK3: "/images/r3.png",
  HSK4: "/images/r4.png",
  HSK5: "/images/r5.png",
  HSK6: "/images/r6.png",
};

const STARS = [
  // bright stars
  { s: "3px", t: "4%",  l: "8%",  o: 0.9, c: "#fff8e7" },
  { s: "2px", t: "7%",  l: "22%", o: 0.7, c: "#ffe8a0" },
  { s: "4px", t: "2%",  l: "58%", o: 0.9, c: "#ffffff" },
  { s: "2px", t: "11%", l: "78%", o: 0.8, c: "#fff8e7" },
  { s: "3px", t: "14%", l: "44%", o: 0.6, c: "#ffe8a0" },
  { s: "2px", t: "19%", l: "4%",  o: 0.7, c: "#ffffff" },
  { s: "2px", t: "21%", l: "88%", o: 0.5, c: "#fff8e7" },
  { s: "4px", t: "29%", l: "68%", o: 0.8, c: "#ffe8a0" },
  { s: "3px", t: "34%", l: "13%", o: 0.9, c: "#ffffff" },
  { s: "2px", t: "37%", l: "49%", o: 0.5, c: "#fff8e7" },
  // dim stars
  { s: "1px", t: "6%",  l: "35%", o: 0.4, c: "#ffffff" },
  { s: "1px", t: "16%", l: "72%", o: 0.3, c: "#ffe8a0" },
  { s: "1px", t: "27%", l: "55%", o: 0.4, c: "#ffffff" },
  { s: "1px", t: "41%", l: "83%", o: 0.3, c: "#fff8e7" },
  { s: "1px", t: "53%", l: "63%", o: 0.5, c: "#ffffff" },
  { s: "2px", t: "59%", l: "7%",  o: 0.7, c: "#ffe8a0" },
  { s: "1px", t: "64%", l: "38%", o: 0.3, c: "#ffffff" },
  { s: "3px", t: "69%", l: "73%", o: 0.6, c: "#fff8e7" },
  { s: "2px", t: "74%", l: "18%", o: 0.5, c: "#ffe8a0" },
  { s: "1px", t: "79%", l: "52%", o: 0.4, c: "#ffffff" },
  { s: "2px", t: "84%", l: "90%", o: 0.6, c: "#fff8e7" },
  { s: "3px", t: "89%", l: "33%", o: 0.5, c: "#ffe8a0" },
  { s: "1px", t: "94%", l: "11%", o: 0.7, c: "#ffffff" },
  { s: "2px", t: "17%", l: "33%", o: 0.4, c: "#fff8e7" },
  { s: "1px", t: "46%", l: "26%", o: 0.5, c: "#ffffff" },
  { s: "2px", t: "51%", l: "17%", o: 0.3, c: "#ffe8a0" },
  { s: "3px", t: "67%", l: "60%", o: 0.7, c: "#ffffff" },
  { s: "1px", t: "82%", l: "44%", o: 0.4, c: "#fff8e7" },
  { s: "2px", t: "92%", l: "77%", o: 0.6, c: "#ffe8a0" },
  { s: "1px", t: "98%", l: "55%", o: 0.3, c: "#ffffff" },
];

/* ── Waypoints: exact positions clicked on map.png via map-editor.html ── */
const WAYPOINTS = [
  { x: 8.1,  y: 87.9 }, // 1
  { x: 9.2,  y: 59.4 }, // 2
  { x: 20.8, y: 41.6 }, // 3
  { x: 32.6, y: 32.9 }, // 4
  { x: 46.3, y: 18.9 }, // 5
  { x: 59.8, y: 30.8 }, // 6
  { x: 55.2, y: 47.4 }, // 7
  { x: 37,   y: 53.8 }, // 8
  { x: 48,   y: 72.4 }, // 9
  { x: 69.4, y: 82.6 }, // 10
  { x: 76.8, y: 57.8 }, // 11
  { x: 86.3, y: 26.8 }, // 12
];

/* ── Image Badge ── */
function NodeBadge({ num, active, themeIdx, badgeImg }: { num: number; active: boolean; themeIdx: number; badgeImg: string }) {
  const hue = (themeIdx * 137.5) % 360;
  return (
    <div className="node-badge-wrap" data-active={active || undefined}>
      <img
        src={badgeImg}
        alt=""
        className="node-badge-img"
        draggable={false}
        style={{ filter: `hue-rotate(${hue}deg)` }}
      />
      <span className="node-badge-num">{String(num).padStart(2, "0")}</span>
    </div>
  );
}

const ZIGZAG_XS = [50, 72, 84, 72, 50, 28, 16, 28];
const ROW_H = 130; // px per lesson row

function MapView({ lessons, level }: { lessons: any[]; level: string }) {
  const badgeImg = LEVEL_BADGE_IMGS[level] || "/images/r1.png";
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const totalH = lessons.length * ROW_H + 100;

  const nodes = lessons.map((_, i) => ({
    xPct: ZIGZAG_XS[i % ZIGZAG_XS.length],
    y: i * ROW_H + 80,
  }));

  return (
    <div className="relative mx-auto" style={{ maxWidth: 480, minHeight: totalH }}>

      {/* Dashed connecting path */}
      <svg
        className="absolute inset-0 pointer-events-none overflow-visible"
        width="100%"
        style={{ height: totalH }}
      >
        {nodes.slice(0, -1).map((n, i) => {
          const nx = nodes[i + 1];
          return (
            <line
              key={i}
              x1={`${n.xPct}%`} y1={n.y}
              x2={`${nx.xPct}%`} y2={nx.y}
              stroke="rgba(180,120,20,0.45)"
              strokeWidth="3"
              strokeDasharray="10 7"
              strokeLinecap="round"
            />
          );
        })}
      </svg>

      {/* START label */}
      <div className="flex justify-center mb-0" style={{ position: "absolute", top: 20, left: 0, right: 0 }}>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-700/40 bg-amber-900/30 px-4 py-1.5 text-xs font-black text-amber-400 backdrop-blur">
          🏁 BAT DAU
        </span>
      </div>

      {/* Click-outside overlay — rendered BEFORE nodes so popups sit on top */}
      {activeIdx !== null && (
        <div className="fixed inset-0 z-40" onClick={() => setActiveIdx(null)} />
      )}

      {/* Lesson nodes */}
      {nodes.map((node, idx) => {
        const lesson = lessons[idx];
        const isActive = activeIdx === idx;
        const popLeft = node.xPct <= 50;

        return (
          <div
            key={lesson.id}
            className="absolute"
            style={{
              left: `${node.xPct}%`,
              top: node.y,
              transform: "translate(-50%, -50%)",
              zIndex: isActive ? 50 : 10,
            }}
          >
            {/* Glow ring + Button */}
            <button
              type="button"
              onClick={() => setActiveIdx(isActive ? null : idx)}
              className="relative flex flex-col items-center gap-1 focus:outline-none group transition-transform duration-200 hover:scale-110 active:scale-95"
            >
              <NodeBadge num={lesson.orderNo} active={isActive} themeIdx={idx} badgeImg={badgeImg} />
              {/* Lesson title below node */}
              <span
                className="text-center font-semibold text-amber-200/70 leading-tight"
                style={{
                  fontSize: "clamp(9px, 1.5vw, 11px)",
                  maxWidth: "clamp(70px, 12vw, 100px)",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {lesson.title}
              </span>
            </button>

            {/* Popup card */}
            {isActive && (
              <div
                className="absolute z-50 rounded-2xl shadow-2xl overflow-hidden"
                style={{
                  width: 210,
                  background: "rgba(8,4,1,0.96)",
                  border: "1px solid rgba(180,120,20,0.55)",
                  backdropFilter: "blur(20px)",
                  top: "-8px",
                  ...(popLeft
                    ? { left: "calc(100% + 12px)" }
                    : { right: "calc(100% + 12px)" }),
                }}
              >
                <div className="p-4">
                  <p className="text-[10px] text-amber-500/60 font-bold uppercase tracking-wider mb-1">
                    Bai {String(lesson.orderNo).padStart(2, "0")}
                  </p>
                  <h3 className="text-sm font-extrabold text-amber-100 leading-snug line-clamp-2">
                    {lesson.title}
                  </h3>
                  <div className="mt-2 flex items-center gap-1.5 text-[10px] text-amber-400/50">
                    <BookMarked size={9} className="text-amber-500/60" />
                    {lesson._count?.vocabularies || 0} tu vung
                  </div>
                  {lesson.vocabularies?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {lesson.vocabularies.slice(0, 4).map((v: any) => (
                        <span key={v.id} className="rounded border border-amber-700/30 bg-amber-900/20 px-1.5 py-0.5 text-[10px] font-medium text-amber-300/70">
                          {v.word}
                        </span>
                      ))}
                    </div>
                  )}
                  <Link
                    to={`/lessons/${lesson.id}`}
                    prefetch="intent"
                    className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-amber-600 py-2 text-xs font-black text-white hover:bg-amber-500 transition-colors"
                  >
                    Vao hoc <ArrowRight size={11} />
                  </Link>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* FINISH label */}
      <div style={{ position: "absolute", top: totalH - 40, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-700/40 bg-amber-900/30 px-4 py-1.5 text-xs font-black text-amber-400 backdrop-blur">
          🏆 HOAN THANH
        </span>
      </div>


    </div>
  );
}

export default function Lessons({ loaderData }: Route.ComponentProps) {
  const [params, setParams] = useSearchParams();
  const { lessons, levelStats, source, level, q, totalLessonsInSource, totalWordsInSource } = loaderData;

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
      <style>{`
        @keyframes gateFloat {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-12px); }
        }
        @keyframes gateShadowPulse {
          0%, 100% { filter: drop-shadow(0 8px 32px var(--glow)) drop-shadow(0 0 12px var(--glow)); }
          50%       { filter: drop-shadow(0 20px 60px var(--glow)) drop-shadow(0 0 36px var(--glow)); }
        }
        @keyframes glowOrb {
          0%, 100% { opacity: 0.25; transform: scale(0.8); }
          50%       { opacity: 0.55; transform: scale(1.2); }
        }
        @keyframes fogDrift {
          0%         { transform: translateX(0) scaleX(1); opacity: 0.18; }
          50%        { transform: translateX(3%) scaleX(1.04); opacity: 0.28; }
          100%       { transform: translateX(0) scaleX(1); opacity: 0.18; }
        }
        @keyframes fogDrift2 {
          0%         { transform: translateX(0) scaleX(1); opacity: 0.12; }
          50%        { transform: translateX(-2%) scaleX(1.03); opacity: 0.22; }
          100%       { transform: translateX(0) scaleX(1); opacity: 0.12; }
        }
        @keyframes twinkle {
          0%, 100% { opacity: var(--star-o); transform: scale(1); }
          50%       { opacity: calc(var(--star-o) * 0.3); transform: scale(0.6); }
        }
        .gate-float { animation: gateFloat 3.5s ease-in-out infinite, gateShadowPulse 3.5s ease-in-out infinite; }
        .gate-glow-orb { animation: glowOrb 3.5s ease-in-out infinite; }
        .fog-1 { animation: fogDrift 12s ease-in-out infinite; }
        .fog-2 { animation: fogDrift2 16s ease-in-out infinite; }
        .star-twinkle { animation: twinkle var(--star-dur, 3s) ease-in-out infinite; }

        /* ── Image Node Badge ── */
        .node-badge-wrap {
          --badge-size: clamp(52px, 9vw, 72px);
          position: relative;
          width: var(--badge-size);
          height: var(--badge-size);
          cursor: pointer;
          transition: transform 0.15s ease, filter 0.2s ease;
        }
        .node-badge-wrap:hover {
          transform: scale(1.12);
        }
        .node-badge-wrap:active {
          transform: scale(0.95);
        }
        .node-badge-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          pointer-events: none;
          transition: filter 0.2s ease;
        }
        .node-badge-num {
          position: absolute;
          top: 45%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-weight: 900;
          font-size: clamp(13px, 2.2vw, 18px);
          color: #fff;
          text-shadow: 0 1px 4px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.4);
          letter-spacing: -0.5px;
          line-height: 1;
          z-index: 1;
        }
        .node-badge-wrap[data-active] {
          filter: drop-shadow(0 0 12px rgba(255,200,60,0.7)) drop-shadow(0 0 24px rgba(255,180,40,0.4));
        }
        .node-badge-wrap[data-active] .node-badge-img {
          filter: brightness(1.15);
        }
      `}</style>
      <div
        className="min-h-screen pb-20"
        style={{ background: "linear-gradient(180deg,#020810 0%,#061220 18%,#0a1a30 40%,#081428 65%,#040e20 85%,#020818 100%)" }}
      >
        {/* Star field — cool twinkling stars */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          {STARS.map((star, i) => (
            <div
              key={i}
              className="absolute rounded-full star-twinkle"
              style={{
                width: star.s, height: star.s, top: star.t, left: star.l,
                backgroundColor: star.c,
                boxShadow: `0 0 ${parseInt(star.s) * 2}px 1px ${star.c}`,
                "--star-o": star.o,
                "--star-dur": `${2.5 + (i % 5) * 0.7}s`,
                animationDelay: `${(i % 7) * 0.4}s`,
              } as React.CSSProperties}
            />
          ))}
        </div>

        {/* Ambient blue/teal light orbs */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full blur-[120px]"
            style={{ background: "radial-gradient(circle,rgba(30,120,200,0.15),transparent 70%)" }} />
          <div className="absolute top-1/3 right-0 w-[500px] h-[500px] rounded-full blur-[100px]"
            style={{ background: "radial-gradient(circle,rgba(20,180,160,0.12),transparent 70%)" }} />
          <div className="absolute bottom-1/4 left-0 w-[400px] h-[400px] rounded-full blur-[100px]"
            style={{ background: "radial-gradient(circle,rgba(60,100,220,0.12),transparent 70%)" }} />
          <div className="absolute bottom-0 right-1/3 w-[500px] h-[500px] rounded-full blur-[120px]"
            style={{ background: "radial-gradient(circle,rgba(100,40,180,0.12),transparent 70%)" }} />
        </div>

        {/* Ground fog layers */}
        <div className="fixed bottom-0 left-0 right-0 pointer-events-none z-0 overflow-hidden">
          <div className="fog-1 h-48 w-full"
            style={{ background: "linear-gradient(to top, rgba(4,12,20,0.55) 0%, rgba(6,14,25,0.3) 40%, transparent 100%)" }} />
          <div className="fog-2 absolute bottom-0 h-32 w-full"
            style={{ background: "linear-gradient(to top, rgba(8,20,35,0.4) 0%, rgba(5,15,28,0.2) 50%, transparent 100%)" }} />
        </div>

        {/* HERO */}
        <section className="relative overflow-hidden px-4 pt-14 pb-12">
          <div className="relative mx-auto max-w-7xl z-10">
            <div className="flex flex-col items-center text-center gap-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-700/40 bg-amber-900/20 px-5 py-2 text-xs font-bold text-amber-300/80 backdrop-blur">
                <Sparkles size={13} className="text-amber-400 animate-pulse" />
                He thong hoc tu vung HSK chuan hoa
              </div>

              <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight max-w-3xl" style={{ textShadow: "0 2px 40px rgba(200,140,20,0.3)" }}>
                Chinh Phuc{" "}
                <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent">
                  HSK Tu Vung
                </span>{" "}
                De Dang
              </h1>

              <p className="text-sm sm:text-base text-purple-200/60 max-w-xl leading-relaxed">
                Luyen ghi nho tu vung, chu Han va phien am pinyin theo tung bai hoc tu co ban den nang cao.
              </p>

              <form className="relative w-full max-w-lg mt-2">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400" size={18} />
                <input
                  name="q"
                  defaultValue={q}
                  placeholder="Tim bai hoc (VD: Gia dinh, Cong viec...)"
                  className="w-full rounded-2xl border border-purple-500/30 bg-white/5 py-3.5 pl-11 pr-10 text-sm text-white placeholder-purple-300/40 backdrop-blur focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                />
                {q && (
                  <button type="button" onClick={clearSearch}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-1 text-purple-300 hover:bg-white/20">
                    <X size={14} />
                  </button>
                )}
              </form>

              <div className="flex flex-wrap justify-center gap-3 mt-1">
                {[
                  { icon: <BookOpen size={15} className="text-sky-400" />, value: totalLessonsInSource, label: "Bai hoc" },
                  { icon: <BookMarked size={15} className="text-amber-400" />, value: totalWordsInSource, label: "Tu vung" },
                  { icon: <Layers size={15} className="text-emerald-400" />, value: levelStats.length, label: "Cap do" },
                ].map((s) => (
                  <div key={s.label}
                    className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/70 backdrop-blur">
                    {s.icon}
                    <strong className="text-white font-black">{s.value}</strong> {s.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* MAIN */}
        <main className="relative mx-auto max-w-7xl px-4 z-10">
          {showAll && (
            <div className="flex justify-center mb-8">
              <div className="inline-flex rounded-2xl border border-purple-500/20 bg-white/5 p-1.5 backdrop-blur gap-1">
                {[
                  { id: "HSK20", label: "HSK 2.0", icon: <BookOpen size={15} /> },
                  { id: "HSK30", label: "HSK 3.0", icon: <Sparkles size={15} className="text-amber-400" /> },
                ].map((tab) => (
                  <button key={tab.id} type="button" onClick={() => setSource(tab.id)}
                    className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold transition-all duration-200 ${
                      source === tab.id
                        ? "bg-purple-600 text-white shadow-lg shadow-purple-900/50"
                        : "text-purple-300/60 hover:text-purple-200"
                    }`}>
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {q && (
            <div className="mb-6 flex items-center justify-between rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              <div className="flex items-center gap-2">
                <Search size={15} className="text-amber-400" />
                Ket qua cho: <strong>"{q}"</strong> ({lessons.length} bai)
              </div>
              <button onClick={clearSearch}
                className="rounded-xl border border-amber-500/30 bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-300 hover:bg-amber-500/30">
                Xoa tim kiem
              </button>
            </div>
          )}

          {showAll ? (
            levelStats.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-purple-500/20 p-16 text-center">
                <BookOpen size={48} className="mx-auto text-purple-400/30 mb-3" />
                <h3 className="text-lg font-bold text-purple-200/60">Chua co bai hoc nao</h3>
              </div>
            ) : (
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {levelStats.map((stat) => {
                  const gateImg = LEVEL_LEVER_IMGS[stat.level] || "/images/lv1.png";
                  const glowColor = LEVEL_GLOW_COLORS[stat.level] || "rgba(167,139,250,0.5)";
                  return (
                    <button
                      key={stat.level}
                      type="button"
                      onClick={() => setLevel(stat.level)}
                      className="group relative flex items-center justify-center focus:outline-none"
                      style={{ minHeight: "280px" }}
                    >
                      {/* Breathing ambient glow orb behind gate */}
                      <div
                        className="gate-glow-orb absolute rounded-full blur-3xl pointer-events-none"
                        style={{
                          width: "60%", height: "60%",
                          backgroundColor: glowColor,
                          top: "10%",
                        }}
                      />

                      {/* Gate image — floats + shadow pulses */}
                      <img
                        src={gateImg}
                        alt={stat.level}
                        className="gate-float relative w-full max-w-[300px] object-contain group-hover:scale-105 transition-transform duration-500"
                        style={{ "--glow": glowColor } as React.CSSProperties}
                        onError={(e) => { (e.target as HTMLImageElement).src = "/images/lv1.png"; }}
                      />
                    </button>
                  );
                })}
              </div>
            )
          ) : (
            <div>
              {/* Back header */}
              <div className="flex items-center gap-3 mb-6">
                <button type="button" onClick={() => setLevel("")}
                  className="flex items-center justify-center w-10 h-10 rounded-2xl border border-amber-700/30 bg-white/5 text-amber-300 hover:bg-white/10 hover:text-white transition-all">
                  <ChevronLeft size={18} />
                </button>
                <div className="h-6 w-px bg-amber-700/30" />
                <div>
                  <p className="text-xs text-amber-500/50 font-semibold uppercase tracking-wider">Cap do</p>
                  <h2 className="text-xl font-black text-white">{level}</h2>
                </div>
                <div className="ml-auto flex items-center gap-2 text-xs text-amber-300/40 font-semibold">
                  <BookOpen size={13} className="text-amber-500/60" />
                  {lessons.length} bai hoc
                </div>
              </div>

              {lessons.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-amber-700/20 p-16 text-center">
                  <BookOpen size={48} className="mx-auto text-amber-400/20 mb-3" />
                  <h3 className="text-lg font-bold text-amber-200/40">Khong tim thay bai hoc</h3>
                </div>
              ) : (
                <MapView lessons={lessons} level={level} />
              )}
            </div>
          )}
        </main>
      </div>
    </SiteLayout>
  );
}
