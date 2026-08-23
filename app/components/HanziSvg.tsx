import { useEffect, useRef, useState } from "react";
import { getHanziSvgUrl } from "~/lib/hanzi-svg";

interface HanziSvgProps {
  /** Chuỗi chữ Hán (có thể nhiều ký tự) */
  chinese: string;
  /** Kích thước mỗi SVG (px) */
  size?: number;
  /** Hiển thị chữ nhỏ bên dưới SVG */
  showLabel?: boolean;
  /** CSS class cho container */
  className?: string;
  /** Lặp lại animation vẽ chữ. Nếu nhiều ký tự → tuần tự từng chữ một */
  loop?: boolean;
}

/** Thời gian mỗi ký tự animation (ms) */
const CHAR_DURATION = 12000;

/**
 * Hiển thị SVG chữ Hán từ Cloudflare R2.
 * Khi loop=true:
 * - 1 ký tự: reload ảnh mỗi 12s để lặp animation
 * - Nhiều ký tự: tuần tự từng chữ, chữ trước vẽ xong mới đến chữ sau
 */
export default function HanziSvg({ chinese, size = 120, showLabel = false, className = "", loop = false }: HanziSvgProps) {
  const chars = [...chinese];
  const hanziChars = chars.map((c) => ({ char: c, url: getHanziSvgUrl(c) }));

  // Nếu tất cả đều không phải chữ Hán → fallback text
  const allNonHanzi = hanziChars.every((h) => !h.url);
  if (allNonHanzi) {
    return (
      <div className={`flex flex-wrap items-end justify-center gap-1.5 ${className}`}>
        {chars.map((char, idx) => (
          <span key={idx} className="font-hanzi text-red-600" style={{ fontSize: size * 0.42 }} suppressHydrationWarning>
            {char}
          </span>
        ))}
      </div>
    );
  }

  // Lọc chỉ lấy chữ Hán
  const hanziOnly = hanziChars.filter((h) => h.url) as { char: string; url: string }[];

  return (
    <div className={`flex items-end justify-center gap-1.5 ${className}`}>
      {loop ? (
        <SequentialLoop chars={hanziOnly} size={size} showLabel={showLabel} />
      ) : (
        hanziOnly.map((h, idx) => (
          <div key={idx} className="flex flex-col items-center">
            <img
              src={h.url}
              alt={h.char}
              width={size}
              height={size}
              loading="lazy"
              className="select-none object-contain"
              style={{ width: size, height: size }}
              draggable={false}
            />
            {showLabel && <span className="mt-0.5 text-[10px] text-slate-400">{h.char}</span>}
          </div>
        ))
      )}
    </div>
  );
}

/** Hiển thị tuần tự từng chữ Hán, chữ trước animation xong → chữ sau */
function SequentialLoop({
  chars,
  size,
  showLabel,
}: {
  chars: { char: string; url: string }[];
  size: number;
  showLabel: boolean;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [loopKey, setLoopKey] = useState(0); // cache-buster cho img
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      const next = (activeIdx + 1) % chars.length;
      setActiveIdx(next);
      // Khi quay về chữ đầu tiên → tăng loopKey để reload ảnh
      if (next === 0) setLoopKey((k) => k + 1);
    }, CHAR_DURATION);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [activeIdx, chars.length]);

  const current = chars[activeIdx];
  if (!current) return null;

  return (
    <>
      {chars.map((h, idx) => {
        const isActive = idx === activeIdx;

        return (
          <div
            key={idx}
            className="flex flex-col items-center transition-opacity duration-300"
            style={{ opacity: isActive ? 1 : 0.2 }}
          >
            <img
              src={`${h.url}?t=${isActive ? loopKey : 0}`}
              alt={h.char}
              width={size}
              height={size}
              loading="lazy"
              className="select-none object-contain"
              style={{ width: size, height: size }}
              draggable={false}
            />
            {showLabel && <span className="mt-0.5 text-[10px] text-slate-400">{h.char}</span>}
          </div>
        );
      })}
    </>
  );
}
