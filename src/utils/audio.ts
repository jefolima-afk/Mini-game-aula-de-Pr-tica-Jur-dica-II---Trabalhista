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
    if (this.sennaAudioElement) {
      this.sennaAudioElement.muted = muted;
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
  // TEMA DA VITÓRIA (AYRTON SENNA / EDUARDO SOUTO NETO)
  // =========================================================================
  private sennaAudioElement: HTMLAudioElement | null = null;
  private sennaMasterGain: GainNode | null = null;
  private sennaTimeouts: number[] = [];
  private isSennaActive: boolean = false;
  private sennaOnEndCallback: (() => void) | null = null;
  private customVictoryAudioUrl: string | null = null;

  public setCustomVictoryAudio(url: string | null) {
    this.customVictoryAudioUrl = url;
  }

  public getCustomVictoryAudio(): string | null {
    return this.customVictoryAudioUrl;
  }

  public isSennaPlaying(): boolean {
    return this.isSennaActive;
  }

  public stopSennaVictoryTheme() {
    this.sennaTimeouts.forEach((id) => clearTimeout(id));
    this.sennaTimeouts = [];

    if (this.sennaAudioElement) {
      try {
        this.sennaAudioElement.pause();
        this.sennaAudioElement.currentTime = 0;
        this.sennaAudioElement.onended = null;
        this.sennaAudioElement.onerror = null;
      } catch {}
      this.sennaAudioElement = null;
    }

    if (this.sennaMasterGain && this.ctx) {
      try {
        const now = this.ctx.currentTime;
        this.sennaMasterGain.gain.cancelScheduledValues(now);
        this.sennaMasterGain.gain.linearRampToValueAtTime(0, now + 0.08);
      } catch {}
    }

    if (this.isSennaActive) {
      this.isSennaActive = false;
      if (this.sennaOnEndCallback) {
        const cb = this.sennaOnEndCallback;
        this.sennaOnEndCallback = null;
        try {
          cb();
        } catch {}
      }
    }
  }

  public playSennaVictoryTheme(onEnd?: () => void) {
    if (this.isMuted) return;

    // Stop any existing playback first
    this.stopSennaVictoryTheme();

    this.isSennaActive = true;
    this.sennaOnEndCallback = onEnd || null;

    try {
      // Play the real authentic audio file (Roupa Nova / Eduardo Souto Neto)
      const audioSrc = this.customVictoryAudioUrl || '/audio/tema_da_vitoria.mp3';
      const audio = new Audio(audioSrc);
      audio.volume = 0.88;
      audio.muted = this.isMuted;
      this.sennaAudioElement = audio;

      audio.onended = () => {
        this.isSennaActive = false;
        this.sennaAudioElement = null;
        if (this.sennaOnEndCallback) {
          const cb = this.sennaOnEndCallback;
          this.sennaOnEndCallback = null;
          cb();
        }
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Real audio playback failed, falling back to Web Audio synth:', err);
          this.playSennaSynthFallback(onEnd);
        });
      }
    } catch {
      this.playSennaSynthFallback(onEnd);
    }
  }

  private playSennaSynthFallback(onEnd?: () => void) {
    try {
      this.initCtx();
      if (!this.ctx) return;

      this.isSennaActive = true;
      this.sennaOnEndCallback = onEnd || null;

      const ctx = this.ctx;
      const startTime = ctx.currentTime + 0.05;

      // Master gain for the Senna Victory track
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.26, startTime);
      masterGain.connect(ctx.destination);
      this.sennaMasterGain = masterGain;

      // Brass Lowpass Filter to recreate that warm 80s/90s FM/Analog brass synthesizer sound
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2400, startTime);
      filter.Q.setValueAtTime(2.0, startTime);
      filter.connect(masterGain);

      // Helper to play a single brass melody note with dual detuned oscillators (chorus effect)
      const playBrassNote = (freq: number, startOffset: number, duration: number, vol = 0.22) => {
        const noteStart = startTime + startOffset;
        const noteEnd = noteStart + duration;

        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const noteGain = ctx.createGain();

        osc1.type = 'sawtooth';
        osc2.type = 'sawtooth';

        osc1.frequency.setValueAtTime(freq, noteStart);
        osc2.frequency.setValueAtTime(freq * 1.0025, noteStart); // Subtle detune for rich brass

        // Envelope: punchy brass attack (0.015s), sustained presence, clean release
        noteGain.gain.setValueAtTime(0, noteStart);
        noteGain.gain.linearRampToValueAtTime(vol, noteStart + 0.018);
        noteGain.gain.setValueAtTime(vol * 0.88, noteStart + duration * 0.7);
        noteGain.gain.exponentialRampToValueAtTime(0.001, noteEnd);

        osc1.connect(noteGain);
        osc2.connect(noteGain);
        noteGain.connect(filter);

        osc1.start(noteStart);
        osc2.start(noteStart);
        osc1.stop(noteEnd + 0.02);
        osc2.stop(noteEnd + 0.02);
      };

      // Helper to play harmony chord
      const playChord = (freqs: number[], startOffset: number, duration: number, vol = 0.09) => {
        const noteStart = startTime + startOffset;
        const noteEnd = noteStart + duration;

        freqs.forEach((freq) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, noteStart);

          gain.gain.setValueAtTime(0, noteStart);
          gain.gain.linearRampToValueAtTime(vol, noteStart + 0.03);
          gain.gain.setValueAtTime(vol * 0.85, noteStart + duration * 0.8);
          gain.gain.exponentialRampToValueAtTime(0.001, noteEnd);

          osc.connect(gain);
          gain.connect(filter);

          osc.start(noteStart);
          osc.stop(noteEnd + 0.02);
        });
      };

      // Helper to play punchy synth bass note
      const playBass = (freq: number, startOffset: number, duration: number, vol = 0.28) => {
        const noteStart = startTime + startOffset;
        const noteEnd = noteStart + duration;

        const osc = ctx.createOscillator();
        const bassGain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, noteStart);

        bassGain.gain.setValueAtTime(0, noteStart);
        bassGain.gain.linearRampToValueAtTime(vol, noteStart + 0.01);
        bassGain.gain.exponentialRampToValueAtTime(0.001, noteEnd);

        osc.connect(bassGain);
        bassGain.connect(masterGain);

        osc.start(noteStart);
        osc.stop(noteEnd + 0.02);
      };

      // Helper for drum beat (kick + snare/hihat)
      const playDrumHit = (startOffset: number, isKick: boolean) => {
        const hitStart = startTime + startOffset;
        if (isKick) {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(140, hitStart);
          osc.frequency.exponentialRampToValueAtTime(38, hitStart + 0.09);
          g.gain.setValueAtTime(0.3, hitStart);
          g.gain.exponentialRampToValueAtTime(0.001, hitStart + 0.1);
          osc.connect(g);
          g.connect(masterGain);
          osc.start(hitStart);
          osc.stop(hitStart + 0.11);
        } else {
          // Snare / high pop
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(450, hitStart);
          osc.frequency.exponentialRampToValueAtTime(120, hitStart + 0.06);
          g.gain.setValueAtTime(0.18, hitStart);
          g.gain.exponentialRampToValueAtTime(0.001, hitStart + 0.07);
          osc.connect(g);
          g.connect(masterGain);
          osc.start(hitStart);
          osc.stop(hitStart + 0.08);
        }
      };

      // Frequencies definition according to D Major sheet music
      const F = {
        D2: 73.42,
        E2: 82.41,
        F2: 87.31,
        Fs2: 92.50, // F#2
        G2: 98.00,
        Gs2: 103.83, // G#2
        A2: 110.00,
        Bb2: 116.54,
        B2: 123.47,
        C3: 130.81,
        Cs3: 138.59, // C#3
        D3: 146.83,
        Ds3: 155.56, // D#3
        E3: 164.81,
        F3: 174.61,
        Fs3: 185.00, // F#3
        G3: 196.00,
        Gs3: 207.65, // G#3
        A3: 220.00,
        Bb3: 233.08,
        B3: 246.94,
        C4: 261.63,
        Cs4: 277.18, // C#4
        D4: 293.66,
        Ds4: 311.13, // D#4
        E4: 329.63,
        F4: 349.23,
        Fs4: 369.99, // F#4
        G4: 392.00,
        Gs4: 415.30, // G#4
        A4: 440.00,
        Bb4: 466.16,
        B4: 493.88,
        C5: 523.25,
        Cs5: 554.37, // C#5
        D5: 587.33,
        Ds5: 622.25, // D#5
        E5: 659.25,
        F5: 698.46,
        Fs5: 739.99, // F#5
        G5: 783.99,
        Gs5: 830.61, // G#5
        A5: 880.00,
        Bb5: 932.33,
        B5: 987.77,
        C6: 1046.50,
        Cs6: 1108.73, // C#6
        D6: 1174.66,
      };

      // Chords according to the Eduardo Souto Neto score (in D Major)
      const CHORD_D = [F.Fs4, F.A4, F.D5];        // D Major
      const CHORD_D_LOW = [F.D4, F.Fs4, F.A4];    // D Major lower inversion
      const CHORD_EM7 = [F.G4, F.B4, F.E5];       // Em7
      const CHORD_A7 = [F.G4, F.Cs5, F.E5];       // A7
      const CHORD_D7 = [F.Fs4, F.C5, F.D5];       // D7
      const CHORD_G = [F.G4, F.B4, F.D5];         // G Major
      const CHORD_GM = [F.G4, F.Bb4, F.D5];       // Gm (with Bb accidental)
      const CHORD_B7 = [F.Ds4, F.Fs4, F.B4, F.Ds5]; // B7
      const CHORD_EM = [F.E4, F.G4, F.B4, F.E5];  // Em

      // Beat duration math: Moderato/Allegro (~125 BPM)
      // 1 measure (4 beats) = ~1.92s, 1 beat (quarter note) = ~0.48s, 1 eighth note = ~0.24s
      const B = 0.48; // Quarter note
      const E = 0.24; // Eighth note
      const M = B * 4; // 1 full measure = 1.92s

      // =======================================================================
      // 1. INTRO (COMPASSOS 1 A 4 DA PARTITURA)
      // =======================================================================
      // Compasso 1 (Intro - Dal Segno):
      // Clave de Sol: Pausa de semínima, colcheia [G4, B4, E5] >, pausa colcheia, colcheia [G4, B4, E5] >
      playChord(CHORD_EM7, 0 * M + B, E * 0.9, 0.22);
      playBrassNote(F.E5, 0 * M + B, E * 0.85, 0.24);
      playDrumHit(0 * M + B, true);

      playChord(CHORD_EM7, 0 * M + B + 2 * E, E * 0.9, 0.22);
      playBrassNote(F.E5, 0 * M + B + 2 * E, E * 0.85, 0.24);
      playDrumHit(0 * M + B + 2 * E, false);

      playBass(F.D2, 0 * M, M * 0.95, 0.35);

      // Compasso 2:
      // Clave de Sol: colcheia [Fs4, A4, D5] >, pausa colcheia, colcheia [Fs4, A4, D5] >, mínima pontuada [Fs4, A4, D5] ligada
      playChord(CHORD_D, 1 * M + 0, E * 0.9, 0.25);
      playBrassNote(F.D5, 1 * M + 0, E * 0.85, 0.26);
      playBass(F.D3, 1 * M + 0, E, 0.30);
      playDrumHit(1 * M + 0, true);

      playChord(CHORD_D, 1 * M + 2 * E, E * 0.9, 0.25);
      playBrassNote(F.D5, 1 * M + 2 * E, E * 0.85, 0.26);
      playBass(F.D3, 1 * M + 2 * E, E, 0.30);
      playDrumHit(1 * M + 2 * E, false);

      // Mínima pontuada sustentada
      playChord(CHORD_D, 1 * M + 3 * E, B * 2.5, 0.28);
      playBrassNote(F.D5, 1 * M + 3 * E, B * 2.5, 0.28);
      playBass(F.D2, 1 * M + 3 * E, B * 2.5, 0.35);
      playDrumHit(1 * M + 3 * E, true);

      // Compasso 3:
      // Clave de Sol: Pausa de semínima, colcheia [G4, Cs5, E5] >, pausa colcheia, colcheia [G4, Cs5, E5] >
      playChord(CHORD_A7, 2 * M + B, E * 0.9, 0.22);
      playBrassNote(F.E5, 2 * M + B, E * 0.85, 0.24);
      playDrumHit(2 * M + B, true);

      playChord(CHORD_A7, 2 * M + B + 2 * E, E * 0.9, 0.22);
      playBrassNote(F.E5, 2 * M + B + 2 * E, E * 0.85, 0.24);
      playDrumHit(2 * M + B + 2 * E, false);

      playBass(F.D2, 2 * M, M * 0.95, 0.35);

      // Compasso 4 (To Coda):
      // Clave de Sol: colcheia [Fs4, A4, D5] >, pausa colcheia, colcheia [Fs4, A4, D5] >, mínima pontuada [Fs4, A4, D5]
      playChord(CHORD_D, 3 * M + 0, E * 0.9, 0.25);
      playBrassNote(F.D5, 3 * M + 0, E * 0.85, 0.26);
      playBass(F.D3, 3 * M + 0, E, 0.30);
      playDrumHit(3 * M + 0, true);

      playChord(CHORD_D, 3 * M + 2 * E, E * 0.9, 0.25);
      playBrassNote(F.D5, 3 * M + 2 * E, E * 0.85, 0.26);
      playBass(F.D3, 3 * M + 2 * E, E, 0.30);
      playDrumHit(3 * M + 2 * E, false);

      playChord(CHORD_D, 3 * M + 3 * E, B * 2.5, 0.28);
      playBrassNote(F.D5, 3 * M + 3 * E, B * 2.5, 0.28);
      playBass(F.D2, 3 * M + 3 * E, B * 2.5, 0.35);
      playDrumHit(3 * M + 3 * E, true);

      // =======================================================================
      // 2. SEÇÃO [A] (COMPASSOS 5 A 12 DA PARTITURA)
      // =======================================================================
      // Compasso 5:
      // Clave de Sol: D5 semibreve segurada!
      // Clave de Fá: D2 semibreve, contracanto de colcheias: A2, Cs3, D3
      const tSecA = 4 * M;
      playBrassNote(F.D5, tSecA + 0, M, 0.24);
      playBass(F.D2, tSecA + 0, M, 0.35);
      playDrumHit(tSecA + 0, true);
      playBass(F.A2, tSecA + 2 * E, E, 0.25);
      playBass(F.Cs3, tSecA + 3 * E, E, 0.25);
      playBass(F.D3, tSecA + 4 * E, E, 0.28);
      playDrumHit(tSecA + 4 * E, false);

      // Compasso 6:
      // Clave de Sol: Acorde D7 [Fs4, C5] e colcheias descendo: D5, Cs5, B4, A4
      const t6 = tSecA + 1 * M;
      playChord(CHORD_D7, t6 + 0, M * 0.9, 0.16);
      playBrassNote(F.D5, t6 + 0 * E, E * 0.95, 0.24);
      playBrassNote(F.Cs5, t6 + 1 * E, E * 0.95, 0.24);
      playBrassNote(F.B4, t6 + 2 * E, E * 0.95, 0.24);
      playBrassNote(F.A4, t6 + 3 * E, E * 1.8, 0.25);
      playBass(F.D2, t6 + 0, B * 2, 0.35);
      playDrumHit(t6 + 0, true);
      playDrumHit(t6 + 2 * E, false);

      // Compasso 7:
      // Clave de Sol: Acorde G semibreve [G4, B4, D5]
      // Clave de Fá: G2 semibreve, contracanto colcheias: D3, Fs3, G3
      const t7 = tSecA + 2 * M;
      playChord(CHORD_G, t7 + 0, M, 0.18);
      playBrassNote(F.B4, t7 + 0, M * 0.8, 0.22);
      playBass(F.G2, t7 + 0, M, 0.35);
      playDrumHit(t7 + 0, true);
      playBass(F.D3, t7 + 2 * E, E, 0.25);
      playBass(F.Fs3, t7 + 3 * E, E, 0.25);
      playBass(F.G3, t7 + 4 * E, E, 0.28);
      playDrumHit(t7 + 4 * E, false);

      // Compasso 8:
      // Clave de Sol: 4 colcheias: B4, A4, G4, Fs4
      const t8 = tSecA + 3 * M;
      playBrassNote(F.B4, t8 + 0 * E, E * 0.95, 0.24);
      playBrassNote(F.A4, t8 + 1 * E, E * 0.95, 0.24);
      playBrassNote(F.G4, t8 + 2 * E, E * 0.95, 0.24);
      playBrassNote(F.Fs4, t8 + 3 * E, E * 1.8, 0.25);
      playChord(CHORD_G, t8 + 0, M * 0.9, 0.16);
      playBass(F.G2, t8 + 0, B * 2, 0.35);
      playDrumHit(t8 + 0, true);
      playDrumHit(t8 + 2 * E, false);

      // Compasso 9:
      // Clave de Sol: Acorde Gm [G4, Bb4, D5] com Bb bemol (acidente na partitura)
      // Clave de Fá: G2, colcheias: D3, F3, G3
      const t9 = tSecA + 4 * M;
      playChord(CHORD_GM, t9 + 0, M, 0.20);
      playBrassNote(F.Bb4, t9 + 0, M * 0.8, 0.24);
      playBass(F.G2, t9 + 0, M, 0.35);
      playDrumHit(t9 + 0, true);
      playBass(F.D3, t9 + 2 * E, E, 0.25);
      playBass(F.F3, t9 + 3 * E, E, 0.25);
      playBass(F.G3, t9 + 4 * E, E, 0.28);
      playDrumHit(t9 + 4 * E, false);

      // Compasso 10:
      // Clave de Sol: 4 colcheias: Bb4, A4, G4, Fs4
      const t10 = tSecA + 5 * M;
      playBrassNote(F.Bb4, t10 + 0 * E, E * 0.95, 0.24);
      playBrassNote(F.A4, t10 + 1 * E, E * 0.95, 0.24);
      playBrassNote(F.G4, t10 + 2 * E, E * 0.95, 0.24);
      playBrassNote(F.Fs4, t10 + 3 * E, E * 1.8, 0.25);
      playChord(CHORD_GM, t10 + 0, M * 0.9, 0.16);
      playBass(F.G2, t10 + 0, B * 2, 0.35);
      playDrumHit(t10 + 0, true);
      playDrumHit(t10 + 2 * E, false);

      // Compasso 11:
      // Clave de Sol: Acorde D/A [Fs4, A4, D5], baixo A2
      const t11 = tSecA + 6 * M;
      playChord(CHORD_D, t11 + 0, M * 0.9, 0.22);
      playBrassNote(F.Fs4, t11 + 0, M * 0.8, 0.24);
      playBass(F.A2, t11 + 0, M, 0.35);
      playDrumHit(t11 + 0, true);
      playDrumHit(t11 + 2 * E, false);

      // Compasso 12:
      // Clave de Sol: Acorde A7 [G4, Cs5, E5], baixo A2 preparando Seção B
      const t12 = tSecA + 7 * M;
      playChord(CHORD_A7, t12 + 0, M * 0.9, 0.22);
      playBrassNote(F.E4, t12 + 0, M * 0.8, 0.24);
      playBass(F.A2, t12 + 0, M, 0.35);
      playDrumHit(t12 + 0, true);
      playDrumHit(t12 + 2 * E, false);

      // =======================================================================
      // 3. SEÇÃO [B] (COMPASSOS 13 A 19 DA PARTITURA)
      // =======================================================================
      const tSecB = t12 + 1 * M;

      // Compasso 13: Acorde D semibreve
      playChord(CHORD_D, tSecB + 0, M, 0.22);
      playBass(F.D2, tSecB + 0, M, 0.35);
      playDrumHit(tSecB + 0, true);

      // Compasso 14: Acorde G + colcheias subindo: D5, E5, Fs5, G5
      const t14 = tSecB + 1 * M;
      playChord(CHORD_G, t14 + 0, M, 0.18);
      playBrassNote(F.D5, t14 + 0 * E, E * 0.95, 0.24);
      playBrassNote(F.E5, t14 + 1 * E, E * 0.95, 0.24);
      playBrassNote(F.Fs5, t14 + 2 * E, E * 0.95, 0.24);
      playBrassNote(F.G5, t14 + 3 * E, E * 1.5, 0.26);
      playBass(F.G2, t14 + 0, M, 0.35);
      playDrumHit(t14 + 0, true);
      playDrumHit(t14 + 2 * E, false);

      // Compasso 15: Acorde B7 + colcheias: Fs5, Gs5, A5, B5
      const t15 = tSecB + 2 * M;
      playChord(CHORD_B7, t15 + 0, M, 0.18);
      playBrassNote(F.Fs5, t15 + 0 * E, E * 0.95, 0.24);
      playBrassNote(F.Gs5, t15 + 1 * E, E * 0.95, 0.24);
      playBrassNote(F.A5, t15 + 2 * E, E * 0.95, 0.24);
      playBrassNote(F.B5, t15 + 3 * E, E * 1.5, 0.26);
      playBass(F.B2, t15 + 0, M, 0.35);
      playDrumHit(t15 + 0, true);
      playDrumHit(t15 + 2 * E, false);

      // Compasso 16: Acorde Em + colcheias: E5, Fs5, G5, A5
      const t16 = tSecB + 3 * M;
      playChord(CHORD_EM, t16 + 0, M, 0.18);
      playBrassNote(F.E5, t16 + 0 * E, E * 0.95, 0.24);
      playBrassNote(F.Fs5, t16 + 1 * E, E * 0.95, 0.24);
      playBrassNote(F.G5, t16 + 2 * E, E * 0.95, 0.24);
      playBrassNote(F.A5, t16 + 3 * E, E * 1.5, 0.26);
      playBass(F.E2, t16 + 0, M, 0.35);
      playDrumHit(t16 + 0, true);
      playDrumHit(t16 + 2 * E, false);

      // Compasso 17: Acorde A7 + colcheias descendo: A5, G5, Fs5, E5
      const t17 = tSecB + 4 * M;
      playChord(CHORD_A7, t17 + 0, M, 0.18);
      playBrassNote(F.A5, t17 + 0 * E, E * 0.95, 0.24);
      playBrassNote(F.G5, t17 + 1 * E, E * 0.95, 0.24);
      playBrassNote(F.Fs5, t17 + 2 * E, E * 0.95, 0.24);
      playBrassNote(F.E5, t17 + 3 * E, E * 1.5, 0.26);
      playBass(F.A2, t17 + 0, M, 0.35);
      playDrumHit(t17 + 0, true);
      playDrumHit(t17 + 2 * E, false);

      // Compasso 18 & 19: Notas repetidas Fs5 empolgantes crescendo para o Refrão
      const t18 = tSecB + 5 * M;
      playBrassNote(F.Fs5, t18 + 0 * E, E * 0.9, 0.25);
      playBrassNote(F.Fs5, t18 + 1 * E, E * 0.9, 0.25);
      playBrassNote(F.Fs5, t18 + 2 * E, E * 0.9, 0.26);
      playBrassNote(F.Fs5, t18 + 3 * E, E * 0.9, 0.28);
      playChord(CHORD_D, t18 + 0, M, 0.22);
      playBass(F.D2, t18 + 0, M, 0.35);
      playDrumHit(t18 + 0, true);
      playDrumHit(t18 + 2 * E, false);

      // =======================================================================
      // 4. SEÇÃO [C] (O REFRÃO APOTEÓTICO - COMPASSOS 20 A 29)
      // =======================================================================
      const tSecC = t18 + 1 * M;

      // Compasso 20: D sustenido com força total
      playChord(CHORD_D, tSecC + 0, M * 0.95, 0.28);
      playBrassNote(F.D5, tSecC + 0, M * 0.95, 0.30);
      playBass(F.D2, tSecC + 0, M, 0.38);
      playDrumHit(tSecC + 0, true);
      playDrumHit(tSecC + 2 * E, false);

      // Compasso 21: Acorde Em7/G + as 4 colcheias lendárias: E5, D5, Cs5, B4
      const t21 = tSecC + 1 * M;
      playChord(CHORD_EM7, t21 + 0, M, 0.22);
      playBrassNote(F.E5, t21 + 0 * E, E * 0.95, 0.28);
      playBrassNote(F.D5, t21 + 1 * E, E * 0.95, 0.28);
      playBrassNote(F.Cs5, t21 + 2 * E, E * 0.95, 0.28);
      playBrassNote(F.B4, t21 + 3 * E, E * 1.6, 0.30);
      playBass(F.G2, t21 + 0, M, 0.35);
      playDrumHit(t21 + 0, true);
      playDrumHit(t21 + 2 * E, false);

      // Compasso 22: Acorde D
      const t22 = tSecC + 2 * M;
      playChord(CHORD_D, t22 + 0, M * 0.9, 0.26);
      playBrassNote(F.A4, t22 + 0, M * 0.8, 0.26);
      playBass(F.Fs2, t22 + 0, M, 0.35);
      playDrumHit(t22 + 0, true);
      playDrumHit(t22 + 2 * E, false);

      // Compasso 23: Acorde A7
      const t23 = tSecC + 3 * M;
      playChord(CHORD_A7, t23 + 0, M * 0.9, 0.24);
      playBrassNote(F.G4, t23 + 0, M * 0.8, 0.26);
      playBass(F.A2, t23 + 0, M, 0.35);
      playDrumHit(t23 + 0, true);
      playDrumHit(t23 + 2 * E, false);

      // Compasso 24: Melodia Fs5, Fs5, E5, E5, D5!
      const t24 = tSecC + 4 * M;
      playBrassNote(F.Fs5, t24 + 0 * E, E * 0.9, 0.28);
      playBrassNote(F.Fs5, t24 + 1 * E, E * 0.9, 0.28);
      playBrassNote(F.E5, t24 + 2 * E, E * 0.9, 0.28);
      playBrassNote(F.E5, t24 + 3 * E, E * 0.9, 0.28);
      playBrassNote(F.D5, t24 + 4 * E, E * 2.2, 0.32);
      playChord(CHORD_D, t24 + 0, M * 0.9, 0.24);
      playBass(F.D2, t24 + 0, M, 0.36);
      playDrumHit(t24 + 0, true);
      playDrumHit(t24 + 2 * E, false);

      // Compasso 25: Acorde Gm [G4, Bb4, D5] com o acorde bemol emotivo da partitura
      const t25 = tSecC + 5 * M;
      playChord(CHORD_GM, t25 + 0, M * 0.9, 0.24);
      playBrassNote(F.Bb4, t25 + 0, M * 0.8, 0.28);
      playBass(F.Bb2, t25 + 0, M, 0.36);
      playDrumHit(t25 + 0, true);
      playDrumHit(t25 + 2 * E, false);

      // Compasso 26: Resolução D e A7
      const t26 = tSecC + 6 * M;
      playChord(CHORD_D, t26 + 0, B * 2, 0.25);
      playBrassNote(F.A4, t26 + 0, B * 2, 0.27);
      playBass(F.D2, t26 + 0, B * 2, 0.35);
      playChord(CHORD_A7, t26 + B * 2, B * 2, 0.25);
      playBrassNote(F.Cs5, t26 + B * 2, B * 2, 0.27);
      playBass(F.A2, t26 + B * 2, B * 2, 0.35);
      playDrumHit(t26 + 0, true);
      playDrumHit(t26 + B * 2, false);

      // =======================================================================
      // 5. CODA (COMPASSOS 30 EM DIANTE - O ENCERRAMENTO COM FADE DA BANDEIRADA)
      // =======================================================================
      const tCoda = t26 + 1 * M;

      // Compasso 30: Ataques sincopados marcados na Coda
      playChord(CHORD_EM7, tCoda + 0 * E, E * 0.9, 0.26);
      playBrassNote(F.E5, tCoda + 0 * E, E * 0.85, 0.28);
      playChord(CHORD_D, tCoda + 1.5 * E, E * 0.9, 0.28);
      playBrassNote(F.D5, tCoda + 1.5 * E, E * 0.85, 0.30);
      playBass(F.D2, tCoda + 0, B * 2, 0.38);
      playDrumHit(tCoda + 0, true);
      playDrumHit(tCoda + 1.5 * E, false);

      // Compasso 31: Subida triunfante
      const t31 = tCoda + 1 * M;
      playChord([F.Gs4, F.B4, F.E5], t31 + 0 * E, E * 0.9, 0.26);
      playChord([F.A4, F.Cs5, F.Fs5], t31 + 1.5 * E, E * 1.5, 0.30);
      playBrassNote(F.Fs5, t31 + 1.5 * E, E * 1.5, 0.32);
      playBass(F.A2, t31 + 0, B * 2, 0.38);
      playDrumHit(t31 + 0, true);
      playDrumHit(t31 + 1.5 * E, false);

      // Compasso 32: Repet. Ad Lib / Gran Finale com Ostinato de Baixo e Acorde Glorioso de Ré Maior
      const tFin = t31 + 1 * M;
      const bigChordDuration = 3.2;
      const chordDGrand = [F.D3, F.A3, F.D4, F.Fs4, F.A4, F.D5, F.Fs5, F.A5, F.D6];

      chordDGrand.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();

        osc.type = idx % 2 === 0 ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(freq, startTime + tFin);

        const vol = idx === chordDGrand.length - 1 ? 0.26 : 0.08;
        noteGain.gain.setValueAtTime(0, startTime + tFin);
        noteGain.gain.linearRampToValueAtTime(vol, startTime + tFin + 0.04);
        noteGain.gain.setValueAtTime(vol * 0.92, startTime + tFin + 1.5);
        noteGain.gain.exponentialRampToValueAtTime(0.001, startTime + tFin + bigChordDuration);

        osc.connect(noteGain);
        noteGain.connect(masterGain);

        osc.start(startTime + tFin);
        osc.stop(startTime + tFin + bigChordDuration + 0.05);
      });

      // Baixo potente na tônica Ré e percussão celebrativa
      playBass(F.D2, tFin, bigChordDuration, 0.40);
      playDrumHit(tFin, true);
      playDrumHit(tFin + 0.3, false);
      playDrumHit(tFin + 0.6, true);

      // Duração total do arranjo baseado na partitura
      const totalDurationMs = Math.round((tFin + bigChordDuration + 0.4) * 1000);
      const endTimer = window.setTimeout(() => {
        this.isSennaActive = false;
        if (this.sennaOnEndCallback) {
          const cb = this.sennaOnEndCallback;
          this.sennaOnEndCallback = null;
          cb();
        }
      }, totalDurationMs);

      this.sennaTimeouts.push(endTimer);
    } catch {
      this.isSennaActive = false;
    }
  }
}

export const sound = new SoundEngine();

