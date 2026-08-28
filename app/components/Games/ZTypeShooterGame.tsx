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
  Zap,
  ChevronDown,
  Check,
} from "lucide-react";

export type ZTypeWord = {
  chinese: string;
  pinyin: string;
  cleanPinyin?: string;
  meaningVi: string;
  level?: string;
  lessonId?: string;
  lessonTitle?: string;
  source?: string;
};

export type ZTypeLesson = {
  id: string;
  title: string;
  level: string;
  source: string;
};

interface Enemy {
  id: string;
  x: number;
  y: number;
  speed: number;
  word: ZTypeWord & { cleanPinyin: string };
  typedIndex: number;
  type:
    | "scout"
    | "frigate"
    | "drone"
    | "interceptor"
    | "destroyer"
    | "stealth"
    | "mothership"
    | "vortex";
  size: number;
  color: string;
  hitFlash: number;
}

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetId: string;
  color: string;
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

interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  alpha: number;
  lineWidth: number;
}

interface FloatingScore {
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

const defaultFallbackWords: (ZTypeWord & { cleanPinyin: string })[] = [
  { chinese: "你好", pinyin: "nǐhǎo", cleanPinyin: "nihao", meaningVi: "Xin chào", level: "HSK1", source: "HSK20" },
  { chinese: "再见", pinyin: "zàijiàn", cleanPinyin: "zaijian", meaningVi: "Tạm biệt", level: "HSK1", source: "HSK20" },
  { chinese: "谢谢", pinyin: "xièxiè", cleanPinyin: "xiexie", meaningVi: "Cảm ơn", level: "HSK1", source: "HSK20" },
  { chinese: "中国", pinyin: "zhōngguó", cleanPinyin: "zhongguo", meaningVi: "Trung Quốc", level: "HSK1", source: "HSK20" },
  { chinese: "北京", pinyin: "běijīng", cleanPinyin: "beijing", meaningVi: "Bắc Kinh", level: "HSK1", source: "HSK20" },
  { chinese: "学习", pinyin: "xuéxí", cleanPinyin: "xuexi", meaningVi: "Học tập", level: "HSK1", source: "HSK20" },
  { chinese: "老师", pinyin: "lǎoshī", cleanPinyin: "laoshi", meaningVi: "Thầy cô", level: "HSK1", source: "HSK20" },
  { chinese: "学生", pinyin: "xuéshēng", cleanPinyin: "xuesheng", meaningVi: "Học sinh", level: "HSK1", source: "HSK20" },
  { chinese: "朋友", pinyin: "péngyǒu", cleanPinyin: "pengyou", meaningVi: "Bạn bè", level: "HSK1", source: "HSK20" },
  { chinese: "苹果", pinyin: "píngguǒ", cleanPinyin: "pingguo", meaningVi: "Quả táo", level: "HSK1", source: "HSK20" },
  { chinese: "喝水", pinyin: "hēshuǐ", cleanPinyin: "heshui", meaningVi: "Uống nước", level: "HSK1", source: "HSK20" },
  { chinese: "吃饭", pinyin: "chīfàn", cleanPinyin: "chifan", meaningVi: "Ăn cơm", level: "HSK1", source: "HSK20" },
  { chinese: "喜欢", pinyin: "xǐhuan", cleanPinyin: "xihuan", meaningVi: "Yêu thích", level: "HSK1", source: "HSK20" },
  { chinese: "高兴", pinyin: "gāoxìng", cleanPinyin: "gaoxing", meaningVi: "Vui vẻ", level: "HSK1", source: "HSK20" },
];

export function ZTypeShooterGame({
  words = [],
  lessons = [],
  onComplete,
}: {
  words?: ZTypeWord[];
  lessons?: ZTypeLesson[];
  onComplete?: () => void;
}) {
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [wave, setWave] = useState(1);
  const [multiplier, setMultiplier] = useState(1);
  const [maxMultiplier, setMaxMultiplier] = useState(1);
  const [bombs, setBombs] = useState(3);
  const [destroyedCount, setDestroyedCount] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [showPinyin, setShowPinyin] = useState(true);
  const [isMuted, setIsMuted] = useState(() => sound.getMuted());

  // 60FPS Game Physics Refs
  const enemiesRef = useRef<Enemy[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const shockwavesRef = useRef<Shockwave[]>([]);
  const scoresRef = useRef<FloatingScore[]>([]);
  const targetIdRef = useRef<string | null>(null);
  const shipAngleRef = useRef<number>(-Math.PI / 2);
  const targetAngleRef = useRef<number>(-Math.PI / 2);
  // Container ref for viewport auto-centering
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    containerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  useEffect(() => {
    if (isPlaying) {
      containerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [isPlaying]);

  const showPinyinRef = useRef(true);

  useEffect(() => {
    showPinyinRef.current = showPinyin;
  }, [showPinyin]);

  const starsRef = useRef<{ x: number; y: number; speed: number; size: number; alpha: number }[]>([]);
  const thrusterParticlesRef = useRef<{ x: number; y: number; vx: number; vy: number; alpha: number; size: number }[]>([]);

  const totalShotsRef = useRef(0);
  const hitsRef = useRef(0);
  const isPlayingRef = useRef(false);
  const animFrameIdRef = useRef<number | null>(null);
  const shipImgRef = useRef<HTMLCanvasElement | HTMLImageElement | null>(null);
  const scoutImgRef = useRef<HTMLImageElement | null>(null);
  const frigateImgRef = useRef<HTMLImageElement | null>(null);
  const droneImgRef = useRef<HTMLImageElement | null>(null);
  const interceptorImgRef = useRef<HTMLImageElement | null>(null);
  const destroyerImgRef = useRef<HTMLImageElement | null>(null);
  const stealthImgRef = useRef<HTMLImageElement | null>(null);
  const mothershipImgRef = useRef<HTMLImageElement | null>(null);
  const vortexImgRef = useRef<HTMLImageElement | null>(null);

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

  const [topicWords, setTopicWords] = useState<ZTypeWord[]>([]);
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
        console.error("Failed to load topic words in ZType:", err);
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
  const activeWords: (ZTypeWord & { cleanPinyin: string })[] = useMemo(() => {
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

  // Load All Spaceship Sprites (Transparent PNGs)
  useEffect(() => {
    const playerImg = new Image();
    playerImg.src = r2Asset("/game/player_ship.png");
    playerImg.onload = () => {
      shipImgRef.current = playerImg;
    };

    const scoutImg = new Image();
    scoutImg.src = r2Asset("/game/enemy_scout.png");
    scoutImg.onload = () => {
      scoutImgRef.current = scoutImg;
    };

    const frigateImg = new Image();
    frigateImg.src = r2Asset("/game/enemy_frigate.png");
    frigateImg.onload = () => {
      frigateImgRef.current = frigateImg;
    };

    const droneImg = new Image();
    droneImg.src = r2Asset("/game/enemy_drone.png");
    droneImg.onload = () => {
      droneImgRef.current = droneImg;
    };

    const interceptorImg = new Image();
    interceptorImg.src = r2Asset("/game/enemy_interceptor.png");
    interceptorImg.onload = () => {
      interceptorImgRef.current = interceptorImg;
    };

    const destroyerImg = new Image();
    destroyerImg.src = r2Asset("/game/enemy_destroyer.png");
    destroyerImg.onload = () => {
      destroyerImgRef.current = destroyerImg;
    };

    const stealthImg = new Image();
    stealthImg.src = r2Asset("/game/enemy_stealth.png");
    stealthImg.onload = () => {
      stealthImgRef.current = stealthImg;
    };

    const mothershipImg = new Image();
    mothershipImg.src = r2Asset("/game/enemy_mothership.png");
    mothershipImg.onload = () => {
      mothershipImgRef.current = mothershipImg;
    };

    const vortexImg = new Image();
    vortexImg.src = r2Asset("/game/enemy_vortex.png");
    vortexImg.onload = () => {
      vortexImgRef.current = vortexImg;
    };
  }, []);

  const speakChinese = (text: string) => {
    if (typeof window === "undefined") return;
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "zh-CN";
      u.rate = 1.0;
      window.speechSynthesis.speak(u);
    }
  };

  // Initialize ZType Starfield
  useEffect(() => {
    const stars = [];
    for (let i = 0; i < 140; i++) {
      stars.push({
        x: Math.random() * 600,
        y: Math.random() * 800,
        speed: Math.random() * 1.8 + 0.4,
        size: Math.random() * 1.8 + 0.5,
        alpha: Math.random() * 0.7 + 0.3,
      });
    }
    starsRef.current = stars;
  }, []);

  // Spawn Enemy from 8 Classes with Anti-Overlap Lane System
  const spawnEnemy = (canvasWidth: number) => {
    // Defined distinct flight lanes across the canvas
    const lanes = [95, 200, 305, 410, 505];

    // Find lanes that don't have any enemy near the top (vertical buffer > 160px)
    const availableLanes = lanes.filter((laneX) => {
      return !enemiesRef.current.some(
        (e) => Math.abs(e.x - laneX) < 80 && e.y < 150
      );
    });

    if (availableLanes.length === 0) return; // Don't spawn if all lanes are crowded

    // Pick random available lane
    const x = availableLanes[Math.floor(Math.random() * availableLanes.length)];
    const pool = activeWordsRef.current.length > 0 ? activeWordsRef.current : defaultFallbackWords;
    const randomWord = pool[Math.floor(Math.random() * pool.length)];
    const types: Enemy["type"][] = [
      "scout",
      "interceptor",
      "drone",
      "stealth",
      "frigate",
      "destroyer",
      "mothership",
      "vortex",
    ];
    const type = types[Math.floor(Math.random() * types.length)];

    const shipConfigs = {
      scout: { color: "#FF2255", size: 22, baseSpeed: 0.40 },
      interceptor: { color: "#10B981", size: 24, baseSpeed: 0.45 },
      drone: { color: "#F59E0B", size: 18, baseSpeed: 0.50 },
      stealth: { color: "#A855F7", size: 24, baseSpeed: 0.38 },
      frigate: { color: "#8B5CF6", size: 28, baseSpeed: 0.30 },
      destroyer: { color: "#38BDF8", size: 30, baseSpeed: 0.28 },
      mothership: { color: "#EAB308", size: 34, baseSpeed: 0.20 },
      vortex: { color: "#EF4444", size: 26, baseSpeed: 0.34 },
    };

    const cfg = shipConfigs[type];

    const newEnemy: Enemy = {
      id: Math.random().toString(36).substring(2, 9),
      x,
      y: -50,
      speed: cfg.baseSpeed + wave * 0.06,
      word: randomWord,
      typedIndex: 0,
      type,
      size: cfg.size,
      color: cfg.color,
      hitFlash: 0,
    };

    enemiesRef.current.push(newEnemy);
  };

  // Trigger ZType Explosion
  const createZTypeExplosion = (x: number, y: number, color: string, points: number = 100) => {
    // 1. Expanding Shockwave Ring
    shockwavesRef.current.push({
      x,
      y,
      radius: 4,
      maxRadius: 48,
      color,
      alpha: 1.0,
      lineWidth: 3,
    });

    // 2. High-speed Vector Spark Particles
    for (let i = 0; i < 26; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 6 + 2;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: Math.random() > 0.3 ? color : "#FFFFFF",
        size: Math.random() * 3 + 1.5,
        alpha: 1,
        decay: Math.random() * 0.04 + 0.02,
      });
    }

    // 3. Floating Score
    scoresRef.current.push({
      x,
      y: y - 10,
      text: `+${points}`,
      color: "#4DFED2",
      alpha: 1,
      vy: -1.2,
    });
  };

  // Trigger EMP Shockwave (Spacebar)
  const triggerEmp = () => {
    if (bombs <= 0 || !isPlayingRef.current) return;
    setBombs((b) => b - 1);
    sound.playExplosion();

    // Giant screen shockwave
    shockwavesRef.current.push({
      x: 300,
      y: 720,
      radius: 10,
      maxRadius: 900,
      color: "#4DFED2",
      alpha: 1,
      lineWidth: 6,
    });

    enemiesRef.current.forEach((enemy) => {
      createZTypeExplosion(enemy.x, enemy.y, enemy.color, 50 * multiplier);
      setScore((s) => s + 50 * multiplier);
      setDestroyedCount((d) => d + 1);
    });

    enemiesRef.current = [];
    targetIdRef.current = null;
  };

  // Start Game
  const startGame = () => {
    sound.playLevelUp();
    setIsPlaying(true);
    isPlayingRef.current = true;
    setIsGameOver(false);
    setScore(0);
    setWave(1);
    setMultiplier(1);
    setMaxMultiplier(1);
    setBombs(3);
    setDestroyedCount(0);
    setAccuracy(100);

    totalShotsRef.current = 0;
    hitsRef.current = 0;
    enemiesRef.current = [];
    bulletsRef.current = [];
    particlesRef.current = [];
    shockwavesRef.current = [];
    scoresRef.current = [];
    targetIdRef.current = null;

    // Spawn first wave
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        if (isPlayingRef.current) spawnEnemy(600);
      }, i * 900);
    }
  };

  // Main 60FPS Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let lastSpawn = Date.now();

    const loop = () => {
      // 1. Deep space background
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Subtle cyan horizon grid
      ctx.strokeStyle = "rgba(77, 254, 210, 0.03)";
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      // 2. Stars animation
      starsRef.current.forEach((star) => {
        star.y += star.speed;
        if (star.y > canvas.height) {
          star.y = 0;
          star.x = Math.random() * canvas.width;
        }
        ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
        ctx.fillRect(star.x, star.y, star.size, star.size);
      });

      const shipX = canvas.width / 2;
      const shipY = canvas.height - 70;

      // 3. Smooth Ship Aiming Rotation & Laser Target Line
      if (targetIdRef.current) {
        const target = enemiesRef.current.find((e) => e.id === targetIdRef.current);
        if (target) {
          targetAngleRef.current = Math.atan2(target.y - shipY, target.x - shipX);

          // Subtle Targeting Laser Sight Line
          ctx.strokeStyle = "rgba(77, 254, 210, 0.18)";
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 6]);
          ctx.beginPath();
          ctx.moveTo(shipX, shipY);
          ctx.lineTo(target.x, target.y);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      } else {
        targetAngleRef.current = -Math.PI / 2;
      }
      shipAngleRef.current += (targetAngleRef.current - shipAngleRef.current) * 0.22;

      // 4. Twin Ion Thruster Flame Particles (Exact ZType Plumes)
      if (isPlayingRef.current) {
        const thrustAngle = shipAngleRef.current + Math.PI;
        // Left thruster nozzle
        const leftNozzleX = shipX + Math.cos(shipAngleRef.current) * -8 + Math.cos(thrustAngle) * 16;
        const leftNozzleY = shipY + Math.sin(shipAngleRef.current) * -8 + Math.sin(thrustAngle) * 16;
        // Right thruster nozzle
        const rightNozzleX = shipX + Math.cos(shipAngleRef.current) * 8 + Math.cos(thrustAngle) * 16;
        const rightNozzleY = shipY + Math.sin(shipAngleRef.current) * 8 + Math.sin(thrustAngle) * 16;

        for (const pos of [{ x: leftNozzleX, y: leftNozzleY }, { x: rightNozzleX, y: rightNozzleY }]) {
          thrusterParticlesRef.current.push({
            x: pos.x + (Math.random() - 0.5) * 3,
            y: pos.y + (Math.random() - 0.5) * 3,
            vx: Math.cos(thrustAngle) * (Math.random() * 3 + 2) + (Math.random() - 0.5) * 1,
            vy: Math.sin(thrustAngle) * (Math.random() * 3 + 2) + (Math.random() - 0.5) * 1,
            alpha: 1.0,
            size: Math.random() * 2.5 + 1,
          });
        }
      }

      for (let i = thrusterParticlesRef.current.length - 1; i >= 0; i--) {
        const tp = thrusterParticlesRef.current[i];
        tp.x += tp.vx;
        tp.y += tp.vy;
        tp.alpha -= 0.07;
        ctx.fillStyle = `rgba(77, 254, 210, ${Math.max(0, tp.alpha)})`;
        ctx.fillRect(tp.x, tp.y, tp.size, tp.size);
        if (tp.alpha <= 0) thrusterParticlesRef.current.splice(i, 1);
      }

      // 5. Draw Player Ship
      ctx.save();
      ctx.translate(shipX, shipY);
      ctx.rotate(shipAngleRef.current + Math.PI / 2);

      if (shipImgRef.current) {
        // Draw Crisp High-Resolution Cyber Starfighter Sprite (No Blurry Glow)
        const shipWidth = 60;
        const shipHeight = 60;
        ctx.drawImage(
          shipImgRef.current,
          -shipWidth / 2,
          -shipHeight / 2,
          shipWidth,
          shipHeight
        );
      } else {
        // Outer Vector Wireframe Shell
        ctx.strokeStyle = "#4DFED2";
        ctx.lineWidth = 2.0;
        ctx.fillStyle = "#000000";

        ctx.beginPath();
        ctx.moveTo(0, -26);
        ctx.lineTo(4, -14);
        ctx.lineTo(7, 2);
        ctx.lineTo(19, 16);
        ctx.lineTo(12, 12);
        ctx.lineTo(8, 16);
        ctx.lineTo(4, 10);
        ctx.lineTo(0, 13);
        ctx.lineTo(-4, 10);
        ctx.lineTo(-8, 16);
        ctx.lineTo(-12, 12);
        ctx.lineTo(-19, 16);
        ctx.lineTo(-7, 2);
        ctx.lineTo(-4, -14);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Glowing Cockpit Core Canopy
        ctx.fillStyle = "#4DFED2";
        ctx.beginPath();
        ctx.moveTo(0, -18);
        ctx.lineTo(3.5, -6);
        ctx.lineTo(0, 4);
        ctx.lineTo(-3.5, -6);
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();

      if (isPlayingRef.current) {
        const now = Date.now();
        const spawnInterval = Math.max(1300, 2800 - wave * 280);

        if (now - lastSpawn > spawnInterval && enemiesRef.current.length < 8) {
          spawnEnemy(canvas.width);
          lastSpawn = now;
        }

        // 6. Update & Render Plasma Bullets
        for (let i = bulletsRef.current.length - 1; i >= 0; i--) {
          const b = bulletsRef.current[i];
          b.x += b.vx;
          b.y += b.vy;

          ctx.fillStyle = b.color;
          ctx.beginPath();
          ctx.arc(b.x, b.y, 3.5, 0, Math.PI * 2);
          ctx.fill();

          // Check target hit
          const target = enemiesRef.current.find((e) => e.id === b.targetId);
          if (target) {
            const dist = Math.hypot(b.x - target.x, b.y - target.y);
            if (dist < target.size + 8) {
              target.hitFlash = 2;
              // Small hit spark
              for (let s = 0; s < 3; s++) {
                particlesRef.current.push({
                  x: b.x,
                  y: b.y,
                  vx: (Math.random() - 0.5) * 4,
                  vy: (Math.random() - 0.5) * 4,
                  color: "#FFFFFF",
                  size: 2,
                  alpha: 1,
                  decay: 0.1,
                });
              }
              bulletsRef.current.splice(i, 1);
              continue;
            }
          }

          if (b.y < 0 || b.x < 0 || b.x > canvas.width) {
            bulletsRef.current.splice(i, 1);
          }
        }

        // 7. Anti-Collision Repulsion Physics & Update Enemies
        for (let i = 0; i < enemiesRef.current.length; i++) {
          for (let j = i + 1; j < enemiesRef.current.length; j++) {
            const e1 = enemiesRef.current[i];
            const e2 = enemiesRef.current[j];
            const dx = e1.x - e2.x;
            const dy = e1.y - e2.y;
            const dist = Math.hypot(dx, dy);

            // If two ships are closer than 110px, gently push them apart
            if (dist < 110 && dist > 0) {
              const force = (110 - dist) / 110;
              const pushX = (dx / dist) * force * 1.8;
              const pushY = (dy / dist) * force * 0.9;
              e1.x += pushX;
              e2.x -= pushX;
              e1.y += pushY;
              e2.y -= pushY;

              e1.x = Math.max(70, Math.min(canvas.width - 70, e1.x));
              e2.x = Math.max(70, Math.min(canvas.width - 70, e2.x));
            }
          }
        }

        // Depth sort: render lower ships last (in front)
        enemiesRef.current.sort((a, b) => a.y - b.y);

        for (let i = enemiesRef.current.length - 1; i >= 0; i--) {
          const e = enemiesRef.current[i];
          e.y += e.speed;

          // Check if enemy hit baseline (Game Over condition)
          if (e.y >= canvas.height - 70) {
            sound.playExplosion();
            createZTypeExplosion(e.x, e.y, "#FF2255", 0);
            isPlayingRef.current = false;
            setIsPlaying(false);
            setIsGameOver(true);
            continue;
          }

          const isTarget = targetIdRef.current === e.id;

          // Render Ship Body (Nose pointing dynamically toward player ship)
          ctx.save();
          ctx.translate(e.x, e.y);

          const angleToPlayer = Math.atan2(shipY - e.y, shipX - e.x) - Math.PI / 2;
          ctx.rotate(angleToPlayer);

          // Check which sprite to use from all 8 classes
          let enemySprite: HTMLImageElement | null = null;
          if (e.type === "scout") enemySprite = scoutImgRef.current;
          else if (e.type === "interceptor") enemySprite = interceptorImgRef.current;
          else if (e.type === "drone") enemySprite = droneImgRef.current;
          else if (e.type === "stealth") enemySprite = stealthImgRef.current;
          else if (e.type === "frigate") enemySprite = frigateImgRef.current;
          else if (e.type === "destroyer") enemySprite = destroyerImgRef.current;
          else if (e.type === "mothership") enemySprite = mothershipImgRef.current;
          else if (e.type === "vortex") enemySprite = vortexImgRef.current;

          if (enemySprite && enemySprite.complete) {
            const spriteSize = e.size * 2.0;
            ctx.drawImage(
              enemySprite,
              -spriteSize / 2,
              -spriteSize / 2,
              spriteSize,
              spriteSize
            );
          } else {
            // Draw Distinct Vector Shapes as fallback
            ctx.strokeStyle = e.color;
            ctx.lineWidth = 2;
            ctx.fillStyle = "#000000";

            if (e.type === "scout") {
              ctx.beginPath();
              ctx.moveTo(0, e.size);
              ctx.lineTo(-e.size, -e.size / 2);
              ctx.lineTo(0, -e.size / 4);
              ctx.lineTo(e.size, -e.size / 2);
              ctx.closePath();
              ctx.fill();
              ctx.stroke();
            } else if (e.type === "frigate") {
              ctx.beginPath();
              ctx.moveTo(0, e.size + 4);
              ctx.lineTo(-e.size, e.size / 3);
              ctx.lineTo(-e.size + 6, -e.size);
              ctx.lineTo(e.size - 6, -e.size);
              ctx.lineTo(e.size, e.size / 3);
              ctx.closePath();
              ctx.fill();
              ctx.stroke();
            } else {
              // Mine / Drone
              ctx.beginPath();
              ctx.moveTo(0, -e.size);
              ctx.lineTo(e.size, 0);
              ctx.lineTo(0, e.size);
              ctx.lineTo(-e.size, 0);
              ctx.closePath();
              ctx.fill();
              ctx.stroke();
            }
          }

          ctx.restore();

          // 8. Render Typography (Pinyin ON / OFF Toggleable Mode)
          const tagY = e.y + e.size + 16;
          const typedStr = e.word.cleanPinyin.substring(0, e.typedIndex);
          const nextChar = e.word.cleanPinyin.substring(e.typedIndex, e.typedIndex + 1);
          const remainStr = e.word.cleanPinyin.substring(e.typedIndex + 1);

          if (showPinyinRef.current) {
            // Mode 1: Pinyin ON (Large Bold Typing View)
            ctx.font = "bold 20px 'Courier New', Courier, monospace";
            const pinyinW = ctx.measureText(e.word.cleanPinyin).width;
            const pinyinStartX = e.x - pinyinW / 2;

            // 1. Typed Letters (Neon Cyan `#4DFED2`)
            ctx.textAlign = "left";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "#4DFED2";
            ctx.fillText(typedStr, pinyinStartX, tagY);
            const typedW = ctx.measureText(typedStr).width;

            // 2. Next Letter to Type (Amber Gold `#F59E0B` if targeted, else White)
            if (nextChar) {
              ctx.fillStyle = isTarget ? "#F59E0B" : "#FFFFFF";
              ctx.fillText(nextChar, pinyinStartX + typedW, tagY);
              const nextW = ctx.measureText(nextChar).width;

              // 3. Remaining Untyped Letters (Pure Crisp White)
              ctx.fillStyle = isTarget ? "#FFFFFF" : "rgba(255, 255, 255, 0.85)";
              ctx.fillText(remainStr, pinyinStartX + typedW + nextW, tagY);
            }

            // Subtext Line: Pure Chinese Hanzi (Large & Prominent)
            ctx.textAlign = "center";
            ctx.font = "bold 18px 'DFKaiW5GB5-HPinIn1WLD', KaiTi, 'Noto Serif SC', 'Noto Sans SC', 'Microsoft YaHei', sans-serif";
            ctx.fillStyle = isTarget ? "#F59E0B" : "#FFFFFF";
            ctx.fillText(e.word.chinese, e.x, tagY + 20);
          } else {
            // Mode 2: Pinyin OFF (Pure Chinese Hanzi Only - No Dots)
            // Big Bold Chinese Character (22px)
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.font = "bold 22px 'DFKaiW5GB5-HPinIn1WLD', KaiTi, 'Noto Serif SC', 'Noto Sans SC', 'Microsoft YaHei', sans-serif";
            ctx.fillStyle = isTarget ? "#4DFED2" : "#FFFFFF";
            ctx.fillText(e.word.chinese, e.x, tagY);
          }
        }

        // 9. Render Expanding Shockwaves
        for (let i = shockwavesRef.current.length - 1; i >= 0; i--) {
          const sw = shockwavesRef.current[i];
          sw.radius += 3.5;
          sw.alpha -= 0.045;

          ctx.strokeStyle = sw.color;
          ctx.globalAlpha = Math.max(0, sw.alpha);
          ctx.lineWidth = sw.lineWidth;
          ctx.beginPath();
          ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 1.0;

          if (sw.alpha <= 0) shockwavesRef.current.splice(i, 1);
        }

        // 10. Render Sparks & Particles
        for (let i = particlesRef.current.length - 1; i >= 0; i--) {
          const p = particlesRef.current[i];
          p.x += p.vx;
          p.y += p.vy;
          p.alpha -= p.decay;

          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.fillRect(p.x, p.y, p.size, p.size);
          ctx.globalAlpha = 1.0;

          if (p.alpha <= 0) particlesRef.current.splice(i, 1);
        }

        // 11. Render Floating Scores
        for (let i = scoresRef.current.length - 1; i >= 0; i--) {
          const s = scoresRef.current[i];
          s.y += s.vy;
          s.alpha -= 0.03;

          ctx.font = "bold 14px 'Courier New', monospace";
          ctx.fillStyle = `rgba(77, 254, 210, ${s.alpha})`;
          ctx.textAlign = "center";
          ctx.fillText(s.text, s.x, s.y);

          if (s.alpha <= 0) scoresRef.current.splice(i, 1);
        }
      }

      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [wave]);

  // Handle Keyboard Typing (Exact ZType Keypress Handling)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlayingRef.current) return;

      // Spacebar for EMP Bomb
      if (e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        triggerEmp();
        return;
      }

      const key = e.key.toLowerCase();
      if (!/^[a-z]$/.test(key)) return;

      totalShotsRef.current += 1;
      const shipX = 300;
      const shipY = 720;

      // 1. If currently locked onto an enemy
      if (targetIdRef.current) {
        const target = enemiesRef.current.find((en) => en.id === targetIdRef.current);
        if (target) {
          const expected = target.word.cleanPinyin[target.typedIndex];
          if (key === expected) {
            hitsRef.current += 1;
            target.typedIndex += 1;
            sound.playLaser();

            // Fire Plasma Pellet Bullet
            const angle = Math.atan2(target.y - shipY, target.x - shipX);
            const speed = 28;
            bulletsRef.current.push({
              x: shipX,
              y: shipY,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              targetId: target.id,
              color: "#4DFED2",
            });

            // If word finished:
            if (target.typedIndex >= target.word.cleanPinyin.length) {
              sound.playExplosion();
              speakChinese(target.word.chinese);

              const points = 100 * multiplier;
              createZTypeExplosion(target.x, target.y, target.color, points);

              setScore((s) => s + points);
              setMultiplier((m) => {
                const next = Math.min(m + 1, 10);
                if (next > maxMultiplier) setMaxMultiplier(next);
                return next;
              });
              setDestroyedCount((d) => d + 1);

              enemiesRef.current = enemiesRef.current.filter((en) => en.id !== target.id);
              targetIdRef.current = null;

              // Wave clear check
              if (destroyedCount + 1 >= wave * 8) {
                sound.playVictory();
                setWave((w) => w + 1);
                addExpAndGems(40, 5);
              }
            }
            return;
          }
        }
      }

      // 2. If no target locked, find lowest enemy starting with this letter
      const matching = enemiesRef.current.filter(
        (en) => en.word.cleanPinyin[0] === key
      );

      if (matching.length > 0) {
        // Sort by lowest (closest to bottom)
        matching.sort((a, b) => b.y - a.y);
        const chosen = matching[0];
        targetIdRef.current = chosen.id;
        chosen.typedIndex = 1;
        hitsRef.current += 1;
        sound.playLaser();

        const angle = Math.atan2(chosen.y - shipY, chosen.x - shipX);
        const speed = 28;
        bulletsRef.current.push({
          x: shipX,
          y: shipY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          targetId: chosen.id,
          color: "#4DFED2",
        });

        if (chosen.typedIndex >= chosen.word.cleanPinyin.length) {
          sound.playExplosion();
          speakChinese(chosen.word.chinese);
          const points = 100 * multiplier;
          createZTypeExplosion(chosen.x, chosen.y, chosen.color, points);

          setScore((s) => s + points);
          setDestroyedCount((d) => d + 1);
          enemiesRef.current = enemiesRef.current.filter((en) => en.id !== chosen.id);
          targetIdRef.current = null;
        }
      } else {
        // Miss key resets multiplier
        sound.playIncorrect();
        setMultiplier(1);
      }

      if (totalShotsRef.current > 0) {
        setAccuracy(Math.round((hitsRef.current / totalShotsRef.current) * 100));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [multiplier, maxMultiplier, wave, destroyedCount, bombs]);

  return (
    <div ref={containerRef} className="w-full flex flex-col items-center justify-center select-none py-2 scroll-mt-4">
      {/* Outer Cabinet Wrapper (Clean Light Theme) */}
      <div
        className="relative flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl mx-auto isolate"
        style={{ width: "100%", maxWidth: "600px" }}
      >
        {/* Top ZType HUD (Solid Integrated Header - Không bị lộ nền đen) */}
        <div className="relative z-20 flex items-center justify-between px-3.5 py-2.5 sm:px-4 sm:py-3 bg-white border-b border-slate-200 text-xs font-bold text-slate-700">
          {/* Left Wing: Wave & Quick Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="inline-flex items-center rounded-xl border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-black text-red-700 shadow-2xs">
              WAVE {wave}
            </span>

            {/* Interactive Pinyin Toggle Button */}
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

            {/* Mute Sound Toggle Button */}
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
              {score.toString().padStart(6, "0")}
            </span>
          </div>

          {/* Right Wing: Multiplier & Bombs */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="inline-flex items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700 shadow-2xs">
              <span className="text-[10px] text-emerald-600 font-bold uppercase">COMBO</span>
              <span>x{multiplier}</span>
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-black text-amber-800 shadow-2xs">
              <Zap size={13} className="text-amber-500 fill-amber-500" />
              <span>x{bombs}</span>
            </div>
          </div>
        </div>

        {/* 60FPS HTML5 Canvas Viewport Container */}
        <div className={`relative w-full overflow-hidden ${isPlaying ? "bg-slate-950 rounded-b-3xl" : "bg-white rounded-b-3xl"}`}>
          <canvas
            ref={canvasRef}
            width={600}
            height={780}
            className={`h-[560px] sm:h-[680px] max-h-[74vh] w-full cursor-crosshair bg-slate-950 rounded-b-3xl ${isPlaying ? "block" : "hidden"}`}
          />

        {/* Start Overlay (Mission Control - Clean Light Theme) */}
        {!isPlaying && !isGameOver && (
          <div className="relative z-30 flex flex-col items-center justify-center bg-white p-5 sm:p-7 text-center min-h-[560px] sm:min-h-[680px] rounded-b-3xl">
            {/* Header Emblem & Title */}
            <div className="space-y-1 mb-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3.5 py-1 text-xs font-semibold text-red-700 mb-1">
                <Sparkles size={13} className="text-red-600" />
                <span>Space Interceptor</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                Chiến Cơ Phiên Âm (ZType)
              </h1>
              <p className="text-xs text-slate-500">
                Gõ Pinyin chính xác và nhanh chóng để phóng laser tiêu diệt phi thuyền từ vựng
              </p>
            </div>

            {/* Mission Configuration Panel */}
            <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left text-xs text-slate-700 shadow-sm space-y-3.5 relative z-20">
              {/* 1. Chọn Loại HSK */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5 flex items-center gap-1.5">
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

              {/* 4. Tùy chọn Pinyin */}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-medium">Hiển thị Pinyin:</span>
                <button
                  type="button"
                  onClick={() => {
                    sound.playWoodblock();
                    setShowPinyin((p) => !p);
                  }}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-bold border transition-all cursor-pointer ${
                    showPinyin
                      ? "border-red-600 bg-red-600 text-white"
                      : "border-slate-200 bg-white text-slate-600"
                  }`}
                >
                  {showPinyin ? "BẬT" : "TẮT"}
                </button>
              </div>
            </div>

            {/* Ready Badge & Launch Button */}
            <div className="mt-4 w-full max-w-sm space-y-2.5">
              <button
                type="button"
                onClick={startGame}
                className="group w-full flex items-center justify-center gap-2 rounded-xl bg-red-600 text-white py-3.5 px-6 text-sm font-bold shadow-[0_4px_0_#991B1B] hover:bg-red-700 active:translate-y-[2px] active:shadow-[0_2px_0_#991B1B] transition-all cursor-pointer"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>XUẤT KÍCH VÀO TRẬN</span>
              </button>
            </div>
          </div>
        )}

        {/* Game Over Screen (Clean Light Theme) */}
        {isGameOver && (
          <div className="relative z-30 flex flex-col items-center justify-center bg-white p-8 text-center space-y-5 animate-fadeIn min-h-[560px] sm:min-h-[680px] rounded-b-3xl">
            <div className="space-y-1">
              <h2 className="text-2xl sm:text-3xl font-bold text-red-600">
                Phòng Tuyến Bị Phá Vỡ
              </h2>
              <p className="text-xs text-slate-500">Phi thuyền địch đã xâm nhập thành công căn cứ</p>
            </div>

            <div className="w-full max-w-xs space-y-2.5 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left text-xs shadow-sm">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-medium">Tổng điểm:</span>
                <span className="font-bold text-red-600 text-base">{score}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-medium">Wave đạt tới:</span>
                <span className="font-bold text-slate-800 text-base">{wave}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-medium">Chiến cơ đã hạ:</span>
                <span className="font-bold text-slate-800 text-base">{destroyedCount}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-medium">Combo cao nhất:</span>
                <span className="font-bold text-amber-600 text-base">x{maxMultiplier}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Độ chính xác:</span>
                <span className="font-bold text-emerald-600 text-base">{accuracy}%</span>
              </div>
            </div>

            <button
              type="button"
              onClick={startGame}
              className="flex items-center gap-2 rounded-xl bg-red-600 text-white px-8 py-3.5 text-sm font-bold shadow-[0_4px_0_#991B1B] hover:bg-red-700 active:translate-y-[2px] active:shadow-[0_2px_0_#991B1B] transition-all cursor-pointer"
            >
              <RotateCcw size={15} />
              <span>CHƠI LẠI TRẬN MỚI</span>
            </button>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
