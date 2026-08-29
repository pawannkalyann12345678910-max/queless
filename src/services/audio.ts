/**
 * Queless Audio & Speech Synthesis Engine
 * Hardware-accelerated Web Audio chime + SpeechSynthesis voice announcer
 */

class AudioEngine {
  private audioCtx: AudioContext | null = null;

  private getContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * Plays a distinct harmonic polyphonic counter chime (Airport/Hospital style)
   */
  playChime(): void {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      // D5 (587.33 Hz) and A5 (880 Hz) harmonic interval
      const notes = [587.33, 880];

      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + index * 0.22);

        // Envelope
        gain.gain.setValueAtTime(0.01, now + index * 0.22);
        gain.gain.linearRampToValueAtTime(0.25, now + index * 0.22 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.22 + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + index * 0.22);
        osc.stop(now + index * 0.22 + 1.2);
      });
    } catch (err) {
      console.warn('Audio chime notice:', err);
    }
  }

  /**
   * 3-pulse urgent proximity attention alarm
   */
  playProximityAlarm(): void {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const notes = [880, 1174.66, 1479.98];

      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + index * 0.14);

        gain.gain.setValueAtTime(0, now + index * 0.14);
        gain.gain.linearRampToValueAtTime(0.2, now + index * 0.14 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.14 + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + index * 0.14);
        osc.stop(now + index * 0.14 + 0.4);
      });
    } catch (err) {
      console.warn('Proximity alarm audio notice:', err);
    }
  }

  /**
   * Plays voice announcement: "Calling Token DOC-104 to Counter 1"
   */
  announceToken(tokenNumber: string, counterLabel: string): void {
    this.playChime();

    if ('speechSynthesis' in window) {
      setTimeout(() => {
        // Format token number to read letters & digits clearly
        const formattedToken = tokenNumber.split('').join(' ');
        const text = `Now calling Token ${formattedToken}, please proceed to ${counterLabel || 'the counter'}.`;

        window.speechSynthesis.cancel(); // Clear any pending speech
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.92;
        utterance.pitch = 1.05;
        utterance.volume = 1.0;

        // Try selecting English voice if available
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha')));
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }

        window.speechSynthesis.speak(utterance);
      }, 550);
    }
  }
}

export const audioService = new AudioEngine();
