import type { Route } from "./+types/games";
import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router";
import { SiteLayout } from "~/components/Layout";
import { getUser } from "~/lib/auth.server";
import { prisma } from "~/lib/db.server";
import { MahjongMatchGame, type MahjongPair } from "~/components/Games/MahjongMatchGame";
import { SentenceBuilderGame, type SentenceQuestion } from "~/components/Games/SentenceBuilderGame";
import { ZTypeShooterGame } from "~/components/Games/ZTypeShooterGame";
import { FlappyDragonGame } from "~/components/Games/FlappyDragonGame";
import { SentenceShootoutGame } from "~/components/Games/SentenceShootoutGame";
import { VIPGameAccessModal } from "~/components/VIPGameAccessModal";
import { sound } from "~/lib/sound";
import {
  Sparkles,
  Gamepad2,
  Layers,
  ArrowLeft,
  Award,
  Crown,
  Trophy,
  Flame,
  Star,
  Play,
  CheckCircle2,
  Rocket,
  Compass,
  BookOpen,
  Target,
  Lock,
} from "lucide-react";
import {
  GemDiamondSVG,
  StreakFlameSVG,
  MascotPandaSVG,
  ZTypeFighterSVG,
  MahjongTileSVG,
  SentenceBuilderBlockSVG,
  SoccerPenaltySVG,
  MemoryGardenSVG,
} from "~/components/Icons/CustomSVGs";

export async function loader({ request }: Route.LoaderArgs) {
  const [user, lessons, vocabularies, grammars] = await Promise.all([
    getUser(request),
    prisma.lesson.findMany({
      select: {
        id: true,
        title: true,
        level: true,
        source: true,
      },
      orderBy: [{ level: "asc" }, { orderNo: "asc" }],
    }),
    prisma.vocabulary.findMany({
      take: 250,
      select: {
        id: true,
        chinese: true,
        pinyin: true,
        meaningVi: true,
        level: true,
        lessonId: true,
        exampleChinese: true,
        examplePinyin: true,
        exampleMeaning: true,
        lesson: {
          select: {
            id: true,
            title: true,
            level: true,
            source: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.grammar.findMany({
      take: 60,
      select: {
        id: true,
        title: true,
        structure: true,
        explanation: true,
        example: true,
        meaning: true,
        lesson: {
          select: {
            level: true,
            source: true,
            title: true,
          },
        },
      },
    }),
  ]);

  return { user, vocabularies, lessons, grammars };
}

export default function GamesPage({ loaderData }: Route.ComponentProps) {
  const { user, vocabularies, lessons, grammars } = loaderData;
  const isVIP = (user?.role as string) === "ADMIN" || (user?.role as string) === "STUDENT";
  const [searchParams, setSearchParams] = useSearchParams();
  const initialMode = searchParams.get("mode") as
    | "ztype"
    | "dragon"
    | "mahjong"
    | "sentence"
    | "shootout"
    | null;
  const [activeGame, setActiveGame] = useState<
    "ztype" | "dragon" | "mahjong" | "sentence" | "shootout" | null
  >(initialMode);
  const [vipModalOpen, setVipModalOpen] = useState<boolean>(false);
  const [vipGameTitle, setVipGameTitle] = useState<string>("Trò Chơi VIP");

  useEffect(() => {
    if (initialMode) {
      if ((initialMode === "sentence" || initialMode === "shootout") && !isVIP) {
        setVipGameTitle(initialMode === "sentence" ? "Xếp Khối Tạo Câu AI" : "Sút Phạt Đền HSK AI");
        setVipModalOpen(true);
        setActiveGame(null);
        setSearchParams({});
      } else if (initialMode !== activeGame) {
        setActiveGame(initialMode);
      }
    }
  }, [initialMode, isVIP]);

  // Format dữ liệu cho Mahjong Match
  const mahjongPairs: MahjongPair[] = vocabularies.map((v) => ({
    id: v.id,
    chinese: v.chinese,
    pinyin: v.pinyin,
    meaningVi: v.meaningVi,
  }));

  const handleSelectGame = (
    gameId: "ztype" | "dragon" | "mahjong" | "sentence" | "shootout"
  ) => {
    sound.playWoodblock();
    if ((gameId === "sentence" || gameId === "shootout") && !isVIP) {
      sound.playShieldBreak();
      setVipGameTitle(gameId === "sentence" ? "Xếp Khối Tạo Câu AI" : "Sút Phạt Đền HSK AI");
      setVipModalOpen(true);
      return;
    }
    setActiveGame(gameId);
    setSearchParams({ mode: gameId });
  };

  const handleBackToLobby = () => {
    sound.playWoodblock();
    setActiveGame(null);
    setSearchParams({});
  };

  return (
    <SiteLayout user={user} hideFooter={true}>
      <div className="relative min-h-screen bg-[#FDFBF7] text-slate-900 py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          {/* Back button if in game session */}
          {activeGame && (
            <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-4">
              <button
                type="button"
                onClick={handleBackToLobby}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all cursor-pointer shadow-sm"
              >
                <ArrowLeft size={15} />
                <span>Trở Về Sảnh Trò Chơi</span>
              </button>

              <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                <span className="h-1.5 w-1.5 rounded-full bg-red-600"></span>
                <span>
                  {activeGame === "mahjong" && "Mạt Chược Ghép Đôi"}
                  {activeGame === "ztype" && "Chiến Cơ Phiên Âm"}
                  {activeGame === "sentence" && "Xếp Khối Tạo Câu"}
                  {activeGame === "dragon" && "Bao Bao Vượt Ải"}
                  {activeGame === "shootout" && "Sút Phạt Đền HSK"}
                </span>
              </span>
            </div>
          )}

          {!activeGame ? (
            <div className="space-y-8">
              {/* ============================================================= */}
              {/* 1. NATURAL, AIRY HERO (LIGHT THEME) */}
              {/* ============================================================= */}
              <div className="border-b border-slate-200 pb-8 pt-2">
                <div className="max-w-2xl space-y-3">
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1 text-xs font-medium text-slate-600 shadow-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-600"></span>
                    <span>Kho Trò Chơi Tương Tác Thực Chiến HSK</span>
                  </div>

                  <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
                    Sảnh Trò Chơi HSK
                  </h1>

                  <p className="text-sm text-slate-600 leading-relaxed">
                    Luyện tập nhận diện mặt chữ Hán, phản xạ gõ Pinyin và củng cố ngữ pháp qua các trò chơi được thiết kế riêng cho người học HSK 1 - 6.
                  </p>
                </div>
              </div>

              {/* ============================================================= */}
              {/* 2. UNIFIED, HIGH-CRAFT GAME CARDS (LIGHT THEME WHITE & RED) */}
              {/* ============================================================= */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* Game 1: ZType Space Shooter */}
                <button
                  type="button"
                  onClick={() => handleSelectGame("ztype")}
                  className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 text-left transition-all duration-200 hover:border-red-300 hover:shadow-lg hover:bg-red-50/10 hover:scale-[1.01] active:scale-[0.98] cursor-pointer shadow-sm"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-red-200 bg-red-50 p-2 text-red-600 shadow-sm group-hover:scale-105 transition-transform">
                        <ZTypeFighterSVG className="h-8 w-8" />
                      </div>
                      <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
                        Bắn phím Pinyin
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-red-600 transition-colors">
                        Chiến Cơ Phiên Âm (ZType)
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                        Luyện phản xạ gõ Pinyin nhanh và chính xác trên bàn phím để phóng tia laser Plasma bắn hạ các phi thuyền địch HSK.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-6 text-xs text-slate-500">
                    <span className="font-mono text-[11px] text-slate-400">Gõ Pinyin thần tốc</span>
                    <span className="font-semibold text-red-600 group-hover:text-red-700">Xuất kích &rarr;</span>
                  </div>
                </button>

                {/* Game 2: Mahjong Match */}
                <button
                  type="button"
                  onClick={() => handleSelectGame("mahjong")}
                  className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 text-left transition-all duration-200 hover:border-red-300 hover:shadow-lg hover:bg-red-50/10 hover:scale-[1.01] active:scale-[0.98] cursor-pointer shadow-sm"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 p-1.5 shadow-sm group-hover:scale-105 transition-transform">
                        <MahjongTileSVG className="h-8 w-7" char="中" />
                      </div>
                      <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
                        Trí nhớ 3D
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-red-600 transition-colors">
                        Mạt Chược Ghép Đôi
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                        Gỡ các tầng quân bài Mạt Chược ngà voi ngọc bích 3D bằng cách ghép cặp chính xác giữa Hán tự, Pinyin và nghĩa tiếng Việt.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-6 text-xs text-slate-500">
                    <span className="font-mono text-[11px] text-slate-400">Nhớ mặt chữ Hán</span>
                    <span className="font-semibold text-red-600 group-hover:text-red-700">Khai màn &rarr;</span>
                  </div>
                </button>

                {/* Game 3: Memory Garden SRS */}
                <Link
                  to="/memory-garden"
                  onClick={() => sound.playWoodblock()}
                  className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 text-left transition-all duration-200 hover:border-emerald-300 hover:shadow-lg hover:bg-emerald-50/10 hover:scale-[1.01] active:scale-[0.98] cursor-pointer shadow-sm"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 p-2 text-emerald-600 shadow-sm group-hover:scale-105 transition-transform">
                        <MemoryGardenSVG className="h-8 w-8" />
                      </div>
                      <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
                        Siêu trí nhớ SRS
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                        Vườn Ký Ức (SRS Garden)
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                        Ứng dụng phương pháp lặp lại ngắt quãng (Spaced Repetition) nuôi dưỡng cây tri thức HSK từ mầm non đến cổ thụ ngàn năm.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-6 text-xs text-slate-500">
                    <span className="font-mono text-[11px] text-slate-400">Ghi nhớ dài hạn</span>
                    <span className="font-semibold text-emerald-600 group-hover:text-emerald-700">Vào vườn chăm cây &rarr;</span>
                  </div>
                </Link>

                {/* Game 4: Bao Bao Cloud Rider */}
                <button
                  type="button"
                  onClick={() => handleSelectGame("dragon")}
                  className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 text-left transition-all duration-200 hover:border-red-300 hover:shadow-lg hover:bg-red-50/10 hover:scale-[1.01] active:scale-[0.98] cursor-pointer shadow-sm"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 p-1.5 shadow-sm group-hover:scale-105 transition-transform">
                        <MascotPandaSVG className="h-8 w-8" />
                      </div>
                      <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
                        Lướt mây 2D
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-red-600 transition-colors">
                        Bao Bao Vượt Ải
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                        Cùng Gấu Trúc Bao Bao cưỡi Cân Đẩu Vân bay lượn chín tầng mây, vượt qua cổng chữ Hán chính xác để thu thập ngọc quý.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-6 text-xs text-slate-500">
                    <span className="font-mono text-[11px] text-slate-400">Phản xạ & Thanh điệu</span>
                    <span className="font-semibold text-red-600 group-hover:text-red-700">Bay ngay &rarr;</span>
                  </div>
                </button>

                {/* Game 5: Sentence Builder (VIP Only) */}
                <button
                  type="button"
                  onClick={() => handleSelectGame("sentence")}
                  className={`group relative flex flex-col justify-between rounded-2xl border p-6 text-left transition-all duration-200 hover:shadow-lg hover:scale-[1.01] active:scale-[0.98] cursor-pointer shadow-sm ${
                    !isVIP
                      ? "border-amber-200/90 bg-gradient-to-b from-amber-50/20 via-white to-white hover:border-amber-400"
                      : "border-slate-200 bg-white hover:border-red-300 hover:bg-red-50/10"
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-sky-200 bg-sky-50 p-2 shadow-sm group-hover:scale-105 transition-transform">
                        <SentenceBuilderBlockSVG className="h-8 w-8" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
                          Cú pháp
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-md border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-black text-amber-800 shadow-2xs">
                          <Crown size={11} className="text-amber-600 fill-amber-500" />
                          <span>VIP</span>
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-red-600 transition-colors">
                          Xếp Khối Tạo Câu
                        </h3>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                        Rèn luyện phản xạ trật tự từ ngữ và làm chủ các mẫu câu HSK qua các khối thẻ từ 3D chân thực kèm phân tích ngữ pháp.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-6 text-xs text-slate-500">
                    <span className="font-mono text-[11px] text-slate-400">Ngữ pháp HSK</span>
                    {!isVIP ? (
                      <span className="inline-flex items-center gap-1 font-bold text-amber-700 group-hover:text-amber-800">
                        <Lock size={12} />
                        <span>Mở khóa VIP &rarr;</span>
                      </span>
                    ) : (
                      <span className="font-semibold text-red-600 group-hover:text-red-700">Ráp câu &rarr;</span>
                    )}
                  </div>
                </button>

                {/* Game 6: Penalty Sentence Shootout (VIP Only) */}
                <button
                  type="button"
                  onClick={() => handleSelectGame("shootout")}
                  className={`group relative flex flex-col justify-between rounded-2xl border p-6 text-left transition-all duration-200 hover:shadow-lg hover:scale-[1.01] active:scale-[0.98] cursor-pointer shadow-sm ${
                    !isVIP
                      ? "border-amber-200/90 bg-gradient-to-b from-amber-50/20 via-white to-white hover:border-amber-400"
                      : "border-slate-200 bg-white hover:border-red-300 hover:bg-red-50/10"
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 p-2 shadow-sm group-hover:scale-105 transition-transform">
                        <SoccerPenaltySVG className="h-8 w-8" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                          Penalty 3D
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-md border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-black text-amber-800 shadow-2xs">
                          <Crown size={11} className="text-amber-600 fill-amber-500" />
                          <span>VIP</span>
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-red-600 transition-colors">
                          Sút Phạt Đền HSK
                        </h3>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                        Chọn từ chính xác điền vào chỗ trống để sút tung lưới thủ môn ghi bàn thắng tuyệt đỉnh trong sân vận động rực lửa.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-6 text-xs text-slate-500">
                    <span className="font-mono text-[11px] text-slate-400">Điền từ ngữ cảnh</span>
                    {!isVIP ? (
                      <span className="inline-flex items-center gap-1 font-bold text-amber-700 group-hover:text-amber-800">
                        <Lock size={12} />
                        <span>Mở khóa VIP &rarr;</span>
                      </span>
                    ) : (
                      <span className="font-semibold text-red-600 group-hover:text-red-700">Sút phạt &rarr;</span>
                    )}
                  </div>
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center justify-center">
              {activeGame === "ztype" && (
                <div className="w-full flex justify-center items-center">
                  <ZTypeShooterGame
                    words={vocabularies.map((v) => ({
                      chinese: v.chinese,
                      pinyin: v.pinyin,
                      meaningVi: v.meaningVi,
                      level: v.level,
                      lessonId: v.lessonId,
                      lessonTitle: v.lesson?.title,
                      source: v.lesson?.source,
                    }))}
                    lessons={lessons}
                  />
                </div>
              )}
              {activeGame === "dragon" && (
                <FlappyDragonGame
                  words={vocabularies.map((v) => ({
                    chinese: v.chinese,
                    pinyin: v.pinyin,
                    meaningVi: v.meaningVi,
                    level: v.level,
                    lessonId: v.lessonId,
                    lessonTitle: v.lesson?.title,
                    source: v.lesson?.source,
                  }))}
                  lessons={lessons}
                />
              )}
              {activeGame === "mahjong" && (
                <MahjongMatchGame
                  words={vocabularies.map((v) => ({
                    id: v.id,
                    chinese: v.chinese,
                    pinyin: v.pinyin,
                    meaningVi: v.meaningVi,
                    level: v.level,
                    lessonId: v.lessonId,
                    lessonTitle: v.lesson?.title,
                    source: v.lesson?.source,
                  }))}
                  lessons={lessons}
                />
              )}
              {activeGame === "sentence" && isVIP && (
                <SentenceBuilderGame
                  grammars={grammars.map((g) => ({
                    id: g.id,
                    title: g.title,
                    structure: g.structure,
                    explanation: g.explanation,
                    example: g.example,
                    meaning: g.meaning,
                    level: g.lesson?.level,
                    source: g.lesson?.source,
                  }))}
                  vocabularies={vocabularies.map((v) => ({
                    id: v.id,
                    chinese: v.chinese,
                    pinyin: v.pinyin,
                    meaningVi: v.meaningVi,
                    level: v.level,
                    exampleChinese: v.exampleChinese,
                    examplePinyin: v.examplePinyin,
                    exampleMeaning: v.exampleMeaning,
                    lessonTitle: v.lesson?.title,
                    source: v.lesson?.source,
                  }))}
                  lessons={lessons}
                />
              )}
              {activeGame === "shootout" && isVIP && (
                <SentenceShootoutGame
                  vocabularies={vocabularies.map((v) => ({
                    id: v.id,
                    chinese: v.chinese,
                    pinyin: v.pinyin,
                    meaningVi: v.meaningVi,
                    level: v.level,
                    exampleChinese: v.exampleChinese,
                    examplePinyin: v.examplePinyin,
                    exampleMeaning: v.exampleMeaning,
                    lessonTitle: v.lesson?.title,
                    source: v.lesson?.source,
                  }))}
                  grammars={grammars.map((g) => ({
                    id: g.id,
                    title: g.title,
                    structure: g.structure,
                    explanation: g.explanation,
                    example: g.example,
                    meaning: g.meaning,
                    level: g.lesson?.level,
                    source: g.lesson?.source,
                  }))}
                  lessons={lessons}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* VIP Access Required Modal */}
      <VIPGameAccessModal
        open={vipModalOpen}
        onClose={() => setVipModalOpen(false)}
        gameName={vipGameTitle}
        user={user}
      />
    </SiteLayout>
  );
}
