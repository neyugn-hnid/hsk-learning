import { useState } from "react";
import { MascotPandaSVG } from "~/components/Icons/CustomSVGs";
import { sound } from "~/lib/sound";
import { Sparkles, MessageCircle, X } from "lucide-react";

const MASCOT_MESSAGES = [
  "Chào bạn hữu! Hôm nay cùng luyện thêm 10 chữ Hán nhé!",
  "Học một chữ hôm nay, ngày mai nói chuyện lưu loát!",
  "Thanh 1 thì cao và phẳng, thanh 4 thì dứt khoát hạ giọng nha!",
  "Chăm chỉ mỗi ngày, đỗ ngay HSK trong tầm tay!",
  "Bạn có biết: Chữ Hán là chữ tượng hình đẹp nhất thế giới không?",
  "Hãy ghé Vườn Cây Trí Tuệ tưới nước cho các từ sắp quên nhé!",
];

export function MascotCompanion({ onSpeechClick }: { onSpeechClick?: () => void }) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [bubbleVisible, setBubbleVisible] = useState(true);

  const handleClick = () => {
    sound.playWoodblock();
    setMsgIndex((prev) => (prev + 1) % MASCOT_MESSAGES.length);
    setBubbleVisible(true);
    if (onSpeechClick) onSpeechClick();
  };

  return (
    <div className="relative inline-flex flex-col items-center">
      {/* Speech Bubble */}
      {bubbleVisible && (
        <div className="relative mb-2 max-w-xs animate-fade-in rounded-2xl border border-red-200/80 bg-white/95 p-3 text-xs shadow-lg backdrop-blur sm:text-sm">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setBubbleVisible(false);
            }}
            className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
          >
            <X size={12} />
          </button>
          <div className="flex items-start gap-2">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <p className="font-medium text-slate-700">{MASCOT_MESSAGES[msgIndex]}</p>
          </div>
          {/* Tam giác mũi nhọn bubble */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 border-l-8 border-r-8 border-t-8 border-transparent border-t-white" />
        </div>
      )}

      {/* Interactive Mascot Bao Bao */}
      <button
        type="button"
        onClick={handleClick}
        className="group relative flex cursor-pointer flex-col items-center transition-transform hover:scale-105 active:scale-95"
        title="Bấm để trò chuyện cùng Bao Bao"
      >
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-2 border-red-300 bg-red-50 p-2 shadow-xs transition-shadow group-hover:shadow-md">
          <MascotPandaSVG className="h-16 w-16" />
          <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white shadow-sm">
            <MessageCircle size={13} />
          </span>
        </div>
        <span className="mt-1.5 rounded-full bg-slate-900 px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-white shadow-sm">
          Bao Bao
        </span>
      </button>
    </div>
  );
}
