import type { Route } from "./+types/ai-practice";
import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  Sparkles,
  XCircle,
} from "lucide-react";
import { SiteLayout } from "~/components/Layout";
import { getUser } from "~/lib/auth.server";
import { prisma } from "~/lib/db.server";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getUser(request);
  const lessons = await prisma.lesson.findMany({
    where: { status: "PUBLISHED" },
    select: { id: true, title: true, level: true, source: true },
    orderBy: [{ level: "asc" }, { orderNo: "asc" }],
    take: 50,
  });
  return { user, lessons };
}

type AIQuestion = {
  id: string;
  type: string;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
};

type SessionStats = {
  total: number;
  correct: number;
  incorrect: number;
};

export default function AIPractice({ loaderData }: Route.ComponentProps) {
  const [selectedLessons, setSelectedLessons] = useState<string[]>([]);
  const [started, setStarted] = useState(false);
  const [question, setQuestion] = useState<AIQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [checked, setChecked] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<{ q: string; a: string; correct: boolean }[]>([]);
  const [stats, setStats] = useState<SessionStats>({ total: 0, correct: 0, incorrect: 0 });
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [question, history]);

  const toggleLesson = (id: string) => {
    setSelectedLessons((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const generateQuestion = async () => {
    setLoading(true);
    setSelectedAnswer("");
    setChecked(false);
    setCorrect(false);
    setFeedback("");

    try {
      const res = await fetch("/api/ai/practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intent: "generate",
          lessonIds: selectedLessons,
          history,
        }),
      });
      const data = (await res.json()) as { question?: AIQuestion; error?: string };
      if (data.question) {
        setQuestion(data.question);
      } else {
        setFeedback(data.error || "Có lỗi xảy ra.");
      }
    } catch {
      setFeedback("Không thể kết nối AI.");
    } finally {
      setLoading(false);
    }
  };

  const startPractice = () => {
    setStarted(true);
    setHistory([]);
    setStats({ total: 0, correct: 0, incorrect: 0 });
    setTimeout(() => generateQuestion(), 100);
  };

  const checkAnswer = async () => {
    if (!selectedAnswer || !question) return;
    setLoading(true);

    try {
      const newHistory = [...history, { q: question.question, a: question.answer, correct: false }];
      const res = await fetch("/api/ai/practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intent: "check",
          questionId: question.id,
          userAnswer: selectedAnswer,
          history: newHistory,
        }),
      });
      const data = (await res.json()) as { correct: boolean; feedback: string };

      // So sánh đáp án
      const isCorrect = selectedAnswer.trim().toLowerCase() === question.answer.trim().toLowerCase();
      setCorrect(isCorrect);
      setChecked(true);
      setFeedback(data.feedback || (isCorrect ? "Chính xác! 🎉" : `Đáp án đúng: ${question.answer}`));

      setHistory((prev) => [
        ...prev,
        { q: question.question, a: question.answer, correct: isCorrect },
      ]);
      setStats((prev) => ({
        total: prev.total + 1,
        correct: prev.correct + (isCorrect ? 1 : 0),
        incorrect: prev.incorrect + (isCorrect ? 0 : 1),
      }));
    } catch {
      setFeedback("Có lỗi khi kiểm tra.");
    } finally {
      setLoading(false);
    }
  };

  const nextQuestion = () => {
    setSelectedAnswer("");
    setChecked(false);
    setCorrect(false);
    setFeedback("");
    generateQuestion();
  };

  const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;

  return (
    <SiteLayout user={loaderData.user}>
      <main className="mx-auto max-w-3xl px-4 py-6 md:py-10">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-sm">
            <Brain size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Luyện tập với AI</h1>
            <p className="text-sm text-slate-500">AI tạo câu hỏi thông minh từ từ vựng của bạn</p>
          </div>
        </div>

        {!started ? (
          /* === SETUP SCREEN === */
          <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Chọn bài học để luyện tập</h2>
            <p className="mt-1 text-sm text-slate-500">Nếu không chọn, AI sẽ lấy từ vựng ngẫu nhiên trong toàn bộ dữ liệu.</p>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {loaderData.lessons.map((lesson) => (
                <button
                  key={lesson.id}
                  onClick={() => toggleLesson(lesson.id)}
                  className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                    selectedLessons.includes(lesson.id)
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                  type="button"
                >
                  <span className="text-xs text-slate-400">{lesson.source || "HSK"}</span>
                  <p className="mt-0.5">{lesson.title}</p>
                  <span className="text-xs font-bold text-slate-400">{lesson.level}</span>
                </button>
              ))}
            </div>

            <button
              onClick={startPractice}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 px-5 py-4 font-bold text-white hover:from-emerald-600 hover:to-teal-600 transition"
              type="button"
            >
              <Sparkles size={20} />
              Bắt đầu luyện tập với AI
            </button>
          </div>
        ) : (
          /* === PRACTICE SCREEN === */
          <div ref={scrollRef} className="mt-6 space-y-4">
            {/* Stats bar */}
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <div className="flex items-center gap-3 text-sm font-bold">
                <span className="text-slate-400">Đã làm: {stats.total}</span>
                <span className="text-emerald-600">✓ {stats.correct}</span>
                <span className="text-red-500">✗ {stats.incorrect}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-slate-900">{accuracy}%</span>
                <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all"
                    style={{ width: `${accuracy}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Question card */}
            {loading && !question ? (
              <div className="flex items-center justify-center rounded-3xl border border-slate-200 bg-white p-12">
                <Loader2 size={32} className="animate-spin text-emerald-500" />
                <span className="ml-3 text-sm font-semibold text-slate-400">AI đang tạo câu hỏi...</span>
              </div>
            ) : question ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                  {question.type === "meaning" ? "Nghĩa" : question.type === "pinyin" ? "Pinyin" : "Chữ Hán"}
                </span>
                <h3 className="mt-4 text-xl font-extrabold text-slate-900">{question.question}</h3>

                <div className="mt-6 grid gap-3">
                  {question.options.map((opt) => {
                    const isSelected = selectedAnswer === opt;
                    const isCorrectOpt = opt === question.answer;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => !checked && setSelectedAnswer(opt)}
                        className={`rounded-2xl border px-4 py-4 text-left text-sm font-semibold transition ${
                          checked
                            ? isCorrectOpt
                              ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                              : isSelected
                                ? "border-red-300 bg-red-50 text-red-700"
                                : "border-slate-200 bg-white text-slate-600"
                            : isSelected
                              ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                        disabled={checked}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {checked ? (
                  <div
                    className={`mt-5 rounded-2xl p-4 ${
                      correct ? "bg-emerald-50" : "bg-amber-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold">
                      {correct ? (
                        <CheckCircle2 size={20} className="text-emerald-600" />
                      ) : (
                        <XCircle size={20} className="text-red-500" />
                      )}
                      <span className={correct ? "text-emerald-700" : "text-red-600"}>
                        {correct ? "Chính xác!" : "Chưa đúng"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{feedback}</p>
                    {question.explanation ? (
                      <p className="mt-2 text-sm text-slate-500 italic">{question.explanation}</p>
                    ) : null}
                  </div>
                ) : null}

                <div className="mt-6 grid grid-cols-2 gap-2">
                  {!checked ? (
                    <button
                      onClick={checkAnswer}
                      disabled={!selectedAnswer || loading}
                      className="col-span-2 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 px-5 py-3 font-bold text-white hover:from-emerald-600 hover:to-teal-600 disabled:opacity-40 transition"
                      type="button"
                    >
                      {loading ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <CheckCircle2 size={18} />
                      )}
                      Kiểm tra
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={nextQuestion}
                        className="col-span-2 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 px-5 py-3 font-bold text-white hover:from-emerald-600 hover:to-teal-600 transition"
                        type="button"
                      >
                        <ChevronRight size={18} />
                        Câu tiếp theo
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : null}

            {feedback && !question && !loading ? (
              <div className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-600">
                {feedback}
              </div>
            ) : null}

            {/* Practice again */}
            {stats.total >= 5 ? (
              <button
                onClick={() => {
                  setStarted(false);
                  setQuestion(null);
                  setHistory([]);
                  setStats({ total: 0, correct: 0, incorrect: 0 });
                }}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-600 hover:bg-slate-50 transition"
                type="button"
              >
                <RefreshCw size={18} />
                Làm lại từ đầu (chọn bài khác)
              </button>
            ) : null}
          </div>
        )}
      </main>
    </SiteLayout>
  );
}
