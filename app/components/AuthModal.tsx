import { Eye, EyeOff, GraduationCap, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";

interface Props {
  open: boolean;
  mode: "login" | "register";
  onClose: () => void;
  onSwitchMode: (mode: "login" | "register") => void;
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

  // Reset form when switching modes
  useEffect(() => {
    setName("");
    setEmail("");
    setPassword("");
  }, [mode]);

  // On successful auth (fetcher done with no error), reload page
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data && !fetcher.data.message && !fetcher.data.error) {
      window.location.href = "/dashboard";
    }
  }, [fetcher.state, fetcher.data]);

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
      return () => { document.body.style.overflow = ""; };
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetcher.submit(
      isLogin
        ? { email, password }
        : { name, email, password },
      {
        method: "POST",
        action: isLogin ? "/api/auth/login" : "/api/auth/register",
        encType: "application/json",
      }
    );
  };

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
    >
      <div className="relative w-full max-w-md rounded-[2rem] border border-white/70 bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.12)] md:p-8">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <X size={20} />
        </button>

        <div className="flex items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-[1.75rem] bg-red-600 text-white shadow-lg shadow-red-100">
            <GraduationCap size={30} />
          </div>
        </div>

        <div className="mt-5 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-red-500">HSK Learning</p>
          <h1 className="mt-2 text-3xl font-black text-slate-900">
            {isLogin ? "Đăng nhập" : "Tạo tài khoản"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {isLogin
              ? "Tiếp tục lộ trình HSK, luyện phát âm, viết chữ và làm quiz trong cùng một nơi."
              : "Tạo tài khoản để bắt đầu học HSK, theo lộ trình lớp và lưu quá trình luyện tập của bạn."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          {!isLogin ? (
            <label className="block">
              <span className="text-sm font-bold text-slate-700">Họ tên</span>
              <input
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-red-400"
                placeholder="Nhập họ tên"
              />
            </label>
          ) : null}

          <label className="block">
            <span className="text-sm font-bold text-slate-700">Email</span>
            <input
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-red-400"
              placeholder="you@example.com"
            />
          </label>

          <label className="block">
            <span className="text-sm font-bold text-slate-700">Mật khẩu</span>
            <div className="relative mt-2">
              <input
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPassword ? "text" : "password"}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-12 outline-none transition focus:border-red-400"
                placeholder={isLogin ? "Nhập mật khẩu" : "Ít nhất 6 ký tự"}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          {error ? (
            <div className="rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-600">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            className="w-full rounded-2xl bg-red-600 px-5 py-3 font-bold text-white hover:bg-red-700 disabled:opacity-50"
            disabled={fetcher.state === "submitting"}
          >
            {fetcher.state === "submitting" ? "Đang xử lý..." : isLogin ? "Đăng nhập" : "Tạo tài khoản"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500">
          {isLogin ? (
            <>Chưa có tài khoản?{" "}
              <button onClick={() => onSwitchMode("register")} className="font-bold text-red-600">
                Đăng ký
              </button>
            </>
          ) : (
            <>Đã có tài khoản?{" "}
              <button onClick={() => onSwitchMode("login")} className="font-bold text-red-600">
                Đăng nhập
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
