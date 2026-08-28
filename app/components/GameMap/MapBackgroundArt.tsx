import React from "react";

/**
 * Bộ minh họa phong cảnh tiên cảnh Á Đông (Mythical Orient Landscape SVG Backgrounds).
 * Tạo chiều sâu thị giác (Visual Depth & Rich Aesthetic) cho từng vùng đất trên Bản Đồ.
 */

export function LuoyangBackgroundArt({ className = "w-full h-full" }: { className?: string }) {
  return (
    <svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="luoyangSky" x1="400" y1="0" x2="400" y2="600" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFF7ED" />
          <stop offset="40%" stopColor="#FFEDD5" />
          <stop offset="80%" stopColor="#FED7AA" />
          <stop offset="100%" stopColor="#FDBA74" />
        </linearGradient>
        <linearGradient id="mountainFar" x1="400" y1="200" x2="400" y2="600" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FB923C" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#EA580C" stopOpacity="0.05" />
        </linearGradient>
        <linearGradient id="mountainMid" x1="400" y1="300" x2="400" y2="600" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E11D48" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#9F1239" stopOpacity="0.05" />
        </linearGradient>
      </defs>

      {/* Sky Canvas */}
      <rect width="800" height="600" fill="url(#luoyangSky)" />

      {/* Vầng thái dương / Trăng rằm vàng mơ */}
      <circle cx="680" cy="120" r="70" fill="#FEF08A" fillOpacity="0.45" />
      <circle cx="680" cy="120" r="85" stroke="#FDE047" strokeWidth="1" strokeOpacity="0.3" strokeDasharray="4 4" />

      {/* Dãy núi thủy mặc xa xa */}
      <path d="M-50 400 Q150 220 350 350 T750 260 L850 600 L-50 600 Z" fill="url(#mountainFar)" />
      <path d="M100 450 Q300 300 500 420 T900 320 L950 600 L50 600 Z" fill="url(#mountainMid)" />

      {/* Đám mây cát tường cuộn 3 tầng */}
      <path
        d="M40 180 Q80 150 130 170 Q170 140 220 165 Q270 150 300 180 L40 180"
        fill="#FFFFFF"
        fillOpacity="0.55"
      />
      <path
        d="M500 240 Q550 210 600 230 Q650 200 700 225 Q750 210 780 240 L500 240"
        fill="#FFFFFF"
        fillOpacity="0.45"
      />

      {/* Cánh hoa đào bay lượn trong gió (Floating Sakura Petals) */}
      <circle cx="120" cy="110" r="4" fill="#F43F5E" fillOpacity="0.7" />
      <circle cx="140" cy="125" r="3" fill="#FDA4AF" fillOpacity="0.8" />
      <circle cx="280" cy="90" r="5" fill="#FB7185" fillOpacity="0.6" />
      <circle cx="450" cy="160" r="4" fill="#F43F5E" fillOpacity="0.6" />
      <circle cx="620" cy="210" r="4.5" fill="#FDA4AF" fillOpacity="0.7" />
      <circle cx="710" cy="180" r="3.5" fill="#F43F5E" fillOpacity="0.8" />
      <circle cx="340" cy="270" r="4" fill="#FB7185" fillOpacity="0.5" />
    </svg>
  );
}

export function ChengduBackgroundArt({ className = "w-full h-full" }: { className?: string }) {
  return (
    <svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="chengduSky" x1="400" y1="0" x2="400" y2="600" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F0FDF4" />
          <stop offset="50%" stopColor="#DCFCE7" />
          <stop offset="100%" stopColor="#BBF7D0" />
        </linearGradient>
        <linearGradient id="bambooMountain" x1="400" y1="200" x2="400" y2="600" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#16A34A" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#14532D" stopOpacity="0.05" />
        </linearGradient>
      </defs>

      <rect width="800" height="600" fill="url(#chengduSky)" />

      {/* Rặng núi mờ sương xanh ngọc bích */}
      <path d="M-20 420 Q200 260 420 380 T850 290 L850 600 L-20 600 Z" fill="url(#bambooMountain)" />
      <path d="M120 470 Q340 330 560 450 T900 360 L900 600 L100 600 Z" fill="#22C55E" fillOpacity="0.15" />

      {/* Rặng trúc đan xen 2 bên mép */}
      <line x1="40" y1="600" x2="40" y2="150" stroke="#15803D" strokeWidth="6" strokeOpacity="0.3" strokeLinecap="round" />
      <line x1="70" y1="600" x2="70" y2="200" stroke="#16A34A" strokeWidth="5" strokeOpacity="0.25" strokeLinecap="round" />
      <line x1="740" y1="600" x2="740" y2="170" stroke="#15803D" strokeWidth="6" strokeOpacity="0.3" strokeLinecap="round" />
      <line x1="770" y1="600" x2="770" y2="220" stroke="#16A34A" strokeWidth="4.5" strokeOpacity="0.25" strokeLinecap="round" />

      {/* Đom đóm phát sáng dập dờn (Glowing Fireflies) */}
      <circle cx="160" cy="220" r="3.5" fill="#86EFAC" />
      <circle cx="160" cy="220" r="8" fill="#4ADE80" fillOpacity="0.35" />

      <circle cx="320" cy="180" r="3" fill="#86EFAC" />
      <circle cx="320" cy="180" r="7" fill="#4ADE80" fillOpacity="0.35" />

      <circle cx="580" cy="250" r="4" fill="#86EFAC" />
      <circle cx="580" cy="250" r="9" fill="#4ADE80" fillOpacity="0.35" />

      <circle cx="680" cy="160" r="3" fill="#86EFAC" />
      <circle cx="680" cy="160" r="7" fill="#4ADE80" fillOpacity="0.35" />
    </svg>
  );
}

export function ShanghaiBackgroundArt({ className = "w-full h-full" }: { className?: string }) {
  return (
    <svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="shanghaiSky" x1="400" y1="0" x2="400" y2="600" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#EFF6FF" />
          <stop offset="50%" stopColor="#DBEAFE" />
          <stop offset="100%" stopColor="#BAE6FD" />
        </linearGradient>
      </defs>

      <rect width="800" height="600" fill="url(#shanghaiSky)" />

      {/* Trăng tròn rọi bóng sông */}
      <circle cx="650" cy="140" r="65" fill="#BAE6FD" fillOpacity="0.5" />
      <circle cx="650" cy="140" r="80" stroke="#38BDF8" strokeWidth="1" strokeOpacity="0.35" strokeDasharray="5 5" />

      {/* Dáng tháp và đường chân trời mờ xa */}
      <path d="M200 600 L200 380 L220 380 L220 600 Z" fill="#0284C7" fillOpacity="0.15" />
      <path d="M580 600 L580 340 L605 340 L605 600 Z" fill="#0369A1" fillOpacity="0.18" />

      {/* Gợn sóng nước Hoàng Phố */}
      <path d="M-50 480 Q150 460 350 480 T750 480 T1150 480" stroke="#38BDF8" strokeWidth="2.5" strokeOpacity="0.4" fill="none" />
      <path d="M-50 530 Q150 510 350 530 T750 530 T1150 530" stroke="#0284C7" strokeWidth="2" strokeOpacity="0.3" fill="none" />
    </svg>
  );
}

export function ForbiddenCityBackgroundArt({ className = "w-full h-full" }: { className?: string }) {
  return (
    <svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="palaceSky" x1="400" y1="0" x2="400" y2="600" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FAF5FF" />
          <stop offset="40%" stopColor="#F3E8FF" />
          <stop offset="80%" stopColor="#E9D5FF" />
          <stop offset="100%" stopColor="#FED7AA" />
        </linearGradient>
        <linearGradient id="holyPeak" x1="400" y1="200" x2="400" y2="600" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7E22CE" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#BE123C" stopOpacity="0.05" />
        </linearGradient>
      </defs>

      <rect width="800" height="600" fill="url(#palaceSky)" />

      {/* Vầng hào quang hoàng kim cung đình */}
      <circle cx="400" cy="150" r="90" fill="#FBBF24" fillOpacity="0.3" />
      <circle cx="400" cy="150" r="115" stroke="#F59E0B" strokeWidth="1.5" strokeOpacity="0.4" strokeDasharray="6 6" />

      {/* Đỉnh núi Hoa Sơn chọc trời */}
      <polygon points="400,180 280,600 520,600" fill="url(#holyPeak)" />
      <polygon points="220,280 100,600 340,600" fill="#9333EA" fillOpacity="0.12" />
      <polygon points="580,260 460,600 700,600" fill="#9333EA" fillOpacity="0.12" />

      {/* Biển mây bồng bềnh cuồn cuộn */}
      <path
        d="M-50 420 Q100 360 250 410 Q400 370 550 420 Q700 370 850 420 L850 600 L-50 600 Z"
        fill="#FFFFFF"
        fillOpacity="0.65"
      />
    </svg>
  );
}
