import { X, Lock, Crown, Sparkles, MessageCircle, ArrowRight, LogIn, Gamepad2 } from "lucide-react";
import { useEffect } from "react";
import { Link } from "react-router";

interface Props {
  open: boolean;
  onClose: () => void;
  gameName?: string;
  user?: {
    id: string;
    name?: string | null;
    email: string;
    role: "USER" | "STUDENT" | "ADMIN";
  } | null;
}

export function VIPGameAccessModal({ open, onClose, gameName = "Trò Chơi VIP", user }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  if (!open) return null;

  const isLoggedIn = !!user;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md transition-all animate-in fade-in duration-200"
      style={{ background: "rgba(15, 23, 42, 0.7)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-amber-300/80 bg-white p-6 sm:p-8 shadow-2xl text-slate-900 animate-in zoom-in-95 duration-200 text-center">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng thông báo"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition cursor-pointer"
        >
          <X size={16} />
        </button>

        {/* Floating Crown & Lock Icon */}
        <div className="mx-auto mt-2 flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-50 border-2 border-amber-200 p-3 shadow-inner relative">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 via-amber-600 to-yellow-600 text-white shadow-lg ring-2 ring-amber-300/40">
            <Crown size={28} className="text-yellow-200 animate-bounce" />
          </div>
          <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white shadow-sm border-2 border-white">
            <Lock size={12} />
          </div>
        </div>

        {/* VIP Badge */}
        <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50/90 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-amber-900 shadow-xs">
          <Sparkles size={13} className="text-amber-600" />
          <span>Đặc Quyền Học Viên VIP</span>
        </div>

        {/* Title */}
        <h3 className="mt-3 text-xl sm:text-2xl font-black tracking-tight text-slate-900">
          Mở Khóa {gameName}
        </h3>

        {/* Description Box */}
        <div className="mt-3 rounded-2xl border border-amber-200/80 bg-amber-50/60 p-4 text-xs sm:text-sm text-slate-700 leading-relaxed space-y-1.5 text-left">
          {!isLoggedIn ? (
            <>
              <p className="font-bold text-amber-900">
                Trò chơi này yêu cầu đăng nhập tài khoản Học Viên VIP để tham gia.
              </p>
              <p className="text-slate-600 text-[11px] sm:text-xs">
                Bạn vui lòng đăng nhập tài khoản của mình hoặc liên hệ Quản trị viên để được cấp tài khoản trải nghiệm toàn bộ kho game 3D & AI cao cấp!
              </p>
            </>
          ) : (
            <>
              <p className="font-bold text-amber-900">
                Xin chào <span className="text-red-600">{user?.name || user?.email}</span>!
              </p>
              <p className="text-slate-600 text-[11px] sm:text-xs">
                Tài khoản của bạn hiện là <span className="font-semibold text-slate-800">Thành Viên Miễn Phí</span>. Hãy liên hệ Quản trị viên để nâng cấp lên <span className="font-bold text-amber-700">Học Viên VIP</span> và mở khóa không giới hạn game này.
              </p>
            </>
          )}
        </div>

        {/* Call to Actions */}
        <div className="mt-5 space-y-2.5">
          {!isLoggedIn ? (
            <>
              <Link
                to="/login"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 py-3.5 text-xs font-black text-white shadow-md shadow-red-600/20 active:scale-95 transition cursor-pointer"
              >
                <LogIn size={15} />
                <span>Đăng Nhập Tài Khoản Ngay</span>
                <ArrowRight size={14} />
              </Link>

              <a
                href="https://zalo.me"
                target="_blank"
                rel="noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-amber-300 bg-amber-50/80 hover:bg-amber-100/80 py-3 text-xs font-bold text-amber-950 transition cursor-pointer"
              >
                <MessageCircle size={15} className="text-amber-700" />
                <span>Liên Hệ Quản Trị Viên (Zalo / Hotline)</span>
              </a>
            </>
          ) : (
            <a
              href="https://zalo.me"
              target="_blank"
              rel="noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 py-3.5 text-xs font-black text-white shadow-md shadow-amber-600/20 active:scale-95 transition cursor-pointer"
            >
              <Crown size={15} className="text-yellow-200" />
              <span>Nâng Cấp Học Viên VIP (Zalo / Hotline)</span>
              <ArrowRight size={14} />
            </a>
          )}

          <button
            type="button"
            onClick={onClose}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 py-2.5 text-xs font-semibold text-slate-600 transition cursor-pointer"
          >
            <Gamepad2 size={14} />
            <span>Chơi Các Game Miễn Phí Khác</span>
          </button>
        </div>

        {/* Footer info */}
        <p className="mt-4 text-[11px] text-slate-400 font-medium">
          Trung tâm Hán Ngữ · Đặc quyền tài khoản VIP
        </p>
      </div>
    </div>
  );
}
