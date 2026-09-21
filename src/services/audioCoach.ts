class AudioCoachService {
  private enabled = true;
  private volume = 0.85;
  private audioCtx: AudioContext | null = null;
  private lastSpokenText = '';
  private lastSpokenTime = 0;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private initAudioContext() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  /**
   * Speaks a coaching cue using Web Speech API
   */
  public speak(text: string, force = false) {
    if (!this.enabled || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    const now = Date.now();
    // Prevent repeating identical cue within 3 seconds
    if (!force && text === this.lastSpokenText && now - this.lastSpokenTime < 3000) {
      return;
    }

    this.lastSpokenText = text;
    this.lastSpokenTime = now;

    try {
      window.speechSynthesis.cancel(); // Cancel any lingering utterance
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05; // Slightly athletic cadence
      utterance.pitch = 1.0;
      utterance.volume = this.volume;

      // Select natural voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(
        (v) => (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Alex')) && v.lang.startsWith('en')
      );
      if (preferred) {
        utterance.voice = preferred;
      }

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('SpeechSynthesis error:', e);
    }
  }

  /**
   * Plays a high-tech synthetic tone for rep completions or countdowns
   */
  public playTone(frequency = 600, durationSec = 0.12, type: OscillatorType = 'sine') {
    if (!this.enabled) return;
    try {
      this.initAudioContext();
      if (!this.audioCtx) return;
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, this.audioCtx.currentTime);

      gain.gain.setValueAtTime(this.volume * 0.4, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + durationSec);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + durationSec);
    } catch (e) {
      // Audio context might be restricted before user gesture
    }
  }

  public playRepCompleteChime() {
    this.playTone(523.25, 0.08, 'sine'); // C5
    setTimeout(() => this.playTone(659.25, 0.15, 'sine'), 80); // E5
  }

  public playWarningTone() {
    this.playTone(320, 0.2, 'sawtooth');
  }
}

export const AudioCoach = new AudioCoachService();
