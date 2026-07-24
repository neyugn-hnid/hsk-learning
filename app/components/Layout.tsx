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
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Form, Link, NavLink, useLocation } from "react-router";
import { AIChatWidget } from "~/components/AIChatWidget";
import { useAuth } from "~/components/AuthProvider";
import { useToast } from "~/components/Toast";

export function SiteLayout({
  children,
  user,
  hideFooter,
}: {
  children: React.ReactNode;
  user?: any;
  hideFooter?: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const location = useLocation();
  const { openLogin, openRegister } = useAuth();
  const { pushToast } = useToast();

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
    { to: "/lessons", label: "Bài học", icon: BookOpen },
    { to: "/roadmap", label: "Lộ trình", icon: Map },
  ];

  const bottomTabs = [
    { to: "/", label: "Trang chủ", icon: Home },
    { to: "/lessons", label: "Bài học", icon: BookOpen },
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
    <div className="flex flex-col min-h-screen pb-24 md:pb-0">
      {/* Top header bar */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 md:py-4">
          <Link to="/" prefetch="render" className="flex shrink-0 items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-600 text-white shadow-sm">
              <GraduationCap size={22} />
            </div>
            <div className="text-left">
              <p className="text-lg font-bold">HSK Learning</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {desktopMenus.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.to);
              const isProtected = item.to === "/roadmap" || item.to === "/lessons";

              if (isProtected && !user) {
                return (
                  <button
                    key={item.to}
                    onClick={() => handleProtectedClick(item.label)}
                    className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                  >
                    <Icon size={16} />
                    {item.label}
                  </button>
                );
              }

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  prefetch="render"
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-red-50 text-red-600"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Icon size={16} />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          <div className="relative flex items-center gap-2" ref={menuRef}>
            {!user ? (
              <>
                <button
                  type="button"
                  onClick={handleOpenLogin}
                  className="hidden rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 md:inline-flex"
                >
                  Đăng nhập
                </button>
                <button
                  type="button"
                  onClick={handleOpenRegister}
                  className="hidden rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 md:inline-flex"
                >
                  Bắt đầu học
                </button>
              </>
            ) : null}

            {user ? (
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                aria-label="Mở menu tài khoản"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50"
              >
                <User size={20} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleOpenLogin}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 md:hidden"
                aria-label="Đăng nhập"
              >
                <User size={20} />
              </button>
            )}

            {user && menuOpen ? (
              <div className="absolute right-4 top-[calc(100%-0.25rem)] w-56 overflow-hidden rounded-3xl border border-slate-200 bg-white p-2 shadow-xl md:right-4">
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-sm font-bold text-slate-900">{user.name}</p>
                  {user.email ? (
                    <p className="mt-1 text-xs text-slate-500">{user.email}</p>
                  ) : null}
                  
                </div>
                <div className="mt-2 space-y-1">
                  <Link
                    to="/profile"
                    prefetch="intent"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    <User size={16} />
                    Hồ sơ
                  </Link>
                  {user?.role === "ADMIN" ? (
                    <Link
                      to="/admin"
                      prefetch="intent"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      <Shield size={16} />
                      Quản trị
                    </Link>
                  ) : null}
                </div>
                <Form method="post" action="/api/auth/logout" className="mt-2">
                  <button
                    type="submit"
                    className="flex w-full items-center gap-2 rounded-xl px-4 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
                  >
                    <LogOut size={16} />
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

      {/* Bottom tab bar - mobile only */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 shadow-[0_-12px_30px_rgba(15,23,42,0.08)] md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-3 gap-2">
          {bottomTabs.map((tab) => {
            const Icon = tab.icon;
            const active = isActive(tab.to);
            const isProtected = tab.to === "/roadmap" || tab.to === "/lessons";

            if (isProtected && !user) {
              return (
                <button
                  key={tab.to}
                  onClick={() => handleProtectedClick(tab.label)}
                  className="flex flex-col items-center justify-center rounded-2xl px-2 py-2 text-[11px] font-bold text-slate-400"
                >
                  <Icon size={22} strokeWidth={2} />
                  <span className="mt-1 leading-none">{tab.label}</span>
                </button>
              );
            }

            return (
              <NavLink
                key={tab.to}
                to={tab.to}
                prefetch="viewport"
                className={`flex flex-col items-center justify-center rounded-2xl px-2 py-2 text-[11px] font-bold ${
                  active
                    ? "bg-red-50 text-red-600"
                    : "text-slate-400"
                }`}
              >
                <Icon size={22} strokeWidth={active ? 2.5 : 2} />
                <span className="mt-1 leading-none">{tab.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>

      {!hideFooter ? (
      <footer className="mt-16 border-t border-slate-200 bg-slate-950 text-slate-300">
        <div className="mx-auto max-w-7xl px-4 py-12 md:py-14">
          <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1.1fr]">
            <div>
              <Link to="/" prefetch="intent" className="inline-flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-600 text-white shadow-lg shadow-red-950/30">
                  <GraduationCap size={24} />
                </span>
                <span>
                  <span className="block text-lg font-black text-white">HSK Learning</span>
                  <span className="block text-xs font-semibold text-slate-400">
                    Học tiếng Trung theo lộ trình
                  </span>
                </span>
              </Link>
              <p className="mt-5 max-w-sm text-sm leading-6 text-slate-400">
                Nền tảng học HSK, luyện từ vựng, chữ Hán, phát âm và quiz theo từng bài học cho người học tiếng Trung tại Việt Nam.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {["HSK 2.0", "HSK 3.0", "Lộ trình", "AI Practice"].map((label) => (
                  <span
                    key={label}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-bold text-slate-300"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-white">
                Khám phá
              </h2>
              <div className="mt-5 grid gap-3 text-sm">
                <Link to="/" prefetch="intent" className="text-slate-400 transition hover:text-white">
                  Trang chủ
                </Link>
                {user ? (
                  <Link to="/lessons" prefetch="intent" className="text-slate-400 transition hover:text-white">
                    Bài học HSK
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleProtectedClick("Bài học")}
                    className="text-left text-slate-400 transition hover:text-white"
                  >
                    Bài học HSK
                  </button>
                )}
                {user ? (
                  <Link to="/roadmap" prefetch="intent" className="text-slate-400 transition hover:text-white">
                    Lộ trình học
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleProtectedClick("Lộ trình")}
                    className="text-left text-slate-400 transition hover:text-white"
                  >
                    Lộ trình học
                  </button>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-white">
                Công cụ học
              </h2>
              <div className="mt-5 grid gap-3 text-sm">
                <span className="inline-flex items-center gap-2 text-slate-400">
                  <BookOpen size={15} className="text-red-400" />
                  Từ vựng theo bài
                </span>
                <span className="inline-flex items-center gap-2 text-slate-400">
                  <CheckCircle2 size={15} className="text-emerald-400" />
                  Quiz ghi nhớ
                </span>
                <span className="inline-flex items-center gap-2 text-slate-400">
                  <Sparkles size={15} className="text-amber-300" />
                  Luyện chữ Hán
                </span>
                <span className="inline-flex items-center gap-2 text-slate-400">
                  <Bot size={15} className="text-sky-300" />
                  Trợ lý AI
                </span>
              </div>
            </div>

            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-white">
                Tài khoản
              </h2>
              <p className="mt-5 text-sm leading-6 text-slate-400">
                Lưu tiến độ học, theo dõi bài đã hoàn thành và tiếp tục lộ trình ở mọi thiết bị.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {user ? (
                  <Link
                    to="/profile"
                    prefetch="intent"
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-red-50"
                  >
                    <User size={16} />
                    Hồ sơ
                  </Link>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleOpenRegister}
                      className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-500"
                    >
                      <GraduationCap size={16} />
                      Bắt đầu học
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenLogin}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/10"
                    >
                      Đăng nhập
                    </button>
                  </>
                )}
              </div>
              <p className="mt-4 inline-flex items-center gap-2 text-xs text-slate-500">
                <Mail size={14} />
                Hỗ trợ học tập trong ứng dụng
              </p>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-6 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
            <p>© 2026 HSK Learning Platform. All rights reserved.</p>
            <p>Thiết kế cho học HSK · Lộ trình lớp · Luyện tập mỗi ngày</p>
          </div>
        </div>
      </footer>
      ) : null}
    </div>
  );
}
