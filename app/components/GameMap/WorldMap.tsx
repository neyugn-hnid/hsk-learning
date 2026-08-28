import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router";
import { sound } from "~/lib/sound";
import {
  addExpAndGems,
  loadUserStats,
  type UserStats,
  isChestClaimed,
  claimChestReward,
  getOpenedChestsList,
} from "~/lib/gamification";
import { useToast } from "~/components/Toast";
import {
  GemDiamondSVG,
  ChineseLanternSVG,
  TreasureChestSVG,
  MascotPandaSVG,
  StreakFlameSVG,
  ImperialLogoSVG,
  ZTypeFighterSVG,
  MahjongTileSVG,
  MemoryGardenSVG,
} from "~/components/Icons/CustomSVGs";
import { r2Asset } from "~/lib/assets";
import {
  Lock,
  Star,
  CheckCircle2,
  BookOpen,
  Sparkles,
  Play,
  Pencil,
  Zap,
  Crown,
  Volume2,
  X,
  Compass,
  ArrowRight,
  Swords,
  ChevronRight,
  Target,
  Gamepad2,
  Layers,
  Flame,
  TicketCheck,
  CheckCircle,
} from "lucide-react";

export type SampleVocab = {
  id: string;
  chinese: string;
  pinyin: string;
  meaningVi: string;
};

export type MapLesson = {
  id: string;
  title: string;
  level: string;
  source?: string;
  orderNo: number;
  description?: string | null;
  vocabCount?: number;
  grammarCount?: number;
  quizCount?: number;
  sampleVocabs?: SampleVocab[];
  completed?: boolean;
  score?: number;
  stars?: number;
};

interface WorldMapProps {
  lessons: MapLesson[];
  user?: any;
}

// Realm definitions with clean Light Theme & Solid Colors (No Gradients)
const HSK20_REALMS = [
  {
    id: "realm-hsk1",
    level: "HSK 1",
    chineseName: "洛阳城",
    regionName: "Tân Thủ Thôn & Cố Đô Lạc Dương",
    shortName: "Lạc Dương Cổ Đô",
    chapter: "Chương I",
    subtitle: "Khởi nguồn vạn dặm · Nhập môn căn bản",
    description: "Khám phá cái nôi văn hóa Hoa Hạ: Chào hỏi, số đếm, gia đình và những nét bút đầu tiên.",
    bgImage: "/map/luoyang.jpg",
    accentColor: "#D97706",
    primaryBg: "bg-amber-600",
    badgeBg: "bg-amber-600 text-white",
    cardBorder: "border-amber-300",
    lightTagBg: "bg-amber-50 text-amber-800 border-amber-200",
    bossTitle: "Tú Tài Lạc Dương Thành",
    bossHanzi: "秀才",
    targetWords: 150,
    requiredLevel: 1,
    environmentTag: "Cố Đô · Hoa Đào Nở",
  },
  {
    id: "realm-hsk2",
    level: "HSK 2",
    chineseName: "成都竹谷",
    regionName: "Thung Lũng Rừng Trúc & Thành Đô",
    shortName: "Rừng Trúc Thành Đô",
    chapter: "Chương II",
    subtitle: "Giao tiếp đời thường · Ẩm thực & Mua sắm",
    description: "Băng qua rừng trúc xanh ngát xứ Ba Thục: Ẩm thực Tứ Xuyên, hỏi đường, mua bán chợ phiên.",
    bgImage: "/map/chengdu.jpg",
    accentColor: "#059669",
    primaryBg: "bg-emerald-600",
    badgeBg: "bg-emerald-600 text-white",
    cardBorder: "border-emerald-300",
    lightTagBg: "bg-emerald-50 text-emerald-800 border-emerald-200",
    bossTitle: "Trưởng Lão Rừng Trúc Tứ Xuyên",
    bossHanzi: "长老",
    targetWords: 300,
    requiredLevel: 2,
    environmentTag: "Rừng Trúc · Ba Thục",
  },
  {
    id: "realm-hsk3",
    level: "HSK 3",
    chineseName: "夜上海",
    regionName: "Bến Thượng Hải & Tây Hồ Hàng Châu",
    shortName: "Phồn Hoa Thượng Hải",
    chapter: "Chương III",
    subtitle: "Thực chiến đời sống · Thương mại & Du lịch",
    description: "Hòa mình vào ánh đèn phồn hoa bến Thượng Hải và nét thơ mộng Tây Hồ: Công sở, lữ hành, văn hóa.",
    bgImage: "/map/shanghai.jpg",
    accentColor: "#0284C7",
    primaryBg: "bg-sky-600",
    badgeBg: "bg-sky-600 text-white",
    cardBorder: "border-sky-300",
    lightTagBg: "bg-sky-50 text-sky-800 border-sky-200",
    bossTitle: "Đại Phú Thương Bến Thượng Hải",
    bossHanzi: "富商",
    targetWords: 600,
    requiredLevel: 3,
    environmentTag: "Bến Cảng · Đô Thị",
  },
  {
    id: "realm-hsk4",
    level: "HSK 4",
    chineseName: "紫禁之巅",
    regionName: "Cố Cung Tử Cấm Thành & Đỉnh Hoa Sơn",
    shortName: "Tử Cấm Hoàng Thành",
    chapter: "Chương IV",
    subtitle: "Đỉnh cao Hán ngữ · Hùng biện & Luận đạo",
    description: "Chạm tới đỉnh cao uy nghi của Tử Cấm Thành và tuyệt đỉnh kiếm khí Hoa Sơn: Xã hội, triết lý, kinh tế.",
    bgImage: "/map/forbidden_city.jpg",
    accentColor: "#7C3AED",
    primaryBg: "bg-purple-600",
    badgeBg: "bg-purple-600 text-white",
    cardBorder: "border-purple-300",
    lightTagBg: "bg-purple-50 text-purple-800 border-purple-200",
    bossTitle: "Tuyệt Đỉnh Tông Sư Hoàng Cung",
    bossHanzi: "宗师",
    targetWords: 1200,
    requiredLevel: 4,
    environmentTag: "Hoàng Cung · Cố Cung",
  },
  {
    id: "realm-hsk5",
    level: "HSK 5",
    chineseName: "敦煌莫高",
    regionName: "Ốc Đảo Sa Mạc Đôn Hoàng & Con Đường Tơ Lụa",
    shortName: "Đôn Hoàng Cổ Trấn",
    chapter: "Chương V",
    subtitle: "Học thuật chuyên sâu · Đọc hiểu báo chí & Văn hóa",
    description: "Băng qua sa mạc cát vàng và hang động Mạc Cao ngàn năm: Đọc báo chí, xem phim ảnh, đàm phán thương mại và diễn giải văn hóa sâu sắc.",
    bgImage: "/map/dunhuang.jpg",
    accentColor: "#EA580C",
    primaryBg: "bg-orange-600",
    badgeBg: "bg-orange-600 text-white",
    cardBorder: "border-orange-300",
    lightTagBg: "bg-orange-50 text-orange-800 border-orange-200",
    bossTitle: "Đại Pháp Sư Đôn Hoàng Cổ Tự",
    bossHanzi: "法师",
    targetWords: 2500,
    requiredLevel: 5,
    environmentTag: "Sa Mạc · Mạc Cao",
  },
  {
    id: "realm-hsk6",
    level: "HSK 6",
    chineseName: "昆仑之巅",
    regionName: "Đỉnh Tuyết Sơn Côn Lôn & Vô Song Cảnh Giới",
    shortName: "Côn Lôn Tuyết Sơn",
    chapter: "Chương VI",
    subtitle: "Cảnh giới tối thượng · Ngôn ngữ chuẩn bản xứ",
    description: "Đứng trên đỉnh tuyết sơn Côn Lôn huyền thoại: Nắm trọn thi ca cổ kim, thành ngữ điêu luyện, hùng biện đỉnh cao và tư duy bản xứ thuần thục.",
    bgImage: "/map/kunlun.jpg",
    accentColor: "#0891B2",
    primaryBg: "bg-cyan-700",
    badgeBg: "bg-cyan-700 text-white",
    cardBorder: "border-cyan-300",
    lightTagBg: "bg-cyan-50 text-cyan-800 border-cyan-200",
    bossTitle: "Thiên Tôn Tuyết Sơn Côn Lôn",
    bossHanzi: "天尊",
    targetWords: 5000,
    requiredLevel: 6,
    environmentTag: "Tuyết Sơn · Côn Lôn",
  },
];

const HSK30_REALMS = [
  {
    id: "realm-hsk30-1",
    level: "HSK 1",
    chineseName: "洛阳城",
    regionName: "Tân Thủ Thôn & Cố Đô Lạc Dương",
    shortName: "Lạc Dương Cổ Đô",
    chapter: "Chương I",
    subtitle: "Khởi nguồn vạn dặm · Nhập môn căn bản (500 Từ)",
    description: "Khám phá cái nôi văn hóa Hoa Hạ: Xây dựng nền móng ngữ âm chuẩn xác, 500 từ vựng sơ cấp và giao tiếp căn bản.",
    bgImage: "/map/luoyang.jpg",
    accentColor: "#D97706",
    primaryBg: "bg-amber-600",
    badgeBg: "bg-amber-600 text-white",
    cardBorder: "border-amber-300",
    lightTagBg: "bg-amber-50 text-amber-800 border-amber-200",
    bossTitle: "Tú Tài Lạc Dương Thành",
    bossHanzi: "秀才",
    targetWords: 500,
    requiredLevel: 1,
    environmentTag: "Cố Đô · 500 Từ Vựng",
  },
  {
    id: "realm-hsk30-2",
    level: "HSK 2",
    chineseName: "成都竹谷",
    regionName: "Thung Lũng Rừng Trúc & Thành Đô",
    shortName: "Rừng Trúc Thành Đô",
    chapter: "Chương II",
    subtitle: "Giao tiếp đời thường · Ẩm thực & Mua sắm (1.272 Từ)",
    description: "Băng qua rừng trúc xanh ngát xứ Ba Thục: Tự tin đối thoại sinh hoạt hằng ngày, ẩm thực, hỏi đường và giao tiếp thực tế.",
    bgImage: "/map/chengdu.jpg",
    accentColor: "#059669",
    primaryBg: "bg-emerald-600",
    badgeBg: "bg-emerald-600 text-white",
    cardBorder: "border-emerald-300",
    lightTagBg: "bg-emerald-50 text-emerald-800 border-emerald-200",
    bossTitle: "Trưởng Lão Rừng Trúc Tứ Xuyên",
    bossHanzi: "长老",
    targetWords: 1272,
    requiredLevel: 2,
    environmentTag: "Rừng Trúc · 1.272 Từ Vựng",
  },
  {
    id: "realm-hsk30-3",
    level: "HSK 3",
    chineseName: "夜上海",
    regionName: "Bến Thượng Hải & Tây Hồ Hàng Châu",
    shortName: "Phồn Hoa Thượng Hải",
    chapter: "Chương III",
    subtitle: "Thực chiến đời sống · Thương mại & Du lịch (2.245 Từ)",
    description: "Hòa mình vào ánh đèn phồn hoa bến Thượng Hải: Hoàn thiện trọn vẹn toàn bộ giai đoạn Sơ Cấp HSK 3.0, sẵn sàng bước vào trung cấp.",
    bgImage: "/map/shanghai.jpg",
    accentColor: "#0284C7",
    primaryBg: "bg-sky-600",
    badgeBg: "bg-sky-600 text-white",
    cardBorder: "border-sky-300",
    lightTagBg: "bg-sky-50 text-sky-800 border-sky-200",
    bossTitle: "Đại Phú Thương Bến Thượng Hải",
    bossHanzi: "富商",
    targetWords: 2245,
    requiredLevel: 3,
    environmentTag: "Bến Cảng · 2.245 Từ Vựng",
  },
  {
    id: "realm-hsk30-4",
    level: "HSK 4",
    chineseName: "紫禁之巅",
    regionName: "Cố Cung Tử Cấm Thành & Đỉnh Hoa Sơn",
    shortName: "Tử Cấm Hoàng Thành",
    chapter: "Chương IV",
    subtitle: "Đỉnh cao Hán ngữ · Hùng biện & Luận đạo (3.245 Từ)",
    description: "Chạm tới đỉnh cao uy nghi của Tử Cấm Thành: Thảo luận các chủ đề xã hội, văn hóa, kinh tế, đọc hiểu đoạn văn dài và viết biểu đạt mạch lạc.",
    bgImage: "/map/forbidden_city.jpg",
    accentColor: "#7C3AED",
    primaryBg: "bg-purple-600",
    badgeBg: "bg-purple-600 text-white",
    cardBorder: "border-purple-300",
    lightTagBg: "bg-purple-50 text-purple-800 border-purple-200",
    bossTitle: "Tuyệt Đỉnh Tông Sư Hoàng Cung",
    bossHanzi: "宗师",
    targetWords: 3245,
    requiredLevel: 4,
    environmentTag: "Hoàng Cung · 3.245 Từ Vựng",
  },
  {
    id: "realm-hsk30-5",
    level: "HSK 5",
    chineseName: "敦煌莫高",
    regionName: "Ốc Đảo Sa Mạc Đôn Hoàng & Con Đường Tơ Lụa",
    shortName: "Đôn Hoàng Cổ Trấn",
    chapter: "Chương V",
    subtitle: "Học thuật chuyên sâu · Đọc báo & Đàm phán (4.316 Từ)",
    description: "Băng qua sa mạc cát vàng và hang động Mạc Cao: Đọc báo chí chuyên ngành, thuyết trình bằng tiếng Trung, phân tích logic và đàm phán thương mại.",
    bgImage: "/map/dunhuang.jpg",
    accentColor: "#EA580C",
    primaryBg: "bg-orange-600",
    badgeBg: "bg-orange-600 text-white",
    cardBorder: "border-orange-300",
    lightTagBg: "bg-orange-50 text-orange-800 border-orange-200",
    bossTitle: "Đại Pháp Sư Đôn Hoàng Cổ Tự",
    bossHanzi: "法师",
    targetWords: 4316,
    requiredLevel: 5,
    environmentTag: "Sa Mạc · 4.316 Từ Vựng",
  },
  {
    id: "realm-hsk30-6",
    level: "HSK 6",
    chineseName: "昆仑之巅",
    regionName: "Đỉnh Tuyết Sơn Côn Lôn",
    shortName: "Côn Lôn Tuyết Sơn",
    chapter: "Chương VI · Tối Thượng",
    subtitle: "Cảnh giới tối thượng · Ngôn ngữ chuẩn bản xứ (11.000+ Từ)",
    description: "Đứng trên đỉnh tuyết sơn Côn Lôn huyền thoại: Nghiên cứu chuyên sâu, dịch thuật chuyên gia, lĩnh hội toàn diện văn hóa cổ kim và tư duy bản xứ thuần thục.",
    bgImage: "/map/kunlun.jpg",
    accentColor: "#0891B2",
    primaryBg: "bg-cyan-700",
    badgeBg: "bg-cyan-700 text-white",
    cardBorder: "border-cyan-300",
    lightTagBg: "bg-cyan-50 text-cyan-800 border-cyan-200",
    bossTitle: "Thiên Tôn Tuyết Sơn Côn Lôn",
    bossHanzi: "天尊",
    targetWords: 11092,
    requiredLevel: 6,
    environmentTag: "Tuyết Sơn · 11.000+ Từ",
  },
];

// Config for stage types in the expedition
function getStageMetadata(idx: number, isBoss: boolean) {
  if (isBoss) {
    return {
      type: "boss",
      tag: "Đại Chiến Boss",
      hanzi: "首领",
      Icon: Swords,
      color: "text-red-600",
      badgeBg: "bg-red-50 text-red-700 border-red-200",
      expReward: 100,
      gemReward: 40,
    };
  }
  const stages = [
    {
      type: "lesson",
      tag: "Từ Vựng & Hội Thoại",
      hanzi: "对话",
      Icon: BookOpen,
      color: "text-sky-600",
      badgeBg: "bg-sky-50 text-sky-700 border-sky-200",
      expReward: 35,
      gemReward: 15,
    },
    {
      type: "stroke",
      tag: "Múa Bút Thần Tốc",
      hanzi: "笔画",
      Icon: Pencil,
      color: "text-amber-600",
      badgeBg: "bg-amber-50 text-amber-700 border-amber-200",
      expReward: 40,
      gemReward: 18,
    },
    {
      type: "tone",
      tag: "Tone Ninja Chém Thanh",
      hanzi: "声调",
      Icon: Zap,
      color: "text-purple-600",
      badgeBg: "bg-purple-50 text-purple-700 border-purple-200",
      expReward: 45,
      gemReward: 20,
    },
    {
      type: "vocab",
      tag: "Thử Thách Từ Vựng",
      hanzi: "词汇",
      Icon: Flame,
      color: "text-rose-600",
      badgeBg: "bg-rose-50 text-rose-700 border-rose-200",
      expReward: 50,
      gemReward: 22,
    },
  ];
  return stages[idx % stages.length];
}

export function WorldMap({ lessons, user }: WorldMapProps) {
  const [searchParams] = useSearchParams();
  const isAdmin = user?.role === "ADMIN";

  const normalizeLevel = (lvl: string): string => {
    if (!lvl) return "";
    const clean = lvl.toLowerCase().replace(/\s/g, "");
    if (clean.includes("1") || clean.includes("bậc1") || clean.includes("hsk1")) return "1";
    if (clean.includes("2") || clean.includes("bậc2") || clean.includes("hsk2")) return "2";
    if (clean.includes("3") || clean.includes("bậc3") || clean.includes("hsk3")) return "3";
    if (clean.includes("4") || clean.includes("bậc4") || clean.includes("hsk4")) return "4";
    if (clean.includes("5") || clean.includes("bậc5") || clean.includes("hsk5")) return "5";
    if (clean.includes("6") || clean.includes("7") || clean.includes("8") || clean.includes("9") || clean.includes("bậc6") || clean.includes("hsk6")) return "6";
    return clean;
  };

  const initialStandard = (() => {
    const std = searchParams.get("standard") || searchParams.get("source");
    if (std === "HSK30" || std === "hsk30") return "HSK30";
    return "HSK20";
  })();

  const [selectedStandard, setSelectedStandard] = useState<"HSK20" | "HSK30">(initialStandard);

  const initialRealmIndex = (() => {
    const realms = initialStandard === "HSK20" ? HSK20_REALMS : HSK30_REALMS;
    const lvlParam = searchParams.get("level");
    const realmParam = searchParams.get("realm");
    if (realmParam !== null && !isNaN(Number(realmParam))) {
      return Math.max(0, Math.min(Number(realmParam), realms.length - 1));
    }
    if (lvlParam) {
      const targetNorm = normalizeLevel(lvlParam);
      const foundIdx = realms.findIndex((r) => normalizeLevel(r.level) === targetNorm);
      if (foundIdx !== -1) return foundIdx;
    }
    return 0;
  })();

  const [activeRealmIndex, setActiveRealmIndex] = useState(initialRealmIndex);
  const [selectedLesson, setSelectedLesson] = useState<MapLesson | null>(null);
  const [openedChests, setOpenedChests] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const list = getOpenedChestsList();
      const map: Record<string, boolean> = {};
      list.forEach((k) => {
        map[k] = true;
      });
      return map;
    } catch {
      return {};
    }
  });
  const [chestReward, setChestReward] = useState<{ amount: number; exp?: number; region: string } | null>(null);
  const [gamificationStats, setGamificationStats] = useState<UserStats>(() => loadUserStats());
  const [localCompletedIds, setLocalCompletedIds] = useState<string[]>([]);
  const [localUnlockedIds, setLocalUnlockedIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const savedCompleted = localStorage.getItem("completed_lessons");
      if (savedCompleted) setLocalCompletedIds(JSON.parse(savedCompleted));
      const savedUnlocked = localStorage.getItem("unlocked_lessons");
      if (savedUnlocked) setLocalUnlockedIds(JSON.parse(savedUnlocked));
      const list = getOpenedChestsList();
      const map: Record<string, boolean> = {};
      list.forEach((k) => {
        map[k] = true;
      });
      setOpenedChests(map);
    } catch (e) {}
  }, []);

  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<UserStats>;
      if (customEvent.detail) {
        setGamificationStats(customEvent.detail);
      } else {
        setGamificationStats(loadUserStats());
      }
    };
    window.addEventListener("hsk_stats_updated", handleUpdate);
    return () => window.removeEventListener("hsk_stats_updated", handleUpdate);
  }, []);

  // Close mini popover when clicking outside
  useEffect(() => {
    if (!selectedLesson) return;
    const handleOutsideClick = () => {
      setSelectedLesson(null);
    };
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, [selectedLesson]);

  // Sync state if URL search parameters change
  useEffect(() => {
    const std = searchParams.get("standard") || searchParams.get("source");
    const isHSK30 = std === "HSK30" || std === "hsk30";
    const currentStd = isHSK30 ? "HSK30" : "HSK20";
    setSelectedStandard(currentStd);

    const realms = isHSK30 ? HSK30_REALMS : HSK20_REALMS;
    const lvlParam = searchParams.get("level");
    const realmParam = searchParams.get("realm");
    let targetIdx = -1;

    if (realmParam !== null && !isNaN(Number(realmParam))) {
      targetIdx = Math.max(0, Math.min(Number(realmParam), realms.length - 1));
      setActiveRealmIndex(targetIdx);
    } else if (lvlParam) {
      const targetNorm = normalizeLevel(lvlParam);
      const foundIdx = realms.findIndex((r) => normalizeLevel(r.level) === targetNorm);
      if (foundIdx !== -1) {
        targetIdx = foundIdx;
        setActiveRealmIndex(foundIdx);
      }
    }

    // Auto scroll down smoothly to the realm stage if navigating with parameters
    if (realmParam !== null || lvlParam !== null) {
      setTimeout(() => {
        const stageEl = document.getElementById("adventure-stage");
        if (stageEl) {
          stageEl.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    }
  }, [searchParams]);

  const activeRealms = selectedStandard === "HSK20" ? HSK20_REALMS : HSK30_REALMS;
  const currentRealm = activeRealms[Math.min(activeRealmIndex, activeRealms.length - 1)];

  const filteredLessons = lessons.filter((l) => {
    if (selectedStandard === "HSK30") return l.source === "HSK30" || l.level.includes("Bậc");
    return l.source !== "HSK30";
  });

  // Build lessons list for each realm directly from database lessons
  const rawRealmsData = activeRealms.map((realm) => {
    const list = filteredLessons.filter(
      (l) => normalizeLevel(l.level) === normalizeLevel(realm.level)
    );

    const realmLessons: MapLesson[] = list.map((l) => {
      const isDone = isAdmin || Boolean(l.completed) || localCompletedIds.includes(l.id);
      return {
        ...l,
        completed: isDone,
        stars: isAdmin ? 3 : (l.stars || (isDone ? 3 : 0)),
      };
    });

    const totalStars = realmLessons.reduce((s, l) => s + (isAdmin ? 3 : (l.stars || (l.completed ? 3 : 0))), 0);
    const maxStars = Math.max(realmLessons.length * 3, 1);
    const progressPercent = isAdmin ? 100 : Math.min(100, Math.round((totalStars / maxStars) * 100));
    const completedCount = isAdmin ? realmLessons.length : realmLessons.filter((l) => l.completed).length;
    const isCompleted = realmLessons.length > 0 && completedCount >= realmLessons.length;

    return {
      ...realm,
      lessons: realmLessons,
      totalStars,
      maxStars,
      progressPercent,
      completedCount,
      isCompleted,
    };
  });

  // Quy tắc mở khóa đại lục HSK:
  // - Tài khoản ADMIN luôn MỞ KHÓA toàn bộ để tiện kiểm tra, quản lý.
  // - Với học viên: Đại lục đầu tiên (index 0 - HSK 1 / Bậc 1) luôn MỞ KHÓA.
  // - Đại lục N (HSK 2, 3, 4...) chỉ mở khóa khi đại lục (N - 1) đã HOÀN THÀNH 100% tất cả các bài học.
  const realmsData = rawRealmsData.map((realm, idx, arr) => {
    const isFirst = idx === 0;
    const prevRealm = idx > 0 ? arr[idx - 1] : null;
    const isUnlocked = isAdmin || isFirst || Boolean(prevRealm?.isCompleted);

    return {
      ...realm,
      isUnlocked,
      prevRealmName: prevRealm ? prevRealm.level : null,
    };
  });

  const { pushToast } = useToast();
  const activeRealmData = realmsData[activeRealmIndex] || realmsData[0];
  const chestKey = `${selectedStandard}-${activeRealmData.level}`;
  const isChestOpened = Boolean(openedChests[chestKey]);

  const completedStagesCount = activeRealmData.lessons.filter((l) => l.completed).length;
  const totalStagesCount = activeRealmData.lessons.length;
  const isRealmFullyCompleted = totalStagesCount > 0 && completedStagesCount >= totalStagesCount;

  const handleOpenChest = () => {
    if (isChestOpened || isChestClaimed(chestKey)) {
      setOpenedChests((prev) => ({ ...prev, [chestKey]: true }));
      pushToast("Rương hoàng kim của đại lục này đã được nhận trước đó.", "info");
      return;
    }
    if (!isRealmFullyCompleted) {
      sound.playWoodblock();
      sound.playIncorrect();
      pushToast(
        `Chưa thể mở rương! Bạn cần vượt qua toàn bộ ${totalStagesCount} ải (hiện đã xong ${completedStagesCount}/${totalStagesCount} ải) của ${activeRealmData.level}.`,
        "error"
      );
      return;
    }
    const claimRes = claimChestReward(chestKey, 200, 75);
    if (claimRes.alreadyClaimed) {
      setOpenedChests((prev) => ({ ...prev, [chestKey]: true }));
      pushToast("Rương hoàng kim của đại lục này đã được nhận trước đó.", "info");
      return;
    }
    sound.playLevelUp();
    sound.playCoin();
    setOpenedChests((prev) => ({ ...prev, [chestKey]: true }));
    setChestReward({ amount: 75, exp: 200, region: activeRealmData.regionName });
  };

  const speak = (text: string) => {
    if (typeof window === "undefined") return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "zh-CN";
    window.speechSynthesis?.speak(u);
  };

  return (
    <div className="w-full space-y-8 pb-16">
      {/* ========================================================================= */}
      {/* 1. TOP EXPEDITION CONTROL BAR (Light Porcelain Theme - Solid Colors)       */}
      {/* ========================================================================= */}
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-xs md:flex-row md:items-center md:justify-between md:px-8">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center">
            <ImperialLogoSVG className="h-12 w-12 drop-shadow-xs hover:scale-105 transition-transform" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black tracking-wide text-slate-900">BẢN ĐỒ THẾ GIỚI HÁN NGỮ</span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Chọn chuẩn học và vùng đất để tham gia vượt ải</p>
          </div>
        </div>

        {/* Standard Switcher Pill */}
        <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-100 p-1.5">
          <button
            type="button"
            onClick={() => {
              sound.playWoodblock();
              setSelectedStandard("HSK20");
              setActiveRealmIndex(0);
            }}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-black transition-all cursor-pointer ${
              selectedStandard === "HSK20"
                ? "bg-red-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ChineseLanternSVG className="h-4 w-4" />
            <span>HSK 2.0</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playWoodblock();
              setSelectedStandard("HSK30");
              setActiveRealmIndex(0);
            }}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-black transition-all cursor-pointer ${
              selectedStandard === "HSK30"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Sparkles size={14} />
            <span>HSK 3.0</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. REALM NAVIGATOR DECK (Solid Light Cards)                              */}
      {/* ========================================================================= */}
      <div>
        <div className="mb-3.5 flex items-center justify-between px-2">
          <h2 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500">
            <Layers size={14} className="text-red-600" />
            Danh Sách Đại Lục Vùng Đất
          </h2>
          <span className="text-xs text-slate-500 font-medium">Click chọn vùng để mở bản đồ ải</span>
        </div>

        {/* 2 Rows of 3 Realm Cards each */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {realmsData.map((realm, idx) => {
            const isActive = idx === activeRealmIndex;
            const isLocked = !realm.isUnlocked;

            return (
              <button
                key={realm.id}
                type="button"
                onClick={() => {
                  if (isLocked) {
                    sound.playWoodblock();
                    sound.playIncorrect();
                    pushToast(
                      `Cấp độ ${realm.level} đang bị khóa! Bạn cần hoàn thành tất cả các bài học của ${realm.prevRealmName} để mở khóa.`,
                      "error"
                    );
                    return;
                  }
                  sound.playWoodblock();
                  setActiveRealmIndex(idx);
                }}
                className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl text-left transition-all duration-200 cursor-pointer bg-white ${
                  isLocked
                    ? "border border-slate-200/80 opacity-65 grayscale-[35%] hover:border-slate-300"
                    : isActive
                    ? "border-2 border-red-600 shadow-md ring-2 ring-red-100"
                    : "border border-slate-200/80 hover:border-slate-300 hover:shadow-md"
                } h-52`}
              >
                {/* Photo Top Section with local image & subtle top shadow */}
                <div className="relative flex-1 w-full overflow-hidden">
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                    style={{ backgroundImage: `url(${r2Asset(realm.bgImage)})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-slate-950/20 to-transparent" />

                  {/* Top card header */}
                  <div className="relative z-10 flex items-start justify-between p-3.5">
                    {isLocked ? (
                      <div className="flex items-center gap-1.5 rounded-full bg-slate-900/75 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-black text-amber-300 border border-white/20 shadow-xs">
                        <Lock size={11} className="text-amber-400" />
                        <span>Khóa ({realm.prevRealmName})</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-xs ${realm.primaryBg}`}
                        >
                          {realm.chapter}
                        </span>
                        <span className="text-[10px] font-extrabold text-white bg-slate-900/60 px-2 py-0.5 rounded-full">
                          {realm.level}
                        </span>
                      </div>
                    )}

                    <span className="font-hanzi text-lg font-bold text-white/90 drop-shadow-sm">
                      {realm.chineseName}
                    </span>
                  </div>
                </div>

                {/* Bottom card content in clean solid white container */}
                <div className="relative z-10 p-3.5 bg-white border-t border-slate-100 rounded-b-3xl">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-slate-900 group-hover:text-red-600 transition-colors line-clamp-1">
                      {realm.shortName}
                    </h3>
                    <span className="flex items-center gap-1 text-[11px] font-extrabold text-amber-600">
                      {isLocked ? (
                        <span className="flex items-center gap-1 text-slate-400 font-bold text-[10px]">
                          <Lock size={11} /> Khóa
                        </span>
                      ) : (
                        <>
                          <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                          <span>{realm.totalStars}/{realm.maxStars}</span>
                        </>
                      )}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] font-medium text-slate-500 line-clamp-1">
                    {isLocked ? `Yêu cầu: Hoàn thành toàn bộ ${realm.prevRealmName}` : realm.subtitle}
                  </p>

                  {/* Progress bar */}
                  <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${realm.primaryBg}`}
                      style={{ width: `${realm.progressPercent}%` }}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MAIN ADVENTURE STAGE (The Immersive Realm Journey Canvas)              */}
      {/* ========================================================================= */}
      <div id="adventure-stage" className="grid grid-cols-1 gap-8 lg:grid-cols-12 scroll-mt-20">
        {/* LEFT/CENTER: The Journey Stage (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Realm Hero Billboard */}
          <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider text-white shadow-xs ${activeRealmData.primaryBg}`}
                  >
                    {activeRealmData.chapter} · {activeRealmData.level}
                  </span>
                  <span className="font-hanzi text-base font-bold text-slate-400">{activeRealmData.chineseName}</span>
                </div>
                <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                  {activeRealmData.regionName}
                </h2>
                <p className="max-w-xl text-xs sm:text-sm leading-relaxed text-slate-600 font-medium">
                  {activeRealmData.description}
                </p>
                <div className="flex flex-wrap items-center gap-2.5 pt-2">
                  <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 font-semibold">
                    <Target size={14} className="text-amber-600" />
                    <span>Mục tiêu: {activeRealmData.targetWords} từ vựng</span>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 font-semibold">
                    <Swords size={14} className="text-red-600" />
                    <span>Boss: {activeRealmData.bossTitle}</span>
                  </div>
                </div>
              </div>

              {/* Realm Completion Badge */}
              <div className="flex shrink-0 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center shadow-2xs min-w-[120px]">
                <span className="text-3xl font-black text-amber-600">{activeRealmData.progressPercent}%</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tiến Độ Vùng</span>
                <div className="mt-1 flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                  <span>{activeRealmData.totalStars}</span>
                  <span className="text-slate-400">/ {activeRealmData.maxStars}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* THE ADVENTURE TRAIL (Interactive 3D Stage Podiums - Light Theme)      */}
          {/* ===================================================================== */}
          <div className="relative rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-xs">
            {/* Stage Title */}
            <div className="mb-10 flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Compass size={18} className="text-red-600" />
                  Hành Trình Vượt Ải Lục Địa
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {!activeRealmData.isUnlocked
                    ? `Vùng đất này đang bị phong ấn. Hãy hoàn thành toàn bộ các bài học của ${activeRealmData.prevRealmName} trước!`
                    : "Nhấp vào từng ải để nhận nhiệm vụ và bắt đầu thử thách"}
                </p>
              </div>
              <span className="rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-xs font-bold text-slate-700">
                {activeRealmData.lessons.length} Ải Thử Thách
              </span>
            </div>

            {/* Stages Stack Container with Winding Path */}
            <div className="relative flex flex-col items-center space-y-12 py-4">
              {/* Connecting Dashed SVG Pathway */}
              <svg className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="none">
                <path
                  d="M 50% 5% C 25% 20%, 75% 40%, 50% 55% C 25% 70%, 75% 85%, 50% 95%"
                  fill="none"
                  stroke="#CBD5E1"
                  strokeWidth="4"
                  strokeDasharray="10 8"
                  strokeLinecap="round"
                />
              </svg>

              {/* Transparent backdrop to close popover on click outside */}
              {selectedLesson && (
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setSelectedLesson(null)}
                />
              )}

              {activeRealmData.lessons.map((lesson, idx) => {
                const isRealmLocked = !isAdmin && !activeRealmData.isUnlocked;
                const isCompleted = isAdmin || Boolean(lesson.completed) || localCompletedIds.includes(lesson.id);
                const prevLesson = idx > 0 ? activeRealmData.lessons[idx - 1] : null;
                const isPrevCompleted = prevLesson
                  ? isAdmin || Boolean(prevLesson.completed) || localCompletedIds.includes(prevLesson.id)
                  : true;
                const isCurrent = !isAdmin && !isCompleted && isPrevCompleted;
                const isUnlocked = isAdmin || (!isRealmLocked && (isCompleted || isCurrent || localUnlockedIds.includes(lesson.id)));
                const isLocked = !isUnlocked;
                const isBoss = idx === activeRealmData.lessons.length - 1;
                const meta = getStageMetadata(idx, isBoss);
                const { Icon: StageIcon } = meta;
                const starsCount = isAdmin ? 3 : (lesson.stars || (isCompleted ? 3 : 0));

                // Alternating horizontal offsets for winding RPG path feel
                const xOffsets = [
                  "sm:-translate-x-32",
                  "sm:translate-x-28",
                  "sm:-translate-x-24",
                  "sm:translate-x-32",
                  "sm:translate-x-0",
                ];
                const currentOffset = xOffsets[idx % xOffsets.length];

                // Node on left -> popover on right; Node on right -> popover on left
                const isRightPlaced = currentOffset.includes("-translate-x") || currentOffset === "sm:translate-x-0";
                const isSelected = selectedLesson?.id === lesson.id;

                return (
                  <div
                    key={lesson.id}
                    className={`relative flex flex-col items-center transition-transform duration-300 ${currentOffset} ${
                      isSelected ? "z-50" : "z-10"
                    }`}
                  >
                    {/* Compact Popover Speech Bubble attached to the side of the node */}
                    {isSelected && (
                      <div
                        className={`absolute z-50 w-72 sm:w-80 rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl text-slate-900 animate-in zoom-in-95 fade-in duration-150 text-left max-sm:bottom-[calc(100%+12px)] max-sm:left-1/2 max-sm:-translate-x-1/2 ${
                          isRightPlaced
                            ? "sm:left-[calc(100%+16px)] sm:top-1/2 sm:-translate-y-1/2"
                            : "sm:right-[calc(100%+16px)] sm:top-1/2 sm:-translate-y-1/2"
                        }`}
                      >
                        {/* Triangle Pointer pointing directly at the button */}
                        <div
                          className={`absolute h-4 w-4 rotate-45 bg-white border-slate-200 max-sm:left-1/2 max-sm:-bottom-2 max-sm:-translate-x-1/2 max-sm:border-b max-sm:border-r ${
                            isRightPlaced
                              ? "sm:-left-2 sm:top-1/2 sm:-translate-y-1/2 sm:border-l sm:border-b"
                              : "sm:-right-2 sm:top-1/2 sm:-translate-y-1/2 sm:border-r sm:border-t"
                          }`}
                        />

                        

                        {/* Title & Short Description */}
                        <div className="my-2.5 space-y-0.5">
                          <h4 className="text-sm font-black text-slate-900 line-clamp-1">
                            {lesson.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 font-medium line-clamp-2 leading-relaxed">
                            {lesson.description || "Nắm trọn từ vựng then chốt, ngữ pháp và bài tập thực chiến."}
                          </p>
                        </div>

                        {/* Rewards */}
                        <div className="flex items-center gap-1.5 mb-3">
                          <span className="flex items-center gap-1 rounded-lg bg-amber-50 border border-amber-200/80 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                            <Sparkles size={11} className="text-amber-600" />
                            +{meta.expReward} EXP
                          </span>
                          <span className="flex items-center gap-1 rounded-lg bg-sky-50 border border-sky-200/80 px-2 py-0.5 text-[10px] font-bold text-sky-800">
                            <GemDiamondSVG className="h-3 w-3" />
                            +{meta.gemReward} Gems
                          </span>
                          {lesson.vocabCount ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                              <BookOpen size={11} />
                              {lesson.vocabCount} từ
                            </span>
                          ) : null}
                        </div>

                        {/* Start Action Button */}
                        <Link
                          to={`/lessons/${lesson.id}`}
                          onClick={() => setSelectedLesson(null)}
                          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-600 py-2.5 px-4 text-xs font-black text-white shadow-md shadow-red-500/20 hover:from-red-500 hover:to-rose-500 active:scale-95 transition-all cursor-pointer"
                        >
                          <Play size={14} className="fill-white" />
                          <span>{isCompleted ? "LUYỆN TẬP LẠI" : "BẮT ĐẦU"}</span>
                          
                        </Link>
                      </div>
                    )}

                    {/* Bao Bao Mascot Indicator on Current Active Node */}
                    {isCurrent && selectedLesson?.id !== lesson.id && (
                      <div className="absolute -top-26 z-30 flex flex-col items-center animate-bounce">
                        <div className="rounded-2xl border border-amber-300 bg-white px-3 py-1 shadow-md text-center">
                          <p className="text-[11px] font-black text-amber-800 whitespace-nowrap flex items-center gap-1.5">
                            <Sparkles size={12} className="text-amber-600" />
                            {idx === 0 ? "Bắt đầu nào!" : "Ải tiếp theo nè bạn!"}
                          </p>
                        </div>
                        <div className="mt-1 flex h-12 w-12 items-center justify-center rounded-full border-2 border-amber-400 bg-amber-50 p-1 shadow-md">
                          <MascotPandaSVG className="h-9 w-9" />
                        </div>
                      </div>
                    )}

                    {/* 3D Physical Game Token / Stage Disc Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isLocked) {
                          sound.playIncorrect();
                          return;
                        }
                        sound.playWoodblock();
                        setSelectedLesson((prev) => (prev?.id === lesson.id ? null : lesson));
                      }}
                      className={`group relative flex items-center justify-center rounded-2xl cursor-pointer select-none ${
                        isBoss ? "h-24 w-24 rounded-3xl" : "h-20 w-20"
                      } ${
                        isBoss && isCurrent
                          ? "btn-stage-boss"
                          : isCurrent
                          ? "btn-stage-active"
                          : isCompleted
                          ? "btn-stage-completed"
                          : "btn-stage-locked cursor-not-allowed opacity-75"
                      }`}
                    >
                      {/* Inner Node Content */}
                      {isLocked ? (
                        <div className="flex flex-col items-center justify-center">
                          <Lock className="h-6 w-6 text-slate-400" />
                        </div>
                      ) : isCompleted ? (
                        <div className="flex flex-col items-center gap-0.5">
                          {isBoss ? (
                            <Crown className="h-8 w-8 text-amber-200 drop-shadow-xs" />
                          ) : (
                            <CheckCircle2 className="h-8 w-8 text-white drop-shadow-xs" />
                          )}
                          <div className="flex gap-0.5 mt-0.5">
                            {[1, 2, 3].map((s) => (
                              <Star
                                key={s}
                                className={`h-2.5 w-2.5 ${
                                  s <= starsCount
                                    ? "fill-amber-300 text-amber-300"
                                    : "fill-emerald-800 text-emerald-800"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      ) : isCurrent ? (
                        <div className="flex flex-col items-center gap-0.5">
                          {isBoss ? (
                            <Swords className="h-9 w-9 text-white drop-shadow-sm animate-pulse" />
                          ) : (
                            <Play className="h-9 w-9 fill-white text-white translate-x-0.5 drop-shadow-sm" />
                          )}
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-950">
                            {isBoss ? "Boss!" : "Chiến!"}
                          </span>
                        </div>
                      ) : null}

                      {/* Stage Order Badge */}
                      <span
                        className={`absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-black shadow-sm border border-white ${
                          isCompleted
                            ? "bg-emerald-700 text-white"
                            : isCurrent
                            ? "bg-slate-900 text-amber-400"
                            : "bg-slate-300 text-slate-600"
                        }`}
                      >
                        {idx + 1}
                      </span>
                    </button>

                    {/* Stage Info Underneath */}
                    <div className="mt-2.5 flex flex-col items-center text-center">
                      <p className="max-w-[180px] truncate text-xs font-black text-slate-900">
                        {lesson.title}
                      </p>
                    </div>
                  </div>
                );
              })}

              {/* End of Trail Golden Treasure Chest */}
              <div className="relative mt-8 flex flex-col items-center">
                <button
                  type="button"
                  onClick={handleOpenChest}
                  className={`group relative flex flex-col items-center gap-2 transition-transform duration-300 active:scale-95 cursor-pointer select-none ${
                    isChestOpened
                      ? "opacity-60 cursor-default"
                      : isRealmFullyCompleted
                      ? "hover:scale-110"
                      : "hover:scale-105 text-slate-500"
                  }`}
                >
                  {!isChestOpened && !isRealmFullyCompleted && (
                    <div className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-white shadow-md border-2 border-white z-10">
                      <Lock size={12} />
                    </div>
                  )}
                  <div className="relative h-20 w-20 flex items-center justify-center">
                    <img
                      src={isChestOpened ? r2Asset("/images/chest_front_open.png") : r2Asset("/images/chest_front_closed.png")}
                      alt="Rương Hoàng Kim"
                      className={`h-full w-full object-contain transition-all duration-300 group-hover:scale-105 ${
                        !isChestOpened && isRealmFullyCompleted
                          ? "drop-shadow-[0_8px_20px_rgba(245,158,11,0.55)] animate-pulse"
                          : !isRealmFullyCompleted
                          ? "grayscale-[20%] opacity-85 drop-shadow-md"
                          : "drop-shadow-md"
                      }`}
                    />
                  </div>
                  <span
                    className={`text-xs font-black uppercase tracking-wider ${
                      isChestOpened
                        ? "text-slate-400"
                        : isRealmFullyCompleted
                        ? "text-amber-700 font-extrabold"
                        : "text-slate-600"
                    }`}
                  >
                    {isChestOpened
                      ? "Rương Đã Nhận"
                      : isRealmFullyCompleted
                      ? "Mở Rương Hoàng Kim"
                      : `Khóa Rương (${completedStagesCount}/${totalStagesCount} ải)`}
                  </span>
                </button>
                {!isChestOpened && (
                  <p className="mt-2 text-xs font-bold text-center">
                    {isRealmFullyCompleted ? (
                      <span className="text-amber-700 font-extrabold animate-pulse">
                        Đã hoàn tất đại lục! Nhấp để nhận +75 Gems & +200 EXP!
                      </span>
                    ) : (
                      <span className="text-slate-500 font-medium">
                        Cần vượt qua toàn bộ ({completedStagesCount}/{totalStagesCount} ải) để mở khóa: +75 Gems & +200 EXP
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT SIDEBAR: QUEST COMPANION & MINI-GAMES HUD (4 Cols)                  */}
        {/* ========================================================================= */}
        <div className="lg:col-span-4 space-y-6">
          {/* Bao Bao Mascot Companion Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center">
                <MascotPandaSVG className="h-12 w-12" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-700">Trợ Lý Đồng Hành</span>
                <h4 className="text-base font-black text-slate-900">Bao Bao (宝宝)</h4>
                <p className="text-xs text-slate-500 font-medium">Đồng hành chinh phục HSK</p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-amber-200/70 bg-[#FDFBF7] p-4 shadow-2xs">
              <p className="text-xs leading-relaxed text-slate-700 italic">
                “Mỗi ngày vượt một ải nhỏ, sau 30 ngày bạn sẽ tự tin giao tiếp tiếng Trung như người bản xứ!”
              </p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-center">
              <div className="rounded-xl border border-slate-200 bg-[#FDFBF7] p-2.5 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400">Chuỗi Ngày</span>
                <p className="flex items-center justify-center gap-1 text-sm font-black text-orange-600">
                  <StreakFlameSVG className="h-4 w-4" animate={gamificationStats.streak >= 3} /> {gamificationStats.streak} Ngày
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-[#FDFBF7] p-2.5 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400">Gems Tích Lũy</span>
                <p className="flex items-center justify-center gap-1 text-sm font-black text-sky-600">
                  <GemDiamondSVG className="h-4 w-4" /> {gamificationStats.gems} Gems
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Mini-Games Hub */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="flex items-center gap-2 text-sm font-black text-slate-900">
                <Gamepad2 size={16} className="text-red-600" />
                Luyện Tập Đấu Trường Mini-Games
              </h4>
              <Link to="/games" className="text-xs font-bold text-red-600 hover:underline">
                Xem Tất Cả
              </Link>
            </div>

            <div className="space-y-2.5">
              <Link
                to="/games?mode=ztype"
                className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-[#FDFBF7] p-3 transition-all hover:bg-red-50 hover:border-red-200 shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 p-1 border border-red-200">
                    <ZTypeFighterSVG className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900 group-hover:text-red-600 transition-colors">
                      Chiến Cơ Phiên Âm
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium">Gõ Pinyin bắn hạ phi thuyền</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-400 group-hover:text-red-600 transition-transform group-hover:translate-x-0.5" />
              </Link>

              <Link
                to="/games?mode=mahjong"
                className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-[#FDFBF7] p-3 transition-all hover:bg-emerald-50 hover:border-emerald-200 shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 p-1 border border-emerald-200">
                    <MahjongTileSVG className="h-7 w-6" char="中" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900 group-hover:text-emerald-600 transition-colors">
                      Mạt Chược Ghép Đôi
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium">Ghép Hán tự, Pinyin và nghĩa</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-400 group-hover:text-emerald-600 transition-transform group-hover:translate-x-0.5" />
              </Link>

              <Link
                to="/memory-garden"
                className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-[#FDFBF7] p-3 transition-all hover:bg-emerald-50 hover:border-emerald-200 shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 p-1 border border-emerald-200">
                    <MemoryGardenSVG className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900 group-hover:text-emerald-600 transition-colors">
                      Vườn Ký Ức (SRS)
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium">Lặp lại ngắt quãng nuôi cây HSK</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-400 group-hover:text-emerald-600 transition-transform group-hover:translate-x-0.5" />
              </Link>

              <Link
                to="/games?mode=dragon"
                className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-[#FDFBF7] p-3 transition-all hover:bg-amber-50 hover:border-amber-200 shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 p-1 border border-amber-200">
                    <MascotPandaSVG className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900 group-hover:text-amber-600 transition-colors">
                      Bao Bao Vượt Ải
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium">Lướt mây qua cổng thanh điệu</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-400 group-hover:text-amber-600 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>



      {/* ========================================================================= */}
      {/* 5. CHEST REWARD MODAL (Solid Porcelain Modal - No Gradients)              */}
      {/* ========================================================================= */}
      {chestReward && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 text-center shadow-2xl animate-in zoom-in-95 duration-200 space-y-5">
            {/* Top Badge */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 text-xs font-black text-amber-800">
              <Sparkles size={13} className="text-amber-600" />
              <span>KHO BÁU HOÀNG KIM</span>
            </div>

            {/* Chest Open Centerpiece Image */}
            <div className="mx-auto flex h-28 w-28 items-center justify-center">
              <img
                src={r2Asset("/images/chest_front_open.png")}
                alt="Mở Rương Thành Công"
                className="h-full w-full object-contain animate-bounce drop-shadow-md"
              />
            </div>

            <div className="space-y-1">
              <h4 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                MỞ RƯƠNG THÀNH CÔNG!
              </h4>
              <p className="text-xs text-slate-500 font-medium">{chestReward.region}</p>
            </div>

            {/* Rewards 2-Card Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-3 text-center">
                <span className="text-[10px] font-bold text-amber-800/80 block">Kinh Nghiệm</span>
                <p className="text-base sm:text-lg font-black text-amber-700 my-0.5">
                  +{chestReward.exp || 200} EXP
                </p>
                <span className="text-[10px] text-amber-700/80 font-medium block">Tích lũy</span>
              </div>

              <div className="rounded-2xl border border-sky-200/80 bg-sky-50/50 p-3 text-center">
                <span className="text-[10px] font-bold text-sky-800/80 block">Kim Cương</span>
                <p className="text-base sm:text-lg font-black text-sky-700 my-0.5">
                  +{chestReward.amount} Gems
                </p>
                <span className="text-[10px] text-sky-700/80 font-medium block">Thưởng thêm</span>
              </div>
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={() => setChestReward(null)}
                className="w-full rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-[0.98] py-3.5 text-xs sm:text-sm font-black text-slate-950 shadow-sm transition-all cursor-pointer"
              >
                Thu Nhận Phần Thưởng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
