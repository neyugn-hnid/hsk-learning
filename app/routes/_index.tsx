import type { Route } from "./+types/_index";
import { Link } from "react-router";
import { useState, useMemo } from "react";
import { useToast } from "~/components/Toast";
import { useAuth } from "~/components/AuthProvider";
import { sound } from "~/lib/sound";
import { r2Asset } from "~/lib/assets";
import {
  ArrowRight,
  BookOpen,
  Volume2,
  Shuffle,
  Compass,
  Gamepad2,
  Bot,
  Sparkles,
  Layers,
  Target,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  Flame,
  Award,
  BookMarked,
  Swords,
  Trophy,
  Zap,
  GraduationCap,
  Play,
  Pencil,
  Shield,
  Star,
} from "lucide-react";
import {
  ChineseLanternSVG,
  MascotPandaSVG,
  GemDiamondSVG,
  StreakFlameSVG,
} from "~/components/Icons/CustomSVGs";
import { SiteLayout } from "~/components/Layout";
import { getUser } from "~/lib/auth.server";
import { prisma } from "~/lib/db.server";

export async function loader({ request }: Route.LoaderArgs) {
  const [
    user,
    featuredLessons,
    sampleVocabularies,
    totalLessons,
    totalVocabularies,
    hsk20Count,
    hsk30Count,
  ] = await Promise.all([
    getUser(request),
    prisma.lesson.findMany({
      where: { status: "PUBLISHED" },
      take: 6,
      select: {
        id: true,
        title: true,
        level: true,
        source: true,
        orderNo: true,
        _count: { select: { vocabularies: true, grammars: true, quizzes: true } },
        vocabularies: { take: 4, select: { id: true, chinese: true, pinyin: true, meaningVi: true } },
      },
      orderBy: [{ level: "asc" }, { orderNo: "asc" }],
    }),
    prisma.vocabulary.findMany({
      take: 24,
      select: {
        id: true,
        chinese: true,
        pinyin: true,
        meaningVi: true,
        exampleChinese: true,
        exampleMeaning: true,
        level: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.lesson.count({ where: { status: "PUBLISHED" } }),
    prisma.vocabulary.count(),
    prisma.lesson.count({ where: { status: "PUBLISHED", source: "HSK20" } }),
    prisma.lesson.count({ where: { status: "PUBLISHED", source: "HSK30" } }),
  ]);

  return {
    user,
    featuredLessons,
    sampleVocabularies,
    stats: {
      totalLessons,
      totalVocabularies,
      hsk20Count,
      hsk30Count,
    },
  };
}

// Realm definitions for HSK 2.0 with rich scenic art
const HSK20_REALMS = [
  {
    level: "HSK 1",
    chineseName: "洛阳城",
    realmName: "Lạc Dương Cổ Đô",
    chapter: "Chương I",
    targetWords: "150 từ vựng",
    desc: "Khởi nguồn vạn dặm: Bảng chữ cái Pinyin, phát âm chuẩn, số đếm và chào hỏi.",
    bgImage: "/map/luoyang.jpg",
    accentColor: "#D97706",
    badgeBg: "bg-amber-600",
    sampleWords: [
      { hanzi: "你好", pinyin: "nǐ hǎo", meaning: "Xin chào" },
      { hanzi: "谢谢", pinyin: "xiè xie", meaning: "Cảm ơn" },
      { hanzi: "再见", pinyin: "zài jiàn", meaning: "Tạm biệt" },
      { hanzi: "朋友", pinyin: "péng you", meaning: "Bạn bè" },
    ],
  },
  {
    level: "HSK 2",
    chineseName: "成都竹谷",
    realmName: "Rừng Trúc Thành Đô",
    chapter: "Chương II",
    targetWords: "300 từ vựng",
    desc: "Giao tiếp đời thường: Ẩm thực Tứ Xuyên, hỏi đường, mua bán chợ phiên và đi lại.",
    bgImage: "/map/chengdu.jpg",
    accentColor: "#059669",
    badgeBg: "bg-emerald-600",
    sampleWords: [
      { hanzi: "准备", pinyin: "zhǔn bèi", meaning: "Chuẩn bị" },
      { hanzi: "便宜", pinyin: "pián yi", meaning: "Rẻ" },
      { hanzi: "公共汽车", pinyin: "gōng gòng qì chē", meaning: "Xe buýt" },
      { hanzi: "帮助", pinyin: "bāng zhù", meaning: "Giúp đỡ" },
    ],
  },
  {
    level: "HSK 3",
    chineseName: "夜上海",
    realmName: "Phồn Hoa Thượng Hải",
    chapter: "Chương III",
    targetWords: "600 từ vựng",
    desc: "Thực chiến đô thị: Công sở, lữ hành du lịch, trao đổi thư từ và đời sống xã hội.",
    bgImage: "/map/shanghai.jpg",
    accentColor: "#0284C7",
    badgeBg: "bg-sky-600",
    sampleWords: [
      { hanzi: "打算", pinyin: "dǎ suàn", meaning: "Dự định" },
      { hanzi: "决定", pinyin: "jué dìng", meaning: "Quyết định" },
      { hanzi: "环境", pinyin: "huán jìng", meaning: "Môi trường" },
      { hanzi: "解决", pinyin: "jiě jué", meaning: "Giải quyết" },
    ],
  },
  {
    level: "HSK 4",
    chineseName: "紫禁之巅",
    realmName: "Tử Cấm Hoàng Thành",
    chapter: "Chương IV",
    targetWords: "1.200 từ vựng",
    desc: "Đỉnh cao Hán ngữ: Hùng biện, triết lý, viết luận văn và đàm phán thương mại.",
    bgImage: "/map/forbidden_city.jpg",
    accentColor: "#7C3AED",
    badgeBg: "bg-purple-600",
    sampleWords: [
      { hanzi: "项目", pinyin: "xiàng mù", meaning: "Dự án" },
      { hanzi: "经验", pinyin: "jīng yàn", meaning: "Kinh nghiệm" },
      { hanzi: "贸易", pinyin: "mào yì", meaning: "Thương mại" },
      { hanzi: "责任", pinyin: "zé rèn", meaning: "Trách nhiệm" },
    ],
  },
  {
    level: "HSK 5",
    chineseName: "敦煌莫高",
    realmName: "Đôn Hoàng Cổ Trấn",
    chapter: "Chương V",
    targetWords: "2.500 từ vựng",
    desc: "Học thuật chuyên sâu: Đọc báo chí, xem phim ảnh không phụ đề và phân tích văn hóa.",
    bgImage: "/map/dunhuang.jpg",
    accentColor: "#EA580C",
    badgeBg: "bg-orange-600",
    sampleWords: [
      { hanzi: "学术", pinyin: "xué shù", meaning: "Học thuật" },
      { hanzi: "政策", pinyin: "zhèng cè", meaning: "Chính sách" },
      { hanzi: "投资", pinyin: "tóu zī", meaning: "Đầu tư" },
      { hanzi: "逻辑", pinyin: "luó ji", meaning: "Logic" },
    ],
  },
  {
    level: "HSK 6",
    chineseName: "昆仑之巅",
    realmName: "Côn Lôn Tuyết Sơn",
    chapter: "Chương VI",
    targetWords: "5.000+ từ vựng",
    desc: "Cảnh giới tối thượng: Thi ca cổ kim, thành ngữ điêu luyện và tư duy bản xứ thuần thục.",
    bgImage: "/map/kunlun.jpg",
    accentColor: "#0891B2",
    badgeBg: "bg-cyan-700",
    sampleWords: [
      { hanzi: "雄辩", pinyin: "xióng biàn", meaning: "Hùng biện" },
      { hanzi: "笔走龙蛇", pinyin: "bǐ zǒu lóng shé", meaning: "Bút pháp rồng bay" },
      { hanzi: "贯古通今", pinyin: "guàn gǔ tōng jīn", meaning: "Thấu suốt xưa nay" },
    ],
  },
];

// Realm definitions for HSK 3.0
const HSK30_REALMS = [
  {
    level: "HSK 1",
    chineseName: "洛阳城",
    realmName: "Lạc Dương Cổ Đô",
    chapter: "Chương I",
    targetWords: "500 từ vựng",
    desc: "Khởi đầu chuẩn mới: Nền móng ngữ âm chuẩn xác và 500 từ vựng sơ cấp căn bản.",
    bgImage: "/map/luoyang.jpg",
    accentColor: "#D97706",
    badgeBg: "bg-amber-600",
    sampleWords: [
      { hanzi: "您好", pinyin: "nín hǎo", meaning: "Chào ngài" },
      { hanzi: "学习", pinyin: "xué xí", meaning: "Học tập" },
      { hanzi: "汉语", pinyin: "hàn yǔ", meaning: "Tiếng Hán" },
      { hanzi: "苹果", pinyin: "píng guǒ", meaning: "Quả táo" },
    ],
  },
  {
    level: "HSK 2",
    chineseName: "成都竹谷",
    realmName: "Rừng Trúc Thành Đô",
    chapter: "Chương II",
    targetWords: "1.272 từ vựng",
    desc: "Mở rộng giao tiếp: Sinh hoạt hằng ngày, mua sắm trực tuyến và thanh toán số.",
    bgImage: "/map/chengdu.jpg",
    accentColor: "#059669",
    badgeBg: "bg-emerald-600",
    sampleWords: [
      { hanzi: "欢迎", pinyin: "huān yíng", meaning: "Hoan nghênh" },
      { hanzi: "介绍", pinyin: "jiè shào", meaning: "Giới thiệu" },
      { hanzi: "出租车", pinyin: "chū zū chē", meaning: "Taxi" },
      { hanzi: "满意", pinyin: "mǎn yì", meaning: "Hài lòng" },
    ],
  },
  {
    level: "HSK 3",
    chineseName: "夜上海",
    realmName: "Phồn Hoa Thượng Hải",
    chapter: "Chương III",
    targetWords: "2.245 từ vựng",
    desc: "Vững vàng sơ cấp: Hoàn thiện trọn vẹn toàn bộ kiến thức sơ cấp chuẩn HSK 3.0.",
    bgImage: "/map/shanghai.jpg",
    accentColor: "#0284C7",
    badgeBg: "bg-sky-600",
    sampleWords: [
      { hanzi: "贯通", pinyin: "guàn tōng", meaning: "Thông suốt" },
      { hanzi: "跨越", pinyin: "kuà yuè", meaning: "Vượt qua" },
      { hanzi: "荣誉", pinyin: "róng yù", meaning: "Danh dự" },
      { hanzi: "凯旋", pinyin: "kǎi xuán", meaning: "Khải hoàn" },
    ],
  },
  {
    level: "HSK 4",
    chineseName: "紫禁之巅",
    realmName: "Tử Cấm Hoàng Thành",
    chapter: "Chương IV",
    targetWords: "3.245 từ vựng",
    desc: "Trung cấp thực chiến: Phỏng vấn việc làm, công nghệ AI, dữ liệu lớn và thuật toán.",
    bgImage: "/map/forbidden_city.jpg",
    accentColor: "#7C3AED",
    badgeBg: "bg-purple-600",
    sampleWords: [
      { hanzi: "人工智能", pinyin: "rén gōng zhì néng", meaning: "Trí tuệ nhân tạo" },
      { hanzi: "大数据", pinyin: "dà shù jù", meaning: "Dữ liệu lớn" },
      { hanzi: "算法", pinyin: "suàn fǎ", meaning: "Thuật toán" },
      { hanzi: "创新", pinyin: "chuàng xīn", meaning: "Đổi mới" },
    ],
  },
  {
    level: "HSK 5",
    chineseName: "敦煌莫高",
    realmName: "Đôn Hoàng Cổ Trấn",
    chapter: "Chương V",
    targetWords: "4.316 từ vựng",
    desc: "Học thuật & Đàm phán: Thuyết trình học thuật, di sản con đường tơ lụa và khảo cổ.",
    bgImage: "/map/dunhuang.jpg",
    accentColor: "#EA580C",
    badgeBg: "bg-orange-600",
    sampleWords: [
      { hanzi: "丝绸之路", pinyin: "sī chóu zhī lù", meaning: "Con đường tơ lụa" },
      { hanzi: "传承", pinyin: "chuán chéng", meaning: "Kế thừa" },
      { hanzi: "考古", pinyin: "kǎo gǔ", meaning: "Khảo cổ" },
      { hanzi: "兴衰", pinyin: "xīng shuāi", meaning: "Hưng suy" },
    ],
  },
  {
    level: "HSK 6",
    chineseName: "昆仑之巅",
    realmName: "Côn Lôn Tuyết Sơn",
    chapter: "Chương VI",
    targetWords: "11.000+ từ vựng",
    desc: "Cảnh giới tối cao: Nghiên cứu chuyên sâu, dịch thuật chuyên gia và văn hóa uyên bác.",
    bgImage: "/map/kunlun.jpg",
    accentColor: "#0891B2",
    badgeBg: "bg-cyan-700",
    sampleWords: [
      { hanzi: "天尊", pinyin: "tiān zūn", meaning: "Thiên tôn" },
      { hanzi: "独孤求败", pinyin: "dú gū qiú bài", meaning: "Độc cô cầu bại" },
      { hanzi: "封神", pinyin: "fēng shén", meaning: "Phong thần" },
      { hanzi: "无双", pinyin: "wú shuāng", meaning: "Vô song" },
    ],
  },
];

const ARCADE_GAMES = [
  {
    id: "shootout",
    name: "Sút Phạt Đền HSK",
    tag: "Penalty 3D",
    desc: "Chọn từ chính xác điền vào chỗ trống để sút tung lưới thủ môn ghi bàn thắng tuyệt đỉnh trong sân vận động rực lửa.",
    bgImage: r2Asset("/game/shootout_stadium_bg.jpg"),
    icon: Trophy,
    color: "bg-emerald-600",
    link: "/games?mode=shootout",
  },
  {
    id: "ztype",
    name: "Chiến Cơ Phiên Âm (ZType)",
    tag: "Bắn Phím",
    desc: "Luyện phản xạ gõ Pinyin nhanh và chính xác trên bàn phím để phóng tia Plasma bắn hạ phi thuyền HSK.",
    bgImage: r2Asset("/images/hsk_hero.png"),
    icon: Zap,
    color: "bg-indigo-600",
    link: "/games?mode=ztype",
  },
  {
    id: "dragon",
    name: "Bao Bao Vượt Ải",
    tag: "Lướt Mây",
    desc: "Cùng Gấu Trúc Bao Bao cưỡi Cân Đẩu Vân bay lượn chín tầng mây, vượt qua cổng chữ Hán chính xác để thu thập ngọc quý.",
    bgImage: r2Asset("/game/flappy_dragon_bg.jpg"),
    icon: Flame,
    color: "bg-amber-600",
    link: "/games?mode=dragon",
  },
];

export default function Home({ loaderData }: Route.ComponentProps) {
  const { user, featuredLessons, sampleVocabularies, stats } = loaderData;
  const { openLogin, openRegister } = useAuth();
  const { pushToast } = useToast();

  const [vocabIndex, setVocabIndex] = useState(0);
  const [selectedStandard, setSelectedStandard] = useState<"HSK20" | "HSK30">("HSK20");

  const defaultVocabs = [
    {
      chinese: "学习",
      pinyin: "xué xí",
      meaningVi: "Học tập",
      exampleChinese: "我很喜欢学习汉语。",
      exampleMeaning: "Tôi rất thích học tiếng Trung.",
      level: "HSK 1",
    },
    {
      chinese: "朋友",
      pinyin: "péng you",
      meaningVi: "Bạn bè",
      exampleChinese: "我们是一辈子的好朋友。",
      exampleMeaning: "Chúng tôi là bạn tốt của nhau cả đời.",
      level: "HSK 2",
    },
    {
      chinese: "坚持",
      pinyin: "jiān chí",
      meaningVi: "Kiên trì",
      exampleChinese: "每天坚持学习一点点。",
      exampleMeaning: "Mỗi ngày kiên trì học một chút.",
      level: "HSK 3",
    },
  ];

  const currentVocabList = sampleVocabularies.length > 0 ? sampleVocabularies : defaultVocabs;
  const currentVocab = currentVocabList[vocabIndex % currentVocabList.length];

  const handleNextVocab = () => {
    sound.playWoodblock();
    setVocabIndex((prev) => (prev + 1) % currentVocabList.length);
  };

  const speakWord = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "zh-CN";
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  const activeRealms = selectedStandard === "HSK20" ? HSK20_REALMS : HSK30_REALMS;

  return (
    <SiteLayout user={user}>
      <div className="min-h-screen bg-[#FDFBF7] text-slate-900 selection:bg-amber-100 selection:text-amber-900">
        {/* ========================================================================= */}
        {/* 1. HERO SECTION (Warm Oriental Atmosphere & Fullscreen 100vh Viewport)     */}
        {/* ========================================================================= */}
        <section className="relative overflow-hidden border-b border-amber-900/10 bg-gradient-to-b from-[#FAF4EC] via-[#FDFBF7] to-[#FDFBF7] min-h-[calc(100vh-4rem)] flex flex-col justify-between py-6 sm:py-8 lg:py-10">
          {/* Subtle oriental decorative ambient glows */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-red-600/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/[0.02] rounded-full blur-3xl pointer-events-none" />

          {/* Main Centered Content */}
          <div className="my-auto mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 gap-8 sm:gap-10 lg:gap-12 lg:grid-cols-12 lg:items-center">
              {/* Left Column: Hero Copy & Actions */}
              <div className="lg:col-span-7 space-y-5 sm:space-y-6">
                <div className="inline-flex items-center gap-2.5 rounded-full border border-amber-300 bg-amber-50/80 px-4 py-1.5 text-xs font-bold text-amber-900 shadow-2xs">
                  <ChineseLanternSVG className="h-4 w-4" />
                  <span>Chuẩn HSK 2.0 & HSK 3.0 · Khám Phá Vạn Dặm Giang Sơn</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] xl:text-6xl font-black tracking-tight text-slate-900 leading-[1.12]">
                  Chinh Phục Tiếng Trung <br />
                  <span className="text-red-700">Qua Bản Đồ Phiêu Lưu</span>
                </h1>

                <p className="max-w-xl text-base sm:text-lg text-slate-700 leading-relaxed font-medium">
                  Hệ thống 338 bài học chuẩn hóa kết hợp bản đồ 6 cố đô lịch sử, các đấu trường game rèn phản xạ và công nghệ huấn luyện phát âm thông minh.
                </p>

                {/* Primary Action Gateways */}
                <div className="flex flex-wrap items-center gap-3.5 pt-1">
                  <Link
                    to="/game-map"
                    onClick={() => sound.playWoodblock()}
                    className="inline-flex items-center justify-center gap-2.5 rounded-2xl bg-red-700 px-7 py-4 text-sm font-black text-white shadow-md shadow-red-900/20 hover:bg-red-800 active:scale-[0.98] transition cursor-pointer"
                  >
                    <Compass size={18} />
                    <span>Mở Bản Đồ Vượt Ải</span>
                    <ArrowRight size={16} />
                  </Link>

                  <Link
                    to="/games"
                    onClick={() => sound.playWoodblock()}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-6 py-4 text-sm font-bold text-slate-800 shadow-2xs hover:bg-amber-50/50 hover:border-amber-400 transition cursor-pointer"
                  >
                    <Gamepad2 size={18} className="text-amber-600" />
                    <span>Đấu Trường Mini-Games</span>
                  </Link>
                </div>

                {/* Living Milestones */}
                <div className="flex flex-wrap items-center gap-5 sm:gap-6 pt-3 text-xs font-semibold text-slate-600 border-t border-amber-900/10">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-600" />
                    <span><strong className="text-slate-900 text-sm font-black">{stats.totalLessons}</strong> Bài học HSK</span>
                  </div>
                  <div className="h-4 w-px bg-slate-300 hidden sm:block" />
                  <div className="flex items-center gap-2">
                    <BookMarked size={16} className="text-amber-600" />
                    <span><strong className="text-slate-900 text-sm font-black">{stats.totalVocabularies}+</strong> Từ vựng & ngữ pháp</span>
                  </div>
                  <div className="h-4 w-px bg-slate-300 hidden sm:block" />
                  <div className="flex items-center gap-2">
                    <Shield size={16} className="text-red-600" />
                    <span>6 Vùng Đất Cố Đô</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Authentic Bamboo/Silk Hanzi Card */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="w-full max-w-md relative overflow-hidden rounded-3xl border-2 border-amber-200/90 bg-white p-6 sm:p-7 shadow-xl shadow-amber-900/5 text-slate-900">
                  <div className="flex items-center justify-between border-b border-amber-100 pb-3.5">
                    <div className="flex items-center gap-2">
                      <span className="flex h-2.5 w-2.5 rounded-full bg-red-600" />
                      <span className="text-xs font-black uppercase tracking-wider text-slate-600">
                        Thẻ Từ Vựng Học Nhanh
                      </span>
                    </div>
                    {currentVocab.level && (
                      <span className="rounded-lg bg-amber-100 px-2.5 py-0.5 text-xs font-black text-amber-900 border border-amber-200">
                        {currentVocab.level}
                      </span>
                    )}
                  </div>

                  {/* Character Showcase */}
                  <div className="py-5 text-center">
                    <div className="font-hanzi text-5xl sm:text-6xl font-bold text-slate-900 drop-shadow-xs tracking-wider">
                      {currentVocab.chinese}
                    </div>
                    <div className="mt-1.5 text-xl font-bold text-amber-800 font-mono">
                      {currentVocab.pinyin}
                    </div>
                    <div className="mt-1.5 text-sm sm:text-base font-bold text-slate-700">
                      {currentVocab.meaningVi}
                    </div>

                    <div className="mt-3.5 flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => speakWord(currentVocab.chinese)}
                        className="inline-flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-300 px-4 py-2 text-xs font-bold text-amber-900 hover:bg-amber-100 transition cursor-pointer shadow-2xs"
                      >
                        <Volume2 size={15} className="text-amber-700" />
                        <span>Nghe Phát Âm Chuẩn</span>
                      </button>
                    </div>
                  </div>

                  {/* Example Sentence Box */}
                  {currentVocab.exampleChinese && (
                    <div className="rounded-2xl border border-amber-200/70 bg-[#FAF6F0] p-3.5 text-left text-xs space-y-1">
                      <p className="font-bold text-slate-900 leading-relaxed">{currentVocab.exampleChinese}</p>
                      <p className="text-slate-600">{currentVocab.exampleMeaning}</p>
                    </div>
                  )}

                  {/* Card Controls */}
                  <div className="mt-4 flex items-center justify-between pt-3 border-t border-amber-100 text-xs">
                    <span className="text-slate-400 font-medium">
                      Thẻ {(vocabIndex % currentVocabList.length) + 1} / {currentVocabList.length}
                    </span>
                    <button
                      type="button"
                      onClick={handleNextVocab}
                      className="inline-flex items-center gap-1.5 font-bold text-red-700 hover:text-red-900 transition cursor-pointer"
                    >
                      <Shuffle size={13} />
                      <span>Đổi từ khác</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Scroll Prompt */}
          <div className="relative z-10 w-full pt-4 pb-1 text-center hidden md:flex flex-col items-center justify-center">
            <a
              href="#realms-matrix"
              className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-white/80 backdrop-blur-xs px-3.5 py-1 text-xs font-bold text-slate-600 hover:text-red-700 hover:border-red-300 shadow-2xs transition animate-bounce duration-1000"
            >
              <span>Khám Phá 6 Đại Cố Đô HSK</span>
              <ChevronDown size={14} className="text-red-600" />
            </a>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 2. HSK REALMS MATRIX (Bản Đồ 6 Cảnh Giới Cấp Độ với Ảnh Cố Đô)             */}
        {/* ========================================================================= */}
        <section id="realms-matrix" className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16 md:py-24 scroll-mt-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3.5 py-1 text-xs font-black text-amber-900 border border-amber-300 mb-2">
                <Layers size={13} />
                <span>6 Chặng Đường Giang Sơn</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
                Lộ Trình Cấp Độ HSK
              </h2>
              <p className="mt-1 text-sm text-slate-600 font-medium">
                Mỗi cấp độ là một vùng đất văn hóa với mục tiêu từ vựng và bài thi tương ứng
              </p>
            </div>

            {/* Standard Switcher Pill */}
            <div className="flex items-center rounded-2xl border border-slate-300 bg-white p-1.5 shadow-2xs self-start sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  sound.playWoodblock();
                  setSelectedStandard("HSK20");
                }}
                className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-black transition cursor-pointer ${
                  selectedStandard === "HSK20"
                    ? "bg-red-700 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <ChineseLanternSVG className="h-3.5 w-3.5" />
                <span>HSK 2.0</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  sound.playWoodblock();
                  setSelectedStandard("HSK30");
                }}
                className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-black transition cursor-pointer ${
                  selectedStandard === "HSK30"
                    ? "bg-emerald-700 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Sparkles size={13} />
                <span>HSK 3.0</span>
              </button>
            </div>
          </div>

          {/* 6 Scenic Postcard Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeRealms.map((realm, rIdx) => {
              const targetUrl =
                selectedStandard === "HSK20"
                  ? `/game-map?standard=HSK20&level=${encodeURIComponent(realm.level)}&realm=${rIdx}`
                  : `/game-map?standard=HSK30&level=${encodeURIComponent(realm.level)}&realm=${rIdx}`;

              return (
                <Link
                  key={`${selectedStandard}-${realm.level}-${rIdx}`}
                  to={targetUrl}
                  prefetch="intent"
                  className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs hover:border-amber-300 hover:shadow-lg transition-all cursor-pointer"
                >
                  <div>
                    {/* Photo Top Cover */}
                    <div className="relative h-36 w-full overflow-hidden bg-slate-900">
                      <img
                        src={r2Asset(realm.bgImage)}
                        alt={realm.realmName}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent" />

                      {/* Top Floating Tags */}
                      <div className="absolute top-3.5 left-3.5 flex items-center gap-2">
                        <span className={`rounded-xl px-3 py-1 text-xs font-black text-white shadow-xs ${realm.badgeBg}`}>
                          {realm.chapter} · {realm.level}
                        </span>
                      </div>

                      {/* Chinese Watermark */}
                      <div className="absolute right-3.5 bottom-2.5 font-hanzi text-2xl font-bold text-white/90 drop-shadow-md">
                        {realm.chineseName}
                      </div>
                    </div>

                    {/* Card Content Body */}
                    <div className="p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-black text-slate-900 group-hover:text-red-700 transition-colors">
                          {realm.realmName}
                        </h3>
                        <span className="flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                          <Target size={11} />
                          {realm.targetWords}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed font-medium">
                        {realm.desc}
                      </p>

                      {/* Sample Vocabulary Chips with Audio */}
                      <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                        {realm.sampleWords.map((w) => (
                          <button
                            key={w.hanzi}
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              speakWord(w.hanzi);
                            }}
                            title={`${w.pinyin}: ${w.meaning}`}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-[#FAF8F5] px-2 py-1 text-xs font-medium text-slate-800 hover:border-red-300 hover:text-red-700 transition cursor-pointer"
                          >
                            <span className="font-hanzi font-bold">{w.hanzi}</span>
                            <Volume2 size={11} className="text-slate-400" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. GAMIFICATION ARCADE (6 Đấu Trường Trò Chơi Hán Ngữ)                     */}
        {/* ========================================================================= */}
        <section className="border-t border-amber-900/10 bg-[#FAF6F0] py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-red-100 px-3.5 py-1 text-xs font-black text-red-900 border border-red-200 mb-2">
                  <Gamepad2 size={14} className="text-red-700" />
                  <span>Rèn Luyện Đa Giác Quan</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
                  Đấu Trường Mini-Games
                </h2>
                <p className="mt-1 text-sm text-slate-600 font-medium">
                  Vừa chơi vừa củng cố phản xạ chữ Hán, thanh điệu Pinyin và ngữ pháp câu
                </p>
              </div>

              <Link
                to="/games"
                className="inline-flex items-center gap-1.5 text-xs font-black text-red-700 hover:text-red-900 transition"
              >
                <span>Xem tất cả trò chơi</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            {/* 6 Game Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {ARCADE_GAMES.map((game) => {
                const { icon: GameIcon } = game;
                return (
                  <Link
                    key={game.id}
                    to={game.link}
                    prefetch="intent"
                    className="group relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs hover:border-amber-300 hover:shadow-lg transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-3.5">
                      <div className="flex items-center justify-between">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${game.color} text-white shadow-xs`}>
                          <GameIcon size={22} />
                        </div>
                        <span className="rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-[11px] font-black uppercase text-amber-900">
                          {game.tag}
                        </span>
                      </div>

                      <h3 className="text-lg font-black text-slate-900 group-hover:text-red-700 transition-colors">
                        {game.name}
                      </h3>

                      <p className="text-xs text-slate-600 leading-relaxed font-medium">
                        {game.desc}
                      </p>
                    </div>

                    <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-black text-slate-700 group-hover:text-red-700">
                      <span>Vào chơi ngay</span>
                      <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>



        {/* ========================================================================= */}
        {/* 5. CALLOUT BANNER WITH MASCOT BAO BAO (Đồng Hành Vạn Dặm)                 */}
        {/* ========================================================================= */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 md:pb-24">
          <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-red-800 via-red-700 to-amber-700 p-8 sm:p-12 text-white shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-8 space-y-4">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3.5 py-1 text-xs font-black text-amber-200 backdrop-blur-md">
                  <ChineseLanternSVG className="h-4 w-4" />
                  <span>Khởi Đầu Ngay Hôm Nay</span>
                </span>

                <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight">
                  Sẵn Sàng Chinh Phục Hán Ngữ Cùng Bảo Bảo?
                </h2>

                <p className="text-sm sm:text-base text-amber-100 font-medium leading-relaxed max-w-lg">
                  Theo dõi tiến trình học tập, mở khóa rương kho báu và thăng cấp cảnh giới mỗi ngày.
                </p>

                <div className="flex flex-wrap items-center gap-3.5 pt-3">
                  {user ? (
                    <Link
                      to="/game-map"
                      className="inline-flex items-center gap-2 rounded-2xl bg-white px-7 py-4 text-sm font-black text-red-800 shadow-md hover:bg-amber-50 transition cursor-pointer"
                    >
                      <Compass size={18} />
                      <span>Tiếp Tục Vượt Ải</span>
                    </Link>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={openRegister}
                        className="inline-flex items-center gap-2 rounded-2xl bg-white px-7 py-4 text-sm font-black text-red-800 shadow-md hover:bg-amber-50 transition cursor-pointer"
                      >
                        <GraduationCap size={18} />
                        <span>Tạo Tài Khoản Miễn Phí</span>
                      </button>
                      <button
                        type="button"
                        onClick={openLogin}
                        className="inline-flex items-center gap-2 rounded-2xl bg-red-950/40 px-6 py-4 text-sm font-bold text-white border border-white/20 hover:bg-red-950/60 transition cursor-pointer"
                      >
                        <span>Đăng Nhập</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Mascot Bao Bao Avatar */}
              <div className="md:col-span-4 flex justify-center">
                <div className="rounded-3xl border border-white/20 bg-white/10 p-6 backdrop-blur-md text-center shadow-lg max-w-xs">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center">
                    <MascotPandaSVG className="h-14 w-14 animate-bounce" />
                  </div>
                  <h4 className="mt-3 text-base font-black text-white">Bao Bao (宝宝)</h4>
                  <p className="mt-1 text-xs text-amber-200 font-medium italic">
                    “Mỗi ngày vượt 1 ải, 30 ngày tự tin trò chuyện Hán ngữ!”
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </SiteLayout>
  );
}
