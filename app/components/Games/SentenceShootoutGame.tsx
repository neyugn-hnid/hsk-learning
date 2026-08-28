import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { sound } from "~/lib/sound";
import { addExpAndGems } from "~/lib/gamification";
import { r2Asset } from "~/lib/assets";
import {
  RotateCcw,
  Trophy,
  Play,
  Volume2,
  VolumeX,
  Target,
  BookOpen,
  Sparkles,
  Heart,
  ChevronDown,
  Check,
  Flame,
} from "lucide-react";

export type ShootoutQuestion = {
  id: string;
  sentence: string; // e.g. "我的房间很 ____ 。"
  options: [string, string, string, string]; // [A, B, C, D]
  correctIndex: number; // 0, 1, 2, 3
  meaningVi: string;
  pinyin?: string;
  explanation?: string;
  level?: string;
  lessonId?: string;
  lessonTitle?: string;
  source?: string;
};

export type ShootoutLesson = {
  id: string;
  title: string;
  level: string;
  source: string;
};

export type ShootoutVocabulary = {
  id: string;
  chinese: string;
  pinyin: string;
  meaningVi: string;
  level?: string;
  exampleChinese?: string | null;
  examplePinyin?: string | null;
  exampleMeaning?: string | null;
  lessonTitle?: string;
  source?: string;
};

export type ShootoutGrammar = {
  id: string;
  title: string;
  structure?: string | null;
  explanation?: string | null;
  example?: string | null;
  meaning?: string | null;
  level?: string;
  source?: string;
};

// =========================================================================
// Sentence Shootout Game (Powered by Gemini AI Question Generation)
// =========================================================================

export interface SentenceShootoutGameProps {
  vocabularies?: ShootoutVocabulary[];
  grammars?: ShootoutGrammar[];
  lessons?: ShootoutLesson[];
  onComplete?: () => void;
}

export function SentenceShootoutGame({
  vocabularies = [],
  grammars = [],
  lessons = [],
  onComplete,
}: SentenceShootoutGameProps) {
  // Sảnh & Bộ lọc HSK
  const [selectedStandard, setSelectedStandard] = useState<"HSK20" | "HSK30">("HSK20");
  const [selectedLevel, setSelectedLevel] = useState<string>("HSK1");
  const [selectedTopicId, setSelectedTopicId] = useState<string>("ALL");
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-centering when game starts
  const scrollToGameCenter = useCallback(() => {
    containerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Lọc chủ đề có sẵn
  const availableTopics = useMemo(() => {
    const map = new Map<string, { id: string; title: string }>();
    lessons.forEach((l) => {
      if (l.level === selectedLevel) {
        map.set(l.id, { id: l.id, title: l.title });
      }
    });
    return Array.from(map.values());
  }, [lessons, selectedLevel]);

  // Reset topic selection when standard or level changes
  useEffect(() => {
    setSelectedTopicId("ALL");
  }, [selectedStandard, selectedLevel]);

  // Game UI & Gameplay State
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);
  const [aiStatusMsg, setAiStatusMsg] = useState<string>("");
  const [gameQuestions, setGameQuestions] = useState<ShootoutQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [lives, setLives] = useState<number>(3);
  const [showMeaningVi, setShowMeaningVi] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(() => sound.getMuted());

  // Trạng thái sút bóng và hoạt ảnh
  // selectedTarget: 0: A (Top Left), 1: B (Bottom Left), 2: C (Bottom Right), 3: D (Top Right)
  const [selectedTarget, setSelectedTarget] = useState<number | null>(null);
  const [shotState, setShotState] = useState<"IDLE" | "SHOOTING" | "GOAL" | "SAVED">("IDLE");
  const [netShake, setNetShake] = useState<boolean>(false);
  const [keeperDive, setKeeperDive] = useState<"IDLE" | "LEFT_UP" | "LEFT_DOWN" | "RIGHT_DOWN" | "RIGHT_UP" | "WRONG_DIVE">("IDLE");

  const currentQ = gameQuestions[currentIndex] || null;

  // Phát âm câu văn hiện tại bằng Web Speech API
  const speakCurrentSentence = useCallback(() => {
    if (!currentQ || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    // Thay thế ____ bằng từ đúng để phát âm hoàn chỉnh
    const fullText = currentQ.sentence.replace("____", currentQ.options[currentQ.correctIndex]);
    const utterance = new SpeechSynthesisUtterance(fullText);
    utterance.lang = "zh-CN";
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }, [currentQ]);

  // Tạo câu hỏi động bằng AI từ API
  const startAIGame = async () => {
    sound.playWoodblock();
    setIsGeneratingAI(true);
    setAiStatusMsg("AI đang phân tích ngữ cảnh HSK và thiết kế 10 quả sút phạt...");
    scrollToGameCenter();

    try {
      const sampleVocabList = vocabularies
        .filter((v) => !v.level || v.level.toUpperCase() === selectedLevel.toUpperCase())
        .slice(0, 30)
        .map((v) => ({ chinese: v.chinese, pinyin: v.pinyin, meaningVi: v.meaningVi }));

      const currentTopic = availableTopics.find((t) => t.id === selectedTopicId);

      const res = await fetch("/api/ai/shootout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          standard: selectedStandard,
          level: selectedLevel,
          topicId: selectedTopicId,
          lessonTitle: currentTopic?.title || "",
          count: 10,
          sampleVocab: sampleVocabList,
        }),
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.questions) && data.questions.length > 0) {
        setGameQuestions(data.questions);
      } else {
        throw new Error(data.error || "Không thể tạo câu hỏi AI");
      }
    } catch (err) {
      console.warn("[AI Shootout Generation Fallback]:", err);
      // Fallback: Tạo câu hỏi động từ từ vựng trong bài
      const fallbackQuestions: ShootoutQuestion[] = [];
      const pool = vocabularies.filter((v) => !v.level || v.level.toUpperCase() === selectedLevel.toUpperCase());
      const shuffledVocabs = [...(pool.length > 0 ? pool : vocabularies)].sort(() => Math.random() - 0.5);

      shuffledVocabs.slice(0, 10).forEach((v, idx) => {
        const distractors = shuffledVocabs
          .filter((other) => other.id !== v.id)
          .slice(0, 3)
          .map((d) => d.chinese);
        while (distractors.length < 3) {
          distractors.push(["好", "看", "去", "吃", "大", "多"][distractors.length]);
        }
        const optionsPool = [v.chinese, ...distractors];
        const shuffledOptions = [...optionsPool].sort(() => Math.random() - 0.5);
        const correctIdx = shuffledOptions.indexOf(v.chinese);

        const sentence = v.exampleChinese && v.exampleChinese.includes(v.chinese)
          ? v.exampleChinese.replace(v.chinese, "____")
          : `这是一个很 ____ 的句子。`;

        fallbackQuestions.push({
          id: `dyn-fb-${idx}`,
          sentence,
          options: shuffledOptions as [string, string, string, string],
          correctIndex: correctIdx >= 0 ? correctIdx : 0,
          meaningVi: v.exampleMeaning || `Từ cần điền: ${v.meaningVi}`,
          pinyin: v.examplePinyin || v.pinyin,
          explanation: `Đáp án đúng là "${v.chinese}" (${v.pinyin}): ${v.meaningVi}`,
          level: selectedLevel,
          source: selectedStandard,
        });
      });

      setGameQuestions(fallbackQuestions);
    } finally {
      setIsGeneratingAI(false);
      setCurrentIndex(0);
      setScore(0);
      setCombo(0);
      setMaxCombo(0);
      setLives(3);
      setSelectedTarget(null);
      setShotState("IDLE");
      setKeeperDive("IDLE");
      setNetShake(false);
      setIsGameOver(false);
      setIsPlaying(true);
      setTimeout(scrollToGameCenter, 100);
    }
  };

  // Tự động phát âm câu hỏi khi chuyển câu mới
  useEffect(() => {
    if (isPlaying && currentQ && shotState === "IDLE") {
      const timer = setTimeout(() => {
        speakCurrentSentence();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isPlaying, currentIndex, shotState, currentQ, speakCurrentSentence]);

  // Xử lý sút bóng khi người dùng chọn đáp án (A: 0, B: 1, C: 2, D: 3)
  const handleShoot = (targetIdx: number) => {
    if (shotState !== "IDLE" || !currentQ) return;

    sound.playWoodblock();
    setSelectedTarget(targetIdx);
    setShotState("SHOOTING");

    const isCorrect = targetIdx === currentQ.correctIndex;

    // Xác định hướng bay của thủ môn
    if (isCorrect) {
      // Đúng -> Thủ môn bay lệch hướng hoặc chậm chân!
      const wrongDives: ("LEFT_UP" | "LEFT_DOWN" | "RIGHT_DOWN" | "RIGHT_UP")[] = [
        "LEFT_UP",
        "LEFT_DOWN",
        "RIGHT_DOWN",
        "RIGHT_UP",
      ];
      const otherDives = wrongDives.filter((_, idx) => idx !== targetIdx);
      const chosenWrong = otherDives[Math.floor(Math.random() * otherDives.length)];
      setKeeperDive(chosenWrong);

      // Sau 450ms bóng chạm lưới
      setTimeout(() => {
        setShotState("GOAL");
        setNetShake(true);
        sound.playCorrect();
        sound.playCoin();

        setCombo((prev) => {
          const next = prev + 1;
          setMaxCombo((m) => Math.max(m, next));
          return next;
        });
        setScore((prev) => prev + 100 * (combo + 1));

        // Dừng rung lưới
        setTimeout(() => setNetShake(false), 800);

        // Chuyển sang câu tiếp theo sau 1.8s
        setTimeout(() => {
          advanceNext(true);
        }, 1800);
      }, 500);
    } else {
      // Sai -> Thủ môn bay chính xác vào bóng và cản phá!
      const diveMap: ("LEFT_UP" | "LEFT_DOWN" | "RIGHT_DOWN" | "RIGHT_UP")[] = [
        "LEFT_UP",
        "LEFT_DOWN",
        "RIGHT_DOWN",
        "RIGHT_UP",
      ];
      setKeeperDive(diveMap[targetIdx] || "LEFT_DOWN");

      setTimeout(() => {
        setShotState("SAVED");
        sound.playIncorrect();
        sound.playShieldBreak();
        setCombo(0);
        setLives((l) => {
          const nextLives = l - 1;
          return nextLives;
        });

        // Chuyển câu tiếp theo sau 2.0s
        setTimeout(() => {
          advanceNext(false);
        }, 2000);
      }, 500);
    }
  };

  // Chuyển câu hỏi tiếp theo
  const advanceNext = (wasCorrect: boolean) => {
    setSelectedTarget(null);
    setShotState("IDLE");
    setKeeperDive("IDLE");
    setNetShake(false);

    if (lives <= 1 && !wasCorrect) {
      endGame();
      return;
    }

    if (currentIndex + 1 >= gameQuestions.length) {
      endGame();
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  // Kết thúc trận đấu
  const endGame = () => {
    sound.playLevelUp();
    setIsGameOver(true);
    setIsPlaying(false);
    addExpAndGems(score * 2, Math.floor(score / 150));
    if (onComplete) onComplete();
  };

  // Hỗ trợ phím tắt bàn phím (1, 2, 3, 4 hoặc A, B, C, D)
  useEffect(() => {
    if (!isPlaying || shotState !== "IDLE") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      if (key === "1" || key === "A") handleShoot(0);
      else if (key === "2" || key === "B") handleShoot(1);
      else if (key === "3" || key === "C") handleShoot(2);
      else if (key === "4" || key === "D") handleShoot(3);
      else if (e.code === "Space") {
        e.preventDefault();
        speakCurrentSentence();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying, shotState, currentQ]);

  // Vị trí tọa độ 3D của bóng khi bay vào các góc
  // A (Top-Left): -260px X, -340px Y
  // B (Bottom-Left): -170px X, -180px Y
  // C (Bottom-Right): 170px X, -180px Y
  // D (Top-Right): 260px X, -340px Y
  const getBallFlightStyle = () => {
    if (shotState === "IDLE" || selectedTarget === null) {
      return {
        transform: "translate(-50%, -50%) scale(1)",
        transition: "none",
      };
    }

    let targetX = 0;
    let targetY = -220;

    if (selectedTarget === 0) {
      // Top Left (Target A)
      targetX = -330;
      targetY = -425;
    } else if (selectedTarget === 1) {
      // Bottom Left (Target B)
      targetX = -275;
      targetY = -230;
    } else if (selectedTarget === 2) {
      // Bottom Right (Target C)
      targetX = 275;
      targetY = -230;
    } else if (selectedTarget === 3) {
      // Top Right (Target D)
      targetX = 330;
      targetY = -425;
    }

    return {
      transform: `translate(calc(-50% + ${targetX}px), calc(-50% + ${targetY}px)) scale(0.38) rotate(720deg)`,
      transition: "transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)",
    };
  };

  // Chọn sprite thủ môn phù hợp:
  // - Vị trí A (Góc cao trái): shootout_goalkeeper_left.png
  // - Vị trí D (Góc cao phải): shootout_goalkeeper_right.png
  // - Vị trí B (Góc thấp trái), C (Góc thấp phải) hoặc Đứng yên: shootout_goalkeeper.png
  const getKeeperSprite = () => {
    if (keeperDive === "LEFT_UP") {
      return r2Asset("/game/shootout_goalkeeper_left.png");
    }
    if (keeperDive === "RIGHT_UP") {
      return r2Asset("/game/shootout_goalkeeper_right.png");
    }
    return r2Asset("/game/shootout_goalkeeper.png");
  };

  // Vị trí hoạt ảnh bay người của thủ môn (Bay ngang phẳng 2D dọc theo mặt phẳng khung thành)
  const getKeeperDiveStyle = () => {
    if (keeperDive === "LEFT_UP") {
      // Bay ngang phẳng sang trái, ngửa lên góc cao A
      return "translate-x-[calc(-50%-180px)] sm:translate-x-[calc(-50%-220px)] -translate-y-[calc(100%+30px)] sm:-translate-y-[calc(100%+50px)] rotate-[30deg]";
    }
    if (keeperDive === "LEFT_DOWN") {
      // Trượt ngang phẳng sang trái dọc theo vạch gôn B
      return "translate-x-[calc(-50%-150px)] sm:translate-x-[calc(-50%-220px)] -translate-y-full rotate-[10deg]";
    }
    if (keeperDive === "RIGHT_DOWN") {
      // Trượt ngang phẳng sang phải dọc theo vạch gôn C
      return "translate-x-[calc(-50%+150px)] sm:translate-x-[calc(-50%+220px)] -translate-y-full -rotate-[10deg]";
    }
    if (keeperDive === "RIGHT_UP") {
      // Bay ngang phẳng sang phải, ngửa lên góc cao D
      return "translate-x-[calc(-50%+180px)] sm:translate-x-[calc(-50%+250px)] -translate-y-[calc(100%+30px)] sm:-translate-y-[calc(100%+50px)] -rotate-[30deg]";
    }
    return "-translate-x-1/2 -translate-y-full rotate-0";
  };

  return (
    <div ref={containerRef} className="relative mx-auto w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white font-sans shadow-2xl select-none scroll-mt-4 isolate">
      {/* ========================================================================= */}
      {/* AI GENERATION LOADING OVERLAY (Hiệu ứng khởi tạo trận đấu AI)             */}
      {/* ========================================================================= */}
      {isGeneratingAI && (
        <div className="relative z-50 flex flex-col items-center justify-center bg-white rounded-3xl p-8 text-center min-h-[680px] sm:min-h-[760px] space-y-6 animate-fadeIn">
          {/* Glowing Animated Ball */}
          <div className="relative flex h-24 w-24 items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-tr from-red-600 to-amber-500 shadow-xl ring-4 ring-amber-300 animate-spin">
              <img
                src={r2Asset("/game/shootout_soccer_ball.png")}
                alt="AI Soccer Ball"
                className="h-14 w-14 object-contain"
              />
            </div>
          </div>

          {/* AI Header & Progress Text */}
          <div className="space-y-2 max-w-md">
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
              Đang Tạo Trận Đấu...
            </h2>

            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              {aiStatusMsg || "AI đang phân tích từ vựng và ngữ cảnh để tạo trận đấu."}
            </p>
          </div>

          {/* Context Badge */}
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>
              {selectedStandard === "HSK30" ? "HSK 3.0" : "HSK 2.0"} · {selectedLevel}
            </span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. MÀN HÌNH SẢNH / CONFIGURATION MODAL (Trắng Sứ & Đỏ Son Chuẩn Hệ Thống)  */}
      {/* ========================================================================= */}
      {!isPlaying && !isGameOver && !isGeneratingAI && (
        <div className="relative z-30 flex flex-col items-center justify-center bg-white rounded-3xl p-6 sm:p-9 text-center min-h-[680px] sm:min-h-[760px]">
          {/* Header Badge & Title */}
          <div className="space-y-1.5 mb-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-1 text-xs font-semibold text-red-700 mb-1 shadow-sm">
              <Sparkles size={13} className="text-red-600" />
              <span>AI Penalty Shootout</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Sút Phạt Đền HSK
            </h1>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Trận đấu được AI tạo câu hỏi ngữ cảnh động theo đúng cấp độ và chủ đề bài học bạn chọn!
            </p>
          </div>

          {/* Mission Configuration Panel */}
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left text-xs text-slate-700 shadow-sm space-y-3.5 relative z-20">
            {/* 1. Chọn Loại HSK */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5 flex items-center gap-1.5">
                <Sparkles size={12} className="text-red-600" />
                <span>1. Bộ tiêu chuẩn:</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    sound.playWoodblock();
                    setSelectedStandard("HSK20");
                  }}
                  className={`rounded-xl py-2 px-2 text-center text-xs font-bold border transition-all cursor-pointer ${selectedStandard === "HSK20"
                    ? "border-red-600 bg-red-600 text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                    }`}
                >
                  HSK 2.0
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sound.playWoodblock();
                    setSelectedStandard("HSK30");
                  }}
                  className={`rounded-xl py-2 px-2 text-center text-xs font-bold border transition-all cursor-pointer ${selectedStandard === "HSK30"
                    ? "border-red-600 bg-red-600 text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                    }`}
                >
                  HSK 3.0
                </button>
              </div>
            </div>

            {/* 2. Chọn Cấp Độ HSK */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5 flex items-center gap-1.5">
                <Target size={12} className="text-red-600" />
                <span>2. Cấp Độ HSK:</span>
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {(selectedStandard === "HSK30"
                  ? ["HSK1", "HSK2", "HSK3", "HSK4", "HSK5", "HSK6", "HSK7-9"]
                  : ["HSK1", "HSK2", "HSK3", "HSK4", "HSK5", "HSK6"]
                ).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => {
                      sound.playWoodblock();
                      setSelectedLevel(lvl);
                    }}
                    className={`rounded-lg py-1.5 px-1 text-center text-[11px] font-bold border transition-all cursor-pointer ${selectedLevel === lvl
                      ? "border-red-600 bg-red-600 text-white shadow-sm"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                      }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Custom Chọn Chủ Đề Bài Học Dropdown */}
            <div ref={dropdownRef} className="relative z-30">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5 flex items-center gap-1.5">
                <BookOpen size={12} className="text-red-600" />
                <span>3. Chủ Đề Bài Học:</span>
              </label>

              <button
                type="button"
                onClick={() => {
                  sound.playWoodblock();
                  setIsDropdownOpen((prev) => !prev);
                }}
                className={`w-full flex items-center justify-between rounded-xl border px-3 py-2 text-xs font-bold transition-all cursor-pointer shadow-sm ${isDropdownOpen
                  ? "border-red-500 bg-red-50/30 ring-2 ring-red-500/20 text-slate-900"
                  : "border-slate-200 bg-white text-slate-800 hover:border-red-400 hover:bg-slate-50"
                  }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <BookOpen size={13} className="text-red-600 shrink-0" />
                  <span className="truncate">
                    {selectedTopicId === "ALL"
                      ? `Toàn bộ chủ đề ${selectedLevel}`
                      : availableTopics.find((t) => t.id === selectedTopicId)?.title || selectedTopicId}
                  </span>
                </div>
                <ChevronDown
                  size={14}
                  className={`text-slate-400 transition-transform duration-200 shrink-0 ${isDropdownOpen ? "rotate-180 text-red-600" : ""
                    }`}
                />
              </button>

              {/* Dropdown Menu Popover */}
              {isDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1.5 z-50 max-h-48 overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-md p-1.5 shadow-2xl animate-fadeIn divide-y divide-slate-100">
                  <div className="pb-1">
                    <button
                      type="button"
                      onClick={() => {
                        sound.playWoodblock();
                        setSelectedTopicId("ALL");
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between rounded-xl px-2.5 py-1.5 text-xs font-bold transition cursor-pointer ${selectedTopicId === "ALL"
                        ? "bg-red-50 text-red-700 font-bold"
                        : "text-slate-700 hover:bg-slate-100"
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-600" />
                        <span>Toàn bộ chủ đề {selectedLevel} (AI ngẫu nhiên)</span>
                      </div>
                      {selectedTopicId === "ALL" && <Check size={14} className="text-red-600" />}
                    </button>
                  </div>

                  <div className="pt-1 space-y-0.5">
                    {availableTopics.map((t) => {
                      const isSelected = selectedTopicId === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            sound.playWoodblock();
                            setSelectedTopicId(t.id);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between rounded-xl px-2.5 py-1.5 text-xs font-medium transition cursor-pointer ${isSelected
                            ? "bg-red-50 text-red-700 font-bold"
                            : "text-slate-700 hover:bg-slate-100"
                            }`}
                        >
                          <span className="truncate text-left">{t.title}</span>
                          {isSelected && <Check size={14} className="text-red-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 4. Hướng dẫn & Tùy chọn */}
            <div className="pt-2 border-t border-slate-200 space-y-2">
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Bấm trực tiếp vào <span className="text-red-600 font-bold">Bia ngắm A, B, C, D</span> trong khung thành hoặc bấm thẻ đáp án bên dưới (hỗ trợ phím tắt <span className="font-mono font-bold text-slate-800">1, 2, 3, 4</span>) để sút bóng!
              </p>
            </div>
          </div>

          {/* Launch Button */}
          <div className="mt-5 w-full max-w-sm space-y-2.5">
            <button
              type="button"
              onClick={startAIGame}
              className="group w-full flex items-center justify-center gap-2 rounded-xl bg-red-600 text-white py-3.5 px-6 text-sm font-bold shadow-[0_4px_0_#991B1B] hover:bg-red-700 active:translate-y-[2px] active:shadow-[0_2px_0_#991B1B] transition-all cursor-pointer"
            >

              <span>BẮT ĐẦU SÚT PHẠT ĐỀN</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. GIAO DIỆN CHƠI GAME SÚT PHẠT ĐỀN CHÍNH (STADIUM & PENALTY ARENA)      */}
      {/* ========================================================================= */}
      {isPlaying && currentQ && (
        <div className="relative h-[680px] sm:h-[760px] w-full overflow-hidden bg-slate-900">
          {/* Stadium Background */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${r2Asset("/game/shootout_stadium_bg.png")})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />
          </div>

          {/* ------------------------------------------------------------- */}
          {/* TOP HUD: Lượt, Điểm, Combo, Cơ Hội                            */}
          {/* ------------------------------------------------------------- */}
          <div className="absolute top-4 left-4 z-40 flex items-center gap-2 sm:gap-3 rounded-2xl border border-white/40 bg-white/90 backdrop-blur-md px-3.5 py-2 shadow-lg text-slate-800">
            {/* Lượt */}
            <div className="flex flex-col items-center border-r border-slate-200 pr-2.5">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Lượt</span>
              <span className="text-xs sm:text-sm font-extrabold text-slate-900">
                {currentIndex + 1}/10
              </span>
            </div>

            {/* Điểm */}
            <div className="flex flex-col items-center border-r border-slate-200 pr-2.5">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Điểm</span>
              <span className="text-xs sm:text-sm font-extrabold text-red-600">{score}</span>
            </div>

            {/* Combo */}
            <div className="flex flex-col items-center border-r border-slate-200 pr-2.5">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Combo</span>
              <span className="text-xs sm:text-sm font-extrabold text-amber-500 flex items-center gap-0.5">
                <Flame size={12} className="fill-amber-500" />
                <span>x{combo}</span>
              </span>
            </div>

            {/* Cơ hội (Hearts) */}
            <div className="flex flex-col items-center pl-0.5">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Cơ hội</span>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3].map((h) => (
                  <Heart
                    key={h}
                    size={13}
                    className={`transition-all ${h <= lives ? "text-rose-500 fill-rose-500 scale-100" : "text-slate-300 scale-90"
                      }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Sound & Quit Button in Top-Right */}
          <div className="absolute top-4 right-4 z-40 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const next = sound.toggleMute();
                setIsMuted(next);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/40 bg-white/90 text-slate-700 shadow-md hover:bg-white transition cursor-pointer"
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* TOP QUESTION BANNER (Thẻ Câu Tiếng Hán Điền Từ do AI Sinh)     */}
          {/* ------------------------------------------------------------- */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 w-full max-w-lg px-4">
            <div className="rounded-3xl border border-amber-200/80 bg-[#FFF8EE]/95 backdrop-blur-md p-3.5 sm:p-4 text-center shadow-xl">
              {/* Controls bar inside banner */}
              <div className="flex items-center justify-between mb-1.5 px-1">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-900/70">
                  <Sparkles size={11} className="text-red-600" />
                  <span>AI HSK {selectedLevel} · Điền từ:</span>
                </span>

                <div className="flex items-center gap-3">
                  {/* Toggle Nghĩa Việt */}
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <span className="text-[10px] font-bold text-amber-900/70">Nghĩa Việt</span>
                    <input
                      type="checkbox"
                      checked={showMeaningVi}
                      onChange={(e) => setShowMeaningVi(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="relative w-7 h-4 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-red-600" />
                  </label>

                  {/* Speaker Button */}
                  <button
                    type="button"
                    onClick={speakCurrentSentence}
                    title="Đọc câu văn (Space)"
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-amber-800 hover:bg-amber-200 transition cursor-pointer"
                  >
                    <Volume2 size={13} />
                  </button>
                </div>
              </div>

              {/* Chinese Sentence */}
              <div className="text-xl sm:text-2xl font-black tracking-wide text-slate-900 my-1 font-hanzi">
                {currentQ.sentence.split("____").map((part, i, arr) => (
                  <span key={i}>
                    {part}
                    {i < arr.length - 1 && (
                      <span
                        className={`inline-block mx-1.5 px-3 py-0.5 rounded-lg border-2 border-dashed transition-all ${shotState === "GOAL"
                            ? "border-emerald-500 bg-emerald-100 text-emerald-700 font-extrabold shadow-sm scale-105 font-hanzi"
                            : "border-amber-600/60 bg-amber-100/60 text-amber-900 font-mono text-sm"
                          }`}
                      >
                        {shotState === "GOAL" ? currentQ.options[currentQ.correctIndex] : "_____"}
                      </span>
                    )}
                  </span>
                ))}
              </div>

              {/* Meaning Vi & Pinyin */}
              {showMeaningVi && (
                <div className="text-xs text-slate-600 mt-1 font-medium italic transition-all animate-fadeIn">
                  {currentQ.meaningVi}
                </div>
              )}
            </div>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* MIDGROUND: FOOTBALL GOAL, GOALKEEPER & TARGET BUTTONS         */}
          {/* ------------------------------------------------------------- */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Goalkeeper Sprite (Anchored directly on Goal Line: top 65.5%, left 50%) */}
            <div
              className={`absolute left-1/2 top-[65.5%] z-20 transition-all duration-400 ease-out pointer-events-none origin-bottom h-[155px] sm:h-[210px] md:h-[235px] w-auto ${getKeeperDiveStyle()}`}
            >
              <img
                src={getKeeperSprite()}
                alt="Goalkeeper"
                className="h-full w-auto object-contain filter drop-shadow-[0_16px_24px_rgba(0,0,0,0.8)]"
              />
            </div>

            {/* Interactive Target Badges (A, B, C, D) Positioned Directly in Goal Quadrants */}
            <div className="absolute inset-0 z-30 pointer-events-auto">
              {/* Target A: Top-Left Corner */}
              <button
                type="button"
                disabled={shotState !== "IDLE"}
                onClick={() => handleShoot(0)}
                className={`group absolute top-[26%] left-[10%] sm:left-[15%] flex h-11 w-11 sm:h-15 sm:w-15 items-center justify-center rounded-full border-2 sm:border-[3px] border-white/90 bg-black/45 backdrop-blur-xs text-white font-black text-sm sm:text-xl shadow-[0_4px_12px_rgba(0,0,0,0.5)] hover:scale-110 hover:border-amber-300 hover:bg-black/60 hover:shadow-[0_0_20px_rgba(251,191,36,0.6)] transition-all cursor-pointer ${selectedTarget === 0 && shotState === "GOAL"
                    ? "border-emerald-400 bg-emerald-600/90 text-white scale-120 shadow-[0_0_30px_rgba(16,185,129,0.9)]"
                    : ""
                  } ${selectedTarget === 0 && shotState === "SAVED"
                    ? "border-rose-400 bg-rose-900/90 text-rose-200 scale-105 shadow-[0_0_20px_rgba(244,63,94,0.9)]"
                    : ""
                  }`}
              >
                <div className="absolute inset-1 rounded-full border border-dashed border-white/40 pointer-events-none group-hover:border-amber-300/60" />
                <span className="relative drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">A</span>
              </button>

              {/* Target B: Bottom-Left */}
              <button
                type="button"
                disabled={shotState !== "IDLE"}
                onClick={() => handleShoot(1)}
                className={`group absolute top-[52%] left-[20%] sm:left-[20%] flex h-11 w-11 sm:h-15 sm:w-15 items-center justify-center rounded-full border-2 sm:border-[3px] border-white/90 bg-black/45 backdrop-blur-xs text-white font-black text-sm sm:text-xl shadow-[0_4px_12px_rgba(0,0,0,0.5)] hover:scale-110 hover:border-amber-300 hover:bg-black/60 hover:shadow-[0_0_20px_rgba(251,191,36,0.6)] transition-all cursor-pointer ${selectedTarget === 1 && shotState === "GOAL"
                    ? "border-emerald-400 bg-emerald-600/90 text-white scale-120 shadow-[0_0_30px_rgba(16,185,129,0.9)]"
                    : ""
                  } ${selectedTarget === 1 && shotState === "SAVED"
                    ? "border-rose-400 bg-rose-900/90 text-rose-200 scale-105 shadow-[0_0_20px_rgba(244,63,94,0.9)]"
                    : ""
                  }`}
              >
                <div className="absolute inset-1 rounded-full border border-dashed border-white/40 pointer-events-none group-hover:border-amber-300/60" />
                <span className="relative drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">B</span>
              </button>

              {/* Target C: Bottom-Right */}
              <button
                type="button"
                disabled={shotState !== "IDLE"}
                onClick={() => handleShoot(2)}
                className={`group absolute top-[52%] right-[20%] sm:right-[20%] flex h-11 w-11 sm:h-15 sm:w-15 items-center justify-center rounded-full border-2 sm:border-[3px] border-white/90 bg-black/45 backdrop-blur-xs text-white font-black text-sm sm:text-xl shadow-[0_4px_12px_rgba(0,0,0,0.5)] hover:scale-110 hover:border-amber-300 hover:bg-black/60 hover:shadow-[0_0_20px_rgba(251,191,36,0.6)] transition-all cursor-pointer ${selectedTarget === 2 && shotState === "GOAL"
                    ? "border-emerald-400 bg-emerald-600/90 text-white scale-120 shadow-[0_0_30px_rgba(16,185,129,0.9)]"
                    : ""
                  } ${selectedTarget === 2 && shotState === "SAVED"
                    ? "border-rose-400 bg-rose-900/90 text-rose-200 scale-105 shadow-[0_0_20px_rgba(244,63,94,0.9)]"
                    : ""
                  }`}
              >
                <div className="absolute inset-1 rounded-full border border-dashed border-white/40 pointer-events-none group-hover:border-amber-300/60" />
                <span className="relative drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">C</span>
              </button>

              {/* Target D: Top-Right Corner */}
              <button
                type="button"
                disabled={shotState !== "IDLE"}
                onClick={() => handleShoot(3)}
                className={`group absolute top-[26%] right-[10%] sm:right-[15%] flex h-11 w-11 sm:h-15 sm:w-15 items-center justify-center rounded-full border-2 sm:border-[3px] border-white/90 bg-black/45 backdrop-blur-xs text-white font-black text-sm sm:text-xl shadow-[0_4px_12px_rgba(0,0,0,0.5)] hover:scale-110 hover:border-amber-300 hover:bg-black/60 hover:shadow-[0_0_20px_rgba(251,191,36,0.6)] transition-all cursor-pointer ${selectedTarget === 3 && shotState === "GOAL"
                    ? "border-emerald-400 bg-emerald-600/90 text-white scale-120 shadow-[0_0_30px_rgba(16,185,129,0.9)]"
                    : ""
                  } ${selectedTarget === 3 && shotState === "SAVED"
                    ? "border-rose-400 bg-rose-900/90 text-rose-200 scale-105 shadow-[0_0_20px_rgba(244,63,94,0.9)]"
                    : ""
                  }`}
              >
                <div className="absolute inset-1 rounded-full border border-dashed border-white/40 pointer-events-none group-hover:border-amber-300/60" />
                <span className="relative drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">D</span>
              </button>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* FOREGROUND: SOCCER BALL AT PENALTY SPOT                      */}
            {/* ------------------------------------------------------------- */}
            <div
              className="absolute left-1/2 top-[86%] z-30 h-16 w-16 sm:h-20 sm:w-20 cursor-pointer pointer-events-auto origin-center"
              style={getBallFlightStyle()}
            >
              <img
                src={r2Asset("/game/shootout_soccer_ball.png")}
                alt="Soccer Ball"
                className="h-full w-full object-contain filter drop-shadow-[0_12px_12px_rgba(0,0,0,0.6)]"
              />
            </div>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* CELEBRATION BANNERS: "VÀO GÔN! GOAL!" or "BỊ CẢN PHÁ!"        */}
          {/* ------------------------------------------------------------- */}
          {shotState === "GOAL" && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center pointer-events-none animate-bounce">
              <div className="rounded-3xl border-4 border-yellow-400 bg-gradient-to-r from-red-600 via-amber-500 to-red-600 px-8 py-3.5 text-center shadow-[0_0_50px_rgba(234,179,8,0.9)]">
                <div className="text-3xl sm:text-5xl font-black italic tracking-widest text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]">
                  VÀO GÔN! GOAL!
                </div>
                <div className="text-xs sm:text-sm font-bold text-yellow-200 mt-1">
                  +{100 * (combo + 1)} ĐIỂM {combo > 0 && `(COMBO X${combo + 1})`}
                </div>
              </div>
            </div>
          )}

          {shotState === "SAVED" && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center pointer-events-none animate-fadeIn">
              <div className="rounded-3xl border-4 border-slate-700 bg-slate-900/90 px-8 py-3.5 text-center shadow-2xl max-w-md mx-auto">
                <div className="text-2xl sm:text-4xl font-black italic tracking-wider text-rose-500 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  BỊ CẢN PHÁ!
                </div>
                <div className="text-xs sm:text-sm font-bold text-slate-300 mt-1">
                  Đáp án đúng là:{" "}
                  <span className="text-emerald-400 font-extrabold">
                    {["A", "B", "C", "D"][currentQ.correctIndex]}. {currentQ.options[currentQ.correctIndex]}
                  </span>
                </div>
                {currentQ.explanation && (
                  <p className="text-[11px] text-slate-400 mt-1.5 leading-snug">
                    {currentQ.explanation}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* BOTTOM ANSWER TRAY: 4 LARGE INTERACTIVE ANSWER CARDS (A,B,C,D)*/}
          {/* ------------------------------------------------------------- */}
          <div className="absolute bottom-4 left-0 right-0 z-40 px-4">
            <div className="mx-auto max-w-4xl grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
              {currentQ.options.map((option, idx) => {
                const label = ["A", "B", "C", "D"][idx];
                const keyNum = idx + 1;
                const isSelected = selectedTarget === idx;
                const isCorrect = idx === currentQ.correctIndex;

                let cardStyle =
                  "border-slate-200 bg-white/95 hover:border-red-500 hover:bg-white text-slate-800 hover:shadow-md";

                if (shotState === "GOAL" && isSelected) {
                  cardStyle =
                    "border-emerald-500 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/50 shadow-md";
                } else if (shotState === "SAVED") {
                  if (isSelected) {
                    cardStyle =
                      "border-rose-500 bg-rose-50 text-rose-950 ring-2 ring-rose-500/50 shadow-md";
                  } else if (isCorrect) {
                    cardStyle =
                      "border-emerald-500 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/50 shadow-md animate-pulse";
                  }
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={shotState !== "IDLE"}
                    onClick={() => handleShoot(idx)}
                    className={`group relative flex items-center justify-between rounded-2xl border-2 p-3 sm:p-3.5 text-left shadow-sm transition-all duration-150 cursor-pointer active:scale-95 ${cardStyle}`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Circle Letter Badge */}
                      <span className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 border border-slate-200 text-slate-700 font-black text-xs sm:text-sm group-hover:bg-red-600 group-hover:text-white group-hover:border-red-600 transition-colors shadow-2xs">
                        {label}
                      </span>
                      {/* Chinese Option Text */}
                      <span className="font-hanzi font-black text-base sm:text-lg text-slate-900 truncate">
                        {option}
                      </span>
                    </div>

                    {/* Keyboard Shortcut Indicator */}
                    <span className="font-mono text-[10px] text-slate-400 bg-slate-100 border border-slate-200/80 px-1.5 py-0.5 rounded shadow-2xs">
                      {keyNum}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MÀN HÌNH KẾT THÚC / KẾT QUẢ HIỆP ĐẤU (VICTORY / MATCH FINISHED)         */}
      {/* ========================================================================= */}
      {isGameOver && (
        <div className="relative z-30 flex flex-col items-center justify-center bg-white rounded-3xl p-8 text-center min-h-[680px] sm:min-h-[760px] space-y-6">
          <div className="flex h-20 w-20 items-center justify-center text-amber-600">
            <Trophy size={40} className="animate-bounce" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              {lives > 0 ? "Tuyệt Phẩm Penalty!" : "Kết Thúc Hiệp Đấu"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Bạn đã hoàn thành loạt sút luân lưu HSK tạo bởi AI với thành tích xuất sắc!
            </p>
          </div>

          {/* Stats Summary Tray */}
          <div className="grid grid-cols-3 gap-3 w-full max-w-sm">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Tổng Điểm</span>
              <div className="text-lg font-black text-red-600 mt-0.5">{score}</div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Chuỗi Ghi Bàn</span>
              <div className="text-lg font-black text-amber-500 mt-0.5">x{maxCombo}</div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Bàn Thắng</span>
              <div className="text-lg font-black text-emerald-600 mt-0.5">
                {Math.max(0, Math.floor(score / 100))}/10
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm pt-2">
            <button
              type="button"
              onClick={startAIGame}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-600 text-white py-3 px-4 text-xs font-bold shadow-[0_4px_0_#991B1B] hover:bg-red-700 active:translate-y-[2px] active:shadow-[0_2px_0_#991B1B] transition-all cursor-pointer"
            >
              
              <span>TRẬN ĐẤU MỚI</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sound.playWoodblock();
                setIsGameOver(false);
                setIsPlaying(false);
              }}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-slate-700 py-3 px-4 text-xs font-bold hover:bg-slate-50 transition cursor-pointer shadow-sm"
            >
              <span>VỀ MENU SẢNH</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
