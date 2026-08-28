import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { sound } from "~/lib/sound";
import { addExpAndGems } from "~/lib/gamification";
import {
  Layers,
  Sparkles,
  RotateCcw,
  Timer,
  Trophy,
  Volume2,
  VolumeX,
  Eye,
  Shuffle,
  Zap,
  Clock,
  CheckCircle2,
  Award,
  Flame,
  Star,
  Target,
  BookOpen,
  HelpCircle,
  Play,
  Grid,
  Box,
  Lock,
  ChevronRight,
  ChevronDown,
  Check,
  ShieldAlert,
} from "lucide-react";

export interface MahjongWord {
  id: string;
  chinese: string;
  pinyin: string;
  meaningVi: string;
  level?: string;
  lessonId?: string;
  lessonTitle?: string;
  source?: string;
}

export interface MahjongLesson {
  id: string;
  title: string;
  level: string;
  source?: string;
}

export type MahjongPair = {
  id: string;
  chinese: string;
  pinyin: string;
  meaningVi: string;
  level?: string;
  lessonId?: string;
  source?: string;
};

export interface MahjongMatchGameProps {
  words?: MahjongWord[];
  lessons?: MahjongLesson[];
  pairs?: MahjongPair[];
  onComplete?: () => void;
}

export type GameMode = "SOLITAIRE_3D" | "GRID_SPEED" | "TIME_ATTACK";
export type MatchType = "HANZI_MEANING" | "HANZI_PINYIN";

export interface MahjongTile {
  tileId: string;
  pairId: string;
  type: "hanzi" | "meaning" | "pinyin";
  text: string;
  subtext?: string;
  chineseAudio?: string;
  matched: boolean;
  layer: number;
  row: number;
  col: number;
  isFree: boolean;
  isHinted?: boolean;
}

interface FloatingParticle {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
}

const defaultFallbackWords: MahjongWord[] = [
  { id: "w1", chinese: "你好", pinyin: "nǐhǎo", meaningVi: "Xin chào", level: "HSK1", source: "HSK20" },
  { id: "w2", chinese: "谢谢", pinyin: "xièxiè", meaningVi: "Cảm ơn", level: "HSK1", source: "HSK20" },
  { id: "w3", chinese: "再见", pinyin: "zàijiàn", meaningVi: "Tạm biệt", level: "HSK1", source: "HSK20" },
  { id: "w4", chinese: "学习", pinyin: "xuéxí", meaningVi: "Học tập", level: "HSK1", source: "HSK20" },
  { id: "w5", chinese: "朋友", pinyin: "péngyǒu", meaningVi: "Bạn bè", level: "HSK1", source: "HSK20" },
  { id: "w6", chinese: "老师", pinyin: "lǎoshī", meaningVi: "Thầy cô", level: "HSK1", source: "HSK20" },
  { id: "w7", chinese: "学生", pinyin: "xuéshēng", meaningVi: "Học sinh", level: "HSK1", source: "HSK20" },
  { id: "w8", chinese: "喜欢", pinyin: "xǐhuan", meaningVi: "Yêu thích", level: "HSK1", source: "HSK20" },
  { id: "w9", chinese: "喝水", pinyin: "hēshuǐ", meaningVi: "Uống nước", level: "HSK1", source: "HSK20" },
  { id: "w10", chinese: "吃饭", pinyin: "chīfàn", meaningVi: "Ăn cơm", level: "HSK1", source: "HSK20" },
  { id: "w11", chinese: "漂亮", pinyin: "piàoliang", meaningVi: "Xinh đẹp", level: "HSK1", source: "HSK20" },
  { id: "w12", chinese: "高兴", pinyin: "gāoxìng", meaningVi: "Vui vẻ", level: "HSK1", source: "HSK20" },
  { id: "w13", chinese: "努力", pinyin: "nǔlì", meaningVi: "Nỗ lực", level: "HSK2", source: "HSK20" },
  { id: "w14", chinese: "坚持", pinyin: "jiānchí", meaningVi: "Kiên trì", level: "HSK3", source: "HSK20" },
  { id: "w15", chinese: "成功", pinyin: "chénggōng", meaningVi: "Thành công", level: "HSK3", source: "HSK20" },
];

export function MahjongMatchGame({
  words = [],
  lessons = [],
  pairs = [],
  onComplete,
}: MahjongMatchGameProps) {
  // Configuration State
  const [selectedStandard, setSelectedStandard] = useState<"HSK20" | "HSK30">("HSK20");
  const [selectedLevel, setSelectedLevel] = useState<string>("HSK1");
  const [selectedTopicId, setSelectedTopicId] = useState<string>("ALL");
  const [gameMode, setGameMode] = useState<GameMode>("SOLITAIRE_3D");
  const [matchType, setMatchType] = useState<MatchType>("HANZI_MEANING");
  const [showPinyinHint, setShowPinyinHint] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(() => sound.getMuted());
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

  // Game Lifecycle State
  const [gameState, setGameState] = useState<"CONFIG" | "PLAYING" | "VICTORY" | "TIMEOUT">("CONFIG");
  const [tiles, setTiles] = useState<MahjongTile[]>([]);
  const [selectedTile, setSelectedTile] = useState<MahjongTile | null>(null);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const [correctMatches, setCorrectMatches] = useState(0);
  const [timeLeft, setTimeLeft] = useState(90);
  const [initialTime, setInitialTime] = useState(90);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [lastMatchTime, setLastMatchTime] = useState(0);

  // Power-up Inventory (Charges per game)
  const [hintCharges, setHintCharges] = useState(3);
  const [shuffleCharges, setShuffleCharges] = useState(2);
  const [lightningCharges, setLightningCharges] = useState(1);
  const [timeCharges, setTimeCharges] = useState(2);

  // FX & Floating Text Popups
  const [floatingFx, setFloatingFx] = useState<FloatingParticle[]>([]);
  const [lightningActive, setLightningActive] = useState(false);

  // Table Board Ref for Auto-centering on entering game
  const boardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (gameState === "PLAYING" && boardRef.current) {
      setTimeout(() => {
        boardRef.current?.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
      }, 50);
    }
  }, [gameState]);

  // Filter available lessons
  const availableTopics = useMemo(() => {
    if (!lessons || lessons.length === 0) return [];
    return lessons.filter(
      (l) => l.source === selectedStandard && l.level.toUpperCase() === selectedLevel.toUpperCase()
    );
  }, [lessons, selectedStandard, selectedLevel]);

  // Reset topic on standard/level change
  useEffect(() => {
    setSelectedTopicId("ALL");
  }, [selectedStandard, selectedLevel]);

  const [topicWords, setTopicWords] = useState<MahjongWord[]>([]);
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
                id: v.id,
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
        console.error("Failed to load topic words in Mahjong:", err);
      } finally {
        if (!isCancelled) setIsLoadingWords(false);
      }
    };

    fetchVocab();
    return () => {
      isCancelled = true;
    };
  }, [selectedStandard, selectedLevel, selectedTopicId]);

  // Active word pool
  const activeWordPool = useMemo(() => {
    let pool: MahjongWord[] = [];
    if (topicWords.length > 0) {
      pool = topicWords;
    } else if (words && words.length > 0) {
      pool = words;
    } else if (pairs && pairs.length > 0) {
      pool = pairs.map((p) => ({
        id: p.id,
        chinese: p.chinese,
        pinyin: p.pinyin,
        meaningVi: p.meaningVi,
        level: p.level || "HSK1",
        source: p.source || "HSK20",
      }));
    } else {
      pool = defaultFallbackWords;
    }

    let filtered = pool.filter((w) => {
      const matchStd = !w.source || w.source.toUpperCase() === selectedStandard.toUpperCase();
      const matchLvl = !w.level || w.level.toUpperCase() === selectedLevel.toUpperCase();
      const matchTopic = selectedTopicId === "ALL" || w.lessonId === selectedTopicId || w.lessonTitle === selectedTopicId;
      return matchStd && matchLvl && matchTopic;
    });

    if (filtered.length === 0) {
      filtered = pool;
    }
    if (filtered.length === 0) {
      filtered = defaultFallbackWords;
    }
    return filtered;
  }, [topicWords, words, pairs, selectedStandard, selectedLevel, selectedTopicId]);

  // Chinese Text-to-Speech
  const speakChinese = (text?: string) => {
    if (!text || typeof window === "undefined" || isMuted) return;
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "zh-CN";
      u.rate = 0.92;
      window.speechSynthesis.speak(u);
    }
  };

  // Trigger floating popup score text
  const spawnFloatingText = (x: number, y: number, text: string, color = "#F59E0B") => {
    const id = Date.now() + Math.random();
    setFloatingFx((prev) => [...prev, { id, x, y, text, color }]);
    setTimeout(() => {
      setFloatingFx((prev) => prev.filter((item) => item.id !== id));
    }, 1000);
  };

  // Determine which tiles are free in 3D Solitaire Layout
  // Mahjong Solitaire Rule: A tile is free if it is NOT covered by a tile on a layer above it.
  const computeFreeTiles = useCallback((tileList: MahjongTile[]): MahjongTile[] => {
    const active = tileList.filter((t) => !t.matched);

    return tileList.map((tile) => {
      if (tile.matched) return { ...tile, isFree: false };

      if (gameMode !== "SOLITAIRE_3D") {
        return { ...tile, isFree: true };
      }

      // Check if covered from any tile on a higher layer
      const isCovered = active.some(
        (top) =>
          top.layer > tile.layer &&
          Math.abs(top.row - tile.row) < 0.8 &&
          Math.abs(top.col - tile.col) < 0.8
      );

      return { ...tile, isFree: !isCovered };
    });
  }, [gameMode]);

  // Anti-deadlock solver: Rebalance remaining unmatched tiles so at least 1 pair is playable
  const rescueDeadlock = useCallback((currentTiles: MahjongTile[]): MahjongTile[] => {
    const activeUnmatched = currentTiles.filter((t) => !t.matched);
    if (activeUnmatched.length < 2) return currentTiles;

    const freeSlots = activeUnmatched.filter((t) => t.isFree);
    const coveredSlots = activeUnmatched.filter((t) => !t.isFree);

    const pairGroups: Record<string, { hanzi?: MahjongTile; other?: MahjongTile }> = {};
    activeUnmatched.forEach((t) => {
      if (!pairGroups[t.pairId]) pairGroups[t.pairId] = {};
      if (t.type === "hanzi") pairGroups[t.pairId].hanzi = t;
      else pairGroups[t.pairId].other = t;
    });

    const pairsList = Object.values(pairGroups).filter((p) => p.hanzi && p.other);
    if (pairsList.length === 0) return currentTiles;

    const chosenPair = pairsList[Math.floor(Math.random() * pairsList.length)];
    const otherPairs = pairsList.filter((p) => p !== chosenPair);

    const freeTileContents: MahjongTile[] = [];
    const remainingTileContents: MahjongTile[] = [];

    if (freeSlots.length >= 2) {
      freeTileContents.push(chosenPair.hanzi!, chosenPair.other!);
    } else {
      freeTileContents.push(chosenPair.hanzi!);
      remainingTileContents.push(chosenPair.other!);
    }

    otherPairs.forEach((p) => {
      remainingTileContents.push(p.hanzi!, p.other!);
    });

    for (let i = remainingTileContents.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [remainingTileContents[i], remainingTileContents[j]] = [
        remainingTileContents[j],
        remainingTileContents[i],
      ];
    }

    while (freeTileContents.length < freeSlots.length && remainingTileContents.length > 0) {
      freeTileContents.push(remainingTileContents.pop()!);
    }

    for (let i = freeTileContents.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [freeTileContents[i], freeTileContents[j]] = [freeTileContents[j], freeTileContents[i]];
    }

    let freeIdx = 0;
    let coveredIdx = 0;

    const newTiles = currentTiles.map((slot) => {
      if (slot.matched) return slot;
      if (slot.isFree) {
        const d = freeTileContents[freeIdx++];
        return {
          ...slot,
          pairId: d.pairId,
          type: d.type,
          text: d.text,
          subtext: d.subtext,
          chineseAudio: d.chineseAudio,
          isHinted: false,
        };
      } else {
        const d = remainingTileContents[coveredIdx++];
        return {
          ...slot,
          pairId: d.pairId,
          type: d.type,
          text: d.text,
          subtext: d.subtext,
          chineseAudio: d.chineseAudio,
          isHinted: false,
        };
      }
    });

    return newTiles;
  }, []);

  // Generate 3D Solitaire / Speed Grid Tile Layouts with Guaranteed Solvability
  const initGameBoard = useCallback(() => {
    sound.playWoodblock();

    const numPairs = gameMode === "SOLITAIRE_3D" ? 8 : gameMode === "TIME_ATTACK" ? 6 : 8;
    const shuffledPool = [...activeWordPool].sort(() => Math.random() - 0.5);
    const selectedWords = shuffledPool.slice(0, numPairs);

    const rawPairs = selectedWords.map((word) => ({
      word,
      hanziTile: {
        tileId: `${word.id}-hanzi`,
        pairId: word.id,
        type: "hanzi" as const,
        text: word.chinese,
        subtext: word.pinyin,
        chineseAudio: word.chinese,
        matched: false,
      },
      otherTile: {
        tileId: matchType === "HANZI_PINYIN" ? `${word.id}-pinyin` : `${word.id}-meaning`,
        pairId: word.id,
        type: matchType === "HANZI_PINYIN" ? ("pinyin" as const) : ("meaning" as const),
        text: matchType === "HANZI_PINYIN" ? word.pinyin : word.meaningVi,
        subtext: matchType === "HANZI_PINYIN" ? word.meaningVi : word.pinyin,
        chineseAudio: word.chinese,
        matched: false,
      },
    }));

    const boardTiles: MahjongTile[] = [];

    if (gameMode === "SOLITAIRE_3D") {
      const slots: { id: number; layer: number; row: number; col: number }[] = [
        // Layer 0: Base 10 slots (outer wings are always open)
        { id: 0, layer: 0, row: 0, col: 0 },
        { id: 1, layer: 0, row: 0, col: 1 },
        { id: 2, layer: 0, row: 0, col: 2 },
        { id: 3, layer: 0, row: 0, col: 3 },
        { id: 4, layer: 0, row: 1, col: 0 },
        { id: 5, layer: 0, row: 1, col: 3 },
        { id: 6, layer: 0, row: 2, col: 0 },
        { id: 7, layer: 0, row: 2, col: 1 },
        { id: 8, layer: 0, row: 2, col: 2 },
        { id: 9, layer: 0, row: 2, col: 3 },
        // Layer 1: Mid 4 slots
        { id: 10, layer: 1, row: 0.5, col: 1 },
        { id: 11, layer: 1, row: 0.5, col: 2 },
        { id: 12, layer: 1, row: 1.5, col: 1 },
        { id: 13, layer: 1, row: 1.5, col: 2 },
        // Layer 2: Top Crown 2 slots
        { id: 14, layer: 2, row: 1, col: 1.1 },
        { id: 15, layer: 2, row: 1, col: 1.9 },
      ];

      let remaining = [...slots];

      function isSlotUncovered(slot: typeof slots[0], currentRemaining: typeof slots): boolean {
        return !currentRemaining.some(
          (other) =>
            other.layer > slot.layer &&
            Math.abs(other.row - slot.row) < 0.8 &&
            Math.abs(other.col - slot.col) < 0.8
        );
      }

      for (const p of rawPairs) {
        const freeSlots = remaining.filter((s) => isSlotUncovered(s, remaining));

        let slotA: typeof slots[0];
        let slotB: typeof slots[0];

        if (freeSlots.length >= 2) {
          const idxA = Math.floor(Math.random() * freeSlots.length);
          slotA = freeSlots[idxA];
          const remainingFree = freeSlots.filter((s) => s.id !== slotA.id);
          const idxB = Math.floor(Math.random() * remainingFree.length);
          slotB = remainingFree[idxB];
        } else if (freeSlots.length === 1 && remaining.length >= 2) {
          slotA = freeSlots[0];
          const otherRemaining = remaining.filter((s) => s.id !== slotA.id);
          slotB = otherRemaining[Math.floor(Math.random() * otherRemaining.length)];
        } else {
          slotA = remaining[0];
          slotB = remaining[1] || remaining[0];
        }

        boardTiles.push({
          ...p.hanziTile,
          layer: slotA.layer,
          row: slotA.row,
          col: slotA.col,
          isFree: false,
        });

        boardTiles.push({
          ...p.otherTile,
          layer: slotB.layer,
          row: slotB.row,
          col: slotB.col,
          isFree: false,
        });

        remaining = remaining.filter((s) => s.id !== slotA.id && s.id !== slotB.id);
      }
    } else {
      const rawTileItems = rawPairs.flatMap((p) => [p.hanziTile, p.otherTile]);
      for (let i = rawTileItems.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [rawTileItems[i], rawTileItems[j]] = [rawTileItems[j], rawTileItems[i]];
      }

      const cols = 4;
      rawTileItems.forEach((tileData, idx) => {
        boardTiles.push({
          ...tileData,
          layer: 0,
          row: Math.floor(idx / cols),
          col: idx % cols,
          isFree: true,
        });
      });
    }

    const freeComputed = computeFreeTiles(boardTiles);
    setTiles(freeComputed);
    setSelectedTile(null);
    setMoves(0);
    setCorrectMatches(0);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);

    const gameDuration = gameMode === "TIME_ATTACK" ? 45 : gameMode === "SOLITAIRE_3D" ? 100 : 75;
    setTimeLeft(gameDuration);
    setInitialTime(gameDuration);

    setHintCharges(3);
    setShuffleCharges(2);
    setLightningCharges(1);
    setTimeCharges(2);
    setGameState("PLAYING");
  }, [activeWordPool, gameMode, matchType, computeFreeTiles]);

  // Main Game Countdown Timer
  useEffect(() => {
    if (gameState !== "PLAYING") return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          sound.playShieldBreak();
          setGameState("TIMEOUT");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState]);

  // Tile Selection & Match Resolution Engine
  const handleTileClick = (tile: MahjongTile, event?: React.MouseEvent) => {
    if (gameState !== "PLAYING" || tile.matched) return;

    if (gameMode === "SOLITAIRE_3D" && !tile.isFree) {
      sound.playWoodblock();
      if (event) {
        spawnFloatingText(event.clientX, event.clientY - 20, "BỊ KHÓA! Hãy mở tầng trên", "#EF4444");
      }
      return;
    }

    sound.playWoodblock();
    if (tile.chineseAudio) {
      speakChinese(tile.chineseAudio);
    }

    if (!selectedTile) {
      setSelectedTile(tile);
      return;
    }

    if (selectedTile.tileId === tile.tileId) {
      setSelectedTile(null);
      return;
    }

    setMoves((m) => m + 1);

    const isMatch = selectedTile.pairId === tile.pairId && selectedTile.type !== tile.type;

    if (isMatch) {
      const now = Date.now();
      const timeSinceLast = (now - lastMatchTime) / 1000;
      setLastMatchTime(now);

      const isFast = timeSinceLast > 0 && timeSinceLast < 3.8;
      const nextCombo = isFast ? combo + 1 : 1;
      setCombo(nextCombo);
      if (nextCombo > maxCombo) setMaxCombo(nextCombo);

      sound.playGuzhengHarp(nextCombo);
      sound.playCoin();
      if (nextCombo >= 2) {
        sound.playCombo(nextCombo);
      }

      const basePoints = 150;
      const comboBonus = (nextCombo - 1) * 75;
      const timeBonus = Math.max(10, Math.floor(timeLeft * 1.5));
      const totalGained = basePoints + comboBonus + timeBonus;
      setScore((s) => s + totalGained);

      if (event) {
        spawnFloatingText(
          event.clientX,
          event.clientY - 30,
          `+${totalGained}${nextCombo >= 2 ? ` (x${nextCombo} COMBO!)` : ""}`,
          nextCombo >= 2 ? "#F59E0B" : "#10B981"
        );
      }

      const matchPairId = selectedTile.pairId;
      setSelectedTile(null);

      if (gameMode === "TIME_ATTACK") {
        setTimeLeft((t) => Math.min(initialTime + 15, t + 4));
      }

      setTimeout(() => {
        setTiles((prevList) => {
          const updated = prevList.map((t) =>
            t.pairId === matchPairId ? { ...t, matched: true, isHinted: false } : { ...t, isHinted: false }
          );
          const nextFree = computeFreeTiles(updated);

          const remainingActive = nextFree.filter((t) => !t.matched);
          if (remainingActive.length === 0) {
            handleVictory();
            return nextFree;
          }

          if (gameMode === "SOLITAIRE_3D") {
            const activeFree = nextFree.filter((t) => !t.matched && t.isFree);
            const pairCounts: Record<string, number> = {};
            activeFree.forEach((t) => {
              pairCounts[t.pairId] = (pairCounts[t.pairId] || 0) + 1;
            });
            const hasPlayablePair = Object.values(pairCounts).some((cnt) => cnt >= 2);

            if (!hasPlayablePair && remainingActive.length >= 2) {
              sound.playDragonGate();
              spawnFloatingText(
                window.innerWidth / 2,
                window.innerHeight / 2,
                "⚡ Bát Quái: Tự động mở thế cờ mới!",
                "#F59E0B"
              );
              const rescued = rescueDeadlock(nextFree);
              return computeFreeTiles(rescued);
            }
          }

          return nextFree;
        });

        setCorrectMatches((c) => c + 1);
      }, 200);

    } else {
      sound.playIncorrect();
      setCombo(0);

      if (event) {
        spawnFloatingText(event.clientX, event.clientY - 20, "KHÔNG KHỚP!", "#EF4444");
      }

      setTimeout(() => {
        setSelectedTile(null);
      }, 500);
    }
  };

  const handleVictory = () => {
    sound.playVictory();
    sound.playLevelUp();
    setGameState("VICTORY");

    const bonusExp = Math.floor(score / 20) + 80;
    const bonusGems = 15 + (combo >= 4 ? 10 : 0);
    addExpAndGems(bonusExp, bonusGems);

    if (onComplete) onComplete();
  };

  // Power-up 1: Hint
  const handleUseHint = () => {
    if (hintCharges <= 0 || gameState !== "PLAYING") return;
    sound.playWoodblock();

    const activeFree = tiles.filter((t) => !t.matched && t.isFree);
    let targetPairId: string | null = null;
    const pairMap: Record<string, number> = {};

    for (const t of activeFree) {
      pairMap[t.pairId] = (pairMap[t.pairId] || 0) + 1;
      if (pairMap[t.pairId] === 2) {
        targetPairId = t.pairId;
        break;
      }
    }

    if (targetPairId) {
      sound.playGuzhengHarp(2);
      setHintCharges((c) => c - 1);
      setTiles((prev) =>
        prev.map((t) =>
          t.pairId === targetPairId && t.isFree ? { ...t, isHinted: true } : { ...t, isHinted: false }
        )
      );
    } else {
      spawnFloatingText(window.innerWidth / 2, window.innerHeight / 2, "Chưa có cặp mở! Hãy Xáo Thẻ!", "#F59E0B");
    }
  };

  // Power-up 2: Shuffle
  const handleUseShuffle = () => {
    if (shuffleCharges <= 0 || gameState !== "PLAYING") return;
    sound.playWoodblock();
    sound.playDragonGate();
    setShuffleCharges((c) => c - 1);

    setTiles((prev) => {
      const activeUnmatched = prev.filter((t) => !t.matched);
      const activeData = activeUnmatched.map((t) => ({
        pairId: t.pairId,
        type: t.type,
        text: t.text,
        subtext: t.subtext,
        chineseAudio: t.chineseAudio,
      }));

      for (let i = activeData.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [activeData[i], activeData[j]] = [activeData[j], activeData[i]];
      }

      let dataIdx = 0;
      const newTiles = prev.map((t) => {
        if (t.matched) return t;
        const d = activeData[dataIdx++];
        return {
          ...t,
          pairId: d.pairId,
          type: d.type,
          text: d.text,
          subtext: d.subtext,
          chineseAudio: d.chineseAudio,
          isHinted: false,
        };
      });

      return computeFreeTiles(newTiles);
    });

    setSelectedTile(null);
    spawnFloatingText(window.innerWidth / 2, window.innerHeight / 2, "ĐÃ XÁO BÀI!", "#10B981");
  };

  // Power-up 3: Lightning Auto-Match
  const handleUseLightning = () => {
    if (lightningCharges <= 0 || gameState !== "PLAYING") return;
    const activeTiles = tiles.filter((t) => !t.matched);
    if (activeTiles.length === 0) return;

    sound.playLaser();
    setLightningCharges((c) => c - 1);
    setLightningActive(true);

    const randomTarget = activeTiles[Math.floor(Math.random() * activeTiles.length)];
    const targetPairId = randomTarget.pairId;

    setTimeout(() => {
      setLightningActive(false);
      sound.playGuzhengHarp(4);
      sound.playCoin();

      setTiles((prev) => {
        const updated = prev.map((t) => (t.pairId === targetPairId ? { ...t, matched: true } : t));
        const nextFree = computeFreeTiles(updated);
        if (nextFree.filter((t) => !t.matched).length === 0) {
          handleVictory();
        }
        return nextFree;
      });

      setScore((s) => s + 350);
      setCorrectMatches((c) => c + 1);
      spawnFloatingText(window.innerWidth / 2, window.innerHeight / 2, "THIÊN LÔI PHÁ TRẬN +350 PTS!", "#F59E0B");
    }, 400);
  };

  // Power-up 4: Time Boost
  const handleUseTimeBoost = () => {
    if (timeCharges <= 0 || gameState !== "PLAYING") return;
    sound.playCoin();
    setTimeCharges((c) => c - 1);
    setTimeLeft((t) => t + 15);
    spawnFloatingText(window.innerWidth / 2, window.innerHeight / 2, "+15 GIÂY THỜI GIAN!", "#38BDF8");
  };

  const calculateStars = () => {
    const timePercentage = timeLeft / initialTime;
    if (timePercentage >= 0.5 && maxCombo >= 4) return 3;
    if (timePercentage >= 0.2 || maxCombo >= 2) return 2;
    return 1;
  };

  return (
    <div className="mx-auto flex flex-col items-center select-none w-full max-w-5xl text-slate-100 relative">
      
      {/* Floating Popups */}
      {floatingFx.map((item) => (
        <div
          key={item.id}
          className="pointer-events-none fixed z-50 animate-bounce font-mono text-sm font-black drop-shadow-md"
          style={{ left: item.x, top: item.y, color: item.color }}
        >
          {item.text}
        </div>
      ))}      {/* Outer Clean Light Frame */}
      <div className={`relative w-full ${gameState === "CONFIG" ? "overflow-visible" : "overflow-hidden"} rounded-3xl border border-slate-200 bg-white shadow-xl`}>
        
        {/* ========================================================================= */}
        {/* STATE 1: LIGHT THEME WHITE & RED MODE SELECTION LOBBY */}
        {/* ========================================================================= */}
        {gameState === "CONFIG" && (
          <div className="p-6 sm:p-12 flex flex-col items-center justify-center space-y-8 max-w-3xl mx-auto">
            
            {/* Header: Authentic Title with Carved Porcelain Tiles */}
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="flex h-9 w-7 items-center justify-center rounded-md border border-[#E2D9C8] bg-[#FBF8EE] text-[#DC2626] font-hanzi font-black text-base shadow-[0_2px_4px_rgba(0,0,0,0.1),0_2px_0_#CBD5E1]">
                  中
                </div>
                <div className="flex h-9 w-7 items-center justify-center rounded-md border border-[#E2D9C8] bg-[#FBF8EE] text-[#059669] font-hanzi font-black text-base shadow-[0_2px_4px_rgba(0,0,0,0.1),0_2px_0_#CBD5E1]">
                  發
                </div>
                <div className="flex h-9 w-7 items-center justify-center rounded-md border border-[#E2D9C8] bg-[#FBF8EE] text-[#2563EB] font-hanzi font-black text-base shadow-[0_2px_4px_rgba(0,0,0,0.1),0_2px_0_#CBD5E1]">
                  白
                </div>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Mạt Chược Ghép Đôi
              </h2>

              <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
                Chọn thế cờ và cấp độ từ vựng để bắt đầu ván bài Mạt Chược truyền thống.
              </p>
            </div>

            {/* 3 Physical Formation Cards (Light Theme) */}
            <div className="w-full space-y-2.5">
              <span className="text-xs font-semibold text-slate-600 block px-1">
                Thế cờ bàn đấu:
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 w-full">
                {/* Mode 1: Solitaire 3D */}
                <button
                  type="button"
                  onClick={() => {
                    sound.playWoodblock();
                    setGameMode("SOLITAIRE_3D");
                  }}
                  className={`group relative flex flex-col justify-between rounded-2xl border p-4 text-left transition-all duration-200 cursor-pointer ${
                    gameMode === "SOLITAIRE_3D"
                      ? "border-2 border-red-600 bg-red-50/70 shadow-md ring-1 ring-red-600/20"
                      : "border-slate-200 bg-white hover:border-red-300 hover:bg-red-50/20 shadow-sm"
                  }`}
                >
                  <div className="space-y-3">
                    {/* Visual Miniature 3D Tile Stack */}
                    <div className={`flex h-16 w-full items-center justify-center rounded-xl border p-2 ${
                      gameMode === "SOLITAIRE_3D" ? "bg-white border-red-200 shadow-sm" : "bg-slate-50 border-slate-200"
                    }`}>
                      <div className="relative flex items-center justify-center">
                        {/* Layer 0 Tile Base */}
                        <div className="h-7 w-6 rounded bg-[#FBF8EE] border border-[#E2D9C8] text-[#DC2626] font-hanzi text-[10px] font-black flex items-center justify-center shadow-[0_2px_0_#CBD5E1] -mr-1">
                          学
                        </div>
                        {/* Layer 1 Tile Stacked */}
                        <div className="relative z-10 h-8 w-7 rounded bg-[#FFFFFA] border border-[#E2D9C8] text-[#DC2626] font-hanzi text-xs font-black flex items-center justify-center shadow-[0_3px_0_#CBD5E1]">
                          中
                        </div>
                        {/* Layer 0 Tile Base */}
                        <div className="h-7 w-6 rounded bg-[#FBF8EE] border border-[#E2D9C8] text-[#059669] font-hanzi text-[10px] font-black flex items-center justify-center shadow-[0_2px_0_#CBD5E1] -ml-1">
                          习
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <h3 className={`text-sm font-bold ${
                          gameMode === "SOLITAIRE_3D" ? "text-red-700" : "text-slate-900"
                        }`}>
                          Kim Tự Tháp 3D
                        </h3>
                        <span className={`text-[10px] font-mono ${
                          gameMode === "SOLITAIRE_3D" ? "text-red-600 font-bold" : "text-slate-400"
                        }`}>
                          24 quân
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Xếp 3 tầng cao thấp, gỡ dần các quân bài tự do từ đỉnh tháp xuống.
                      </p>
                    </div>
                  </div>
                </button>

                {/* Mode 2: Grid Speed */}
                <button
                  type="button"
                  onClick={() => {
                    sound.playWoodblock();
                    setGameMode("GRID_SPEED");
                  }}
                  className={`group relative flex flex-col justify-between rounded-2xl border p-4 text-left transition-all duration-200 cursor-pointer ${
                    gameMode === "GRID_SPEED"
                      ? "border-2 border-red-600 bg-red-50/70 shadow-md ring-1 ring-red-600/20"
                      : "border-slate-200 bg-white hover:border-red-300 hover:bg-red-50/20 shadow-sm"
                  }`}
                >
                  <div className="space-y-3">
                    {/* Visual Miniature 4x4 Grid */}
                    <div className={`flex h-16 w-full items-center justify-center rounded-xl border p-2 ${
                      gameMode === "GRID_SPEED" ? "bg-white border-red-200 shadow-sm" : "bg-slate-50 border-slate-200"
                    }`}>
                      <div className="grid grid-cols-4 gap-1">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                          <div
                            key={i}
                            className="h-3 w-2.5 rounded-[2px] bg-[#FBF8EE] border border-[#E2D9C8] shadow-[0_1px_0_#CBD5E1]"
                          />
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <h3 className={`text-sm font-bold ${
                          gameMode === "GRID_SPEED" ? "text-red-700" : "text-slate-900"
                        }`}>
                          Lưới Phẳng 4×4
                        </h3>
                        <span className={`text-[10px] font-mono ${
                          gameMode === "GRID_SPEED" ? "text-red-600 font-bold" : "text-slate-400"
                        }`}>
                          16 quân
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Mặt bàn mở sẵn 16 quân bài trên một mặt phẳng, rèn luyện phản xạ ghép nhanh.
                      </p>
                    </div>
                  </div>
                </button>

                {/* Mode 3: Time Attack */}
                <button
                  type="button"
                  onClick={() => {
                    sound.playWoodblock();
                    setGameMode("TIME_ATTACK");
                  }}
                  className={`group relative flex flex-col justify-between rounded-2xl border p-4 text-left transition-all duration-200 cursor-pointer ${
                    gameMode === "TIME_ATTACK"
                      ? "border-2 border-red-600 bg-red-50/70 shadow-md ring-1 ring-red-600/20"
                      : "border-slate-200 bg-white hover:border-red-300 hover:bg-red-50/20 shadow-sm"
                  }`}
                >
                  <div className="space-y-3">
                    {/* Visual Miniature Timer */}
                    <div className={`flex h-16 w-full items-center justify-center rounded-xl border p-2 ${
                      gameMode === "TIME_ATTACK" ? "bg-white border-red-200 shadow-sm" : "bg-slate-50 border-slate-200"
                    }`}>
                      <div className="flex items-center gap-1.5">
                        <Timer size={18} className="text-red-600" />
                        <span className="font-mono text-xs font-bold text-red-700">+4s</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <h3 className={`text-sm font-bold ${
                          gameMode === "TIME_ATTACK" ? "text-red-700" : "text-slate-900"
                        }`}>
                          Tốc Chiến Tính Giờ
                        </h3>
                        <span className={`text-[10px] font-mono ${
                          gameMode === "TIME_ATTACK" ? "text-red-600 font-bold" : "text-slate-400"
                        }`}>
                          Thử thách
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Đếm ngược thời gian dồn dập, mỗi cặp ghép đúng cộng thêm +4 giây.
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Settings Tray (Light Theme) */}
            <div className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 p-5 sm:p-6 space-y-4 relative z-20">
              {/* Level Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">
                    Cấp độ từ vựng:
                  </span>
                  {/* Standard toggle */}
                  <div className="flex items-center gap-1 border border-slate-200 bg-white p-0.5 rounded-lg text-[10px] font-medium shadow-sm">
                    <button
                      type="button"
                      onClick={() => {
                        sound.playWoodblock();
                        setSelectedStandard("HSK20");
                        setSelectedLevel("HSK1");
                      }}
                      className={`px-2.5 py-1 rounded transition ${
                        selectedStandard === "HSK20"
                          ? "bg-red-600 text-white font-bold shadow-sm"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      HSK 2.0
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        sound.playWoodblock();
                        setSelectedStandard("HSK30");
                        setSelectedLevel("HSK1");
                      }}
                      className={`px-2.5 py-1 rounded transition ${
                        selectedStandard === "HSK30"
                          ? "bg-red-600 text-white font-bold shadow-sm"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      HSK 3.0
                    </button>
                  </div>
                </div>

                {/* Level Pills */}
                <div className="flex flex-wrap gap-1.5">
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
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                        selectedLevel === lvl
                          ? "bg-red-600 text-white border border-red-600 font-bold shadow-sm"
                          : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-100"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Match Rule & Topic Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-200">
                {/* Match Rule */}
                <div>
                  <span className="text-xs font-semibold text-slate-700 block mb-1.5">
                    Quy tắc ghép cặp:
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        sound.playWoodblock();
                        setMatchType("HANZI_MEANING");
                      }}
                      className={`py-2 px-2 text-center text-xs font-medium rounded-xl border transition cursor-pointer ${
                        matchType === "HANZI_MEANING"
                          ? "bg-red-600 text-white border-red-600 font-bold shadow-sm"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:border-slate-300"
                      }`}
                    >
                      Hán Tự ↔ Nghĩa
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        sound.playWoodblock();
                        setMatchType("HANZI_PINYIN");
                      }}
                      className={`py-2 px-2 text-center text-xs font-medium rounded-xl border transition cursor-pointer ${
                        matchType === "HANZI_PINYIN"
                          ? "bg-red-600 text-white border-red-600 font-bold shadow-sm"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:border-slate-300"
                      }`}
                    >
                      Hán Tự ↔ Pinyin
                    </button>
                  </div>
                </div>

                {/* Custom Topic Filter Dropdown */}
                <div ref={dropdownRef} className="relative z-30">
                  <span className="text-xs font-semibold text-slate-700 block mb-1.5">
                    Chủ đề bài học:
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      sound.playWoodblock();
                      setIsDropdownOpen((prev) => !prev);
                    }}
                    className={`w-full flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-xs font-medium transition-all cursor-pointer shadow-sm ${
                      isDropdownOpen
                        ? "border-red-500 bg-red-50/20 ring-2 ring-red-500/20 text-slate-900"
                        : "border-slate-300 bg-white text-slate-800 hover:border-red-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <BookOpen size={14} className="text-red-600 shrink-0" />
                      <span className="truncate">
                        {selectedTopicId === "ALL"
                          ? `Toàn bộ từ vựng ${selectedLevel} (${activeWordPool.length} từ)`
                          : availableTopics.find((t) => t.id === selectedTopicId)?.title
                          ? `${availableTopics.find((t) => t.id === selectedTopicId)?.title} (${activeWordPool.length} từ)`
                          : selectedTopicId}
                      </span>
                    </div>
                    <ChevronDown
                      size={15}
                      className={`text-slate-400 transition-transform duration-200 shrink-0 ${
                        isDropdownOpen ? "rotate-180 text-red-600" : ""
                      }`}
                    />
                  </button>

                  {/* Dropdown Menu Popover */}
                  {isDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 z-50 max-h-64 overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl animate-fadeIn divide-y divide-slate-100">
                      <div className="pb-1">
                        {/* Option: ALL */}
                        <button
                          type="button"
                          onClick={() => {
                            sound.playWoodblock();
                            setSelectedTopicId("ALL");
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition cursor-pointer ${
                            selectedTopicId === "ALL"
                              ? "bg-red-50 text-red-700 font-bold"
                              : "text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-600" />
                            <span>Toàn bộ từ vựng {selectedLevel} ({activeWordPool.length} từ)</span>
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
                              className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition cursor-pointer ${
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
              </div>
            </div>

            {/* Launch Button with Red Theme Depth */}
            <button
              type="button"
              onClick={initGameBoard}
              className="w-full sm:w-auto min-w-[240px] flex items-center justify-center gap-2 rounded-xl bg-red-600 text-white py-3.5 px-8 text-sm font-bold tracking-wide hover:bg-red-700 shadow-[0_4px_0_#991B1B] active:translate-y-[2px] active:shadow-[0_2px_0_#991B1B] transition-all cursor-pointer"
            >
              <Play className="h-4 w-4 fill-current" />
              <span>Khai Màn Bàn Cờ</span>
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STATE 2: ACTIVE PLAYING BOARD */}
        {/* ========================================================================= */}
        {gameState === "PLAYING" && (
          <div className="p-3 sm:p-6 flex flex-col items-center space-y-5">
            
            {/* TRADITIONAL HIGH-CONTRAST MAHJONG TABLETOP (CHIẾU NỈ NGỌC BÍCH & KHUNG GỖ GỤ) */}
            <div
              ref={boardRef}
              className="relative w-full max-w-4xl min-h-[400px] sm:min-h-[480px] mx-auto flex items-center justify-center p-6 sm:p-10 rounded-[2.5rem] border-[10px] sm:border-[12px] border-[#381B0E] ring-2 ring-amber-500/40 bg-[#064E3B] shadow-[inset_0_4px_30px_rgba(0,0,0,0.55),0_15px_30px_rgba(0,0,0,0.2)]"
            >
              
              {/* Solitaire 3D Multi-Layer Pyramid Render */}
              {gameMode === "SOLITAIRE_3D" ? (
                <div className="relative w-full max-w-3xl h-[380px] sm:h-[440px] flex items-center justify-center mx-auto">
                  {tiles.map((tile) => {
                    const isSelected = selectedTile?.tileId === tile.tileId;
                    const isHinted = tile.isHinted;

                    if (tile.matched) return null;

                    const leftOffset = (tile.col - 1.5) * 115 + (tile.layer * 6);
                    const topOffset = (tile.row - 1) * 125 - (tile.layer * 12);
                    const zIndex = tile.layer * 20 + Math.floor(tile.row * 5);

                    return (
                      <button
                        key={tile.tileId}
                        type="button"
                        onClick={(e) => handleTileClick(tile, e)}
                        style={{
                          transform: `translate(${leftOffset}px, ${topOffset}px)${isSelected ? " translateY(-10px) scale(1.06)" : ""}`,
                          zIndex: isSelected ? 90 : zIndex,
                          boxShadow: isSelected
                            ? "0 0 25px rgba(220, 38, 38, 0.95), 0 0 0 3px #DC2626, 0 1px 0 #FFFFFF inset, 0 -2px 0 #C9BEA7 inset, 0 12px 0 #991B1B, 0 16px 20px rgba(0,0,0,0.55)"
                            : isHinted
                            ? "0 0 20px rgba(239, 68, 68, 0.9), 0 0 0 3px #EF4444, 0 1px 0 #FFFFFF inset, 0 10px 0 #022C1A, 0 14px 18px rgba(0,0,0,0.45)"
                            : !tile.isFree
                            ? "0 1px 0 rgba(255,255,255,0.08) inset, 0 4px 0 #021C10, 0 6px 10px rgba(0,0,0,0.3)"
                            : "0 1px 0 #FFFFFF inset, 0 -2px 0 #D8CEBA inset, 0 8px 0 #022C1A, 0 10px 0 #011C10, 0 12px 16px rgba(0,0,0,0.45)",
                        }}
                        className={`absolute w-24 sm:w-28 h-28 sm:h-32 rounded-2xl border-2 p-2 text-center transition-all duration-150 select-none flex flex-col items-center justify-center cursor-pointer ${
                          isSelected
                            ? "border-red-500 bg-[#FFFFFA] text-slate-950 ring-4 ring-red-500"
                            : isHinted
                            ? "border-red-400 bg-[#FEF2F2] text-slate-950 animate-bounce"
                            : !tile.isFree
                            ? "border-emerald-800/80 bg-[#042818] text-emerald-200/60 cursor-not-allowed opacity-80"
                            : "border-[#D1C7B7] bg-[#FFFFFA] text-slate-900 hover:border-red-500 hover:scale-105"
                        }`}
                      >
                        {/* Realistic Inset Porcelain Face Border */}
                        <div className={`w-full h-full rounded-xl border flex flex-col items-center justify-center relative p-1 ${
                          !tile.isFree ? "border-emerald-900/90 bg-[#032013]" : "border-[#E8E1D3] bg-[#FFFFFA]"
                        }`}>
                          
                          {/* Lock Icon for blocked tiles */}
                          {!tile.isFree && (
                            <div className="absolute top-1 right-1 text-amber-300 bg-emerald-950/90 p-0.5 rounded shadow-xs">
                              <Lock size={12} />
                            </div>
                          )}

                          {/* Layer Badge */}
                          <div className={`absolute top-1 left-1 text-[8px] font-mono font-black ${
                            !tile.isFree ? "text-emerald-500/80" : "text-[#8C7A60]"
                          }`}>
                            L{tile.layer + 1}
                          </div>

                          {/* Authentic Carved Mahjong Content */}
                          {tile.type === "hanzi" ? (
                            <>
                              <span
                                className={`font-hanzi text-3xl sm:text-4xl font-black drop-shadow-sm tracking-tight ${
                                  !tile.isFree ? "text-emerald-300/70" : "text-[#991B1B]"
                                }`}
                                style={{
                                   textShadow: tile.isFree ? "0.5px 0.5px 0px rgba(255,255,255,0.9), -0.5px -0.5px 1px rgba(0,0,0,0.35)" : "none",
                                }}
                              >
                                {tile.text}
                              </span>
                              {showPinyinHint && matchType !== "HANZI_PINYIN" && (
                                <span className={`text-[11px] font-black mt-0.5 font-mono ${
                                  !tile.isFree ? "text-emerald-400/60" : "text-[#047857]"
                                }`}>
                                  {tile.subtext}
                                </span>
                              )}
                            </>
                          ) : tile.type === "pinyin" ? (
                            <div className="flex flex-col items-center justify-center px-1">
                              <span
                                className={`text-xl sm:text-2xl font-black font-mono tracking-wide text-center ${
                                  !tile.isFree ? "text-emerald-300/70" : "text-[#047857]"
                                }`}
                                style={{
                                   textShadow: tile.isFree ? "0.5px 0.5px 0px rgba(255,255,255,0.9), -0.5px -0.5px 1px rgba(0,0,0,0.25)" : "none",
                                }}
                              >
                                {tile.text}
                              </span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center px-1">
                              <span className={`text-xs sm:text-sm font-black line-clamp-3 leading-snug text-center ${
                                !tile.isFree ? "text-emerald-200/70" : "text-[#0F172A]"
                              }`}>
                                {tile.text}
                              </span>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                /* Speed Grid / Flat 4x4 Grid Formation */
                <div className="grid grid-cols-4 gap-2.5 sm:gap-4 w-fit max-w-full py-2 mx-auto justify-items-center">
                  {tiles.map((tile) => {
                    const isSelected = selectedTile?.tileId === tile.tileId;
                    const isHinted = tile.isHinted;

                    if (tile.matched) {
                      return (
                        <div
                          key={tile.tileId}
                          className="flex w-[70px] sm:w-24 md:w-28 h-24 sm:h-28 md:h-32 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-emerald-500/30 bg-emerald-900/25 cursor-default"
                        >
                          <CheckCircle2 size={24} className="text-emerald-400/50" />
                        </div>
                      );
                    }

                    return (
                      <button
                        key={tile.tileId}
                        type="button"
                        onClick={(e) => handleTileClick(tile, e)}
                        style={{
                          boxShadow: isSelected
                            ? "0 0 25px rgba(220, 38, 38, 0.95), 0 0 0 3px #DC2626, 0 1px 0 #FFFFFF inset, 0 -2px 0 #C9BEA7 inset, 0 10px 0 #991B1B, 0 14px 18px rgba(0,0,0,0.55)"
                            : isHinted
                            ? "0 0 20px rgba(239, 68, 68, 0.9), 0 0 0 3px #EF4444, 0 1px 0 #FFFFFF inset, 0 8px 0 #022C1A, 0 12px 16px rgba(0,0,0,0.45)"
                            : "0 1px 0 #FFFFFF inset, 0 -2px 0 #D8CEBA inset, 0 7px 0 #022C1A, 0 9px 0 #011C10, 0 10px 14px rgba(0,0,0,0.45)",
                        }}
                        className={`relative w-[70px] sm:w-24 md:w-28 h-24 sm:h-28 md:h-32 rounded-2xl border-2 p-1 sm:p-1.5 text-center transition-all duration-150 select-none flex flex-col items-center justify-center cursor-pointer ${
                          isSelected
                            ? "border-red-500 bg-[#FFFFFA] text-slate-950 -translate-y-2 scale-105 ring-4 ring-red-500"
                            : isHinted
                            ? "border-red-400 bg-[#FEF2F2] text-slate-950 animate-bounce"
                            : "border-[#D1C7B7] bg-[#FFFFFA] text-slate-900 hover:border-red-500 hover:scale-105"
                        }`}
                      >
                        <div className="w-full h-full rounded-xl border border-[#E8E1D3] bg-[#FFFFFA] flex flex-col items-center justify-center p-1 overflow-hidden">
                          {tile.type === "hanzi" ? (
                            <>
                              <span
                                className="font-hanzi text-2xl sm:text-3xl md:text-4xl font-black text-[#991B1B] drop-shadow-sm tracking-tight"
                                style={{
                                   textShadow: "0.5px 0.5px 0px rgba(255,255,255,0.9), -0.5px -0.5px 1px rgba(0,0,0,0.35)",
                                }}
                              >
                                {tile.text}
                              </span>
                              {showPinyinHint && matchType !== "HANZI_PINYIN" && (
                                <span className="text-[10px] sm:text-[11px] font-black text-[#047857] mt-0.5 font-mono truncate max-w-full">
                                  {tile.subtext}
                                </span>
                              )}
                            </>
                          ) : tile.type === "pinyin" ? (
                            <div className="flex flex-col items-center justify-center px-0.5 max-w-full">
                              <span
                                className="text-sm sm:text-lg md:text-xl font-black text-[#047857] font-mono tracking-wide text-center truncate max-w-full"
                                style={{
                                   textShadow: "0.5px 0.5px 0px rgba(255,255,255,0.9), -0.5px -0.5px 1px rgba(0,0,0,0.25)",
                                }}
                              >
                                {tile.text}
                              </span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center px-0.5 max-w-full">
                              <span className="text-[10px] sm:text-xs md:text-sm font-black text-[#0F172A] line-clamp-3 leading-tight text-center">
                                {tile.text}
                              </span>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ========================================================================= */}
            {/* BELOW TABLE: SINGLE SLEEK UNIFIED CONTROL TOOLBAR */}
            {/* ========================================================================= */}
            <div className="w-full max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 sm:px-6 py-3 shadow-sm">
              
              {/* 1. LEFT STATS: TIMER & SCORE */}
              <div className="flex items-center gap-3">
                <div className={`flex items-center gap-1.5 text-xs font-mono font-bold ${
                  timeLeft <= 15 ? "text-rose-600 animate-pulse font-black" : "text-slate-800"
                }`}>
                  <Timer size={15} className="text-red-600" />
                  <span>{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}</span>
                </div>

                <div className="h-4 w-px bg-slate-200"></div>

                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-800">
                  <Sparkles size={15} className="text-red-600" />
                  <span className="text-red-600 font-black">{score}</span>
                </div>

                <div className="hidden sm:block h-4 w-px bg-slate-200"></div>

                <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-slate-500 font-mono">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  <span>{correctMatches}/{tiles.length / 2}</span>
                </div>

                {combo >= 2 && (
                  <span className="px-2 py-0.5 rounded-md bg-red-50 text-red-700 text-xs font-bold font-mono animate-pulse">
                    x{combo}
                  </span>
                )}
              </div>

              {/* 2. CENTER: MINIMAL POWER-UP PILLS */}
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                {/* 1. Hint */}
                <button
                  type="button"
                  onClick={handleUseHint}
                  disabled={hintCharges <= 0}
                  className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 hover:border-red-500 hover:text-red-600 text-slate-700 text-xs font-semibold bg-white transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                  title="Gợi ý 1 cặp thẻ hợp lệ đang mở"
                >
                  <Eye size={14} />
                  <span>Gợi ý</span>
                  <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-red-50 text-red-700 text-[10px] font-bold font-mono">
                    {hintCharges}
                  </span>
                </button>

                {/* 2. Shuffle */}
                <button
                  type="button"
                  onClick={handleUseShuffle}
                  disabled={shuffleCharges <= 0}
                  className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 hover:border-red-500 hover:text-red-600 text-slate-700 text-xs font-semibold bg-white transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                  title="Xáo trộn lại toàn bộ các quân bài"
                >
                  <Shuffle size={14} />
                  <span>Xáo bài</span>
                  <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold font-mono">
                    {shuffleCharges}
                  </span>
                </button>

                {/* 3. Lightning */}
                <button
                  type="button"
                  onClick={handleUseLightning}
                  disabled={lightningCharges <= 0}
                  className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 hover:border-red-500 hover:text-red-600 text-slate-700 text-xs font-semibold bg-white transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                  title="Triệu hồi sấm sét tiêu diệt ngay 1 cặp thẻ"
                >
                  <Zap size={14} />
                  <span>Sét đánh</span>
                  <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold font-mono">
                    {lightningCharges}
                  </span>
                </button>

                {/* 4. Time Boost */}
                <button
                  type="button"
                  onClick={handleUseTimeBoost}
                  disabled={timeCharges <= 0}
                  className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 hover:border-red-500 hover:text-red-600 text-slate-700 text-xs font-semibold bg-white transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                  title="Cộng thêm 15 giây thời gian"
                >
                  <Clock size={14} />
                  <span>+15s</span>
                  <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold font-mono">
                    {timeCharges}
                  </span>
                </button>
              </div>

              {/* 3. RIGHT: UTILITY ACTIONS */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Mute Button */}
                <button
                  type="button"
                  onClick={() => {
                    const next = sound.toggleMute();
                    setIsMuted(next);
                  }}
                  className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition cursor-pointer"
                  title={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
                >
                  {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>

                {/* Replay */}
                <button
                  type="button"
                  onClick={initGameBoard}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
                  title="Chơi lại ván này"
                >
                  <RotateCcw size={13} />
                  <span className="hidden sm:inline">Chơi lại</span>
                </button>

                {/* Change Mode */}
                <button
                  type="button"
                  onClick={() => setGameState("CONFIG")}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
                >
                  Đổi chế độ
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STATE 3: NATURAL ELEGANT VICTORY SCREEN (LIGHT THEME) */}
        {/* ========================================================================= */}
        {gameState === "VICTORY" && (
          <div className="p-8 sm:p-14 text-center space-y-7 animate-fadeIn max-w-lg mx-auto flex flex-col items-center">
            
            {/* Arched 3-Star Cluster */}
            <div className="relative flex items-end justify-center gap-3 pb-2 pt-4">
              <div className="translate-y-2 transform -rotate-12 transition-transform duration-500">
                <Star
                  size={36}
                  className="text-amber-400 fill-amber-400 drop-shadow-md animate-pulse"
                />
              </div>

              <div className="-translate-y-2 transform scale-125 transition-transform duration-500">
                <Star
                  size={50}
                  className="text-amber-400 fill-amber-400 drop-shadow-lg"
                />
              </div>

              <div className="translate-y-2 transform rotate-12 transition-transform duration-500">
                <Star
                  size={36}
                  className="text-amber-400 fill-amber-400 drop-shadow-md animate-pulse"
                />
              </div>
            </div>

            {/* Victory Title & Subtitle */}
            <div className="space-y-2">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                Hoàn Thành Xuất Sắc!
              </h2>
              <p className="text-sm text-slate-600">
                Bạn đã dọn sạch toàn bộ bàn Mạt Chược từ vựng <span className="text-red-600 font-bold">{selectedLevel}</span>!
              </p>
            </div>

            {/* Unified Clean Stats Bar */}
            <div className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 px-6 grid grid-cols-4 divide-x divide-slate-200 shadow-sm">
              {/* Stat 1: Điểm số */}
              <div className="text-center px-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                  Điểm số
                </span>
                <span className="text-xl sm:text-2xl font-black text-red-600 font-mono block">
                  {score}
                </span>
              </div>

              {/* Stat 2: Lượt bốc */}
              <div className="text-center px-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                  Lượt bốc
                </span>
                <span className="text-xl sm:text-2xl font-black text-slate-800 font-mono block">
                  {moves}
                </span>
              </div>

              {/* Stat 3: Combo */}
              <div className="text-center px-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                  Combo
                </span>
                <span className="text-xl sm:text-2xl font-black text-emerald-600 font-mono block">
                  x{maxCombo}
                </span>
              </div>

              {/* Stat 4: Thời gian dư */}
              <div className="text-center px-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                  Thời gian
                </span>
                <span className="text-xl sm:text-2xl font-black text-sky-600 font-mono block">
                  {timeLeft}s
                </span>
              </div>
            </div>

            {/* Reward Badges */}
            <div className="flex items-center justify-center gap-3">
              <div className="flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-4 py-1.5 text-xs font-mono font-bold text-red-700 shadow-sm">
                <Sparkles size={14} className="text-red-600" />
                <span>+{Math.floor(score / 20) + 80} EXP</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-mono font-bold text-emerald-700 shadow-sm">
                <Award size={14} className="text-emerald-600" />
                <span>+{15 + (combo >= 4 ? 10 : 0)} GEMS</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={initGameBoard}
                className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-600 text-white px-8 py-3.5 text-sm font-bold hover:bg-red-700 active:scale-95 transition cursor-pointer shadow-md"
              >
                <RotateCcw size={16} />
                <span>Chơi tiếp ván mới</span>
              </button>
              <button
                type="button"
                onClick={() => setGameState("CONFIG")}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-sm"
              >
                <span>Đổi chế độ</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STATE 4: TIMEOUT SCREEN (LIGHT THEME) */}
        {/* ========================================================================= */}
        {gameState === "TIMEOUT" && (
          <div className="p-8 sm:p-14 text-center space-y-7 animate-fadeIn max-w-md mx-auto flex flex-col items-center">
            
            {/* Header Emblem */}
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-rose-200 bg-rose-50 text-rose-600 shadow-sm">
              <ShieldAlert size={36} />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Hết Giờ Thi Đấu!
              </h2>
              <p className="text-xs text-slate-600 max-w-xs mx-auto">
                Đồng hồ đã điểm 0. Hãy dùng các bảo bối Gợi Ý và Sét Đánh nhanh hơn ở ván sau nhé!
              </p>
            </div>

            {/* Simple Clean Stats */}
            <div className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 px-6 grid grid-cols-2 divide-x divide-slate-200">
              <div className="text-center px-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                  Điểm đạt được
                </span>
                <span className="text-2xl font-black text-red-600 font-mono">
                  {score}
                </span>
              </div>
              <div className="text-center px-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                  Cặp đã ghép
                </span>
                <span className="text-2xl font-black text-slate-800 font-mono">
                  {correctMatches} / {tiles.length / 2}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
              <button
                type="button"
                onClick={initGameBoard}
                className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-600 text-white px-8 py-3.5 text-sm font-bold hover:bg-red-700 active:scale-95 transition cursor-pointer shadow-md"
              >
                <RotateCcw size={16} />
                <span>Thử lại ván này</span>
              </button>
              <button
                type="button"
                onClick={() => setGameState("CONFIG")}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-6 py-3.5 text-sm font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <span>Đổi chế độ</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
