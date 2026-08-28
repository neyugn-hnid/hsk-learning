import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { sound } from "~/lib/sound";
import { addExpAndGems } from "~/lib/gamification";
import {
  Sparkles,
  CheckCircle2,
  RotateCcw,
  Volume2,
  VolumeX,
  Award,
  ArrowRight,
  BookOpen,
  Check,
  X,
  Layers,
  Timer,
  Flame,
  Star,
  Target,
  Play,
  HelpCircle,
  Shuffle,
  Zap,
  Lightbulb,
  ShieldAlert,
  SlidersHorizontal,
  Undo2,
  ChevronDown,
  Home,
} from "lucide-react";

export interface SentenceToken {
  id: string;
  text: string;
  pinyin?: string;
  role?: "subject" | "adverbial" | "verb" | "object" | "complement" | "particle" | "other";
  isDistractor?: boolean;
}

export interface SentenceQuestion {
  id: string;
  vietnamese: string;
  chineseTokens: string[];
  pinyin: string;
  grammarNote: string;
  level?: string;
  source?: string;
  category?: string;
  distractors?: string[]; // Từ bẫy gây nhiễu trong chế độ Mê Trận
  tokenRoles?: Record<string, "subject" | "adverbial" | "verb" | "object" | "complement" | "particle">;
}

export type GameMode = "ZEN_PRACTICE" | "TIME_BLITZ" | "TRAP_MODE";

export interface SentenceBuilderGameProps {
  questions?: SentenceQuestion[];
  grammars?: {
    id: string;
    title: string;
    structure: string;
    explanation: string;
    example?: string | null;
    meaning?: string | null;
    level?: string;
    source?: string;
  }[];
  vocabularies?: {
    id: string;
    chinese: string;
    pinyin: string;
    meaningVi: string;
    level: string;
    exampleChinese?: string | null;
    examplePinyin?: string | null;
    exampleMeaning?: string | null;
    lessonTitle?: string;
    source?: string;
  }[];
  lessons?: {
    id: string;
    title: string;
    level: string;
    source?: string;
  }[];
  onComplete?: () => void;
}

export function SentenceBuilderGame({
  questions = [],
  grammars = [],
  vocabularies = [],
  lessons = [],
  onComplete,
}: SentenceBuilderGameProps) {
  // Configuration State
  const [selectedStandard, setSelectedStandard] = useState<"HSK20" | "HSK30">("HSK20");
  const [selectedLevel, setSelectedLevel] = useState<string>("HSK1");
  const [selectedCategory] = useState<string>("ALL");
  const [gameMode, setGameMode] = useState<GameMode>("ZEN_PRACTICE");
  const [showPinyinHint] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(() => sound.getMuted());
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-centering when game starts
  const scrollToGameCenter = useCallback(() => {
    containerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  // Game Lifecycle State
  const [gameState, setGameState] = useState<"CONFIG" | "PLAYING" | "VICTORY" | "TIMEOUT">("CONFIG");
  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);
  const [aiStatusMsg, setAiStatusMsg] = useState<string>("");
  const [gameQuestions, setGameQuestions] = useState<SentenceQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [availableTokens, setAvailableTokens] = useState<SentenceToken[]>([]);
  const [selectedTokens, setSelectedTokens] = useState<SentenceToken[]>([]);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  // Stats
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [initialTime, setInitialTime] = useState(60);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalExpGained, setTotalExpGained] = useState(0);
  const [totalGemsGained, setTotalGemsGained] = useState(0);
  const [lastEarnedExp, setLastEarnedExp] = useState(0);

  const currentQ = gameQuestions[currentIndex] || null;

  // Chinese Text-to-Speech
  const speakText = useCallback((text: string) => {
    if (!text || typeof window === "undefined" || isMuted) return;
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "zh-CN";
      u.rate = 0.9;
      window.speechSynthesis.speak(u);
    }
  }, [isMuted]);

  // Khởi tạo câu hỏi hiện tại: Xáo trộn các mảnh khối từ
  const initQuestion = useCallback(() => {
    if (!currentQ || !currentQ.chineseTokens) return;

    const rawTokens: SentenceToken[] = currentQ.chineseTokens.map((t, idx) => ({
      id: `token-${t}-${idx}-${Date.now()}`,
      text: t,
      role: currentQ.tokenRoles?.[t] || "other",
      isDistractor: false,
    }));

    // Trong chế độ TRAP_MODE, thêm các từ bẫy gây nhiễu
    if (gameMode === "TRAP_MODE" && currentQ.distractors && currentQ.distractors.length > 0) {
      currentQ.distractors.forEach((d, idx) => {
        rawTokens.push({
          id: `distractor-${d}-${idx}-${Date.now()}`,
          text: d,
          role: "other",
          isDistractor: true,
        });
      });
    }

    // Xáo trộn mảng tokens
    const shuffled = [...rawTokens].sort(() => Math.random() - 0.5);

    setAvailableTokens(shuffled);
    setSelectedTokens([]);
    setIsCorrect(null);
  }, [currentQ, gameMode]);

  // Bắt đầu tạo câu đố ghép câu bằng AI
  const startAIGame = async () => {
    sound.playWoodblock();
    // Reset toàn bộ trạng thái thi đấu trước đó ngay lập tức
    setIsCorrect(null);
    setSelectedTokens([]);
    setAvailableTokens([]);
    setCurrentIndex(0);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setCorrectCount(0);
    setTotalExpGained(0);
    setTotalGemsGained(0);
    setLastEarnedExp(0);
    setIsGeneratingAI(true);
    setAiStatusMsg("AI Engine đang sáng tạo các mẫu câu ngữ pháp HSK...");
    scrollToGameCenter();

    try {
      const res = await fetch("/api/ai/sentence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          standard: selectedStandard,
          level: selectedLevel,
          category: selectedCategory,
          count: 10,
        }),
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.questions) && data.questions.length > 0) {
        setGameQuestions(data.questions);
      } else {
        throw new Error(data.error || "Không thể tải câu hỏi AI");
      }
    } catch (err) {
      console.warn("[AI Sentence Generation Fallback]:", err);
      // Fallback: Tạo câu hỏi động từ DB Vocabs/Grammars
      const fallbackList: SentenceQuestion[] = [];
      const pool = vocabularies.filter((v) => !v.level || v.level.toUpperCase() === selectedLevel.toUpperCase());

      pool.slice(0, 10).forEach((v, idx) => {
        const clean = v.exampleChinese ? v.exampleChinese.replace(/[。！？,.!?]/g, "").trim() : `我喜欢${v.chinese}`;
        const parts = clean.includes(v.chinese) ? clean.split(v.chinese) : [clean.slice(0, 2), clean.slice(2)];
        const tokens: string[] = [];
        if (parts[0]) tokens.push(parts[0]);
        tokens.push(v.chinese);
        if (parts[1]) tokens.push(parts[1]);

        fallbackList.push({
          id: `fb-sent-${idx}`,
          vietnamese: v.exampleMeaning || `Tôi thích ${v.meaningVi}.`,
          chineseTokens: tokens.length >= 2 ? tokens : ["我", "喜欢", v.chinese],
          pinyin: v.examplePinyin || v.pinyin,
          grammarNote: `Điểm ngữ pháp ứng dụng từ vựng: 【${v.chinese}】 (${v.pinyin}) - ${v.meaningVi}.`,
          category: "Ngữ pháp tổng hợp",
          distractors: ["的", "了", "在"],
          level: selectedLevel,
          source: selectedStandard,
        });
      });

      if (fallbackList.length === 0) {
        fallbackList.push({
          id: "fb-default-1",
          vietnamese: "Tôi là học sinh.",
          chineseTokens: ["我", "是", "学生"],
          pinyin: "Wǒ shì xuésheng.",
          grammarNote: "Câu chữ 是: [Chủ ngữ] + 是 + [Tân ngữ].",
          category: "Cấu trúc cơ bản",
          distractors: ["有", "在"],
          level: selectedLevel,
          source: selectedStandard,
        });
      }

      setGameQuestions(fallbackList);
    } finally {
      setIsGeneratingAI(false);
      setCurrentIndex(0);
      setScore(0);
      setCombo(0);
      setMaxCombo(0);
      setCorrectCount(0);
      setIsCorrect(null);
      setSelectedTokens([]);
      setAvailableTokens([]);

      const dur = gameMode === "TIME_BLITZ" ? 60 : 0;
      setTimeLeft(dur);
      setInitialTime(dur);
      setGameState("PLAYING");
      setTimeout(scrollToGameCenter, 100);
    }
  };

  useEffect(() => {
    if (gameState === "PLAYING" && currentQ) {
      initQuestion();
    }
  }, [gameState, currentIndex, currentQ, initQuestion]);

  // Timer đếm ngược CHỈ áp dụng duy nhất cho chế độ TỐC CHIẾN CÚ PHÁP (TIME_BLITZ)
  useEffect(() => {
    if (gameState !== "PLAYING" || gameMode !== "TIME_BLITZ") return;

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          sound.playShieldBreak();
          setGameState("TIMEOUT");
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, gameMode]);

  // Chọn token đưa vào câu trả lời
  const handleSelectToken = (token: SentenceToken) => {
    sound.playWoodblock();
    speakText(token.text);
    setSelectedTokens((prev) => [...prev, token]);
    setAvailableTokens((prev) => prev.filter((t) => t.id !== token.id));
    setIsCorrect(null);
  };

  // Trả token từ câu trở lại khay
  const handleRemoveToken = (token: SentenceToken) => {
    sound.playWoodblock();
    setSelectedTokens((prev) => prev.filter((t) => t.id !== token.id));
    setAvailableTokens((prev) => [...prev, token]);
    setIsCorrect(null);
  };

  // Kiểm tra đáp án câu ghép
  const handleCheckAnswer = () => {
    if (!currentQ) return;
    const isMatched =
      selectedTokens.length === currentQ.chineseTokens.length &&
      selectedTokens.every((t, idx) => t.text === currentQ.chineseTokens[idx]);

    if (isMatched) {
      sound.playCorrect();
      sound.playCoin();

      const nextCombo = combo + 1;
      setCombo(nextCombo);
      if (nextCombo > maxCombo) setMaxCombo(nextCombo);

      if (nextCombo >= 2) {
        sound.playCombo(nextCombo);
      }

      const baseExp = 35;
      const comboBonus = (nextCombo - 1) * 10;
      const earnedExp = baseExp + comboBonus;
      const earnedGems = nextCombo >= 3 ? 2 : 1;
      setLastEarnedExp(earnedExp);
      setTotalExpGained((prev) => prev + earnedExp);
      setTotalGemsGained((prev) => prev + earnedGems);
      setScore((s) => s + earnedExp * 10);
      setCorrectCount((c) => c + 1);
      addExpAndGems(earnedExp, earnedGems);

      setIsCorrect(true);
      if (gameMode === "TIME_BLITZ") {
        setTimeLeft((t) => Math.min(initialTime + 20, t + 8));
      }

      // Tự động phát âm cả câu hoàn chỉnh
      setTimeout(() => {
        speakText(currentQ.chineseTokens.join(""));
      }, 300);
    } else {
      sound.playIncorrect();
      setCombo(0);
      setIsCorrect(false);
    }
  };

  // Chuyển sang câu tiếp theo
  const handleNext = () => {
    sound.playWoodblock();
    if (currentIndex < gameQuestions.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      sound.playVictory();
      sound.playLevelUp();
      setGameState("VICTORY");
      if (onComplete) onComplete();
    }
  };

  // Xử lý phím tắt bàn phím (1-9, Backspace, Enter, Space)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== "PLAYING") return;

      const num = parseInt(e.key, 10);
      if (!isNaN(num) && num >= 1 && num <= availableTokens.length) {
        e.preventDefault();
        handleSelectToken(availableTokens[num - 1]);
      } else if (e.key === "Backspace" && selectedTokens.length > 0) {
        e.preventDefault();
        handleRemoveToken(selectedTokens[selectedTokens.length - 1]);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (isCorrect === true) {
          handleNext();
        } else if (selectedTokens.length > 0) {
          handleCheckAnswer();
        }
      } else if (e.code === "Space" && currentQ) {
        e.preventDefault();
        speakText(currentQ.chineseTokens.join(""));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState, availableTokens, selectedTokens, isCorrect, currentQ, speakText]);

  // Tính số sao thưởng dựa trên tỷ lệ câu đúng và combo
  const calculateStars = () => {
    const total = gameQuestions.length || 1;
    const ratio = correctCount / total;
    if (ratio >= 0.9 && maxCombo >= 3) return 3;
    if (ratio >= 0.7) return 2;
    return 1;
  };

  return (
    <div
      ref={containerRef}
      className="relative mx-auto w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white font-sans shadow-xl select-none scroll-mt-4"
    >
      {/* ========================================================================= */}
      {/* AI GENERATION LOADING OVERLAY                                             */}
      {/* ========================================================================= */}
      {isGeneratingAI && (
        <div className="relative z-50 flex flex-col items-center justify-center bg-white/95 backdrop-blur-md p-8 text-center min-h-[640px] space-y-6 animate-fadeIn">
          {/* Animated 3D Sentence Blocks */}
          <div className="flex items-center justify-center gap-2">
            {["我", "是", "学", "生"].map((char, i) => (
              <div
                key={char}
                className="flex h-12 w-10 sm:h-14 sm:w-12 items-center justify-center rounded-xl border border-red-200 bg-[#FBF8EE] text-red-600 font-hanzi font-black text-2xl shadow-lg ring-2 ring-red-400/20 animate-bounce"
                style={{ animationDelay: `${i * 150}ms` }}
              >
                {char}
              </div>
            ))}
          </div>

          <div className="space-y-2 max-w-md">
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
              Đang Chuẩn Bị Câu Đố...
            </h2>

            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              {aiStatusMsg || "AI đang phân tích trật tự cú pháp và cấu trúc ngữ pháp HSK..."}
            </p>
          </div>

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
      {gameState === "CONFIG" && !isGeneratingAI && (
        <div className="p-6 sm:p-10 flex flex-col items-center justify-center text-center space-y-6 max-w-2xl mx-auto min-h-[640px]">
          {/* Header Badge & Title */}
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="flex h-9 w-7 items-center justify-center rounded-md border border-[#E2D9C8] bg-[#FBF8EE] text-[#DC2626] font-hanzi font-black text-base shadow-[0_2px_4px_rgba(0,0,0,0.1),0_2px_0_#CBD5E1]">
                我
              </div>
              <div className="flex h-9 w-7 items-center justify-center rounded-md border border-[#E2D9C8] bg-[#FBF8EE] text-[#059669] font-hanzi font-black text-base shadow-[0_2px_4px_rgba(0,0,0,0.1),0_2px_0_#CBD5E1]">
                是
              </div>
              <div className="flex h-9 w-7 items-center justify-center rounded-md border border-[#E2D9C8] bg-[#FBF8EE] text-[#DC2626] font-hanzi font-black text-base shadow-[0_2px_4px_rgba(0,0,0,0.1),0_2px_0_#CBD5E1]">
                学
              </div>
              <div className="flex h-9 w-7 items-center justify-center rounded-md border border-[#E2D9C8] bg-[#FBF8EE] text-[#2563EB] font-hanzi font-black text-base shadow-[0_2px_4px_rgba(0,0,0,0.1),0_2px_0_#CBD5E1]">
                生
              </div>
            </div>

            

            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Xếp Khối Tạo Câu
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
              Các mẫu câu và cấu trúc ngữ pháp được AI tạo đúng cấp độ HSK bạn chọn!
            </p>
          </div>

          {/* 3 Game Modes Selection Cards */}
          <div className="w-full space-y-2.5">
            <span className="text-xs font-semibold text-slate-600 block px-1 text-left">
              Chế độ xếp câu:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 w-full">
              {/* Mode 1: Zen Practice */}
              <button
                type="button"
                onClick={() => {
                  sound.playWoodblock();
                  setGameMode("ZEN_PRACTICE");
                }}
                className={`group relative flex flex-col justify-between rounded-2xl border p-4 text-left transition-all duration-200 cursor-pointer ${
                  gameMode === "ZEN_PRACTICE"
                    ? "border-2 border-red-600 bg-red-50/70 shadow-md ring-1 ring-red-600/20"
                    : "border-slate-200 bg-white hover:border-red-300 hover:bg-red-50/20 shadow-sm"
                }`}
              >
                <div className="space-y-3">
                  <div
                    className={`flex h-14 w-full items-center justify-center rounded-xl border p-2 ${
                      gameMode === "ZEN_PRACTICE"
                        ? "bg-white border-red-200 shadow-sm"
                        : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <div className="h-7 px-2 rounded bg-[#FBF8EE] border border-[#E2D9C8] text-[#DC2626] font-hanzi text-xs font-black flex items-center justify-center shadow-[0_2px_0_#CBD5E1]">
                        我
                      </div>
                      <div className="h-7 px-2 rounded bg-[#FBF8EE] border border-[#E2D9C8] text-[#059669] font-hanzi text-xs font-black flex items-center justify-center shadow-[0_2px_0_#CBD5E1]">
                        在学
                      </div>
                      <div className="h-7 px-2 rounded bg-[#FBF8EE] border border-[#E2D9C8] text-[#2563EB] font-hanzi text-xs font-black flex items-center justify-center shadow-[0_2px_0_#CBD5E1]">
                        汉语
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h3
                        className={`text-sm font-bold ${
                          gameMode === "ZEN_PRACTICE" ? "text-red-700" : "text-slate-900"
                        }`}
                      >
                        Vấn Đạo Ngữ Pháp
                      </h3>
                      
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Không giới hạn thời gian. Có phân tích cấu trúc ngữ pháp và nghe phát âm.
                    </p>
                  </div>
                </div>
              </button>

              {/* Mode 2: Time Blitz */}
              <button
                type="button"
                onClick={() => {
                  sound.playWoodblock();
                  setGameMode("TIME_BLITZ");
                }}
                className={`group relative flex flex-col justify-between rounded-2xl border p-4 text-left transition-all duration-200 cursor-pointer ${
                  gameMode === "TIME_BLITZ"
                    ? "border-2 border-red-600 bg-red-50/70 shadow-md ring-1 ring-red-600/20"
                    : "border-slate-200 bg-white hover:border-red-300 hover:bg-red-50/20 shadow-sm"
                }`}
              >
                <div className="space-y-3">
                  <div
                    className={`flex h-14 w-full items-center justify-center rounded-xl border p-2 ${
                      gameMode === "TIME_BLITZ"
                        ? "bg-white border-red-200 shadow-sm"
                        : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Timer size={18} className="text-red-600" />
                      <span className="font-mono text-xs font-bold text-red-700">60s · +8s/câu</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h3
                        className={`text-sm font-bold ${
                          gameMode === "TIME_BLITZ" ? "text-red-700" : "text-slate-900"
                        }`}
                      >
                        Tốc Chiến Cú Pháp
                      </h3>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      60 giây chạy đua nghẹt thở, mỗi câu ghép đúng cộng thêm +8 giây vào đồng hồ.
                    </p>
                  </div>
                </div>
              </button>

              {/* Mode 3: Distractor Trap Mode */}
              <button
                type="button"
                onClick={() => {
                  sound.playWoodblock();
                  setGameMode("TRAP_MODE");
                }}
                className={`group relative flex flex-col justify-between rounded-2xl border p-4 text-left transition-all duration-200 cursor-pointer ${
                  gameMode === "TRAP_MODE"
                    ? "border-2 border-red-600 bg-red-50/70 shadow-md ring-1 ring-red-600/20"
                    : "border-slate-200 bg-white hover:border-red-300 hover:bg-red-50/20 shadow-sm"
                }`}
              >
                <div className="space-y-3">
                  <div
                    className={`flex h-14 w-full items-center justify-center rounded-xl border p-2 ${
                      gameMode === "TRAP_MODE"
                        ? "bg-white border-red-200 shadow-sm"
                        : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <div className="h-7 px-1.5 rounded bg-[#FBF8EE] border border-[#E2D9C8] text-[#DC2626] font-hanzi text-xs font-black flex items-center justify-center shadow-[0_2px_0_#CBD5E1]">
                        看
                      </div>
                      <div className="h-7 px-1.5 rounded bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold flex items-center justify-center line-through">
                        去
                      </div>
                      <div className="h-7 px-1.5 rounded bg-[#FBF8EE] border border-[#E2D9C8] text-[#2563EB] font-hanzi text-xs font-black flex items-center justify-center shadow-[0_2px_0_#CBD5E1]">
                        书
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h3
                        className={`text-sm font-bold ${
                          gameMode === "TRAP_MODE" ? "text-red-700" : "text-slate-900"
                        }`}
                      >
                        Mê Trận Từ Bẫy
                      </h3>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Xuất hiện các khối từ gây nhiễu, đòi hỏi phân tích cấu trúc cú pháp để loại bỏ từ thừa.
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Settings Tray */}
          <div className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 p-5 sm:p-6 space-y-4 relative z-20 text-left">
            {/* Level Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">Cấp độ ngữ pháp:</span>
                <div className="flex items-center gap-1 border border-slate-200 bg-white p-0.5 rounded-lg text-[10px] font-medium shadow-sm">
                  <button
                    type="button"
                    onClick={() => {
                      sound.playWoodblock();
                      setSelectedStandard("HSK20");
                      setSelectedLevel("HSK1");
                    }}
                    className={`px-2.5 py-1 rounded transition ${
                      selectedStandard === "HSK20"
                        ? "bg-red-600 text-white font-bold shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    HSK 2.0
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sound.playWoodblock();
                      setSelectedStandard("HSK30");
                      setSelectedLevel("HSK1");
                    }}
                    className={`px-2.5 py-1 rounded transition ${
                      selectedStandard === "HSK30"
                        ? "bg-red-600 text-white font-bold shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    HSK 3.0
                  </button>
                </div>
              </div>

              {/* Level Pills */}
              <div className="flex flex-wrap gap-1.5">
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
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      selectedLevel === lvl
                        ? "bg-red-600 text-white border border-red-600 font-bold shadow-sm"
                        : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Launch Button */}
          <button
            type="button"
            onClick={startAIGame}
            className="w-full sm:w-auto min-w-[260px] flex items-center justify-center gap-2 rounded-xl bg-red-600 text-white py-3.5 px-8 text-sm font-bold tracking-wide hover:bg-red-700 shadow-[0_4px_0_#991B1B] active:translate-y-[2px] active:shadow-[0_2px_0_#991B1B] transition-all cursor-pointer"
          >
            <span>BẮT ĐẦU XẾP CÂU</span>
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. ACTIVE GAMEPLAY BOARD                                                  */}
      {/* ========================================================================= */}
      {gameState === "PLAYING" && currentQ && !isGeneratingAI && (
        <div className="p-4 sm:p-8 flex flex-col items-center space-y-6 max-w-3xl mx-auto w-full">
          {/* Question Progress & In-game Bar */}
          <div className="w-full space-y-2.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    sound.playWoodblock();
                    setGameState("CONFIG");
                  }}
                  className="px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 transition cursor-pointer"
                  title="Về sảnh"
                >
                  <Home size={15} />
                </button>
                <span className="font-mono text-slate-700 font-bold">
                  Câu {currentIndex + 1} / {gameQuestions.length}
                </span>
              </div>

              {/* Right: Score, Combo & Timer */}
              <div className="flex items-center gap-3">
                {gameMode === "TIME_BLITZ" && (
                  <div
                    className={`flex items-center gap-1 font-mono text-xs font-bold px-2 py-0.5 rounded-lg border ${
                      timeLeft <= 10
                        ? "border-rose-300 bg-rose-50 text-rose-600 animate-pulse"
                        : "border-slate-200 bg-slate-50 text-slate-700"
                    }`}
                  >
                    <Timer size={13} />
                    <span>{timeLeft}s</span>
                  </div>
                )}

                {combo >= 2 && (
                  <div className="flex items-center gap-1 font-mono text-xs font-extrabold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg animate-bounce">
                    <Flame size={13} className="text-amber-500 fill-amber-500" />
                    <span>x{combo}</span>
                  </div>
                )}

                <div className="flex items-center gap-1 font-mono text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 rounded-lg shadow-2xs">
                  <Zap size={12} className="text-amber-500 fill-amber-500" />
                  <span>+{totalExpGained} EXP</span>
                </div>

                <div className="font-mono text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-lg">
                  {score} điểm
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const next = sound.toggleMute();
                    setIsMuted(next);
                  }}
                  className="text-slate-400 hover:text-slate-600 transition"
                  title="Bật/Tắt âm thanh"
                >
                  {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                </button>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full bg-red-600 transition-all duration-300 rounded-full"
                style={{
                  width: `${((currentIndex + 1) / gameQuestions.length) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Vietnamese Meaning Prompt Box */}
          <div className="w-full rounded-2xl border border-slate-200 bg-[#FBF8EE]/80 p-5 text-center shadow-sm space-y-1.5 relative">
            <span className="text-[10px] font-bold text-amber-800/60 uppercase tracking-wider block">
              Dịch câu sau sang tiếng Trung:
            </span>
            <p className="text-base sm:text-xl font-extrabold text-slate-900 leading-relaxed font-sans">
              "{currentQ.vietnamese}"
            </p>
            {currentQ.category && (
              <span className="inline-block text-[11px] font-medium text-amber-800/80 bg-amber-100/60 border border-amber-200/60 rounded-full px-2.5 py-0.5">
                {currentQ.category}
              </span>
            )}
          </div>

          {/* Selected Tokens Sentence Construction Tray */}
          <div className="w-full space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-semibold text-slate-500">Khung ghép câu:</span>
              {selectedTokens.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    sound.playWoodblock();
                    setAvailableTokens((prev) => [...prev, ...selectedTokens]);
                    setSelectedTokens([]);
                    setIsCorrect(null);
                  }}
                  className="text-[11px] text-slate-400 hover:text-red-600 transition flex items-center gap-1 cursor-pointer"
                >
                  <Undo2 size={12} />
                  <span>Xóa hết</span>
                </button>
              )}
            </div>

            <div
              className={`min-h-[90px] sm:min-h-[100px] w-full rounded-2xl border-2 p-3 sm:p-4 flex flex-wrap items-center justify-center gap-2 transition-all ${
                isCorrect === true
                  ? "border-emerald-500 bg-emerald-50/50 shadow-md ring-2 ring-emerald-500/20"
                  : isCorrect === false
                  ? "border-rose-400 bg-rose-50/50 shadow-md ring-2 ring-rose-400/20 animate-shake"
                  : selectedTokens.length > 0
                  ? "border-red-400/60 bg-white shadow-sm"
                  : "border-dashed border-slate-300 bg-slate-50/60"
              }`}
            >
              {selectedTokens.length === 0 ? (
                <span className="text-xs text-slate-400 italic">
                  Bấm hoặc chọn các khối từ bên dưới để ghép thành câu hoàn chỉnh
                </span>
              ) : (
                selectedTokens.map((token) => (
                  <button
                    key={token.id}
                    type="button"
                    onClick={() => handleRemoveToken(token)}
                    className="group relative flex flex-col items-center justify-center rounded-xl border border-[#E2D9C8] bg-[#FBF8EE] hover:border-rose-400 hover:bg-rose-50 px-3.5 py-2 sm:px-4 sm:py-2.5 shadow-[0_3px_6px_rgba(0,0,0,0.06),0_2px_0_#CBD5E1] active:translate-y-[1px] transition-all cursor-pointer animate-scaleUp"
                  >
                    {showPinyinHint && (
                      <span className="text-[10px] text-slate-400 font-sans group-hover:text-rose-500">
                        {token.pinyin || ""}
                      </span>
                    )}
                    <span className="font-hanzi text-lg sm:text-xl font-black text-slate-900 group-hover:text-rose-600">
                      {token.text}
                    </span>
                    <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-sm">
                      ×
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Available Tokens Pool Tray */}
          <div className="w-full space-y-2">
            <span className="text-xs font-semibold text-slate-500 block px-1">
              Khay khối từ ({availableTokens.length} khối):
            </span>

            <div className="min-h-[90px] w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 flex flex-wrap items-center justify-center gap-2.5 shadow-inner">
              {availableTokens.map((token, idx) => (
                <button
                  key={token.id}
                  type="button"
                  onClick={() => handleSelectToken(token)}
                  className="group relative flex flex-col items-center justify-center rounded-xl border border-slate-300 bg-white hover:border-red-500 hover:bg-red-50/30 px-3.5 py-2 sm:px-4 sm:py-2.5 shadow-[0_2px_4px_rgba(0,0,0,0.05),0_2px_0_#E2E8F0] hover:shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  {/* Keyboard index number pill */}
                  <span className="absolute top-1 left-1.5 font-mono text-[9px] text-slate-300 group-hover:text-red-500">
                    {idx + 1}
                  </span>

                  {showPinyinHint && (
                    <span className="text-[10px] text-slate-400 font-sans">
                      {token.pinyin || ""}
                    </span>
                  )}
                  <span className="font-hanzi text-lg sm:text-xl font-black text-slate-900 group-hover:text-red-600">
                    {token.text}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Grammar Explanation & Controls Bar */}
          {isCorrect !== null && (
            <div
              className={`w-full rounded-2xl border p-4 sm:p-5 text-left space-y-2 animate-fadeIn ${
                isCorrect
                  ? "border-emerald-200 bg-emerald-50 text-emerald-950"
                  : "border-rose-200 bg-rose-50 text-rose-950"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-sm">
                  {isCorrect ? (
                    <>
                      <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                      <span>Tuyệt vời! Ghép câu chính xác! (+{lastEarnedExp} EXP)</span>
                    </>
                  ) : (
                    <>
                      <X size={18} className="text-rose-600" />
                      <span>Chưa đúng trật tự cú pháp. Hãy thử lại!</span>
                    </>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => speakText(currentQ.chineseTokens.join(""))}
                  title="Nghe phát âm"
                  className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-white/80 border border-slate-200 hover:bg-white transition cursor-pointer shadow-2xs"
                >
                  <Volume2 size={13} />
                  <span>Nghe câu</span>
                </button>
              </div>

              {/* Chinese sentence & Pinyin */}
              <div className="text-base font-black text-slate-900 pt-1 font-hanzi">
                {currentQ.chineseTokens.join("")}
                <span className="text-xs text-slate-500 font-sans ml-2 font-normal">
                  ({currentQ.pinyin})
                </span>
              </div>

              {/* Grammar Note */}
              {currentQ.grammarNote && (
                <p className="text-xs text-slate-600 leading-relaxed border-t border-slate-200/60 pt-2 mt-2">
                  <span className="font-bold text-red-700">Điểm ngữ pháp: </span>
                  {currentQ.grammarNote}
                </p>
              )}
            </div>
          )}

          {/* Action Button: Check Answer or Next Question */}
          <div className="w-full flex items-center justify-center pt-2">
            {isCorrect === true ? (
              <button
                type="button"
                onClick={handleNext}
                className="w-full sm:w-auto min-w-[220px] flex items-center justify-center gap-2 rounded-xl bg-emerald-600 text-white py-3.5 px-8 text-sm font-bold hover:bg-emerald-700 shadow-md shadow-emerald-600/20 active:scale-95 transition cursor-pointer"
              >
                <span>Câu tiếp theo</span>
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                disabled={selectedTokens.length === 0}
                onClick={handleCheckAnswer}
                className={`w-full sm:w-auto min-w-[220px] flex items-center justify-center gap-2 rounded-xl py-3.5 px-8 text-sm font-bold transition-all shadow-md ${
                  selectedTokens.length > 0
                    ? "bg-red-600 text-white hover:bg-red-700 shadow-[0_4px_0_#991B1B] active:translate-y-[2px] cursor-pointer"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                }`}
              >
                <Check size={16} />
                <span>Kiểm Tra Đáp Án</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MÀN HÌNH CHIẾN THẮNG / HOÀN THÀNH HIỆP ĐẤU (VICTORY SCREEN)             */}
      {/* ========================================================================= */}
      {gameState === "VICTORY" && !isGeneratingAI && (
        <div className="p-8 sm:p-14 text-center space-y-7 animate-fadeIn max-w-lg mx-auto flex flex-col items-center">
          {/* Animated 3 Stars Trophy */}
          <div className="flex items-center justify-center gap-3">
            <div
              className={`transition-all duration-300 transform -rotate-6 ${
                calculateStars() >= 1 ? "scale-100 opacity-100" : "scale-90 opacity-25"
              }`}
            >
              <Star
                size={46}
                className={
                  calculateStars() >= 1
                    ? "text-amber-400 fill-amber-400 drop-shadow-[0_4px_12px_rgba(245,158,11,0.3)]"
                    : "text-slate-300 fill-slate-200"
                }
              />
            </div>

            <div
              className={`transition-all duration-300 transform -translate-y-2 ${
                calculateStars() >= 2 ? "scale-110 opacity-100" : "scale-90 opacity-25"
              }`}
            >
              <Star
                size={60}
                className={
                  calculateStars() >= 2
                    ? "text-amber-400 fill-amber-400 drop-shadow-[0_6px_16px_rgba(245,158,11,0.4)]"
                    : "text-slate-300 fill-slate-200"
                }
              />
            </div>

            <div
              className={`transition-all duration-300 transform rotate-6 ${
                calculateStars() >= 3 ? "scale-100 opacity-100" : "scale-90 opacity-25"
              }`}
            >
              <Star
                size={46}
                className={
                  calculateStars() >= 3
                    ? "text-amber-400 fill-amber-400 drop-shadow-[0_4px_12px_rgba(245,158,11,0.3)]"
                    : "text-slate-300 fill-slate-200"
                }
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              XUẤT SẮC HOÀN THÀNH!
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Bạn đã giải mã chính xác toàn bộ các câu đố ngữ pháp do AI thiết kế riêng cho cấp độ{" "}
              <span className="text-red-600 font-bold">{selectedLevel}</span>!
            </p>
          </div>

          {/* Stats Bar */}
          <div className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 px-6 grid grid-cols-3 divide-x divide-slate-200 shadow-sm">
            <div className="text-center px-2">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">
                Câu Đúng
              </span>
              <span className="text-xl sm:text-2xl font-bold text-slate-900 font-mono block">
                {correctCount} / {gameQuestions.length}
              </span>
            </div>

            <div className="text-center px-2">
              <span className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider block mb-0.5">
                EXP Thưởng
              </span>
              <span className="text-xl sm:text-2xl font-bold text-amber-600 font-mono block">
                +{totalExpGained}
              </span>
            </div>

            <div className="text-center px-2">
              <span className="text-[10px] font-semibold text-sky-700 uppercase tracking-wider block mb-0.5">
                Gems Nhận
              </span>
              <span className="text-xl sm:text-2xl font-bold text-sky-600 font-mono block">
                +{totalGemsGained}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={startAIGame}
              className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-600 text-white px-8 py-3.5 text-xs font-bold shadow-[0_4px_0_#991B1B] hover:bg-red-700 active:translate-y-[2px] active:shadow-[0_2px_0_#991B1B] transition cursor-pointer"
            >
              <Sparkles size={14} className="text-yellow-300" />
              <span>TẠO ĐỀ AI MỚI</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sound.playWoodblock();
                setGameState("CONFIG");
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-sm"
            >
              <span>VỀ SẢNH</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MÀN HÌNH HẾT GIỜ (TIMEOUT SCREEN)                                      */}
      {/* ========================================================================= */}
      {gameState === "TIMEOUT" && !isGeneratingAI && (
        <div className="p-8 sm:p-14 text-center space-y-7 animate-fadeIn max-w-md mx-auto flex flex-col items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-rose-200 bg-rose-50 text-rose-600 shadow-sm">
            <ShieldAlert size={36} />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Hết Giờ Thi Đấu!
            </h2>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Đồng hồ đã điểm 0. Hãy thử lại để rèn luyện phản xạ cú pháp nhanh hơn nhé!
            </p>
          </div>

          <div className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 px-6 grid grid-cols-2 divide-x divide-slate-200 shadow-sm">
            <div className="text-center px-2">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">
                Điểm Đạt Được
              </span>
              <span className="text-2xl font-bold text-red-600 font-mono">{score}</span>
            </div>
            <div className="text-center px-2">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">
                Câu Đã Ghép
              </span>
              <span className="text-2xl font-bold text-slate-900 font-mono">
                {correctCount} / {gameQuestions.length}
              </span>
            </div>
          </div>

          <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
            <button
              type="button"
              onClick={startAIGame}
              className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-600 text-white px-8 py-3.5 text-xs font-bold shadow-[0_4px_0_#991B1B] hover:bg-red-700 active:translate-y-[2px] active:shadow-[0_2px_0_#991B1B] transition cursor-pointer"
            >
              <span>TẠO ĐỀ MỚI</span>
            </button>
            <button
              type="button"
              onClick={() => {
                sound.playWoodblock();
                setGameState("CONFIG");
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-sm"
            >
              <span>ĐỔI CHẾ ĐỘ</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
