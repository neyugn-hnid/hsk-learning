import type { Route } from "./+types/profile";
import {
  Activity,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Compass,
  Crown,
  Eye,
  EyeOff,
  Flame,
  Gamepad2,
  KeyRound,
  LogOut,
  Save,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Trophy,
  User,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Form, Link, useActionData, useNavigation } from "react-router";
import { SiteLayout } from "~/components/Layout";
import { useToast } from "~/components/Toast";
import {
  GemDiamondSVG,
  MascotPandaSVG,
  MemoryGardenSVG,
  StreakFlameSVG,
  TreasureChestSVG,
} from "~/components/Icons/CustomSVGs";
import {
  expForNextLevel,
  getLevelTitle,
  getOpenedChestsList,
  loadUserStats,
  type UserStats,
} from "~/lib/gamification";
import { sound } from "~/lib/sound";

export async function loader({ request }: Route.LoaderArgs) {
  const { requireUser } = await import("~/lib/auth.server");
  const { prisma } = await import("~/lib/db.server");
  const user = await requireUser(request);

  const [dbUser, totalLessons, completedLessons, inProgressLessons, quizAttempts, totalVocabs, totalRoadmaps] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: user.id },
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      }),
      prisma.lesson.count({ where: { status: "PUBLISHED" } }),
      prisma.userProgress.count({ where: { userId: user.id, completed: true } }),
      prisma.userProgress.count({ where: { userId: user.id, completed: false, progress: { gt: 0 } } }),
      prisma.quizAttempt.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
      prisma.vocabulary.count(),
      prisma.roadmapItem.count(),
    ]);

  const avgQuizScore = quizAttempts.length
    ? Math.round(
        quizAttempts.reduce((s, a) => s + (a.score / a.total) * 100, 0) / quizAttempts.length
      )
    : 0;

  const activeUser = dbUser || {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: new Date(),
  };

  return {
    user: activeUser,
    stats: {
      totalLessons,
      completedLessons,
      inProgressLessons,
      quizAttempts: quizAttempts.length,
      averageQuizScore: avgQuizScore,
      totalVocabs,
      totalRoadmaps,
    },
  };
}

export async function action({ request }: Route.ActionArgs) {
  const { requireUser } = await import("~/lib/auth.server");
  const { prisma } = await import("~/lib/db.server");
  const user = await requireUser(request);
  const form = await request.formData();
  const intent = String(form.get("intent") || "");

  if (intent === "updateName") {
    const name = String(form.get("name") || "").trim();
    if (name.length < 2) {
      return { error: "Tên hiển thị phải có ít nhất 2 ký tự." };
    }
    await prisma.user.update({ where: { id: user.id }, data: { name } });
    return { success: "Đã cập nhật tên hiển thị thành công." };
  }

  if (intent === "changePassword") {
    const currentPassword = String(form.get("currentPassword") || "");
    const newPassword = String(form.get("newPassword") || "");

    if (!currentPassword || newPassword.length < 6) {
      return { error: "Vui lòng nhập đủ thông tin, mật khẩu mới ít nhất 6 ký tự." };
    }

    const { verifyPassword, hashPassword } = await import("~/lib/password.server");
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser || !(await verifyPassword(currentPassword, dbUser.password))) {
      return { error: "Mật khẩu hiện tại không chính xác." };
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { password: await hashPassword(newPassword) },
    });
    return { success: "Đã đổi mật khẩu an toàn. Vui lòng ghi nhớ mật khẩu mới." };
  }

  return { error: "Hành động không hợp lệ." };
}

export default function Profile({ loaderData }: Route.ComponentProps) {
  const { user, stats } = loaderData;
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const { pushToast } = useToast();

  const [displayName, setDisplayName] = useState(user.name);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [isSoundMuted, setIsSoundMuted] = useState(false);

  const [gamificationStats, setGamificationStats] = useState<UserStats>(() => loadUserStats());
  const [openedChestsList, setOpenedChestsList] = useState<string[]>([]);

  useEffect(() => {
    setIsSoundMuted(sound.getMuted());
    setGamificationStats(loadUserStats());
    setOpenedChestsList(getOpenedChestsList());

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

  useEffect(() => {
    if (actionData?.success) {
      pushToast(actionData.success, "success");
      try {
        sound.playLevelUp();
      } catch {}
      if (actionData.success.includes("mật khẩu")) {
        setCurrentPassword("");
        setNewPassword("");
      }
    }
    if (actionData?.error) {
      pushToast(actionData.error, "error");
      try {
        sound.playIncorrect();
      } catch {}
    }
  }, [actionData, pushToast]);

  const toggleAudio = () => {
    const muted = sound.toggleMute();
    setIsSoundMuted(muted);
    pushToast(muted ? "Đã tắt âm thanh hiệu ứng" : "Đã bật âm thanh hiệu ứng", "info");
    if (!muted) {
      try {
        sound.playWoodblock();
      } catch {}
    }
  };

  const isAdmin = user.role === "ADMIN";
  const userLevel = gamificationStats.level || 1;
  const levelTitle = getLevelTitle(userLevel);
  const currentLevelExp = gamificationStats.exp || 0;
  const maxLevelExp = expForNextLevel(userLevel);
  const levelProgressPercent = Math.min(100, Math.round((currentLevelExp / maxLevelExp) * 100));

  const initials = user.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("");

  const formattedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("vi-VN", {
        month: "long",
        year: "numeric",
      })
    : "Gần đây";

  const isSubmitting = navigation.state === "submitting";

  return (
    <SiteLayout user={user}>
      <main className="mx-auto max-w-5xl px-4 py-6 md:py-10 space-y-8">
        {/* ========================================================================= */}
        {/* 1. HERO PORCELAIN PROFILE CARD (Solid Light Theme)                        */}
        {/* ========================================================================= */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            {/* User Identity Info */}
            <div className="flex items-center gap-4 sm:gap-6">
              {/* Mascot / Avatar Frame */}
              <div className="relative shrink-0">
                <div className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-3xl border-2 border-amber-300 bg-amber-50/80 p-2 shadow-sm">
                  {isAdmin ? (
                    <MascotPandaSVG className="h-full w-full object-contain" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center rounded-2xl bg-red-600 text-white font-black text-2xl sm:text-3xl shadow-2xs">
                      {initials || "U"}
                    </div>
                  )}
                </div>
                {/* Level Badge Pip */}
                <span className="absolute -bottom-2 -right-2 flex h-7 items-center justify-center gap-0.5 rounded-full border-2 border-white bg-slate-900 px-2 text-[11px] font-black text-amber-400 shadow-sm font-mono">
                  <Zap size={11} className="fill-amber-400 text-amber-400" />
                  Lv.{userLevel}
                </span>
              </div>

              {/* Text Info */}
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {user.name}
                  </h1>
                  {isAdmin ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-[11px] font-black text-red-700">
                      <Crown size={12} className="text-red-600" />
                      ADMIN
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-[11px] font-bold text-sky-800">
                      <ShieldCheck size={12} className="text-sky-600" />
                      Học Viên
                    </span>
                  )}
                  
                </div>

                <p className="text-xs font-medium text-slate-500">{user.email}</p>

                
              </div>
            </div>

            {/* Level EXP Progress Box */}
            <div className="w-full md:w-72 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-black text-slate-900 flex items-center gap-1">
                  <Zap size={13} className="text-amber-500 fill-amber-500" />
                  Tiến Trình Cấp Độ
                </span>
                <span className="font-mono text-xs font-bold text-amber-700">
                  {currentLevelExp} / {maxLevelExp} EXP
                </span>
              </div>

              {/* Progress Bar */}
              <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200 p-0.5">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all duration-500 shadow-2xs"
                  style={{ width: `${levelProgressPercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                <span>Cấp {userLevel}</span>
                <span>{levelProgressPercent}% tới Cấp {userLevel + 1}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. QUICK 6-GRID STATS OVERVIEW                                            */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {/* Stat 1: Total EXP */}
          <div className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-4 text-center space-y-1 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
              Kinh Nghiệm
            </span>
            <p className="text-xl sm:text-2xl font-black text-amber-700 font-mono">
              +{gamificationStats.totalExp || gamificationStats.exp}
            </p>
            <span className="text-[10px] text-amber-700/80 font-medium block">Tổng EXP</span>
          </div>

          {/* Stat 2: Gems */}
          <div className="rounded-2xl border border-sky-200/80 bg-sky-50/50 p-4 text-center space-y-1 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 block">
              Kim Cương
            </span>
            <p className="text-xl sm:text-2xl font-black text-sky-700 font-mono">
              {gamificationStats.gems}
            </p>
            <span className="text-[10px] text-sky-700/80 font-medium block">Gems Tích Lũy</span>
          </div>

          {/* Stat 3: Streak */}
          <div className="rounded-2xl border border-rose-200/80 bg-rose-50/50 p-4 text-center space-y-1 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 block">
              Chuỗi Học
            </span>
            <p className="text-xl sm:text-2xl font-black text-rose-700 font-mono">
              {gamificationStats.streak} <span className="text-xs font-normal">Ngày</span>
            </p>
            <span className="text-[10px] text-rose-700/80 font-medium block">Streak liên tiếp</span>
          </div>

          {/* Stat 4: Completed Stages */}
          <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-4 text-center space-y-1 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
              Ải Đã Xong
            </span>
            <p className="text-xl sm:text-2xl font-black text-emerald-700 font-mono">
              {isAdmin ? stats.totalLessons : stats.completedLessons}{" "}
              <span className="text-xs font-normal text-emerald-600">/ {stats.totalLessons}</span>
            </p>
            <span className="text-[10px] text-emerald-700/80 font-medium block">Bài học hoàn tất</span>
          </div>

          {/* Stat 5: Quiz Accuracy */}
          <div className="rounded-2xl border border-purple-200/80 bg-purple-50/50 p-4 text-center space-y-1 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800 block">
              Trắc Nghiệm
            </span>
            <p className="text-xl sm:text-2xl font-black text-purple-700 font-mono">
              {stats.averageQuizScore}%
            </p>
            <span className="text-[10px] text-purple-700/80 font-medium block">
              {stats.quizAttempts} lượt luyện
            </span>
          </div>

          {/* Stat 6: Chests Opened */}
          <div className="rounded-2xl border border-amber-300/80 bg-amber-100/40 p-4 text-center space-y-1 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 block">
              Rương Báu
            </span>
            <p className="text-xl sm:text-2xl font-black text-amber-800 font-mono">
              {openedChestsList.length} <span className="text-xs font-normal">Rương</span>
            </p>
            <span className="text-[10px] text-amber-900/80 font-medium block">Đại lục mở khóa</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. MAIN SECTION: SETTINGS, SECURITY & DISCOVERY (2 Columns)               */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT COLUMN: Profile Update & Password Security */}
          <div className="space-y-6">
            {/* Card 1: Update Profile Name */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600 border border-red-100">
                  <User size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Cập Nhật Tên Hồ Sơ</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Tên hiển thị trên bảng vàng thành tích</p>
                </div>
              </div>

              <Form method="post" className="space-y-4">
                <input type="hidden" name="intent" value="updateName" />
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Tên hiển thị mới
                  </label>
                  <input
                    name="name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-xs sm:text-sm font-bold text-slate-900 outline-none transition focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-500/10"
                    placeholder="Nhập tên hiển thị"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || displayName.trim().length < 2}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-red-600 hover:bg-red-700 active:scale-[0.98] px-6 py-3.5 text-xs sm:text-sm font-bold text-white shadow-sm transition-all disabled:opacity-50 cursor-pointer w-full"
                >
                  {isSubmitting ? (
                    <Activity size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  <span>Lưu Tên Hiển Thị</span>
                </button>
              </Form>
            </div>

            {/* Card 2: Change Password */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
                  <KeyRound size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Bảo Mật & Mật Khẩu</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Thay đổi mật khẩu đăng nhập tài khoản</p>
                </div>
              </div>

              <Form method="post" className="space-y-3.5">
                <input type="hidden" name="intent" value="changePassword" />

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Mật khẩu hiện tại
                  </label>
                  <div className="relative">
                    <input
                      name="currentPassword"
                      type={showCurrentPw ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 pr-11 text-xs sm:text-sm font-bold text-slate-900 outline-none transition focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-500/10"
                      placeholder="Nhập mật khẩu hiện tại"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPw((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Mật khẩu mới
                  </label>
                  <div className="relative">
                    <input
                      name="newPassword"
                      type={showNewPw ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 pr-11 text-xs sm:text-sm font-bold text-slate-900 outline-none transition focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-500/10"
                      placeholder="Tối thiểu 6 ký tự"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPw((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !currentPassword || newPassword.length < 6}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-[0.98] px-6 py-3.5 text-xs sm:text-sm font-bold text-white shadow-sm transition-all disabled:opacity-50 cursor-pointer w-full"
                >
                  {isSubmitting ? (
                    <Activity size={16} className="animate-spin" />
                  ) : (
                    <ShieldCheck size={16} />
                  )}
                  <span>Cập Nhật Mật Khẩu</span>
                </button>
              </Form>
            </div>
          </div>

          {/* RIGHT COLUMN: Audio Settings, Quick Links & App Info */}
          <div className="space-y-6">
            {/* Card 3: Experience & Audio Settings */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
                  <Volume2 size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Trải Nghiệm & Âm Thanh</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Tùy biến hiệu ứng âm tương tác</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-900">Âm thanh phản hồi & Game SFX</p>
                  <p className="text-[11px] text-slate-500">Chiêng đồng, gõ mõ, thăng cấp, mở rương</p>
                </div>

                <button
                  type="button"
                  onClick={toggleAudio}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                    isSoundMuted
                      ? "bg-slate-200 text-slate-600 hover:bg-slate-300"
                      : "bg-amber-500 text-slate-950 hover:bg-amber-600 shadow-2xs"
                  }`}
                >
                  {isSoundMuted ? (
                    <>
                      <VolumeX size={14} />
                      <span>Đang Tắt</span>
                    </>
                  ) : (
                    <>
                      <Volume2 size={14} />
                      <span>Đang Bật</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Card 4: Quick Discovery Links */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-3.5">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Compass size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Lối Tắt Hành Trình</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Truy cập nhanh các khu vực chính</p>
                </div>
              </div>

              <div className="space-y-2">
                <Link
                  to="/game-map"
                  className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/50 p-3 hover:bg-white hover:border-red-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600 border border-red-200">
                      <Compass size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 group-hover:text-red-600 transition-colors">
                        Bản Đồ Game HSK
                      </h4>
                      <p className="text-[10px] text-slate-500 font-medium">Khám phá các đại lục</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </Link>

                <Link
                  to="/memory-garden"
                  className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/50 p-3 hover:bg-white hover:border-emerald-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                      <MemoryGardenSVG className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 group-hover:text-emerald-600 transition-colors">
                        Vườn Trí Nhớ FSRS
                      </h4>
                      <p className="text-[10px] text-slate-500 font-medium">Ôn tập từ vựng ngắt quãng</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </Link>

                <Link
                  to="/games"
                  className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/50 p-3 hover:bg-white hover:border-sky-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600 border border-sky-200">
                      <Gamepad2 size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 group-hover:text-sky-600 transition-colors">
                        Đấu Trường Mini-Games
                      </h4>
                      <p className="text-[10px] text-slate-500 font-medium">Luyện phản xạ & ghép câu</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Card 5: Safe Logout */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
              <Form method="post" action="/api/auth/logout">
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 py-3.5 text-xs sm:text-sm font-bold text-slate-700 transition cursor-pointer"
                >
                  <LogOut size={16} />
                  <span>Đăng Xuất Khỏi Thiết Bị</span>
                </button>
              </Form>
            </div>
          </div>
        </div>
      </main>
    </SiteLayout>
  );
}
