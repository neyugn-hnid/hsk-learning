import React from "react";

/**
 * Bộ sưu tập SVG Vectors chuyên biệt cho HSK Learning.
 * 100% Thuần SVG, không dùng emoji text, hỗ trợ animation và gradient hiện đại.
 */

export function ImperialLogoSVG({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Tai gấu trúc Bao Bao */}
      <circle cx="13" cy="13" r="7" fill="#1E293B" />
      <circle cx="13" cy="13" r="3.5" fill="#475569" />
      <circle cx="35" cy="13" r="7" fill="#1E293B" />
      <circle cx="35" cy="13" r="3.5" fill="#475569" />

      {/* Đầu gấu trúc Bao Bao */}
      <ellipse cx="24" cy="27" rx="18" ry="16" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.2" />

      {/* Mũ trạng nguyên đỏ son */}
      <path d="M15 11 L24 4 L33 11 L24 13.5 Z" fill="#DC2626" stroke="#991B1B" strokeWidth="1" />
      <circle cx="24" cy="4" r="2.2" fill="#FBBF24" />
      <line x1="24" y1="5" x2="32" y2="12" stroke="#F59E0B" strokeWidth="1.4" strokeLinecap="round" />

      {/* Đốm mắt đen Bao Bao */}
      <ellipse cx="17" cy="25" rx="5" ry="6" transform="rotate(-15 17 25)" fill="#1E293B" />
      <ellipse cx="31" cy="25" rx="5" ry="6" transform="rotate(15 31 25)" fill="#1E293B" />

      {/* Tròng mắt sáng long lanh */}
      <circle cx="17.5" cy="24" r="1.8" fill="#FFFFFF" />
      <circle cx="18.5" cy="25.8" r="0.8" fill="#FFFFFF" />
      <circle cx="30.5" cy="24" r="1.8" fill="#FFFFFF" />
      <circle cx="31.5" cy="25.8" r="0.8" fill="#FFFFFF" />

      {/* Má hồng hào */}
      <ellipse cx="11.5" cy="30.5" rx="3.2" ry="1.8" fill="#FDA4AF" opacity="0.85" />
      <ellipse cx="36.5" cy="30.5" rx="3.2" ry="1.8" fill="#FDA4AF" opacity="0.85" />

      {/* Mũi & miệng cười đáng yêu */}
      <ellipse cx="24" cy="30" rx="2" ry="1.5" fill="#1E293B" />
      <path d="M21 33 Q24 36.5 27 33" stroke="#1E293B" strokeWidth="1.4" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function NavCompassSVG({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.8" />
      <polygon points="12,6 15,12 12,18 9,12" fill="#E11D48" />
      <polygon points="12,6 15,12 12,12" fill="#F43F5E" />
      <polygon points="12,18 9,12 12,12" fill="#94A3B8" />
      <circle cx="12" cy="12" r="1.5" fill="#FFFFFF" />
    </svg>
  );
}

export function NavGamepadSVG({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect x="2" y="6" width="20" height="12" rx="6" stroke="currentColor" strokeWidth="1.8" fill="none" />
      <path d="M6 12H10M8 10V14" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" />
      <circle cx="15" cy="10" r="1.2" fill="#EC4899" />
      <circle cx="17.5" cy="12.5" r="1.2" fill="#F59E0B" />
      <circle cx="15" cy="15" r="1.2" fill="#10B981" />
    </svg>
  );
}

export function NavGardenSVG({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M12 21V12" stroke="#15803D" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 12C8 12 5 8 6 5C9 5 12 8 12 12Z" fill="#22C55E" />
      <path d="M12 10C16 10 19 6 18 3C15 3 12 6 12 10Z" fill="#16A34A" />
      <circle cx="12" cy="4" r="2" fill="#FBBF24" />
    </svg>
  );
}

export function LuoyangPagodaSVG({ className = "w-16 h-16" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Mái tháp cổ kính 3 tầng */}
      <path d="M50 10 L45 22 L55 22 Z" fill="#DC2626" />
      <path d="M25 32 Q50 20 75 32 L70 38 Q50 28 30 38 Z" fill="#B91C1C" stroke="#991B1B" strokeWidth="1" />
      <rect x="34" y="38" width="32" height="14" fill="#FEF3C7" stroke="#D97706" strokeWidth="1" />
      <path d="M18 52 Q50 38 82 52 L76 58 Q50 46 24 58 Z" fill="#DC2626" stroke="#991B1B" strokeWidth="1" />
      <rect x="28" y="58" width="44" height="16" fill="#FEF3C7" stroke="#D97706" strokeWidth="1" />
      {/* Cổng tam quan tầng trệt */}
      <path d="M12 74 Q50 58 88 74 L82 80 Q50 66 18 80 Z" fill="#B91C1C" stroke="#991B1B" strokeWidth="1" />
      <rect x="22" y="80" width="56" height="18" fill="#FDE68A" stroke="#B45309" strokeWidth="1" />
      <path d="M42 84 Q50 80 58 84 V98 H42 Z" fill="#78350F" />
      {/* Cành hoa đào nở rộ */}
      <circle cx="82" cy="30" r="3.5" fill="#FDA4AF" />
      <circle cx="86" cy="34" r="2.5" fill="#F43F5E" />
      <circle cx="78" cy="36" r="3" fill="#FB7185" />
    </svg>
  );
}

export function ChengduBambooSVG({ className = "w-16 h-16" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* 3 Thân cây trúc xanh ngọc */}
      <path d="M30 95 V15" stroke="#16A34A" strokeWidth="6" strokeLinecap="round" />
      <path d="M26 40 H34 M26 65 H34 M26 90 H34" stroke="#14532D" strokeWidth="2" />
      <path d="M50 95 V8" stroke="#15803D" strokeWidth="7" strokeLinecap="round" />
      <path d="M45 30 H55 M45 55 H55 M45 80 H55" stroke="#14532D" strokeWidth="2.5" />
      <path d="M72 95 V25" stroke="#22C55E" strokeWidth="5.5" strokeLinecap="round" />
      <path d="M68 48 H76 M68 72 H76" stroke="#14532D" strokeWidth="2" />
      {/* Tán lá trúc rũ mềm mại */}
      <path d="M50 30 Q30 20 20 28 Q35 32 50 30 Z" fill="#4ADE80" />
      <path d="M50 55 Q70 45 82 52 Q65 60 50 55 Z" fill="#22C55E" />
      <path d="M30 40 Q15 35 8 42 Q20 48 30 40 Z" fill="#86EFAC" />
      <path d="M72 48 Q90 40 96 48 Q82 55 72 48 Z" fill="#4ADE80" />
      {/* Dòng suối uốn lượn dưới chân */}
      <path d="M5 92 Q50 82 95 92" stroke="#38BDF8" strokeWidth="4" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function ShanghaiSkylineSVG({ className = "w-16 h-16" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Tháp Đông Phương Minh Châu (Oriental Pearl Tower) */}
      <line x1="45" y1="95" x2="45" y2="8" stroke="#3B82F6" strokeWidth="3" />
      <circle cx="45" cy="72" r="10" fill="#EC4899" stroke="#BE185D" strokeWidth="1.5" />
      <circle cx="45" cy="40" r="7" fill="#F43F5E" stroke="#BE123C" strokeWidth="1.2" />
      <circle cx="45" cy="20" r="3.5" fill="#FB7185" />
      {/* Tòa nhà chọc trời Thượng Hải */}
      <rect x="62" y="32" width="16" height="63" rx="2" fill="#0284C7" />
      <line x1="70" y1="32" x2="70" y2="18" stroke="#0369A1" strokeWidth="2" />
      <rect x="18" y="55" width="14" height="40" rx="2" fill="#6366F1" />
      {/* Sóng nước Hoàng Phố */}
      <path d="M5 95 Q25 90 50 95 T95 95" stroke="#38BDF8" strokeWidth="3" fill="none" />
    </svg>
  );
}

export function ForbiddenCityPalaceSVG({ className = "w-16 h-16" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Mái ngói lưu ly vàng Điện Thái Hòa */}
      <path d="M50 18 L15 38 Q50 30 85 38 Z" fill="#F59E0B" stroke="#D97706" strokeWidth="1.5" />
      <rect x="25" y="38" width="50" height="12" fill="#DC2626" />
      <path d="M50 46 L8 64 Q50 54 92 64 Z" fill="#FBBF24" stroke="#D97706" strokeWidth="2" />
      {/* Cột cung đình màu đỏ chu sa */}
      <rect x="18" y="64" width="64" height="28" fill="#B91C1C" />
      <rect x="24" y="66" width="6" height="26" fill="#DC2626" />
      <rect x="42" y="66" width="6" height="26" fill="#DC2626" />
      <rect x="52" y="66" width="6" height="26" fill="#DC2626" />
      <rect x="70" y="66" width="6" height="26" fill="#DC2626" />
      {/* Cửa son hoàng gia dát vàng */}
      <rect x="36" y="74" width="28" height="18" fill="#78350F" stroke="#FDE047" strokeWidth="1" />
      {/* Đám mây bồng bềnh đỉnh núi */}
      <path d="M5 88 Q20 80 35 88 M65 88 Q80 80 95 88" stroke="#FEF3C7" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function TreasureChestSVG({ className = "w-12 h-12", isOpened = false }: { className?: string; isOpened?: boolean }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="chestWood" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#78350F" />
        </linearGradient>
        <linearGradient id="chestGold" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
      {/* Thân rương */}
      <rect x="6" y="20" width="36" height="22" rx="4" fill="url(#chestWood)" stroke="#451A03" strokeWidth="1.5" />
      {/* Viền kim loại dát vàng */}
      <rect x="6" y="20" width="36" height="5" fill="url(#chestGold)" />
      <rect x="10" y="20" width="4" height="22" fill="url(#chestGold)" />
      <rect x="34" y="20" width="4" height="22" fill="url(#chestGold)" />
      {/* Ổ khóa ngọc bích */}
      <circle cx="24" cy="27" r="4" fill="#0284C7" stroke="#BAE6FD" strokeWidth="1" />
      <rect x="22.5" y="27" width="3" height="4" fill="#0369A1" />

      {/* Nắp rương (Mở hoặc đóng) */}
      {!isOpened ? (
        <path d="M6 20 C6 12 14 8 24 8 C34 8 42 12 42 20 Z" fill="url(#chestWood)" stroke="#451A03" strokeWidth="1.5" />
      ) : (
        <path d="M6 14 C6 6 14 2 24 2 C34 2 42 6 42 14 Z" fill="url(#chestWood)" stroke="#451A03" strokeWidth="1.5" transform="rotate(-25 6 14)" />
      )}
    </svg>
  );
}

export function StreakFlameSVG({ className = "w-5 h-5", animate = false }: { className?: string; animate?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${className} ${animate ? "animate-bounce" : ""}`}>
      <defs>
        <linearGradient id="flameGrad" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="50%" stopColor="#F97316" />
          <stop offset="100%" stopColor="#DC2626" />
        </linearGradient>
        <linearGradient id="innerFlameGrad" x1="12" y1="8" x2="12" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
      <path
        d="M12 2C9.5 6 7 8.5 7 13C7 16.866 10.134 20 14 20C17.866 20 21 16.866 21 13C21 7.5 16 4 12 2Z"
        fill="url(#flameGrad)"
      />
      <path
        d="M12 9C10.5 11.5 9 13.5 9 15.5C9 17.433 10.567 19 12.5 19C14.433 19 16 17.433 16 15.5C16 12 14 10.5 12 9Z"
        fill="url(#innerFlameGrad)"
      />
      <path
        d="M6 14C4.5 15.5 4 17 4 18C4 20.209 5.791 22 8 22C10 22 11 21 12 20C9.5 20 7 18 6 14Z"
        fill="#EA580C"
      />
    </svg>
  );
}

export function ExpLightningSVG({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="expGrad" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="100%" stopColor="#CA8A04" />
        </linearGradient>
      </defs>
      <path
        d="M13 2L3 14H12L11 22L21 10H12L13 2Z"
        fill="url(#expGrad)"
        stroke="#EAB308"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function GemDiamondSVG({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="gemGrad" x1="2" y1="8" x2="22" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="50%" stopColor="#0284C7" />
          <stop offset="100%" stopColor="#0369A1" />
        </linearGradient>
      </defs>
      <path
        d="M6 3H18L22 9L12 21L2 9L6 3Z"
        fill="url(#gemGrad)"
        stroke="#7DD3FC"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M2 9H22M12 21L7.5 9L10 3M12 21L16.5 9L14 3"
        stroke="#BAE6FD"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function HeartEnergySVG({ className = "w-5 h-5", full = true }: { className?: string; full?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="heartGrad" x1="12" y1="3" x2="12" y2="21" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FB7185" />
          <stop offset="100%" stopColor="#E11D48" />
        </linearGradient>
      </defs>
      <path
        d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z"
        fill={full ? "url(#heartGrad)" : "#CBD5E1"}
        stroke={full ? "#BE123C" : "#94A3B8"}
        strokeWidth="1.2"
      />
    </svg>
  );
}

export function MascotPandaSVG({
  className = "w-16 h-16",
  mood = "happy",
}: {
  className?: string;
  mood?: "happy" | "waving" | "studying" | "celebrating";
}) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Tai trái & phải */}
      <circle cx="28" cy="28" r="14" fill="#1E293B" />
      <circle cx="28" cy="28" r="7" fill="#475569" />
      <circle cx="72" cy="28" r="14" fill="#1E293B" />
      <circle cx="72" cy="28" r="7" fill="#475569" />

      {/* Đầu gấu trúc */}
      <ellipse cx="50" cy="52" rx="36" ry="32" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2" />

      {/* Mũ trạng nguyên cổ trang Á Đông */}
      <path d="M30 22 L50 12 L70 22 L50 26 Z" fill="#DC2626" stroke="#991B1B" strokeWidth="1.5" />
      <circle cx="50" cy="12" r="3.5" fill="#FBBF24" />
      <line x1="50" y1="14" x2="66" y2="24" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />

      {/* Đốm mắt đen đặc trưng */}
      <ellipse cx="36" cy="48" rx="10" ry="12" transform="rotate(-15 36 48)" fill="#1E293B" />
      <ellipse cx="64" cy="48" rx="10" ry="12" transform="rotate(15 64 48)" fill="#1E293B" />

      {/* Đồng tử mắt long lanh */}
      <circle cx="37" cy="46" r="3.5" fill="#FFFFFF" />
      <circle cx="39" cy="49" r="1.5" fill="#FFFFFF" />
      <circle cx="63" cy="46" r="3.5" fill="#FFFFFF" />
      <circle cx="65" cy="49" r="1.5" fill="#FFFFFF" />

      {/* Má hồng hào */}
      <ellipse cx="26" cy="58" rx="6" ry="3.5" fill="#FDA4AF" opacity="0.75" />
      <ellipse cx="74" cy="58" rx="6" ry="3.5" fill="#FDA4AF" opacity="0.75" />

      {/* Mũi & miệng cười */}
      <ellipse cx="50" cy="57" rx="4" ry="3" fill="#1E293B" />
      <path
        d="M44 62 Q50 68 56 62"
        stroke="#1E293B"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export function MahjongTileSVG({ className = "w-8 h-10", char = "中" }: { className?: string; char?: string }) {
  return (
    <svg viewBox="0 0 60 80" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="mahjongFace" x1="0" y1="0" x2="60" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFDF7" />
          <stop offset="100%" stopColor="#F3EAD8" />
        </linearGradient>
      </defs>
      {/* Khối quân bài 3D mạt chược */}
      <rect x="2" y="2" width="56" height="74" rx="8" fill="#15803D" />
      <rect x="2" y="2" width="56" height="70" rx="7" fill="url(#mahjongFace)" stroke="#D6D3D1" strokeWidth="1.5" />
      <text
        x="30"
        y="46"
        textAnchor="middle"
        dominantBaseline="central"
        fill="#DC2626"
        fontSize="30"
        fontWeight="bold"
        fontFamily="KaiTi, 'Noto Serif SC', serif"
      >
        {char}
      </text>
    </svg>
  );
}

export function SproutSeedSVG({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <radialGradient id="seedSoil" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#78350F" />
          <stop offset="70%" stopColor="#451A03" />
          <stop offset="100%" stopColor="#291102" />
        </radialGradient>
        <linearGradient id="seedSproutGrad" x1="24" y1="36" x2="24" y2="14" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#65A30D" />
          <stop offset="40%" stopColor="#84CC16" />
          <stop offset="100%" stopColor="#A3E635" />
        </linearGradient>
        <linearGradient id="seedShell" x1="18" y1="28" x2="30" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#92400E" />
          <stop offset="100%" stopColor="#5B21B6" />
        </linearGradient>
      </defs>

      {/* Đất mùn hữu cơ và sỏi */}
      <ellipse cx="24" cy="40" rx="20" ry="6" fill="url(#seedSoil)" opacity="0.85" />
      <ellipse cx="24" cy="39" rx="16" ry="4.5" fill="#5A2E0C" />
      <circle cx="12" cy="41" r="1.5" fill="#78350F" />
      <circle cx="34" cy="40" r="1.2" fill="#854D0E" />
      <circle cx="28" cy="42" r="1" fill="#713F12" />

      {/* Hạt mầm nứt vỏ */}
      <path d="M18 36 C16 32 20 28 24 30 C28 28 32 32 30 36 C28 40 20 40 18 36 Z" fill="url(#seedShell)" />
      <path d="M22 34 Q24 38 26 34" stroke="#D97706" strokeWidth="1.2" strokeLinecap="round" />

      {/* Mầm non vươn lên từ kẽ hạt */}
      <path d="M24 32 C23 25 21 22 17 18 C22 18 24 22 24 30" fill="url(#seedSproutGrad)" />
      <path d="M24 30 C25 24 27 20 31 16 C27 17 25 21 24 30" fill="#4D7C0F" />

      {/* 2 lá mầm mơn mởn khép hờ */}
      <path d="M17 18 C14 16 16 12 21 14 C22 16 20 18 17 18 Z" fill="#BEF264" stroke="#65A30D" strokeWidth="0.8" />
      <path d="M31 16 C34 14 32 10 27 12 C26 14 28 16 31 16 Z" fill="#84CC16" stroke="#4D7C0F" strokeWidth="0.8" />

      {/* Giọt sương sớm đọng trên lá */}
      <circle cx="20" cy="14" r="1.2" fill="#FFFFFF" opacity="0.9" />
      <circle cx="28" cy="13" r="1" fill="#FFFFFF" opacity="0.8" />
    </svg>
  );
}

export function SproutLeafSVG({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <radialGradient id="leafSoil" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#78350F" />
          <stop offset="100%" stopColor="#291102" />
        </radialGradient>
        <linearGradient id="stemGrad" x1="24" y1="40" x2="24" y2="12" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#15803D" />
          <stop offset="60%" stopColor="#22C55E" />
          <stop offset="100%" stopColor="#4ADE80" />
        </linearGradient>
        <linearGradient id="mainLeafLeft" x1="12" y1="14" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#86EFAC" />
          <stop offset="50%" stopColor="#22C55E" />
          <stop offset="100%" stopColor="#15803D" />
        </linearGradient>
        <linearGradient id="mainLeafRight" x1="36" y1="10" x2="24" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4ADE80" />
          <stop offset="50%" stopColor="#16A34A" />
          <stop offset="100%" stopColor="#14532D" />
        </linearGradient>
      </defs>

      {/* Gò đất phù sa */}
      <ellipse cx="24" cy="41" rx="19" ry="5.5" fill="url(#leafSoil)" opacity="0.8" />
      <ellipse cx="24" cy="40" rx="15" ry="4" fill="#582C0E" />

      {/* Thân cây non uốn lượn tự nhiên */}
      <path d="M24 40 C24 32 23 24 24 12" stroke="url(#stemGrad)" strokeWidth="3" strokeLinecap="round" />

      {/* Tán lá bên trái với gân lá */}
      <path d="M24 24 C14 24 8 16 10 8 C16 10 22 17 24 24 Z" fill="url(#mainLeafLeft)" stroke="#16A34A" strokeWidth="0.8" />
      <path d="M12 10 Q17 16 23 22" stroke="#BEF264" strokeWidth="1" strokeLinecap="round" opacity="0.7" />

      {/* Tán lá bên phải vươn cao */}
      <path d="M24 18 C34 18 39 11 38 4 C31 6 25 12 24 18 Z" fill="url(#mainLeafRight)" stroke="#15803D" strokeWidth="0.8" />
      <path d="M36 6 Q30 11 25 17" stroke="#86EFAC" strokeWidth="1" strokeLinecap="round" opacity="0.7" />

      {/* Chồi búp non ở đỉnh ngọn */}
      <path d="M24 12 C22 9 23 5 24 3 C25 5 26 9 24 12 Z" fill="#BEF264" stroke="#84CC16" strokeWidth="0.7" />

      {/* Giọt nước long lanh */}
      <circle cx="11" cy="9" r="1.5" fill="#FFFFFF" opacity="0.9" />
      <circle cx="37" cy="5" r="1.5" fill="#FFFFFF" opacity="0.9" />
    </svg>
  );
}

export function BloomFlowerSVG({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <radialGradient id="flowerSoil" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#78350F" />
          <stop offset="100%" stopColor="#291102" />
        </radialGradient>
        <linearGradient id="trunkGrad" x1="24" y1="40" x2="24" y2="18" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#78350F" />
          <stop offset="100%" stopColor="#A16207" />
        </linearGradient>
        <radialGradient id="petalPink1" cx="40%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#FFF1F2" />
          <stop offset="40%" stopColor="#FDA4AF" />
          <stop offset="100%" stopColor="#E11D48" />
        </radialGradient>
        <radialGradient id="petalPink2" cx="40%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#FFE4E6" />
          <stop offset="50%" stopColor="#FB7185" />
          <stop offset="100%" stopColor="#BE123C" />
        </radialGradient>
      </defs>

      {/* Đế chậu cảnh bonsai */}
      <ellipse cx="24" cy="42" rx="20" ry="5" fill="url(#flowerSoil)" opacity="0.8" />
      <path d="M12 41 L14 45 H34 L36 41 Z" fill="#9A3412" stroke="#7C2D12" strokeWidth="1" />

      {/* Nhánh thân cây gỗ uốn thế bonsai */}
      <path d="M24 41 C24 34 22 28 20 22 C18 18 19 16 23 15" stroke="url(#trunkGrad)" strokeWidth="4" strokeLinecap="round" />
      <path d="M20 25 C25 23 29 22 34 19" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" />

      {/* Lá xanh đệm quanh hoa */}
      <path d="M16 22 C11 20 9 14 11 10 C15 13 16 18 16 22 Z" fill="#16A34A" />
      <path d="M32 20 C37 19 40 14 39 9 C35 12 33 16 32 20 Z" fill="#22C55E" />

      {/* Hoa đào nở rộ chính diện (5 cánh hoa 3D nhiều lớp) */}
      <circle cx="23" cy="11" r="5" fill="url(#petalPink1)" />
      <circle cx="17" cy="14" r="5" fill="url(#petalPink2)" />
      <circle cx="29" cy="14" r="5" fill="url(#petalPink2)" />
      <circle cx="19" cy="20" r="5" fill="url(#petalPink1)" />
      <circle cx="27" cy="20" r="5" fill="url(#petalPink1)" />

      {/* Bông hoa nhỏ bên nhánh phụ */}
      <circle cx="35" cy="17" r="3.5" fill="url(#petalPink1)" />
      <circle cx="38" cy="15" r="3.2" fill="url(#petalPink2)" />
      <circle cx="33" cy="14" r="3.2" fill="url(#petalPink2)" />

      {/* Nhụy hoa vàng óng phát sáng */}
      <circle cx="23" cy="16" r="3" fill="#FEF08A" stroke="#F59E0B" strokeWidth="1" />
      <circle cx="23" cy="16" r="1.5" fill="#D97706" />

      {/* Cánh hoa rơi nhẹ bay trong gió */}
      <path d="M38 28 C41 27 42 30 40 32 C38 31 37 29 38 28 Z" fill="#FDA4AF" opacity="0.85" />
    </svg>
  );
}

export function GreatTreeSVG({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <radialGradient id="treeSoil" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#78350F" />
          <stop offset="100%" stopColor="#1E1005" />
        </radialGradient>
        <linearGradient id="treeTrunk3D" x1="20" y1="44" x2="28" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#451A03" />
          <stop offset="50%" stopColor="#78350F" />
          <stop offset="100%" stopColor="#92400E" />
        </linearGradient>
        <radialGradient id="treeCanopy1" cx="40%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#4ADE80" />
          <stop offset="60%" stopColor="#16A34A" />
          <stop offset="100%" stopColor="#14532D" />
        </radialGradient>
        <radialGradient id="treeCanopy2" cx="40%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#86EFAC" />
          <stop offset="50%" stopColor="#22C55E" />
          <stop offset="100%" stopColor="#15803D" />
        </radialGradient>
        <radialGradient id="fruitGlow" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="50%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#D97706" />
        </radialGradient>
      </defs>

      {/* Gò đồi phong rêu cổ kính */}
      <ellipse cx="24" cy="43" rx="22" ry="4.5" fill="url(#treeSoil)" opacity="0.8" />
      <path d="M8 43 Q24 38 40 43" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" opacity="0.6" />

      {/* Rễ cổ thụ cuồn cuộn bám đất */}
      <path d="M20 43 C18 40 16 42 12 43 M28 43 C30 40 33 42 36 43" stroke="#451A03" strokeWidth="3" strokeLinecap="round" />

      {/* Thân cây đại thụ gân guốc vững chãi */}
      <path d="M21 43 C20 32 18 26 14 18 M27 43 C28 32 30 26 34 18" stroke="url(#treeTrunk3D)" strokeWidth="6" strokeLinecap="round" />
      <path d="M24 28 V16" stroke="#5A2E0C" strokeWidth="4" strokeLinecap="round" />

      {/* Tán lá xum xuê đa tầng xanh biếc */}
      <circle cx="15" cy="20" r="10" fill="url(#treeCanopy1)" />
      <circle cx="33" cy="20" r="10" fill="url(#treeCanopy1)" />
      <circle cx="24" cy="13" r="12" fill="url(#treeCanopy2)" />
      <circle cx="18" cy="11" r="8" fill="url(#treeCanopy2)" opacity="0.9" />
      <circle cx="30" cy="11" r="8" fill="url(#treeCanopy2)" opacity="0.9" />

      {/* Những quả vàng ngọc trí tuệ lấp lánh */}
      <circle cx="16" cy="16" r="2.4" fill="url(#fruitGlow)" stroke="#F59E0B" strokeWidth="0.8" />
      <circle cx="32" cy="16" r="2.4" fill="url(#fruitGlow)" stroke="#F59E0B" strokeWidth="0.8" />
      <circle cx="24" cy="10" r="2.8" fill="url(#fruitGlow)" stroke="#F59E0B" strokeWidth="0.8" />
      <circle cx="20" cy="23" r="2.2" fill="url(#fruitGlow)" stroke="#F59E0B" strokeWidth="0.8" />
      <circle cx="28" cy="22" r="2.2" fill="url(#fruitGlow)" stroke="#F59E0B" strokeWidth="0.8" />

      {/* Vệt sáng quả trí tuệ */}
      <circle cx="23" cy="9" r="0.8" fill="#FFFFFF" />
      <circle cx="15" cy="15" r="0.7" fill="#FFFFFF" />
      <circle cx="31" cy="15" r="0.7" fill="#FFFFFF" />
    </svg>
  );
}

export function ChineseLanternSVG({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M12 1V4M12 20V23" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="9" y="4" width="6" height="2" rx="0.5" fill="#B45309" />
      <rect x="9" y="18" width="6" height="2" rx="0.5" fill="#B45309" />
      <ellipse cx="12" cy="12" rx="7" ry="6" fill="#DC2626" stroke="#B91C1C" strokeWidth="1.2" />
      <ellipse cx="12" cy="12" rx="3.5" ry="6" fill="none" stroke="#FEF08A" strokeWidth="0.8" opacity="0.6" />
      <line x1="12" y1="6" x2="12" y2="18" stroke="#FEF08A" strokeWidth="1" />
      {/* Tua rua vàng */}
      <path d="M10 21L9 24M12 21V24M14 21L15 24" stroke="#FBBF24" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function OrientalCloudSVG({ className = "w-8 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path
        d="M6 16C3 16 1 14 1 11C1 8.5 3 6.5 5.5 6.5C6.2 4 8.5 2 11.5 2C14.5 2 17 4 17.5 7C18.5 6 20.5 5.5 22.5 6C24.5 6.5 26 8 26.5 10C28.5 10 30.5 11.5 30.5 13.5C30.5 15.5 29 17 26.5 17L6 17"
        stroke="#E2E8F0"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="#F8FAFC"
        opacity="0.85"
      />
      <path
        d="M8 12C9.5 12 11 10.5 11 9C11 7.5 9.5 6.5 8 7"
        stroke="#CBD5E1"
        strokeWidth="1"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export function ZTypeFighterSVG({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="jetBodyGrad" x1="24" y1="4" x2="24" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#EF4444" />
          <stop offset="50%" stopColor="#DC2626" />
          <stop offset="100%" stopColor="#991B1B" />
        </linearGradient>
        <linearGradient id="plasmaThrust" x1="24" y1="36" x2="24" y2="46" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>
      </defs>
      {/* Tia lửa phản lực Plasma */}
      <polygon points="20,38 24,46 28,38" fill="url(#plasmaThrust)" />
      <polygon points="22,38 24,44 26,38" fill="#E0F2FE" />
      {/* Cánh phụ và nòng pháo laser */}
      <path d="M12 28 L4 36 L12 34 Z" fill="#7F1D1D" />
      <path d="M36 28 L44 36 L36 34 Z" fill="#7F1D1D" />
      <rect x="10" y="22" width="2" height="10" rx="1" fill="#F87171" />
      <rect x="36" y="22" width="2" height="10" rx="1" fill="#F87171" />
      {/* Thân chiến cơ phi thuyền */}
      <polygon points="24,4 34,26 38,36 28,34 24,38 20,34 10,36 14,26" fill="url(#jetBodyGrad)" />
      {/* Cánh chính */}
      <polygon points="24,14 42,32 34,34 24,24 14,34 6,32" fill="#B91C1C" />
      {/* Buồng lái phi công kính phát quang */}
      <ellipse cx="24" cy="18" rx="3.5" ry="7" fill="#38BDF8" stroke="#E0F2FE" strokeWidth="1" />
      <ellipse cx="24" cy="16" rx="1.5" ry="3" fill="#FFFFFF" opacity="0.8" />
      {/* Đường viền khí động học */}
      <path d="M24 6 V24" stroke="#FCA5A5" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

export function SentenceBuilderBlockSVG({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Khối màu xanh ngọc bên trái (Khối 1: Chủ ngữ) */}
      <rect x="4" y="20" width="16" height="18" rx="4" fill="#10B981" />
      <rect x="4" y="20" width="16" height="6" rx="3" fill="#34D399" />
      <circle cx="12" cy="17" r="3" fill="#059669" />
      <text x="12" y="32" textAnchor="middle" dominantBaseline="central" fill="#FFFFFF" fontSize="10" fontWeight="900" fontFamily="sans-serif">
        我
      </text>

      {/* Khối màu đỏ son ở giữa (Khối 2: Vị ngữ) */}
      <rect x="18" y="12" width="16" height="26" rx="4" fill="#EF4444" />
      <rect x="18" y="12" width="16" height="6" rx="3" fill="#F87171" />
      <circle cx="26" cy="9" r="3" fill="#DC2626" />
      <text x="26" y="28" textAnchor="middle" dominantBaseline="central" fill="#FFFFFF" fontSize="10" fontWeight="900" fontFamily="sans-serif">
        爱
      </text>

      {/* Khối màu vàng hổ phách bên phải (Khối 3: Tân ngữ) */}
      <rect x="32" y="16" width="14" height="22" rx="4" fill="#F59E0B" />
      <rect x="32" y="16" width="14" height="6" rx="3" fill="#FBBF24" />
      <circle cx="39" cy="13" r="3" fill="#D97706" />
      <text x="39" y="30" textAnchor="middle" dominantBaseline="central" fill="#FFFFFF" fontSize="9" fontWeight="900" fontFamily="sans-serif">
        学
      </text>

      {/* Răng cưa ghép nối khớp nhau */}
      <path d="M6 38 H42" stroke="#E2E8F0" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function SoccerPenaltySVG({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="ballGlow" x1="16" y1="12" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E2E8F0" />
        </linearGradient>
      </defs>
      {/* Khung thành và lưới phía sau */}
      <path d="M4 10 H44 V38" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M4 16 H44 M4 22 H44 M4 28 H44 M4 34 H44" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="2 2" />
      <path d="M12 10 V38 M20 10 V38 M28 10 V38 M36 10 V38" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="2 2" />

      {/* Tia tốc độ sút bóng */}
      <path d="M8 32 Q14 26 22 24" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
      <path d="M6 36 Q12 30 20 28" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />

      {/* Quả bóng đá 3D */}
      <circle cx="28" cy="24" r="12" fill="url(#ballGlow)" stroke="#334155" strokeWidth="1.5" />
      {/* Họa tiết ngũ giác bóng đá */}
      <polygon points="28,19 32,22 30,26 26,26 24,22" fill="#0F172A" />
      <line x1="28" y1="19" x2="28" y2="13" stroke="#334155" strokeWidth="1.2" />
      <line x1="32" y1="22" x2="38" y2="20" stroke="#334155" strokeWidth="1.2" />
      <line x1="26" y1="26" x2="20" y2="31" stroke="#334155" strokeWidth="1.2" />
      <line x1="24" y1="22" x2="18" y2="20" stroke="#334155" strokeWidth="1.2" />
      {/* Vệt sáng bóng tròn */}
      <circle cx="24" cy="18" r="2.5" fill="#FFFFFF" opacity="0.6" />
    </svg>
  );
}

export function CombatArenaSVG({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="arenaSwordGrad1" x1="8" y1="8" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#EF4444" />
          <stop offset="100%" stopColor="#991B1B" />
        </linearGradient>
        <linearGradient id="arenaSwordGrad2" x1="40" y1="8" x2="8" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#0369A1" />
        </linearGradient>
        <linearGradient id="arenaGlow" x1="24" y1="6" x2="24" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
      {/* Vòng hào quang võ đài */}
      <circle cx="24" cy="24" r="20" fill="url(#arenaGlow)" fillOpacity="0.15" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="3 3" />
      {/* Thanh kiếm đỏ 1 */}
      <path d="M10 38 L38 10 L40 12 L12 40 Z" fill="url(#arenaSwordGrad1)" stroke="#B91C1C" strokeWidth="0.8" />
      <rect x="7" y="37" width="6" height="3" rx="1.5" fill="#78350F" transform="rotate(45 10 38)" />
      <circle cx="8" cy="40" r="2" fill="#FDE047" />

      {/* Thanh kiếm xanh 2 */}
      <path d="M38 38 L10 10 L8 12 L36 40 Z" fill="url(#arenaSwordGrad2)" stroke="#0284C7" strokeWidth="0.8" />
      <rect x="35" y="37" width="6" height="3" rx="1.5" fill="#78350F" transform="rotate(-45 38 38)" />
      <circle cx="40" cy="40" r="2" fill="#FDE047" />

      {/* Khiên ấn trung tâm với chữ Võ */}
      <polygon points="24,14 31,18 31,28 24,33 17,28 17,18" fill="#DC2626" stroke="#FEF08A" strokeWidth="1.2" />
      <text x="24" y="25" textAnchor="middle" dominantBaseline="central" fill="#FFFFFF" fontSize="10" fontWeight="900" fontFamily="sans-serif">
        武
      </text>
    </svg>
  );
}

export function MemoryGardenSVG({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="gardenCanopy" x1="24" y1="4" x2="24" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4ADE80" />
          <stop offset="50%" stopColor="#22C55E" />
          <stop offset="100%" stopColor="#15803D" />
        </linearGradient>
        <linearGradient id="gardenTrunk" x1="24" y1="26" x2="24" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#A16207" />
          <stop offset="100%" stopColor="#713F12" />
        </linearGradient>
      </defs>
      {/* Đất mùn hữu cơ và gò đất */}
      <ellipse cx="24" cy="40" rx="18" ry="4" fill="#E2E8F0" />
      <ellipse cx="24" cy="39" rx="14" ry="3" fill="#A87954" opacity="0.4" />
      {/* Thân cây cổ thụ */}
      <path d="M21 40 V28 C21 24 18 20 16 18 M27 40 V28 C27 24 30 20 32 18" stroke="url(#gardenTrunk)" strokeWidth="3.5" strokeLinecap="round" />
      {/* Tán cây 3 tầng xanh mướt */}
      <circle cx="24" cy="18" r="13" fill="url(#gardenCanopy)" />
      <circle cx="16" cy="21" r="9" fill="#16A34A" />
      <circle cx="32" cy="21" r="9" fill="#22C55E" />
      <circle cx="24" cy="13" r="8" fill="#86EFAC" />
      {/* Các trái quả vàng tri thức phát sáng */}
      <circle cx="19" cy="17" r="2.5" fill="#FBBF24" stroke="#D97706" strokeWidth="0.8" />
      <circle cx="29" cy="16" r="2.5" fill="#FBBF24" stroke="#D97706" strokeWidth="0.8" />
      <circle cx="24" cy="22" r="2.5" fill="#FBBF24" stroke="#D97706" strokeWidth="0.8" />
      {/* Giọt sương tưới mát */}
      <path d="M38 10 C38 12.5 36 14 36 14 C36 14 34 12.5 34 10 C34 7.5 36 6 36 6 C36 6 38 7.5 38 10 Z" fill="#38BDF8" />
    </svg>
  );
}

