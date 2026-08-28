import { X, Lock, ShieldAlert, GraduationCap, PhoneCall, MessageCircle, ArrowRight, Compass } from "lucide-react";
import { useEffect } from "react";
import { Link } from "react-router";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function RoadmapAccessModal({ open, onClose }: Props) {
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
      style={{ background: "rgba(15, 23, 42, 0.65)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-amber-200/80 bg-white p-6 sm:p-8 shadow-2xl text-slate-900 animate-in zoom-in-95 duration-200 text-center">
        {/* Top Accent Strip */}
        

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng thông báo"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition cursor-pointer"
        >
          <X size={16} />
        </button>

        {/* Floating Lock & Seal Icon */}
        <div className="mx-auto mt-2 flex h-20 w-20 items-center justify-center rounded-3xl bg-red-50 border-2 border-red-200 p-3 shadow-inner">
          <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-red-600 to-rose-700 text-white shadow-md">
            <Lock size={28} />
          </div>
        </div>

        {/* Badge */}
        <div className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-black uppercase tracking-wider text-red-700">
          <GraduationCap size={13} />
          <span>Dành Riêng Cho Học Viên</span>
        </div>

        {/* Main Content */}
        <h3 className="mt-3 text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
          Lộ Trình Riêng Tại Trung Tâm Hán Ngữ
        </h3>

        <div className="mt-3 rounded-2xl border border-amber-200/80 bg-amber-50/70 p-4 text-xs sm:text-sm font-semibold text-amber-950 leading-relaxed space-y-1">
          <p className="font-bold text-red-700">
            Đây là lộ trình riêng tại trung tâm Hán Ngữ.
          </p>
          <p className="text-slate-600 font-medium">
            Vui lòng liên hệ Quản trị viên để nhận tài khoản học viên và mở khóa toàn bộ bài giảng.
          </p>
        </div>

        {/* Contact Hotline / Admin Support */}
        <div className="mt-5 space-y-2.5">
          <a
            href="https://zalo.me"
            target="_blank"
            rel="noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 py-3.5 text-xs font-black text-white shadow-md shadow-red-600/20 active:scale-95 transition cursor-pointer"
          >
            <MessageCircle size={16} />
            <span>Liên Hệ Quản Trị Viên (Zalo / Hotline)</span>
          </a>

          <Link
            to="/game-map"
            onClick={onClose}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 py-3 text-xs font-bold text-slate-700 transition cursor-pointer"
          >
            <Compass size={15} className="text-red-600" />
            <span>Khám Phá Bản Đồ HSK Miễn Phí</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* Bottom Notice */}
        <p className="mt-4 text-[11px] text-slate-400 font-medium">
          Trung tâm Hán Ngữ · Hệ thống đào tạo HSK chuẩn quốc tế
        </p>
      </div>
    </div>
  );
}
