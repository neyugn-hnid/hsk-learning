import { useEffect, useState } from "react";
import { StreakFlameSVG, ExpLightningSVG, GemDiamondSVG, HeartEnergySVG } from "~/components/Icons/CustomSVGs";
import { loadUserStats, type UserStats, expForNextLevel } from "~/lib/gamification";
import { sound } from "~/lib/sound";
import { Volume2, VolumeX, Shield, Award } from "lucide-react";

export function GamificationHeader() {
  const [stats, setStats] = useState<UserStats>(() => loadUserStats());
  const [isMuted, setIsMuted] = useState(false);
  const [showLevelDetail, setShowLevelDetail] = useState(false);

  useEffect(() => {
    setIsMuted(sound.getMuted());
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<UserStats>;
      if (customEvent.detail) {
        setStats(customEvent.detail);
      } else {
        setStats(loadUserStats());
      }
    };
    window.addEventListener("hsk_stats_updated", handleUpdate);
    return () => window.removeEventListener("hsk_stats_updated", handleUpdate);
  }, []);

  const toggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
    if (!muted) sound.playWoodblock();
  };

  const nextLevelExp = expForNextLevel(stats.level);
  const expPercent = Math.min(100, Math.round((stats.exp / nextLevelExp) * 100));

  return (
    <div className="relative flex items-center gap-1 sm:gap-2">
      {/* Streak Day */}
      <div
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
        title={`Chuỗi học tập liên tục: ${stats.streak} ngày`}
      >
        <StreakFlameSVG className="w-4 h-4 shrink-0" animate={stats.streak >= 3} />
        <span className="tabular-nums">{stats.streak}</span>
        <span className="hidden text-[11px] text-slate-400 font-medium sm:inline">ngày</span>
      </div>

      {/* Gems */}
      <div
        className="hidden items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors sm:flex"
        title={`Kim cương tích lũy: ${stats.gems}`}
      >
        <GemDiamondSVG className="w-4 h-4 shrink-0" />
        <span className="tabular-nums">{stats.gems}</span>
      </div>

      {/* Level */}
      <button
        type="button"
        onClick={() => setShowLevelDetail(!showLevelDetail)}
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        title="Bấm xem chi tiết Cấp bậc & Danh hiệu"
      >
        <ExpLightningSVG className="w-4 h-4 shrink-0" />
        <span>Lv.{stats.level}</span>
      </button>

      {/* Sound Toggle Button */}
      <button
        type="button"
        onClick={toggleSound}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
        title={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
      >
        {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
      </button>

      {/* Level Popover Card */}
      {showLevelDetail && (
        <div className="absolute right-0 top-11 z-50 w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl text-slate-900 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-1.5">
              <Award className="h-4 w-4 text-amber-600" />
              <span className="font-bold text-slate-900 text-xs">Cấp Bậc Hiệp Khách</span>
            </div>
            <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
              Cấp {stats.level}
            </span>
          </div>

          <div className="mt-3">
            <p className="text-xs font-bold text-red-600">{stats.levelTitle}</p>
            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
              <span>Kinh nghiệm:</span>
              <span className="text-slate-800 font-bold">{stats.exp} / {nextLevelExp} EXP</span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-amber-500 transition-all duration-300"
                style={{ width: `${expPercent}%` }}
              />
            </div>
            <p className="mt-2.5 text-[11px] leading-relaxed text-slate-400">
              Vượt ải và chơi mini-games để nhận thêm EXP thăng cấp và Gems!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
