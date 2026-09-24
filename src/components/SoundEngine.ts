/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private humOsc: OscillatorNode | null = null;
  private humGain: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private volume: number = 0.2;
  private humEnabled: boolean = false;

  private init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.ctx.destination);
    } catch (e) {
      console.warn('AudioContext not supported in this environment', e);
    }
  }

  setVolume(vol: number) {
    this.volume = vol;
    if (this.masterGain) {
      this.masterGain.gain.value = vol;
    }
  }

  playClick() {
    this.init();
    if (!this.ctx || this.ctx.state === 'suspended') return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);

    osc.connect(gain);
    if (this.masterGain) {
      gain.connect(this.masterGain);
    }

    osc.start();
    osc.stop(this.ctx.currentTime + 0.09);
  }

  playSwitch() {
    this.init();
    if (!this.ctx || this.ctx.state === 'suspended') return;

    // Simulate mechanical metallic click (two closely spaced clicks)
    const t = this.ctx.currentTime;
    
    // Low pop
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(180, t);
    gain1.gain.setValueAtTime(0.4, t);
    gain1.gain.exponentialRampToValueAtTime(0.01, t + 0.04);
    osc1.connect(gain1);
    if (this.masterGain) gain1.connect(this.masterGain);
    osc1.start(t);
    osc1.stop(t + 0.05);

    // High metal snap
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(2400, t + 0.005);
    osc2.frequency.exponentialRampToValueAtTime(400, t + 0.025);
    gain2.gain.setValueAtTime(0.15, t + 0.005);
    gain2.gain.exponentialRampToValueAtTime(0.01, t + 0.025);
    osc2.connect(gain2);
    if (this.masterGain) gain2.connect(this.masterGain);
    osc2.start(t + 0.005);
    osc2.stop(t + 0.03);
  }

  playSweep(up: boolean = true) {
    this.init();
    if (!this.ctx || this.ctx.state === 'suspended') return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    const startFreq = up ? 80 : 800;
    const endFreq = up ? 600 : 40;
    const duration = 0.45;

    osc.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(endFreq, this.ctx.currentTime + duration);

    // Filter to make it smoother and more retro-future
    const lowpass = this.ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(1200, this.ctx.currentTime);
    lowpass.Q.setValueAtTime(5, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    osc.connect(lowpass);
    lowpass.connect(gain);
    if (this.masterGain) {
      gain.connect(this.masterGain);
    }

    osc.start();
    osc.stop(this.ctx.currentTime + duration + 0.05);
  }

  playBeep(freq: number, duration: number = 0.1) {
    this.init();
    if (!this.ctx || this.ctx.state === 'suspended') return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    osc.connect(gain);
    if (this.masterGain) {
      gain.connect(this.masterGain);
    }

    osc.start();
    osc.stop(this.ctx.currentTime + duration + 0.02);
  }

  playUndo() {
    this.init();
    if (!this.ctx || this.ctx.state === 'suspended') return;

    // Fast downward tape-rewind chirp
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(700, t);
    osc.frequency.exponentialRampToValueAtTime(220, t + 0.12);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    if (this.masterGain) gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.13);
  }

  playRedo() {
    this.init();
    if (!this.ctx || this.ctx.state === 'suspended') return;

    // Upward forward chirp
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260, t);
    osc.frequency.exponentialRampToValueAtTime(820, t + 0.11);

    gain.gain.setValueAtTime(0.22, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);

    osc.connect(gain);
    if (this.masterGain) gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.12);
  }

  playClear() {
    this.init();
    if (!this.ctx || this.ctx.state === 'suspended') return;

    // Retro CRT terminal degauss purge sweep
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.35);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, t);
    filter.frequency.exponentialRampToValueAtTime(100, t + 0.35);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.connect(filter);
    filter.connect(gain);
    if (this.masterGain) gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.36);
  }

  toggleAmbientHum(enable: boolean) {
    this.init();
    if (!this.ctx) return;

    if (enable) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      if (this.humOsc) return; // already hums

      const t = this.ctx.currentTime;
      
      // Main low generator (sub bass hum)
      this.humOsc = this.ctx.createOscillator();
      this.humOsc.type = 'sine';
      this.humOsc.frequency.setValueAtTime(55, t); // A1 note

      // Auxiliary generator (gives that rotating engine beat)
      const subOsc = this.ctx.createOscillator();
      subOsc.type = 'triangle';
      subOsc.frequency.setValueAtTime(110.4, t); // Slightly detuned

      this.filter = this.ctx.createBiquadFilter();
      this.filter.type = 'lowpass';
      this.filter.frequency.setValueAtTime(150, t);

      this.humGain = this.ctx.createGain();
      this.humGain.gain.setValueAtTime(0.08, t);

      // Low frequency LFO to sweep filter subtly
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.value = 0.25; // 0.25 Hz sweep
      lfoGain.gain.value = 40; // modulate filter by 40 Hz

      lfo.connect(lfoGain);
      if (this.filter) {
        lfoGain.connect(this.filter.frequency);
      }

      this.humOsc.connect(this.filter);
      subOsc.connect(this.filter);
      this.filter.connect(this.humGain);
      if (this.masterGain) {
        this.humGain.connect(this.masterGain);
      }

      lfo.start();
      this.humOsc.start();
      subOsc.start();

      // Store nodes to stop later
      (this.humOsc as any)._subOsc = subOsc;
      (this.humOsc as any)._lfo = lfo;
      this.humEnabled = true;
    } else {
      if (this.humOsc) {
        try {
          this.humOsc.stop();
          (this.humOsc as any)._subOsc.stop();
          (this.humOsc as any)._lfo.stop();
        } catch (e) {}
        this.humOsc = null;
        this.humGain = null;
        this.filter = null;
      }
      this.humEnabled = false;
    }
  }

  playPlacement() {
    this.playSweep(true);
  }

  playDenied() {
    this.init();
    if (!this.ctx || this.ctx.state === 'suspended') return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.setValueAtTime(110, t + 0.08);
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);
    osc.connect(gain);
    if (this.masterGain) gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.2);
  }

  isHumEnabled() {
    return this.humEnabled;
  }
}

export const soundEngine = new SoundEngine();
