import type { Route } from "./+types/game.$lessonId";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { data, Link } from "react-router";
import { ChevronLeft, Heart, Trophy, RotateCcw, Zap } from "lucide-react";
import { requireUser } from "~/lib/auth.server";
import { prisma } from "~/lib/db.server";

export async function loader({ request, params }: Route.LoaderArgs) {
  const user = await requireUser(request);
  const lesson = await prisma.lesson.findUnique({
    where: { id: params.lessonId },
    include: { vocabularies: true },
  });
  if (!lesson) throw data("Không tìm thấy bài học", { status: 404 });
  return { user, lesson };
}

// ─── Types ────────────────────────────────────────────────
type GameMode  = "classic" | "pinyin" | "reverse";
type GamePhase = "idle" | "playing" | "over";
type VocabItem = { id: string; chinese: string; pinyin: string; meaningVi: string };

type Bubble = {
  id: number;
  vocab: VocabItem;
  x: number;
  size: number;
  colorIdx: number;
  duration: number;
  spawnedAt: number;
  popping: boolean;
};

type Bullet = {
  id: number;
  /** start px relative to arena */
  fromX: number;
  fromY: number;
  /** end px relative to arena */
  toX: number;
  toY: number;
  correct: boolean;
};

type Spark = { id: number; x: number; y: number; angle: number; color: string };

// ─── Constants ────────────────────────────────────────────
const LIVES_MAX    = 3;
const BASE_DUR     = 11;
const MIN_DUR      = 5;
const SPAWN_MS     = 2600;
const MAX_BUBBLES  = 4;
const BULLET_MS    = 340; // how long bullet travels

const COLORS = [
  { from: "#7c3aed", to: "#a855f7", glow: "rgba(124,58,237,0.8)"  },
  { from: "#be123c", to: "#f43f5e", glow: "rgba(190,18,60,0.8)"   },
  { from: "#0369a1", to: "#38bdf8", glow: "rgba(3,105,161,0.8)"   },
  { from: "#059669", to: "#34d399", glow: "rgba(5,150,105,0.8)"   },
  { from: "#b45309", to: "#fbbf24", glow: "rgba(217,119,6,0.8)"   },
  { from: "#6d28d9", to: "#c084fc", glow: "rgba(109,40,217,0.8)"  },
];

const SPARK_COLORS = ["#fbbf24","#f43f5e","#a855f7","#34d399","#38bdf8","#fb923c","#fff"];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function getAnswer(v: VocabItem, mode: GameMode) {
  if (mode === "pinyin")  return v.pinyin;
  if (mode === "reverse") return v.chinese;
  return v.meaningVi;
}
function getQuestion(v: VocabItem, mode: GameMode) {
  return mode === "reverse" ? v.meaningVi : v.chinese;
}

// ─── Main Component ───────────────────────────────────────
export default function GamePage({ loaderData }: Route.ComponentProps) {
  const { lesson } = loaderData;
  const vocabs = lesson.vocabularies as VocabItem[];

  const [mode,    setMode]    = useState<GameMode>("classic");
  const [phase,   setPhase]   = useState<GamePhase>("idle");
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [lives,   setLives]   = useState(LIVES_MAX);
  const [score,   setScore]   = useState(0);
  const [combo,   setCombo]   = useState(0);
  const [wrongId, setWrongId] = useState<number | null>(null);
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [sparks,  setSparks]  = useState<Spark[]>([]);

  const bubbleIdRef  = useRef(0);
  const bulletIdRef  = useRef(0);
  const sparkIdRef   = useRef(0);
  const bubblesRef   = useRef<Bubble[]>([]);
  const livesRef     = useRef(LIVES_MAX);
  const phaseRef     = useRef<GamePhase>("idle");
  const diffRef      = useRef(0);
  // DOM refs
  const arenaRef     = useRef<HTMLDivElement>(null);
  const bubbleRefs   = useRef<Map<number, HTMLDivElement>>(new Map());

  bubblesRef.current = bubbles;
  livesRef.current   = lives;
  phaseRef.current   = phase;

  // ── Focused bubble ──
  const focusedBubble = useMemo(() => {
    const active = bubbles.filter(b => !b.popping);
    if (!active.length) return null;
    const now = Date.now();
    return active.reduce((a, b) =>
      (a.spawnedAt + a.duration * 1000) - now <= (b.spawnedAt + b.duration * 1000) - now ? a : b
    );
  }, [bubbles]);

  // ── Choices ──
  const choices = useMemo(() => {
    if (!focusedBubble) return [];
    const correct = getAnswer(focusedBubble.vocab, mode);
    const distractors = shuffle(
      vocabs.filter(v => v.id !== focusedBubble.vocab.id)
            .map(v => getAnswer(v, mode)).filter(Boolean)
    ).slice(0, 3);
    return shuffle([correct, ...distractors]);
  }, [focusedBubble?.id, mode, vocabs]);

  // ── Spawn bubble ──
  const spawnBubble = useCallback(() => {
    if (phaseRef.current !== "playing") return;
    if (bubblesRef.current.filter(b => !b.popping).length >= MAX_BUBBLES) return;
    const vocab    = vocabs[Math.floor(Math.random() * vocabs.length)];
    const duration = Math.max(MIN_DUR, BASE_DUR - diffRef.current);
    const id       = ++bubbleIdRef.current;
    const x        = 6 + Math.random() * 64;
    const size     = 90 + Math.random() * 30;
    const colorIdx = Math.floor(Math.random() * COLORS.length);
    setBubbles(prev => [...prev, { id, vocab, x, size, colorIdx, duration, spawnedAt: Date.now(), popping: false }]);
    diffRef.current = Math.min(diffRef.current + 0.2, BASE_DUR - MIN_DUR);
  }, [vocabs]);

  // ── Pop bubble with sparks ──
  const popBubble = useCallback((id: number) => {
    const el = bubbleRefs.current.get(id);
    const arena = arenaRef.current;
    if (el && arena) {
      const bRect = el.getBoundingClientRect();
      const aRect = arena.getBoundingClientRect();
      const cx = bRect.left - aRect.left + bRect.width / 2;
      const cy = bRect.top  - aRect.top  + bRect.height / 2;
      const newSparks: Spark[] = Array.from({ length: 14 }, (_, i) => ({
        id: ++sparkIdRef.current,
        x: cx, y: cy,
        angle: (i / 14) * 360,
        color: SPARK_COLORS[i % SPARK_COLORS.length],
      }));
      setSparks(prev => [...prev, ...newSparks]);
      setTimeout(() => setSparks(prev => prev.filter(s => !newSparks.find(n => n.id === s.id))), 600);
    }
    setBubbles(prev => prev.map(b => b.id === id ? { ...b, popping: true } : b));
    setTimeout(() => setBubbles(prev => prev.filter(b => b.id !== id)), 350);
  }, []);

  // ── Fire bullet ──
  const fireBullet = useCallback((
    correct: boolean,
    btnEl: HTMLButtonElement | null,
    targetId: number,
  ) => {
    const arena = arenaRef.current;
    const targetEl = bubbleRefs.current.get(targetId);
    if (!arena || !btnEl) return;

    const aRect = arena.getBoundingClientRect();
    const bRect = btnEl.getBoundingClientRect();
    const fromX = bRect.left + bRect.width  / 2 - aRect.left;
    const fromY = bRect.top  + bRect.height / 2 - aRect.top;

    let toX: number, toY: number;
    if (targetEl) {
      const tRect = targetEl.getBoundingClientRect();
      toX = tRect.left + tRect.width  / 2 - aRect.left;
      toY = tRect.top  + tRect.height / 2 - aRect.top;
    } else {
      toX = aRect.width / 2;
      toY = 0;
    }

    const id = ++bulletIdRef.current;
    setBullets(prev => [...prev, { id, fromX, fromY, toX, toY, correct }]);
    setTimeout(() => setBullets(prev => prev.filter(b => b.id !== id)), BULLET_MS + 50);
  }, []);

  // ── Handle answer ──
  const handleAnswer = useCallback((choice: string, btnIdx: number, btnEl: HTMLButtonElement | null) => {
    if (!focusedBubble || focusedBubble.popping) return;
    const correct = getAnswer(focusedBubble.vocab, mode);
    const isRight = choice === correct;

    fireBullet(isRight, btnEl, focusedBubble.id);

    if (isRight) {
      const newCombo = combo + 1;
      const mult = newCombo >= 6 ? 4 : newCombo >= 4 ? 3 : newCombo >= 2 ? 2 : 1;
      setScore(s => s + 10 * mult);
      setCombo(newCombo);
      setTimeout(() => popBubble(focusedBubble.id), BULLET_MS - 20);
    } else {
      setCombo(0);
      setWrongId(btnIdx);
      setTimeout(() => setWrongId(null), 380);
    }
  }, [focusedBubble, mode, combo, fireBullet, popBubble]);

  // ── Start game ──
  const startGame = useCallback(() => {
    setBubbles([]); setBullets([]); setSparks([]);
    setLives(LIVES_MAX); setScore(0); setCombo(0); setWrongId(null);
    diffRef.current = 0; bubbleIdRef.current = 0; livesRef.current = LIVES_MAX;
    setPhase("playing");
  }, []);

  // ── Spawn timer ──
  useEffect(() => {
    if (phase !== "playing") return;
    spawnBubble();
    const iv = setInterval(spawnBubble, SPAWN_MS);
    return () => clearInterval(iv);
  }, [phase, spawnBubble]);

  // ── Escape checker ──
  useEffect(() => {
    if (phase !== "playing") return;
    const iv = setInterval(() => {
      const now = Date.now();
      const escaped = bubblesRef.current.filter(b => !b.popping && (b.spawnedAt + b.duration * 1000) <= now);
      if (!escaped.length) return;
      setBubbles(prev => prev.filter(b => !escaped.find(e => e.id === b.id)));
      const newLives = livesRef.current - escaped.length;
      if (newLives <= 0) { setLives(0); setPhase("over"); }
      else setLives(newLives);
    }, 250);
    return () => clearInterval(iv);
  }, [phase]);

  // ── Keyboard ──
  useEffect(() => {
    if (phase !== "playing") return;
    const handler = (e: KeyboardEvent) => {
      const n = parseInt(e.key);
      if (n >= 1 && n <= 4 && choices[n - 1]) handleAnswer(choices[n - 1], n - 1, null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [phase, choices, handleAnswer]);

  const comboMult = combo >= 6 ? 4 : combo >= 4 ? 3 : combo >= 2 ? 2 : 1;
  const hasEnough = vocabs.length >= 4;

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden" style={{ background: "linear-gradient(180deg, #0f0c29 0%, #302b63 50%, #24243e 100%)" }}>
      <style>{`
        @keyframes bubble-rise {
          from { bottom: -130px; opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          to   { bottom: calc(100% + 20px); opacity: 0; }
        }
        @keyframes bubble-pop {
          0%   { transform: translate(-50%,50%) scale(1);   opacity: 1; }
          60%  { transform: translate(-50%,50%) scale(1.8); opacity: 0.3; }
          100% { transform: translate(-50%,50%) scale(2.4); opacity: 0; }
        }
        @keyframes pulse-ring {
          0%,100% { box-shadow: 0 0 0 0 var(--glow); }
          50%     { box-shadow: 0 0 0 12px transparent; }
        }
        @keyframes combo-pop {
          0%   { transform: scale(0.5); opacity: 0; }
          60%  { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes star-twinkle {
          0%,100% { opacity: 0.35; }
          50%     { opacity: 1; }
        }
        @keyframes wrong-shake {
          0%,100% { transform: translateX(0); }
          25%     { transform: translateX(-7px); }
          75%     { transform: translateX(7px); }
        }

        /* ── BULLET ── */
        @keyframes bullet-fly {
          0%   { transform: translate(0,0) scale(1); opacity: 1; }
          85%  { opacity: 1; }
          100% { transform: translate(var(--dx),var(--dy)) scale(0.4); opacity: 0; }
        }
        /* ── BULLET TRAIL ── */
        @keyframes trail-fade {
          from { opacity: 0.6; transform: scale(1); }
          to   { opacity: 0;   transform: scale(0.1); }
        }
        /* ── SPARK ── */
        @keyframes spark-fly {
          0%   { transform: translate(0,0) scale(1); opacity: 1; }
          100% { transform: translate(var(--sx),var(--sy)) scale(0); opacity: 0; }
        }

        .star {
          position: absolute; background: white; border-radius: 50%;
          animation: star-twinkle var(--dur) ease-in-out infinite;
        }
        .bubble-float {
          position: absolute; bottom: -130px;
          transform: translate(-50%,50%);
          animation: bubble-rise linear both;
        }
        .bubble-popping {
          animation: bubble-pop 0.38s ease-out both !important;
          bottom: auto !important;
        }
        .choice-wrong { animation: wrong-shake 0.38s ease; }

        .bullet {
          position: absolute;
          width: 14px; height: 14px;
          border-radius: 50%;
          pointer-events: none;
          transform-origin: center center;
          animation: bullet-fly var(--dur) cubic-bezier(0.25,0.46,0.45,0.94) both;
        }
        .bullet::before {
          content: '';
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          opacity: 0.4;
          background: inherit;
          filter: blur(4px);
        }
        .spark {
          position: absolute;
          width: 8px; height: 8px;
          border-radius: 50%;
          pointer-events: none;
          animation: spark-fly 0.55s ease-out both;
        }
      `}</style>

      <Stars />

      {/* ── Header ── */}
      <header className="relative z-20 flex items-center gap-3 px-4 py-3">
        <Link
          to={`/lessons/${lesson.id}`}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20 transition"
        >
          <ChevronLeft size={20} />
        </Link>
        <div className="flex-1">
          <p className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">Bắn Bóng Từ</p>
          <p className="text-sm font-bold text-white truncate">{lesson.title}</p>
        </div>
        {phase === "playing" && (
          <>
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Điểm</span>
              <span className="text-xl font-black text-white tabular-nums">{score}</span>
            </div>
            {combo >= 2 && (
              <div
                key={combo}
                className="flex flex-col items-center rounded-xl px-2.5 py-1"
                style={{ background: "rgba(251,191,36,0.15)", animation: "combo-pop 0.3s ease both" }}
              >
                <Zap size={12} className="text-amber-400" />
                <span className="text-xs font-black text-amber-300">x{comboMult}</span>
              </div>
            )}
            <div className="flex gap-1">
              {Array.from({ length: LIVES_MAX }).map((_, i) => (
                <Heart key={i} size={20} className={i < lives ? "text-rose-400 fill-rose-400" : "text-white/15"} />
              ))}
            </div>
          </>
        )}
      </header>

      {/* ── Game arena ── */}
      <div ref={arenaRef} className="relative flex-1 overflow-hidden">
        {phase === "playing" && (
          <div className="absolute inset-x-0 top-0 h-1 z-10" style={{ background: "linear-gradient(90deg,transparent,rgba(239,68,68,0.7),transparent)" }} />
        )}

        {/* Bubbles */}
        {bubbles.map(b => {
          const col = COLORS[b.colorIdx];
          const isFocused = focusedBubble?.id === b.id && !b.popping;
          return (
            <div
              key={b.id}
              ref={el => { if (el) bubbleRefs.current.set(b.id, el); else bubbleRefs.current.delete(b.id); }}
              className={b.popping ? "bubble-float bubble-popping" : "bubble-float"}
              style={{
                left: `${b.x}%`,
                width: b.size,
                height: b.size,
                animationDuration: b.popping ? "0.38s" : `${b.duration}s`,
                animationTimingFunction: "linear",
                "--glow": col.glow,
              } as React.CSSProperties}
            >
              <div
                className="flex h-full w-full flex-col items-center justify-center rounded-full text-white"
                style={{
                  background: `radial-gradient(circle at 35% 30%, ${col.to}, ${col.from})`,
                  boxShadow: isFocused
                    ? `0 0 0 3px white, 0 0 24px ${col.glow}, 0 0 48px ${col.glow}`
                    : `0 4px 20px ${col.glow}, inset 0 1px 0 rgba(255,255,255,0.25)`,
                  animation: isFocused ? "pulse-ring 1.3s ease-in-out infinite" : undefined,
                }}
              >
                <span
                  className="select-none font-hanzi font-black leading-none"
                  style={{ fontSize: b.size * (b.vocab.chinese.length > 2 ? 0.24 : 0.37) }}
                >
                  {getQuestion(b.vocab, mode)}
                </span>
                {mode !== "reverse" && b.vocab.chinese.length <= 2 && (
                  <span className="mt-0.5 text-[10px] font-semibold opacity-60">{b.vocab.pinyin}</span>
                )}
              </div>
            </div>
          );
        })}

        {/* ── BULLETS ── */}
        {bullets.map(bullet => {
          const dx = bullet.toX - bullet.fromX;
          const dy = bullet.toY - bullet.fromY;
          return (
            <div
              key={bullet.id}
              className="bullet z-30"
              style={{
                left: bullet.fromX - 7,
                top:  bullet.fromY - 7,
                background: bullet.correct
                  ? "radial-gradient(circle, #fbbf24, #f97316)"
                  : "radial-gradient(circle, #f87171, #dc2626)",
                boxShadow: bullet.correct
                  ? "0 0 8px #fbbf24, 0 0 16px #f97316"
                  : "0 0 8px #f87171",
                "--dx": `${dx}px`,
                "--dy": `${dy}px`,
                "--dur": `${BULLET_MS}ms`,
              } as React.CSSProperties}
            />
          );
        })}

        {/* ── SPARKS ── */}
        {sparks.map(spark => {
          const dist = 60 + Math.random() * 50;
          const rad  = (spark.angle * Math.PI) / 180;
          return (
            <div
              key={spark.id}
              className="spark z-30"
              style={{
                left: spark.x - 4,
                top:  spark.y - 4,
                background: spark.color,
                boxShadow: `0 0 6px ${spark.color}`,
                "--sx": `${Math.cos(rad) * dist}px`,
                "--sy": `${Math.sin(rad) * dist}px`,
                animationDelay: `${Math.random() * 0.06}s`,
              } as React.CSSProperties}
            />
          );
        })}

        {/* ── IDLE ── */}
        {phase === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-6 text-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-3xl text-5xl" style={{ background: "rgba(255,255,255,0.08)" }}>
              🎯
            </div>
            <div>
              <h1 className="text-3xl font-black text-white">Bắn Bóng Từ</h1>
              <p className="mt-1.5 text-sm text-white/50">Chọn đúng nghĩa để bắn bóng trước khi chúng bay lên!</p>
            </div>
            {!hasEnough ? (
              <p className="rounded-2xl bg-rose-500/20 px-5 py-3 text-sm font-semibold text-rose-300">
                Cần ít nhất 4 từ vựng để chơi.
              </p>
            ) : (
              <>
                <div className="flex gap-2 rounded-2xl bg-white/5 p-1.5">
                  {([["classic","Chữ → Nghĩa"],["pinyin","Chữ → Pinyin"],["reverse","Nghĩa → Chữ"]] as const).map(([m, label]) => (
                    <button key={m} onClick={() => setMode(m)}
                      className={`rounded-xl px-3 py-2 text-xs font-bold transition ${mode === m ? "bg-white text-slate-900" : "text-white/60 hover:text-white"}`}>
                      {label}
                    </button>
                  ))}
                </div>
                <button onClick={startGame}
                  className="rounded-2xl px-10 py-4 text-lg font-black text-white shadow-xl transition hover:scale-105 active:scale-95"
                  style={{ background: "linear-gradient(135deg,#f43f5e,#f97316)" }}>
                  Bắt đầu chơi 🚀
                </button>
              </>
            )}
          </div>
        )}

        {/* ── GAME OVER ── */}
        {phase === "over" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6">
            <div className="w-full max-w-sm rounded-3xl p-8 text-center"
              style={{ background: "rgba(15,12,41,0.92)", border: "1.5px solid rgba(255,255,255,0.1)", backdropFilter: "blur(16px)", animation: "combo-pop 0.35s ease both" }}>
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl"
                style={{ background: "linear-gradient(135deg,#f59e0b,#ef4444)" }}>
                <Trophy size={36} className="text-white" />
              </div>
              <h2 className="text-2xl font-black text-white">Game Over!</h2>
              <p className="mt-1 text-sm text-white/50">Bạn đã hết mạng 💀</p>
              <div className="mt-5 flex justify-center gap-8">
                <div className="text-center">
                  <p className="text-3xl font-black text-amber-400">{score}</p>
                  <p className="text-xs text-white/40">Điểm</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-black text-violet-400">{combo}</p>
                  <p className="text-xs text-white/40">Combo</p>
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <button onClick={startGame}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold text-white"
                  style={{ background: "linear-gradient(135deg,#f43f5e,#f97316)" }}>
                  <RotateCcw size={15} /> Chơi lại
                </button>
                <Link to={`/lessons/${lesson.id}`}
                  className="flex flex-1 items-center justify-center rounded-2xl border border-white/15 py-3 text-sm font-bold text-white/70 hover:bg-white/10 transition">
                  Về bài học
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Answer bar ── */}
      {phase === "playing" && focusedBubble && (
        <div className="relative z-20 p-3"
          style={{ background: "rgba(10,8,30,0.9)", backdropFilter: "blur(10px)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="grid grid-cols-2 gap-2 max-w-lg mx-auto">
            {choices.map((choice, i) => {
              const hasCJK  = /[\u4e00-\u9fff]/.test(choice);
              const isWrong = wrongId === i;
              return (
                <button
                  key={`${focusedBubble.id}-${i}`}
                  onClick={(e) => handleAnswer(choice, i, e.currentTarget)}
                  className={`flex items-center gap-2.5 rounded-2xl border px-4 py-3 text-left font-bold text-white transition active:scale-95 ${
                    isWrong
                      ? "choice-wrong border-red-500/60 bg-red-500/15"
                      : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20"
                  }`}
                >
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-black ${isWrong ? "bg-red-500/40" : "bg-white/10"}`}>
                    {i + 1}
                  </span>
                  <span className={`text-sm leading-tight ${hasCJK ? "font-hanzi text-base" : ""}`}>
                    {choice}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-1.5 text-center text-[10px] text-white/20">Nhấn 1–4 để chọn nhanh</p>
        </div>
      )}

      {phase === "playing" && !focusedBubble && (
        <div className="relative z-20 flex items-center justify-center p-5"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="animate-pulse text-sm text-white/30">Đang phát bóng mới...</p>
        </div>
      )}
    </div>
  );
}

// ─── Stars ───────────────────────────────────────────────
function Stars() {
  const stars = useMemo(() =>
    Array.from({ length: 70 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top:  Math.random() * 100,
      size: 1 + Math.random() * 2.2,
      dur:  1.4 + Math.random() * 3,
      delay: Math.random() * 2,
    })), []);
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {stars.map(s => (
        <span key={s.id} className="star" style={{
          left: `${s.left}%`, top: `${s.top}%`,
          width: s.size, height: s.size,
          "--dur": `${s.dur}s`, animationDelay: `${s.delay}s`,
        } as React.CSSProperties} />
      ))}
    </div>
  );
}
