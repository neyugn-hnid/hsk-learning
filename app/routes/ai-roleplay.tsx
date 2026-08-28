import type { Route } from "./+types/ai-roleplay";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { SiteLayout } from "~/components/Layout";
import { getUser } from "~/lib/auth.server";
import { sound } from "~/lib/sound";
import { addExpAndGems } from "~/lib/gamification";
import { FeatureInDevModal } from "~/components/FeatureInDevModal";
import { r2Asset } from "~/lib/assets";
import {
  Mic,
  MicOff,
  Volume2,
  Settings,
  Flame,
  BookOpen,
  ScrollText,
  Headphones,
  ChevronRight,
  Star,
  X,
  Sparkles,
  Send,
  Lock,
} from "lucide-react";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getUser(request);
  return { user };
}

type DialogStep = {
  id: string;
  chinese: string;
  pinyin: string;
  vietnamese: string;
  subtext: string;
  topicTitle: string;
  hskLevel: string;
  progressText: string;
};

const DIALOG_STEPS: DialogStep[] = [
  {
    id: "step-1",
    topicTitle: "Làm Quen Cùng Tiểu Nguyệt",
    hskLevel: "HSK 2",
    progressText: "6/20",
    chinese: "你好！我是小月。",
    pinyin: "Nǐ hǎo! Wǒ shì Xiǎo Yuè.",
    vietnamese: "Xin chào! Mình là Tiểu Nguyệt.",
    subtext: "Mình sẽ cùng bạn học tiếng Trung và chinh phục HSK. Chúng ta bắt đầu nhé!",
  },
  {
    id: "step-2",
    topicTitle: "Hỏi Thăm & Làm Quen",
    hskLevel: "HSK 2",
    progressText: "7/20",
    chinese: "很高兴认识你！你今天过得怎么样？",
    pinyin: "Hěn gāoxìng rènshí nǐ! Nǐ jīntiān guò de zěnmeyàng?",
    vietnamese: "Rất vui được biết bạn! Hôm nay bạn thế nào?",
    subtext: "Bạn có thể luyện nói bằng cách bấm vào micro hoặc gõ câu trả lời bên dưới nhé!",
  },
  {
    id: "step-3",
    topicTitle: "Thưởng Trà Đạo Lạc Dương",
    hskLevel: "HSK 2",
    progressText: "8/20",
    chinese: "尝尝这杯洛阳牡丹茶吧，很香的！",
    pinyin: "Chángchang zhè bēi Luòyáng mǔdān chá ba, hěn xiāng de!",
    vietnamese: "Thử chén trà hoa Mẫu Đơn Lạc Dương này nhé, thơm lắm đó!",
    subtext: "Trà vừa mới pha xong, hương hoa thanh nhã giúp tinh thần minh mẫn.",
  },
  {
    id: "step-4",
    topicTitle: "Mặc Cả Chợ Đêm",
    hskLevel: "HSK 3",
    progressText: "9/20",
    chinese: "你看这把真丝折扇好看吗？",
    pinyin: "Nǐ kàn zhè bǎ zhēnsī zhéshàn hǎokàn ma?",
    vietnamese: "Bạn nhìn xem chiếc quạt lụa xếp này đẹp không?",
    subtext: "Chủ sạp đang báo giá một trăm tệ, bạn giúp mình thương lượng giảm giá nhé!",
  },
  {
    id: "step-5",
    topicTitle: "Gọi Món Lẩu Haidilao",
    hskLevel: "HSK 3",
    progressText: "10/20",
    chinese: "你想吃番茄锅还是麻辣锅？",
    pinyin: "Nǐ xiǎng chī fānqié guō háishì málà guō?",
    vietnamese: "Bạn muốn ăn lẩu cà chua hay lẩu cay tê?",
    subtext: "Chúng ta có thể gọi nồi lẩu đôi để thưởng thức trọn vẹn cả hai hương vị nhé!",
  },
];

export default function AIRoleplayPage({ loaderData }: Route.ComponentProps) {
  const { user } = loaderData;
  const navigate = useNavigate();
  const isAdmin = (user?.role as string) === "ADMIN";
  const [devModalOpen, setDevModalOpen] = useState(!isAdmin);

  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const currentStep = DIALOG_STEPS[currentStepIdx];

  const [inputVal, setInputVal] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showInputDrawer, setShowInputDrawer] = useState(false);
  const [streakCount, setStreakCount] = useState(12);
  const [coinsCount, setCoinsCount] = useState(320);

  // Sidebar drawers
  const [sidebarDrawer, setSidebarDrawer] = useState<"vocab" | "grammar" | "listening" | null>(null);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Speak on initial load or step change only if Admin
    if (isAdmin) {
      speak(currentStep.chinese);
    }
  }, [currentStepIdx, isAdmin]);

  const speak = (text: string) => {
    if (typeof window === "undefined") return;
    fetch("/api/ai/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, lang: "zh-CN" }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(({ audio }) => {
        if (audio) new Audio(`data:audio/mp3;base64,${audio}`).play().catch(() => {});
      })
      .catch(() => {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = "zh-CN";
        u.rate = 0.85;
        window.speechSynthesis?.speak(u);
      });
  };

  const handleNextStep = () => {
    sound.playWoodblock();
    sound.playCorrect();
    setCoinsCount((prev) => prev + 10);
    addExpAndGems(20, 10);

    setCurrentStepIdx((prev) => (prev + 1) % DIALOG_STEPS.length);
  };

  const toggleMic = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Trình duyệt chưa hỗ trợ ghi âm trực tiếp. Bạn hãy gõ câu thoại nhé!");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "zh-CN";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputVal(transcript);
      setIsListening(false);
      handleSendMessage(transcript);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    sound.playWoodblock();
  };

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isSending) return;
    setIsSending(true);
    sound.playWoodblock();

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: `Bạn là Tiểu Nguyệt (Xiǎo Yuè), người bạn đồng hành dễ thương trong hình ảnh đình lầu hoa đào. Trả lời người học một cách thân thiết, ngắn gọn bằng tiếng Trung (dòng 1: câu tiếng Trung, dòng 2: Pinyin, dòng 3: dịch tiếng Việt, dòng 4: lời khuyên phụ).`,
            },
            { role: "assistant", content: currentStep.chinese },
            { role: "user", content: textToSend },
          ],
        }),
      });

      const data = await res.json();
      const reply = data.text || "";
      const lines = reply.split("\n").filter((l: string) => l.trim().length > 0);

      if (lines.length >= 3) {
        DIALOG_STEPS[currentStepIdx] = {
          ...currentStep,
          chinese: lines[0] || textToSend,
          pinyin: lines[1] || "Bấm loa để nghe",
          vietnamese: lines[2] || "Phản hồi từ Tiểu Nguyệt",
          subtext: lines[3] || "Tiểu Nguyệt đang lắng nghe bạn!",
        };
        speak(lines[0]);
      } else {
        handleNextStep();
      }
      setInputVal("");
      setShowInputDrawer(false);
    } catch {
      handleNextStep();
    } finally {
      setIsSending(false);
    }
  };

  const vocabList = [
    { zh: "你好", py: "nǐ hǎo", vi: "Xin chào" },
    { zh: "认识", py: "rèn shí", vi: "Quen biết" },
    { zh: "高兴", py: "gāo xìng", vi: "Vui vẻ" },
    { zh: "学习", py: "xué xí", vi: "Học tập" },
    { zh: "汉语", py: "hàn yǔ", vi: "Tiếng Hán" },
  ];

  const grammarList = [
    { pattern: "我是 + Tên / Danh từ", desc: "Giới thiệu tên hoặc nghề nghiệp", example: "我是小月 (Tôi là Tiểu Nguyệt)" },
    { pattern: "很 + Tính từ", desc: "Phó từ chỉ mức độ (Rất...)", example: "很高兴认识你 (Rất vui được quen bạn)" },
  ];

  return (
    <SiteLayout user={user} hideFooter={true}>
      <div className="relative w-full h-[calc(100vh-64px)] overflow-hidden select-none bg-slate-900 font-sans">
        {/* ========================================================================= */}
        {/* 1. ULTRA HIGH-RES PANORAMIC SCENIC BACKGROUND                             */}
        {/* ========================================================================= */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-1000 filter brightness-105"
          style={{ backgroundImage: `url(${r2Asset("/images/xiao_yue_bg.jpg")})` }}
        />

        {/* Soft natural ambient lighting overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/10 pointer-events-none" />

        {/* ========================================================================= */}
        {/* 2. TOP GAMIFICATION STATUS HEADER (TÁI HIỆN CHÍNH XÁC NHƯ ẢNH MẪU)        */}
        {/* ========================================================================= */}
        <div className="relative z-30 flex items-center justify-between px-6 pt-5 sm:px-10 pointer-events-auto">
          {/* Top Left: Avatar + HSK 2 Pill + Star Progress Bar */}
          <div className="flex items-center">
            {/* Round Avatar with Gold Border and Dangling Tassel */}
            <div className="relative z-10 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full border-2 border-amber-300 bg-amber-50 shadow-lg ring-2 ring-amber-400/50 overflow-hidden">
              <img
                src={r2Asset("/images/xiao_yue_avatar.png")}
                alt="Tiểu Nguyệt"
                className="h-full w-full object-cover"
              />
            </div>

            {/* Navy Blue Level & Progress Pill */}
            <div className="relative -ml-4 flex items-center gap-3 rounded-full border-2 border-amber-300/80 bg-[#1e2f5b]/95 pl-6 pr-3 py-1.5 text-white shadow-xl backdrop-blur-md">
              <span className="text-xs sm:text-sm font-black tracking-wider text-white">
                {currentStep.hskLevel}
              </span>

              {/* Cyan/Blue Progress Mini Bar */}
              <div className="relative h-3.5 w-24 sm:w-28 overflow-hidden rounded-full bg-[#0d162f] border border-sky-400/30">
                <div className="h-full w-[45%] rounded-full bg-gradient-to-r from-sky-400 to-blue-500 shadow-sm" />
                <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-white drop-shadow-xs">
                  {currentStep.progressText}
                </span>
              </div>

              {/* Golden Star Pill Cap */}
              <div className="flex h-5 w-5 items-center justify-center text-amber-400">
                <Star size={16} className="fill-amber-400 drop-shadow-xs" />
              </div>
            </div>
          </div>

          {/* Top Right: Flame Streaks + Gold Coins + Settings Cog */}
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            {/* Flame Streaks */}
            <div className="flex items-center gap-1.5 rounded-full border-2 border-amber-300/60 bg-[#1e2f5b]/95 px-3.5 py-1.5 text-xs sm:text-sm font-black text-white shadow-lg backdrop-blur-md">
              <Flame size={16} className="text-orange-400 fill-orange-400 animate-pulse" />
              <span>{streakCount}</span>
            </div>

            {/* Gold Coins Pill */}
            <div className="flex items-center gap-1.5 rounded-full border-2 border-amber-300/60 bg-[#1e2f5b]/95 px-3.5 py-1.5 text-xs sm:text-sm font-black text-white shadow-lg backdrop-blur-md">
              <div className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[10px] font-black text-amber-950 shadow-2xs">
                ¥
              </div>
              <span>{coinsCount}</span>
              <span className="text-amber-200 text-xs font-bold">+</span>
            </div>

            {/* Settings Cog */}
            <button
              type="button"
              onClick={() => {
                sound.playWoodblock();
                alert("Cài đặt: Tốc độ phát âm chuẩn 0.85x bản xứ. Chế độ tương tác giọng nói: Bật.");
              }}
              className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl border-2 border-amber-300/60 bg-[#1e2f5b]/95 text-white shadow-lg backdrop-blur-md hover:bg-[#283e78] transition cursor-pointer"
              title="Cài đặt hệ thống"
            >
              <Settings size={18} />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. MAIN VISUAL NOVEL STAGE: CHARACTER (LEFT) & THOUGHT BUBBLE (CENTER-RIGHT)*/}
        {/* ========================================================================= */}
        <div className="relative z-20 w-full h-[calc(100%-80px)] flex items-end justify-start px-2 sm:px-6 lg:px-10 pb-0 pointer-events-none">
          {/* Left: Tiểu Nguyệt Companion Character (Sát đáy 100%) */}
          <div className="relative z-10 flex items-end shrink-0 w-[300px] sm:w-[360px] md:w-[420px] lg:w-[460px] xl:w-[500px] pb-0 mb-0">
            <img
              src="/images/xiao_yue_char.png"
              alt="Tiểu Nguyệt"
              className="max-h-[82vh] w-auto object-contain drop-shadow-[0_15px_35px_rgba(0,0,0,0.4)] animate-in fade-in slide-in-from-left-6 duration-700 block -mb-1"
            />
          </div>

          {/* Center-Right: Speech Bubble (THIẾT KẾ Y HỆT ẢNH MẪU VỚI POINTER TAIL) */}
          <div className="relative z-20 flex-1 max-w-2xl lg:max-w-3xl xl:max-w-4xl pb-6 sm:pb-8 -ml-6 sm:-ml-4 pointer-events-auto">
            {/* The Cream / Peach Dialogue Bubble Card */}
            <div className="relative rounded-[36px] border-2 border-[#FBD38D]/90 bg-[#FFFDF9]/95 p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-md text-slate-900">
              {/* Pointer Tail pointing to Xiao Yue on the left */}
              <div className="absolute top-12 -left-3.5 h-7 w-7 rotate-45 border-l-2 border-b-2 border-[#FBD38D]/90 bg-[#FFFDF9]" />

              {/* Name Tag Pill on Top-Left */}
              <div className="absolute -top-5 left-6 flex items-center">
                <div className="flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 via-red-500 to-rose-500 px-5 py-1.5 text-xs sm:text-sm font-black text-white shadow-md border-2 border-white">
                  <span>小月 (Xiǎo Yuè)</span>
                  <button
                    type="button"
                    onClick={() => speak(currentStep.chinese)}
                    className="ml-1 text-white hover:scale-110 transition cursor-pointer"
                    title="Nghe toàn bộ câu thoại"
                  >
                    <Volume2 size={15} />
                  </button>
                </div>
              </div>

              {/* Main Spoken Hanzi Sentence (Font Thư Pháp / Noto Serif SC) */}
              <div className="pt-2 flex items-center justify-between gap-4">
                <div className="font-hanzi text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-wide leading-tight">
                  {currentStep.chinese}
                </div>

                <button
                  type="button"
                  onClick={() => speak(currentStep.chinese)}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-900 shadow-sm hover:bg-amber-200 hover:scale-105 transition cursor-pointer border border-amber-300"
                  title="Nghe phát âm chuẩn"
                >
                  <Volume2 size={20} />
                </button>
              </div>

              {/* Pinyin Subtitle */}
              <div className="mt-2 text-base sm:text-lg font-bold text-slate-600 font-mono">
                {currentStep.pinyin}
              </div>

              {/* Pink Highlight Translation Pill */}
              <div className="mt-3.5 inline-flex items-center gap-2 rounded-full bg-[#FFE4E6] border border-rose-200 px-5 py-1.5 text-xs sm:text-sm md:text-base font-black text-rose-800 shadow-2xs">
                <span>{currentStep.vietnamese}</span>
              </div>

              {/* Contextual Guidance / Subtext */}
              <div className="mt-4 pt-3.5 border-t border-amber-100/80 text-xs sm:text-sm md:text-base text-slate-600 font-medium leading-relaxed">
                {currentStep.subtext}
              </div>
            </div>

            {/* Golden Action Button (Tiếp tục >) in Bottom Right */}
            <div className="mt-4 flex items-center justify-between pr-2">
              {/* Quick Talk Toggle Button */}
              <button
                type="button"
                onClick={() => setShowInputDrawer(!showInputDrawer)}
                className="flex items-center gap-2 rounded-full bg-white/90 border border-amber-200 px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-700 shadow-md backdrop-blur-md hover:bg-amber-50 transition cursor-pointer"
              >
                <span>Trò chuyện cùng Tiểu Nguyệt</span>
              </button>

              {/* The Glowing Golden 'Tiếp tục >' Button (Y hệt mẫu) */}
              <button
                type="button"
                onClick={handleNextStep}
                className="group flex items-center gap-2.5 rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 px-8 py-3.5 text-sm sm:text-base font-black text-amber-950 shadow-[0_8px_20px_rgba(245,158,11,0.4)] hover:brightness-105 active:scale-95 transition cursor-pointer border-2 border-amber-200"
              >
                <span>Tiếp tục</span>
                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Optional Collapsible Voice / Text Reply Box */}
            {showInputDrawer && (
              <div className="mt-3 flex items-center gap-2 rounded-2xl bg-white/95 border-2 border-amber-300 p-2 shadow-xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
                <button
                  type="button"
                  onClick={toggleMic}
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition cursor-pointer ${
                    isListening ? "bg-red-600 text-white animate-pulse" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                  title="Bấm để nói tiếng Trung"
                >
                  {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                </button>
                <input
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage(inputVal)}
                  placeholder={isListening ? "Đang lắng nghe..." : "Nhập câu tiếng Trung..."}
                  className="flex-1 rounded-xl bg-transparent px-3 py-2 text-xs sm:text-sm font-semibold text-slate-900 outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleSendMessage(inputVal)}
                  disabled={!inputVal.trim() || isSending}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white shadow-xs hover:bg-red-700 disabled:opacity-40 transition cursor-pointer"
                >
                  <Send size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
        {/* ========================================================================= */}
        {/* 4. RIGHT FLOATING SQUIRCLE ACTION BUTTONS (TỪ VỰNG, NGỮ PHÁP, LUYỆN NGHE) */}
        {/* ========================================================================= */}
        <div className="absolute right-4 sm:right-6 top-24 z-30 flex flex-col gap-3.5 pointer-events-auto">
          {/* 1. Sổ tay Từ Vựng */}
          <button
            type="button"
            onClick={() => {
              sound.playWoodblock();
              setSidebarDrawer(sidebarDrawer === "vocab" ? null : "vocab");
            }}
            className="group flex h-16 w-16 sm:h-[72px] sm:w-[72px] flex-col items-center justify-center rounded-2xl border-2 border-white/90 bg-white/95 shadow-xl backdrop-blur-md hover:bg-amber-50 hover:border-amber-300 transition-all hover:scale-105 active:scale-95 cursor-pointer text-slate-800"
            title="Sổ tay Từ vựng bài học"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#1e2f5b] text-amber-200 shadow-xs">
              <BookOpen size={18} />
            </div>
            <span className="mt-1 text-[11px] font-black text-slate-800">Từ vựng</span>
          </button>

          {/* 2. Cấu trúc Ngữ Pháp */}
          <button
            type="button"
            onClick={() => {
              sound.playWoodblock();
              setSidebarDrawer(sidebarDrawer === "grammar" ? null : "grammar");
            }}
            className="group flex h-16 w-16 sm:h-[72px] sm:w-[72px] flex-col items-center justify-center rounded-2xl border-2 border-white/90 bg-white/95 shadow-xl backdrop-blur-md hover:bg-amber-50 hover:border-amber-300 transition-all hover:scale-105 active:scale-95 cursor-pointer text-slate-800"
            title="Cấu trúc Ngữ pháp"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#c28424] text-white shadow-xs">
              <ScrollText size={18} />
            </div>
            <span className="mt-1 text-[11px] font-black text-slate-800">Ngữ pháp</span>
          </button>

          {/* 3. Luyện Nghe Giọng Chuẩn */}
          <button
            type="button"
            onClick={() => {
              sound.playWoodblock();
              speak(currentStep.chinese);
            }}
            className="group flex h-16 w-16 sm:h-[72px] sm:w-[72px] flex-col items-center justify-center rounded-2xl border-2 border-white/90 bg-white/95 shadow-xl backdrop-blur-md hover:bg-amber-50 hover:border-amber-300 transition-all hover:scale-105 active:scale-95 cursor-pointer text-slate-800"
            title="Luyện nghe giọng đọc chuẩn"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#374151] text-sky-200 shadow-xs">
              <Headphones size={18} />
            </div>
            <span className="mt-1 text-[11px] font-black text-slate-800">Luyện nghe</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* 5. SIDEBAR DRAWER POPUP OVERLAY                                           */}
        {/* ========================================================================= */}
        {sidebarDrawer && (
          <div className="absolute top-24 right-24 sm:right-28 z-40 w-80 rounded-3xl border-2 border-amber-300 bg-white/95 p-5 shadow-2xl backdrop-blur-md text-slate-900 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-base font-black text-slate-900">
                {sidebarDrawer === "vocab" && "Từ Vựng Trọng Tâm"}
                {sidebarDrawer === "grammar" && "Cấu Trúc Ngữ Pháp"}
              </span>
              <button
                type="button"
                onClick={() => setSidebarDrawer(null)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Vocab Drawer Content */}
            {sidebarDrawer === "vocab" && (
              <div className="mt-3 space-y-2 max-h-72 overflow-y-auto pr-1">
                {vocabList.map((v, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 border border-slate-200/80"
                  >
                    <div>
                      <div className="font-hanzi text-base font-bold text-slate-900">{v.zh}</div>
                      <div className="text-xs text-amber-700 font-mono">{v.py}</div>
                      <div className="text-xs text-slate-600">{v.vi}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => speak(v.zh)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-white cursor-pointer"
                    >
                      <Volume2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Grammar Drawer Content */}
            {sidebarDrawer === "grammar" && (
              <div className="mt-3 space-y-3 max-h-72 overflow-y-auto pr-1 text-xs">
                {grammarList.map((g, i) => (
                  <div key={i} className="rounded-xl bg-amber-50/70 p-3 border border-amber-200/80 space-y-1">
                    <div className="font-bold text-red-800">{g.pattern}</div>
                    <div className="text-slate-600">{g.desc}</div>
                    <div className="font-hanzi text-slate-800 bg-white/80 p-1.5 rounded-lg">
                      Ví dụ: {g.example}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal Khóa Tính Năng Đang Phát Triển Tiểu Nguyệt AI */}
        <FeatureInDevModal
          open={devModalOpen}
          onClose={() => {
            setDevModalOpen(false);
            navigate("/");
          }}
          featureName="Tiểu Nguyệt AI (Hội Thoại Nhập Vai)"
        />
      </div>
    </SiteLayout>
  );
}
