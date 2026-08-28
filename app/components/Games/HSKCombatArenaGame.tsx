import { useState, useEffect, useRef, useMemo } from "react";
import { sound } from "~/lib/sound";
import { addExpAndGems } from "~/lib/gamification";
import { r2Asset } from "~/lib/assets";
import {
  Swords,
  Shield,
  Flame,
  Sparkles,
  Heart,
  Zap,
  Volume2,
  VolumeX,
  RotateCcw,
  Play,
  Target,
  BookOpen,
  Trophy,
  ChevronRight,
  ChevronDown,
  Check,
  ShieldAlert,
  Award,
} from "lucide-react";

export interface ArenaWord {
  chinese: string;
  pinyin: string;
  meaningVi: string;
  level?: string;
  lessonId?: string;
  lessonTitle?: string;
  source?: string;
}

export interface ArenaLesson {
  id: string;
  title: string;
  level: string;
  source?: string;
}

export interface HSKCombatArenaGameProps {
  words?: ArenaWord[];
  lessons?: ArenaLesson[];
  onComplete?: () => void;
}

interface Boss {
  id: string;
  name: string;
  title: string;
  stage: number;
  avatar: string;
  maxHp: number;
  attackPower: number;
  defense: number;
  element: "shadow" | "iron" | "flame";
  skillName: string;
  color: string;
}

const BOSS_ROSTER: Boss[] = [
  {
    id: "boss_1",
    name: "Ảnh Dạ Ninja",
    title: "Sát Thủ Ám Dạ (Tầng 1)",
    stage: 1,
    avatar: r2Asset("/game/arena_boss_ninja.png"),
    maxHp: 550,
    attackPower: 65,
    defense: 10,
    element: "shadow",
    skillName: "Ám Ảnh Độc Trảm",
    color: "#38BDF8",
  },
  {
    id: "boss_2",
    name: "Thiết Giáp Vệ Binh",
    title: "Hộ Vệ Hoàng Cung (Tầng 2)",
    stage: 2,
    avatar: r2Asset("/game/arena_boss_iron.png"),
    maxHp: 900,
    attackPower: 95,
    defense: 25,
    element: "iron",
    skillName: "Khai Sơn Thiết Chùy",
    color: "#10B981",
  },
  {
    id: "boss_3",
    name: "Hỏa Long Kiếm Thánh",
    title: "Chưởng Môn Võ Đạo (Đại Kết Cục)",
    stage: 3,
    avatar: r2Asset("/game/arena_boss_dragon.png"),
    maxHp: 1400,
    attackPower: 140,
    defense: 35,
    element: "flame",
    skillName: "Cửu Tiêu Long Diễm Trảm",
    color: "#F59E0B",
  },
];

const defaultFallbackWords: ArenaWord[] = [
  { chinese: "你好", pinyin: "nǐhǎo", meaningVi: "Xin chào", level: "HSK1", source: "HSK20" },
  { chinese: "再见", pinyin: "zàijiàn", meaningVi: "Tạm biệt", level: "HSK1", source: "HSK20" },
  { chinese: "谢谢", pinyin: "xièxiè", meaningVi: "Cảm ơn", level: "HSK1", source: "HSK20" },
  { chinese: "学习", pinyin: "xuéxí", meaningVi: "Học tập", level: "HSK1", source: "HSK20" },
  { chinese: "老师", pinyin: "lǎoshī", meaningVi: "Thầy cô", level: "HSK1", source: "HSK20" },
  { chinese: "学生", pinyin: "xuéshēng", meaningVi: "Học sinh", level: "HSK1", source: "HSK20" },
  { chinese: "朋友", pinyin: "péngyǒu", meaningVi: "Bạn bè", level: "HSK1", source: "HSK20" },
  { chinese: "苹果", pinyin: "píngguǒ", meaningVi: "Quả táo", level: "HSK1", source: "HSK20" },
  { chinese: "喝水", pinyin: "hēshuǐ", meaningVi: "Uống nước", level: "HSK1", source: "HSK20" },
  { chinese: "吃饭", pinyin: "chīfàn", meaningVi: "Ăn cơm", level: "HSK1", source: "HSK20" },
  { chinese: "喜欢", pinyin: "xǐhuan", meaningVi: "Yêu thích", level: "HSK1", source: "HSK20" },
  { chinese: "高兴", pinyin: "gāoxìng", meaningVi: "Vui vẻ", level: "HSK1", source: "HSK20" },
  { chinese: "漂亮", pinyin: "piàoliang", meaningVi: "Xinh đẹp", level: "HSK1", source: "HSK20" },
  { chinese: "努力", pinyin: "nǔlì", meaningVi: "Nỗ lực", level: "HSK2", source: "HSK20" },
  { chinese: "坚持", pinyin: "jiānchí", meaningVi: "Kiên trì", level: "HSK3", source: "HSK20" },
];

type CombatActionType = "ATTACK" | "PARRY" | "ULTIMATE" | "HEAL";
type GameState = "CONFIG" | "BATTLE" | "VICTORY" | "DEFEAT";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  decay: number;
}

interface SlashArc {
  x: number;
  y: number;
  radius: number;
  startAngle: number;
  endAngle: number;
  color: string;
  width: number;
  alpha: number;
}

interface FloatingScore {
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  vy: number;
  isCrit?: boolean;
}

interface GhostTrail {
  x: number;
  y: number;
  alpha: number;
  img: HTMLImageElement;
  width: number;
  height: number;
}

export function HSKCombatArenaGame({
  words = [],
  lessons = [],
  onComplete,
}: HSKCombatArenaGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Configuration State
  const [selectedStandard, setSelectedStandard] = useState<"HSK20" | "HSK30">("HSK20");
  const [selectedLevel, setSelectedLevel] = useState<string>("HSK1");
  const [selectedTopicId, setSelectedTopicId] = useState<string>("ALL");
  const [showPinyin, setShowPinyin] = useState(true);
  const [isMuted, setIsMuted] = useState(() => sound.getMuted());
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Click outside listener for custom dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Game Progress State
  const [gameState, setGameState] = useState<GameState>("CONFIG");
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);

  // Hero Combat Stats
  const [heroHp, setHeroHp] = useState(1000);
  const [heroLagHp, setHeroLagHp] = useState(1000);
  const [heroMaxHp] = useState(1000);
  const [heroMp, setHeroMp] = useState(20); // 0 -> 100 Rage

  // Boss Combat Stats
  const currentBoss = BOSS_ROSTER[currentStageIdx] || BOSS_ROSTER[0];
  const [bossHp, setBossHp] = useState(currentBoss.maxHp);
  const [bossLagHp, setBossLagHp] = useState(currentBoss.maxHp);
  const [bossMaxHp, setBossMaxHp] = useState(currentBoss.maxHp);

  // Combat Turn Management
  const [combatPhase, setCombatPhase] = useState<"SELECT_ACTION" | "ANSWERING" | "RESOLVING" | "ENEMY_TURN">("SELECT_ACTION");
  const [activeAction, setActiveAction] = useState<CombatActionType | null>(null);

  // Current Question Data
  const [currentQuestion, setCurrentQuestion] = useState<{
    targetWord: ArenaWord;
    options: string[];
    correctIndex: number;
    promptType: "MEANING" | "PINYIN" | "HANZI";
  } | null>(null);

  const [questionTimer, setQuestionTimer] = useState(7);
  const [combatLog, setCombatLog] = useState<string>("Võ Đài khai màn! Hãy chọn chiêu thức để xuất kích.");

  // Image Sprites Refs
  const bgImgRef = useRef<HTMLImageElement | null>(null);
  const heroImgRef = useRef<HTMLImageElement | null>(null);
  const bossNinjaImgRef = useRef<HTMLImageElement | null>(null);
  const bossIronImgRef = useRef<HTMLImageElement | null>(null);
  const bossDragonImgRef = useRef<HTMLImageElement | null>(null);

  // 60FPS Kinetic Fighter Positions
  const heroPosRef = useRef({
    x: 180,
    y: 280,
    baseX: 180,
    baseY: 280,
    hitFlash: 0,
    shieldActive: 0,
    scale: 1,
  });

  const bossPosRef = useRef({
    x: 540,
    y: 280,
    baseX: 540,
    baseY: 280,
    hitFlash: 0,
    scale: 1,
  });

  const particlesRef = useRef<Particle[]>([]);
  const slashArcsRef = useRef<SlashArc[]>([]);
  const floatingScoresRef = useRef<FloatingScore[]>([]);
  const ghostTrailsRef = useRef<GhostTrail[]>([]);
  const shakeRef = useRef(0);
  const animFrameIdRef = useRef<number | null>(null);

  // Preload Sprites
  useEffect(() => {
    const bg = new Image();
    bg.src = r2Asset("/game/arena_bg.jpg");
    bg.onload = () => { bgImgRef.current = bg; };

    const hero = new Image();
    hero.src = r2Asset("/game/arena_hero_panda.png");
    hero.onload = () => { heroImgRef.current = hero; };

    const ninja = new Image();
    ninja.src = r2Asset("/game/arena_boss_ninja.png");
    ninja.onload = () => { bossNinjaImgRef.current = ninja; };

    const iron = new Image();
    iron.src = r2Asset("/game/arena_boss_iron.png");
    iron.onload = () => { bossIronImgRef.current = iron; };

    const dragon = new Image();
    dragon.src = r2Asset("/game/arena_boss_dragon.png");
    dragon.onload = () => { bossDragonImgRef.current = dragon; };
  }, []);

  // Lagging HP Bar animation
  useEffect(() => {
    const timer = setInterval(() => {
      setHeroLagHp((prev) => (prev > heroHp ? Math.max(heroHp, prev - 8) : heroHp));
      setBossLagHp((prev) => (prev > bossHp ? Math.max(bossHp, prev - 12) : bossHp));
    }, 25);
    return () => clearInterval(timer);
  }, [heroHp, bossHp]);

  // Filter available topics based on Standard and Level
  const availableTopics = useMemo(() => {
    if (!lessons || lessons.length === 0) return [];
    return lessons.filter(
      (l) => l.source === selectedStandard && l.level.toUpperCase() === selectedLevel.toUpperCase()
    );
  }, [lessons, selectedStandard, selectedLevel]);

  // Reset topic when level or standard changes
  useEffect(() => {
    setSelectedTopicId("ALL");
  }, [selectedStandard, selectedLevel]);

  // Active word pool
  const activeWords = useMemo(() => {
    const rawList = words && words.length > 0 ? words : defaultFallbackWords;
    let filtered = rawList.filter((w) => {
      const matchStandard = !w.source || w.source.toUpperCase() === selectedStandard.toUpperCase();
      const matchLevel = !w.level || w.level.toUpperCase() === selectedLevel.toUpperCase();
      const matchTopic = selectedTopicId === "ALL" || w.lessonId === selectedTopicId || w.lessonTitle === selectedTopicId;
      return matchStandard && matchLevel && matchTopic;
    });

    if (filtered.length === 0) {
      filtered = rawList.filter((w) => !w.level || w.level.toUpperCase() === selectedLevel.toUpperCase());
    }
    if (filtered.length === 0) {
      filtered = defaultFallbackWords;
    }
    return filtered;
  }, [words, selectedStandard, selectedLevel, selectedTopicId]);

  // Chinese Text-to-Speech
  const speakChinese = (text: string) => {
    if (typeof window === "undefined" || isMuted) return;
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "zh-CN";
      u.rate = 0.95;
      window.speechSynthesis.speak(u);
    }
  };

  // Add floating damage text
  const addDamagePopup = (x: number, y: number, text: string, color: string, isCrit = false) => {
    floatingScoresRef.current.push({
      x,
      y,
      text,
      color,
      alpha: 1.0,
      vy: -2.2,
      isCrit,
    });
  };

  // Spawn kinetic slash & spark effects
  const spawnHitImpact = (x: number, y: number, color: string, count = 30) => {
    // 1. Radiant Sword Slash Arc
    slashArcsRef.current.push({
      x,
      y,
      radius: 65,
      startAngle: Math.random() * Math.PI,
      endAngle: Math.random() * Math.PI + Math.PI,
      color,
      width: 6,
      alpha: 1.0,
    });

    // 2. High-speed kinetic sparks
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 8 + 3;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: Math.random() > 0.4 ? color : "#FFFFFF",
        size: Math.random() * 4 + 2,
        alpha: 1.0,
        decay: Math.random() * 0.035 + 0.02,
      });
    }
  };

  // 60FPS Canvas Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let lastTime = Date.now();

    const loop = () => {
      animFrameIdRef.current = requestAnimationFrame(loop);

      const now = Date.now();
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // 1. Draw High-Res Battlefield Arena Background
      if (bgImgRef.current && bgImgRef.current.complete) {
        ctx.drawImage(bgImgRef.current, 0, 0, canvas.width, canvas.height);
      } else {
        ctx.fillStyle = "#0A1128";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Screen Shake
      ctx.save();
      if (shakeRef.current > 0) {
        const sx = (Math.random() - 0.5) * shakeRef.current * 12;
        const sy = (Math.random() - 0.5) * shakeRef.current * 12;
        ctx.translate(sx, sy);
        shakeRef.current = Math.max(0, shakeRef.current - dt * 4);
      }

      // Subtle breathing float bob
      const breathBob = Math.sin(now * 0.003) * 4;

      // 2. Ground Contact Shadows (Realistic soft dark ellipse)
      const hero = heroPosRef.current;
      const boss = bossPosRef.current;

      const drawGroundShadow = (x: number, y: number, radiusX: number) => {
        ctx.save();
        ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
        ctx.beginPath();
        ctx.ellipse(x, y + 95, radiusX, radiusX * 0.32, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      };

      drawGroundShadow(hero.x, hero.baseY, 52);
      drawGroundShadow(boss.x, boss.baseY, 56);

      // 3. Draw Motion Ghost Trails
      for (let i = ghostTrailsRef.current.length - 1; i >= 0; i--) {
        const g = ghostTrailsRef.current[i];
        g.alpha -= dt * 3.5;
        if (g.alpha <= 0) {
          ghostTrailsRef.current.splice(i, 1);
        } else {
          ctx.save();
          ctx.globalAlpha = g.alpha * 0.4;
          ctx.drawImage(g.img, g.x - g.width / 2, g.y - g.height / 2, g.width, g.height);
          ctx.restore();
        }
      }

      // 4. Draw Hero: Bao Bao Kung Fu Panda
      const heroImg = heroImgRef.current;
      if (heroImg && heroImg.complete) {
        ctx.save();
        ctx.translate(hero.x, hero.y + breathBob);
        ctx.scale(hero.scale, hero.scale);

        if (hero.hitFlash > 0) {
          ctx.filter = "brightness(2.2) contrast(1.4)";
          hero.hitFlash = Math.max(0, hero.hitFlash - dt * 4);
        }

        const hW = 160;
        const hH = 160;
        ctx.drawImage(heroImg, -hW / 2, -hH / 2, hW, hH);
        ctx.restore();

        // Hex Shield Barrier when Defending
        if (hero.shieldActive > 0) {
          hero.shieldActive = Math.max(0, hero.shieldActive - dt * 2.5);
          ctx.save();
          ctx.strokeStyle = `rgba(52, 211, 153, ${hero.shieldActive})`;
          ctx.fillStyle = `rgba(16, 185, 129, ${hero.shieldActive * 0.25})`;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(hero.x, hero.y + 10, 85, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }
      }

      // 5. Draw Enemy Boss Challenger
      const bossImg =
        currentBoss.element === "shadow"
          ? bossNinjaImgRef.current
          : currentBoss.element === "iron"
          ? bossIronImgRef.current
          : bossDragonImgRef.current;

      if (bossImg && bossImg.complete) {
        ctx.save();
        ctx.translate(boss.x, boss.y - breathBob);
        ctx.scale(-boss.scale, boss.scale); // Face left towards hero

        if (boss.hitFlash > 0) {
          ctx.filter = "brightness(2.2) contrast(1.4)";
          boss.hitFlash = Math.max(0, boss.hitFlash - dt * 4);
        }

        const bW = 180;
        const bH = 180;
        ctx.drawImage(bossImg, -bW / 2, -bH / 2, bW, bH);
        ctx.restore();
      }

      // 6. Draw Sword Slash Arcs
      for (let i = slashArcsRef.current.length - 1; i >= 0; i--) {
        const s = slashArcsRef.current[i];
        s.alpha -= dt * 3.5;
        if (s.alpha <= 0) {
          slashArcsRef.current.splice(i, 1);
        } else {
          ctx.save();
          ctx.strokeStyle = s.color;
          ctx.lineWidth = s.width;
          ctx.lineCap = "round";
          ctx.shadowColor = s.color;
          ctx.shadowBlur = 15;
          ctx.globalAlpha = s.alpha;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.radius, s.startAngle, s.endAngle);
          ctx.stroke();
          ctx.restore();
        }
      }

      // 7. Draw Dynamic Sparks & Particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15; // Gravity
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particlesRef.current.splice(i, 1);
        } else {
          ctx.save();
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 8;
          ctx.globalAlpha = p.alpha;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // 8. Draw Floating Damage Numbers with Spring Jump
      for (let i = floatingScoresRef.current.length - 1; i >= 0; i--) {
        const fs = floatingScoresRef.current[i];
        fs.y += fs.vy;
        fs.alpha -= dt * 0.9;

        if (fs.alpha <= 0) {
          floatingScoresRef.current.splice(i, 1);
        } else {
          ctx.save();
          ctx.font = fs.isCrit
            ? "black 28px 'Courier New', monospace"
            : "black 22px 'Courier New', monospace";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";

          // Black Outline
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 4;
          ctx.strokeText(fs.text, fs.x, fs.y);

          // Glowing Color Text
          ctx.fillStyle = fs.color;
          ctx.shadowColor = fs.color;
          ctx.shadowBlur = 10;
          ctx.globalAlpha = Math.max(0, fs.alpha);
          ctx.fillText(fs.text, fs.x, fs.y);
          ctx.restore();
        }
      }

      ctx.restore(); // Restore Screen Shake
    };

    animFrameIdRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [currentBoss]);

  // Start new match
  const startBattle = () => {
    sound.playWoodblock();
    setCurrentStageIdx(0);
    const firstBoss = BOSS_ROSTER[0];
    setBossHp(firstBoss.maxHp);
    setBossLagHp(firstBoss.maxHp);
    setBossMaxHp(firstBoss.maxHp);
    setHeroHp(1000);
    setHeroLagHp(1000);
    setHeroMp(25);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setGameState("BATTLE");
    setCombatPhase("SELECT_ACTION");
    setActiveAction(null);
    setCombatLog(`Võ Đài khai màn! Đối thủ: ${firstBoss.name} (${firstBoss.title}).`);
  };

  // Advance to next boss stage
  const advanceNextStage = () => {
    const nextIdx = currentStageIdx + 1;
    if (nextIdx < BOSS_ROSTER.length) {
      setCurrentStageIdx(nextIdx);
      const nextBoss = BOSS_ROSTER[nextIdx];
      setBossHp(nextBoss.maxHp);
      setBossLagHp(nextBoss.maxHp);
      setBossMaxHp(nextBoss.maxHp);
      setHeroHp((prev) => Math.min(1000, prev + 350));
      setHeroLagHp((prev) => Math.min(1000, prev + 350));
      setHeroMp((prev) => Math.min(100, prev + 30));
      setCombatPhase("SELECT_ACTION");
      setActiveAction(null);
      setGameState("BATTLE");
      setCombatLog(`Tiến vào tầng ${nextIdx + 1}! Đối thủ: ${nextBoss.name} - ${nextBoss.title}.`);
      sound.playDragonGate();
    } else {
      setGameState("VICTORY");
      sound.playVictory();
      addExpAndGems(150, 15);
      if (onComplete) onComplete();
    }
  };

  // Generate question for selected action
  const selectAction = (action: CombatActionType) => {
    if (action === "ULTIMATE" && heroMp < 100) {
      sound.playShieldBreak();
      setCombatLog("Chưa đủ 100 Nộ Khí để tung Tuyệt Kỹ!");
      return;
    }

    sound.playWoodblock();
    setActiveAction(action);
    setCombatPhase("ANSWERING");

    const target = activeWords[Math.floor(Math.random() * activeWords.length)];
    speakChinese(target.chinese);

    let options: string[] = [];
    let correctIndex = 0;
    let promptType: "MEANING" | "PINYIN" | "HANZI" = "MEANING";

    if (action === "PARRY") {
      promptType = "PINYIN";
      const distractors = activeWords
        .filter((w) => w.chinese !== target.chinese)
        .map((w) => w.pinyin);
      const shuffledDistractors = [...new Set(distractors)].sort(() => Math.random() - 0.5).slice(0, 3);
      options = [target.pinyin, ...shuffledDistractors].sort(() => Math.random() - 0.5);
      correctIndex = options.indexOf(target.pinyin);
    } else {
      promptType = "MEANING";
      const distractors = activeWords
        .filter((w) => w.chinese !== target.chinese)
        .map((w) => w.meaningVi);
      const shuffledDistractors = [...new Set(distractors)].sort(() => Math.random() - 0.5).slice(0, 3);
      options = [target.meaningVi, ...shuffledDistractors].sort(() => Math.random() - 0.5);
      correctIndex = options.indexOf(target.meaningVi);
    }

    setCurrentQuestion({
      targetWord: target,
      options,
      correctIndex,
      promptType,
    });

    setQuestionTimer(action === "ULTIMATE" ? 8 : 6);
  };

  // Question countdown timer
  useEffect(() => {
    if (gameState !== "BATTLE" || combatPhase !== "ANSWERING") return;

    if (questionTimer <= 0) {
      handleAnswerOption(-1);
      return;
    }

    const timer = setInterval(() => {
      setQuestionTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, combatPhase, questionTimer]);

  // Execute Kinetic Action Turn
  const handleAnswerOption = (selectedIndex: number) => {
    if (combatPhase !== "ANSWERING" || !currentQuestion || !activeAction) return;

    setCombatPhase("RESOLVING");
    const isCorrect = selectedIndex === currentQuestion.correctIndex;

    if (isCorrect) {
      sound.playDragonGate();
      const newCombo = combo + 1;
      setCombo(newCombo);
      if (newCombo > maxCombo) setMaxCombo(newCombo);

      const timeBonus = Math.max(1, questionTimer);
      const pts = 120 * newCombo + timeBonus * 20;
      setScore((s) => s + pts);

      if (activeAction === "ATTACK") {
        const baseDmg = 160 + newCombo * 25 + timeBonus * 12;
        const isCrit = timeBonus >= 4;
        const dmg = isCrit ? Math.floor(baseDmg * 1.5) : baseDmg;

        // Hero Dashes forward to strike
        heroPosRef.current.x = 440;
        if (heroImgRef.current) {
          ghostTrailsRef.current.push({
            x: 280,
            y: heroPosRef.current.y,
            alpha: 0.9,
            img: heroImgRef.current,
            width: 160,
            height: 160,
          });
        }

        setTimeout(() => {
          bossPosRef.current.hitFlash = 1.0;
          shakeRef.current = isCrit ? 1.4 : 0.8;
          spawnHitImpact(bossPosRef.current.x, bossPosRef.current.y - 20, isCrit ? "#F59E0B" : "#EF4444", isCrit ? 40 : 25);
          addDamagePopup(bossPosRef.current.x, bossPosRef.current.y - 50, `-${dmg}${isCrit ? " BẠO KÍCH!" : ""}`, isCrit ? "#F59E0B" : "#EF4444", isCrit);
          setBossHp((prev) => Math.max(0, prev - dmg));
          setHeroMp((prev) => Math.min(100, prev + 25));
          setCombatLog(`Bao Bao xuất chưởng Kích Phá chính xác! Gây ${dmg} sát thương lên ${currentBoss.name}.`);

          // Return hero to base pos
          setTimeout(() => {
            heroPosRef.current.x = heroPosRef.current.baseX;
          }, 200);
        }, 180);

      } else if (activeAction === "PARRY") {
        const counterDmg = 140 + newCombo * 22;
        heroPosRef.current.shieldActive = 1.0;

        setTimeout(() => {
          bossPosRef.current.hitFlash = 1.0;
          spawnHitImpact(heroPosRef.current.x + 30, heroPosRef.current.y, "#10B981", 20);
          addDamagePopup(bossPosRef.current.x, bossPosRef.current.y - 50, `PHẢN ĐÒN -${counterDmg}`, "#38BDF8");
          addDamagePopup(heroPosRef.current.x, heroPosRef.current.y - 50, "HỘ THỂ HOÀN HẢO!", "#10B981");
          setBossHp((prev) => Math.max(0, prev - counterDmg));
          setHeroMp((prev) => Math.min(100, prev + 35));
          setCombatLog(`Bao Bao Hộ Thể hoàn mỹ! Chặn đứng đòn đánh và phản kích ${counterDmg} sát thương!`);
        }, 200);

      } else if (activeAction === "ULTIMATE") {
        const ultDmg = 560 + newCombo * 60;
        heroPosRef.current.x = 420;
        shakeRef.current = 1.8;

        setTimeout(() => {
          bossPosRef.current.hitFlash = 1.0;
          spawnHitImpact(bossPosRef.current.x, bossPosRef.current.y, "#F59E0B", 50);
          addDamagePopup(bossPosRef.current.x, bossPosRef.current.y - 60, `TUYỆT KỸ -${ultDmg} CRITICAL!`, "#F59E0B", true);
          setBossHp((prev) => Math.max(0, prev - ultDmg));
          setHeroMp(0);
          setCombatLog(`Bao Bao bộc phát Cửu Long Quyền Thần Chưởng! Gây ${ultDmg} sát thương long trời lở đất!`);

          setTimeout(() => {
            heroPosRef.current.x = heroPosRef.current.baseX;
          }, 250);
        }, 200);

      } else if (activeAction === "HEAL") {
        const healAmt = 280 + newCombo * 30;
        heroPosRef.current.shieldActive = 0.8;
        spawnHitImpact(heroPosRef.current.x, heroPosRef.current.y, "#34D399", 20);
        addDamagePopup(heroPosRef.current.x, heroPosRef.current.y - 50, `+${healAmt} HP`, "#10B981");
        setHeroHp((prev) => Math.min(heroMaxHp, prev + healAmt));
        setHeroMp((prev) => Math.min(100, prev + 15));
        setCombatLog(`Bao Bao luyện đan phục dược thành công! Hồi phục ${healAmt} sinh lực.`);
      }

      // Check Boss Death or Enemy Turn
      setTimeout(() => {
        setBossHp((latestHp) => {
          if (latestHp <= 0) {
            sound.playVictory();
            addExpAndGems(50, 5);
            setCombatLog(`Đã đả bại ${currentBoss.name}! Chiến thắng vẻ vang!`);
            setTimeout(() => {
              advanceNextStage();
            }, 1200);
            return 0;
          } else {
            if (activeAction === "PARRY") {
              setCombatPhase("SELECT_ACTION");
              setActiveAction(null);
            } else {
              executeEnemyTurn();
            }
            return latestHp;
          }
        });
      }, 750);

    } else {
      // INCORRECT ANSWER / TIMEOUT
      sound.playShieldBreak();
      setCombo(0);
      addDamagePopup(heroPosRef.current.x, heroPosRef.current.y - 50, "HỤT CHIÊU!", "#FF2255");
      setCombatLog(`Bao Bao xuất chiêu thất bại! ${currentBoss.name} lập tức phản kích!`);

      setTimeout(() => {
        executeEnemyTurn();
      }, 600);
    }
  };

  // Enemy Boss counter attack
  const executeEnemyTurn = () => {
    setCombatPhase("ENEMY_TURN");
    bossPosRef.current.x = 280;

    setTimeout(() => {
      sound.playShieldBreak();
      heroPosRef.current.hitFlash = 1.0;
      shakeRef.current = 1.2;

      const enemyDmg = Math.floor(currentBoss.attackPower * (Math.random() * 0.3 + 0.85));
      spawnHitImpact(heroPosRef.current.x, heroPosRef.current.y, currentBoss.color, 25);
      addDamagePopup(heroPosRef.current.x, heroPosRef.current.y - 50, `-${enemyDmg}`, "#EF4444");

      setHeroHp((prevHp) => {
        const nextHp = Math.max(0, prevHp - enemyDmg);
        if (nextHp <= 0) {
          setTimeout(() => {
            sound.playShieldBreak();
            setGameState("DEFEAT");
          }, 800);
        } else {
          setTimeout(() => {
            bossPosRef.current.x = bossPosRef.current.baseX;
            setCombatPhase("SELECT_ACTION");
            setActiveAction(null);
          }, 400);
        }
        return nextHp;
      });
    }, 200);
  };

  return (
    <div className="mx-auto flex flex-col items-center select-none w-full max-w-4xl text-slate-100">
      {/* Outer Oriental Combat Arena Frame */}
      <div className={`relative w-full ${gameState === "CONFIG" ? "overflow-visible" : "overflow-hidden"} rounded-[2.5rem] border-4 border-slate-800 bg-[#070D1E] shadow-2xl`}>
        
        {/* TOP GAME HUD */}
        <div className="relative z-20 flex items-center justify-between border-b border-white/10 bg-slate-950/90 px-5 py-3 backdrop-blur-md">
          {/* Stage Banner */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-400">
              <Swords size={20} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
                Võ Đài Quyết Đấu HSK
              </span>
              <span className="text-sm font-black text-white">
                TẦNG {currentStageIdx + 1} / 3: {currentBoss.name}
              </span>
            </div>
          </div>

          {/* Score & Sound Toggle */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-slate-900 px-3 py-1.5 font-mono text-xs">
              <Sparkles size={14} className="text-amber-400" />
              <span className="text-slate-400">ĐIỂM:</span>
              <span className="font-black text-amber-400">{score}</span>
            </div>

            {combo >= 2 && (
              <div className="flex items-center gap-1 rounded-xl border border-amber-400/40 bg-amber-500/10 px-2.5 py-1 font-mono text-xs font-black text-amber-300 animate-pulse">
                <Flame size={14} className="text-amber-400" />
                <span>x{combo} COMBO</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                const nextMute = sound.toggleMute();
                setIsMuted(nextMute);
              }}
              className="rounded-xl border border-white/10 bg-slate-900 p-2 text-slate-400 hover:text-white transition cursor-pointer"
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* STATE 1: CONFIGURATION SCREEN (CHỌN CHUẨN, CẤP ĐỘ, CHỦ ĐỀ) */}
        {/* ========================================================================= */}
        {gameState === "CONFIG" && (
          <div className="p-6 sm:p-10 flex flex-col items-center justify-center space-y-6">
            <div className="text-center space-y-2 max-w-lg">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                ĐẤU TRƯỜNG QUYẾT ĐẤU (HSK ARENA)
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Đồng hành cùng Hiệp sĩ Gấu Trúc Bao Bao vượt qua 3 tầng võ đài, đối đầu với các đại cao thủ võ lâm bằng sức mạnh từ vựng tiếng Trung!
              </p>
            </div>

            {/* Filter Configuration Box */}
            <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-950/70 p-5 space-y-4 relative z-20">
              {/* 1. Chọn Chuẩn HSK */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 block">
                  1. Chuẩn Khảo Thí:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      sound.playWoodblock();
                      setSelectedStandard("HSK20");
                      setSelectedLevel("HSK1");
                    }}
                    className={`rounded-xl py-2 px-3 text-center text-xs font-black border transition-all cursor-pointer ${
                      selectedStandard === "HSK20"
                        ? "border-amber-400 bg-amber-400 text-black shadow-[0_0_12px_rgba(245,158,11,0.4)]"
                        : "border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
                    }`}
                  >
                    HSK 2.0 (Cổ Điển)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sound.playWoodblock();
                      setSelectedStandard("HSK30");
                      setSelectedLevel("HSK1");
                    }}
                    className={`rounded-xl py-2 px-3 text-center text-xs font-black border transition-all cursor-pointer ${
                      selectedStandard === "HSK30"
                        ? "border-amber-400 bg-amber-400 text-black shadow-[0_0_12px_rgba(245,158,11,0.4)]"
                        : "border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
                    }`}
                  >
                    HSK 3.0 (Mới Nhất)
                  </button>
                </div>
              </div>

              {/* 2. Chọn Cấp Độ HSK */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <Target size={12} className="text-amber-400" />
                  <span>2. Cấp Độ HSK:</span>
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  {(selectedStandard === "HSK30"
                    ? ["HSK1", "HSK2", "HSK3", "HSK4", "HSK5", "HSK6", "HSK7-9"]
                    : ["HSK1", "HSK2", "HSK3", "HSK4", "HSK5", "HSK6"]
                  ).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => {
                        sound.playWoodblock();
                        setSelectedLevel(lvl);
                      }}
                      className={`rounded-lg py-1.5 px-1 text-center text-[11px] font-black border transition-all cursor-pointer ${
                        selectedLevel === lvl
                          ? "border-amber-400 bg-amber-400 text-black shadow-[0_0_10px_#F59E0B]"
                          : "border-slate-800 bg-slate-900/80 text-slate-300 hover:border-slate-700"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Custom Chọn Chủ Đề Bài Học Dropdown */}
              <div ref={dropdownRef} className="relative z-30">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <BookOpen size={12} className="text-amber-400" />
                  <span>3. Chủ Đề Bài Học:</span>
                </label>

                <button
                  type="button"
                  onClick={() => {
                    sound.playWoodblock();
                    setIsDropdownOpen((prev) => !prev);
                  }}
                  className={`w-full flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-xs font-bold transition-all cursor-pointer shadow-sm ${
                    isDropdownOpen
                      ? "border-amber-400 bg-amber-400/10 ring-2 ring-amber-400/20 text-white"
                      : "border-slate-700 bg-slate-900 text-slate-200 hover:border-amber-400/60 hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <BookOpen size={13} className="text-amber-400 shrink-0" />
                    <span className="truncate">
                      {selectedTopicId === "ALL"
                        ? `Toàn bộ chủ đề ${selectedLevel} (${activeWords.length} từ vựng)`
                        : availableTopics.find((t) => t.id === selectedTopicId)?.title || selectedTopicId}
                    </span>
                  </div>
                  <ChevronDown
                    size={15}
                    className={`text-slate-400 transition-transform duration-200 shrink-0 ${
                      isDropdownOpen ? "rotate-180 text-amber-400" : ""
                    }`}
                  />
                </button>

                {/* Dropdown Menu Popover */}
                {isDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 z-50 max-h-56 overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden rounded-2xl border border-slate-700 bg-slate-900/95 backdrop-blur-md p-1.5 shadow-2xl animate-fadeIn divide-y divide-slate-800">
                    <div className="pb-1">
                      {/* Option: ALL */}
                      <button
                        type="button"
                        onClick={() => {
                          sound.playWoodblock();
                          setSelectedTopicId("ALL");
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition cursor-pointer ${
                          selectedTopicId === "ALL"
                            ? "bg-amber-400/20 text-amber-400 border border-amber-400/30"
                            : "text-slate-300 hover:bg-slate-800 hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                          <span>Toàn bộ chủ đề {selectedLevel} ({activeWords.length} từ)</span>
                        </div>
                        {selectedTopicId === "ALL" && (
                          <Check size={14} className="text-amber-400" />
                        )}
                      </button>
                    </div>

                    {/* Individual Topics */}
                    <div className="pt-1 space-y-0.5">
                      {availableTopics.map((t) => {
                        const isSelected = selectedTopicId === t.id;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => {
                              sound.playWoodblock();
                              setSelectedTopicId(t.id);
                              setIsDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition cursor-pointer ${
                              isSelected
                                ? "bg-amber-400/20 text-amber-400 border border-amber-400/30"
                                : "text-slate-300 hover:bg-slate-800 hover:text-white"
                            }`}
                          >
                            <span className="truncate text-left">{t.title}</span>
                            {isSelected && <Check size={14} className="text-amber-400 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Tùy Chọn Pinyin */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">Hiển thị Pinyin trên chữ:</span>
                <button
                  type="button"
                  onClick={() => {
                    sound.playWoodblock();
                    setShowPinyin((p) => !p);
                  }}
                  className={`rounded-lg px-3 py-1 text-xs font-bold border transition cursor-pointer ${
                    showPinyin
                      ? "border-emerald-400 bg-emerald-500/20 text-emerald-300"
                      : "border-rose-500/50 bg-rose-500/20 text-rose-300"
                  }`}
                >
                  {showPinyin ? "BẬT" : "TẮT"}
                </button>
              </div>
            </div>

            {/* Launch Arena Button */}
            <button
              type="button"
              onClick={startBattle}
              className="flex items-center justify-center gap-2 rounded-2xl border-2 border-amber-400 bg-amber-400 text-black py-4 px-10 font-mono text-base font-black tracking-wider shadow-[0_0_25px_rgba(245,158,11,0.4)] hover:bg-amber-300 active:scale-95 transition-all cursor-pointer"
            >
              <Play className="h-5 w-5 fill-current" />
              <span>BƯỚC VÀO VÕ ĐÀI ({activeWords.length} TỪ)</span>
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STATE 2: ACTIVE BATTLE SCREEN WITH 60FPS FIGHTING ENGINE */}
        {/* ========================================================================= */}
        {gameState === "BATTLE" && (
          <div className="relative flex flex-col">
            
            {/* FIGHTING GAME TOP HEALTH BARS */}
            <div className="absolute top-3 inset-x-4 z-20 flex items-center justify-between gap-4 pointer-events-none">
              {/* Hero HP Bar */}
              <div className="w-48 sm:w-64 rounded-2xl border border-white/20 bg-slate-950/90 p-2 space-y-1 shadow-2xl backdrop-blur-md">
                <div className="flex justify-between text-[11px] font-black">
                  <span className="text-amber-400">BAO BAO</span>
                  <span className="text-slate-200 font-mono">{heroHp} / {heroMaxHp} HP</span>
                </div>
                {/* Double Layer HP Bar (Lagging yellow damage chip) */}
                <div className="relative h-3 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-amber-300/80 transition-all duration-75"
                    style={{ width: `${(heroLagHp / heroMaxHp) * 100}%` }}
                  />
                  <div
                    className="absolute inset-y-0 left-0 bg-emerald-500 transition-all duration-300 shadow-[0_0_10px_#10B981]"
                    style={{ width: `${(heroHp / heroMaxHp) * 100}%` }}
                  />
                </div>
                {/* MP / Rage Bar */}
                <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-amber-400 transition-all duration-300 shadow-[0_0_8px_#F59E0B]"
                    style={{ width: `${heroMp}%` }}
                  />
                </div>
              </div>

              {/* VS Emblem in Center */}
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-amber-400 bg-black/90 font-mono text-sm font-black text-amber-400 shadow-xl">
                VS
              </div>

              {/* Boss HP Bar */}
              <div className="w-48 sm:w-64 rounded-2xl border border-white/20 bg-slate-950/90 p-2 space-y-1 shadow-2xl backdrop-blur-md">
                <div className="flex justify-between text-[11px] font-black">
                  <span className="text-slate-200 font-mono">{bossHp} / {bossMaxHp} HP</span>
                  <span style={{ color: currentBoss.color }}>{currentBoss.name}</span>
                </div>
                {/* Double Layer HP Bar */}
                <div className="relative h-3 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="absolute inset-y-0 right-0 bg-amber-300/80 transition-all duration-75"
                    style={{ width: `${(bossLagHp / bossMaxHp) * 100}%` }}
                  />
                  <div
                    className="absolute inset-y-0 right-0 transition-all duration-300 shadow-[0_0_10px_#EF4444]"
                    style={{
                      width: `${(bossHp / bossMaxHp) * 100}%`,
                      backgroundColor: currentBoss.color,
                    }}
                  />
                </div>
                <div className="text-[9px] text-right text-slate-400 font-bold">
                  Chiêu: {currentBoss.skillName}
                </div>
              </div>
            </div>

            {/* 60FPS ACTION CANVAS */}
            <div className="relative w-full flex justify-center bg-black">
              <canvas
                ref={canvasRef}
                width={720}
                height={400}
                className="w-full h-auto max-h-[400px] object-cover"
              />
            </div>

            {/* COMBAT DECK CONTROLS */}
            <div className="p-5 sm:p-6 bg-slate-950 border-t border-white/10 space-y-4">
              
              {/* Combat Log Announcer */}
              <div className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-2.5 text-center text-xs font-bold text-slate-200 shadow-inner">
                <span>{combatLog}</span>
              </div>

              {/* ACTION SELECTION DECK */}
              {combatPhase === "SELECT_ACTION" && (
                <div className="space-y-3">
                  <div className="text-center">
                    <span className="text-[11px] font-black uppercase tracking-wider text-amber-400">
                      LƯỢT CỦA BẠN: HÃY CHỌN CHIÊU THỨC VÕ THUẬT
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                    {/* Action 1: Strike Attack */}
                    <button
                      type="button"
                      onClick={() => selectAction("ATTACK")}
                      className="group flex flex-col items-center justify-center p-4 rounded-2xl border border-rose-500/40 bg-slate-900 hover:bg-rose-500/20 hover:border-rose-400 text-left transition-all active:scale-95 cursor-pointer shadow-lg"
                    >
                      <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 group-hover:scale-110 transition mb-2">
                        <Swords size={20} />
                      </div>
                      <span className="text-xs font-black text-white">KÍCH PHÁ [1]</span>
                      <span className="text-[10px] text-rose-300 mt-0.5">Tấn công (~180 DMG)</span>
                    </button>

                    {/* Action 2: Shield Parry */}
                    <button
                      type="button"
                      onClick={() => selectAction("PARRY")}
                      className="group flex flex-col items-center justify-center p-4 rounded-2xl border border-sky-500/40 bg-slate-900 hover:bg-sky-500/20 hover:border-sky-400 text-left transition-all active:scale-95 cursor-pointer shadow-lg"
                    >
                      <div className="p-2.5 rounded-xl bg-sky-500/20 text-sky-400 group-hover:scale-110 transition mb-2">
                        <Shield size={20} />
                      </div>
                      <span className="text-xs font-black text-white">HỘ THỂ [2]</span>
                      <span className="text-[10px] text-sky-300 mt-0.5">Đỡ đòn & Phản kích</span>
                    </button>

                    {/* Action 3: Dragon Rage Ultimate */}
                    <button
                      type="button"
                      onClick={() => selectAction("ULTIMATE")}
                      disabled={heroMp < 100}
                      className={`group flex flex-col items-center justify-center p-4 rounded-2xl border text-left transition-all active:scale-95 cursor-pointer shadow-lg ${
                        heroMp >= 100
                          ? "border-amber-400 bg-amber-500/20 hover:bg-amber-400 hover:text-black shadow-[0_0_15px_rgba(245,158,11,0.3)] animate-pulse"
                          : "border-slate-800 bg-slate-900/40 opacity-40 cursor-not-allowed"
                      }`}
                    >
                      <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 group-hover:scale-110 transition mb-2">
                        <Flame size={20} />
                      </div>
                      <span className="text-xs font-black text-white">TUYỆT KỸ [3]</span>
                      <span className="text-[10px] text-amber-300 mt-0.5">
                        {heroMp >= 100 ? "NỘ KHÍ (560+ DMG)" : `${heroMp}/100 NỘ`}
                      </span>
                    </button>

                    {/* Action 4: Herbal Recovery */}
                    <button
                      type="button"
                      onClick={() => selectAction("HEAL")}
                      className="group flex flex-col items-center justify-center p-4 rounded-2xl border border-emerald-500/40 bg-slate-900 hover:bg-emerald-500/20 hover:border-emerald-400 text-left transition-all active:scale-95 cursor-pointer shadow-lg"
                    >
                      <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 group-hover:scale-110 transition mb-2">
                        <Heart size={20} />
                      </div>
                      <span className="text-xs font-black text-white">PHỤC DƯỢC [4]</span>
                      <span className="text-[10px] text-emerald-300 mt-0.5">Hồi phục (+280 HP)</span>
                    </button>
                  </div>
                </div>
              )}

              {/* QUESTION SOLVING PHASE */}
              {combatPhase === "ANSWERING" && currentQuestion && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Timer & Question Target */}
                  <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900 p-4 shadow-xl">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => speakChinese(currentQuestion.targetWord.chinese)}
                        className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-400/50 bg-amber-500/20 text-amber-400 hover:bg-amber-400 hover:text-black transition cursor-pointer"
                      >
                        <Volume2 size={22} />
                      </button>
                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl sm:text-4xl font-black text-white tracking-wider font-hanzi">
                            {currentQuestion.targetWord.chinese}
                          </span>
                          {showPinyin && (
                            <span className="text-sm font-bold text-amber-400 font-mono">
                              {currentQuestion.targetWord.pinyin}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          {currentQuestion.promptType === "PINYIN"
                            ? "Chọn phiên âm Pinyin chuẩn để hộ thể đỡ đòn!"
                            : "Chọn ý nghĩa tiếng Việt chính xác để xuất chiêu!"}
                        </span>
                      </div>
                    </div>

                    {/* Countdown Timer */}
                    <div className="flex flex-col items-end">
                      <div className={`text-2xl font-black font-mono ${questionTimer <= 2 ? "text-rose-500 animate-ping" : "text-amber-400"}`}>
                        00:0{questionTimer}
                      </div>
                      <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">
                        THỜI GIAN
                      </span>
                    </div>
                  </div>

                  {/* 4 Choice Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {currentQuestion.options.map((opt, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleAnswerOption(idx)}
                        className="group flex items-center justify-between p-3.5 rounded-2xl border border-slate-800 bg-slate-900 hover:border-amber-400 hover:bg-amber-500/10 text-left transition-all active:scale-98 cursor-pointer"
                      >
                        <span className="text-sm font-bold text-white group-hover:text-amber-300">
                          {opt}
                        </span>
                        <ChevronRight size={16} className="text-slate-500 group-hover:text-amber-400 transition" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* RESOLVING PHASE */}
              {(combatPhase === "RESOLVING" || combatPhase === "ENEMY_TURN") && (
                <div className="py-6 text-center space-y-2">
                  <div className="inline-flex items-center gap-2 text-sm font-black text-amber-400 animate-pulse">
                    <Swords size={18} />
                    <span>ĐANG THI TRIỂN VÕ HỌC ĐỐI KHÁNG...</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STATE 3: VICTORY SCREEN (CHIẾN THẮNG TOÀN DIỆN 3 TẦNG) */}
        {/* ========================================================================= */}
        {gameState === "VICTORY" && (
          <div className="p-8 sm:p-12 text-center space-y-6 animate-fadeIn">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-500/20 border-2 border-amber-400 text-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.5)]">
              <Trophy size={40} />
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl font-black text-amber-400">
                VÕ ĐÀI MINH CHỦ - CHIẾN THẮNG TOÀN DIỆN!
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
                Bao Bao đã đả bại toàn bộ 3 Đại Cao Thủ võ lâm, chính thức đăng quang ngôi vị Đệ Nhất Võ Lâm HSK!
              </p>
            </div>

            {/* Score Summary Box */}
            <div className="w-full max-w-xs mx-auto rounded-2xl border border-white/10 bg-slate-950/80 p-5 space-y-3 font-mono text-xs text-left">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">TỔNG ĐIỂM:</span>
                <span className="font-black text-amber-400 text-base">{score}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">MAX COMBO:</span>
                <span className="font-black text-emerald-400">x{maxCombo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">PHẦN THƯỞNG:</span>
                <span className="font-black text-amber-400">+150 EXP, +15 GEMS</span>
              </div>
            </div>

            <button
              type="button"
              onClick={startBattle}
              className="inline-flex items-center gap-2 rounded-2xl border-2 border-amber-400 bg-amber-400 text-black px-8 py-4 font-mono text-sm font-black shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:bg-amber-300 active:scale-95 transition cursor-pointer"
            >
              <RotateCcw size={18} />
              <span>TÁI ĐẤU TRẬN MỚI</span>
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STATE 4: DEFEAT SCREEN */}
        {/* ========================================================================= */}
        {gameState === "DEFEAT" && (
          <div className="p-8 sm:p-12 text-center space-y-6 animate-fadeIn">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-rose-500/20 border-2 border-rose-500 text-rose-500 shadow-[0_0_30px_rgba(239,68,68,0.5)]">
              <ShieldAlert size={40} />
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl font-black text-rose-500">
                THẤT THỦ TRÊN VÕ ĐÀI
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
                {currentBoss.name} quá mạnh mẽ! Hãy củng cố lại từ vựng HSK và tái đấu để phục thù!
              </p>
            </div>

            <div className="w-full max-w-xs mx-auto rounded-2xl border border-white/10 bg-slate-950/80 p-5 space-y-3 font-mono text-xs text-left">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">TỔNG ĐIỂM:</span>
                <span className="font-black text-amber-400 text-base">{score}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">TẦNG ĐÃ ĐẠT:</span>
                <span className="font-black text-white">Tầng {currentStageIdx + 1} / 3</span>
              </div>
            </div>

            <button
              type="button"
              onClick={startBattle}
              className="inline-flex items-center gap-2 rounded-2xl border-2 border-amber-400 bg-amber-400 text-black px-8 py-4 font-mono text-sm font-black shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:bg-amber-300 active:scale-95 transition cursor-pointer"
            >
              <RotateCcw size={18} />
              <span>PHỤC THÙ VÕ ĐÀI</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
