import type { LoaderFunctionArgs } from "react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Compass,
  Crown,
  FileCheck,
  FileText,
  Flame,
  Flag,
  GraduationCap,
  Headphones,
  HelpCircle,
  History,
  Info,
  Layers,
  Lightbulb,
  Lock,
  Play,
  RotateCcw,
  Sparkles,
  Star,
  Timer,
  Trophy,
  Volume2,
  VolumeX,
  X,
  XCircle,
  Zap,
  Radio,
  Sliders,
  ShieldCheck,
  QrCode,
  Printer,
  ExternalLink,
} from "lucide-react";
import { getUser } from "~/lib/auth.server";
import { prisma } from "~/lib/db.server";
import { SiteLayout } from "~/components/Layout";
import { sound } from "~/lib/sound";
import { addExpAndGems } from "~/lib/gamification";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  const lessons = await prisma.lesson.findMany({
    take: 10,
    include: { vocabularies: true },
  });

  return {
    user,
    lessons,
  };
}

type ExamSection = "listening" | "reading" | "writing";

interface ExamQuestion {
  id: number;
  section: ExamSection;
  sectionTitle: string;
  part: number; // Part 1, 2, 3, 4
  typeText: string;
  instruction: string;
  audioText?: string;
  chinesePrompt?: string;
  pinyinPrompt?: string;
  vietnamesePrompt?: string;
  readingPassage?: string;
  tokensToOrder?: string[];
  correctOrder?: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

interface ExamPreset {
  id: string;
  level: string;
  levelChinese: string;
  title: string;
  subtitle: string;
  durationMinutes: number;
  totalQuestions: number;
  maxScore: number;
  passingScore: number;
  vocabRequirement: string;
  hasPinyin: boolean;
  sections: {
    listening: { count: number; time: string; maxScore: number };
    reading: { count: number; time: string; maxScore: number };
    writing?: { count: number; time: string; maxScore: number };
  };
}

const EXAM_PRESETS: ExamPreset[] = [
  {
    id: "hsk1",
    level: "HSK 1",
    levelChinese: "HSK 一级",
    title: "HSK 一级机考模拟试卷 (HSK 1 Official Mock)",
    subtitle: "Cấp độ 1 · 150 từ vựng · Có Pinyin",
    durationMinutes: 35,
    totalQuestions: 40,
    maxScore: 200,
    passingScore: 120,
    vocabRequirement: "150 từ vựng cơ bản",
    hasPinyin: true,
    sections: {
      listening: { count: 20, time: "15 phút", maxScore: 100 },
      reading: { count: 20, time: "17 phút", maxScore: 100 },
    },
  },
  {
    id: "hsk2",
    level: "HSK 2",
    levelChinese: "HSK 二级",
    title: "HSK 二级机考模拟试卷 (HSK 2 Official Mock)",
    subtitle: "Cấp độ 2 · 300 từ vựng · Có Pinyin",
    durationMinutes: 50,
    totalQuestions: 60,
    maxScore: 200,
    passingScore: 120,
    vocabRequirement: "300 từ vựng",
    hasPinyin: true,
    sections: {
      listening: { count: 35, time: "25 phút", maxScore: 100 },
      reading: { count: 25, time: "22 phút", maxScore: 100 },
    },
  },
  {
    id: "hsk3",
    level: "HSK 3",
    levelChinese: "HSK 三级",
    title: "HSK 三级机考模拟试卷 (HSK 3 Official Mock)",
    subtitle: "Cấp độ 3 · 600 từ vựng · Không Pinyin · Có phần Viết",
    durationMinutes: 85,
    totalQuestions: 80,
    maxScore: 300,
    passingScore: 180,
    vocabRequirement: "600 từ vựng",
    hasPinyin: false,
    sections: {
      listening: { count: 40, time: "35 phút", maxScore: 100 },
      reading: { count: 30, time: "30 phút", maxScore: 100 },
      writing: { count: 10, time: "15 phút", maxScore: 100 },
    },
  },
  {
    id: "hsk4",
    level: "HSK 4",
    levelChinese: "HSK 四级",
    title: "HSK 四级机考模拟试卷 (HSK 4 Official Mock)",
    subtitle: "Cấp độ 4 · 1.200 từ vựng · Nghe 1 lần duy nhất",
    durationMinutes: 100,
    totalQuestions: 100,
    maxScore: 300,
    passingScore: 180,
    vocabRequirement: "1.200 từ vựng",
    hasPinyin: false,
    sections: {
      listening: { count: 45, time: "30 phút", maxScore: 100 },
      reading: { count: 40, time: "40 phút", maxScore: 100 },
      writing: { count: 15, time: "25 phút", maxScore: 100 },
    },
  },
  {
    id: "hsk5",
    level: "HSK 5",
    levelChinese: "HSK 五级",
    title: "HSK 五级机考模拟试卷 (HSK 5 Official Mock)",
    subtitle: "Cấp độ 5 · 2.500 từ vựng · Viết luận ngắn",
    durationMinutes: 120,
    totalQuestions: 100,
    maxScore: 300,
    passingScore: 180,
    vocabRequirement: "2.500 từ vựng",
    hasPinyin: false,
    sections: {
      listening: { count: 45, time: "30 phút", maxScore: 100 },
      reading: { count: 45, time: "45 phút", maxScore: 100 },
      writing: { count: 10, time: "40 phút", maxScore: 100 },
    },
  },
  {
    id: "hsk6",
    level: "HSK 6",
    levelChinese: "HSK 六级",
    title: "HSK 六级机考模拟试卷 (HSK 6 Official Mock)",
    subtitle: "Cấp độ 6 · 5.000+ từ vựng · Tóm tắt văn bản",
    durationMinutes: 135,
    totalQuestions: 101,
    maxScore: 300,
    passingScore: 180,
    vocabRequirement: "5.000+ từ vựng",
    hasPinyin: false,
    sections: {
      listening: { count: 50, time: "35 phút", maxScore: 100 },
      reading: { count: 50, time: "50 phút", maxScore: 100 },
      writing: { count: 1, time: "45 phút", maxScore: 100 },
    },
  },
];

function generateMockExamQuestions(levelId: string): ExamQuestion[] {
  const isHSK1 = levelId === "hsk1";
  const isHSK2 = levelId === "hsk2";
  const hasWriting = !isHSK1 && !isHSK2;

  const listeningCount = isHSK1 ? 20 : isHSK2 ? 35 : 40;
  const readingCount = isHSK1 ? 20 : isHSK2 ? 25 : 30;
  const writingCount = hasWriting ? 10 : 0;

  const questions: ExamQuestion[] = [];

  // 1. GENERATE LISTENING QUESTIONS
  for (let i = 1; i <= listeningCount; i++) {
    const isTrueFalse = i <= listeningCount / 2;
    if (isTrueFalse) {
      const sampleAudio = [
        { zh: "很高兴认识你。", py: "Hěn gāoxìng rènshi nǐ.", vi: "Rất vui được gặp bạn.", ok: true },
        { zh: "他在喝中国茶。", py: "Tā zài hē Zhōngguó chá.", vi: "Anh ấy đang uống trà Trung Quốc.", ok: true },
        { zh: "我们在学校学习汉语。", py: "Wǒmen zài xuéxiào xuéxí Hànyǔ.", vi: "Chúng tôi học tiếng Hán ở trường.", ok: false },
        { zh: "明天下午三点见。", py: "Míngtiān xiàwǔ sān diǎn jiàn.", vi: "Hẹn gặp vào 3 giờ chiều mai.", ok: true },
        { zh: "桌子上有一本书和一个苹果。", py: "Zhuōzi shang yǒu yì běn shū hé yí gè píngguǒ.", vi: "Trên bàn có 1 quyển sách và 1 quả táo.", ok: false },
      ][(i - 1) % 5];

      questions.push({
        id: i,
        section: "listening",
        sectionTitle: "第一部分：听力 (Listening)",
        part: 1,
        typeText: "第 1 部分：听短句，判断对错",
        instruction: "第一部分：听短句，判断与给出的内容是否一致 (Nghe câu và chọn Đúng √ hoặc Sai ×)",
        audioText: sampleAudio.zh,
        chinesePrompt: sampleAudio.zh,
        pinyinPrompt: isHSK1 || isHSK2 ? sampleAudio.py : undefined,
        vietnamesePrompt: sampleAudio.vi,
        options: ["√ 对 (Đúng)", "× 错 (Sai)"],
        correctAnswer: sampleAudio.ok ? "√ 对 (Đúng)" : "× 错 (Sai)",
        explanation: `Nội dung ghi âm: "${sampleAudio.zh}" (${sampleAudio.vi}). Đáp án: ${sampleAudio.ok ? "Đúng √" : "Sai ×"}.`,
      });
    } else {
      const dialogues = [
        {
          audio: "男：请问，图书馆在哪儿？ 女：就在前面，离这儿很近。",
          q: "男的在找什么地方？",
          opts: ["A. 图书馆 (Thư viện)", "B. 饭馆 (Nhà hàng)", "C. 医院 (Bệnh viện)", "D. 飞机场 (Sân bay)"],
          ans: "A. 图书馆 (Thư viện)",
          exp: "Nam hỏi: 'Xin hỏi thư viện ở đâu?' -> Đáp án A.",
        },
        {
          audio: "女：你喜欢喝咖啡还是喝茶？ 男：我喜欢喝中国绿茶。",
          q: "男的想喝什么？",
          opts: ["A. 中国绿茶 (Trà xanh)", "B. 热咖啡 (Cà phê nóng)", "C. 冰水 (Nước đá)", "D. 牛奶 (Sữa tươi)"],
          ans: "A. 中国绿茶 (Trà xanh)",
          exp: "Nam trả lời thích uống trà xanh Trung Quốc -> Đáp án A.",
        },
        {
          audio: "男：今天天气怎么样？ 女：外面下雨了，有点冷。",
          q: "今天天气如何？",
          opts: ["A. 下雨，有点冷", "B. 晴天，很热", "C. 刮大风", "D. 下大雪"],
          ans: "A. 下雨，有点冷",
          exp: "Nữ nói ngoài trời mưa và hơi lạnh -> Đáp án A.",
        },
        {
          audio: "女：这部电影好看吗？ 男：非常有意思，我很喜欢。",
          q: "男的觉得电影怎么样？",
          opts: ["A. 很有意思", "B. 不好看", "C. 太长了", "D. 听不懂"],
          ans: "A. 很有意思",
          exp: "Nam đánh giá bộ phim '非常有意思' (Rất thú vị) -> Đáp án A.",
        },
      ][(i - 1) % 4];

      questions.push({
        id: i,
        section: "listening",
        sectionTitle: "第一部分：听力 (Listening)",
        part: 2,
        typeText: "第 2 部分：听对话，选择正确答案",
        instruction: "第二部分：听两句话或对话，选择正确答案 (Nghe đoạn hội thoại và chọn đáp án A, B, C, D)",
        audioText: dialogues.audio,
        chinesePrompt: dialogues.q,
        options: dialogues.opts,
        correctAnswer: dialogues.ans,
        explanation: dialogues.exp,
      });
    }
  }

  // 2. GENERATE READING QUESTIONS
  for (let j = 1; j <= readingCount; j++) {
    const qId = listeningCount + j;
    const isFillInBlank = j <= readingCount / 2;

    if (isFillInBlank) {
      const blanks = [
        {
          sentence: "我想买一个新______，这个已经坏了。",
          opts: ["A. 手机 (Điện thoại)", "B. 苹果 (Quả táo)", "C. 明天 (Ngày mai)", "D. 漂亮 (Xinh đẹp)"],
          ans: "A. 手机 (Điện thoại)",
          exp: "Ngữ cảnh 'cái này đã hỏng rồi' nên cần mua 'điện thoại mới' (手机).",
        },
        {
          sentence: "王老师每天早上去公园______。",
          opts: ["A. 跑步 (Chạy bộ)", "B. 睡觉 (Đi ngủ)", "C. 电视 (Tivi)", "D. 衣服 (Quần áo)"],
          ans: "A. 跑步 (Chạy bộ)",
          exp: "Đi đến công viên vào buổi sáng để 'chạy bộ tập thể dục' (跑步).",
        },
        {
          sentence: "汉语虽然有点难，但是非常______。",
          opts: ["A. 有意思 (Thú vị)", "B. 便宜 (Rẻ)", "C. 黑 (Đen)", "D. 慢 (Chậm)"],
          ans: "A. 有意思 (Thú vị)",
          exp: "Liên từ 'tuy... nhưng': Tiếng Hán tuy hơi khó nhưng rất thú vị (有意思).",
        },
        {
          sentence: "你______的时候喜欢做什么？",
          opts: ["A. 休息 (Nghỉ ngơi)", "B. 颜色 (Màu sắc)", "C. 雨伞 (Chiếc ô)", "D. 鸡蛋 (Trứng gà)"],
          ans: "A. 休息 (Nghỉ ngơi)",
          exp: "Câu hỏi về thời gian rảnh: 'Khi bạn nghỉ ngơi (休息) thì thích làm gì?'.",
        },
      ][(j - 1) % 4];

      questions.push({
        id: qId,
        section: "reading",
        sectionTitle: "第二部分：阅读 (Reading)",
        part: 1,
        typeText: "第 1 部分：选词填空",
        instruction: "选词填空：阅读句子，选择最佳词语填入空格 (Điền từ vào chỗ trống)",
        chinesePrompt: blanks.sentence,
        options: blanks.opts,
        correctAnswer: blanks.ans,
        explanation: blanks.exp,
      });
    } else {
      const passages = [
        {
          passage: "小明是北京大学的学生。他每天早上六点半起床，七点吃早饭，然后去教室上课。他最喜欢学习中国历史和文化。",
          q: "小明几点吃早饭？",
          opts: ["A. 七点 (7:00)", "B. 六点半 (6:30)", "C. 八点 (8:00)", "D. 七点半 (7:30)"],
          ans: "A. 七点 (7:00)",
          exp: "Trong bài nêu rõ: '七点吃早饭' (7 giờ ăn sáng).",
        },
        {
          passage: "大熊猫是中国的国宝，它们长得非常可爱，黑白相间。它们最喜欢的食物是新鲜的竹子。",
          q: "大熊猫最喜欢吃什么？",
          opts: ["A. 竹子 (Tre/trúc)", "B. 苹果 (Táo)", "C. 米饭 (Cơm)", "D. 鱼 (Cá)"],
          ans: "A. 竹子 (Tre/trúc)",
          exp: "Bài đọc: '它们最喜欢的食物是新鲜的竹子' -> Chọn Trúc (竹子).",
        },
      ][(j - 1) % 2];

      questions.push({
        id: qId,
        section: "reading",
        sectionTitle: "第二部分：阅读 (Reading)",
        part: 2,
        typeText: "第 2 部分：阅读理解",
        instruction: "阅读短文，选择正确的答案 (Đọc đoạn văn và chọn đáp án chính xác)",
        readingPassage: passages.passage,
        chinesePrompt: passages.q,
        options: passages.opts,
        correctAnswer: passages.ans,
        explanation: passages.exp,
      });
    }
  }

  // 3. GENERATE WRITING QUESTIONS (HSK 3+)
  if (hasWriting) {
    for (let k = 1; k <= writingCount; k++) {
      const qId = listeningCount + readingCount + k;
      const writingSamples = [
        {
          tokens: ["喜欢", "我", "中国菜", "吃"],
          ans: "A. 我喜欢吃中国菜。",
          opts: [
            "A. 我喜欢吃中国菜。",
            "B. 吃中国菜我喜欢。",
            "C. 中国菜喜欢我吃。",
            "D. 我吃中国菜喜欢。",
          ],
          exp: "Cấu trúc Chủ ngữ + Động từ tâm lý + Động từ + Tân ngữ: 我 (Tôi) + 喜欢 (thích) + 吃 (ăn) + 中国菜 (món Trung).",
        },
        {
          tokens: ["在", "看书", "图书馆", "他"],
          ans: "A. 他在图书馆看书。",
          opts: [
            "A. 他在图书馆看书。",
            "B. 他看书在图书馆。",
            "C. 在图书馆他看书。",
            "D. 看书他在图书馆。",
          ],
          exp: "Trạng ngữ chỉ địa điểm đứng trước động từ chính: 他 + 在图书馆 + 看书.",
        },
        {
          tokens: ["比", "今天", "昨天", "冷"],
          ans: "A. 今天比昨天冷。",
          opts: [
            "A. 今天比昨天冷。",
            "B. 今天昨天比冷。",
            "C. 昨天比冷今天。",
            "D. 冷比今天昨天。",
          ],
          exp: "Câu chữ 比 (so sánh): A + 比 + B + Tính từ -> 今天 (Hôm nay) + 比 + 昨天 (hôm qua) + 冷 (lạnh).",
        },
      ][(k - 1) % 3];

      questions.push({
        id: qId,
        section: "writing",
        sectionTitle: "第三部分：书写 (Writing)",
        part: 1,
        typeText: "第 1 部分：组词成句",
        instruction: "组词成句：将给出的词语排列成正确的句子 (Sắp xếp các từ thành câu đúng ngữ pháp)",
        tokensToOrder: writingSamples.tokens,
        correctOrder: writingSamples.ans,
        options: writingSamples.opts,
        correctAnswer: writingSamples.ans,
        explanation: writingSamples.exp,
      });
    }
  }

  return questions;
}

function speakChinese(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "zh-CN";
  u.rate = 0.85;
  window.speechSynthesis.speak(u);
}

export default function HskTestRoute({
  loaderData,
}: {
  loaderData: { user: any; lessons: any[] };
}) {
  const { user } = loaderData;
  const navigate = useNavigate();

  // Screen modes: "lobby" | "soundCheck" | "exam" | "scorecard"
  const [screenMode, setScreenMode] = useState<"lobby" | "soundCheck" | "exam" | "scorecard">("lobby");
  const [selectedLevel, setSelectedLevel] = useState<string>("hsk1");
  const [examQuestions, setExamQuestions] = useState<ExamQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<number[]>([]);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [audioPlayCount, setAudioPlayCount] = useState<Record<number, number>>({});
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [soundCheckStatus, setSoundCheckStatus] = useState<"idle" | "playing" | "ok">("idle");

  // Local Storage Exam History
  const [examHistory, setExamHistory] = useState<
    {
      id: string;
      level: string;
      score: number;
      maxScore: number;
      passed: boolean;
      date: string;
    }[]
  >([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("hsk_exam_history");
      if (saved) setExamHistory(JSON.parse(saved));
    } catch (e) {}
  }, []);

  const currentPreset = useMemo(
    () => EXAM_PRESETS.find((p) => p.id === selectedLevel) || EXAM_PRESETS[0],
    [selectedLevel]
  );

  // Candidate ID & Seat
  const candidateInfo = useMemo(() => {
    return {
      name: user?.name || "考生 (Nguyễn Văn A)",
      admissionNo: `HSK${new Date().getFullYear()}${Math.floor(1000 + Math.random() * 9000)}`,
      roomNo: "考场 01",
      seatNo: "座位 18",
    };
  }, [user]);

  // Handle Level Choice -> Sound Check
  const handleSelectLevelAndPrepare = (levelId: string) => {
    sound.playWoodblock();
    setSelectedLevel(levelId);
    setSoundCheckStatus("idle");
    setScreenMode("soundCheck");
  };

  // Sound Check audio
  const handleTestSound = () => {
    setSoundCheckStatus("playing");
    speakChinese("你好！欢迎参加汉语水平考试机考。请调节耳机音量至清晰舒适。");
    setTimeout(() => setSoundCheckStatus("ok"), 3000);
  };

  // Start the actual official exam
  const handleStartOfficialExam = () => {
    sound.playLevelUp();
    const generated = generateMockExamQuestions(selectedLevel);
    setExamQuestions(generated);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setFlaggedQuestions([]);
    setRemainingSeconds(currentPreset.durationMinutes * 60);
    setAudioPlayCount({});
    setShowSubmitModal(false);
    setScreenMode("exam");
  };

  // Timer countdown
  useEffect(() => {
    if (screenMode !== "exam" || remainingSeconds <= 0) return;

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinalSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [screenMode, remainingSeconds]);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleSelectAnswer = (qId: number, answer: string) => {
    sound.playWoodblock();
    setUserAnswers((prev) => ({ ...prev, [qId]: answer }));
  };

  const handleToggleFlag = (qId: number) => {
    sound.playWoodblock();
    setFlaggedQuestions((prev) =>
      prev.includes(qId) ? prev.filter((id) => id !== qId) : [...prev, qId]
    );
  };

  const handlePlayAudio = (qId: number, text?: string) => {
    if (!text) return;
    const currentCount = audioPlayCount[qId] || 0;
    if (currentCount >= 2) {
      sound.playIncorrect();
      return;
    }

    setAudioPlayCount((prev) => ({ ...prev, [qId]: currentCount + 1 }));
    setIsPlayingAudio(true);
    speakChinese(text);
    setTimeout(() => setIsPlayingAudio(false), 2200);
  };

  // Auto-play audio when moving to listening question
  const currentQ = examQuestions[currentQuestionIndex];

  useEffect(() => {
    if (screenMode === "exam" && currentQ?.section === "listening" && currentQ.audioText) {
      const played = audioPlayCount[currentQ.id] || 0;
      if (played === 0) {
        setTimeout(() => handlePlayAudio(currentQ.id, currentQ.audioText), 400);
      }
    }
  }, [currentQuestionIndex, screenMode]);

  // Final Submit
  const handleFinalSubmit = () => {
    setShowSubmitModal(false);
    sound.playVictory();

    let correctCount = 0;
    examQuestions.forEach((q) => {
      if (userAnswers[q.id] === q.correctAnswer) {
        correctCount++;
      }
    });

    const totalQ = examQuestions.length || 1;
    const finalScore = Math.round((correctCount / totalQ) * currentPreset.maxScore);
    const isPassed = finalScore >= currentPreset.passingScore;

    const earnedExp = finalScore * 2 + 50;
    const earnedGems = isPassed ? 5 : 2;
    addExpAndGems(earnedExp, earnedGems);

    const record = {
      id: `${Date.now()}`,
      level: currentPreset.level,
      score: finalScore,
      maxScore: currentPreset.maxScore,
      passed: isPassed,
      date: new Date().toLocaleDateString("vi-VN"),
    };

    const updated = [record, ...examHistory].slice(0, 10);
    setExamHistory(updated);
    try {
      localStorage.setItem("hsk_exam_history", JSON.stringify(updated));
    } catch (e) {}

    setScreenMode("scorecard");
  };

  // Score stats breakdown
  const examStats = useMemo(() => {
    if (screenMode !== "scorecard") return null;

    let listeningCorrect = 0;
    let listeningTotal = 0;
    let readingCorrect = 0;
    let readingTotal = 0;
    let writingCorrect = 0;
    let writingTotal = 0;

    examQuestions.forEach((q) => {
      const isRight = userAnswers[q.id] === q.correctAnswer;
      if (q.section === "listening") {
        listeningTotal++;
        if (isRight) listeningCorrect++;
      } else if (q.section === "reading") {
        readingTotal++;
        if (isRight) readingCorrect++;
      } else {
        writingTotal++;
        if (isRight) writingCorrect++;
      }
    });

    const listeningScore = listeningTotal > 0 ? Math.round((listeningCorrect / listeningTotal) * 100) : 0;
    const readingScore = readingTotal > 0 ? Math.round((readingCorrect / readingTotal) * 100) : 0;
    const writingScore = writingTotal > 0 ? Math.round((writingCorrect / writingTotal) * 100) : 0;

    const totalScore = listeningScore + readingScore + writingScore;
    const isPassed = totalScore >= currentPreset.passingScore;

    return {
      listeningCorrect,
      listeningTotal,
      listeningScore,
      readingCorrect,
      readingTotal,
      readingScore,
      writingCorrect,
      writingTotal,
      writingScore,
      totalScore,
      isPassed,
      totalCorrect: listeningCorrect + readingCorrect + writingCorrect,
      totalQuestions: examQuestions.length,
    };
  }, [screenMode, examQuestions, userAnswers, currentPreset]);

  // Current active section
  const currentSection = currentQ?.section || "listening";

  return (
    <SiteLayout user={user} hideFooter={screenMode === "exam"}>
      {/* ========================================================================= */}
      {/* MODE 1: LOBBY SELECTOR                                                    */}
      {/* ========================================================================= */}
      {screenMode === "lobby" && (
        <div className="relative min-h-[90vh] bg-[#FAF8F5] py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl space-y-8">
            {/* Official Header */}
            <div className="text-center space-y-3 max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-1.5 text-xs font-black text-rose-700 shadow-2xs">
                <ShieldCheck size={16} className="text-rose-600" />
                <span>HỆ THỐNG MÔ PHỎNG THI HSK CHÍNH THỨC (HSK 机考系统)</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
                Phòng Thi HSK Chuẩn Quốc Tế
              </h1>

              <p className="text-sm sm:text-base font-medium text-slate-600 leading-relaxed">
                Giao diện và quy chế thi 100% chuẩn hệ thống <strong>HSK Computer-Based Test (机考)</strong>: 
                Đúng định dạng 听力 (Nghe) · 阅读 (Đọc) · 书写 (Viết), bấm giờ chuẩn và xuất chứng nhận điểm số.
              </p>
            </div>

            {/* Level Selector Tabs */}
            <div className="flex items-center justify-center gap-2 sm:gap-3 overflow-x-auto pb-2 no-scrollbar">
              {EXAM_PRESETS.map((preset) => {
                const isSelected = selectedLevel === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      sound.playWoodblock();
                      setSelectedLevel(preset.id);
                    }}
                    className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-xs sm:text-sm font-black transition-all cursor-pointer shrink-0 ${
                      isSelected
                        ? "bg-slate-900 text-white shadow-lg scale-105"
                        : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-2xs"
                    }`}
                  >
                    <Award size={16} className={isSelected ? "text-amber-400" : "text-slate-400"} />
                    <span>{preset.level}</span>
                  </button>
                );
              })}
            </div>

            {/* Exam Card Bento */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-8 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                  <div className="space-y-1">
                    <span className="text-xs font-black uppercase text-rose-600 font-mono tracking-wider">
                      {currentPreset.levelChinese} · {currentPreset.subtitle}
                    </span>
                    <h2 className="text-2xl font-black text-slate-900">{currentPreset.title}</h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSelectLevelAndPrepare(currentPreset.id)}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-rose-600 px-7 py-3.5 text-sm font-black text-white shadow-md shadow-rose-600/25 hover:bg-rose-700 active:scale-95 transition-all cursor-pointer shrink-0"
                  >
                    <FileCheck size={16} />
                    <span>CHUẨN BỊ VÀO PHÒNG THI</span>
                  </button>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-center">
                    <Clock size={18} className="mx-auto text-slate-700 mb-1" />
                    <span className="text-[10px] font-bold text-slate-400">Thời Lượng</span>
                    <p className="text-sm font-black text-slate-800">{currentPreset.durationMinutes} Phút</p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-center">
                    <FileText size={18} className="mx-auto text-slate-700 mb-1" />
                    <span className="text-[10px] font-bold text-slate-400">Tổng Số Câu</span>
                    <p className="text-sm font-black text-slate-800">{currentPreset.totalQuestions} Câu</p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-center">
                    <Trophy size={18} className="mx-auto text-emerald-600 mb-1" />
                    <span className="text-[10px] font-bold text-slate-400">Điểm Đậu</span>
                    <p className="text-sm font-black text-emerald-700">
                      {currentPreset.passingScore} / {currentPreset.maxScore}đ
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-center">
                    <BookOpen size={18} className="mx-auto text-slate-700 mb-1" />
                    <span className="text-[10px] font-bold text-slate-400">Vốn Từ</span>
                    <p className="text-sm font-black text-slate-800">{currentPreset.vocabRequirement}</p>
                  </div>
                </div>

                {/* Sections Structure */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-2">
                    <Layers size={14} className="text-rose-600" />
                    Phân Bổ Kỹ Năng Thi ({currentPreset.levelChinese})
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-1">
                      <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                        <Headphones size={15} /> 1. 听力 (Nghe Hiểu)
                      </span>
                      <p className="text-base font-black text-slate-900">{currentPreset.sections.listening.count} câu</p>
                      <p className="text-xs text-slate-500">{currentPreset.sections.listening.time} · 100đ</p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-1">
                      <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                        <BookOpen size={15} /> 2. 阅读 (Đọc Hiểu)
                      </span>
                      <p className="text-base font-black text-slate-900">{currentPreset.sections.reading.count} câu</p>
                      <p className="text-xs text-slate-500">{currentPreset.sections.reading.time} · 100đ</p>
                    </div>

                    {currentPreset.sections.writing ? (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-1">
                        <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                          <GraduationCap size={15} /> 3. 书写 (Viết Cú Pháp)
                        </span>
                        <p className="text-base font-black text-slate-900">{currentPreset.sections.writing.count} câu</p>
                        <p className="text-xs text-slate-500">{currentPreset.sections.writing.time} · 100đ</p>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-4 flex flex-col justify-center text-center opacity-60">
                        <span className="text-xs font-bold text-slate-500">Phần Viết: Không áp dụng</span>
                        <span className="text-[10px] text-slate-400">(Chỉ có từ HSK 3 trở lên)</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* History */}
              <div className="lg:col-span-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <History size={16} className="text-rose-600" />
                    Lịch Sử Thi Gần Đây
                  </h3>
                  <span className="text-[11px] text-slate-400 font-bold">{examHistory.length} bài thi</span>
                </div>

                {examHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center space-y-2">
                    <GraduationCap size={32} className="text-slate-300" />
                    <p className="text-xs font-bold text-slate-600">Chưa có kết quả thi nào</p>
                    <p className="text-[11px] text-slate-400">Chọn cấp độ và bấm Chuẩn Bị để làm bài thi ngay!</p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1 no-scrollbar">
                    {examHistory.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 text-xs"
                      >
                        <div className="space-y-0.5">
                          <span className="font-black text-slate-900">{item.level}</span>
                          <p className="text-xs font-bold text-slate-600">
                            Điểm: <span className="font-black text-slate-900">{item.score}</span> / {item.maxScore}đ
                          </p>
                        </div>

                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-black ${
                            item.passed ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {item.passed ? "合格 (ĐẠT)" : "需努力 (CHƯA ĐẠT)"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: AUTHENTIC PRE-EXAM SOUND CHECK & ADMISSION TICKET                 */}
      {/* ========================================================================= */}
      {screenMode === "soundCheck" && (
        <div className="relative min-h-[85vh] bg-[#F4F6F9] py-8 sm:py-12 px-4 flex items-center justify-center">
          <div className="w-full max-w-2xl bg-white border border-slate-300 rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Top Official Chinese Exam Banner */}
            <div className="bg-[#1A365D] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center font-bold text-lg">
                  HSK
                </div>
                <div>
                  <h2 className="text-base font-black tracking-wide">汉语水平考试 (HSK) 机考系统</h2>
                  <p className="text-xs opacity-80 font-mono">Chinese Proficiency Test Online System</p>
                </div>
              </div>
              <span className="rounded-lg bg-rose-600 px-3 py-1 text-xs font-black">{currentPreset.levelChinese}</span>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              {/* Candidate Info Card */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2 text-xs">
                <h3 className="font-black text-slate-800 uppercase tracking-wider text-[11px] border-b border-slate-200 pb-2 flex items-center justify-between">
                  <span>准考证信息 (Thông Tin Thí Sinh)</span>
                  <span className="text-emerald-700 font-bold">● 已验证 (Đã xác thực)</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  <div>
                    <span className="text-slate-400">考生姓名:</span>
                    <p className="font-bold text-slate-800">{candidateInfo.name}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">准考证号:</span>
                    <p className="font-bold font-mono text-slate-800">{candidateInfo.admissionNo}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">考场 / 座位:</span>
                    <p className="font-bold text-slate-800">{candidateInfo.roomNo} · {candidateInfo.seatNo}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">考试科目:</span>
                    <p className="font-bold text-rose-600">{currentPreset.levelChinese} 网考</p>
                  </div>
                </div>
              </div>

              {/* Sound Check Arena */}
              <div className="rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 p-6 text-center space-y-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-md">
                  <Headphones size={28} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-indigo-950">耳机试音 (Kiểm Tra Âm Thanh Tai Nghe)</h4>
                  <p className="text-xs text-indigo-700">
                    Vui lòng đeo tai nghe, bấm nút bên dưới để nghe đoạn âm thanh thử nghiệm và điều chỉnh âm lượng.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleTestSound}
                  className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-black text-white shadow-sm transition-all cursor-pointer ${
                    soundCheckStatus === "playing"
                      ? "bg-amber-600 scale-105 animate-pulse"
                      : "bg-indigo-600 hover:bg-indigo-700"
                  }`}
                >
                  <Volume2 size={16} />
                  <span>{soundCheckStatus === "playing" ? "正在播放试音音频..." : "点击试音 (Phát Đoạn Thử)"}</span>
                </button>

                {soundCheckStatus === "ok" && (
                  <p className="text-xs font-bold text-emerald-700 flex items-center justify-center gap-1">
                    <CheckCircle2 size={15} /> Âm thanh hoạt động tốt. Bạn đã sẵn sàng làm bài!
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setScreenMode("lobby")}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-black text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  返回 (Quay Lại)
                </button>

                <button
                  type="button"
                  onClick={handleStartOfficialExam}
                  className="rounded-xl bg-[#1A365D] hover:bg-[#2A4365] px-8 py-3 text-xs sm:text-sm font-black text-white shadow-md active:scale-95 transition-all cursor-pointer flex items-center gap-2"
                >
                  <Play size={16} className="fill-white" />
                  <span>确认信息，开始考试 (BẮT ĐẦU THI)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 3: OFFICIAL HSK COMPUTER-BASED EXAM ARENA (机考界面)                  */}
      {/* ========================================================================= */}
      {screenMode === "exam" && (
        <div className="relative min-h-screen bg-[#F0F2F5] flex flex-col justify-between select-none">
          {/* 1. Official Top Navigation Bar */}
          <header className="sticky top-0 z-40 bg-[#1A365D] text-white border-b border-[#2C5282] shadow-md">
            <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-2.5">
              {/* Left: Candidate badge */}
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 font-bold text-sm">
                  HSK
                </div>
                <div className="text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-amber-300">{currentPreset.levelChinese}</span>
                    <span className="opacity-60">|</span>
                    <span className="font-bold">{candidateInfo.name}</span>
                  </div>
                  <span className="text-[10px] opacity-75 font-mono">准考证号: {candidateInfo.admissionNo}</span>
                </div>
              </div>

              {/* Center: Section Navigator */}
              <div className="flex items-center gap-1.5 bg-black/20 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    const firstListeningIdx = examQuestions.findIndex((q) => q.section === "listening");
                    if (firstListeningIdx >= 0) setCurrentQuestionIndex(firstListeningIdx);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-black transition ${
                    currentSection === "listening" ? "bg-rose-600 text-white shadow-xs" : "opacity-70 hover:opacity-100"
                  }`}
                >
                  听力 (Nghe)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const firstReadingIdx = examQuestions.findIndex((q) => q.section === "reading");
                    if (firstReadingIdx >= 0) setCurrentQuestionIndex(firstReadingIdx);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-black transition ${
                    currentSection === "reading" ? "bg-rose-600 text-white shadow-xs" : "opacity-70 hover:opacity-100"
                  }`}
                >
                  阅读 (Đọc)
                </button>
                {currentPreset.sections.writing && (
                  <button
                    type="button"
                    onClick={() => {
                      const firstWritingIdx = examQuestions.findIndex((q) => q.section === "writing");
                      if (firstWritingIdx >= 0) setCurrentQuestionIndex(firstWritingIdx);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-black transition ${
                      currentSection === "writing" ? "bg-rose-600 text-white shadow-xs" : "opacity-70 hover:opacity-100"
                    }`}
                  >
                    书写 (Viết)
                  </button>
                )}
              </div>

              {/* Right: Countdown Timer & Hand-in button */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 bg-[#0F2942] border border-[#2B4C6F] px-3 py-1.5 rounded-lg text-xs font-mono font-black text-amber-300">
                  <Clock size={14} className="text-amber-400" />
                  <span>{formatTimer(remainingSeconds)}</span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowSubmitModal(true)}
                  className="rounded-lg bg-rose-600 hover:bg-rose-700 px-4 py-1.5 text-xs font-black text-white shadow-sm transition active:scale-95 cursor-pointer"
                >
                  交卷 (Nộp Bài)
                </button>
              </div>
            </div>
          </header>

          {/* 2. Official Main Question Arena */}
          <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6">
            {currentQ && (
              <div className="bg-white border border-slate-300 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[520px]">
                {/* Question Section Header */}
                <div className="bg-[#F8FAFC] border-b border-slate-200 px-6 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="rounded-md bg-[#1A365D] text-white px-2.5 py-0.5 text-xs font-black">
                      第 {currentQ.id} 题
                    </span>
                    <span className="text-xs font-black text-slate-700">{currentQ.typeText}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleToggleFlag(currentQ.id)}
                      className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
                        flaggedQuestions.includes(currentQ.id)
                          ? "bg-amber-100 text-amber-900 border border-amber-300"
                          : "text-slate-500 hover:bg-slate-100"
                      }`}
                    >
                      <Flag size={13} className={flaggedQuestions.includes(currentQ.id) ? "fill-amber-500" : ""} />
                      <span>标记本题 (Gắn Cờ)</span>
                    </button>
                  </div>
                </div>

                {/* Instruction */}
                <div className="bg-slate-50/70 border-b border-slate-100 px-6 py-2 text-xs text-slate-500 italic">
                  {currentQ.instruction}
                </div>

                {/* Question Content Body */}
                <div className="flex-1 p-6 sm:p-10 space-y-6 flex flex-col justify-center">
                  {/* Audio Player for Listening */}
                  {currentQ.section === "listening" && currentQ.audioText && (
                    <div className="mx-auto flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 max-w-lg w-full text-center">
                      <div className="relative">
                        <button
                          type="button"
                          disabled={(audioPlayCount[currentQ.id] || 0) >= 2}
                          onClick={() => handlePlayAudio(currentQ.id, currentQ.audioText)}
                          className={`flex h-16 w-16 items-center justify-center rounded-full bg-[#1A365D] text-white shadow-md transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                            isPlayingAudio ? "scale-105 ring-4 ring-indigo-300 animate-pulse" : "hover:bg-[#2A4365]"
                          }`}
                        >
                          <Volume2 size={30} />
                        </button>
                      </div>

                      <div className="space-y-0.5">
                        <p className="text-xs font-black text-slate-800">
                          {isPlayingAudio ? "正在播放录音音频 (Đang phát âm thanh...)" : "点击喇叭重新播放音频"}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          播放次数: <strong>{audioPlayCount[currentQ.id] || 0}</strong> / 2 次 (Đã phát: {audioPlayCount[currentQ.id] || 0}/2 lần)
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Reading Passage */}
                  {currentQ.readingPassage && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-2 max-w-3xl mx-auto w-full">
                      <span className="text-[10px] font-black text-slate-400 uppercase">短文内容 (Đoạn văn):</span>
                      <p className="font-hanzi text-lg font-medium text-slate-900 leading-relaxed">
                        {currentQ.readingPassage}
                      </p>
                    </div>
                  )}

                  {/* Prompt Text */}
                  {currentQ.chinesePrompt && (
                    <div className="text-center space-y-1 py-2">
                      <p className="font-hanzi text-2xl sm:text-3xl font-black text-slate-900 tracking-wide">
                        {currentQ.chinesePrompt}
                      </p>
                      {currentQ.pinyinPrompt && (
                        <p className="font-mono text-xs font-bold text-amber-700">{currentQ.pinyinPrompt}</p>
                      )}
                    </div>
                  )}

                  {/* Writing Tokens to Order (if any) */}
                  {currentQ.tokensToOrder && (
                    <div className="flex flex-wrap items-center justify-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 max-w-xl mx-auto w-full">
                      {currentQ.tokensToOrder.map((tok, idx) => (
                        <span
                          key={idx}
                          className="rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 font-hanzi text-base font-bold text-slate-800 shadow-2xs"
                        >
                          {tok}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Option Choice Rows (True/False or Multiple Choice) */}
                  <div className="max-w-2xl mx-auto w-full space-y-3 pt-2">
                    {currentQ.options.map((opt, idx) => {
                      const isChecked = userAnswers[currentQ.id] === opt;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectAnswer(currentQ.id, opt)}
                          className={`w-full flex items-center gap-3.5 rounded-xl border-2 p-4 text-left transition cursor-pointer active:scale-[0.99] ${
                            isChecked
                              ? "border-[#1A365D] bg-indigo-50/50 text-[#1A365D] font-black shadow-xs ring-1 ring-[#1A365D]"
                              : "border-slate-200 bg-white hover:bg-slate-50 text-slate-800"
                          }`}
                        >
                          <div
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                              isChecked ? "border-[#1A365D] bg-[#1A365D]" : "border-slate-300 bg-white"
                            }`}
                          >
                            {isChecked && <div className="h-2 w-2 rounded-full bg-white" />}
                          </div>
                          <span className="text-sm font-bold font-hanzi sm:text-base">{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </main>

          {/* 3. Official Bottom Answer Sheet Navigation Dock (底部答题卡) */}
          <footer className="sticky bottom-0 z-40 bg-white border-t border-slate-300 px-4 py-3 shadow-lg">
            <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Previous / Next buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentQuestionIndex === 0}
                  onClick={() => {
                    sound.playWoodblock();
                    setCurrentQuestionIndex((p) => p - 1);
                  }}
                  className="rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft size={16} />
                  <span>上一题 (Câu Trước)</span>
                </button>

                <button
                  type="button"
                  disabled={currentQuestionIndex + 1 >= examQuestions.length}
                  onClick={() => {
                    sound.playWoodblock();
                    setCurrentQuestionIndex((p) => p + 1);
                  }}
                  className="rounded-lg bg-[#1A365D] px-4 py-2 text-xs font-black text-white hover:bg-[#2A4365] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                >
                  <span>下一题 (Câu Sau)</span>
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Official Answer Grid Palette (答题卡) */}
              <div className="flex-1 flex items-center gap-1.5 overflow-x-auto max-w-2xl px-2 py-1 no-scrollbar">
                {examQuestions.map((q, idx) => {
                  const isDone = !!userAnswers[q.id];
                  const isFlagged = flaggedQuestions.includes(q.id);
                  const isCurrent = currentQuestionIndex === idx;

                  let dotStyle = "border-slate-300 bg-slate-50 text-slate-600";
                  if (isCurrent) {
                    dotStyle = "border-rose-600 bg-rose-600 text-white shadow-sm ring-2 ring-rose-300";
                  } else if (isFlagged) {
                    dotStyle = "border-amber-400 bg-amber-100 text-amber-900 font-bold";
                  } else if (isDone) {
                    dotStyle = "border-[#1A365D] bg-[#1A365D] text-white";
                  }

                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => {
                        sound.playWoodblock();
                        setCurrentQuestionIndex(idx);
                      }}
                      className={`h-7 w-7 shrink-0 rounded-md border text-[11px] font-bold flex items-center justify-center transition cursor-pointer ${dotStyle}`}
                    >
                      {q.id}
                    </button>
                  );
                })}
              </div>

              {/* Progress Count */}
              <div className="text-xs font-bold text-slate-500 font-mono">
                已作答 (Đã làm): <strong className="text-slate-900">{Object.keys(userAnswers).length}</strong> / {examQuestions.length}
              </div>
            </div>
          </footer>

          {/* Hand-in Confirmation Modal (交卷确认) */}
          {showSubmitModal && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
              style={{ background: "rgba(0, 0, 0, 0.6)" }}
            >
              <div className="w-full max-w-md bg-white border border-slate-300 rounded-2xl p-6 text-center space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                  <FileCheck size={28} />
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-black text-slate-900">确认交卷？ (Xác Nhận Nộp Bài)</h3>
                  <p className="text-xs text-slate-500">
                    Bạn đã hoàn thành <strong>{Object.keys(userAnswers).length} / {examQuestions.length}</strong> câu hỏi. 
                    {examQuestions.length - Object.keys(userAnswers).length > 0 && (
                      <span className="text-rose-600 block mt-1">
                        Còn {examQuestions.length - Object.keys(userAnswers).length} câu chưa trả lời!
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowSubmitModal(false)}
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    继续答题 (Làm Tiếp)
                  </button>

                  <button
                    type="button"
                    onClick={handleFinalSubmit}
                    className="flex-1 rounded-xl bg-rose-600 hover:bg-rose-700 py-2.5 text-xs font-black text-white shadow-md cursor-pointer"
                  >
                    确定交卷 (Nộp Bài Ngay)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 4: OFFICIAL HSK SCORE REPORT CERTIFICATE (成绩报告单)                */}
      {/* ========================================================================= */}
      {screenMode === "scorecard" && examStats && (
        <div className="relative min-h-[90vh] bg-[#FAF8F5] py-8 sm:py-12 px-4 flex flex-col items-center justify-center">
          <div className="w-full max-w-3xl space-y-6">
            {/* Certificate Paper */}
            <div className="relative bg-white border-8 border-double border-[#991B1B] rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6 overflow-hidden">
              {/* Background Chinese watermark */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-5 select-none font-hanzi text-9xl font-black text-red-900">
                HSK
              </div>

              {/* Certificate Top Header */}
              <div className="text-center space-y-1.5 border-b-2 border-red-900/20 pb-5">
                <div className="flex items-center justify-center gap-2 text-xs font-bold text-red-800 uppercase tracking-widest">
                  <span>教育部中外语言交流合作中心 · 汉考国际</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-serif tracking-wide">
                  汉语水平考试 (HSK) 成绩报告
                </h2>
                <p className="text-xs font-mono text-slate-500 uppercase tracking-wider">
                  Official HSK Score Report Certificate
                </p>
              </div>

              {/* Candidate Info Line */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-red-50/40 p-3.5 rounded-xl border border-red-100">
                <div>
                  <span className="text-slate-400">考生姓名:</span>
                  <p className="font-bold text-slate-800">{candidateInfo.name}</p>
                </div>
                <div>
                  <span className="text-slate-400">准考证号:</span>
                  <p className="font-bold font-mono text-slate-800">{candidateInfo.admissionNo}</p>
                </div>
                <div>
                  <span className="text-slate-400">考试级别:</span>
                  <p className="font-bold text-red-700">{currentPreset.levelChinese}</p>
                </div>
                <div>
                  <span className="text-slate-400">考试日期:</span>
                  <p className="font-bold text-slate-800">{new Date().toLocaleDateString("vi-VN")}</p>
                </div>
              </div>

              {/* Scores Table */}
              <div className="rounded-xl border border-slate-200 overflow-hidden text-xs">
                <table className="w-full text-center border-collapse">
                  <thead className="bg-[#1A365D] text-white font-bold">
                    <tr>
                      <th className="py-2.5 px-3">考试部分 (Kỹ năng)</th>
                      <th className="py-2.5 px-3">满分 (Điểm tối đa)</th>
                      <th className="py-2.5 px-3">得分 (Điểm đạt được)</th>
                      <th className="py-2.5 px-3">正确率 (Độ chính xác)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium">
                    <tr>
                      <td className="py-3 px-3 font-bold text-slate-800">听力 (Nghe hiểu)</td>
                      <td className="py-3 px-3">100</td>
                      <td className="py-3 px-3 font-black text-indigo-700 text-sm">{examStats.listeningScore}</td>
                      <td className="py-3 px-3 text-slate-500">
                        {examStats.listeningCorrect}/{examStats.listeningTotal} câu
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-3 font-bold text-slate-800">阅读 (Đọc hiểu)</td>
                      <td className="py-3 px-3">100</td>
                      <td className="py-3 px-3 font-black text-sky-700 text-sm">{examStats.readingScore}</td>
                      <td className="py-3 px-3 text-slate-500">
                        {examStats.readingCorrect}/{examStats.readingTotal} câu
                      </td>
                    </tr>
                    {examStats.writingTotal > 0 && (
                      <tr>
                        <td className="py-3 px-3 font-bold text-slate-800">书写 (Viết ngữ pháp)</td>
                        <td className="py-3 px-3">100</td>
                        <td className="py-3 px-3 font-black text-amber-700 text-sm">{examStats.writingScore}</td>
                        <td className="py-3 px-3 text-slate-500">
                          {examStats.writingCorrect}/{examStats.writingTotal} câu
                        </td>
                      </tr>
                    )}
                    <tr className="bg-slate-50/80 font-black text-sm">
                      <td className="py-3 px-3 text-slate-900">总分 (Tổng điểm)</td>
                      <td className="py-3 px-3">{currentPreset.maxScore}</td>
                      <td className="py-3 px-3 text-rose-600 text-lg font-mono">{examStats.totalScore}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-black ${
                            examStats.isPassed ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {examStats.isPassed ? "合格 (ĐẠT)" : "需努力 (CHƯA ĐẠT)"}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Official Seal and Stamp */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-2 text-slate-400 font-mono text-[10px]">
                  <QrCode size={36} className="text-slate-800" />
                  <span>MÃ XÁC THỰC BẢN QUYỀN HSK CERT-2026</span>
                </div>

                <div className="relative text-center">
                  <div className="inline-flex flex-col items-center justify-center border-2 border-red-600 rounded-full h-24 w-24 p-1 text-[9px] font-black text-red-600 leading-tight rotate-[-8deg] opacity-80 select-none shadow-xs">
                    <span>★ 汉考国际 ★</span>
                    <span>汉语水平考试</span>
                    <span>成绩专用章</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Question Review Box */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-black uppercase text-slate-700 tracking-wider">
                Xem Lại Chi Tiết Toàn Bộ Đề Thi & Đáp Án Giải Thích
              </h3>

              <div className="max-h-80 overflow-y-auto space-y-3 pr-1 no-scrollbar">
                {examQuestions.map((q) => {
                  const chosen = userAnswers[q.id];
                  const isRight = chosen === q.correctAnswer;
                  return (
                    <div
                      key={q.id}
                      className="rounded-2xl bg-slate-50 p-4 border border-slate-200 text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black text-slate-800">
                          第 {q.id} 题 ({q.typeText})
                        </span>
                        <span
                          className={`rounded-md px-2.5 py-0.5 text-[10px] font-black ${
                            isRight ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {isRight ? "正确 (Đúng √)" : "错误 (Chưa đúng ✗)"}
                        </span>
                      </div>

                      {q.chinesePrompt && (
                        <p className="font-hanzi text-sm font-bold text-slate-900">{q.chinesePrompt}</p>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px]">
                        <p className="text-slate-600">
                          Bạn chọn: <span className="font-bold">{chosen || "Chưa làm"}</span>
                        </p>
                        <p className="text-emerald-700 font-bold">Đáp án chuẩn: {q.correctAnswer}</p>
                      </div>

                      <p className="text-[11px] text-slate-500 italic bg-white p-2.5 rounded-xl border border-slate-200">
                        💡 Giải thích: {q.explanation}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => handleSelectLevelAndPrepare(selectedLevel)}
                className="flex-1 flex items-center justify-center gap-2 rounded-2xl border-2 border-slate-300 bg-white py-3.5 text-xs sm:text-sm font-black text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-xs"
              >
                <RotateCcw size={16} />
                <span>Thi Lại Đề Này</span>
              </button>

              <button
                type="button"
                onClick={() => setScreenMode("lobby")}
                className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-[#1A365D] py-3.5 text-xs sm:text-sm font-black text-white hover:bg-[#2A4365] transition cursor-pointer shadow-md"
              >
                <Award size={16} />
                <span>Chọn Cấp Độ HSK Khác</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </SiteLayout>
  );
}
