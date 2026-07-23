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
    "Xin chào! Tôi là trợ lý AI học tiếng Trung.\n\n• Hỏi tôi về từ vựng, ngữ pháp, phát âm...\n• Gõ \"Luyện tập\" để AI tạo câu hỏi trắc nghiệm.\n• Gõ \"Luyện chữ Hán\" để luyện viết chữ Hán (có pinyin).\n• Gõ \"Dịch Hán-Việt\" để dịch câu tiếng Trung sang tiếng Việt.\n• Gõ \"Dịch Việt-Hán\" để viết chữ Hán từ nghĩa tiếng Việt (không pinyin).\n\nBắt đầu ngay nhé!",
};

function startsWithAny(text: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(text));
}

function normalizeCommand(text: string) {
  return text
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[-‐‑‒–—―_/]+/g, " ")
    .replace(/\s+/g, " ");
}

export function AIChatWidget() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [quizSel, setQuizSel] = useState<Record<string, string>>({});
  const [quizChecking, setQuizChecking] = useState<Record<string, boolean>>({});
  const [quizActive, setQuizActive] = useState(false);
  const [listening, setListening] = useState(false);
  const [convoActive, setConvoActive] = useState(false);
  const [translationActive, setTranslationActive] = useState(false);
  const [hanziActive, setHanziActive] = useState(false);
  const [hanVietActive, setHanVietActive] = useState(false);
  const [vietHanActive, setVietHanActive] = useState(false);
  const quizActiveRef = useRef(false);
  const convoActiveRef = useRef(false);
  const translationActiveRef = useRef(false);
  const hanziActiveRef = useRef(false);
  const hanVietActiveRef = useRef(false);
  const vietHanActiveRef = useRef(false);
  const hanziSentenceRef = useRef<{chinese: string; pinyin: string; meaningVi: string} | null>(null);
  const hanVietRef = useRef<{chinese: string; pinyin: string; meaningVi: string} | null>(null);
  const vietHanRef = useRef<{chinese: string; pinyin: string; meaningVi: string} | null>(null);
  const recognitionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevWordsRef = useRef<string[]>([]);
  const prevSentencesRef = useRef<string[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [speaking, setSpeaking] = useState(false);

  const lessonMatch = location.pathname.match(/^\/lessons\/([^/]+)/);
  const roadmapMatch = location.pathname.match(/^\/roadmap\/([^/]+)/);
  const currentLessonId = lessonMatch ? lessonMatch[1] : null;
  const currentRoadmapId = roadmapMatch ? roadmapMatch[1] : null;

  const setQuizActiveState = (value: boolean) => {
    setQuizActive(value);
    quizActiveRef.current = value;
  };

  const setConvoActiveState = (value: boolean) => {
    setConvoActive(value);
    convoActiveRef.current = value;
  };

  const setTranslationActiveState = (value: boolean) => {
    setTranslationActive(value);
    translationActiveRef.current = value;
  };

  const setHanziActiveState = (value: boolean) => {
    setHanziActive(value);
    hanziActiveRef.current = value;
  };

  const setHanVietActiveState = (value: boolean) => {
    setHanVietActive(value);
    hanVietActiveRef.current = value;
  };

  const setVietHanActiveState = (value: boolean) => {
    setVietHanActive(value);
    vietHanActiveRef.current = value;
  };

  const addStudyContext = (body: Record<string, unknown>) => {
    if (currentLessonId) body.lessonIds = [currentLessonId];
    if (currentRoadmapId) body.roadmapId = currentRoadmapId;
    return body;
  };

  const pushAssistant = (content: string) => {
    setMessages((current) => [
      ...current,
      { id: `a${Date.now()}`, role: "assistant", content },
    ]);
  };

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

    const recognition = new SpeechRecognition();
    recognition.lang = "zh-CN";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput((current) => `${current}${transcript}`);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  useEffect(() => {
    return () => recognitionRef.current?.stop();
  }, []);

  useEffect(() => {
    if (!open) return;
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
    setTimeout(() => inputRef.current?.focus(), 250);
  }, [open, messages, quizSel, quizChecking]);

  const generateHanziSentence = async () => {
    setLoading(true);
    try {
      const body = addStudyContext({ intent: "hanzi_sentence" });
      if (prevSentencesRef.current.length > 0) {
        body.previousSentences = prevSentencesRef.current;
      }
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await response.json()) as {
        sentence?: { chinese: string; pinyin: string; meaningVi: string };
        error?: string;
      };

      if (!data.sentence) {
        pushAssistant(data.error || "Không tạo được câu.");
        setHanziActiveState(false);
        return;
      }

      hanziSentenceRef.current = data.sentence;
      const sentChinese = data.sentence.chinese?.trim();
      if (sentChinese && !prevSentencesRef.current.includes(sentChinese)) {
        prevSentencesRef.current.push(sentChinese);
        if (prevSentencesRef.current.length > 30) prevSentencesRef.current.shift();
      }
      pushAssistant(
        `Viết chữ Hán cho câu sau:\n\nPinyin: ${data.sentence.pinyin}\nNghĩa: ${data.sentence.meaningVi}\n\nNhập chữ Hán của bạn vào ô bên dưới.`,
      );
    } catch {
      pushAssistant("Lỗi kết nối.");
      setHanziActiveState(false);
    } finally {
      setLoading(false);
    }
  };

  const generateHanVietSentence = async () => {
    setLoading(true);
    try {
      const body = addStudyContext({ intent: "hanviet_sentence" });
      if (prevSentencesRef.current.length > 0) {
        body.previousSentences = prevSentencesRef.current;
      }
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await response.json()) as {
        sentence?: { chinese: string; pinyin: string; meaningVi: string };
        error?: string;
      };

      if (!data.sentence) {
        pushAssistant(data.error || "Không tạo được câu.");
        setHanVietActiveState(false);
        return;
      }

      hanVietRef.current = data.sentence;
      const sentChinese = data.sentence.chinese?.trim();
      if (sentChinese && !prevSentencesRef.current.includes(sentChinese)) {
        prevSentencesRef.current.push(sentChinese);
        if (prevSentencesRef.current.length > 30) prevSentencesRef.current.shift();
      }
      pushAssistant(
        `Dịch câu sau sang tiếng Việt:\n\n${data.sentence.chinese}\n\nNhập nghĩa tiếng Việt của bạn vào ô bên dưới.`,
      );
    } catch {
      pushAssistant("Lỗi kết nối.");
      setHanVietActiveState(false);
    } finally {
      setLoading(false);
    }
  };

  const generateVietHanSentence = async () => {
    setLoading(true);
    try {
      const body = addStudyContext({ intent: "hanviet_sentence" });
      if (prevSentencesRef.current.length > 0) {
        body.previousSentences = prevSentencesRef.current;
      }
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await response.json()) as {
        sentence?: { chinese: string; pinyin: string; meaningVi: string };
        error?: string;
      };

      if (!data.sentence) {
        pushAssistant(data.error || "Không tạo được câu.");
        setVietHanActiveState(false);
        return;
      }

      vietHanRef.current = data.sentence;
      const sentChinese = data.sentence.chinese?.trim();
      if (sentChinese && !prevSentencesRef.current.includes(sentChinese)) {
        prevSentencesRef.current.push(sentChinese);
        if (prevSentencesRef.current.length > 30) prevSentencesRef.current.shift();
      }
      pushAssistant(
        `Dịch câu sau sang tiếng Trung:\n\n${data.sentence.meaningVi}\n\nNhập chữ Hán của bạn vào ô bên dưới.`,
      );
    } catch {
      pushAssistant("Lỗi kết nối.");
      setVietHanActiveState(false);
    } finally {
      setLoading(false);
    }
  };

  const genQuiz = async () => {
    setLoading(true);
    try {
      const body = addStudyContext({ intent: "practice_generate" });
      if (prevWordsRef.current.length > 0) {
        body.previousWords = prevWordsRef.current;
      }

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await response.json()) as { question?: QuizQ; error?: string };

      if (!data.question) {
        pushAssistant(data.error || "Không tạo được câu hỏi.");
        setQuizActiveState(false);
        return;
      }

      const word = data.question.answer?.replace(/[()（）].*/g, "").trim();
      if (word && !prevWordsRef.current.includes(word)) {
        prevWordsRef.current.push(word);
      }
      setMessages((current) => [
        ...current,
        {
          id: `q${Date.now()}`,
          role: "assistant",
          content: data.question!.question,
          quiz: data.question,
        },
      ]);
    } catch {
      pushAssistant("Lỗi kết nối.");
      setQuizActiveState(false);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setMessages((current) => [
      ...current,
      { id: `u${Date.now()}`, role: "user", content: text },
    ]);
    setInput("");
    setLoading(true);

    try {
      const isStop = startsWithAny(text, [
        /^(kết thúc|ket thuc|dừng|dung|stop|end|thoát|thoat)/i,
      ]);
      if (isStop) {
        let label = "trợ lý";
        if (quizActiveRef.current) label = "luyện tập";
        else if (hanziActiveRef.current) label = "luyện chữ Hán";
        else if (hanVietActiveRef.current) label = "dịch Hán-Việt";
        else if (vietHanActiveRef.current) label = "Dịch Việt-Hán";
        else if (convoActiveRef.current) label = "hội thoại";
        else if (translationActiveRef.current) label = "dịch";
        setQuizActiveState(false);
        setConvoActiveState(false);
        setTranslationActiveState(false);
        setHanziActiveState(false);
        setHanVietActiveState(false);
        setVietHanActiveState(false);
        hanziSentenceRef.current = null;
        hanVietRef.current = null;
        vietHanRef.current = null;
        prevSentencesRef.current = [];
        pushAssistant(`Đã kết thúc ${label}. Gõ luyện tập, luyện chữ Hán, dịch Hán-Việt, dịch Việt-Hán hoặc dịch để bắt đầu!`);
        return;
      }

      const isHanzi = startsWithAny(text, [
        /^(luyện chữ hán|luyen chu han|viết chữ|viet chu|hanzi writing|chữ hán|chu han)/i,
      ]);
      if (isHanzi) {
        setHanziActiveState(true);
        setQuizActiveState(false);
        setConvoActiveState(false);
        setTranslationActiveState(false);
        setHanVietActiveState(false);
        setVietHanActiveState(false);
        hanziSentenceRef.current = null;
        prevSentencesRef.current = [];
        pushAssistant(
          "Bắt đầu luyện viết chữ Hán! Tôi sẽ đưa câu, bạn gõ chữ Hán tương ứng. Gõ kết thúc để dừng.",
        );
        setLoading(false);
        setTimeout(() => generateHanziSentence(), 350);
        return;
      }

      const textKey = normalizeCommand(text);

      const isVietHan =
        textKey.startsWith("dich viet han") ||
        textKey.startsWith("viet han") ||
        textKey.startsWith("viet sang han") ||
        textKey.startsWith("tieng viet sang tieng trung") ||
        textKey.startsWith("viet trung");
      if (isVietHan) {
        setVietHanActiveState(true);
        setQuizActiveState(false);
        setConvoActiveState(false);
        setTranslationActiveState(false);
        setHanziActiveState(false);
        setHanVietActiveState(false);
        hanziSentenceRef.current = null;
        hanVietRef.current = null;
        vietHanRef.current = null;
        prevSentencesRef.current = [];
        pushAssistant(
          "Dịch Việt-Hán: Tôi sẽ đưa câu tiếng Việt, bạn dịch sang tiếng Trung. Gõ kết thúc để dừng.",
        );
        setLoading(false);
        setTimeout(() => generateVietHanSentence(), 350);
        return;
      }

      const isHanViet =
        textKey.startsWith("dich han viet") ||
        textKey.startsWith("han viet") ||
        textKey.startsWith("han sang viet") ||
        textKey.startsWith("tieng trung sang tieng viet") ||
        textKey.startsWith("trung viet") ||
        textKey.startsWith("dich han") ||
        textKey.startsWith("luyen dich");
      if (isHanViet) {
        setHanVietActiveState(true);
        setQuizActiveState(false);
        setConvoActiveState(false);
        setTranslationActiveState(false);
        setHanziActiveState(false);
        setVietHanActiveState(false);
        hanziSentenceRef.current = null;
        hanVietRef.current = null;
        vietHanRef.current = null;
        prevSentencesRef.current = [];
        pushAssistant(
          "Luyện dịch Hán-Việt: Tôi sẽ đưa câu tiếng Trung, bạn dịch sang tiếng Việt. Gõ kết thúc để dừng.",
        );
        setLoading(false);
        setTimeout(() => generateHanVietSentence(), 350);
        return;
      }

      const isTranslate = startsWithAny(text, [
        /^(dịch|dich|translate|phiên dịch|phien dich)/i,
      ]);
      if (isTranslate) {
        setTranslationActiveState(true);
        setQuizActiveState(false);
        setConvoActiveState(false);
        setHanziActiveState(false);
        setHanVietActiveState(false);
        setVietHanActiveState(false);
        hanziSentenceRef.current = null;
        hanVietRef.current = null;
        vietHanRef.current = null;
        pushAssistant(
          "Chế độ dịch: Nhập tiếng Việt, tôi sẽ phân tích sang tiếng Trung (chữ Hán, pinyin, nghĩa, ví dụ). Gõ kết thúc để thoát.",
        );
        return;
      }

      const isPractice = startsWithAny(text, [
        /^(luyện tập|luyen tap|luyện|luyen|practice|quiz|ôn tập|on tap|kiểm tra|kiem tra)/i,
      ]);
      if (isPractice) {
        setQuizActiveState(true);
        setConvoActiveState(false);
        setTranslationActiveState(false);
        setHanziActiveState(false);
        setHanVietActiveState(false);
        setVietHanActiveState(false);
        hanziSentenceRef.current = null;
        hanVietRef.current = null;
        vietHanRef.current = null;
        prevWordsRef.current = [];
        pushAssistant(
          "Bắt đầu chuỗi luyện tập! Trả lời từng câu, gõ kết thúc để dừng.",
        );
        setLoading(false);
        setTimeout(() => genQuiz(), 350);
        return;
      }

      // Hanzi mode: check user's Chinese writing
      if (hanziActiveRef.current && hanziSentenceRef.current) {
        const body = addStudyContext({
          intent: "hanzi_check",
          userAnswer: text,
          sentence: hanziSentenceRef.current,
        });
        const response = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = (await response.json()) as { correct: boolean; feedback: string };
        pushAssistant(
          data.feedback ||
            (data.correct
              ? "Chính xác! 🎉"
              : `Chưa đúng. Đáp án: ${hanziSentenceRef.current.chinese}`),
        );
        if (hanziActiveRef.current) {
          setTimeout(() => generateHanziSentence(), 1000);
        }
        return;
      }

      // HanViet mode: check user's Vietnamese translation
      if (hanVietActiveRef.current && hanVietRef.current) {
        const body = addStudyContext({
          intent: "hanviet_check",
          userAnswer: text,
          sentence: hanVietRef.current,
        });
        const response = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = (await response.json()) as { correct: boolean; feedback: string };
        pushAssistant(
          data.feedback ||
            (data.correct
              ? "Chính xác! 🎉"
              : `Chưa đúng. Nghĩa: ${hanVietRef.current.meaningVi}`),
        );
        if (hanVietActiveRef.current) {
          setTimeout(() => generateHanVietSentence(), 1000);
        }
        return;
      }

      // VietHan mode: check user's Chinese translation from Vietnamese
      if (vietHanActiveRef.current && vietHanRef.current) {
        const body = addStudyContext({
          intent: "viethan_check",
          userAnswer: text,
          sentence: vietHanRef.current,
        });
        const response = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = (await response.json()) as { correct: boolean; feedback: string };
        pushAssistant(
          data.feedback ||
            (data.correct
              ? "Chính xác! 🎉"
              : `Chưa đúng. Đáp án: ${vietHanRef.current.chinese} (${vietHanRef.current.pinyin})`),
        );
        if (vietHanActiveRef.current) {
          setTimeout(() => generateVietHanSentence(), 1000);
        }
        return;
      }

      const body = addStudyContext({
        intent: "chat",
        mode: translationActiveRef.current ? "translate" : convoActiveRef.current ? "conversation" : "chat",
        messages: [{ role: "user", content: text }],
      });
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await response.json()) as { reply?: string; error?: string };
      pushAssistant(data.reply || data.error || "Lỗi.");
    } catch {
      pushAssistant("Lỗi kết nối.");
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const checkQuiz = async (msgId: string, quiz: QuizQ, answer: string) => {
    setQuizChecking((current) => ({ ...current, [msgId]: true }));
    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intent: "practice_check",
          userAnswer: answer,
          question: quiz.question,
          correctAnswer: quiz.answer,
        }),
      });
      const data = (await response.json()) as { correct: boolean; feedback: string };
      setMessages((current) =>
        current.map((message) =>
          message.id === msgId
            ? {
                ...message,
                quizChecked: true,
                quizCorrect: data.correct,
                content: `Đáp án: ${quiz.answer} - ${
                  data.feedback || (data.correct ? "Chính xác!" : "Chưa đúng!")
                }`,
              }
            : message,
        ),
      );
    } catch {
      setMessages((current) =>
        current.map((message) =>
          message.id === msgId
            ? { ...message, quizChecked: true, quizCorrect: false }
            : message,
        ),
      );
    } finally {
      setQuizChecking((current) => ({ ...current, [msgId]: false }));
      if (quizActiveRef.current) setTimeout(() => genQuiz(), 600);
    }
  };

  const reset = () => {
    setMessages([WELCOME]);
    setQuizSel({});
    setQuizChecking({});
    setQuizActiveState(false);
    setConvoActiveState(false);
    setTranslationActiveState(false);
    setHanziActiveState(false);
    setHanVietActiveState(false);
    setVietHanActiveState(false);
    hanziSentenceRef.current = null;
    hanVietRef.current = null;
    vietHanRef.current = null;
    prevWordsRef.current = [];
  };

  const fallbackSpeak = (text: string, lang: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 1;
    const voice = window.speechSynthesis
      .getVoices()
      .find((item) => item.lang.startsWith(lang.split("-")[0]));
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  };

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
    const chineseChars = clean.match(/[\u4e00-\u9fff]/g);
    const lang = chineseChars && chineseChars.length > clean.length * 0.3 ? "zh-CN" : "vi-VN";

    setSpeaking(true);
    try {
      const response = await fetch("/api/ai/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: clean, lang }),
      });
      const data = (await response.json()) as { audio?: string };
      if (!data.audio) {
        fallbackSpeak(clean, lang);
        setSpeaking(false);
        return;
      }

      const audio = new Audio(`data:audio/mp3;base64,${data.audio}`);
      audio.onended = () => setSpeaking(false);
      audio.onerror = () => setSpeaking(false);
      audioRef.current = audio;
      await audio.play();
    } catch {
      fallbackSpeak(clean, lang);
      setSpeaking(false);
    }
  };

  return (
    <>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-28 right-4 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white shadow-xl transition-all hover:scale-110 hover:bg-red-700 md:bottom-10 md:right-6"
          type="button"
          aria-label="Mở trợ lý AI"
        >
          <GraduationCap size={24} />
        </button>
      ) : null}

      {open ? (
        <div
          className="fixed bottom-32 right-4 z-[60] flex w-[calc(100vw-2rem)] max-w-sm flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl md:bottom-14 md:right-6"
          style={{ height: "min(600px, calc(100vh - 8rem))" }}
        >
          <div
            className={`flex items-center justify-between rounded-t-3xl px-4 py-3 text-white ${
              translationActive ? "bg-emerald-500" : hanziActive ? "bg-purple-600" : hanVietActive ? "bg-amber-500" : vietHanActive ? "bg-teal-600" : convoActive ? "bg-blue-500" : "bg-red-500"
            }`}
          >
            <div className="flex items-center gap-2">
              <GraduationCap size={20} />
              <span className="text-sm font-bold">
                {quizActive ? "Đang luyện tập" : hanziActive ? "Luyện chữ Hán" : hanVietActive ? "Dịch Hán-Việt" : vietHanActive ? "Dịch Việt-Hán" : convoActive ? "Đang hội thoại" : translationActive ? "Chế độ dịch" : "HSK Learning"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={reset}
                className="rounded-full bg-white/20 p-1.5 transition hover:bg-white/30"
                type="button"
                title="Làm mới"
              >
                <RotateCcw size={14} />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full bg-white/20 p-1.5 transition hover:bg-white/30"
                type="button"
                title="Đóng"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div
            ref={scrollRef}
            className="flex-1 space-y-3 overflow-y-auto p-3 [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: "none" }}
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2 ${message.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                  {message.role === "user" ? <User size={14} /> : <GraduationCap size={14} />}
                </div>
                <div
                  className={`group relative max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                    message.role === "user"
                      ? "bg-red-600 text-white"
                      : "bg-slate-50 text-slate-700"
                  }`}
                >
                  {message.quiz && !message.quizChecked ? (
                    <div className="w-56">
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                        {message.quiz.type === "pinyin"
                          ? "Pinyin"
                          : message.quiz.type === "recognition"
                            ? "Chữ Hán"
                            : "Nghĩa"}
                      </span>
                      <span className="mt-1.5 block text-xs font-extrabold text-slate-900">
                        {message.quiz.question}
                      </span>
                      <div className="mt-2 grid gap-1">
                        {message.quiz.options.map((option) => {
                          const selected = quizSel[message.id] === option;
                          return (
                            <button
                              key={option}
                              type="button"
                              onClick={() =>
                                setQuizSel((current) => ({ ...current, [message.id]: option }))
                              }
                              className={`truncate rounded-lg border px-2.5 py-1.5 text-left text-[11px] font-semibold transition ${
                                selected
                                  ? "border-red-300 bg-red-50 text-red-700"
                                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              {option}
                            </button>
                          );
                        })}
                      </div>
                      <button
                        onClick={() => {
                          const answer = quizSel[message.id];
                          if (answer) checkQuiz(message.id, message.quiz!, answer);
                        }}
                        disabled={!quizSel[message.id] || quizChecking[message.id]}
                        className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg bg-gradient-to-r from-red-500 to-rose-500 py-2 text-[11px] font-bold text-white transition disabled:opacity-40"
                      >
                        {quizChecking[message.id] ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <CheckCircle2 size={12} />
                        )}
                        Kiểm tra
                      </button>
                    </div>
                  ) : message.quiz && message.quizChecked ? (
                    <div>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          message.quizCorrect
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {message.quizCorrect ? <CheckCircle2 size={10} /> : <X size={10} />}
                        {message.quizCorrect ? "Chính xác" : "Chưa đúng"}
                      </span>
                      <p className="mt-1 text-[11px] font-medium">{message.content}</p>
                    </div>
                  ) : (
                    message.content.replace(/\*\*/g, "")
                  )}
                  {message.role === "assistant" && message.id !== "welcome" ? (
                    <button
                      onClick={() => speakText(message.content)}
                      className={`mt-1 flex items-center gap-1 text-[10px] transition ${
                        speaking ? "text-red-500" : "text-slate-400 hover:text-red-500"
                      }`}
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
            <div
              className="flex gap-1.5 overflow-x-auto px-3 pb-1 pt-1 [&::-webkit-scrollbar]:hidden"
              style={{ scrollbarWidth: "none" }}
            >
              {["Dịch Hán-Việt", "Dịch Việt-Hán", "Luyện chữ Hán", "Luyện tập", "Dịch", "Ngữ pháp"].map(
                (quickReply) => (
                  <button
                    key={quickReply}
                    type="button"
                    onClick={() => {
                      setInput(quickReply);
                      inputRef.current?.focus();
                    }}
                    className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                  >
                    {quickReply}
                  </button>
                ),
              )}
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                sendMessage();
              }}
              className="flex gap-2 border-t border-slate-100 p-3"
            >
              <button
                type="button"
                onClick={toggleMic}
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition ${
                  listening
                    ? "animate-pulse bg-red-500 text-white"
                    : "bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-500"
                }`}
                title="Nhập giọng nói"
              >
                {listening ? <MicOff size={14} /> : <Mic size={14} />}
              </button>
              <input
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={
                  quizActive
                    ? 'Gõ "kết thúc" để dừng luyện tập...'
                    : hanziActive
                      ? "Nhập chữ Hán..."
                      : hanVietActive
                        ? "Nhập nghĩa tiếng Việt..."
                      : vietHanActive
                        ? "Nhập chữ Hán..."
                        : convoActive
                          ? "Nói hoặc gõ tiếng Trung..."
                          : translationActive
                            ? "Nhập tiếng Việt để dịch sang tiếng Trung..."
                            : 'Hỏi từ vựng, gõ "luyện tập", "luyện chữ Hán" hoặc "dịch Hán-Việt"...'
                }
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-base outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-red-500 to-rose-500 text-white transition disabled:opacity-40"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              </button>
            </form>
            <p className="pb-2 text-center text-[10px] text-slate-300">Powered by Van Dinh</p>
          </div>
        </div>
      ) : null}
    </>
  );
}
