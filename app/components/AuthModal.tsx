import { Eye, EyeOff, X, Mail, Lock, User, AlertCircle, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";
import { ImperialLogoSVG } from "~/components/Icons/CustomSVGs";
import { useToast } from "~/components/Toast";
import { sound } from "~/lib/sound";

interface Props {
  open: boolean;
  mode: "login" | "register";
  onClose: () => void;
  onSwitchMode: (mode: "login" | "register") => void;
}

function GoogleIconSVG({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

export function AuthModal({ open, mode, onClose, onSwitchMode }: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const fetcher = useFetcher<any>();
  const overlayRef = useRef<HTMLDivElement>(null);
  const isLogin = mode === "login";
  const error = fetcher.data?.message || fetcher.data?.error;
  const { pushToast } = useToast();

  // Reset form when switching modes
  useEffect(() => {
    setName("");
    setEmail("");
    setPassword("");
  }, [mode]);

  // On successful auth (fetcher returns user data), immediately redirect to homepage
  useEffect(() => {
    if (fetcher.data?.user) {
      sound.playGong();
      onClose();
      window.location.href = "/";
    }
  }, [fetcher.data, onClose]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playWoodblock();
    fetcher.submit(
      isLogin ? { email, password } : { name, email, password },
      {
        method: "POST",
        action: isLogin ? "/api/auth/login" : "/api/auth/register",
        encType: "application/json",
      }
    );
  };

  const handleGoogleAuth = () => {
    sound.playWoodblock();
    pushToast("Tính năng tạm thời chưa khả dụng", "info");
   
  };

  return (
    <div
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-fadeIn"
    >
      <div className="relative w-full max-w-[440px] overflow-hidden rounded-[2.25rem] border border-amber-200/60 bg-gradient-to-b from-[#FFFDF9] via-[#FAF6F0] to-[#FAF6F0] p-6 sm:p-8 shadow-2xl shadow-slate-950/20 text-slate-900">
        {/* Decorative background glow */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition cursor-pointer z-10"
        >
          <X size={18} />
        </button>

        {/* Header with Bao Bao Mascot Logo */}
        <div className="flex flex-col items-center text-center">
          <div className="relative flex h-16 w-16 items-center justify-center p-1 drop-shadow-sm transition-transform hover:scale-105">
            <ImperialLogoSVG className="h-16 w-16" />
          </div>

          <div className="mt-3">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-800 border border-amber-200/80 mb-1">
              <Sparkles size={11} className="text-amber-600" />
              <span>HSK MASTER · 汉语学习平台</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900">
              {isLogin ? "Đăng Nhập Tài Khoản" : "Tạo Tài Khoản Mới"}
            </h2>
            <p className="mt-1 text-xs text-slate-500 max-w-xs mx-auto">
              {isLogin
                ? "Chào mừng bạn trở lại! Tiếp tục hành trình chinh phục HSK cùng Bao Bao."
                : "Bắt đầu lộ trình học tập, mở khóa 6 đại lục bài học và đấu trường game."}
            </p>
          </div>
        </div>

        {/* Segmented Mode Switcher */}
        <div className="mt-5 flex rounded-2xl bg-slate-200/70 p-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              sound.playWoodblock();
              onSwitchMode("login");
            }}
            className={`flex-1 rounded-xl py-2 transition-all cursor-pointer ${
              isLogin
                ? "bg-white text-red-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            onClick={() => {
              sound.playWoodblock();
              onSwitchMode("register");
            }}
            className={`flex-1 rounded-xl py-2 transition-all cursor-pointer ${
              !isLogin
                ? "bg-white text-red-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Đăng ký
          </button>
        </div>

        {/* Google One-Click Login */}
        <div className="mt-4">
          <button
            type="button"
            onClick={handleGoogleAuth}
            className="w-full flex items-center justify-center gap-3 rounded-2xl border border-slate-300/90 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-400 active:scale-[0.99] transition cursor-pointer"
          >
            <GoogleIconSVG className="h-4 w-4" />
            <span>Tiếp tục với Google</span>
          </button>
        </div>

        {/* Divider */}
        <div className="my-4 flex items-center gap-3 text-slate-400 text-[11px] font-medium">
          <div className="h-px flex-1 bg-slate-200" />
          <span>Hoặc với email</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {!isLogin && (
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Họ và tên
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <User size={15} />
                </span>
                <input
                  name="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 py-2.5 text-xs font-medium text-slate-900 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/10 placeholder:text-slate-400"
                  placeholder="Ví dụ: Nguyễn Văn A"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Địa chỉ Email
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <Mail size={15} />
              </span>
              <input
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 py-2.5 text-xs font-medium text-slate-900 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/10 placeholder:text-slate-400"
                placeholder="email@gmail.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Mật khẩu
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <Lock size={15} />
              </span>
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-10 py-2.5 text-xs font-medium text-slate-900 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/10 placeholder:text-slate-400"
                placeholder={isLogin ? "Nhập mật khẩu của bạn" : "Tối thiểu 6 ký tự"}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 p-2.5 text-xs font-bold text-red-600 animate-shake">
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Action */}
          <button
            type="submit"
            disabled={fetcher.state === "submitting"}
            className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 py-3 text-xs font-black text-white shadow-md shadow-red-900/20 hover:from-red-700 hover:to-rose-700 active:scale-[0.98] transition cursor-pointer disabled:opacity-50"
          >
            {fetcher.state === "submitting" ? (
              <span>Đang đăng nhập...</span>
            ) : isLogin ? (
              <span>Đăng Nhập Ngay</span>
            ) : (
              <span>Hoàn Tất Đăng Ký</span>
            )}
          </button>
        </form>

        {/* Footer info & Security note */}
        <div className="mt-4 pt-3 border-t border-amber-900/10 text-center">
          <p className="text-xs text-slate-500">
            {isLogin ? (
              <>
                Chưa có tài khoản học?{" "}
                <button
                  type="button"
                  onClick={() => {
                    sound.playWoodblock();
                    onSwitchMode("register");
                  }}
                  className="font-bold text-red-700 hover:text-red-900 transition cursor-pointer underline underline-offset-2"
                >
                  Đăng ký miễn phí
                </button>
              </>
            ) : (
              <>
                Đã có tài khoản từ trước?{" "}
                <button
                  type="button"
                  onClick={() => {
                    sound.playWoodblock();
                    onSwitchMode("login");
                  }}
                  className="font-bold text-red-700 hover:text-red-900 transition cursor-pointer underline underline-offset-2"
                >
                  Đăng nhập ngay
                </button>
              </>
            )}
          </p>

          <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-medium">
            <ShieldCheck size={12} className="text-emerald-600" />
            <span>Bảo mật dữ liệu tuyệt đối · Học tập miễn phí trọn đời</span>
          </div>
        </div>
      </div>
    </div>
  );
}
