import type { Route } from "./+types/ai-assistant";
import { useEffect, useRef, useState } from "react";
import {
  Bot,
  Brain,
  CheckCircle2,
  ChevronRight,
  Loader2,
  MessageCircle,
  RefreshCw,
  Send,
  User,
  Sparkles,
  Trash2,
  XCircle,
} from "lucide-react";
import { SiteLayout } from "~/components/Layout";
import { getUser } from "~/lib/auth.server";

export async function loader({ request }: Route.LoaderArgs) {
  return { user: await getUser(request) };
}

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type AIQuestion = {
  id: string;
  type: string;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
};

type PracticeStats = {
  total: number;
  correct: number;
  incorrect: number;
};

type Mode = "chat" | "practice";

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "Xin chào! 👋 Tôi là trợ lý AI học tiếng Trung.\n\n💬 **Chat**: Hỏi về từ vựng, ngữ pháp, phát âm...\n🧠 **Luyện tập**: AI tạo câu hỏi trắc nghiệm từ dữ liệu HSK.\n\nNhấn nút **🧠 Luyện tập** ở góc phải để bắt đầu!",
};

export default function AIAssistant({ loaderData }: Route.ComponentProps) {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<Mode>("chat");
  const [question, setQuestion] = useState<AIQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [checkFeedback, setCheckFeedback] = useState("");
  const [practicing, setPracticing] = useState(false);
  const [stats, setStats] = useState<PracticeStats>({ total: 0, correct: 0, incorrect: 0 });
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, question, checked]);

  // === CHAT ===
  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const allMsgs = [...messages, userMsg]
        .filter((m) => m.id !== "welcome")
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intent: "chat", messages: allMsgs }),
      });

      const data = (await res.json()) as { reply?: string; error?: string };
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.reply || data.error || "Xin lỗi, có lỗi xảy ra.",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "assistant", content: "⚠️ Không thể kết nối đến AI." },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const clearChat = () => {
    setMessages([WELCOME_MESSAGE]);
    setMode("chat");
    setQuestion(null);
    setSelectedAnswer("");
    setChecked(false);
    setPracticing(false);
    setStats({ total: 0, correct: 0, incorrect: 0 });
  };

  // === PRACTICE ===
  const startPractice = () => {
    setMode("practice");
    setPracticing(true);
    setQuestion(null);
    setSelectedAnswer("");
    setChecked(false);
    setStats({ total: 0, correct: 0, incorrect: 0 });
    setMessages((prev) => [
      ...prev.filter((m) => m.id === "welcome" || m.id.startsWith("practice-")),
      { id: "practice-start", role: "assistant", content: "🧠 **Bắt đầu luyện tập!** AI sẽ tạo câu hỏi từ dữ liệu HSK. Trả lời để kiểm tra kiến thức nhé!" },
    ]);
    setTimeout(() => generateQuestion(), 300);
  };

  const generateQuestion = async () => {
    setLoading(true);
    setQuestion(null);
    setSelectedAnswer("");
    setChecked(false);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intent: "practice_generate" }),
      });
      const data = (await res.json()) as { question?: AIQuestion; error?: string };
      if (data.question) {
        setQuestion(data.question);
      } else {
        setMessages((prev) => [
          ...prev,
          { id: `err-${Date.now()}`, role: "assistant", content: `⚠️ ${data.error || "Có lỗi."}` },
        ]);
        setPracticing(false);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: `err-${Date.now()}`, role: "assistant", content: "⚠️ Không thể kết nối AI." },
      ]);
      setPracticing(false);
    } finally {
      setLoading(false);
    }
  };

  const checkAnswer = async () => {
    if (!selectedAnswer || !question) return;
    setChecked(true);
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intent: "practice_check",
          userAnswer: selectedAnswer,
          question: question.question,
          correctAnswer: question.answer,
        }),
      });
      const data = (await res.json()) as { correct: boolean; feedback: string };
      setIsCorrect(data.correct);
      setCheckFeedback(data.feedback);
      setStats((prev) => ({
        total: prev.total + 1,
        correct: prev.correct + (data.correct ? 1 : 0),
        incorrect: prev.incorrect + (data.correct ? 0 : 1),
      }));
    } catch {
      setCheckFeedback("");
    } finally {
      setLoading(false);
    }
  };

  const nextQuestion = () => {
    setQuestion(null);
    setSelectedAnswer("");
    setChecked(false);
    generateQuestion();
  };

  const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;

  return (
    <SiteLayout user={loaderData.user}>
      <main className="mx-auto flex max-w-3xl flex-col px-4 py-6 md:py-10" style={{ height: "calc(100vh - 5rem)" }}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-full text-white shadow-sm transition ${
                mode === "practice"
                  ? "bg-gradient-to-br from-emerald-500 to-teal-500"
                  : "bg-gradient-to-br from-purple-500 to-pink-500"
              }`}
            >
              {mode === "practice" ? <Brain size={22} /> : <Sparkles size={22} />}
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">
                {mode === "practice" ? "Luyện tập AI" : "Trợ lý AI"}
              </h1>
              <p className="text-xs text-slate-500">
                {mode === "practice" ? "Trả lời câu hỏi trắc nghiệm" : "Hỏi đáp tiếng Trung thông minh"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Mode toggle */}
            <button
              onClick={mode === "practice" ? () => { setMode("chat"); setQuestion(null); setPracticing(false); } : startPractice}
              className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition border ${
                mode === "practice"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-white text-slate-500 border-slate-200 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200"
              }`}
              type="button"
            >
              {mode === "practice" ? <MessageCircle size={16} /> : <Brain size={16} />}
              {mode === "practice" ? "Chat" : "Luyện tập"}
            </button>
            {messages.length > 1 || mode === "practice" ? (
              <button
                onClick={clearChat}
                className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition"
                type="button"
              >
                <Trash2 size={16} />
              </button>
            ) : null}
          </div>
        </div>

        {/* Practice stats bar */}
        {mode === "practice" && practicing ? (
          <div className="mt-3 flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50/50 px-4 py-2">
            <div className="flex items-center gap-3 text-xs font-bold">
              <span className="text-slate-500">Đã làm: {stats.total}</span>
              <span className="text-emerald-600">✓ {stats.correct}</span>
              <span className="text-red-500">✗ {stats.incorrect}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-slate-900">{accuracy}%</span>
              <div className="h-2 w-16 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all"
                  style={{ width: `${accuracy}%` }}
                />
              </div>
            </div>
          </div>
        ) : null}

        {/* Messages area */}
        <div
          ref={scrollRef}
          className="mt-3 flex-1 overflow-y-auto rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="space-y-4">
            {/* Chat messages */}
            {messages
              .filter((m) => m.id === "welcome" || mode === "chat" || m.id.startsWith("practice-"))
              .map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      msg.role === "user"
                        ? "bg-red-100 text-red-600"
                        : mode === "practice"
                          ? "bg-emerald-100 text-emerald-600"
                          : "bg-gradient-to-br from-purple-100 to-pink-100 text-purple-600"
                    }`}
                  >
                    {msg.role === "user" ? <User size={16} /> : mode === "practice" ? <Brain size={16} /> : <Bot size={16} />}
                  </div>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-red-600 text-white"
                        : mode === "practice"
                          ? "bg-emerald-50 text-slate-700"
                          : "bg-slate-50 text-slate-700"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}

            {/* Practice question card */}
            {mode === "practice" && question ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/30 p-4">
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                  {question.type === "meaning" ? "Nghĩa" : question.type === "pinyin" ? "Pinyin" : "Chữ Hán"}
                </span>
                <h3 className="mt-3 text-lg font-extrabold text-slate-900">{question.question}</h3>

                <div className="mt-4 grid gap-2">
                  {question.options.map((opt) => {
                    const sel = selectedAnswer === opt;
                    const correctOpt = opt === question.answer;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => !checked && setSelectedAnswer(opt)}
                        disabled={checked}
                        className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                          checked
                            ? correctOpt
                              ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                              : sel
                                ? "border-red-300 bg-red-50 text-red-700"
                                : "border-slate-200 bg-white text-slate-500"
                            : sel
                              ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {/* Feedback */}
                {checked ? (
                  <div className={`mt-4 rounded-2xl p-4 ${isCorrect ? "bg-emerald-50" : "bg-amber-50"}`}>
                    <div className="flex items-center gap-2 font-bold">
                      {isCorrect ? (
                        <CheckCircle2 size={18} className="text-emerald-600" />
                      ) : (
                        <XCircle size={18} className="text-red-500" />
                      )}
                      <span className={isCorrect ? "text-emerald-700" : "text-red-600"}>
                        {isCorrect ? "Chính xác!" : "Chưa đúng"}
                      </span>
                    </div>
                    {checkFeedback ? (
                      <p className="mt-1 text-sm text-slate-600">{checkFeedback}</p>
                    ) : null}
                    {!isCorrect && question.explanation ? (
                      <p className="mt-1 text-xs text-slate-500 italic">{question.explanation}</p>
                    ) : null}
                  </div>
                ) : null}

                {/* Action buttons */}
                <div className="mt-4">
                  {!checked ? (
                    <button
                      onClick={checkAnswer}
                      disabled={!selectedAnswer || loading}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 px-5 py-3 font-bold text-white hover:from-emerald-600 hover:to-teal-600 disabled:opacity-40 transition"
                      type="button"
                    >
                      {loading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                      Kiểm tra
                    </button>
                  ) : (
                    <button
                      onClick={nextQuestion}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 px-5 py-3 font-bold text-white hover:from-emerald-600 hover:to-teal-600 transition"
                      type="button"
                    >
                      <ChevronRight size={18} />
                      Câu tiếp theo
                    </button>
                  )}
                </div>
              </div>
            ) : null}

            {/* Practice loading */}
            {mode === "practice" && loading && !question ? (
              <div className="flex items-center gap-3 rounded-2xl bg-emerald-50/50 px-4 py-3">
                <Loader2 size={18} className="animate-spin text-emerald-500" />
                <span className="text-sm font-semibold text-slate-400">AI đang tạo câu hỏi...</span>
              </div>
            ) : null}

            {/* Chat loading */}
            {mode === "chat" && loading ? (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-100 to-pink-100 text-purple-600">
                  <Bot size={16} />
                </div>
                <div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3">
                  <Loader2 size={16} className="animate-spin text-purple-500" />
                  <span className="text-sm text-slate-400">Đang trả lời...</span>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Quick suggestions (chat mode only) */}
        {mode === "chat" && messages.length <= 1 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              "Từ 你好 nghĩa là gì?",
              "Giải thích ngữ pháp 把",
              "Cách phân biệt 的 地 得",
              "Luyện HSK 3 cần học gì?",
            ].map((q) => (
              <button
                key={q}
                onClick={() => { setInput(q); inputRef.current?.focus(); }}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200 transition"
                type="button"
              >
                {q}
              </button>
            ))}
          </div>
        ) : null}

        {/* Practice controls */}
        {mode === "practice" && stats.total >= 5 && !question ? (
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => {
                setMode("chat");
                setQuestion(null);
                setPracticing(false);
                setStats({ total: 0, correct: 0, incorrect: 0 });
              }}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-50 transition"
              type="button"
            >
              <RefreshCw size={16} />
              Làm lại
            </button>
          </div>
        ) : null}

        {/* Input */}
        {mode === "chat" ? (
          <form
            onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
            className="mt-3 flex gap-2"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Hỏi về từ vựng, ngữ pháp, phát âm..."
              className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-purple-400 focus:ring-4 focus:ring-purple-100"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-sm hover:from-purple-600 hover:to-pink-600 disabled:opacity-40 transition"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </form>
        ) : null}
      </main>
    </SiteLayout>
  );
}
