class SoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = localStorage.getItem('nexus_sound') !== 'off';
  }

  getContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return this.ctx;
  }

  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem('nexus_sound', this.enabled ? 'on' : 'off');
    return this.enabled;
  }

  play(frequency, duration, type = 'sine', volume = 0.15) {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = frequency;
      gain.gain.value = volume;
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {}
  }

  habitComplete() {
    this.play(523.25, 0.1, 'sine', 0.12);
    setTimeout(() => this.play(659.25, 0.1, 'sine', 0.12), 80);
    setTimeout(() => this.play(783.99, 0.2, 'sine', 0.12), 160);
  }

  levelUp() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((f, i) => setTimeout(() => this.play(f, 0.3, 'sine', 0.15), i * 120));
  }

  timerComplete() {
    for (let i = 0; i < 3; i++) {
      setTimeout(() => this.play(880, 0.15, 'square', 0.1), i * 200);
    }
  }

  achievement() {
    this.play(784, 0.15, 'sine', 0.12);
    setTimeout(() => this.play(988, 0.15, 'sine', 0.12), 100);
    setTimeout(() => this.play(1175, 0.25, 'sine', 0.15), 200);
  }

  missionComplete() {
    this.play(440, 0.1, 'triangle', 0.1);
    setTimeout(() => this.play(554, 0.1, 'triangle', 0.1), 100);
    setTimeout(() => this.play(659, 0.3, 'triangle', 0.12), 200);
  }

  notification() {
    this.play(600, 0.08, 'sine', 0.08);
    setTimeout(() => this.play(800, 0.08, 'sine', 0.08), 120);
  }
}

export const soundEngine = new SoundEngine();
export default soundEngine;