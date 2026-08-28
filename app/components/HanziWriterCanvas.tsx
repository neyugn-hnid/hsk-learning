import { useEffect, useRef, useState } from "react";
import HanziWriter from "hanzi-writer";
import { Play, RotateCcw, Lightbulb, Check, Sparkles, Volume2 } from "lucide-react";
import { sound } from "~/lib/sound";

interface Props {
  character: string;
  size?: number;
  onComplete?: () => void;
}

export function HanziWriterCanvas({ character, size = 260, onComplete }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const writerRef = useRef<HanziWriter | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [strokeMistakes, setStrokeMistakes] = useState(0);
  const [totalStrokes, setTotalStrokes] = useState(0);
  const [currentStrokeNum, setCurrentStrokeNum] = useState(0);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {  
    if (!containerRef.current || !character) return;

    containerRef.current.innerHTML = "";
    setIsCompleted(false);
    setIsAnimating(false);
    setStrokeMistakes(0);
    setCurrentStrokeNum(0);
    setLoadError(false);

    try {
      const writer = HanziWriter.create(containerRef.current, character, {
        width: size,
        height: size,
        padding: 20,
        showOutline: true,
        strokeAnimationSpeed: 1.2,
        delayBetweenStrokes: 220,
        strokeColor: "#DC2626", // Ruby red ink for completed strokes
        outlineColor: "#CBD5E1", // Slate-300 ghost guide
        highlightColor: "#F59E0B", // Amber-500 hint color
        drawingColor: "#991B1B", // Deep calligraphy brush color
        drawingWidth: 14,
        showCharacter: false,
        showHintAfterMisses: 2,
        leniency: 1.3, // Friendly touch tolerance
        charDataLoader: (char, onLoaded, onErr) => {
          fetch(`https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0/${char}.json`)
            .then((res) => {
              if (!res.ok) throw new Error("Character data not found");
              return res.json();
            })
            .then((data) => {
              if (data?.strokes) {
                setTotalStrokes(data.strokes.length);
              }
              onLoaded(data);
            })
            .catch((err) => {
              console.warn("HanziWriter data fallback:", err);
              setLoadError(true);
              if (onErr) onErr(err);
            });
        },
      });

      writerRef.current = writer;

      // Start quiz / guided auto-fill mode
      writer.quiz({
        onCorrectStroke: (data) => {
          sound.playWoodblock();
          setCurrentStrokeNum(data.strokeNum + 1);
        },
        onMistake: () => {
          sound.playIncorrect();
          setStrokeMistakes((p) => p + 1);
        },
        onComplete: () => {
          setIsCompleted(true);
          sound.playCorrect();
          sound.playCoin();
          if (onComplete) onComplete();
        },
      });
    } catch (e) {
      console.error("HanziWriter init error:", e);
      setLoadError(true);
    }

    return () => {
      writerRef.current = null;
    };
  }, [character, size]);

  const handleAnimate = () => {
    if (!writerRef.current || isAnimating) return;
    setIsAnimating(true);
    writerRef.current.animateCharacter({
      onComplete: () => {
        setIsAnimating(false);
        if (writerRef.current) {
          writerRef.current.quiz({
            onCorrectStroke: (data) => {
              sound.playWoodblock();
              setCurrentStrokeNum(data.strokeNum + 1);
            },
            onMistake: () => {
              sound.playIncorrect();
              setStrokeMistakes((p) => p + 1);
            },
            onComplete: () => {
              setIsCompleted(true);
              sound.playCorrect();
              sound.playCoin();
              if (onComplete) onComplete();
            },
          });
        }
      },
    });
  };

  const handleReset = () => {
    if (!writerRef.current) return;
    setIsCompleted(false);
    setCurrentStrokeNum(0);
    setStrokeMistakes(0);
    writerRef.current.quiz({
      onCorrectStroke: (data) => {
        sound.playWoodblock();
        setCurrentStrokeNum(data.strokeNum + 1);
      },
      onMistake: () => {
        sound.playIncorrect();
        setStrokeMistakes((p) => p + 1);
      },
      onComplete: () => {
        setIsCompleted(true);
        sound.playCorrect();
        sound.playCoin();
        if (onComplete) onComplete();
      },
    });
  };

  const handleHint = () => {
    if (!writerRef.current) return;
    writerRef.current.highlightStroke(currentStrokeNum);
  };

  return (
    <div className="flex flex-col items-center space-y-3 select-none">
      {/* Traditional Rice Grid (米字格) Stage Container */}
      <div className="relative mx-auto flex items-center justify-center overflow-hidden rounded-3xl border-4 border-red-500/30 bg-[#FFFDF9] shadow-inner"
        style={{ width: size, height: size }}
      >
        {/* Rice Grid Lines (米字格) */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-35">
          <line x1="0" y1="0" x2="100%" y2="100%" stroke="#DC2626" strokeDasharray="4 4" strokeWidth="1" />
          <line x1="100%" y1="0" x2="0" y2="100%" stroke="#DC2626" strokeDasharray="4 4" strokeWidth="1" />
          <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#DC2626" strokeDasharray="4 4" strokeWidth="1" />
          <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#DC2626" strokeDasharray="4 4" strokeWidth="1" />
        </svg>

        {/* HanziWriter Target Container */}
        <div ref={containerRef} className="relative z-10 cursor-crosshair touch-none" />

        {/* Stroke Progress Badge */}
        {totalStrokes > 0 && (
          <div className="absolute top-2.5 left-2.5 z-20 rounded-full bg-slate-900/80 backdrop-blur-sm px-2.5 py-0.5 text-[10px] font-black text-white border border-white/10 shadow-xs">
            Nét {Math.min(currentStrokeNum + 1, totalStrokes)} / {totalStrokes}
          </div>
        )}

        {/* Completed Overlay Banner */}
        {isCompleted && (
          <div className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center bg-white/60 backdrop-blur-[2px] animate-in fade-in zoom-in duration-300">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg ring-4 ring-emerald-200 animate-bounce">
              <Check size={28} strokeWidth={3} />
            </div>
            <span className="mt-2 text-xs font-black uppercase tracking-wider text-emerald-700">
              Xuất Sắc!
            </span>
          </div>
        )}
      </div>

      {/* Control Buttons Strip */}
      <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
        <button
          type="button"
          onClick={handleAnimate}
          disabled={isAnimating}
          title={isAnimating ? "Đang Viết Mẫu..." : "Xem Nét Mẫu"}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
        >
          <Play size={13} className={isAnimating ? "animate-spin text-red-600" : "fill-current"} />
          <span className="hidden sm:inline">{isAnimating ? "Đang Viết Mẫu..." : "Xem Nét Mẫu"}</span>
        </button>

        <button
          type="button"
          onClick={handleHint}
          disabled={isCompleted || isAnimating}
          title="Gợi Ý Nét"
          className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800 hover:bg-amber-100 transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
        >
          <Lightbulb size={13} className="text-amber-600" />
          <span className="hidden sm:inline">Gợi Ý Nét</span>
        </button>

        <button
          type="button"
          onClick={handleReset}
          title="Viết Lại"
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer shadow-2xs"
        >
          <RotateCcw size={13} />
          <span className="hidden sm:inline">Viết Lại</span>
        </button>
      </div>
    </div>
  );
}
