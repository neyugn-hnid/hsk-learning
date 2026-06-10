import {
  CheckCircle2,
  GraduationCap,
  Loader2,
  Mic,
  MicOff,
  RotateCcw,
  Send,
  User,
  Volume2,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router";

type QuizQ = {
  id: string;
  type: string;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
};

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  quiz?: QuizQ;
  quizChecked?: boolean;
  quizCorrect?: boolean;
};

const WELCOME: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "Xin chào! Tôi là trợ lý AI học tiếng Trung.\n\n• Hỏi tôi về từ vựng, ngữ pháp, phát âm...\n• Gõ luyện tập để AI tạo câu hỏi trắc nghiệm.\n• Gõ hội thoại để luyện nói tiếng Trung.\n\nBắt đầu ngay nhé!",
};

export function AIChatWidget() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [quizSel, setQuizSel] = useState<Record<string, string>>({});
  const [quizChecking, setQuizChecking] = useState<Record<string, boolean>>({});
  const [quizActive, setQuizActive] = useState(false);
  const quizActiveRef = useRef(false);
  const [listening, setListening] = useState(false);
  const [convoActive, setConvoActive] = useState(false);
  const convoActiveRef = useRef(false);
  const recognitionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevWordsRef = useRef<string[]>([]);

  const setQuizActiveState = (v: boolean) => {
    setQuizActive(v);
    quizActiveRef.current = v;
  };

  const setConvoActiveState = (v: boolean) => {
    setConvoActive(v);
    convoActiveRef.current = v;
  };

  // Voice input
  const toggleMic = () => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Trình duyệt không hỗ trợ nhập giọng nói.");
      return;
    }
    const rec = new SpeechRecognition();
    rec.lang = "zh-CN";
    rec.interimResults = false;
    rec.continuous = false;
    rec.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setInput((p) => p + transcript);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    rec.start();
    setListening(true);
  };

  useEffect(() => {
    return () => recognitionRef.current?.stop();
  }, []);

  const lessonMatch = location.pathname.match(/^\/lessons\/([^/]+)/);
  const roadmapMatch = location.pathname.match(/^\/roadmap\/([^/]+)/);
  const currentLessonId = lessonMatch ? lessonMatch[1] : null;
  const currentRoadmapId = roadmapMatch ? roadmapMatch[1] : null;

  useEffect(() => {
    if (open) {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open, messages, quizSel, quizChecking]);

  const genQuiz = async () => {
    setLoading(true);
    try {
      const body: Record<string, unknown> = { intent: "practice_generate" };
      if (currentLessonId) body.lessonIds = [currentLessonId];
      if (currentRoadmapId) body.roadmapId = currentRoadmapId;
      if (prevWordsRef.current.length > 0)
        body.previousWords = prevWordsRef.current;
      const r = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = (await r.json()) as { question?: QuizQ; error?: string };
      if (d.question) {
        const word = d.question.answer?.replace(/[()（）].*/g, "").trim();
        if (word && !prevWordsRef.current.includes(word))
          prevWordsRef.current.push(word);
        setMessages((p) => [
          ...p,
          {
            id: `q${Date.now()}`,
            role: "assistant",
            content: d.question!.question,
            quiz: d.question,
          },
        ]);
      } else {
        setMessages((p) => [
          ...p,
          {
            id: `a${Date.now()}`,
            role: "assistant",
            content: d.error || "Không tạo được câu hỏi.",
          },
        ]);
        setQuizActiveState(false);
      }
    } catch {
      setMessages((p) => [
        ...p,
        { id: `a${Date.now()}`, role: "assistant", content: "⚠️ Lỗi kết nối." },
      ]);
      setQuizActiveState(false);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setMessages((p) => [
      ...p,
      { id: `u${Date.now()}`, role: "user", content: text },
    ]);
    setInput("");
    setLoading(true);
    try {
      const isStop = /^(kết thúc|dừng|stop|end|thoát)/i.test(text);
      if (isStop) {
        setQuizActiveState(false);
        setConvoActiveState(false);
        const label = quizActiveRef.current ? "luyện tập" : "hội thoại";
        setMessages((p) => [
          ...p,
          {
            id: `a${Date.now()}`,
            role: "assistant",
            content: `Đã kết thúc ${label}. Gõ luyện tập hoặc hội thoại để bắt đầu!`,
          },
        ]);
        setLoading(false);
        return;
      }

      const isConvo =
        /^(hội thoại|nói chuyện|hoi thoai|conversation|对话|đối thoại)/i.test(
          text,
        );
      if (isConvo) {
        setConvoActiveState(true);
        setQuizActiveState(false);
        const label =
          currentLessonId || currentRoadmapId ? "bài này" : "tiếng Trung";
        setMessages((p) => [
          ...p,
          {
            id: `a${Date.now()}`,
            role: "assistant",
            content: `Bắt đầu hội thoại về ${label}! Hãy nói hoặc gõ tiếng Trung. Gõ kết thúc để dừng.`,
          },
        ]);
        setLoading(false);
        const body: Record<string, unknown> = {
          intent: "chat",
          messages: [
            {
              role: "user",
              content: `Hãy bắt đầu một cuộc hội thoại tiếng Trung về chủ đề: ${label}. Nói 1-2 câu bằng tiếng Trung kèm pinyin.`,
            },
          ],
        };
        if (currentLessonId) body.lessonIds = [currentLessonId];
        if (currentRoadmapId) body.roadmapId = currentRoadmapId;
        setTimeout(async () => {
          setLoading(true);
          try {
            const r = await fetch("/api/ai/chat", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            });
            const d = (await r.json()) as { reply?: string; error?: string };
            setMessages((p) => [
              ...p,
              {
                id: `a${Date.now()}`,
                role: "assistant",
                content: d.reply || d.error || "Lỗi.",
              },
            ]);
          } catch {
            setMessages((p) => [
              ...p,
              { id: `a${Date.now()}`, role: "assistant", content: "⚠️ Lỗi." },
            ]);
          } finally {
            setLoading(false);
          }
        }, 500);
        return;
      }

      const isPractice =
        /^(luyện tập|luyen tap|luyện|practice|quiz|ôn tập|kiem tra|kiểm tra)/i.test(
          text,
        );
      if (isPractice) {
        setQuizActiveState(true);
        prevWordsRef.current = [];
        setMessages((p) => [
          ...p,
          {
            id: `a${Date.now()}`,
            role: "assistant",
            content:
              "Bắt đầu chuỗi luyện tập! Trả lời từng câu, gõ kết thúc để dừng.",
          },
        ]);
        setLoading(false);
        setTimeout(() => genQuiz(), 400);
        return;
      }

      // Normal chat (or quiz answer as text)
      const body: Record<string, unknown> = {
        intent: "chat",
        messages: [{ role: "user", content: text }],
      };
      const r = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = (await r.json()) as { reply?: string; error?: string };
      setMessages((p) => [
        ...p,
        {
          id: `a${Date.now()}`,
          role: "assistant",
          content: d.reply || d.error || "Lỗi.",
        },
      ]);
    } catch {
      setMessages((p) => [
        ...p,
        { id: `a${Date.now()}`, role: "assistant", content: "⚠️ Lỗi kết nối." },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const checkQuiz = async (msgId: string, quiz: QuizQ, answer: string) => {
    setQuizChecking((p) => ({ ...p, [msgId]: true }));
    try {
      const r = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intent: "practice_check",
          userAnswer: answer,
          question: quiz.question,
          correctAnswer: quiz.answer,
        }),
      });
      const d = (await r.json()) as { correct: boolean; feedback: string };
      setMessages((p) =>
        p.map((m) =>
          m.id === msgId
            ? {
                ...m,
                quizChecked: true,
                quizCorrect: d.correct,
                content: `Đáp án: ${quiz.answer} — ${d.feedback || (d.correct ? "Chính xác!" : "Chưa đúng!")}`,
              }
            : m,
        ),
      );
      // Auto-next if quiz session is still active
      setQuizChecking((p) => ({ ...p, [msgId]: false }));
      if (quizActiveRef.current) setTimeout(() => genQuiz(), 600);
    } catch {
      setMessages((p) =>
        p.map((m) =>
          m.id === msgId ? { ...m, quizChecked: true, quizCorrect: false } : m,
        ),
      );
      setQuizChecking((p) => ({ ...p, [msgId]: false }));
      if (quizActiveRef.current) setTimeout(() => genQuiz(), 600);
    }
  };

  const reset = () => {
    setMessages([WELCOME]);
    setQuizSel({});
    setQuizChecking({});
    setQuizActiveState(false);
    setConvoActiveState(false);
    prevWordsRef.current = [];
  };

  const [speaking, setSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const speakText = async (text: string) => {
    if (speaking) {
      audioRef.current?.pause();
      setSpeaking(false);
      return;
    }
    const clean = text
      .replace(/\*\*|__|`|[*_~]/g, "")
      .replace(/[ABCD]\)/g, "")
      .slice(0, 500);
    setSpeaking(true);
    try {
      // Detect if text is mostly Chinese → use zh-CN voice
      const chineseChars = clean.match(/[\u4e00-\u9fff]/g);
      const lang =
        chineseChars && chineseChars.length > clean.length * 0.3
          ? "zh-CN"
          : "vi-VN";
      const r = await fetch("/api/ai/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: clean, lang }),
      });
      const d = (await r.json()) as { audio?: string; error?: string };
      if (d.audio) {
        const audio = new Audio(`data:audio/mp3;base64,${d.audio}`);
        audio.onended = () => setSpeaking(false);
        audio.onerror = () => setSpeaking(false);
        audioRef.current = audio;
        audio.play();
      } else {
        setSpeaking(false);
        // Fallback to browser TTS
        fallbackSpeak(clean, lang);
      }
    } catch {
      setSpeaking(false);
      fallbackSpeak(clean, "vi-VN");
    }
  };

  const fallbackSpeak = (text: string, lang: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = 1;
    const voices = window.speechSynthesis.getVoices();
    const match = voices.find((v) => v.lang.startsWith(lang.split("-")[0]));
    if (match) u.voice = match;
    window.speechSynthesis.speak(u);
  };

  return (
    <>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-20 right-4 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white shadow-xl hover:bg-red-700 transition-all hover:scale-110 md:bottom-6 md:right-6"
          type="button"
          aria-label="Mở trợ lý AI"
        >
          <GraduationCap size={24} />
        </button>
      ) : null}

      {open ? (
        <div
          className="fixed bottom-24 right-4 z-[60] flex w-[calc(100vw-2rem)] max-w-sm flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl md:bottom-24 md:right-6"
          style={{ height: "min(600px, calc(100vh - 8rem))" }}
        >
          <div
            className={`flex items-center justify-between rounded-t-3xl px-4 py-3 text-white ${quizActive ? "bg-red-500" : convoActive ? "bg-blue-500" : "bg-red-500"}`}
          >
            <div className="flex items-center gap-2">
              <GraduationCap size={20} />
              <span className="text-sm font-bold">
                {quizActive
                  ? "Đang luyện tập"
                  : convoActive
                    ? "Đang hội thoại"
                    : "HSK Learning"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={reset}
                className="rounded-full bg-white/20 p-1.5 hover:bg-white/30 transition"
                type="button"
                title="Làm mới"
              >
                <RotateCcw size={14} />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full bg-white/20 p-1.5 hover:bg-white/30 transition"
                type="button"
                title="Đóng"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-3 space-y-3 [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: "none" }}
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                  {msg.role === "user" ? (
                    <User size={14} />
                  ) : (
                    <GraduationCap size={14} />
                  )}
                </div>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap relative group ${msg.role === "user" ? "bg-red-600 text-white" : "bg-slate-50 text-slate-700"}`}
                >
                  {/* Quiz question with interactive buttons */}
                  {msg.quiz && !msg.quizChecked ? (
                    <div className="w-56">
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                        {msg.quiz.type === "pinyin"
                          ? "Pinyin"
                          : msg.quiz.type === "recognition"
                            ? "Chữ Hán"
                            : "Nghĩa"}
                      </span>{" "}
                      -
                      <span className="mt-1.5 text-xs font-extrabold text-slate-900">
                        {msg.quiz.question}
                      </span>
                      <div className="mt-2 grid gap-1">
                        {msg.quiz.options.map((opt) => {
                          const sel = quizSel[msg.id] === opt;
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() =>
                                setQuizSel((p) => ({ ...p, [msg.id]: opt }))
                              }
                              className={`rounded-lg border px-2.5 py-1.5 text-left text-[11px] font-semibold transition truncate ${sel ? "border-red-300 bg-red-50 text-red-700" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                      <button
                        onClick={() => {
                          const ans = quizSel[msg.id];
                          if (ans) checkQuiz(msg.id, msg.quiz!, ans);
                        }}
                        disabled={!quizSel[msg.id] || quizChecking[msg.id]}
                        className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg bg-gradient-to-r from-red-500 to-rose-500 py-2 text-[11px] font-bold text-white disabled:opacity-40 transition"
                      >
                        {quizChecking[msg.id] ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <CheckCircle2 size={12} />
                        )}
                        Kiểm tra
                      </button>
                    </div>
                  ) : msg.quiz && msg.quizChecked ? (
                    <div>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${msg.quizCorrect ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}
                      >
                        {msg.quizCorrect ? (
                          <CheckCircle2 size={10} />
                        ) : (
                          <X size={10} />
                        )}
                        {msg.quizCorrect ? "Chính xác" : "Chưa đúng"}
                      </span>
                      <p className="mt-1 text-[11px] font-medium">
                        {msg.content}
                      </p>
                    </div>
                  ) : typeof msg.content === "string" ? (
                    msg.content.replace(/\*\*/g, "")
                  ) : (
                    msg.content
                  )}
                  {msg.role === "assistant" && msg.id !== "welcome" ? (
                    <button
                      onClick={() => speakText(msg.content)}
                      className={`mt-1 flex items-center gap-1 text-[10px] transition ${speaking ? "text-red-500" : "text-slate-400 hover:text-red-500"}`}
                      type="button"
                      title="Đọc"
                    >
                      <Volume2 size={11} /> {speaking ? "Đang đọc..." : "Nghe"}
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
            {loading ? (
              <div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2 text-xs text-slate-400">
                <Loader2 size={14} className="animate-spin text-red-500" />
                Đang trả lời...
              </div>
            ) : null}
          </div>

          <div>
            {/* Quick reply chips */}
            <div
              className="flex gap-1.5 overflow-x-auto px-3 pb-1 pt-1 [&::-webkit-scrollbar]:hidden"
              style={{ scrollbarWidth: "none" }}
            >
              {[
                "Luyện tập",
                "Hội thoại",
                "Giải thích từ",
                "Cho ví dụ",
                "Ngữ pháp",
              ].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => {
                    setInput(q);
                    inputRef.current?.focus();
                  }}
                  className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition"
                >
                  {q}
                </button>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="flex gap-2 border-t border-slate-100 p-3"
            >
              <button
                type="button"
                onClick={toggleMic}
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition ${listening ? "bg-red-500 text-white animate-pulse" : "bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-500"}`}
                title="Nhập giọng nói"
              >
                {listening ? <MicOff size={14} /> : <Mic size={14} />}
              </button>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  quizActive
                    ? 'Gõ "kết thúc" để dừng luyện tập...'
                    : convoActive
                      ? "Nói hoặc gõ tiếng Trung..."
                      : 'Hỏi từ vựng hoặc gõ "luyện tập"...'
                }
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-base outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-red-500 to-rose-500 text-white disabled:opacity-40 transition"
              >
                {loading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Send size={14} />
                )}
              </button>
            </form>
            <p className="pb-2 text-center text-[10px] text-slate-300">
              Powered by Van Dinh
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
