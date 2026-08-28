/**
 * Web Audio Synthesizer Engine
 * Tạo âm thanh tương tác trực tiếp bằng Web Audio API - không phụ thuộc file mp3 ngoài,
 * phản hồi tức thì và hoạt động mượt mà trên mọi thiết bị.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private initCtx() {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public toggleMute() {
    this.isMuted = !this.isMuted;
    if (typeof window !== "undefined") {
      localStorage.setItem("hsk_sound_muted", this.isMuted ? "1" : "0");
    }
    return this.isMuted;
  }

  public getMuted() {
    if (typeof window !== "undefined" && !this.isMuted) {
      this.isMuted = localStorage.getItem("hsk_sound_muted") === "1";
    }
    return this.isMuted;
  }

  /**
   * Âm thanh chiêng/gong vang trầm sâu lắng đậm chất cổ phong hoàng gia
   */
  public playGong() {
    if (this.getMuted()) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "sine";
      osc2.type = "triangle";
      osc1.frequency.setValueAtTime(261.63, now); // C4
      osc2.frequency.setValueAtTime(392.0, now); // G4

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 1.2);
      osc2.stop(now + 1.2);
    } catch {
      // Audio context error ignore
    }
  }

  /**
   * Âm thanh trả lời đúng: Nốt Ding trong trẻo 2 nốt cao
   */
  public playCorrect() {
    if (this.getMuted()) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880, now + 0.08); // A5
      osc.frequency.setValueAtTime(1174.66, now + 0.16); // D6

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch {
      // Audio context error ignore
    }
  }

  /**
   * Âm thanh trả lời sai: Nốt Buzz trầm ngắn
   */
  public playIncorrect() {
    if (this.getMuted()) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.setValueAtTime(130, now + 0.1);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch {
      // Audio context error ignore
    }
  }

  /**
   * Âm thanh gõ mõ / gõ phách gỗ thư thái khi lật thẻ / click nét vẽ
   */
  public playWoodblock() {
    if (this.getMuted()) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.06);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch {
      // Audio context error ignore
    }
  }

  /**
   * Âm thanh chuông đàn tranh / chuông đồng ngân vang
   */
  public playGuzhengHarp(noteIndex: number = 0) {
    if (this.getMuted()) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    // Ngũ cung (Pentatonic scale: C, D, E, G, A)
    const pentatonicFrequencies = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
    const freq = pentatonicFrequencies[noteIndex % pentatonicFrequencies.length];

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.6);
    } catch {
      // Audio context error ignore
    }
  }

  /**
   * Âm thanh Combo nổ chuỗi liên hoàn
   */
  public playCombo(comboCount: number) {
    if (this.getMuted()) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const baseFreq = 440 + Math.min(comboCount * 70, 600);

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.setValueAtTime(baseFreq * 1.25, now + 0.08);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch {
      // Audio context error ignore
    }
  }

  /**
   * Âm thanh nhận vàng / Kim cương leng keng
   */
  public playCoin() {
    if (this.getMuted()) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "sine";
      osc2.type = "sine";
      osc1.frequency.setValueAtTime(987.77, now); // B5
      osc1.frequency.setValueAtTime(1318.51, now + 0.08); // E6
      osc2.frequency.setValueAtTime(1318.51, now + 0.08);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now + 0.08);
      osc1.stop(now + 0.4);
      osc2.stop(now + 0.4);
    } catch {
      // Audio context error ignore
    }
  }

  /**
   * Âm thanh Thăng Cấp (Level Up / Victory Fanfare)
   */
  public playLevelUp() {
    if (this.getMuted()) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const notes = [
      { f: 523.25, t: 0 },    // C5
      { f: 659.25, t: 0.1 },  // E5
      { f: 783.99, t: 0.2 },  // G5
      { f: 1046.5, t: 0.3 },  // C6
      { f: 1318.51, t: 0.45 } // E6 ngân dài
    ];

    try {
      const now = ctx.currentTime;
      notes.forEach(({ f, t }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(f, now + t);

        gain.gain.setValueAtTime(0.2, now + t);
        gain.gain.exponentialRampToValueAtTime(0.001, now + t + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + t);
        osc.stop(now + t + 0.4);
      });
    } catch {
      // Audio context error ignore
    }
  }

  /**
   * Âm thanh bắn tia Laser Plasma (ZType Space Shooter)
   */
  public playLaser() {
    if (this.getMuted()) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.08);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch {}
  }

  /**
   * Âm thanh bom nổ / thiên thạch phát nổ (Explosion)
   */
  public playExplosion() {
    if (this.getMuted()) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.25);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch {}
  }

  /**
   * Âm thanh Chiến Thắng Vang Dội (Victory Fanfare)
   */
  public playVictory() {
    if (this.getMuted()) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const notes = [
      { f: 523.25, t: 0 },
      { f: 659.25, t: 0.12 },
      { f: 783.99, t: 0.24 },
      { f: 1046.5, t: 0.36 },
      { f: 1174.66, t: 0.48 },
      { f: 1318.51, t: 0.62 },
    ];

    try {
      const now = ctx.currentTime;
      notes.forEach(({ f, t }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(f, now + t);

        gain.gain.setValueAtTime(0.25, now + t);
        gain.gain.exponentialRampToValueAtTime(0.001, now + t + 0.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + t);
        osc.stop(now + t + 0.5);
      });
    } catch {}
  }

  /**
   * Âm thanh Rồng vỗ cánh bay lên (Flappy Dragon Wing Flap)
   */
  public playFlap() {
    if (this.getMuted()) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(540, now + 0.08);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.1);
    } catch {}
  }

  /**
   * Âm thanh vượt Cổng Rồng thành công (Dragon Gate Chime)
   */
  public playDragonGate() {
    if (this.getMuted()) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "triangle";
      osc2.type = "sine";
      osc1.frequency.setValueAtTime(783.99, now); // G5
      osc1.frequency.setValueAtTime(1046.5, now + 0.08); // C6
      osc2.frequency.setValueAtTime(1318.51, now + 0.08); // E6

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.45);
      osc2.stop(now + 0.45);
    } catch {}
  }

  /**
   * Âm thanh vỡ khiên / va chạm chướng ngại vật (Shatter Crash)
   */
  public playShieldBreak() {
    if (this.getMuted()) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.2);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.2);
    } catch {}
  }
}

export const sound = new SoundEngine();
