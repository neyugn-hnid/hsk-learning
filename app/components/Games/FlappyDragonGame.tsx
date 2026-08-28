import { useState, useEffect, useRef, useMemo } from "react";
import { sound } from "~/lib/sound";
import { addExpAndGems } from "~/lib/gamification";
import { r2Asset } from "~/lib/assets";
import {
  RotateCcw,
  Trophy,
  Play,
  Flame,
  Volume2,
  VolumeX,
  Target,
  BookOpen,
  Sparkles,
  Heart,
  Zap,
  ChevronDown,
  Check,
} from "lucide-react";

export type DragonWord = {
  chinese: string;
  pinyin: string;
  cleanPinyin?: string;
  meaningVi: string;
  level?: string;
  lessonId?: string;
  lessonTitle?: string;
  source?: string;
};

export type DragonLesson = {
  id: string;
  title: string;
  level: string;
  source: string;
};

interface Gate {
  x: number;
  width: number;
  gapY: number; // Center of the gap
  gapHeight: number;
  topChoice: {
    word: DragonWord;
    isCorrect: boolean;
  };
  bottomChoice: {
    word: DragonWord;
    isCorrect: boolean;
  };
  questionPrompt: string; // Meaning or Pinyin to match
  passed: boolean;
}

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

interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  vy: number;
}

function removeTones(pinyin: string): string {
  return pinyin
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ü/g, "v")
    .replace(/[^a-z]/g, "");
}

const defaultFallbackWords: DragonWord[] = [
  { chinese: "你好", pinyin: "nǐhǎo", meaningVi: "Xin chào", level: "HSK1", source: "HSK20" },
  { chinese: "再见", pinyin: "zàijiàn", meaningVi: "Tạm biệt", level: "HSK1", source: "HSK20" },
  { chinese: "谢谢", pinyin: "xièxiè", meaningVi: "Cảm ơn", level: "HSK1", source: "HSK20" },
  { chinese: "中国", pinyin: "zhōngguó", meaningVi: "Trung Quốc", level: "HSK1", source: "HSK20" },
  { chinese: "北京", pinyin: "běijīng", meaningVi: "Bắc Kinh", level: "HSK1", source: "HSK20" },
  { chinese: "学习", pinyin: "xuéxí", meaningVi: "Học tập", level: "HSK1", source: "HSK20" },
  { chinese: "老师", pinyin: "lǎoshī", meaningVi: "Thầy cô", level: "HSK1", source: "HSK20" },
  { chinese: "学生", pinyin: "xuéshēng", meaningVi: "Học sinh", level: "HSK1", source: "HSK20" },
  { chinese: "朋友", pinyin: "péngyǒu", meaningVi: "Bạn bè", level: "HSK1", source: "HSK20" },
  { chinese: "苹果", pinyin: "píngguǒ", meaningVi: "Quả táo", level: "HSK1", source: "HSK20" },
  { chinese: "喝水", pinyin: "hēshuǐ", meaningVi: "Uống nước", level: "HSK1", source: "HSK20" },
  { chinese: "吃饭", pinyin: "chīfàn", meaningVi: "Ăn cơm", level: "HSK1", source: "HSK20" },
  { chinese: "喜欢", pinyin: "xǐhuan", meaningVi: "Yêu thích", level: "HSK1", source: "HSK20" },
  { chinese: "高兴", pinyin: "gāoxìng", meaningVi: "Vui vẻ", level: "HSK1", source: "HSK20" },
];

export interface FlappyDragonGameProps {
  words?: DragonWord[];
  lessons?: DragonLesson[];
  onComplete?: () => void;
  combo?: number;
  maxCombo?: number;
}

export function FlappyDragonGame({
  words = [],
  lessons = [],
  onComplete,
  combo: initialCombo = 0,
  maxCombo: initialMaxCombo = 0,
}: FlappyDragonGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Configuration State before game
  const [selectedStandard, setSelectedStandard] = useState<"HSK20" | "HSK30">("HSK20");
  const [selectedLevel, setSelectedLevel] = useState<string>("HSK1");
  const [selectedTopicId, setSelectedTopicId] = useState<string>("ALL");
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

  // React UI State
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(initialCombo);
  const [maxCombo, setMaxCombo] = useState<number>(initialMaxCombo);
  const [lives, setLives] = useState<number>(3);
  const [gatesPassed, setGatesPassed] = useState<number>(0);
  const [currentPrompt, setCurrentPrompt] = useState<string>("");
  const [showPinyin, setShowPinyin] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(() => sound.getMuted());

  // Non-repeating queue tracking
  const wordQueueRef = useRef<(DragonWord & { cleanPinyin: string })[]>([]);
  const currentWordIdxRef = useRef<number>(0);
  const totalLessonWordsRef = useRef<number>(0);
  const currentPromptRef = useRef<string>("");

  // Performance & Combo Refs (prevents loop re-instantiation)
  const comboRef = useRef<number>(initialCombo);
  const maxComboRef = useRef<number>(initialMaxCombo);
  useEffect(() => {
    comboRef.current = combo;
  }, [combo]);
  useEffect(() => {
    maxComboRef.current = maxCombo;
  }, [maxCombo]);

  // 60FPS Physics Refs (Pixel-per-second system)
  const dragonRef = useRef<{
    x: number;
    y: number;
    vy: number;
    radius: number;
    angle: number;
    flapFrame: number;
    invincibleTimer: number;
  }>({
    x: 140,
    y: 350,
    vy: 0,
    radius: 22,
    angle: 0,
    flapFrame: 0,
    invincibleTimer: 0,
  });

  const gatesRef = useRef<Gate[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const cloudsRef = useRef<{ x: number; y: number; speed: number; size: number; alpha: number }[]>([]);
  const shakeRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    containerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  useEffect(() => {
    if (isPlaying) {
      containerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [isPlaying]);

  const isPlayingRef = useRef(false);
  const animFrameIdRef = useRef<number | null>(null);
  const showPinyinRef = useRef(true);
  const bgScrollXRef = useRef(0);

  const bgImgRef = useRef<HTMLImageElement | null>(null);
  const pandaImgRef = useRef<HTMLImageElement | null>(null);
  const pillarImgRef = useRef<HTMLImageElement | null>(null);
  const cloud1ImgRef = useRef<HTMLImageElement | null>(null);
  const cloud2ImgRef = useRef<HTMLImageElement | null>(null);
  const cloud3ImgRef = useRef<HTMLImageElement | null>(null);

  // Preload High-Res Mythological Assets & 3 Distinct Cloud Styles
  useEffect(() => {
    const bgImg = new Image();
    bgImg.src = r2Asset("/game/flappy_dragon_bg.jpg");
    bgImg.onload = () => {
      bgImgRef.current = bgImg;
    };

    const pandaImg = new Image();
    pandaImg.src = r2Asset("/game/flappy_panda.png");
    pandaImg.onload = () => {
      pandaImgRef.current = pandaImg;
    };

    const pillarImg = new Image();
    pillarImg.src = r2Asset("/game/dragon_pillar.png");
    pillarImg.onload = () => {
      pillarImgRef.current = pillarImg;
    };

    const c1 = new Image();
    c1.src = r2Asset("/game/cloud_type1.png");
    c1.onload = () => {
      cloud1ImgRef.current = c1;
    };

    const c2 = new Image();
    c2.src = r2Asset("/game/cloud_type2.png");
    c2.onload = () => {
      cloud2ImgRef.current = c2;
    };

    const c3 = new Image();
    c3.src = r2Asset("/game/cloud_type3.png");
    c3.onload = () => {
      cloud3ImgRef.current = c3;
    };
  }, []);

  useEffect(() => {
    showPinyinRef.current = showPinyin;
  }, [showPinyin]);

  // Available topics for selected standard and level
  const availableTopics = useMemo(() => {
    if (!lessons || lessons.length === 0) return [];
    return lessons.filter(
      (l) => l.source === selectedStandard && l.level.toUpperCase() === selectedLevel.toUpperCase()
    );
  }, [lessons, selectedStandard, selectedLevel]);

  // Reset topic selection when standard or level changes
  useEffect(() => {
    setSelectedTopicId("ALL");
  }, [selectedStandard, selectedLevel]);

  const [topicWords, setTopicWords] = useState<DragonWord[]>([]);
  const [isLoadingWords, setIsLoadingWords] = useState<boolean>(false);

  // Dynamic fetch vocabulary when standard, level, or topic changes
  useEffect(() => {
    let isCancelled = false;
    const fetchVocab = async () => {
      setIsLoadingWords(true);
      try {
        const params = new URLSearchParams({
          standard: selectedStandard,
          level: selectedLevel,
          lessonId: selectedTopicId,
        });
        const res = await fetch(`/api/vocabularies?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (!isCancelled && Array.isArray(data.vocabularies) && data.vocabularies.length > 0) {
            setTopicWords(
              data.vocabularies.map((v: any) => ({
                chinese: v.chinese,
                pinyin: v.pinyin,
                meaningVi: v.meaningVi,
                level: v.level,
                lessonId: v.lessonId,
                lessonTitle: v.lesson?.title,
                source: v.lesson?.source,
              }))
            );
          }
        }
      } catch (err) {
        console.error("Failed to load topic words:", err);
      } finally {
        if (!isCancelled) setIsLoadingWords(false);
      }
    };

    fetchVocab();
    return () => {
      isCancelled = true;
    };
  }, [selectedStandard, selectedLevel, selectedTopicId]);

  // Active Words Filtered by Standard + Level + Topic
  const activeWords: (DragonWord & { cleanPinyin: string })[] = useMemo(() => {
    const rawList =
      topicWords.length > 0
        ? topicWords
        : words && words.length > 0
        ? words
        : defaultFallbackWords;

    let filtered = rawList.filter((w) => {
      const matchStandard = !w.source || w.source.toUpperCase() === selectedStandard.toUpperCase();
      const matchLevel = !w.level || w.level.toUpperCase() === selectedLevel.toUpperCase();
      const matchTopic = selectedTopicId === "ALL" || w.lessonId === selectedTopicId || w.lessonTitle === selectedTopicId;
      return matchStandard && matchLevel && matchTopic;
    });

    if (filtered.length === 0) {
      filtered = rawList;
    }
    if (filtered.length === 0) {
      filtered = defaultFallbackWords;
    }

    return filtered.map((w) => ({
      ...w,
      cleanPinyin: removeTones(w.pinyin) || "nihao",
    }));
  }, [topicWords, words, selectedStandard, selectedLevel, selectedTopicId]);

  const activeWordsRef = useRef(activeWords);
  useEffect(() => {
    activeWordsRef.current = activeWords;
  }, [activeWords]);

  // Initialize 3 Distinct Types of Celestial Clouds
  useEffect(() => {
    const clouds = [];
    const types: (1 | 2 | 3)[] = [1, 2, 3];

    for (let i = 0; i < 12; i++) {
      const type = types[i % 3];
      const baseY = Math.random() * 640 + 30;
      clouds.push({
        x: Math.random() * 680,
        y: baseY,
        baseY,
        speed: Math.random() * 0.4 + 0.2, // Smooth organic floating speeds
        scale: Math.random() * 0.45 + 0.65,
        alpha: Math.random() * 0.25 + 0.25,
        type,
        bobOffset: Math.random() * Math.PI * 2,
        bobSpeed: Math.random() * 0.6 + 0.8,
      });
    }
    cloudsRef.current = clouds as any;
  }, []);

  // Speak Chinese Helper (Non-blocking async to eliminate audio IPC stutter)
  const speakChinese = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    setTimeout(() => {
      try {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = "zh-CN";
        u.rate = 1.0;
        window.speechSynthesis.speak(u);
      } catch {
        // Safe audio fallback
      }
    }, 0);
  };

  // Jump / Flap Action (Instant smooth upward impulse)
  const handleFlap = () => {
    if (!isPlayingRef.current) return;
    dragonRef.current.vy = -280; // Crisp, responsive upward velocity in px/s
    dragonRef.current.flapFrame = 12;
    sound.playFlap();

    // Spawn golden cloud dust and star sparkle trail
    for (let i = 0; i < 7; i++) {
      particlesRef.current.push({
        x: dragonRef.current.x - 24,
        y: dragonRef.current.y + 12 + (Math.random() - 0.5) * 12,
        vx: -Math.random() * 80 - 40,
        vy: (Math.random() - 0.5) * 60,
        color: Math.random() > 0.4 ? "#FDE047" : "#F59E0B",
        size: Math.random() * 4.5 + 2,
        alpha: 1.0,
        decay: 0.035,
      });
    }
  };

  // Spawn a Dragon Gate
  const spawnGate = (startX: number) => {
    if (currentWordIdxRef.current >= wordQueueRef.current.length) {
      return;
    }

    const correctWord = wordQueueRef.current[currentWordIdxRef.current];
    currentWordIdxRef.current++;

    const pool =
      activeWordsRef.current.length > 0
        ? activeWordsRef.current
        : defaultFallbackWords.map((w) => ({ ...w, cleanPinyin: removeTones(w.pinyin) || "nihao" }));
    let wrongPool = pool.filter((w) => w.chinese !== correctWord.chinese);
    if (wrongPool.length === 0) wrongPool = pool;
    const wrongWord = wrongPool[Math.floor(Math.random() * wrongPool.length)];

    const isTopCorrect = Math.random() > 0.5;
    const gapY = Math.floor(Math.random() * 160) + 310;
    const gapHeight = 340; // Generous comfortable corridor

    const newGate: Gate = {
      x: startX,
      width: 160,
      gapY,
      gapHeight,
      topChoice: {
        word: isTopCorrect ? correctWord : wrongWord,
        isCorrect: isTopCorrect,
      },
      bottomChoice: {
        word: isTopCorrect ? wrongWord : correctWord,
        isCorrect: !isTopCorrect,
      },
      questionPrompt: correctWord.meaningVi,
      passed: false,
    };

    gatesRef.current.push(newGate);
  };

  // Start Game
  const startGame = () => {
    sound.playGuzhengHarp(0);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setLives(3);
    setGatesPassed(0);
    setCurrentPrompt("");
    currentPromptRef.current = "";
    setIsGameOver(false);
    setIsVictory(false);
    setIsPlaying(true);
    isPlayingRef.current = true;

    // Build shuffled non-repeating queue from active words
    const pool =
      activeWordsRef.current.length > 0
        ? activeWordsRef.current
        : defaultFallbackWords.map((w) => ({ ...w, cleanPinyin: removeTones(w.pinyin) || "nihao" }));
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    wordQueueRef.current = shuffled;
    currentWordIdxRef.current = 0;
    totalLessonWordsRef.current = shuffled.length;

    dragonRef.current = {
      x: 140,
      y: 330,
      vy: -120, // Gentle lift on game start
      radius: 24,
      angle: -0.1,
      flapFrame: 10,
      invincibleTimer: 1.0, // 1s grace period on start
    };

    gatesRef.current = [];
    particlesRef.current = [];
    floatingTextsRef.current = [];

    // Spawn first gates with comfortable spacing
    spawnGate(660);
    if (shuffled.length > 1) {
      spawnGate(1100);
    }
  };

  // Main 60FPS / 120FPS Game Loop (Pure RAF loop without hook recreation)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      animFrameIdRef.current = requestAnimationFrame(loop);

      const dt = Math.min((currentTime - lastTime) / 1000, 0.04);
      lastTime = currentTime;

      // 1. Draw High-Res Mythological Seamless Parallax Background (Mirror Tiling)
      if (bgImgRef.current && bgImgRef.current.complete) {
        const bgW = canvas.width;
        const bgH = canvas.height;
        const totalPeriod = bgW * 2;
        
        bgScrollXRef.current = (bgScrollXRef.current - dt * 35) % totalPeriod;
        let startX = bgScrollXRef.current;
        if (startX > 0) startX -= totalPeriod;

        // Draw consecutive tiles across the screen width with alternating horizontal mirror
        for (let x = startX, tileIdx = 0; x < canvas.width + bgW; x += bgW, tileIdx++) {
          const isMirrored = Math.abs(Math.floor(x / bgW)) % 2 !== 0;
          if (!isMirrored) {
            // Normal Tile
            ctx.drawImage(bgImgRef.current, x, 0, bgW, bgH);
          } else {
            // Horizontally Mirrored Tile (Creates 100% seamless pixel match at junctions)
            ctx.save();
            ctx.translate(x + bgW, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(bgImgRef.current, 0, 0, bgW, bgH);
            ctx.restore();
          }
        }
      } else {
        // Fallback solid color
        ctx.fillStyle = "#050B18";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Screen Shake
      ctx.save();
      if (shakeRef.current > 0) {
        const sx = (Math.random() - 0.5) * shakeRef.current * 10;
        const sy = (Math.random() - 0.5) * shakeRef.current * 10;
        ctx.translate(sx, sy);
        shakeRef.current = Math.max(0, shakeRef.current - dt * 4);
      }

      // 2. Floating Multi-layered Celestial Clouds (3 Distinct Styles)
      for (const c of cloudsRef.current as any[]) {
        c.x -= c.speed * dt * 70;
        const bob = Math.sin(currentTime * 0.0012 * c.bobSpeed + c.bobOffset) * 8;
        c.y = c.baseY + bob;

        const img = c.type === 1 ? cloud1ImgRef.current : c.type === 2 ? cloud2ImgRef.current : cloud3ImgRef.current;
        const baseW = c.type === 3 ? 340 : c.type === 1 ? 240 : 200;
        const baseH = c.type === 3 ? 110 : c.type === 1 ? 135 : 120;
        const width = baseW * c.scale;
        const height = baseH * c.scale;

        if (c.x + width < -60) {
          c.x = canvas.width + Math.random() * 100 + 40;
          c.baseY = Math.random() * (canvas.height - 140) + 30;
        }

        if (img && img.complete) {
          ctx.save();
          ctx.globalAlpha = c.alpha;
          ctx.drawImage(img, c.x, c.y, width, height);
          ctx.restore();
        }
      }

      // 3. Update & Render Dragon Gates (Fluid Physics Simulation)
      if (isPlayingRef.current) {
        const GRAVITY = 720; // Smooth graceful gravity in px/s^2
        dragonRef.current.vy += GRAVITY * dt;
        dragonRef.current.vy = Math.min(dragonRef.current.vy, 380); // Terminal velocity
        dragonRef.current.y += dragonRef.current.vy * dt;

        // Smooth angle rotation
        const targetAngle = Math.min(Math.PI / 4.5, Math.max(-Math.PI / 5, dragonRef.current.vy * 0.0018));
        dragonRef.current.angle += (targetAngle - dragonRef.current.angle) * Math.min(1, 12 * dt);

        if (dragonRef.current.invincibleTimer > 0) {
          dragonRef.current.invincibleTimer -= dt;
        }

        // Boundary collision check
        if (dragonRef.current.y <= dragonRef.current.radius + 10) {
          dragonRef.current.y = dragonRef.current.radius + 10;
          dragonRef.current.vy = 0;
        }
        if (dragonRef.current.y >= canvas.height - 40 - dragonRef.current.radius) {
          sound.playShieldBreak();
          shakeRef.current = 1.0;
          setIsPlaying(false);
          isPlayingRef.current = false;
          setIsGameOver(true);
        }

        // Gate Movement & Collision
        const gateSpeed = 135; // px/s steady fluid movement
        for (let i = gatesRef.current.length - 1; i >= 0; i--) {
          const g = gatesRef.current[i];
          g.x -= gateSpeed * dt;

          const dragonX = dragonRef.current.x;
          const dragonY = dragonRef.current.y;
          const dragonR = 14; // Hitbox radius (forgiving)

          const topGateBottomY = g.gapY - g.gapHeight / 2;
          const bottomGateTopY = g.gapY + g.gapHeight / 2;
          const isHorizontallyInPillar = dragonX + dragonR >= g.x && dragonX - dragonR <= g.x + g.width;

          if (isHorizontallyInPillar) {
            // Check if hitting the solid top pillar or solid bottom pillar
            const hittingTopPillar = dragonY - dragonR <= topGateBottomY;
            const hittingBottomPillar = dragonY + dragonR >= bottomGateTopY;

            if (hittingTopPillar || hittingBottomPillar) {
              // INSTANT DEATH ON PILLAR COLLISION!
              sound.playShieldBreak();
              shakeRef.current = 1.4;
              setCombo(0);

              // Crash explosion particles
              for (let p = 0; p < 25; p++) {
                particlesRef.current.push({
                  x: g.x + g.width / 2,
                  y: hittingTopPillar ? topGateBottomY : bottomGateTopY,
                  vx: (Math.random() - 0.5) * 160,
                  vy: (Math.random() - 0.5) * 160,
                  color: Math.random() > 0.5 ? "#EF4444" : "#F59E0B",
                  size: Math.random() * 5 + 2,
                  alpha: 1.0,
                  decay: 0.03,
                });
              }

              setIsPlaying(false);
              isPlayingRef.current = false;
              setIsGameOver(true);
              break;
            } else if (!g.passed) {
              // IMMEDIATELY SCORE ON TOUCHING THE GATE!
              g.passed = true;
              setGatesPassed((gp) => gp + 1);

              const inTopPortal = dragonY < g.gapY;
              const chosenOption = inTopPortal ? g.topChoice : g.bottomChoice;

              if (chosenOption && chosenOption.isCorrect) {
                sound.playDragonGate();
                speakChinese(chosenOption.word.chinese);
                const currentComboVal = comboRef.current;
                const points = 100 * (currentComboVal + 1);
                setScore((s) => s + points);
                setCombo((c) => {
                  const next = c + 1;
                  if (next > maxComboRef.current) setMaxCombo(next);
                  return next;
                });
                addExpAndGems(20, 2);

                floatingTextsRef.current.push({
                  x: dragonX + 35,
                  y: dragonY - 20,
                  text: `+${points} 正确!`,
                  color: "#4DFED2",
                  alpha: 1.0,
                  vy: -1.5,
                });

                for (let p = 0; p < 25; p++) {
                  particlesRef.current.push({
                    x: dragonX,
                    y: dragonY,
                    vx: (Math.random() - 0.5) * 160,
                    vy: (Math.random() - 0.5) * 160,
                    color: Math.random() > 0.5 ? "#4DFED2" : "#FBBF24",
                    size: Math.random() * 4 + 2,
                    alpha: 1.0,
                    decay: 0.03,
                  });
                }

                // Check if all words have been completed!
                const isAllDone =
                  currentWordIdxRef.current >= wordQueueRef.current.length &&
                  gatesRef.current.every((gate) => gate.passed);

                if (isAllDone) {
                  sound.playLevelUp();
                  speakChinese("太棒了，恭喜通关");
                  setScore((s) => s + 500);
                  addExpAndGems(50, 5);

                  for (let p = 0; p < 70; p++) {
                    particlesRef.current.push({
                      x: dragonX + (Math.random() - 0.5) * 80,
                      y: dragonY + (Math.random() - 0.5) * 80,
                      vx: (Math.random() - 0.5) * 240,
                      vy: (Math.random() - 0.5) * 240 - 50,
                      color: ["#FBBF24", "#F59E0B", "#EF4444", "#38BDF8", "#4ADE80", "#EC4899"][Math.floor(Math.random() * 6)],
                      size: Math.random() * 6 + 3,
                      alpha: 1.0,
                      decay: 0.015,
                    });
                  }

                  floatingTextsRef.current.push({
                    x: dragonX + 20,
                    y: dragonY - 30,
                    text: "🏆 ĐẠI THẮNG TOÀN BỘ TỪ VỰNG! +500",
                    color: "#FBBF24",
                    alpha: 1.0,
                    vy: -1.5,
                  });

                  setTimeout(() => {
                    setIsPlaying(false);
                    isPlayingRef.current = false;
                    setIsVictory(true);
                  }, 800);
                }
              } else {
                // WRONG PORTAL: DEDUCT 1 LIFE (3 LIVES TOTAL)!
                sound.playShieldBreak();
                shakeRef.current = 0.8;
                setCombo(0);

                floatingTextsRef.current.push({
                  x: dragonX + 35,
                  y: dragonY - 20,
                  text: "-1 SAI!",
                  color: "#FF2255",
                  alpha: 1.0,
                  vy: -1.5,
                });

                for (let p = 0; p < 20; p++) {
                  particlesRef.current.push({
                    x: dragonX,
                    y: dragonY,
                    vx: (Math.random() - 0.5) * 140,
                    vy: (Math.random() - 0.5) * 140,
                    color: "#EF4444",
                    size: Math.random() * 4 + 2,
                    alpha: 1.0,
                    decay: 0.035,
                  });
                }

                setLives((l) => {
                  const next = l - 1;
                  if (next <= 0) {
                    setIsPlaying(false);
                    isPlayingRef.current = false;
                    setIsGameOver(true);
                  } else {
                    // Check if all gates are passed even with an error
                    const isAllDone =
                      currentWordIdxRef.current >= wordQueueRef.current.length &&
                      gatesRef.current.every((gate) => gate.passed);
                    if (isAllDone) {
                      setTimeout(() => {
                        setIsPlaying(false);
                        isPlayingRef.current = false;
                        setIsVictory(true);
                      }, 800);
                    }
                  }
                  return next;
                });
              }
            }
          }

          if (g.x + g.width < -60) {
            gatesRef.current.splice(i, 1);
            if (currentWordIdxRef.current < wordQueueRef.current.length) {
              spawnGate(canvas.width + 120);
            }
          }
        }
      }

      // Dynamically track the active question prompt to only trigger React render ONCE when prompt actually changes
      const nextUpcomingGate = gatesRef.current.find((g) => !g.passed && g.x + g.width > dragonRef.current.x - 30);
      if (nextUpcomingGate && nextUpcomingGate.questionPrompt && nextUpcomingGate.questionPrompt !== currentPromptRef.current) {
        currentPromptRef.current = nextUpcomingGate.questionPrompt;
        setCurrentPrompt(nextUpcomingGate.questionPrompt);
      }

      // 4. Draw Photorealistic Jade Celestial Pillars & Glowing Word Portals
      const pillarImg = pillarImgRef.current;

      for (const g of gatesRef.current) {
        const topGateBottomY = g.gapY - g.gapHeight / 2;
        const bottomGateTopY = g.gapY + g.gapHeight / 2;

        if (pillarImg && pillarImg.complete) {
          // Top Pillar (Flipped upside down)
          ctx.save();
          ctx.translate(g.x + g.width / 2, topGateBottomY);
          ctx.scale(1, -1);
          ctx.drawImage(pillarImg, -g.width / 2, 0, g.width, Math.max(topGateBottomY + 120, 240));
          ctx.restore();

          // Bottom Pillar
          ctx.save();
          ctx.translate(g.x + g.width / 2, bottomGateTopY);
          ctx.drawImage(pillarImg, -g.width / 2, 0, g.width, Math.max(canvas.height - bottomGateTopY + 120, 240));
          ctx.restore();
        } else {
          // Fallback
          ctx.fillStyle = "#0F172A";
          ctx.strokeStyle = "#059669";
          ctx.lineWidth = 3;
          ctx.fillRect(g.x, 0, g.width, topGateBottomY);
          ctx.strokeRect(g.x, 0, g.width, topGateBottomY);
          ctx.fillRect(g.x, bottomGateTopY, g.width, canvas.height - bottomGateTopY);
          ctx.strokeRect(g.x, bottomGateTopY, g.width, canvas.height - bottomGateTopY);
        }

        // Soft minimalist dividing guide in the center of the gap
        ctx.save();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        ctx.moveTo(g.x - 10, g.gapY);
        ctx.lineTo(g.x + g.width + 10, g.gapY);
        ctx.stroke();
        ctx.restore();

        const plaqueW = 154;
        const plaqueH = 110;

        // Clean Modern Minimalist Porcelain Portal Card (Zero GPU blur overhead)
        const drawCleanPortalCard = (
          centerX: number,
          centerY: number,
          word: DragonWord
        ) => {
          const halfW = plaqueW / 2;
          const halfH = plaqueH / 2;
          const px = centerX - halfW;
          const py = centerY - halfH;

          ctx.save();

          // 1. Crisp porcelain background & Crimson Red border
          ctx.fillStyle = "rgba(255, 255, 255, 0.96)";
          ctx.strokeStyle = "rgba(220, 38, 38, 0.9)";
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.roundRect(px, py, plaqueW, plaqueH, 16);
          ctx.fill();
          ctx.stroke();

          // 2. Crisp Bold Dark Slate Hanzi
          const textCenterY = centerY - (showPinyinRef.current ? 12 : 0);
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.font = "bold 32px 'DFKaiW5GB5-HPinIn1WLD', KaiTi, 'Noto Serif SC', 'Noto Sans SC', 'Microsoft YaHei', sans-serif";
          ctx.fillStyle = "#0F172A";
          ctx.fillText(word.chinese, centerX, textCenterY);

          // 3. Clean Crimson Red Pinyin
          if (showPinyinRef.current) {
            const pinyinY = centerY + 24;
            ctx.font = "bold 15px 'Courier New', monospace";
            ctx.fillStyle = "#DC2626";
            ctx.fillText(word.pinyin, centerX, pinyinY);
          }

          ctx.restore();
        };

        // Draw Top Portal Card
        if (g.topChoice) {
          const topOrbY = topGateBottomY + g.gapHeight / 4;
          drawCleanPortalCard(g.x + g.width / 2, topOrbY, g.topChoice.word);
        }

        // Draw Bottom Portal Card
        if (g.bottomChoice) {
          const bottomOrbY = bottomGateTopY - g.gapHeight / 4;
          drawCleanPortalCard(g.x + g.width / 2, bottomOrbY, g.bottomChoice.word);
        }
      }

      // 5. Draw Photorealistic Bao Bao Panda Cloud Rider Sprite
      const dragon = dragonRef.current;
      ctx.save();
      ctx.translate(dragon.x, dragon.y);
      ctx.rotate(dragon.angle);

      // Invincibility Blink
      if (dragon.invincibleTimer <= 0 || Math.floor(currentTime / 80) % 2 === 0) {
        const pandaImg = pandaImgRef.current;
        if (pandaImg && pandaImg.complete) {
          const pSize = 82;
          ctx.drawImage(pandaImg, -pSize / 2, -pSize / 2, pSize, pSize);
        } else {
          // Fallback vector panda
          ctx.fillStyle = "#F59E0B";
          ctx.beginPath();
          ctx.arc(0, 0, dragon.radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();

      // 6. Draw Sparks & Particle Fire
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.alpha -= p.decay * 60 * dt;

        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;

        if (p.alpha <= 0) particlesRef.current.splice(i, 1);
      }

      // 7. Draw Floating Points & Text
      for (let i = floatingTextsRef.current.length - 1; i >= 0; i--) {
        const ft = floatingTextsRef.current[i];
        ft.y += ft.vy * 60 * dt;
        ft.alpha -= 0.025 * 60 * dt;

        ctx.font = "bold 18px 'Noto Serif SC', sans-serif";
        ctx.fillStyle = ft.color;
        ctx.globalAlpha = Math.max(0, ft.alpha);
        ctx.textAlign = "left";
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.globalAlpha = 1.0;

        if (ft.alpha <= 0) floatingTextsRef.current.splice(i, 1);
      }

      ctx.restore(); // Restore Shake
    };

    animFrameIdRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, []);

  // Spacebar and Click listener for Flapping / Starting
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Spacebar" || e.key === "ArrowUp" || e.key === "Enter") {
        e.preventDefault();
        if (!isPlayingRef.current) {
          startGame();
        } else {
          handleFlap();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div ref={containerRef} className="w-full flex flex-col items-center justify-center select-none py-2 scroll-mt-4">
      {/* Outer Oriental Arcade Cabinet (Clean White & Red Theme) */}
      <div
        className="relative flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl mx-auto isolate"
        style={{ width: "100%", maxWidth: "600px" }}
      >
        {/* Top Game HUD (Solid Integrated Header - Không bị lộ nền tối) */}
        <div className="relative z-20 flex items-center justify-between px-3.5 py-2.5 sm:px-4 sm:py-3 bg-white border-b border-slate-200 text-xs font-bold text-slate-700">
          {/* Left Wing: Progress Badge & 3 Lives */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="inline-flex items-center rounded-xl border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-black text-red-700 shadow-2xs">
              ẢI {Math.min(gatesPassed + 1, totalLessonWordsRef.current || activeWords.length)} / {totalLessonWordsRef.current || activeWords.length}
            </span>

            <div className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-1 shadow-2xs">
              {[...Array(3)].map((_, idx) => (
                <Heart
                  key={idx}
                  size={13}
                  className={idx < lives ? "fill-rose-500 text-rose-500" : "fill-slate-200 text-slate-300"}
                />
              ))}
            </div>

            {/* Pinyin Toggle Pill */}
            <button
              type="button"
              onClick={() => {
                sound.playWoodblock();
                setShowPinyin((p) => !p);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-700 transition-all hover:bg-slate-100 hover:border-slate-300 active:scale-95 cursor-pointer shadow-2xs"
              title="Bật/Tắt hiển thị phiên âm Pinyin"
            >
              <span className="text-slate-500 text-[11px]">PINYIN</span>
              <span className={`text-[11px] font-black ${showPinyin ? "text-red-600" : "text-slate-400"}`}>
                {showPinyin ? "BẬT" : "TẮT"}
              </span>
            </button>

            {/* Mute Button */}
            <button
              type="button"
              onClick={() => {
                const nextMuted = sound.toggleMute();
                setIsMuted(nextMuted);
              }}
              className="flex h-7 w-7 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-95 cursor-pointer shadow-2xs"
              title={isMuted ? "Bật âm thanh" : "Tắt âm thanh (Mute)"}
            >
              {isMuted ? <VolumeX size={13} className="text-slate-400" /> : <Volume2 size={13} className="text-red-600" />}
            </button>
          </div>

          {/* Center: Score Capsule */}
          <div className="flex items-center justify-center rounded-xl border border-slate-900/10 bg-slate-900 px-3.5 py-0.5 shadow-inner">
            <span className="font-mono text-sm sm:text-base font-black tracking-wider text-amber-400">
              {score.toString().padStart(5, "0")}
            </span>
          </div>

          {/* Right Wing: Combo Multiplier */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="inline-flex items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700 shadow-2xs">
              <span className="text-[10px] text-emerald-600 font-bold uppercase">COMBO</span>
              <span>x{combo + 1}</span>
            </div>
          </div>
        </div>

        {/* Canvas Viewport Container */}
        <div className={`relative w-full overflow-hidden ${isPlaying ? "bg-slate-100 rounded-b-3xl" : "bg-white rounded-b-3xl"}`}>
          {/* Top Floating Target Banner (Prompt to fly into) */}
          {isPlaying && (
            <div className="absolute left-0 right-0 top-4 z-20 flex justify-center pointer-events-none px-4">
              <div className="rounded-2xl border-2 border-red-500 bg-white/95 py-2 px-5 shadow-lg backdrop-blur-md text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 block">
                  Nhiệm vụ: Bay vào từ có nghĩa
                </span>
                <span className="text-base sm:text-lg font-bold text-slate-900">
                  "{currentPrompt}"
                </span>
              </div>
            </div>
          )}

          {/* 60FPS / 120FPS HTML5 Canvas */}
          <canvas
            ref={canvasRef}
            width={600}
            height={780}
            onPointerDown={(e) => {
              e.preventDefault();
              if (isPlayingRef.current) {
                handleFlap();
              }
            }}
            className={`h-[560px] sm:h-[680px] max-h-[74vh] w-full cursor-pointer bg-slate-100 touch-none select-none rounded-b-3xl ${isPlaying ? "block" : "hidden"}`}
          />

        {/* Start Overlay (Mission Control - Clean Light Theme) */}
        {!isPlaying && !isGameOver && !isVictory && (
          <div className="relative z-30 flex flex-col items-center justify-center bg-white p-5 sm:p-7 text-center min-h-[560px] sm:min-h-[680px] rounded-b-3xl">
            {/* Header Emblem & Title */}
            <div className="space-y-1 mb-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3.5 py-1 text-xs font-semibold text-red-700 mb-1">
                <Sparkles size={13} className="text-red-600" />
                <span>Panda Cloud Rider</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                Bao Bao Vượt Ải
              </h1>
              <p className="text-xs text-slate-500">
                Cưỡi Cân Đẩu Vân lướt mây bay xuyên qua cổng chữ Hán đúng nghĩa
              </p>
            </div>

            {/* Mission Configuration Panel */}
            <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left text-xs text-slate-700 shadow-sm space-y-3.5 relative z-20">
              {/* 1. Chọn Loại HSK */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                  <Sparkles size={12} className="text-red-600" />
                  <span>1. Bộ tiêu chuẩn:</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      sound.playWoodblock();
                      setSelectedStandard("HSK20");
                    }}
                    className={`rounded-xl py-2 px-2 text-center text-xs font-bold border transition-all cursor-pointer ${
                      selectedStandard === "HSK20"
                        ? "border-red-600 bg-red-600 text-white shadow-sm"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    HSK 2.0
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sound.playWoodblock();
                      setSelectedStandard("HSK30");
                    }}
                    className={`rounded-xl py-2 px-2 text-center text-xs font-bold border transition-all cursor-pointer ${
                      selectedStandard === "HSK30"
                        ? "border-red-600 bg-red-600 text-white shadow-sm"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    HSK 3.0
                  </button>
                </div>
              </div>

              {/* 2. Chọn Cấp Độ HSK */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5 flex items-center gap-1.5">
                  <Target size={12} className="text-red-600" />
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
                      className={`rounded-lg py-1.5 px-1 text-center text-[11px] font-bold border transition-all cursor-pointer ${
                        selectedLevel === lvl
                          ? "border-red-600 bg-red-600 text-white shadow-sm"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Custom Chọn Chủ Đề Bài Học Dropdown */}
              <div ref={dropdownRef} className="relative z-30">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5 flex items-center gap-1.5">
                  <BookOpen size={12} className="text-red-600" />
                  <span>3. Chủ Đề Bài Học:</span>
                </label>

                <button
                  type="button"
                  onClick={() => {
                    sound.playWoodblock();
                    setIsDropdownOpen((prev) => !prev);
                  }}
                  className={`w-full flex items-center justify-between rounded-xl border px-3 py-2 text-xs font-bold transition-all cursor-pointer shadow-sm ${
                    isDropdownOpen
                      ? "border-red-500 bg-red-50/30 ring-2 ring-red-500/20 text-slate-900"
                      : "border-slate-200 bg-white text-slate-800 hover:border-red-400 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <BookOpen size={13} className="text-red-600 shrink-0" />
                    <span className="truncate">
                      {selectedTopicId === "ALL"
                        ? `Toàn bộ chủ đề ${selectedLevel} (${activeWords.length} từ vựng)`
                        : availableTopics.find((t) => t.id === selectedTopicId)?.title
                        ? `${availableTopics.find((t) => t.id === selectedTopicId)?.title} (${activeWords.length} từ)`
                        : selectedTopicId}
                    </span>
                  </div>
                  <ChevronDown
                    size={14}
                    className={`text-slate-400 transition-transform duration-200 shrink-0 ${
                      isDropdownOpen ? "rotate-180 text-red-600" : ""
                    }`}
                  />
                </button>

                {/* Dropdown Menu Popover */}
                {isDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 z-50 max-h-48 overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-md p-1.5 shadow-2xl animate-fadeIn divide-y divide-slate-100">
                    <div className="pb-1">
                      {/* Option: ALL */}
                      <button
                        type="button"
                        onClick={() => {
                          sound.playWoodblock();
                          setSelectedTopicId("ALL");
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between rounded-xl px-2.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                          selectedTopicId === "ALL"
                            ? "bg-red-50 text-red-700 font-bold"
                            : "text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-600" />
                          <span>Toàn bộ chủ đề {selectedLevel} ({activeWords.length} từ)</span>
                        </div>
                        {selectedTopicId === "ALL" && (
                          <Check size={14} className="text-red-600" />
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
                            className={`w-full flex items-center justify-between rounded-xl px-2.5 py-1.5 text-xs font-medium transition cursor-pointer ${
                              isSelected
                                ? "bg-red-50 text-red-700 font-bold"
                                : "text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            <span className="truncate text-left">{t.title}</span>
                            {isSelected && <Check size={14} className="text-red-600 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Hướng dẫn & Tùy chọn */}
              <div className="pt-2 border-t border-slate-200 space-y-2">
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Bấm <span className="text-red-600 font-bold">[SPACE]</span> hoặc <span className="text-red-600 font-bold">[Click chuột]</span> để Bao Bao lướt mây bay lên xuyên qua cổng chữ đúng!
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-medium">Hiển thị Pinyin:</span>
                  <button
                    type="button"
                    onClick={() => {
                      sound.playWoodblock();
                      setShowPinyin((prev) => !prev);
                    }}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                      showPinyin ? "bg-red-600" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                        showPinyin ? "translate-x-4.5" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Launch Game Button */}
            <button
              type="button"
              onClick={startGame}
              className="mt-4 flex items-center gap-2 rounded-2xl bg-red-600 text-white px-8 py-3 text-sm font-bold shadow-[0_4px_0_#991B1B] hover:bg-red-700 active:translate-y-[2px] active:shadow-[0_2px_0_#991B1B] transition-all cursor-pointer relative z-20"
            >
              <Play size={16} className="fill-current" />
              <span>BẮT ĐẦU VƯỢT ẢI</span>
            </button>
          </div>
        )}

        {/* Game Over Modal */}
        {isGameOver && (
          <div className="relative z-30 flex flex-col items-center justify-center bg-white p-8 text-center space-y-5 animate-fadeIn min-h-[560px] sm:min-h-[680px] rounded-b-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-1 text-xs font-bold text-red-700">
              <Trophy size={14} className="text-red-600" />
              <span>KẾT THÚC CHẶNG BAY</span>
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                Bao Bao Cần Nghỉ Ngơi!
              </h2>
              <p className="text-xs text-slate-500">
                Bạn đã va vào chướng ngại vật hoặc chọn nhầm cổng từ vựng
              </p>
            </div>

            <div className="w-full max-w-xs space-y-2.5 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left text-xs shadow-sm">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-medium">Tổng điểm:</span>
                <span className="font-bold text-red-600 text-base">{score}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-medium">Số cổng đã vượt:</span>
                <span className="font-bold text-emerald-600 text-base">{gatesPassed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Combo cao nhất:</span>
                <span className="font-bold text-sky-600 text-base">x{maxCombo + 1}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                startGame();
              }}
              className="flex items-center gap-2 rounded-xl bg-red-600 text-white px-8 py-3.5 text-sm font-bold shadow-[0_4px_0_#991B1B] hover:bg-red-700 active:translate-y-[2px] active:shadow-[0_2px_0_#991B1B] transition-all cursor-pointer"
            >
              <RotateCcw size={15} />
              <span>CHƠI LẠI</span>
            </button>

            <p className="text-[11px] text-slate-400">
              Nhấn <span className="text-red-600 font-bold">[SPACE]</span> hoặc <span className="text-red-600 font-bold">[CLICK]</span> để chơi lại ngay
            </p>
          </div>
        )}

        {/* Grand Victory Completion Modal (Nam Thiên Môn Hoàn Thành) */}
        {isVictory && (
          <div className="relative z-30 flex flex-col items-center justify-center bg-white p-6 sm:p-8 text-center space-y-4 animate-fadeIn min-h-[560px] sm:min-h-[680px] rounded-b-3xl">
            {/* Victory Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-xs font-black text-amber-800 shadow-sm">
              <Trophy size={16} className="text-amber-500" />
              <span>ĐẠI THẮNG QUANG VINH</span>
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                Chúc Mừng Vượt Ải Thành Công!
              </h2>
              <p className="text-xs text-slate-600 max-w-xs mx-auto">
                Bao Bao đã xuất sắc chinh phục toàn bộ {totalLessonWordsRef.current} từ vựng!
              </p>
            </div>

            {/* Score & Achievements Card */}
            <div className="w-full max-w-xs space-y-2.5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700 shadow-2xs">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-medium">Tổng điểm tích lũy:</span>
                <span className="font-mono font-black text-red-600 text-lg">{score}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-medium">Từ vựng đã nắm vững:</span>
                <span className="font-bold text-emerald-600 text-base">{gatesPassed} / {totalLessonWordsRef.current} từ</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-medium">Chuỗi Combo tối đa:</span>
                <span className="font-bold text-sky-600 text-base">x{maxCombo + 1}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Phần thưởng vượt ải:</span>
                <span className="font-bold text-amber-600 text-sm">+50 EXP · +5 Ngọc</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 w-full max-w-xs pt-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  startGame();
                }}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-600 text-white px-5 py-3 text-xs font-bold shadow-[0_4px_0_#991B1B] hover:bg-red-700 active:translate-y-[2px] active:shadow-[0_2px_0_#991B1B] transition-all cursor-pointer"
              >
                <RotateCcw size={14} />
                <span>CHƠI LẠI</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsVictory(false);
                  setIsPlaying(false);
                  setIsGameOver(false);
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
              >
                ĐỔI CHỦ ĐỀ
              </button>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
