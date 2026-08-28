import {
  BookOpen,
  User,
  GraduationCap,
  Home,
  LogOut,
  Map,
  Shield,
  Bot,
  Sparkles,
  Mail,
  CheckCircle2,
  Gamepad2,
  Trees,
  Compass,
  Crown,
  MessageCircle,
  ArrowRight,
  Lock,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Form, Link, NavLink, useLocation } from "react-router";
import { AIChatWidget } from "~/components/AIChatWidget";
import { useAuth } from "~/components/AuthProvider";
import { useToast } from "~/components/Toast";
import { GamificationHeader } from "~/components/GamificationHeader";
import { ImperialLogoSVG, ChineseLanternSVG } from "~/components/Icons/CustomSVGs";
import { RoadmapAccessModal } from "~/components/RoadmapAccessModal";
import { VIPGameAccessModal } from "~/components/VIPGameAccessModal";
import { FeatureInDevModal } from "~/components/FeatureInDevModal";

export function SiteLayout({
  children,
  user,
  hideFooter = false,
}: {
  children: React.ReactNode;
  user?: any;
  hideFooter?: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [roadmapModalOpen, setRoadmapModalOpen] = useState(false);
  const [vipRoleplayModalOpen, setVipRoleplayModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const location = useLocation();
  const { openLogin, openRegister } = useAuth();
  const { pushToast } = useToast();

  const isAdmin = user?.role === "ADMIN";

  const handleProtectedClick = (label: string) => {
    pushToast(`Vui lòng đăng nhập để xem ${label}.`, "info");
    openLogin();
  };

  const isActive = (to: string) => {
    if (to === "/") return location.pathname === "/";
    return location.pathname.startsWith(to);
  };

  const desktopMenus = [
    { to: "/", label: "Trang chủ", icon: Home },
    { to: "/game-map", label: "Bản Đồ HSK", icon: Compass },
    { to: "/games", label: "Games", icon: Gamepad2 },
    { to: "/roadmap", label: "Lộ trình", icon: Map },
  ];

  const bottomTabs = [
    { to: "/", label: "Trang chủ", icon: Home },
    { to: "/game-map", label: "Bản đồ", icon: Compass },
    { to: "/games", label: "Games", icon: Gamepad2 },
    { to: "/roadmap", label: "Lộ trình", icon: Map },
  ];

  const handleOpenLogin = () => {
    setMenuOpen(false);
    openLogin();
  };

  const handleOpenRegister = () => {
    setMenuOpen(false);
    openRegister();
  };

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  return (
    <div className="flex flex-col min-h-screen pb-24 md:pb-0 bg-[#FDFBF7] text-slate-900 selection:bg-amber-100 selection:text-amber-900">
      {/* Top header bar */}
      <header className="sticky top-0 z-50 border-b border-slate-200/90 bg-white/95 backdrop-blur-md transition-all">
        <div className="w-full flex items-center justify-between gap-6 px-4 sm:px-6 lg:px-8 xl:px-10 h-16">
          {/* Logo & Brand Identity */}
          <Link to="/" prefetch="intent" className="flex shrink-0 items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center shrink-0">
              <ImperialLogoSVG className="h-9 w-9" />
            </div>
            <div className="text-left shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-lg font-black tracking-tight text-slate-900">
                  <span className="text-red-600">HSK</span> MASTER
                </span>
                <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[9px] font-extrabold text-amber-700 border border-amber-200">
                  PRO
                </span>
              </div>
              <p className="text-[10px] font-semibold text-slate-400 -mt-0.5 tracking-wider">汉语学习平台</p>
            </div>
          </Link>

          {/* Desktop Navigation Links (Airy, Minimal, Modern) */}
          <nav className="hidden items-center gap-6 lg:flex">
            {desktopMenus.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.to);
              const isStudentOrAdmin = user?.role === "ADMIN" || user?.role === "STUDENT";

              if (item.to === "/roadmap" && !isStudentOrAdmin) {
                return (
                  <button
                    key={item.to}
                    type="button"
                    onClick={() => setRoadmapModalOpen(true)}
                    className="flex items-center gap-1.5 py-1 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    <Icon size={16} className="text-slate-400" />
                    <span>{item.label}</span>
                    <span className="rounded bg-amber-50 px-1 py-0.2 text-[9px] font-black text-amber-700 border border-amber-200">
                      VIP
                    </span>
                  </button>
                );
              }

              if (item.to === "/ai-roleplay" && !isAdmin) {
                return (
                  <button
                    key={item.to}
                    type="button"
                    onClick={() => setVipRoleplayModalOpen(true)}
                    className="flex items-center gap-1.5 py-1 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    <Icon size={16} className="text-slate-400" />
                    <span>{item.label}</span>
                  </button>
                );
              }

              if (item.to === "/lessons" && !user) {
                return (
                  <button
                    key={item.to}
                    onClick={() => handleProtectedClick(item.label)}
                    className="flex items-center gap-1.5 py-1 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    <Icon size={16} className="text-slate-400" />
                    <span>{item.label}</span>
                  </button>
                );
              }

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  prefetch="intent"
                  className={`flex items-center gap-1.5 py-1 text-sm transition-colors cursor-pointer ${
                    active
                      ? "font-bold text-red-600"
                      : "font-semibold text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Icon size={16} className={active ? "text-red-600" : "text-slate-400"} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Right Action & Gamification Pill */}
          <div className="relative flex shrink-0 items-center gap-2 sm:gap-3" ref={menuRef}>
            {/* Gamification Stats Indicator */}
            <GamificationHeader />

            <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

            {!user ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenLogin}
                  className="hidden rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 md:inline-flex cursor-pointer transition-colors"
                >
                  Đăng nhập
                </button>
                <button
                  type="button"
                  onClick={handleOpenRegister}
                  className="rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-red-700 active:scale-95 cursor-pointer transition-all"
                >
                  Bắt đầu học
                </button>
              </div>
            ) : null}

            {user ? (
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                aria-label="Mở menu tài khoản"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-2xs transition hover:bg-slate-50 cursor-pointer"
              >
                <User size={16} />
              </button>
            ) : null}

            {user && menuOpen ? (
              <div className="absolute right-0 top-11 z-50 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl animate-fade-in text-slate-900">
                <div className="rounded-xl bg-slate-50 px-3.5 py-2.5 border border-slate-100">
                  <p className="text-xs font-bold text-slate-900">{user.name}</p>
                  {user.email ? (
                    <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                  ) : null}
                </div>
                <div className="mt-1.5 space-y-0.5">
                  <Link
                    to="/profile"
                    prefetch="intent"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <User size={14} className="text-slate-400" />
                    Hồ sơ cá nhân
                  </Link>
                  {user?.role === "ADMIN" ? (
                    <Link
                      to="/admin"
                      prefetch="intent"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <Shield size={14} className="text-slate-400" />
                      Trang Quản trị
                    </Link>
                  ) : null}
                </div>
                <Form method="post" action="/api/auth/logout" className="mt-1 border-t border-slate-100 pt-1">
                  <button
                    type="submit"
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left text-xs font-bold text-red-600 hover:bg-red-50 cursor-pointer"
                  >
                    <LogOut size={14} />
                    Đăng xuất
                  </button>
                </Form>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1">{children}</div>

      {/* AI Chat Widget */}
      <AIChatWidget />

      {/* Floating Island Mobile Bottom Nav */}
      <nav className="fixed bottom-3 inset-x-3 sm:inset-x-6 z-50 mx-auto max-w-sm sm:max-w-md rounded-3xl border border-white/80 bg-white/90 p-1.5 shadow-[0_12px_40px_rgba(15,23,42,0.18)] backdrop-blur-2xl md:hidden pb-[max(0.375rem,env(safe-area-inset-bottom))]">
        <div className="grid grid-cols-4 gap-1.5">
          {bottomTabs.map((tab) => {
            const Icon = tab.icon;
            const active = isActive(tab.to);
            const isStudentOrAdmin = user?.role === "ADMIN" || user?.role === "STUDENT";

            if (tab.to === "/roadmap" && !isStudentOrAdmin) {
              return (
                <button
                  key={tab.to}
                  type="button"
                  onClick={() => setRoadmapModalOpen(true)}
                  className={`flex flex-col items-center justify-center rounded-2xl py-2 px-1 text-[10px] font-bold transition-all cursor-pointer ${
                    active
                      ? "bg-gradient-to-b from-red-600 to-rose-600 text-white shadow-md shadow-red-600/25 scale-[1.03]"
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/60"
                  }`}
                >
                  <Icon size={19} strokeWidth={active ? 2.5 : 2} className={active ? "text-white" : "text-slate-400"} />
                  <span className="mt-1 leading-none text-center truncate max-w-full tracking-tight">{tab.label}</span>
                </button>
              );
            }

            return (
              <NavLink
                key={tab.to}
                to={tab.to}
                prefetch="intent"
                className={`flex flex-col items-center justify-center rounded-2xl py-2 px-1 text-[10px] font-bold transition-all ${
                  active
                    ? "bg-gradient-to-b from-red-600 to-rose-600 text-white shadow-md shadow-red-600/25 scale-[1.03]"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/60"
                }`}
              >
                <Icon size={19} strokeWidth={active ? 2.5 : 2} className={active ? "text-white" : "text-slate-400"} />
                <span className="mt-1 leading-none text-center truncate max-w-full tracking-tight">{tab.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>

      {!hideFooter ? (
        <footer className="mt-14 border-t border-slate-200/80 bg-white/95 backdrop-blur-md text-slate-500 py-6 sm:py-7">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center justify-between gap-5 text-xs">
            {/* Left: Brand Signature */}
            <div className="flex items-center gap-3 shrink-0">
              <Link to="/" prefetch="intent" className="flex items-center gap-2 group">
                <div className="flex h-7 w-7 items-center justify-center shrink-0">
                  <ImperialLogoSVG className="h-7 w-7" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-slate-900 tracking-tight group-hover:text-red-700 transition">
                    <span className="text-red-600">HSK</span> MASTER
                  </span>
                  <span className="rounded bg-amber-50 px-1 py-0.2 text-[9px] font-black text-amber-700 border border-amber-200">
                    PRO
                  </span>
                </div>
              </Link>
              <span className="text-slate-300 hidden sm:inline">|</span>
              <span className="text-[11px] font-medium text-slate-400 hidden sm:inline tracking-wider">
                汉语学习平台 · Hệ thống đào tạo HSK chuẩn hóa
              </span>
            </div>

            {/* Center: Horizontal Navigation Links */}
            <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-semibold text-slate-600">
              <Link to="/" prefetch="intent" className="hover:text-red-600 transition">
                Trang Chủ
              </Link>
              <Link to="/game-map" prefetch="intent" className="hover:text-red-600 transition">
                Bản Đồ HSK
              </Link>
              <Link to="/games" prefetch="intent" className="hover:text-red-600 transition">
                Sảnh Games
              </Link>
              {user?.role === "ADMIN" || user?.role === "STUDENT" ? (
                <Link to="/roadmap" prefetch="intent" className="hover:text-red-600 transition">
                  Lộ Trình VIP
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => setRoadmapModalOpen(true)}
                  className="hover:text-red-600 transition inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Lộ Trình</span>
                  <span className="rounded bg-amber-50 px-1 py-0.2 text-[8px] font-black text-amber-700 border border-amber-200">
                    VIP
                  </span>
                </button>
              )}
            </nav>

            {/* Right: Status Indicator & Copyright */}
            <div className="flex items-center gap-3 shrink-0 text-[11px] text-slate-400 font-medium">
              <div className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>Chuẩn HSK Quốc Tế</span>
              </div>
              <span className="text-slate-300">·</span>
              <span>© 2026 HSK Master</span>
            </div>
          </div>
        </footer>
      ) : null}

      {/* Modal Thông Báo Lộ Trình Riêng Dành Cho Học Viên */}
      <RoadmapAccessModal
        open={roadmapModalOpen}
        onClose={() => setRoadmapModalOpen(false)}
      />

      {/* Modal Khóa Tính Năng Đang Phát Triển Tiểu Nguyệt AI */}
      <FeatureInDevModal
        open={vipRoleplayModalOpen}
        onClose={() => setVipRoleplayModalOpen(false)}
        featureName="Tiểu Nguyệt AI (Hội Thoại Nhập Vai)"
      />
    </div>
  );
}
