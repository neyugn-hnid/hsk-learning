import type { Route } from "./+types/lessons.$lessonId";
import { useEffect, useMemo, useRef, useState } from "react";
import { data } from "react-router";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Check,
  Volume2,
} from "lucide-react";
import { SiteLayout } from "~/components/Layout";
import { getUser } from "~/lib/auth.server";
import { prisma } from "~/lib/db.server";

export async function loader({ request, params }: Route.LoaderArgs) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: params.lessonId },
    include: { vocabularies: true, grammars: true, quizzes: true },
  });

  if (!lesson) throw data("Không tìm thấy bài học", { status: 404 });
  return { user: await getUser(request), lesson };
}

type StudyTab = "vocabulary" | "translation" | "hanzi" | "quiz";
type QuizMode = "meaning" | "pinyin" | "recognition" | "listening";

function shuffleItems<T>(items: T[]): T[] {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function speakChinese(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "zh-CN";
  utterance.rate = 0.85;
  const voices = window.speechSynthesis.getVoices();
  // Ưu tiên giọng nữ (Ting-Ting, Mei-Jia, Yu-Xiao…)
  const zhVoice = voices
    .filter((v) => v.lang.startsWith("zh"))
    .sort((a) => (a.name.toLowerCase().includes("chen") ? 1 : -1))[0];
  if (zhVoice) utterance.voice = zhVoice;
  window.speechSynthesis.speak(utterance);
}

export default function LessonDetail({ loaderData }: Route.ComponentProps) {
  const { lesson } = loaderData;
  const [activeTab, setActiveTab] = useState<StudyTab>("vocabulary");
  const [vocabIndex, setVocabIndex] = useState(0);
  const [showMeaning, setShowMeaning] = useState(false);
  const [translationAnswer, setTranslationAnswer] = useState("");
  const [checkedTranslation, setCheckedTranslation] = useState(false);
  const [hanziAnswer, setHanziAnswer] = useState("");
  const [checkedHanzi, setCheckedHanzi] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizResponse, setQuizResponse] = useState("");
  const [quizMode, setQuizMode] = useState<QuizMode>("meaning");

  // Shuffle 1 lần, giống nhau giữa server và client để tránh hydration error
  const [shuffledVocab] = useState(() => shuffleItems(lesson.vocabularies));
  const [shuffledQuizzes] = useState(() => shuffleItems(lesson.quizzes));

  // Warm-up speechSynthesis cho lần phát đầu tiên
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.getVoices();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(" "));
    window.speechSynthesis.cancel();
  }, []);

  const generatedQuizzes = useMemo(() => {
    return shuffledVocab.map((vocab) => {
      const distractors = shuffledVocab
        .filter((v) => v.chinese !== vocab.chinese)
        .map((v) => {
          if (quizMode === "pinyin") return v.pinyin;
          if (quizMode === "recognition" || quizMode === "listening") return v.chinese;
          return v.meaningVi;
        })
        .filter(Boolean);
      const answer =
        quizMode === "pinyin" ? vocab.pinyin
        : quizMode === "recognition" || quizMode === "listening" ? vocab.chinese
        : vocab.meaningVi;
      const options = shuffleItems([...new Set([answer, ...distractors])].slice(0, 4));
      return {
        type: quizMode === "pinyin" ? "PINYIN" : quizMode === "recognition" || quizMode === "listening" ? "CHAR_RECOGNITION" : "MEANING",
        question: quizMode === "pinyin" ? `"${vocab.chinese}" đọc pinyin là gì?`
          : quizMode === "listening" ? "Nghe và chọn chữ Hán đúng"
          : quizMode === "recognition" ? `Chữ Hán nào có pinyin "${vocab.pinyin}"?`
          : `"${vocab.chinese}" nghĩa là gì?`,
        options,
        answer,
        promptPinyin: vocab.pinyin,
      };
    });
  }, [quizMode, shuffledVocab]);

  const practiceQuestions = shuffledQuizzes.length && quizMode === "meaning" ? shuffledQuizzes : generatedQuizzes;
  const currentVocab = shuffledVocab[vocabIndex];
  const currentQuiz = practiceQuestions[quizIndex];

  const normalizedUserMeaning = translationAnswer.trim().toLowerCase();
  const normalizedCorrectMeaning = (currentVocab?.meaningVi || "").trim().toLowerCase();
  const translationCorrect = checkedTranslation && normalizedUserMeaning.length > 0 &&
    (normalizedUserMeaning === normalizedCorrectMeaning || normalizedCorrectMeaning.includes(normalizedUserMeaning) || normalizedUserMeaning.includes(normalizedCorrectMeaning));

  const normalizedUserHanzi = hanziAnswer.trim();
  const normalizedCorrectHanzi = (currentVocab?.chinese || "").trim();
  const hanziCorrect = checkedHanzi && normalizedUserHanzi.length > 0 && normalizedUserHanzi === normalizedCorrectHanzi;

  const hasQuizAnswer = quizResponse.trim().length > 0;
  const quizCorrect = hasQuizAnswer && quizResponse.trim() === (currentQuiz?.answer || "").trim();

  useEffect(() => {
    setVocabIndex(0); setShowMeaning(false);
    setTranslationAnswer(""); setCheckedTranslation(false);
    setHanziAnswer(""); setCheckedHanzi(false);
    setQuizIndex(0); setQuizResponse("");
    setQuizMode("meaning");
  }, [activeTab]);

  useEffect(() => { setQuizIndex(0); setQuizResponse(""); }, [quizMode]);

  // Reset quizResponse khi chuyển câu hỏi
  useEffect(() => { setQuizResponse(""); }, [quizIndex]);

  useEffect(() => {
    if (activeTab === "quiz" && quizMode === "listening" && currentQuiz?.answer) {
      speakChinese(currentQuiz.answer as string);
    }
  }, [quizIndex, quizMode, activeTab, currentQuiz?.answer]);

  const switchTab = (tab: StudyTab) => {
    if (!shuffledVocab.length && tab !== "quiz") return;
    if (tab === "quiz" && !shuffledVocab.length && !shuffledQuizzes.length) return;
    setActiveTab(tab);
  };

  const randomOther = (current: number, total: number) => {
    if (total <= 1) return 0;
    let next: number;
    do { next = Math.floor(Math.random() * total); } while (next === current);
    return next;
  };
  const nextVocab = () => {
    if (!shuffledVocab.length) return;
    setVocabIndex(randomOther(vocabIndex, shuffledVocab.length));
    setShowMeaning(false); setTranslationAnswer(""); setCheckedTranslation(false);
    setHanziAnswer(""); setCheckedHanzi(false);
  };
  const prevVocab = () => {
    if (!shuffledVocab.length) return;
    setVocabIndex(randomOther(vocabIndex, shuffledVocab.length));
    setShowMeaning(false); setTranslationAnswer(""); setCheckedTranslation(false);
    setHanziAnswer(""); setCheckedHanzi(false);
  };
  const nextQuiz = () => { if (!practiceQuestions.length) return; setQuizIndex(randomOther(quizIndex, practiceQuestions.length)); setQuizResponse(""); };
  const prevQuiz = () => { if (!practiceQuestions.length) return; setQuizIndex(randomOther(quizIndex, practiceQuestions.length)); setQuizResponse(""); };

  const tabTitle = activeTab === "vocabulary" ? "Học từ vựng" : activeTab === "translation" ? "Dịch nghĩa" : activeTab === "hanzi" ? "Chữ Hán" : "Luyện tập";
  const activeCount = activeTab === "quiz" ? practiceQuestions.length : shuffledVocab.length;

  return (
    <SiteLayout user={loaderData.user}>
      <main className="mx-auto max-w-3xl px-3 py-4 md:px-4 md:py-8">
        

        <div className="mt-4 md:mt-6">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:rounded-3xl sm:p-4 md:p-6">
            <div className="mb-4 flex flex-col gap-3">
              <div>
                <h1 className="text-lg font-bold sm:text-xl">{lesson.title}</h1>
                <p className="mt-1 text-sm text-slate-500">{lesson.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold sm:text-xl">{tabTitle}</h2>
                <p className="text-xs text-slate-400 sm:text-sm">
                  {activeTab === "quiz" ? `Câu ${quizIndex + 1}/${activeCount}` : `${vocabIndex + 1}/${activeCount}`}
                </p>
              </div>
              {/* Tab row */}
              <div className="-mx-1 flex flex-wrap justify-center gap-1">
                {(["vocabulary", "translation", "hanzi", "quiz"] as StudyTab[]).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => switchTab(tab)}
                    disabled={!shuffledVocab.length && tab !== "quiz"}
                    className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition sm:rounded-2xl sm:px-5 sm:py-2.5 sm:text-sm ${
                      activeTab === tab ? "bg-red-600 text-white" : "bg-slate-100 text-slate-500"
                    } disabled:cursor-not-allowed disabled:opacity-40`}
                  >
                    {tab === "vocabulary" ? "Từ Vựng" : tab === "translation" ? "Dịch Nghĩa" : tab === "hanzi" ? "Chữ Hán" : "Luyện Tập"}
                  </button>
                ))}
              </div>
            </div>

            {/* VOCABULARY */}
            {activeTab === "vocabulary" && currentVocab && (
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-red-50 to-amber-50 p-2 shadow-sm sm:rounded-[2rem] sm:p-6">
                <div className="relative mx-auto max-w-3xl overflow-hidden rounded-2xl bg-white p-3 pt-10 text-center shadow-md sm:rounded-[2rem] sm:p-6 sm:pt-14">
                  <button onClick={() => speakChinese(currentVocab.chinese)} className="absolute right-2 top-2 rounded-full bg-red-50 p-2.5 text-red-600 shadow-sm hover:bg-red-100 sm:right-5 sm:top-5 sm:p-3" title="Nghe phát âm" type="button"><Volume2 size={18} className="sm:w-5 sm:h-5" /></button>
                  <p className="break-all text-5xl font-black text-red-600 sm:text-6xl md:text-7xl" suppressHydrationWarning>{currentVocab.chinese}</p>
                  <p className="mt-3 break-words text-base font-bold text-slate-800 sm:mt-4 sm:text-xl" suppressHydrationWarning>{currentVocab.pinyin}</p>
                  {showMeaning ? (
                    <div className="mt-4 rounded-2xl bg-amber-50 p-3 sm:mt-6 sm:rounded-3xl sm:p-5">
                      <p className="text-lg font-extrabold text-slate-900 sm:text-2xl">{currentVocab.meaningVi}</p>
                      {currentVocab.exampleChinese ? (
                        <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 sm:mt-4 sm:gap-2">
                          <p className="break-words text-sm font-semibold sm:text-lg">{currentVocab.exampleChinese}</p>
                          <button onClick={() => speakChinese(currentVocab.exampleChinese || "")} className="rounded-full bg-white p-1.5 text-red-600 hover:bg-red-100 sm:p-2" type="button"><Volume2 size={14} className="sm:w-4 sm:h-4" /></button>
                        </div>
                      ) : null}
                      {currentVocab.examplePinyin ? <p className="mt-1 text-xs font-semibold text-red-600 sm:text-sm">{currentVocab.examplePinyin}</p> : null}
                      {currentVocab.exampleMeaning ? <p className="mt-1 text-xs text-slate-600 sm:text-sm">{currentVocab.exampleMeaning}</p> : null}
                    </div>
                  ) : (
                    <div className="mt-4 rounded-2xl border border-dashed border-slate-200 p-4 text-xs text-slate-400 sm:mt-6 sm:rounded-3xl sm:p-5 sm:text-sm">Ẩn nghĩa để bạn tự nhớ trước</div>
                  )}
                  <div className="mt-4 grid grid-cols-3 gap-1.5 sm:mt-6 sm:flex sm:flex-wrap sm:justify-center sm:gap-2.5">
                    <NavBtn onClick={prevVocab} label="Trước" />
                    <button onClick={() => setShowMeaning((p) => !p)} type="button" className="flex min-h-10 items-center justify-center gap-1.5 rounded-2xl bg-red-600 px-3 py-2.5 text-xs font-semibold text-white hover:bg-red-700 sm:min-h-12 sm:px-5 sm:py-3 sm:text-sm">
                      {showMeaning ? <EyeOff size={16} className="sm:w-[18px] sm:h-[18px]" /> : <Eye size={16} className="sm:w-[18px] sm:h-[18px]" />}{showMeaning ? "Ẩn" : "Lật"}
                    </button>
                    <NavBtn onClick={nextVocab} label="Tiếp" next />
                  </div>
                </div>
              </div>
            )}

            {/* TRANSLATION */}
            {activeTab === "translation" && currentVocab && (
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-red-50 to-amber-50 p-2 shadow-sm sm:rounded-[2rem] sm:p-6">
                <div className="relative mx-auto max-w-3xl overflow-hidden rounded-2xl bg-white p-3 pt-10 text-center shadow-md sm:rounded-[2rem] sm:p-6 sm:pt-14">
                  <button onClick={() => speakChinese(currentVocab.chinese)} className="absolute right-2 top-2 rounded-full bg-red-50 p-2.5 text-red-600 shadow-sm hover:bg-red-100 sm:right-5 sm:top-5 sm:p-3" type="button"><Volume2 size={18} /></button>
                  <p className="break-all text-5xl font-black text-red-600 sm:text-6xl md:text-7xl" suppressHydrationWarning>{currentVocab.chinese}</p>
                  <p className="mt-3 break-words text-base font-bold text-slate-800 sm:mt-4 sm:text-xl" suppressHydrationWarning>{currentVocab.pinyin}</p>
                  <div className="mt-5">
                    <input value={translationAnswer} onChange={(e) => setTranslationAnswer(e.target.value)} placeholder="Nhập nghĩa tiếng Việt..."
                      className={`w-full rounded-2xl border px-4 py-3 text-base font-semibold outline-none transition ${checkedTranslation ? (translationCorrect ? "border-emerald-400 bg-emerald-50" : "border-red-400 bg-red-50") : "border-slate-200 focus:border-red-400"}`}
                      onKeyDown={(e) => { if (e.key === "Enter") setCheckedTranslation(true); }} />
                  </div>
                  {!checkedTranslation ? (
                    <button onClick={() => setCheckedTranslation(true)} disabled={!translationAnswer.trim()} className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"><Check size={18} />Kiểm tra</button>
                  ) : null}
                  <div className="mt-4 grid grid-cols-2 gap-1.5 sm:flex sm:justify-center sm:gap-2.5">
                    <NavBtn onClick={prevVocab} label="Trước" />
                    <NavBtn onClick={nextVocab} label="Tiếp" next />
                  </div>
                </div>
              </div>
            )}

            {/* HANZI */}
            {activeTab === "hanzi" && currentVocab && (
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-red-50 to-amber-50 p-2 shadow-sm sm:rounded-[2rem] sm:p-6">
                <div className="relative mx-auto max-w-3xl overflow-hidden rounded-2xl bg-white p-3 pt-10 text-center shadow-md sm:rounded-[2rem] sm:p-6 sm:pt-14">
                  <button onClick={() => speakChinese(currentVocab.chinese)} className="absolute right-2 top-2 rounded-full bg-red-50 p-2.5 text-red-600 shadow-sm hover:bg-red-100 sm:right-5 sm:top-5 sm:p-3" type="button"><Volume2 size={18} /></button>
                  <p className="break-all text-4xl font-black text-red-600 sm:text-5xl" suppressHydrationWarning>{currentVocab.pinyin}</p>
                  <p className="mt-2 text-base text-slate-500 sm:text-lg" suppressHydrationWarning>{currentVocab.meaningVi}</p>
                  <div className="mt-5">
                    <input value={hanziAnswer} onChange={(e) => setHanziAnswer(e.target.value)} placeholder="Nhập chữ Hán..."
                      className={`w-full rounded-2xl border px-4 py-3 text-base font-semibold outline-none transition ${checkedHanzi ? (hanziCorrect ? "border-emerald-400 bg-emerald-50" : "border-red-400 bg-red-50") : "border-slate-200 focus:border-red-400"}`}
                      onKeyDown={(e) => { if (e.key === "Enter") setCheckedHanzi(true); }} />
                  </div>
                  {!checkedHanzi ? (
                    <button onClick={() => setCheckedHanzi(true)} disabled={!hanziAnswer.trim()} className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"><Check size={18} />Kiểm tra</button>
                  ) : null}
                  <div className="mt-4 grid grid-cols-2 gap-1.5 sm:flex sm:justify-center sm:gap-2.5">
                    <NavBtn onClick={prevVocab} label="Trước" />
                    <NavBtn onClick={nextVocab} label="Tiếp" next />
                  </div>
                </div>
              </div>
            )}

            {/* QUIZ */}
            {activeTab === "quiz" && currentQuiz && (
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-red-50 to-amber-50 p-2 shadow-sm sm:rounded-[2rem] sm:p-6">
                <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl bg-white p-3 shadow-md sm:rounded-[2rem] sm:p-6">
                  {/* Quiz mode pills */}
                  <div className="-mx-1 mb-4 flex justify-center overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
                    {(["meaning", "pinyin", "recognition", "listening"] as const).map((m) => (
                      <button key={m} onClick={() => setQuizMode(m)}
                        className={`mx-1 shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition sm:rounded-xl sm:px-4 sm:py-2 sm:text-sm ${quizMode === m ? "bg-red-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                        {m === "meaning" ? "Nghĩa" : m === "pinyin" ? "Pinyin" : m === "recognition" ? "Chữ Hán" : "Nghe"}
                      </button>
                    ))}
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-900 sm:text-xl">{currentQuiz.question}</h3>
                  {quizMode === "listening" ? (
                    <button onClick={() => speakChinese(currentQuiz.answer as string)} className="mt-3 flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600 sm:rounded-2xl sm:px-4 sm:py-2.5 sm:text-sm" type="button">
                      <Volume2 size={16} />Nghe lại
                    </button>
                  ) : null}
                  <div className="mt-4 grid gap-2">
                    {(Array.isArray(currentQuiz.options) ? currentQuiz.options.map((o: unknown) => String(o)) : []).map((option: string) => {
                      const isSelected = quizResponse === option;
                      const isCorrectOpt = option === currentQuiz.answer;
                      return (
                        <button key={option} type="button" onClick={() => setQuizResponse(option)}
                          className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                            hasQuizAnswer ? isCorrectOpt ? "border-emerald-300 bg-emerald-50 text-emerald-700" : isSelected ? "border-red-300 bg-red-50 text-red-700" : "border-slate-200 bg-white text-slate-500"
                            : isSelected ? "border-red-300 bg-red-50 text-red-700" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          }`}>
                          {option}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:justify-center sm:gap-3">
                    <NavBtn onClick={prevQuiz} label="Câu trước" />
                    <NavBtn onClick={nextQuiz} label="Câu tiếp theo" next />
                  </div>
                </div>
              </div>
            )}

            {activeTab !== "quiz" && !currentVocab ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-400">Bài này chưa có từ vựng.</div>
            ) : null}
            {activeTab === "quiz" && !currentQuiz ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-400">Bài này chưa có quiz.</div>
            ) : null}
          </section>
        </div>
      </main>
    </SiteLayout>
  );
}

function NavBtn({ onClick, label, next }: { onClick: () => void; label: string; next?: boolean }) {
  return (
    <button onClick={onClick} type="button"
      className={`flex min-h-10 items-center justify-center gap-1 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 sm:min-h-12 sm:gap-2 sm:px-5 sm:py-3 sm:text-sm ${next ? "flex-row-reverse" : ""}`}>
      {next ? <ChevronRight size={16} className="sm:w-[18px] sm:h-[18px]" /> : <ChevronLeft size={16} className="sm:w-[18px] sm:h-[18px]" />}{label}
    </button>
  );
}
