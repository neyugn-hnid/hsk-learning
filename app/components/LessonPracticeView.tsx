import { useEffect, useState, useMemo } from "react";
import {
  Volume2,
  Check,
  RotateCcw,
  Sparkles,
  Flame,
  Star,
  Zap,
  Headphones,
  BookOpen,
  HelpCircle,
  CheckCircle2,
  XCircle,
  X,
  ChevronRight,
  ArrowRight,
  Sparkle,
  Award,
} from "lucide-react";
import { sound } from "~/lib/sound";
import { addExpAndGems, claimLessonExp, isLessonExpClaimed } from "~/lib/gamification";
import { MascotPandaSVG, GemDiamondSVG } from "~/components/Icons/CustomSVGs";

export type QuestionType = "meaning" | "pinyin" | "hanzi" | "listening";

export interface PracticeQuestion {
  id: string;
  type: QuestionType;
  chinese: string;
  pinyin: string;
  meaningVi: string;
  prompt: string;
  subtitle?: string;
  correctAnswer: string;
  options: string[];
  audioText: string;
}

interface VocabularyItem {
  id: string;
  chinese: string;
  pinyin: string;
  meaningVi: string;
  exampleChinese?: string | null;
  exampleMeaning?: string | null;
}

interface LessonPracticeViewProps {
  lessonId?: string;
  lessonTitle: string;
  vocabularies: VocabularyItem[];
  onExit: () => void;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function speakText(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "zh-CN";
  u.rate = 0.88;
  window.speechSynthesis.speak(u);
}

function generate15Questions(vocabularies: VocabularyItem[]): PracticeQuestion[] {
  if (!vocabularies || vocabularies.length === 0) return [];

  const types: QuestionType[] = ["meaning", "pinyin", "hanzi", "listening"];
  const questions: PracticeQuestion[] = [];
  const total = 15;

  for (let i = 0; i < total; i++) {
    const target = vocabularies[i % vocabularies.length];
    const otherVocabs = vocabularies.filter((v) => v.id !== target.id);

    const type = types[i % types.length];

    let correctAnswer = "";
    let options: string[] = [];
    let prompt = "";
    let subtitle = "";

    if (type === "meaning") {
      correctAnswer = target.meaningVi;
      const wrongDistractors = shuffle(otherVocabs.map((v) => v.meaningVi)).slice(0, 3);
      options = shuffle([correctAnswer, ...wrongDistractors]);
      prompt = target.chinese;
      subtitle = target.pinyin;
    } else if (type === "pinyin") {
      correctAnswer = target.pinyin;
      const wrongDistractors = shuffle(otherVocabs.map((v) => v.pinyin)).slice(0, 3);
      options = shuffle([correctAnswer, ...wrongDistractors]);
      prompt = target.chinese;
      subtitle = target.meaningVi;
    } else if (type === "hanzi") {
      correctAnswer = target.chinese;
      const wrongDistractors = shuffle(otherVocabs.map((v) => v.chinese)).slice(0, 3);
      options = shuffle([correctAnswer, ...wrongDistractors]);
      prompt = target.meaningVi;
      subtitle = target.pinyin;
    } else {
      // Listening
      correctAnswer = `${target.chinese} · ${target.meaningVi}`;
      const wrongDistractors = shuffle(
        otherVocabs.map((v) => `${v.chinese} · ${v.meaningVi}`)
      ).slice(0, 3);
      options = shuffle([correctAnswer, ...wrongDistractors]);
      prompt = "Nghe phát âm và chọn đáp án chính xác";
      subtitle = target.pinyin;
    }

    while (options.length < 4) {
      options.push(`Lựa chọn ${options.length + 1}`);
    }

    questions.push({
      id: `q-${i}-${target.id}-${type}`,
      type,
      chinese: target.chinese,
      pinyin: target.pinyin,
      meaningVi: target.meaningVi,
      prompt,
      subtitle,
      correctAnswer,
      options,
      audioText: target.chinese,
    });
  }

  return shuffle(questions);
}

export function LessonPracticeView({
  lessonId,
  lessonTitle,
  vocabularies,
  onExit,
}: LessonPracticeViewProps) {
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [earnedExp, setEarnedExp] = useState(0);
  const [earnedGems, setEarnedGems] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [filterMode, setFilterMode] = useState<"all" | "correct" | "wrong">("all");
  const [userAnswers, setUserAnswers] = useState<
    { question: PracticeQuestion; chosen: string; correct: boolean }[]
  >([]);

  const initPractice = () => {
    const qList = generate15Questions(vocabularies);
    setQuestions(qList);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setIsCorrect(false);
    setStreak(0);
    setScore(0);
    setShowSummary(false);
    setUserAnswers([]);
    setFilterMode("all");

    if (qList[0]?.type === "listening") {
      setTimeout(() => playAudio(qList[0].audioText), 400);
    }
  };

  useEffect(() => {
    initPractice();
  }, [vocabularies]);

  const currentQ = questions[currentIndex];
  const totalQ = questions.length || 15;
  const progressPercent = Math.min(100, Math.round(((currentIndex + 1) / totalQ) * 100));

  const playAudio = (text: string) => {
    setIsPlayingAudio(true);
    speakText(text);
    setTimeout(() => setIsPlayingAudio(false), 1200);
  };

  const handleSelectOption = (opt: string) => {
    if (isAnswered || !currentQ) return;
    sound.playWoodblock();
    setSelectedOption(opt);
  };

  const handleCheckAnswer = () => {
    if (!selectedOption || !currentQ || isAnswered) return;
    setIsAnswered(true);

    const correct = selectedOption === currentQ.correctAnswer;
    setIsCorrect(correct);

    setUserAnswers((prev) => [
      ...prev,
      { question: currentQ, chosen: selectedOption, correct },
    ]);

    if (correct) {
      sound.playCorrect();
      setScore((s) => s + 1);
      setStreak((st) => st + 1);
    } else {
      sound.playIncorrect();
      setStreak(0);
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 < totalQ) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setSelectedOption(null);
      setIsAnswered(false);
      setIsCorrect(false);

      if (questions[nextIdx]?.type === "listening") {
        setTimeout(() => playAudio(questions[nextIdx].audioText), 300);
      }
    } else {
      sound.playVictory();
      const rawExp = score * 5 + 30;
      const rawGems = score >= 12 ? 3 : 1;
      const practiceKey = `practice_${lessonId || lessonTitle}`;
      const claimRes = claimLessonExp(practiceKey, rawExp, rawGems);
      if (!claimRes.alreadyClaimed) {
        setEarnedExp(rawExp);
        setEarnedGems(rawGems);
      } else {
        setEarnedExp(0);
        setEarnedGems(0);
      }
      setShowSummary(true);
    }
  };

  // Keyboard shortcuts: 1-4 to pick, Enter to check / continue, R to audio
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showSummary) return;

      if (!isAnswered && currentQ) {
        if (e.key === "1" || e.key.toLowerCase() === "a") {
          e.preventDefault();
          if (currentQ.options[0]) handleSelectOption(currentQ.options[0]);
        } else if (e.key === "2" || e.key.toLowerCase() === "b") {
          e.preventDefault();
          if (currentQ.options[1]) handleSelectOption(currentQ.options[1]);
        } else if (e.key === "3" || e.key.toLowerCase() === "c") {
          e.preventDefault();
          if (currentQ.options[2]) handleSelectOption(currentQ.options[2]);
        } else if (e.key === "4" || e.key.toLowerCase() === "d") {
          e.preventDefault();
          if (currentQ.options[3]) handleSelectOption(currentQ.options[3]);
        } else if (e.key === "Enter" && selectedOption) {
          e.preventDefault();
          handleCheckAnswer();
        }
      } else if (isAnswered) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleNextQuestion();
        }
      }

      if (e.key.toLowerCase() === "r" && currentQ) {
        e.preventDefault();
        playAudio(currentQ.audioText);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAnswered, selectedOption, showSummary, currentQ, currentIndex, totalQ]);

  const getQuestionInstruction = () => {
    if (!currentQ) return "";
    switch (currentQ.type) {
      case "meaning":
        return "Chọn nghĩa tiếng Việt chính xác của từ:";
      case "pinyin":
        return "Chọn phiên âm Pinyin đúng của từ:";
      case "hanzi":
        return "Chọn chữ Hán tương ứng với nghĩa:";
      case "listening":
        return "Lắng nghe phát âm và chọn đáp án đúng:";
    }
  };

  const filteredAnswers = useMemo(() => {
    if (filterMode === "correct") return userAnswers.filter((a) => a.correct);
    if (filterMode === "wrong") return userAnswers.filter((a) => !a.correct);
    return userAnswers;
  }, [userAnswers, filterMode]);

  return (
    <div className="min-h-screen flex flex-col justify-between bg-white text-slate-900 selection:bg-emerald-100 selection:text-emerald-900 pb-36">
      {/* ========================================================================= */}
      {/* 1. DUOLINGO-STYLE HEADER (Progress bar + Close + Streak)                   */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          {/* Close Button */}
          <button
            type="button"
            onClick={() => {
              sound.playWoodblock();
              onExit();
            }}
            className="flex h-10 w-10 items-center justify-center rounded-2xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
            title="Thoát phòng luyện tập"
          >
            <X size={24} strokeWidth={2.5} />
          </button>

          {/* Clean Flat Progress Bar */}
          <div className="flex-1 max-w-xl mx-2">
            <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-300 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Streak Flame Pill */}
          <div className="flex items-center gap-2">
            {streak >= 2 && (
              <div className="flex items-center gap-1.5 px-3.5 py-1 text-xs font-black text-amber-600 animate-bounce">
                <Flame size={16} className="fill-amber-500 text-amber-500" />
                <span>{streak}</span>
              </div>
            )}
            <span className="font-mono text-xs font-black text-slate-400">
              {currentIndex + 1}/{totalQ}
            </span>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. QUESTION STAGE ARENA                                                   */}
      {/* ========================================================================= */}
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:py-8 sm:px-6 flex flex-col justify-center">
        {!showSummary && currentQ ? (
          <div className="space-y-6 sm:space-y-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Instruction Title */}
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {getQuestionInstruction()}
            </h2>

            {/* Bao Bao Mascot Dialogue Speech Box */}
            <div className="flex items-start gap-3 sm:gap-5">
              {/* Bao Bao Avatar Mascot */}
              <div className="shrink-0 pt-1">
                <div className="relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-3xl bg-amber-50 border-2 border-amber-200/80 p-2 shadow-sm">
                  <MascotPandaSVG className="h-full w-full animate-bounce-short" />
                </div>
              </div>

              {/* Character Dialogue Box */}
              <div className="relative flex-1 rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-7 shadow-xs">
                {/* Speech Bubble Arrow pointing left */}
                <div className="absolute -left-2.5 top-7 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-8 border-r-slate-200" />
                <div className="absolute -left-2 top-7 w-0 h-0 border-t-7 border-t-transparent border-b-7 border-b-transparent border-r-7 border-r-white" />

                <div className="flex items-center justify-between gap-4">
                  {currentQ.type === "listening" ? (
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => playAudio(currentQ.audioText)}
                        className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500 hover:bg-sky-600 active:scale-95 text-white shadow-sm transition-all cursor-pointer ${
                          isPlayingAudio ? "scale-105 ring-2 ring-sky-300" : ""
                        }`}
                        title="Bấm phím R để nghe lại"
                      >
                        <Volume2 size={26} className={isPlayingAudio ? "animate-pulse" : ""} />
                      </button>
                      <div>
                        <span className="text-sm font-black text-sky-700">Nghe đoạn âm thanh</span>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">
                          Nhấn vào loa hoặc phím <kbd className="px-1.5 py-0.5 rounded border border-slate-200 bg-slate-100 font-mono text-[10px] font-bold text-slate-600">R</kbd>
                        </p>
                      </div>
                    </div>
                  ) : currentQ.type === "hanzi" ? (
                    <div className="space-y-1">
                      <p className="text-2xl sm:text-3xl font-black text-slate-900">
                        {currentQ.prompt}
                      </p>
                      {currentQ.subtitle && (
                        <p className="font-mono text-sm font-bold text-amber-600">
                          {currentQ.subtitle}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="font-hanzi font-black text-slate-900 text-5xl sm:text-6xl tracking-wide select-none">
                        {currentQ.prompt}
                      </p>
                      {currentQ.subtitle && (
                        <p className="font-mono text-sm sm:text-base font-bold text-rose-600">
                          {currentQ.subtitle}
                        </p>
                      )}
                    </div>
                  )}

                  {currentQ.type !== "listening" && (
                    <button
                      type="button"
                      onClick={() => playAudio(currentQ.audioText)}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 transition-colors cursor-pointer"
                      title="Phát âm (Phím R)"
                    >
                      <Volume2 size={20} className={isPlayingAudio ? "text-rose-600 animate-pulse" : ""} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 4 Interactive Choice Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-2">
              {currentQ.options.map((opt, idx) => {
                const isSelected = selectedOption === opt;
                const isCorrectOption = opt === currentQ.correctAnswer;

                let cardStyle =
                  "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50/80 hover:border-slate-300 shadow-2xs";

                if (isSelected && !isAnswered) {
                  cardStyle =
                    "border-2 border-sky-500 bg-sky-50/70 text-sky-950 font-bold shadow-xs";
                }

                if (isAnswered) {
                  if (isCorrectOption) {
                    cardStyle =
                      "border-2 border-emerald-500 bg-emerald-50 text-emerald-950 font-bold shadow-xs";
                  } else if (isSelected) {
                    cardStyle =
                      "border-2 border-rose-500 bg-rose-50 text-rose-950 font-bold shadow-xs";
                  } else {
                    cardStyle =
                      "border border-slate-100 bg-slate-50/40 text-slate-300 opacity-40 shadow-none";
                  }
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={isAnswered}
                    onClick={() => handleSelectOption(opt)}
                    className={`group relative flex items-center justify-between rounded-2xl p-4 sm:p-5 text-left transition-all active:scale-[0.99] cursor-pointer ${cardStyle}`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0 pr-2">
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-xs font-mono font-bold transition-colors ${
                          isSelected && !isAnswered
                            ? "bg-sky-500 text-white"
                            : isAnswered && isCorrectOption
                            ? "bg-emerald-500 text-white"
                            : isAnswered && isSelected
                            ? "bg-rose-500 text-white"
                            : "bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-800"
                        }`}
                      >
                        {idx + 1}
                      </span>

                      {opt.includes("·") ? (
                        (() => {
                          const parts = opt.split("·").map((s) => s.trim());
                          const zhPart = parts[0] || "";
                          const viPart = parts.slice(1).join(" · ");
                          return (
                            <div className="flex items-center gap-2 truncate font-sans">
                              <span className="font-hanzi text-lg sm:text-xl font-bold text-slate-900 shrink-0">
                                {zhPart}
                              </span>
                              <span className="text-slate-300 font-light">·</span>
                              <span className="text-sm sm:text-base font-semibold text-slate-700 font-sans truncate">
                                {viPart}
                              </span>
                            </div>
                          );
                        })()
                      ) : currentQ.type === "hanzi" ? (
                        <span className="font-hanzi text-xl sm:text-2xl font-bold tracking-wide text-slate-900">
                          {opt}
                        </span>
                      ) : currentQ.type === "pinyin" ? (
                        <span className="font-mono text-base sm:text-lg font-bold text-slate-800">
                          {opt}
                        </span>
                      ) : (
                        <span className="font-sans text-base sm:text-lg font-semibold text-slate-800 tracking-normal leading-snug truncate">
                          {opt}
                        </span>
                      )}
                    </div>

                    {isAnswered && isCorrectOption && (
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                        <Check size={14} strokeWidth={3} />
                      </div>
                    )}
                    {isAnswered && isSelected && !isCorrectOption && (
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-500 text-white">
                        <X size={14} strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ) : showSummary ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 text-center space-y-6 shadow-xl animate-in zoom-in-95 duration-200 max-w-xl mx-auto">
            {/* Top Badge */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 text-xs font-black text-amber-800">
              <Sparkles size={13} className="text-amber-600" />
              <span>HOÀN THÀNH BÀI LUYỆN TẬP</span>
            </div>

            {/* Mascot Centerpiece & Stars */}
            <div className="py-1 space-y-3">
              <div className="mx-auto flex h-24 w-24 items-center justify-center">
                <MascotPandaSVG className="h-full w-full object-contain animate-bounce" />
              </div>

              {/* 3 Golden Stars */}
              <div className="flex justify-center gap-2">
                {[1, 2, 3].map((s) => (
                  <Star
                    key={s}
                    size={22}
                    className="fill-amber-400 text-amber-400 drop-shadow-xs animate-in zoom-in duration-300"
                  />
                ))}
              </div>
            </div>

            {/* Title & Lesson Subtitle */}
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                XUẤT SẮC HOÀN THÀNH!
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Bài học: <span className="font-bold text-slate-800">{lessonTitle}</span>
              </p>
            </div>

            {/* Score & Rewards 3-Card Grid */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5">
              <div className="rounded-2xl border border-purple-200/80 bg-purple-50/50 p-3 sm:p-4 text-center">
                <span className="text-[10px] font-bold text-purple-800/80 block">Tỷ Lệ Đúng</span>
                <p className="text-lg sm:text-xl font-black text-purple-900 my-0.5">
                  {Math.round((score / totalQ) * 100)}%
                </p>
                <span className="text-[10px] text-purple-700/80 font-medium block">
                  {score}/{totalQ} câu
                </span>
              </div>

              <div className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-3 sm:p-4 text-center">
                <span className="text-[10px] font-bold text-amber-800/80 block">Kinh Nghiệm</span>
                <p className="text-lg sm:text-xl font-black text-amber-700 my-0.5">
                  +{earnedExp} <span className="text-[10px] font-normal text-amber-600">EXP</span>
                </p>
                <span className="text-[10px] text-amber-700/80 font-medium block">Tích lũy</span>
              </div>

              <div className="rounded-2xl border border-sky-200/80 bg-sky-50/50 p-3 sm:p-4 text-center">
                <span className="text-[10px] font-bold text-sky-800/80 block">Kim Cương</span>
                <p className="text-lg sm:text-xl font-black text-sky-700 my-0.5">
                  +{earnedGems} <span className="text-[10px] font-normal text-sky-600">Gems</span>
                </p>
                <span className="text-[10px] text-sky-700/80 font-medium block">Thưởng thêm</span>
              </div>
            </div>

            {earnedExp === 0 && (
              <p className="text-xs text-slate-500 font-medium">
                Bạn đã nhận thưởng luyện tập bài này trước đó · Luyện tập ôn kiến thức.
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={initPractice}
                className="flex-1 flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 py-3.5 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <RotateCcw size={15} />
                <span>Luyện Tập Lại</span>
              </button>

              <button
                type="button"
                onClick={onExit}
                className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 py-3.5 text-xs sm:text-sm font-black text-white shadow-sm hover:shadow active:scale-[0.98] transition-all cursor-pointer"
              >
                <span>Quay Về Bài Học</span>
              </button>
            </div>
          </div>
        ) : null}
      </main>

      {/* ========================================================================= */}
      {/* 4. DUOLINGO INTERACTIVE BOTTOM ACTION DRAWER                              */}
      {/* ========================================================================= */}
      {!showSummary && (
        <footer
          className={`fixed bottom-0 inset-x-0 z-30 border-t-2 py-4 sm:py-5 px-4 sm:px-6 lg:px-8 transition-all ${
            !isAnswered
              ? "border-slate-200 bg-white"
              : isCorrect
              ? "border-[#a5ed6e] bg-[#d7ffb8] text-[#3c7a00]"
              : "border-[#ffb8b8] bg-[#ffdfe0] text-[#ea2b2b]"
          }`}
        >
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-4">
            {!isAnswered ? (
              <div className="flex w-full items-center justify-between gap-4">
                <p className="text-xs text-slate-400 font-bold hidden sm:block">
                  Nhấn phím số 1-4 hoặc chọn đáp án
                </p>

                <button
                  type="button"
                  disabled={!selectedOption}
                  onClick={handleCheckAnswer}
                  className={`w-full sm:w-auto ml-auto px-8 py-3.5 rounded-2xl font-black text-sm uppercase tracking-wide border-b-4 transition-all cursor-pointer ${
                    selectedOption
                      ? "bg-[#58cc02] hover:bg-[#46a302] border-[#46a302] text-white shadow-md active:border-b-2 active:translate-y-0.5"
                      : "bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed border-b-4"
                  }`}
                >
                  Kiểm Tra
                </button>
              </div>
            ) : (
              <div className="flex w-full flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in duration-200">
                <div className="flex items-center gap-3.5 text-left w-full sm:w-auto">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                      isCorrect ? "bg-[#58cc02] text-white" : "bg-[#ff4b4b] text-white"
                    }`}
                  >
                    {isCorrect ? <Check size={26} strokeWidth={3.5} /> : <X size={26} strokeWidth={3.5} />}
                  </div>

                  <div>
                    <h3 className="text-lg font-black leading-tight">
                      {isCorrect ? "Chính xác! Tuyệt vời lắm! (+5 EXP)" : "Chưa chính xác!"}
                    </h3>
                    {!isCorrect && (
                      <p className="text-xs font-bold mt-0.5 opacity-90">
                        Đáp án đúng: <span className="underline font-black">{currentQ?.correctAnswer}</span>
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleNextQuestion}
                  className={`w-full sm:w-auto px-9 py-3.5 rounded-2xl text-sm font-black text-white uppercase tracking-wide border-b-4 active:border-b-2 active:translate-y-0.5 transition-all cursor-pointer ${
                    isCorrect
                      ? "bg-[#58cc02] hover:bg-[#46a302] border-[#46a302] shadow-md"
                      : "bg-[#ff4b4b] hover:bg-[#e03b3b] border-[#d62828] shadow-md"
                  }`}
                >
                  <span>{currentIndex + 1 >= totalQ ? "Xem Kết Quả" : "Tiếp Tục ➔"}</span>
                </button>
              </div>
            )}
          </div>
        </footer>
      )}
    </div>
  );
}
