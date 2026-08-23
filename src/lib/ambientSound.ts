/**
 * Web Audio API Ambient Sound Synthesizer
 * Generates realistic, soothing ambient soundscapes directly in the browser
 * with zero external assets needed.
 */

export type AmbientSoundType = 'rain' | 'fireplace' | 'vinyl' | 'forest' | 'waves';

class AmbientSoundEngine {
  private ctx: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private activeNodes: (AudioNode | number)[] = [];
  private currentSound: AmbientSoundType | null = null;
  private isPlaying = false;
  private volume = 0.5;

  private initContext() {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtxClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public getCurrentSound(): AmbientSoundType | null {
    return this.isPlaying ? this.currentSound : null;
  }

  public isSoundPlaying(): boolean {
    return this.isPlaying;
  }

  public stop() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    this.currentSound = null;

    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
      setTimeout(() => {
        this.cleanupNodes();
      }, 150);
    } else {
      this.cleanupNodes();
    }
  }

  private cleanupNodes() {
    this.activeNodes.forEach((node) => {
      if (typeof node === 'number') {
        window.clearInterval(node);
      } else {
        try {
          if ('stop' in node && typeof (node as any).stop === 'function') {
            (node as any).stop();
          }
          node.disconnect();
        } catch {
          // ignore disconnect errors
        }
      }
    });
    this.activeNodes = [];
  }

  public play(type: AmbientSoundType) {
    this.initContext();
    if (!this.ctx) return;

    if (this.isPlaying) {
      this.stop();
    }

    this.isPlaying = true;
    this.currentSound = type;

    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.setValueAtTime(0, this.ctx.currentTime);
    this.gainNode.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.2);
    this.gainNode.connect(this.ctx.destination);

    switch (type) {
      case 'rain':
        this.createRainSound();
        break;
      case 'fireplace':
        this.createFireplaceSound();
        break;
      case 'vinyl':
        this.createVinylSound();
        break;
      case 'forest':
        this.createForestSound();
        break;
      case 'waves':
        this.createWavesSound();
        break;
    }
  }

  private createNoiseBuffer(seconds = 5): AudioBuffer {
    if (!this.ctx) throw new Error('AudioContext missing');
    const bufferSize = this.ctx.sampleRate * seconds;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  // Rain: Filtered pink-ish noise with low-pass and subtle high-pass rumble
  private createRainSound() {
    if (!this.ctx || !this.gainNode) return;

    const noiseBuffer = this.createNoiseBuffer(5);
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const filter1 = this.ctx.createBiquadFilter();
    filter1.type = 'lowpass';
    filter1.frequency.value = 1200;

    const filter2 = this.ctx.createBiquadFilter();
    filter2.type = 'highpass';
    filter2.frequency.value = 350;

    noiseSource.connect(filter1);
    filter1.connect(filter2);
    filter2.connect(this.gainNode);

    noiseSource.start();
    this.activeNodes.push(noiseSource, filter1, filter2);
  }

  // Fireplace: Deep rumble + random popping clicks
  private createFireplaceSound() {
    if (!this.ctx || !this.gainNode) return;

    const noiseBuffer = this.createNoiseBuffer(5);
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const lowpass = this.ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 400;

    noiseSource.connect(lowpass);
    lowpass.connect(this.gainNode);
    noiseSource.start();
    this.activeNodes.push(noiseSource, lowpass);

    // Random crackle pulses
    const crackleInterval = window.setInterval(() => {
      if (!this.ctx || !this.gainNode || !this.isPlaying) return;
      if (Math.random() > 0.4) {
        const osc = this.ctx.createOscillator();
        const popGain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(100 + Math.random() * 800, this.ctx.currentTime);
        popGain.gain.setValueAtTime(0.08 * (Math.random() * 0.5 + 0.5), this.ctx.currentTime);
        popGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
        osc.connect(popGain);
        popGain.connect(this.gainNode);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.05);
      }
    }, 90);

    this.activeNodes.push(crackleInterval);
  }

  // Vinyl: Lo-fi warmth + gentle rhythmic hiss & crackles
  private createVinylSound() {
    if (!this.ctx || !this.gainNode) return;

    const noiseBuffer = this.createNoiseBuffer(3);
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const bandpass = this.ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 2200;
    bandpass.Q.value = 3.0;

    const hissGain = this.ctx.createGain();
    hissGain.gain.value = 0.25;

    noiseSource.connect(bandpass);
    bandpass.connect(hissGain);
    hissGain.connect(this.gainNode);
    noiseSource.start();
    this.activeNodes.push(noiseSource, bandpass, hissGain);

    // Gentle sub drone
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 55; // Warm A1 hum
    const humGain = this.ctx.createGain();
    humGain.gain.value = 0.08;
    osc.connect(humGain);
    humGain.connect(this.gainNode);
    osc.start();
    this.activeNodes.push(osc, humGain);
  }

  // Forest: Subtle breezy noise + occasional gentle tone
  private createForestSound() {
    if (!this.ctx || !this.gainNode) return;

    const noiseBuffer = this.createNoiseBuffer(6);
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 800;
    filter.Q.value = 1.2;

    noiseSource.connect(filter);
    filter.connect(this.gainNode);
    noiseSource.start();
    this.activeNodes.push(noiseSource, filter);

    // Gentle bird-like whistle bursts
    const chirpInterval = window.setInterval(() => {
      if (!this.ctx || !this.gainNode || !this.isPlaying) return;
      if (Math.random() > 0.65) {
        const osc = this.ctx.createOscillator();
        const chirpGain = this.ctx.createGain();
        osc.type = 'sine';
        const startFreq = 1800 + Math.random() * 800;
        osc.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(startFreq + 600, this.ctx.currentTime + 0.12);
        chirpGain.gain.setValueAtTime(0.04, this.ctx.currentTime);
        chirpGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.15);
        osc.connect(chirpGain);
        chirpGain.connect(this.gainNode);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.16);
      }
    }, 1200);

    this.activeNodes.push(chirpInterval);
  }

  // Ocean Waves: Rhythmic surging lowpass noise
  private createWavesSound() {
    if (!this.ctx || !this.gainNode) return;

    const noiseBuffer = this.createNoiseBuffer(8);
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;

    // LFO for wave swelling
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.12; // 8-second wave cycle
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 350;

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    noiseSource.connect(filter);
    filter.connect(this.gainNode);

    noiseSource.start();
    lfo.start();
    this.activeNodes.push(noiseSource, filter, lfo, lfoGain);
  }
}

export const ambientSound = new AmbientSoundEngine();
