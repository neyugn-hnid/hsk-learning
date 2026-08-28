import { X, Wrench, ArrowLeft, Bot } from "lucide-react";
import { useEffect } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  featureName?: string;
}

export function FeatureInDevModal({
  open,
  onClose,
  featureName = "Tiểu Nguyệt AI (Hội Thoại Nhập Vai)",
}: Props) {
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

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md transition-all animate-in fade-in duration-200"
      style={{ background: "rgba(15, 23, 42, 0.7)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl text-slate-900 animate-in zoom-in-95 duration-200 text-center">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng thông báo"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition cursor-pointer"
        >
          <X size={16} />
        </button>

        {/* Floating Dev Robot Icon */}
        <div className="mx-auto mt-2 flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-50 border-2 border-amber-200 p-3 shadow-inner relative">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg ring-2 ring-amber-300/40">
            <Bot size={28} className="text-white animate-pulse" />
          </div>
          <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-amber-300 shadow-sm border-2 border-white">
            <Wrench size={12} />
          </div>
        </div>

        {/* Dev Badge */}
        <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50/90 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-amber-900 shadow-xs">
          <Wrench size={13} className="text-amber-600" />
          <span>Tính Năng Đang Phát Triển</span>
        </div>

        {/* Title */}
        <h3 className="mt-3 text-xl sm:text-2xl font-black tracking-tight text-slate-900">
          {featureName}
        </h3>

        {/* Description Box */}
        <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs sm:text-sm text-slate-700 leading-relaxed space-y-2 text-left">
          <p className="font-bold text-slate-900">
            Tính năng trò chuyện và hội thoại nhập vai thông minh cùng Tiểu Nguyệt AI hiện đang trong giai đoạn phát triển và nâng cấp.
          </p>
          <p className="text-slate-500 text-[11px] sm:text-xs">
            Hệ thống tạm thời khóa tính năng này đối với tất cả học viên và người dùng (chỉ tài khoản Quản trị viên ADMIN có quyền truy cập để kiểm thử). Bạn vui lòng quay lại sau khi tính năng ra mắt chính thức nhé!
          </p>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 py-3 text-xs sm:text-sm font-black text-white hover:bg-red-700 shadow-md shadow-red-600/20 active:scale-[0.98] transition cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Đã Hiểu, Quay Lại Sau</span>
          </button>
        </div>
      </div>
    </div>
  );
}
