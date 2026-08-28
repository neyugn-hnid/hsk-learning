/**
 * Gamification Core Engine
 * Quản lý Streak hàng ngày, Kinh nghiệm (EXP), Cấp bậc (Level), Kim Cương (Gems) và Huy hiệu
 */

export type UserStats = {
  streak: number;
  lastActiveDate: string; // YYYY-MM-DD
  exp: number; // EXP tích lũy trong cấp hiện tại
  totalExp: number; // Tổng EXP trọn đời
  gems: number;
  level: number;
  levelTitle: string;
  energy: number; // Max 5 hearts
  badges: string[];
};

export const LEVEL_TITLES = [
  "Tân Thủ Khởi Hành",     // Lvl 1-4
  "Sơ Cấp Hiệp Sĩ",         // Lvl 5-9
  "Đồng Bảng Tú Tài",       // Lvl 10-14
  "Giang Hồ Lãng Khách",    // Lvl 15-19
  "Thư Viện Trưởng",        // Lvl 20-24
  "Thông Tuệ Cử Nhân",      // Lvl 25-29
  "Tiến Sĩ Hàn Lâm",        // Lvl 30-39
  "Tuyệt Đỉnh Tông Sư",     // Lvl 40-49
  "HSK Vô Song Thần Thoại", // Lvl 50+
];

export function getLevelTitle(level: number): string {
  if (level >= 50) return LEVEL_TITLES[8];
  if (level >= 40) return LEVEL_TITLES[7];
  if (level >= 30) return LEVEL_TITLES[6];
  if (level >= 25) return LEVEL_TITLES[5];
  if (level >= 20) return LEVEL_TITLES[4];
  if (level >= 15) return LEVEL_TITLES[3];
  if (level >= 10) return LEVEL_TITLES[2];
  if (level >= 5) return LEVEL_TITLES[1];
  return LEVEL_TITLES[0];
}

/**
 * Số EXP cần để vượt qua cấp độ hiện tại (Lvl 1 cần 100 EXP, Lvl 2 cần 150 EXP, Lvl 3 cần 200 EXP...)
 */
export function expForNextLevel(currentLevel: number): number {
  return Math.max(100, currentLevel * 100);
}

/**
 * Tính toán Cấp bậc và EXP hiện tại dựa trên Tổng EXP thực tế
 */
export function calculateLevelFromTotalExp(totalExp: number): {
  level: number;
  currentExp: number;
  nextLevelExp: number;
} {
  let level = 1;
  let remaining = Math.max(0, totalExp);

  while (true) {
    const needed = expForNextLevel(level);
    if (remaining >= needed) {
      remaining -= needed;
      level += 1;
    } else {
      break;
    }
  }

  return {
    level,
    currentExp: remaining,
    nextLevelExp: expForNextLevel(level),
  };
}

const STATS_STORAGE_KEY = "hsk_gamification_stats";

export function getTodayDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function getInitialStats(): UserStats {
  const today = getTodayDateString();
  return {
    streak: 1,
    lastActiveDate: today,
    exp: 0,
    totalExp: 0,
    gems: 50,
    level: 1,
    levelTitle: LEVEL_TITLES[0],
    energy: 5,
    badges: ["welcome_learner"],
  };
}

export function loadUserStats(): UserStats {
  if (typeof window === "undefined") return getInitialStats();
  
  try {
    const raw = localStorage.getItem(STATS_STORAGE_KEY);
    if (!raw) {
      const initial = getInitialStats();
      saveUserStats(initial);
      return initial;
    }
    const parsed: UserStats = JSON.parse(raw);
    
    // Đồng bộ lại tổng EXP và cấp độ thực tế nếu bị sai lệch
    let totalExp = parsed.totalExp;
    if (typeof totalExp !== "number" || isNaN(totalExp)) {
      // Tái tính toán từ exp và level cũ nếu chưa có totalExp
      let calcTotal = parsed.exp || 0;
      for (let l = 1; l < (parsed.level || 1); l++) {
        calcTotal += expForNextLevel(l);
      }
      totalExp = calcTotal;
    }

    const { level, currentExp } = calculateLevelFromTotalExp(totalExp);
    parsed.totalExp = totalExp;
    parsed.exp = currentExp;
    parsed.level = level;
    parsed.levelTitle = getLevelTitle(level);

    // Kiểm tra streak học tập
    const today = getTodayDateString();
    const last = parsed.lastActiveDate;
    if (last !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;
      
      if (last === yesterdayStr) {
        parsed.streak = (parsed.streak || 0) + 1;
        parsed.lastActiveDate = today;
      } else {
        parsed.streak = 1;
        parsed.lastActiveDate = today;
      }
      saveUserStats(parsed);
    }
    return parsed;
  } catch {
    return getInitialStats();
  }
}

export function saveUserStats(stats: UserStats): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
    window.dispatchEvent(new CustomEvent("hsk_stats_updated", { detail: stats }));
  } catch {
    // ignore
  }
}

export function addExpAndGems(expAmount: number, gemsAmount: number): { leveledUp: boolean; newStats: UserStats } {
  const current = loadUserStats();
  const prevLevel = current.level;
  const newTotalExp = (current.totalExp || 0) + expAmount;
  let newGems = (current.gems || 0) + gemsAmount;

  const { level, currentExp } = calculateLevelFromTotalExp(newTotalExp);
  const leveledUp = level > prevLevel;

  if (leveledUp) {
    newGems += (level - prevLevel) * 50; // Thưởng 50 Gems mỗi khi lên cấp
  }

  const newStats: UserStats = {
    ...current,
    totalExp: newTotalExp,
    exp: currentExp,
    gems: newGems,
    level,
    levelTitle: getLevelTitle(level),
  };

  saveUserStats(newStats);
  return { leveledUp, newStats };
}

const CLAIMED_LESSONS_EXP_KEY = "hsk_claimed_lessons_exp";
const OPENED_CHESTS_KEY = "hsk_opened_chests";

/**
 * Kiểm tra xem ải/bài học này đã được cộng EXP lần đầu chưa
 */
export function isLessonExpClaimed(lessonId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(CLAIMED_LESSONS_EXP_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    return list.includes(lessonId);
  } catch {
    return false;
  }
}

/**
 * Trao thưởng EXP & Gems cho ải hoàn thành - chỉ cộng 1 lần duy nhất
 */
export function claimLessonExp(lessonId: string, expAmount: number = 150, gemsAmount: number = 15): {
  alreadyClaimed: boolean;
  leveledUp: boolean;
  newStats?: UserStats;
} {
  if (typeof window === "undefined") return { alreadyClaimed: false, leveledUp: false };
  try {
    const raw = localStorage.getItem(CLAIMED_LESSONS_EXP_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    if (list.includes(lessonId)) {
      return { alreadyClaimed: true, leveledUp: false };
    }
    list.push(lessonId);
    localStorage.setItem(CLAIMED_LESSONS_EXP_KEY, JSON.stringify(list));
    const res = addExpAndGems(expAmount, gemsAmount);
    return { alreadyClaimed: false, leveledUp: res.leveledUp, newStats: res.newStats };
  } catch {
    return { alreadyClaimed: false, leveledUp: false };
  }
}

/**
 * Kiểm tra rương hoàng kim đã được nhận chưa
 */
export function isChestClaimed(chestKey: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(OPENED_CHESTS_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    return list.includes(chestKey);
  } catch {
    return false;
  }
}

/**
 * Nhận thưởng rương hoàng kim - chỉ nhận 1 lần duy nhất
 */
export function claimChestReward(chestKey: string, expAmount: number = 200, gemsAmount: number = 75): {
  alreadyClaimed: boolean;
  leveledUp: boolean;
  newStats?: UserStats;
} {
  if (typeof window === "undefined") return { alreadyClaimed: false, leveledUp: false };
  try {
    const raw = localStorage.getItem(OPENED_CHESTS_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    if (list.includes(chestKey)) {
      return { alreadyClaimed: true, leveledUp: false };
    }
    list.push(chestKey);
    localStorage.setItem(OPENED_CHESTS_KEY, JSON.stringify(list));
    const res = addExpAndGems(expAmount, gemsAmount);
    return { alreadyClaimed: false, leveledUp: res.leveledUp, newStats: res.newStats };
  } catch {
    return { alreadyClaimed: false, leveledUp: false };
  }
}

/**
 * Lấy danh sách các rương hoàng kim đã mở
 */
export function getOpenedChestsList(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(OPENED_CHESTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

