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
  private volume: number = 0.12;
  private enabled: boolean = false;
  private humEnabled: boolean = false;

  private init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.enabled ? this.volume : 0;
      this.masterGain.connect(this.ctx.destination);
    } catch (e) {
      console.warn('AudioContext not supported in this environment', e);
    }
  }

  setVolume(vol: number) {
    this.volume = Math.min(1, Math.max(0, vol));
    if (this.masterGain) {
      this.masterGain.gain.value = this.enabled ? this.volume : 0;
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (enabled) this.init();
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.setValueAtTime(enabled ? this.volume : 0, this.ctx.currentTime);
    }
    if (enabled && this.ctx?.state === 'suspended') void this.ctx.resume();
    this.toggleAmbientHum(enabled);
  }

  isEnabled() {
    return this.enabled;
  }

  playClick() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(720, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(420, this.ctx.currentTime + 0.055);

    gain.gain.setValueAtTime(0.16, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.055);

    osc.connect(gain);
    if (this.masterGain) {
      gain.connect(this.masterGain);
    }

    osc.start();
    osc.stop(this.ctx.currentTime + 0.065);
  }

  playSwitch() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    // Gentle two-tone confirmation rather than a sharp metallic snap.
    const t = this.ctx.currentTime;
    
    // Low note
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(330, t);
    gain1.gain.setValueAtTime(0.13, t);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.075);
    osc1.connect(gain1);
    if (this.masterGain) gain1.connect(this.masterGain);
    osc1.start(t);
    osc1.stop(t + 0.085);

    // Higher answering note
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(495, t + 0.045);
    gain2.gain.setValueAtTime(0.1, t + 0.045);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    osc2.connect(gain2);
    if (this.masterGain) gain2.connect(this.masterGain);
    osc2.start(t + 0.045);
    osc2.stop(t + 0.13);
  }

  playSweep(up: boolean = true) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    const startFreq = up ? 260 : 520;
    const endFreq = up ? 520 : 260;
    const duration = 0.18;

    osc.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(endFreq, this.ctx.currentTime + duration);

    // Keep the transition warm and brief.
    const lowpass = this.ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(900, this.ctx.currentTime);
    lowpass.Q.setValueAtTime(0.7, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    osc.connect(lowpass);
    lowpass.connect(gain);
    if (this.masterGain) {
      gain.connect(this.masterGain);
    }

    osc.start();
    osc.stop(this.ctx.currentTime + duration + 0.01);
  }

  playBeep(freq: number, duration: number = 0.1) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    osc.connect(gain);
    if (this.masterGain) {
      gain.connect(this.masterGain);
    }

    osc.start();
    osc.stop(this.ctx.currentTime + duration + 0.02);
  }

  playUndo() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    // Soft downward cue.
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, t);
    osc.frequency.exponentialRampToValueAtTime(320, t + 0.13);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.13);

    osc.connect(gain);
    if (this.masterGain) gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.14);
  }

  playRedo() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    // Soft upward cue.
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(520, t + 0.13);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.13);

    osc.connect(gain);
    if (this.masterGain) gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.14);
  }

  playClear() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    // Low, brief clear cue without the old abrasive sawtooth sweep.
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(340, t);
    osc.frequency.exponentialRampToValueAtTime(130, t + 0.24);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(700, t);
    filter.frequency.exponentialRampToValueAtTime(300, t + 0.24);

    gain.gain.setValueAtTime(0.16, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);

    osc.connect(filter);
    filter.connect(gain);
    if (this.masterGain) gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.25);
  }

  toggleAmbientHum(enable: boolean) {
    if (!enable && !this.ctx) return;
    if (enable && !this.enabled) return;
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
      this.humGain.gain.setValueAtTime(0.035, t);

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
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.setValueAtTime(165, t + 0.08);
    gain.gain.setValueAtTime(0.13, t);
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
