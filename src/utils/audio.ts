// Web Audio API synthesizer for board game sound effects
class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.isMuted) {
      this.stopVictorySound();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // Click / tick sound for roulette spinning
  public playRouletteTick(speedRatio: number = 1) {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Pitch slightly raises or varies with speed
      const freq = 600 + Math.random() * 200 + (1 - speedRatio) * 150;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch {
      // Audio might fail in silent environments, safe to ignore
    }
  }

  // Crisp UI button click sound
  public playClickSound() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch {}
  }

  // Step sound when pawn jumps forward one house
  public playStepSound() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(520, this.ctx.currentTime + 0.07);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.09);
    } catch {}
  }

  // Money gain / pleasant reward sound
  public playCashSound() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';

      osc1.frequency.setValueAtTime(987.77, now); // B5
      osc1.frequency.setValueAtTime(1318.51, now + 0.08); // E6

      osc2.frequency.setValueAtTime(1318.51, now);
      osc2.frequency.setValueAtTime(1975.53, now + 0.08); // B6

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.35);
      osc2.stop(now + 0.35);
    } catch {}
  }

  // Loss / penalty sound
  public playLossSound() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.25);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch {}
  }

  // Fanfare when a player finishes or wins
  public playFanfare() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      const now = this.ctx.currentTime;

      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);

        gain.gain.setValueAtTime(0, now + idx * 0.1);
        gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.1 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + (idx === 3 ? 0.6 : 0.2));

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + (idx === 3 ? 0.65 : 0.25));
      });
    } catch {}
  }

  // Spin start whoosh
  public playSpinStart() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(200, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.2);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch {}
  }

  // Dramatic suspense reveal sound for ranking positions
  public playRevealSound(stepOrder: number = 1) {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const baseFreq = 260 + Math.min(stepOrder * 45, 500);

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.15);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch {}
  }

  // Award ceremony jingle when bonus is announced
  public playAwardTrumpet() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const chords = [440, 554.37, 659.25]; // A major triad

      chords.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.12, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.42);
      });
    } catch {}
  }

  // Suspense Drumroll when 1st and 2nd place are about to be revealed together
  public playDrumrollSuspense(durationSeconds: number = 2.2) {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const bufferSize = Math.floor(this.ctx.sampleRate * durationSeconds);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);

      // Generate noise bursts that increase in frequency (snare drumroll roll)
      for (let i = 0; i < bufferSize; i++) {
        const t = i / this.ctx.sampleRate;
        const progress = t / durationSeconds;
        // Frequency of strike pulses increases from 12Hz to 32Hz
        const pulseRate = 14 + progress * 24;
        const pulse = Math.sin(2 * Math.PI * pulseRate * t);
        const envelope = Math.pow(progress, 1.4); // crescendo
        const noise = (Math.random() * 2 - 1) * (pulse > 0 ? 1 : 0.2);
        data[i] = noise * envelope * 0.35;
      }

      const noiseNode = this.ctx.createBufferSource();
      noiseNode.buffer = buffer;

      // Bandpass filter to make it sound like a snare drum skin
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(380, now);
      filter.frequency.linearRampToValueAtTime(650, now + durationSeconds);
      filter.Q.setValueAtTime(3.5, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.linearRampToValueAtTime(0.5, now + durationSeconds - 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + durationSeconds);

      noiseNode.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noiseNode.start(now);
      noiseNode.stop(now + durationSeconds);
    } catch {}
  }

  // Suspense heartbeat pulse
  public playHeartbeatSuspense() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const beats = [0, 0.22];

      beats.forEach((offset) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(68, now + offset);
        osc.frequency.exponentialRampToValueAtTime(36, now + offset + 0.14);

        gain.gain.setValueAtTime(0.3, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.16);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now + offset);
        osc.stop(now + offset + 0.18);
      });
    } catch {}
  }

  // =========================================================================
  // SOM GENÉRICO DE VITÓRIA / FANFARRA TRIUNFAL DO CAMPEÃO
  // =========================================================================
  private victoryMasterGain: GainNode | null = null;
  private victoryTimeouts: number[] = [];
  private isVictoryActive: boolean = false;
  private victoryOnEndCallback: (() => void) | null = null;

  public isVictoryPlaying(): boolean {
    return this.isVictoryActive;
  }

  public isSennaPlaying(): boolean {
    return this.isVictoryActive;
  }

  public stopVictorySound() {
    this.victoryTimeouts.forEach((id) => clearTimeout(id));
    this.victoryTimeouts = [];

    if (this.victoryMasterGain && this.ctx) {
      try {
        const now = this.ctx.currentTime;
        this.victoryMasterGain.gain.cancelScheduledValues(now);
        this.victoryMasterGain.gain.linearRampToValueAtTime(0, now + 0.08);
      } catch {}
    }

    if (this.isVictoryActive) {
      this.isVictoryActive = false;
      if (this.victoryOnEndCallback) {
        const cb = this.victoryOnEndCallback;
        this.victoryOnEndCallback = null;
        try {
          cb();
        } catch {}
      }
    }
  }

  public stopSennaVictoryTheme() {
    this.stopVictorySound();
  }

  public playVictoryFanfare(onEnd?: () => void) {
    if (this.isMuted) return;
    this.stopVictorySound();
    this.playGenericVictorySynth(onEnd);
  }

  public playSennaVictoryTheme(onEnd?: () => void) {
    this.playVictoryFanfare(onEnd);
  }

  public setCustomVictoryAudio(_url: string | null) {}
  public getCustomVictoryAudio(): string | null { return null; }

  private playGenericVictorySynth(onEnd?: () => void) {
    try {
      this.initCtx();
      if (!this.ctx) return;

      this.isVictoryActive = true;
      this.victoryOnEndCallback = onEnd || null;

      const ctx = this.ctx;
      const t0 = ctx.currentTime + 0.04;

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.30, t0);
      masterGain.connect(ctx.destination);
      this.victoryMasterGain = masterGain;

      const F = {
        C3: 130.81, G3: 196.00,
        C4: 261.63, E4: 329.63, G4: 392.00, A4: 440.00, B4: 493.88,
        C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00, B5: 987.77,
        C6: 1046.50, E6: 1318.51, G6: 1567.98
      };

      const playBrass = (freq: number, start: number, dur: number, vol: number = 0.22) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(freq, t0 + start);

        g.gain.setValueAtTime(0.001, t0 + start);
        g.gain.linearRampToValueAtTime(vol, t0 + start + 0.03);
        g.gain.setValueAtTime(vol * 0.9, t0 + start + dur * 0.7);
        g.gain.exponentialRampToValueAtTime(0.001, t0 + start + dur);

        osc.connect(g);
        g.connect(masterGain);
        osc.start(t0 + start);
        osc.stop(t0 + start + dur + 0.04);
      };

      const playChime = (freq: number, start: number, dur: number = 0.8) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, t0 + start);

        g.gain.setValueAtTime(0.12, t0 + start);
        g.gain.exponentialRampToValueAtTime(0.001, t0 + start + dur);

        osc.connect(g);
        g.connect(masterGain);
        osc.start(t0 + start);
        osc.stop(t0 + start + dur + 0.02);
      };

      const playTimpani = (freq: number, start: number) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, t0 + start);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.6, t0 + start + 0.5);

        g.gain.setValueAtTime(0.35, t0 + start);
        g.gain.exponentialRampToValueAtTime(0.001, t0 + start + 0.6);

        osc.connect(g);
        g.connect(masterGain);
        osc.start(t0 + start);
        osc.stop(t0 + start + 0.65);
      };

      // 1. Opening heraldry fanfare
      playTimpani(F.C3, 0.0);
      playBrass(F.C5, 0.00, 0.14, 0.25);
      playBrass(F.C5, 0.18, 0.14, 0.25);
      playBrass(F.C5, 0.36, 0.14, 0.25);
      playBrass(F.G5, 0.54, 0.45, 0.30);
      playBrass(F.E4, 0.54, 0.45, 0.20);
      playBrass(F.C4, 0.54, 0.45, 0.20);
      playChime(F.C6, 0.54);

      // 2. Rising triumphant phrase
      playTimpani(F.G3, 1.05);
      playBrass(F.E5, 1.05, 0.16, 0.24);
      playBrass(F.F5, 1.25, 0.16, 0.24);
      playBrass(F.G5, 1.45, 0.22, 0.26);
      playBrass(F.A5, 1.70, 0.22, 0.28);
      playBrass(F.B5, 1.95, 0.22, 0.30);

      // 3. Grand climax chord (C Major)
      const tClimax = 2.25;
      const climaxDuration = 2.6;

      playTimpani(F.C3, tClimax);
      playBrass(F.C4, tClimax, climaxDuration, 0.20);
      playBrass(F.G4, tClimax, climaxDuration, 0.20);
      playBrass(F.C5, tClimax, climaxDuration, 0.25);
      playBrass(F.E5, tClimax, climaxDuration, 0.28);
      playBrass(F.G5, tClimax, climaxDuration, 0.30);
      playBrass(F.C6, tClimax, climaxDuration, 0.34);

      playChime(F.C6, tClimax, 1.5);
      playChime(F.E6, tClimax + 0.2, 1.5);
      playChime(F.G6, tClimax + 0.4, 1.8);
      playChime(F.C6, tClimax + 0.6, 1.8);

      const totalDurationMs = Math.round((tClimax + climaxDuration + 0.3) * 1000);
      const endTimer = window.setTimeout(() => {
        this.isVictoryActive = false;
        if (this.victoryOnEndCallback) {
          const cb = this.victoryOnEndCallback;
          this.victoryOnEndCallback = null;
          cb();
        }
      }, totalDurationMs);

      this.victoryTimeouts.push(endTimer);
    } catch {
      this.isVictoryActive = false;
    }
  }
}

export const sound = new SoundEngine();

