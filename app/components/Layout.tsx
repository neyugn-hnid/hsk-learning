import {
  BookOpen,
  User,
  GraduationCap,
  Home,
  LogOut,
  Map,
  Settings,
  Shield,
  Sparkles,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Form, Link, NavLink, useLocation } from "react-router";
import { AIChatWidget } from "~/components/AIChatWidget";

export function SiteLayout({
  children,
  user,
}: {
  children: React.ReactNode;
  user?: any;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const location = useLocation();

  const isActive = (to: string) => {
    if (to === "/") return location.pathname === "/";
    return location.pathname.startsWith(to);
  };

  const desktopMenus = [
    { to: "/", label: "Trang chủ", icon: Home },
    { to: "/hsk20", label: "HSK 2.0", icon: BookOpen },
    { to: "/hsk30", label: "HSK 3.0", icon: Sparkles },
    { to: "/roadmap", label: "Lộ trình", icon: Map },
  ];

  const bottomTabs = [
    { to: "/hsk20", label: "HSK 2.0", icon: BookOpen },
    { to: "/hsk30", label: "HSK 3.0", icon: Sparkles },
    { to: "/roadmap", label: "Lộ trình", icon: Map },
  ];

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
          <Link to="/" className="flex shrink-0 items-center gap-2">
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
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
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
              <Link
                to="/register"
                className="hidden rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 lg:flex"
              >
                Bắt đầu học
              </Link>
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
              <Link
                to="/login"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 md:hidden"
              >
                <User size={20} />
              </Link>
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
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    <User size={16} />
                    Hồ sơ
                  </Link>
                  {user?.role === "ADMIN" ? (
                    <Link
                      to="/admin"
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

      {/* Bottom tab bar - mobile only (iOS-style) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 shadow-[0_-12px_30px_rgba(15,23,42,0.08)] md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-3 gap-2">
          {bottomTabs.map((tab) => {
            const Icon = tab.icon;
            const active = isActive(tab.to);
            return (
              <NavLink
                key={tab.to}
                to={tab.to}
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

      <footer className="mt-16 hidden border-t border-slate-200 bg-white md:block">
        <div className="mx-auto flex max-w-7xl justify-between px-4 py-8 text-sm text-slate-500">
          <p>© 2026 HSK Learning Platform</p>
          <p>Học theo lộ trình · Học HSK · Luyện quiz</p>
        </div>
      </footer>
    </div>
  );
}
